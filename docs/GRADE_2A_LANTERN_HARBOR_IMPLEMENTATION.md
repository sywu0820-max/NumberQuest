# 百光港 implementation report

Status: bounded first playable Grade 2A World, stacked on the accepted curriculum foundation.

## Product slice

百光港 makes the child the harbor signal keeper. The mathematical action is the mission action:

- repair a missing signal in a number sequence;
- build a signal from hundreds, tens and ones;
- translate an old chart representation into a working signal;
- route a ship by comparing two signals.

A correct action lights a beacon and moves the ship. A miss creates recoverable fog, never removes progress or rewards, offers answer-safe help, and returns the same skill with fresh quantities.

## Completion boundary

The only completion-required skills are:

- `g2a.num.count-200`
- `g2a.num.compose-200`
- `g2a.num.represent-200`
- `g2a.num.compare-200`

The `g2a.num.*-300-extension` skills remain explicit eligibility branches. Even when a 300 range is eligible, they are not added to `completionSkillIds` and extension-only evidence cannot complete the World. The default shipped run remains bounded to 101–200.

## Learning-loop integration

百光港 uses the accepted v1.0 local state and evidence functions. Misses, independent success, same-session review, cross-session Memory, capability evidence, and the adult summary remain in the existing state namespace. Interactive harbor review identities are excluded from the standard multiple-choice journey and Memory Chest, then owned by 百光港. A review is regenerated with fresh numbers while retaining the original scheduler identity for reconciliation.

Runtime pedagogy metadata is a tested exact subset of `curriculum/grade-2a.skill-graph.json`; no publisher layer appears in child-facing play.

## Validation contract

- Full Node test suite, including deterministic generation and 1,200-seed stress coverage.
- Shipped browser semantic harness: `tests/grade-2a-lantern-browser-harness.html`.
- Real-browser first-run, miss/help/fresh-retry, complete eight-mission loop, returning-user reload, and page/console error checks.
- Responsive matrix: 1440×900, Surface 1368×912, iPad 1024×768 and 820×1180, mobile 390×844.
- Service-worker cache includes the new core module; reload and offline checks protect the inherited cache families.

## Explicit exclusions

No second Grade 2A World, money runtime, large question bank, publisher-specific child flow, backend, account requirement, beta promotion, merge, main modification, or v1.1 work is included.
