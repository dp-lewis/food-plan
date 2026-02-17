'use server';

import { createClient } from '@/lib/supabase/server';
import type { ActionResult } from '@/types';
import type { CustomShoppingListItem } from '@/types';
import {
  getCheckedItems,
  upsertCheckedItem,
  deleteCheckedItem,
  clearCheckedItems,
  getCustomItems,
  insertCustomItem,
  deleteCustomItem,
} from '@/lib/supabase/queries';

async function getAuthUser() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error('Not authenticated');
  return user;
}

export async function loadCheckedItems(
  planId: string,
): Promise<ActionResult<Record<string, string>>> {
  try {
    await getAuthUser();
    const items = await getCheckedItems(planId);
    return { data: items, error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : 'Failed to load checked items' };
  }
}

export async function toggleCheckedItemAction(
  planId: string,
  itemId: string,
  checked: boolean,
  userEmail?: string,
): Promise<ActionResult<void>> {
  try {
    const user = await getAuthUser();
    if (checked) {
      await upsertCheckedItem(planId, itemId, user.id, userEmail);
    } else {
      await deleteCheckedItem(planId, itemId);
    }
    return { data: undefined, error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : 'Failed to toggle checked item' };
  }
}

export async function clearCheckedItemsAction(
  planId: string,
): Promise<ActionResult<void>> {
  try {
    await getAuthUser();
    await clearCheckedItems(planId);
    return { data: undefined, error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : 'Failed to clear checked items' };
  }
}

export async function loadCustomItems(
  planId: string,
): Promise<ActionResult<CustomShoppingListItem[]>> {
  try {
    await getAuthUser();
    const items = await getCustomItems(planId);
    return { data: items, error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : 'Failed to load custom items' };
  }
}

export async function addCustomItemAction(
  planId: string,
  item: CustomShoppingListItem,
): Promise<ActionResult<CustomShoppingListItem>> {
  try {
    await getAuthUser();
    const result = await insertCustomItem(item, planId);
    return { data: result, error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : 'Failed to add custom item' };
  }
}

export async function removeCustomItemAction(
  itemId: string,
): Promise<ActionResult<void>> {
  try {
    await getAuthUser();
    await deleteCustomItem(itemId);
    return { data: undefined, error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : 'Failed to remove custom item' };
  }
}
