import { getMealPlanByShareCode } from '@/lib/supabase/queries';
import SharedPlanView from './SharedPlanView';

export default async function SharedPlanPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const sharedData = await getMealPlanByShareCode(code);

  if (!sharedData) {
    return (
      <main className="min-h-screen p-4 pb-24" data-testid="shared-plan-error">
        <div className="max-w-2xl mx-auto text-center py-12">
          <h1
            style={{
              fontSize: 'var(--font-size-heading)',
              fontWeight: 'var(--font-weight-bold)',
              color: 'var(--color-text-primary)',
              marginBottom: 'var(--space-4)',
            }}
          >
            Plan Not Found
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-body)' }}>
            This shared plan link is invalid or has been revoked.
          </p>
        </div>
      </main>
    );
  }

  return <SharedPlanView data={sharedData} />;
}
