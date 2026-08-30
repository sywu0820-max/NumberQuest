# Codex Handoff — Number Quest v0.8 Story Variety + Transfer

## Mission
Implement v0.8 according to `docs/V08_STORY_VARIETY_TRANSFER.md` on `feat/v0.8-story-transfer` only.

The branch was created from the accepted v0.7 head:
`c0633432b3579229f83b7d14ccee04fb2a74f9df`

Do not merge. Do not update or promote `beta`. Do not modify `main`.

## Read first
- `AGENTS.md`
- `docs/V08_STORY_VARIETY_TRANSFER.md`
- `docs/V06_STORY_VISUAL_LEARNING.md`
- `docs/OVERNIGHT_QUEUE_2026-08-29.md` for the accepted v0.7 memory contract
- accepted v0.6/v0.7 implementation and tests
- PR #4 and PR #5 review/repair history where useful

## Founder feedback to preserve
The founder likes Story Mission but found the stories too repetitive / too single-pattern.

Do not interpret this as “replace 宝石 with 动物.” The product requirement is transfer: the child should need to read the quantitative relationship even when the same skill repeats.

## Priority order
1. design a bounded declarative story catalog with stable template IDs and multiple themes;
2. separate mathematical relationship from story surface selection;
3. add within-run recent-template/theme avoidance;
4. ensure story semantics and visual hints agree, especially division sharing vs grouping;
5. preserve v0.5 same-session revisit and v0.7 cross-day memory identity;
6. add anti-shortcut, diversity, migration, and inherited regression tests;
7. real-browser validation and polish only after learning correctness is established.

## Engineering constraints
- no LLM or remote API in Story Mission generation;
- keep story generation deterministic with injectable RNG;
- keep learning-core logic directly testable outside the DOM;
- do not add new math curriculum or widen arithmetic bounds;
- do not weaken productive-struggle / no-answer-reveal guards;
- do not regress v0.7 scheduler reconciliation or due-identity freeze;
- prefer ephemeral per-run story-diversity state over persistent schema changes;
- if new story metadata is persisted, make normalization explicitly backward-compatible;
- no child-identifying data, account, cloud sync, or analytics.

## Required implementation shape
Use judgment on exact names, but the implementation should make these concepts inspectable/testable:
- stable story template ID;
- theme ID;
- semantic relationship ID;
- operation / skill compatibility;
- pure template selection/rendering;
- recent-template/theme exclusions or equivalent bounded diversity mechanism.

Do not couple theme to operation such that a child can infer the operation from the setting alone.

## Required review-sensitive edges
Pay particular attention to:

### 1. Division semantic orientation
For equal sharing, the known group count and unknown amount-per-group must match both story and visual.

For equal grouping, the known group size and unknown group count must match both story and visual.

Mathematical equivalence is not sufficient if the picture contradicts the story semantics.

### 2. Review identity
A stored v0.6/v0.7 story review must replay the exact scheduled story identity. Do not regenerate a new surface template during same-session or cross-day review.

### 3. Due identity freeze
Ordinary play must not overwrite an already-due Memory Chest story identity.

### 4. Anti-shortcut diversity
Static catalog size alone is insufficient. Validate actual generated 10-question Story Mission runs and enforce the minimum diversity contract.

## Automated validation
Run all prior v0.3–v0.7 tests plus new v0.8 tests.

At minimum cover every item in the `Required automated coverage` section of `docs/V08_STORY_VARIETY_TRANSFER.md`.

Also run stress/property-style checks where useful, especially:
- many seeded 10-question Story Mission runs for diversity invariants;
- many story generations per eligible skill for arithmetic/option correctness;
- sharing/grouping semantic alignment;
- stored story identity through v0.5 and v0.7 review paths.

## Browser validation
Run locally and against the exact deployed protected Vercel preview at:
- 768×1024
- 1024×768
- 1368×912

Do not only verify that buttons work. Capture or instrument the actual 10-question Story Mission sequence so the review can verify template/theme diversity.

Re-run inherited learning flows, including:
- productive-struggle visual hints;
- missing multiplication/divisor no-answer-reveal repairs;
- same-session spaced revisit;
- cross-day Memory Chest success/miss scheduling;
- due-identity freeze;
- ordinary/Story/Focus/Academy/Division modes;
- speech and unsupported fallback;
- mastery, collection, persistence, offline reload, touch target, overflow;
- zero console/page errors.

## PR / handoff
When ready:
- push only `feat/v0.8-story-transfer`;
- open a Draft PR against `feat/v0.7-cross-day-memory` at accepted v0.7 lineage, not against `beta`;
- keep it Draft and unmerged;
- include exact automated test results;
- include stress/diversity evidence;
- include browser matrix and actual story-diversity evidence;
- include repaired issues and known limitations;
- include protected Vercel preview, deployment status, and exact head SHA;
- explicitly state that `beta` and `main` remain unchanged.

Then send to the existing ChatGPT conversation:

`CODEX / NumberQuest v0.8 / REVIEW REQUEST`

Ask for independent correctness, learning-design, transfer/anti-shortcut, migration, test-coverage, browser-validation, and Vercel-head-alignment review.

## Repair loop
If ChatGPT finds blockers:
- repair every blocker;
- add regression coverage that would have caught it;
- rerun relevant stress/browser validation;
- push a new head;
- wait for Vercel READY;
- report back in the same conversation.

Do not stop because a Draft PR exists.

## Exit condition
Stop implementation only when ChatGPT explicitly states:

`Number Quest v0.8 is accepted for review gate`

After acceptance, do not invent v0.9 or promote beta without explicit founder direction.
