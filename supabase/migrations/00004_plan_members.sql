-- =============================================================================
-- Migration: 00004_plan_members
-- Description: Add plan_members table for collaborative meal planning.
--              Members can join shared plans and get read access to all
--              plan data via the updated user_has_plan_access() function.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1a. Create plan_members table
-- Design decision: The owner does NOT get a row here. The
-- user_has_plan_access function checks ownership OR membership, so
-- existing plans work without a data migration.
-- -----------------------------------------------------------------------------

CREATE TABLE plan_members (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_plan_id  TEXT        NOT NULL REFERENCES meal_plans(id) ON DELETE CASCADE,
  user_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role          TEXT        NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'member')),
  joined_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (meal_plan_id, user_id)
);

ALTER TABLE plan_members ENABLE ROW LEVEL SECURITY;


-- -----------------------------------------------------------------------------
-- 1b. RLS policies for plan_members
-- -----------------------------------------------------------------------------

-- Users can read their own memberships
CREATE POLICY "Users can read own memberships"
  ON plan_members FOR SELECT
  USING (user_id = auth.uid());

-- Plan owners can read all members of their plans
CREATE POLICY "Owners can read plan members"
  ON plan_members FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM meal_plans
    WHERE id = plan_members.meal_plan_id AND user_id = auth.uid()
  ));

-- Users can insert themselves as member into shared plans only
CREATE POLICY "Users can join shared plans"
  ON plan_members FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND role = 'member'
    AND EXISTS (
      SELECT 1 FROM meal_plans
      WHERE id = meal_plan_id AND share_code IS NOT NULL
    )
  );

-- Users can delete their own membership (leave a plan)
CREATE POLICY "Users can leave plans"
  ON plan_members FOR DELETE
  USING (user_id = auth.uid());


-- -----------------------------------------------------------------------------
-- 1c. Update user_has_plan_access() to include members
-- This cascades to all existing RLS policies on meals, checked_items,
-- and custom_shopping_items that use this function.
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION user_has_plan_access(plan_uuid TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM meal_plans WHERE id = plan_uuid AND user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM plan_members WHERE meal_plan_id = plan_uuid AND user_id = auth.uid()
  );
$$;


-- -----------------------------------------------------------------------------
-- 1d. Members need to SELECT the plan they joined
-- (existing policy only allows user_id = auth.uid())
-- -----------------------------------------------------------------------------

CREATE POLICY "Members can read joined plans"
  ON meal_plans FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM plan_members
    WHERE meal_plan_id = meal_plans.id AND user_id = auth.uid()
  ));
