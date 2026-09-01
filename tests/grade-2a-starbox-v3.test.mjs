import test from 'node:test';
import assert from 'node:assert/strict';
import {
  STARBOX_V3_PATHS,STARBOX_V3_PURPOSES,STARBOX_V3_RULES,applyStarboxV3Action,canonicalStarboxV3Actions,
  classifyStarboxV3Session,createStarboxV3RunPlan,createStarboxV3Session,markStarboxV3SupportUsed,
  replayStarboxV3Actions,starboxV3AccessEnabled,starboxV3ActionFor,starboxV3Boundary,starboxV3Discovery,
  starboxV3ChoiceEvidence,starboxV3Choices,starboxV3FounderReadback,starboxV3Hint,
  starboxV3NumberQuestReturnUrl,starboxV3ResumeUrl,starboxV3Scene
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
    assert.equal(starboxV3ChoiceEvidence(complete).complete,true,`${rule}/${seed}`);
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
    'add-no-regroup':['combine','combine','success'],
    'add-regroup':['combine','combine','scoop-ten','seal-box','success'],
    'sub-no-regroup':['fulfill-boxes','fulfill-stars','success'],
    'sub-regroup':['fulfill-boxes','open-box','fulfill-stars','success']
  };
  for(const rule of STARBOX_V3_RULES){let session=generated(rule,72),scenes=[starboxV3Scene(session).id];for(const action of canonicalStarboxV3Actions(session)){session=applyStarboxV3Action(session,action);scenes.push(starboxV3Scene(session).id)}assert.deepEqual(scenes,expected[rule])}
});

test('packing ten stars is one group-selection plus one sealing action, never ten unrelated taps',()=>{
  let session=generated('add-regroup',41);
  for(const source of starboxV3Choices(session).sources)session=applyStarboxV3Action(session,starboxV3ActionFor(session,'move-delivery',{sourceId:source.id}));
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
  const session=generated('add-no-regroup',61),action=starboxV3ActionFor(session,'move-delivery');action.sourceId='foreign-delivery';action.deliveryId='foreign-delivery';
  const result=applyStarboxV3Action(session,action);assert.equal(result.coreState.lastActionResult.neutral,true);assert.ok(result.semanticErrors.includes('v3-object-identity-mismatch'));assert.equal(classifyStarboxV3Session(result).independentAcquisitionEligible,false);
});

test('visible source and destination choices gate every semantic action',()=>{
  for(const rule of STARBOX_V3_RULES)for(let seed=1;seed<=120;seed++){
    let session=generated(rule,seed),guard=0;
    while(!session.coreState.complete&&guard++<12){
      const scene=starboxV3Scene(session),choices=starboxV3Choices(session);
      assert.ok(choices.sources.length>=1,`${rule}/${seed}/${scene.id} source`);
      assert.ok(choices.targets.length>=2,`${rule}/${seed}/${scene.id} targets`);
      if(['scoop-ten','fulfill-boxes','fulfill-stars'].includes(scene.id))assert.ok(choices.sources.length>=2,`${rule}/${seed}/${scene.id} quantity choices`);
      session=applyStarboxV3Action(session,canonicalStarboxV3Actions(session)[0]);
    }
    assert.equal(session.coreState.complete,true,`${rule}/${seed}`);
  }
});

test('wrong known destinations are neutral, do not advance, and disqualify evidence',()=>{
  const source=generated('add-no-regroup',62),choices=starboxV3Choices(source),wrong=choices.targets.find(target=>target.id==='packing-tray');
  const action=starboxV3ActionFor(source,'move-delivery',{sourceId:choices.sources[0].id,targetId:wrong.id});
  const result=applyStarboxV3Action(source,action);
  assert.equal(starboxV3Scene(result).id,'combine');assert.deepEqual(result.coreState.workspace,source.coreState.workspace);assert.deepEqual(result.deliveredIds,[]);
  assert.equal(result.coreState.lastActionResult.neutral,true);assert.ok(result.semanticErrors.includes('v3-wrong-target-choice'));assert.equal(classifyStarboxV3Session(result).independentAcquisitionEligible,false);
});

test('outside drops are motor noise only and do not poison later independent evidence',()=>{
  const source=generated('add-no-regroup',63),choice=starboxV3Choices(source).sources[0];
  const outside=applyStarboxV3Action(source,starboxV3ActionFor(source,'outside-drop',{sourceId:choice.id}),{interactionPath:'pointer-drag'});
  assert.equal(starboxV3Scene(outside).id,'combine');assert.deepEqual(outside.coreState.workspace,source.coreState.workspace);assert.deepEqual(outside.semanticErrors,[]);
  assert.equal(outside.interactionLog.at(-1).motorNoiseOnly,true);assert.equal(outside.coreState.lastActionResult.neutral,true);
  const complete=replayStarboxV3Actions(outside,canonicalStarboxV3Actions(outside),{interactionPath:'pointer-drag'});
  assert.equal(complete.coreState.complete,true);assert.equal(classifyStarboxV3Session(complete).independentAcquisitionEligible,true);
});

test('quantity choices vary position and a fixed first-card script cannot reliably solve missions',()=>{
  for(const rule of ['add-regroup','sub-no-regroup','sub-regroup']){
    const correctIndexes=new Set();let solvedByFirst=0,total=0;
    for(let seed=1;seed<=240;seed++){
      let session=generated(rule,seed),guard=0;
      while(!session.coreState.complete&&guard++<12){
        const scene=starboxV3Scene(session),choices=starboxV3Choices(session),canonical=canonicalStarboxV3Actions(session)[0];
        if(choices.sources.length>1&&scene.id!=='combine'){
          total++;correctIndexes.add(choices.sources.findIndex(source=>source.id===canonical.sourceId));
          const first=choices.sources[0],action=starboxV3ActionFor(session,canonical.type,{sourceId:first.id,targetId:canonical.targetId,count:first.count});
          const next=applyStarboxV3Action(session,action);if(next.interactionLog.at(-1).accepted)solvedByFirst++;session=next.interactionLog.at(-1).accepted?next:applyStarboxV3Action(session,canonical);
        }else session=applyStarboxV3Action(session,canonical);
      }
    }
    assert.ok(correctIndexes.size>=2,`${rule} correct choice stayed in one position`);assert.ok(solvedByFirst<total*.75,`${rule} first card solved ${solvedByFirst}/${total}`);
  }
});

test('independent evidence requires the complete visible-choice trace',()=>{
  const complete=solve('add-regroup',64),missing=structuredClone(complete);
  missing.interactionLog=missing.interactionLog.filter(item=>item.action.type!=='scoop-ten-stars');
  assert.equal(missing.coreState.complete,true);assert.equal(starboxV3ChoiceEvidence(missing).complete,false);
  assert.equal(classifyStarboxV3Session(missing).independentAcquisitionEligible,false);assert.ok(classifyStarboxV3Session(missing).reasons.includes('v3-visible-choice-trace-required'));
});

test('fixed scripts cannot shortcut varied problems',()=>{
  for(const rule of STARBOX_V3_RULES){const fixed=canonicalStarboxV3Actions(generated(rule,1));let solvedCount=0;for(let seed=2;seed<=401;seed++)if(replayStarboxV3Actions(generated(rule,seed),fixed).coreState.complete)solvedCount++;assert.ok(solvedCount<25,`${rule}: fixed script solved ${solvedCount}/400`)}
});

test('math discovery follows observed exchange, shows objects before notation, and is not a puzzle',()=>{
  for(const rule of ['add-regroup','sub-regroup']){const session=solve(rule,81),discovery=starboxV3Discovery(session);assert.equal(discovery.interactivePuzzle,false);assert.equal(discovery.compactConsequence,true);assert.ok(discovery.objectBefore);assert.ok(discovery.objectAfter);assert.ok(['10 個一可以換成 1 個十','打開 1 個十，就有 10 個一'].includes(discovery.statement));assert.ok(discovery.vertical.columns)}
  for(const rule of ['add-no-regroup','sub-no-regroup']){const session=solve(rule,82);assert.equal(session.problem.expectedExchange.direction,null);assert.throws(()=>starboxV3Discovery(session),/reserved/)}
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
