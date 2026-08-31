import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {
  GRADE_2A_MASTERY_RULES,validateGrade2AEvidenceEvent,evaluateGrade2AMastery,evaluateGrade2ASkillMastery,adaptLanternEventToGrade2AEvidence
} from '../src/grade-2a-mastery.mjs';

const graph=JSON.parse(await readFile(new URL('../curriculum/grade-2a.skill-graph.json',import.meta.url),'utf8'));
const contract=JSON.parse(await readFile(new URL('../curriculum/grade-2a.mastery-rules.json',import.meta.url),'utf8'));
let serial=0;
const event=({skillId='g2a.num.count-200',evidenceKind='acquisition',day='2026-09-01',sessionId='s0',outcome='correct',attemptKind='independent-first-try',representationFamily='symbolic',representationId,contextFamily='harbor',contextId,sourceQuestionId,elapsedDaysSinceAcquisition=null,revisitKind=evidenceKind==='retrieval'?'later-session':'initial',transferEvidence=evidenceKind==='transfer',evidenceTags=[],relationshipFamily=null,factIdentity=null,transferSurfaceId=null,eventId}={})=>{
  const id=++serial;
  return {schemaVersion:'1.0.0',eventId:eventId||`event-${id}`,skillId,sessionId,localDay:day,outcome,attemptKind,evidenceKind,revisitKind,elapsedDaysSinceAcquisition,representationId:representationId||`${representationFamily}-${id}`,representationFamily,contextId:contextId||`${contextFamily}-${id}`,contextFamily,sourceQuestionId:sourceQuestionId||`question-${id}`,schedulerId:evidenceKind==='retrieval'?`schedule-${id}`:null,transferEvidence,evidenceTags:[...evidenceTags],relationshipFamily,factIdentity,transferSurfaceId};
};
const evaluate=(profileId,events,options={})=>evaluateGrade2AMastery({skillId:options.skillId||'g2a.num.count-200',profileId,events,legacyEvidence:options.legacyEvidence});
const conceptAcquisition=()=>[
  event({representationFamily:'bundles'}),event({representationFamily:'number-line'}),event({representationFamily:'bundles'})
];
const conceptRetrieval=()=>[
  event({evidenceKind:'retrieval',day:'2026-09-02',sessionId:'s1',elapsedDaysSinceAcquisition:1}),
  event({evidenceKind:'retrieval',day:'2026-09-04',sessionId:'s2',elapsedDaysSinceAcquisition:3})
];
const conceptTransfer=()=>[
  event({evidenceKind:'transfer',representationFamily:'story',contextFamily:'market'}),
  event({evidenceKind:'transfer',representationFamily:'map',contextFamily:'harbor'})
];

test('machine rules exactly match the shipped JSON contract and cover every graph profile',()=>{
  assert.deepEqual(GRADE_2A_MASTERY_RULES,contract);
  assert.deepEqual(new Set(Object.keys(contract.profiles)),new Set(Object.keys(graph.pedagogyCatalog.masteryProfiles)));
  for(const skill of graph.skills)assert.ok(contract.profiles[skill.pedagogy.masteryProfile],skill.id);
  assert.equal(contract.policy.speedOrTimerIsEvidence,false);
  assert.equal(contract.policy.worldCompletionIsFormalMastery,false);
  assert.equal(contract.policy.capabilityGlowIsFormalMastery,false);
});

test('the event validator requires stable identity, session/day, representation, context, scheduler, and source fields',()=>{
  const valid=event();assert.equal(validateGrade2AEvidenceEvent(valid).valid,true);
  const broken={...valid,sessionId:'',localDay:'2026-02-30',sourceQuestionId:'',evidenceTags:'fast'};
  const result=validateGrade2AEvidenceEvent(broken);assert.equal(result.valid,false);
  assert.deepEqual(new Set(result.errors.map(item=>item.field)),new Set(['sessionId','localDay','sourceQuestionId','evidenceTags']));
});

test('concept mastery requires acquisition, next-day retrieval, three-day retrieval, and distinct transfer surfaces',()=>{
  const events=[...conceptAcquisition(),...conceptRetrieval(),...conceptTransfer()],result=evaluate('concept',events);
  assert.equal(result.acquisitionMet,true);assert.equal(result.retrievalMet,true);assert.equal(result.transferMet,true);assert.equal(result.masteryMet,true);
  assert.equal(result.progressStage,'mastery');assert.equal(result.supportingEvidence.counts.nextSessionRetrievals,1);assert.equal(result.supportingEvidence.counts.laterRetrievals,1);assert.equal(result.supportingEvidence.distinct.transferSurfaces,2);
});

test('repeated prompts or one repeated representation cannot inflate independent evidence',()=>{
  const repeated=[event({eventId:'repeat-1',sourceQuestionId:'same',representationFamily:'bundles'}),event({eventId:'repeat-2',sourceQuestionId:'same',representationFamily:'bundles'}),event({eventId:'repeat-3',sourceQuestionId:'same',representationFamily:'bundles'}),event({eventId:'repeat-3',sourceQuestionId:'same',representationFamily:'number-line'})];
  const result=evaluate('concept',repeated);assert.equal(result.acquisitionMet,false);assert.equal(result.supportingEvidence.counts.acquisitionIndependentSuccesses,1);assert.equal(result.supportingEvidence.counts.duplicateEvents,1);assert.equal(result.supportingEvidence.distinct.acquisitionRepresentations,1);
});

test('hinted and recovered successes remain support evidence rather than independent mastery',()=>{
  const events=[event({attemptKind:'hinted'}),event({attemptKind:'recovered'}),...conceptAcquisition().slice(0,2)],result=evaluate('concept',events);
  assert.equal(result.acquisitionMet,false);assert.equal(result.supportingEvidence.counts.hintedOrRecoveredSuccesses,2);assert.equal(result.supportingEvidence.counts.acquisitionIndependentSuccesses,2);
});

test('same-session and same-day later-session review are distinct from next-day and three-day retrieval',()=>{
  const acquisition=conceptAcquisition(),reviews=[
    event({evidenceKind:'retrieval',sessionId:'s0',revisitKind:'same-session',elapsedDaysSinceAcquisition:0}),
    event({evidenceKind:'retrieval',sessionId:'s0',revisitKind:'same-session',elapsedDaysSinceAcquisition:0}),
    event({evidenceKind:'retrieval',sessionId:'s0',revisitKind:'same-session',elapsedDaysSinceAcquisition:0}),
    event({evidenceKind:'retrieval',sessionId:'s-same-day',revisitKind:'later-session',elapsedDaysSinceAcquisition:0}),
    event({evidenceKind:'retrieval',day:'2026-09-02',sessionId:'s-next',elapsedDaysSinceAcquisition:1})
  ];
  let result=evaluate('concept',[...acquisition,...reviews]);assert.equal(result.retrievalMet,false);assert.equal(result.supportingEvidence.counts.sameSessionRetrievals,3);assert.equal(result.supportingEvidence.counts.sameDayLaterSessionRetrievals,1);assert.equal(result.supportingEvidence.counts.nextSessionRetrievals,1);assert.equal(result.supportingEvidence.counts.laterRetrievals,0);
  result=evaluate('concept',[...acquisition,...reviews,event({evidenceKind:'retrieval',day:'2026-09-04',sessionId:'s-later',elapsedDaysSinceAcquisition:3})]);assert.equal(result.retrievalMet,true);
});

test('repeating one transfer context and representation cannot satisfy a distinct surface requirement',()=>{
  const transfer=[event({evidenceKind:'transfer',contextFamily:'harbor',representationFamily:'bundles'}),event({evidenceKind:'transfer',contextFamily:'harbor',representationFamily:'bundles'})];
  const result=evaluate('concept',[...conceptAcquisition(),...conceptRetrieval(),...transfer]);assert.equal(result.transferMet,false);assert.equal(result.supportingEvidence.counts.transferIndependentSuccesses,2);assert.equal(result.supportingEvidence.distinct.transferSurfaces,1);
});

test('a declared elapsed-day gap is checked against event dates',()=>{
  const result=evaluate('concept',[...conceptAcquisition(),event({evidenceKind:'retrieval',day:'2026-09-02',sessionId:'s1',elapsedDaysSinceAcquisition:3})]);
  assert.equal(result.supportingEvidence.counts.retrievalIndependentSuccesses,0);assert.equal(result.supportingEvidence.retrievalInvalid[0].code,'retrieval-day-gap-mismatch');
});

test('calculation profile requires boundary and regrouping cases plus non-vertical transfer contexts',()=>{
  const acquisition=[event({evidenceTags:['boundary']}),event({evidenceTags:['regrouping-sensitive']}),event(),event()],retrieval=conceptRetrieval();
  const excluded=event({evidenceKind:'transfer',contextFamily:'bare-vertical-form'}),transfers=[event({evidenceKind:'transfer',contextFamily:'market'}),event({evidenceKind:'transfer',contextFamily:'route'})];
  let result=evaluate('calculation',[...acquisition,...retrieval,excluded,...transfers]);assert.equal(result.masteryMet,true);assert.equal(result.supportingEvidence.counts.transferIndependentSuccesses,2);
  result=evaluate('calculation',[...acquisition,...retrieval,excluded,event({evidenceKind:'transfer',contextFamily:'market'})]);assert.equal(result.transferMet,false);
});

test('application profile requires relationship diversity, uncued retrieval, and preserved relationship transfer',()=>{
  const acquisition=['part-whole','change','compare'].map((relationshipFamily,index)=>event({relationshipFamily,evidenceTags:index===0?['explanation-or-valid-model']:[]}));
  const retrieval=event({evidenceKind:'retrieval',day:'2026-09-02',sessionId:'app-r',elapsedDaysSinceAcquisition:1,evidenceTags:['no-operation-cue']});
  const transfer=[event({evidenceKind:'transfer',representationFamily:'diagram',contextFamily:'market',evidenceTags:['relationship-preserved']}),event({evidenceKind:'transfer',representationFamily:'objects',contextFamily:'garden',evidenceTags:['relationship-preserved']})];
  const result=evaluate('application',[...acquisition,retrieval,...transfer]);assert.equal(result.masteryMet,true);assert.equal(result.supportingEvidence.distinct.acquisitionRelationships,3);assert.equal(result.supportingEvidence.distinct.transferContexts,2);
});

test('measurement profile requires correct procedure, unhighlighted retrieval, and distinct transfer surfaces',()=>{
  const acquisition=Array.from({length:3},()=>event({evidenceTags:['correct-unit-and-procedure']})),retrieval=event({evidenceKind:'retrieval',day:'2026-09-02',sessionId:'measure-r',elapsedDaysSinceAcquisition:1,evidenceTags:['no-procedural-highlight']});
  const transfer=[event({evidenceKind:'transfer',transferSurfaceId:'rotated-ruler'}),event({evidenceKind:'transfer',transferSurfaceId:'physical-rope'})],result=evaluate('measurement',[...acquisition,retrieval,...transfer]);
  assert.equal(result.masteryMet,true);assert.equal(result.supportingEvidence.distinct.transferSurfaces,2);
});

test('fact-family profile is untimed and requires varied facts, sessions, situations, and a related-fact derivation',()=>{
  const acquisition=['2x2','2x3','2x4','2x5'].map((factIdentity,index)=>event({factIdentity,representationFamily:index<2?['groups','arrays'][index]:'symbolic'}));
  const retrieval=[event({evidenceKind:'retrieval',day:'2026-09-02',sessionId:'fact-r1',elapsedDaysSinceAcquisition:1,factIdentity:'2x6'}),event({evidenceKind:'retrieval',day:'2026-09-03',sessionId:'fact-r2',elapsedDaysSinceAcquisition:2,factIdentity:'2x7'})];
  const transfer=[event({evidenceKind:'transfer',contextFamily:'rows',evidenceTags:['related-fact-derived']}),event({evidenceKind:'transfer',contextFamily:'packs'})];
  const timed=[...acquisition,...retrieval,...transfer].map((item,index)=>({...item,responseMs:index+1,timerScore:9999-index}));
  const result=evaluate('fact-family',timed);assert.equal(result.masteryMet,true);assert.equal(result.supportingEvidence.distinct.acquisitionFacts,4);assert.equal(result.supportingEvidence.distinct.retrievalSessions,2);
});

test('a later miss never erases already-earned formal evidence',()=>{
  const mastered=[...conceptAcquisition(),...conceptRetrieval(),...conceptTransfer()],before=evaluate('concept',mastered),after=evaluate('concept',[...mastered,event({outcome:'miss',attemptKind:'miss'})]);
  assert.equal(before.masteryMet,true);assert.equal(after.masteryMet,true);assert.equal(after.supportingEvidence.counts.misses,1);
});

test('ambiguous v1 aggregate counters are never promoted to formal mastery',()=>{
  const legacyEvidence={firstTryCorrect:99,successfulRevisits:8,independentRetrievals:8,independentTransfers:8,capabilityState:'strong'},result=evaluate('concept',[],{legacyEvidence});
  assert.equal(result.insufficientEvidence,true);assert.equal(result.masteryMet,false);assert.equal(result.supportingEvidence.legacyAggregateIgnored,true);assert.equal(result.missingEvidence[0].code,'legacy-aggregate-insufficient');
});

test('the 百光港 adapter is side-effect-free and exposes rather than fabricates missing retrieval metadata',()=>{
  const legacy={completed:true,purpose:'retrieval',skillKey:'g2a.num.count-200',representation:'count',isMemoryReview:true,firstTry:true,recovered:false,fingerprint:'lantern-source'},before=structuredClone(legacy);
  const incomplete=adaptLanternEventToGrade2AEvidence(legacy,{sessionId:'session-2',localDay:'2026-09-02'});assert.equal(incomplete.valid,false);assert.ok(incomplete.errors.some(item=>item.code==='retrieval-elapsed-days-required'));
  const complete=adaptLanternEventToGrade2AEvidence(legacy,{sessionId:'session-2',localDay:'2026-09-02',elapsedDaysSinceAcquisition:1,schedulerId:'memory:g2a.num.count-200'});assert.equal(complete.valid,true);assert.equal(complete.event.attemptKind,'independent-first-try');assert.equal(complete.event.contextFamily,'lantern-harbor');assert.equal(complete.event.transferEvidence,false);assert.deepEqual(legacy,before);
});

test('synthetic 百光港 evidence advances building to acquisition to retrieval to transfer to mastery',()=>{
  const acquisition=conceptAcquisition(),retrieval=conceptRetrieval(),transfer=conceptTransfer();
  assert.equal(evaluate('concept',acquisition.slice(0,1)).progressStage,'building');
  assert.equal(evaluate('concept',acquisition).progressStage,'acquisition');
  assert.equal(evaluate('concept',[...acquisition,...retrieval]).progressStage,'retrieval');
  assert.equal(evaluate('concept',[...acquisition,...retrieval,transfer[0]]).progressStage,'transfer');
  assert.equal(evaluate('concept',[...acquisition,...retrieval,...transfer]).progressStage,'mastery');
});

test('skill-node API uses the exact graph profile and deterministic event order does not change mastery',()=>{
  const skill=graph.skills.find(item=>item.id==='g2a.num.count-200'),events=[...conceptAcquisition(),...conceptRetrieval(),...conceptTransfer()];
  const forward=evaluateGrade2ASkillMastery(skill,events),reverse=evaluateGrade2ASkillMastery(skill,[...events].reverse());
  assert.equal(forward.profileId,'concept');assert.equal(forward.masteryMet,true);assert.equal(reverse.masteryMet,true);assert.deepEqual(reverse.missingEvidence,forward.missingEvidence);
});

test('stress: order, misses, duplicate events, and timer noise cannot change earned concept mastery',()=>{
  const base=[...conceptAcquisition(),...conceptRetrieval(),...conceptTransfer()],duplicate={...base[0]},miss=event({outcome:'miss',attemptKind:'miss'});
  for(let seed=1;seed<=250;seed++){
    let value=seed>>>0;const rng=()=>((value=Math.imul(value,1664525)+1013904223>>>0)/4294967296);
    const noisy=[...base,duplicate,miss].map(item=>({...item,responseMs:Math.floor(rng()*100000),timerScore:Math.floor(rng()*1000)}));
    for(let index=noisy.length-1;index>0;index--){const swap=Math.floor(rng()*(index+1));[noisy[index],noisy[swap]]=[noisy[swap],noisy[index]]}
    const result=evaluate('concept',noisy);assert.equal(result.masteryMet,true,`seed ${seed}`);assert.equal(result.supportingEvidence.counts.duplicateEvents,1,`seed ${seed}`);assert.equal(result.supportingEvidence.counts.misses,1,`seed ${seed}`);
  }
});
