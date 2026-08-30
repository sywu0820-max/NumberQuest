import test from 'node:test';
import assert from 'node:assert/strict';
import {
  freshState,recordSkillSuccess,recordSkillMiss,makeQuestionForSkill,recordMemoryPractice,recordMemoryMiss,queueSpacedReview,
  questionFingerprint,planTodaysAdventure,takeNextJourneyQuestion,completeMemoryRetrieval,
  completeSpacedReview,learningSkill,memoryScheduleSnapshot
} from '../src/v09-core.mjs';

const seeded=seed=>()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296);
function readyState(){
  const s=freshState('2026-08-30');s.unlocked=8;
  for(const key of ['add:20','sub:20','add:50','sub:50','mul:2','mul:5'])for(let i=0;i<4;i++)recordSkillSuccess(s,key,{day:'2026-08-28'});
  return s;
}
function drainJourney(s,queue){
  const asked=[];
  for(let i=0;i<20;i++){
    const q=takeNextJourneyQuestion(s,queue,{rng:seeded(100+i)});if(!q)break;
    asked.push(q);recordSkillSuccess(s,q.skillKey,{firstTry:true,day:'2026-08-30'});
  }
  return asked;
}

test('a review due before journey start is owned by the plan and asked once',()=>{
  const s=readyState(),review=makeQuestionForSkill('sub:50',s,{rng:seeded(31)}),fingerprint=questionFingerprint(review);
  queueSpacedReview(s,review);s.learning.solvedTotal+=3;
  const queue=planTodaysAdventure(s,{day:'2026-08-30',rng:seeded(6)}),first=takeNextJourneyQuestion(s,queue,{rng:seeded(9)});
  assert.equal(questionFingerprint(first),fingerprint);assert.equal(completeSpacedReview(s,first),true);recordSkillSuccess(s,first.skillKey,{firstTry:true,isRevisit:true,day:'2026-08-30'});
  const asked=[first,...drainJourney(s,queue)];
  assert.equal(asked.filter(q=>questionFingerprint(q)===fingerprint).length,1);
  assert.ok(asked.find(q=>questionFingerprint(q)===fingerprint)?.journeyPurpose);
  assert.equal(s.learning.pendingReviews.length,0);assert.equal(learningSkill(s,review.skillKey).pendingRevisits,0);assert.equal(learningSkill(s,review.skillKey).successfulRevisits,1);
});

test('Memory identity wins when the same fingerprint is also a due pending review',()=>{
  const s=readyState(),question=makeQuestionForSkill('add:20',s,{rng:seeded(77)}),fingerprint=questionFingerprint(question);
  recordMemoryPractice(s,question,{day:'2026-08-29'});queueSpacedReview(s,question);s.learning.solvedTotal+=3;
  const queue=planTodaysAdventure(s,{day:'2026-08-30',rng:seeded(2)});
  const first=takeNextJourneyQuestion(s,queue,{rng:seeded(8)});
  assert.equal(questionFingerprint(first),fingerprint);assert.equal(first.isMemoryReview,true);assert.equal(first.isReview,false);
  completeMemoryRetrieval(s,first,{day:'2026-08-30',firstTry:true});
  const asked=[first,...drainJourney(s,queue)];
  assert.equal(asked.filter(q=>questionFingerprint(q)===fingerprint).length,1);
  assert.equal(s.learning.pendingReviews.length,0);assert.equal(learningSkill(s,question.skillKey).pendingRevisits,0);assert.equal(learningSkill(s,question.skillKey).successfulRevisits,1);assert.equal(memoryScheduleSnapshot(s)[question.skillKey].dueDay,'2026-09-02');
});

test('a pre-due review missed on first presentation returns after the bounded spacing',()=>{
  const s=readyState(),review=makeQuestionForSkill('sub:50',s,{rng:seeded(51)}),fingerprint=questionFingerprint(review);
  queueSpacedReview(s,review);s.learning.solvedTotal+=3;const queue=planTodaysAdventure(s,{day:'2026-08-30',rng:seeded(4)}),asked=[];
  const first=takeNextJourneyQuestion(s,queue,{rng:seeded(1)});asked.push(first);assert.equal(questionFingerprint(first),fingerprint);
  recordSkillMiss(s,first.skillKey,{day:'2026-08-30'});queueSpacedReview(s,first);recordSkillSuccess(s,first.skillKey,{firstTry:false,isRevisit:true,day:'2026-08-30'});
  for(let i=0;i<2;i++){const between=takeNextJourneyQuestion(s,queue,{rng:seeded(20+i)});assert.notEqual(questionFingerprint(between),fingerprint);asked.push(between);recordSkillSuccess(s,between.skillKey,{firstTry:true,day:'2026-08-30'})}
  const revisit=takeNextJourneyQuestion(s,queue,{rng:seeded(30)});asked.push(revisit);assert.equal(questionFingerprint(revisit),fingerprint);assert.equal(revisit.isReview,true);
  assert.equal(completeSpacedReview(s,revisit),true);recordSkillSuccess(s,revisit.skillKey,{firstTry:true,isRevisit:true,day:'2026-08-30'});
  assert.equal(asked.filter(q=>questionFingerprint(q)===fingerprint).length,2);assert.equal(s.learning.pendingReviews.length,0);assert.equal(learningSkill(s,review.skillKey).pendingRevisits,0);assert.equal(learningSkill(s,review.skillKey).successfulRevisits,1);
});

test('a missed Memory-owned overlap still receives its later ordinary same-session revisit',()=>{
  const s=readyState(),question=makeQuestionForSkill('add:20',s,{rng:seeded(91)}),fingerprint=questionFingerprint(question);
  recordMemoryPractice(s,question,{day:'2026-08-29'});queueSpacedReview(s,question);s.learning.solvedTotal+=3;const queue=planTodaysAdventure(s,{day:'2026-08-30',rng:seeded(2)}),asked=[];
  const memory=takeNextJourneyQuestion(s,queue,{rng:seeded(3)});asked.push(memory);assert.equal(memory.isMemoryReview,true);recordSkillMiss(s,memory.skillKey,{day:'2026-08-30'});queueSpacedReview(s,memory);recordMemoryMiss(s,memory,{day:'2026-08-30'});completeMemoryRetrieval(s,memory,{day:'2026-08-30',firstTry:false});
  for(let i=0;i<2;i++){const between=takeNextJourneyQuestion(s,queue,{rng:seeded(40+i)});assert.notEqual(questionFingerprint(between),fingerprint);asked.push(between);recordSkillSuccess(s,between.skillKey,{firstTry:true,day:'2026-08-30'})}
  const revisit=takeNextJourneyQuestion(s,queue,{rng:seeded(50)});asked.push(revisit);assert.equal(questionFingerprint(revisit),fingerprint);assert.equal(revisit.isReview,true);assert.equal(Boolean(revisit.isMemoryReview),false);assert.equal(memoryScheduleSnapshot(s)[question.skillKey].dueDay,'2026-08-31');
  assert.equal(completeSpacedReview(s,revisit),true);recordSkillSuccess(s,revisit.skillKey,{firstTry:true,isRevisit:true,day:'2026-08-30'});
  assert.equal(asked.filter(q=>questionFingerprint(q)===fingerprint).length,2);assert.equal(s.learning.pendingReviews.length,0);assert.equal(learningSkill(s,question.skillKey).pendingRevisits,0);assert.equal(memoryScheduleSnapshot(s)[question.skillKey].dueDay,'2026-08-31');
});
