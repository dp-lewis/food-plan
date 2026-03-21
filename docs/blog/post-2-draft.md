# Evolving Agile in the age of AI agents

## Building a real product with AI agents — Part 2 of 4

In [Part 1](https://medium.com/@dp-lewis/goal-driven-development-with-ai-agents-e573ef8dc4d8), I talked about starting a meal planning app with a clear problem and no plan for the solution. By the end of the first week, I had a working PWA I could use for a real grocery shop.

But I glossed over something important: how the work actually got done. The workflow between me and the AI agents — what I was responsible for, what I delegated, and how we communicated — wasn't something I designed upfront. It emerged over several weeks, and it turned out to be the most interesting part of the whole project.

### What I took from agile (and what I left behind)

I've worked in agile teams before. I know the rituals — sprints, standups, retrospectives, backlog grooming. Going into this project, I had a feeling that some of those practices would be valuable, but I wasn't sure which ones.

**User stories survived.** They turned out to be a great way to describe goals without dictating solutions. "As a grocery shopper, I want to check off items as I add them to my cart, so that I can track my progress through the store." That's something Claude can work with — it understands the intent and can propose how to implement it.

**Iterative delivery survived.** Working software at every step. Never going more than a day or two without something I could actually use and evaluate.

**Sprints didn't survive.** There was no two-week cadence, no velocity tracking, no sprint planning. I'd finish one goal and move to the next. Some goals took a day, some took a week. Timeboxing didn't add anything when there was no team to synchronise.

**Ceremonies changed format, not purpose.** Every agile ceremony exists for a reason — standups re-establish context, retros drive reflection, backlog grooming sets priorities. Those needs don't disappear just because your team is you and an AI agent. The scrum-style format does, though. I was doing this part-time, so I'd often come back after a couple of days away and start by recapping with Claude — where we left off, what's working, where to go next. Same purpose as a standup, different shape. Reflecting on the process with Claude works the same way — it's a retro without the sticky notes.

What I ended up with was something I'd call goal-driven development. I'd identify the next thing the app needed to do, describe it clearly, and work toward it until it was done. Then I'd use the app and figure out what it needed next.

### Three layers of direction

Over the first couple of weeks, I noticed I was operating at three different levels, and I had very different levels of involvement at each.

**Product goals — I led, mostly.** I decided what the app should do next. "I need to be able to share the plan with my partner." "The shopping list needs to work offline." These came from using the app and understanding the problem. But occasionally I'd get stuck on where to go next. When that happened, I'd go back to the design principles document with Claude and we'd evaluate the gaps together — what's the app missing relative to the problem we're trying to solve? That would usually unstick me.

But within those goals, I gave Claude a lot of room. I'd describe the goal and let it propose options. When it was time to add sharing, I didn't say "build me a share link system with Supabase RLS policies." I said "I want my partner to be able to see the same plan and shopping list on her phone." Claude proposed the approach — share codes, plan membership, row-level security — and we discussed the trade-offs until I was comfortable with the direction.

**Engineering principles — I insisted.** End-to-end tests. A component library in Storybook. Design tokens. These were non-negotiable from the start. I covered this in Part 1, but it's worth repeating here because it shaped the workflow. Every feature had to have tests. Every UI element had to use the design system. This meant Claude was always working within guardrails, even when it had freedom on implementation details.

**Implementation details — I delegated.** Which state management library. How to structure the Zustand store. The specifics of the data model. How to handle WebSocket reconnection on iOS Safari. I reviewed and approved these decisions, but I wasn't the one making them. Claude would propose an approach, I'd ask questions if something felt off, and we'd move forward.

This layering happened naturally — I didn't plan it. But once I recognised it, I leaned into it. It let me spend my energy where it mattered most (understanding the problem, maintaining quality) and let the AI do what it's best at (exploring solution spaces, writing code, remembering technical details).

### Specialist agents

About a week in, I started splitting the work across different agents. Claude Code lets you define custom agents with their own system prompts, models, and persistent memory. I ended up with a small team:

**The coder** ran on Sonnet and handled all implementation — features, bug fixes, refactoring. It had a detailed system prompt with the project's tech stack, coding conventions, and a quality checklist. It also had its own memory file where it recorded things it had learned: how Zustand hydration works with Next.js, how to mock WebSocket connections in Playwright tests, the pattern for syncing state to Supabase.

**The accessibility auditor** checked components and pages against WCAG 2.1 AA guidelines — colour contrast, keyboard navigation, ARIA attributes, touch target sizing. After a feature landed, I'd run the auditor and it would flag issues by severity.

**The design reviewer** evaluated visual consistency — whether new UI followed the design tokens, whether spacing and typography matched existing patterns, whether the mobile layout worked at 375px.

The key insight was running the coder on a more capable model (Sonnet) and the auditors on a cheaper, faster one (Haiku). The coder needed to understand complex systems and write good code. The auditors were checking established rules against known standards — a less demanding task. This kept costs reasonable without sacrificing quality where it mattered.

### Agent memory

One of the things that surprised me most was how much value came from agent memory. Each agent has a persistent memory file that survives between conversations. When the coder agent learns something — like the fact that Supabase Realtime DELETE events are unreliable and you need to use Broadcast channels instead — it writes that down. Next time it works on a related problem, that knowledge is already there.

Over five weeks, the coder's memory file grew to cover dozens of patterns: how authentication works in the app, the sync queue architecture, how to handle iOS Safari killing WebSocket connections when the phone locks, the correct way to write Playwright tests that wait for Zustand hydration. It became a genuine knowledge base — the kind of institutional memory that usually lives in a senior developer's head.

I also kept my own memory at the project level, particularly around the hard-won Supabase Realtime lessons. Things like: never mix broadcast listeners with postgres_changes on the same channel. Use consistent filtering on all subscriptions for the same table. These were painful to discover and I wanted to make sure they were never forgotten.

### The feedback loop

The thing that made this workflow feel different from just "using AI to write code" was the speed of the feedback loop. Here's what a typical cycle looked like:

1. I'd identify a goal from using the app
2. I'd describe it in a conversation with Claude
3. We'd discuss the approach — Claude would propose, I'd push back or refine
4. The coder agent would implement it
5. I'd use the app and see what needed to change
6. If something was off, I'd describe what I was experiencing and we'd iterate

The whole loop might take a few hours for a substantial feature. For smaller things — a bug I noticed while shopping, a touch target that was too small — it could be minutes.

This speed meant that I could hold the full context of what I was building in my head. I never had the experience of coming back to the project after a week and having to re-orient myself. The gap between idea and implementation was small enough that my understanding stayed fresh.

### What agile got right

Looking back, the agile practices that survived weren't the process ones — they were the philosophical ones. Build working software early. Get real feedback. Iterate based on what you learn. Stay close to the user (in this case, I was the user).

The coordination mechanisms changed the most. Sprints, story points, velocity — gone. But the purposes behind the ceremonies — context, reflection, direction — those persisted. They just found new forms that fit the way I was actually working.

The workflow I landed on isn't a framework. I wouldn't give it a manifesto or a certification programme. It's just: know your problem, describe your goals clearly, insist on engineering quality, let the AI explore solutions, use the thing you're building, repeat.

### What's next

In [Part 3](#), I'll talk about what happened when the app met real life — not just my own usage, but collaborating with my partner. That's where the real lessons came from: standing in a supermarket with patchy signal, watching someone else try to join a shared plan for the first time, and discovering that real-time sync is easy to describe and hard to get right.
