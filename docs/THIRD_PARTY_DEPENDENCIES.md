# Third-Party Dependencies

All JavaScript dependencies are exact-pinned in manifests and resolved by `pnpm-lock.yaml`. Key runtime selections: Next.js `16.3.8`, React `19.3.0`, TypeScript `6.0.3`, Tailwind CSS `4.3.3`, Zod `4.6.5`, Vitest `5.0.2`, Playwright `1.63.0`, axe Playwright `4.13.0`, ESLint `9.39.5`, sharp `0.35.5`, and Prettier `3.9.9`. Exact engine pin: Node `24.13.0` and pnpm `11.19.0`.

pnpm build scripts are deny-by-default except explicit `allowBuilds` entries for `esbuild` and `unrs-resolver`, required by the selected build/lint toolchain. `pnpm audit --prod --audit-level high` reports zero known vulnerabilities for production dependencies.

ESLint 9 is registry-deprecated but temporarily retained because the selected Next.js React lint plugin peer range does not support ESLint 10. Reassess as a controlled dependency update.

Meta Automation is pinned for Packet 15 only: `https://github.com/sunmughan/meta-automation.git` at `439c3bfaacb1caabef25a7d67c3f204916a5a168` / tree `e4f412bc7ff86261f0753a1f088c5f271af9246c`, package `2.0.0`, MIT, Puppeteer Core `25.11.0`. The commit is unsigned; `external/meta-automation.lock.json` and `node scripts/meta-verify-pin.mjs` are authoritative. The checkout is isolated and must remain unmodified.

Packet 12 adds Recharts `3.10.1`, exact-pinned for internal CRM charts only. It is isolated to the `/crm/analytics` client boundary and is not imported by public routes. The final high-severity audit reported no known vulnerabilities.
