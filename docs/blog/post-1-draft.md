# I Knew the Problem, Not the Solution

## Building a real product with AI agents — Part 1 of 4

You want to cook something different this week. Not the same rotation of five meals — something new. So you find a few recipes that look good, maybe a tagine, a laksa, something you've never tried. You're excited about it.

Then you try to build a shopping list.

Three recipes, each with their own ingredient lists. Some overlap, some don't. You're cross-referencing tabs on your phone, trying to remember what you already have at home, mentally merging quantities. You give up on being thorough and just wing it at the supermarket.

And then you're standing in the kitchen on Tuesday night, halfway through the recipe: "Did we get cinnamon sticks?... erm, no."

That's the problem. Consolidating ingredients from multiple recipes into a coherent shopping list is genuinely hard — and when you get it wrong, you end up missing things, buying duplicates, or wasting what you bought for the recipe you never got around to.

I wanted to fix that. But I didn't know what the fix looked like yet.

### Starting with the problem, not the product

In February 2026, I started a project with one clear constraint: I would articulate the problem and let the solution emerge. I wasn't going to design every screen upfront or write a product spec. Instead, I wrote a design principles document.

It wasn't long. The core of it was this:

> **Target users:** Parents managing household meals for 2-6 people.
> **Primary goals:** Save money, reduce food waste, simplify weekly planning.
> **Pain points:** Decision fatigue, forgotten ingredients, impulse purchases, wasted leftovers.

And one guiding principle that everything else hung from:

> *Turn weekly food planning from a chore into a 5-minute task.*

That was my compass — enough to navigate by, without pretending I knew the destination.

### The bet

Here's the part that made this project different: I wasn't going to build it alone, and I wasn't going to build it with a team. I was going to build it with AI agents — specifically, Claude.

I'd been building small apps with AI agents for a while, testing out workflows and figuring out how to collaborate with them effectively. But everything I'd built so far was client-side only — localStorage, no backend, no accounts. This project was a deliberate step up: authentication, a real database, real-time collaboration between users. Could the workflow I'd been developing handle that kind of complexity?

I had an intuition that practices from agile software development — user stories, iterative delivery, working software early — would matter. I just wasn't sure how they'd apply when the "team" was me and a set of AI agents.

So I was figuring out two things at once: what the product should be, and whether this way of working could produce something genuinely production-grade.

### Day one

I started by writing architecture decision records and the design principles document. Then I wrote user stories — not a complete product backlog, just the core loop:

- Create a meal plan
- View the weekly calendar
- See recipe details
- View a shopping list
- Check off items

Just the minimum set of things that would let me answer the question: *does this actually help with meal planning?*

I described each goal to Claude and let it propose solutions. I'd say something like "a user needs to be able to see what they're cooking this week and generate a shopping list from it" — and we'd work through how to make that happen. The component structure, the state management, the data model — all of that emerged from discussion.

By the end of that first day, all five of those user stories were working. A real app, running in the browser, with a meal plan you could create, browse, and shop from.

It was rough. But it worked.

### What I insisted on

I was deliberate about staying hands-off on implementation details — which libraries to use, how to structure the store, what the component hierarchy should look like. But I wasn't hands-off on everything.

I insisted on end-to-end tests from the start. Not because I enjoy writing tests, but because I needed a way to know that things still worked as the app evolved. Every user story got a Playwright test. The test files were named after the stories — `us-1.1-create-meal-plan.spec.ts`, `us-4.2-check-off-items.spec.ts` — and the user stories themselves were embedded in the test files as the source of truth.

I insisted on a component library. Not a design system imposed from above, but reusable UI components built in Storybook so I could see them in isolation, review them, and know what building blocks were available.

I insisted on design tokens — CSS custom properties that kept the visual language consistent without me having to police every colour value and spacing unit.

I'd learned from experience that without these disciplines, codebases fall apart as they grow. So while I stayed open on what to build, I held firm on how the work should be done.

### A real shop

By the end of the first week, the app had recipe import (paste a URL from a food blog and it extracts ingredients), manual recipe entry for family staples, a PWA manifest so it could be installed on my phone, and a bottom navigation that worked one-handed.

That weekend, I used it for a real grocery shop.

Standing in the supermarket with the app on my phone, checking off items — that changed everything. Suddenly the feedback wasn't theoretical. I could feel what worked and what didn't. The touch targets were too small. The navigation didn't quite make sense. But the core loop — plan meals, generate a list, shop from it — that worked. I could feel the problem being solved.

That's the thing about building with AI agents at this speed: you get to real usage fast enough that reality shapes the product, not just your imagination. In a traditional project, that first real-world test might be weeks or months away. Here it was days.

### What the document imagined vs. what I built

My design principles document had a lot of ideas I never built. Budget tracking with cost per meal. AI-generated meal suggestions. Pantry inventory tracking. Waste reduction prompts. "Stretch this meal" suggestions.

None of that happened, and that's fine. The document told me who I was building for and what they cared about. When I actually used the app — and when my partner started using it — we discovered what really mattered: being able to plan together, seeing each other's shopping progress in real time, having it work offline in a supermarket with patchy signal.

The real product emerged from use.

### What's coming in this series

This is the first of four posts about building a real product with AI agents.

In the posts that follow, I'll cover the development process that emerged — a way of working I didn't plan but discovered along the way. I'll talk about what happened when the app met real life, including collaborating with my partner and the hard lessons that came from that. And I'll share what I'd tell someone starting this tomorrow.

The app is called [*Did We Get...?*](https://app.didweget.com/) — named after the question you ask when you're standing in the kitchen, trying to remember if you bought coriander. It's a real, deployed PWA with authentication, real-time collaboration, offline support, and about five weeks of development behind it.

I started with a clear problem and no idea what the solution would look like. That turned out to be exactly the right place to begin.
