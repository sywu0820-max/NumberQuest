import test from 'node:test';
import assert from 'node:assert/strict';
import {
  WORLDS,freshState,normalizeState,makeQuestion,adjustWeakness,bossReady,
  finishRun,claimReadyDaily
} from '../src/v03-core.mjs';

test('all generated answers stay in world constraints',()=>{
  const s=freshState('2026-08-26');
  for(let wi=0;wi<WORLDS.length;wi++){
    for(let n=0;n<200;n++){
      const q=makeQuestion(wi,s,Math.random);
      assert.equal(q.opts.length,4);
      assert.equal(new Set(q.opts).size,4);
      assert.ok(q.opts.includes(q.ans));
      if(q.skillKey.startsWith('add:')) assert.ok(q.ans<=Number(q.skillKey.split(':')[1]));
      if(q.skillKey.startsWith('sub:')) assert.ok(q.ans>=0);
    }
  }
});
test('wrong answers increase weakness; first-try correct decays it',()=>{
  const s=freshState(); adjustWeakness(s,'mul:7',false); assert.equal(s.weak['mul:7'],2);
  adjustWeakness(s,'mul:7',true); assert.equal(s.weak['mul:7'],1.5);
});
test('boss becomes ready before every third run',()=>{
  const s=freshState(); assert.equal(bossReady(s,0),false);
  s.worldRuns[0]=2; assert.equal(bossReady(s,0),true);
  s.worldRuns[0]=3; assert.equal(bossReady(s,0),false);
});
test('daily quests claim once',()=>{
  const s=freshState(); s.daily.completedRuns=1;s.daily.maxCombo=5;s.daily.solved=15;
  assert.equal(claimReadyDaily(s),30); const gems=s.gems;
  assert.equal(claimReadyDaily(s),0); assert.equal(s.gems,gems);
});
test('boss win grants rare collectible',()=>{
  const s=freshState(); const out=finishRun(s,0,{boss:true,maxCombo:3});
  assert.equal(out.collectible.rare,true); assert.equal(s.daily.bossWins,1);
});
test('new day rolls daily and preserves long-term progress',()=>{
  const s=freshState('2026-08-25'); s.gems=99; s.daily.solved=12;
  const n=normalizeState(s,'2026-08-26');
  assert.equal(n.gems,99); assert.equal(n.daily.solved,0); assert.equal(n.streakDays,2);
});