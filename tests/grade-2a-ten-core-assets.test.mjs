import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=file=>fs.readFileSync(new URL(`../${file}`,import.meta.url),'utf8');

test('microtoy ships only ten balls, one transparent ten-frame, and a clear Number Quest back action',()=>{
  const html=read('ten-core.html'),app=read('ten-core.js'),css=read('ten-core.css');for(const id of ['numberQuestBack','looseTray','tenLabel','tenFrame','slots','relation','tenCoreDebug'])assert.match(html,new RegExp(`id="${id}"`));assert.match(app,/TEN_CORE_BALL_IDS/);assert.match(app,/document\.createElement\('button'\)/);assert.match(app,/append\(ball\)/);assert.match(css,/grid-template-columns:repeat\(5/);assert.match(css,/\.ten-frame\.grouped/);
});

test('child surface excludes story, lesson, assessment, command, and success UI',()=>{
  const child=`${read('ten-core.html')}\n${read('ten-core.js')}`;for(const phrase of ['倉庫','訂單','橋','船','角色','題目','答案','任務','關卡','分數','獎勵','數學發現','下一個','成功'])assert.doesNotMatch(child,new RegExp(phrase));assert.doesNotMatch(read('ten-core.html'),/<input|<form|success|next|score|question|candidate|object-action/i);
});

test('physical balls and slots are controls; no candidate card or detached command path exists',()=>{
  const app=read('ten-core.js');for(const token of ['dataset.ballId','data-slot','pointerdown','pointermove','pointerup','elementFromPoint','nextTenCoreEmptySlot','draggable=false'])assert.match(app,new RegExp(token.replace('.','\\.')));assert.doesNotMatch(app,/dragstart|dragend|dataTransfer|candidate|makeActionButton|object-action|source-target|numeric-answer/i);
});

test('same DOM balls move by append without replacement and reverse through the frame',()=>{
  const app=read('ten-core.js');assert.match(app,/balls=new Map/);assert.match(app,/\.append\(ball\)/);assert.match(app,/openGroup/);assert.doesNotMatch(app,/removeChild|\.remove\(\s*\)|replaceChildren|cloneNode|innerHTML/);
});

test('idle cue is visual-only and no runtime write path exists',()=>{
  const sources=`${read('ten-core.js')}\n${read('src/grade-2a-ten-core.mjs')}`;assert.match(sources,/setTimeout\([^]*4000/);assert.match(sources,/idle-cue/);assert.doesNotMatch(sources,/localStorage|sessionStorage|indexedDB|fetch\s*\(|appendGrade2ALedgerRecord|recordSkillSuccess|masteryMet|rewardWrite|progressionWrite/);
});

test('ordinary Number Quest has no public Ten-Core entry',()=>{assert.doesNotMatch(read('index.html'),/ten-core\.html|ten-core-v0/)});

test('offline shell caches the exact microtoy dependency chain and preserves predecessor cache evidence',()=>{
  const worker=read('sw.js');for(const asset of ['ten-core.html','ten-core.css?v=0-1','ten-core.js?v=0-2','grade-2a-ten-core.mjs?v=0-1'])assert.match(worker,new RegExp(asset.replace(/[.?]/g,'\\$&')));assert.match(worker,/number-quest-v10-12-ten-core-v0/);assert.match(worker,/number-quest-v09-/);assert.match(worker,/number-quest-v08-/);assert.match(worker,/pathname\.endsWith\('\/ten-core\.html'\)\?c\.match\('\.\/ten-core\.html'\)/);assert.match(read('ten-core.js'),/serviceWorker\.register\('\.\/sw\.js'\)/);
});

test('touch, focus, reduced-motion, and compact responsive rules are present',()=>{
  const css=read('ten-core.css');assert.match(css,/touch-action:none/);assert.match(css,/:focus-visible/);assert.match(css,/@media\(max-width:650px\)/);assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);assert.match(css,/min-height:44px/);
});

test('shipped browser evidence covers semantic, same-node surface, and device viewport paths',()=>{
  const semantic=read('tests/grade-2a-ten-core-browser-harness.html'),surface=read('tests/grade-2a-ten-core-surface-harness.html'),viewports=read('tests/grade-2a-ten-core-viewport-harness.html');
  assert.match(semantic,/outsidePreserved/);assert.match(surface,/sameNodes/);assert.match(surface,/pointerDrag/);assert.match(surface,/new PointerEvent/);
  for(const token of ['mobile','ipad-portrait','ipad-landscape','surface','minTouch','sameNodes','overflowX'])assert.match(viewports,new RegExp(token));
});
