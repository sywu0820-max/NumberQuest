# Number Quest v0.5 — Learning Loop

## Status
DRAFT. Do not merge into v0.4, v0.3, or `main` without explicit founder approval.

## Product signal
The child voluntarily asked for more questions after enjoying v0.3/v0.4. v0.5 should convert that motivation into deeper mathematical learning without making the experience feel like schoolwork.

## Product objective
Evolve Number Quest from a game that generates practice questions into a lightweight adaptive learning loop:

Play → Observe → Estimate mastery → Choose next challenge → Productive struggle → Spaced revisit → Mastery.

The child should experience adventure, challenge, discovery, collection and progress. The learning system should remain mostly invisible.

## Scope

### V05-A — Mastery / scheduling model
- Preserve per-skill history rather than only aggregate weakness.
- Track attempts, first-try correct, recent misses, successful revisits and last practiced time/session.
- Expose a deterministic `nextChallenge` / scheduling layer that can favor weak or stale skills without starving mastered skills.
- Missed questions should return after spacing, not immediately unless the child chooses a hint/retry interaction.
- No cloud account or child-identifying data. State remains local on device.

### V05-B — Division Bridge
Introduce division only as the inverse of already-known multiplication facts.

Allowed examples:
- `42 ÷ 7 = ?`
- `? × 7 = 42`
- `42 ÷ ? = 6`
- simple equal-group story prompts where divisor, quotient and total remain within the 1–9 multiplication table.

Constraints:
- Exact integer answers only.
- Dividend must come from a 1–9 multiplication fact.
- No remainder.
- No long division algorithm.
- Do not introduce division symbols before the player has demonstrated basic multiplication exposure; provide a gentle bridge explanation the first time.

### V05-C — Number sense
Add a small set of reasoning formats that deepen understanding rather than merely increase arithmetic size:
- missing addend/subtrahend (`? + 27 = 63`, `81 − ? = 35`)
- make-10 / make-100 friendly decompositions
- compare which expression is closer to a target such as 50 or 100
- simple two-step decomposition prompts when appropriate

Keep arithmetic within the existing <=100 boundary for this version.

### V05-D — Child-facing mastery map
- Keep the current badge/game framing.
- Show multiplication, division bridge and addition/subtraction progress as powers/badges rather than grades.
- Do not show percentages, red failure labels, class rank or comparative scoring.
- A weak area should be framed as a next adventure, not a deficit.

## Productive struggle contract
When a child is wrong:
1. Never deduct a life or erase earned progress.
2. Give a small contextual hint before giving the answer.
3. Allow another attempt.
4. Revisit the concept later after spacing.
5. Record whether the later revisit was solved independently.

Do not turn hints into instant answer reveal.

## Retention contract
Preserve v0.4 features unless a change is explicitly justified:
- 5 / 10 / 20 question runs
- Daily quests and streak
- Boss cadence
- Collection system
- Weak-skill training
- Master Expedition
- touch-first iPad / Surface UX

## State isolation
- Use a new localStorage namespace: `nq-state-v05`.
- Provide migration from v0.4 state when v0.5 is eventually promoted on the same origin.
- Never overwrite v0.4 state during preview dogfood.
- Use a new service-worker cache namespace for v0.5.

## Acceptance criteria
- Existing v0.4 core invariants continue to pass.
- Division generator never emits remainder/non-integer cases.
- Division facts stay within the 1–9 multiplication table.
- Missing-number questions always have one valid answer and four unique choices where multiple-choice is used.
- Scheduler demonstrably increases probability of weak/stale skills while keeping bounded variety.
- A missed skill can be observed returning after spacing and succeeding independently.
- v0.5 preview uses isolated localStorage/cache and cannot modify v0.4 preview or production state.
- Touch targets remain suitable for iPad and Surface.
- Vercel preview is READY and externally smoke-tested before child dogfood.

## Explicit non-goals
- No long division.
- No fractions or decimals.
- No >100 arithmetic curriculum expansion.
- No leaderboard or child-vs-child competition.
- No account/login requirement.
- No cloud analytics containing child-identifying data.
- No LLM dependency in the gameplay loop.
