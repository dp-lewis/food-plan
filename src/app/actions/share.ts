'use server';

import { createClient } from '@/lib/supabase/server';
import type { ActionResult, SharedPlanData } from '@/types';
import {
  getShareCode,
  setShareCode,
  clearShareCode,
  getPlanIdByShareCode,
  getPlanOwner,
  removeAllMemberships,
  joinPlan,
  leavePlan,
  getMealPlanByShareCode,
} from '@/lib/supabase/queries';
import { headers } from 'next/headers';
import { generateUUID } from '@/lib/uuid';

export interface MemberInfo {
  userId: string;
  userEmail: string;
  role: 'owner' | 'member';
  joinedAt: string | null;
}

async function getAuthUser() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error('Not authenticated');
  return user;
}

export async function generateShareLink(planId: string): Promise<ActionResult<string>> {
  try {
    await getAuthUser();
    let shareCode = await getShareCode(planId);
    if (!shareCode) {
      shareCode = generateUUID();
      await setShareCode(planId, shareCode);
    }
    const origin =
      (await headers()).get('origin') ||
      (await headers()).get('host') ||
      '';
    const baseUrl = origin.startsWith('http') ? origin : `https://${origin}`;
    return { data: `${baseUrl}/shared/${shareCode}`, error: null };
  } catch (e) {
    console.error('[generateShareLink]', e);
    return { data: null, error: e instanceof Error ? e.message : 'Failed to generate share link' };
  }
}

export async function joinSharedPlan(
  shareCode: string,
): Promise<ActionResult<SharedPlanData>> {
  try {
    const user = await getAuthUser();

    // Resolve share code to plan ID
    const planId = await getPlanIdByShareCode(shareCode);
    if (!planId) {
      return { data: null, error: 'Plan not found or sharing has been disabled' };
    }

    // Prevent owner from joining their own plan
    const ownerId = await getPlanOwner(planId);
    if (ownerId === user.id) {
      return { data: null, error: 'You already own this plan' };
    }

    // Remove any existing memberships (user can only be in one plan)
    await removeAllMemberships(user.id);

    // Insert membership
    await joinPlan(planId, user.id, user.email ?? undefined);

    // Load and return full plan data
    const data = await getMealPlanByShareCode(shareCode);
    if (!data) {
      return { data: null, error: 'Failed to load plan data' };
    }

    return { data, error: null };
  } catch (e) {
    console.error('[joinSharedPlan]', e);
    return {
      data: null,
      error: e instanceof Error ? e.message : (e as { message?: string })?.message ?? 'Failed to join plan',
    };
  }
}

export async function revokeShareLink(planId: string): Promise<ActionResult<null>> {
  try {
    await getAuthUser();
    await clearShareCode(planId);
    return { data: null, error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : 'Failed to revoke share link' };
  }
}

export async function leavePlanAction(): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await getAuthUser();
    // Find the plan the user is a member of (not owned — that's for owners only).
    const supabase = await createClient();
    const { data: membership, error: memberError } = await supabase
      .from('plan_members')
      .select('meal_plan_id')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle();
    if (memberError) throw memberError;
    if (!membership) {
      return { success: false, error: 'You are not a member of any shared plan' };
    }
    await leavePlan(membership.meal_plan_id, user.id);
    return { success: true };
  } catch (e) {
    console.error('[leavePlanAction]', e);
    return { success: false, error: e instanceof Error ? e.message : 'Failed to leave plan' };
  }
}

export async function getPlanMembersAction(
  planId: string,
): Promise<{ success: true; members: MemberInfo[] } | { success: false; error: string }> {
  try {
    const callingUser = await getAuthUser();
    const supabase = await createClient();

    // Fetch the plan to get the owner's user_id.
    // Note: the meal_plans table stores user_id (owner) but not the owner's email.
    // The owner's email is available via auth when the caller is the owner themselves.
    const { data: planRow, error: planError } = await supabase
      .from('meal_plans')
      .select('user_id')
      .eq('id', planId)
      .maybeSingle();
    if (planError) throw planError;

    // Fetch members from plan_members.
    // Note: user_email is stored in the DB but is not reflected in the generated
    // Supabase type definitions (types/supabase.ts). We cast to any to access it.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: memberRows, error: memberError } = await (supabase as any)
      .from('plan_members')
      .select('user_id, user_email, role, joined_at')
      .eq('meal_plan_id', planId) as { data: Array<{ user_id: string; user_email: string | null; role: string; joined_at: string | null }> | null; error: unknown };
    if (memberError) throw memberError;

    const members: MemberInfo[] = (memberRows ?? []).map((row) => ({
      userId: row.user_id,
      userEmail: row.user_email ?? '',
      role: (row.role as 'owner' | 'member') ?? 'member',
      joinedAt: row.joined_at ?? null,
    }));

    // Prepend owner entry if the owner is not already listed in plan_members
    // (owners are not inserted into plan_members — only joining members are).
    if (planRow?.user_id) {
      const ownerAlreadyListed = members.some((m) => m.userId === planRow.user_id);
      if (!ownerAlreadyListed) {
        // If the calling user is the owner we can use their email from auth.
        // Otherwise the owner email is not stored on the meal_plans row, so we
        // leave it empty. Callers should handle email === '' gracefully.
        const ownerEmail =
          callingUser.id === planRow.user_id ? (callingUser.email ?? '') : '';
        members.unshift({
          userId: planRow.user_id,
          userEmail: ownerEmail,
          role: 'owner',
          joinedAt: null,
        });
      }
    }

    return { success: true, members };
  } catch (e) {
    console.error('[getPlanMembersAction]', e);
    return { success: false, error: e instanceof Error ? e.message : 'Failed to load members' };
  }
}

export async function regenerateShareLinkAction(
  planId: string,
): Promise<{ success: true; url: string } | { success: false; error: string }> {
  try {
    const user = await getAuthUser();

    // Verify caller is the owner
    const ownerId = await getPlanOwner(planId);
    if (ownerId !== user.id) {
      return { success: false, error: 'Only the plan owner can regenerate the share link' };
    }

    // Clear existing share code and generate a fresh one
    await clearShareCode(planId);
    const newShareCode = generateUUID();
    await setShareCode(planId, newShareCode);

    const origin =
      (await headers()).get('origin') ||
      (await headers()).get('host') ||
      '';
    const baseUrl = origin.startsWith('http') ? origin : `https://${origin}`;
    return { success: true, url: `${baseUrl}/shared/${newShareCode}` };
  } catch (e) {
    console.error('[regenerateShareLinkAction]', e);
    return { success: false, error: e instanceof Error ? e.message : 'Failed to regenerate share link' };
  }
}
