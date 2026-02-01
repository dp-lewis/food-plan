# Food Plan - Design Principles

> **Purpose**: UI/UX guidelines, target user, and design philosophy.
>
> Related ADRs:
> - [ADR-007](./adr/007-target-user-budget-families.md) — Target user decision
> - [ADR-008](./adr/008-minimal-design-philosophy.md) — Minimal design philosophy
> - [ADR-009](./adr/009-single-accent-color-light-mode.md) — Color and theme decisions
> - [ADR-010](./adr/010-css-custom-properties-design-tokens.md) — Design tokens approach

---

## Target User: Budget-Conscious Families

### User Profile
- Parents managing household meals for 2-6 people
- Primary goals: save money, reduce food waste, simplify weekly planning
- Pain points: decision fatigue, forgotten ingredients, impulse purchases, wasted leftovers
- Context: Often planning while multitasking, on mobile, or in a hurry

### User Needs (Priority Order)
1. **Save money** - Maximize meals per dollar, minimize waste
2. **Save time** - Quick planning, efficient shopping trips
3. **Reduce stress** - Eliminate "what's for dinner?" anxiety
4. **Feed everyone** - Handle different preferences within the household

---

## Design Philosophy: Minimal & Focused

### Core Principle
> Do one thing exceptionally well: Turn weekly food planning from a chore into a 5-minute task.

### Guiding Values

**1. Decisions are expensive**
- Provide smart defaults, not endless options
- One recommended path, with alternatives available but not prominent
- Pre-fill based on past behavior and common patterns

**2. Less is more**
- Every screen should have one primary action
- Remove features that don't directly serve meal planning
- White space is a feature, not wasted space

**3. Progressive disclosure**
- Start simple, reveal complexity only when needed
- Advanced options exist but don't clutter the main flow
- First-time experience should require minimal input

**4. Respect the context**
- Assume users are distracted or in a hurry
- Support one-handed mobile use
- Allow interruption and easy resumption

---

## UI/UX Principles

### Information Architecture

```
Home (Dashboard)
├── This Week's Plan (primary focus)
│   ├── Quick view of upcoming meals
│   ├── Shopping list shortcut
│   └── "Regenerate" option
├── Create New Plan (secondary)
└── My Recipes (tertiary)
```

### Visual Hierarchy

**1. Typography**
- Two font weights maximum (regular, bold)
- Three text sizes: heading, body, caption
- High contrast for readability in kitchen environments

**2. Color Usage**
- Neutral base (white/light gray)
- Single accent color for primary actions
- Semantic colors only for: success, warning, error
- No decorative color usage

**3. Spacing**
- Generous touch targets (minimum 44px)
- Consistent 8px grid system
- Breathable layouts over dense information

### Interaction Patterns

**1. Primary Actions**
- Always visible, never buried in menus
- Large, thumb-friendly buttons
- Clear, action-oriented labels ("Generate Plan" not "Submit")

**2. Navigation**
- Maximum 3 levels deep
- Persistent back button
- Bottom navigation on mobile (thumb zone)

**3. Forms**
- Single column layouts
- Inline validation
- Smart defaults pre-selected
- Minimal required fields

**4. Feedback**
- Immediate response to all interactions
- Progress indicators for AI generation
- Undo available for destructive actions

### Key Screens

**1. Dashboard**
- Current week's meal plan at a glance
- One-tap access to shopping list
- Budget summary (spent vs. planned)
- Quick "regenerate meal" for any slot

**2. Plan Creation**
- Single-page form, not multi-step wizard
- Collapsible "Advanced Options" section
- "Use last week's settings" shortcut
- Generate button always visible

**3. Shopping List**
- Grouped by store section (produce, dairy, etc.)
- Tap to check off items
- Running total estimate
- Share/export option

**4. Meal View**
- Recipe name, time, servings prominently displayed
- Ingredient list (checkbox format for cooking)
- Step-by-step instructions
- "Swap this meal" option

### Mobile-First Considerations

- Design for 375px width first, scale up
- Bottom-sheet modals over centered dialogs
- Swipe gestures for common actions (check off, delete)
- Offline support for shopping list

### Accessibility

- WCAG 2.1 AA compliance minimum
- Screen reader support for all interactions
- Color is never the only indicator
- Respect system font size preferences
- Support reduced motion preferences

---

## Content Principles

### Voice & Tone
- Friendly but efficient
- No jargon or cooking snobbery
- Encouraging without being patronizing
- Brief - every word must earn its place

### Microcopy Examples

| Instead of... | Use... |
|---------------|--------|
| "Submit your preferences" | "Create Plan" |
| "No results found" | "No recipes match. Try fewer filters?" |
| "Error occurred" | "Couldn't save. Tap to retry." |
| "Are you sure you want to delete?" | "Delete this meal?" with Undo option |

### Empty States
- Always provide a clear next action
- Use illustration sparingly (one small icon max)
- No sad faces or negative imagery

---

## Budget-Specific Features

### Cost Visibility
- Show estimated cost per meal
- Weekly budget tracker
- Highlight budget-friendly ingredient swaps
- "Stretch this meal" suggestions (make 4 servings instead of 2)

### Waste Reduction
- Suggest meals that use overlapping ingredients
- "Use it up" prompts for perishables
- Leftover transformation suggestions
- Pantry inventory tracking (optional)

### Smart Defaults for Families
- Default to 4 servings
- Prioritize kid-friendly options
- Include prep time estimates
- Flag allergen-friendly alternatives

---

## Anti-Patterns (What We Avoid)

1. **Feature creep** - No calorie tracking, no social features, no gamification
2. **Decision paralysis** - No "choose from 50 cuisines" screens
3. **Dark patterns** - No guilt-tripping, no artificial urgency
4. **Over-personalization** - No complex preference questionnaires upfront
5. **Notification spam** - Only notify for actionable items (shopping day reminder)

---

## Success Metrics

- Time to first plan generated: < 3 minutes
- Weekly active usage retention
- Shopping list completion rate
- User-reported "time saved" satisfaction
