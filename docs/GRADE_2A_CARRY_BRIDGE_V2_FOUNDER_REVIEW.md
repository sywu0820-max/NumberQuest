# 交換橋工坊 V2.1 founder-review package

Status: hidden completeness pass; founder review only. This work is stacked from the accepted V2 exact head `d78e9a3bebfcd62f4ff7bfcafc864e78846b84bc`. PR #16 remains frozen failed-dogfood history and PR #17 remains the accepted V2 design base.

## Product boundary

V2.1 turns the two accepted V2 exchange scenes into one short playable Number Quest world without connecting it to production progression. It reuses the accepted arithmetic core and still writes no local progress, evidence ledger, mastery, progression, reward, completion, or transfer state.

- Hidden gate: `?prototype=carry-bridge-v2`
- Direct cases: `add-no-regroup`, `add-regroup`, `sub-no-regroup`, `sub-regroup`
- Mixed founder route: `case=world-run`, exactly six missions containing all four families
- Numeric range: 0–99; exact 100 remains unsupported
- Completion: derived from object state; no answer field
- Input: tap first, native keyboard on buttons, optional source-bound pointer drag
- Mistakes: neutral, quantity-preserving, and never progress-removing
- Blueprint: separate post-completion micro-scene for `g2a.addsub.explain-vertical`; it is interactive but never claims mastery evidence

## Progressive scene graph

Addition without regrouping:

`two visible loads → physical merge → final tens/ones cargo → short celebration`

Addition with regrouping:

`two visible loads → physical merge → select exactly ten ones → before/transform/after film → one new ten → celebration`

Subtraction without regrouping:

`visible whole + boat demand → remove requested tens → remove requested ones → celebration`

Subtraction with regrouping:

`visible whole + boat demand → remove requested tens → open exactly one ten → before/transform/after film → remove requested ones → celebration`

Only the action set required by the current mathematical state is visible. No-regroup cases never receive a fake exchange.

## Hint and input safety

Inactivity and neutral actions escalate through three answer-safe stages:

1. pulse only the current affordance;
2. show a visual relationship cue;
3. add one tiny action phrase.

No stage animates the complete solution. Pointer drops outside a meaningful target preserve state; drag-generated clicks are suppressed, and pointer cancellation clears the pending gesture. Tap and drag produce identical semantic traces and no coordinates are stored.

## Founder URLs

- Addition, no regroup: `/carry-bridge-v2.html?prototype=carry-bridge-v2&case=add-no-regroup&seed=11`
- Addition, regroup: `/carry-bridge-v2.html?prototype=carry-bridge-v2&case=add-regroup&seed=22`
- Subtraction, no regroup: `/carry-bridge-v2.html?prototype=carry-bridge-v2&case=sub-no-regroup&seed=19`
- Subtraction, regroup: `/carry-bridge-v2.html?prototype=carry-bridge-v2&case=sub-regroup&seed=23`
- Mixed six-mission run: `/carry-bridge-v2.html?prototype=carry-bridge-v2&case=world-run&seed=31`
- Deterministic blueprint: `/carry-bridge-v2.html?prototype=carry-bridge-v2&case=sub-regroup&seed=23&founder=1&blueprint=1`
- Semantic harness: `/tests/grade-2a-carry-bridge-v2-browser-harness.html`
- Founder readback: append `&founder=1` to a child route

## Five-minute founder test

1. Open addition without regrouping. Move both loads and confirm that the final tens/ones cargo is visible without an exchange or answer entry.
2. Open addition with regrouping. Try the machine with nine selected ones, then attempt an eleventh selection. Confirm both recover neutrally and only exactly ten transforms.
3. Watch the exchange film. Decide whether the same ten objects remain perceptually present before, during, and after the transformation.
4. Open both subtraction routes. Confirm the no-regroup path never shows an opening action and the regroup path opens exactly one ten only when loose ones are insufficient.
5. Complete the blueprint with one wrong piece followed by the right piece. Confirm it feels like a short game beat connected to the cargo action, not a worksheet.
6. Play the six-mission world-run without coaching. Judge rhythm, repetition, transitions, and fatigue; use the final replay action once.
7. Leave one scene idle long enough to observe all three hint stages. Confirm each remains answer-safe.
8. Repeat one action by drag and one control by keyboard. Confirm tap remains the obvious default.

## No-coaching child observation

Do not name carrying, borrowing, regrouping, columns, or the next control. Record time to first meaningful action; whether the child infers merge/removal; whether exactly ten is concrete or tedious; whether the transformation preserves identity perceptually; whether the no-regroup missions still feel purposeful; whether the blueprint is recognized as the same event; fatigue or strategy changes across six missions; neutral-attempt recovery; and spontaneous game versus schoolwork language.

## Automated and browser evidence contract

- Every family completes from source-bound object actions with a 0–99 answer.
- Clean no-regroup traces contain zero exchange attempts; clean regroup traces contain exactly one value-preserving exchange.
- 9 and 11 one attempts are neutral; exactly 10 is accepted.
- Tap and pointer-drag traces are semantically identical.
- Fixed scripts cannot broadly solve varied cases; dirty corrected traces remain ineligible.
- World-run length is constrained to 5–7 and the shipped six-mission plan includes all four families.
- Blueprint choices are source-bound, neutral on a miss, and store no coordinates.
- Mobile, iPad portrait/landscape, and Surface layouts have no horizontal overflow and preserve at least 44 CSS-pixel targets.
- The shell reloads offline after first load and reports zero page errors.

## Remaining human judgments

- Does the first action read within roughly five seconds for a child who ignores text?
- Is selecting ten individual ones productively concrete or too repetitive?
- Is the before/transform/after film strong enough to communicate conserved total without narration?
- Do direct-removal no-regroup missions feel like play rather than busywork?
- Does the six-mission mix vary rhythm enough to avoid worksheet fatigue?
- Is the interactive blueprint welcome after each mission, or should it appear only at selected moments?
- Are the second and third hint stages strong enough without becoming instructions?

No founder judgment may be converted into production progression, transfer, mastery, or completion evidence in this branch.
