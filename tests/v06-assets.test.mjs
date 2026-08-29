import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const app=await readFile(new URL('../v06-app.js',import.meta.url),'utf8');
const worker=await readFile(new URL('../sw.js',import.meta.url),'utf8');
const html=await readFile(new URL('../index.html',import.meta.url),'utf8');

test('v0.6 keeps the accepted local state namespace and never writes legacy state',()=>{
  assert.match(app,/STATE_KEY='nq-state-v05'/);assert.match(app,/LEGACY_KEY='nq-state-v04'/);assert.doesNotMatch(app,/localStorage\.setItem\(LEGACY_KEY/);
});

test('v0.7 successor keeps the v0.6 dependency chain while isolating its active cache',()=>{
  assert.match(html,/v07-app\.js/);assert.match(html,/v06\.css/);assert.match(html,/v07\.css/);assert.doesNotMatch(html,/src="v06-app\.js"/);
  assert.match(worker,/number-quest-v07-/);assert.match(worker,/k\.startsWith\('number-quest-v07-'\)/);assert.doesNotMatch(worker,/caches\.match\(e\.request\)/);
  assert.match(worker,/v07-app\.js/);assert.match(worker,/src\/v07-core\.mjs/);assert.match(worker,/src\/v06-core\.mjs/);assert.match(worker,/src\/v05-core\.mjs/);
});

test('read aloud is opt-in, cancels duplicate speech, and has an unsupported fallback',()=>{
  assert.match(app,/speechSynthesis\.cancel\(\)/);assert.match(app,/new window\.SpeechSynthesisUtterance/);assert.match(app,/暫時不能朗讀/);
  const render=app.slice(app.indexOf('function renderQuestion'),app.indexOf('function showDivisionIntro'));
  assert.doesNotMatch(render,/\.speak\(/);
});
