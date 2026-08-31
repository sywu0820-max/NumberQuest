import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const app=await readFile(new URL('../v10-app.js',import.meta.url),'utf8');
const core=await readFile(new URL('../src/v10-core.mjs',import.meta.url),'utf8');
const worker=await readFile(new URL('../sw.js',import.meta.url),'utf8');
const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
const css=await readFile(new URL('../v10.css',import.meta.url),'utf8');

test('v1.0 shell uses the successor core and keeps local-only state',()=>{
  assert.match(app,/from '\.\/src\/v10-core\.mjs\?v=10-10'/);assert.match(app,/STATE_KEY='nq-state-v05'/);assert.match(html,/Number Quest v1\.0/);assert.match(html,/src="v10-app\.js\?v=10-10"/);assert.doesNotMatch(app,/fetch\(|XMLHttpRequest|WebSocket|sendBeacon|analytics|childName|userId|apiKey/);
});

test('child-first home makes Today’s Adventure primary and specialist modes secondary',()=>{
  assert.match(html,/開始今天的冒險/);assert.ok(html.indexOf('id="journeyBtn"')<html.indexOf('id="moreAdventures"'));assert.match(html,/<details class="more-adventures"/);
  for(const id of ['journeyBtn','memoryBtn','storyBtn','focusBtn','academyBtn','divisionBtn','masteryBtn'])assert.match(html,new RegExp(`id="${id}"`));
});

test('first-run onboarding is bounded, no-account, and starts the daily journey',()=>{
  assert.match(html,/id="onboardingOverlay"[^>]*aria-labelledby="onboardingTitle"/);assert.match(app,/ONBOARDING_STEPS/);assert.match(app,/completeOnboarding\(S\)/);assert.match(app,/startJourney\(\)/);assert.match(app,/resetOnboarding\(S\)/);
  assert.doesNotMatch(html,/姓名|年齡|年級|建立帳號|登入/);assert.doesNotMatch(core,/childName|userId|email|accountId/);
});

test('capability recap and healthy stopping precede cosmetic reward',()=>{
  assert.ok(html.indexOf('id="capabilityRecap"')<html.indexOf('id="newCollectible"'));assert.ok(html.indexOf('id="healthyStop"')<html.indexOf('id="newCollectible"'));assert.match(app,/buildJourneyRecap\(journeyEvents/);assert.match(app,/recordCapabilityEvidence\(S,learningEvent/);assert.match(html,/今天的冒險可以到這裡/);
});

test('cosmetic rewards are gated behind one complete daily mission instead of per-answer farming',()=>{
  assert.match(app,/finishDailyProductRun\(S/);assert.doesNotMatch(app,/claimReadyDaily|S\.gems\+=attempted|S\.xp\+=attempted|連擊寶箱！\+💎/);assert.doesNotMatch(app,/x\.reward|💎\$\{x\.reward\}/);assert.match(core,/questionCount\)\|\|0\)\)>=10/);assert.match(core,/dailyRewardDay!==day/);
});

test('capability map uses child-friendly earned states without punitive failure labels',()=>{
  for(const token of ['探索過','正在長大','記得回來','穩穩發光'])assert.match(core,new RegExp(token));assert.match(app,/capabilityState\(S,key\)/);assert.doesNotMatch(html,/弱點|失敗|落後|排名|錯誤率/);assert.doesNotMatch(app,/弱點特訓|能力等級/);
});

test('secondary adult view is local, interpretable, and non-shaming',()=>{
  assert.match(html,/給大人看/);assert.match(app,/parentLearningSummary\(S\)/);for(const label of ['最近遇見的能力','已經能自己想起來','正在慢慢建立','換個故事也會','一起支持的方法'])assert.match(app,new RegExp(label));
  assert.doesNotMatch(html+app,/percentile|retention probability|scheduler weight|behind grade|百分位|落後年級|排程權重/i);
});

test('v1.0 cache family is isolated and includes the complete successor dependency chain',()=>{
  assert.match(worker,/const CACHE='number-quest-v10-/);assert.match(worker,/keys\.filter\(k=>k\.startsWith\('number-quest-v10-'\)/);assert.doesNotMatch(worker,/keys\.filter\(k=>k\.startsWith\('number-quest-v09-'\).*map\(k=>caches\.delete/);
  for(const asset of ['v10.css','v10-app.js','src/grade-2a-evidence-ledger.mjs','src/grade-2a-mastery.mjs','src/v10-core.mjs','v09.css','v09-app.js','src/v09-core.mjs','src/v08-core.mjs','src/v07-core.mjs','src/v06-core.mjs','src/v05-core.mjs'])assert.match(worker,new RegExp(asset.replace(/[./]/g,'\\$&')));
});

test('v1.0 primary and secondary controls preserve the touch baseline and responsive layout',()=>{
  assert.match(css,/\.journey-primary,.home-memory,.capability-peek button,.more-adventures>summary,.adult-entry,.text-button\{min-height:44px\}/);assert.doesNotMatch(css,/width:\s*100vw/);assert.match(css,/@media\(max-width:720px\)/);assert.doesNotMatch(html,/user-scalable=no/);
});
