import {
  applyCarryBridgePrototypeIntent,
  carryBridgePrototypeAccessEnabled,
  carryBridgePrototypeDebugReadback,
  carryBridgePrototypeResultReady,
  createCarryBridgePrototypeSession
} from './grade-2a-carry-bridge-prototype.mjs';
import {
  bundleModelToVerticalBlueprint,
  carryBridgeBundleModel
} from './grade-2a-carry-bridge-core.mjs';

export const CARRY_BRIDGE_V2_FLAG='carry-bridge-v2';
export const CARRY_BRIDGE_V2_RULES=Object.freeze(['add-no-regroup','add-regroup','sub-no-regroup','sub-regroup']);
export const CARRY_BRIDGE_V2_PATHS=Object.freeze(['tap-direct','pointer-drag']);
export const CARRY_BRIDGE_V21_WORLD_RUN_LENGTH=6;

const clone=value=>JSON.parse(JSON.stringify(value));
const valueOf=workspace=>Number(workspace?.tens||0)*10+Number(workspace?.ones||0);

export function carryBridgeV2AccessEnabled(search=''){
  const params=new URLSearchParams(String(search).replace(/^\?/,''));
  return params.get('prototype')===CARRY_BRIDGE_V2_FLAG;
}

export function createCarryBridgeV2Session(caseRuleId,{rng=Math.random,sourceNonce=0}={}){
  if(!CARRY_BRIDGE_V2_RULES.includes(caseRuleId))throw new Error(`Unsupported Carry Bridge V2 rule: ${caseRuleId}`);
  const session=createCarryBridgePrototypeSession(caseRuleId,{rng,sourceNonce});
  return {...session,schemaVersion:'2.1.0',surface:'hidden-v21-founder-review',v2:{completionSource:'object-state',childAnswerInputRequired:false,blueprintViewed:false,blueprintCompleted:false,semanticErrors:[],hintSignals:0,neutralActions:0}};
}

const objectId=(problem,unit,index)=>`${problem.sourceQuestionId}:${unit}:${index}`;

export function carryBridgeV2ActionFor(session,type,{indexes=[],index=0,count=null}={}){
  const problem=session?.problem;if(!problem)throw new Error('Carry Bridge V2 session required');
  if(type==='merge-groups')return {type,cargoGroupIds:[objectId(problem,'group','left'),objectId(problem,'group','right')]};
  if(type==='bundle-ten'){
    const selected=(indexes.length?indexes:Array.from({length:Number(count??10)},(_,item)=>item));
    return {type,count:Number(count??selected.length),selectedOneIds:selected.map(item=>objectId(problem,'one',item))};
  }
  if(type==='split-ten')return {type,count:Number(count??1),tenObjectId:objectId(problem,'ten',index)};
  if(type==='remove-ten'||type==='remove-one')return {type,objectId:objectId(problem,type==='remove-ten'?'ten':'one',index)};
  throw new Error(`Unknown Carry Bridge V2 action: ${type}`);
}

function actionIdentityValid(session,action){
  const problem=session.problem,workspace=session.coreState.workspace;
  if(action?.type==='merge-groups')return JSON.stringify(action.cargoGroupIds)===JSON.stringify([objectId(problem,'group','left'),objectId(problem,'group','right')]);
  if(action?.type==='bundle-ten'){
    const ids=Array.isArray(action.selectedOneIds)?action.selectedOneIds:[],unique=new Set(ids);
    return ids.length===Number(action.count)&&unique.size===ids.length&&ids.every((id,index)=>id===objectId(problem,'one',Number(id.split(':').at(-1)))&&Number(id.split(':').at(-1))>=0&&Number(id.split(':').at(-1))<Number(workspace?.ones));
  }
  if(action?.type==='split-ten')return action.tenObjectId===objectId(problem,'ten',Number(action.tenObjectId?.split(':').at(-1)))&&Number(action.tenObjectId?.split(':').at(-1))>=0&&Number(action.tenObjectId?.split(':').at(-1))<Number(workspace?.tens);
  if(action?.type==='remove-ten'||action?.type==='remove-one'){
    const unit=action.type==='remove-ten'?'ten':'one',index=Number(action.objectId?.split(':').at(-1)),count=unit==='ten'?workspace?.tens:workspace?.ones;
    return action.objectId===objectId(problem,unit,index)&&index>=0&&index<Number(count);
  }
  return false;
}

export function carryBridgeV2Scene(session){
  const state=session?.coreState,problem=session?.problem;
  if(!state||!problem)throw new Error('Carry Bridge V2 session required');
  if(state.complete)return {id:'celebrate',visibleAffordances:['blueprint-follow-up','new-mission'],readingBudget:'icon-and-short-label'};
  if(problem.operation==='add'){
    if(!state.joined)return {id:'merge',visibleAffordances:['cargo-group-a','cargo-group-b'],readingBudget:'icon-only'};
    if(Number(state.workspace?.ones)>=10)return {id:'bundle-ten',visibleAffordances:['loose-ones','ten-machine'],readingBudget:'icon-and-count'};
  }else{
    if(Number(state.remainingToUnload?.tens)>0)return {id:'remove-tens',visibleAffordances:['ten-boxes','departing-boat'],readingBudget:'icon-and-count'};
    if(Number(state.remainingToUnload?.ones)>Number(state.workspace?.ones))return {id:'split-ten',visibleAffordances:['one-ten-box','opening-dock'],readingBudget:'icon-only'};
    if(Number(state.remainingToUnload?.ones)>0)return {id:'remove-ones',visibleAffordances:['loose-ones','departing-boat'],readingBudget:'icon-and-count'};
  }
  return {id:'settle-ready',visibleAffordances:[],readingBudget:'none'};
}

function settleFromObjectState(session,interactionPath){
  if(session.coreState.complete||!carryBridgePrototypeResultReady(session))return session;
  const answer=valueOf(session.coreState.workspace);
  const settled=applyCarryBridgePrototypeIntent(session,{type:'submit-answer',answer},{interactionPath});
  settled.interactionLog.at(-1).automaticObjectStateCompletion=true;
  settled.v2={...settled.v2,completionSource:'object-state',childAnswerInputRequired:false};
  return settled;
}

export function applyCarryBridgeV2Action(sourceSession,action,{interactionPath='tap-direct'}={}){
  if(!CARRY_BRIDGE_V2_PATHS.includes(interactionPath))throw new Error(`Unsupported Carry Bridge V2 path: ${interactionPath}`);
  if(!actionIdentityValid(sourceSession,action)){
    const rejected=clone(sourceSession),path=interactionPath==='tap-direct'?'tap-select-place':'pointer-drag';
    rejected.v2.semanticErrors=[...(rejected.v2.semanticErrors||[]),'v2-object-identity-mismatch'];
    rejected.v2.neutralActions=Number(rejected.v2.neutralActions||0)+1;
    rejected.coreState.lastActionResult={accepted:false,neutral:true,code:'v2-object-identity-mismatch'};
    rejected.interactionLog.push({index:rejected.interactionLog.length,interactionPath:path,intent:null,semanticAction:null,v2Action:clone(action),resultCode:'v2-object-identity-mismatch'});
    return rejected;
  }
  let intent;
  if(action?.type==='merge-groups')intent={type:'join-loads'};
  else if(action?.type==='bundle-ten')intent={type:'bundle-ones',count:Number(action.count)};
  else if(action?.type==='split-ten')intent={type:'split-ten',count:Number(action.count)};
  else if(action?.type==='remove-ten')intent={type:'unload-units',unit:'ten',count:1};
  else if(action?.type==='remove-one')intent={type:'unload-units',unit:'one',count:1};
  else throw new Error(`Unknown Carry Bridge V2 action: ${action?.type}`);
  const current=applyCarryBridgePrototypeIntent(sourceSession,intent,{interactionPath:interactionPath==='tap-direct'?'tap-select-place':'pointer-drag'});
  current.interactionLog.at(-1).v2Action=clone(action);
  current.v2.neutralActions=current.coreState.lastActionResult.accepted?0:Number(current.v2.neutralActions||0)+1;
  return settleFromObjectState(current,interactionPath==='tap-direct'?'tap-select-place':'pointer-drag');
}

export function carryBridgeV2TenSelection(selectedIndexes,index,{workspaceOnes=0}={}){
  const valid=new Set((Array.isArray(selectedIndexes)?selectedIndexes:[]).filter(value=>Number.isInteger(value)&&value>=0&&value<workspaceOnes).slice(0,10));
  if(!Number.isInteger(index)||index<0||index>=workspaceOnes)return [...valid].sort((a,b)=>a-b);
  if(valid.has(index))valid.delete(index);
  else if(valid.size<10)valid.add(index);
  return [...valid].sort((a,b)=>a-b);
}

export function carryBridgeV2Blueprint(session){
  if(session?.coreState?.complete!==true)throw new Error('Concrete object scene must be complete before blueprint follow-up');
  return bundleModelToVerticalBlueprint(carryBridgeBundleModel(session.problem));
}

function choiceId(sourceQuestionId,column,digit){return `${sourceQuestionId}:blueprint:${column}:${digit}`}

export function carryBridgeV21BlueprintChallenge(session){
  const blueprint=carryBridgeV2Blueprint(session),column=blueprint.exchange?.direction==='ones-to-tens'?'tens':blueprint.exchange?.direction==='tens-to-ones'?'ones':session.problem.operation==='add'?'ones':'tens';
  const correctDigit=Number(blueprint.columns[column].result),offset=(session.problem.left+session.problem.right)%3;
  const digits=[correctDigit,(correctDigit+1+offset)%10,(correctDigit+9-offset+10)%10].filter((value,index,list)=>list.indexOf(value)===index);
  for(let value=0;digits.length<3&&value<=9;value++)if(!digits.includes(value))digits.push(value);
  const ordered=digits.map((_,index)=>digits[(index+offset)%digits.length]);
  return {
    schemaVersion:'2.1.0',challengeId:`${session.problem.sourceQuestionId}:blueprint:${column}`,sourceQuestionId:session.problem.sourceQuestionId,
    skillId:'g2a.addsub.explain-vertical',operation:session.problem.operation,column,correctDigit,
    choices:ordered.map(digit=>({id:choiceId(session.problem.sourceQuestionId,column,digit),digit})),attempts:[],complete:false,
    interactionPath:null,answerInputPresent:false,revealsAnswer:false,evidenceBoundary:clone(session.evidenceBoundary)
  };
}

export function applyCarryBridgeV21BlueprintChoice(sourceChallenge,choice,{interactionPath='tap-direct'}={}){
  if(!CARRY_BRIDGE_V2_PATHS.includes(interactionPath))throw new Error(`Unsupported Carry Bridge V2 path: ${interactionPath}`);
  const challenge=clone(sourceChallenge),digit=Number(choice?.digit),expectedId=choiceId(challenge.sourceQuestionId,challenge.column,digit);
  const identityValid=challenge.choices.some(item=>item.id===choice?.id&&item.digit===digit)&&choice?.id===expectedId;
  const correct=identityValid&&digit===challenge.correctDigit;
  challenge.attempts.push({index:challenge.attempts.length,choiceId:choice?.id||null,digit:Number.isFinite(digit)?digit:null,accepted:correct,neutral:!correct,code:correct?'blueprint-column-complete':identityValid?'blueprint-digit-neutral':'blueprint-choice-identity-mismatch',interactionPath,rawPointerCoordinatesStored:false});
  challenge.complete=correct;challenge.interactionPath=interactionPath;
  return challenge;
}

const HINT_CUES=Object.freeze({
  merge:Object.freeze([['pulse-focus',null],['relationship','📦  →  🌉  ←  📦'],['tiny-support','讓兩邊靠近']]),
  'bundle-ten':Object.freeze([['pulse-focus',null],['relationship','● ● ● ● ●  +  ● ● ● ● ●'],['tiny-support','找一組十個']]),
  'remove-tens':Object.freeze([['pulse-focus',null],['relationship','📦  →  ⛵'],['tiny-support','照船上的圖搬']]),
  'split-ten':Object.freeze([['pulse-focus',null],['relationship','📦 10  ↔  ● × 10'],['tiny-support','打開一個十']]),
  'remove-ones':Object.freeze([['pulse-focus',null],['relationship','●  →  ⛵'],['tiny-support','照船上的圖搬']])
});

export function carryBridgeV21Hint(sceneId,{idleSignals=0,neutralActions=0,manualRequests=0}={}){
  const cues=HINT_CUES[sceneId]||Object.freeze([['pulse-focus',null],['relationship','✨'],['tiny-support','看看發光的地方']]);
  const stage=Math.min(3,Math.max(1,Number(idleSignals||0)+Number(neutralActions||0)+Number(manualRequests||0)));
  const [cueType,message]=cues[stage-1];
  return {sceneId,stage,cueType,message,revealsAnswer:false,completesAction:false,returnsControl:true};
}

export function carryBridgeV21WorldRunPlan({seed=1,length=CARRY_BRIDGE_V21_WORLD_RUN_LENGTH}={}){
  const cleanSeed=Math.max(1,Math.trunc(Number(seed)||1)),cleanLength=Math.trunc(Number(length));
  if(cleanLength<5||cleanLength>7)throw new RangeError('Carry Bridge V2.1 world-run must contain 5 to 7 missions');
  const rotated=CARRY_BRIDGE_V2_RULES.map((_,index)=>CARRY_BRIDGE_V2_RULES[(index+(cleanSeed%CARRY_BRIDGE_V2_RULES.length))%CARRY_BRIDGE_V2_RULES.length]);
  const rules=Array.from({length:cleanLength},(_,index)=>rotated[index%rotated.length]);
  return {schemaVersion:'2.1.0',surface:'hidden-v21-world-run',runId:`carry-v21-run-${cleanSeed}-${cleanLength}`,seed:cleanSeed,length:cleanLength,rules,missionSeeds:rules.map((_,index)=>cleanSeed*100+index+1),includesEveryRule:CARRY_BRIDGE_V2_RULES.every(rule=>rules.includes(rule)),persisted:false,rewardWritePerformed:false,progressionWritePerformed:false};
}

export function carryBridgeV2DebugReadback(session,{pageErrors=[]}={}){
  const base=carryBridgePrototypeDebugReadback(session);
  if(session?.v2?.semanticErrors?.length){base.classification.independentAcquisitionEligible=false;base.classification.reasons=[...new Set([...base.classification.reasons,...session.v2.semanticErrors])];}
  return {
    ...base,
    schemaVersion:'2.1.0',
    surface:'hidden-v21-founder-review',
    scene:carryBridgeV2Scene(session),
    childLoop:{answerInputPresent:false,completionSource:'object-state',progressiveDisclosure:true,visibleAffordances:carryBridgeV2Scene(session).visibleAffordances},
    pageErrors:[...pageErrors],
    evidenceBoundary:{ledgerWritePerformed:false,formalMasteryClaimed:false,persisted:false,transferClaimed:false,completionClaimed:false,progressionWritePerformed:false,rewardWritePerformed:false}
  };
}

export function canonicalCarryBridgeV2Actions(problem){
  const actions=[];
  const shell={problem,coreState:{workspace:problem.operation==='subtract'?{tens:Math.floor(problem.left/10),ones:problem.left%10}:null}};
  if(problem.operation==='add'){
    actions.push(carryBridgeV2ActionFor(shell,'merge-groups'));
    if(problem.expectedExchange.direction==='ones-to-tens')actions.push(carryBridgeV2ActionFor({...shell,coreState:{workspace:{tens:0,ones:(problem.left%10)+(problem.right%10)}}},'bundle-ten',{count:10}));
  }
  else{
    for(let index=0;index<Math.floor(problem.right/10);index++)actions.push(carryBridgeV2ActionFor(shell,'remove-ten'));
    if(problem.expectedExchange.direction==='tens-to-ones')actions.push(carryBridgeV2ActionFor(shell,'split-ten',{count:1}));
    for(let index=0;index<problem.right%10;index++)actions.push(carryBridgeV2ActionFor(shell,'remove-one'));
  }
  return actions;
}

export function replayCarryBridgeV2Actions(session,actions,{interactionPath='tap-direct'}={}){
  return actions.reduce((current,action)=>applyCarryBridgeV2Action(current,action,{interactionPath}),session);
}

export function carryBridgeV2PrototypeBoundary(){
  return {additionMaximum:99,subtractionMinimum:0,exact100Supported:false,normalHomeEntry:false,primaryAnswerEntry:false,worldRunLengthRange:[5,7]};
}

export {carryBridgePrototypeAccessEnabled};
