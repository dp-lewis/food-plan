import type { StoreApi } from 'zustand';
import { syncMealPlan, addMealAction, removeMealAction, swapMealAction } from '@/app/actions/mealPlan';
import { saveUserRecipe, deleteUserRecipeAction } from '@/app/actions/recipes';
import { toggleCheckedItemAction, clearCheckedItemsAction, addCustomItemAction, removeCustomItemAction } from '@/app/actions/shoppingList';
import type { SyncIntent } from './store';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyStore = StoreApi<any>;

/**
 * Subscribes to store changes and dispatches pending sync intents to the server.
 *
 * Call this once when the user is authenticated. Returns an unsubscribe function
 * for cleanup.
 *
 * Intents are only dispatched when `_userId` is set. If the user is not signed
 * in, queued intents are drained and discarded.
 */
export function setupSyncSubscriber(store: AnyStore): () => void {
  const unsubscribe = store.subscribe(() => {
    const state = store.getState();
    const userId: string | null = state._userId;
    const intents: SyncIntent[] = state._drainSync();

    if (intents.length === 0) return;
    if (!userId) {
      // Not signed in — discard intents (drain already removed them from queue)
      return;
    }

    for (const intent of intents) {
      dispatchIntent(intent);
    }
  });

  return unsubscribe;
}

function dispatchIntent(intent: SyncIntent): void {
  switch (intent.type) {
    case 'syncMealPlan':
      syncMealPlan(intent.plan).catch(console.error);
      break;
    case 'clearCheckedItems':
      clearCheckedItemsAction(intent.planId).catch(console.error);
      break;
    case 'swapMeal':
      swapMealAction(intent.mealId, intent.recipeId).catch(console.error);
      break;
    case 'addMeal':
      addMealAction(intent.planId, intent.meal).catch(console.error);
      break;
    case 'removeMeal':
      removeMealAction(intent.mealId).catch(console.error);
      break;
    case 'toggleCheckedItem':
      toggleCheckedItemAction(intent.planId, intent.itemId, intent.checked).catch(console.error);
      break;
    case 'saveUserRecipe':
      saveUserRecipe(intent.recipe).catch(console.error);
      break;
    case 'deleteUserRecipe':
      deleteUserRecipeAction(intent.recipeId).catch(console.error);
      break;
    case 'addCustomItem':
      addCustomItemAction(intent.planId, intent.item).catch(console.error);
      break;
    case 'removeCustomItem':
      removeCustomItemAction(intent.itemId).catch(console.error);
      break;
    default: {
      // Exhaustiveness check
      const _exhaustive: never = intent;
      console.warn('Unknown sync intent:', _exhaustive);
    }
  }
}
