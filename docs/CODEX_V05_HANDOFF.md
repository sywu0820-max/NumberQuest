# Codex Handoff — Number Quest v0.5 Learning Loop

## Mission
Implement v0.5 on `feat/v0.5-learning-loop` only. Read `AGENTS.md`, `docs/V05_LEARNING_LOOP.md`, the current v0.4 implementation, and tests before changing code.

Do not modify `main`, `feat/v0.3-retention-loop`, or `feat/v0.4-mastery-expansion`. Do not merge any PR.

## Priority order
1. Learning/mastery scheduler and state model.
2. Division Bridge generator + first-use explanation.
3. Number-sense question formats.
4. Child-facing mastery map updates.
5. Browser/touch polish only after core behavior and tests pass.

## Engineering constraints
- Pure client-side app; no server/backend required for core play.
- No API keys, LLM calls or third-party content dependencies in gameplay.
- Preserve offline PWA capability.
- Use `nq-state-v05` and a distinct v0.5 service-worker cache.
- Provide safe v0.4 → v0.5 migration without deleting v0.4 state.
- Keep deterministic core logic separable from DOM code and directly testable with Node.
- Math correctness and state migration must be covered by automated tests.

## Required tests
At minimum add tests for:
- exact division only, no remainder
- divisor/quotient constrained to 1–9 fact families
- all generated answers inside intended curriculum bounds
- missing-number correctness
- unique answer options
- mastery update after first-try success, miss, and successful spaced revisit
- scheduling preference for weak/stale skills with bounded randomness
- v0.4 migration leaves source data untouched
- v0.5 state normalization across reload/day boundaries

Run all existing v0.4 tests plus new v0.5 tests.

## Browser validation
Use the available browser to exercise at least:
- iPad-like portrait viewport
- iPad-like landscape viewport
- Surface/tablet landscape viewport
- 5-question normal run
- 10-question weak-skill training
- 20-question Master Expedition
- first Division Bridge encounter
- wrong answer → hint/retry → spaced revisit
- mastery map opening/closing
- reload persistence

Record concrete issues found and repair them; do not declare browser acceptance based only on static inspection.

## Handoff / PR
When implementation is ready:
- push only the v0.5 branch
- allow Vercel to create a preview deployment
- open a Draft PR with base `feat/v0.4-mastery-expansion`
- include test results, browser scenarios exercised, known limitations, Vercel preview URL and exact head SHA
- mark the PR `DO NOT MERGE — child dogfood required`

## Stop conditions
Stop and ask for product judgment rather than inventing curriculum if:
- a new math concept goes beyond the contract
- a design choice would reveal answers too quickly and undermine productive struggle
- a change requires collecting child-identifying data
- promotion would alter any existing live/preview version

## Suggested Codex goal
Implement Number Quest v0.5 Learning Loop according to `docs/V05_LEARNING_LOOP.md` and this handoff. Work autonomously through implementation, tests, browser validation and repair on `feat/v0.5-learning-loop`. Preserve all previous versions. Finish with a Draft PR and a concise acceptance report; do not merge.
