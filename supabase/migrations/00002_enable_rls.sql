-- =============================================================================
-- Migration: 00002_enable_rls
-- Description: Enable Row Level Security and create access policies
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Helper function: user_has_plan_access
-- Returns TRUE if the current auth user owns the given meal plan.
-- SECURITY DEFINER so RLS policies can call it without recursion.
-- The parameter is TEXT to match the meal_plans.id column type.
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION user_has_plan_access(plan_uuid TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM meal_plans
    WHERE id = plan_uuid
      AND user_id = auth.uid()
  );
$$;


-- -----------------------------------------------------------------------------
-- Table: recipes
-- Built-in recipes (user_id IS NULL) are readable by everyone.
-- User-created recipes are only accessible to their owner.
-- -----------------------------------------------------------------------------

ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read built-in recipes"
  ON recipes FOR SELECT
  USING (user_id IS NULL);

CREATE POLICY "Users can read own recipes"
  ON recipes FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own recipes"
  ON recipes FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own recipes"
  ON recipes FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own recipes"
  ON recipes FOR DELETE
  USING (user_id = auth.uid());


-- -----------------------------------------------------------------------------
-- Table: meal_plans
-- All operations restricted to the plan owner.
-- -----------------------------------------------------------------------------

ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own meal plans"
  ON meal_plans FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own meal plans"
  ON meal_plans FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own meal plans"
  ON meal_plans FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own meal plans"
  ON meal_plans FOR DELETE
  USING (user_id = auth.uid());


-- -----------------------------------------------------------------------------
-- Table: meals
-- Access gated via user_has_plan_access on the parent meal plan.
-- -----------------------------------------------------------------------------

ALTER TABLE meals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read meals in own plans"
  ON meals FOR SELECT
  USING (user_has_plan_access(meal_plan_id));

CREATE POLICY "Users can insert meals in own plans"
  ON meals FOR INSERT
  WITH CHECK (user_has_plan_access(meal_plan_id));

CREATE POLICY "Users can update meals in own plans"
  ON meals FOR UPDATE
  USING (user_has_plan_access(meal_plan_id))
  WITH CHECK (user_has_plan_access(meal_plan_id));

CREATE POLICY "Users can delete meals in own plans"
  ON meals FOR DELETE
  USING (user_has_plan_access(meal_plan_id));


-- -----------------------------------------------------------------------------
-- Table: checked_items
-- Access gated via user_has_plan_access. No UPDATE policy — app only
-- inserts and deletes checked items, never updates them.
-- -----------------------------------------------------------------------------

ALTER TABLE checked_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read checked items in own plans"
  ON checked_items FOR SELECT
  USING (user_has_plan_access(meal_plan_id));

CREATE POLICY "Users can insert checked items in own plans"
  ON checked_items FOR INSERT
  WITH CHECK (user_has_plan_access(meal_plan_id));

CREATE POLICY "Users can delete checked items in own plans"
  ON checked_items FOR DELETE
  USING (user_has_plan_access(meal_plan_id));


-- -----------------------------------------------------------------------------
-- Table: custom_shopping_items
-- Access gated via user_has_plan_access on the parent meal plan.
-- -----------------------------------------------------------------------------

ALTER TABLE custom_shopping_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read custom items in own plans"
  ON custom_shopping_items FOR SELECT
  USING (user_has_plan_access(meal_plan_id));

CREATE POLICY "Users can insert custom items in own plans"
  ON custom_shopping_items FOR INSERT
  WITH CHECK (user_has_plan_access(meal_plan_id));

CREATE POLICY "Users can update custom items in own plans"
  ON custom_shopping_items FOR UPDATE
  USING (user_has_plan_access(meal_plan_id))
  WITH CHECK (user_has_plan_access(meal_plan_id));

CREATE POLICY "Users can delete custom items in own plans"
  ON custom_shopping_items FOR DELETE
  USING (user_has_plan_access(meal_plan_id));
