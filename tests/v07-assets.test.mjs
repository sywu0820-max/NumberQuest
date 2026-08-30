import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const app=await readFile(new URL('../v07-app.js',import.meta.url),'utf8');
const worker=await readFile(new URL('../sw.js',import.meta.url),'utf8');
const html=await readFile(new URL('../index.html',import.meta.url),'utf8');

test('v0.7 preserves local-only state and does not add account analytics or network APIs',()=>{
  assert.match(app,/STATE_KEY='nq-state-v05'/);assert.doesNotMatch(app,/fetch\(|XMLHttpRequest|WebSocket|sendBeacon|analytics|childName|userId/);
  assert.doesNotMatch(html,/登入|帳號|姓名|排名|作業債/);
});

test('v0.7 shell exposes an optional Memory Chest without disabling ordinary adventures',()=>{
  assert.match(html,/id="memoryBtn"/);assert.match(html,/🧠 記憶寶箱/);assert.match(app,/button\.disabled=!status\.ready/);
  for(const id of ['storyBtn','focusBtn','academyBtn','divisionBtn'])assert.match(html,new RegExp(`id="${id}"`));
  assert.doesNotMatch(app,/storyBtn.*disabled.*memory|focusBtn.*disabled.*memory|academyBtn.*disabled.*memory/);
});

test('v0.7 app routes Memory Chest success through cross-scheduler reconciliation',()=>{
  assert.match(app,/completeMemoryRetrieval\(S,q/);assert.doesNotMatch(app,/q\.isMemoryReview\)recordMemorySuccess/);
});

test('v0.8 successor keeps the v0.7 assets and complete core dependency chain',()=>{
  assert.match(html,/v08-app\.js/);assert.match(html,/v07\.css/);assert.match(worker,/number-quest-v08-/);assert.match(worker,/k\.startsWith\('number-quest-v08-'\)/);
  for(const asset of ['v08-app.js','src/v08-core.mjs','src/v07-core.mjs','src/v06-core.mjs','src/v05-core.mjs'])assert.match(worker,new RegExp(asset.replace(/[./]/g,'\\$&')));
  assert.doesNotMatch(worker,/startsWith\('number-quest-v07-'\)/);
});
