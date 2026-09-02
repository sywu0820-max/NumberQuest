import {applyMakeTenAction,createMakeTenState,makeTenOverflowAccessEnabled,makeTenSnapshot} from './src/grade-2a-make-ten-overflow.mjs?v=0-1';

const $=id=>document.getElementById(id);
const params=new URLSearchParams(location.search);
const number=(key,fallback)=>Number.parseInt(params.get(key)||String(fallback),10);
const a=Math.max(1,Math.min(9,number('a',6)));
const b=Math.max(1,Math.min(9,number('b',7)));
const variant=Math.max(0,Math.min(9999,number('variant',0)));
const showLabel=params.get('label')!=='0';
const showSecondary=params.get('secondary')!=='0';
const founder=params.get('founder')==='1';
const reducedMotion=params.get('motion')==='reduce'||(params.get('motion')!=='full'&&matchMedia('(prefers-reduced-motion: reduce)').matches);
const balls=new Map(),sourceHomes=new Map(),slots=[];
let state;
try{state=createMakeTenState(a,b,variant)}catch{state=createMakeTenState(6,7,variant)}
let suppressTap=false,activeDrag=null,lastMotion='initial',meaningPhase='hidden',primaryTimer=null,secondaryTimer=null;

function build(){
  for(let i=0;i<10;i++){const slot=document.createElement('div');slot.className='slot';slot.dataset.slot=String(i);$('slots').append(slot);slots.push(slot)}
  for(const id of state.case.objectIds){
    const source=state.case.sourceAIds.includes(id)?'a':'b',home=document.createElement('span'),ball=document.createElement('button');
    home.className='source-home';home.dataset.homeId=id;home.dataset.source=source;$(source==='a'?'sourceA':'sourceB').append(home);sourceHomes.set(id,home);
    ball.type='button';ball.className='ball';ball.draggable=false;ball.dataset.objectId=id;ball.dataset.source=source;ball.setAttribute('aria-label','球');home.append(ball);bind(ball);balls.set(id,ball);
  }
  $('sourceACount').textContent=String(state.case.sourceA);$('sourceBCount').textContent=String(state.case.sourceB);
  $('frame').addEventListener('click',event=>{if(event.target.closest('.ball'))return;if(state.grouped)openGroup()});
  $('frame').addEventListener('keydown',event=>{if(state.grouped&&(event.key==='Enter'||event.key===' ')){event.preventDefault();openGroup()}});
  render();$('app').hidden=false;
}

function targetFor(id){const at=state.selectedIds.indexOf(id);return at<0?sourceHomes.get(id):at<10?slots[at]:$('overflow')}
function render(){
  for(const id of state.case.objectIds){const ball=balls.get(id),target=targetFor(id);if(ball.parentElement!==target)target.append(ball)}
  const snap=makeTenSnapshot(state,{showLabel});
  $('frame').classList.toggle('ready',!snap.grouped&&snap.selectedCount===10);
  $('frame').classList.toggle('grouped',snap.grouped);
  $('frame').tabIndex=snap.grouped?0:-1;
  $('frame').setAttribute('role',snap.grouped?'button':'group');
  $('frame').setAttribute('aria-label',snap.grouped?'一個十；點一下打開':'透明十格框');
  const primaryVisible=snap.showRelation&&(meaningPhase==='primary'||meaningPhase==='secondary'),secondaryVisible=snap.showRelation&&showSecondary&&meaningPhase==='secondary';
  $('meaning').hidden=!primaryVisible;$('relation').textContent=primaryVisible?snap.primaryRelation:'';$('sourceRelation').hidden=!secondaryVisible;$('sourceRelation').textContent=secondaryVisible?snap.secondaryRelation:'';
  if(founder)$('debug').textContent=JSON.stringify({...snap,nodeIds:[...balls.keys()],homeIds:[...sourceHomes.keys()],motion:{reduced:reducedMotion,last:lastMotion,active:activeDrag?.id||null},meaning:{phase:meaningPhase,primaryVisible,secondaryVisible,primary:snap.primaryRelation,secondary:snap.secondaryRelation},pageErrors:window.__NQ_MAKE_TEN_ERRORS__});
}

function rewindMeaning(){clearTimeout(primaryTimer);clearTimeout(secondaryTimer);primaryTimer=secondaryTimer=null;meaningPhase='hidden'}
function beginMeaningReveal(){
  rewindMeaning();if(!showLabel||!state.grouped){render();return}
  if(reducedMotion){meaningPhase=showSecondary?'secondary':'primary';render();return}
  primaryTimer=setTimeout(()=>{if(!state.grouped)return;meaningPhase='primary';render();if(showSecondary)secondaryTimer=setTimeout(()=>{if(state.grouped){meaningPhase='secondary';render()}},520)},1100);
}

function rect(node){const r=node.getBoundingClientRect();return {left:r.left,top:r.top,width:r.width,height:r.height}}
function clearLift(ball){ball.classList.remove('dragging');for(const key of ['left','top','width','height'])ball.style[key]=''}
function flip(ball,before,{kind='settling',delay=0}={}){
  const after=rect(ball),dx=before.left-after.left,dy=before.top-after.top,sx=before.width&&after.width?before.width/after.width:1,sy=before.height&&after.height?before.height/after.height:1;
  if(reducedMotion||Math.abs(dx)+Math.abs(dy)<1){ball.classList.remove(kind);return Promise.resolve()}
  ball.classList.add(kind);
  const animation=ball.animate([{transform:`translate(${dx}px,${dy}px) scale(${sx},${sy})`},{transform:'translate(0,0) scale(1)'}],{duration:kind==='returning'?420:500,delay,easing:kind==='returning'?'cubic-bezier(.22,.78,.25,1.08)':'cubic-bezier(.18,.86,.22,1.12)'});
  return animation.finished.catch(()=>{}).finally(()=>ball.classList.remove(kind));
}
function transition(action){const out=applyMakeTenAction(state,action);state=out.state;return out}
function maybeGroup(){
  if(state.grouped||state.selectedIds.length!==10)return false;
  const out=transition({type:'group-selection'});render();
  if(out.result.accepted){lastMotion='exact-ten-gather';animateGrouping(out.result.objectIds);beginMeaningReveal();return true}
  return false;
}
function animateGrouping(ids){
  const frameRect=rect($('frame')),cx=frameRect.left+frameRect.width/2,cy=frameRect.top+frameRect.height/2;
  $('frame').classList.add('gathering');
  if(!reducedMotion)ids.forEach((id,index)=>{const ball=balls.get(id),r=rect(ball),dx=(cx-(r.left+r.width/2))*.22,dy=(cy-(r.top+r.height/2))*.22;ball.animate([{transform:'translate(0,0) scale(1)'},{transform:`translate(${dx}px,${dy}px) scale(.84)`,offset:.42},{transform:'translate(0,0) scale(1)'}],{duration:560,delay:index*18,easing:'cubic-bezier(.2,.78,.2,1)'})});
  setTimeout(()=>$('frame').classList.remove('gathering'),reducedMotion?0:760);
}
function selectWithFallback(id,method){
  if(state.grouped)return;
  const ball=balls.get(id),before=rect(ball),out=transition({type:'toggle-object',objectId:id});render();
  if(out.result.accepted){lastMotion=method;flip(ball,before);maybeGroup();render()}
}
function openGroup(){
  if(!state.grouped)return;
  rewindMeaning();const moving=[...state.selectedIds],before=new Map(moving.map(id=>[id,rect(balls.get(id))])),out=transition({type:'open-group'});lastMotion='release-ten';render();
  if(out.result.accepted){$('frame').classList.add('releasing');moving.forEach((id,index)=>flip(balls.get(id),before.get(id),{delay:index*18}));setTimeout(()=>$('frame').classList.remove('releasing'),reducedMotion?0:720)}
  render();
}
function lift(ball,event){
  ball.getAnimations().forEach(animation=>animation.cancel());
  const start=rect(ball);activeDrag={id:ball.dataset.objectId,pointerId:event.pointerId,start,last:{x:event.clientX,y:event.clientY},offsetX:event.clientX-start.left,offsetY:event.clientY-start.top,moved:false,wasSelected:state.selectedIds.includes(ball.dataset.objectId)};
  try{ball.setPointerCapture?.(event.pointerId)}catch{}
}
function follow(ball,event){
  if(!activeDrag||activeDrag.id!==ball.dataset.objectId)return;
  activeDrag.last={x:event.clientX,y:event.clientY};
  if(!activeDrag.moved&&Math.hypot(event.clientX-activeDrag.start.left-activeDrag.offsetX,event.clientY-activeDrag.start.top-activeDrag.offsetY)<=8)return;
  if(!activeDrag.moved){activeDrag.moved=true;ball.classList.add('dragging');ball.style.width=`${activeDrag.start.width}px`;ball.style.height=`${activeDrag.start.height}px`}
  ball.style.left=`${event.clientX-activeDrag.offsetX}px`;ball.style.top=`${event.clientY-activeDrag.offsetY}px`;
  if(founder)render();
}
function finishDrag(ball,event,{cancelled=false}={}){
  if(!activeDrag||activeDrag.id!==ball.dataset.objectId)return;
  const drag=activeDrag;activeDrag=null;
  if(!drag.moved){clearLift(ball);return}
  const before=rect(ball),hit=cancelled?null:document.elementFromPoint(event.clientX??drag.last.x,event.clientY??drag.last.y),source=hit?.closest('.source'),overFrame=!!hit?.closest('#frame');
  const validIntoFrame=!drag.wasSelected&&overFrame,validHome=drag.wasSelected&&source?.id===(ball.dataset.source==='a'?'sourceA':'sourceB');
  suppressTap=true;clearLift(ball);
  if(validIntoFrame||validHome){const out=transition({type:'toggle-object',objectId:drag.id});lastMotion=validIntoFrame?'drag-to-frame':'drag-to-source';render();if(out.result.accepted)flip(ball,before).then(()=>{maybeGroup();render()});if(state.selectedIds.length===10)maybeGroup()}
  else{lastMotion=cancelled?'drag-cancel-return':'outside-return';render();flip(ball,before,{kind:'returning'})}
  render();
}
function bind(ball){
  ball.addEventListener('click',event=>{event.stopPropagation();if(suppressTap){suppressTap=false;return}selectWithFallback(ball.dataset.objectId,'tap-fallback')});
  ball.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();selectWithFallback(ball.dataset.objectId,'keyboard-fallback')}});
  ball.addEventListener('pointerdown',event=>{if(state.grouped)return;lift(ball,event)});
  ball.addEventListener('pointermove',event=>follow(ball,event));
  ball.addEventListener('pointerup',event=>finishDrag(ball,event));
  ball.addEventListener('pointercancel',event=>finishDrag(ball,event,{cancelled:true}));
  ball.addEventListener('lostpointercapture',event=>{if(activeDrag?.id===ball.dataset.objectId)finishDrag(ball,event,{cancelled:true})});
}

if('serviceWorker' in navigator)addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
if(makeTenOverflowAccessEnabled(location.search))build();
