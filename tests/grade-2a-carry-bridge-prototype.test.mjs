import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CARRY_BRIDGE_DOGFOOD_DEFAULTS,CARRY_BRIDGE_DOGFOOD_VARIANTS,CARRY_BRIDGE_PROTOTYPE_PATHS,CARRY_BRIDGE_PROTOTYPE_RULES,
  applyCarryBridgePrototypeIntent,canonicalCarryBridgePrototypeIntents,carryBridgeDigitDialAnswer,
  carryBridgeDogfoodSelection,carryBridgeDogfoodVariantQuery,carryBridgeExactTenTray,carryBridgePrototypeAccessEnabled,
  carryBridgePrototypeDebugReadback,carryBridgePrototypeNeutralSurface,carryBridgePrototypeResultReady,classifyCarryBridgePrototypeSession,
  createCarryBridgePrototypeSession,normalizeCarryBridgeDogfoodVariants,replayCarryBridgePrototypeIntents
} from '../src/grade-2a-carry-bridge-prototype.mjs';

const seeded=seed=>()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296);
const session=(ruleId,seed=1)=>createCarryBridgePrototypeSession(ruleId,{rng:seeded(seed),sourceNonce:seed});
const solve=(source,path='tap-select-place')=>replayCarryBridgePrototypeIntents(source,canonicalCarryBridgePrototypeIntents(source.problem),{interactionPath:path});

test('prototype access is hidden behind the exact query flag',()=>{
  assert.equal(carryBridgePrototypeAccessEnabled('?prototype=carry-bridge'),true);
  for(const search of ['', '?prototype=1','?qa=carry-bridge','?prototype=carry-bridge-world'])assert.equal(carryBridgePrototypeAccessEnabled(search),false,search);
});

test('dogfood variants are bounded, reversible query flags with fail-safe defaults',()=>{
  assert.deepEqual(normalizeCarryBridgeDogfoodVariants(''),CARRY_BRIDGE_DOGFOOD_DEFAULTS);
  assert.deepEqual(normalizeCarryBridgeDogfoodVariants('?interaction=drag-first&bundle=pair-scoop&result=digit-dials'),{interaction:'drag-first',bundle:'pair-scoop',result:'digit-dials'});
  assert.deepEqual(normalizeCarryBridgeDogfoodVariants('?interaction=magic&bundle=carry-button&result=answer-leak'),CARRY_BRIDGE_DOGFOOD_DEFAULTS);
  const query=carryBridgeDogfoodVariantQuery({interaction:'balanced',bundle:'pair-scoop',result:'digit-dials'},{founder:'1'}),params=new URLSearchParams(query);
  assert.equal(params.get('prototype'),'carry-bridge');assert.equal(params.get('founder'),'1');assert.equal(params.get('bundle'),'pair-scoop');
  assert.deepEqual(CARRY_BRIDGE_DOGFOOD_VARIANTS,{interaction:['tap-first','drag-first','balanced'],bundle:['individual','pair-scoop'],result:['cargo-slip','digit-dials']});
});

test('pair scoop visibly accumulates two ones at a time but still requires an explicit exact-ten bundle',()=>{
  let selection=[];
  for(const index of [0,2,4,6,8])selection=carryBridgeDogfoodSelection(selection,index,{unit:'one',bundleVariant:'pair-scoop',workspaceCount:12});
  assert.deepEqual(selection,[0,1,2,3,4,5,6,7,8,9]);assert.deepEqual(carryBridgeExactTenTray(selection.length),{selectedOneCount:10,filledSlots:10,overflowCount:0,exactTen:true});
  let current=session('add-regroup',18);current=applyCarryBridgePrototypeIntent(current,{type:'join-loads'});const before=current.coreState.workspace;
  current=applyCarryBridgePrototypeIntent(current,{type:'bundle-ones',count:selection.length});assert.equal(current.coreState.lastActionResult.code,'ones-bundled-to-ten');assert.equal(current.coreState.actionTrace.at(-1).valuePreserved,true);assert.notDeepEqual(current.coreState.workspace,before);
});

test('ten tray and digit dials expose no answer and preserve 0-99 boundaries',()=>{
  assert.deepEqual(carryBridgeExactTenTray(9),{selectedOneCount:9,filledSlots:9,overflowCount:0,exactTen:false});
  assert.deepEqual(carryBridgeExactTenTray(11),{selectedOneCount:11,filledSlots:10,overflowCount:1,exactTen:false});
  assert.equal(carryBridgeDigitDialAnswer(0,0),0);assert.equal(carryBridgeDigitDialAnswer(9,9),99);
  assert.throws(()=>carryBridgeDigitDialAnswer(10,0),RangeError);assert.throws(()=>carryBridgeDigitDialAnswer(0,-1),RangeError);
});

test('every founder variant combination preserves the same semantic completion trace',()=>{
  for(const ruleId of CARRY_BRIDGE_PROTOTYPE_RULES){
    const baseline=solve(session(ruleId,19));
    for(const interaction of CARRY_BRIDGE_DOGFOOD_VARIANTS.interaction)for(const bundle of CARRY_BRIDGE_DOGFOOD_VARIANTS.bundle)for(const result of CARRY_BRIDGE_DOGFOOD_VARIANTS.result){
      const candidate=createCarryBridgePrototypeSession(ruleId,{rng:seeded(19),sourceNonce:19,variants:{interaction,bundle,result}}),completed=solve(candidate);
      assert.deepEqual(completed.coreState.actionTrace,baseline.coreState.actionTrace,`${ruleId}/${interaction}/${bundle}/${result}`);
      assert.deepEqual(completed.variants,{interaction,bundle,result});
    }
  }
});

test('cargo result entry stays locked until the physical semantic state is ready',()=>{
  for(const ruleId of CARRY_BRIDGE_PROTOTYPE_RULES){
    let current=session(ruleId,27);assert.equal(carryBridgePrototypeResultReady(current),false,`${ruleId}/initial`);
    const intents=canonicalCarryBridgePrototypeIntents(current.problem),beforeSubmit=intents.slice(0,-1);
    for(const intent of beforeSubmit){current=applyCarryBridgePrototypeIntent(current,intent);if(intent.type==='join-loads'&&ruleId==='add-regroup')assert.equal(carryBridgePrototypeResultReady(current),false,`${ruleId}/joined-before-exchange`)}
    assert.equal(carryBridgePrototypeResultReady(current),true,`${ruleId}/physical-ready`);
    current=applyCarryBridgePrototypeIntent(current,intents.at(-1));assert.equal(current.coreState.complete,true,ruleId);assert.equal(carryBridgePrototypeResultReady(current),true,`${ruleId}/complete`);
  }
});

test('no-regroup and regroup enter through identical neutral controls without exchange metadata',()=>{
  for(const [plain,exchange] of [['add-no-regroup','add-regroup'],['sub-no-regroup','sub-regroup']]){
    const a=carryBridgePrototypeNeutralSurface(session(plain).problem),b=carryBridgePrototypeNeutralSurface(session(exchange).problem);
    assert.deepEqual(a,b,`${plain}/${exchange}`);assert.equal(a.exchangeClassVisible,false);assert.equal(a.regroupingLabelVisible,false);assert.equal(a.expectedExchangeMetadataVisible,false);assert.equal(a.minimumTargetCssPixels,44);
  }
});

test('tap-select-place and pointer-drag routes emit identical accepted semantic traces',()=>{
  assert.deepEqual(CARRY_BRIDGE_PROTOTYPE_PATHS,['tap-select-place','pointer-drag']);
  for(const ruleId of CARRY_BRIDGE_PROTOTYPE_RULES){
    const tap=solve(session(ruleId,20),'tap-select-place'),drag=solve(session(ruleId,20),'pointer-drag');
    assert.equal(tap.coreState.complete,true,ruleId);assert.equal(drag.coreState.complete,true,ruleId);
    assert.deepEqual(tap.coreState.actionTrace,drag.coreState.actionTrace,ruleId);
    assert.ok(tap.interactionLog.every(item=>item.interactionPath==='tap-select-place'),ruleId);
    assert.ok(drag.interactionLog.every(item=>item.interactionPath==='pointer-drag'),ruleId);
  }
});

test('9 and 11 one bundle attempts fail neutrally and preserve the workbench value',()=>{
  for(const count of [9,11]){
    let current=session('add-regroup',30);current=applyCarryBridgePrototypeIntent(current,{type:'join-loads'});const before=JSON.stringify(current.coreState.workspace);
    current=applyCarryBridgePrototypeIntent(current,{type:'bundle-ones',count},{interactionPath:'pointer-drag'});
    assert.equal(current.coreState.lastActionResult.code,'invalid-exchange-unit-count',count);assert.equal(current.coreState.lastActionResult.neutral,true,count);assert.equal(JSON.stringify(current.coreState.workspace),before,count);
  }
});

test('unnecessary no-regroup exchange stays recoverable but prevents clean evidence after completion',()=>{
  for(const ruleId of ['add-no-regroup','sub-no-regroup']){
    let current=session(ruleId,40),before=JSON.stringify(current.coreState.workspace);const intent=current.problem.operation==='add'?{type:'bundle-ones',count:10}:{type:'split-ten',count:1};
    current=applyCarryBridgePrototypeIntent(current,intent);assert.equal(current.coreState.lastActionResult.code,'unnecessary-exchange',ruleId);assert.equal(JSON.stringify(current.coreState.workspace),before,ruleId);
    current=solve(current);const evidence=classifyCarryBridgePrototypeSession(current);assert.equal(current.coreState.complete,true,ruleId);assert.equal(evidence.independentAcquisitionEligible,false,ruleId);assert.ok(evidence.reasons.includes('semantic-trace-not-independent'),ruleId);
  }
});

test('wrong submit then correction stays correct-but-not-independent across all case rules',()=>{
  for(const ruleId of CARRY_BRIDGE_PROTOTYPE_RULES){
    let current=session(ruleId,50),wrong=current.problem.answer===0?1:current.problem.answer-1;current=applyCarryBridgePrototypeIntent(current,{type:'submit-answer',answer:wrong});current=solve(current);
    const readback=carryBridgePrototypeDebugReadback(current);assert.equal(readback.state.complete,true,ruleId);assert.equal(readback.classification.independentAcquisitionEligible,false,ruleId);assert.ok(readback.classification.traceSummary.disqualifyingSemanticCodes.includes('numeric-answer-incorrect'),ruleId);assert.ok(Object.values(readback.evidenceBoundary).every(value=>value===false));assert.deepEqual(readback.motorNoisePolicy,{semanticActionsOnly:true,rawPointerCoordinatesStored:false,motorNoiseDisqualifiesIndependence:false});
  }
});

test('fixed prototype intents cannot solve varied cases',()=>{
  for(const ruleId of CARRY_BRIDGE_PROTOTYPE_RULES){
    const fixed=canonicalCarryBridgePrototypeIntents(session(ruleId,1).problem);let completed=0;
    for(let seed=2;seed<=401;seed++)if(replayCarryBridgePrototypeIntents(session(ruleId,seed),fixed).coreState.complete)completed++;
    assert.ok(completed<30,`${ruleId}: fixed intents solved ${completed}/400`);
  }
});

test('prototype remains bounded to <=99 addition, nonnegative subtraction, and zero persistence',()=>{
  for(const ruleId of CARRY_BRIDGE_PROTOTYPE_RULES)for(let seed=1;seed<=600;seed++){
    const current=session(ruleId,seed),readback=carryBridgePrototypeDebugReadback(current);assert.ok(current.problem.answer>=0&&current.problem.answer<=99,`${ruleId}/${seed}`);assert.notEqual(current.problem.answer,100,`${ruleId}/${seed}`);assert.equal(readback.evidenceBoundary.persisted,false);assert.equal(readback.classification.ledgerWritePerformed,false);assert.equal(readback.classification.formalMasteryClaimed,false);
  }
});
