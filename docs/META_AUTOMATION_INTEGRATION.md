# Meta Automation Integration

Status: Packet 14 secure machine protocol implemented; upstream integration remains blocked pending an approved URL and exact commit.

The Meta Bridge is now a compiled, isolated process with per-agent HMAC identity, signed handshake/heartbeat/claim/lease/start/result calls, localhost health/readiness, graceful shutdown, and an INTERNAL/NOOP/DRY_RUN_ONLY executor. It has no Supabase credential and cannot perform social actions.

Packet 15 must record the immutable upstream source, build an adapter without modifying the pinned source where possible, map capabilities and dry-run results, propagate security checkpoints, and retain the Packet 14 signed protocol. No browser/CDP or Meta credential is configured in Packet 14.
