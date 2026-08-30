# Number Quest v0.9 — Adaptive Learning Journey + Motivation Architecture

## Status

DRAFT. Implement only on `feat/v0.9-adaptive-journey`, created from the accepted v0.8 head `13fddfaf2fd6860055f0157e255c61933276b5bd`.

Do not merge. Do not update or promote `beta`. Do not modify `main`.

Read `docs/GAMEFUL_LEARNING_PRODUCT_PRINCIPLES.md` before implementation.

## Product objective

Move Number Quest from a set of good learning modes into a coherent adaptive journey.

The system should answer two questions together:

1. What is the highest-value next learning experience for this child?
2. How should that experience be framed so the child still wants to continue voluntarily?

Learning value always outranks engagement optimization.

## Non-goals

- no new math curriculum;
- no LLM-generated questions;
- no account / cloud sync / child identity / remote analytics;
- no leaderboard, rank, streak-loss pressure, lives, energy gates, review debt or manipulative scarcity;
- no opaque black-box model required for sequencing;
- no replacement of v0.7 Memory Chest or v0.8 Story Transfer contracts;
- no fixed ability labels such as “weak child” or “advanced child.”

## V09-A — Today’s Adventure

Add a primary optional mode: `🧭 今日冒險`.

Default length: 10 questions.

The child-facing framing should feel like one coherent mission, not an analytics dashboard.

Ordinary Story Mission, Memory Chest, Focus, Academy, Division Bridge and world modes must remain available. Today’s Adventure must not lock them.

### Adaptive purposes

Every planned question has one machine-readable `journeyPurpose` from:

- `retrieval` — retrieve something learned before;
- `repair` — revisit a recently missed / fragile capability;
- `transfer` — demonstrate the same skill in a different representation or story context;
- `confidence` — an authentic but appropriately secure capability that lets the child experience competence;
- `growth` — the best current next challenge within already-unlocked curriculum.

The planner must balance learning value and motivational rhythm rather than simply serving the hardest skill repeatedly.

### Planning rules

Implement the planner as pure/testable logic with injectable RNG where randomness is used.

For a 10-question mission, when candidate availability permits:

- include at least 1 `retrieval` item;
- include at least 1 `repair` item when recent misses / due same-session revisits exist;
- include at least 1 `transfer` item when a skill has both symbolic and eligible story representation;
- include at least 1 `confidence` item;
- include at least 1 `growth` item;
- cover at least 4 distinct skill keys;
- never repeat the exact same question fingerprint consecutively;
- avoid the same skill more than twice consecutively;
- avoid more than 2 consecutive `repair` / high-friction items when alternatives exist;
- do not fill the run with mastered/easy items merely to maximize success rate.

If a category has no valid candidate, redistribute the slot to the highest-value available category without inventing curriculum.

### Cross-day retrieval integration

Today’s Adventure may include up to 2 currently due Memory Chest items.

If it does:

- use the exact scheduled Memory Chest identity;
- mark it as `isMemoryReview` and route success/miss through the accepted v0.7 reconciliation path;
- do not clone it as an unrelated ordinary question;
- completing it in Today’s Adventure must update the same Memory Chest schedule, so it cannot remain as duplicate due debt;
- a prompted / non-first-try result must not lengthen the cross-day interval;
- remaining due Memory Chest items stay available in the separate Memory Chest mode.

No duplicate fingerprint may appear in both the active Today’s Adventure plan and another slot in the same run.

### Same-session revisit integration

Accepted v0.5 same-session spaced reviews retain priority once due inside an active run. Integrating the planner must not make a missed question disappear or skip its productive-struggle / revisit contract.

## V09-B — Representation transfer

For `transfer` items, choose a representation that tests the same underlying skill without merely repeating the same surface form.

Examples:
- symbolic → v0.8 story;
- story → symbolic;
- story theme / relationship → a different eligible theme / relationship where mathematically equivalent and curriculum-safe.

Requirements:
- skill key remains correct;
- arithmetic bounds remain unchanged;
- story diversity and relationship semantics from v0.8 remain intact;
- transfer selection must not reveal the operation through fixed theme words;
- the planner must not misclassify a repeated identical representation as transfer.

## V09-C — Bounded learner agency after a miss

After the first wrong answer, do not immediately dump every available hint onto the child.

Offer two child-facing help choices when both are safe:

- `👀 看圖想一想` — show the level-1 visual scaffold;
- `💬 給我一句線索` — show the existing contextual text hint without rendering the visual scaffold.

Rules:
- both choices preserve the same answer and question identity;
- neither choice reveals the final answer;
- choosing text first does not permanently remove the visual choice;
- after a second miss, stronger visual organization may appear according to the accepted v0.6 productive-struggle ladder;
- no punishment for asking for help;
- controls must meet the existing touch-target requirement;
- unsupported visual cases degrade to safe text guidance rather than an answer reveal.

This is intentionally a small agency step, not a free-form tutor.

## V09-D — Motivation rhythm and feedback

Today’s Adventure should make authentic progress legible without turning learning into reward farming.

### During the run

Use child-facing framing around mission purpose, not system diagnosis.

Good examples:
- `🧠 找回一個以前會的力量`
- `🔄 換個故事也會嗎？`
- `🌱 試試下一個小挑戰`
- `✨ 這題你已經很熟了`

Avoid:
- weak skill
- remediation
- overdue
- retention score
- deficit
- rank
- accuracy percentage

### End-of-run recap

Show a concise capability recap derived from actual events, for example:
- how many cross-day abilities were independently retrieved;
- how many transfer items were independently solved;
- how many times the child recovered after a miss;
- one capability that became more secure / progressed.

Do not show a school-like grade, red error count, rank, or retention percentage.

Rewards may still exist, but the recap hierarchy must put capability growth before gems / collectibles.

## V09-E — Learner-state extension

Prefer backward-compatible extension of the existing `nq-state-v05` local state.

If journey-specific state is persisted, keep it small and interpretable, such as recent journey purposes / representations needed to avoid repetition.

Requirements:
- old v0.5 / v0.6 / v0.7 / v0.8 state loads safely;
- normalize without mutating source state;
- normal daily reset must not erase long-term memory schedule;
- no precise activity timestamps are required;
- no child-identifying fields;
- no remote analytics.

## Automated acceptance coverage

At minimum test:

1. deterministic / injectable-RNG Today’s Adventure planning;
2. purpose allocation across retrieval / repair / transfer / confidence / growth;
3. graceful redistribution when one purpose has no candidates;
4. >=4 distinct skills in a 10-question plan when candidate pool allows;
5. no consecutive duplicate fingerprints;
6. bounded same-skill / high-friction streaks when alternatives exist;
7. exact due Memory Chest identity can be embedded and reconciled without duplicate debt;
8. prompted memory retrieval does not lengthen interval;
9. remaining due Memory Chest items stay due after a partial adaptive run;
10. same-session spaced-review behavior remains intact;
11. transfer really changes representation / surface context while preserving skill identity;
12. v0.8 story diversity and division semantics remain correct;
13. first-miss hint choice exposes text vs visual help independently;
14. neither help path reveals the answer structurally or textually;
15. second-miss stronger hint remains answer-safe;
16. end-of-run recap reflects actual journey outcomes rather than fabricated metrics;
17. backward-compatible migration from accepted older state;
18. service-worker/cache successor isolation;
19. all prior v0.3–v0.8 tests remain green.

Add stress tests for planner sequencing across varied synthetic learner states, including highly weak-biased, highly mastered, many-due-memory, sparse-history, and story-heavy states.

## Real-browser validation

Validate locally and again on the exact protected Vercel head at:

- 768×1024 iPad portrait;
- 1024×768 iPad landscape;
- 1368×912 Surface landscape.

Required flows:

- Today’s Adventure visible and optional;
- a 10-question adaptive run with multiple journey purposes;
- due Memory Chest item inside Today’s Adventure and correct post-run reconciliation;
- separate Memory Chest still available for remaining due items;
- transfer symbolic ↔ story;
- first miss → choose text hint;
- first miss → choose visual hint;
- second miss → stronger scaffold;
- missing-factor / missing-divisor answer-safety regressions;
- v0.8 division sharing/grouping unit-neutral visual semantics;
- Story Mission diversity remains intact;
- ordinary world / Story / Focus / Academy / Division modes remain playable;
- reload persistence;
- offline reload after first successful load;
- visible primary controls >=44px;
- no horizontal overflow;
- zero console errors / page errors.

## Review gate

Open a Draft PR against `feat/v0.8-story-transfer`, not `beta`.

Do not merge or promote anything.

The stage is accepted only when ChatGPT independently inspects the real PR diff and says exactly:

`Number Quest v0.9 is accepted for review gate`

Only then may Stage v1.0 begin from the accepted v0.9 head.
