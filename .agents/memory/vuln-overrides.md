---
name: Vulnerability overrides pattern
description: How to fix transitive dependency vulnerabilities in this monorepo
---

Use the `overrides` block in `pnpm-workspace.yaml` to force minimum safe versions for transitive dependencies.

**Why:** Most vulnerabilities are in transitive deps (e.g., express→qs, vite→postcss). Direct package upgrades can't fix these; overrides are the correct pnpm mechanism.

**How to apply:**
1. Identify the safe minimum version from the CVE advisory
2. Add to `overrides` in pnpm-workspace.yaml: `pkgname: ">=safe-version"`
3. Run `pnpm install` to apply
4. Verify with `pnpm audit` — should show "No known vulnerabilities found"

**Gotcha:** The override version must be strictly higher than the vulnerable version. E.g., qs@6.15.1 was vulnerable → override to `>=6.15.2` not `>=6.14.0` (6.15.1 satisfies 6.14.0).
