import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {freshState,normalizeState,questionFingerprint} from '../src/v10-core.mjs';
import {makeLanternMission} from '../src/grade-2a-lantern-core.mjs';
import {evaluateGrade2AMastery} from '../src/grade-2a-mastery.mjs';
import {
  GRADE_2A_EVIDENCE_LEDGER_CONTRACT,appendGrade2ALedgerRecord,evaluateLanternLedgerSkill,grade2AEvidenceLedgerSnapshot,
  lanternLedgerInput,normalizeGrade2AEvidenceLedger,projectGrade2ALedger,stableQuestionSourceId,validateGrade2ALedgerRecord
} from '../src/grade-2a-evidence-ledger.mjs';

const seeded=seed=>()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296);
const sourceId=(value,index=0)=>stableQuestionSourceId(`${value}:${index}`);
const schedulerId=value=>`scheduler-${sourceId(value)}`;
const mission=(variant,index=1)=>{
  const skillKey=variant.startsWith('lantern-represent-')?'g2a.num.represent-200':variant==='lantern-count'?'g2a.num.count-200':variant==='lantern-compose'?'g2a.num.compose-200':'g2a.num.compare-200';
  return {...makeLanternMission(skillKey,{rng:seeded(index)}),variant};
};
function inputFor(question,{sessionId='lantern-session-1',localDay='2026-09-01',outcome='correct',attemptKind='independent-first-try',source=sourceId(questionFingerprint(question)),scheduler=null}={}){
  const result=lanternLedgerInput(question,{sessionId,localDay,sourceQuestionId:source,schedulerId:scheduler,outcome,attemptKind});assert.equal(result.valid,true,JSON.stringify(result.errors));return result.input;
}
function append(state,input){const result=appendGrade2ALedgerRecord(state,input);assert.equal(result.appended,true,JSON.stringify(result.errors));return result.record}

test('machine ledger contract exactly matches the shipped JSON schema',()=>{
  const json=JSON.parse(fs.readFileSync(new URL('../curriculum/grade-2a.evidence-ledger.json',import.meta.url)));
  assert.deepEqual(GRADE_2A_EVIDENCE_LEDGER_CONTRACT,json);
  assert.equal(json.policy.forwardOnly,true);assert.equal(json.policy.backfillLegacyAggregates,false);assert.equal(json.policy.derivedTimingStored,false);assert.equal(json.worlds['world.lantern-harbor'].transferEligible,false);
});

test('normalization is non-mutating, forward-only, and never backfills accepted v1 aggregate history',()=>{
  const legacy=freshState('2026-08-31');legacy.gems=23;legacy.learning.skillHistory['g2a.num.count-200']={attempts:8,firstTryCorrect:7,successfulRevisits:3,recentMisses:0,pendingRevisits:0,lastPracticedDay:'2026-08-31',lastPracticedSession:2};
  legacy.learning.product={onboardingComplete:true,dailyRewardDay:'2026-08-31',capabilityEvidence:{'g2a.num.count-200':{independentRetrievals:4,independentTransfers:3,lastEvidenceDay:'2026-08-31'}}};
  const before=JSON.stringify(legacy),normalized=normalizeState(legacy,'2026-09-01');
  assert.equal(JSON.stringify(legacy),before);assert.equal(normalized.gems,23);assert.equal(normalized.learning.skillHistory['g2a.num.count-200'].successfulRevisits,3);assert.deepEqual(normalized.learning.grade2aEvidenceLedger,{schemaVersion:'1.0.0',nextSequence:1,events:[]});
  const readback=evaluateLanternLedgerSkill(normalized,'g2a.num.count-200',{legacyEvidence:legacy.learning.product.capabilityEvidence['g2a.num.count-200']});assert.equal(readback.evaluation.insufficientEvidence,true);assert.equal(readback.evaluation.masteryMet,false);assert.equal(readback.evaluation.supportingEvidence.legacyAggregateIgnored,true);
});

test('ledger validation accepts only bounded identifiers and reviewed 百光港 surfaces',()=>{
  const input=inputFor(mission('lantern-count',2),{}),valid=validateGrade2ALedgerRecord({...input,schemaVersion:'1.0.0',eventId:'g2a-event-1'});assert.equal(valid.valid,true);
  for(const invalid of [
    {...valid.record,elapsedDaysSinceAcquisition:1},
    {...valid.record,childName:'child'},
    {...valid.record,contextFamily:'cosmetic-story-change'},
    {...valid.record,evidenceKind:'transfer',transferEvidence:true}
  ])assert.equal(validateGrade2ALedgerRecord(invalid).valid,false);
});

test('first try, miss, hinted recovery, and unhinted recovery remain distinct observed facts',()=>{
  const state=normalizeState(null,'2026-09-01'),q=mission('lantern-count',3);
  const records=[
    append(state,inputFor(q,{source:sourceId('first')})),
    append(state,inputFor(q,{outcome:'miss',attemptKind:'miss',source:sourceId('miss')})),
    append(state,inputFor(q,{attemptKind:'hinted',source:sourceId('hinted')})),
    append(state,inputFor(q,{attemptKind:'recovered',source:sourceId('recovered')}))
  ];
  assert.deepEqual(records.map(item=>item.attemptKind),['independent-first-try','miss','hinted','recovered']);assert.deepEqual(records.map(item=>item.eventId),['g2a-event-1','g2a-event-2','g2a-event-3','g2a-event-4']);assert.equal(new Set(records.map(item=>item.sourceQuestionId)).size,4);
});

test('fresh review prompts keep scheduler lineage separate across same-session and later-session records',()=>{
  const source=mission('lantern-represent-expanded',4),lineage=schedulerId(questionFingerprint(source));
  const sameQuestion={...mission('lantern-represent-words',5),isReview:true,reviewSourceQuestion:source},laterQuestion={...mission('lantern-represent-expanded',6),isMemoryReview:true,reviewSourceQuestion:source};
  const same=inputFor(sameQuestion,{source:sourceId('same-session-fresh'),scheduler:lineage}),later=inputFor(laterQuestion,{sessionId:'lantern-session-2',localDay:'2026-09-02',source:sourceId('later-session-fresh'),scheduler:lineage});
  assert.equal(same.evidenceKind,'retrieval');assert.equal(same.revisitKind,'same-session');assert.equal(later.revisitKind,'later-session');assert.equal(same.schedulerId,later.schedulerId);assert.notEqual(same.sourceQuestionId,later.sourceQuestionId);assert.notEqual(same.sourceQuestionId,lineage);
});

test('pure projection derives acquisition timing and reaches retrieval without fabricating transfer',()=>{
  const state=normalizeState(null,'2026-09-01'),skillId='g2a.num.represent-200',lineage=schedulerId('represent-lineage');
  append(state,inputFor(mission('lantern-represent-expanded',10),{source:sourceId('acq',1)}));
  append(state,inputFor(mission('lantern-represent-words',11),{source:sourceId('acq',2)}));
  append(state,inputFor(mission('lantern-represent-expanded',12),{source:sourceId('acq',3)}));
  const next={...mission('lantern-represent-words',13),isMemoryReview:true,reviewSourceQuestion:mission('lantern-represent-expanded',10)},later={...mission('lantern-represent-expanded',14),isMemoryReview:true,reviewSourceQuestion:mission('lantern-represent-expanded',10)};
  append(state,inputFor(next,{sessionId:'lantern-session-2',localDay:'2026-09-02',source:sourceId('retrieval',1),scheduler:lineage}));
  append(state,inputFor(later,{sessionId:'lantern-session-3',localDay:'2026-09-04',source:sourceId('retrieval',2),scheduler:lineage}));
  const ledger=grade2AEvidenceLedgerSnapshot(state),before=JSON.stringify(ledger),readback=evaluateLanternLedgerSkill(state,skillId);
  assert.equal(JSON.stringify(ledger),before);assert.equal(readback.projection.sourceUnchanged,true);assert.equal(readback.projection.acquisitionEstablishedDays[skillId],'2026-09-01');assert.deepEqual(readback.projection.events.filter(item=>item.evidenceKind==='retrieval').map(item=>item.elapsedDaysSinceAcquisition),[1,3]);
  assert.equal(readback.evaluation.acquisitionMet,true);assert.equal(readback.evaluation.retrievalMet,true);assert.equal(readback.evaluation.transferMet,false);assert.equal(readback.evaluation.masteryMet,false);assert.equal(readback.projection.events.some(item=>item.transferEvidence),false);
  const base=readback.projection.events[0],explicitTransfers=[
    {...base,eventId:'explicit-transfer-1',localDay:'2026-09-05',sessionId:'lantern-session-4',sourceQuestionId:sourceId('transfer',1),evidenceKind:'transfer',revisitKind:'initial',elapsedDaysSinceAcquisition:null,representationId:'future-number-line',representationFamily:'number-line',contextId:'future-map-route',contextFamily:'map-navigation',transferEvidence:true},
    {...base,eventId:'explicit-transfer-2',localDay:'2026-09-05',sessionId:'lantern-session-4',sourceQuestionId:sourceId('transfer',2),evidenceKind:'transfer',revisitKind:'initial',elapsedDaysSinceAcquisition:null,representationId:'future-story-model',representationFamily:'story-model',contextId:'future-market-route',contextFamily:'market-navigation',transferEvidence:true}
  ];
  const explicit=evaluateGrade2AMastery({skillId,profileId:'concept',events:[...readback.projection.events,...explicitTransfers]});assert.equal(explicit.transferMet,true);assert.equal(explicit.masteryMet,true);
});

test('retrieval before acquisition is established stays visible but cannot be promoted',()=>{
  const state=normalizeState(null,'2026-09-01'),q={...mission('lantern-represent-words',20),isMemoryReview:true,reviewSourceQuestion:mission('lantern-represent-expanded',19)};
  append(state,inputFor(q,{sessionId:'lantern-session-2',localDay:'2026-09-02',source:sourceId('orphan-review'),scheduler:schedulerId('orphan')}));
  const projection=projectGrade2ALedger(state.learning.grade2aEvidenceLedger,{skillId:'g2a.num.represent-200'});assert.equal(projection.events.length,0);assert.equal(projection.unprojectable[0].code,'acquisition-not-established');
});

test('reload normalization preserves event identity while a later run keeps a distinct session',()=>{
  const state=normalizeState(null,'2026-09-01'),q=mission('lantern-compose',30);append(state,inputFor(q,{sessionId:'lantern-session-1',source:sourceId('reload',1)}));
  const saved=JSON.parse(JSON.stringify(state)),reload=normalizeState(saved,'2026-09-01');assert.deepEqual(reload.learning.grade2aEvidenceLedger,state.learning.grade2aEvidenceLedger);
  append(reload,inputFor(q,{sessionId:'lantern-session-2',source:sourceId('reload',2)}));assert.deepEqual(reload.learning.grade2aEvidenceLedger.events.map(item=>item.sessionId),['lantern-session-1','lantern-session-2']);assert.equal(state.learning.grade2aEvidenceLedger.events.length,1);
});

test('normalization deduplicates by stable event identity without collapsing distinct observed outcomes',()=>{
  const q=mission('lantern-count',40),base=inputFor(q,{source:sourceId('dedupe')}),one={...base,schemaVersion:'1.0.0',eventId:'g2a-event-9'},replay={...one},miss={...base,schemaVersion:'1.0.0',eventId:'g2a-event-10',outcome:'miss',attemptKind:'miss'};
  const normalized=normalizeGrade2AEvidenceLedger({schemaVersion:'0.8',nextSequence:1,events:[one,replay,miss,{bad:true}]});assert.equal(normalized.events.length,2);assert.deepEqual(normalized.events.map(item=>item.outcome),['correct','miss']);assert.equal(normalized.nextSequence,11);
});

test('semester-scale ledger remains bounded without storing names, free text, or derived timing',()=>{
  const count=GRADE_2A_EVIDENCE_LEDGER_CONTRACT.policy.semesterStressRecords,q=mission('lantern-count',50),events=[];
  for(let index=0;index<count;index++)events.push({...inputFor(q,{sessionId:`lantern-session-${Math.floor(index/20)+1}`,localDay:`2026-${String(9+Math.floor(index/1200)).padStart(2,'0')}-${String(index%28+1).padStart(2,'0')}`,source:sourceId('semester',index)}),schemaVersion:'1.0.0',eventId:`g2a-event-${index+1}`});
  const ledger=normalizeGrade2AEvidenceLedger({schemaVersion:'1.0.0',nextSequence:count+1,events}),serialized=JSON.stringify(ledger);assert.equal(ledger.events.length,count);assert.ok(serialized.length<GRADE_2A_EVIDENCE_LEDGER_CONTRACT.policy.maxExpectedSerializedBytes,serialized.length);assert.doesNotMatch(serialized,/childName|freeText|elapsedDaysSinceAcquisition|email|userId/);
});
