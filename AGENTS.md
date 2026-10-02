# Zavlio Agent Rules

- `MASTER_SPEC.md` is authoritative. Inspect the repository and relevant documentation before editing.
- Preserve the approved Zavlio UI; do not redesign it without explicit approval.
- Use strict TypeScript. Keep secrets server-only and never rely on client-side authorization alone.
- Never bypass Supabase RLS. Make database changes only through reviewed migrations; never mutate production schema manually.
- Ship tests with features and record evidence. Controlled demo content is local/staging-only; production claims require review.
- Keep the pinned Meta Automation source isolated; prefer adapters and avoid upstream modifications unless necessary.
- After every packet, update the progress tracker, implementation ledger, registers, and `docs/work/XX-result.md`.
- A packet is not complete without evidence. Never describe unexercised external systems as verified or the platform as production-ready prematurely.
