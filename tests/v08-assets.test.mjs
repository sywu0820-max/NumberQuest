import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const app=await readFile(new URL('../v08-app.js',import.meta.url),'utf8');
const worker=await readFile(new URL('../sw.js',import.meta.url),'utf8');
const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
const browserHarness=await readFile(new URL('./v08-browser-harness.html',import.meta.url),'utf8');

test('v0.8 shell uses the new deterministic core and keeps local-only operation',()=>{
  assert.match(app,/from '\.\/src\/v08-core\.mjs'/);assert.match(app,/STATE_KEY='nq-state-v05'/);
  assert.doesNotMatch(app,/fetch\(|XMLHttpRequest|WebSocket|sendBeacon|analytics|childName|userId/);
  assert.match(html,/Number Quest v0\.8/);assert.match(html,/v08-app\.js/);assert.doesNotMatch(html,/src="v07-app\.js"/);
});

test('Story Mission passes bounded ephemeral history to the generator',()=>{
  assert.match(app,/recentTemplateIds:storyRecentTemplates,recentThemeIds:storyRecentThemes/);
  assert.match(app,/storyRecentTemplates=storyRecentTemplates\.slice\(-5\)/);assert.match(app,/storyRecentThemes=storyRecentThemes\.slice\(-3\)/);
  assert.match(app,/getStoryDiversity/);assert.match(app,/QA_MODE.*qa.*v08/);assert.match(html,/id="v08Debug" hidden/);assert.doesNotMatch(app,/localStorage\.setItem\([^\n]*storyRecent/);
});

test('v0.8 worker isolates its cache and includes the complete inherited dependency chain',()=>{
  assert.match(worker,/number-quest-v08-/);assert.match(worker,/startsWith\('number-quest-v08-'\)/);assert.doesNotMatch(worker,/startsWith\('number-quest-v07-'\)/);
  for(const asset of ['v08-app.js','src/v08-core.mjs','src/v07-core.mjs','src/v06-core.mjs','src/v05-core.mjs'])assert.match(worker,new RegExp(asset.replace(/[./]/g,'\\$&')));
});

test('ordinary modes, Memory Chest, and opt-in read aloud remain wired',()=>{
  for(const id of ['memoryBtn','storyBtn','focusBtn','academyBtn','divisionBtn','readBtn'])assert.match(html,new RegExp(`id="${id}"`));
  assert.match(app,/completeMemoryRetrieval\(S,q/);assert.match(app,/speechSynthesis\.cancel\(\)/);assert.match(app,/暫時不能朗讀/);
});

test('unknown-group renderer uses the core unit-neutral total label',()=>{
  assert.match(app,/visualHintKnownTotalLabel\(model\)/);assert.doesNotMatch(app,/knownTotal\} 顆/);assert.doesNotMatch(app,/合起來共有.*knownTotal/);
});

test('browser harness runs the shipped core without mutating local progress',()=>{
  assert.match(browserHarness,/\.\.\/src\/v08-core\.mjs/);assert.match(browserHarness,/DIV_SHARING/);assert.match(browserHarness,/DIV_GROUPING/);assert.match(browserHarness,/missingFactor/);assert.match(browserHarness,/memoryIdentity/);
  assert.doesNotMatch(browserHarness,/localStorage|sessionStorage/);
});
