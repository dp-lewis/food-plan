'use client';

import { useMemo, useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useStore } from '@/store/store';
import { generateShoppingList, groupByCategory, mergeShoppingLists, CATEGORY_LABELS } from '@/lib/shoppingList';
import { parseIngredient } from '@/lib/ingredientParser';
import { BottomNav, ProgressBar, Checkbox, Button, Drawer } from '@/components/ui';

export default function ShoppingList() {
  const currentPlan = useStore((state) => state.currentPlan);
  const checkedItems = useStore((state) => state.checkedItems);
  const toggleCheckedItem = useStore((state) => state.toggleCheckedItem);
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

    const parsed = parseIngredient(newItemText.trim());
    addCustomItem(parsed.name, parsed.quantity, parsed.unit);
    setNewItemText('');
    setIsDrawerOpen(false);
  };

  const totalItems = shoppingList.length;
  const checkedCount = checkedItems.length;

  const openDrawer = () => setIsDrawerOpen(true);

  // Empty state - no plan and no custom items
  if (!currentPlan && customShoppingItems.length === 0) {
    return (
      <main className="min-h-screen p-4 pb-20">
        <div className="max-w-md mx-auto">
          <h1
            className="mb-6"
            style={{
              fontSize: 'var(--font-size-heading)',
              fontWeight: 'var(--font-weight-bold)',
              color: 'var(--color-text-primary)',
            }}
          >
            Shopping List
          </h1>

          <div className="text-center py-8">
            <p style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--space-4)' }}>
              No meal plan found. Create one to generate a shopping list, or add items manually.
            </p>
            <Link
              href="/plan"
              className="primary-button inline-flex items-center justify-center"
            >
              Create Meal Plan
            </Link>
          </div>
        </div>

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
                className="flex-1"
                data-testid="add-item-input"
                style={{
                  backgroundColor: 'var(--color-bg-primary)',
                  border: 'var(--border-width) solid var(--color-border)',
                  fontSize: 'var(--font-size-body)',
                  color: 'var(--color-text-primary)',
                  padding: 'var(--space-2) var(--space-3)',
                  borderRadius: 'var(--border-radius-sm)',
                }}
              />
            </div>
            <p
              className="mt-2 mb-4"
              style={{
                fontSize: 'var(--font-size-caption)',
                color: 'var(--color-text-muted)',
              }}
            >
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

        <BottomNav
          primaryAction={{ onClick: openDrawer, label: '+ Add', testId: 'open-add-drawer-btn' }}
        />
      </main>
    );
  }

  return (
    <main id="main-content" className="min-h-screen p-4 pb-20" data-testid="shopping-list">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1
            style={{
              fontSize: 'var(--font-size-heading)',
              fontWeight: 'var(--font-weight-bold)',
              color: 'var(--color-text-primary)',
            }}
          >
            Shopping List
          </h1>
          <span
            data-testid="progress-counter"
            style={{
              fontSize: 'var(--font-size-caption)',
              color: 'var(--color-text-muted)',
            }}
          >
            {checkedCount} / {totalItems}
          </span>
        </div>

        {/* Progress bar */}
        {totalItems > 0 && (
          <div className="mb-6">
            <ProgressBar value={checkedCount} max={totalItems} />
          </div>
        )}

        {/* Grouped list */}
        <div className="space-y-6">
          {Array.from(groupedItems.entries()).map(([category, items]) => (
            <section key={category} data-testid={`category-${category}`}>
              <h2
                className="mb-3 pb-2"
                style={{
                  fontSize: 'var(--font-size-body)',
                  fontWeight: 'var(--font-weight-bold)',
                  color: 'var(--color-text-primary)',
                  borderBottom: 'var(--border-width) solid var(--color-border)',
                }}
              >
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
                          <span style={{ color: 'var(--color-text-muted)' }}>
                            {item.quantity} {item.unit}
                          </span>{' '}
                          {item.ingredient}
                        </Checkbox>
                      </div>
                      {isCustom && (
                        <button
                          onClick={() => removeCustomItem(item.id)}
                          className="p-2 ml-2"
                          data-testid={`delete-${item.id}`}
                          aria-label={`Remove ${item.ingredient}`}
                          style={{
                            color: 'var(--color-error)',
                            fontSize: 'var(--font-size-body)',
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                          }}
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
      </div>

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
              className="flex-1"
              data-testid="add-item-input"
              style={{
                backgroundColor: 'var(--color-bg-primary)',
                border: 'var(--border-width) solid var(--color-border)',
                fontSize: 'var(--font-size-body)',
                color: 'var(--color-text-primary)',
                padding: 'var(--space-2) var(--space-3)',
                borderRadius: 'var(--border-radius-sm)',
              }}
            />
          </div>
          <p
            className="mt-2 mb-4"
            style={{
              fontSize: 'var(--font-size-caption)',
              color: 'var(--color-text-muted)',
            }}
          >
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

      <BottomNav
        primaryAction={{ onClick: openDrawer, label: '+ Add', testId: 'open-add-drawer-btn' }}
      />
    </main>
  );
}
