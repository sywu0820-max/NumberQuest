import {
  CARRY_BRIDGE_V2_RULES,
  carryBridgeV2ActionFor,
  applyCarryBridgeV2Action,
  carryBridgeV2AccessEnabled,
  carryBridgeV2Blueprint,
  carryBridgeV2DebugReadback,
  carryBridgeV2Scene,
  carryBridgeV2TenSelection,
  createCarryBridgeV2Session
} from './src/grade-2a-carry-bridge-v2.mjs?v=v2-2';

const $=id=>document.getElementById(id);
const params=new URLSearchParams(location.search);
const enabled=carryBridgeV2AccessEnabled(location.search);
const founder=params.get('founder')==='1'||params.get('debug')==='1';
let seed=Math.max(1,Math.trunc(Number(params.get('seed'))||1));
let session=null,arrivedLoads=new Set(),selectedOnes=[],pointerDrag=null,feedbackTimer=null,idleTimer=null,transforming=false,soundOn=true;
const seeded=value=>()=>((value=Math.imul(value,1664525)+1013904223>>>0)/4294967296);
const queryRule=()=>CARRY_BRIDGE_V2_RULES.includes(params.get('case'))?params.get('case'):'add-regroup';
const numberParts=value=>({tens:Math.floor(value/10),ones:value%10});

if(enabled){
  $('prototypeGate').hidden=true;
  $('prototypeApp').hidden=false;
  $('founderPanel').hidden=!founder;
  startCase(queryRule());
}

function playTone(kind='move'){
  if(!soundOn)return;
  try{
    const context=new AudioContext(),oscillator=context.createOscillator(),gain=context.createGain();
    oscillator.frequency.value=kind==='complete'?660:kind==='exchange'?520:360;
    gain.gain.setValueAtTime(.035,context.currentTime);gain.gain.exponentialRampToValueAtTime(.001,context.currentTime+.12);
    oscillator.connect(gain).connect(context.destination);oscillator.start();oscillator.stop(context.currentTime+.13);
  }catch{}
}

function startCase(ruleId,{sameSeed=false}={}){
  const caseSeed=sameSeed?Math.max(1,seed-1):seed++;
  session=createCarryBridgeV2Session(ruleId,{rng:seeded(caseSeed),sourceNonce:caseSeed});
  arrivedLoads=new Set();selectedOnes=[];transforming=false;
  $('caseRuleSelect').value=ruleId;
  $('playScene').hidden=false;$('blueprintScene').hidden=true;
  showFeedback('',false);render();
}

function cargoPreview(value){
  const parts=numberParts(value),root=document.createElement('span');root.className='cargo-preview';
  for(let index=0;index<parts.tens;index++){const item=document.createElement('i');item.className='mini-ten';root.append(item)}
  for(let index=0;index<parts.ones;index++){const item=document.createElement('i');item.className='mini-one';root.append(item)}
  const count=document.createElement('b');count.className='cargo-count';count.textContent=String(value);root.append(count);return root;
}

function renderMerge(){
  const problem=session.problem;
  for(const [id,value,index] of [['cargoA',problem.left,0],['cargoB',problem.right,1]]){
    const node=$(id);node.innerHTML='';node.append(cargoPreview(value));node.classList.toggle('arrived',arrivedLoads.has(index));node.dataset.dragType='load';node.dataset.index=String(index);bindPointer(node,{type:'load',index});
  }
  $('mergeBridge').dataset.dropTarget='merge';
}

function cargoUnit(unit,index,{available=false}={}){
  const button=document.createElement('button');button.type='button';button.className=`cargo-unit ${unit}${available?' available':' inert'}${unit==='one'&&selectedOnes.includes(index)?' selected':''}`;
  button.setAttribute('aria-label',unit==='ten'?`一個十${available?'，點一下操作':''}`:`一個一${available?'，點一下操作':''}`);
  button.textContent=unit==='ten'?'10':'1';button.dataset.unit=unit;button.dataset.index=String(index);
  if(available){
    button.addEventListener('click',()=>activateUnit(unit,index,'tap-direct'));
    bindPointer(button,{type:'unit',unit,index});
  }else button.disabled=true;
  return button;
}

function unitFamily(unit,count,available){
  const section=document.createElement('section'),grid=document.createElement('div');section.className='unit-family';grid.className='unit-grid';
  const title=document.createElement('h2');title.textContent=unit==='ten'?`📦 × ${count}`:`● × ${count}`;section.append(title);
  for(let index=0;index<count;index++)grid.append(cargoUnit(unit,index,{available:typeof available==='function'?available(index):available}));section.append(grid);return section;
}

function renderMachine(){
  const root=$('machineSlots');root.innerHTML='';for(let index=0;index<10;index++){const slot=document.createElement('i');slot.className=index<selectedOnes.length?'filled':'';root.append(slot)}
  $('tenMachine').classList.toggle('ready',selectedOnes.length===10);$('machineLabel').textContent=`${selectedOnes.length} / 10`;$('tenMachine').dataset.dropTarget='machine';
}

function renderWork(scene){
  const field=$('cargoField'),workspace=session.coreState.workspace;field.innerHTML='';
  const tenAvailable=scene.id==='remove-tens'?true:scene.id==='split-ten'?index=>index===0:false,oneAvailable=scene.id==='bundle-ten'||scene.id==='remove-ones';
  field.append(unitFamily('ten',workspace.tens,tenAvailable),unitFamily('one',workspace.ones,oneAvailable));
  $('tenMachine').hidden=scene.id!=='bundle-ten';$('openingDock').hidden=scene.id!=='split-ten';$('departingBoat').hidden=!['remove-tens','remove-ones'].includes(scene.id);
  if(scene.id==='bundle-ten')renderMachine();
  $('openingDock').dataset.dropTarget='opening';$('departingBoat').dataset.dropTarget='boat';
  if(!session.coreState.remainingToUnload)return;
  const need=session.coreState.remainingToUnload;
  $('boatNeed').textContent=scene.id==='remove-tens'?`${need.tens} 個十`:`${need.ones} 個一`;
}

function renderMission(scene){
  const content={
    merge:['🚚','讓貨物在橋上見面',''],
    'bundle-ten':['⚙️','剛好十個，就能穿過機器',`${selectedOnes.length} / 10`],
    'remove-tens':['⛵','把大箱送上船',`還要 ${session.coreState.remainingToUnload?.tens||0} 個十`],
    'split-ten':['📦','這個大箱打得開',''],
    'remove-ones':['⛵','把小貨送上船',`還要 ${session.coreState.remainingToUnload?.ones||0} 個一`],
    celebrate:['✨','橋亮起來了！','任務完成']
  }[scene.id]||['🌉','交換橋島',''];
  $('missionIcon').textContent=content[0];$('missionTitle').textContent=content[1];$('missionStatus').textContent=content[2];
}

function renderCelebrate(){
  $('finishedValue').textContent=String(session.coreState.workspace.tens*10+session.coreState.workspace.ones);
}

function render(){
  const scene=carryBridgeV2Scene(session);renderMission(scene);
  $('mergeScene').hidden=scene.id!=='merge';$('workScene').hidden=!['bundle-ten','remove-tens','split-ten','remove-ones'].includes(scene.id);$('celebrateScene').hidden=scene.id!=='celebrate';
  if(scene.id==='merge')renderMerge();
  if(!$('workScene').hidden)renderWork(scene);
  if(scene.id==='celebrate'){renderCelebrate();playTone('complete')}
  $('islandStage').classList.toggle('transforming',transforming);
  scheduleIdleNudge();renderDebug();
}

function arriveLoad(index,path){
  if(arrivedLoads.has(index)||session.coreState.joined)return;
  arrivedLoads.add(index);playTone();render();
  if(arrivedLoads.size===2)setTimeout(()=>{session=applyCarryBridgeV2Action(session,carryBridgeV2ActionFor(session,'merge-groups'),{interactionPath:path});showFeedback('✨',true);render()},420);
}

function activateUnit(unit,index,path){
  const scene=carryBridgeV2Scene(session);
  if(scene.id==='bundle-ten'&&unit==='one'){
    selectedOnes=carryBridgeV2TenSelection(selectedOnes,index,{workspaceOnes:session.coreState.workspace.ones});playTone();render();return;
  }
  if(scene.id==='remove-tens'&&unit==='ten')return applyAction(carryBridgeV2ActionFor(session,'remove-ten',{index}),path);
  if(scene.id==='split-ten'&&unit==='ten')return applyAction(carryBridgeV2ActionFor(session,'split-ten',{index,count:1}),path,'exchange');
  if(scene.id==='remove-ones'&&unit==='one')return applyAction(carryBridgeV2ActionFor(session,'remove-one',{index}),path);
}

function activateMachine(path='tap-direct'){
  if(transforming)return;
  if(selectedOnes.length!==10){showFeedback('十個圓點才會讓機器亮起來',false);return}
  const action=carryBridgeV2ActionFor(session,'bundle-ten',{indexes:selectedOnes,count:10});transforming=true;render();playTone('exchange');setTimeout(()=>{session=applyCarryBridgeV2Action(session,action,{interactionPath:path});selectedOnes=[];transforming=false;showFeedback('10 個一，變成 1 個十！',true);render()},650);
}

function applyAction(action,path,tone='move'){
  session=applyCarryBridgeV2Action(session,action,{interactionPath:path});playTone(tone);showFeedback(session.coreState.lastActionResult.accepted?'✓':'再試一個動作',session.coreState.lastActionResult.accepted);render();
}

function showFeedback(message,good=false){
  clearTimeout(feedbackTimer);const root=$('feedback');root.textContent=message;root.className=`feedback${message?' show':''} ${good?'good':'neutral'}`;
  if(message)feedbackTimer=setTimeout(()=>{root.className='feedback';root.textContent=''},1700);
}

function showHint(){
  const scene=carryBridgeV2Scene(session),messages={merge:'📦  →  🌉  ←  📦','bundle-ten':'● ● ● ● ●  +  ● ● ● ● ●  →  📦','remove-tens':'📦  →  ⛵','split-ten':'📦 10  →  ● ● ● ● ● ● ● ● ● ●','remove-ones':'●  →  ⛵'};
  $('islandStage').classList.add('idle-nudge');showFeedback(messages[scene.id]||'看看會發光的地方',false);setTimeout(()=>$('islandStage').classList.remove('idle-nudge'),1800);
}

function scheduleIdleNudge(){
  clearTimeout(idleTimer);$('islandStage').classList.remove('idle-nudge');
  if(carryBridgeV2Scene(session).id==='celebrate')return;
  idleTimer=setTimeout(()=>$('islandStage').classList.add('idle-nudge'),3800);
}

function bindPointer(node,payload){
  node.onpointerdown=event=>{if(event.button!==undefined&&event.button!==0)return;pointerDrag={...payload,pointerId:event.pointerId,startX:event.clientX,startY:event.clientY,moved:false};node.setPointerCapture?.(event.pointerId)};
}

document.addEventListener('pointermove',event=>{
  if(!pointerDrag||pointerDrag.pointerId!==event.pointerId)return;
  if(Math.hypot(event.clientX-pointerDrag.startX,event.clientY-pointerDrag.startY)>9)pointerDrag.moved=true;
  document.querySelectorAll('[data-drop-target]').forEach(node=>node.classList.remove('drop-hover'));
  if(pointerDrag.moved)document.elementFromPoint(event.clientX,event.clientY)?.closest?.('[data-drop-target]')?.classList.add('drop-hover');
});

document.addEventListener('pointerup',event=>{
  if(!pointerDrag||pointerDrag.pointerId!==event.pointerId)return;
  const drag=pointerDrag,target=document.elementFromPoint(event.clientX,event.clientY)?.closest?.('[data-drop-target]')?.dataset.dropTarget;pointerDrag=null;document.querySelectorAll('[data-drop-target]').forEach(node=>node.classList.remove('drop-hover'));
  if(!drag.moved)return;
  if(drag.type==='load'&&target==='merge')arriveLoad(drag.index,'pointer-drag');
  if(drag.type==='unit'&&target==='machine'&&drag.unit==='one'){selectedOnes=carryBridgeV2TenSelection(selectedOnes,drag.index,{workspaceOnes:session.coreState.workspace.ones});if(selectedOnes.length===10)activateMachine('pointer-drag');else render()}
  if(drag.type==='unit'&&target==='opening'&&drag.unit==='ten')applyAction(carryBridgeV2ActionFor(session,'split-ten',{index:drag.index,count:1}),'pointer-drag','exchange');
  if(drag.type==='unit'&&target==='boat')activateUnit(drag.unit,drag.index,'pointer-drag');
});
document.addEventListener('pointercancel',()=>{pointerDrag=null});
document.addEventListener('pointerdown',scheduleIdleNudge,{passive:true});

function showBlueprint(){
  const blueprint=carryBridgeV2Blueprint(session),columns=blueprint.columns,root=$('verticalBlueprint');root.innerHTML='';
  const cells=['',columns.tens.top,columns.ones.top,blueprint.operator,columns.tens.bottom,columns.ones.bottom,'',columns.tens.result,columns.ones.result];
  for(const value of cells){const span=document.createElement('span');span.textContent=String(value);root.append(span)}
  const relation=document.createElement('span');relation.className='exchange';relation.textContent=blueprint.exchange?.direction==='ones-to-tens'?'10 個一 ↔ 1 個十':'1 個十 ↔ 10 個一';root.append(relation);
  $('blueprintRelation').textContent=relation.textContent;$('playScene').hidden=true;$('blueprintScene').hidden=false;session.v2.blueprintViewed=true;renderDebug();
}

function renderDebug(){
  if(!founder||!session)return;const readback=carryBridgeV2DebugReadback(session,{pageErrors:window.__NQ_CARRY_V2_ERRORS__||[]});
  readback.v2UI={arrivedLoads:[...arrivedLoads],selectedOnes:[...selectedOnes],transforming,blueprintSeparateScene:!$('blueprintScene').hidden,normalHomeEntry:false,visiblePrimaryScene:carryBridgeV2Scene(session).id};
  $('prototypeDebug').textContent=JSON.stringify(readback,null,2);
}

$('cargoA').addEventListener('click',()=>arriveLoad(0,'tap-direct'));
$('cargoB').addEventListener('click',()=>arriveLoad(1,'tap-direct'));
$('tenMachine').addEventListener('click',()=>activateMachine('tap-direct'));
$('openingDock').addEventListener('click',()=>{if(carryBridgeV2Scene(session).id==='split-ten')applyAction(carryBridgeV2ActionFor(session,'split-ten',{index:0,count:1}),'tap-direct','exchange')});
$('hintButton').addEventListener('click',showHint);
$('showBlueprint').addEventListener('click',showBlueprint);
$('closeBlueprint').addEventListener('click',()=>{$('blueprintScene').hidden=true;$('playScene').hidden=false;render()});
$('newMission').addEventListener('click',()=>startCase(session.problem.caseRuleId));
$('caseRuleSelect').addEventListener('change',event=>startCase(event.target.value));
$('resetCase').addEventListener('click',()=>startCase(session.problem.caseRuleId,{sameSeed:true}));
$('soundToggle').addEventListener('click',()=>{soundOn=!soundOn;$('soundToggle').setAttribute('aria-pressed',String(soundOn));$('soundToggle').textContent=soundOn?'♪':'×'});
