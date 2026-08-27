# v0.4 Codex handoff

Branch: `feat/v0.4-mastery-expansion`

## Goal
Increase learning depth after kid feedback: “I want more questions.” Preserve the game feel while adding longer runs, spaced review, missing-number reasoning, mastery badges, and targeted weak-skill practice.

## Non-negotiables
- Do not modify `main` / v0.2 production.
- Do not modify the existing v0.3 preview branch.
- Keep arithmetic within the current curriculum: 1–9 multiplication and addition/subtraction within 100.
- Wrong answers never remove progress or lives.
- `nq-state-v04` and `number-quest-v04-1` stay isolated.

## Validation
- `node --test tests/v04-core.test.mjs`
- `node --check v04-app.js`
- `node --check sw.js`
- Vercel preview smoke before any promotion.
