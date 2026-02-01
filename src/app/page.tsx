import Link from "next/link";

export default function Dashboard() {
  // TODO: Check localStorage for existing meal plan
  const hasMealPlan = false;

  if (hasMealPlan) {
    // TODO: Show meal plan summary (US-5.1)
    return null;
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Icon */}
        <div
          className="mx-auto mb-6 w-16 h-16 rounded-full flex items-center justify-center text-3xl"
          style={{ backgroundColor: 'var(--color-accent-light)' }}
        >
          🍽️
        </div>

        {/* Heading */}
        <h1
          className="mb-3"
          style={{
            fontSize: 'var(--font-size-heading)',
            fontWeight: 'var(--font-weight-bold)',
            color: 'var(--color-text-primary)',
            lineHeight: 'var(--line-height-tight)'
          }}
        >
          Plan your meals for the week
        </h1>

        {/* Description */}
        <p
          className="mb-8"
          style={{
            fontSize: 'var(--font-size-body)',
            color: 'var(--color-text-secondary)'
          }}
        >
          Generate a weekly meal plan, get recipes, and create a shopping list — all in one place.
        </p>

        {/* Primary CTA */}
        <Link
          href="/plan"
          className="primary-button inline-flex items-center justify-center w-full"
        >
          Create Your First Plan
        </Link>

        {/* Features list */}
        <ul
          className="mt-8 text-left space-y-3"
          style={{
            fontSize: 'var(--font-size-caption)',
            color: 'var(--color-text-muted)'
          }}
        >
          <li className="flex items-start gap-2">
            <span style={{ color: 'var(--color-accent)' }}>✓</span>
            <span>Personalised meal plans based on your preferences</span>
          </li>
          <li className="flex items-start gap-2">
            <span style={{ color: 'var(--color-accent)' }}>✓</span>
            <span>Auto-generated shopping lists grouped by aisle</span>
          </li>
          <li className="flex items-start gap-2">
            <span style={{ color: 'var(--color-accent)' }}>✓</span>
            <span>Easy meal swapping when plans change</span>
          </li>
        </ul>
      </div>
    </main>
  );
}
