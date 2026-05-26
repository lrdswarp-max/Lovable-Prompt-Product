---
name: Replit Auth mobile integration
description: How Replit Auth is wired up for the TrainFlow Expo mobile app
---

Auth flow: expo-auth-session PKCE → OIDC at replit.com/oidc → code exchange at POST /api/mobile-auth/token-exchange → session token stored in expo-secure-store.

Role (student/trainer) stored separately in AsyncStorage; combined into the User object when fetching from /api/auth/user.

**Why:** Replit Auth only provides identity (id, email, name). The app-level role (student vs trainer) is the app's concern, not the OIDC provider's.

**How to apply:**
- `login(role)` in AuthContext triggers the OIDC flow and records `pendingRoleRef.current = role`
- After token exchange succeeds, role is persisted with `AsyncStorage.setItem(AUTH_ROLE_KEY, role)`
- On startup, `fetchUser()` restores both token and role together
- `isAuthReady` (exported from AuthContext) is `request !== null` — gates the login button to avoid "Cannot prompt until request loaded" error
- expo-web-browser plugin already in app.json; scheme is "mobile"

Packages installed (SDK 54): expo-auth-session@~7.0.10, expo-crypto@~15.0.8, expo-secure-store@~15.0.8 (expo-web-browser already present)
