# Codex Handoff — Number Quest v0.9 → v1.0

## Mission

Execute two bounded stages serially:

1. v0.9 Adaptive Learning Journey + Motivation Architecture
2. v1.0 Complete Daily Learning Product

Speed is welcome. Scope invention is not.

Quality, learning correctness, child autonomy and accepted-state preservation outrank amount of code produced.

## Read first

Before implementation read, in order:

1. `AGENTS.md`
2. `docs/GAMEFUL_LEARNING_PRODUCT_PRINCIPLES.md`
3. `docs/V09_ADAPTIVE_LEARNING_JOURNEY.md`
4. `docs/V10_COMPLETE_DAILY_LEARNING_PRODUCT.md`
5. accepted v0.5–v0.8 core/tests relevant to learning, Story Transfer, visual hints and Memory Chest

Treat repository truth and these contracts as authoritative. Do not depend on old Codex conversation context.

## Global guardrails

- Do not merge any PR.
- Do not update or promote `beta`.
- Do not modify `main`.
- Do not create v1.1 or invent additional curriculum.
- Do not add accounts, cloud sync, child identity, remote analytics, leaderboards, lives, energy gates, streak-loss mechanics or review-debt framing.
- Do not weaken productive struggle to improve completion metrics.
- Do not use an LLM for question generation or grading.
- Do not replace accepted tests with weaker assertions merely to make a successor shell pass.
- Preserve local-only privacy and backward-compatible learning state.

If any contract requirement genuinely requires founder product/curriculum judgment, stop that workstream and send ChatGPT the exact decision required. Do not guess.

---

# Stage 1 — v0.9

## Branch

Work only on:

`feat/v0.9-adaptive-journey`

It was created from accepted v0.8 exact head:

`13fddfaf2fd6860055f0157e255c61933276b5bd`

The branch already contains the v0.9/v1.0 planning docs. Fetch origin and verify them before coding.

## Implementation contract

Implement `docs/V09_ADAPTIVE_LEARNING_JOURNEY.md` completely but boundedly.

Priority:
1. pure/testable Today’s Adventure planner;
2. exact integration with v0.7 Memory Chest and v0.5 same-session revisit ownership;
3. real representation transfer using accepted v0.8 Story Transfer;
4. first-miss child help choice;
5. authentic capability-focused mission recap;
6. migration/cache/UI polish after correctness.

## Validation

Run all prior automated tests plus new v0.9 tests.

Add stress generation for varied learner-state distributions and scheduler interleavings.

Use real browser validation locally and on the exact protected Vercel preview at:
- 768×1024;
- 1024×768;
- 1368×912.

Validate all contract flows, touch targets, horizontal overflow, offline reload, console errors and page errors.

## PR

Open a Draft PR:

- head: `feat/v0.9-adaptive-journey`
- base: `feat/v0.8-story-transfer`

Include:
- exact automated results;
- stress results;
- browser matrix;
- repaired issues found during implementation;
- known limitations;
- protected Vercel preview;
- deployment ID;
- exact head SHA.

Send to the existing ChatGPT conversation:

`CODEX / NumberQuest v0.9 / REVIEW REQUEST`

Ask for independent review against the written contract.

## Repair loop

If ChatGPT finds blockers:
- repair every blocker;
- add targeted regressions;
- rerun relevant stress/browser validation;
- push a new head;
- wait for Vercel READY;
- return to the same ChatGPT conversation for re-review.

Do not advance because your own tests are green.

## v0.9 exit condition

Advance only after ChatGPT states exactly:

`Number Quest v0.9 is accepted for review gate`

---

# Stage 2 — v1.0

## Branch creation

Only after v0.9 acceptance:

Create:

`feat/v1.0-complete-daily-product`

from the exact accepted v0.9 head.

Do not branch from `beta`, `main`, or the pre-repair v0.9 head.

## Implementation contract

Implement `docs/V10_COMPLETE_DAILY_LEARNING_PRODUCT.md`.

Priority:
1. child-first home hierarchy / primary Today’s Adventure;
2. lightweight no-account onboarding;
3. complete daily mission loop preserving v0.5–v0.9 contracts;
4. authentic capability recap;
5. meaningful capability-map ownership;
6. local non-shaming parent view;
7. healthy-motivation audit;
8. migration/offline/responsive/reliability hardening.

Do not add new curriculum merely to make 1.0 appear larger.

## Validation

Run the entire inherited suite plus v1.0 coverage and stress tests.

Use real browser validation locally and on exact-head protected Vercel at the same three required viewports.

Validate both fresh-child and returning-child flows from the v1.0 contract.

## PR

Open a Draft PR:

- head: `feat/v1.0-complete-daily-product`
- base: the accepted `feat/v0.9-adaptive-journey` branch

Do not target `beta`.

Send to ChatGPT:

`CODEX / NumberQuest v1.0 / REVIEW REQUEST`

Repair until accepted or founder judgment is required.

## v1.0 exit condition

Stop only when ChatGPT states exactly:

`Number Quest v1.0 is accepted for founder dogfood`

Then stop coding.

Do not merge, promote beta, touch main, or invent v1.1.

Provide a concise handoff with:
- accepted v0.9 and v1.0 PRs / exact heads;
- exact protected previews;
- test + stress results;
- browser validation summary;
- known limitations;
- explicit statement that no merge/promotion occurred.

The founder then personally dogfoods v1.0 before any promotion decision.
