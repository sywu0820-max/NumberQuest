import test from 'node:test';
import assert from 'node:assert/strict';
import {
  WORLDS,CHALLENGE_LENGTHS,NUMBER_SENSE_SKILLS,freshState,normalizeState,migrateV4State,makeQuestion,
  makeDivisionQuestion,makeNumberSenseQuestion,makeReviewQuestion,recordSkillMiss,recordSkillSuccess,
  skillMastery,learningSkill,challengeWeights,nextChallenge,queueSpacedReview,takeDueReview,divisionUnlocked
} from '../src/v05-core.mjs';

const rngSeq=(vals)=>{let i=0;return()=>vals[(i++)%vals.length]};

test('retains 5, 10, and 20 question runs',()=>assert.deepEqual(CHALLENGE_LENGTHS.map(x=>x.count),[5,10,20]));

test('all v0.4 world questions retain curriculum bounds and unique choices',()=>{
  const s=freshState('2026-08-29');s.unlocked=8;
  for(let wi=0;wi<WORLDS.length;wi++)for(let level=1;level<=3;level++)for(let i=0;i<120;i++){
    const q=makeQuestion(wi,s,{challengeLevel:level});
    assert.equal(q.opts.length,4);assert.equal(new Set(q.opts).size,4);assert.ok(q.opts.includes(q.ans));
    if(typeof q.ans==='number')assert.ok(q.ans>=0);
    if(q.op==='add'||q.op==='sub')assert.ok(q.result>=0&&q.result<=q.max);
    if(q.op==='mul')assert.ok(q.a>=1&&q.a<=9&&q.b>=1&&q.b<=9);
  }
});

test('division bridge always uses exact 1-9 fact families with no remainder',()=>{
  const s=freshState();
  for(let family=1;family<=9;family++)for(let variant=0;variant<4;variant++)for(let i=0;i<30;i++){
    const q=makeDivisionQuestion(s,{family,variant});
    assert.ok(q.divisor>=1&&q.divisor<=9);assert.ok(q.quotient>=1&&q.quotient<=9);
    assert.equal(q.dividend,q.divisor*q.quotient);assert.equal(q.dividend%q.divisor,0);
    assert.ok(q.dividend<=81);assert.equal(q.opts.length,4);assert.equal(new Set(q.opts).size,4);assert.ok(q.opts.includes(q.ans));
  }
});

test('division unlock requires basic multiplication exposure',()=>{
  const s=freshState();assert.equal(divisionUnlocked(s),false);
  for(let i=0;i<5;i++)recordSkillSuccess(s,`mul:${i+1}`,{firstTry:true});
  assert.equal(divisionUnlocked(s),true);
});

test('every number-sense format has one valid answer and four unique choices',()=>{
  const s=freshState();
  for(const kind of NUMBER_SENSE_SKILLS)for(let i=0;i<150;i++){
    const q=makeNumberSenseQuestion(kind);
    assert.equal(q.opts.length,4);assert.equal(new Set(q.opts).size,4);assert.equal(q.opts.filter(x=>x===q.ans).length,1);
    if(q.bounds?.max)assert.ok((q.bounds.result??q.bounds.max)<=100);
    if(q.variant==='compare'){
      assert.ok(q.bounds.totals.every(n=>n>=0&&n<=100));
      const distances=q.bounds.totals.map(n=>Math.abs(n-q.bounds.target));assert.equal(Math.min(...distances),distances[0]);assert.equal(distances.filter(x=>x===distances[0]).length,1);
    }
  }
  void s;
});

test('mastery history records first try, miss, and independent spaced revisit',()=>{
  const s=freshState('2026-08-29');
  recordSkillSuccess(s,'mul:7',{firstTry:true,day:'2026-08-29'});
  recordSkillMiss(s,'mul:7',{day:'2026-08-29'});recordSkillSuccess(s,'mul:7',{firstTry:false,day:'2026-08-29'});
  recordSkillSuccess(s,'mul:7',{firstTry:true,isRevisit:true,day:'2026-08-29'});
  const h=learningSkill(s,'mul:7');assert.equal(h.attempts,3);assert.equal(h.firstTryCorrect,2);assert.equal(h.successfulRevisits,1);assert.equal(h.pendingRevisits,0);assert.equal(h.lastPracticedDay,'2026-08-29');assert.equal(skillMastery(s,'mul:7').mastered,false);
});

test('scheduler favors weak and stale skills while every skill keeps nonzero weight',()=>{
  const s=freshState();s.learning.session=12;
  const weak=learningSkill(s,'mul:7');weak.attempts=6;weak.firstTryCorrect=1;weak.recentMisses=3;weak.pendingRevisits=1;weak.lastPracticedSession=2;
  const mastered=learningSkill(s,'mul:2');mastered.attempts=8;mastered.firstTryCorrect=8;mastered.lastPracticedSession=11;
  const weights=challengeWeights(s,['mul:2','mul:7'],{recentSkills:[]});assert.ok(weights['mul:7']>weights['mul:2']);assert.ok(weights['mul:2']>=.35);
  const picks=Array.from({length:1000},(_,i)=>nextChallenge(s,['mul:2','mul:7'],{rng:rngSeq([(i+.5)/1000]),recentSkills:[]}));
  assert.ok(picks.filter(x=>x==='mul:7').length>picks.filter(x=>x==='mul:2').length);assert.ok(picks.includes('mul:2'));
});

test('missed question returns only after the retry and two other solved questions',()=>{
  const s=freshState(),q=makeDivisionQuestion(s,{family:7,variant:0,rng:rngSeq([.5,.2,.8,.1,.6])});
  recordSkillMiss(s,q.skillKey);assert.equal(queueSpacedReview(s,q),true);assert.equal(takeDueReview(s),null);
  recordSkillSuccess(s,q.skillKey,{firstTry:false});recordSkillSuccess(s,'mul:2');assert.equal(takeDueReview(s),null);recordSkillSuccess(s,'mul:3');
  const review=takeDueReview(s);assert.equal(review.isReview,true);assert.equal(review.skillKey,q.skillKey);assert.equal(review.ans,q.ans);assert.equal(new Set(review.opts).size,4);
});

test('v0.4 migration preserves progress and never mutates source data',()=>{
  const old={version:4,gems:42,xp:90,unlocked:5,collection:['sprout'],weak:{'mul:7':4},skillStats:{'mul:7':{seen:3,first:2}},daily:{day:'2026-08-29',completedRuns:1,maxCombo:4,solved:8,bossWins:0,claimed:{}},lastPlayDay:'2026-08-29',streakDays:2,selectedLength:20};
  const snapshot=structuredClone(old),s=migrateV4State(old,'2026-08-29');assert.deepEqual(old,snapshot);assert.equal(s.version,5);assert.equal(s.gems,42);assert.equal(s.unlocked,5);assert.equal(s.selectedLength,20);assert.equal(learningSkill(s,'mul:7').attempts,3);
  s.collection.push('acorn');s.skillStats['mul:7'].seen=99;assert.deepEqual(old,snapshot);
});

test('v0.5 normalization is stable across reload and day boundaries',()=>{
  const s=freshState('2026-08-28');s.gems=71;s.daily.solved=12;s.learning.session=3;s.learning.pendingReviews=[{dueSolved:9,q:{skillKey:'mul:4',op:'mul',a:4,b:7,result:28,ans:28,optionMin:0,optionMax:81,txt:'4 × 7 = ?',hint:'hint'}}];
  const same=normalizeState(JSON.parse(JSON.stringify(s)),'2026-08-28');assert.equal(same.gems,71);assert.equal(same.daily.solved,12);assert.equal(same.learning.pendingReviews.length,1);
  const next=normalizeState(same,'2026-08-29');assert.equal(next.gems,71);assert.equal(next.daily.solved,0);assert.equal(next.streakDays,2);assert.equal(next.learning.session,3);assert.equal(next.learning.pendingReviews.length,1);
});
