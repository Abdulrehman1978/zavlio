# Pinned Meta Automation Upstream

## Packet 17 operational closure

The exact upstream pin remains a release gate; no update or source modification is permitted in Packet 17.

Packet 15 pins `https://github.com/sunmughan/meta-automation.git` at detached commit `439c3bfaacb1caabef25a7d67c3f204916a5a168`, tree `e4f412bc7ff86261f0753a1f088c5f271af9246c`, branch context `agentic-social-v2`. The package is `meta-automation@2.0.0`, MIT licensed, Node `>=18`, CommonJS, and locks `puppeteer-core@25.11.0`.

The commit is unsigned. `external/meta-automation.lock.json` records the provenance, exact package-lock/license/README hashes, and isolated-runtime policy. `pnpm meta:verify-pin` must pass before the child starts; any origin, SHA, tree, hash, package, or source-drift mismatch fails closed. The checkout is intentionally unmodified and is not a normal workspace dependency.

The upstream audit found supported configuration for Threads, Facebook, and LinkedIn, with Instagram remnants/inconsistency. It also found a full `AgenticSocialRunner`, local identity/relationship state, a follow-up scheduler, AI runtimes, telemetry, and a browser manager that auto-accepts dialogs. Those components are not Zavlio authorities and are excluded from the adapter path.

Upstream `npm ci --ignore-scripts`, `npm run test:agentic`, and `npm audit --audit-level high` passed. The broad upstream `npm test` remains environment-dependent: it requires the unavailable Antigravity runtime and touched local browser/state artifacts during its run; those generated artifacts were removed and the pinned checkout was reverified clean. This is recorded as external evidence, not a Packet 15 failure of the adapter.

Packet 15R confirms that the semantic agent transitively imports upstream telemetry/logger modules. Their paths are redirected into the isolated runtime, raw output is not promoted to CRM evidence, and the adapter does not patch the pinned source.

Packet 15R.1 keeps that wording precise: upstream telemetry/logger modules may load transitively, but telemetry is not CRM authority, runtime paths remain isolated, raw upstream telemetry is not ingested wholesale, and sanitized Zavlio evidence is authoritative. Exact semantic control binding and target proof are Zavlio adapter responsibilities; real Threads/Facebook/LinkedIn providers remain a Packet 16 boundary.

Packet 15R.1 keeps that wording precise: upstream telemetry/logger modules may load transitively, but telemetry is not CRM authority, runtime paths remain isolated, raw upstream telemetry is not ingested wholesale, and sanitized Zavlio evidence is authoritative. Exact semantic control binding and target proof are Zavlio adapter responsibilities; real Threads/Facebook/LinkedIn providers remain a Packet 16 boundary.

# Packet 16 upstream boundary

Pinned upstream remains unchanged at 439c3bfaacb1caabef25a7d67c3f204916a5a168/e4f412bc7ff86261f0753a1f088c5f271af9246c. Platform providers are Zavlio-owned modules; AgenticSocialRunner, NextBestAction, identity graph, relationship engine, and follow-up scheduler remain outside the normal path.
