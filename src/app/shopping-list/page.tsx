'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useStore } from '@/store/store';
import { generateShoppingList, groupByCategory, CATEGORY_LABELS } from '@/lib/shoppingList';

export default function ShoppingList() {
  const router = useRouter();
  const currentPlan = useStore((state) => state.currentPlan);

  const shoppingList = useMemo(() => {
    if (!currentPlan) return null;
    return generateShoppingList(currentPlan);
  }, [currentPlan]);

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

  return (
    <main className="min-h-screen p-4 pb-8">
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
            style={{
              fontSize: 'var(--font-size-caption)',
              color: 'var(--color-text-muted)',
            }}
          >
            {totalItems} items
          </span>
        </div>

        {/* Grouped list */}
        <div className="space-y-6">
          {Array.from(groupedItems.entries()).map(([category, items]) => (
            <section key={category}>
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
              <ul className="space-y-2">
                {items.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center gap-3 py-2"
                  >
                    <span
                      className="w-5 h-5 rounded border flex-shrink-0"
                      style={{ borderColor: 'var(--color-border)' }}
                    />
                    <span
                      style={{
                        fontSize: 'var(--font-size-body)',
                        color: 'var(--color-text-secondary)',
                      }}
                    >
                      <span style={{ color: 'var(--color-text-muted)' }}>
                        {item.quantity} {item.unit}
                      </span>{' '}
                      {item.ingredient}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
