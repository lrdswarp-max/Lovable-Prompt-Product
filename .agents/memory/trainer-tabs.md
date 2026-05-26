---
name: Trainer tab layout
description: Trainer navigator tab structure and plan-builder routing
---

Trainer tabs order: Dashboard → Students → Plans → Library → Messages.

Plans tab file: `artifacts/mobile/app/trainer/plans.tsx`.

Plan Builder (`artifacts/mobile/app/plan-builder.tsx`) is a root Stack screen registered in `app/_layout.tsx`, NOT inside the trainer tab directory. This avoids it appearing as a tab.

**Why:** plan-builder needs to be navigated to from multiple places (trainer/plans, trainer/index, trainer/students assign flow) without being a visible tab.

Both NativeTrainerTabs (iOS 26+ Liquid Glass) and ClassicTrainerTabs were updated to include the Plans tab.
