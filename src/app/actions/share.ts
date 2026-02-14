'use server';

import { createClient } from '@/lib/supabase/server';
import type { ActionResult } from '@/types';
import { getShareCode, setShareCode, clearShareCode } from '@/lib/supabase/queries';
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
    return { data: null, error: e instanceof Error ? e.message : 'Failed to generate share link' };
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
