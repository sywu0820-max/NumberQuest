import {
  CARRY_BRIDGE_CASE_RULES,
  applyCarryBridgeAction,
  carryBridgeHint,
  carryBridgeMisconceptionSignals,
  classifyCarryBridgeAcquisition,
  createCarryBridgeActionState,
  makeCarryBridgeCase
} from './grade-2a-carry-bridge-core.mjs';

export const CARRY_BRIDGE_PROTOTYPE_FLAG='carry-bridge';
export const CARRY_BRIDGE_PROTOTYPE_RULES=Object.freeze(Object.keys(CARRY_BRIDGE_CASE_RULES));
export const CARRY_BRIDGE_PROTOTYPE_PATHS=Object.freeze(['tap-select-place','pointer-drag']);

const clone=value=>JSON.parse(JSON.stringify(value));

export function carryBridgePrototypeAccessEnabled(search=''){
  const params=new URLSearchParams(String(search).replace(/^\?/,''));
  return params.get('prototype')===CARRY_BRIDGE_PROTOTYPE_FLAG;
}

export function carryBridgePrototypeNeutralSurface(problem){
  const operation=problem?.operation;
  if(operation!=='add'&&operation!=='subtract')throw new Error('Prototype case operation required');
  return {
    schemaVersion:'1.0.0',layoutId:'carry-bridge-neutral-workbench-v1',operation,
    visibleControlIds:['tens-lane','ones-lane','join-zone','bundle-zone','split-zone','unload-zone','answer-submit','hint'],
    exchangeClassVisible:false,regroupingLabelVisible:false,expectedExchangeMetadataVisible:false,
    minimumTargetCssPixels:44
  };
}

export function createCarryBridgePrototypeSession(caseRuleId,{rng=Math.random,sourceNonce=0}={}){
  const problem=makeCarryBridgeCase(caseRuleId,{rng,sourceNonce});
  return {
    schemaVersion:'1.0.0',surface:'hidden-non-production',problem,
    coreState:createCarryBridgeActionState(problem),interactionLog:[],
    evidenceBoundary:{ledgerWritePerformed:false,formalMasteryClaimed:false,persisted:false}
  };
}

export function carryBridgePrototypeSemanticAction(intent={}){
  if(intent.type==='join-loads')return {type:'join'};
  if(intent.type==='place-unit')return {type:'place',unit:intent.unit,lane:intent.lane};
  if(intent.type==='bundle-ones')return {type:'bundle',count:Number(intent.count)};
  if(intent.type==='split-ten')return {type:'split',count:Number(intent.count)};
  if(intent.type==='unload-units')return {type:'unload',unit:intent.unit,count:Number(intent.count),...(intent.strategy?{strategy:intent.strategy}:{})};
  if(intent.type==='write-carry')return {type:'write-carry'};
  if(intent.type==='write-borrow')return {type:'write-borrow'};
  if(intent.type==='submit-answer')return {type:'submit',answer:Number(intent.answer)};
  throw new Error(`Unknown Carry Bridge prototype intent: ${intent.type}`);
}

export function applyCarryBridgePrototypeIntent(sourceSession,intent,{interactionPath='tap-select-place'}={}){
  if(!CARRY_BRIDGE_PROTOTYPE_PATHS.includes(interactionPath))throw new Error(`Unsupported prototype interaction path: ${interactionPath}`);
  const session=clone(sourceSession),semanticAction=carryBridgePrototypeSemanticAction(intent);
  session.coreState=applyCarryBridgeAction(session.coreState,semanticAction);
  session.interactionLog.push({index:session.interactionLog.length,interactionPath,intent:clone(intent),semanticAction:clone(semanticAction),resultCode:session.coreState.lastActionResult.code});
  session.evidenceBoundary={ledgerWritePerformed:false,formalMasteryClaimed:false,persisted:false};
  return session;
}

export function classifyCarryBridgePrototypeSession(session){
  const complete=session?.coreState?.complete===true;
  return classifyCarryBridgeAcquisition(session.problem,{
    outcome:complete?'correct':'miss',attemptKind:'independent-first-try',actionTrace:session.coreState.actionTrace
  });
}

export function carryBridgePrototypeDebugReadback(session){
  const classification=classifyCarryBridgePrototypeSession(session);
  return {
    schemaVersion:'1.0.0',surface:'hidden-non-production',problem:clone(session.problem),
    state:{phase:session.coreState.phase,complete:session.coreState.complete,numericCorrect:session.coreState.numericCorrect,workspace:clone(session.coreState.workspace),remainingToUnload:clone(session.coreState.remainingToUnload)},
    semanticActionTrace:clone(session.coreState.actionTrace),interactionLog:clone(session.interactionLog),classification,
    misconceptionSignals:carryBridgeMisconceptionSignals(session.problem,session.coreState.actionTrace),
    evidenceBoundary:{ledgerWritePerformed:false,formalMasteryClaimed:false,persisted:false,transferClaimed:false,completionClaimed:false}
  };
}

export function carryBridgePrototypeHint(session){
  const signals=carryBridgeMisconceptionSignals(session.problem,session.coreState.actionTrace);
  let signal=signals.at(-1)||null;
  if(!signal&&session.problem.operation==='add'&&session.coreState.joined&&Number(session.coreState.workspace?.ones)>=10)signal='add-carry-value';
  if(!signal&&session.problem.operation==='subtract'&&Number(session.coreState.workspace?.ones)<Number(session.coreState.remainingToUnload?.ones))signal='sub-borrow-value';
  if(!signal)signal=session.problem.operation==='add'?'add-align':'sub-direction';
  return carryBridgeHint(signal);
}

export function replayCarryBridgePrototypeIntents(session,intents,{interactionPath='tap-select-place'}={}){
  return intents.reduce((current,intent)=>applyCarryBridgePrototypeIntent(current,intent,{interactionPath}),session);
}

export function canonicalCarryBridgePrototypeIntents(problem){
  const intents=[];
  if(problem.operation==='add'){
    intents.push({type:'join-loads'});
    if(problem.expectedExchange.direction==='ones-to-tens')intents.push({type:'bundle-ones',count:10});
  }else{
    if(problem.expectedExchange.direction==='tens-to-ones')intents.push({type:'split-ten',count:1});
    const tens=Math.floor(problem.right/10),ones=problem.right%10;
    if(tens)intents.push({type:'unload-units',unit:'ten',count:tens});
    if(ones)intents.push({type:'unload-units',unit:'one',count:ones});
  }
  intents.push({type:'submit-answer',answer:problem.answer});
  return intents;
}
