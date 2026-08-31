# 交換橋工坊 hidden interaction prototype

Status: **hidden, non-production interaction review gate**

Accepted headless-core base: `a891c71bc0733848d457c26c3e5e4e0e15563836`

This prototype turns the accepted semantic mechanics into a touch-first browser workbench without adding a normal product entry point. It does not change 百光港, home navigation, World progression, rewards, the accepted Grade 2A evidence ledger, or formal mastery.

## Hidden access

The standalone surface is available only at:

`carry-bridge-prototype.html?prototype=carry-bridge`

Without the exact `prototype=carry-bridge` flag, the page shows a locked QA gate. `index.html` contains no link or route to the prototype. Add `debug=1` for the non-persistent semantic readback and use `case=<case-rule-id>&seed=<integer>` for deterministic QA cases.

## Accepted semantic boundary

`src/grade-2a-carry-bridge-prototype.mjs` imports `src/grade-2a-carry-bridge-core.mjs` and maps interaction intents to its accepted actions. It does not duplicate arithmetic rules.

The prototype covers:

- addition without exchange;
- addition with an explicit `10 ones → 1 ten` exchange;
- subtraction without exchange;
- subtraction with an explicit `1 ten → 10 ones` exchange.

Exact 100 remains unsupported. The generator never produces it, and the UI does not auto-normalize ten tens. The formal vertical-explanation completion flow remains unimplemented.

## Interaction model

The child manipulates base-ten cargo directly. There is no equation-first multiple-choice loop.

- Tap-select-place: tap cargo blocks, then tap a lane or destination.
- Pointer drag: drag a load or selected block to the same destinations.
- Both paths map to identical semantic actions before the core reducer sees them.
- Native HTML drag remains as a desktop fallback; Pointer Events provide the touch-capable path needed by iPad-style input.
- Every target is at least 44 CSS px, controls remain keyboard-operable, borders/text reinforce color, and reduced motion removes transforms/animation.

Addition no-regroup/regroup cases share one neutral addition surface. Subtraction no-regroup/regroup cases share one neutral subtraction surface. The same lanes and action zones are visible and enabled; the layout, labels, and control state do not disclose whether an exchange will be necessary.

Invalid, impossible, wrong-direction, or unnecessary actions return a neutral message and leave quantities unchanged. Hints stop at attention or exchange structure and never provide the numeric answer.

## Evidence boundary

The debug panel may display:

- the generated problem and semantic state;
- the core semantic action trace;
- interaction-path metadata;
- the accepted classifier readback;
- bounded misconception signals and page errors.

It does not use `localStorage`, `sessionStorage`, a backend, or the Grade 2A ledger. Every readback states:

- `ledgerWritePerformed: false`
- `formalMasteryClaimed: false`
- `persisted: false`
- `transferClaimed: false`
- `completionClaimed: false`

## Deterministic and shortcut validation

- 39/39 carry-core + prototype-focused tests pass.
- 115/115 Grade 2A tests pass.
- 251/251 full inherited tests pass.
- 600 generated cases per case rule remain within ≤99/nonnegative bounds.
- Fixed prototype intents are replayed against 400 varied cases per rule and cannot solve the family.
- Tap and pointer paths produce identical completed semantic traces for all four rules.
- 9/11-one bundles are neutral and value-preserving.
- Unnecessary no-regroup exchange remains recoverable but disqualifies clean evidence.
- Wrong submit followed by correction remains correct-but-not-independent for all four rules.
- The shipped browser semantic harness passes with zero captured page errors.

## Real-browser validation

Local static-server checks covered:

| Viewport | Flow | Result |
| --- | --- | --- |
| 768×1024 iPad portrait | addition regroup, tap-select-place | complete, clean independent trace |
| 1024×768 iPad landscape | load drag + ten-one bundle drag | complete; semantic trace exactly equals tap flow |
| 1368×912 Surface | subtraction no-regroup | complete, clean independent trace |
| 390×844 mobile | subtraction regroup after wrong submit | complete, correctly non-independent |

All four viewports retained 44 px minimum targets, no horizontal overflow, and zero page/console errors. The normal Number Quest home still showed Today’s Adventure, contained no prototype entry, and captured zero page errors.

The first real pointer test exposed that HTML5 drag alone did not work reliably for touch-style input. The prototype now has a Pointer Events drag path; the same real drag then completed the action and matched the tap semantic trace.

The service worker cache contains all six prototype page/script/style/core/harness assets. A reload restored a fresh, non-persistent session with zero errors.

## Unresolved child-UX questions

1. Whether tap-select-place or drag should become the eventual default remains a founder/child dogfood decision.
2. The clearest visual treatment for selecting exactly ten individual ones needs observation with Grade 2 children.
3. The small-screen density of many tens/ones is technically sound but may need a more playful compression model.
4. The place-value lanes are currently optional semantic probes; their role in the main mission rhythm needs child testing.
5. The final cargo-slip number entry may need a more tactile treatment without becoming an equation-first answer loop.
6. A child-readable concrete-to-blueprint interaction is intentionally deferred.

Stop at this review gate. Do not expose 交換橋工坊 in normal navigation, write formal evidence, add progression/rewards/transfer/exact-100, merge stacked PRs, or promote beta/main.
