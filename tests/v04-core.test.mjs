import test from 'node:test';
import assert from 'node:assert/strict';
import {CHALLENGE_LENGTHS,freshState,normalizeState,makeQuestion,skillMastery,recordSkillResult,weakestUnlockedWorld,makeReviewQuestion,WORLDS} from '../src/v04-core.mjs';

const rngSeq=(vals)=>{let i=0;return()=>vals[(i++)%vals.length]};

test('challenge lengths include 5, 10, 20',()=>assert.deepEqual(CHALLENGE_LENGTHS.map(x=>x.count),[5,10,20]));

test('all generated standard questions obey world math bounds',()=>{
  const s=freshState('2026-08-27');s.unlocked=8;
  for(let wi=0;wi<WORLDS.length;wi++)for(let i=0;i<120;i++){
    const q=makeQuestion(wi,s,{challengeLevel:1});
    assert.equal(new Set(q.opts).size,4);assert.ok(q.opts.includes(q.ans));assert.ok(q.ans>=0);
    if(WORLDS[wi].max)assert.ok(q.ans<=WORLDS[wi].max||q.op==='mul');
  }
});

test('advanced multiplication can generate a missing factor with answer 1..9',()=>{
  const s=freshState('2026-08-27');
  const q=makeQuestion(3,s,{challengeLevel:3,rng:rngSeq([0,0,0,0,0,0,0,0])});
  assert.equal(q.variant,'missing');assert.ok(q.txt.includes('?'));assert.ok(q.ans>=1&&q.ans<=9);assert.equal(new Set(q.opts).size,4);
});

test('advanced add/sub missing-number questions remain solvable within range',()=>{
  const s=freshState('2026-08-27');
  for(const wi of [0,1,2,6])for(let i=0;i<80;i++){
    const q=makeQuestion(wi,s,{challengeLevel:3});
    assert.ok(q.ans>=0);assert.ok(q.ans<=WORLDS[wi].max);assert.equal(new Set(q.opts).size,4);
  }
});

test('mastery requires both accuracy and enough exposure',()=>{
  const s=freshState('2026-08-27');recordSkillResult(s,'mul:7',true);
  assert.equal(skillMastery(s,'mul:7').mastered,false);assert.equal(skillMastery(s,'mul:7').score,20);
  for(let i=0;i<4;i++)recordSkillResult(s,'mul:7',true);
  assert.equal(skillMastery(s,'mul:7').mastered,true);assert.equal(skillMastery(s,'mul:7').score,100);
});

test('weakest unlocked world remains inside unlocked range',()=>{
  const s=freshState('2026-08-27');s.unlocked=6;s.weak['mul:7']=8;
  const picks=Array.from({length:40},()=>weakestUnlockedWorld(s));
  assert.ok(picks.every(i=>i>=0&&i<6));
});

test('review question preserves answer and valid unique options',()=>{
  const s=freshState('2026-08-27'),q=makeQuestion(6,s,{challengeLevel:3});const r=makeReviewQuestion(q);
  assert.equal(r.ans,q.ans);assert.equal(r.isReview,true);assert.equal(new Set(r.opts).size,4);assert.ok(r.opts.includes(r.ans));
});

test('v3-like state migrates without losing progress',()=>{
  const old={version:3,gems:42,xp:90,unlocked:5,collection:['sprout'],weak:{'mul:7':4},daily:{day:'2026-08-27',completedRuns:0,maxCombo:0,solved:0,bossWins:0,claimed:{}},lastPlayDay:'2026-08-27',streakDays:2};
  const s=normalizeState(old,'2026-08-27');assert.equal(s.version,4);assert.equal(s.gems,42);assert.equal(s.unlocked,5);assert.deepEqual(s.collection,['sprout']);assert.equal(s.selectedLength,10);
});
