export const CARRY_BRIDGE_WORLD_ID='world.carry-bridge';
export const CARRY_BRIDGE_SKILLS=Object.freeze([
  'g2a.add.no-regroup-100','g2a.add.regroup-100','g2a.sub.no-regroup-100','g2a.sub.regroup-100','g2a.addsub.explain-vertical'
]);

export const CARRY_BRIDGE_REPRESENTATIONS=Object.freeze({
  bundle:Object.freeze({representationId:'base-ten-workbench',representationFamily:'base-ten-manipulatives'}),
  blueprint:Object.freeze({representationId:'vertical-place-value-blueprint',representationFamily:'vertical-notation'})
});

export const CARRY_BRIDGE_CASE_RULES=Object.freeze({
  'add-no-regroup':Object.freeze({skillId:'g2a.add.no-regroup-100',operation:'add',missionFamilyId:'carry-join-loads',expectedExchange:null,caseTags:Object.freeze(['no-regroup'])}),
  'add-regroup':Object.freeze({skillId:'g2a.add.regroup-100',operation:'add',missionFamilyId:'carry-join-loads',expectedExchange:'ones-to-tens',caseTags:Object.freeze(['regrouping-sensitive','ones-to-tens-regrouping'])}),
  'sub-no-regroup':Object.freeze({skillId:'g2a.sub.no-regroup-100',operation:'subtract',missionFamilyId:'carry-repair-by-unloading',expectedExchange:null,caseTags:Object.freeze(['no-regroup'])}),
  'sub-regroup':Object.freeze({skillId:'g2a.sub.regroup-100',operation:'subtract',missionFamilyId:'carry-repair-by-unloading',expectedExchange:'tens-to-ones',caseTags:Object.freeze(['regrouping-sensitive','tens-to-ones-exchange'])})
});

const TRACE_TAGS=Object.freeze({
  zero:'observed-zero-exchange',add:'observed-one-ones-to-tens-exchange',subtract:'observed-one-tens-to-ones-exchange',preserved:'observed-value-preserving-exchange'
});
const CASE_RULE_IDS=Object.freeze(Object.keys(CARRY_BRIDGE_CASE_RULES));
const candidateCache=new Map();
const clampRoll=rng=>Math.min(.999999999,Math.max(0,Number(rng())||0));
const whole=value=>Number.isInteger(value)&&value>=0;
const digits=value=>({tens:Math.floor(value/10),ones:value%10});
const valueOf=parts=>Number(parts?.tens)*10+Number(parts?.ones);
const operandKey=(left,right)=>`${left}:${right}`;
const clone=value=>JSON.parse(JSON.stringify(value));

function stableHash(value){
  let hash=2166136261;
  for(const character of String(value)){hash^=character.charCodeAt(0);hash=Math.imul(hash,16777619)}
  return (hash>>>0).toString(36);
}

function objectiveCase(ruleId,left,right){
  const rule=CARRY_BRIDGE_CASE_RULES[ruleId];
  if(!rule||!Number.isInteger(left)||!Number.isInteger(right)||left<10||left>99||right<10||right>99)return null;
  const leftDigits=digits(left),rightDigits=digits(right),onesRelation=leftDigits.ones+rightDigits.ones,result=rule.operation==='add'?left+right:left-right;
  let valid=false,boundary=false;
  if(ruleId==='add-no-regroup'){
    valid=result<=99&&onesRelation<=9&&leftDigits.tens+rightDigits.tens<=9;
    boundary=onesRelation===9||result>=90;
  }else if(ruleId==='add-regroup'){
    valid=result<=99&&onesRelation>=10;
    boundary=onesRelation===10||result>=90;
  }else if(ruleId==='sub-no-regroup'){
    valid=left>=right&&leftDigits.ones>=rightDigits.ones;
    boundary=leftDigits.ones-rightDigits.ones===0||result<=10;
  }else if(ruleId==='sub-regroup'){
    valid=left>=right&&leftDigits.ones<rightDigits.ones;
    boundary=rightDigits.ones-leftDigits.ones===1||result<=10;
  }
  if(!valid||result<0||result>99)return null;
  const objectivePredicates=[rule.operation==='add'?'addition-at-most-99':'subtraction-nonnegative',rule.expectedExchange?`requires-${rule.expectedExchange}`:'requires-zero-exchanges'];
  if(boundary)objectivePredicates.push('boundary');
  return {rule,leftDigits,rightDigits,result,boundary,objectivePredicates};
}

function candidatesFor(ruleId){
  if(candidateCache.has(ruleId))return candidateCache.get(ruleId);
  if(!CARRY_BRIDGE_CASE_RULES[ruleId])throw new Error(`Unknown Carry Bridge case rule: ${ruleId}`);
  const candidates=[];
  for(let left=10;left<=99;left++)for(let right=10;right<=99;right++)if(objectiveCase(ruleId,left,right))candidates.push([left,right]);
  candidateCache.set(ruleId,candidates);
  return candidates;
}

function expectedExchangeMetadata(direction){
  if(direction==='ones-to-tens')return {direction,inputUnit:'one',inputUnitCount:10,outputUnit:'ten',outputUnitCount:1,count:1};
  if(direction==='tens-to-ones')return {direction,inputUnit:'ten',inputUnitCount:1,outputUnit:'one',outputUnitCount:10,count:1};
  return {direction:null,count:0};
}

function buildCase(ruleId,left,right,sourceNonce=0){
  const objective=objectiveCase(ruleId,left,right);
  if(!objective)throw new Error(`Operands ${left}, ${right} do not satisfy ${ruleId}`);
  const sourceQuestionId=`carry-question-${stableHash(`${ruleId}:${left}:${right}:${sourceNonce}`)}`;
  return {
    schemaVersion:'1.0.0',worldId:CARRY_BRIDGE_WORLD_ID,caseRuleId:ruleId,missionFamilyId:objective.rule.missionFamilyId,
    skillId:objective.rule.skillId,operation:objective.rule.operation,left,right,answer:objective.result,sourceNonce,sourceQuestionId,
    objectivePredicates:[...objective.objectivePredicates],boundary:objective.boundary,expectedExchange:expectedExchangeMetadata(objective.rule.expectedExchange),
    bounds:{additionMaximum:99,subtractionMinimum:0,exact100Supported:false}
  };
}

export function makeCarryBridgeCase(caseRuleId,{rng=Math.random,sourceNonce=0,excludeOperandKey=null}={}){
  const candidates=candidatesFor(caseRuleId);
  let index=Math.floor(clampRoll(rng)*candidates.length);
  if(excludeOperandKey&&operandKey(...candidates[index])===excludeOperandKey)index=(index+1)%candidates.length;
  const [left,right]=candidates[index];
  return buildCase(caseRuleId,left,right,Math.max(0,Math.trunc(Number(sourceNonce)||0)));
}

export function validateCarryBridgeCase(problem){
  const errors=[];
  if(!problem||typeof problem!=='object')return {valid:false,errors:['case-required']};
  const objective=objectiveCase(problem.caseRuleId,Number(problem.left),Number(problem.right));
  if(!objective)errors.push('case-predicates-invalid');
  if(objective&&Number(problem.answer)!==objective.result)errors.push('answer-mismatch');
  if(objective&&problem.skillId!==objective.rule.skillId)errors.push('skill-mismatch');
  if(objective&&problem.operation!==objective.rule.operation)errors.push('operation-mismatch');
  if(Number(problem.answer)===100||problem?.bounds?.exact100Supported===true)errors.push('exact-100-unsupported');
  if(objective){
    const supplied=new Set(Array.isArray(problem.objectivePredicates)?problem.objectivePredicates:[]);
    const exact=new Set(objective.objectivePredicates);
    if(supplied.size!==exact.size||[...supplied].some(item=>!exact.has(item)))errors.push('objective-predicate-metadata-mismatch');
  }
  return {valid:errors.length===0,errors,objective};
}

function initialState(problem){
  const validation=validateCarryBridgeCase(problem);
  if(!validation.valid)throw new Error(`Invalid Carry Bridge case: ${validation.errors.join(', ')}`);
  return {
    schemaVersion:'1.0.0',problem:clone(problem),operation:problem.operation,phase:'active',joined:false,
    workspace:problem.operation==='subtract'?digits(problem.left):null,
    remainingToUnload:problem.operation==='subtract'?digits(problem.right):null,
    actionTrace:[],signals:[],complete:false,numericCorrect:false,lastActionResult:null
  };
}

export function createCarryBridgeActionState(problem){return initialState(problem)}

function result(state,action,{accepted=false,neutral=!accepted,code,effect=null,signal=null,exchange=null}={}){
  const before=state.workspace?valueOf(state.workspace):null;
  const entry={index:state.actionTrace.length,sourceQuestionId:state.problem.sourceQuestionId,caseRuleId:state.problem.caseRuleId,type:action?.type||'unknown',action:clone(action||{}),accepted:Boolean(accepted),neutral:Boolean(neutral),code:code||'invalid-action',valueBefore:before,valueAfter:before};
  if(exchange)Object.assign(entry,exchange);
  if(effect)effect(entry);
  state.actionTrace.push(entry);
  if(signal&&!state.signals.includes(signal))state.signals.push(signal);
  state.lastActionResult={accepted:entry.accepted,neutral:entry.neutral,code:entry.code};
  return state;
}

function acceptedExchangeCount(state,direction){return state.actionTrace.filter(item=>item.accepted&&item.direction===direction&&(item.type==='bundle'||item.type==='split')).length}

export function applyCarryBridgeAction(sourceState,action){
  const state=clone(sourceState);
  if(state.complete)return result(state,action,{code:'mission-already-complete'});
  const type=action?.type,problem=state.problem,rule=CARRY_BRIDGE_CASE_RULES[problem.caseRuleId];

  if(type==='place'){
    const aligned=(action.unit==='one'&&action.lane==='ones')||(action.unit==='ten'&&action.lane==='tens');
    return result(state,action,{accepted:aligned,code:aligned?'place-aligned':'place-value-misalignment',signal:aligned?null:'add-align'});
  }
  if(type==='join'){
    if(problem.operation!=='add')return result(state,action,{code:'join-not-valid-for-subtraction'});
    if(state.joined)return result(state,action,{code:'loads-already-joined'});
    return result(state,action,{accepted:true,code:'loads-joined',effect:entry=>{
      state.workspace={tens:digits(problem.left).tens+digits(problem.right).tens,ones:digits(problem.left).ones+digits(problem.right).ones};state.joined=true;entry.valueAfter=valueOf(state.workspace);
    }});
  }
  if(type==='bundle'){
    const exchange={direction:'ones-to-tens',inputUnit:'one',inputUnitCount:Number(action.count),outputUnit:'ten',outputUnitCount:1,valuePreserved:false};
    if(rule.expectedExchange===null)return result(state,action,{code:'unnecessary-exchange',exchange});
    if(rule.expectedExchange!=='ones-to-tens')return result(state,action,{code:'wrong-exchange-direction',exchange});
    if(Number(action.count)!==10)return result(state,action,{code:'invalid-exchange-unit-count',exchange});
    if(!state.workspace||state.workspace.ones<10)return result(state,action,{code:'insufficient-ones-for-exchange',exchange});
    return result(state,action,{accepted:true,code:'ones-bundled-to-ten',exchange,effect:entry=>{
      const before=valueOf(state.workspace);state.workspace.ones-=10;state.workspace.tens+=1;entry.valueAfter=valueOf(state.workspace);entry.valuePreserved=before===entry.valueAfter;
    }});
  }
  if(type==='split'){
    const exchange={direction:'tens-to-ones',inputUnit:'ten',inputUnitCount:Number(action.count),outputUnit:'one',outputUnitCount:10,valuePreserved:false};
    if(rule.expectedExchange===null)return result(state,action,{code:'unnecessary-exchange',exchange});
    if(rule.expectedExchange!=='tens-to-ones')return result(state,action,{code:'wrong-exchange-direction',exchange});
    if(Number(action.count)!==1)return result(state,action,{code:'invalid-exchange-unit-count',exchange});
    if(!state.workspace||state.workspace.tens<1)return result(state,action,{code:'insufficient-tens-for-exchange',exchange});
    return result(state,action,{accepted:true,code:'ten-split-to-ones',exchange,effect:entry=>{
      const before=valueOf(state.workspace);state.workspace.tens-=1;state.workspace.ones+=10;entry.valueAfter=valueOf(state.workspace);entry.valuePreserved=before===entry.valueAfter;
    }});
  }
  if(type==='unload'){
    if(problem.operation!=='subtract')return result(state,action,{code:'unload-not-valid-for-addition'});
    if(action.strategy==='smaller-digit-first')return result(state,action,{code:'smaller-digit-first',signal:'sub-direction'});
    const key=action.unit==='ten'?'tens':action.unit==='one'?'ones':null,count=Number(action.count);
    if(!key||!Number.isInteger(count)||count<=0)return result(state,action,{code:'invalid-unload-action'});
    if(count>state.remainingToUnload[key])return result(state,action,{code:'unload-exceeds-target'});
    if(count>state.workspace[key])return result(state,action,{code:key==='ones'?'exchange-required':'insufficient-load'});
    return result(state,action,{accepted:true,code:`${action.unit}s-unloaded`,effect:entry=>{
      state.workspace[key]-=count;state.remainingToUnload[key]-=count;entry.valueAfter=valueOf(state.workspace);
    }});
  }
  if(type==='write-carry'){
    const explained=acceptedExchangeCount(state,'ones-to-tens')===1;
    return result(state,action,{accepted:explained,code:explained?'carry-grounded-in-exchange':'unexplained-carry',signal:explained?null:'add-carry-value'});
  }
  if(type==='write-borrow'){
    const explained=acceptedExchangeCount(state,'tens-to-ones')===1;
    return result(state,action,{accepted:explained,code:explained?'borrow-grounded-in-exchange':'unexplained-borrow',signal:explained?null:'sub-borrow-value'});
  }
  if(type==='submit'){
    const numericCorrect=Number(action.answer)===Number(problem.answer);state.numericCorrect=numericCorrect;
    const expectedDirection=rule.expectedExchange,exchangeReady=expectedDirection===null||acceptedExchangeCount(state,expectedDirection)===1;
    const workspaceReady=state.workspace&&valueOf(state.workspace)===problem.answer&&state.workspace.ones>=0&&state.workspace.ones<=9;
    const operationReady=problem.operation==='add'?state.joined&&workspaceReady:workspaceReady&&valueOf(state.remainingToUnload)===0;
    const complete=numericCorrect&&exchangeReady&&operationReady;
    return result(state,action,{accepted:complete,code:complete?'mission-complete':numericCorrect?'semantic-action-incomplete':'numeric-answer-incorrect',effect:entry=>{state.complete=complete;state.phase=complete?'complete':'active';entry.valueAfter=state.workspace?valueOf(state.workspace):null}});
  }
  return result(state,action,{code:'unknown-semantic-action'});
}

function exchangeAttempts(trace){return (Array.isArray(trace)?trace:[]).filter(item=>item?.type==='bundle'||item?.type==='split')}

export function classifyCarryBridgeAcquisition(problem,{outcome='miss',attemptKind='miss',actionTrace=[]}={}){
  const validation=validateCarryBridgeCase(problem),reasons=[];
  if(!validation.valid)reasons.push(...validation.errors);
  if(outcome!=='correct')reasons.push('successful-outcome-required');
  if(attemptKind!=='independent-first-try')reasons.push('independent-first-try-required');
  const suppliedTrace=Array.isArray(actionTrace)?actionTrace:[],identityValid=suppliedTrace.every(item=>item?.sourceQuestionId===problem?.sourceQuestionId&&item?.caseRuleId===problem?.caseRuleId);
  if(!identityValid)reasons.push('trace-source-identity-mismatch');
  let replayed=null;
  try{replayed=replayCarryBridgeActions(problem,suppliedTrace)}catch{reasons.push('semantic-trace-invalid')}
  const semanticFields=['type','accepted','neutral','code','valueBefore','valueAfter','direction','inputUnit','inputUnitCount','outputUnit','outputUnitCount','valuePreserved'];
  const traceMatchesReplay=Boolean(replayed)&&replayed.actionTrace.length===suppliedTrace.length&&suppliedTrace.every((item,index)=>semanticFields.every(field=>(item?.[field]??null)===(replayed.actionTrace[index]?.[field]??null)));
  if(!traceMatchesReplay||!replayed?.complete||replayed?.numericCorrect!==true)reasons.push('semantic-trace-not-complete');
  const rule=CARRY_BRIDGE_CASE_RULES[problem?.caseRuleId],attempts=exchangeAttempts(actionTrace);
  let traceEligible=false;
  if(rule?.expectedExchange===null){
    traceEligible=attempts.length===0;
    if(!traceEligible)reasons.push('no-regroup-requires-zero-exchanges');
  }else{
    const expected=expectedExchangeMetadata(rule?.expectedExchange),entry=attempts[0];
    const expectedType=expected.direction==='ones-to-tens'?'bundle':'split',expectedCode=expected.direction==='ones-to-tens'?'ones-bundled-to-ten':'ten-split-to-ones';
    traceEligible=attempts.length===1&&entry?.type===expectedType&&entry?.code===expectedCode&&entry?.accepted===true&&entry?.direction===expected.direction&&entry?.inputUnit===expected.inputUnit&&entry?.inputUnitCount===expected.inputUnitCount&&entry?.outputUnit===expected.outputUnit&&entry?.outputUnitCount===expected.outputUnitCount&&entry?.valuePreserved===true&&Number(entry?.valueBefore)===Number(entry?.valueAfter);
    if(!traceEligible)reasons.push('exact-observed-exchange-required');
  }
  const eligible=reasons.length===0&&traceEligible,tags=[];
  if(eligible){
    tags.push(...rule.caseTags);
    if(validation.objective.boundary)tags.push('boundary');
    if(rule.expectedExchange===null)tags.push(TRACE_TAGS.zero);
    else tags.push(rule.operation==='add'?TRACE_TAGS.add:TRACE_TAGS.subtract,TRACE_TAGS.preserved);
  }
  return {
    skillId:problem?.skillId||null,caseRuleId:problem?.caseRuleId||null,independentAcquisitionEligible:eligible,evidenceTags:tags,
    reasons:[...new Set(reasons)],traceSummary:{exchangeAttemptCount:attempts.length,acceptedExchangeCount:attempts.filter(item=>item.accepted).length,observedDirections:attempts.map(item=>item.direction),rawGestureCoordinatesStored:false},
    ledgerWritePerformed:false,formalMasteryClaimed:false
  };
}

export function carryBridgeBundleModel(problem){
  const validation=validateCarryBridgeCase(problem);
  if(!validation.valid)throw new Error(`Invalid Carry Bridge case: ${validation.errors.join(', ')}`);
  const left=digits(problem.left),right=digits(problem.right),resultDigits=digits(problem.answer),rule=CARRY_BRIDGE_CASE_RULES[problem.caseRuleId];
  let beforeExchange,afterExchange;
  if(rule.operation==='add'){
    beforeExchange={tens:left.tens+right.tens,ones:left.ones+right.ones};
    afterExchange=rule.expectedExchange?{tens:beforeExchange.tens+1,ones:beforeExchange.ones-10}:{...beforeExchange};
  }else{
    beforeExchange={...left};afterExchange=rule.expectedExchange?{tens:left.tens-1,ones:left.ones+10}:{...left};
  }
  return {
    schemaVersion:'1.0.0',worldId:CARRY_BRIDGE_WORLD_ID,caseRuleId:problem.caseRuleId,skillId:problem.skillId,operation:problem.operation,
    sourceQuestionId:problem.sourceQuestionId,representationId:CARRY_BRIDGE_REPRESENTATIONS.bundle.representationId,representationFamily:CARRY_BRIDGE_REPRESENTATIONS.bundle.representationFamily,
    operands:{left,right},beforeExchange,afterExchange,result:resultDigits,exchange:rule.expectedExchange?expectedExchangeMetadata(rule.expectedExchange):null
  };
}

export function bundleModelToVerticalBlueprint(model){
  if(model?.representationFamily!==CARRY_BRIDGE_REPRESENTATIONS.bundle.representationFamily)throw new Error('Bundle model must use base-ten-manipulatives');
  const left=valueOf(model.operands?.left),right=valueOf(model.operands?.right),problem=buildCase(model.caseRuleId,left,right,0);
  if(problem.sourceQuestionId!==model.sourceQuestionId)problem.sourceQuestionId=model.sourceQuestionId;
  const expected=carryBridgeBundleModel(problem);
  if(JSON.stringify({...model,sourceQuestionId:expected.sourceQuestionId})!==JSON.stringify(expected))throw new Error('Bundle model does not match its arithmetic case');
  return {
    schemaVersion:'1.0.0',worldId:CARRY_BRIDGE_WORLD_ID,caseRuleId:model.caseRuleId,skillId:model.skillId,operation:model.operation,sourceQuestionId:model.sourceQuestionId,
    representationId:CARRY_BRIDGE_REPRESENTATIONS.blueprint.representationId,representationFamily:CARRY_BRIDGE_REPRESENTATIONS.blueprint.representationFamily,
    columns:{tens:{top:model.operands.left.tens,bottom:model.operands.right.tens,result:model.result.tens},ones:{top:model.operands.left.ones,bottom:model.operands.right.ones,result:model.result.ones}},
    operator:model.operation==='add'?'+':'−',exchange:model.exchange?{...model.exchange,before:{...model.beforeExchange},after:{...model.afterExchange}}:null
  };
}

export function verticalBlueprintToBundleModel(blueprint){
  if(blueprint?.representationFamily!==CARRY_BRIDGE_REPRESENTATIONS.blueprint.representationFamily)throw new Error('Blueprint must use vertical-notation');
  const left=Number(blueprint.columns?.tens?.top)*10+Number(blueprint.columns?.ones?.top),right=Number(blueprint.columns?.tens?.bottom)*10+Number(blueprint.columns?.ones?.bottom);
  const problem=buildCase(blueprint.caseRuleId,left,right,0);problem.sourceQuestionId=blueprint.sourceQuestionId;
  const model=carryBridgeBundleModel(problem),expected=bundleModelToVerticalBlueprint(model);
  if(JSON.stringify(blueprint)!==JSON.stringify(expected))throw new Error('Blueprint does not preserve the case value and exchange meaning');
  return model;
}

export function carryBridgeMisconceptionSignals(problem,actionTrace=[]){
  const signals=new Set();
  for(const item of actionTrace){
    if(item?.code==='place-value-misalignment')signals.add('add-align');
    if(item?.code==='smaller-digit-first')signals.add('sub-direction');
    if(item?.code==='unexplained-carry')signals.add('add-carry-value');
    if(item?.code==='unexplained-borrow')signals.add('sub-borrow-value');
  }
  const rule=CARRY_BRIDGE_CASE_RULES[problem?.caseRuleId],attempts=exchangeAttempts(actionTrace);
  if(rule?.expectedExchange==='ones-to-tens'&&!attempts.some(item=>item.accepted&&item.direction==='ones-to-tens'))signals.add('add-carry-value');
  if(rule?.expectedExchange==='tens-to-ones'&&!attempts.some(item=>item.accepted&&item.direction==='tens-to-ones'))signals.add('sub-borrow-value');
  return [...signals];
}

const HINTS=Object.freeze({
  'add-align':Object.freeze(['notice-the-tens-and-ones-lanes','place-one-unit-in-the-ones-lane','return-control-before-filling-the-lane']),
  'add-carry-value':Object.freeze(['select-exactly-ten-ones','bind-them-as-one-ten','return-control-with-the-new-ten-unplaced']),
  'sub-direction':Object.freeze(['keep-the-starting-whole-visible','remove-from-that-whole','return-control-before-showing-the-remainder']),
  'sub-borrow-value':Object.freeze(['open-one-ten','count-the-ten-released-ones','return-control-before-removal-continues'])
});

export function carryBridgeHint(signalId){
  const steps=HINTS[signalId];
  if(!steps)return null;
  return {signalId,steps:[...steps],revealsAnswer:false,completesAnswer:false,returnsControl:true};
}

export function freshCarryBridgeRetry(problem,{rng=Math.random}={}){
  const next=makeCarryBridgeCase(problem.caseRuleId,{rng,sourceNonce:Number(problem.sourceNonce)+1,excludeOperandKey:operandKey(problem.left,problem.right)});
  return {...next,retryOfSourceQuestionId:problem.sourceQuestionId};
}

export function solveCarryBridgeCase(problem){
  let state=createCarryBridgeActionState(problem);
  if(problem.operation==='add'){
    state=applyCarryBridgeAction(state,{type:'join'});
    if(problem.expectedExchange.direction==='ones-to-tens')state=applyCarryBridgeAction(state,{type:'bundle',count:10});
  }else{
    if(problem.expectedExchange.direction==='tens-to-ones')state=applyCarryBridgeAction(state,{type:'split',count:1});
    const right=digits(problem.right);
    if(right.tens)state=applyCarryBridgeAction(state,{type:'unload',unit:'ten',count:right.tens});
    if(right.ones)state=applyCarryBridgeAction(state,{type:'unload',unit:'one',count:right.ones});
  }
  return applyCarryBridgeAction(state,{type:'submit',answer:problem.answer});
}

export function replayCarryBridgeActions(problem,sourceTrace=[]){
  let state=createCarryBridgeActionState(problem);
  for(const entry of sourceTrace)state=applyCarryBridgeAction(state,entry?.action||entry);
  return state;
}

export function carryBridgeCaseRuleIds(){return [...CASE_RULE_IDS]}
