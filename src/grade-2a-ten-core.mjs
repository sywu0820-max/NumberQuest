export const TEN_CORE_FLAG='ten-core-v0';
export const TEN_CORE_RELATION='10 個一 = 1 個十';
export const TEN_CORE_BALL_IDS=Object.freeze(Array.from({length:10},(_,index)=>`ten-core-ball-${String(index+1).padStart(2,'0')}`));

const clone=value=>JSON.parse(JSON.stringify(value));
const cleanSlot=value=>Number.isInteger(value)&&value>=0&&value<10?value:null;

export function tenCoreAccessEnabled(search=''){
  const params=new URLSearchParams(String(search).replace(/^\?/,''));
  return params.get('prototype')===TEN_CORE_FLAG;
}

export function createTenCoreState(){
  return {schemaVersion:'0.1.0',ballIds:[...TEN_CORE_BALL_IDS],placements:Object.fromEntries(TEN_CORE_BALL_IDS.map(id=>[id,null])),grouped:false};
}

export function validateTenCoreState(state){
  const ids=Array.isArray(state?.ballIds)?state.ballIds:[],identitySet=new Set(ids),knownIds=ids.length===10&&identitySet.size===10&&TEN_CORE_BALL_IDS.every((id,index)=>ids[index]===id),stateShapeValid=state?.schemaVersion==='0.1.0'&&typeof state?.grouped==='boolean';
  const placements=state?.placements&&typeof state.placements==='object'?state.placements:{},placementKeys=Object.keys(placements),placementValuesValid=placementKeys.every(id=>placements[id]===null||cleanSlot(placements[id])!==null),slots=ids.map(id=>cleanSlot(placements[id])).filter(slot=>slot!==null),allPlacementsKnown=placementKeys.length===10&&placementKeys.every(id=>identitySet.has(id));
  const placedCount=slots.length,slotsUnique=new Set(slots).size===slots.length,groupedConsistent=state?.grouped===true?placedCount===10:placedCount<10;
  return {valid:stateShapeValid&&knownIds&&allPlacementsKnown&&placementValuesValid&&slotsUnique&&groupedConsistent,stateShapeValid,knownIds,allPlacementsKnown,placementValuesValid,slotsUnique,groupedConsistent,ballCount:ids.length,placedCount,looseCount:ids.length-placedCount,grouped:state?.grouped===true};
}

export function nextTenCoreEmptySlot(state){
  const occupied=new Set(Object.values(state?.placements||{}).map(cleanSlot).filter(slot=>slot!==null));
  for(let slot=0;slot<10;slot++)if(!occupied.has(slot))return slot;
  return null;
}

export function applyTenCoreAction(sourceState,action){
  const validation=validateTenCoreState(sourceState);
  if(!validation.valid)throw new Error('Invalid Ten-Core state');
  const state=clone(sourceState),type=action?.type;
  if(type==='outside-drop')return {state,result:{accepted:false,neutral:true,code:'outside-drop',statePreserved:true}};
  if(type==='open-group'){
    if(!state.grouped)return {state,result:{accepted:false,neutral:true,code:'group-not-closed'}};
    for(const id of state.ballIds)state.placements[id]=null;
    state.grouped=false;
    return {state,result:{accepted:true,neutral:false,code:'same-ten-reopened',ballIds:[...state.ballIds]}};
  }
  if(type!=='place-ball')return {state,result:{accepted:false,neutral:true,code:'unknown-action'}};
  const ballId=String(action.ballId||''),slot=action.slotIndex==null?nextTenCoreEmptySlot(state):cleanSlot(action.slotIndex);
  if(!state.ballIds.includes(ballId))return {state,result:{accepted:false,neutral:true,code:'unknown-ball'}};
  if(state.grouped)return {state,result:{accepted:false,neutral:true,code:'group-already-closed'}};
  if(state.placements[ballId]!==null)return {state,result:{accepted:false,neutral:true,code:'ball-already-placed'}};
  if(slot===null)return {state,result:{accepted:false,neutral:true,code:'invalid-slot'}};
  if(Object.values(state.placements).includes(slot))return {state,result:{accepted:false,neutral:true,code:'slot-occupied'}};
  state.placements[ballId]=slot;
  const placedCount=Object.values(state.placements).filter(value=>value!==null).length;
  state.grouped=placedCount===10;
  return {state,result:{accepted:true,neutral:false,code:state.grouped?'same-ten-grouped':'same-ball-placed',ballId,slotIndex:slot,placedCount,grouped:state.grouped}};
}

export function tenCoreSnapshot(state){
  const validation=validateTenCoreState(state);
  if(!validation.valid)throw new Error('Invalid Ten-Core state');
  return {
    schemaVersion:'0.1.0',surface:'hidden-ten-core-microtoy-v0',ballIds:[...state.ballIds],placements:clone(state.placements),ballCount:validation.ballCount,placedCount:validation.placedCount,looseCount:validation.looseCount,grouped:state.grouped,
    showTenLabel:state.grouped&&validation.placedCount===10,showRelation:state.grouped&&validation.placedCount===10,relation:TEN_CORE_RELATION,
    writes:{storage:false,ledger:false,mastery:false,retrieval:false,transfer:false,progression:false,reward:false,worldCompletion:false}
  };
}
