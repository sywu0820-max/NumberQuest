import {GRADE_2A_MASTERY_RULES,evaluateGrade2AMastery,validateGrade2AEvidenceEvent} from './grade-2a-mastery.mjs?v=10-10';

const clone=value=>value===undefined?undefined:JSON.parse(JSON.stringify(value));
const DAY=/^\d{4}-\d{2}-\d{2}$/;
const ID=/^[A-Za-z0-9][A-Za-z0-9._:-]{0,159}$/;
const LANTERN_WORLD_ID='world.lantern-harbor';
const LANTERN_SKILLS=Object.freeze(['g2a.num.count-200','g2a.num.compose-200','g2a.num.represent-200','g2a.num.compare-200']);

export const GRADE_2A_EVIDENCE_LEDGER_CONTRACT=deepFreeze({
  schemaVersion:'1.0.0',ledgerId:'tw-grade-2a-forward-evidence-ledger',storagePath:'learning.grade2aEvidenceLedger',stateNamespace:'nq-state-v05',
  policy:{forwardOnly:true,backfillLegacyAggregates:false,localOnly:true,containsPii:false,dedupeIdentity:'eventId',derivedTimingStored:false,retention:'append-valid-no-silent-truncation',semesterStressRecords:2400,maxExpectedSerializedBytes:1500000},
  recordSchema:{
    required:['schemaVersion','eventId','worldId','skillId','sessionId','localDay','sourceQuestionId','schedulerId','outcome','attemptKind','evidenceKind','revisitKind','representationId','representationFamily','contextId','contextFamily','transferEvidence','evidenceTags'],
    enums:{outcome:['correct','miss'],attemptKind:['independent-first-try','hinted','recovered','miss'],evidenceKind:['acquisition','retrieval','transfer'],revisitKind:['initial','same-session','later-session']},
    nullable:['schedulerId'],forbiddenFields:['elapsedDaysSinceAcquisition','childName','freeText','email','userId']
  },
  worlds:{
    [LANTERN_WORLD_ID]:{
      skillIds:[...LANTERN_SKILLS],transferEligible:false,
      variants:{
        'lantern-count':{representationId:'signal-dial',representationFamily:'ordered-sequence',contextId:'harbor-missing-signal',contextFamily:'harbor-navigation'},
        'lantern-compose':{representationId:'place-value-builder',representationFamily:'place-value-construction',contextId:'harbor-signal-construction',contextFamily:'harbor-beacon-workshop'},
        'lantern-represent-expanded':{representationId:'expanded-chart-translation',representationFamily:'expanded-form',contextId:'harbor-old-chart-expanded',contextFamily:'harbor-chart-room'},
        'lantern-represent-words':{representationId:'number-words-chart-translation',representationFamily:'number-words',contextId:'harbor-old-chart-words',contextFamily:'harbor-chart-room'},
        'lantern-compare-stronger':{representationId:'stronger-signal-choice',representationFamily:'place-value-comparison',contextId:'harbor-stronger-signal-route',contextFamily:'harbor-route-choice'},
        'lantern-compare-earlier':{representationId:'earlier-arrival-choice',representationFamily:'place-value-comparison',contextId:'harbor-earlier-arrival-route',contextFamily:'harbor-route-choice'}
      }
    }
  }
});

function deepFreeze(value){if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.freeze(value);for(const item of Object.values(value))deepFreeze(item)}return value}
function issue(code,field,detail){return {code,field,detail}}
function dayOrdinal(day){
  if(!DAY.test(String(day||'')))return null;
  const [year,month,date]=day.split('-').map(Number),time=Date.UTC(year,month-1,date),parsed=new Date(time);
  return parsed.getUTCFullYear()===year&&parsed.getUTCMonth()===month-1&&parsed.getUTCDate()===date?Math.floor(time/86400000):null;
}
function emptyLedger(){return {schemaVersion:GRADE_2A_EVIDENCE_LEDGER_CONTRACT.schemaVersion,nextSequence:1,events:[]}}
function cleanSequence(value){return Math.max(1,Math.trunc(Number(value)||1))}

function hash32(text,seed){let value=seed>>>0;for(let index=0;index<text.length;index++){value^=text.charCodeAt(index);value=Math.imul(value,16777619)}return (value>>>0).toString(16).padStart(8,'0')}
export function stableQuestionSourceId(fingerprint){const text=String(fingerprint||'');return `question-${hash32(text,2166136261)}-${hash32(text,2246822519)}-${text.length}`}

export function validateGrade2ALedgerRecord(raw){
  const errors=[],schema=GRADE_2A_EVIDENCE_LEDGER_CONTRACT.recordSchema;
  if(!raw||typeof raw!=='object'||Array.isArray(raw))return {valid:false,errors:[issue('record-object-required',null,'Ledger record must be an object.')],record:null};
  for(const field of schema.required)if(!(field in raw))errors.push(issue('required-field-missing',field,`${field} is required.`));
  for(const field of schema.forbiddenFields)if(field in raw)errors.push(issue('derived-or-private-field-forbidden',field,`${field} is not stored in the canonical ledger.`));
  for(const field of ['eventId','worldId','skillId','sessionId','sourceQuestionId','representationId','representationFamily','contextId','contextFamily'])if(typeof raw[field]!=='string'||!ID.test(raw[field]))errors.push(issue('stable-id-invalid',field,`${field} must be a bounded stable identifier.`));
  if(raw.schemaVersion!==GRADE_2A_EVIDENCE_LEDGER_CONTRACT.schemaVersion)errors.push(issue('schema-version-unsupported','schemaVersion',`Expected ${GRADE_2A_EVIDENCE_LEDGER_CONTRACT.schemaVersion}.`));
  if(dayOrdinal(raw.localDay)===null)errors.push(issue('local-day-invalid','localDay','localDay must be a real YYYY-MM-DD date.'));
  for(const [field,values] of Object.entries(schema.enums))if(!values.includes(raw[field]))errors.push(issue('enum-value-invalid',field,`${field} must be one of ${values.join(', ')}.`));
  if(raw.schedulerId!==null&&(typeof raw.schedulerId!=='string'||!ID.test(raw.schedulerId)))errors.push(issue('scheduler-id-invalid','schedulerId','schedulerId must be a stable identifier or null.'));
  if(typeof raw.transferEvidence!=='boolean')errors.push(issue('boolean-required','transferEvidence','transferEvidence must be boolean.'));
  if(!Array.isArray(raw.evidenceTags)||raw.evidenceTags.some(tag=>typeof tag!=='string'||!ID.test(tag)))errors.push(issue('evidence-tags-invalid','evidenceTags','evidenceTags must be bounded stable identifiers.'));
  if(raw.outcome==='miss'&&raw.attemptKind!=='miss')errors.push(issue('miss-kind-mismatch','attemptKind','A miss must use attemptKind miss.'));
  if(raw.outcome==='correct'&&raw.attemptKind==='miss')errors.push(issue('correct-kind-mismatch','attemptKind','A correct outcome cannot use attemptKind miss.'));
  if(raw.evidenceKind==='retrieval'&&!['same-session','later-session'].includes(raw.revisitKind))errors.push(issue('retrieval-revisit-kind-invalid','revisitKind','Retrieval must identify same-session or later-session revisit.'));
  if(raw.evidenceKind!=='retrieval'&&raw.revisitKind!=='initial')errors.push(issue('nonretrieval-revisit-kind-invalid','revisitKind','Acquisition and transfer use initial revisitKind.'));
  if(raw.evidenceKind==='transfer'&&raw.transferEvidence!==true)errors.push(issue('transfer-flag-required','transferEvidence','Transfer must be explicitly marked.'));
  if(raw.evidenceKind!=='transfer'&&raw.transferEvidence!==false)errors.push(issue('transfer-flag-kind-mismatch','transferEvidence','Non-transfer records cannot carry transfer evidence.'));
  const world=GRADE_2A_EVIDENCE_LEDGER_CONTRACT.worlds[raw.worldId];
  if(!world)errors.push(issue('world-not-controlled','worldId','The world has no reviewed evidence vocabulary.'));
  else{
    if(!world.skillIds.includes(raw.skillId))errors.push(issue('skill-not-controlled','skillId','The skill is outside the reviewed World vocabulary.'));
    if(raw.transferEvidence&&!world.transferEligible)errors.push(issue('world-transfer-not-reviewed','transferEvidence','This World has no reviewed transfer surface.'));
    const allowed=Object.values(world.variants).some(item=>item.representationId===raw.representationId&&item.representationFamily===raw.representationFamily&&item.contextId===raw.contextId&&item.contextFamily===raw.contextFamily);
    if(!allowed)errors.push(issue('surface-not-controlled','representationId','Representation/context metadata must match one reviewed World variant.'));
  }
  return {valid:errors.length===0,errors,record:errors.length?null:clone(raw)};
}

export function normalizeGrade2AEvidenceLedger(raw){
  const source=raw&&typeof raw==='object'&&!Array.isArray(raw)?raw:{},events=[],seen=new Set();
  for(const candidate of Array.isArray(source.events)?source.events:[]){
    const checked=validateGrade2ALedgerRecord(candidate);if(!checked.valid||seen.has(checked.record.eventId))continue;seen.add(checked.record.eventId);events.push(checked.record);
  }
  const maxGeneratedSequence=events.reduce((max,event)=>Math.max(max,Number(event.eventId.match(/^g2a-event-(\d+)$/)?.[1])||0),0);
  return {schemaVersion:GRADE_2A_EVIDENCE_LEDGER_CONTRACT.schemaVersion,nextSequence:Math.max(cleanSequence(source.nextSequence),events.length+1,maxGeneratedSequence+1),events};
}

export function normalizeGrade2AEvidenceState(state,rawLedger=state?.learning?.grade2aEvidenceLedger){
  if(!state||typeof state!=='object')throw new TypeError('A mutable normalized state is required.');
  if(!state.learning||typeof state.learning!=='object')state.learning={};
  state.learning.grade2aEvidenceLedger=normalizeGrade2AEvidenceLedger(rawLedger);return state;
}

export function grade2AEvidenceLedgerSnapshot(state){return clone(normalizeGrade2AEvidenceLedger(state?.learning?.grade2aEvidenceLedger))}

export function appendGrade2ALedgerRecord(state,input){
  normalizeGrade2AEvidenceState(state);const ledger=state.learning.grade2aEvidenceLedger,sequence=ledger.nextSequence;
  const candidate={...clone(input),schemaVersion:GRADE_2A_EVIDENCE_LEDGER_CONTRACT.schemaVersion,eventId:String(input?.eventId||`g2a-event-${sequence}`)};
  const checked=validateGrade2ALedgerRecord(candidate);if(!checked.valid)return {appended:false,record:null,errors:checked.errors};
  const existing=ledger.events.find(event=>event.eventId===checked.record.eventId);if(existing)return {appended:false,record:clone(existing),errors:[]};
  ledger.events.push(checked.record);ledger.nextSequence=sequence+1;return {appended:true,record:clone(checked.record),errors:[]};
}

export function lanternLedgerInput(question,{sessionId,localDay,sourceQuestionId,schedulerId=null,outcome,attemptKind}={}){
  const world=GRADE_2A_EVIDENCE_LEDGER_CONTRACT.worlds[LANTERN_WORLD_ID],surface=world.variants[question?.variant];
  if(!surface)return {valid:false,input:null,errors:[issue('lantern-variant-not-controlled','variant','The mission variant has no reviewed ledger vocabulary.')]};
  const memory=Boolean(question?.isMemoryReview),review=Boolean(question?.isReview),input={
    worldId:LANTERN_WORLD_ID,skillId:String(question?.skillKey||''),sessionId:String(sessionId||''),localDay:String(localDay||''),sourceQuestionId:String(sourceQuestionId||''),schedulerId:memory||review?schedulerId:null,
    outcome,attemptKind,evidenceKind:memory||review?'retrieval':'acquisition',revisitKind:memory?'later-session':review?'same-session':'initial',
    ...surface,transferEvidence:false,evidenceTags:[]
  };
  const checked=validateGrade2ALedgerRecord({...input,schemaVersion:GRADE_2A_EVIDENCE_LEDGER_CONTRACT.schemaVersion,eventId:'preview-event'});
  return {valid:checked.valid,input,errors:checked.errors};
}

function formalEvent(record,elapsedDaysSinceAcquisition){return {
  schemaVersion:GRADE_2A_MASTERY_RULES.schemaVersion,eventId:record.eventId,skillId:record.skillId,sessionId:record.sessionId,localDay:record.localDay,outcome:record.outcome,attemptKind:record.attemptKind,evidenceKind:record.evidenceKind,revisitKind:record.revisitKind,
  elapsedDaysSinceAcquisition,representationId:record.representationId,representationFamily:record.representationFamily,contextId:record.contextId,contextFamily:record.contextFamily,sourceQuestionId:record.sourceQuestionId,schedulerId:record.schedulerId,transferEvidence:record.transferEvidence,evidenceTags:[...record.evidenceTags],relationshipFamily:null,factIdentity:null,transferSurfaceId:null
}}

export function projectGrade2ALedger(rawLedger,{skillId,profileId='concept'}={}){
  const sourceBefore=JSON.stringify(rawLedger),ledger=normalizeGrade2AEvidenceLedger(rawLedger),records=ledger.events.filter(record=>!skillId||record.skillId===skillId),projected=[],unprojectable=[];
  for(const record of records.filter(item=>item.evidenceKind==='acquisition'||item.evidenceKind==='transfer')){
    const event=formalEvent(record,null),checked=validateGrade2AEvidenceEvent(event);if(checked.valid)projected.push(checked.event);else unprojectable.push({eventId:record.eventId,code:'formal-validation-failed',errors:checked.errors});
  }
  const skills=[...new Set(records.map(record=>record.skillId))],anchors={};
  for(const id of skills){const acquisitions=projected.filter(event=>event.skillId===id&&event.evidenceKind==='acquisition'),result=evaluateGrade2AMastery({skillId:id,profileId,events:acquisitions});anchors[id]=result.supportingEvidence.acquisitionEstablishedDay}
  for(const record of records.filter(item=>item.evidenceKind==='retrieval')){
    const anchor=anchors[record.skillId],from=dayOrdinal(anchor),to=dayOrdinal(record.localDay);
    if(from===null){unprojectable.push({eventId:record.eventId,code:'acquisition-not-established'});continue}
    if(to<from){unprojectable.push({eventId:record.eventId,code:'retrieval-before-acquisition-established'});continue}
    const event=formalEvent(record,to-from),checked=validateGrade2AEvidenceEvent(event);if(checked.valid)projected.push(checked.event);else unprojectable.push({eventId:record.eventId,code:'formal-validation-failed',errors:checked.errors});
  }
  projected.sort((a,b)=>a.localDay.localeCompare(b.localDay)||a.sessionId.localeCompare(b.sessionId)||a.eventId.localeCompare(b.eventId));
  return {events:projected,unprojectable,acquisitionEstablishedDays:anchors,sourceUnchanged:JSON.stringify(rawLedger)===sourceBefore};
}

export function evaluateLanternLedgerSkill(state,skillId,{legacyEvidence=null}={}){
  if(!LANTERN_SKILLS.includes(skillId))throw new RangeError(`Unsupported Lantern Harbor skill: ${skillId}`);
  const projection=projectGrade2ALedger(state?.learning?.grade2aEvidenceLedger,{skillId,profileId:'concept'}),evaluation=evaluateGrade2AMastery({skillId,profileId:'concept',events:projection.events,legacyEvidence});
  return {projection,evaluation};
}

export function emptyGrade2AEvidenceLedger(){return emptyLedger()}
