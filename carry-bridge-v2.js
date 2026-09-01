import {
  CARRY_BRIDGE_V2_RULES,
  applyCarryBridgeV21BlueprintChoice,
  applyCarryBridgeV2Action,
  canonicalCarryBridgeV2Actions,
  carryBridgeV21BlueprintChallenge,
  carryBridgeV21Hint,
  carryBridgeV21WorldRunPlan,
  carryBridgeV2ActionFor,
  carryBridgeV2AccessEnabled,
  carryBridgeV2Blueprint,
  carryBridgeV2DebugReadback,
  carryBridgeV2Scene,
  carryBridgeV2TenSelection,
  createCarryBridgeV2Session,
  replayCarryBridgeV2Actions
} from './src/grade-2a-carry-bridge-v2.mjs?v=v21-1';

const $=id=>document.getElementById(id);
const params=new URLSearchParams(location.search);
const enabled=carryBridgeV2AccessEnabled(location.search);
const founder=params.get('founder')==='1'||params.get('debug')==='1';
const seeded=value=>()=>((value=Math.imul(value,1664525)+1013904223>>>0)/4294967296);
const numberParts=value=>({tens:Math.floor(value/10),ones:value%10});
const queryCase=params.get('case');
let seed=Math.max(1,Math.trunc(Number(params.get('seed'))||1));
let activeSeed=seed,session=null,worldRun=null,blueprintChallenge=null,arrivedLoads=new Set(),selectedOnes=[];
let pointerDrag=null,feedbackTimer=null,idleTimer=null,transforming=false,transformKind=null,soundOn=true,completionAnnounced=false,suppressClickUntil=0;
let hintState={sceneId:null,idleSignals:0,manualRequests:0},dragDiagnostics={cancelled:0,droppedOutside:0,completed:0};

if(enabled){
  $('prototypeGate').hidden=true;$('prototypeApp').hidden=false;$('founderPanel').hidden=!founder;
  if(queryCase==='world-run')startWorldRun();else startCase(CARRY_BRIDGE_V2_RULES.includes(queryCase)?queryCase:'add-regroup');
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

function startWorldRun({replay=false}={}){
  const runSeed=replay?worldRun.plan.seed:seed;
  const plan=carryBridgeV21WorldRunPlan({seed:runSeed,length:6});
  worldRun={plan,index:0,completed:[],replays:replay?Number(worldRun?.replays||0)+1:0};
  startCase(plan.rules[0],{caseSeed:plan.missionSeeds[0]});
}

function startCase(ruleId,{sameSeed=false,caseSeed=null}={}){
  activeSeed=caseSeed??(sameSeed?activeSeed:seed++);
  session=createCarryBridgeV2Session(ruleId,{rng:seeded(activeSeed),sourceNonce:activeSeed});
  arrivedLoads=new Set();selectedOnes=[];blueprintChallenge=null;transforming=false;transformKind=null;completionAnnounced=false;
  hintState={sceneId:null,idleSignals:0,manualRequests:0};clearHintClasses();
  $('caseRuleSelect').value=worldRun?'world-run':ruleId;$('playScene').hidden=false;$('blueprintScene').hidden=true;
  showFeedback('',false);render();
  if(founder&&params.get('blueprint')==='1'&&!worldRun){
    session=replayCarryBridgeV2Actions(session,canonicalCarryBridgeV2Actions(session.problem));render();setTimeout(showBlueprint,50);
  }
}

function cargoPreview(value,{includeCount=true}={}){
  const parts=numberParts(value),root=document.createElement('span');root.className='cargo-preview';
  for(let index=0;index<parts.tens;index++){const item=document.createElement('i');item.className='mini-ten';root.append(item)}
  for(let index=0;index<parts.ones;index++){const item=document.createElement('i');item.className='mini-one';root.append(item)}
  if(includeCount){const count=document.createElement('b');count.className='cargo-count';count.textContent=String(value);root.append(count)}
  return root;
}

function renderMerge(){
  const problem=session.problem;
  for(const [id,value,index] of [['cargoA',problem.left,0],['cargoB',problem.right,1]]){
    const node=$(id);node.innerHTML='';node.append(cargoPreview(value));node.classList.toggle('arrived',arrivedLoads.has(index));node.dataset.index=String(index);bindPointer(node,{type:'load',index});
  }
  $('mergeBridge').dataset.dropTarget='merge';
}

function clickAllowed(){return performance.now()>=suppressClickUntil}

function cargoUnit(unit,index,{available=false}={}){
  const button=document.createElement('button');button.type='button';button.className=`cargo-unit ${unit}${available?' available':' inert'}${unit==='one'&&selectedOnes.includes(index)?' selected':''}`;
  button.setAttribute('aria-label',unit==='ten'?`一個十${available?'，點一下操作':''}`:`一個一${available?'，點一下操作':''}`);
  button.textContent=unit==='ten'?'10':'1';button.dataset.unit=unit;button.dataset.index=String(index);
  if(available){button.addEventListener('click',()=>{if(clickAllowed())activateUnit(unit,index,'tap-direct')});bindPointer(button,{type:'unit',unit,index})}else button.disabled=true;
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

function renderExchangeFilm(){
  const film=$('exchangeFilm');film.hidden=!transforming;if(!transforming){film.innerHTML='';return}
  const dots='<span class="film-dots" aria-hidden="true">●●●●●<br>●●●●●</span>',ten='<span class="film-ten" aria-hidden="true">10</span>';
  film.innerHTML=transformKind==='bundle'?`${dots}<i>→</i>${ten}`:`${ten}<i>→</i>${dots}`;
  film.setAttribute('aria-label',transformKind==='bundle'?'十個一變成一個十，總數不變':'一個十打開成十個一，總數不變');
}

function renderWork(scene){
  const field=$('cargoField'),workspace=session.coreState.workspace;field.innerHTML='';
  const tenAvailable=scene.id==='remove-tens'?true:scene.id==='split-ten'?index=>index===0:false,oneAvailable=scene.id==='bundle-ten'||scene.id==='remove-ones';
  field.append(unitFamily('ten',workspace.tens,tenAvailable),unitFamily('one',workspace.ones,oneAvailable));
  $('tenMachine').hidden=scene.id!=='bundle-ten'||transforming;$('openingDock').hidden=scene.id!=='split-ten'||transforming;$('departingBoat').hidden=!['remove-tens','remove-ones'].includes(scene.id)||transforming;
  if(scene.id==='bundle-ten')renderMachine();
  $('openingDock').dataset.dropTarget='opening';$('departingBoat').dataset.dropTarget='boat';renderExchangeFilm();
  if(!session.coreState.remainingToUnload)return;
  const need=session.coreState.remainingToUnload;$('boatNeed').textContent=scene.id==='remove-tens'?`${need.tens} 個十`:`${need.ones} 個一`;
}

function renderProgress(){
  const root=$('runProgress');root.hidden=!worldRun;if(!worldRun)return;
  root.innerHTML='';worldRun.plan.rules.forEach((_,index)=>{const dot=document.createElement('i');dot.className=index<worldRun.index?'done':index===worldRun.index?'current':'';root.append(dot)});
}

function renderMission(scene){
  const content={
    merge:['🚚','讓貨物在橋上見面',''],
    'bundle-ten':['⚙️','找出一整組十個',`${selectedOnes.length} / 10`],
    'remove-tens':['⛵','把大箱送上船',`還要 ${session.coreState.remainingToUnload?.tens||0} 個十`],
    'split-ten':['📦','這個大箱打得開',''],
    'remove-ones':['⛵','把小貨送上船',`還要 ${session.coreState.remainingToUnload?.ones||0} 個一`],
    celebrate:['✨','橋亮起來了！',worldRun?`第 ${worldRun.index+1} / ${worldRun.plan.length} 座橋`:'任務完成']
  }[scene.id]||['🌉','交換橋工坊',''];
  $('missionIcon').textContent=content[0];$('missionTitle').textContent=content[1];$('missionStatus').textContent=content[2];renderProgress();
}

function renderCelebrate(){
  const value=session.coreState.workspace.tens*10+session.coreState.workspace.ones;$('finishedValue').textContent=String(value);
  const view=$('finishedCargoView');view.innerHTML='';view.append(cargoPreview(value,{includeCount:false}));
  const finalInRun=worldRun&&worldRun.index===worldRun.plan.length-1;$('finishedMessage').textContent=finalInRun?'交換橋全亮了！':'貨物安全通過！';
  $('newMission').textContent=finalInRun?'再跑一次世界':worldRun?'下一座橋':'再玩一座橋';
  if(!completionAnnounced){completionAnnounced=true;playTone('complete')}
}

function render(){
  const scene=carryBridgeV2Scene(session);renderMission(scene);
  $('mergeScene').hidden=scene.id!=='merge';$('workScene').hidden=!['bundle-ten','remove-tens','split-ten','remove-ones'].includes(scene.id);$('celebrateScene').hidden=scene.id!=='celebrate';
  if(scene.id==='merge')renderMerge();if(!$('workScene').hidden)renderWork(scene);if(scene.id==='celebrate')renderCelebrate();
  $('islandStage').classList.toggle('transforming',transforming);scheduleIdleNudge();renderDebug();
}

function resetHints(){hintState={sceneId:carryBridgeV2Scene(session).id,idleSignals:0,manualRequests:0};clearHintClasses()}

function arriveLoad(index,path){
  if(arrivedLoads.has(index)||session.coreState.joined||transforming)return;
  arrivedLoads.add(index);playTone();render();
  if(arrivedLoads.size===2)setTimeout(()=>{
    session=applyCarryBridgeV2Action(session,carryBridgeV2ActionFor(session,'merge-groups'),{interactionPath:path});resetHints();showFeedback('✨',true);render();
  },420);
}

function activateUnit(unit,index,path){
  if(transforming)return;const scene=carryBridgeV2Scene(session);
  if(scene.id==='bundle-ten'&&unit==='one'){selectedOnes=carryBridgeV2TenSelection(selectedOnes,index,{workspaceOnes:session.coreState.workspace.ones});playTone();render();return}
  if(scene.id==='remove-tens'&&unit==='ten')return applyAction(carryBridgeV2ActionFor(session,'remove-ten',{index}),path);
  if(scene.id==='split-ten'&&unit==='ten')return startExchange('split',path,index);
  if(scene.id==='remove-ones'&&unit==='one')return applyAction(carryBridgeV2ActionFor(session,'remove-one',{index}),path);
}

function startExchange(kind,path='tap-direct',index=0){
  if(transforming)return;
  if(kind==='bundle'&&selectedOnes.length!==10){session.v2.neutralActions=Number(session.v2.neutralActions||0)+1;showFeedback('還差一點點',false);triggerHint('neutral');return}
  const action=kind==='bundle'?carryBridgeV2ActionFor(session,'bundle-ten',{indexes:selectedOnes,count:10}):carryBridgeV2ActionFor(session,'split-ten',{index,count:1});
  transforming=true;transformKind=kind;clearTimeout(idleTimer);playTone('exchange');render();
  setTimeout(()=>{session=applyCarryBridgeV2Action(session,action,{interactionPath:path});selectedOnes=[];transforming=false;transformKind=null;resetHints();showFeedback(kind==='bundle'?'10 個一 ↔ 1 個十':'1 個十 ↔ 10 個一',true);render()},900);
}

function applyAction(action,path,tone='move'){
  session=applyCarryBridgeV2Action(session,action,{interactionPath:path});playTone(tone);
  if(session.coreState.lastActionResult.accepted)resetHints();else triggerHint('neutral');
  showFeedback(session.coreState.lastActionResult.accepted?'✓':'沒關係，再看看',session.coreState.lastActionResult.accepted);render();
}

function showFeedback(message,good=false){
  clearTimeout(feedbackTimer);const root=$('feedback');root.textContent=message;root.className=`feedback${message?' show':''} ${good?'good':'neutral'}`;
  if(message)feedbackTimer=setTimeout(()=>{root.className='feedback';root.textContent=''},1700);
}

function clearHintClasses(){const root=$('islandStage');root.classList.remove('idle-nudge','hint-stage-1','hint-stage-2','hint-stage-3')}

function triggerHint(source='manual'){
  if(!session||carryBridgeV2Scene(session).id==='celebrate'||transforming)return;
  if(source==='idle')hintState.idleSignals++;else if(source==='manual')hintState.manualRequests++;
  const scene=carryBridgeV2Scene(session),hint=carryBridgeV21Hint(scene.id,{idleSignals:hintState.idleSignals,neutralActions:session.v2.neutralActions,manualRequests:hintState.manualRequests});
  clearHintClasses();$('islandStage').classList.add('idle-nudge',`hint-stage-${hint.stage}`);if(hint.message)showFeedback(hint.message,false);
  clearTimeout(idleTimer);if(hint.stage<3)idleTimer=setTimeout(()=>triggerHint('idle'),hint.stage===1?5000:6500);renderDebug();
}

function scheduleIdleNudge(){
  const scene=carryBridgeV2Scene(session);if(scene.id==='celebrate'||transforming)return clearTimeout(idleTimer);
  if(hintState.sceneId!==scene.id){hintState={sceneId:scene.id,idleSignals:0,manualRequests:0};clearHintClasses()}
  clearTimeout(idleTimer);idleTimer=setTimeout(()=>triggerHint('idle'),4000);
}

function bindPointer(node,payload){node.onpointerdown=event=>{if(event.button!==undefined&&event.button!==0)return;pointerDrag={...payload,pointerId:event.pointerId,startX:event.clientX,startY:event.clientY,moved:false};node.setPointerCapture?.(event.pointerId)}}

document.addEventListener('pointermove',event=>{
  if(!pointerDrag||pointerDrag.pointerId!==event.pointerId)return;
  if(Math.hypot(event.clientX-pointerDrag.startX,event.clientY-pointerDrag.startY)>9)pointerDrag.moved=true;
  document.querySelectorAll('[data-drop-target]').forEach(node=>node.classList.remove('drop-hover'));
  if(pointerDrag.moved)document.elementFromPoint(event.clientX,event.clientY)?.closest?.('[data-drop-target]')?.classList.add('drop-hover');
});

document.addEventListener('pointerup',event=>{
  if(!pointerDrag||pointerDrag.pointerId!==event.pointerId)return;
  const drag=pointerDrag,target=document.elementFromPoint(event.clientX,event.clientY)?.closest?.('[data-drop-target]')?.dataset.dropTarget;pointerDrag=null;
  document.querySelectorAll('[data-drop-target]').forEach(node=>node.classList.remove('drop-hover'));if(!drag.moved)return;
  suppressClickUntil=performance.now()+450;let completed=false;
  if(drag.type==='load'&&target==='merge'){arriveLoad(drag.index,'pointer-drag');completed=true}
  if(drag.type==='unit'&&target==='machine'&&drag.unit==='one'){selectedOnes=carryBridgeV2TenSelection(selectedOnes,drag.index,{workspaceOnes:session.coreState.workspace.ones});if(selectedOnes.length===10)startExchange('bundle','pointer-drag');else render();completed=true}
  if(drag.type==='unit'&&target==='opening'&&drag.unit==='ten'){startExchange('split','pointer-drag',drag.index);completed=true}
  if(drag.type==='unit'&&target==='boat'){activateUnit(drag.unit,drag.index,'pointer-drag');completed=true}
  if(drag.type==='blueprint-choice'&&target==='blueprint-hole'){chooseBlueprint(drag.choice,'pointer-drag');completed=true}
  if(completed)dragDiagnostics.completed++;else dragDiagnostics.droppedOutside++;renderDebug();
});
document.addEventListener('pointercancel',()=>{if(pointerDrag)dragDiagnostics.cancelled++;pointerDrag=null;document.querySelectorAll('[data-drop-target]').forEach(node=>node.classList.remove('drop-hover'));renderDebug()});
document.addEventListener('pointerdown',()=>{clearTimeout(idleTimer);scheduleIdleNudge()},{passive:true});

function relationMarkup(blueprint){
  if(blueprint.exchange?.direction==='ones-to-tens')return '<span class="film-dots">●●●●●<br>●●●●●</span><i>→</i><span class="film-ten">10</span>';
  if(blueprint.exchange?.direction==='tens-to-ones')return '<span class="film-ten">10</span><i>→</i><span class="film-dots">●●●●●<br>●●●●●</span>';
  return '<span>📦</span><i>→</i><span>十 │ 一</span>';
}

function showBlueprint(){
  const blueprint=carryBridgeV2Blueprint(session),columns=blueprint.columns,root=$('verticalBlueprint');blueprintChallenge=carryBridgeV21BlueprintChallenge(session);root.innerHTML='';
  const cells=[['',null],[columns.tens.top,'tens'],[columns.ones.top,'ones'],[blueprint.operator,null],[columns.tens.bottom,'tens'],[columns.ones.bottom,'ones'],['',null],[columns.tens.result,'tens-result'],[columns.ones.result,'ones-result']];
  for(const [value,role] of cells){const span=document.createElement('span');if(role===`${blueprintChallenge.column}-result`){span.className='blueprint-hole';span.textContent='?';span.dataset.dropTarget='blueprint-hole';span.setAttribute('aria-label',`${blueprintChallenge.column==='tens'?'十位':'個位'}空格`)}else span.textContent=String(value);root.append(span)}
  $('blueprintRelation').innerHTML=relationMarkup(blueprint);const choices=$('blueprintChoices');choices.innerHTML='';
  blueprintChallenge.choices.forEach(choice=>{const button=document.createElement('button');button.type='button';button.className='blueprint-piece';button.textContent=String(choice.digit);button.setAttribute('aria-label',`數字 ${choice.digit}`);button.addEventListener('click',()=>{if(clickAllowed())chooseBlueprint(choice,'tap-direct')});bindPointer(button,{type:'blueprint-choice',choice});choices.append(button)});
  $('blueprintFeedback').textContent='';$('closeBlueprint').textContent='← 回到橋上';$('playScene').hidden=true;$('blueprintScene').hidden=false;session.v2.blueprintViewed=true;renderDebug();
}

function chooseBlueprint(choice,path){
  blueprintChallenge=applyCarryBridgeV21BlueprintChoice(blueprintChallenge,choice,{interactionPath:path});const hole=document.querySelector('.blueprint-hole');
  if(blueprintChallenge.complete){hole.textContent=String(choice.digit);hole.classList.add('complete');$('blueprintChoices').querySelectorAll('button').forEach(button=>button.disabled=true);$('blueprintFeedback').textContent='✨';session.v2.blueprintCompleted=true;playTone('complete')}
  else{$('blueprintFeedback').textContent='↺';hole.classList.add('try-again');setTimeout(()=>hole.classList.remove('try-again'),500)}renderDebug();
}

function nextMission(){
  if(!worldRun)return startCase(session.problem.caseRuleId);
  worldRun.completed.push({sourceQuestionId:session.problem.sourceQuestionId,ruleId:session.problem.caseRuleId,blueprintCompleted:Boolean(session.v2.blueprintCompleted)});
  if(worldRun.index===worldRun.plan.length-1)return startWorldRun({replay:true});
  worldRun.index++;startCase(worldRun.plan.rules[worldRun.index],{caseSeed:worldRun.plan.missionSeeds[worldRun.index]});showFeedback('下一座橋出現了！',true);
}

function renderDebug(){
  if(!founder||!session)return;const readback=carryBridgeV2DebugReadback(session,{pageErrors:window.__NQ_CARRY_V2_ERRORS__||[]});
  readback.v21UI={arrivedLoads:[...arrivedLoads],selectedOnes:[...selectedOnes],transforming,transformKind,blueprintSeparateScene:!$('blueprintScene').hidden,blueprintChallenge,normalHomeEntry:false,visiblePrimaryScene:carryBridgeV2Scene(session).id,hintState:{...hintState,neutralActions:session.v2.neutralActions},dragDiagnostics:{...dragDiagnostics},worldRun:worldRun?{...worldRun.plan,index:worldRun.index,completed:[...worldRun.completed],replays:worldRun.replays}:null};
  $('prototypeDebug').textContent=JSON.stringify(readback,null,2);
}

$('cargoA').addEventListener('click',()=>{if(clickAllowed())arriveLoad(0,'tap-direct')});$('cargoB').addEventListener('click',()=>{if(clickAllowed())arriveLoad(1,'tap-direct')});
$('tenMachine').addEventListener('click',()=>{if(clickAllowed())startExchange('bundle','tap-direct')});
$('openingDock').addEventListener('click',()=>{if(clickAllowed()&&carryBridgeV2Scene(session).id==='split-ten')startExchange('split','tap-direct',0)});
$('hintButton').addEventListener('click',()=>triggerHint('manual'));$('showBlueprint').addEventListener('click',showBlueprint);
$('closeBlueprint').addEventListener('click',()=>{$('blueprintScene').hidden=true;$('playScene').hidden=false;render()});$('newMission').addEventListener('click',nextMission);
$('caseRuleSelect').addEventListener('change',event=>{worldRun=null;if(event.target.value==='world-run')startWorldRun();else startCase(event.target.value)});
$('resetCase').addEventListener('click',()=>{if(worldRun)startWorldRun({replay:true});else startCase(session.problem.caseRuleId,{sameSeed:true})});
$('soundToggle').addEventListener('click',()=>{soundOn=!soundOn;$('soundToggle').setAttribute('aria-pressed',String(soundOn));$('soundToggle').textContent=soundOn?'♪':'×'});
