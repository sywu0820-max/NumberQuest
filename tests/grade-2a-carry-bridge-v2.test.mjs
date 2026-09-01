import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CARRY_BRIDGE_V2_PATHS,
  CARRY_BRIDGE_V2_RULES,
  applyCarryBridgeV21BlueprintChoice,
  applyCarryBridgeV2Action,
  canonicalCarryBridgeV2Actions,
  carryBridgeV2ActionFor,
  carryBridgeV2AccessEnabled,
  carryBridgeV2Blueprint,
  carryBridgeV2DebugReadback,
  carryBridgeV2PrototypeBoundary,
  carryBridgeV2Scene,
  carryBridgeV2TenSelection,
  carryBridgeV21BlueprintChallenge,
  carryBridgeV21Hint,
  carryBridgeV21WorldRunPlan,
  createCarryBridgeV2Session,
  replayCarryBridgeV2Actions
} from '../src/grade-2a-carry-bridge-v2.mjs';

const seeded=seed=>()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296);
const make=(ruleId,seed=1)=>createCarryBridgeV2Session(ruleId,{rng:seeded(seed),sourceNonce:seed});
const solve=(source,path='tap-direct')=>replayCarryBridgeV2Actions(source,canonicalCarryBridgeV2Actions(source.problem),{interactionPath:path});

test('V2.1 is hidden behind its exact flag and supports the four bounded calculation families',()=>{
  assert.equal(carryBridgeV2AccessEnabled('?prototype=carry-bridge-v2'),true);
  assert.equal(carryBridgeV2AccessEnabled('?prototype=carry-bridge'),false);
  assert.deepEqual(CARRY_BRIDGE_V2_RULES,['add-no-regroup','add-regroup','sub-no-regroup','sub-regroup']);
  assert.deepEqual(carryBridgeV2PrototypeBoundary(),{additionMaximum:99,subtractionMinimum:0,exact100Supported:false,normalHomeEntry:false,primaryAnswerEntry:false,worldRunLengthRange:[5,7]});
});

test('no-regroup families require meaningful object actions and never fabricate exchange',()=>{
  let add=make('add-no-regroup',17);assert.equal(carryBridgeV2Scene(add).id,'merge');
  add=applyCarryBridgeV2Action(add,carryBridgeV2ActionFor(add,'merge-groups'));
  assert.equal(add.coreState.complete,true);assert.deepEqual(add.coreState.actionTrace.map(item=>item.type),['join','submit']);
  assert.equal(add.coreState.actionTrace.some(item=>item.type==='bundle'||item.type==='split'),false);
  let sub=make('sub-no-regroup',19),removedTens=0,removedOnes=0;
  while(carryBridgeV2Scene(sub).id==='remove-tens'){sub=applyCarryBridgeV2Action(sub,carryBridgeV2ActionFor(sub,'remove-ten'));removedTens++}
  assert.notEqual(carryBridgeV2Scene(sub).id,'split-ten');
  while(carryBridgeV2Scene(sub).id==='remove-ones'){sub=applyCarryBridgeV2Action(sub,carryBridgeV2ActionFor(sub,'remove-one'));removedOnes++}
  assert.equal(removedTens,Math.floor(sub.problem.right/10));assert.equal(removedOnes,sub.problem.right%10);assert.equal(sub.coreState.complete,true);
  assert.equal(sub.coreState.actionTrace.some(item=>item.type==='bundle'||item.type==='split'),false);
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
  assert.deepEqual(carryBridgeV2TenSelection([],8,{workspaceOnes:9}),[8]);
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

test('V2.1 blueprint is a source-bound, low-reading interaction with neutral recovery',()=>{
  const complete=solve(make('sub-regroup',47)),challenge=carryBridgeV21BlueprintChallenge(complete),snapshot=structuredClone(challenge);
  assert.equal(challenge.skillId,'g2a.addsub.explain-vertical');assert.equal(challenge.answerInputPresent,false);assert.equal(challenge.revealsAnswer,false);
  const wrong=challenge.choices.find(item=>item.digit!==challenge.correctDigit),correct=challenge.choices.find(item=>item.digit===challenge.correctDigit);
  let next=applyCarryBridgeV21BlueprintChoice(challenge,wrong);assert.deepEqual(challenge,snapshot);assert.equal(next.complete,false);assert.equal(next.attempts.at(-1).neutral,true);
  const foreign={...correct,id:`foreign:${correct.digit}`};next=applyCarryBridgeV21BlueprintChoice(next,foreign);assert.equal(next.complete,false);assert.equal(next.attempts.at(-1).code,'blueprint-choice-identity-mismatch');
  next=applyCarryBridgeV21BlueprintChoice(next,correct,{interactionPath:'pointer-drag'});assert.equal(next.complete,true);assert.equal(next.interactionPath,'pointer-drag');assert.equal(next.attempts.at(-1).rawPointerCoordinatesStored,false);
  assert.ok(Object.values(next.evidenceBoundary).every(value=>value===false));
});

test('answer-safe hint escalation is progressive and never completes the action',()=>{
  const first=carryBridgeV21Hint('bundle-ten',{idleSignals:1}),second=carryBridgeV21Hint('bundle-ten',{idleSignals:2}),third=carryBridgeV21Hint('bundle-ten',{idleSignals:2,neutralActions:2});
  assert.deepEqual([first.stage,second.stage,third.stage],[1,2,3]);assert.deepEqual([first.cueType,second.cueType,third.cueType],['pulse-focus','relationship','tiny-support']);
  for(const hint of [first,second,third]){assert.equal(hint.revealsAnswer,false);assert.equal(hint.completesAction,false);assert.equal(hint.returnsControl,true)}
});

test('mixed world-run is deterministic, 5-7 missions, and includes every family without writes',()=>{
  for(const length of [5,6,7]){
    const plan=carryBridgeV21WorldRunPlan({seed:31,length});assert.deepEqual(plan,carryBridgeV21WorldRunPlan({seed:31,length}));
    assert.equal(plan.length,length);assert.equal(plan.includesEveryRule,true);assert.ok(CARRY_BRIDGE_V2_RULES.every(rule=>plan.rules.includes(rule)));
    assert.equal(plan.persisted,false);assert.equal(plan.rewardWritePerformed,false);assert.equal(plan.progressionWritePerformed,false);
    plan.rules.forEach((rule,index)=>assert.equal(solve(createCarryBridgeV2Session(rule,{rng:seeded(plan.missionSeeds[index]),sourceNonce:plan.missionSeeds[index]})).coreState.complete,true));
  }
  assert.throws(()=>carryBridgeV21WorldRunPlan({length:4}),/5 to 7/);assert.throws(()=>carryBridgeV21WorldRunPlan({length:8}),/5 to 7/);
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

test('dirty semantic traces recover without becoming independent evidence in all four families',()=>{
  for(const ruleId of CARRY_BRIDGE_V2_RULES){
    let current=make(ruleId,83),dirty;
    if(ruleId.startsWith('add')){
      current=applyCarryBridgeV2Action(current,carryBridgeV2ActionFor(current,'merge-groups'));
      if(current.coreState.complete){
        const pre=make(ruleId,83);dirty=applyCarryBridgeV2Action(pre,carryBridgeV2ActionFor({...pre,coreState:{...pre.coreState,workspace:{tens:0,ones:9}}},'bundle-ten',{count:9}));
        dirty=solve(dirty);
      }else{
        dirty=applyCarryBridgeV2Action(current,carryBridgeV2ActionFor(current,'bundle-ten',{count:9}));dirty=solve(dirty);
      }
    }else{
      dirty=applyCarryBridgeV2Action(current,{type:'remove-one',objectId:'foreign:one:0'});dirty=solve(dirty);
    }
    assert.equal(dirty.coreState.complete,true,ruleId);assert.equal(carryBridgeV2DebugReadback(dirty).classification.independentAcquisitionEligible,false,ruleId);
  }
});
