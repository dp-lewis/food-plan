import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

// These tests run against the real Supabase database.
// They require NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
// and SUPABASE_SERVICE_ROLE_KEY environment variables.
//
// Run with: npm run test:rls

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const canRun = supabaseUrl && anonKey && serviceRoleKey;

// Test user UUID (deterministic for cleanup)
const TEST_USER_ID = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeee01';
const TEST_PREFIX = '__rls_test_';

describe.skipIf(!canRun)('RLS policies (integration)', () => {
  let adminClient: SupabaseClient<Database>;
  let anonClient: SupabaseClient<Database>;

  beforeAll(async () => {
    adminClient = createClient<Database>(supabaseUrl!, serviceRoleKey!, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    anonClient = createClient<Database>(supabaseUrl!, anonKey!, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Clean up any leftover data from a previous failed run
    await adminClient.from('custom_shopping_items').delete().like('id', `${TEST_PREFIX}%`);
    await adminClient.from('checked_items').delete().like('item_id', `${TEST_PREFIX}%`);
    await adminClient.from('meals').delete().like('id', `${TEST_PREFIX}%`);
    await adminClient.from('meal_plans').delete().like('id', `${TEST_PREFIX}%`);
    await adminClient.from('recipes').delete().like('id', `${TEST_PREFIX}%`);
    try {
      await adminClient.auth.admin.deleteUser(TEST_USER_ID);
    } catch {
      // User may not exist from a previous run - that's fine
    }

    // Create a test user via admin API
    const { error: createUserError } = await adminClient.auth.admin.createUser({
      email: `${TEST_PREFIX}user@test.com`,
      password: 'test-password-123',
      user_metadata: {},
      email_confirm: true,
      id: TEST_USER_ID,
    });
    if (createUserError) throw new Error(`Failed to create test user: ${createUserError.message}`);

    // Seed test data (service role bypasses RLS)
    // Built-in recipe (no user_id)
    const { error: builtinErr } = await adminClient.from('recipes').insert({
      id: `${TEST_PREFIX}builtin-recipe`,
      title: 'RLS Test Built-in',
      meal_type: 'dinner',
      prep_time: 10,
      cook_time: 20,
      servings: 4,
      difficulty: 'easy',
      estimated_cost: 'low',
      ingredients: [],
      instructions: ['Step 1'],
      user_id: null,
    });
    if (builtinErr) throw new Error(`Failed to insert built-in recipe: ${builtinErr.message}`);

    // User's recipe
    const { error: userRecipeErr } = await adminClient.from('recipes').insert({
      id: `${TEST_PREFIX}user-recipe`,
      title: 'RLS Test User Recipe',
      meal_type: 'lunch',
      prep_time: 5,
      cook_time: 15,
      servings: 2,
      difficulty: 'easy',
      estimated_cost: 'low',
      ingredients: [],
      instructions: ['Step 1'],
      user_id: TEST_USER_ID,
    });
    if (userRecipeErr) throw new Error(`Failed to insert user recipe: ${userRecipeErr.message}`);

    // User's meal plan
    const { error: planErr } = await adminClient.from('meal_plans').insert({
      id: `${TEST_PREFIX}plan`,
      user_id: TEST_USER_ID,
      preferences: { startDay: 5 },
    });
    if (planErr) throw new Error(`Failed to insert meal plan: ${planErr.message}`);

    // Meal in the plan
    const { error: mealErr } = await adminClient.from('meals').insert({
      id: `${TEST_PREFIX}meal`,
      meal_plan_id: `${TEST_PREFIX}plan`,
      day_index: 0,
      meal_type: 'dinner',
      recipe_id: `${TEST_PREFIX}builtin-recipe`,
      servings: 4,
    });
    if (mealErr) throw new Error(`Failed to insert meal: ${mealErr.message}`);

    // Checked item
    const { error: checkedErr } = await adminClient.from('checked_items').insert({
      meal_plan_id: `${TEST_PREFIX}plan`,
      item_id: `${TEST_PREFIX}checked`,
      checked_by: TEST_USER_ID,
    });
    if (checkedErr) throw new Error(`Failed to insert checked item: ${checkedErr.message}`);

    // Custom shopping item
    const { error: customErr } = await adminClient.from('custom_shopping_items').insert({
      id: `${TEST_PREFIX}custom`,
      meal_plan_id: `${TEST_PREFIX}plan`,
      ingredient: 'Test Item',
      quantity: 1,
      unit: 'each',
      category: 'uncategorized',
    });
    if (customErr) throw new Error(`Failed to insert custom shopping item: ${customErr.message}`);
  });

  afterAll(async () => {
    // Clean up in reverse dependency order (service role bypasses RLS)
    await adminClient.from('custom_shopping_items').delete().like('id', `${TEST_PREFIX}%`);
    await adminClient.from('checked_items').delete().like('item_id', `${TEST_PREFIX}%`);
    await adminClient.from('meals').delete().like('id', `${TEST_PREFIX}%`);
    await adminClient.from('meal_plans').delete().like('id', `${TEST_PREFIX}%`);
    await adminClient.from('recipes').delete().like('id', `${TEST_PREFIX}%`);
    await adminClient.auth.admin.deleteUser(TEST_USER_ID);
  });

  // -------------------------------------------------------------------------
  // Verify admin can see everything (sanity check)
  // -------------------------------------------------------------------------

  describe('service role (admin) - sanity checks', () => {
    it('can read test built-in recipe', async () => {
      const { data } = await adminClient
        .from('recipes')
        .select('id')
        .eq('id', `${TEST_PREFIX}builtin-recipe`)
        .single();
      expect(data?.id).toBe(`${TEST_PREFIX}builtin-recipe`);
    });

    it('can read test user recipe', async () => {
      const { data } = await adminClient
        .from('recipes')
        .select('id')
        .eq('id', `${TEST_PREFIX}user-recipe`)
        .single();
      expect(data?.id).toBe(`${TEST_PREFIX}user-recipe`);
    });

    it('can read test meal plan', async () => {
      const { data } = await adminClient
        .from('meal_plans')
        .select('id')
        .eq('id', `${TEST_PREFIX}plan`)
        .single();
      expect(data?.id).toBe(`${TEST_PREFIX}plan`);
    });
  });

  // -------------------------------------------------------------------------
  // Anonymous client - the critical security boundary
  // -------------------------------------------------------------------------

  describe('anonymous client', () => {
    it('can read built-in recipes', async () => {
      const { data, error } = await anonClient
        .from('recipes')
        .select('id')
        .eq('id', `${TEST_PREFIX}builtin-recipe`);
      expect(error).toBeNull();
      expect(data).toHaveLength(1);
    });

    it('cannot read user recipes', async () => {
      const { data, error } = await anonClient
        .from('recipes')
        .select('id')
        .eq('id', `${TEST_PREFIX}user-recipe`);
      expect(error).toBeNull();
      expect(data).toHaveLength(0);
    });

    it('cannot read meal plans', async () => {
      const { data, error } = await anonClient
        .from('meal_plans')
        .select('id')
        .eq('id', `${TEST_PREFIX}plan`);
      expect(error).toBeNull();
      expect(data).toHaveLength(0);
    });

    it('cannot read meals', async () => {
      const { data, error } = await anonClient
        .from('meals')
        .select('id')
        .eq('id', `${TEST_PREFIX}meal`);
      expect(error).toBeNull();
      expect(data).toHaveLength(0);
    });

    it('cannot read checked items', async () => {
      const { data, error } = await anonClient
        .from('checked_items')
        .select('item_id')
        .eq('item_id', `${TEST_PREFIX}checked`);
      expect(error).toBeNull();
      expect(data).toHaveLength(0);
    });

    it('cannot read custom shopping items', async () => {
      const { data, error } = await anonClient
        .from('custom_shopping_items')
        .select('id')
        .eq('id', `${TEST_PREFIX}custom`);
      expect(error).toBeNull();
      expect(data).toHaveLength(0);
    });

    it('cannot insert into meal_plans', async () => {
      const { error } = await anonClient
        .from('meal_plans')
        .insert({
          id: `${TEST_PREFIX}anon-plan`,
          user_id: TEST_USER_ID,
          preferences: {},
        });
      expect(error).not.toBeNull();
    });

    it('cannot insert into recipes with a user_id', async () => {
      const { error } = await anonClient
        .from('recipes')
        .insert({
          id: `${TEST_PREFIX}anon-recipe`,
          title: 'Anon',
          meal_type: 'dinner',
          prep_time: 1,
          cook_time: 1,
          servings: 1,
          difficulty: 'easy',
          estimated_cost: 'low',
          ingredients: [],
          instructions: ['nope'],
          user_id: TEST_USER_ID,
        });
      expect(error).not.toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // Authenticated client - test user isolation
  // -------------------------------------------------------------------------

  describe('authenticated client', () => {
    let authClient: SupabaseClient<Database>;

    beforeAll(async () => {
      // Sign in as the test user to get an authenticated client
      authClient = createClient<Database>(supabaseUrl!, anonKey!, {
        auth: { autoRefreshToken: false, persistSession: false },
      });
      const { error } = await authClient.auth.signInWithPassword({
        email: `${TEST_PREFIX}user@test.com`,
        password: 'test-password-123',
      });
      expect(error).toBeNull();
    });

    it('can read built-in recipes', async () => {
      const { data } = await authClient
        .from('recipes')
        .select('id')
        .eq('id', `${TEST_PREFIX}builtin-recipe`);
      expect(data).toHaveLength(1);
    });

    it('can read own recipes', async () => {
      const { data } = await authClient
        .from('recipes')
        .select('id')
        .eq('id', `${TEST_PREFIX}user-recipe`);
      expect(data).toHaveLength(1);
    });

    it('can read own meal plan', async () => {
      const { data } = await authClient
        .from('meal_plans')
        .select('id')
        .eq('id', `${TEST_PREFIX}plan`);
      expect(data).toHaveLength(1);
    });

    it('can read meals in own plan', async () => {
      const { data } = await authClient
        .from('meals')
        .select('id')
        .eq('id', `${TEST_PREFIX}meal`);
      expect(data).toHaveLength(1);
    });

    it('can read checked items in own plan', async () => {
      const { data } = await authClient
        .from('checked_items')
        .select('item_id')
        .eq('item_id', `${TEST_PREFIX}checked`);
      expect(data).toHaveLength(1);
    });

    it('can read custom items in own plan', async () => {
      const { data } = await authClient
        .from('custom_shopping_items')
        .select('id')
        .eq('id', `${TEST_PREFIX}custom`);
      expect(data).toHaveLength(1);
    });
  });

  // -------------------------------------------------------------------------
  // M8: Member meal editing — collaborative access
  //
  // Two test users: an owner who creates the plan, and a member who joins it.
  // Verifies that plan_members RLS grants the member SELECT + INSERT on meals,
  // and that RLS blocks INSERT on plans the member has NOT joined.
  // -------------------------------------------------------------------------

  describe('M8: Member meal editing', () => {
    // Deterministic UUIDs — distinct from the existing TEST_USER_ID above
    const M8_OWNER_ID = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeee02';
    const M8_MEMBER_ID = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeee03';
    const M8_PREFIX = '__rls_m8_';

    let ownerClient: SupabaseClient<Database>;
    let memberClient: SupabaseClient<Database>;

    beforeAll(async () => {
      // Clean up any leftover data from a previous failed run
      await adminClient.from('meals').delete().like('id', `${M8_PREFIX}%`);
      await adminClient.from('plan_members').delete().like('meal_plan_id', `${M8_PREFIX}%`);
      await adminClient.from('meal_plans').delete().like('id', `${M8_PREFIX}%`);
      try { await adminClient.auth.admin.deleteUser(M8_OWNER_ID); } catch { /* ok */ }
      try { await adminClient.auth.admin.deleteUser(M8_MEMBER_ID); } catch { /* ok */ }

      // Create owner user
      const { error: ownerCreateErr } = await adminClient.auth.admin.createUser({
        email: `${M8_PREFIX}owner@test.com`,
        password: 'test-password-123',
        user_metadata: {},
        email_confirm: true,
        id: M8_OWNER_ID,
      });
      if (ownerCreateErr) throw new Error(`Failed to create M8 owner: ${ownerCreateErr.message}`);

      // Create member user
      const { error: memberCreateErr } = await adminClient.auth.admin.createUser({
        email: `${M8_PREFIX}member@test.com`,
        password: 'test-password-123',
        user_metadata: {},
        email_confirm: true,
        id: M8_MEMBER_ID,
      });
      if (memberCreateErr) throw new Error(`Failed to create M8 member: ${memberCreateErr.message}`);

      // Seed the owner's plan (service role bypasses RLS)
      const { error: planErr } = await adminClient.from('meal_plans').insert({
        id: `${M8_PREFIX}plan`,
        user_id: M8_OWNER_ID,
        preferences: { startDay: 0 },
      });
      if (planErr) throw new Error(`Failed to create M8 plan: ${planErr.message}`);

      // Seed a meal in the owner's plan
      const { error: mealErr } = await adminClient.from('meals').insert({
        id: `${M8_PREFIX}meal-owner`,
        meal_plan_id: `${M8_PREFIX}plan`,
        day_index: 0,
        meal_type: 'dinner',
        recipe_id: `${TEST_PREFIX}builtin-recipe`,
        servings: 4,
      });
      if (mealErr) throw new Error(`Failed to create M8 meal: ${mealErr.message}`);

      // Join the member to the plan via plan_members
      const { error: memberErr } = await adminClient.from('plan_members').insert({
        meal_plan_id: `${M8_PREFIX}plan`,
        user_id: M8_MEMBER_ID,
        role: 'member',
      });
      if (memberErr) throw new Error(`Failed to add M8 member: ${memberErr.message}`);

      // Sign in as owner
      ownerClient = createClient<Database>(supabaseUrl!, anonKey!, {
        auth: { autoRefreshToken: false, persistSession: false },
      });
      const { error: ownerSignInErr } = await ownerClient.auth.signInWithPassword({
        email: `${M8_PREFIX}owner@test.com`,
        password: 'test-password-123',
      });
      if (ownerSignInErr) throw new Error(`Failed to sign in M8 owner: ${ownerSignInErr.message}`);

      // Sign in as member
      memberClient = createClient<Database>(supabaseUrl!, anonKey!, {
        auth: { autoRefreshToken: false, persistSession: false },
      });
      const { error: memberSignInErr } = await memberClient.auth.signInWithPassword({
        email: `${M8_PREFIX}member@test.com`,
        password: 'test-password-123',
      });
      if (memberSignInErr) throw new Error(`Failed to sign in M8 member: ${memberSignInErr.message}`);
    });

    afterAll(async () => {
      // Clean up M8 data in reverse dependency order
      await adminClient.from('meals').delete().like('id', `${M8_PREFIX}%`);
      await adminClient.from('plan_members').delete().like('meal_plan_id', `${M8_PREFIX}%`);
      await adminClient.from('meal_plans').delete().like('id', `${M8_PREFIX}%`);
      await adminClient.auth.admin.deleteUser(M8_OWNER_ID);
      await adminClient.auth.admin.deleteUser(M8_MEMBER_ID);
    });

    // -- Member access --

    it('member can SELECT meals on the joined plan', async () => {
      // Verifies realtime delivery will work: Supabase Realtime filters events
      // using the same RLS SELECT policy that governs direct queries.
      const { data, error } = await memberClient
        .from('meals')
        .select('id')
        .eq('id', `${M8_PREFIX}meal-owner`);
      expect(error).toBeNull();
      expect(data).toHaveLength(1);
    });

    it('member can INSERT a meal into the joined plan', async () => {
      const { error } = await memberClient.from('meals').insert({
        id: `${M8_PREFIX}meal-by-member`,
        meal_plan_id: `${M8_PREFIX}plan`,
        day_index: 1,
        meal_type: 'lunch',
        recipe_id: `${TEST_PREFIX}builtin-recipe`,
        servings: 2,
      });
      expect(error).toBeNull();

      // Confirm the row exists via admin client
      const { data } = await adminClient
        .from('meals')
        .select('id')
        .eq('id', `${M8_PREFIX}meal-by-member`)
        .single();
      expect(data?.id).toBe(`${M8_PREFIX}meal-by-member`);
    });

    it('member cannot INSERT a meal into a plan they are NOT a member of', async () => {
      // The member has access to M8_PREFIX}plan but NOT to the existing TEST_PREFIX plan
      const { error } = await memberClient.from('meals').insert({
        id: `${M8_PREFIX}meal-unauthorized`,
        meal_plan_id: `${TEST_PREFIX}plan`,
        day_index: 2,
        meal_type: 'breakfast',
        recipe_id: `${TEST_PREFIX}builtin-recipe`,
        servings: 1,
      });
      expect(error).not.toBeNull();
    });

    // -- Owner access --

    it('owner can SELECT meals on their own plan', async () => {
      const { data, error } = await ownerClient
        .from('meals')
        .select('id')
        .eq('id', `${M8_PREFIX}meal-owner`);
      expect(error).toBeNull();
      expect(data).toHaveLength(1);
    });

    it('owner can INSERT a meal into their own plan', async () => {
      const { error } = await ownerClient.from('meals').insert({
        id: `${M8_PREFIX}meal-by-owner`,
        meal_plan_id: `${M8_PREFIX}plan`,
        day_index: 3,
        meal_type: 'dinner',
        recipe_id: `${TEST_PREFIX}builtin-recipe`,
        servings: 4,
      });
      expect(error).toBeNull();

      // Confirm the row exists via admin client
      const { data } = await adminClient
        .from('meals')
        .select('id')
        .eq('id', `${M8_PREFIX}meal-by-owner`)
        .single();
      expect(data?.id).toBe(`${M8_PREFIX}meal-by-owner`);
    });
  });
});
