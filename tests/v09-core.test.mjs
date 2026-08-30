import test from 'node:test';
import assert from 'node:assert/strict';
import {
  JOURNEY_PURPOSES,freshState,normalizeState,recordSkillSuccess,recordSkillMiss,learningSkill,
  makeQuestionForSkill,makeStoryQuestion,STORY_RELATIONSHIPS,questionFingerprint,queueSpacedReview,
  recordMemoryPractice,dueMemoryReviews,memoryScheduleSnapshot,completeMemoryRetrieval,
  planTodaysAdventure,journeyPlanSummary,helpChoicesForQuestion,answerSafeVisualHintModel,
  strongerHintIsAnswerSafe,visualHintRevealsAnswer,buildJourneyRecap,rememberJourneyEvent
} from '../src/v09-core.mjs';

const seeded=seed=>()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296);
const rngSeq=values=>{let index=0;return()=>values[(index++)%values.length]};
function richState(day='2026-08-30'){
  const s=freshState(day);s.unlocked=8;
  for(const key of ['add:20','sub:20','add:50','sub:50','add:100','sub:100','mul:1','mul:2','mul:5','mul:7'])for(let i=0;i<5;i++)recordSkillSuccess(s,key,{day:'2026-08-28'});
  recordSkillMiss(s,'sub:50',{day:'2026-08-29'});recordSkillMiss(s,'mul:7',{day:'2026-08-29'});
  return s;
}
function scheduleMemory(s,key,day='2026-08-29',rng=()=>.3){const q=makeQuestionForSkill(key,s,{challengeLevel:3,rng});recordMemoryPractice(s,q,{day});return q}

test('Today’s Adventure planning is deterministic with injectable RNG and does not mutate state',()=>{
  const s=richState(),before=structuredClone(s),a=planTodaysAdventure(s,{day:'2026-08-30',rng:seeded(99)}),b=planTodaysAdventure(s,{day:'2026-08-30',rng:seeded(99)});
  assert.deepEqual(a,b);assert.deepEqual(s,before);assert.equal(a.length,10);
});

test('a rich 10-question plan allocates every bounded journey purpose',()=>{
  const s=richState();scheduleMemory(s,'add:20');
  const summary=journeyPlanSummary(planTodaysAdventure(s,{day:'2026-08-30',rng:seeded(4)}));
  for(const purpose of JOURNEY_PURPOSES)assert.ok(summary.purposes[purpose]>=1,`${purpose} missing`);
});

test('missing purpose pools redistribute gracefully without inventing curriculum',()=>{
  const s=freshState('2026-08-30'),plan=planTodaysAdventure(s,{day:'2026-08-30',rng:seeded(12)}),summary=journeyPlanSummary(plan);
  assert.equal(plan.length,10);assert.equal(summary.purposes.retrieval,0);assert.equal(summary.purposes.repair,0);assert.equal(summary.purposes.transfer,0);
  assert.ok(plan.every(q=>['growth'].includes(q.journeyPurpose)));assert.ok(plan.every(q=>!q.skillKey.startsWith('div:')&&!q.skillKey.startsWith('mul:')));
});

test('planner covers four skills and prevents duplicate, same-skill, and friction streaks when alternatives exist',()=>{
  for(let seed=1;seed<=300;seed++){
    const summary=journeyPlanSummary(planTodaysAdventure(richState(),{day:'2026-08-30',rng:seeded(seed)}));
    assert.equal(summary.count,10,`seed ${seed}`);assert.ok(summary.distinctSkills>=4,`seed ${seed}`);assert.equal(summary.duplicateConsecutive,false,`seed ${seed}`);assert.ok(summary.maxSkillStreak<=2,`seed ${seed}`);assert.ok(summary.maxFrictionStreak<=2,`seed ${seed}`);
  }
});

test('exact due Memory Chest identity embeds once and reconciles through the accepted schedule',()=>{
  const s=richState(),original=scheduleMemory(s,'add:20'),before=memoryScheduleSnapshot(s)['add:20'];
  const plan=planTodaysAdventure(s,{day:'2026-08-30',rng:seeded(2)}),memory=plan.find(q=>q.isMemoryReview);
  assert.ok(memory);assert.equal(memory.memoryFingerprint,before.fingerprint);assert.equal(questionFingerprint(memory),questionFingerprint(original));
  completeMemoryRetrieval(s,memory,{day:'2026-08-30',firstTry:true});assert.equal(dueMemoryReviews(s,{day:'2026-08-30'}).some(entry=>entry.skillKey==='add:20'),false);assert.equal(memoryScheduleSnapshot(s)['add:20'].dueDay,'2026-09-02');
});

test('prompted memory retrieval does not lengthen its interval and partial adaptive runs leave other due items due',()=>{
  const s=richState();for(const key of ['add:20','sub:20','add:50','sub:50'])scheduleMemory(s,key);
  const plan=planTodaysAdventure(s,{day:'2026-08-30',rng:seeded(8)}),embedded=plan.filter(q=>q.isMemoryReview);assert.equal(embedded.length,2);
  completeMemoryRetrieval(s,embedded[0],{day:'2026-08-30',firstTry:false});
  assert.equal(memoryScheduleSnapshot(s)[embedded[0].skillKey].dueDay,'2026-08-31');
  const stillDue=dueMemoryReviews(s,{day:'2026-08-30',limit:99});assert.equal(stillDue.length,3);assert.ok(stillDue.some(entry=>!embedded.some(q=>q.skillKey===entry.skillKey)));
});

test('due same-session review keeps exact identity and planner ownership',()=>{
  const s=richState(),q=makeQuestionForSkill('sub:50',s,{rng:seeded(77)});recordSkillMiss(s,q.skillKey);queueSpacedReview(s,q);s.learning.solvedTotal+=3;
  const repair=planTodaysAdventure(s,{day:'2026-08-30',rng:seeded(6)}).find(item=>item.journeyPurpose==='repair'&&item.isReview);
  assert.ok(repair);assert.equal(questionFingerprint(repair),questionFingerprint(q));assert.equal(repair.txt,q.txt);
});

test('transfer changes representation while preserving skill and v0.8 story semantics',()=>{
  const s=richState();s.learning.journey={recentPurposes:[],recentRepresentations:[{skillKey:'div:7',representation:'symbolic'}]};
  const plan=planTodaysAdventure(s,{day:'2026-08-30',rng:seeded(41)}),transfers=plan.filter(q=>q.journeyPurpose==='transfer');assert.ok(transfers.length);
  for(const q of transfers){assert.notEqual(q.transferFrom,q.journeyRepresentation);assert.equal(q.journeyRepresentation,q.story?'story':'symbolic');if(q.story){assert.ok(q.storyTemplateId);assert.ok(q.storyThemeId);assert.ok(q.storyRelationshipId);assert.doesNotMatch(q.txt,/[+＋\-−×÷=]/)}}
  const division=makeStoryQuestion(s,{skillKey:'div:7',relationshipId:STORY_RELATIONSHIPS.DIV_GROUPING,rng:seeded(4)});assert.equal(division.dividend,division.divisor*division.quotient);assert.equal(division.ans,division.quotient);
});

test('first-miss help choices keep text and visual help independent and answer-safe',()=>{
  const q={op:'mul',variant:'missing',a:7,b:6,result:42,ans:7,skillKey:'mul:7',txt:'? × 6 = 42',hint:'💡 想想看，幾組 6 才會到 42？'};
  const choices=helpChoicesForQuestion(q);assert.equal(choices.text.id,'text');assert.equal(choices.visual.id,'visual');assert.doesNotMatch(choices.text.text,/答案是|正確答案/);assert.equal(visualHintRevealsAnswer(choices.visual.model,q),false);assert.equal(strongerHintIsAnswerSafe(q),true);
});

test('ordinary quotient visuals degrade to an answer-safe unknown group size',()=>{
  const q={op:'div',variant:'quotient',dividend:42,divisor:7,quotient:6,result:6,ans:6,skillKey:'div:7'};
  for(const level of [1,2]){const model=answerSafeVisualHintModel(q,{level});assert.equal(model.groupCount,7);assert.equal(model.groupSize,'?');assert.equal(model.groups,undefined);assert.notEqual(model.groupSize,q.ans)}
});

test('mission recap is derived only from completed journey outcomes',()=>{
  const recap=buildJourneyRecap([
    {completed:true,isMemoryReview:true,firstTry:true,purpose:'retrieval',skillKey:'add:20'},
    {completed:true,firstTry:true,purpose:'transfer',skillKey:'add:20'},
    {completed:true,firstTry:false,recovered:true,purpose:'repair',skillKey:'sub:20'},
    {completed:false,isMemoryReview:true,firstTry:true,purpose:'retrieval',skillKey:'mul:7'}
  ],{skillLabel:key=>key==='add:20'?'20 內加法':'其他'});
  assert.deepEqual({retrieval:recap.independentlyRetrieved,transfer:recap.independentTransfers,recovery:recap.recoveries},{retrieval:1,transfer:1,recovery:1});assert.equal(recap.completed,3);assert.ok(recap.lines.every(line=>!/%|分數|錯誤|排名/.test(line)));
  assert.equal(recap.secureSkillKey,'add:20');assert.ok(recap.lines.some(line=>line.includes('20 內加法')&&line.includes('變得更穩')));
  const empty=buildJourneyRecap([]);assert.equal(empty.independentlyRetrieved,0);assert.equal(empty.independentTransfers,0);assert.deepEqual(empty.lines,[]);
});

test('mission recap never claims stability from prompted recoveries alone',()=>{
  const recap=buildJourneyRecap([
    {completed:true,firstTry:false,recovered:true,purpose:'repair',skillKey:'sub:50'},
    {completed:true,firstTry:false,recovered:true,purpose:'growth',skillKey:'sub:50'},
    {completed:true,firstTry:false,recovered:true,purpose:'transfer',skillKey:'sub:50'}
  ],{skillLabel:()=> '50 內減法'});
  assert.equal(recap.recoveries,3);assert.equal(recap.secureSkillKey,null);assert.ok(recap.lines.some(line=>line.includes('找回來')));assert.ok(recap.lines.every(line=>!line.includes('變得更穩')));
});

test('older state normalization remains non-mutating and keeps journey state small',()=>{
  const old=richState(),before=structuredClone(old),migrated=normalizeState(old,'2026-08-30');assert.deepEqual(old,before);assert.deepEqual(migrated.learning.journey,{recentPurposes:[],recentRepresentations:[]});
  for(let i=0;i<20;i++)rememberJourneyEvent(migrated,{purpose:'growth',skillKey:`add:${i}`,representation:i%2?'story':'symbolic'});
  assert.equal(migrated.learning.journey.recentPurposes.length,10);assert.equal(migrated.learning.journey.recentRepresentations.length,12);
  const reloaded=normalizeState(structuredClone(migrated),'2026-08-31');assert.equal(reloaded.learning.journey.recentRepresentations.length,12);assert.deepEqual(reloaded.learning.memorySchedule,migrated.learning.memorySchedule);
});

test('stress planner sequencing across weak mastered many-due sparse and story-heavy states',()=>{
  const scenarios=[];
  const weak=richState();for(const key of Object.keys(weak.learning.skillHistory))learningSkill(weak,key).recentMisses=8;scenarios.push(['weak',weak]);
  const mastered=richState();for(const key of Object.keys(mastered.learning.skillHistory)){const h=learningSkill(mastered,key);h.attempts=12;h.firstTryCorrect=12;h.recentMisses=0}scenarios.push(['mastered',mastered]);
  const manyDue=richState();for(const key of ['add:20','sub:20','add:50','sub:50','add:100','sub:100'])scheduleMemory(manyDue,key);scenarios.push(['many-due',manyDue]);
  scenarios.push(['sparse',freshState('2026-08-30')]);
  const storyHeavy=richState();storyHeavy.learning.journey={recentPurposes:['transfer'],recentRepresentations:Object.keys(storyHeavy.learning.skillHistory).map(skillKey=>({skillKey,representation:'story'}))};scenarios.push(['story-heavy',storyHeavy]);
  for(const [name,state] of scenarios)for(let seed=1;seed<=400;seed++){
    const plan=planTodaysAdventure(state,{day:'2026-08-30',rng:seeded(seed)}),summary=journeyPlanSummary(plan);assert.equal(plan.length,10,`${name} ${seed}`);assert.equal(summary.duplicateConsecutive,false,`${name} ${seed}`);assert.ok(summary.maxSkillStreak<=2,`${name} ${seed}`);assert.ok(summary.maxFrictionStreak<=2,`${name} ${seed}`);assert.ok(plan.filter(q=>q.isMemoryReview).length<=2,`${name} ${seed}`);
  }
});

test('seeded planner arithmetic remains inside inherited curriculum bounds',()=>{
  const s=richState();for(let seed=1;seed<=500;seed++)for(const q of planTodaysAdventure(s,{day:'2026-08-30',rng:seeded(seed)})){
    assert.equal(q.opts.length,4);assert.equal(new Set(q.opts).size,4);assert.ok(q.opts.includes(q.ans));
    if((q.op==='add'||q.op==='sub')&&!q.skillKey.startsWith('sense:')){assert.ok(q.result>=0);assert.ok(q.result<=Number(q.skillKey.split(':')[1]))}
    if(q.op==='mul'){assert.ok(q.a>=1&&q.a<=9&&q.b>=1&&q.b<=9)}
    if(q.op==='div'){assert.equal(q.dividend,q.divisor*q.quotient);assert.ok(q.divisor>=1&&q.divisor<=9)}
  }
});
