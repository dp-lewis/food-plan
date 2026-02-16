import { getMealPlanByShareCode } from '@/lib/supabase/queries';
import SharedPlanView from './SharedPlanView';
import PageHeader from '@/components/ui/PageHeader';

export default async function SharedPlanPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const sharedData = await getMealPlanByShareCode(code);

  if (!sharedData) {
    return (
      <div className="min-h-screen bg-background" data-testid="shared-plan-error">
        <PageHeader title="Shared Plan" backHref="/" sticky />
        <main id="main-content" className="p-4 pb-24">
          <div className="max-w-2xl mx-auto text-center py-12">
            <h1 className="text-2xl font-semibold text-foreground mb-4">
              Plan Not Found
            </h1>
            <p className="text-muted-foreground text-base">
              This shared plan link is invalid or has been revoked.
            </p>
          </div>
        </main>
      </div>
    );
  }

  return <SharedPlanView data={sharedData} />;
}
