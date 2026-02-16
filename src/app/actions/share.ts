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
  getMealPlanByShareCode,
} from '@/lib/supabase/queries';
import { headers } from 'next/headers';
import { generateUUID } from '@/lib/uuid';

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
    await joinPlan(planId, user.id);

    // Load and return full plan data
    const data = await getMealPlanByShareCode(shareCode);
    if (!data) {
      return { data: null, error: 'Failed to load plan data' };
    }

    return { data, error: null };
  } catch (e) {
    return {
      data: null,
      error: e instanceof Error ? e.message : 'Failed to join plan',
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
