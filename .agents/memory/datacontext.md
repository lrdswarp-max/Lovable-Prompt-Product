---
name: DataContext architecture
description: How the central DataContext works and what it persists
---

DataContext (`artifacts/mobile/context/DataContext.tsx`) wraps all app data with AsyncStorage persistence.

Keys: `trainflow_sessions_v2`, `trainflow_conversations_v2`, `trainflow_plans_v2`, `trainflow_students_v2`.

**Why v2 suffix:** Prevents collisions with any old v1 data that might have different shapes.

Falls back to MOCK_* data if AsyncStorage is empty or fails.

Wraps inside AuthProvider in `_layout.tsx` — order matters: AuthProvider → DataProvider → GestureHandlerRootView.

**How to apply:** All screens must use `useData()` instead of importing MOCK data directly for sessions, conversations, plans, and students.
