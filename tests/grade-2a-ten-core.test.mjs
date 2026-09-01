import test from 'node:test';
import assert from 'node:assert/strict';
import {TEN_CORE_BALL_IDS,TEN_CORE_RELATION,applyTenCoreAction,createTenCoreState,nextTenCoreEmptySlot,tenCoreAccessEnabled,tenCoreSnapshot,validateTenCoreState} from '../src/grade-2a-ten-core.mjs';

const place=(state,ballId,slotIndex)=>applyTenCoreAction(state,{type:'place-ball',ballId,slotIndex}).state;

test('hidden access requires the exact Ten-Core prototype flag',()=>{
  assert.equal(tenCoreAccessEnabled('?prototype=ten-core-v0'),true);for(const search of ['', '?prototype=1','?prototype=starbox-v3','?ten-core-v0=1'])assert.equal(tenCoreAccessEnabled(search),false);
});

test('exactly ten stable identities exist in every valid state',()=>{
  const state=createTenCoreState(),snapshot=tenCoreSnapshot(state);assert.equal(TEN_CORE_BALL_IDS.length,10);assert.equal(new Set(TEN_CORE_BALL_IDS).size,10);assert.deepEqual(snapshot.ballIds,TEN_CORE_BALL_IDS);assert.equal(snapshot.ballCount,10);assert.equal(snapshot.placedCount,0);assert.equal(snapshot.looseCount,10);
});

test('count stays ten through scattered, partial, grouped, and reopened states',()=>{
  let state=createTenCoreState();for(let index=0;index<10;index++){state=place(state,TEN_CORE_BALL_IDS[index],9-index);const snapshot=tenCoreSnapshot(state);assert.equal(snapshot.ballCount,10);assert.equal(snapshot.placedCount,index+1);assert.equal(snapshot.looseCount,9-index);assert.equal(snapshot.grouped,index===9);assert.equal(snapshot.showTenLabel,index===9);assert.equal(snapshot.showRelation,index===9)}
  const groupedIds=[...tenCoreSnapshot(state).ballIds],opened=applyTenCoreAction(state,{type:'open-group'});assert.equal(opened.result.accepted,true);assert.equal(tenCoreSnapshot(opened.state).placedCount,0);assert.equal(tenCoreSnapshot(opened.state).grouped,false);assert.deepEqual(tenCoreSnapshot(opened.state).ballIds,groupedIds);
});

test('the 10 label and relation cannot appear before all ten balls are inside',()=>{
  let state=createTenCoreState();for(let index=0;index<9;index++)state=place(state,TEN_CORE_BALL_IDS[index],index);const nine=tenCoreSnapshot(state);assert.equal(nine.placedCount,9);assert.equal(nine.grouped,false);assert.equal(nine.showTenLabel,false);assert.equal(nine.showRelation,false);assert.equal(nine.relation,TEN_CORE_RELATION);
  const forged=structuredClone(state);forged.grouped=true;assert.equal(validateTenCoreState(forged).valid,false);assert.throws(()=>tenCoreSnapshot(forged),/Invalid/);
});

test('outside drops preserve the complete source state without mutation',()=>{
  let state=createTenCoreState();state=place(state,TEN_CORE_BALL_IDS[0],4);const before=structuredClone(state),result=applyTenCoreAction(state,{type:'outside-drop',ballId:TEN_CORE_BALL_IDS[1]});assert.deepEqual(state,before);assert.deepEqual(result.state,before);assert.deepEqual(result.result,{accepted:false,neutral:true,code:'outside-drop',statePreserved:true});
});

test('invalid identities, occupied slots, repeated balls, and premature opening stay neutral',()=>{
  const fresh=createTenCoreState();for(const action of [{type:'place-ball',ballId:'foreign',slotIndex:0},{type:'place-ball',ballId:TEN_CORE_BALL_IDS[0],slotIndex:20},{type:'open-group'}]){const result=applyTenCoreAction(fresh,action);assert.equal(result.result.neutral,true);assert.deepEqual(result.state,fresh)}
  const once=place(fresh,TEN_CORE_BALL_IDS[0],0);for(const action of [{type:'place-ball',ballId:TEN_CORE_BALL_IDS[1],slotIndex:0},{type:'place-ball',ballId:TEN_CORE_BALL_IDS[0],slotIndex:1}]){const result=applyTenCoreAction(once,action);assert.equal(result.result.neutral,true);assert.deepEqual(result.state,once)}
});

test('malformed placement and state shapes are structurally rejected',()=>{
  const malformed=[];
  for(const invalidValue of ['0',-1,10,1.5,undefined]){const state=createTenCoreState();state.placements[TEN_CORE_BALL_IDS[0]]=invalidValue;malformed.push(state)}
  {const state=createTenCoreState();state.grouped='yes';malformed.push(state)}
  {const state=createTenCoreState();state.schemaVersion='0.0.0';malformed.push(state)}
  {const state=createTenCoreState();state.ballIds.reverse();malformed.push(state)}
  for(const state of malformed){assert.equal(validateTenCoreState(state).valid,false);assert.throws(()=>tenCoreSnapshot(state),/Invalid/);assert.throws(()=>applyTenCoreAction(state,{type:'outside-drop'}),/Invalid/)}
});

test('tap-style next-empty placement cycles reversibly across varied orders',()=>{
  for(let cycle=0;cycle<500;cycle++){let state=createTenCoreState();const shift=cycle%10,rotated=[...TEN_CORE_BALL_IDS.slice(shift),...TEN_CORE_BALL_IDS.slice(0,shift)],order=cycle%2?rotated.reverse():rotated;for(const id of order){const slot=nextTenCoreEmptySlot(state);assert.notEqual(slot,null);state=place(state,id,slot)}assert.equal(tenCoreSnapshot(state).grouped,true);const opened=applyTenCoreAction(state,{type:'open-group'}).state;assert.deepEqual(opened.ballIds,TEN_CORE_BALL_IDS);assert.equal(tenCoreSnapshot(opened).looseCount,10)}
});

test('snapshot explicitly denies every runtime learning write',()=>{
  const writes=tenCoreSnapshot(createTenCoreState()).writes;assert.deepEqual(writes,{storage:false,ledger:false,mastery:false,retrieval:false,transfer:false,progression:false,reward:false,worldCompletion:false});
});
