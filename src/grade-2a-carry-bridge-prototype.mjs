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
export const CARRY_BRIDGE_DOGFOOD_VARIANTS=Object.freeze({
  interaction:Object.freeze(['tap-first','drag-first','balanced']),
  bundle:Object.freeze(['individual','pair-scoop']),
  result:Object.freeze(['cargo-slip','digit-dials'])
});
export const CARRY_BRIDGE_DOGFOOD_DEFAULTS=Object.freeze({interaction:'tap-first',bundle:'individual',result:'cargo-slip'});

const clone=value=>JSON.parse(JSON.stringify(value));

export function carryBridgePrototypeAccessEnabled(search=''){
  const params=new URLSearchParams(String(search).replace(/^\?/,''));
  return params.get('prototype')===CARRY_BRIDGE_PROTOTYPE_FLAG;
}

export function normalizeCarryBridgeDogfoodVariants(source=''){
  const params=source instanceof URLSearchParams?source:new URLSearchParams(typeof source==='string'?String(source).replace(/^\?/,''):'');
  const supplied=typeof source==='object'&&source!==null&&!(source instanceof URLSearchParams)?source:{};
  const value=(key,queryKey)=>String(supplied[key]??params.get(queryKey)??CARRY_BRIDGE_DOGFOOD_DEFAULTS[key]);
  const normalized={
    interaction:value('interaction','interaction'),bundle:value('bundle','bundle'),result:value('result','result')
  };
  for(const key of Object.keys(normalized))if(!CARRY_BRIDGE_DOGFOOD_VARIANTS[key].includes(normalized[key]))normalized[key]=CARRY_BRIDGE_DOGFOOD_DEFAULTS[key];
  return normalized;
}

export function carryBridgeDogfoodVariantQuery(variants={},extra={}){
  const normalized=normalizeCarryBridgeDogfoodVariants(variants),params=new URLSearchParams({prototype:CARRY_BRIDGE_PROTOTYPE_FLAG,...normalized,...extra});
  return `?${params.toString()}`;
}

export function carryBridgeDogfoodSelection(selectedIndexes,index,{unit='one',bundleVariant='individual',workspaceCount=0}={}){
  const selected=new Set([...selectedIndexes].filter(value=>Number.isInteger(value)&&value>=0&&value<workspaceCount));
  if(!Number.isInteger(index)||index<0||index>=workspaceCount)return [...selected].sort((a,b)=>a-b);
  if(selected.has(index)){selected.delete(index);return [...selected].sort((a,b)=>a-b)}
  selected.add(index);
  if(unit==='one'&&bundleVariant==='pair-scoop'&&selected.size<10){
    const partner=Array.from({length:workspaceCount},(_,candidate)=>candidate).find(candidate=>candidate!==index&&!selected.has(candidate));
    if(partner!==undefined)selected.add(partner);
  }
  return [...selected].sort((a,b)=>a-b);
}

export function carryBridgeExactTenTray(selectedOneCount){
  const count=Math.max(0,Math.trunc(Number(selectedOneCount)||0));
  return {selectedOneCount:count,filledSlots:Math.min(10,count),overflowCount:Math.max(0,count-10),exactTen:count===10};
}

export function carryBridgeDigitDialAnswer(tens,ones){
  const cleanTens=Math.trunc(Number(tens)),cleanOnes=Math.trunc(Number(ones));
  if(!Number.isInteger(cleanTens)||!Number.isInteger(cleanOnes)||cleanTens<0||cleanTens>9||cleanOnes<0||cleanOnes>9)throw new RangeError('Digit dials require two digits from 0 to 9');
  return cleanTens*10+cleanOnes;
}

export function carryBridgePrototypeNeutralSurface(problem){
  const operation=problem?.operation;
  if(operation!=='add'&&operation!=='subtract')throw new Error('Prototype case operation required');
  return {
    schemaVersion:'1.0.0',layoutId:'carry-bridge-neutral-workbench-v1',operation,
    visibleControlIds:['tens-lane','ones-lane','join-zone','bundle-zone','split-zone','unload-zone','ten-tray','result-entry','answer-submit','hint'],
    exchangeClassVisible:false,regroupingLabelVisible:false,expectedExchangeMetadataVisible:false,
    minimumTargetCssPixels:44
  };
}

export function createCarryBridgePrototypeSession(caseRuleId,{rng=Math.random,sourceNonce=0,variants=CARRY_BRIDGE_DOGFOOD_DEFAULTS}={}){
  const problem=makeCarryBridgeCase(caseRuleId,{rng,sourceNonce});
  return {
    schemaVersion:'1.0.0',surface:'hidden-non-production',problem,
    variants:normalizeCarryBridgeDogfoodVariants(variants),coreState:createCarryBridgeActionState(problem),interactionLog:[],
    evidenceBoundary:{ledgerWritePerformed:false,formalMasteryClaimed:false,persisted:false,transferClaimed:false,completionClaimed:false,progressionWritePerformed:false,rewardWritePerformed:false}
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
  session.evidenceBoundary={ledgerWritePerformed:false,formalMasteryClaimed:false,persisted:false,transferClaimed:false,completionClaimed:false,progressionWritePerformed:false,rewardWritePerformed:false};
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
    schemaVersion:'1.0.0',surface:'hidden-non-production',problem:clone(session.problem),variants:clone(session.variants),
    state:{phase:session.coreState.phase,complete:session.coreState.complete,numericCorrect:session.coreState.numericCorrect,workspace:clone(session.coreState.workspace),remainingToUnload:clone(session.coreState.remainingToUnload)},
    semanticActionTrace:clone(session.coreState.actionTrace),interactionLog:clone(session.interactionLog),classification,
    misconceptionSignals:carryBridgeMisconceptionSignals(session.problem,session.coreState.actionTrace),
    motorNoisePolicy:{semanticActionsOnly:true,rawPointerCoordinatesStored:false,motorNoiseDisqualifiesIndependence:false},
    evidenceBoundary:{ledgerWritePerformed:false,formalMasteryClaimed:false,persisted:false,transferClaimed:false,completionClaimed:false,progressionWritePerformed:false,rewardWritePerformed:false}
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

export function carryBridgePrototypeResultReady(session){
  const state=session?.coreState,problem=session?.problem;
  if(!state||!problem)return false;
  if(state.complete)return true;
  if(!state.workspace||state.workspace.ones<0||state.workspace.ones>9)return false;
  if(problem.operation==='add')return state.joined===true;
  if(problem.operation==='subtract')return Number(state.remainingToUnload?.tens)===0&&Number(state.remainingToUnload?.ones)===0;
  return false;
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
