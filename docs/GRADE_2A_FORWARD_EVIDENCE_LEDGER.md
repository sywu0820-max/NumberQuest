# Grade 2A forward evidence ledger

Status: **review draft — hidden 百光港 instrumentation only**

Accepted evaluator base: `ea228bfcaa301dce7c41f23810f72705f9a53cbf`

Machine schema: `curriculum/grade-2a.evidence-ledger.json`

Ledger and projection: `src/grade-2a-evidence-ledger.mjs`

Storage: `nq-state-v05` at `learning.grade2aEvidenceLedger`

## Boundary

The ledger records observed Grade 2A interactions from this point forward. It does not backfill `skillHistory`, capability-map counters, World completion, rewards or any other aggregate into formal events. Existing progress remains unchanged and continues to support the accepted founder-dogfood experience, but it is not retroactively promoted to formal mastery.

The instrumentation is local-only and headless. It changes no child or parent copy, layout, controls, mission generation, World completion, rewards, capability glow or publisher flow. It adds only QA/debug readback.

## Two layers

1. The canonical ledger stores observed facts: stable event, World, skill, run session, local day, fresh question source, scheduler lineage, outcome, attempt state, acquisition/retrieval role, and bounded representation/context identity.
2. A pure projection derives `elapsedDaysSinceAcquisition` only after the accepted evaluator can establish acquisition. It then produces validated PR #11 evidence events and evaluates them without mutating the state or ledger.

An unanchored retrieval remains in the canonical ledger but appears in projection diagnostics as `acquisition-not-established`. It cannot become formal retrieval by guessing a date.

## Canonical record

```js
{
  schemaVersion: '1.0.0',
  eventId: 'g2a-event-42',
  worldId: 'world.lantern-harbor',
  skillId: 'g2a.num.represent-200',
  sessionId: 'lantern-session-8',
  localDay: '2026-09-04',
  sourceQuestionId: 'question-1d4e17a0-9371c30a-86',
  schedulerId: 'scheduler-question-86ee6b7d-8ba8b6bb-90',
  outcome: 'correct',
  attemptKind: 'independent-first-try',
  evidenceKind: 'retrieval',
  revisitKind: 'later-session',
  representationId: 'number-words-chart-translation',
  representationFamily: 'number-words',
  contextId: 'harbor-old-chart-words',
  contextFamily: 'harbor-chart-room',
  transferEvidence: false,
  evidenceTags: []
}
```

The canonical record deliberately does not store elapsed acquisition days, names, free text, email or account identity. Question fingerprints are converted to bounded deterministic IDs; raw prompts are not copied into the ledger.

## Session and identity rules

- A new playable run receives `lantern-session-${learning.session}` after the accepted session counter advances.
- Misses and successes are separate stable events.
- A fresh retry has a fresh `sourceQuestionId`.
- Same-session scheduled reviews retain the current run session and use `revisitKind: same-session`.
- Memory reviews occur in a later run session and use `revisitKind: later-session`.
- Both review types preserve scheduler lineage from `reviewSourceQuestion`, while their fresh question source remains separate.
- Reloading stored state does not advance a session or change event identity. Starting the next run advances the accepted session counter and therefore produces a distinct session ID.
- Event replay is deduplicated only by `eventId`; a miss and a later observed success are not collapsed.

## Bounded 百光港 vocabulary

| Mission variant | Representation | Representation family | Context | Context family |
|---|---|---|---|---|
| count dial | `signal-dial` | `ordered-sequence` | `harbor-missing-signal` | `harbor-navigation` |
| place-value build | `place-value-builder` | `place-value-construction` | `harbor-signal-construction` | `harbor-beacon-workshop` |
| expanded chart | `expanded-chart-translation` | `expanded-form` | `harbor-old-chart-expanded` | `harbor-chart-room` |
| words chart | `number-words-chart-translation` | `number-words` | `harbor-old-chart-words` | `harbor-chart-room` |
| stronger comparison | `stronger-signal-choice` | `place-value-comparison` | `harbor-stronger-signal-route` | `harbor-route-choice` |
| earlier comparison | `earlier-arrival-choice` | `place-value-comparison` | `harbor-earlier-arrival-route` | `harbor-route-choice` |

Arbitrary strings fail validation. Cosmetic story changes are not evidence surfaces.

## Attempt evidence

- a correct first submission is `independent-first-try`;
- a wrong submission is `miss`;
- a correct fresh retry after using either help choice is `hinted`;
- a correct fresh retry without a help choice is `recovered`.

Hinted and recovered successes remain observable support evidence and do not become independent mastery evidence.

## Transfer boundary

The current 百光港 vocabulary declares `transferEligible: false`. Every runtime record therefore has `transferEvidence: false`; the runtime helper cannot emit a transfer event. A multi-day represent-200 fixture can establish acquisition and valid 1-day/3-day retrieval, but its evaluator readback remains `transferMet: false` and `masteryMet: false`. Existing evaluator coverage separately proves that only two explicit, fresh, controlled transfer surfaces could close that gap in a future reviewed task.

## Storage and migration

Normalization accepts missing or malformed ledger data fail-safely, keeps only valid records, deduplicates stable event IDs, preserves the next generated sequence, and does not mutate its source. Legacy v1 state gains an empty ledger. It retains all prior gems, rewards, skill history, Memory schedules and capability evidence.

The representation is append-only for valid observed records and does not silently truncate formal evidence. A deterministic stress test serializes 2,400 records—a bounded semester model—and requires the ledger to stay below 1.5 MB. The ledger remains inside the existing local state namespace and needs no account, backend, API or network.

## QA readback

With `?qa=v10`, `window.__NQ_V10_DEBUG__` exposes:

- `getGrade2AEvidenceLedger()` — a cloned canonical ledger snapshot;
- `getGrade2AFormalReadback()` — per-skill pure projection and evaluator results.

Neither API changes progression or displays mastery in the child/parent interface.

## Unresolved questions

1. 百光港 count, compose and compare currently expose one reviewed representation family per skill, so normal play may correctly remain below the concept acquisition diversity threshold. A later task must review a genuinely different mathematical representation rather than rename the same interaction.
2. 百光港 has no reviewed controlled transfer surface. Formal mastery must remain incomplete.
3. Semester retention is currently append-only. If real usage grows beyond the tested bound, any compaction policy must preserve formal evidence and receive separate review before implementation.
4. Physical-world transfer remains unresolved and is outside this World.

Stop at review. Do not add mastery UI, change progression, create a second World, merge the stacked PRs, promote beta or modify main.
