# 交換橋工坊 headless mechanics core

Status: **pure mechanics review gate — no child-facing runtime**

Accepted design base: `502261358455a6090d5e0815dd3737d1c9539382`

Design contract: `curriculum/grade-2a.carry-bridge-design.json`

Pure module: `src/grade-2a-carry-bridge-core.mjs`

## Boundary

This core proves the arithmetic and semantic mechanics for `world.carry-bridge` without shipping a second playable World. It has no imports and does not reference the DOM, storage, network, `index.html`, `v10-app.js` or the service worker. It does not write the accepted evidence ledger, claim formal mastery, change progression/rewards, or decide a drag/tap interaction.

It owns only:

- `g2a.add.no-regroup-100`
- `g2a.add.regroup-100`
- `g2a.sub.no-regroup-100`
- `g2a.sub.regroup-100`
- `g2a.addsub.explain-vertical`

## Deterministic case generator

`makeCarryBridgeCase(caseRuleId, {rng, sourceNonce})` selects from a deterministic enumerated set of operand pairs. All returned metadata is recomputed by `validateCarryBridgeCase()`:

- add/no-regroup: ones sum ≤ 9, tens sum ≤ 9;
- add/regroup: ones sum ≥ 10 and result ≤ 99;
- subtract/no-regroup: minuend ≥ subtrahend and minuend ones ≥ subtrahend ones;
- subtract/regroup: minuend ≥ subtrahend and minuend ones < subtrahend ones.

Addition never reaches 100 in this thin slice. Subtraction is always nonnegative. Generated cases identify whether zero exchanges or one specific exchange is objectively required, but they do not receive acquisition evidence until an observed action trace is classified.

The generator accepts injected randomness and produces stable source-question IDs. `freshCarryBridgeRetry()` preserves the skill and case-rule identity, changes operands, and changes source identity.

## Semantic action state machine

`createCarryBridgeActionState()` and `applyCarryBridgeAction()` are immutable semantic reducers. The supported actions are:

- `place`: check a one/tens placement lane;
- `join`: combine two addition loads;
- `unload`: remove tens or ones from a subtraction whole;
- `bundle`: exchange exactly 10 ones for 1 ten;
- `split`: exchange exactly 1 ten for 10 ones;
- `write-carry` / `write-borrow`: test whether notation is grounded in a real exchange;
- `submit`: require both the numeric answer and a completed semantic state.

Accepted exchanges preserve value exactly. Bundling 9 or 11 ones, splitting anything other than one ten, using the wrong exchange direction, or exchanging when a no-regroup case needs none returns a neutral recoverable result and leaves quantities unchanged.

The trace contains semantic math actions only. It stores no coordinates, pointer paths or gesture timing.

## Observed-action evidence classifier

`classifyCarryBridgeAcquisition()` recomputes the case predicates and replays the actual trace. Caller-supplied `independent-first-try` is necessary but not sufficient: the replayed semantic trace must also be clean.

No-regroup eligibility requires:

- outcome `correct`;
- `independent-first-try`;
- a valid no-regroup case;
- zero bundle/split attempts.

Regroup eligibility requires:

- outcome `correct`;
- `independent-first-try`;
- a valid regroup case;
- exactly one accepted exchange attempt;
- the correct action type and direction;
- exact input/output units and counts;
- the expected semantic result code;
- equal numeric value before and after;
- no wrong, partial, invalid or extra exchange attempt.

A final correct answer cannot override a wrong trace. The bounded clean-trace policy disqualifies:

- the four modeled misconceptions (`place-value-misalignment`, `smaller-digit-first`, `unexplained-carry`, `unexplained-borrow`);
- an incorrect numeric submission or a premature semantically incomplete submission;
- unnecessary, wrong-direction, invalid-count or impossible exchange attempts;
- invalid or impossible unload actions, and operation-incompatible join/unload actions.

An unnecessary split in no-regroup subtraction remains in the semantic trace, so even a later correct numeric result cannot emit `no-regroup` independent evidence. Likewise, a misconception or wrong numeric submission followed by a canonical completion remains correct-but-not-independent.

This policy receives semantic math actions only. Pointer paths, repeated pointer events, gesture timing, and motor noise remain outside this pure core and do not become acquisition disqualifiers. The compact trace summary reports bounded disqualifying codes, misconception signals, incorrect-submit count, and the semantic-only boundary without retaining raw gesture data.

The classifier emits only bounded candidate tags from the accepted design, reports reasons and a compact trace summary, and always returns `ledgerWritePerformed: false` and `formalMasteryClaimed: false`.

## Bundle / blueprint semantics

`carryBridgeBundleModel()` creates the concrete base-ten state, including before/after exchange values. `bundleModelToVerticalBlueprint()` creates aligned tens/ones notation. `verticalBlueprintToBundleModel()` accepts only a blueprint that preserves:

- operands and result;
- operation;
- exchange direction;
- exchange unit counts;
- before/after place-value state;
- stable source identity.

The concrete family is `base-ten-manipulatives`; the notation family is `vertical-notation`. A cosmetic family rename is rejected rather than counted as a distinct representation.

## Misconception and hint primitives

`carryBridgeMisconceptionSignals()` exposes the four accepted semantic signals:

- `add-align`
- `add-carry-value`
- `sub-direction`
- `sub-borrow-value`

`carryBridgeHint()` returns bounded conceptual steps with `revealsAnswer: false`, `completesAnswer: false`, and `returnsControl: true`. It never returns the numeric result.

## Validation evidence

The dedicated headless suite proves:

- 1,200 generated cases for each of four arithmetic rules: 4,800 total;
- 200 canonical semantic solves per rule: 800 total;
- 400 exchange-fuzz sequences in each direction, including rejected 9/11-one and partial exchanges;
- 400 unnecessary-exchange regressions for no-regroup subtraction;
- the full behavior-sensitive eligibility matrix, including final-correct-answer override guards and forged value-preservation rejection;
- clean canonical eligibility across all four rules plus deterministic misconception→canonical and wrong-submit→canonical rejection across all four rules;
- unnecessary, wrong-direction, and invalid-count exchange→canonical rejection across the relevant addition/subtraction families;
- 400 addition-regroup and 400 subtraction-regroup bundle → blueprint → bundle round trips;
- 400 fixed semantic replay attempts for each of four mission families: 1,600 total;
- 400 fresh retries per case rule: 1,600 total;
- misconception/hint safety;
- source purity and absence of DOM/storage/network/runtime coupling.

No real-browser run is required at this gate because no child-facing or shipped browser asset changed.

## Unsupported and unresolved

1. **Exact 100 remains unsupported.** The core returns only sums ≤99. It does not hide a 10-tens→1-hundred exchange.
2. **Transfer remains unresolved.** Candidate transfer surfaces are not implemented or approved.
3. **No formal mastery claim.** The classifier produces candidate acquisition evidence only and never calls the accepted evaluator or ledger.
4. **No World completion rule.** Runtime progression and completion evidence still require review.
5. **No preferred gesture.** Drag versus tap-select-place remains a child-dogfood question.
6. **No child-facing explanation interaction.** The semantic round trip proves mathematics, not yet that the interaction is readable and playful for Grade 2 children.

Stop at review. Do not wire this core into the app, add a World entry point, extend the live ledger, implement transfer, merge stacked PRs, promote beta or modify main.
