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
- [ ] Can specify number of people (default: 4)
- [ ] Can specify number of days (1-7, default: 7)
- [ ] Can select which meals to plan (breakfast, lunch, dinner)
- [ ] Can select budget level (low, medium, high)
- [ ] Clicking "Generate Plan" creates a plan from available recipes
- [ ] Plan is saved to localStorage
- [ ] Redirects to plan view after generation

---

### US-1.2: Use smart defaults

**As a** busy parent
**I want** the form to have sensible defaults pre-filled
**So that** I can generate a plan quickly without configuring everything

**Acceptance Criteria:**
- [ ] Number of people defaults to 4
- [ ] Days defaults to 7
- [ ] All meal types (breakfast, lunch, dinner) selected by default
- [ ] Budget defaults to "medium"
- [ ] Can generate a plan with zero changes to defaults

---

## Epic 2: View Meal Plan

### US-2.1: View weekly calendar

**As a** family meal planner
**I want to** see my meal plan displayed as a weekly calendar
**So that** I can see at a glance what we're eating each day

**Acceptance Criteria:**
- [ ] Shows 7 days in a grid/list layout
- [ ] Each day shows assigned meals (breakfast, lunch, dinner)
- [ ] Each meal displays the recipe name
- [ ] Shows prep time for each meal
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

### US-2.3: Swap a meal

**As a** family meal planner
**I want to** swap out a meal I don't like for a different one
**So that** I can customise the plan to my family's preferences

**Acceptance Criteria:**
- [ ] Each meal has a "Swap" button/action
- [ ] Swapping replaces the meal with a different recipe of the same type
- [ ] New recipe is randomly selected from available options
- [ ] Change is saved to localStorage
- [ ] Can swap the same meal multiple times

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
- [ ] Shows today's meals prominently
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
                        ┌──────────┐         ┌───────────┐     ┌──────────┐
                        │View Recipe│        │Swap Meals │     │ Shopping │
                        │  US-3.x   │        │  US-2.3   │     │  US-4.x  │
                        └──────────┘         └───────────┘     └──────────┘
```

---

## Priority

| Priority | Stories | Rationale |
|----------|---------|-----------|
| **P0 - Must have** | US-1.1, US-2.1, US-3.1, US-4.1, US-5.1, US-6.1 | Core loop: create → view → shop |
| **P1 - Should have** | US-1.2, US-2.2, US-2.3, US-4.2, US-5.2, US-5.3 | Polish and usability |
| **P2 - Nice to have** | US-3.2, US-4.3 | Enhancements |

---

## Implementation Status

| Story | Description | Implemented | E2E Tests |
|-------|-------------|:-----------:|:---------:|
| US-1.1 | Create a new meal plan | ✓ | ✓ |
| US-1.2 | Use smart defaults | | |
| US-2.1 | View weekly calendar | ✓ | ✓ |
| US-2.2 | View recipe from calendar | ✓ | |
| US-2.3 | Swap a meal | ✓ | ✓ |
| US-3.1 | View recipe details | ✓ | ✓ |
| US-3.2 | Adjust servings | | |
| US-4.1 | View shopping list | ✓ | ✓ |
| US-4.2 | Check off items | ✓ | ✓ |
| US-4.3 | Clear checked items | | |
| US-5.1 | View current plan summary | | |
| US-5.2 | Create new plan from dashboard | | |
| US-5.3 | Empty state for new users | ✓ | ✓ |
| US-6.1 | Persist data across sessions | ✓ | |
