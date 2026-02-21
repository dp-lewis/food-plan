-- =============================================================================
-- Migration: 00010_recipes_plan_member_access
-- Description: Allow plan owners and members to read recipes that are
--              referenced by meals in plans they have access to.
--
-- Problem: When a plan member adds meals using their own (user-created) recipes,
-- the plan owner cannot read those recipes because the existing RLS policies
-- only allow reading recipes you own (user_id = auth.uid()) or built-in ones
-- (user_id IS NULL). This blocks the owner from seeing the full shopping list
-- and recipe details for meals the member added.
--
-- Fix: Add a SELECT policy that grants access to a recipe when it is
-- referenced by at least one meal in a plan the current user can access.
-- user_has_plan_access() is SECURITY DEFINER so there is no RLS recursion.
-- =============================================================================

CREATE POLICY "Users can read recipes referenced in accessible plans"
  ON recipes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM meals m
      WHERE m.recipe_id = recipes.id
        AND user_has_plan_access(m.meal_plan_id)
    )
  );
