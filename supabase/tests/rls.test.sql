-- =============================================================================
-- RLS Policy Tests
-- Verifies Row Level Security policies for all tables
-- =============================================================================

BEGIN;

-- Use pgTAP
SELECT plan(27);

-- ---------------------------------------------------------------------------
-- Setup: Create test users and seed data as admin (bypasses RLS)
-- ---------------------------------------------------------------------------

-- Create two test users in auth.users
INSERT INTO auth.users (id, email, raw_user_meta_data, role, aud, created_at, updated_at)
VALUES
  ('a0000000-0000-0000-0000-000000000001'::uuid, 'alice@test.com', '{}', 'authenticated', 'authenticated', now(), now()),
  ('b0000000-0000-0000-0000-000000000002'::uuid, 'bob@test.com', '{}', 'authenticated', 'authenticated', now(), now());

-- Seed a built-in recipe (no user_id)
INSERT INTO recipes (id, title, meal_type, prep_time, cook_time, servings, difficulty, estimated_cost, ingredients, instructions)
VALUES ('test-builtin-recipe', 'Built-in Recipe', 'dinner', 10, 20, 4, 'easy', 'low', '[]'::jsonb, ARRAY['Step 1']);

-- Seed Alice's recipe
INSERT INTO recipes (id, title, meal_type, prep_time, cook_time, servings, difficulty, estimated_cost, ingredients, instructions, user_id)
VALUES ('test-alice-recipe', 'Alice Recipe', 'lunch', 5, 15, 2, 'easy', 'low', '[]'::jsonb, ARRAY['Step 1'], 'a0000000-0000-0000-0000-000000000001');

-- Seed Bob's recipe
INSERT INTO recipes (id, title, meal_type, prep_time, cook_time, servings, difficulty, estimated_cost, ingredients, instructions, user_id)
VALUES ('test-bob-recipe', 'Bob Recipe', 'breakfast', 5, 10, 1, 'easy', 'low', '[]'::jsonb, ARRAY['Step 1'], 'b0000000-0000-0000-0000-000000000002');

-- Seed Alice's meal plan
INSERT INTO meal_plans (id, user_id, preferences)
VALUES ('test-alice-plan', 'a0000000-0000-0000-0000-000000000001', '{"startDay": 5}');

-- Seed Bob's meal plan
INSERT INTO meal_plans (id, user_id, preferences)
VALUES ('test-bob-plan', 'b0000000-0000-0000-0000-000000000002', '{"startDay": 0}');

-- Seed a meal in Alice's plan (references built-in recipe)
INSERT INTO meals (id, meal_plan_id, day_index, meal_type, recipe_id, servings)
VALUES ('test-alice-meal', 'test-alice-plan', 0, 'dinner', 'test-builtin-recipe', 4);

-- Seed a meal in Bob's plan
INSERT INTO meals (id, meal_plan_id, day_index, meal_type, recipe_id, servings)
VALUES ('test-bob-meal', 'test-bob-plan', 1, 'lunch', 'test-builtin-recipe', 2);

-- Seed checked items
INSERT INTO checked_items (meal_plan_id, item_id, checked_by)
VALUES ('test-alice-plan', 'item-1', 'a0000000-0000-0000-0000-000000000001');

INSERT INTO checked_items (meal_plan_id, item_id, checked_by)
VALUES ('test-bob-plan', 'item-2', 'b0000000-0000-0000-0000-000000000002');

-- Seed custom shopping items
INSERT INTO custom_shopping_items (id, meal_plan_id, ingredient, quantity, unit, category)
VALUES ('test-alice-custom', 'test-alice-plan', 'Paper towels', 1, 'roll', 'uncategorized');

INSERT INTO custom_shopping_items (id, meal_plan_id, ingredient, quantity, unit, category)
VALUES ('test-bob-custom', 'test-bob-plan', 'Napkins', 2, 'pack', 'uncategorized');

-- ---------------------------------------------------------------------------
-- Test: recipes
-- ---------------------------------------------------------------------------

-- As Alice: can see built-in + own, not Bob's
SELECT set_config('request.jwt.claims', json_build_object(
  'sub', 'a0000000-0000-0000-0000-000000000001',
  'role', 'authenticated'
)::text, true);
SET ROLE authenticated;

SELECT is(
  (SELECT count(*)::int FROM recipes WHERE id = 'test-builtin-recipe'),
  1,
  'Alice can read built-in recipes'
);

SELECT is(
  (SELECT count(*)::int FROM recipes WHERE id = 'test-alice-recipe'),
  1,
  'Alice can read her own recipes'
);

SELECT is(
  (SELECT count(*)::int FROM recipes WHERE id = 'test-bob-recipe'),
  0,
  'Alice cannot read Bob''s recipes'
);

-- As anonymous: can only see built-in
SET ROLE postgres;
SELECT set_config('request.jwt.claims', '', true);
SET ROLE anon;

SELECT is(
  (SELECT count(*)::int FROM recipes WHERE id = 'test-builtin-recipe'),
  1,
  'Anonymous can read built-in recipes'
);

SELECT is(
  (SELECT count(*)::int FROM recipes WHERE id = 'test-alice-recipe'),
  0,
  'Anonymous cannot read user recipes'
);

-- ---------------------------------------------------------------------------
-- Test: meal_plans
-- ---------------------------------------------------------------------------

-- As Alice
SET ROLE postgres;
SELECT set_config('request.jwt.claims', json_build_object(
  'sub', 'a0000000-0000-0000-0000-000000000001',
  'role', 'authenticated'
)::text, true);
SET ROLE authenticated;

SELECT is(
  (SELECT count(*)::int FROM meal_plans WHERE id = 'test-alice-plan'),
  1,
  'Alice can read her own meal plan'
);

SELECT is(
  (SELECT count(*)::int FROM meal_plans WHERE id = 'test-bob-plan'),
  0,
  'Alice cannot read Bob''s meal plan'
);

-- As anonymous
SET ROLE postgres;
SELECT set_config('request.jwt.claims', '', true);
SET ROLE anon;

SELECT is(
  (SELECT count(*)::int FROM meal_plans),
  0,
  'Anonymous cannot read any meal plans'
);

-- ---------------------------------------------------------------------------
-- Test: meals (via user_has_plan_access)
-- ---------------------------------------------------------------------------

-- As Alice
SET ROLE postgres;
SELECT set_config('request.jwt.claims', json_build_object(
  'sub', 'a0000000-0000-0000-0000-000000000001',
  'role', 'authenticated'
)::text, true);
SET ROLE authenticated;

SELECT is(
  (SELECT count(*)::int FROM meals WHERE id = 'test-alice-meal'),
  1,
  'Alice can read meals in her plan'
);

SELECT is(
  (SELECT count(*)::int FROM meals WHERE id = 'test-bob-meal'),
  0,
  'Alice cannot read meals in Bob''s plan'
);

-- As anonymous
SET ROLE postgres;
SELECT set_config('request.jwt.claims', '', true);
SET ROLE anon;

SELECT is(
  (SELECT count(*)::int FROM meals),
  0,
  'Anonymous cannot read any meals'
);

-- ---------------------------------------------------------------------------
-- Test: checked_items (via user_has_plan_access)
-- ---------------------------------------------------------------------------

-- As Alice
SET ROLE postgres;
SELECT set_config('request.jwt.claims', json_build_object(
  'sub', 'a0000000-0000-0000-0000-000000000001',
  'role', 'authenticated'
)::text, true);
SET ROLE authenticated;

SELECT is(
  (SELECT count(*)::int FROM checked_items WHERE meal_plan_id = 'test-alice-plan'),
  1,
  'Alice can read checked items in her plan'
);

SELECT is(
  (SELECT count(*)::int FROM checked_items WHERE meal_plan_id = 'test-bob-plan'),
  0,
  'Alice cannot read checked items in Bob''s plan'
);

-- ---------------------------------------------------------------------------
-- Test: custom_shopping_items (via user_has_plan_access)
-- ---------------------------------------------------------------------------

SELECT is(
  (SELECT count(*)::int FROM custom_shopping_items WHERE id = 'test-alice-custom'),
  1,
  'Alice can read custom items in her plan'
);

SELECT is(
  (SELECT count(*)::int FROM custom_shopping_items WHERE id = 'test-bob-custom'),
  0,
  'Alice cannot read custom items in Bob''s plan'
);

-- ---------------------------------------------------------------------------
-- Test: Write operations
-- ---------------------------------------------------------------------------

-- Alice can insert into her own plan
SELECT lives_ok(
  $$ INSERT INTO meals (id, meal_plan_id, day_index, meal_type, recipe_id, servings)
     VALUES ('test-alice-meal-2', 'test-alice-plan', 1, 'breakfast', 'test-builtin-recipe', 2) $$,
  'Alice can insert meals into her own plan'
);

-- Alice cannot insert into Bob's plan
SELECT throws_ok(
  $$ INSERT INTO meals (id, meal_plan_id, day_index, meal_type, recipe_id, servings)
     VALUES ('test-hack-meal', 'test-bob-plan', 0, 'dinner', 'test-builtin-recipe', 4) $$,
  'new row violates row-level security policy for table "meals"',
  'Alice cannot insert meals into Bob''s plan'
);

-- Alice can delete her own meal
SELECT lives_ok(
  $$ DELETE FROM meals WHERE id = 'test-alice-meal-2' $$,
  'Alice can delete her own meals'
);

-- Alice cannot insert a recipe with Bob's user_id
SELECT throws_ok(
  $$ INSERT INTO recipes (id, title, meal_type, prep_time, cook_time, servings, difficulty, estimated_cost, ingredients, instructions, user_id)
     VALUES ('test-hack-recipe', 'Hacked', 'dinner', 1, 1, 1, 'easy', 'low', '[]'::jsonb, ARRAY['nope'], 'b0000000-0000-0000-0000-000000000002') $$,
  'new row violates row-level security policy for table "recipes"',
  'Alice cannot insert recipes with another user''s ID'
);

-- Alice can insert a recipe with her own user_id
SELECT lives_ok(
  $$ INSERT INTO recipes (id, title, meal_type, prep_time, cook_time, servings, difficulty, estimated_cost, ingredients, instructions, user_id)
     VALUES ('test-alice-recipe-2', 'My Recipe', 'dinner', 5, 10, 2, 'easy', 'low', '[]'::jsonb, ARRAY['Step 1'], 'a0000000-0000-0000-0000-000000000001') $$,
  'Alice can insert recipes with her own user ID'
);

-- Alice can insert checked items in her plan
SELECT lives_ok(
  $$ INSERT INTO checked_items (meal_plan_id, item_id, checked_by)
     VALUES ('test-alice-plan', 'item-new', 'a0000000-0000-0000-0000-000000000001') $$,
  'Alice can insert checked items in her plan'
);

-- Alice cannot insert checked items in Bob's plan
SELECT throws_ok(
  $$ INSERT INTO checked_items (meal_plan_id, item_id, checked_by)
     VALUES ('test-bob-plan', 'item-hack', 'a0000000-0000-0000-0000-000000000001') $$,
  'new row violates row-level security policy for table "checked_items"',
  'Alice cannot insert checked items in Bob''s plan'
);

-- Alice can insert custom items in her plan
SELECT lives_ok(
  $$ INSERT INTO custom_shopping_items (id, meal_plan_id, ingredient, quantity, unit, category)
     VALUES ('test-alice-custom-2', 'test-alice-plan', 'Sponge', 1, 'pack', 'uncategorized') $$,
  'Alice can insert custom items in her plan'
);

-- Alice cannot insert custom items in Bob's plan
SELECT throws_ok(
  $$ INSERT INTO custom_shopping_items (id, meal_plan_id, ingredient, quantity, unit, category)
     VALUES ('test-hack-custom', 'test-bob-plan', 'Hack', 1, '', 'uncategorized') $$,
  'new row violates row-level security policy for table "custom_shopping_items"',
  'Alice cannot insert custom items in Bob''s plan'
);

-- ---------------------------------------------------------------------------
-- Done
-- ---------------------------------------------------------------------------

SELECT * FROM finish();
ROLLBACK;
