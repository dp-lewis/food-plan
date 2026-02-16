'use client';

import { useMemo, useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useStore } from '@/store/store';
import { generateShoppingList, groupByCategory, mergeShoppingLists, CATEGORY_LABELS } from '@/lib/shoppingList';
import { parseIngredient } from '@/lib/ingredientParser';
import { BottomNav, ProgressBar, Checkbox, Button, Drawer, PageHeader } from '@/components/ui';
import { buttonVariants } from '@/components/ui/Button';

export default function ShoppingList() {
  const currentPlan = useStore((state) => state.currentPlan);
  const checkedItems = useStore((state) => state.checkedItems);
  const toggleCheckedItem = useStore((state) => state.toggleCheckedItem);
  const clearCheckedItems = useStore((state) => state.clearCheckedItems);
  const userRecipes = useStore((state) => state.userRecipes);
  const customShoppingItems = useStore((state) => state.customShoppingItems);
  const addCustomItem = useStore((state) => state.addCustomItem);
  const removeCustomItem = useStore((state) => state.removeCustomItem);

  const [newItemText, setNewItemText] = useState('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when drawer opens
  useEffect(() => {
    if (isDrawerOpen && inputRef.current) {
      // Small delay to ensure drawer animation has started
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isDrawerOpen]);

  const shoppingList = useMemo(() => {
    const generatedItems = currentPlan ? generateShoppingList(currentPlan, userRecipes) : [];
    return mergeShoppingLists(generatedItems, customShoppingItems);
  }, [currentPlan, userRecipes, customShoppingItems]);

  const groupedItems = useMemo(() => {
    return groupByCategory(shoppingList);
  }, [shoppingList]);

  const handleAddItem = () => {
    if (!newItemText.trim()) return;

    // Split by commas and "and" to support multiple items
    const items = newItemText
      .split(/,|\band\b/i)
      .map((item) => item.trim())
      .filter((item) => item.length > 0);

    items.forEach((item) => {
      const parsed = parseIngredient(item);
      addCustomItem(parsed.name, parsed.quantity, parsed.unit);
    });

    setNewItemText('');
    setIsDrawerOpen(false);
  };

  const totalItems = shoppingList.length;
  const checkedCount = checkedItems.length;
  const isEmpty = !currentPlan && customShoppingItems.length === 0;

  const openDrawer = () => setIsDrawerOpen(true);

  return (
    <div className="min-h-screen bg-background" data-testid={isEmpty ? undefined : 'shopping-list'}>
      <PageHeader
        title="Shopping List"
        backHref="/"
        sticky
      >
        {!isEmpty && totalItems > 0 && (
          <div className="mt-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-primary-foreground" data-testid="progress-counter">
                {checkedCount} / {totalItems} items
              </span>
              {checkedCount > 0 && (
                <button
                  onClick={clearCheckedItems}
                  className="text-xs text-primary-foreground hover:text-primary-foreground min-h-[44px] px-2"
                  data-testid="clear-checked-btn"
                >
                  Clear checked
                </button>
              )}
            </div>
            <ProgressBar value={checkedCount} max={totalItems} />
          </div>
        )}
      </PageHeader>

      {isEmpty ? (
        <main className="max-w-2xl mx-auto px-4 py-6 pb-40 space-y-6">
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              No meal plan found. Create one to generate a shopping list, or add items manually.
            </p>
            <Link
              href="/plan"
              className={buttonVariants({ variant: 'primary' }) + ' w-full'}
            >
              Create Meal Plan
            </Link>
          </div>
        </main>
      ) : (
        <main id="main-content" className="max-w-2xl mx-auto px-4 py-6 pb-40 space-y-6">
          <div className="space-y-6">
            {Array.from(groupedItems.entries()).map(([category, items]) => (
              <section key={category} data-testid={`category-${category}`}>
                <h2 className="mb-3 pb-2 text-base font-semibold text-foreground border-b border-border">
                  {CATEGORY_LABELS[category]}
                </h2>
                <ul className="space-y-1">
                  {items.map((item) => {
                    const isChecked = checkedItems.includes(item.id);
                    const isCustom = item.id.startsWith('custom-');
                    return (
                      <li
                        key={item.id}
                        data-testid={`item-${item.id}`}
                        className="flex items-center"
                      >
                        <div className="flex-1">
                          <Checkbox
                            checked={isChecked}
                            onChange={() => toggleCheckedItem(item.id)}
                            label={`${item.quantity} ${item.unit} ${item.ingredient}`}
                            id={item.id}
                          >
                            <span className="text-muted-foreground">
                              {item.quantity} {item.unit}
                            </span>{' '}
                            {item.ingredient}
                          </Checkbox>
                        </div>
                        {isCustom && (
                          <button
                            onClick={() => removeCustomItem(item.id)}
                            className="p-2 ml-2 text-destructive text-base bg-transparent border-none cursor-pointer"
                            data-testid={`delete-${item.id}`}
                            aria-label={`Remove ${item.ingredient}`}
                          >
                            <span aria-hidden="true">×</span>
                          </button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </div>
        </main>
      )}

      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title="Add Item"
      >
        <div data-testid="add-custom-item-section">
          <div className="flex gap-2">
            <label htmlFor="add-item-input" className="sr-only">
              Add item to shopping list
            </label>
            <input
              ref={inputRef}
              id="add-item-input"
              type="text"
              value={newItemText}
              onChange={(e) => setNewItemText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newItemText.trim()) {
                  e.preventDefault();
                  handleAddItem();
                }
              }}
              placeholder="e.g., toilet paper, 2 bottles milk"
              className="flex-1 bg-background border border-border text-base text-foreground px-3 py-2 rounded-sm"
              data-testid="add-item-input"
            />
          </div>
          <p className="mt-2 mb-4 text-sm text-muted-foreground">
            Include quantity if needed (e.g., &quot;2 bottles cleaning spray&quot;)
          </p>
          <Button
            onClick={handleAddItem}
            disabled={!newItemText.trim()}
            data-testid="add-item-btn"
            className="w-full"
          >
            Add to List
          </Button>
        </div>
      </Drawer>

      <BottomNav onAddItemClick={openDrawer} />
    </div>
  );
}
