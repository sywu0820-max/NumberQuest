import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=file=>fs.readFileSync(new URL(`../${file}`,import.meta.url),'utf8');

test('prototype is a hidden query-gated surface with no normal-home entry',()=>{
  const home=read('index.html'),html=read('carry-bridge-prototype.html'),app=read('carry-bridge-prototype.js');
  assert.doesNotMatch(home,/carry-bridge-prototype/);assert.match(app,/carryBridgePrototypeAccessEnabled\(location\.search\)/);assert.match(html,/id="prototypeGate"/);assert.match(html,/id="prototypeApp"[^>]*hidden/);
});

test('prototype imports the accepted semantic core boundary and never touches progress or ledger state',()=>{
  const ui=read('carry-bridge-prototype.js'),adapter=read('src/grade-2a-carry-bridge-prototype.mjs');
  assert.match(adapter,/from '\.\/grade-2a-carry-bridge-core\.mjs'/);assert.match(adapter,/applyCarryBridgeAction/);assert.match(adapter,/classifyCarryBridgeAcquisition/);
  assert.doesNotMatch(ui+adapter,/localStorage|sessionStorage|grade-2a-evidence-ledger|recordSkill|recordCapability|appendGrade|fetch\(|XMLHttpRequest|WebSocket|sendBeacon/);
  assert.match(adapter,/ledgerWritePerformed:false/);assert.match(adapter,/formalMasteryClaimed:false/);assert.match(adapter,/persisted:false/);
});

test('founder switcher and variants remain hidden, bounded, reversible, and query-only',()=>{
  const html=read('carry-bridge-prototype.html'),app=read('carry-bridge-prototype.js'),adapter=read('src/grade-2a-carry-bridge-prototype.mjs');
  assert.match(html,/id="founderPanel"[^>]*hidden/);assert.match(app,/params\.get\('founder'\)==='1'/);assert.match(app,/new URLSearchParams\(location\.search\)/);
  for(const token of ['tap-first','drag-first','balanced','individual','pair-scoop','cargo-slip','digit-dials'])assert.match(adapter+html,new RegExp(token));
  assert.doesNotMatch(app,/history\.pushState|document\.cookie|indexedDB/);
});

test('child surface is gameful, bounded, and avoids school or publisher framing',()=>{
  const html=read('carry-bridge-prototype.html'),child=html.match(/<main id="prototypeApp"[\s\S]*?<details id="qaPanel"/)?.[0]||'';
  assert.match(child,/交換橋工坊/);assert.match(child,/合流台/);assert.match(child,/換裝台/);assert.match(child,/拆箱台/);assert.match(child,/卸貨區/);assert.match(child,/十格集貨盤/);assert.match(child,/搬貨/);assert.match(child,/蓋章/);
  assert.doesNotMatch(child,/年級|課本|單元|出版社|康軒|南一|翰林|考試|測驗|作業|進位|退位/);
  assert.match(child,/0～99/);assert.doesNotMatch(child,/100 件/);
});

test('tap, keyboard, pointer, color, and reduced-motion accessibility are explicit',()=>{
  const html=read('carry-bridge-prototype.html'),css=read('carry-bridge-prototype.css'),app=read('carry-bridge-prototype.js');
  assert.match(css,/min-width:44px;min-height:44px/);assert.match(css,/\.load-card,\.math-block\{touch-action:none\}/);assert.match(css,/prefers-reduced-motion:reduce/);assert.match(css,/border:2px/);assert.match(app,/tap-select-place/);assert.match(app,/pointer-drag/);for(const token of ['dragstart','pointerdown','pointermove','pointerup','pointercancel','elementFromPoint'])assert.match(app,new RegExp(token));assert.match(app,/keydown/);assert.match(html,/aria-live="polite"/);
});

test('offline cache contains every hidden prototype and browser-harness asset',()=>{
  const worker=read('sw.js');for(const asset of ['carry-bridge-prototype.html','carry-bridge-prototype.css?v=dogfood-3','carry-bridge-prototype.js?v=dogfood-3','src/grade-2a-carry-bridge-prototype.mjs?v=dogfood-3','src/grade-2a-carry-bridge-core.mjs','tests/grade-2a-carry-bridge-prototype-browser-harness.html'])assert.match(worker,new RegExp(asset.replace(/[./?=-]/g,'\\$&')));assert.match(worker,/number-quest-v10-14-carry-dogfood/);assert.match(worker,/number-quest-v09-/);assert.match(worker,/number-quest-v08-/);
});

test('shipped browser harness covers the bounded shortcut and interaction matrix without storage',()=>{
  const harness=read('tests/grade-2a-carry-bridge-prototype-browser-harness.html');for(const token of ['neutralSurface','variantEquivalence','pathEquivalence','exactTenTray','invalidBundles','unnecessaryExchange','wrongSubmitRecovery','fixedTraceResistance','motorNoisePolicy','pageErrors'])assert.match(harness,new RegExp(token));assert.doesNotMatch(harness,/localStorage|sessionStorage/);
});
