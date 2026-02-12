-- =============================================================================
-- Migration: 00003_share_plan_rls
-- Description: Add SELECT policies for anonymous read access to shared plans
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Helper function: plan_is_shared
-- Returns TRUE if the given meal plan exists AND has a non-null share_code.
-- SECURITY DEFINER so RLS policies can call it without recursion.
-- The parameter is TEXT to match the meal_plans.id column type.
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION plan_is_shared(plan_uuid TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM meal_plans
    WHERE id = plan_uuid
      AND share_code IS NOT NULL
  );
$$;


-- -----------------------------------------------------------------------------
-- Table: meal_plans
-- Adds anonymous read access for plans that have a share_code set.
-- -----------------------------------------------------------------------------

CREATE POLICY "Anyone can read shared meal plans"
  ON meal_plans FOR SELECT
  USING (share_code IS NOT NULL);


-- -----------------------------------------------------------------------------
-- Table: meals
-- Adds anonymous read access for meals belonging to a shared plan.
-- -----------------------------------------------------------------------------

CREATE POLICY "Anyone can read meals in shared plans"
  ON meals FOR SELECT
  USING (plan_is_shared(meal_plan_id));


-- -----------------------------------------------------------------------------
-- Table: recipes
-- Adds anonymous read access for recipes that appear in a shared plan.
-- -----------------------------------------------------------------------------

CREATE POLICY "Anyone can read recipes in shared plans"
  ON recipes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM meals m
      JOIN meal_plans mp ON m.meal_plan_id = mp.id
      WHERE m.recipe_id = recipes.id
        AND mp.share_code IS NOT NULL
    )
  );


-- -----------------------------------------------------------------------------
-- Table: custom_shopping_items
-- Adds anonymous read access for custom items belonging to a shared plan.
-- -----------------------------------------------------------------------------

CREATE POLICY "Anyone can read custom items in shared plans"
  ON custom_shopping_items FOR SELECT
  USING (plan_is_shared(meal_plan_id));
