# Food Planning App - Implementation Plan

## Overview

A web application that generates weekly meal plans based on user preferences. Users can use built-in recipes, import recipes from URLs, or create simple manual recipes. The app produces shopping lists grouped by category.

## Current Status: Prototype Complete

The prototype is fully functional and deployed to Vercel. It validates the core user experience without backend infrastructure.

### What's Built

- **Meal Plan Creation** - Configure days, people, and meal types
- **Weekly Calendar View** - See all planned meals at a glance
- **Meal Swapping** - Replace any meal with an alternative
- **Recipe Import** - Import recipes from URLs (schema.org/Recipe support)
- **Manual Recipe Entry** - Add simple family recipes
- **Shopping List** - Auto-generated, grouped by category, with check-off
- **Data Persistence** - All data stored in localStorage

### Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS + CSS custom properties |
| State | Zustand with localStorage persistence |
| Data | Static JSON recipes + user-added recipes |
| Deployment | Vercel |

### Project Structure

```
food-plan/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Dashboard
│   │   ├── plan/
│   │   │   ├── page.tsx          # Create plan form
│   │   │   └── current/page.tsx  # View current plan
│   │   ├── recipe/
│   │   │   └── [id]/page.tsx     # Built-in recipe detail
│   │   ├── recipes/
│   │   │   ├── page.tsx          # My Recipes list
│   │   │   ├── add/page.tsx      # Import from URL
│   │   │   ├── new/page.tsx      # Manual recipe entry
│   │   │   └── [id]/page.tsx     # User recipe detail
│   │   ├── shopping-list/
│   │   │   └── page.tsx          # Shopping list
│   │   └── api/
│   │       └── parse-recipe/     # URL parsing endpoint
│   ├── data/
│   │   └── recipes.ts            # Built-in recipe data
│   ├── store/
│   │   └── store.ts              # Zustand store
│   ├── lib/
│   │   ├── planGenerator.ts      # Random plan generation
│   │   ├── shoppingList.ts       # Ingredient aggregation
│   │   ├── recipeParser.ts       # URL recipe extraction
│   │   └── ingredientParser.ts   # Ingredient text parsing
│   └── types/
│       └── index.ts
├── e2e/                          # Playwright tests
└── docs/                         # Documentation
```

---

## Future Considerations

If the app needs to scale beyond single-device use:

1. **User Accounts** - Add authentication (NextAuth.js)
2. **Database** - Migrate to PostgreSQL for cross-device sync
3. **Recipe Sharing** - Allow users to share recipes publicly

For now, the localStorage approach keeps things simple and works well for family use on a shared device.
