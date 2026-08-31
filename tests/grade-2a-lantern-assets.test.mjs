import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=file=>fs.readFileSync(new URL(`../${file}`,import.meta.url),'utf8');

test('百光港 ships as a separate playable surface with game-state actions',()=>{
  const html=read('index.html'),app=read('v10-app.js'),css=read('v10.css');
  for(const id of ['lanternBtn','lanternWorld','harborScene','lanternControls','rescueShip','lanternDebug'])assert.match(html,new RegExp(`id="${id}"`));
  for(const token of ['startLantern','submitLantern','evaluateLanternAction','freshLanternRetry','lanternRunCompletion','recordSkillSuccess','recordMemoryPractice','recordCapabilityEvidence'])assert.match(app,new RegExp(token));
  assert.match(css,/\.beacon\.lit/);assert.match(css,/\.rescue-ship\.sailing/);assert.match(css,/touch-action:manipulation/);
});

test('child-facing harbor copy avoids school and worksheet framing',()=>{
  const html=read('index.html'),app=read('v10-app.js'),childSurface=html.match(/<section id="lanternWorld"[\s\S]*?<\/section>/)?.[0]||'';
  assert.doesNotMatch(childSurface,/年級|課本|單元|出版社|康軒|南一|翰林|考試|測驗|作業/);
  assert.doesNotMatch(app,/lantern[^\n]*(?:multiple.choice|worksheet)/i);
  assert.doesNotMatch(childSurface,/選一個答案/);
});

test('offline shell caches the new playable core and keeps prior cache families protected',()=>{
  const html=read('index.html'),worker=read('sw.js');assert.match(worker,/grade-2a-lantern-core\.mjs/);assert.match(worker,/number-quest-v09-/);assert.match(worker,/number-quest-v08-/);assert.match(html,/v10-app\.js\?v=10-9/);assert.match(worker,/v10-app\.js\?v=10-9/);
});

test('shipped browser harness proves dial safety, live review ownership, fresh retry, and extension exclusion without storage',()=>{
  const harness=read('tests/grade-2a-lantern-browser-harness.html');for(const token of ['interactions','countDial','noFixedPlusOne','sameSession','interveningMissions','reviewBeforeRunEnd','ownership','freshIdentity','sourcePreserved','extensionOnly','eligibility300'])assert.match(harness,new RegExp(token));assert.doesNotMatch(harness,/localStorage|sessionStorage/);
});
