import Link from "next/link";

export default function CreatePlan() {
  return (
    <main className="min-h-screen p-4">
      <div className="max-w-md mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-1 mb-6"
          style={{
            fontSize: 'var(--font-size-caption)',
            color: 'var(--color-text-muted)'
          }}
        >
          ← Back
        </Link>

        <h1
          style={{
            fontSize: 'var(--font-size-heading)',
            fontWeight: 'var(--font-weight-bold)',
            color: 'var(--color-text-primary)',
            lineHeight: 'var(--line-height-tight)'
          }}
        >
          Create Meal Plan
        </h1>

        <p
          className="mt-2"
          style={{
            fontSize: 'var(--font-size-body)',
            color: 'var(--color-text-muted)'
          }}
        >
          Coming soon — US-1.1
        </p>
      </div>
    </main>
  );
}
