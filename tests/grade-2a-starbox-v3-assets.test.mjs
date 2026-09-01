import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=file=>fs.readFileSync(new URL(`../${file}`,import.meta.url),'utf8');

test('V3 ships as one hidden Number Quest star-box workshop with four distinct object missions',()=>{
  const html=read('starbox-v3.html'),app=read('starbox-v3.js'),css=read('starbox-v3.css');
  for(const id of ['numberQuestBack','missionSteps','workbench','actionDock','hintBtn','successPanel','discoveryDialog','founderDebug'])assert.match(html,new RegExp(`id="${id}"`));
  for(const token of ['combine-deliveries','scoop-ten-stars','seal-starbox','fulfill-boxes','open-starbox','fulfill-stars','pointer-drag','keyboard','candidate-independent-acquisition-observation'])assert.match(`${app}\n${read('src/grade-2a-starbox-v3.mjs')}`,new RegExp(token));
  assert.match(css,/touch-action:none/);assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);assert.match(css,/min-height:4[46]px/);
});

test('child surface preserves the single warehouse metaphor and avoids worksheet-era language',()=>{
  const child=`${read('starbox-v3.html')}\n${read('starbox-v3.js')}`;
  for(const phrase of ['星箱工坊','中央工作台','訂單','十格裝箱托盤','數學發現'])assert.match(child,new RegExp(phrase));
  assert.doesNotMatch(child,/橋|船|島|航行|藍圖|bridge|boat|island|blueprint/i);
  assert.doesNotMatch(read('starbox-v3.html'),/<input|選一個答案|作業|考試|測驗|課本|出版社/);
});

test('normal home has no public V3 entry while explicit ephemeral return state is reversible',()=>{
  const html=read('index.html'),returnScript=read('starbox-v3-return.js');
  assert.match(html,/id="starboxPrototypeReturn"[^>]*hidden/);assert.doesNotMatch(html,/href="starbox-v3\.html/);
  assert.match(returnScript,/prototypeReturn/);assert.match(returnScript,/prototype:'starbox-v3'/);assert.doesNotMatch(returnScript,/localStorage|sessionStorage|indexedDB|fetch/);
});

test('V3 has no ledger, mastery, reward, progression, transfer, or storage write path',()=>{
  const sources=`${read('starbox-v3.js')}\n${read('src/grade-2a-starbox-v3.mjs')}`;
  assert.doesNotMatch(sources,/appendGrade2ALedgerRecord|recordSkillSuccess|recordCapabilityEvidence|recordMemoryPractice|localStorage|sessionStorage|indexedDB|fetch\s*\(/);
  for(const value of ['ledgerWritePerformed:false','formalMasteryClaimed:false','transferClaimed:false','worldCompletionClaimed:false','progressionWritePerformed:false','rewardWritePerformed:false'])assert.match(sources,new RegExp(value));
});

test('slow motor interaction is not silently classified as hint use',()=>{
  const app=read('starbox-v3.js');assert.match(app,/scheduleHint\(\).*hint-pulse/);assert.doesNotMatch(app,/showHint\('idle-visual-cue'\)/);assert.match(app,/hintBtn[^\n]*showHint/);
});

test('offline shell caches every V3 dependency and retains protected predecessor evidence',()=>{
  const worker=read('sw.js');for(const asset of ['starbox-v3.html','starbox-v3.css?v=3-1','starbox-v3.js?v=3-1','starbox-v3-return.js?v=3-1','grade-2a-starbox-v3.mjs?v=3-1','grade-2a-carry-bridge-core.mjs'])assert.match(worker,new RegExp(asset.replace(/[.?]/g,'\\$&')));
  assert.match(worker,/number-quest-v09-/);assert.match(worker,/number-quest-v08-/);assert.match(worker,/number-quest-v10-11-starbox-v3/);
});

test('shipped V3 browser harness covers all rules, all interaction paths, support, tampering, and boundaries',()=>{
  const harness=read('tests/grade-2a-starbox-v3-browser-harness.html');
  for(const token of ['allRules','allPaths','exchangeIntegrity','supportExclusion','tamperExclusion','discoveryContinuity','runDistinctness','navigationReversible','noRuntimeWrites','exact100Supported'])assert.match(harness,new RegExp(token));
  assert.doesNotMatch(harness,/localStorage|sessionStorage|indexedDB/);
});
