-- =============================================================================
-- Migration: 00005_fix_plan_members_rls_recursion
-- Description: Fix infinite RLS recursion between meal_plans and plan_members.
--              The "Members can read joined plans" policy on meal_plans queries
--              plan_members, and the "Owners can read plan members" policy on
--              plan_members queries meal_plans — creating a circular dependency.
--              Fix: use SECURITY DEFINER helper functions to bypass RLS on
--              the inner lookups.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Helper: user_is_plan_member
-- Returns TRUE if the current user has a row in plan_members for this plan.
-- SECURITY DEFINER bypasses RLS on plan_members, breaking the cycle.
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION user_is_plan_member(plan_uuid TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM plan_members
    WHERE meal_plan_id = plan_uuid AND user_id = auth.uid()
  );
$$;

-- -----------------------------------------------------------------------------
-- Helper: user_owns_plan
-- Returns TRUE if the current user owns the given plan.
-- SECURITY DEFINER bypasses RLS on meal_plans, breaking the cycle.
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION user_owns_plan(plan_uuid TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM meal_plans
    WHERE id = plan_uuid AND user_id = auth.uid()
  );
$$;

-- -----------------------------------------------------------------------------
-- Replace the recursive policies with function-based versions
-- -----------------------------------------------------------------------------

-- Drop the recursive policies
DROP POLICY "Members can read joined plans" ON meal_plans;
DROP POLICY "Owners can read plan members" ON plan_members;

-- Recreate using SECURITY DEFINER functions (no recursion)
CREATE POLICY "Members can read joined plans"
  ON meal_plans FOR SELECT
  USING (user_is_plan_member(id));

CREATE POLICY "Owners can read plan members"
  ON plan_members FOR SELECT
  USING (user_owns_plan(meal_plan_id));

-- Also fix the INSERT policy on plan_members which queries meal_plans
DROP POLICY "Users can join shared plans" ON plan_members;

CREATE POLICY "Users can join shared plans"
  ON plan_members FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND role = 'member'
    AND plan_is_shared(meal_plan_id)
  );
