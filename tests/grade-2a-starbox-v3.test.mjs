import test from 'node:test';
import assert from 'node:assert/strict';
import {
  STARBOX_V3_PATHS,STARBOX_V3_PURPOSES,STARBOX_V3_RULES,applyStarboxV3Action,canonicalStarboxV3Actions,
  classifyStarboxV3Session,createStarboxV3RunPlan,createStarboxV3Session,markStarboxV3SupportUsed,
  replayStarboxV3Actions,starboxV3AccessEnabled,starboxV3ActionFor,starboxV3Boundary,starboxV3Discovery,
  starboxV3FounderReadback,starboxV3Hint,starboxV3NumberQuestReturnUrl,starboxV3ResumeUrl,starboxV3Scene
} from '../src/grade-2a-starbox-v3.mjs';

const seeded=seed=>()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296);
const generated=(rule,seed)=>createStarboxV3Session(rule,{rng:seeded(seed),sourceNonce:seed});
const solve=(rule,seed,path='tap-direct')=>{const source=generated(rule,seed);return replayStarboxV3Actions(source,canonicalStarboxV3Actions(source),{interactionPath:path})};
const exchanges=session=>session.coreState.actionTrace.filter(item=>item.type==='bundle'||item.type==='split');

test('V3 is hidden behind its exact flag and preserves the bounded arithmetic contract',()=>{
  assert.equal(starboxV3AccessEnabled('?prototype=starbox-v3'),true);
  for(const search of ['', '?prototype=1', '?prototype=starbox-v2', '?starbox-v3=1'])assert.equal(starboxV3AccessEnabled(search),false);
  assert.deepEqual(starboxV3Boundary(),{additionMaximum:99,subtractionMinimum:0,exact100Supported:false,normalHomeEntry:false,runLength:4,looseStarValue:1,sealedStarboxValue:10});
});

test('all four missions solve through object actions without mutating their source',()=>{
  for(const rule of STARBOX_V3_RULES)for(let seed=1;seed<=500;seed++){
    const source=generated(rule,seed),before=structuredClone(source),actions=canonicalStarboxV3Actions(source),complete=replayStarboxV3Actions(source,actions);
    assert.deepEqual(source,before,`${rule}/${seed} source mutation`);
    assert.equal(complete.coreState.complete,true,`${rule}/${seed}`);
    assert.equal(complete.coreState.workspace.tens*10+complete.coreState.workspace.ones,complete.problem.answer,`${rule}/${seed}`);
    assert.equal(complete.interactionLog.some(item=>item.action.type==='object-state-complete'),true,`${rule}/${seed}`);
    assert.equal(complete.interactionLog.some(item=>item.action.type==='numeric-answer'),false,`${rule}/${seed}`);
    assert.equal(classifyStarboxV3Session(complete).independentAcquisitionEligible,true,`${rule}/${seed}`);
    assert.deepEqual(complete.evidenceBoundary,{ledgerWritePerformed:false,formalMasteryClaimed:false,persisted:false,transferClaimed:false,worldCompletionClaimed:false,progressionWritePerformed:false,rewardWritePerformed:false});
  }
});

test('zero-exchange and exactly-one value-preserving exchange cases stay clean',()=>{
  for(const rule of STARBOX_V3_RULES)for(let seed=1;seed<=300;seed++){
    const session=solve(rule,seed),observed=exchanges(session);
    if(rule.endsWith('no-regroup'))assert.equal(observed.length,0,`${rule}/${seed}`);
    else {assert.equal(observed.length,1,`${rule}/${seed}`);assert.equal(observed[0].accepted,true);assert.equal(observed[0].valuePreserved,true);assert.equal(observed[0].valueBefore,observed[0].valueAfter)}
  }
});

test('scene graph has four distinct purposes and only exchange missions expose exchange scenes',()=>{
  assert.equal(new Set(Object.values(STARBOX_V3_PURPOSES)).size,4);
  const expected={
    'add-no-regroup':['combine','success'],
    'add-regroup':['combine','scoop-ten','seal-box','success'],
    'sub-no-regroup':['fulfill-boxes','fulfill-stars','success'],
    'sub-regroup':['fulfill-boxes','open-box','fulfill-stars','success']
  };
  for(const rule of STARBOX_V3_RULES){let session=generated(rule,72),scenes=[starboxV3Scene(session).id];for(const action of canonicalStarboxV3Actions(session)){session=applyStarboxV3Action(session,action);scenes.push(starboxV3Scene(session).id)}assert.deepEqual(scenes,expected[rule])}
});

test('packing ten stars is one group-selection plus one sealing action, never ten unrelated taps',()=>{
  let session=generated('add-regroup',41);session=applyStarboxV3Action(session,starboxV3ActionFor(session,'combine-deliveries'));
  const scoop=starboxV3ActionFor(session,'scoop-ten-stars');assert.equal(scoop.count,10);assert.equal(scoop.starIds.length,10);
  session=applyStarboxV3Action(session,scoop);assert.equal(session.preparedPack.count,10);assert.equal(starboxV3Scene(session).id,'seal-box');
  session=applyStarboxV3Action(session,starboxV3ActionFor(session,'seal-starbox'));
  assert.equal(session.coreState.complete,true);assert.equal(session.interactionLog.filter(item=>item.action.type==='scoop-ten-stars').length,1);
});

test('tap, pointer drag, and keyboard paths produce the same semantic action trace',()=>{
  for(const rule of STARBOX_V3_RULES)for(let seed=1;seed<=100;seed++){
    const traces=STARBOX_V3_PATHS.map(path=>solve(rule,seed,path).coreState.actionTrace.map(({type,accepted,code,valueBefore,valueAfter,direction})=>({type,accepted,code,valueBefore,valueAfter,direction:direction||null})));
    assert.deepEqual(traces[1],traces[0],`${rule}/${seed}/drag`);assert.deepEqual(traces[2],traces[0],`${rule}/${seed}/keyboard`);
  }
});

test('support is nonpunitive, answer-safe, child-controlled, and cannot claim independent acquisition',()=>{
  for(const scene of ['combine','scoop-ten','seal-box','fulfill-boxes','open-box','fulfill-stars']){const hint=starboxV3Hint(scene);assert.equal(hint.revealsNumericAnswer,false);assert.equal(hint.completesAction,false);assert.equal(hint.returnsControl,true)}
  let session=markStarboxV3SupportUsed(generated('sub-regroup',51),'founder-test-hint');session=replayStarboxV3Actions(session,canonicalStarboxV3Actions(session));
  assert.equal(session.coreState.complete,true);assert.equal(classifyStarboxV3Session(session).independentAcquisitionEligible,false);assert.ok(classifyStarboxV3Session(session).reasons.includes('independent-first-try-required'));
});

test('object identity tampering is neutral and disqualifies the trace',()=>{
  const session=generated('add-no-regroup',61),action=starboxV3ActionFor(session,'combine-deliveries');action.deliveryIds[0]='foreign-delivery';
  const result=applyStarboxV3Action(session,action);assert.equal(result.coreState.lastActionResult.neutral,true);assert.ok(result.semanticErrors.includes('v3-object-identity-mismatch'));assert.equal(classifyStarboxV3Session(result).independentAcquisitionEligible,false);
});

test('fixed scripts cannot shortcut varied problems',()=>{
  for(const rule of STARBOX_V3_RULES){const fixed=canonicalStarboxV3Actions(generated(rule,1));let solvedCount=0;for(let seed=2;seed<=401;seed++)if(replayStarboxV3Actions(generated(rule,seed),fixed).coreState.complete)solvedCount++;assert.ok(solvedCount<25,`${rule}: fixed script solved ${solvedCount}/400`)}
});

test('math discovery follows observed exchange, shows objects before notation, and is not a puzzle',()=>{
  for(const rule of ['add-regroup','sub-regroup']){const session=solve(rule,81),discovery=starboxV3Discovery(session);assert.equal(discovery.interactivePuzzle,false);assert.equal(discovery.compactConsequence,true);assert.ok(discovery.objectBefore);assert.ok(discovery.objectAfter);assert.ok(['10 個一可以換成 1 個十','打開 1 個十，就有 10 個一'].includes(discovery.statement));assert.ok(discovery.vertical.columns)}
  assert.throws(()=>starboxV3Discovery(solve('add-no-regroup',82)),/reserved/);
});

test('founder readback explains learning purpose without overstating evidence',()=>{
  const session=solve('sub-regroup',91),readback=starboxV3FounderReadback(session);
  assert.equal(readback.learningPurpose.targetSkillId,'g2a.sub.regroup-100');assert.match(readback.learningPurpose.behaviorObserved,/opens exactly one box/i);assert.match(readback.learningPurpose.grade2AMathematics,/Grade 2A/);assert.ok(readback.learningPurpose.evidenceCanClaim.includes('candidate-independent-acquisition-observation'));assert.ok(readback.learningPurpose.evidenceCannotClaim.includes('formal-mastery'));assert.equal(readback.childLoop.answerInputPresent,false);
});

test('the run is four short, distinct missions and navigation is reversible only by explicit query state',()=>{
  const plan=createStarboxV3RunPlan({seed:12});assert.equal(plan.length,4);assert.equal(plan.distinctPurposeCount,4);assert.deepEqual(plan.rules,STARBOX_V3_RULES);
  assert.equal(starboxV3NumberQuestReturnUrl({caseId:'sub-regroup',seed:12}),'index.html?prototypeReturn=starbox-v3&case=sub-regroup&seed=12');
  assert.equal(starboxV3ResumeUrl('?prototypeReturn=starbox-v3&case=sub-regroup&seed=12'),'starbox-v3.html?prototype=starbox-v3&case=sub-regroup&seed=12');
  assert.equal(starboxV3ResumeUrl('?case=sub-regroup'),null);
});
