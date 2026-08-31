import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CARRY_BRIDGE_PROTOTYPE_PATHS,CARRY_BRIDGE_PROTOTYPE_RULES,applyCarryBridgePrototypeIntent,
  canonicalCarryBridgePrototypeIntents,carryBridgePrototypeAccessEnabled,carryBridgePrototypeDebugReadback,
  carryBridgePrototypeNeutralSurface,classifyCarryBridgePrototypeSession,createCarryBridgePrototypeSession,
  replayCarryBridgePrototypeIntents
} from '../src/grade-2a-carry-bridge-prototype.mjs';

const seeded=seed=>()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296);
const session=(ruleId,seed=1)=>createCarryBridgePrototypeSession(ruleId,{rng:seeded(seed),sourceNonce:seed});
const solve=(source,path='tap-select-place')=>replayCarryBridgePrototypeIntents(source,canonicalCarryBridgePrototypeIntents(source.problem),{interactionPath:path});

test('prototype access is hidden behind the exact query flag',()=>{
  assert.equal(carryBridgePrototypeAccessEnabled('?prototype=carry-bridge'),true);
  for(const search of ['', '?prototype=1','?qa=carry-bridge','?prototype=carry-bridge-world'])assert.equal(carryBridgePrototypeAccessEnabled(search),false,search);
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
    const readback=carryBridgePrototypeDebugReadback(current);assert.equal(readback.state.complete,true,ruleId);assert.equal(readback.classification.independentAcquisitionEligible,false,ruleId);assert.ok(readback.classification.traceSummary.disqualifyingSemanticCodes.includes('numeric-answer-incorrect'),ruleId);assert.deepEqual(readback.evidenceBoundary,{ledgerWritePerformed:false,formalMasteryClaimed:false,persisted:false,transferClaimed:false,completionClaimed:false});
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
