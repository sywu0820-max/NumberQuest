import test from 'node:test';
import assert from 'node:assert/strict';
import {
  freshState,normalizeState,recordSkillSuccess,recordSkillMiss,questionFingerprint,learningSkill,skillMastery,
  queueSpacedReview,takeDueReview,
  MEMORY_INTERVAL_DAYS,MEMORY_RUN_LIMIT,addMemoryDays,memoryDayDistance,memoryScheduleSnapshot,
  recordMemoryPractice,recordMemoryMiss,recordMemorySuccess,dueMemoryReviews,memoryChestStatus,
  memoryReviewWeight,makeMemoryReviewQuestion,completeMemoryRetrieval
} from '../src/v07-core.mjs';

const symbolic=(skillKey='add:20',a=8,b=7)=>({op:'add',variant:'normal',a,b,result:a+b,ans:a+b,skillKey,optionMin:0,optionMax:20,txt:`${a} ＋ ${b} = ?`,hint:'hint',opts:[a+b,a+b-1,a+b+1,a+b+2]});
const story=(skillKey='sub:20')=>({op:'sub',variant:'story-sub',story:true,storyKind:'sub',a:14,b:6,result:8,ans:8,skillKey,optionMin:0,optionMax:20,txt:'火箭有 14 點能量，用掉 6 點。還剩多少？',hint:'hint',opts:[8,7,9,10]});

test('memory day calculations cross month year and leap-day boundaries using day keys',()=>{
  assert.equal(addMemoryDays('2026-08-31',1),'2026-09-01');
  assert.equal(addMemoryDays('2026-12-31',1),'2027-01-01');
  assert.equal(addMemoryDays('2028-02-28',1),'2028-02-29');
  assert.equal(memoryDayDistance('2026-08-29','2026-09-05'),7);
  assert.throws(()=>addMemoryDays('2026-02-30',1),/Invalid local day key/);
});

test('successful first-try cross-day retrieval follows bounded 1 3 7 14-day progression',()=>{
  const s=freshState('2026-08-29'),q=symbolic();
  let entry=recordMemoryPractice(s,q,{day:'2026-08-29'});assert.equal(entry.intervalIndex,0);assert.equal(entry.dueDay,'2026-08-30');
  entry=recordMemorySuccess(s,q,{day:'2026-08-30',firstTry:true});assert.equal(entry.intervalIndex,1);assert.equal(entry.dueDay,'2026-09-02');
  entry=recordMemorySuccess(s,q,{day:'2026-09-02',firstTry:true});assert.equal(entry.intervalIndex,2);assert.equal(entry.dueDay,'2026-09-09');
  entry=recordMemorySuccess(s,q,{day:'2026-09-09',firstTry:true});assert.equal(entry.intervalIndex,3);assert.equal(entry.dueDay,'2026-09-23');
  entry=recordMemorySuccess(s,q,{day:'2026-09-23',firstTry:true});assert.equal(entry.intervalIndex,3);assert.equal(entry.dueDay,'2026-10-07');
  assert.deepEqual(MEMORY_INTERVAL_DAYS,[1,3,7,14]);
});

test('a miss or non-independent revisit resets the future interval to tomorrow',()=>{
  const s=freshState('2026-08-29'),q=symbolic();recordMemoryPractice(s,q,{day:'2026-08-29'});recordMemorySuccess(s,q,{day:'2026-08-30'});recordMemorySuccess(s,q,{day:'2026-09-02'});
  let entry=recordMemoryMiss(s,q,{day:'2026-09-09'});assert.equal(entry.intervalIndex,0);assert.equal(entry.dueDay,'2026-09-10');assert.equal(entry.lastOutcome,'miss');
  entry=recordMemorySuccess(s,q,{day:'2026-09-10',firstTry:false});assert.equal(entry.intervalIndex,0);assert.equal(entry.dueDay,'2026-09-11');assert.equal(entry.lastOutcome,'miss');
});

test('one per-skill schedule prevents duplicate review identities while keeping the latest eligible format',()=>{
  const s=freshState('2026-08-29'),first=symbolic(),replacement={...story('add:20'),op:'add',variant:'story-add',a:9,b:4,result:13,ans:13,txt:'你有 9 顆寶石，又找到 4 顆。現在有幾顆？',opts:[13,12,14,15]};
  recordMemoryPractice(s,first,{day:'2026-08-29'});recordMemoryPractice(s,first,{day:'2026-08-29'});recordMemoryPractice(s,replacement,{day:'2026-08-29'});
  const schedule=memoryScheduleSnapshot(s);assert.deepEqual(Object.keys(schedule),['add:20']);assert.equal(schedule['add:20'].fingerprint,questionFingerprint(replacement));assert.equal(schedule['add:20'].question.story,true);
});

test('ordinary practice cannot overwrite an already-due cross-day identity',()=>{
  const s=freshState('2026-08-29'),first=symbolic('add:20',8,7),sameSkill=symbolic('add:20',4,9);
  recordMemoryPractice(s,first,{day:'2026-08-29'});
  const before=memoryScheduleSnapshot(s)['add:20'];
  recordMemoryPractice(s,sameSkill,{day:'2026-08-30'});
  recordMemoryPractice(s,sameSkill,{day:'2026-08-30',missed:true});
  const after=memoryScheduleSnapshot(s)['add:20'];
  assert.equal(after.fingerprint,before.fingerprint);assert.equal(after.dueDay,'2026-08-30');assert.equal(after.question.txt,first.txt);
});

test('first-try Memory Chest retrieval retires the matching inherited pending review exactly once',()=>{
  const dayOne=freshState('2026-08-29'),q=symbolic();
  recordSkillMiss(dayOne,q.skillKey,{day:'2026-08-29'});assert.equal(queueSpacedReview(dayOne,q),true);recordMemoryPractice(dayOne,q,{day:'2026-08-29',missed:true});
  const dayTwo=normalizeState(dayOne,'2026-08-30'),memoryQuestion=makeMemoryReviewQuestion(dueMemoryReviews(dayTwo,{day:'2026-08-30'})[0],()=>.4);
  const outcome=completeMemoryRetrieval(dayTwo,memoryQuestion,{day:'2026-08-30',firstTry:true});
  assert.equal(outcome.retired,true);assert.equal(dayTwo.learning.pendingReviews.length,0);assert.equal(learningSkill(dayTwo,q.skillKey).pendingRevisits,0);assert.equal(learningSkill(dayTwo,q.skillKey).successfulRevisits,1);
  for(const key of ['mul:1','mul:2','mul:3'])recordSkillSuccess(dayTwo,key,{day:'2026-08-30'});
  assert.equal(takeDueReview(dayTwo),null);assert.equal(memoryScheduleSnapshot(dayTwo)[q.skillKey].dueDay,'2026-09-02');
});

test('Memory Chest retrieval preserves an unrelated pending identity for the same skill',()=>{
  const s=freshState('2026-08-29'),scheduled=symbolic('add:20',8,7),ordinary=symbolic('add:20',4,9);
  recordMemoryPractice(s,scheduled,{day:'2026-08-29'});recordSkillMiss(s,ordinary.skillKey,{day:'2026-08-30'});assert.equal(queueSpacedReview(s,ordinary),true);
  const memoryQuestion=makeMemoryReviewQuestion(dueMemoryReviews(s,{day:'2026-08-30'})[0],()=>.4),outcome=completeMemoryRetrieval(s,memoryQuestion,{day:'2026-08-30',firstTry:true});
  assert.equal(outcome.retired,false);assert.equal(s.learning.pendingReviews.length,1);assert.equal(questionFingerprint(s.learning.pendingReviews[0].q),questionFingerprint(ordinary));assert.equal(learningSkill(s,ordinary.skillKey).pendingRevisits,1);
});

test('daily normalization preserves the long-term schedule and safely migrates v0.5/v0.6 state',()=>{
  const old=freshState('2026-08-29'),oldBefore=structuredClone(old),migrated=normalizeState(old,'2026-08-29');assert.deepEqual(migrated.learning.memorySchedule,{});assert.deepEqual(old,oldBefore);
  recordMemoryPractice(migrated,story(),{day:'2026-08-29'});const saved=structuredClone(migrated),nextDay=normalizeState(saved,'2026-08-30');
  assert.equal(nextDay.daily.day,'2026-08-30');assert.equal(nextDay.learning.memorySchedule['sub:20'].dueDay,'2026-08-30');assert.equal(dueMemoryReviews(nextDay,{day:'2026-08-30'}).length,1);assert.deepEqual(saved.learning.memorySchedule,migrated.learning.memorySchedule);
  const malformed=structuredClone(saved);malformed.learning.memorySchedule['sub:20'].dueDay='2026-02-30';assert.equal(normalizeState(malformed,'2026-08-30').learning.memorySchedule['sub:20'].dueDay,'2026-08-31');
});

test('due selection is capped at five adaptive items and ordinary play is not blocked',()=>{
  const s=freshState('2026-08-29');for(let i=0;i<7;i++){const q=symbolic(`add:${20+i}`,i+1,2);recordMemoryPractice(s,q,{day:'2026-08-29'});if(i===6)recordSkillMiss(s,q.skillKey,{day:'2026-08-29'})}
  const due=dueMemoryReviews(s,{day:'2026-08-30',rng:()=>.999999}),status=memoryChestStatus(s,{day:'2026-08-30'});assert.equal(due.length,MEMORY_RUN_LIMIT);assert.equal(due[0].skillKey,'add:26');assert.deepEqual(status,{ready:true,dueCount:7,runCount:5,label:'🧠 5 個記憶寶箱在發光'});
  assert.equal(memoryChestStatus(s,{day:'2026-08-29'}).ready,false);
});

test('mastered and stale review weights stay bounded with a low nonzero mastered weight',()=>{
  const mastered=freshState('2026-08-29'),weak=freshState('2026-08-29'),q=symbolic();for(let i=0;i<6;i++)recordSkillSuccess(mastered,q.skillKey,{day:'2026-08-20'});recordMemoryPractice(mastered,q,{day:'2026-08-20'});recordMemoryPractice(weak,q,{day:'2026-08-20'});for(let i=0;i<5;i++)recordSkillMiss(weak,q.skillKey,{day:'2026-08-20'});
  const masteredEntry=memoryScheduleSnapshot(mastered)[q.skillKey],weakEntry=memoryScheduleSnapshot(weak)[q.skillKey],masteredWeight=memoryReviewWeight(mastered,masteredEntry,{day:'2026-08-29'}),weakWeight=memoryReviewWeight(weak,weakEntry,{day:'2026-08-29'});
  assert.ok(masteredWeight>=.25&&masteredWeight<=12);assert.ok(weakWeight>=.25&&weakWeight<=12);assert.ok(masteredWeight>0);assert.ok(weakWeight>masteredWeight);
});

test('weighted selection gives a mastered due skill nonzero inclusion probability beyond the five-item cap',()=>{
  const s=freshState('2026-08-29');
  for(let i=0;i<7;i++){const q=symbolic(`add:${20+i}`,i+1,2);recordMemoryPractice(s,q,{day:'2026-08-29'});if(i<6)for(let miss=0;miss<4;miss++)recordSkillMiss(s,q.skillKey,{day:'2026-08-29'});else for(let success=0;success<6;success++)recordSkillSuccess(s,q.skillKey,{day:'2026-08-29'});}
  assert.equal(skillMastery(s,'add:26').mastered,true);
  const selected=dueMemoryReviews(s,{day:'2026-08-30',rng:()=>.999999});
  assert.equal(selected.length,MEMORY_RUN_LIMIT);assert.equal(selected[0].skillKey,'add:26');assert.ok(selected.some(entry=>entry.skillKey==='add:26'));
});

test('memory questions preserve symbolic or story identity and valid answer choices',()=>{
  const s=freshState('2026-08-29');recordMemoryPractice(s,symbolic(),{day:'2026-08-29'});recordMemoryPractice(s,story(),{day:'2026-08-29'});
  const questions=dueMemoryReviews(s,{day:'2026-08-30'}).map(entry=>makeMemoryReviewQuestion(entry,()=>.4));assert.equal(questions.length,2);
  for(const q of questions){assert.equal(q.isMemoryReview,true);assert.equal(q.isReview,false);assert.equal(q.opts.length,4);assert.equal(new Set(q.opts).size,4);assert.equal(q.opts.filter(value=>value===q.ans).length,1)}
  assert.ok(questions.some(q=>q.story));assert.ok(questions.some(q=>!q.story));
});
