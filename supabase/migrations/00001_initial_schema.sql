-- =============================================================================
-- Migration: 00001_initial_schema
-- Description: Initial database schema for Food Plan
-- =============================================================================


-- -----------------------------------------------------------------------------
-- Enum Types
-- -----------------------------------------------------------------------------

CREATE TYPE meal_type AS ENUM ('breakfast', 'lunch', 'dinner');

CREATE TYPE difficulty AS ENUM ('easy', 'medium', 'hard');

CREATE TYPE budget_level AS ENUM ('low', 'medium', 'high');

CREATE TYPE ingredient_category AS ENUM (
  'produce',
  'dairy',
  'meat',
  'pantry',
  'frozen',
  'uncategorized'
);


-- -----------------------------------------------------------------------------
-- Function: update_updated_at
-- Automatically sets updated_at = now() on row update
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- -----------------------------------------------------------------------------
-- Table: recipes
-- Stores both built-in recipes (user_id IS NULL) and user-created recipes
-- -----------------------------------------------------------------------------

CREATE TABLE recipes (
  id            TEXT        PRIMARY KEY,
  title         TEXT        NOT NULL,
  description   TEXT,
  meal_type     meal_type   NOT NULL,
  prep_time     INTEGER     NOT NULL,
  cook_time     INTEGER     NOT NULL,
  servings      INTEGER     NOT NULL,
  difficulty    difficulty  NOT NULL,
  tags          TEXT[]      NOT NULL DEFAULT '{}',
  estimated_cost budget_level NOT NULL,
  -- Stores array of {name, quantity, unit, category} objects
  ingredients   JSONB       NOT NULL,
  instructions  TEXT[]      NOT NULL,
  source_url    TEXT,
  source_name   TEXT,
  notes         TEXT,
  -- NULL for built-in recipes; set for user-created recipes
  user_id       UUID        REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER recipes_updated_at
  BEFORE UPDATE ON recipes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

ALTER TABLE recipes DISABLE ROW LEVEL SECURITY;


-- -----------------------------------------------------------------------------
-- Table: meal_plans
-- A meal plan belongs to a user (or is anonymous when user_id IS NULL)
-- -----------------------------------------------------------------------------

CREATE TABLE meal_plans (
  id          TEXT        PRIMARY KEY,
  user_id     UUID        REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Stores MealPlanPreferences e.g. {"startDay": 0}
  preferences JSONB       NOT NULL DEFAULT '{}',
  -- Forward-looking: used for the plan sharing feature
  share_code  TEXT        UNIQUE
);

CREATE TRIGGER meal_plans_updated_at
  BEFORE UPDATE ON meal_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

ALTER TABLE meal_plans DISABLE ROW LEVEL SECURITY;


-- -----------------------------------------------------------------------------
-- Table: meals
-- Individual meal slots within a meal plan
-- -----------------------------------------------------------------------------

CREATE TABLE meals (
  id           TEXT      PRIMARY KEY,
  meal_plan_id TEXT      NOT NULL REFERENCES meal_plans(id) ON DELETE CASCADE,
  day_index    INTEGER   NOT NULL CHECK (day_index BETWEEN 0 AND 6),
  meal_type    meal_type NOT NULL,
  recipe_id    TEXT      NOT NULL REFERENCES recipes(id) ON DELETE RESTRICT,
  servings     INTEGER   NOT NULL DEFAULT 4
);

ALTER TABLE meals DISABLE ROW LEVEL SECURITY;


-- -----------------------------------------------------------------------------
-- Table: checked_items
-- Tracks which shopping list items have been checked off for a given plan.
-- Shared across users for collaborative shopping (checked_by records who did it).
-- -----------------------------------------------------------------------------

CREATE TABLE checked_items (
  id           UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_plan_id TEXT  NOT NULL REFERENCES meal_plans(id) ON DELETE CASCADE,
  -- Logical item ID (ingredient key or 'custom-*' for custom items)
  item_id      TEXT  NOT NULL,
  checked_by   UUID  REFERENCES auth.users(id) ON DELETE SET NULL,
  UNIQUE (meal_plan_id, item_id)
);

ALTER TABLE checked_items DISABLE ROW LEVEL SECURITY;


-- -----------------------------------------------------------------------------
-- Table: custom_shopping_items
-- User-added items that are not derived from any recipe
-- -----------------------------------------------------------------------------

CREATE TABLE custom_shopping_items (
  id           TEXT               PRIMARY KEY,
  meal_plan_id TEXT               NOT NULL REFERENCES meal_plans(id) ON DELETE CASCADE,
  ingredient   TEXT               NOT NULL,
  quantity     NUMERIC            NOT NULL DEFAULT 1,
  unit         TEXT               NOT NULL DEFAULT '',
  category     ingredient_category NOT NULL DEFAULT 'uncategorized'
);

ALTER TABLE custom_shopping_items DISABLE ROW LEVEL SECURITY;
