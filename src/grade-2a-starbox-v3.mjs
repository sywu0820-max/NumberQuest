import {
  applyCarryBridgeAction,
  bundleModelToVerticalBlueprint,
  carryBridgeBundleModel,
  classifyCarryBridgeAcquisition,
  createCarryBridgeActionState,
  makeCarryBridgeCase
} from './grade-2a-carry-bridge-core.mjs';

export const STARBOX_V3_FLAG='starbox-v3';
export const STARBOX_V3_RULES=Object.freeze(['add-no-regroup','add-regroup','sub-no-regroup','sub-regroup']);
export const STARBOX_V3_PATHS=Object.freeze(['tap-direct','pointer-drag','keyboard']);
export const STARBOX_V3_PURPOSES=Object.freeze({
  'add-no-regroup':'combine-deliveries',
  'add-regroup':'combine-and-pack',
  'sub-no-regroup':'fulfill-directly',
  'sub-regroup':'open-box-and-fulfill'
});

const clone=value=>JSON.parse(JSON.stringify(value));
const valueOf=parts=>Number(parts?.tens||0)*10+Number(parts?.ones||0);
const objectId=(problem,unit,index)=>`${problem.sourceQuestionId}:starbox:${unit}:${index}`;
const boundary=()=>({ledgerWritePerformed:false,formalMasteryClaimed:false,persisted:false,transferClaimed:false,worldCompletionClaimed:false,progressionWritePerformed:false,rewardWritePerformed:false});

export function starboxV3AccessEnabled(search=''){
  const params=new URLSearchParams(String(search).replace(/^\?/,''));
  return params.get('prototype')===STARBOX_V3_FLAG;
}

export function createStarboxV3Session(caseRuleId,{rng=Math.random,sourceNonce=0}={}){
  if(!STARBOX_V3_RULES.includes(caseRuleId))throw new Error(`Unsupported Starbox V3 rule: ${caseRuleId}`);
  const problem=makeCarryBridgeCase(caseRuleId,{rng,sourceNonce});
  return {
    schemaVersion:'3.0.0',surface:'hidden-starbox-v3-founder-review',problem,coreState:createCarryBridgeActionState(problem),
    purposeId:STARBOX_V3_PURPOSES[caseRuleId],preparedPack:null,interactionLog:[],supportUsed:false,supportReasons:[],discoveryViewed:false,semanticErrors:[],
    evidenceBoundary:boundary()
  };
}

function ids(problem,unit,count){return Array.from({length:count},(_,index)=>objectId(problem,unit,index))}

export function starboxV3ActionFor(session,type,{count=null}={}){
  const problem=session?.problem,state=session?.coreState;if(!problem||!state)throw new Error('Starbox V3 session required');
  if(type==='combine-deliveries')return {type,deliveryIds:ids(problem,'delivery',2)};
  if(type==='scoop-ten-stars')return {type,count:10,starIds:ids(problem,'loose',10)};
  if(type==='seal-starbox')return {type,preparedPackId:`${problem.sourceQuestionId}:starbox:pack:10`,starIds:clone(session.preparedPack?.starIds||[])};
  if(type==='fulfill-boxes'){
    const amount=Math.max(0,Math.trunc(Number(count??state.remainingToUnload?.tens)||0));
    return {type,count:amount,boxIds:ids(problem,'box',amount)};
  }
  if(type==='open-starbox')return {type,count:1,boxId:objectId(problem,'box',0)};
  if(type==='fulfill-stars'){
    const amount=Math.max(0,Math.trunc(Number(count??state.remainingToUnload?.ones)||0));
    return {type,count:amount,starIds:ids(problem,'loose',amount)};
  }
  throw new Error(`Unknown Starbox V3 action: ${type}`);
}

function exactIds(actual,expected){return Array.isArray(actual)&&actual.length===expected.length&&actual.every((id,index)=>id===expected[index])}

function actionIdentityValid(session,action){
  const problem=session.problem,state=session.coreState;
  if(action?.type==='combine-deliveries')return exactIds(action.deliveryIds,ids(problem,'delivery',2));
  if(action?.type==='scoop-ten-stars')return Number(state.workspace?.ones)>=10&&action.count===10&&exactIds(action.starIds,ids(problem,'loose',10));
  if(action?.type==='seal-starbox')return session.preparedPack?.preparedPackId===action.preparedPackId&&exactIds(action.starIds,session.preparedPack.starIds)&&action.starIds.length===10;
  if(action?.type==='fulfill-boxes')return action.count===Number(state.remainingToUnload?.tens)&&action.count>0&&action.count<=Number(state.workspace?.tens)&&exactIds(action.boxIds,ids(problem,'box',action.count));
  if(action?.type==='open-starbox')return action.count===1&&action.boxId===objectId(problem,'box',0)&&Number(state.workspace?.tens)>0;
  if(action?.type==='fulfill-stars')return action.count===Number(state.remainingToUnload?.ones)&&action.count>0&&action.count<=Number(state.workspace?.ones)&&exactIds(action.starIds,ids(problem,'loose',action.count));
  return false;
}

function log(session,action,interactionPath,resultCode,accepted,semanticAction=null){
  session.interactionLog.push({index:session.interactionLog.length,interactionPath,action:clone(action),semanticAction:semanticAction?clone(semanticAction):null,resultCode,accepted:Boolean(accepted),rawPointerCoordinatesStored:false});
}

function resultReady(session){
  const state=session.coreState,problem=session.problem;
  if(state.complete||!state.workspace||state.workspace.ones<0||state.workspace.ones>9)return state.complete;
  if(problem.operation==='add')return state.joined;
  return valueOf(state.remainingToUnload)===0;
}

function settle(session,interactionPath){
  if(!resultReady(session)||session.coreState.complete)return session;
  const semanticAction={type:'submit',answer:session.problem.answer};
  session.coreState=applyCarryBridgeAction(session.coreState,semanticAction);
  log(session,{type:'object-state-complete'},interactionPath,'mission-complete',session.coreState.complete,semanticAction);
  session.interactionLog.at(-1).automaticObjectStateCompletion=true;
  return session;
}

export function applyStarboxV3Action(sourceSession,action,{interactionPath='tap-direct'}={}){
  if(!STARBOX_V3_PATHS.includes(interactionPath))throw new Error(`Unsupported Starbox V3 path: ${interactionPath}`);
  const session=clone(sourceSession);
  if(!actionIdentityValid(session,action)){
    session.semanticErrors.push('v3-object-identity-mismatch');
    session.coreState.lastActionResult={accepted:false,neutral:true,code:'v3-object-identity-mismatch'};
    log(session,action,interactionPath,'v3-object-identity-mismatch',false);
    return session;
  }
  if(action.type==='scoop-ten-stars'){
    session.preparedPack={preparedPackId:`${session.problem.sourceQuestionId}:starbox:pack:10`,starIds:clone(action.starIds),count:10};
    session.coreState.lastActionResult={accepted:true,neutral:false,code:'ten-stars-scooped'};
    log(session,action,interactionPath,'ten-stars-scooped',true);
    return session;
  }
  let semanticAction;
  if(action.type==='combine-deliveries')semanticAction={type:'join'};
  else if(action.type==='seal-starbox')semanticAction={type:'bundle',count:10};
  else if(action.type==='fulfill-boxes')semanticAction={type:'unload',unit:'ten',count:action.count};
  else if(action.type==='open-starbox')semanticAction={type:'split',count:1};
  else if(action.type==='fulfill-stars')semanticAction={type:'unload',unit:'one',count:action.count};
  session.coreState=applyCarryBridgeAction(session.coreState,semanticAction);
  log(session,action,interactionPath,session.coreState.lastActionResult.code,session.coreState.lastActionResult.accepted,semanticAction);
  if(action.type==='seal-starbox'&&session.coreState.lastActionResult.accepted)session.preparedPack=null;
  return settle(session,interactionPath);
}

export function starboxV3Scene(session){
  const state=session?.coreState,problem=session?.problem;if(!state||!problem)throw new Error('Starbox V3 session required');
  if(state.complete)return {id:'success',focus:['finished-inventory','math-discovery-if-regroup'],purposeId:session.purposeId};
  if(problem.operation==='add'){
    if(!state.joined)return {id:'combine',focus:['delivery-a','delivery-b','inventory'],purposeId:session.purposeId};
    if(problem.expectedExchange.direction==='ones-to-tens'&&!session.preparedPack)return {id:'scoop-ten',focus:['ten-loose-stars','ten-slot-scoop'],purposeId:session.purposeId};
    if(problem.expectedExchange.direction==='ones-to-tens')return {id:'seal-box',focus:['ten-filled-slots','open-starbox'],purposeId:session.purposeId};
  }else{
    if(Number(state.remainingToUnload?.tens)>0)return {id:'fulfill-boxes',focus:['requested-boxes','order-zone'],purposeId:session.purposeId};
    if(Number(state.remainingToUnload?.ones)>Number(state.workspace?.ones))return {id:'open-box',focus:['one-openable-box','same-place-ten-stars'],purposeId:session.purposeId};
    if(Number(state.remainingToUnload?.ones)>0)return {id:'fulfill-stars',focus:['requested-stars','order-zone'],purposeId:session.purposeId};
  }
  return {id:'settle',focus:[],purposeId:session.purposeId};
}

export function markStarboxV3SupportUsed(sourceSession,reason='visual-hint'){
  const session=clone(sourceSession);session.supportUsed=true;if(!session.supportReasons.includes(reason))session.supportReasons.push(reason);return session;
}

export function starboxV3Hint(sceneId){
  const cue={combine:'move-deliveries-together','scoop-ten':'show-ten-slot-outline','seal-box':'pulse-filled-lid','fulfill-boxes':'pair-box-group-with-order','open-box':'pulse-single-openable-box','fulfill-stars':'pair-star-group-with-order'}[sceneId]||'pulse-current-object';
  return {sceneId,cue,revealsNumericAnswer:false,completesAction:false,returnsControl:true,disqualifiesIndependentAcquisition:true};
}

export function classifyStarboxV3Session(session){
  const complete=session?.coreState?.complete===true;
  const classification=classifyCarryBridgeAcquisition(session.problem,{outcome:complete?'correct':'miss',attemptKind:session.supportUsed?'hinted':'independent-first-try',actionTrace:session.coreState.actionTrace});
  if(session.semanticErrors.length){classification.independentAcquisitionEligible=false;classification.reasons=[...new Set([...classification.reasons,...session.semanticErrors])];classification.evidenceTags=[]}
  return classification;
}

const observedBehavior=Object.freeze({
  'add-no-regroup':'Combines two visible deliveries and reads the resulting tens and ones without an exchange.',
  'add-regroup':'Combines deliveries, groups exactly ten loose stars, and seals them as one value-preserving star box.',
  'sub-no-regroup':'Fulfills an order by removing the requested boxes and loose stars from the visible whole.',
  'sub-regroup':'Recognizes insufficient loose stock, opens exactly one box into ten stars, then fulfills the order.'
});

const gradeReason=Object.freeze({
  'add-no-regroup':'Grade 2A two-digit addition with place-value units and zero regrouping.',
  'add-regroup':'Grade 2A two-digit addition with a concrete 10 ones to 1 ten exchange.',
  'sub-no-regroup':'Grade 2A two-digit subtraction as removal from a whole with zero regrouping.',
  'sub-regroup':'Grade 2A two-digit subtraction with a concrete 1 ten to 10 ones exchange.'
});

export function starboxV3FounderReadback(session,{pageErrors=[]}={}){
  const classification=classifyStarboxV3Session(session),canClaim=classification.independentAcquisitionEligible?['candidate-independent-acquisition-observation']:[];
  return {
    schemaVersion:'3.0.0',surface:'hidden-starbox-v3-founder-review',problem:clone(session.problem),purposeId:session.purposeId,scene:starboxV3Scene(session),
    state:{complete:session.coreState.complete,workspace:clone(session.coreState.workspace),remainingToFulfill:clone(session.coreState.remainingToUnload),preparedPack:clone(session.preparedPack)},
    semanticActionTrace:clone(session.coreState.actionTrace),interactionLog:clone(session.interactionLog),supportUsed:session.supportUsed,supportReasons:clone(session.supportReasons),classification,
    learningPurpose:{targetSkillId:session.problem.skillId,behaviorObserved:observedBehavior[session.problem.caseRuleId],grade2AMathematics:gradeReason[session.problem.caseRuleId],evidenceCanClaim:canClaim,evidenceCannotClaim:['formal-mastery','retrieval','transfer','world-completion','reward','progression','production-ledger-write']},
    childLoop:{objectLanguage:{looseStar:1,sealedStarbox:10},answerInputPresent:false,progressiveDisclosure:true,completionSource:'object-state'},
    evidenceBoundary:boundary(),pageErrors:[...pageErrors]
  };
}

export function starboxV3Discovery(session){
  if(session?.coreState?.complete!==true)throw new Error('Starbox V3 discovery requires a completed object mission');
  const direction=session.problem.expectedExchange.direction;if(!direction)throw new Error('Math discovery is reserved for an observed exchange mission');
  const blueprint=bundleModelToVerticalBlueprint(carryBridgeBundleModel(session.problem));
  return {
    schemaVersion:'3.0.0',title:'數學發現',sourceQuestionId:session.problem.sourceQuestionId,skillId:'g2a.addsub.explain-vertical',
    objectBefore:direction==='ones-to-tens'?{sealedStarboxes:0,looseStars:10}:{sealedStarboxes:1,looseStars:0},
    objectAfter:direction==='ones-to-tens'?{sealedStarboxes:1,looseStars:0}:{sealedStarboxes:0,looseStars:10},
    statement:direction==='ones-to-tens'?'10 個一可以換成 1 個十':'打開 1 個十，就有 10 個一',
    vertical:{operation:blueprint.operation,operator:blueprint.operator,columns:clone(blueprint.columns)},compactConsequence:true,interactivePuzzle:false,evidenceBoundary:boundary()
  };
}

export function canonicalStarboxV3Actions(sourceSession){
  let session=clone(sourceSession);const actions=[];
  for(let guard=0;guard<8&&!session.coreState.complete;guard++){
    const scene=starboxV3Scene(session);let action;
    if(scene.id==='combine')action=starboxV3ActionFor(session,'combine-deliveries');
    else if(scene.id==='scoop-ten')action=starboxV3ActionFor(session,'scoop-ten-stars');
    else if(scene.id==='seal-box')action=starboxV3ActionFor(session,'seal-starbox');
    else if(scene.id==='fulfill-boxes')action=starboxV3ActionFor(session,'fulfill-boxes');
    else if(scene.id==='open-box')action=starboxV3ActionFor(session,'open-starbox');
    else if(scene.id==='fulfill-stars')action=starboxV3ActionFor(session,'fulfill-stars');
    else break;
    actions.push(action);session=applyStarboxV3Action(session,action);
  }
  return actions;
}

export function replayStarboxV3Actions(session,actions,{interactionPath='tap-direct'}={}){
  return actions.reduce((current,action)=>applyStarboxV3Action(current,action,{interactionPath}),session);
}

export function createStarboxV3RunPlan({seed=1}={}){
  const cleanSeed=Math.max(1,Math.trunc(Number(seed)||1)),rules=[...STARBOX_V3_RULES];
  return {schemaVersion:'3.0.0',surface:'hidden-starbox-v3-run',runId:`starbox-v3-run-${cleanSeed}`,seed:cleanSeed,length:4,rules,purposes:rules.map(rule=>STARBOX_V3_PURPOSES[rule]),missionSeeds:rules.map((_,index)=>cleanSeed*100+index+1),distinctPurposeCount:new Set(rules.map(rule=>STARBOX_V3_PURPOSES[rule])).size,evidenceBoundary:boundary()};
}

export function starboxV3NumberQuestReturnUrl({caseId='run',seed=1}={}){
  const params=new URLSearchParams({prototypeReturn:STARBOX_V3_FLAG,case:caseId,seed:String(Math.max(1,Math.trunc(Number(seed)||1)))});
  return `index.html?${params}`;
}

export function starboxV3ResumeUrl(search=''){
  const params=new URLSearchParams(String(search).replace(/^\?/,''));if(params.get('prototypeReturn')!==STARBOX_V3_FLAG)return null;
  const caseId=params.get('case')==='run'?'run':STARBOX_V3_RULES.includes(params.get('case'))?params.get('case'):'run',seed=Math.max(1,Math.trunc(Number(params.get('seed'))||1));
  return `starbox-v3.html?${new URLSearchParams({prototype:STARBOX_V3_FLAG,case:caseId,seed:String(seed)})}`;
}

export function starboxV3Boundary(){return {additionMaximum:99,subtractionMinimum:0,exact100Supported:false,normalHomeEntry:false,runLength:4,looseStarValue:1,sealedStarboxValue:10};}
