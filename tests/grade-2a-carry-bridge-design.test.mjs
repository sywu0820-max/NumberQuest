import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const readJson=async path=>JSON.parse(await readFile(new URL(path,import.meta.url),'utf8'));
const [contract,graph,mastery,ledger]=await Promise.all([
  readJson('../curriculum/grade-2a.carry-bridge-design.json'),
  readJson('../curriculum/grade-2a.skill-graph.json'),
  readJson('../curriculum/grade-2a.mastery-rules.json'),
  readJson('../curriculum/grade-2a.evidence-ledger.json')
]);

const graphSkills=new Map(graph.skills.map(skill=>[skill.id,skill]));
const graphWorld=graph.worlds.find(world=>world.id==='world.carry-bridge');
const missions=new Map(contract.missionFamilies.map(mission=>[mission.id,mission]));
const representations=contract.controlledVocabulary.representations;
const contexts=contract.controlledVocabulary.contexts;
const transfers=new Map(contract.transferCandidates.map(candidate=>[candidate.id,candidate]));

test('交換橋工坊 remains an exact-head design-only contract',()=>{
  assert.equal(contract.schemaVersion,'1.0.0');
  assert.equal(contract.worldId,'world.carry-bridge');
  assert.equal(contract.status,'design-only-review-contract');
  assert.equal(contract.runtimeApproved,false);
  assert.equal(contract.runtimeIntegration,false);
  assert.equal(contract.sourceContracts.acceptedBaseHead,'1156bc9f992d6148dae17f15ce243abc1579c354');
  assert.equal(contract.productBoundary.childFacingRuntimeIncluded,false);
  assert.equal(contract.productBoundary.questionBankIncluded,false);
  assert.equal(contract.productBoundary.changesExistingWorlds,false);
  assert.equal(contract.productBoundary.changesProgressionOrRewards,false);
  assert.equal(contract.evidenceDesign.runtimeEmissionApproved,false);
});

test('skill ownership, prerequisites, and completion boundary exactly match the accepted graph',()=>{
  assert.ok(graphWorld);
  assert.deepEqual(contract.ownership.skillIds,graphWorld.skillIds);
  assert.deepEqual(contract.ownership.requiredForCompletionSkillIds,graphWorld.requiredForCompletionSkillIds);
  assert.deepEqual(contract.ownership.eligibilityBranchSkillIds,graphWorld.eligibilityBranchSkillIds);
  for(const skillId of contract.ownership.skillIds){
    assert.ok(graphSkills.has(skillId));
    assert.deepEqual(contract.ownership.skillPrerequisites[skillId],graphSkills.get(skillId).prerequisites,skillId);
  }
  assert.equal(contract.completionBoundary.allOwnedSkillsAreCommonRequirements,true);
  assert.deepEqual(contract.completionBoundary.optionalSkillIds,[]);
  assert.equal(contract.completionBoundary.worldCompletionIsFormalMastery,false);
  assert.equal(contract.completionBoundary.missionVolumeAloneCanComplete,false);
  assert.equal(contract.completionBoundary.transferCandidatesCanComplete,false);
  assert.equal(contract.completionBoundary.runtimeCompletionRuleApproved,false);
});

test('arithmetic and exchange bounds preserve the engineering contract',()=>{
  assert.equal(contract.arithmeticBounds.additionMaximum,100);
  assert.equal(contract.arithmeticBounds.subtractionMinimum,0);
  assert.equal(contract.arithmeticBounds.maximumRequiredExchangesPerCase,1);
  for(const [id,rule] of Object.entries(contract.caseRules)){
    assert.ok(graphSkills.has(rule.skillId),id);
    assert.equal(rule.operandCount,2,id);
    assert.ok(rule.operandMinimum>=10,id);
    if(id.startsWith('add-')) assert.ok(rule.resultMaximum<=100,id);
    if(id.startsWith('sub-')) assert.ok(rule.resultMinimum>=0,id);
  }
  assert.equal(contract.caseRules['add-no-regroup'].requiredExchange,'none');
  assert.equal(contract.caseRules['sub-no-regroup'].requiredExchange,'none');
  assert.equal(contract.caseRules['add-regroup'].requiredExchange,'ones-to-tens');
  assert.equal(contract.caseRules['sub-regroup'].requiredExchange,'tens-to-ones');
  assert.equal(contract.caseRules['add-regroup'].resultMaximum,99,'exact 100 must not hide a second tens-to-hundred exchange');
});

test('calculation evidence tags exactly preserve the accepted skill-aware requirements',()=>{
  const calculationSkills=contract.ownership.skillIds.filter(id=>graphSkills.get(id).pedagogy.masteryProfile==='calculation');
  for(const skillId of calculationSkills){
    const row=contract.evidenceDesign.skillMatrix[skillId];
    const accepted=mastery.skillRequirements[skillId];
    const rule=contract.caseRules[row.acquisitionCaseRuleId];
    assert.equal(row.profileId,'calculation',skillId);
    assert.equal(rule.skillId,skillId);
    assert.deepEqual(row.requiredTagsAcrossAcquisition,accepted.acquisition.requiredTagsAcrossEvidence,skillId);
    const offered=new Set([...rule.evidenceTagsWhenCaseAndTraceEligible,...Object.keys(rule.conditionalEvidenceTags)]);
    for(const tag of row.requiredTagsAcrossAcquisition) assert.ok(offered.has(tag),`${skillId} cannot emit ${tag}`);
    if(skillId.includes('.no-regroup-')){
      assert.ok(rule.evidenceTagsWhenCaseAndTraceEligible.includes('no-regroup'));
      assert.ok(rule.evidenceTagsWhenCaseAndTraceEligible.includes('observed-zero-exchange'));
      assert.equal(rule.requiredExchange,'none');
    }else{
      assert.ok(rule.evidenceTagsWhenCaseAndTraceEligible.includes('regrouping-sensitive'));
      assert.ok(rule.evidenceTagsWhenCaseAndTraceEligible.includes('observed-value-preserving-exchange'));
      assert.notEqual(rule.requiredExchange,'none');
    }
  }
});

test('calculation evidence is behavior-sensitive rather than inferred from generator case class',()=>{
  const policy=contract.evidenceTaggingPolicy;
  assert.equal(policy.derivedFromBothCasePredicatesAndObservedActionTrace,true);
  assert.equal(policy.generatorCaseClassAloneIsSufficient,false);
  assert.equal(policy.exchangeActionsAreObservedNotInferred,true);
  assert.equal(policy.rawGestureCoordinatesStored,false);
  assert.equal(policy.actionTraceRetention,'ephemeral-until-outcome-classification');
  assert.equal(policy.noRegroupRequiresZeroObservedExchangeActions,true);
  assert.equal(policy.regroupRequiresExactObservedDirectionAndCount,true);
  assert.equal(policy.invalidOrMismatchedTraceCanEmitIndependentAcquisition,false);

  for(const id of ['add-no-regroup','sub-no-regroup']){
    const eligibility=contract.caseRules[id].evidenceEligibility;
    assert.equal(eligibility.requiresSuccessfulSolution,true,id);
    assert.equal(eligibility.requiresAllCasePredicates,true,id);
    assert.equal(eligibility.observedActionTrace.exchangeActionCount,0,id);
    assert.equal(eligibility.observedActionTrace.unexpectedExchangeActionCount,0,id);
  }
  const addTrace=contract.caseRules['add-regroup'].evidenceEligibility.observedActionTrace;
  assert.deepEqual(
    {count:addTrace.exchangeActionCount,direction:addTrace.exchangeDirection,input:[addTrace.inputUnit,addTrace.inputUnitCount],output:[addTrace.outputUnit,addTrace.outputUnitCount],extra:addTrace.unexpectedExchangeActionCount,preserves:addTrace.valueBeforeEqualsValueAfter},
    {count:1,direction:'ones-to-tens',input:['one',10],output:['ten',1],extra:0,preserves:true}
  );
  const subTrace=contract.caseRules['sub-regroup'].evidenceEligibility.observedActionTrace;
  assert.deepEqual(
    {count:subTrace.exchangeActionCount,direction:subTrace.exchangeDirection,input:[subTrace.inputUnit,subTrace.inputUnitCount],output:[subTrace.outputUnit,subTrace.outputUnitCount],extra:subTrace.unexpectedExchangeActionCount,preserves:subTrace.valueBeforeEqualsValueAfter},
    {count:1,direction:'tens-to-ones',input:['ten',1],output:['one',10],extra:0,preserves:true}
  );

  const unnecessary=policy.unnecessaryExchangeInNoRegroupCase;
  assert.equal(unnecessary.policy,'neutral-reject-and-return-control');
  assert.equal(unnecessary.missionCompletes,false);
  assert.equal(unnecessary.progressOrRewardPenalty,false);
  assert.equal(unnecessary.completedCanonicalOutcomeEventEmitted,false);
  assert.equal(unnecessary.independentAcquisitionEvidenceEmitted,false);
  assert.equal(unnecessary.noRegroupTagEmitted,false);

  const boundedTags=new Set([
    ...contract.controlledVocabulary.evidenceTags.acceptedMasteryTags,
    ...contract.controlledVocabulary.evidenceTags.proposedObservedTraceTags
  ]);
  for(const rule of Object.values(contract.caseRules)){
    for(const tag of rule.evidenceTagsWhenCaseAndTraceEligible) assert.ok(boundedTags.has(tag),tag);
    for(const tag of Object.keys(rule.conditionalEvidenceTags)) assert.ok(boundedTags.has(tag),tag);
  }
});

test('mission families make direct mathematical manipulation the gameplay action',()=>{
  assert.ok(contract.childActionModel.verbs.includes('exchange'));
  assert.equal(contract.productBoundary.mathActionIsGameplayAction,true);
  assert.equal(contract.childActionModel.forbiddenLoop,'solve-symbolic-equation-then-watch-bridge-animation');
  const owned=new Set();
  for(const mission of contract.missionFamilies){
    assert.match(mission.id,/^carry-[a-z0-9-]+$/);
    assert.ok(mission.childFacingVerbs.length>0,mission.id);
    assert.ok(mission.mathAction.length>40,mission.id);
    assert.deepEqual(mission.allowedEvidenceKinds,['acquisition','retrieval'],mission.id);
    assert.ok(mission.answerLeakGuards.length>=3,mission.id);
    assert.equal(mission.freshRetryPolicyId.startsWith('fresh-'),true,mission.id);
    mission.ownedSkillIds.forEach(id=>owned.add(id));
  }
  assert.deepEqual(owned,new Set(contract.ownership.skillIds));
});

test('neutral entry surfaces do not announce regrouping before the child inspects quantities',()=>{
  for(const id of ['carry-join-loads','carry-repair-by-unloading']){
    const mission=missions.get(id);
    assert.equal(mission.presentationRevealsExchangeClass,false,id);
    assert.equal(mission.caseRuleIds.length,2,id);
    assert.ok(mission.answerLeakGuards.includes('exchange-control-does-not-signal-whether-exchange-is-needed'),id);
  }
  assert.ok(contract.antiShortcutInvariants.includes('regrouping-requirement-is-derived-from-quantities-not-announced-by-layout'));
  assert.ok(contract.antiShortcutInvariants.includes('no-regroup-and-regroup-cases-share-the-same-neutral-entry-presentation'));
});

test('misconception hints are answer-safe and every retry has fresh identity',()=>{
  const response=contract.misconceptionResponse;
  const expected=new Set(['add-align','add-carry-value','sub-direction','sub-borrow-value']);
  assert.deepEqual(new Set(Object.keys(response.misconceptions)),expected);
  for(const [id,item] of Object.entries(response.misconceptions)){
    assert.ok(item.observableSignal.length>30,id);
    assert.ok(item.hintSequenceIds.length>0,id);
    for(const hintId of item.hintSequenceIds){
      const steps=response.hintSequences[hintId];
      assert.ok(steps?.some(step=>step.includes('return-control')),`${id}/${hintId} does not return control`);
    }
    const retry=response.freshRetryPolicies[item.freshRetryPolicyId];
    assert.equal(retry.newOperandPair,true,id);
    assert.equal(retry.preserveSkillId,true,id);
    assert.equal(retry.sourceQuestionIdMustChange,true,id);
    assert.equal(retry.answerStateReset,true,id);
    assert.equal(retry.hintedOrRecoveredCountsAsIndependent,false,id);
  }
});

test('proposed ledger vocabulary is bounded and compatible without changing the accepted runtime ledger',()=>{
  assert.equal(contract.controlledVocabulary.ledgerExtensionStatus,'proposed-not-runtime-approved');
  const ledgerFields=new Set([...ledger.recordSchema.required,...ledger.recordSchema.nullable]);
  for(const field of contract.controlledVocabulary.ledgerFieldMapping) assert.ok(ledgerFields.has(field),field);
  for(const mission of contract.missionFamilies){
    for(const id of mission.representationIds) assert.ok(representations[id],`${mission.id} unknown representation ${id}`);
    for(const id of mission.contextIds) assert.ok(contexts[id],`${mission.id} unknown context ${id}`);
  }
  assert.equal(ledger.worlds['world.carry-bridge'],undefined,'accepted runtime ledger was silently extended');
  assert.equal(contract.evidenceDesign.runtimeEmissionApproved,false);
});

test('the explanation skill has two genuinely different mathematical representation families',()=>{
  const row=contract.evidenceDesign.skillMatrix['g2a.addsub.explain-vertical'];
  assert.equal(row.profileId,'concept');
  assert.deepEqual(new Set(row.requiredRepresentationFamilies),new Set(['base-ten-manipulatives','vertical-notation']));
  const primaryIds=row.acquisitionMissionFamilyIds.map(id=>missions.get(id).primaryEvidenceRepresentationId);
  const families=primaryIds.map(id=>representations[id].family);
  const models=primaryIds.map(id=>representations[id].mathematicalModel);
  assert.equal(new Set(families).size,2);
  assert.equal(new Set(models).size,2);
  assert.ok(primaryIds.every(id=>representations[id].cosmeticVariant===false));
});

test('transfer surfaces are candidates only and remain distinct from acquisition contexts',()=>{
  const acquisitionContexts=new Set(contract.missionFamilies.flatMap(mission=>mission.contextIds));
  for(const candidate of contract.transferCandidates){
    assert.equal(candidate.designOnly,true,candidate.id);
    assert.equal(candidate.runtimeApproved,false,candidate.id);
    assert.equal(candidate.evidenceEmissionApproved,false,candidate.id);
    assert.equal(contexts[candidate.contextId].phase,'transfer-candidate',candidate.id);
    assert.ok(!acquisitionContexts.has(candidate.contextId),candidate.id);
    assert.ok(candidate.mathematicalDifference.length>50,candidate.id);
    assert.ok(candidate.reviewRisk.length>20,candidate.id);
  }
  for(const [skillId,row] of Object.entries(contract.evidenceDesign.skillMatrix)){
    assert.equal(row.transferCandidateIds.length,2,skillId);
    const candidates=row.transferCandidateIds.map(id=>transfers.get(id));
    assert.ok(candidates.every(candidate=>candidate?.eligibleSkillIds.includes(skillId)),skillId);
    const signatures=candidates.map(candidate=>`${representations[candidate.representationId].family}:${contexts[candidate.contextId].family}:${candidate.transferSurfaceId}`);
    assert.equal(new Set(signatures).size,2,skillId);
  }
});

test('retrieval identity and time separation preserve the accepted evaluator guards',()=>{
  const retrieval=contract.evidenceDesign.retrieval;
  assert.equal(retrieval.freshSourceQuestionRequired,mastery.policy.freshReviewSourceRequired);
  assert.equal(retrieval.schedulerLineageSeparateFromSourceIdentity,true);
  assert.equal(retrieval.sameSessionDoesNotCountAsLaterSession,true);
  assert.equal(retrieval.nextSessionMinimumDayGap,mastery.policy.nextSessionMinimumDayGap);
  assert.equal(retrieval.laterDayGap,mastery.policy.laterRetrievalDayGap);
});

test('accessibility protects Grade-2 touch, reading, motor, motion, and timing needs',()=>{
  const a=contract.accessibilityAndInteraction;
  assert.ok(a.minimumTouchTargetCssPixels>=44);
  assert.equal(a.dragOnlyInteractionForbidden,true);
  assert.equal(a.tapSelectThenPlaceAlternativeRequired,true);
  assert.equal(a.keyboardAndPointerOperable,true);
  assert.equal(a.colorAsSoleSignalForbidden,true);
  assert.equal(a.textOnlyInstructionForbidden,true);
  assert.equal(a.timedInputRequired,false);
  assert.equal(a.speedIsEvidence,false);
  assert.equal(a.reducedMotionAlternativeRequired,true);
  assert.equal(a.mistakesRemoveProgressOrRewards,false);
  assert.deepEqual(new Set(a.firstClassTargets),new Set(['iPad Safari','Surface Pro Edge']));
});

test('future deterministic and browser tests explicitly attack fixed UI shortcuts',()=>{
  const validation=new Map(contract.proposedValidation.map(item=>[item.id,item]));
  for(const id of ['carry-generator-arithmetic-stress','carry-fixed-trace-replay','carry-exchange-gate-fuzz','carry-behavior-sensitive-evidence','carry-hint-retry-identity','carry-real-browser-shortcut-matrix','carry-real-browser-miss-repair-review','carry-blueprint-semantic-roundtrip']) assert.ok(validation.has(id),id);
  assert.equal(validation.get('carry-generator-arithmetic-stress').minimumCasesPerCaseRule,1200);
  assert.equal(validation.get('carry-fixed-trace-replay').minimumCasesPerMissionFamily,400);
  assert.ok(validation.get('carry-fixed-trace-replay').assertions.includes('replaying-one-fixed-action-trace-does-not-solve-varied-cases'));
  assert.ok(validation.get('carry-exchange-gate-fuzz').assertions.includes('unnecessary-exchange-in-sub-no-regroup-cannot-emit-independent-no-regroup-evidence'));
  assert.ok(validation.get('carry-behavior-sensitive-evidence').assertions.includes('case-class-alone-cannot-emit-acquisition-tags'));
  assert.ok(validation.get('carry-behavior-sensitive-evidence').assertions.includes('no-regroup-requires-zero-observed-exchanges'));
  assert.ok(validation.get('carry-behavior-sensitive-evidence').assertions.includes('regroup-requires-exactly-one-correct-direction-exchange'));
  assert.ok(validation.get('carry-real-browser-shortcut-matrix').targets.includes('iPad Safari portrait'));
  assert.ok(validation.get('carry-real-browser-shortcut-matrix').targets.includes('Surface Pro Edge'));
  assert.ok(validation.get('carry-real-browser-shortcut-matrix').assertions.includes('unnecessary-no-regroup-exchange-returns-control-without-evidence-or-penalty'));
  assert.ok(contract.antiShortcutInvariants.includes('a-fixed-tap-or-drag-trace-cannot-solve-varied-generated-cases'));
  assert.ok(contract.antiWorksheetInvariants.includes('no-answer-selection-followed-by-unrelated-reward-animation'));
});

test('unresolved product judgments stay explicit and block runtime or transfer approval',()=>{
  assert.ok(contract.unresolvedQuestions.length>=5);
  for(const item of contract.unresolvedQuestions){
    assert.match(item.id,/^carry-uq-/);
    assert.ok(item.question.endsWith('?'));
    assert.ok(item.blockingFor.length>0);
  }
  assert.ok(contract.unresolvedQuestions.some(item=>item.blockingFor.includes('runtime-interaction-approval')));
  assert.ok(contract.unresolvedQuestions.some(item=>item.blockingFor.includes('calculation-transfer-approval')));
  assert.ok(contract.unresolvedQuestions.some(item=>item.blockingFor.includes('runtime-completion-contract')));
  assert.ok(contract.unresolvedQuestions.some(item=>item.blockingFor.includes('exact-100-coverage')));
});
