# 交換橋島 V2 founder-review package

Status: hidden replacement prototype; founder review only. This work is stacked from PR #16 exact head `7a3a681b79fae78f35313178a25edf4b4ef00f6e`. PR #16 remains frozen as failed-dogfood evidence.

## Product boundary

V2 reuses the accepted arithmetic and behavior-sensitive semantic core, but replaces the V1 control-panel interaction model. It is not linked from normal Number Quest navigation and does not write local progress, evidence ledger, mastery, progression, rewards, completion, or transfer.

- Hidden gate: `?prototype=carry-bridge-v2`
- Included scenes: addition with regrouping and subtraction with regrouping
- Numeric range: 0–99; exact 100 is still unsupported
- Primary completion: derived from the final object state; no answer field
- Symbolic notation: a separate optional post-completion blueprint scene
- Input: direct tap is primary; pointer drag is optional and semantically equivalent
- Mistakes: neutral and quantity-preserving

## Progressive scene graph

Addition:

`two cargo groups → merge → loose ones + ten-machine → select exactly ten → visible 10 ones to 1 ten transformation → object-state celebration`

Subtraction:

`starting cargo + boat demand → remove required tens → one highlighted ten-box opens → visible 1 ten to 10 ones transformation → remove required ones → object-state celebration`

Only the currently relevant object/action pair is exposed. Join, exchange, split, unload, place-value lanes, tray, and answer controls are never shown together.

Every V2 action carries source-bound object identities. A fixed script copied from another problem is rejected before it can become a valid semantic trace.

## Test URLs

- Child-default addition: `/carry-bridge-v2.html?prototype=carry-bridge-v2&case=add-regroup&seed=22`
- Child-default subtraction: `/carry-bridge-v2.html?prototype=carry-bridge-v2&case=sub-regroup&seed=23`
- Founder readback: append `&founder=1`
- Browser semantic harness: `/tests/grade-2a-carry-bridge-v2-browser-harness.html`

## Five-minute founder test

1. Open the child-default addition URL. Do not read the heading aloud. Check whether the two glowing cargo islands suggest the first action within roughly five seconds.
2. Move both cargo groups. Confirm that the merge is the only available task and that the machine appears only afterwards.
3. Tap loose ones. Try the machine before ten, then fill exactly ten and activate it. Confirm the early attempt is neutral and the final transformation visibly preserves quantity.
4. Confirm completion happens immediately from the transformed cargo state, with no equation or answer entry. Open the blueprint only after completion and check that it feels like a short reveal rather than a worksheet step.
5. Open the subtraction URL. Remove the requested tens, open one highlighted ten-box, and remove the requested ones. Confirm each scene presents only the next relevant action.
6. Repeat one action by dragging. Confirm it produces the same result as tapping and never requires precision drag.
7. With `founder=1`, confirm the trace contains exactly one value-preserving exchange, automatic object-state completion, zero page errors, and all product evidence boundaries remain false.

## No-coaching child observation

Do not explain the controls or mathematical vocabulary. Do not point at the next object.

Record:

- time to first meaningful action;
- whether the child taps a cargo group, the bridge, or something unrelated first;
- whether the child predicts that both groups should meet;
- whether the child notices the machine after it appears;
- whether selecting ten individual ones becomes tedious before the relationship is understood;
- whether the child anticipates one new ten-box before the transformation finishes;
- for subtraction, whether the boat demand is understood without verbal explanation;
- whether the highlighted ten-box suggests opening when loose ones are insufficient;
- whether the child can say or show that quantity stayed the same during exchange;
- whether neutral attempts cause confusion, recovery, or frustration;
- whether the post-completion blueprint is recognized as the same event in a different representation;
- spontaneous language indicating play, construction, cargo, bridge, machine, or schoolwork.

Do not ask whether it is fun and do not treat task completion as mastery.

## Human-judgment questions

- Does the first cargo movement read within five seconds for a child who ignores the short heading?
- Is individually selecting ten loose ones productively concrete or unnecessarily tedious?
- Is the boat demand sufficiently clear without coaching?
- Does automatic object-state completion feel earned and legible?
- Is the optional blueprint reveal welcome, or should it be delayed to a later mission?
- Are sound and idle highlighting supportive without becoming distracting?

## Known limitations

- This is not a full World, question bank, adaptive sequence, or production progression path.
- Only regrouping addition and subtraction are exposed in V2 founder review.
- Audio is a short synthesized affordance cue, not production sound design.
- The visual transformation is deliberately simple CSS motion; child observation must decide whether it communicates identity preservation strongly enough.
- No ledger, mastery, transfer, reward, World completion, or persistence claim is made.
- No publisher alignment UI is present.
