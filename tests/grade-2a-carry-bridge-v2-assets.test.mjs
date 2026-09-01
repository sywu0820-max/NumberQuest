import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=file=>fs.readFileSync(new URL(`../${file}`,import.meta.url),'utf8');

test('V2.1 is a separate hidden Number Quest surface with no normal navigation entry',()=>{
  const home=read('index.html'),html=read('carry-bridge-v2.html'),app=read('carry-bridge-v2.js');
  assert.doesNotMatch(home,/carry-bridge-v2/);assert.match(app,/carryBridgeV2AccessEnabled\(location\.search\)/);assert.match(html,/id="prototypeGate"/);assert.match(html,/id="prototypeApp"[^>]*hidden/);
  assert.match(html,/NUMBER QUEST/);assert.match(html,/交換橋工坊/);assert.match(html,/隱藏 V2\.1/);
});

test('V2 primary loop removes the dashboard and detached answer entry',()=>{
  const html=read('carry-bridge-v2.html'),primary=html.match(/<section id="playScene"[\s\S]*?<section id="blueprintScene"/)?.[0]||'';
  assert.doesNotMatch(primary,/<input|inputmode|answerInput|submitAnswer|貨單|合流台|換裝台|拆箱台|十位停靠格|個位停靠格/);
  for(const required of ['mergeScene','tenMachine','openingDock','departingBoat','celebrateScene'])assert.match(primary,new RegExp(`id="${required}"`));
  assert.doesNotMatch(primary,/年級|課本|單元|出版社|康軒|南一|翰林|考試|測驗|作業|進位|退位/);
});

test('V2 uses accepted semantic core through a bounded adapter and cannot write product state',()=>{
  const adapter=read('src/grade-2a-carry-bridge-v2.mjs'),prototype=read('src/grade-2a-carry-bridge-prototype.mjs'),ui=read('carry-bridge-v2.js');
  assert.match(adapter,/from '\.\/grade-2a-carry-bridge-prototype\.mjs'/);assert.match(adapter,/carryBridgeBundleModel/);assert.match(prototype,/from '\.\/grade-2a-carry-bridge-core\.mjs'/);
  assert.doesNotMatch(adapter+ui,/localStorage|sessionStorage|indexedDB|document\.cookie|grade-2a-evidence-ledger|recordSkill|recordCapability|fetch\(|XMLHttpRequest|WebSocket|sendBeacon/);
  for(const boundary of ['ledgerWritePerformed:false','formalMasteryClaimed:false','persisted:false','transferClaimed:false','progressionWritePerformed:false','rewardWritePerformed:false'])assert.match(adapter,new RegExp(boundary));
});

test('tap, keyboard, cancellation-safe optional drag, touch targets, reduced motion, and live status are explicit',()=>{
  const html=read('carry-bridge-v2.html'),css=read('carry-bridge-v2.css'),app=read('carry-bridge-v2.js');
  assert.match(css,/min-height:48px/);assert.match(css,/prefers-reduced-motion:reduce/);assert.match(app,/tap-direct/);assert.match(app,/pointer-drag/);
  for(const token of ['pointerdown','pointermove','pointerup','pointercancel','elementFromPoint','suppressClickUntil','droppedOutside','cancelled'])assert.match(app,new RegExp(token));
  assert.match(html,/aria-live="polite"/);assert.match(html,/id="hintButton"/);
});

test('blueprint is a separate interactive post-completion micro-scene, not mixed into concrete play',()=>{
  const html=read('carry-bridge-v2.html'),app=read('carry-bridge-v2.js');
  assert.match(html,/<section id="blueprintScene"[^>]*hidden/);assert.match(html,/id="blueprintChoices"/);assert.match(app,/carryBridgeV21BlueprintChallenge\(session\)/);assert.match(app,/applyCarryBridgeV21BlueprintChoice/);assert.match(app,/\$\('playScene'\)\.hidden=true/);assert.match(app,/\$\('blueprintScene'\)\.hidden=false/);
});

test('V2.1 exposes all four hidden direct cases plus a bounded mixed world-run',()=>{
  const html=read('carry-bridge-v2.html'),app=read('carry-bridge-v2.js'),adapter=read('src/grade-2a-carry-bridge-v2.mjs');
  for(const rule of ['add-no-regroup','add-regroup','sub-no-regroup','sub-regroup'])assert.match(html,new RegExp(`value="${rule}"`));
  assert.match(html,/value="world-run"/);assert.match(app,/carryBridgeV21WorldRunPlan/);assert.match(adapter,/world-run must contain 5 to 7 missions/);
  assert.doesNotMatch(read('index.html'),/carry-bridge-v2/);
});

test('V2.1 has staged answer-safe hints and a perceptible before-transform-after film',()=>{
  const html=read('carry-bridge-v2.html'),css=read('carry-bridge-v2.css'),app=read('carry-bridge-v2.js'),adapter=read('src/grade-2a-carry-bridge-v2.mjs');
  assert.match(html,/id="exchangeFilm"/);assert.match(css,/filmReveal/);assert.match(app,/transformKind/);
  for(const stage of ['pulse-focus','relationship','tiny-support'])assert.match(adapter,new RegExp(stage));
  assert.match(adapter,/revealsAnswer:false,completesAction:false,returnsControl:true/);
});

test('offline cache contains every shipped V2 asset and semantic harness',()=>{
  const worker=read('sw.js');for(const asset of ['carry-bridge-v2.html','carry-bridge-v2.css?v=v21-1','carry-bridge-v2.js?v=v21-1','src/grade-2a-carry-bridge-v2.mjs?v=v21-1','src/grade-2a-carry-bridge-prototype.mjs','src/grade-2a-carry-bridge-core.mjs','tests/grade-2a-carry-bridge-v2-browser-harness.html'])assert.match(worker,new RegExp(asset.replace(/[./?=-]/g,'\\$&')));assert.match(worker,/number-quest-v10-16-carry-v21/);
});

test('V2.1 browser harness covers four families, world-run, blueprint, traces, paths, and boundaries',()=>{
  const harness=read('tests/grade-2a-carry-bridge-v2-browser-harness.html');for(const token of ['progressiveDisclosure','objectCompletion','invalidExchange','pathEquivalence','fixedScriptResistance','sourceImmutability','worldRun','blueprintInteraction','dirtyTraces','evidenceBoundary','pageErrors'])assert.match(harness,new RegExp(token));assert.doesNotMatch(harness,/localStorage|sessionStorage/);
});
