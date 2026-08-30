import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const app=await readFile(new URL('../v09-app.js',import.meta.url),'utf8');
const core=await readFile(new URL('../src/v09-core.mjs',import.meta.url),'utf8');
const worker=await readFile(new URL('../sw.js',import.meta.url),'utf8');
const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
const css=await readFile(new URL('../v09.css',import.meta.url),'utf8');
const harness=await readFile(new URL('./v09-browser-harness.html',import.meta.url),'utf8');

test('v0.9 shell uses the successor core and preserves local-only play',()=>{
  assert.match(app,/from '\.\/src\/v09-core\.mjs'/);assert.match(app,/STATE_KEY='nq-state-v05'/);assert.doesNotMatch(app,/fetch\(|XMLHttpRequest|WebSocket|sendBeacon|analytics|childName|userId|apiKey/);
  assert.match(html,/Number Quest v0\.9/);assert.match(html,/v09-app\.js/);assert.doesNotMatch(html,/src="v08-app\.js"/);
});

test('Today’s Adventure is optional and all accepted specialist modes remain reachable',()=>{
  for(const id of ['journeyBtn','memoryBtn','storyBtn','focusBtn','academyBtn','divisionBtn'])assert.match(html,new RegExp(`id="${id}"`));
  assert.match(app,/planTodaysAdventure\(S/);assert.match(app,/runMode='journey'/);assert.match(app,/completeMemoryRetrieval\(S,q/);assert.match(html,/其他冒險/);
});

test('journey runtime delegates review ownership to the fingerprint-aware integration boundary',()=>{
  assert.match(app,/return takeNextJourneyQuestion\(S,journeyQueue\)/);
  const body=app.match(/function nextJourneyQuestion\(\)\{([\s\S]*?)\n\}/)?.[1]||'';
  assert.doesNotMatch(body,/takeDueReview\(|seenFingerprints/);assert.doesNotMatch(app,/journeySeenFingerprints/);
});

test('first miss exposes bounded text and visual choices before the stronger second-miss scaffold',()=>{
  assert.match(html,/id="helpChoices"/);assert.match(core,/💬 給我一句線索/);assert.match(core,/👀 看圖想一想/);assert.match(app,/missCount===1/);assert.match(app,/showHelpChoices\(\)/);assert.match(app,/renderVisualHint\(2\)/);
  assert.match(app,/answerSafeTextHint\(q\)/);assert.match(app,/answerSafeVisualHintModel\(q/);
});

test('capability recap precedes cosmetic reward and is derived from journey events',()=>{
  assert.ok(html.indexOf('id="capabilityRecap"')<html.indexOf('id="newCollectible"'));assert.match(app,/buildJourneyRecap\(journeyEvents/);assert.match(app,/rememberJourneyEvent\(S,event\)/);
  assert.doesNotMatch(app,/retention score|accuracy percentage|weak child|overdue|rank|排名|錯誤率/);
});

test('v0.9 cache family is isolated and contains the complete inherited dependency chain',()=>{
  assert.match(worker,/number-quest-v09-/);assert.match(worker,/keys\.filter\(k=>k\.startsWith\('number-quest-v09-'\)/);for(const prior of ['number-quest-v08-','number-quest-v07-','number-quest-v06-'])assert.doesNotMatch(worker,new RegExp(`keys\\.filter\\(k=>k\\.startsWith\\('${prior}`));
  for(const asset of ['v09.css','v09-app.js','src/v09-core.mjs','src/v08-core.mjs','src/v07-core.mjs','src/v06-core.mjs','src/v05-core.mjs'])assert.match(worker,new RegExp(asset.replace(/[./]/g,'\\$&')));
});

test('primary interactive controls retain the 44px touch baseline',()=>{
  assert.match(css,/\.journey-primary,.help-choice,.challenge,.length,.world,.ans,.primary\{min-height:44px\}/);assert.match(css,/\.help-choice\{min-height:48px/);assert.doesNotMatch(css,/width:\s*100vw/);
});

test('v0.9 browser harness exercises planner, memory, transfer, and help safety without storage',()=>{
  for(const token of ['planTodaysAdventure','journeyPlanSummary','memoryIdentity','transferSafety','helpSafety','divisionSafety'])assert.match(harness,new RegExp(token));assert.doesNotMatch(harness,/localStorage|sessionStorage/);
});
