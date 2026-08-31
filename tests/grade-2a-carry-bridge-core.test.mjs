import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {
  CARRY_BRIDGE_CASE_RULES,CARRY_BRIDGE_REPRESENTATIONS,CARRY_BRIDGE_SKILLS,CARRY_BRIDGE_WORLD_ID,
  applyCarryBridgeAction,bundleModelToVerticalBlueprint,carryBridgeBundleModel,carryBridgeCaseRuleIds,
  carryBridgeHint,carryBridgeMisconceptionSignals,classifyCarryBridgeAcquisition,createCarryBridgeActionState,
  freshCarryBridgeRetry,makeCarryBridgeCase,replayCarryBridgeActions,solveCarryBridgeCase,validateCarryBridgeCase,
  verticalBlueprintToBundleModel
} from '../src/grade-2a-carry-bridge-core.mjs';

const design=JSON.parse(await readFile(new URL('../curriculum/grade-2a.carry-bridge-design.json',import.meta.url),'utf8'));
const seeded=seed=>()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296);
const rules=carryBridgeCaseRuleIds();
const generated=(ruleId,seed)=>makeCarryBridgeCase(ruleId,{rng:seeded(seed),sourceNonce:seed});
const classify=(problem,state,overrides={})=>classifyCarryBridgeAcquisition(problem,{outcome:'correct',attemptKind:'independent-first-try',actionTrace:state.actionTrace,...overrides});

test('headless core owns exactly the accepted design scope without runtime integration',()=>{
  assert.equal(CARRY_BRIDGE_WORLD_ID,design.worldId);
  assert.deepEqual(CARRY_BRIDGE_SKILLS,design.ownership.skillIds);
  assert.deepEqual(new Set(rules),new Set(Object.keys(design.caseRules)));
  for(const ruleId of rules){
    const runtime=CARRY_BRIDGE_CASE_RULES[ruleId],accepted=design.caseRules[ruleId];
    assert.equal(runtime.skillId,accepted.skillId,ruleId);
    assert.equal(runtime.expectedExchange,accepted.requiredExchange==='none'?null:accepted.requiredExchange,ruleId);
    for(const tag of runtime.caseTags)assert.ok(accepted.evidenceTagsWhenCaseAndTraceEligible.includes(tag),`${ruleId}/${tag}`);
  }
  assert.deepEqual(CARRY_BRIDGE_REPRESENTATIONS.bundle,{representationId:'base-ten-workbench',representationFamily:'base-ten-manipulatives'});
  assert.deepEqual(CARRY_BRIDGE_REPRESENTATIONS.blueprint,{representationId:'vertical-place-value-blueprint',representationFamily:'vertical-notation'});
});

test('deterministic generator validates at least 1,200 cases per arithmetic rule',()=>{
  const boundarySeen=new Set();
  for(const ruleId of rules)for(let seed=1;seed<=1200;seed++){
    const problem=generated(ruleId,seed),validation=validateCarryBridgeCase(problem);
    assert.equal(validation.valid,true,`${ruleId}/${seed}: ${validation.errors}`);
    assert.ok(problem.left>=10&&problem.left<=99,`${ruleId}/${seed}`);
    assert.ok(problem.right>=10&&problem.right<=99,`${ruleId}/${seed}`);
    assert.ok(problem.answer>=0&&problem.answer<=99,`${ruleId}/${seed}`);
    assert.equal(problem.bounds.exact100Supported,false);
    assert.notEqual(problem.answer,100);
    assert.equal(problem.expectedExchange.count,ruleId.includes('no-regroup')?0:1);
    if(problem.boundary)boundarySeen.add(ruleId);
  }
  assert.deepEqual(boundarySeen,new Set(rules));
  for(const ruleId of rules)assert.deepEqual(generated(ruleId,77),generated(ruleId,77),ruleId);
});

test('generated metadata contains only recomputed objective predicates and rejects exact 100',()=>{
  for(const ruleId of rules){
    const problem=generated(ruleId,91);
    assert.equal(validateCarryBridgeCase({...problem,objectivePredicates:[...problem.objectivePredicates,'fabricated-tag']}).valid,false);
    assert.equal(validateCarryBridgeCase({...problem,answer:100,bounds:{...problem.bounds,exact100Supported:true}}).valid,false);
  }
});

test('canonical semantic solutions complete all four case rules without mutating their cases',()=>{
  for(const ruleId of rules)for(let seed=1;seed<=200;seed++){
    const problem=generated(ruleId,seed),before=JSON.stringify(problem),state=solveCarryBridgeCase(problem);
    assert.equal(JSON.stringify(problem),before,`${ruleId}/${seed}`);
    assert.equal(state.complete,true,`${ruleId}/${seed}`);
    assert.equal(state.numericCorrect,true,`${ruleId}/${seed}`);
    assert.equal(state.workspace.tens*10+state.workspace.ones,problem.answer,`${ruleId}/${seed}`);
  }
});

test('semantic reducers and classifiers are non-mutating and traces remain bound to their case identity',()=>{
  const problem=generated('add-no-regroup',8),state=createCarryBridgeActionState(problem),before=JSON.stringify(state),next=applyCarryBridgeAction(state,{type:'join'});
  assert.equal(JSON.stringify(state),before);assert.notEqual(next,state);assert.equal(next.actionTrace.at(-1).sourceQuestionId,problem.sourceQuestionId);assert.equal(next.actionTrace.at(-1).caseRuleId,problem.caseRuleId);
  const solved=solveCarryBridgeCase(problem),traceBefore=JSON.stringify(solved.actionTrace);classify(problem,solved);assert.equal(JSON.stringify(solved.actionTrace),traceBefore);
  assert.equal(classifyCarryBridgeAcquisition(problem,{outcome:'correct',attemptKind:'independent-first-try',actionTrace:[]}).independentAcquisitionEligible,false);
  const other=generated('add-no-regroup',9),foreign=solveCarryBridgeCase(other).actionTrace,classification=classifyCarryBridgeAcquisition(problem,{outcome:'correct',attemptKind:'independent-first-try',actionTrace:foreign});
  assert.equal(classification.independentAcquisitionEligible,false);assert.ok(classification.reasons.includes('trace-source-identity-mismatch'));
});

test('10 ones to 1 ten and 1 ten to 10 ones preserve value exactly',()=>{
  const add=generated('add-regroup',12);let addState=createCarryBridgeActionState(add);addState=applyCarryBridgeAction(addState,{type:'join'});
  const addBefore=addState.workspace.tens*10+addState.workspace.ones;addState=applyCarryBridgeAction(addState,{type:'bundle',count:10});
  assert.equal(addState.lastActionResult.accepted,true);assert.equal(addState.workspace.tens*10+addState.workspace.ones,addBefore);assert.equal(addState.actionTrace.at(-1).valuePreserved,true);

  const sub=generated('sub-regroup',13);let subState=createCarryBridgeActionState(sub);const subBefore=subState.workspace.tens*10+subState.workspace.ones;
  subState=applyCarryBridgeAction(subState,{type:'split',count:1});
  assert.equal(subState.lastActionResult.accepted,true);assert.equal(subState.workspace.tens*10+subState.workspace.ones,subBefore);assert.equal(subState.actionTrace.at(-1).valuePreserved,true);
});

test('exchange fuzz rejects 9 and 11 ones plus partial and wrong-direction pseudo-exchanges',()=>{
  for(let seed=1;seed<=400;seed++){
    const problem=generated('add-regroup',seed);let state=createCarryBridgeActionState(problem);state=applyCarryBridgeAction(state,{type:'join'});
    for(const count of [9,11]){
      const attempt=applyCarryBridgeAction(state,{type:'bundle',count});
      assert.equal(attempt.lastActionResult.accepted,false,`${seed}/${count}`);assert.equal(attempt.lastActionResult.neutral,true);assert.deepEqual(attempt.workspace,state.workspace);
    }
    const wrong=applyCarryBridgeAction(state,{type:'split',count:1});assert.equal(wrong.lastActionResult.code,'wrong-exchange-direction');assert.deepEqual(wrong.workspace,state.workspace);
  }
  for(let seed=1;seed<=400;seed++){
    const problem=generated('sub-regroup',seed),state=createCarryBridgeActionState(problem);
    for(const count of [0,2]){
      const attempt=applyCarryBridgeAction(state,{type:'split',count});
      assert.equal(attempt.lastActionResult.accepted,false,`${seed}/${count}`);assert.deepEqual(attempt.workspace,state.workspace);
    }
    const wrong=applyCarryBridgeAction(state,{type:'bundle',count:10});assert.equal(wrong.lastActionResult.code,'wrong-exchange-direction');assert.deepEqual(wrong.workspace,state.workspace);
  }
});

test('no-regroup plus zero exchanges is eligible while unnecessary exchange never inflates evidence',()=>{
  for(const ruleId of ['add-no-regroup','sub-no-regroup']){
    const problem=generated(ruleId,21),solved=solveCarryBridgeCase(problem),eligible=classify(problem,solved);
    assert.equal(eligible.independentAcquisitionEligible,true,ruleId);assert.ok(eligible.evidenceTags.includes('no-regroup'));assert.ok(eligible.evidenceTags.includes('observed-zero-exchange'));
  }
  for(let seed=1;seed<=400;seed++){
    const problem=generated('sub-no-regroup',seed);let state=createCarryBridgeActionState(problem);
    state=applyCarryBridgeAction(state,{type:'split',count:1});
    assert.equal(state.lastActionResult.code,'unnecessary-exchange',seed);assert.equal(state.lastActionResult.neutral,true,seed);assert.equal(state.complete,false,seed);
    const corrected=replayCarryBridgeActions(problem,[...state.actionTrace,...solveCarryBridgeCase(problem).actionTrace]);
    const evidence=classifyCarryBridgeAcquisition(problem,{outcome:'correct',attemptKind:'independent-first-try',actionTrace:corrected.actionTrace});
    assert.equal(evidence.independentAcquisitionEligible,false,seed);assert.equal(evidence.evidenceTags.includes('no-regroup'),false,seed);assert.ok(evidence.reasons.includes('no-regroup-requires-zero-exchanges'),seed);
  }
});

test('regroup evidence requires one exact observed exchange and final correctness cannot override an ineligible trace',()=>{
  for(const ruleId of ['add-regroup','sub-regroup']){
    const problem=generated(ruleId,32),solved=solveCarryBridgeCase(problem),eligible=classify(problem,solved);
    assert.equal(eligible.independentAcquisitionEligible,true,ruleId);assert.equal(eligible.traceSummary.exchangeAttemptCount,1,ruleId);

    const noExchange=classifyCarryBridgeAcquisition(problem,{outcome:'correct',attemptKind:'independent-first-try',actionTrace:[]});
    assert.equal(noExchange.independentAcquisitionEligible,false,`${ruleId}/none`);

    let wrong=createCarryBridgeActionState(problem);
    if(problem.operation==='add'){wrong=applyCarryBridgeAction(wrong,{type:'join'});wrong=applyCarryBridgeAction(wrong,{type:'split',count:1})}
    else wrong=applyCarryBridgeAction(wrong,{type:'bundle',count:10});
    const wrongThenCorrect=[...wrong.actionTrace,...solved.actionTrace];
    const wrongEvidence=classifyCarryBridgeAcquisition(problem,{outcome:'correct',attemptKind:'independent-first-try',actionTrace:wrongThenCorrect});
    assert.equal(wrongEvidence.independentAcquisitionEligible,false,`${ruleId}/wrong`);

    const correctExchange=solved.actionTrace.find(item=>item.type==='bundle'||item.type==='split');
    const extraEvidence=classifyCarryBridgeAcquisition(problem,{outcome:'correct',attemptKind:'independent-first-try',actionTrace:[correctExchange,correctExchange]});
    assert.equal(extraEvidence.independentAcquisitionEligible,false,`${ruleId}/extra`);
    assert.ok(extraEvidence.reasons.includes('exact-observed-exchange-required'));
    const forged={...correctExchange,valueAfter:Number(correctExchange.valueAfter)+1,valuePreserved:true};
    assert.equal(classifyCarryBridgeAcquisition(problem,{outcome:'correct',attemptKind:'independent-first-try',actionTrace:[forged]}).independentAcquisitionEligible,false,`${ruleId}/forged-value`);
  }
});

test('hinted, recovered, missed, and invalid cases cannot claim independent acquisition',()=>{
  const problem=generated('add-regroup',41),state=solveCarryBridgeCase(problem);
  for(const attemptKind of ['hinted','recovered','miss'])assert.equal(classify(problem,state,{attemptKind}).independentAcquisitionEligible,false,attemptKind);
  assert.equal(classify(problem,state,{outcome:'miss'}).independentAcquisitionEligible,false);
  assert.equal(classifyCarryBridgeAcquisition({...problem,answer:100},{outcome:'correct',attemptKind:'independent-first-try',actionTrace:state.actionTrace}).independentAcquisitionEligible,false);
});

test('bounded evidence tags are compatible candidates and the classifier never writes the ledger or claims mastery',()=>{
  const bounded=new Set([...design.controlledVocabulary.evidenceTags.acceptedMasteryTags,...design.controlledVocabulary.evidenceTags.proposedObservedTraceTags]);
  for(const ruleId of rules){
    const problem=generated(ruleId,52),result=classify(problem,solveCarryBridgeCase(problem));
    assert.ok(result.evidenceTags.every(tag=>bounded.has(tag)),ruleId);assert.equal(result.ledgerWritePerformed,false);assert.equal(result.formalMasteryClaimed,false);assert.equal(result.traceSummary.rawGestureCoordinatesStored,false);
  }
});

test('bundle to blueprint to bundle preserves addition regrouping semantics across 400 cases',()=>{
  for(let seed=1;seed<=400;seed++){
    const problem=generated('add-regroup',seed),bundle=carryBridgeBundleModel(problem),blueprint=bundleModelToVerticalBlueprint(bundle),roundTrip=verticalBlueprintToBundleModel(blueprint);
    assert.deepEqual(roundTrip,bundle,seed);assert.equal(blueprint.exchange.direction,'ones-to-tens');assert.equal(blueprint.exchange.inputUnitCount,10);assert.equal(blueprint.exchange.outputUnitCount,1);
  }
});

test('bundle to blueprint to bundle preserves subtraction regrouping semantics across 400 cases',()=>{
  for(let seed=1;seed<=400;seed++){
    const problem=generated('sub-regroup',seed),bundle=carryBridgeBundleModel(problem),blueprint=bundleModelToVerticalBlueprint(bundle),roundTrip=verticalBlueprintToBundleModel(blueprint);
    assert.deepEqual(roundTrip,bundle,seed);assert.equal(blueprint.exchange.direction,'tens-to-ones');assert.equal(blueprint.exchange.inputUnitCount,1);assert.equal(blueprint.exchange.outputUnitCount,10);
  }
});

test('blueprint semantics reject cosmetic-family substitution and tampered exchange meaning',()=>{
  const problem=generated('add-regroup',63),bundle=carryBridgeBundleModel(problem),blueprint=bundleModelToVerticalBlueprint(bundle);
  assert.notEqual(bundle.representationFamily,blueprint.representationFamily);
  assert.throws(()=>verticalBlueprintToBundleModel({...blueprint,representationFamily:'bridge-blueprint-blue-skin'}),/vertical-notation/);
  assert.throws(()=>verticalBlueprintToBundleModel({...blueprint,exchange:{...blueprint.exchange,direction:'tens-to-ones'}}),/preserve/);
});

test('fixed join trace replay cannot solve 400 varied join-load cases',()=>{
  const source=generated('add-regroup',1),trace=solveCarryBridgeCase(source).actionTrace;let solved=0;
  for(let seed=2;seed<=401;seed++){const ruleId=seed%2?'add-regroup':'add-no-regroup',target=generated(ruleId,seed);if(replayCarryBridgeActions(target,trace).complete)solved++}
  assert.ok(solved<25,`fixed join trace unexpectedly solved ${solved}/400`);
});

test('fixed unload trace replay cannot solve 400 varied repair cases',()=>{
  const source=generated('sub-regroup',1),trace=solveCarryBridgeCase(source).actionTrace;let solved=0;
  for(let seed=2;seed<=401;seed++){const ruleId=seed%2?'sub-regroup':'sub-no-regroup',target=generated(ruleId,seed);if(replayCarryBridgeActions(target,trace).complete)solved++}
  assert.ok(solved<25,`fixed unload trace unexpectedly solved ${solved}/400`);
});

test('fixed blueprint-from-bundles trace cannot match 400 varied explanation cases',()=>{
  const fixed=bundleModelToVerticalBlueprint(carryBridgeBundleModel(generated('add-regroup',1)));let matches=0;
  for(let seed=2;seed<=401;seed++){
    const ruleId=seed%2?'add-regroup':'sub-regroup',target=bundleModelToVerticalBlueprint(carryBridgeBundleModel(generated(ruleId,seed)));
    if(JSON.stringify(fixed.columns)===JSON.stringify(target.columns)&&JSON.stringify(fixed.exchange)===JSON.stringify(target.exchange))matches++;
  }
  assert.ok(matches<10,`fixed blueprint unexpectedly matched ${matches}/400`);
});

test('fixed bundles-from-blueprint trace cannot match 400 varied explanation cases',()=>{
  const fixed=carryBridgeBundleModel(generated('sub-regroup',1));let matches=0;
  for(let seed=2;seed<=401;seed++){
    const ruleId=seed%2?'add-regroup':'sub-regroup',target=carryBridgeBundleModel(generated(ruleId,seed));
    if(JSON.stringify(fixed.operands)===JSON.stringify(target.operands)&&JSON.stringify(fixed.exchange)===JSON.stringify(target.exchange))matches++;
  }
  assert.ok(matches<10,`fixed bundle trace unexpectedly matched ${matches}/400`);
});

test('misconception signals and hints remain semantic, answer-safe, and child-controlled',()=>{
  const add=generated('add-regroup',71);let addState=createCarryBridgeActionState(add);
  addState=applyCarryBridgeAction(addState,{type:'place',unit:'one',lane:'tens'});addState=applyCarryBridgeAction(addState,{type:'write-carry'});
  const sub=generated('sub-regroup',72);let subState=createCarryBridgeActionState(sub);
  subState=applyCarryBridgeAction(subState,{type:'unload',unit:'one',count:1,strategy:'smaller-digit-first'});subState=applyCarryBridgeAction(subState,{type:'write-borrow'});
  const signals=new Set([...carryBridgeMisconceptionSignals(add,addState.actionTrace),...carryBridgeMisconceptionSignals(sub,subState.actionTrace)]);
  assert.deepEqual(signals,new Set(['add-align','add-carry-value','sub-direction','sub-borrow-value']));
  for(const signal of signals){const hint=carryBridgeHint(signal);assert.ok(hint);assert.equal(hint.revealsAnswer,false);assert.equal(hint.completesAnswer,false);assert.equal(hint.returnsControl,true);assert.ok(hint.steps.at(-1).includes('return-control'))}
});

test('fresh retries preserve skill and structural case while changing operands and source identity',()=>{
  for(const ruleId of rules)for(let seed=1;seed<=400;seed++){
    const source=generated(ruleId,seed),retry=freshCarryBridgeRetry(source,{rng:seeded(seed)});
    assert.equal(retry.caseRuleId,source.caseRuleId,`${ruleId}/${seed}`);assert.equal(retry.skillId,source.skillId,`${ruleId}/${seed}`);
    assert.notEqual(`${retry.left}:${retry.right}`,`${source.left}:${source.right}`,`${ruleId}/${seed}`);assert.notEqual(retry.sourceQuestionId,source.sourceQuestionId,`${ruleId}/${seed}`);
    assert.equal(retry.retryOfSourceQuestionId,source.sourceQuestionId,`${ruleId}/${seed}`);assert.equal(validateCarryBridgeCase(retry).valid,true,`${ruleId}/${seed}`);
  }
});

test('the core is pure and has no DOM, storage, network, or shipped-runtime coupling',async()=>{
  const source=await readFile(new URL('../src/grade-2a-carry-bridge-core.mjs',import.meta.url),'utf8');
  assert.doesNotMatch(source,/\b(?:document|window|localStorage|sessionStorage|fetch|XMLHttpRequest)\b/);
  assert.doesNotMatch(source,/v10-app|service-worker|index\.html/);
  assert.doesNotMatch(source,/^\s*import\s/m);
});
