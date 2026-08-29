# Codex Handoff — Number Quest v0.6 Story + Visual Learning

## Mission
Implement v0.6 according to `docs/V06_STORY_VISUAL_LEARNING.md` on `feat/v0.6-story-visual-learning` only.

Read first:
- `AGENTS.md`
- `docs/V06_STORY_VISUAL_LEARNING.md`
- v0.5 implementation and tests
- current Beta channel contract

Do not merge. Do not update `beta` or `main`.

## Priority order
1. deterministic story generator + eligibility rules
2. visual hint model + productive-struggle integration
3. browser speech-synthesis read-aloud
4. tests and browser validation
5. UI polish only after math/state correctness

## Engineering constraints
- keep learning core directly testable outside the DOM
- prefer pure functions for story generation / visual-model generation
- no LLM/API dependency in gameplay
- reuse v0.5 skill keys and learning history
- preserve spaced-review semantics
- no answer reveal inside visual hints
- no child-identifying data

## Required automated coverage
At minimum:
- addition/subtraction/multiplication/division story correctness
- story eligibility follows existing unlocked/exposed skills
- division story families are restricted by `eligibleDivisionSkills()`
- one valid answer + unique options
- visual-model correctness for representative add/sub/mul/div/make10/make100 questions
- no visual hint object contains the final answer as an explicit answer field/text reveal
- story miss → retry → spacing → independent revisit
- v0.5 migration/state invariants still pass
- service-worker / asset isolation if cache changes

Run all existing v0.3, v0.4 and v0.5 tests plus new v0.6 tests.

## Browser validation
Use the real browser, not static inspection only:
- 768×1024 iPad portrait
- 1024×768 iPad landscape
- 1368×912 Surface landscape
- Story Mission addition and subtraction
- Story Mission multiplication with exposed family
- Story Mission division with eligible family
- wrong answer → visual hint → retry → later spaced revisit
- `🔊` read aloud when speech synthesis is available; verify graceful fallback path when unavailable
- 5 / 10 / 20 existing runs remain playable
- mastery map / collection / Division Bridge remain usable
- visible primary controls >=44px touch target
- zero console/page errors

## Handoff
When ready:
- push only `feat/v0.6-story-visual-learning`
- open a Draft PR against `beta`
- mark it `DO NOT MERGE — overnight review / child dogfood required`
- include exact test result, browser matrix, repaired issues, known limitations, Vercel preview, deployment ID and exact head SHA
- use the already-open ChatGPT conversation in the built-in browser and send:

`CODEX / NumberQuest v0.6 / REVIEW REQUEST`

Then ask ChatGPT for independent PR review.

## Repair loop
If ChatGPT finds blockers:
- repair every blocker
- add regressions
- rerun relevant browser validation
- push, wait for Vercel READY
- report back in the same ChatGPT conversation

Do not stop just because a PR was opened.

## Exit condition
Stop v0.6 only when ChatGPT explicitly says:
`Number Quest v0.6 is accepted for overnight gate`

After that, follow `docs/OVERNIGHT_QUEUE_2026-08-29.md` for the next bounded task. Do not promote `beta` while the founder is asleep.
