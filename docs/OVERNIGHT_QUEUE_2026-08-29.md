# Number Quest Overnight Queue — 2026-08-29

## Operating rule
This queue is intentionally bounded. Quality, math correctness and child learning design outrank amount of code produced.

Do not merge any PR. Do not move `beta`. Do not modify `main`.

ChatGPT is the independent reviewer between stages. Codex must not advance to the next stage until ChatGPT explicitly accepts the current stage.

## Stage 1 — v0.6 Story + Visual Learning
Branch: `feat/v0.6-story-visual-learning`
Contract: `docs/V06_STORY_VISUAL_LEARNING.md`
Handoff: `docs/CODEX_V06_HANDOFF.md`

Complete implementation → tests → browser validation → protected Vercel preview → Draft PR against `beta` → ChatGPT review → repair loop.

Advance only after ChatGPT says:
`Number Quest v0.6 is accepted for overnight gate`.

## Stage 2 — v0.7 Cross-Day Memory
Only after Stage 1 acceptance, create `feat/v0.7-cross-day-memory` from the accepted v0.6 head. Do not branch from `beta`, because Beta will intentionally remain unchanged overnight.

### Objective
Turn the current same-session learning loop into a lightweight long-term memory scheduler without adding new math curriculum.

Learning loop:
Practice → miss / success → schedule concept revisit → return on a later day → independently retrieve → lengthen interval.

### Required behavior
- Add per-skill review scheduling using local day keys, not precise child activity timestamps.
- Suggested bounded intervals: 1 day → 3 days → 7 days → 14 days.
- A miss or failed independent revisit should shorten/reset the interval.
- A successful first-try cross-day revisit should lengthen the interval.
- Mastered skills still retain a low nonzero review probability.
- Due reviews should be visible as a game element such as `🧠 記憶寶箱`, not a homework debt counter.
- The child can play ordinary adventures even if review items are due.
- Daily memory review should be short by default (around 5 questions) and adaptive.
- Reuse story / symbolic formats where mathematically eligible; do not create new curriculum.

### Child-facing framing
Good:
- `🧠 昨天的力量回來了！`
- `✨ 這個能力記得更久了`

Avoid:
- overdue
- failed review
- retention percentage
- grade / rank / red deficit labels

### State
- Prefer backward-compatible extension of the latest learning state.
- Preserve current local-only privacy model.
- No account, cloud sync, child name or remote analytics.

### Required tests
- due date calculation across day boundaries
- 1/3/7/14-day interval progression
- failed revisit interval reset/shortening
- successful independent revisit progression
- no duplicate due items for the same skill/review identity
- normal daily reset does not erase long-term review schedule
- stale/mastered scheduler weighting remains bounded
- old v0.5/v0.6 state migrates safely
- all prior tests remain green

### Browser validation
- simulate next-day state and show Memory Chest
- complete 5-question memory run
- mix symbolic + story question where eligible
- fail a review, retry without answer reveal, confirm future scheduling remains correct
- successful review updates child-facing power feedback
- reload persistence
- iPad portrait/landscape + Surface
- no regression to Story Mission / Division Bridge / existing modes

### PR / review
Open Draft PR against the accepted v0.6 branch, not `beta`.
Send in ChatGPT browser:
`CODEX / NumberQuest v0.7 / REVIEW REQUEST`

Repair until ChatGPT either accepts the overnight gate or asks for founder product judgment.

## Hard stop
Stop immediately and leave a clear status report if any of these arise:
- curriculum decision beyond the contracts above
- need to collect child-identifying or cloud data
- uncertainty about revealing answers vs productive struggle
- request to merge / promote Beta / touch main
- unexpected migration risk to existing child progress

If Stage 2 is accepted early, do not invent v0.8. Spend remaining time on regression coverage, browser polish, documentation and a concise morning handoff.
