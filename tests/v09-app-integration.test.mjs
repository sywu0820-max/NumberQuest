import test from 'node:test';
import assert from 'node:assert/strict';
import {
  freshState,recordSkillSuccess,makeQuestionForSkill,recordMemoryPractice,queueSpacedReview,
  questionFingerprint,planTodaysAdventure,takeNextJourneyQuestion,completeMemoryRetrieval,
  completeSpacedReview,learningSkill,memoryScheduleSnapshot
} from '../src/v09-core.mjs';

const seeded=seed=>()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296);
function readyState(){
  const s=freshState('2026-08-30');s.unlocked=8;
  for(const key of ['add:20','sub:20','add:50','sub:50','mul:2','mul:5'])for(let i=0;i<4;i++)recordSkillSuccess(s,key,{day:'2026-08-28'});
  return s;
}
function drainJourney(s,queue,seen){
  const asked=[];
  for(let i=0;i<20;i++){
    const q=takeNextJourneyQuestion(s,queue,{seenFingerprints:seen,rng:seeded(100+i)});if(!q)break;
    const fingerprint=questionFingerprint(q);seen.add(fingerprint);asked.push(q);s.learning.solvedTotal+=1;
  }
  return asked;
}

test('a review due before journey start is owned by the plan and asked once',()=>{
  const s=readyState(),review=makeQuestionForSkill('sub:50',s,{rng:seeded(31)}),fingerprint=questionFingerprint(review);
  queueSpacedReview(s,review);s.learning.solvedTotal+=3;
  const queue=planTodaysAdventure(s,{day:'2026-08-30',rng:seeded(6)}),seen=new Set(),first=takeNextJourneyQuestion(s,queue,{seenFingerprints:seen,rng:seeded(9)});
  assert.equal(questionFingerprint(first),fingerprint);seen.add(fingerprint);assert.equal(completeSpacedReview(s,first),true);recordSkillSuccess(s,first.skillKey,{firstTry:true,isRevisit:true,day:'2026-08-30'});s.learning.solvedTotal+=1;
  const asked=[first,...drainJourney(s,queue,seen)];
  assert.equal(asked.filter(q=>questionFingerprint(q)===fingerprint).length,1);
  assert.ok(asked.find(q=>questionFingerprint(q)===fingerprint)?.journeyPurpose);
  assert.equal(s.learning.pendingReviews.length,0);assert.equal(learningSkill(s,review.skillKey).pendingRevisits,0);assert.equal(learningSkill(s,review.skillKey).successfulRevisits,1);
});

test('Memory identity wins when the same fingerprint is also a due pending review',()=>{
  const s=readyState(),question=makeQuestionForSkill('add:20',s,{rng:seeded(77)}),fingerprint=questionFingerprint(question);
  recordMemoryPractice(s,question,{day:'2026-08-29'});queueSpacedReview(s,question);s.learning.solvedTotal+=3;
  const queue=planTodaysAdventure(s,{day:'2026-08-30',rng:seeded(2)}),seen=new Set();
  const first=takeNextJourneyQuestion(s,queue,{seenFingerprints:seen,rng:seeded(8)});
  assert.equal(questionFingerprint(first),fingerprint);assert.equal(first.isMemoryReview,true);assert.equal(first.isReview,false);
  seen.add(fingerprint);completeMemoryRetrieval(s,first,{day:'2026-08-30',firstTry:true});s.learning.solvedTotal+=1;
  const asked=[first,...drainJourney(s,queue,seen)];
  assert.equal(asked.filter(q=>questionFingerprint(q)===fingerprint).length,1);
  assert.equal(s.learning.pendingReviews.length,0);assert.equal(learningSkill(s,question.skillKey).pendingRevisits,0);assert.equal(learningSkill(s,question.skillKey).successfulRevisits,1);assert.equal(memoryScheduleSnapshot(s)[question.skillKey].dueDay,'2026-09-02');
});
