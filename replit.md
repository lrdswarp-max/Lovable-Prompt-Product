# TrainFlow

A premium Expo mobile app connecting personal trainers with their students for workout tracking, plan delivery, and messaging.

## Run & Operate

- `pnpm --filter @workspace/mobile run dev` — run the Expo app (mobile preview)
- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Expo SDK 54 + Expo Router (file-based routing)
- React Native, expo-linear-gradient, expo-blur, expo-haptics
- @expo/vector-icons (Feather + MaterialCommunityIcons)
- AsyncStorage for local persistence (no backend in v1)

## Where things live

```
artifacts/mobile/
  app/
    _layout.tsx              — Root layout (AuthProvider, QueryClient, fonts)
    login.tsx                — Student magic-link login
    trainer-login.tsx        — Trainer PIN login
    onboarding.tsx           — New student onboarding flow
    workout.tsx              — Full-screen immersive workout player
    (tabs)/                  — Student tab bar
      _layout.tsx            — Tab layout (BlurView, native tabs)
      index.tsx              — Home: today's workout card
      chat.tsx               — Student messages
      profile.tsx            — Student profile & stats
    trainer/                 — Trainer tab bar
      _layout.tsx
      index.tsx              — Trainer dashboard
      students.tsx           — Student roster + invite modal
      exercises.tsx          — Exercise library with filter chips
      chat.tsx               — Trainer messages
  components/
    ExerciseDisplay.tsx      — Gradient hero with muscle group icon
    ui/ProgressRing.tsx      — SVG circular progress ring
    ErrorBoundary.tsx        — Top-level error boundary
  context/AuthContext.tsx    — Auth state (student/trainer role, mock login)
  data/types.ts              — All shared TypeScript types
  data/mockData.ts           — Mock workout plans, students, exercises, chats
  constants/colors.ts        — Full dark theme palette
  hooks/useColors.ts         — Forced dark mode color hook
```

## Architecture decisions

- **Two separate tab navigators** share a single Stack root: `(tabs)` for students, `trainer` for trainers. Auth redirects switch between them.
- **Forced dark mode** via `useColors` — never follows system preference; always returns the dark palette.
- **Workout player** uses two separate `useEffect` hooks: one for the rest countdown, one to detect when countdown reaches 0 and advance state.
- **No backend in v1**: all data is local mock data + AsyncStorage for auth persistence.
- **isLiquidGlassAvailable()** guard in tab layouts: renders NativeTabs on iOS 26+ with Liquid Glass, falls back to classic BlurView tabs elsewhere.

## Product

**Student experience:** Magic link login → Home shows today's workout card → Tap to open immersive workout player (set logger with weight/reps inputs, rest timer with countdown ring, next-exercise preview, completion summary) → Chat with trainer → Profile with stats.

**Trainer experience:** Dashboard with student count + activity feed → Students tab (roster, invite modal, status badges) → Exercise library (searchable, filterable by muscle group) → Messages with all students.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- `MOCK_TRAINER` is defined locally inside `AuthContext.tsx` — do NOT re-export it from `mockData.ts` (causes duplicate declaration error in Metro).
- Workout player navigation uses `gestureEnabled: false` to prevent swipe-to-dismiss during a live session.
- Trainer tab layout references `expo-glass-effect` `isLiquidGlassAvailable` — ensure the package stays installed.
- Always use `useSafeAreaInsets` + platform checks for top/bottom padding; web preview adds 67px header offset.
