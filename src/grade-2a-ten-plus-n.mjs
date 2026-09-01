import {TEN_CORE_BALL_IDS,applyTenCoreAction,createTenCoreState,tenCoreSnapshot,validateTenCoreState} from './grade-2a-ten-core.mjs';

export const TEN_PLUS_N_FLAG='ten-plus-n-v0';
export const TEN_PLUS_N_EXTRA_IDS=Object.freeze(Array.from({length:9},(_,index)=>`ten-plus-extra-${String(index+1).padStart(2,'0')}`));
const clone=value=>JSON.parse(JSON.stringify(value));

export function tenPlusNAccessEnabled(search=''){
  const params=new URLSearchParams(String(search).replace(/^\?/,''));
  return params.get('prototype')===TEN_PLUS_N_FLAG;
}

export function tenPlusNCountFromSearch(search=''){
  const value=Number(new URLSearchParams(String(search).replace(/^\?/,'' )).get('n'));
  return Number.isInteger(value)&&value>=0&&value<=9?value:4;
}

export function createTenPlusNState(extraCount=4){
  if(!Number.isInteger(extraCount)||extraCount<0||extraCount>9)throw new Error('Invalid extra count');
  let core=createTenCoreState();
  for(let index=0;index<10;index++)core=applyTenCoreAction(core,{type:'place-ball',ballId:TEN_CORE_BALL_IDS[index],slotIndex:index}).state;
  return {schemaVersion:'0.1.0',core,extraCount,extraIds:TEN_PLUS_N_EXTRA_IDS.slice(0,extraCount)};
}

export function validateTenPlusNState(state){
  const extraCount=state?.extraCount,extraIds=Array.isArray(state?.extraIds)?state.extraIds:[];
  const shapeValid=state?.schemaVersion==='0.1.0'&&Number.isInteger(extraCount)&&extraCount>=0&&extraCount<=9;
  const extrasValid=shapeValid&&extraIds.length===extraCount&&extraIds.every((id,index)=>id===TEN_PLUS_N_EXTRA_IDS[index])&&new Set(extraIds).size===extraIds.length;
  const coreValidation=validateTenCoreState(state?.core);
  return {valid:shapeValid&&extrasValid&&coreValidation.valid,shapeValid,extrasValid,coreValid:coreValidation.valid,extraCount,quantity:10+(Number.isInteger(extraCount)?extraCount:0)};
}

export function applyTenPlusNAction(sourceState,action){
  if(!validateTenPlusNState(sourceState).valid)throw new Error('Invalid Ten-Plus-N state');
  const state=clone(sourceState);
  if(action?.type==='open-ten'){
    const result=applyTenCoreAction(state.core,{type:'open-group'});state.core=result.state;return {state,result:result.result};
  }
  if(action?.type==='place-core'){
    const result=applyTenCoreAction(state.core,{type:'place-ball',ballId:action.ballId,slotIndex:action.slotIndex});state.core=result.state;return {state,result:result.result};
  }
  if(action?.type==='outside-drop'){
    const result=applyTenCoreAction(state.core,{type:'outside-drop',ballId:action.ballId});state.core=result.state;return {state,result:result.result};
  }
  return {state,result:{accepted:false,neutral:true,code:'unknown-action'}};
}

export function tenPlusNSnapshot(state){
  const validation=validateTenPlusNState(state);if(!validation.valid)throw new Error('Invalid Ten-Plus-N state');
  const core=tenCoreSnapshot(state.core),total=10+state.extraCount;
  return {schemaVersion:'0.1.0',surface:'hidden-ten-plus-n-composer-v0',coreBallIds:[...core.ballIds],extraIds:[...state.extraIds],corePlacements:clone(core.placements),coreGrouped:core.grouped,corePlacedCount:core.placedCount,extraCount:state.extraCount,totalQuantity:total,showNumeral:core.grouped,numeral:core.grouped?String(total):null,zeroPlaceholderVisible:false,writes:{storage:false,ledger:false,mastery:false,retrieval:false,transfer:false,progression:false,reward:false,worldCompletion:false}};
}
