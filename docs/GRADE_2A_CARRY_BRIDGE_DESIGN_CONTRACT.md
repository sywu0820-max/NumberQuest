# 交換橋工坊 design contract

Status: **design-only review gate — no child-facing runtime**

Accepted base: `1156bc9f992d6148dae17f15ce243abc1579c354`

Machine contract: `curriculum/grade-2a.carry-bridge-design.json`

World: `world.carry-bridge` / 交換橋工坊

## Boundary

This artifact designs the next Grade 2A World without implementing it. It adds no UI, question bank, mission generator, storage emission, progression, reward, publisher flow or child-facing copy. It does not change 百光港 or the accepted formal-mastery and evidence-ledger contracts.

The proposed representation, context and transfer IDs are bounded design vocabulary only. `runtimeApproved`, `runtimeIntegration` and `runtimeEmissionApproved` are all `false`. Candidate transfer surfaces are also individually marked `designOnly: true`, `runtimeApproved: false` and `evidenceEmissionApproved: false`.

## What the child would do

The child is a bridge engineer. Tens and ones are the actual bridge loads, repair parts and blueprints—not decoration shown after an equation is solved.

1. **Join loads.** Move two visible loads into aligned tens/ones lanes. If ten or more ones accumulate, select exactly ten and bundle them into one ten before the bridge can carry the load.
2. **Repair by unloading.** Remove a requested quantity from the visible whole. If there are not enough ones, open one ten into ten ones, then continue removing.
3. **Blueprint from bundles.** After a concrete exchange, rebuild aligned vertical notation so each written mark points back to the value the child manipulated.
4. **Bundles from blueprint.** Enact a partial blueprint with bundles and order the before → exchange → after states to show why the written exchange is valid.

The addition and subtraction entry surfaces do not announce whether regrouping is needed. That fact must be discovered from the quantities. The loop “solve a complete vertical equation, then watch a bridge animation” is forbidden.

## Skill and completion boundary

All five skills already owned by the accepted graph remain common completion requirements; there are no extension or version-dependent branches in this World.

| Skill | Prerequisite | Owned action | Formal profile |
|---|---|---|---|
| `g2a.add.no-regroup-100` | `g2a.num.compose-200` | join two loads without exchange | calculation |
| `g2a.add.regroup-100` | `g2a.add.no-regroup-100` | bundle ten ones into one ten | calculation |
| `g2a.sub.no-regroup-100` | `g2a.num.compose-200` | unload from the visible whole without exchange | calculation |
| `g2a.sub.regroup-100` | `g2a.sub.no-regroup-100` | split one ten into ten ones before unloading | calculation |
| `g2a.addsub.explain-vertical` | both regrouping skills | reconstruct notation from exchange and exchange from notation | concept |

World completion is not formal mastery, formal mastery does not drive this design, mission volume cannot complete the World, and design-only transfer candidates cannot complete it. A later runtime contract must define bounded observed completion evidence without changing this five-skill boundary.

Arithmetic remains bounded: addition is at most 100, subtraction is nonnegative, and a case requires at most one reviewed exchange. The proposed tens/ones generator stops at 99 rather than silently auto-performing a second ten-tens-to-one-hundred exchange; exact-100 handling remains an explicit review question.

## Case and evidence rules

The contract distinguishes the mathematical case from its presentation. Evidence tags are derived from quantities, never assigned because a mission happens to use a particular visual skin.

| Case | Quantity predicate | Required exchange | Always-on acquisition tags | Conditional boundary evidence |
|---|---|---|---|---|
| add, no regroup | ones sum ≤ 9; tens sum ≤ 9 | none | `no-regroup` | ones sum = 9 or result ≥ 90 |
| add, regroup | ones sum ≥ 10; total ≤ 99 | ten ones → one ten | `regrouping-sensitive`, `ones-to-tens-regrouping` | ones sum = 10 or result ≥ 90 |
| subtract, no regroup | minuend ≥ subtrahend; minuend ones ≥ subtrahend ones | none | `no-regroup` | ones difference = 0 or result ≤ 10 |
| subtract, regroup | minuend ≥ subtrahend; minuend ones < subtrahend ones | one ten → ten ones | `regrouping-sensitive`, `tens-to-ones-exchange` | ones deficit = 1 or result ≤ 10 |

These tags exactly preserve the accepted calculation requirements. `boundary` is conditional: ordinary cases may not claim it. No-regroup cases never fabricate regrouping-sensitive evidence, and regroup cases require an actual exchange condition.

## Misconception → hint → fresh retry

| Misconception | Observable action | Answer-safe hint | Fresh retry |
|---|---|---|---|
| place-value misalignment (`add-align`) | puts ones in the tens lane or tens in the ones lane | pulse both place labels; ask where one unit belongs; return control without filling the lane | new operands, same skill and exchange class |
| unexplained carry (`add-carry-value`) | moves a bare 1 into tens without bundling ten ones | child selects ten ones, binds them into one ten, then places the new ten | new addition case with fresh source identity |
| smaller-digit-first subtraction (`sub-direction`) | swaps removal direction or subtracts the smaller visible digit regardless of the whole | keep the starting whole visible and trace “remove from”; show no remainder | fresh contrast case with reversed digit pressure |
| unexplained borrow (`sub-borrow-value`) | adds one loose one after borrowing | child opens one ten and counts the ten released ones before continuing | new subtraction exchange case with fresh source identity |

Every retry resets answer state, changes the operand pair and `sourceQuestionId`, preserves the target skill, and may retain scheduler lineage separately. A hinted or recovered success remains observable support evidence but cannot become independent first-try evidence.

## Controlled evidence vocabulary

The proposed vocabulary maps directly to existing ledger fields while remaining outside the accepted runtime ledger until a later review.

### Representations

| ID | Family | Mathematical distinction |
|---|---|---|
| `base-ten-workbench` | `base-ten-manipulatives` | movable ones and tens with value-preserving exchange |
| `bridge-load-lanes` | `place-value-load-model` | schematic loads aligned by tens and ones |
| `vertical-place-value-blueprint` | `vertical-notation` | symbolic columns reconstructed from place-value actions |
| `exchange-sequence-panels` | `exchange-sequence-model` | ordered before/exchange/after equivalence states |

For `g2a.addsub.explain-vertical`, acquisition is intentionally split between `base-ten-manipulatives` and `vertical-notation`. These are different mathematical models, not renamed cosmetic variants. The sequence panels support reasoning but are not used to fake a second family.

### Acquisition/retrieval contexts

- `bridge-join-deck` / `bridge-loading`
- `bridge-repair-deck` / `bridge-repair`
- `workshop-blueprint-table` / `bridge-blueprint`

Retrieval must use a fresh source question. Scheduler lineage stays separate. Same-session review does not count as later-session retrieval; accepted 1-day and ≥3-day boundaries remain unchanged.

## Coverage and evidence matrix

| Skill | Acquisition | Retrieval | Eventual transfer candidate—unapproved |
|---|---|---|---|
| add, no regroup | 4 independent cases; evidence collectively includes `boundary` + `no-regroup` | fresh later-session case after ≥1 day and a different fresh case after ≥3 days | infer combine/remove in counterweight routing; reconcile repair inventory |
| add, regroup | 4 independent cases with a real ones→tens exchange; includes `boundary`, `regrouping-sensitive`, `ones-to-tens-regrouping` | same accepted calculation schedule with fresh identities | same two candidate contexts, each requiring actual regrouping-sensitive quantities |
| subtract, no regroup | 4 independent nonnegative cases; includes `boundary` + `no-regroup` | same accepted calculation schedule with fresh identities | counterweight and inventory candidates without vertical form |
| subtract, regroup | 4 independent nonnegative cases with a real ten→ones exchange; includes all accepted exchange tags | same accepted calculation schedule with fresh identities | same two distinct contexts with real exchange-sensitive quantities |
| explain vertical | 3 independent successes across base-ten manipulatives and vertical notation | fresh later-session evidence after ≥1 day and another fresh case after ≥3 days | diagnose a value-preservation error; reconstruct a missing handoff state |

Formal acquisition/retrieval thresholds are descriptions of what future valid ledger records could demonstrate. They do not authorize runtime emission. No transfer candidate counts merely because it is described.

## Candidate transfer surfaces—not approved

1. **Counterweight routing.** Infer whether loads must be combined or removed to balance a route, without a vertical form or operation cue.
2. **Repair-stock reconciliation.** Reconcile delivered, used and remaining parts from an inventory state rather than follow a displayed calculation.
3. **Blueprint error audit.** Diagnose which step breaks place-value equivalence instead of constructing a familiar example.
4. **Crew handoff reconstruction.** Rebuild a missing exchange state from a partial record instead of copying bundles into notation.

The first two may still be too close to acquisition and may add story-language load. The last two may accidentally measure reading or elimination. Independent review and child observation are required before any candidate receives a ledger vocabulary extension or transfer approval.

## Accessibility and Grade-2 interaction constraints

- minimum 44 CSS-pixel touch targets;
- tap-select-place alternative to every drag action;
- keyboard and pointer operation for Surface;
- color is never the only place-value, correctness or exchange signal;
- short prompts have icon or spoken support and never depend on text alone;
- one primary mathematical decision per step;
- no required timer and no speed evidence;
- reduced-motion equivalent for exchange animation;
- mistakes remove no progress or rewards;
- iPad Safari and Surface Pro Edge remain first-class targets.

Dexterity, reading speed and animation timing must never masquerade as mathematical evidence.

## Anti-worksheet and anti-shortcut invariants

- calculation missions begin with quantities, not a fully presented vertical equation;
- the child's join, bundle, split or unload action directly changes the bridge state;
- notation is reconstructed from, or enacted as, place-value action;
- no answer selection followed by unrelated reward animation;
- hints return control before completing the answer;
- regrouping is derived from quantities, not disclosed by a special layout;
- an exchange succeeds only for exactly ten ones or one ten;
- no-regroup and regroup use the same neutral entry presentation;
- a fixed tap/drag trace cannot solve varied cases;
- correct zones and operand positions do not stay fixed;
- piece count or screen position cannot encode the result digit;
- subtraction preserves the whole/removal direction without a smaller-digit-first affordance.

## Proposed implementation-gate validation

No browser or generator exists in this design-only PR. The machine contract nevertheless makes the future tests reviewable now:

- **1,200 cases per case rule:** arithmetic bounds, exchange count and conditional evidence tags;
- **400 cases per mission family:** replay one fixed action trace against varied cases and prove it cannot solve them;
- **400 cases per exchange direction:** reject 9/11-one exchanges and prove exact value preservation;
- **100 cases per misconception:** answer-safe hints, preserved case class, fresh operands/source identity and non-independent recovery;
- **400 round trips per operation:** bundles ↔ blueprint preserves value and exchange marks require real exchanges;
- **real-browser shortcut matrix:** iPad portrait/landscape, Surface Edge and keyboard-only paths; no fixed-position leak;
- **real-browser repair/review:** nonpunitive miss, child-controlled hint, fresh retry, separate scheduler lineage, reload/offline without false session/day promotion.

Current automated tests validate that these specifications exist, cover every owned skill, preserve the accepted mastery tags, use bounded ledger-compatible vocabulary, keep transfer unapproved and make the fixed-trace/answer-leak checks explicit.

## Unresolved product questions

1. Should drag or tap-select-place be the default after child dogfood, while both remain equivalent?
2. Can ordering/rebuilding exchange states demonstrate explanation without reading-heavy prompts?
3. Are counterweight and inventory mathematically distinct enough from acquisition to count as transfer?
4. Can blueprint audit and crew handoff avoid testing reading or pattern elimination?
5. What bounded per-skill evidence should complete the World without conflating completion, capability glow and formal mastery?
6. Should exact-100 sums add a reviewed 10-tens→1-hundred action, or remain outside this tens/ones World instead of hiding a second exchange?

Stop at review. Do not implement 交換橋工坊 runtime, extend the shipped ledger vocabulary, add mastery UI, create a question bank, merge stacked PRs, promote beta or modify main.
