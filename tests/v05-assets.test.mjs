import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const app=await readFile(new URL('../v05-app.js',import.meta.url),'utf8');
const worker=await readFile(new URL('../sw.js',import.meta.url),'utf8');
const html=await readFile(new URL('../index.html',import.meta.url),'utf8');

test('v0.5 uses an isolated state key and only reads v0.4 as migration input',()=>{
  assert.match(app,/STATE_KEY='nq-state-v05'/);assert.match(app,/LEGACY_KEY='nq-state-v04'/);
  assert.doesNotMatch(app,/localStorage\.setItem\(LEGACY_KEY/);
});

test('successor service worker preserves prior caches and only reads its active cache',()=>{
  assert.doesNotMatch(worker,/k\.startsWith\('number-quest-v05-'\)/);assert.doesNotMatch(worker,/number-quest-v04/);
  assert.match(worker,/c\.match\(e\.request\)/);
  assert.doesNotMatch(worker,/caches\.match\(e\.request\)/);
});

test('successor shell does not regress to an older app entrypoint',()=>{
  assert.match(html,/v07-app\.js/);assert.doesNotMatch(html,/src="v04-app\.js"/);assert.doesNotMatch(html,/src="v05-app\.js"/);assert.doesNotMatch(html,/src="v06-app\.js"/);
});
