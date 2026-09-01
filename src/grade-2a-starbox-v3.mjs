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
const groupId=(problem,scene,unit,count)=>`${problem.sourceQuestionId}:starbox:group:${scene}:${unit}:${count}`;
const digits=value=>({tens:Math.floor(Number(value)/10),ones:Number(value)%10});
const boundary=()=>({ledgerWritePerformed:false,formalMasteryClaimed:false,persisted:false,transferClaimed:false,worldCompletionClaimed:false,progressionWritePerformed:false,rewardWritePerformed:false});

export function starboxV3AccessEnabled(search=''){
  const params=new URLSearchParams(String(search).replace(/^\?/,''));
  return params.get('prototype')===STARBOX_V3_FLAG;
}

export function createStarboxV3Session(caseRuleId,{rng=Math.random,sourceNonce=0}={}){
  if(!STARBOX_V3_RULES.includes(caseRuleId))throw new Error(`Unsupported Starbox V3 rule: ${caseRuleId}`);
  let problem=makeCarryBridgeCase(caseRuleId,{rng,sourceNonce});
  if(problem.operation==='subtract')for(let attempt=1;attempt<=64;attempt++){
    const left=digits(problem.left),right=digits(problem.right),choiceRich=left.tens>right.tens&&right.ones>0&&(caseRuleId==='sub-regroup'||left.ones>right.ones);
    if(choiceRich)break;
    problem=makeCarryBridgeCase(caseRuleId,{rng,sourceNonce:Number(sourceNonce)+attempt});
  }
  return {
    schemaVersion:'3.1.0',surface:'hidden-starbox-v3-founder-review',problem,coreState:createCarryBridgeActionState(problem),
    purposeId:STARBOX_V3_PURPOSES[caseRuleId],preparedPack:null,deliveredIds:[],interactionLog:[],supportUsed:false,supportReasons:[],discoveryViewed:false,semanticErrors:[],
    evidenceBoundary:boundary()
  };
}

function ids(problem,unit,count){return Array.from({length:count},(_,index)=>objectId(problem,unit,index))}

const targetIds=Object.freeze({inventory:'inventory','packing-tray':'packing-tray',sealer:'sealer','order-zone':'order-zone','opening-station':'opening-station','return-shelf':'return-shelf',outside:'outside'});

function rotated(problem,items){
  const score=[...problem.sourceQuestionId].reduce((total,character)=>total+character.charCodeAt(0),0),offset=score%items.length;
  return [...items.slice(offset),...items.slice(0,offset)];
}

export function starboxV3Choices(session){
  const problem=session?.problem,state=session?.coreState,scene=starboxV3Scene(session);if(!problem||!state)throw new Error('Starbox V3 session required');
  let sources=[],targets=[];
  if(scene.id==='combine'){
    sources=[0,1].filter(index=>!session.deliveredIds.includes(objectId(problem,'delivery',index))).map(index=>({id:objectId(problem,'delivery',index),kind:'delivery',value:index===0?problem.left:problem.right,label:index===0?'第一批':'第二批'}));
    targets=[{id:targetIds.inventory,label:'中央庫存'},{id:targetIds['packing-tray'],label:'裝箱托盤'}];
  }else if(scene.id==='scoop-ten'){
    sources=rotated(problem,[8,9,10]).map(count=>({id:groupId(problem,scene.id,'one',count),kind:'one-group',count,label:'圈選星星'}));
    targets=[{id:targetIds['packing-tray'],label:'十格托盤'},{id:targetIds['return-shelf'],label:'退回架'}];
  }else if(scene.id==='seal-box'){
    sources=[{id:groupId(problem,scene.id,'tray',10),kind:'filled-tray',count:10,label:'裝滿的托盤'}];
    targets=[{id:targetIds.sealer,label:'封箱機'},{id:targetIds.inventory,label:'中央庫存'}];
  }else if(scene.id==='fulfill-boxes'||scene.id==='fulfill-stars'){
    const unit=scene.id==='fulfill-boxes'?'ten':'one',key=unit==='ten'?'tens':'ones',expected=Number(state.remainingToUnload[key]),available=Number(state.workspace[key]);
    const counts=[expected,expected+1,expected-1].filter((count,index,array)=>count>0&&count<=available&&array.indexOf(count)===index);
    sources=rotated(problem,counts).map(count=>({id:groupId(problem,scene.id,unit,count),kind:unit==='ten'?'box-group':'one-group',count,label:unit==='ten'?'一組星箱':'一組散星'}));
    targets=[{id:targetIds['order-zone'],label:'訂單區'},{id:targetIds['return-shelf'],label:'退回架'}];
  }else if(scene.id==='open-box'){
    const counts=[1,2].filter(count=>count<=Number(state.workspace.tens));
    sources=counts.map(count=>({id:groupId(problem,scene.id,'ten',count),kind:'box-group',count,label:'要打開的星箱'}));
    targets=[{id:targetIds['opening-station'],label:'開箱台'},{id:targetIds['order-zone'],label:'訂單區'}];
  }
  return {sceneId:scene.id,sources:clone(sources),targets:clone(targets)};
}

export function starboxV3ActionFor(session,type,{count=null,sourceId=null,targetId=null}={}){
  const problem=session?.problem,state=session?.coreState;if(!problem||!state)throw new Error('Starbox V3 session required');
  const scene=starboxV3Scene(session),choices=starboxV3Choices(session);
  if(type==='move-delivery'){
    const source=sourceId||choices.sources[0]?.id;return {type,sourceId:source,targetId:targetId||targetIds.inventory,deliveryId:source};
  }
  if(type==='scoop-ten-stars'){
    const amount=Math.max(0,Math.trunc(Number(count??10)||0));return {type,sourceId:sourceId||groupId(problem,scene.id,'one',amount),targetId:targetId||targetIds['packing-tray'],count:amount,starIds:ids(problem,'loose',Math.min(amount,Number(state.workspace?.ones)||0))};
  }
  if(type==='seal-starbox')return {type,sourceId:sourceId||groupId(problem,scene.id,'tray',10),targetId:targetId||targetIds.sealer,preparedPackId:`${problem.sourceQuestionId}:starbox:pack:10`,starIds:clone(session.preparedPack?.starIds||[])};
  if(type==='fulfill-boxes'){
    const amount=Math.max(0,Math.trunc(Number(count??state.remainingToUnload?.tens)||0));
    return {type,sourceId:sourceId||groupId(problem,scene.id,'ten',amount),targetId:targetId||targetIds['order-zone'],count:amount,boxIds:ids(problem,'box',Math.min(amount,Number(state.workspace?.tens)||0))};
  }
  if(type==='open-starbox'){
    const amount=Math.max(0,Math.trunc(Number(count??1)||0));return {type,sourceId:sourceId||groupId(problem,scene.id,'ten',amount),targetId:targetId||targetIds['opening-station'],count:amount,boxIds:ids(problem,'box',Math.min(amount,Number(state.workspace?.tens)||0))};
  }
  if(type==='fulfill-stars'){
    const amount=Math.max(0,Math.trunc(Number(count??state.remainingToUnload?.ones)||0));
    return {type,sourceId:sourceId||groupId(problem,scene.id,'one',amount),targetId:targetId||targetIds['order-zone'],count:amount,starIds:ids(problem,'loose',Math.min(amount,Number(state.workspace?.ones)||0))};
  }
  if(type==='outside-drop')return {type,sourceId,targetId:targetIds.outside};
  throw new Error(`Unknown Starbox V3 action: ${type}`);
}

function exactIds(actual,expected){return Array.isArray(actual)&&actual.length===expected.length&&actual.every((id,index)=>id===expected[index])}

function decision(session,action){
  const state=session.coreState,scene=starboxV3Scene(session),choices=starboxV3Choices(session),knownSource=choices.sources.some(source=>source.id===action?.sourceId),knownTarget=choices.targets.some(target=>target.id===action?.targetId);
  if(action?.targetId===targetIds.outside)return {valid:false,code:'outside-drop',motorOnly:true};
  if(!knownSource)return {valid:false,code:'v3-object-identity-mismatch',semanticError:true};
  const expectedType={combine:'move-delivery','scoop-ten':'scoop-ten-stars','seal-box':'seal-starbox','fulfill-boxes':'fulfill-boxes','open-box':'open-starbox','fulfill-stars':'fulfill-stars'}[scene.id];
  if(action.type!==expectedType||(action.type==='move-delivery'&&action.deliveryId!==action.sourceId))return {valid:false,code:'v3-object-identity-mismatch',semanticError:true};
  if(!knownTarget)return {valid:false,code:'v3-target-identity-mismatch',semanticError:true};
  const correctTarget={combine:targetIds.inventory,'scoop-ten':targetIds['packing-tray'],'seal-box':targetIds.sealer,'fulfill-boxes':targetIds['order-zone'],'open-box':targetIds['opening-station'],'fulfill-stars':targetIds['order-zone']}[scene.id];
  if(action.targetId!==correctTarget)return {valid:false,code:'v3-wrong-target-choice',semanticError:true};
  const expectedCount={'scoop-ten':10,'fulfill-boxes':Number(state.remainingToUnload?.tens),'open-box':1,'fulfill-stars':Number(state.remainingToUnload?.ones)}[scene.id];
  if(expectedCount!=null&&Number(action.count)!==expectedCount)return {valid:false,code:'v3-wrong-quantity-choice',semanticError:true};
  if(action.type==='move-delivery'&&session.deliveredIds.includes(action.deliveryId))return {valid:false,code:'delivery-already-arrived'};
  if(action.type==='scoop-ten-stars'&&!exactIds(action.starIds,ids(session.problem,'loose',10)))return {valid:false,code:'v3-object-identity-mismatch',semanticError:true};
  if(action.type==='seal-starbox'&&!(session.preparedPack?.preparedPackId===action.preparedPackId&&exactIds(action.starIds,session.preparedPack.starIds)))return {valid:false,code:'v3-object-identity-mismatch',semanticError:true};
  return {valid:true,code:'valid-visible-object-decision'};
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
  const checked=decision(session,action);
  if(!checked.valid){
    if(checked.semanticError&&!session.semanticErrors.includes(checked.code))session.semanticErrors.push(checked.code);
    session.coreState.lastActionResult={accepted:false,neutral:true,code:checked.code};
    log(session,action,interactionPath,checked.code,false);
    if(checked.motorOnly)session.interactionLog.at(-1).motorNoiseOnly=true;
    return session;
  }
  if(action.type==='move-delivery'){
    session.deliveredIds.push(action.deliveryId);
    if(session.deliveredIds.length<2){session.coreState.lastActionResult={accepted:true,neutral:false,code:'delivery-arrived'};log(session,action,interactionPath,'delivery-arrived',true);return session}
    const semanticAction={type:'join'};session.coreState=applyCarryBridgeAction(session.coreState,semanticAction);log(session,action,interactionPath,session.coreState.lastActionResult.code,session.coreState.lastActionResult.accepted,semanticAction);return settle(session,interactionPath);
  }
  if(action.type==='scoop-ten-stars'){
    session.preparedPack={preparedPackId:`${session.problem.sourceQuestionId}:starbox:pack:10`,starIds:clone(action.starIds),count:10};
    session.coreState.lastActionResult={accepted:true,neutral:false,code:'ten-stars-scooped'};
    log(session,action,interactionPath,'ten-stars-scooped',true);
    return session;
  }
  let semanticAction;
  if(action.type==='seal-starbox')semanticAction={type:'bundle',count:10};
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
  const choiceEvidence=starboxV3ChoiceEvidence(session);
  if(!choiceEvidence.complete){classification.independentAcquisitionEligible=false;classification.reasons=[...new Set([...classification.reasons,'v3-visible-choice-trace-required'])];classification.evidenceTags=[]}
  if(session.semanticErrors.length){classification.independentAcquisitionEligible=false;classification.reasons=[...new Set([...classification.reasons,...session.semanticErrors])];classification.evidenceTags=[]}
  return classification;
}

export function starboxV3ChoiceEvidence(session){
  const accepted=(session?.interactionLog||[]).filter(item=>item.accepted),rule=session?.problem?.caseRuleId;
  const deliveries=new Set(accepted.filter(item=>item.action.type==='move-delivery').map(item=>item.action.deliveryId)).size;
  const has=type=>accepted.some(item=>item.action.type===type);
  const required=rule?.startsWith('add')?['two-visible-deliveries',...(rule==='add-regroup'?['chosen-ten-group','chosen-sealer']:[])]:['chosen-box-quantity',...(rule==='sub-regroup'?['chosen-opening-transformation']:[]),'chosen-star-quantity'];
  const observed={
    'two-visible-deliveries':deliveries===2,'chosen-ten-group':has('scoop-ten-stars'),'chosen-sealer':has('seal-starbox'),
    'chosen-box-quantity':has('fulfill-boxes'),'chosen-opening-transformation':has('open-starbox'),'chosen-star-quantity':Number(digits(session?.problem?.right||0).ones)===0||has('fulfill-stars')
  };
  return {required,observed,complete:required.every(key=>observed[key]===true),visibleObjectsWereControls:true,validDestinationRequired:true};
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
    schemaVersion:'3.1.0',surface:'hidden-starbox-v3-founder-review',problem:clone(session.problem),purposeId:session.purposeId,scene:starboxV3Scene(session),
    state:{complete:session.coreState.complete,workspace:clone(session.coreState.workspace),remainingToFulfill:clone(session.coreState.remainingToUnload),preparedPack:clone(session.preparedPack),deliveredIds:clone(session.deliveredIds)},
    semanticActionTrace:clone(session.coreState.actionTrace),interactionLog:clone(session.interactionLog),supportUsed:session.supportUsed,supportReasons:clone(session.supportReasons),classification,
    learningPurpose:{targetSkillId:session.problem.skillId,behaviorObserved:observedBehavior[session.problem.caseRuleId],grade2AMathematics:gradeReason[session.problem.caseRuleId],evidenceCanClaim:canClaim,evidenceCannotClaim:['formal-mastery','retrieval','transfer','world-completion','reward','progression','production-ledger-write']},
    childLoop:{objectLanguage:{looseStar:1,sealedStarbox:10},answerInputPresent:false,progressiveDisclosure:true,completionSource:'object-state',choiceEvidence:starboxV3ChoiceEvidence(session)},
    evidenceBoundary:boundary(),pageErrors:[...pageErrors]
  };
}

export function starboxV3Discovery(session){
  if(session?.coreState?.complete!==true)throw new Error('Starbox V3 discovery requires a completed object mission');
  const direction=session.problem.expectedExchange.direction;if(!direction)throw new Error('Math discovery is reserved for an observed exchange mission');
  const blueprint=bundleModelToVerticalBlueprint(carryBridgeBundleModel(session.problem));
  return {
    schemaVersion:'3.1.0',title:'數學發現',sourceQuestionId:session.problem.sourceQuestionId,skillId:'g2a.addsub.explain-vertical',
    objectBefore:direction==='ones-to-tens'?{sealedStarboxes:0,looseStars:10}:{sealedStarboxes:1,looseStars:0},
    objectAfter:direction==='ones-to-tens'?{sealedStarboxes:1,looseStars:0}:{sealedStarboxes:0,looseStars:10},
    statement:direction==='ones-to-tens'?'10 個一可以換成 1 個十':'打開 1 個十，就有 10 個一',
    vertical:{operation:blueprint.operation,operator:blueprint.operator,columns:clone(blueprint.columns)},compactConsequence:true,interactivePuzzle:false,evidenceBoundary:boundary()
  };
}

export function canonicalStarboxV3Actions(sourceSession){
  let session=clone(sourceSession);const actions=[];
  for(let guard=0;guard<12&&!session.coreState.complete;guard++){
    const scene=starboxV3Scene(session);let action;
    if(scene.id==='combine')action=starboxV3ActionFor(session,'move-delivery');
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
  return {schemaVersion:'3.1.0',surface:'hidden-starbox-v3-run',runId:`starbox-v3-run-${cleanSeed}`,seed:cleanSeed,length:4,rules,purposes:rules.map(rule=>STARBOX_V3_PURPOSES[rule]),missionSeeds:rules.map((_,index)=>cleanSeed*100+index+1),distinctPurposeCount:new Set(rules.map(rule=>STARBOX_V3_PURPOSES[rule])).size,evidenceBoundary:boundary()};
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
