# Number Quest Grade 2A — 星箱工坊 V3 founder-review contract

## Gate and ancestry

This bounded founder-review prototype branches directly from the accepted PR #14 head, `a891c71bc0733848d457c26c3e5e4e0e15563836`. PR #18 remains frozen as failed founder dogfood. V3 is not a repair or extension of PR #18.

The prototype is reachable only with `starbox-v3.html?prototype=starbox-v3`. It has no ordinary Number Quest home entry. Leaving the prototype creates an explicit query-only return link on the existing home; opening the normal home directly shows no V3 entry. No return state is persisted.

## One coherent child world

`Number Quest · 星箱工坊` uses one spatial and semantic language:

- one loose star is one;
- one sealed star box is ten;
- addition combines two deliveries in the central inventory;
- exactly ten loose stars can be gathered as one group and sealed as one box;
- subtraction fulfills a visible order from the central inventory;
- when loose stock is insufficient, exactly one box opens in place into ten visible loose stars.

The short run contains four missions with different purposes and action shapes:

1. combine two deliveries without packing;
2. combine and pack exactly ten loose stars;
3. fulfill an order directly;
4. open one box, then fulfill an order.

The group actions intentionally avoid ten unrelated taps. The visible deliveries, candidate groups, filled tray, and star boxes are the action sources; the visible inventory, tray, order zone, sealer, and opening station are their destinations. There is no detached command button. A child either taps a source and then a destination or drags that source onto a destination. Dropping outside a destination returns the object neutrally without advancing or poisoning evidence. A known but unsuitable destination or a wrong candidate quantity also leaves state unchanged, but prevents the interaction trace from being called independent-first-try evidence.

Every valid action supports direct tap, keyboard activation, and pointer drag with the same semantic trace. Quantity choices rotate deterministically with the problem so a fixed screen position is not a reliable solution. A five-second idle pulse only makes the current object easier to find; it does not count as help or penalize a child with a slower motor response.

## Learning and evidence boundary

The accepted headless carry-bridge core remains the only arithmetic authority. The UI never asks for a numeric answer. It completes from the resulting object state and produces a founder readback that names:

- the target stable skill ID;
- the child behavior actually observed;
- why that behavior is Grade 2A mathematics;
- what can be described as a candidate independent acquisition observation;
- what cannot be claimed: formal mastery, retrieval, transfer, world completion, progression, reward, or a production-ledger write.

No-regroup missions accept zero exchange actions. Regroup missions require exactly one correct value-preserving exchange. Candidate independent-acquisition evidence additionally requires the complete visible source/destination choice trace for that mission. A hint leaves the child in control and makes the session ineligible for independent-acquisition evidence. Invalid object identity, a wrong known target, or a wrong quantity is neutral and ineligible. Ordinary pointer imprecision outside a target is recorded only as motor noise and does not disqualify later valid work.

## Optional 數學發現

Only a completed mission with a real `expectedExchange.direction` offers the short optional discovery. Both no-regroup directions are explicitly excluded. The discovery first shows the same box/star objects before and after the observed exchange, then states either `10 個一可以換成 1 個十` or `打開 1 個十，就有 10 個一`. A compact vertical record follows as a consequence; it is not another puzzle.

## Explicit exclusions and known limits

- no exact-100 addition case;
- no third world, question bank, formal mastery evaluator, ledger write, rewards, progression, or transfer write;
- no public home entry, beta promotion, merge, or main modification;
- no account or network dependency after first load;
- audio is a small optional Web Audio chime and is not required for meaning;
- prototype state intentionally resets on reload because this founder gate evaluates the moment-to-moment child loop, not persistence.

## Founder test

Use the exact immutable deployment URLs supplied in the Draft PR comment.

1. Play the four-mission run by tapping a visible source and then its visible destination. Confirm each mission feels different and quantity scenes offer several groups.
2. Replay one mission by dragging a visible source onto a valid destination; drop outside once and confirm the scene does not advance. Use keyboard Space/Enter on source and destination in another mission.
3. Send one source to the visible unsuitable destination and confirm it returns neutrally without changing the inventory.
4. In the second and fourth missions, open `數學發現` and confirm the object change is visible before the compact notation. Confirm neither no-regroup mission offers the button.
5. Use a hint, complete the mission, and inspect founder readback: completion remains, but independent eligibility is false.
6. Follow `← Number Quest`, then use the query-created `↩ 回到星箱工坊`. Open `/index.html` without the return query and confirm no V3 link exists.
7. Reload and exercise the supported mobile, iPad, and Surface viewport URLs. Confirm there are no page/console errors.
8. After one online load, test the cached URLs offline. No account, API key, or backend is required.
