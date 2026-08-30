# Number Quest v0.8 — Story Variety + Transfer

## Status
DRAFT. Implement only on `feat/v0.8-story-transfer`, created from the accepted v0.7 head `c0633432b3579229f83b7d14ccee04fb2a74f9df`.

Do not merge. Do not update or promote `beta`. Do not modify `main`.

## Founder signal
Founder dogfood feedback after v0.7:

> Story Mission is liked, but the questions feel too repetitive / too single-pattern.

Treat this as a product and curriculum requirement, not as a cosmetic copywriting request.

## Product objective
Make Story Mission test transfer of mathematical understanding rather than recognition of a repeated surface template.

Desired child loop:

Read a new situation → identify the quantitative relationship → choose the operation / model → productive struggle → solve independently.

The child should not be able to infer the operation mainly from a repeated noun, setting, or fixed sentence shape.

## Core principle
**The mathematics stays stable while the surface story changes.**

v0.8 should increase semantic variety without adding new curriculum, new arithmetic ranges, or LLM-generated content.

## V08-A — Deterministic story catalog
Replace the one-template-per-operation feel with a deterministic, unit-testable story catalog.

Minimum story themes: at least 8 distinct child-friendly themes. Suggested themes include:
- space / rockets
- animals
- food / picnic
- transport
- building / construction
- ocean / nature
- games / collecting
- art / stickers
- adventure / treasure
- everyday family life

The exact theme list may vary, but each retained theme should be usable across multiple operations so a theme does not become an operation shortcut.

### Required relationship variety
At minimum support these semantic relationship families:

Addition:
- combine two quantities
- increase / join over time

Subtraction:
- remove / use / leave
- compare two quantities and ask the difference

Multiplication:
- equal groups
- repeated rate / rows / repeated days, while keeping the same multiplication curriculum

Division:
- equal sharing: total ÷ number of groups = amount per group
- equal grouping: total ÷ group size = number of groups

No multi-step problems in v0.8.

## V08-B — Anti-shortcut design
Story variety is not achieved merely by swapping nouns.

Requirements:
- the same theme must appear under more than one operation family;
- avoid one-to-one mappings such as “寶箱 always means multiplication” or “火箭能量 always means subtraction”;
- story prompts should not include symbolic operator hints such as `+`, `−`, `×`, `÷`, or `=`;
- no explicit instruction such as “請用加法” / “這是除法題”;
- no irrelevant numbers or trick wording;
- no dependence on keyword classifiers to choose the answer;
- operation comes from the existing skill / mathematical relationship first, then a compatible story surface is selected.

The wording may still naturally describe the mathematical relationship. The goal is not to hide meaning; the goal is to prevent shallow theme/template recognition.

## V08-C — Within-run diversity
Story Mission should avoid obvious repetition inside one play session.

Implement a bounded recent-template avoidance mechanism without adding cloud state.

Preferred shape:
- story generator remains pure/testable;
- it can accept recent template IDs / exclusions;
- the app keeps only a small ephemeral recent-story list for the current run;
- do not add persistent state solely to remember cosmetic story variety unless genuinely necessary.

Acceptance target for a 10-question Story Mission when enough eligible templates exist:
- at least 6 distinct story template IDs;
- at least 4 distinct themes;
- no identical story text on consecutive questions;
- no identical template ID on consecutive questions;
- avoid repeating the same theme more than twice in a row.

These are minimum guards, not a requirement to maximize randomness.

## V08-D — Preserve exact mathematical semantics
Every story must remain mathematically identical to the generated question fields.

Requirements:
- addition/subtraction remain within currently eligible bounds and <= 100;
- multiplication only uses already-exposed multiplication families;
- division only uses `eligibleDivisionSkills()` families;
- no remainder, fractions, decimals, negative answers, or ambiguous interpretation;
- answer options remain unique and contain exactly one correct answer;
- story text must stay short and readable for a roughly 7-year-old reader;
- all quantities in the story correspond to the actual mathematical model.

### Division semantic alignment
This is a specific regression risk.

If a division story is an **equal-sharing** story, the story and visual model must represent:
- known total
- known number of groups
- unknown amount per group

If a division story is an **equal-grouping** story, the story and visual model must represent:
- known total
- known group size
- unknown number of groups

Do not render a mathematically equivalent but semantically reversed visual that contradicts the story relationship.

## V08-E — Productive-struggle integration
Reuse the accepted v0.6 visual-hint contract and v0.7 memory contract.

Requirements:
- first miss still gives a lightweight visual clue;
- second miss may give stronger organization;
- do not directly print the final answer;
- preserve the repaired missing-factor / missing-divisor protections;
- story-specific visual models must match the actual story relationship;
- no hint regression may turn a transfer question into an answer reveal.

## V08-F — Review and memory identity
v0.8 must not break accepted v0.5/v0.6/v0.7 review behavior.

Requirements:
- same-session spaced revisit preserves the exact scheduled story identity;
- cross-day Memory Chest preserves the exact stored story identity;
- a due Memory Chest identity remains frozen against ordinary-play replacement as accepted in v0.7;
- one scheduled identity per skill remains intact;
- adding optional story metadata must not create duplicate review identities or corrupt fingerprints;
- old v0.5/v0.6/v0.7 local state migrates safely and remains local-only.

If template/theme/relation metadata is persisted, add explicit backward-compatible normalization tests.

## V08-G — Determinism and architecture
No LLM is used to generate Story Mission content in v0.8.

Preferred architecture:
- declarative story catalog / template definitions;
- pure selection / rendering functions in the learning core;
- injectable RNG for deterministic tests;
- stable template IDs for testability and debugging;
- math generation remains separate from story surface selection where practical.

Do not create an architecture that makes future localization impossible, but full i18n is not required in v0.8.

## Required automated coverage
At minimum add tests for:

1. catalog diversity and stable template IDs;
2. each retained theme supports multiple operation families;
3. addition combine + increase semantics;
4. subtraction remove + compare-difference semantics;
5. multiplication equal-group + repeated-rate semantics;
6. division sharing + grouping semantics;
7. visual-hint semantic alignment for both division relationship types;
8. no operator symbols / explicit operation labels in story prompt text;
9. unique answer options with exactly one valid answer;
10. arithmetic eligibility and <=100 bounds;
11. deterministic selection with injectable RNG;
12. 10-question within-run diversity target: >=6 templates, >=4 themes, no immediate template/text repeat, no >2 same-theme streak;
13. same-session story miss → retry → spaced revisit preserves exact identity;
14. cross-day Memory Chest preserves exact story identity and interval behavior;
15. v0.7 cross-scheduler reconciliation, due-identity freeze, and mastered weighted selection remain green;
16. old state normalization remains non-mutating and safe;
17. all prior v0.3–v0.7 tests remain green.

Add a targeted anti-shortcut regression that would fail if all templates for one theme collapse to one operation family.

## Browser validation
Use the real browser locally and again on the exact protected Vercel head.

Required viewports:
- 768×1024 iPad portrait
- 1024×768 iPad landscape
- 1368×912 Surface landscape

Required scenarios:
- complete a 10-question Story Mission and inspect actual story diversity;
- verify >=6 template IDs and >=4 themes in that run or equivalent instrumentation/harness evidence;
- exercise at least two semantic relationship families each for add/sub/mul/div when curriculum eligibility allows;
- division equal-sharing visual hint matches the story;
- division equal-grouping visual hint matches the story;
- wrong answer → level 1 hint → retry → level 2 hint where applicable;
- inherited missing-factor/missing-divisor no-answer-reveal regressions;
- same-session revisit;
- next-day Memory Chest story identity;
- ordinary modes remain available;
- Story / Focus / Academy / Division Bridge / Memory Chest remain usable;
- speech read-aloud / cancellation / unsupported fallback;
- reload persistence;
- offline reload after first load;
- visible primary controls >=44 px;
- no horizontal overflow at required viewports;
- zero console errors and zero page errors.

## Acceptance criteria
v0.8 is ready for independent review only when:
- story variety is materially visible in real play, not only in a catalog file;
- a child cannot rely on a one-theme/one-operation mapping;
- semantic relationship and visual model agree;
- no new curriculum is introduced;
- accepted v0.5–v0.7 learning and memory loops remain intact;
- automated and browser validations pass;
- protected Vercel preview is READY and exact-head aligned;
- PR remains Draft and unmerged.

### Founder-facing acceptance sentence
A useful qualitative test is:

> If the same math skill appears repeatedly, the child should still need to read the new situation rather than recognize a memorized story shell.

## Explicit non-goals
- no LLM-generated stories;
- no open-ended natural-language answers;
- no multi-step word problems;
- no new arithmetic curriculum or ranges;
- no fractions / decimals / long division;
- no school grade labels;
- no account / cloud sync / child-identifying data;
- no parent dashboard expansion;
- no v0.9 adaptive-learning orchestration yet;
- no merge, beta promotion, or main update without explicit founder approval.
