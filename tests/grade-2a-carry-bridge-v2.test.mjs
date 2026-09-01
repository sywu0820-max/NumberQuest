import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CARRY_BRIDGE_V2_PATHS,
  CARRY_BRIDGE_V2_RULES,
  applyCarryBridgeV2Action,
  canonicalCarryBridgeV2Actions,
  carryBridgeV2ActionFor,
  carryBridgeV2AccessEnabled,
  carryBridgeV2Blueprint,
  carryBridgeV2DebugReadback,
  carryBridgeV2PrototypeBoundary,
  carryBridgeV2Scene,
  carryBridgeV2TenSelection,
  createCarryBridgeV2Session,
  replayCarryBridgeV2Actions
} from '../src/grade-2a-carry-bridge-v2.mjs';

const seeded=seed=>()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296);
const make=(ruleId,seed=1)=>createCarryBridgeV2Session(ruleId,{rng:seeded(seed),sourceNonce:seed});
const solve=(source,path='tap-direct')=>replayCarryBridgeV2Actions(source,canonicalCarryBridgeV2Actions(source.problem),{interactionPath:path});

test('V2 is hidden behind its own exact query flag and bounded to regroup scenes',()=>{
  assert.equal(carryBridgeV2AccessEnabled('?prototype=carry-bridge-v2'),true);
  assert.equal(carryBridgeV2AccessEnabled('?prototype=carry-bridge'),false);
  assert.deepEqual(CARRY_BRIDGE_V2_RULES,['add-regroup','sub-regroup']);
  assert.deepEqual(carryBridgeV2PrototypeBoundary(),{additionMaximum:99,subtractionMinimum:0,exact100Supported:false,normalHomeEntry:false,primaryAnswerEntry:false});
});

test('addition V2 progressively reveals merge then exact-ten machine and auto-completes from objects',()=>{
  const source=make('add-regroup',12),snapshot=structuredClone(source);
  assert.deepEqual(carryBridgeV2Scene(source),{id:'merge',visibleAffordances:['cargo-group-a','cargo-group-b'],readingBudget:'icon-only'});
  let current=applyCarryBridgeV2Action(source,carryBridgeV2ActionFor(source,'merge-groups'));
  assert.deepEqual(source,snapshot,'source session must not mutate');
  assert.equal(carryBridgeV2Scene(current).id,'bundle-ten');assert.equal(current.coreState.complete,false);
  const before=structuredClone(current.coreState.workspace);
  current=applyCarryBridgeV2Action(current,carryBridgeV2ActionFor(current,'bundle-ten',{count:9}));
  assert.equal(current.coreState.lastActionResult.code,'invalid-exchange-unit-count');assert.deepEqual(current.coreState.workspace,before);assert.equal(current.coreState.complete,false);
  current=applyCarryBridgeV2Action(current,carryBridgeV2ActionFor(current,'bundle-ten',{count:10}));
  assert.equal(current.coreState.complete,true);assert.equal(carryBridgeV2Scene(current).id,'celebrate');
  assert.deepEqual(current.coreState.actionTrace.map(entry=>entry.type),['join','bundle','bundle','submit']);
  assert.equal(current.interactionLog.at(-1).automaticObjectStateCompletion,true);
  assert.equal(current.v2.childAnswerInputRequired,false);assert.equal(current.v2.completionSource,'object-state');
});

test('subtraction V2 reveals only remove tens, split one ten, then remove ones',()=>{
  let current=make('sub-regroup',23);const removedTens=Math.floor(current.problem.right/10),removedOnes=current.problem.right%10;
  assert.equal(carryBridgeV2Scene(current).id,'remove-tens');
  for(let index=0;index<removedTens;index++)current=applyCarryBridgeV2Action(current,carryBridgeV2ActionFor(current,'remove-ten'));
  assert.equal(carryBridgeV2Scene(current).id,'split-ten');
  const valueBefore=current.coreState.workspace.tens*10+current.coreState.workspace.ones;
  current=applyCarryBridgeV2Action(current,carryBridgeV2ActionFor(current,'split-ten',{count:1}));
  const split=current.coreState.actionTrace.at(-1);assert.equal(split.code,'ten-split-to-ones');assert.equal(split.valuePreserved,true);assert.equal(split.valueAfter,valueBefore);
  assert.equal(carryBridgeV2Scene(current).id,'remove-ones');
  for(let index=0;index<removedOnes;index++)current=applyCarryBridgeV2Action(current,carryBridgeV2ActionFor(current,'remove-one'));
  assert.equal(current.coreState.complete,true);assert.equal(current.interactionLog.at(-1).automaticObjectStateCompletion,true);
  assert.equal(carryBridgeV2Scene(current).id,'celebrate');
});

test('ten selection never permits an eleventh object or fabricates semantic exchange',()=>{
  let selection=[];for(let index=0;index<12;index++)selection=carryBridgeV2TenSelection(selection,index,{workspaceOnes:12});
  assert.deepEqual(selection,[0,1,2,3,4,5,6,7,8,9]);
  selection=carryBridgeV2TenSelection(selection,3,{workspaceOnes:12});assert.equal(selection.length,9);
  selection=carryBridgeV2TenSelection(selection,11,{workspaceOnes:12});assert.equal(selection.length,10);assert.ok(selection.includes(11));
});

test('tap and optional drag paths preserve identical mathematical traces',()=>{
  assert.deepEqual(CARRY_BRIDGE_V2_PATHS,['tap-direct','pointer-drag']);
  for(const ruleId of CARRY_BRIDGE_V2_RULES)for(let seed=1;seed<=80;seed++){
    const tap=solve(make(ruleId,seed),'tap-direct'),drag=solve(make(ruleId,seed),'pointer-drag');
    assert.equal(tap.coreState.complete,true,`${ruleId}/${seed}`);assert.equal(drag.coreState.complete,true,`${ruleId}/${seed}`);
    assert.deepEqual(tap.coreState.actionTrace,drag.coreState.actionTrace,`${ruleId}/${seed}`);
    assert.ok(tap.interactionLog.every(entry=>entry.interactionPath==='tap-select-place'));
    assert.ok(drag.interactionLog.every(entry=>entry.interactionPath==='pointer-drag'));
  }
});

test('progressive disclosure never exposes an unrelated action set',()=>{
  for(const ruleId of CARRY_BRIDGE_V2_RULES)for(let seed=1;seed<=120;seed++){
    let current=make(ruleId,seed);for(const action of canonicalCarryBridgeV2Actions(current.problem)){
      const scene=carryBridgeV2Scene(current);assert.ok(scene.visibleAffordances.length<=2,`${ruleId}/${seed}/${scene.id}`);
      const allowed={merge:['cargo-group-a','cargo-group-b'],'bundle-ten':['loose-ones','ten-machine'],'remove-tens':['ten-boxes','departing-boat'],'split-ten':['one-ten-box','opening-dock'],'remove-ones':['loose-ones','departing-boat']}[scene.id];
      assert.deepEqual(scene.visibleAffordances,allowed);current=applyCarryBridgeV2Action(current,action);
    }
    assert.equal(carryBridgeV2Scene(current).id,'celebrate');
  }
});

test('blueprint is unavailable before concrete completion and value-equivalent after it',()=>{
  const source=make('add-regroup',44);assert.throws(()=>carryBridgeV2Blueprint(source),/Concrete object scene/);
  const complete=solve(source),blueprint=carryBridgeV2Blueprint(complete);
  assert.equal(blueprint.sourceQuestionId,complete.problem.sourceQuestionId);assert.equal(blueprint.operation,'add');assert.equal(blueprint.exchange.direction,'ones-to-tens');
  assert.equal(blueprint.columns.tens.result*10+blueprint.columns.ones.result,complete.problem.answer);
});

test('V2 remains evidence-bounded with no mastery, transfer, reward, progression, or persistence claims',()=>{
  for(const ruleId of CARRY_BRIDGE_V2_RULES)for(let seed=1;seed<=500;seed++){
    const complete=solve(make(ruleId,seed)),readback=carryBridgeV2DebugReadback(complete);
    assert.equal(complete.coreState.complete,true,`${ruleId}/${seed}`);assert.ok(complete.problem.answer>=0&&complete.problem.answer<=99);assert.notEqual(complete.problem.answer,100);
    assert.equal(readback.childLoop.answerInputPresent,false);assert.equal(readback.childLoop.completionSource,'object-state');assert.equal(readback.childLoop.progressiveDisclosure,true);
    assert.ok(Object.values(readback.evidenceBoundary).every(value=>value===false));assert.equal(readback.classification.ledgerWritePerformed,false);assert.equal(readback.classification.formalMasteryClaimed,false);
  }
});

test('fixed V2 action scripts cannot broadly solve varied arithmetic cases',()=>{
  for(const ruleId of CARRY_BRIDGE_V2_RULES){
    const fixed=canonicalCarryBridgeV2Actions(make(ruleId,1).problem);let completed=0;
    for(let seed=2;seed<=401;seed++)if(replayCarryBridgeV2Actions(make(ruleId,seed),fixed).coreState.complete)completed++;
    assert.ok(completed<35,`${ruleId}: fixed script solved ${completed}/400`);
  }
});
