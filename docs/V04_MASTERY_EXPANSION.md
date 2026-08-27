# Number Quest v0.4 — Mastery Expansion

## Product goal
Turn the child's request for “more questions” into deeper learning rather than repetitive volume.

## New loops
- Choose 5 / 10 / 20 questions per world run.
- 10- and 20-question runs introduce missing-number questions such as `7 × ? = 42` and `? + 27 = 63`.
- A missed question returns after a short spacing interval in the same run.
- 10-question Focus Training biases toward weak skill families.
- 20-question Master Expedition mixes all unlocked skills.
- Multiplication mastery badges require both enough exposure and >=80% first-try accuracy.
- 10-combo milestones award a small bonus chest.

## Isolation
- v0.2 main remains production.
- v0.3 preview remains unchanged.
- v0.4 uses `nq-state-v04` and `number-quest-v04-1` cache namespaces.
- When promoted on the same origin, v0.4 can migrate legacy `nq-state-v03` progress once.

## Acceptance checks
- 5/10/20 lengths are selectable.
- All generated answers remain in valid math bounds.
- Missing-factor answers stay 1–9.
- Wrong questions return later in the same run.
- Mastery is not granted from a single lucky answer.
- Touch UI works in iPad portrait and Surface-class landscape widths.
