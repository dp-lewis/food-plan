'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useStore } from '@/store/store';
import { generateShoppingList, groupByCategory, CATEGORY_LABELS } from '@/lib/shoppingList';

export default function ShoppingList() {
  const router = useRouter();
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
      <main className="min-h-screen p-4">
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
      </main>
    );
  }

  const totalItems = shoppingList?.length || 0;
  const checkedCount = checkedItems.length;

  return (
    <main className="min-h-screen p-4 pb-8" data-testid="shopping-list">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <button
              onClick={() => router.back()}
              className="inline-flex items-center gap-1 mb-2"
              style={{
                fontSize: 'var(--font-size-caption)',
                color: 'var(--color-text-muted)',
              }}
            >
              ← Back
            </button>
            <h1
              style={{
                fontSize: 'var(--font-size-heading)',
                fontWeight: 'var(--font-weight-bold)',
                color: 'var(--color-text-primary)',
              }}
            >
              Shopping List
            </h1>
          </div>
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
          <div
            className="h-2 rounded-full mb-6 overflow-hidden"
            style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
          >
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                backgroundColor: 'var(--color-accent)',
                width: `${(checkedCount / totalItems) * 100}%`,
              }}
            />
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
                      <button
                        onClick={() => toggleCheckedItem(item.id)}
                        className="w-full flex items-center gap-3 py-2 px-1 -mx-1 rounded transition-colors"
                        data-testid={`checkbox-${item.id}`}
                        role="checkbox"
                        aria-checked={isChecked}
                        aria-label={`${item.quantity} ${item.unit} ${item.ingredient}`}
                        style={{
                          minHeight: 'var(--touch-target-min)',
                        }}
                      >
                        <span
                          className="w-5 h-5 rounded border flex-shrink-0 flex items-center justify-center transition-colors"
                          style={{
                            borderColor: isChecked ? 'var(--color-accent)' : 'var(--color-border)',
                            backgroundColor: isChecked ? 'var(--color-accent)' : 'transparent',
                          }}
                        >
                          {isChecked && (
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 12 12"
                              fill="none"
                              stroke="white"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <polyline points="2 6 5 9 10 3" />
                            </svg>
                          )}
                        </span>
                        <span
                          className="text-left transition-all"
                          style={{
                            fontSize: 'var(--font-size-body)',
                            color: isChecked ? 'var(--color-text-muted)' : 'var(--color-text-secondary)',
                            textDecoration: isChecked ? 'line-through' : 'none',
                          }}
                        >
                          <span style={{ color: isChecked ? 'var(--color-text-muted)' : 'var(--color-text-muted)' }}>
                            {item.quantity} {item.unit}
                          </span>{' '}
                          {item.ingredient}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
