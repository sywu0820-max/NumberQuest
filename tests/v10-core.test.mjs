import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ONBOARDING_STEPS,CAPABILITY_STATES,freshState,normalizeState,onboardingStatus,completeOnboarding,resetOnboarding,
  recordSkillMiss,recordSkillSuccess,recordCapabilityEvidence,capabilityState,capabilityMapSnapshot,parentLearningSummary,
  homeMissionSummary,productSafetySnapshot,makeQuestionForSkill,recordMemoryPractice,buildJourneyRecap,
  queueSpacedReview,planTodaysAdventure,takeNextJourneyQuestion,questionFingerprint,completeSpacedReview,completeMemoryRetrieval,
  cosmeticRewardEligible,finishDailyProductRun
} from '../src/v10-core.mjs';

const day='2026-08-30';
const seeded=seed=>()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296);

test('fresh state gets at most three no-account onboarding steps and local completion',()=>{
  const s=normalizeState(null,day);assert.deepEqual(onboardingStatus(s),{complete:false,stepCount:3});assert.equal(ONBOARDING_STEPS.length,3);
  const copy=JSON.stringify(ONBOARDING_STEPS);assert.doesNotMatch(copy,/account|name|identity|grade|age|帳號|姓名|年級|年齡/i);
  completeOnboarding(s);assert.equal(onboardingStatus(s).complete,true);resetOnboarding(s);assert.equal(onboardingStatus(s).complete,false);
});

test('returning accepted state skips first-run onboarding while explicit reset survives migration',()=>{
  const old=freshState(day);recordSkillSuccess(old,'add:20',{day});const before=structuredClone(old),migrated=normalizeState(old,day);
  assert.equal(onboardingStatus(migrated).complete,true);assert.deepEqual(old,before);
  migrated.learning.product.onboardingComplete=false;const reset=normalizeState(migrated,day);assert.equal(onboardingStatus(reset).complete,false);
});

test('mixed onboarding-old-state cases normalize without source mutation',()=>{
  for(const [raw,expected] of [[null,false],[freshState(day),false],[{...freshState(day),gems:2},true],[{...freshState(day),learning:{...freshState(day).learning,product:{onboardingComplete:false}}},false]]){
    const before=structuredClone(raw),out=normalizeState(raw,day);assert.equal(onboardingStatus(out).complete,expected);assert.deepEqual(raw,before);
  }
});

test('capability map distinguishes explored growing remembered and strong from earned evidence',()=>{
  const s=normalizeState(null,day),key='add:20';assert.equal(capabilityState(s,key).id,CAPABILITY_STATES.UNEXPLORED.id);
  recordSkillMiss(s,key,{day});assert.equal(capabilityState(s,key).id,CAPABILITY_STATES.EXPLORED.id);
  recordSkillSuccess(s,key,{firstTry:true,day});assert.equal(capabilityState(s,key).id,CAPABILITY_STATES.GROWING.id);
  recordSkillSuccess(s,key,{firstTry:true,isRevisit:true,day});recordCapabilityEvidence(s,{completed:true,firstTry:true,isMemoryReview:true,purpose:'retrieval',skillKey:key},{day});assert.equal(capabilityState(s,key).id,CAPABILITY_STATES.REMEMBERED.id);
  recordCapabilityEvidence(s,{completed:true,firstTry:true,purpose:'transfer',skillKey:key},{day});assert.equal(capabilityState(s,key).id,CAPABILITY_STATES.STRONG.id);
  assert.equal(capabilityMapSnapshot(s,[key])[0].label,'穩穩發光');
});

test('a recent miss affects scheduling history without erasing earned capability ownership',()=>{
  const s=normalizeState(null,day),key='sub:20';recordSkillSuccess(s,key,{firstTry:true,isRevisit:true,day});recordCapabilityEvidence(s,{completed:true,firstTry:true,isMemoryReview:true,purpose:'retrieval',skillKey:key},{day});recordCapabilityEvidence(s,{completed:true,firstTry:true,purpose:'transfer',skillKey:key},{day});
  const before=capabilityState(s,key);for(let i=0;i<20;i++)recordSkillMiss(s,key,{day});const after=capabilityState(s,key);assert.equal(before.id,'strong');assert.equal(after.id,'strong');assert.equal(after.rank,before.rank);
});

test('prompted or incomplete events cannot fabricate retrieval or transfer evidence',()=>{
  const s=normalizeState(null,day),key='add:50';for(const event of [{completed:false,firstTry:true,purpose:'transfer'},{completed:true,firstTry:false,purpose:'transfer'},{completed:true,firstTry:false,purpose:'retrieval',isMemoryReview:true}])assert.equal(recordCapabilityEvidence(s,{...event,skillKey:key},{day}),null);
  assert.equal(capabilityState(s,key).successfulTransfers,0);assert.equal(capabilityState(s,key).successfulRevisits,0);
  const recap=buildJourneyRecap([{completed:true,firstTry:false,recovered:true,purpose:'transfer',isMemoryReview:true,skillKey:key}]);assert.equal(recap.independentlyRetrieved,0);assert.equal(recap.independentTransfers,0);
});

test('child recap keeps capability growth language readable and evidence-backed',()=>{
  const recap=buildJourneyRecap([{completed:true,firstTry:true,purpose:'growth',skillKey:'add:20'},{completed:true,firstTry:true,purpose:'transfer',skillKey:'add:20'}],{skillLabel:()=> '20 內加法'});assert.ok(recap.lines.includes('✨ 20 內加法 變得更穩了'));
});

test('parent summary exposes only local interpretable learning signals',()=>{
  const s=normalizeState(null,day);recordSkillSuccess(s,'add:20',{firstTry:true,day});recordSkillSuccess(s,'sub:20',{firstTry:true,isRevisit:true,day});recordCapabilityEvidence(s,{completed:true,firstTry:true,isMemoryReview:true,purpose:'retrieval',skillKey:'sub:20'},{day});recordCapabilityEvidence(s,{completed:true,firstTry:true,purpose:'transfer',skillKey:'add:20'},{day});
  const summary=parentLearningSummary(s),text=JSON.stringify(summary);assert.equal(summary.localOnly,true);assert.ok(summary.recentlyPracticed.includes('add:20'));assert.ok(summary.stableRetrieval.includes('sub:20'));assert.ok(summary.recentTransfer.includes('add:20'));assert.doesNotMatch(text,/rank|percentile|retention probability|scheduler|weight|behind grade|排名|百分位|落後|權重/i);
});

test('parent summary never infers independent retrieval from transfer-only strength',()=>{
  const s=normalizeState(null,day),key='add:50';recordSkillSuccess(s,key,{firstTry:true,day});
  for(let i=0;i<2;i++)recordCapabilityEvidence(s,{completed:true,firstTry:true,purpose:'transfer',skillKey:key},{day});
  assert.equal(capabilityState(s,key).id,'strong');let summary=parentLearningSummary(s);assert.ok(summary.recentTransfer.includes(key));assert.ok(!summary.stableRetrieval.includes(key));
  recordCapabilityEvidence(s,{completed:true,firstTry:true,isReview:true,purpose:'retrieval',skillKey:key},{day});summary=parentLearningSummary(s);assert.ok(summary.stableRetrieval.includes(key));
});

test('home mission communicates bounded Memory integration without turning remaining items into debt',()=>{
  const s=normalizeState(null,'2026-08-29');s.unlocked=8;for(const [index,key] of ['add:20','sub:20','add:50'].entries()){recordSkillSuccess(s,key,{firstTry:true,day:'2026-08-29'});recordMemoryPractice(s,makeQuestionForSkill(key,s,{rng:seeded(index+1)}),{day:'2026-08-29'})}
  const next=normalizeState(s,day),summary=homeMissionSummary(next,{day});assert.equal(summary.questionCount,10);assert.equal(summary.dueCount,3);assert.equal(summary.boundedMemory,2);assert.doesNotMatch(JSON.stringify(summary),/debt|overdue|欠|逾期/i);
});

test('repeated daily normalization preserves onboarding and capability evidence',()=>{
  let s=normalizeState(null,'2026-01-01');completeOnboarding(s);recordSkillSuccess(s,'add:20',{firstTry:true,isRevisit:true,day:'2026-01-01'});recordCapabilityEvidence(s,{completed:true,firstTry:true,isMemoryReview:true,purpose:'retrieval',skillKey:'add:20'},{day:'2026-01-01'});
  for(let n=2;n<=365;n++){const date=new Date(Date.UTC(2026,0,n)),key=date.toISOString().slice(0,10),before=structuredClone(s);s=normalizeState(s,key);assert.deepEqual(before.learning.product,s.learning.product)}
  assert.equal(onboardingStatus(s).complete,true);assert.equal(capabilityState(s,'add:20').id,'remembered');
});

test('long-running evidence updates stay bounded to counts and deterministic states',()=>{
  const s=normalizeState(null,day),key='mul:2';for(let i=0;i<1000;i++)recordCapabilityEvidence(s,{completed:true,firstTry:i%3!==0,isMemoryReview:i%2===0,purpose:i%2?'transfer':'retrieval',skillKey:key},{day});const state=capabilityState(s,key),safety=productSafetySnapshot(s);assert.equal(state.id,'strong');assert.equal(Object.keys(safety.capabilityEvidence).length,1);assert.equal(safety.localOnly,true);assert.equal(safety.requiresAccount,false);assert.equal(safety.requiresNetwork,false);
});

test('cosmetic rewards cannot be farmed through short or repeated same-day runs',()=>{
  const s=normalizeState(null,day),start={gems:s.gems,xp:s.xp,collection:[...s.collection]};assert.equal(cosmeticRewardEligible(s,{day,questionCount:5}),false);
  const short=finishDailyProductRun(s,{kind:'world',worldIndex:0,questionCount:5,day});assert.equal(short.cosmeticAwarded,false);assert.deepEqual({gems:s.gems,xp:s.xp,collection:s.collection},start);assert.equal(s.worldRuns[0],1);
  const firstComplete=finishDailyProductRun(s,{mode:'journey',questionCount:10,day});assert.equal(firstComplete.cosmeticAwarded,true);assert.ok(s.gems>start.gems);const earned={gems:s.gems,xp:s.xp,collection:[...s.collection]};
  s.daily.maxCombo=8;s.daily.solved=25;const replay=finishDailyProductRun(s,{mode:'journey',questionCount:10,day});assert.equal(replay.cosmeticAwarded,false);assert.deepEqual({gems:s.gems,xp:s.xp,collection:s.collection},earned);assert.equal(s.daily.claimed.combo,undefined);assert.equal(s.daily.claimed.solve,undefined);
});

test('stress v1.0 normalization preserves adaptive Memory and same-session ownership interleavings',()=>{
  for(let seed=1;seed<=150;seed++){
    const s=normalizeState(null,'2026-08-29');s.unlocked=8;for(const key of ['add:20','sub:20','add:50','sub:50'])for(let i=0;i<3;i++)recordSkillSuccess(s,key,{firstTry:true,day:'2026-08-29'});
    const overlap=makeQuestionForSkill('add:20',s,{challengeLevel:3,rng:seeded(seed)});recordMemoryPractice(s,overlap,{day:'2026-08-29'});queueSpacedReview(s,overlap);s.learning.solvedTotal+=3;const today=normalizeState(s,day),queue=planTodaysAdventure(today,{day,rng:seeded(seed+900)}),seen=[];
    while(queue.length){const q=takeNextJourneyQuestion(today,queue,{rng:seeded(seed+seen.length+1800)});if(!q)break;seen.push(questionFingerprint(q));if(q.isMemoryReview)completeMemoryRetrieval(today,q,{day,firstTry:true});else{if(q.isReview)completeSpacedReview(today,q);recordSkillSuccess(today,q.skillKey,{firstTry:true,isRevisit:Boolean(q.isReview),day})}}
    assert.equal(seen.length,10,`seed ${seed}`);assert.equal(seen.some((value,index)=>index&&value===seen[index-1]),false,`seed ${seed}`);assert.equal(today.learning.pendingReviews.some(item=>item.fingerprint===questionFingerprint(overlap)),false,`seed ${seed}`);
  }
});

test('stress repeated misses and recoveries cannot manufacture reward recap evidence',()=>{
  const events=Array.from({length:500},(_,index)=>({completed:true,firstTry:false,recovered:true,isMemoryReview:index%2===0,purpose:index%3===0?'transfer':'retrieval',skillKey:`add:${index%2?20:50}`})),recap=buildJourneyRecap(events);assert.equal(recap.independentlyRetrieved,0);assert.equal(recap.independentTransfers,0);assert.equal(recap.secureSkillKey,null);assert.equal(recap.recoveries,500);assert.equal(recap.lines.some(line=>line.includes('變得更穩')),false);
});
