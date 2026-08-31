# Grade 2A formal mastery evaluator

Status: **review draft — headless only**

Source foundation: `curriculum/grade-2a.skill-graph.json`

Machine rules: `curriculum/grade-2a.mastery-rules.json`

Evaluator: `src/grade-2a-mastery.mjs`

Runtime/UI integration: **none**

This contract turns the five accepted Grade 2A evidence-profile descriptions into deterministic checks. It does not alter 百光港, Journey selection, World completion, capability glow, publisher alignment, rewards, onboarding or child-facing copy. Formal mastery is a separate claim: acquisition, retrieval and transfer must all be met for the skill's profile.

## Evidence event contract

Every event has stable event, skill, session, day, representation, context and source-question identity. Retrieval also records scheduler identity, whether it is same-session or later-session, and elapsed calendar days since acquisition. A normalized event has this shape:

```js
{
  schemaVersion: '1.0.0',
  eventId: 'evt-204',
  skillId: 'g2a.num.count-200',
  sessionId: 'local-session-18',
  localDay: '2026-09-04',
  outcome: 'correct',                    // correct | miss
  attemptKind: 'independent-first-try',  // independent-first-try | hinted | recovered | miss
  evidenceKind: 'retrieval',             // acquisition | retrieval | transfer
  revisitKind: 'later-session',          // initial | same-session | later-session
  elapsedDaysSinceAcquisition: 3,        // from the day acquisition first became established
  representationId: 'number-line-184',
  representationFamily: 'number-line',
  contextId: 'harbor-route-east',
  contextFamily: 'lantern-harbor',
  sourceQuestionId: 'question-fingerprint-184',
  schedulerId: 'memory:g2a.num.count-200',
  transferEvidence: false,
  evidenceTags: [],
  relationshipFamily: null,
  factIdentity: null,
  transferSurfaceId: null
}
```

The validator rejects missing or contradictory identity and classification fields. The evaluator deduplicates event IDs and source-question IDs so replaying one prompt cannot inflate evidence. It deterministically sorts independent acquisition evidence, finds the earliest prefix that fully satisfies acquisition, exposes that final prefix day as `supportingEvidence.acquisitionEstablishedDay`, and cross-checks retrieval separation from that day—not from first exposure.

A retrieval must use a fresh `sourceQuestionId` that was not used for acquisition. Its `schedulerId` may preserve the review lineage, but a scheduler lineage is not prompt identity and cannot make a repeated acquisition prompt count as retention.

`elapsedMs`, `responseMs`, `timerScore` and `speedBand` are explicitly ignored. Speed is never mastery evidence.

## Profile rules

The JSON contract is authoritative for exact thresholds. This table is a readable summary.

| Profile | Acquisition | Retrieval | Transfer |
|---|---|---|---|
| `concept` | 3 independent successes; 2 representation families | one later session after 1–2 days, plus a different retrieval after at least 3 days | 2 independent first-try successes across 2 context/representation surface signatures |
| `calculation` | 4 independent calculations plus the skill's explicit tags: no-regroup skills require `boundary` + `no-regroup`; regroup skills require `boundary` + `regrouping-sensitive` + the applicable exchange tag | one later session after 1–2 days, plus a different retrieval after at least 3 days | 2 independent applications in 2 contexts outside `bare-vertical-form` |
| `application` | 3 independent solutions across 3 relationship families; at least one explanation or valid model | one independent later-session solution after at least 1 day with no operation cue | 2 independent preserved-relationship successes across 2 story/context and 2 representation families |
| `measurement` | 3 independent observations/measurements, each with correct unit and procedure | one independent later-session return after at least 1 day without procedural highlighting | 2 independent successes with different object/orientation/scale/method surface IDs |
| `fact-family` | 4 independent distinct facts; at least 2 shown as groups, arrays or stories | 2 distinct facts in 2 later sessions, each after at least 1 day | 2 distinct multiplication situations; evidence collectively derives at least 1 related fact |

For the profiles whose accepted prose explicitly requires “next session and later after 3 or more days,” a same-day second session is tracked but does not satisfy the next-session threshold. This preserves the difference between immediate review, next-day retrieval and durable retrieval.

## API and output

Use a graph node to select the exact profile:

```js
import {evaluateGrade2ASkillMastery} from './src/grade-2a-mastery.mjs';

const result = evaluateGrade2ASkillMastery(skillNode, evidenceEvents);
```

Or call the lower-level API with explicit stable IDs:

```js
const result = evaluateGrade2AMastery({
  skillId: 'g2a.num.count-200',
  profileId: 'concept',
  events
});
```

Every result exposes:

```js
{
  skillId,
  profileId,
  progressStage,       // building | acquisition | retrieval | transfer | mastery
  acquisitionMet,
  retrievalMet,
  transferMet,
  masteryMet,
  insufficientEvidence,
  missingEvidence: [
    {dimension: 'retrieval', code: 'retrieval-later-day-gap', required: 1, observed: 0}
  ],
  supportingEvidence: {
    acquisitionEstablishedDay,
    skillRequirementId,
    counts: {/* independent, recovery, miss, retrieval-window and transfer counts */},
    distinct: {/* representation, relationship, fact, session, context and surface counts */},
    invalidEvents: [],
    retrievalInvalid: [],
    legacyAggregateIgnored: false
  }
}
```

`masteryMet` is true only when all three dimensions are true. `progressStage` is explanatory and cannot replace the four booleans.

## False-positive protections

- Hinted and recovered successes remain visible as support evidence but are not independent evidence.
- Repeated event IDs or source-question IDs count once.
- Repeating one representation, relationship, fact, context or transfer surface cannot satisfy a distinctness threshold.
- Same-session retrieval never counts as later-session retrieval.
- Same-day later-session retrieval is reported separately and does not satisfy a minimum one-day gap.
- Retrieval day gaps begin only when the full acquisition rule first becomes satisfied; early exposure cannot age later evidence prematurely.
- A retrieval that reuses any acquisition `sourceQuestionId` is excluded. A fresh prompt may retain the same `schedulerId` lineage.
- A claimed elapsed-day separation that disagrees with event dates is excluded.
- Misses are counted for support planning and never remove valid evidence already earned.
- Transfer evidence requires both `evidenceKind: 'transfer'` and `transferEvidence: true`.
- Bare vertical-form calculation prompts do not count as calculation transfer.
- World completion and v1 capability glow remain explicitly separate from formal mastery.
- Aggregate v1 fields such as `firstTryCorrect`, `successfulRevisits`, `independentRetrievals`, `independentTransfers` or a `strong` capability state are ambiguous. With no granular events, the evaluator returns `insufficientEvidence: true` and `legacy-aggregate-insufficient`; it never upgrades those counters.

## 百光港 adapter and synthetic progression

`adaptLanternEventToGrade2AEvidence()` is side-effect-free. It copies the existing event and requires caller-supplied local session/day metadata. It maps current growth to acquisition and current review to retrieval, but does not invent transfer. When current events lack elapsed acquisition separation or scheduler identity, the adapter leaves that gap visible and validation fails rather than fabricating evidence.

The deterministic tests model a small 百光港 evidence history:

1. one independent acquisition event → `building`;
2. three independent acquisitions across two representations → `acquisition`;
3. valid next-day and three-day retrievals → `retrieval`;
4. one new transfer surface → `transfer`;
5. a second distinct transfer surface → `mastery`.

This is synthetic headless validation only. It does not make the current 百光港 World emit or persist the new events.

## What future Worlds must emit

Before any future World can claim formal mastery, its bounded contract must define and test:

1. stable local session and local-day identity;
2. a stable source-question ID and scheduler ID where review is scheduled;
3. first-try independence separately from hint use and recovery;
4. representation identity and a controlled representation family;
5. context identity and a controlled context/surface family;
6. acquisition, retrieval and explicit transfer classification;
7. same-session versus later-session revisit plus verified day separation;
8. a fresh review question identity distinct from every acquisition prompt while preserving scheduler lineage separately;
9. profile qualifiers: relationship family, fact identity, transfer surface, or the controlled evidence tags required by its skill;
10. miss events without destructive evidence updates;
11. dedupe/replay behavior and offline/local persistence semantics.

Timer and speed fields may support accessibility or play feel, but must remain outside the evaluator.

## Current evidence gaps and review questions

1. The frozen v1/百光港 events do not persist a stable session ID, acquisition anchor day, elapsed retrieval gap, scheduler ID, context family or transfer event. They can seed an adapter only after a later, separately reviewed runtime contract supplies those fields.
2. Current aggregate capability and skill-history counters are intentionally insufficient for retroactive formal mastery. Founder dogfood history must remain intact but unpromoted.
3. Physical-world validity for capacity, weight, area and ruler work remains unresolved. A screen simulation must not emit a physical transfer surface unless a later contract defines real-world evidence.
4. Stable controlled vocabularies for relationship families, context families, representation families, fact identities and transfer surfaces should be bounded per World before runtime emission.

The earlier calculation ambiguity is resolved in the machine contract: all four calculation skills have explicit, structurally validated requirements, and no-regroup skills never need a fabricated regrouping-sensitive case.

Stop at this review gate. Do not wire the evaluator to UI, progression, rewards, storage or World completion until an independent review accepts both the evidence contract and its remaining gaps.
