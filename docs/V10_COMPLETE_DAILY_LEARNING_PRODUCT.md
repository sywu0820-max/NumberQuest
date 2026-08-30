# Number Quest v1.0 — Complete Daily Learning Product

## Status

FORWARD CONTRACT. Do not implement until v0.9 has been independently accepted.

When v0.9 is accepted, create `feat/v1.0-complete-daily-product` from the exact accepted v0.9 head. Do not branch from `beta` or `main`.

Do not merge. Do not promote `beta`. Do not modify `main` without explicit founder approval after the v1.0 review gate and dogfood.

## Product objective

Number Quest v1.0 is not defined by feature count.

It is the first version that should feel like a complete daily learning product a child can independently use:

Enter → understand today’s mission → retrieve / learn / transfer → struggle productively → choose safe help → recover → see authentic capability growth → leave satisfied → willingly return later.

The product should support a healthy 10–20 minute daily experience without requiring a parent to operate the UI.

## v1.0 success definition

A successful v1.0 demonstrates all of the following:

1. child independence — the main journey is understandable without an adult navigating modes;
2. learning correctness — the product still protects productive struggle and curriculum bounds;
3. retention — cross-day retrieval remains first-class;
4. transfer — surface changes do not create fake mastery;
5. adaptive sequencing — the daily journey balances challenge, retrieval, repair, confidence and novelty;
6. healthy motivation — the child sees real growth without coercive engagement mechanics;
7. parent visibility — an adult can understand progress locally without ranking, shaming or surveillance;
8. product reliability — responsive, offline-capable after first load, reload-safe and state-compatible.

## Non-goals

- no account system;
- no cloud sync;
- no child name requirement;
- no remote analytics;
- no social leaderboard / rank;
- no school grade labels;
- no LLM-generated curriculum or open-ended grading;
- no new math curriculum merely to make v1.0 feel larger;
- no monetization gate that interrupts the learning loop;
- no streak-loss / lives / energy / scarcity pressure.

## V10-A — Child-first home hierarchy

The home screen must make the next healthy action obvious.

Primary CTA:

`🚀 開始今天的冒險`

This launches the accepted v0.9 adaptive journey.

The home screen should communicate, in child language:
- today’s approximate mission length;
- whether some remembered powers have returned;
- one positive theme / purpose for today;
- authentic progress, not diagnosis.

Memory Chest remains visible when due, but Today’s Adventure may already consume a bounded subset of due items according to the accepted v0.9 contract.

Existing specialist modes remain accessible under a lower-priority `更多冒險` / equivalent area:
- Story Mission;
- Memory Chest;
- Focus;
- Academy;
- Division Bridge;
- worlds.

Do not delete working specialist modes merely to simplify the home screen.

## V10-B — First-run onboarding

Add lightweight first-run onboarding for a child using the device for the first time.

Constraints:
- maximum 3 short screens / steps before play;
- no account or name collection;
- no age / grade requirement;
- explain by doing rather than through dense text;
- communicate that mistakes are normal and hints help thinking rather than reveal answers;
- end with a playable first mission quickly.

The child should understand:
- choose an answer;
- a miss is part of the adventure;
- help is available;
- progress means powers getting stronger over time.

Onboarding completion is stored locally and can be reset for testing.

## V10-C — Complete daily mission loop

The v0.9 Today’s Adventure becomes the default daily loop.

A normal daily run should typically be 10 questions and fit roughly 10–15 minutes for the target learner, while optional specialist modes can extend play.

The loop must preserve:
- exact Memory Chest scheduling / reconciliation;
- same-session spaced revisit;
- Story Transfer diversity;
- bounded adaptive purposes;
- first-miss agency;
- answer-safe stronger hints;
- ordinary play even when reviews are due.

The child must never be blocked from learning because a reward meter, streak, life or energy state is empty.

## V10-D — Authentic progress recap

At the end of the daily mission, show a concise child-facing recap focused on demonstrated capability.

Candidate recap signals:
- `🧠 今天自己想起來 X 個以前學過的力量`
- `🔄 X 次換個故事還是會`
- `🧩 X 次卡住後自己找回來`
- `✨ 某個能力變得更穩了`

Do not show:
- grade / score out of 100;
- rank;
- red error count;
- retention percentage;
- deficit language;
- comparative labels versus other children.

Gems / collectibles may appear after the capability recap, not above it.

## V10-E — Capability map as meaningful ownership

Evolve the existing mastery map so it communicates real capability progression rather than only activity.

At minimum distinguish child-friendly states corresponding to:
- explored / first exposure;
- growing / some independent success;
- remembered / successful revisit;
- strong / retained and/or transferred mastery.

Exact internal thresholds remain deterministic and testable.

Requirements:
- no school grades;
- no red failure state;
- no permanent “weak” labels;
- capability can strengthen after successful retrieval / transfer;
- a recent miss may affect scheduling without visually erasing earned progress in a punitive way;
- ownership comes from `my growing map`, not from grinding volume.

## V10-F — Local parent view

Add a clearly secondary local-only adult summary, framed as `給大人看` / equivalent.

Purpose: help a parent support the child without turning the product into surveillance.

Show only interpretable learning signals already available locally, for example:
- abilities recently practiced;
- abilities showing stable independent retrieval;
- abilities still being built;
- recent transfer evidence;
- next useful support suggestion such as `可以請孩子說說他怎麼想`.

Do not show:
- rank or percentile;
- comparisons with other children;
- “behind grade level” labels;
- shame / deficit language;
- exact behavioral tracking timelines;
- child identity or cloud data.

The parent view must not expose internal technical jargon such as scheduler weights or retention probability.

## V10-G — Healthy motivation guardrails

Audit the entire child-facing product against `docs/GAMEFUL_LEARNING_PRODUCT_PRINCIPLES.md`.

Required properties:
- progression reflects authentic learning;
- rewards cannot be efficiently farmed by choosing only trivial activity;
- no streak-loss anxiety;
- no forced review debt;
- no lives / energy gates;
- no gambling-shaped randomized rewards;
- no child leaderboard;
- curiosity comes from missions, stories and discovery;
- agency is bounded and learning-safe;
- the child can stop after a completed mission without a guilt / loss prompt.

## V10-H — Reliability and product polish

v1.0 must preserve the PWA / offline baseline.

Required:
- local persistence survives reload;
- old accepted v0.5–v0.9 state migrates safely;
- no destructive state namespace churn without explicit migration;
- service worker uses a distinct v1.0 cache family and does not delete prior families outside its own namespace;
- offline reload works after one successful online load;
- touch targets remain >=44px;
- no horizontal overflow on supported viewports;
- child-facing text remains readable on iPad portrait/landscape and Surface;
- zero console/page errors in the validation matrix;
- no required network API for gameplay.

## Automated acceptance coverage

At minimum test:

1. first-run onboarding state and safe migration;
2. onboarding has no identity/account requirements;
3. primary Today’s Adventure remains playable immediately after onboarding;
4. home hierarchy keeps specialist modes reachable but secondary;
5. end-of-run capability recap is derived from real run events;
6. recap cannot fabricate retrieval / transfer achievements;
7. mastery/capability-map progression responds correctly to independent success, revisit and transfer;
8. a miss does not punitively erase earned capability state;
9. parent view derives only local interpretable signals;
10. parent view contains no rank / comparison / deficit / scheduler-jargon strings;
11. no coercive engagement mechanics are introduced;
12. old state v0.5 through accepted v0.9 normalizes safely without source mutation;
13. Memory Chest and adaptive planner remain reconciled without duplicate due identities;
14. productive-struggle answer-safety regressions remain green;
15. v0.8 story semantic/quantity regressions remain green;
16. offline asset/cache isolation;
17. all prior tests remain green.

Add stress coverage for:
- repeated daily normalization across simulated days;
- mixed onboarding-old-state cases;
- long-running capability-map updates;
- adaptive + memory + same-session scheduler interleavings;
- reward / recap invariants under repeated misses and retries.

## Real-browser validation

Validate locally and on the exact protected Vercel head at:

- 768×1024 iPad portrait;
- 1024×768 iPad landscape;
- 1368×912 Surface landscape.

Required flows:

### New child
- fresh local storage;
- first-run onboarding;
- enter first Today’s Adventure without adult configuration;
- miss → choose help → recover;
- complete run → understand capability recap;
- return home and find next options.

### Returning child
- migrated accepted older state;
- due Memory Chest visible;
- Today’s Adventure consumes bounded due review correctly;
- remaining Memory Chest items remain available;
- Story Transfer and adaptive representation changes occur;
- capability map reflects real progress;
- parent view is understandable and non-shaming.

### Reliability
- reload mid-home / after session;
- offline reload after first load;
- no horizontal overflow;
- >=44px primary touch targets;
- speech fallback remains safe;
- zero console/page errors.

## Founder dogfood gate

Even after technical review acceptance, v1.0 is not automatically promoted.

Required sequence:

1. Codex implementation + tests + local browser validation;
2. protected exact-head Vercel preview;
3. Draft PR against the accepted v0.9 branch;
4. independent ChatGPT review / repair loop;
5. ChatGPT says exactly:

`Number Quest v1.0 is accepted for founder dogfood`

6. Founder personally dogfoods the accepted v1.0 preview.

Only after that may a separate explicit decision be made about merging / promoting `beta`. `main` remains untouched unless separately approved.
