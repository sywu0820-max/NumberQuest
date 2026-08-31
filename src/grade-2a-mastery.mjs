export const GRADE_2A_MASTERY_RULES=deepFreeze({
  schemaVersion:'1.0.0',
  contractId:'tw-grade-2a-formal-mastery',
  sourceGraphId:'tw-grade-2a-foundation',
  status:'headless-review-contract',
  runtimeIntegration:false,
  policy:{formalMasteryRequiresAllDimensions:true,missesEraseEvidence:false,speedOrTimerIsEvidence:false,legacyAggregateCountersAreFormalEvidence:false,worldCompletionIsFormalMastery:false,capabilityGlowIsFormalMastery:false,laterRetrievalDayGap:3,nextSessionMinimumDayGap:1},
  eventSchema:{
    required:['schemaVersion','eventId','skillId','sessionId','localDay','outcome','attemptKind','evidenceKind','revisitKind','elapsedDaysSinceAcquisition','representationId','representationFamily','contextId','contextFamily','sourceQuestionId','schedulerId','transferEvidence','evidenceTags'],
    enums:{outcome:['correct','miss'],attemptKind:['independent-first-try','hinted','recovered','miss'],evidenceKind:['acquisition','retrieval','transfer'],revisitKind:['initial','same-session','later-session']},
    nullable:['elapsedDaysSinceAcquisition','schedulerId','relationshipFamily','factIdentity','transferSurfaceId'],
    dedupeIdentity:['eventId','sourceQuestionId'],ignoredForMastery:['elapsedMs','responseMs','timerScore','speedBand']
  },
  profiles:{
    concept:{acquisition:{minIndependentSuccesses:3,minDistinctRepresentationFamilies:2},retrieval:{minNextSessionSuccesses:1,minLaterSuccesses:1,laterDayGap:3},transfer:{minIndependentSuccesses:2,minDistinctSurfaceSignatures:2}},
    calculation:{acquisition:{minIndependentSuccesses:4,requiredTagsAcrossEvidence:['boundary','regrouping-sensitive']},retrieval:{minNextSessionSuccesses:1,minLaterSuccesses:1,laterDayGap:3},transfer:{minIndependentSuccesses:2,minDistinctContextFamilies:2,excludedContextFamilies:['bare-vertical-form']}},
    application:{acquisition:{minIndependentSuccesses:3,minDistinctRelationshipFamilies:3,requiredTagsAcrossEvidence:['explanation-or-valid-model']},retrieval:{minLaterSessionSuccesses:1,minimumDayGap:1,requiredEveryEventTags:['no-operation-cue']},transfer:{minIndependentSuccesses:2,minDistinctRepresentationFamilies:2,minDistinctContextFamilies:2,requiredEveryEventTags:['relationship-preserved']}},
    measurement:{acquisition:{minIndependentSuccesses:3,requiredEveryEventTags:['correct-unit-and-procedure']},retrieval:{minLaterSessionSuccesses:1,minimumDayGap:1,requiredEveryEventTags:['no-procedural-highlight']},transfer:{minIndependentSuccesses:2,minDistinctTransferSurfaceIds:2}},
    'fact-family':{acquisition:{minIndependentSuccesses:4,minDistinctFactIdentities:4,minConcreteRepresentationSuccesses:2,concreteRepresentationFamilies:['groups','arrays','story']},retrieval:{minLaterSessionSuccesses:2,minimumDayGap:1,minDistinctSessions:2,minDistinctFactIdentities:2},transfer:{minIndependentSuccesses:2,minDistinctContextFamilies:2,requiredTagsAcrossEvidence:['related-fact-derived']}}
  }
});

const DAY=/^\d{4}-\d{2}-\d{2}$/;
const asSet=items=>new Set(items.filter(value=>typeof value==='string'&&value.length));
const distinct=(events,key)=>asSet(events.map(event=>event[key])).size;
const tags=event=>new Set(event.evidenceTags);
const independent=event=>event.outcome==='correct'&&event.attemptKind==='independent-first-try';
const clone=value=>value===undefined?undefined:JSON.parse(JSON.stringify(value));

function deepFreeze(value){
  if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.freeze(value);for(const item of Object.values(value))deepFreeze(item)}
  return value;
}

function dayNumber(day){
  if(!DAY.test(day))return null;
  const [year,month,date]=day.split('-').map(Number),time=Date.UTC(year,month-1,date),parsed=new Date(time);
  return parsed.getUTCFullYear()===year&&parsed.getUTCMonth()===month-1&&parsed.getUTCDate()===date?Math.floor(time/86400000):null;
}

function issue(code,field,detail){return {code,field,detail}}

export function validateGrade2AEvidenceEvent(raw){
  const errors=[];
  if(!raw||typeof raw!=='object'||Array.isArray(raw))return {valid:false,errors:[issue('event-object-required',null,'Evidence must be an object.')],event:null};
  for(const field of GRADE_2A_MASTERY_RULES.eventSchema.required)if(!(field in raw))errors.push(issue('required-field-missing',field,`${field} is required.`));
  const textFields=['eventId','skillId','sessionId','representationId','representationFamily','contextId','contextFamily','sourceQuestionId'];
  for(const field of textFields)if(typeof raw[field]!=='string'||!raw[field].trim())errors.push(issue('nonempty-string-required',field,`${field} must be a non-empty string.`));
  if(raw.schemaVersion!==GRADE_2A_MASTERY_RULES.schemaVersion)errors.push(issue('schema-version-unsupported','schemaVersion',`Expected ${GRADE_2A_MASTERY_RULES.schemaVersion}.`));
  for(const [field,values] of Object.entries(GRADE_2A_MASTERY_RULES.eventSchema.enums))if(!values.includes(raw[field]))errors.push(issue('enum-value-invalid',field,`${field} must be one of ${values.join(', ')}.`));
  if(dayNumber(raw.localDay)===null)errors.push(issue('local-day-invalid','localDay','localDay must be a real YYYY-MM-DD date.'));
  if(!Array.isArray(raw.evidenceTags)||raw.evidenceTags.some(value=>typeof value!=='string'||!value))errors.push(issue('evidence-tags-invalid','evidenceTags','evidenceTags must be an array of non-empty strings.'));
  if(typeof raw.transferEvidence!=='boolean')errors.push(issue('boolean-required','transferEvidence','transferEvidence must be boolean.'));
  if(raw.schedulerId!==null&&typeof raw.schedulerId!=='string')errors.push(issue('nullable-string-required','schedulerId','schedulerId must be a string or null.'));
  for(const field of ['relationshipFamily','factIdentity','transferSurfaceId'])if(raw[field]!==undefined&&raw[field]!==null&&(typeof raw[field]!=='string'||!raw[field]))errors.push(issue('nullable-string-required',field,`${field} must be a non-empty string, null, or omitted.`));
  const elapsed=raw.elapsedDaysSinceAcquisition;
  if(elapsed!==null&&(!Number.isInteger(elapsed)||elapsed<0))errors.push(issue('elapsed-days-invalid','elapsedDaysSinceAcquisition','Elapsed days must be a nonnegative integer or null.'));
  if(raw.evidenceKind==='retrieval'&&elapsed===null)errors.push(issue('retrieval-elapsed-days-required','elapsedDaysSinceAcquisition','Retrieval evidence needs an explicit elapsed-day separation.'));
  if(raw.evidenceKind!=='retrieval'&&elapsed!==null)errors.push(issue('elapsed-days-retrieval-only','elapsedDaysSinceAcquisition','Only retrieval evidence carries elapsed-day separation.'));
  if(raw.evidenceKind==='retrieval'&&!['same-session','later-session'].includes(raw.revisitKind))errors.push(issue('retrieval-revisit-kind-invalid','revisitKind','Retrieval must be marked same-session or later-session.'));
  if(raw.evidenceKind!=='retrieval'&&raw.revisitKind!=='initial')errors.push(issue('nonretrieval-revisit-kind-invalid','revisitKind','Acquisition and transfer evidence use initial revisitKind.'));
  if(raw.revisitKind==='same-session'&&elapsed!==0)errors.push(issue('same-session-day-gap-invalid','elapsedDaysSinceAcquisition','Same-session retrieval must have zero elapsed days.'));
  if(raw.outcome==='miss'&&raw.attemptKind!=='miss')errors.push(issue('miss-attempt-kind-invalid','attemptKind','A miss must use attemptKind miss.'));
  if(raw.outcome==='correct'&&raw.attemptKind==='miss')errors.push(issue('correct-attempt-kind-invalid','attemptKind','A correct outcome cannot use attemptKind miss.'));
  if(raw.evidenceKind==='transfer'&&raw.transferEvidence!==true)errors.push(issue('transfer-flag-required','transferEvidence','Transfer events must explicitly carry transferEvidence true.'));
  if(raw.evidenceKind!=='transfer'&&raw.transferEvidence!==false)errors.push(issue('transfer-flag-kind-mismatch','transferEvidence','Non-transfer events must carry transferEvidence false.'));
  return {valid:errors.length===0,errors,event:errors.length?null:clone(raw)};
}

function uniqueSources(events){
  const ordered=[...events].sort((left,right)=>left.localDay.localeCompare(right.localDay)||left.sessionId.localeCompare(right.sessionId)||left.eventId.localeCompare(right.eventId));
  const seen=new Set();return ordered.filter(event=>{if(seen.has(event.sourceQuestionId))return false;seen.add(event.sourceQuestionId);return true});
}

function missing(list,dimension,code,required,observed){if(observed<required)list.push({dimension,code,required,observed})}
function missingTags(list,dimension,required,events){
  const observed=asSet(events.flatMap(event=>event.evidenceTags));for(const tag of required||[])if(!observed.has(tag))list.push({dimension,code:`${dimension}-tag-${tag}`,required:tag,observed:false});
}
function everyTags(events,required=[]){return required.length?events.filter(event=>required.every(tag=>tags(event).has(tag))):events}

function evaluateAcquisition(events,rule,missingEvidence){
  const eligible=everyTags(events,rule.requiredEveryEventTags),dimension='acquisition';
  missing(missingEvidence,dimension,'acquisition-independent-successes',rule.minIndependentSuccesses||0,eligible.length);
  missing(missingEvidence,dimension,'acquisition-distinct-representations',rule.minDistinctRepresentationFamilies||0,distinct(eligible,'representationFamily'));
  missing(missingEvidence,dimension,'acquisition-distinct-relationships',rule.minDistinctRelationshipFamilies||0,distinct(eligible,'relationshipFamily'));
  missing(missingEvidence,dimension,'acquisition-distinct-facts',rule.minDistinctFactIdentities||0,distinct(eligible,'factIdentity'));
  const concrete=(rule.concreteRepresentationFamilies||[]).length?eligible.filter(event=>rule.concreteRepresentationFamilies.includes(event.representationFamily)).length:0;
  missing(missingEvidence,dimension,'acquisition-concrete-representations',rule.minConcreteRepresentationSuccesses||0,concrete);
  missingTags(missingEvidence,dimension,rule.requiredTagsAcrossEvidence,eligible);
  return {eligible,met:!missingEvidence.some(item=>item.dimension===dimension)};
}

function classifyRetrieval(events,acquisitionEvents,rule,invalidReasons){
  if(!acquisitionEvents.length)return {eligible:[],sameSession:[],sameDayLaterSession:[],nextSession:[],later:[],laterSession:[]};
  const anchorDay=Math.min(...acquisitionEvents.map(event=>dayNumber(event.localDay))),acquisitionSessions=asSet(acquisitionEvents.map(event=>event.sessionId));
  const verified=[];
  for(const event of events){
    const calculated=dayNumber(event.localDay)-anchorDay;
    if(calculated!==event.elapsedDaysSinceAcquisition){invalidReasons.push({eventId:event.eventId,code:'retrieval-day-gap-mismatch',declared:event.elapsedDaysSinceAcquisition,calculated});continue}
    if(event.revisitKind==='later-session'&&acquisitionSessions.has(event.sessionId)){invalidReasons.push({eventId:event.eventId,code:'later-session-reuses-acquisition-session'});continue}
    verified.push(event);
  }
  const eligible=everyTags(verified,rule.requiredEveryEventTags),gap=rule.laterDayGap||GRADE_2A_MASTERY_RULES.policy.laterRetrievalDayGap;
  return {
    eligible,
    sameSession:eligible.filter(event=>event.revisitKind==='same-session'),
    sameDayLaterSession:eligible.filter(event=>event.revisitKind==='later-session'&&event.elapsedDaysSinceAcquisition===0),
    nextSession:eligible.filter(event=>event.revisitKind==='later-session'&&event.elapsedDaysSinceAcquisition>=GRADE_2A_MASTERY_RULES.policy.nextSessionMinimumDayGap&&event.elapsedDaysSinceAcquisition<gap),
    later:eligible.filter(event=>event.revisitKind==='later-session'&&event.elapsedDaysSinceAcquisition>=gap),
    laterSession:eligible.filter(event=>event.revisitKind==='later-session'&&event.elapsedDaysSinceAcquisition>=(rule.minimumDayGap||GRADE_2A_MASTERY_RULES.policy.nextSessionMinimumDayGap))
  };
}

function evaluateRetrieval(classified,rule,missingEvidence){
  const dimension='retrieval',later=classified.laterSession;
  missing(missingEvidence,dimension,'retrieval-next-session',rule.minNextSessionSuccesses||0,classified.nextSession.length);
  missing(missingEvidence,dimension,'retrieval-later-day-gap',rule.minLaterSuccesses||0,classified.later.length);
  missing(missingEvidence,dimension,'retrieval-later-session',rule.minLaterSessionSuccesses||0,later.length);
  missing(missingEvidence,dimension,'retrieval-distinct-sessions',rule.minDistinctSessions||0,distinct(later,'sessionId'));
  missing(missingEvidence,dimension,'retrieval-distinct-facts',rule.minDistinctFactIdentities||0,distinct(later,'factIdentity'));
  return !missingEvidence.some(item=>item.dimension===dimension);
}

function evaluateTransfer(events,rule,missingEvidence){
  const dimension='transfer',notExcluded=events.filter(event=>!(rule.excludedContextFamilies||[]).includes(event.contextFamily)),eligible=everyTags(notExcluded,rule.requiredEveryEventTags);
  missing(missingEvidence,dimension,'transfer-independent-successes',rule.minIndependentSuccesses||0,eligible.length);
  missing(missingEvidence,dimension,'transfer-distinct-representations',rule.minDistinctRepresentationFamilies||0,distinct(eligible,'representationFamily'));
  missing(missingEvidence,dimension,'transfer-distinct-contexts',rule.minDistinctContextFamilies||0,distinct(eligible,'contextFamily'));
  missing(missingEvidence,dimension,'transfer-distinct-surfaces',rule.minDistinctSurfaceSignatures||0,asSet(eligible.map(event=>`${event.contextFamily}::${event.representationFamily}`)).size);
  missing(missingEvidence,dimension,'transfer-distinct-transfer-surfaces',rule.minDistinctTransferSurfaceIds||0,distinct(eligible,'transferSurfaceId'));
  missingTags(missingEvidence,dimension,rule.requiredTagsAcrossEvidence,eligible);
  return {eligible,met:!missingEvidence.some(item=>item.dimension===dimension)};
}

export function evaluateGrade2AMastery({skillId,profileId,events=[],legacyEvidence=null}={}){
  const rule=GRADE_2A_MASTERY_RULES.profiles[profileId];
  if(typeof skillId!=='string'||!skillId)throw new TypeError('skillId is required.');
  if(!rule)throw new RangeError(`Unknown Grade 2A mastery profile: ${profileId}`);
  const input=Array.isArray(events)?events:[],invalidEvents=[],deduplicatedEvents=[];const seenEventIds=new Set();let duplicateEvents=0;
  for(const raw of input){
    const checked=validateGrade2AEvidenceEvent(raw);if(!checked.valid){invalidEvents.push({eventId:raw?.eventId||null,errors:checked.errors});continue}
    if(checked.event.skillId!==skillId)continue;
    if(seenEventIds.has(checked.event.eventId)){duplicateEvents++;continue}seenEventIds.add(checked.event.eventId);deduplicatedEvents.push(checked.event);
  }
  const correctIndependent=deduplicatedEvents.filter(independent),acquisition=uniqueSources(correctIndependent.filter(event=>event.evidenceKind==='acquisition'));
  const retrieval=uniqueSources(correctIndependent.filter(event=>event.evidenceKind==='retrieval')),transfer=uniqueSources(correctIndependent.filter(event=>event.evidenceKind==='transfer'&&event.transferEvidence));
  const missingEvidence=[],retrievalInvalid=[];
  const acquisitionResult=evaluateAcquisition(acquisition,rule.acquisition,missingEvidence);
  const retrievalClasses=classifyRetrieval(retrieval,acquisition,rule.retrieval,retrievalInvalid),retrievalMet=evaluateRetrieval(retrievalClasses,rule.retrieval,missingEvidence);
  const transferResult=evaluateTransfer(transfer,rule.transfer,missingEvidence),acquisitionMet=acquisitionResult.met,transferMet=transferResult.met,masteryMet=acquisitionMet&&retrievalMet&&transferMet;
  const granularEvidencePresent=deduplicatedEvents.length>0,legacyEvidencePresent=legacyEvidence!==null&&legacyEvidence!==undefined;
  if(!granularEvidencePresent)missingEvidence.unshift({dimension:'contract',code:legacyEvidencePresent?'legacy-aggregate-insufficient':'granular-evidence-required',required:'validated event-level evidence',observed:legacyEvidencePresent?'aggregate counters only':'none'});
  let progressStage='building';if(acquisitionMet)progressStage='acquisition';if(acquisitionMet&&retrievalMet)progressStage='retrieval';if(acquisitionMet&&retrievalMet&&transferResult.eligible.length>0&&!masteryMet)progressStage='transfer';if(masteryMet)progressStage='mastery';
  return {
    skillId,profileId,progressStage,acquisitionMet,retrievalMet,transferMet,masteryMet,
    insufficientEvidence:!granularEvidencePresent,missingEvidence,
    supportingEvidence:{
      counts:{inputEvents:input.length,validSkillEvents:deduplicatedEvents.length,invalidEvents:invalidEvents.length,duplicateEvents,misses:deduplicatedEvents.filter(event=>event.outcome==='miss').length,hintedOrRecoveredSuccesses:deduplicatedEvents.filter(event=>event.outcome==='correct'&&!independent(event)).length,independentSuccesses:correctIndependent.length,acquisitionIndependentSuccesses:acquisitionResult.eligible.length,retrievalIndependentSuccesses:retrievalClasses.eligible.length,sameSessionRetrievals:retrievalClasses.sameSession.length,sameDayLaterSessionRetrievals:retrievalClasses.sameDayLaterSession.length,nextSessionRetrievals:retrievalClasses.nextSession.length,laterRetrievals:retrievalClasses.later.length,transferIndependentSuccesses:transferResult.eligible.length},
      distinct:{acquisitionRepresentations:distinct(acquisitionResult.eligible,'representationFamily'),acquisitionRelationships:distinct(acquisitionResult.eligible,'relationshipFamily'),acquisitionFacts:distinct(acquisitionResult.eligible,'factIdentity'),retrievalSessions:distinct(retrievalClasses.laterSession,'sessionId'),retrievalFacts:distinct(retrievalClasses.laterSession,'factIdentity'),transferRepresentations:distinct(transferResult.eligible,'representationFamily'),transferContexts:distinct(transferResult.eligible,'contextFamily'),transferSurfaces:asSet(transferResult.eligible.map(event=>event.transferSurfaceId||`${event.contextFamily}::${event.representationFamily}`)).size},
      invalidEvents,retrievalInvalid,legacyAggregateIgnored:legacyEvidencePresent
    }
  };
}

export function evaluateGrade2ASkillMastery(skill,events,options={}){
  if(!skill?.id||!skill?.pedagogy?.masteryProfile)throw new TypeError('A skill-graph node with id and pedagogy.masteryProfile is required.');
  return evaluateGrade2AMastery({skillId:skill.id,profileId:skill.pedagogy.masteryProfile,events,legacyEvidence:options.legacyEvidence});
}

export function adaptLanternEventToGrade2AEvidence(legacyEvent,metadata={}){
  const source=clone(legacyEvent)||{},representationFamily=String(metadata.representationFamily||source.representation||'unknown');
  const outcome=source.completed===false?'miss':'correct',attemptKind=outcome==='miss'?'miss':source.firstTry?'independent-first-try':source.recovered?'recovered':'hinted';
  const evidenceKind=metadata.evidenceKind||(source.purpose==='retrieval'?'retrieval':source.purpose==='transfer'?'transfer':'acquisition');
  const revisitKind=evidenceKind==='retrieval'?(metadata.revisitKind||(source.isMemoryReview?'later-session':source.isReview?'same-session':'later-session')):'initial';
  const event={
    schemaVersion:GRADE_2A_MASTERY_RULES.schemaVersion,
    eventId:String(metadata.eventId||`${metadata.sessionId||'missing-session'}:${source.fingerprint||source.skillKey||'missing-source'}:${evidenceKind}`),
    skillId:String(source.skillKey||metadata.skillId||''),sessionId:String(metadata.sessionId||''),localDay:String(metadata.localDay||''),outcome,attemptKind,evidenceKind,revisitKind,
    elapsedDaysSinceAcquisition:evidenceKind==='retrieval'?(metadata.elapsedDaysSinceAcquisition??null):null,
    representationId:String(metadata.representationId||`${representationFamily}:${source.fingerprint||'unknown'}`),representationFamily,
    contextId:String(metadata.contextId||`world.lantern-harbor:${representationFamily}`),contextFamily:String(metadata.contextFamily||'lantern-harbor'),
    sourceQuestionId:String(metadata.sourceQuestionId||source.fingerprint||''),schedulerId:metadata.schedulerId??null,
    transferEvidence:evidenceKind==='transfer'&&metadata.transferEvidence===true,evidenceTags:Array.isArray(metadata.evidenceTags)?[...metadata.evidenceTags]:[],
    relationshipFamily:metadata.relationshipFamily??null,factIdentity:metadata.factIdentity??null,transferSurfaceId:metadata.transferSurfaceId??null
  };
  const validation=validateGrade2AEvidenceEvent(event);return {event,valid:validation.valid,errors:validation.errors};
}
