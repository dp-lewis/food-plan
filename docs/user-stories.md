# Food Plan - User Stories (Prototype)

> **Scope**: Phase 0 prototype only. For production features (auth, AI), see future planning docs.
>
> **Format**: As a [user], I want [goal] so that [benefit]

---

## Epic 1: Meal Plan Creation

### US-1.1: Create a new meal plan

**As a** family meal planner
**I want to** generate a weekly meal plan based on my preferences
**So that** I don't have to decide what to cook each day

**Acceptance Criteria:**
- [ ] Can specify number of days (1-7, default: 7)
- [ ] Can select which meals to plan (breakfast, lunch, dinner)
- [ ] Clicking "Generate Plan" creates a plan from available recipes
- [ ] Plan is saved to localStorage
- [ ] Redirects to plan view after generation

---

### US-1.2: Use smart defaults

**As a** busy parent
**I want** the form to have sensible defaults pre-filled
**So that** I can generate a plan quickly without configuring everything

**Acceptance Criteria:**
- [ ] Days defaults to 7
- [ ] All meal types (breakfast, lunch, dinner) selected by default
- [ ] Can generate a plan with zero changes to defaults

---

## Epic 2: View Meal Plan

### US-2.1: View weekly calendar

**As a** family meal planner
**I want to** see my meal plan displayed as a weekly calendar
**So that** I can see at a glance what we're eating each day

**Acceptance Criteria:**
- [ ] Shows days in a list layout
- [ ] Each day shows meal slots (breakfast, lunch, dinner)
- [ ] Each slot shows all assigned meals (zero or more)
- [ ] Each meal displays the recipe name and prep time
- [ ] Empty slots show "No meals planned" with add option
- [ ] Works on mobile (responsive layout)

---

### US-2.2: View recipe from calendar

**As a** home cook
**I want to** tap on a meal to see the full recipe
**So that** I can see ingredients and cooking instructions

**Acceptance Criteria:**
- [ ] Tapping a meal opens the recipe detail view
- [ ] Can navigate back to the calendar from recipe view

---

### US-2.3: Manage meals in plan

**As a** family meal planner
**I want to** add and remove meals from any slot
**So that** I can customise the plan for fussy eaters or eating out

**Acceptance Criteria:**
- [ ] Each meal has a "Remove" button
- [ ] Each slot has an "Add" button that opens recipe drawer
- [ ] Can add multiple meals to the same slot
- [ ] Can remove all meals from a slot (empty slot is valid)
- [ ] Adding a meal opens drawer filtered by meal type
- [ ] Can use "Surprise me" when adding a meal
- [ ] Changes are saved to localStorage
- [ ] Can dismiss drawer without making changes

---

### US-2.4: Handle empty meal slots

**As a** meal planner
**I want to** leave some meal slots empty
**So that** I can plan for eating out or skipping meals

**Acceptance Criteria:**
- [ ] Empty slots display "No meals planned"
- [ ] Empty slots still show "Add" button
- [ ] Shopping list excludes empty slots (no ingredients)
- [ ] Dashboard handles days with empty slots gracefully

---

## Epic 3: Recipe View

### US-3.1: View recipe details

**As a** home cook
**I want to** see full recipe details including ingredients and steps
**So that** I can prepare the meal

**Acceptance Criteria:**
- [ ] Shows recipe title
- [ ] Shows prep time and cook time
- [ ] Shows number of servings
- [ ] Shows difficulty level
- [ ] Shows list of ingredients with quantities
- [ ] Shows step-by-step instructions
- [ ] Shows estimated cost (low/medium/high)

---

### US-3.2: Adjust servings (stretch goal)

**As a** meal planner
**I want to** see adjusted ingredient quantities for different serving sizes
**So that** I can scale recipes up or down for my family

**Acceptance Criteria:**
- [ ] Can change serving count
- [ ] Ingredient quantities update automatically
- [ ] Original recipe servings shown for reference

---

## Epic 4: Shopping List

### US-4.1: View shopping list

**As a** grocery shopper
**I want to** see a shopping list generated from my meal plan
**So that** I know what to buy at the store

**Acceptance Criteria:**
- [ ] Shopping list is auto-generated from the current meal plan
- [ ] Ingredients are grouped by category (produce, dairy, meat, pantry, frozen)
- [ ] Duplicate ingredients are combined (e.g., "2 cups flour" + "1 cup flour" = "3 cups flour")
- [ ] Shows quantity and unit for each item

---

### US-4.2: Check off items

**As a** grocery shopper
**I want to** check off items as I add them to my cart
**So that** I can track my progress through the store

**Acceptance Criteria:**
- [ ] Can tap an item to mark it as checked
- [ ] Checked items are visually distinct (strikethrough, dimmed, or moved)
- [ ] Checked state persists in localStorage
- [ ] Can uncheck an item

---

### US-4.3: Clear checked items

**As a** grocery shopper
**I want to** clear all checked items from the list
**So that** I can see only what's remaining

**Acceptance Criteria:**
- [ ] "Clear checked" button available
- [ ] Removes or hides all checked items
- [ ] Confirmation not required (can regenerate list if needed)

---

## Epic 5: Dashboard

### US-5.1: View current plan summary

**As a** returning user
**I want to** see a summary of my current meal plan on the home screen
**So that** I can quickly access this week's meals

**Acceptance Criteria:**
- [ ] Dashboard shows current meal plan if one exists
- [ ] Shows "Up Next" meal slot prominently (all meals in that slot)
- [ ] Plan day calculated from creation date (day 0 = day plan was created)
- [ ] Shows tomorrow preview before 3pm
- [ ] Shows shopping list progress (X of Y items checked)
- [ ] Quick link to full calendar view
- [ ] Quick link to shopping list

---

### US-5.2: Create new plan from dashboard

**As a** new or returning user
**I want to** easily create a new meal plan from the dashboard
**So that** I can start planning my week

**Acceptance Criteria:**
- [ ] "Create New Plan" button visible on dashboard
- [ ] If no plan exists, this is the primary action
- [ ] If plan exists, option to create new plan (replaces current)

---

### US-5.3: Empty state for new users

**As a** first-time user
**I want to** see a clear call-to-action when I have no meal plan
**So that** I know how to get started

**Acceptance Criteria:**
- [ ] Empty state shown when no plan exists
- [ ] Clear "Create Your First Plan" button
- [ ] Brief explanation of what the app does

---

## Epic 6: Data Persistence

### US-6.1: Persist data across sessions

**As a** user
**I want** my meal plan and shopping list to persist when I close the browser
**So that** I don't lose my data

**Acceptance Criteria:**
- [ ] Meal plan survives browser close/reopen
- [ ] Shopping list checked state survives browser close/reopen
- [ ] Preferences survive browser close/reopen

---

## Epic 7: User Recipes

### US-7.1: Import recipe from URL

**As a** home cook
**I want to** import recipes from my favourite food websites
**So that** I can include trusted recipes in my meal plans

**Acceptance Criteria:**
- [ ] Can navigate to "My Recipes" from the dashboard
- [ ] Can enter a URL to import a recipe
- [ ] Recipe title and ingredients are extracted from the page
- [ ] Can select meal type (breakfast, lunch, dinner) for imported recipe
- [ ] Can adjust ingredient categories before saving
- [ ] Saved recipes appear in "My Recipes" list
- [ ] Imported recipes link to original website for cooking instructions
- [ ] Imported recipe ingredients appear on shopping list when used in a plan

---

### US-7.2: Create recipe manually

**As a** family meal planner
**I want to** add simple recipes manually without needing a URL
**So that** I can include our family staples like "Schnitzel and salad" in meal plans

**Acceptance Criteria:**
- [ ] Can navigate to manual recipe form from My Recipes
- [ ] Can enter a recipe title
- [ ] Can select meal type (breakfast, lunch, dinner)
- [ ] Can add multiple ingredients with quantities
- [ ] Can set ingredient categories for shopping list grouping
- [ ] Can add optional notes (brief reminders)
- [ ] Saved recipe appears in My Recipes list as "Your recipe"
- [ ] Manual recipe ingredients appear on shopping list when used in a plan

---

## Story Map Overview

```
                    ┌─────────────────────────────────────────────────┐
                    │                 User Journey                     │
                    └─────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
   ┌─────────┐         ┌─────────────┐        ┌──────────┐
   │Dashboard│ ──────▶ │ Create Plan │ ──────▶│View Plan │
   │ US-5.x  │         │   US-1.x    │        │  US-2.x  │
   └─────────┘         └─────────────┘        └──────────┘
                                                    │
                              ┌─────────────────────┼─────────────────┐
                              ▼                     ▼                 ▼
                        ┌──────────┐         ┌─────────────┐     ┌──────────┐
                        │View Recipe│        │Manage Meals │     │ Shopping │
                        │  US-3.x   │        │   US-2.3    │     │  US-4.x  │
                        └──────────┘         └─────────────┘     └──────────┘
```

---

## Priority

| Priority | Stories | Rationale |
|----------|---------|-----------|
| **P0 - Must have** | US-1.1, US-2.1, US-3.1, US-4.1, US-5.1, US-6.1 | Core loop: create → view → shop |
| **P1 - Should have** | US-1.2, US-2.2, US-2.3, US-4.2, US-5.2, US-5.3, US-7.1, US-7.2 | Polish and usability |
| **P2 - Nice to have** | US-3.2, US-4.3 | Enhancements |

---

## Implementation Status

**Source of truth:** The e2e tests in `e2e/` are the authoritative record of which user stories are implemented and verified.

Each test file:
- Is named after its user story (e.g., `us-1.1-create-meal-plan.spec.ts`)
- Contains the full user story and acceptance criteria in a JSDoc comment
- Has tests that map directly to acceptance criteria

To see what's implemented:
```bash
ls e2e/us-*.spec.ts
```

To verify acceptance criteria are met:
```bash
npm run test:e2e
```
