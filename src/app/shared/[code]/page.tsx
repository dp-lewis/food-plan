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
          <h1 className="text-2xl font-semibold text-foreground mb-4">
            Plan Not Found
          </h1>
          <p className="text-muted-foreground text-base">
            This shared plan link is invalid or has been revoked.
          </p>
        </div>
      </main>
    );
  }

  return <SharedPlanView data={sharedData} />;
}
