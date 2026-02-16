'use client';

import { useEffect, useRef } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useStore } from '@/store/store';
import { loadMealPlan, syncMealPlan } from '@/app/actions/mealPlan';
import { loadUserRecipes, saveUserRecipe } from '@/app/actions/recipes';
import { loadCheckedItems, loadCustomItems, addCustomItemAction } from '@/app/actions/shoppingList';
import { setupSyncSubscriber } from '@/store/syncSubscriber';

/**
 * Watches auth state transitions and syncs store data with the server.
 *
 * On sign-in:
 *   - If the server has data, replace local store with server data.
 *   - If the server is empty and local data exists, upload local data to server.
 *
 * On sign-out:
 *   - Clear the store to remove any user-specific data from memory.
 *
 * Anonymous users (_userId = null) see no server action calls from the store.
 */
export function StoreSync() {
  const { user, loading } = useAuth();
  const prevUserIdRef = useRef<string | null>(null);

  // Wire up the sync subscriber once on mount so store intents are dispatched
  // to the server whenever _userId is set.
  useEffect(() => {
    const unsubscribe = setupSyncSubscriber(useStore);
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (loading) return;

    const prevUserId = prevUserIdRef.current;
    const currentUserId = user?.id ?? null;

    // Sign-in transition: user just became non-null
    if (currentUserId !== null && prevUserId === null) {
      const _setUserId = useStore.getState()._setUserId;
      const _setIsSyncing = useStore.getState()._setIsSyncing;

      // Enable write-through immediately so subsequent mutations sync
      _setUserId(currentUserId);
      _setIsSyncing(true);

      const syncOnSignIn = async () => {
        const localPlan = useStore.getState().currentPlan;
        const localRecipes = useStore.getState().userRecipes;
        const localCustomItems = useStore.getState().customShoppingItems;

        const [planResult, recipesResult] = await Promise.all([
          loadMealPlan(),
          loadUserRecipes(),
        ]);

        const serverPlan = planResult.data ?? null;
        const serverRecipes = recipesResult.data ?? [];

        if (serverPlan !== null) {
          // Server has data — replace local store with server data
          useStore.setState({
            currentPlan: serverPlan,
            userRecipes: serverRecipes,
          });

          const [checkedResult, customResult] = await Promise.all([
            loadCheckedItems(serverPlan.id),
            loadCustomItems(serverPlan.id),
          ]);

          useStore.setState({
            checkedItems: checkedResult.data ?? [],
            customShoppingItems: customResult.data ?? [],
          });
        } else if (localPlan !== null) {
          // Server is empty but local data exists — upload local data to server
          await syncMealPlan(localPlan);
          await Promise.all(localRecipes.map((recipe) => saveUserRecipe(recipe)));
          await Promise.all(
            localCustomItems.map((item) => addCustomItemAction(localPlan.id, item))
          );
        }
      };

      syncOnSignIn()
        .catch(console.error)
        .finally(() => {
          useStore.getState()._setIsSyncing(false);
        });
    }

    // Sign-out transition: user just became null
    if (currentUserId === null && prevUserId !== null) {
      useStore.getState()._setUserId(null);
      useStore.setState({
        currentPlan: null,
        checkedItems: [],
        userRecipes: [],
        customShoppingItems: [],
      });
    }

    prevUserIdRef.current = currentUserId;
  }, [user, loading]);

  return null;
}
