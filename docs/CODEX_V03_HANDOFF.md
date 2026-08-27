# Codex Handoff — v0.3 Retention Loop

Branch: `feat/v0.3-retention-loop`
Base: `main` (live v0.2; DO NOT MODIFY OR MERGE without explicit founder approval)

## Task
Review and harden v0.3 retention loop implementation.

## Checks
1. Run `node --test tests/v03-core.test.mjs`.
2. Open with a local static server and test iPad/Surface portrait + landscape.
3. Verify `nq-state-v03` is the only v0.3 progress storage key.
4. Verify wrong answers never punish/lose progress.
5. Verify boss cadence, daily claim-once logic, collection unlocks, and adaptive weighting.
6. Do not alter `main` or current GitHub Pages publication.
7. Report defects as bounded repair commits on this branch only.
