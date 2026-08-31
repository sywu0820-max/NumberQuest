# 交換橋工坊 hidden founder dogfood package

Status: **hidden, non-production founder + child dogfood gate**

Accepted stacked base: PR #15 exact head `c0cbe6af2b595f514d82723819c4387f9d8d44ee`

This candidate hardens the accepted hidden interaction prototype without exposing a new World in Number Quest. It keeps `src/grade-2a-carry-bridge-core.mjs` as the sole arithmetic and semantic source of truth. It does not write the Grade 2A ledger, local progress, mastery, transfer, World completion, progression, or rewards.

## Hidden URLs and reversible variants

The default child surface is:

`carry-bridge-prototype.html?prototype=carry-bridge`

The founder switcher is hidden unless `founder=1` is present. It changes query flags and restarts the ephemeral case; it does not save preferences or progress.

| Flag | Values | Purpose |
| --- | --- | --- |
| `interaction` | `tap-first`, `drag-first`, `balanced` | Compares instruction/affordance emphasis. Both semantic paths remain available in every variant. |
| `bundle` | `individual`, `pair-scoop` | Compares ten individual selections with a two-at-a-time visible scoop. Pair scoop still fills ten visible one-slots and still requires the child to send exactly ten to the exchange. |
| `result` | `cargo-slip`, `digit-dials` | Compares a numeric cargo slip with separate tactile tens/ones dials. Neither exposes the answer. |
| `founder=1` | exact value `1` | Shows the founder switcher and current variant readback. |
| `debug=1` | exact value `1` | Shows non-persistent semantic/classifier QA readback. |
| `case` | four accepted case-rule IDs | Selects deterministic add/subtract, regroup/no-regroup families for QA. |
| `seed` | positive integer | Repeats a bounded generated case for observation. |

Recommended comparisons:

- Default: `?prototype=carry-bridge`
- Drag emphasis: `?prototype=carry-bridge&interaction=drag-first`
- Pair scoop: `?prototype=carry-bridge&bundle=pair-scoop`
- Digit dials: `?prototype=carry-bridge&result=digit-dials`
- Founder switcher: `?prototype=carry-bridge&founder=1`

Unsupported values fail safely to the default. No variant changes case arithmetic, accepted semantic actions, classification, or evidence boundaries.

## What is materially stronger than PR #15

- Addition now makes the child bring both load cards to the same join surface. A stray tap or incomplete drag is UI-only motor noise and does not become a semantic misconception.
- A ten-slot cargo tray makes the exact-ten relation visible. Nine and eleven remain neutral failures; there is no magic carry/borrow control.
- The result surface stays locked until the physical cargo state is complete enough to inspect. This removes the easy equation-first path.
- A three-beat `搬貨 → 整理 → 蓋章` rhythm makes the next purpose visible without disclosing whether exchange will be needed.
- The two interaction paths remain equivalent at the accepted semantic boundary.
- Founder variants are query-only, reversible, and hidden from the default child surface.
- The readback explicitly states that raw pointer coordinates are not stored and motor noise does not disqualify mathematical independence.

## Founder test script (5–10 minutes)

1. Open the default URL on an iPad in portrait. Do one addition-regroup case without opening QA. Note whether the next action is discoverable before using a hint.
2. Rotate to landscape and finish a subtraction-regroup case. Try both one real drag and one tap-select-place action. Note which gesture feels more reliable, not which one looks more impressive.
3. Open the founder switcher and compare `individual` with `pair-scoop` on the same regroup family. Confirm that the child still has to make and recognize an exact group of ten.
4. Compare `cargo-slip` with `digit-dials`. Confirm that result entry feels like finishing the cargo state rather than solving a detached equation.
5. Intentionally try nine, then eleven, ones at the exchange. Confirm both return control without changing quantity or taking anything away.
6. Enter one wrong result, then correct it. With `debug=1`, confirm completion can recover but `independentAcquisitionEligible` remains false.
7. Refresh once, then test offline/reload. Confirm the case restarts fresh, no progress is restored, and the hidden surface still loads from cached assets.

## Child-observation script

Avoid asking “Is it fun?” and avoid teaching during the first attempt. Observe and record:

1. Where does the child touch first? Do they understand that both addition loads must arrive together?
2. Do they use tap or drag without prompting? If the first gesture misses, do they recover without frustration?
3. When ten ones are present, do they notice the tray filling? Do they predict what will happen when it reaches ten?
4. On subtraction regrouping, do they choose to open a ten because the ones are insufficient, or only after a hint?
5. Do they treat the result entry as a final cargo check, or jump there before manipulating cargo?
6. After a neutral invalid action, do they keep exploring? Record the action and recovery, not a satisfaction score.
7. Watch hand posture, accidental touches, reading load, and time spent counting. Do not infer understanding from speed alone.

## Exact known limitations and unresolved human judgment

1. Tap-first is the safe default, but child observation must decide whether drag-first should become the future primary affordance.
2. Pair scoop reduces repetitive taps but may obscure one-to-one counting for some children. It remains an A/B prototype, not a product decision.
3. Digit dials may feel more tactile or may feel slower than a numeric slip. Neither is accepted as final.
4. Dense high-one-count cases fit supported viewports, but real children may need a more spatial or animated compression treatment.
5. Place-value lanes remain optional semantic probes and are not a formal blueprint/explanation flow.
6. No distinct transfer surface exists. Transfer remains false.
7. Exact 100 and ten-tens-to-one-hundred behavior remain unsupported.
8. This candidate has no normal navigation entry and makes no World completion, mastery, progression, or reward claim.

Stop at founder + child dogfood. Do not expose the World, implement the next World, merge stacked PRs, or promote beta/main.
