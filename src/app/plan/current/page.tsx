'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useStore } from '@/store/store';
import { getRecipesByMealType } from '@/data/recipes';
import { getTodayPlanIndex, getOrderedDays } from '@/lib/dates';
import { MealType } from '@/types';
import RecipeDrawer from '@/components/RecipeDrawer';
import SignOutDialog from '@/components/SignOutDialog';
import { BottomNav, Button, Card, Drawer, Input, PageHeader, Toast } from '@/components/ui';
import { useAuth } from '@/components/AuthProvider';
import {
  generateShareLink,
  leavePlanAction,
  getPlanMembersAction,
  regenerateShareLinkAction,
  revokeShareLink,
  type MemberInfo,
} from '@/app/actions/share';
import { deletePlanAction } from '@/app/actions/mealPlan';
import DaySlot from '@/components/plan/DaySlot';
import PlanMembersRow from '@/components/plan/PlanMembersRow';

const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner'];

type DrawerMode = 'swap' | 'add';

interface DrawerState {
  isOpen: boolean;
  mode: DrawerMode;
  mealId: string | null;
  dayIndex: number | null;
  mealType: MealType | null;
  currentRecipeId: string | null;
  excludeRecipeIds: string[];
}

export default function CurrentPlan() {
  const router = useRouter();
  const currentPlan = useStore((state) => state.currentPlan);
  const planRole = useStore((state) => state._planRole);
  const swapMeal = useStore((state) => state.swapMeal);
  const addMeal = useStore((state) => state.addMeal);
  const removeMeal = useStore((state) => state.removeMeal);
  const userRecipes = useStore((state) => state.userRecipes);
  const clearCurrentPlan = useStore((state) => state._clearCurrentPlan);

  const { user, loading: authLoading } = useAuth();
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastVariant, setToastVariant] = useState<'success' | 'error'>('success');
  const [leavePlanDrawerOpen, setLeavePlanDrawerOpen] = useState(false);
  const [leaveLoading, setLeaveLoading] = useState(false);
  const [deletePlanDrawerOpen, setDeletePlanDrawerOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Share drawer state
  const [shareDrawerOpen, setShareDrawerOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [shareLoading, setShareLoading] = useState(false);
  const [revokeLoading, setRevokeLoading] = useState(false);
  const [regenerateLoading, setRegenerateLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Plan members state
  const [members, setMembers] = useState<{ email: string; role: 'owner' | 'member' }[]>([]);

  const [drawerState, setDrawerState] = useState<DrawerState>({
    isOpen: false,
    mode: 'swap',
    mealId: null,
    dayIndex: null,
    mealType: null,
    currentRecipeId: null,
    excludeRecipeIds: [],
  });

  const openSwapDrawer = (mealId: string, mealType: MealType, currentRecipeId: string) => {
    setDrawerState({
      isOpen: true,
      mode: 'swap',
      mealId,
      dayIndex: null,
      mealType,
      currentRecipeId,
      excludeRecipeIds: [],
    });
  };

  const openAddDrawer = (dayIndex: number, mealType: MealType, excludeRecipeIds: string[]) => {
    setDrawerState({
      isOpen: true,
      mode: 'add',
      mealId: null,
      dayIndex,
      mealType,
      currentRecipeId: null,
      excludeRecipeIds,
    });
  };

  const closeDrawer = () => {
    setDrawerState({
      isOpen: false,
      mode: 'swap',
      mealId: null,
      dayIndex: null,
      mealType: null,
      currentRecipeId: null,
      excludeRecipeIds: [],
    });
  };

  const handleSelectRecipe = (recipeId: string) => {
    if (drawerState.mode === 'swap' && drawerState.mealId) {
      swapMeal(drawerState.mealId, recipeId);
    } else if (drawerState.mode === 'add' && drawerState.dayIndex !== null && drawerState.mealType) {
      addMeal(drawerState.dayIndex, drawerState.mealType, recipeId);
    }
  };

  const handleSurpriseMe = () => {
    if (drawerState.mode === 'swap' && drawerState.mealId) {
      swapMeal(drawerState.mealId);
    } else if (drawerState.mode === 'add' && drawerState.dayIndex !== null && drawerState.mealType) {
      const availableRecipes = getRecipesByMealType(drawerState.mealType, userRecipes)
        .filter(r => !drawerState.excludeRecipeIds.includes(r.id));
      if (availableRecipes.length > 0) {
        const randomRecipe = availableRecipes[Math.floor(Math.random() * availableRecipes.length)];
        addMeal(drawerState.dayIndex, drawerState.mealType, randomRecipe.id);
      }
    }
  };

  const handleLeavePlan = async () => {
    setLeaveLoading(true);
    try {
      const result = await leavePlanAction();
      if (!result.success) {
        setToastVariant('error');
        setToastMessage(result.error ?? 'Failed to leave plan');
        return;
      }
      clearCurrentPlan();
      router.push('/');
    } catch {
      setToastVariant('error');
      setToastMessage('Failed to leave plan');
    } finally {
      setLeaveLoading(false);
      setLeavePlanDrawerOpen(false);
    }
  };

  const handleDeletePlan = async () => {
    if (!currentPlan) return;
    setDeleteLoading(true);
    try {
      const result = await deletePlanAction(currentPlan.id);
      if (!result.success) {
        setToastVariant('error');
        setToastMessage(result.error ?? 'Failed to delete plan');
        return;
      }
      clearCurrentPlan();
      router.push('/');
    } catch {
      setToastVariant('error');
      setToastMessage('Failed to delete plan');
    } finally {
      setDeleteLoading(false);
      setDeletePlanDrawerOpen(false);
    }
  };

  // Open share drawer: load or generate the current share URL
  const handleOpenShareDrawer = async () => {
    if (!currentPlan) return;
    setShareDrawerOpen(true);
    setShareLoading(true);
    try {
      const result = await generateShareLink(currentPlan.id);
      if (result.error) {
        setToastVariant('error');
        setToastMessage(result.error ?? 'Failed to load share link');
        setShareDrawerOpen(false);
        return;
      }
      setShareUrl(result.data ?? null);
    } catch {
      setToastVariant('error');
      setToastMessage('Failed to load share link');
      setShareDrawerOpen(false);
    } finally {
      setShareLoading(false);
    }
  };

  const handleCopyShareLink = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setToastVariant('error');
      setToastMessage('Failed to copy link');
    }
  };

  const handleRegenerateShareLink = async () => {
    if (!currentPlan) return;
    setRegenerateLoading(true);
    try {
      const result = await regenerateShareLinkAction(currentPlan.id);
      if (!result.success) {
        setToastVariant('error');
        setToastMessage(result.error ?? 'Failed to regenerate share link');
        return;
      }
      setShareUrl(result.url);
      setToastVariant('success');
      setToastMessage('New share link generated');
    } catch {
      setToastVariant('error');
      setToastMessage('Failed to regenerate share link');
    } finally {
      setRegenerateLoading(false);
    }
  };

  const handleRevokeShareLink = async () => {
    if (!currentPlan) return;
    setRevokeLoading(true);
    try {
      const result = await revokeShareLink(currentPlan.id);
      if (result.error) {
        setToastVariant('error');
        setToastMessage(result.error ?? 'Failed to revoke share link');
        return;
      }
      setShareUrl(null);
      setShareDrawerOpen(false);
      setToastVariant('success');
      setToastMessage('Share link revoked');
    } catch {
      setToastVariant('error');
      setToastMessage('Failed to revoke share link');
    } finally {
      setRevokeLoading(false);
    }
  };

  // Hooks must be called unconditionally before any early returns.
  const orderedDays = useMemo(
    () => getOrderedDays(currentPlan?.preferences.startDay ?? 0),
    [currentPlan?.preferences.startDay]
  );

  // Build 7 days × 3 meal slots — memoized so DOM nodes are stable across
  // re-renders that don't change plan data (e.g. opening/closing the drawer).
  const slotsByDay = useMemo(
    () =>
      orderedDays.map((dayName, dayIndex) => {
        const slots = MEAL_TYPES.map(mealType => ({
          mealType,
          meals: (currentPlan?.meals ?? []).filter(
            m => m.dayIndex === dayIndex && m.mealType === mealType
          ),
        }));
        return { dayName, dayIndex, slots };
      }),
    [currentPlan?.meals, orderedDays]
  );

  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    const unsub = useStore.persist.onHydrate(() => {/* no-op */});
    const unsubFinish = useStore.persist.onFinishHydration(() => {
      setHasHydrated(true);
    });
    if (useStore.persist.hasHydrated()) {
      setHasHydrated(true);
    }
    return () => {
      unsub();
      unsubFinish();
    };
  }, []);

  useEffect(() => {
    if (hasHydrated && !currentPlan) {
      router.push('/');
    }
  }, [hasHydrated, currentPlan, router]);

  // Load plan members when planRole is set (this is a shared plan)
  useEffect(() => {
    if (!planRole || !currentPlan) return;
    getPlanMembersAction(currentPlan.id).then((result) => {
      if (result.success) {
        setMembers(
          result.members
            .filter((m: MemberInfo) => m.userEmail !== '')
            .map((m: MemberInfo) => ({ email: m.userEmail, role: m.role }))
        );
      }
    });
  }, [planRole, currentPlan]);

  const todayIndex = useMemo(() => {
    if (!currentPlan) return 0;
    const { weekStart, startDay } = currentPlan.preferences;
    if (weekStart) {
      const today = new Date();
      const start = new Date(weekStart + 'T12:00:00');
      const diffMs = today.getTime() - start.getTime();
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
      // Return day index if today is within the plan week, else -1 (no day highlighted)
      return (diffDays >= 0 && diffDays < 7) ? diffDays : -1;
    }
    return getTodayPlanIndex(startDay);
  }, [currentPlan]);

  if (!hasHydrated || !currentPlan) {
    return (
      <div className="min-h-screen bg-primary" data-testid="meal-plan">
        <PageHeader title="Meal Plan" backHref="/" sticky />
        <main id="main-content" className="bg-background rounded-t-3xl max-w-2xl mx-auto px-4 py-8 pb-40 space-y-8">
          <div className="flex items-center justify-end">
            <div className="h-4 w-28 bg-muted animate-pulse rounded" />
          </div>
          <div className="space-y-4">
            {[0, 1, 2].map((i) => (
              <Card key={i} padding="none">
                <div className="px-4 py-2 bg-muted">
                  <div className="h-5 w-24 bg-muted-foreground/10 animate-pulse rounded" />
                  <div className="h-3 w-16 bg-muted-foreground/10 animate-pulse rounded mt-1" />
                </div>
                <div className="divide-y divide-border">
                  {[0, 1, 2].map((j) => (
                    <div key={j} className="px-4 py-4">
                      <div className="h-3 w-16 bg-muted animate-pulse rounded mb-2" />
                      <div className="h-5 w-48 bg-muted animate-pulse rounded mb-1" />
                      <div className="h-3 w-20 bg-muted animate-pulse rounded" />
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </main>
        <BottomNav />
      </div>
    );
  }

  const drawerRecipes = drawerState.mealType
    ? getRecipesByMealType(drawerState.mealType, userRecipes)
        .filter(r => !drawerState.excludeRecipeIds.includes(r.id))
    : [];

  return (
    <div className="min-h-screen bg-primary" data-testid="meal-plan">
      <PageHeader
        title="Meal Plan"
        backHref="/"
        sticky
        actions={
          !authLoading && (
            <SignOutDialog userEmail={user?.email} />
          )
        }
      />
      <main id="main-content" className="bg-background rounded-t-3xl max-w-2xl mx-auto px-4 py-8 pb-40 space-y-8">
        {planRole === 'member' ? (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground bg-muted px-3 py-1 rounded-full" data-testid="shared-plan-badge">
              Shared with you
            </span>
            <Button
              variant="ghost"
              size="small"
              data-testid="leave-plan-button"
              onClick={() => setLeavePlanDrawerOpen(true)}
            >
              Leave Plan
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-end gap-4">
            <Link href="/plan" className="text-sm text-primary">
              Reset plan
            </Link>
            {planRole === 'owner' && (
              <Button
                variant="ghost"
                size="small"
                data-testid="delete-plan-button"
                onClick={() => setDeletePlanDrawerOpen(true)}
              >
                Delete Plan
              </Button>
            )}
          </div>
        )}

        {members.length >= 2 && (
          <PlanMembersRow members={members} />
        )}

        <div className="space-y-4">
          {slotsByDay.map(({ dayName, dayIndex, slots }) => (
            <DaySlot
              key={dayName}
              dayName={dayName}
              dayIndex={dayIndex}
              isToday={dayIndex === todayIndex}
              startDay={currentPlan.preferences.startDay}
              weekStart={currentPlan.preferences.weekStart}
              slots={slots}
              userRecipes={userRecipes}
              onAddMeal={openAddDrawer}
              onRemoveMeal={removeMeal}
            />
          ))}
        </div>
      </main>

      <BottomNav onShareClick={planRole === 'owner' && user ? handleOpenShareDrawer : undefined} />

      <RecipeDrawer
        isOpen={drawerState.isOpen}
        onClose={closeDrawer}
        mealType={drawerState.mealType}
        currentRecipeId={drawerState.currentRecipeId}
        recipes={drawerRecipes}
        onSelectRecipe={handleSelectRecipe}
        onSurpriseMe={handleSurpriseMe}
        mode={drawerState.mode}
      />

      <Toast
        message={toastMessage}
        variant={toastVariant}
        onDismiss={() => setToastMessage(null)}
      />

      <Drawer
        isOpen={shareDrawerOpen}
        onClose={() => setShareDrawerOpen(false)}
        title="Share this plan"
      >
        <div data-testid="share-drawer">
          {shareLoading ? (
            <div className="py-4 text-sm text-muted-foreground">Loading share link…</div>
          ) : shareUrl ? (
            <div className="space-y-4">
              <div className="flex gap-2 items-center">
                <Input
                  readOnly
                  value={shareUrl}
                  className="flex-1"
                  aria-label="Share link"
                />
                <Button
                  variant="primary"
                  size="small"
                  data-testid="copy-share-link"
                  onClick={handleCopyShareLink}
                  disabled={copied}
                >
                  {copied ? 'Copied ✓' : 'Copy'}
                </Button>
              </div>
              <div className="flex gap-4">
                <Button
                  variant="secondary"
                  className="flex-1"
                  data-testid="regenerate-share-link"
                  onClick={handleRegenerateShareLink}
                  loading={regenerateLoading}
                  disabled={revokeLoading}
                >
                  New link
                </Button>
                <Button
                  variant="ghost"
                  className="flex-1 text-destructive"
                  data-testid="revoke-share-link"
                  onClick={handleRevokeShareLink}
                  loading={revokeLoading}
                  disabled={regenerateLoading}
                >
                  Revoke link
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                No active share link. Generate one to share this plan.
              </p>
              <Button
                variant="primary"
                className="w-full"
                onClick={handleOpenShareDrawer}
                loading={shareLoading}
              >
                Generate link
              </Button>
            </div>
          )}
        </div>
      </Drawer>

      <Drawer
        isOpen={leavePlanDrawerOpen}
        onClose={() => setLeavePlanDrawerOpen(false)}
        title="Leave Plan"
      >
        <p className="text-sm text-muted-foreground mb-6">
          Leave this plan? You&apos;ll return to an empty plan.
        </p>
        <div className="flex gap-4">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={() => setLeavePlanDrawerOpen(false)}
            disabled={leaveLoading}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            className="flex-1"
            data-testid="confirm-leave-plan"
            onClick={handleLeavePlan}
            loading={leaveLoading}
          >
            Confirm
          </Button>
        </div>
      </Drawer>

      <Drawer
        isOpen={deletePlanDrawerOpen}
        onClose={() => setDeletePlanDrawerOpen(false)}
        title="Delete Plan"
      >
        <p className="text-sm text-muted-foreground mb-6">
          Delete this plan? This is permanent and will remove it for all members.
        </p>
        <div className="flex gap-4">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={() => setDeletePlanDrawerOpen(false)}
            disabled={deleteLoading}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            className="flex-1 bg-destructive text-destructive-foreground"
            data-testid="confirm-delete-plan"
            onClick={handleDeletePlan}
            loading={deleteLoading}
          >
            Delete
          </Button>
        </div>
      </Drawer>
    </div>
  );
}
