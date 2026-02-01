# Food Planning App - Implementation Plan

## Overview
A web application that generates weekly meal plans based on user preferences, dietary restrictions, available ingredients, budget, and skill level. Combines user-added recipes with AI-generated options and produces shopping lists.

## Development Approach: Prototype First

We're taking an iterative approach:
1. **Prototype** - UI/UX validation with mock data and browser storage
2. **Production** - Add real database, auth, and AI integration

This lets us validate the design before adding infrastructure complexity.

---

## Phase 0: Prototype (Current Focus)

### Goals
- Validate UI/UX with real interactions
- Test the user flow end-to-end
- Iterate on design quickly without backend constraints
- Get a feel for the app before committing to infrastructure

### Prototype Tech Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| Frontend | Next.js 14 (App Router) | Same as production, no throwaway code |
| Styling | Tailwind CSS | Rapid UI development |
| Storage | localStorage + Zustand | Browser-based, no database setup |
| Data | Static JSON recipes | ~20-30 sample recipes to test with |
| Auth | None | Skip for prototype |

### Prototype Scope

**Included:**
- Dashboard with current week view
- Meal plan creation form (simplified)
- Weekly calendar display
- Recipe detail view
- Shopping list generation & checklist
- Swap/regenerate meals (random from static pool)
- Preferences stored in localStorage

**Excluded (for now):**
- User accounts / authentication
- AI recipe generation
- Custom recipe creation
- Multiple saved meal plans
- Data sync across devices

### Prototype Data

**Static Recipe Set (~25 recipes):**
```
Breakfasts (5)
├── Scrambled eggs with toast
├── Overnight oats
├── Pancakes
├── Yogurt parfait
└── Breakfast burritos

Lunches (10)
├── Grilled cheese & tomato soup
├── Chicken Caesar salad
├── BLT sandwich
├── Veggie stir-fry
├── Quesadillas
├── Pasta salad
├── Tuna melt
├── Bean & cheese tacos
├── Soup & bread
└── Leftovers (placeholder)

Dinners (10)
├── Spaghetti bolognese
├── Chicken fajitas
├── Baked salmon with vegetables
├── Beef tacos
├── Vegetable curry
├── Homemade pizza
├── Pork chops with mashed potatoes
├── Stir-fry with rice
├── Lasagna
└── Roast chicken
```

**Recipe Data Structure:**
```typescript
interface Recipe {
  id: string;
  title: string;
  description: string;
  mealType: 'breakfast' | 'lunch' | 'dinner';
  prepTime: number;      // minutes
  cookTime: number;      // minutes
  servings: number;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];        // e.g., ['vegetarian', 'quick', 'kid-friendly']
  estimatedCost: 'low' | 'medium' | 'high';
  ingredients: {
    name: string;
    quantity: number;
    unit: string;
    category: 'produce' | 'dairy' | 'meat' | 'pantry' | 'frozen';
  }[];
  instructions: string[];
}
```

### Prototype Project Structure

```
food-plan/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Dashboard
│   │   ├── plan/
│   │   │   ├── page.tsx          # Create plan form
│   │   │   └── [id]/page.tsx     # View plan (calendar)
│   │   ├── recipe/
│   │   │   └── [id]/page.tsx     # Recipe detail
│   │   ├── shopping-list/
│   │   │   └── page.tsx          # Shopping list
│   │   └── layout.tsx
│   ├── components/
│   │   ├── ui/                   # Button, Card, Input, etc.
│   │   ├── Calendar.tsx          # Week view component
│   │   ├── MealCard.tsx          # Single meal display
│   │   ├── RecipeView.tsx        # Full recipe display
│   │   ├── ShoppingList.tsx      # Checklist component
│   │   └── PlanForm.tsx          # Plan creation form
│   ├── data/
│   │   └── recipes.ts            # Static recipe data
│   ├── store/
│   │   └── store.ts              # Zustand store
│   ├── lib/
│   │   ├── planGenerator.ts      # Random plan from static recipes
│   │   ├── shoppingList.ts       # Aggregate ingredients
│   │   └── utils.ts
│   └── types/
│       └── index.ts
├── package.json
└── tailwind.config.ts
```

### Prototype Screens

**1. Dashboard**
- Current meal plan summary (if exists)
- "Create New Plan" button (primary action)
- Quick link to shopping list

**2. Create Plan**
- Number of people (default: 4)
- Days to plan (default: 7)
- Which meals (checkboxes: breakfast, lunch, dinner)
- Budget preference (low/medium/high)
- "Generate Plan" button

**3. Plan View (Calendar)**
- 7-day grid showing meals
- Tap meal to view recipe
- "Swap" button on each meal
- "View Shopping List" button
- Cost estimate for the week

**4. Recipe Detail**
- Title, time, servings, difficulty
- Ingredients list
- Step-by-step instructions
- "Back to Plan" navigation

**5. Shopping List**
- Grouped by category
- Tap to check off
- Running total of checked items
- "Clear Checked" button

---

## Phase 1: Production Foundation (Later)

After prototype validation:
- Initialize PostgreSQL + Prisma
- Add NextAuth.js authentication
- Migrate localStorage data model to database
- Keep same UI components

## Phase 2: AI Integration (Later)

- Add OpenAI recipe generation
- Replace static recipes with AI-generated
- Add custom recipe creation
- Implement proper meal plan saving

---

## Production Tech Stack (Reference)

| Layer | Technology | Rationale |
|-------|------------|-----------|
| Frontend | Next.js 14 (App Router) | Full-stack TypeScript, SSR, great DX |
| Styling | Tailwind CSS | Rapid UI development |
| Database | PostgreSQL + Prisma | Type-safe ORM, reliable storage |
| Auth | NextAuth.js | Simple auth integration |
| AI | OpenAI API (GPT-4o-mini) | Recipe generation, meal planning |
| Deployment | Vercel | Seamless Next.js deployment |

---

## Verification (Prototype)

1. Create a meal plan with default settings
2. View the weekly calendar
3. Tap a meal and see the recipe
4. Swap a meal and confirm it changes
5. View shopping list grouped by category
6. Check off items and see progress
7. Refresh browser - data persists in localStorage
8. Test on mobile viewport
