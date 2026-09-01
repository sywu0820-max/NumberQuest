import {TEN_CORE_BALL_IDS,TEN_CORE_FLAG,applyTenCoreAction,createTenCoreState,nextTenCoreEmptySlot,tenCoreAccessEnabled,tenCoreSnapshot} from './src/grade-2a-ten-core.mjs?v=0-1';

const $=id=>document.getElementById(id),balls=new Map(),slots=[],params=new URLSearchParams(location.search),founder=params.get('founder')==='1';
let state=createTenCoreState(),idleTimer=null,nativeDragId=null,nativeDropHandled=false,suppressTap=false;

function buildSurface(){
  for(let index=0;index<10;index++){const slot=document.createElement('div');slot.className='slot';slot.dataset.slot=String(index);slot.setAttribute('aria-label',`第 ${index+1} 格`);$('slots').append(slot);slots.push(slot)}
  for(const [index,id] of TEN_CORE_BALL_IDS.entries()){const ball=document.createElement('button');ball.type='button';ball.className='ball';ball.draggable=true;ball.dataset.ballId=id;ball.setAttribute('aria-label',`球 ${index+1}`);$('looseTray').append(ball);balls.set(id,ball);bindBall(ball)}
  for(const slot of slots)bindSlot(slot);
  $('tenFrame').addEventListener('click',event=>{if(event.target.closest('.ball'))return;if(state.grouped)openGroup()});
  $('tenFrame').addEventListener('keydown',event=>{if(state.grouped&&(event.key==='Enter'||event.key===' ')){event.preventDefault();openGroup()}});
  render();
}

function placed(ballId){return state.placements[ballId]!==null}
function rects(){return new Map([...balls].map(([id,ball])=>[id,ball.getBoundingClientRect()]))}
function animateFrom(previous){for(const [id,ball] of balls){const before=previous.get(id),after=ball.getBoundingClientRect();if(!before||!after.width)continue;const dx=before.left-after.left,dy=before.top-after.top;if(Math.abs(dx)<1&&Math.abs(dy)<1)continue;ball.classList.add('flip');ball.style.transform=`translate(${dx}px,${dy}px)`;requestAnimationFrame(()=>requestAnimationFrame(()=>{ball.style.transition='transform .48s cubic-bezier(.2,.78,.2,1)';ball.style.transform='';setTimeout(()=>{ball.classList.remove('flip');ball.style.transition=''},520)}))}}
function layout(previous=null){for(const id of TEN_CORE_BALL_IDS){const ball=balls.get(id),slot=state.placements[id];(slot===null?$('looseTray'):slots[slot]).append(ball)}if(previous)animateFrom(previous)}
function render(previous=null,flashSlot=null){layout(previous);const snapshot=tenCoreSnapshot(state);$('tenFrame').classList.toggle('grouped',snapshot.grouped);$('tenFrame').setAttribute('role',snapshot.grouped?'button':'group');$('tenFrame').tabIndex=snapshot.grouped?0:-1;$('tenFrame').setAttribute('aria-label',snapshot.grouped?'十顆球在同一個十格框；點一下打開':'透明十格框');$('tenLabel').hidden=!snapshot.showTenLabel;$('relation').hidden=!snapshot.showRelation;if(flashSlot!==null){slots[flashSlot].classList.remove('flash');requestAnimationFrame(()=>slots[flashSlot].classList.add('flash'));balls.get(TEN_CORE_BALL_IDS.find(id=>state.placements[id]===flashSlot))?.classList.add('settle');setTimeout(()=>{slots[flashSlot].classList.remove('flash');slots[flashSlot].querySelector('.ball')?.classList.remove('settle')},560)}if(founder)$('tenCoreDebug').textContent=JSON.stringify({...snapshot,pageErrors:window.__NQ_TEN_CORE_ERRORS__},null,2);scheduleIdleCue()}
function transition(action,{animate=false,flashSlot=null}={}){clearIdleCue();const previous=animate?rects():null,result=applyTenCoreAction(state,action);state=result.state;if(result.result.accepted||result.result.code==='outside-drop')render(previous,flashSlot);return result.result}
function place(ballId,slotIndex=nextTenCoreEmptySlot(state)){if(placed(ballId)||slotIndex===null)return;transition({type:'place-ball',ballId,slotIndex},{animate:true,flashSlot:slotIndex})}
function openGroup(){if(!state.grouped)return;transition({type:'open-group'},{animate:true})}
function outsideDrop(ball){transition({type:'outside-drop',ballId:ball.dataset.ballId});ball.classList.remove('settle');requestAnimationFrame(()=>ball.classList.add('settle'));setTimeout(()=>ball.classList.remove('settle'),460)}

function bindBall(ball){
  let start=null,last=null,moved=false;
  ball.addEventListener('click',event=>{event.stopPropagation();if(suppressTap){suppressTap=false;return}place(ball.dataset.ballId)});
  ball.addEventListener('pointerdown',event=>{if(placed(ball.dataset.ballId))return;start=last={x:event.clientX,y:event.clientY};moved=false;if(event.pointerType!=='mouse')ball.setPointerCapture?.(event.pointerId)});
  ball.addEventListener('pointermove',event=>{if(!start)return;last={x:event.clientX,y:event.clientY};if(Math.hypot(last.x-start.x,last.y-start.y)>10){moved=true;ball.classList.add('dragging')}});
  ball.addEventListener('pointerup',event=>{if(!start||nativeDragId)return;const end=moved&&last?last:{x:event.clientX,y:event.clientY},wasDrag=moved||Math.hypot(end.x-start.x,end.y-start.y)>24;start=last=null;ball.classList.remove('dragging');if(!wasDrag)return;const slot=document.elementFromPoint(end.x,end.y)?.closest('[data-slot]');suppressTap=true;if(slot&&!slot.querySelector('.ball'))place(ball.dataset.ballId,Number(slot.dataset.slot));else outsideDrop(ball)});
  ball.addEventListener('pointercancel',()=>{start=null;ball.classList.remove('dragging')});
  ball.addEventListener('dragstart',event=>{if(placed(ball.dataset.ballId)){event.preventDefault();return}nativeDragId=ball.dataset.ballId;nativeDropHandled=false;ball.classList.add('dragging');event.dataTransfer?.setData('text/plain',nativeDragId)});
  ball.addEventListener('dragend',()=>{ball.classList.remove('dragging');if(nativeDragId&&!nativeDropHandled)outsideDrop(ball);nativeDragId=null;nativeDropHandled=false});
}
function bindSlot(slot){slot.addEventListener('dragover',event=>{if(!slot.querySelector('.ball'))event.preventDefault()});slot.addEventListener('drop',event=>{event.preventDefault();const ballId=nativeDragId||event.dataTransfer?.getData('text/plain');if(!ballId||slot.querySelector('.ball'))return;nativeDropHandled=true;place(ballId,Number(slot.dataset.slot))})}
function clearIdleCue(){clearTimeout(idleTimer);document.querySelectorAll('.idle-cue').forEach(node=>node.classList.remove('idle-cue'))}
function scheduleIdleCue(){clearIdleCue();if(state.grouped)return;idleTimer=setTimeout(()=>{const ball=TEN_CORE_BALL_IDS.map(id=>balls.get(id)).find(node=>!placed(node.dataset.ballId)),slot=slots[nextTenCoreEmptySlot(state)];ball?.classList.add('idle-cue');slot?.classList.add('idle-cue')},4000)}

if('serviceWorker' in navigator)addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
if(!tenCoreAccessEnabled(location.search)){$('tenCoreApp').hidden=true}else buildSurface();
