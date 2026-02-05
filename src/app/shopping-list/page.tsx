'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useStore } from '@/store/store';
import { generateShoppingList, groupByCategory, CATEGORY_LABELS } from '@/lib/shoppingList';
import { BottomNav, ProgressBar, Checkbox } from '@/components/ui';

export default function ShoppingList() {
  const currentPlan = useStore((state) => state.currentPlan);
  const checkedItems = useStore((state) => state.checkedItems);
  const toggleCheckedItem = useStore((state) => state.toggleCheckedItem);
  const userRecipes = useStore((state) => state.userRecipes);

  const shoppingList = useMemo(() => {
    if (!currentPlan) return null;
    return generateShoppingList(currentPlan, userRecipes);
  }, [currentPlan, userRecipes]);

  const groupedItems = useMemo(() => {
    if (!shoppingList) return null;
    return groupByCategory(shoppingList);
  }, [shoppingList]);

  if (!currentPlan || !groupedItems) {
    return (
      <main className="min-h-screen p-4 pb-20">
        <div className="max-w-md mx-auto text-center py-12">
          <p style={{ color: 'var(--color-text-muted)' }}>
            No meal plan found. Create one first.
          </p>
          <Link
            href="/plan"
            className="primary-button inline-flex items-center justify-center mt-4"
          >
            Create Meal Plan
          </Link>
        </div>

        <BottomNav />
      </main>
    );
  }

  const totalItems = shoppingList?.length || 0;
  const checkedCount = checkedItems.length;

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
                marginTop: 'calc(var(--space-4) * -1)',
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
            {checkedCount} / {totalItems} items
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
                  return (
                    <li key={item.id} data-testid={`item-${item.id}`}>
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
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      </div>

      <BottomNav />
    </main>
  );
}
