import {
  STARBOX_V3_FLAG,STARBOX_V3_RULES,applyStarboxV3Action,canonicalStarboxV3Actions,createStarboxV3RunPlan,
  createStarboxV3Session,markStarboxV3SupportUsed,replayStarboxV3Actions,starboxV3AccessEnabled,
  starboxV3ActionFor,starboxV3Discovery,starboxV3FounderReadback,starboxV3Hint,starboxV3NumberQuestReturnUrl,starboxV3Scene
} from './src/grade-2a-starbox-v3.mjs?v=3-1';

const $=id=>document.getElementById(id),params=new URLSearchParams(location.search),founder=params.get('founder')==='1';
const purposeCopy={
  'add-no-regroup':{label:'合併兩批星星',verb:'合併',title:'兩批星星送到了！',instruction:'把兩批貨送進中央工作台。'},
  'add-regroup':{label:'合併後裝成一箱',verb:'裝箱',title:'工坊收到兩批星星！',instruction:'先合併，再把剛好的十顆裝成一箱。'},
  'sub-no-regroup':{label:'照訂單直接出貨',verb:'出貨',title:'新訂單來了！',instruction:'從庫存拿出訂單需要的星箱和星星。'},
  'sub-regroup':{label:'打開一箱再出貨',verb:'開箱',title:'散裝星星不夠了！',instruction:'先照訂單出貨；需要時，打開一個星箱。'}
};
const sceneCopy={
  combine:['把兩批貨送進工作台','點一下貨板，或把它拖向中央。'],
  'scoop-ten':['圈起剛好的十顆星星','一口氣把十顆放進十格托盤。'],
  'seal-box':['把十顆星星封成一箱','把裝滿的托盤推進封箱機。'],
  'fulfill-boxes':['先送出訂單需要的星箱','把整組星箱送到右邊訂單區。'],
  'open-box':['散裝星星不夠：打開一箱','打開一個星箱，它會在原地變成十顆星星。'],
  'fulfill-stars':['再送出訂單需要的散裝星星','把整組星星送到右邊訂單區。']
};
const seeded=initial=>()=>((initial=Math.imul(initial,1664525)+1013904223>>>0)/4294967296);
let seed=Math.max(1,Math.trunc(Number(params.get('seed'))||1)),caseId=params.get('case')||'run',plan=createStarboxV3RunPlan({seed}),missionIndex=caseId==='run'?0:Math.max(0,STARBOX_V3_RULES.indexOf(caseId));
if(!STARBOX_V3_RULES.includes(caseId)&&caseId!=='run')caseId='run';
let session=null,sound=true,hintTimer=null,suppressClick=false;

function makeObjects({tens=0,ones=0}={},extra=''){
  return `<div class="object-field ${extra}">${Array.from({length:tens},()=>'<i class="starbox" aria-hidden="true">★</i>').join('')}${Array.from({length:ones},(_,i)=>`<i class="loose-star" style="--i:${i}" aria-hidden="true"></i>`).join('')}</div><span class="object-count">${tens} 箱 · ${ones} 顆</span>`;
}
function digits(value){return {tens:Math.floor(value/10),ones:value%10}}
function currentRule(){return caseId==='run'?plan.rules[missionIndex]:caseId}
function beginMission(){
  const rule=currentRule(),nonce=plan.missionSeeds[missionIndex]||seed*100+missionIndex+1;
  session=createStarboxV3Session(rule,{rng:seeded(nonce),sourceNonce:nonce});
  $('successPanel').hidden=true;$('discoveryDialog').close?.();
  render();
  if(params.get('discovery')==='1'&&rule.includes('regroup')){session=replayStarboxV3Actions(session,canonicalStarboxV3Actions(session));render();openDiscovery()}
}
function renderProgress(){
  $('missionCounter').textContent=caseId==='run'?`${missionIndex+1} / 4`:'單項試玩';
  $('purposeLabel').textContent=purposeCopy[currentRule()].label;
  $('missionSteps').innerHTML=plan.rules.map((_,index)=>`<i class="${index<missionIndex?'done':index===missionIndex?'current':''}"></i>`).join('');
}
function render(){
  const rule=session.problem.caseRuleId,copy=purposeCopy[rule],scene=starboxV3Scene(session);renderProgress();
  $('missionVerb').textContent=copy.verb;$('missionTitle').textContent=scene.id==='success'?copy.label:sceneCopy[scene.id]?.[0]||copy.title;$('missionInstruction').textContent=sceneCopy[scene.id]?.[1]||copy.instruction;
  $('numberQuestBack').href=starboxV3NumberQuestReturnUrl({caseId,seed});$('finishBack').href=$('numberQuestBack').href;
  if(scene.id==='success'){showSuccess();updateFounder();return}
  $('successPanel').hidden=true;$('workbench').innerHTML=benchFor(scene.id);$('actionDock').innerHTML='';
  const action=actionForScene(scene.id);if(action)$('actionDock').append(makeActionButton(scene.id,action));
  $('hintBtn').disabled=false;$('feedback').className='feedback';$('feedback').textContent='點一下，或拖動發光的物件。';scheduleHint();updateFounder();
}
function deliveryCard(label,value){return `<div class="delivery"><h3>${label}</h3>${makeObjects(digits(value))}</div>`}
function inventoryCard(state,classes=''){return `<div class="inventory ${classes}"><div class="inventory-title">中央庫存</div>${makeObjects(state)}</div>`}
function orderCard(){return `<div class="order-zone"><strong>訂單</strong><div class="order-equation">要 ${session.problem.right}</div><small>${digits(session.problem.right).tens} 箱 · ${digits(session.problem.right).ones} 顆</small></div>`}
function benchFor(scene){
  const p=session.problem,s=session.coreState;
  if(scene==='combine')return `<div class="bench-layout">${deliveryCard('第一批',p.left)}${inventoryCard({tens:0,ones:0})}${deliveryCard('第二批',p.right)}</div>`;
  if(scene==='scoop-ten')return `<div class="bench-layout"><div></div>${inventoryCard(s.workspace,'is-action')}<div class="packing-tray"><h3>十格裝箱托盤</h3><div class="slot-grid">${Array.from({length:10},()=>'<i class="slot"></i>').join('')}</div><p class="movement-note">十顆一起移動，不用一顆一顆點</p></div></div>`;
  if(scene==='seal-box')return `<div class="bench-layout"><div></div><div class="packing-tray is-action"><h3>十顆都在同一個托盤</h3><div class="slot-grid">${Array.from({length:10},()=>'<i class="slot filled"></i>').join('')}</div><div class="lid">⭐ 封成同一箱</div></div><div></div></div>`;
  if(scene==='fulfill-boxes')return `<div class="bench-layout"><div></div>${inventoryCard(s.workspace,'is-action')}${orderCard()}</div>`;
  if(scene==='open-box')return `<div class="bench-layout"><div></div>${inventoryCard(s.workspace,'is-action opening-box')}${orderCard()}</div>`;
  if(scene==='fulfill-stars')return `<div class="bench-layout"><div></div>${inventoryCard(s.workspace,'is-action opened-stars')}${orderCard()}</div>`;
  return '';
}
function actionForScene(scene){
  if(scene==='combine')return starboxV3ActionFor(session,'combine-deliveries');
  if(scene==='scoop-ten')return starboxV3ActionFor(session,'scoop-ten-stars');
  if(scene==='seal-box')return starboxV3ActionFor(session,'seal-starbox');
  if(scene==='fulfill-boxes')return starboxV3ActionFor(session,'fulfill-boxes');
  if(scene==='open-box')return starboxV3ActionFor(session,'open-starbox');
  if(scene==='fulfill-stars')return starboxV3ActionFor(session,'fulfill-stars');return null;
}
const actionLabels={combine:'合併兩批貨 →','scoop-ten':'一次圈起十顆 →','seal-box':'封成一個星箱 →','fulfill-boxes':'送出這組星箱 →','open-box':'打開一個星箱 →','fulfill-stars':'送出這組星星 →'};
function makeActionButton(scene,action){
  const button=document.createElement('button');button.type='button';button.className='object-action';button.dataset.scene=scene;button.textContent=actionLabels[scene];button.setAttribute('aria-label',`${actionLabels[scene]}；也可以拖動`);
  button.addEventListener('click',()=>{if(suppressClick){suppressClick=false;return}perform(action,'tap-direct')});
  button.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();perform(action,'keyboard')}});
  let start=null;button.addEventListener('pointerdown',event=>{start={x:event.clientX,y:event.clientY};button.setPointerCapture?.(event.pointerId)});button.addEventListener('pointermove',event=>{if(start&&Math.hypot(event.clientX-start.x,event.clientY-start.y)>12)button.classList.add('dragging')});button.addEventListener('pointerup',event=>{if(!start)return;const moved=Math.hypot(event.clientX-start.x,event.clientY-start.y)>28;button.classList.remove('dragging');start=null;if(moved){suppressClick=true;perform(action,'pointer-drag')}});button.addEventListener('pointercancel',()=>{start=null;button.classList.remove('dragging')});return button;
}
function perform(action,path){clearTimeout(hintTimer);const previousScene=starboxV3Scene(session).id;session=applyStarboxV3Action(session,action,{interactionPath:path});const accepted=session.interactionLog.at(-1)?.accepted;if(sound&&accepted)playChime(previousScene==='open-box'?280:440);$('feedback').textContent=accepted?'工坊收到你的動作！':'物件沒有對上，再看看發光的位置。';$('feedback').className=`feedback ${accepted?'success':''}`;setTimeout(render,accepted?330:0)}
function playChime(frequency){try{const AudioContext=window.AudioContext||window.webkitAudioContext,context=new AudioContext(),osc=context.createOscillator(),gain=context.createGain();osc.frequency.value=frequency;gain.gain.setValueAtTime(.035,context.currentTime);gain.gain.exponentialRampToValueAtTime(.001,context.currentTime+.12);osc.connect(gain).connect(context.destination);osc.start();osc.stop(context.currentTime+.12)}catch{}}
function scheduleHint(){clearTimeout(hintTimer);hintTimer=setTimeout(()=>{$('actionDock').querySelector('.object-action')?.classList.add('hint-pulse')},5000)}
function showHint(reason='child-requested-hint'){
  session=markStarboxV3SupportUsed(session,reason);const scene=starboxV3Scene(session),hint=starboxV3Hint(scene.id),button=$('actionDock').querySelector('.object-action');button?.classList.add('hint-pulse');$('feedback').textContent={
    'move-deliveries-together':'看中央工作台：兩批貨都要到同一個地方。','show-ten-slot-outline':'托盤有十格；這次把十顆一起圈起來。','pulse-filled-lid':'十格都滿了，現在把它們封成同一箱。','pair-box-group-with-order':'先比較訂單需要幾個箱子。','pulse-single-openable-box':'打開一箱，原地會出現十顆星星。','pair-star-group-with-order':'把訂單剩下需要的星星一起送出。'
  }[hint.cue]||'看看正在發光的物件。';$('hintBtn').disabled=true;updateFounder()
}
function showSuccess(){
  clearTimeout(hintTimer);$('successPanel').hidden=false;const rule=session.problem.caseRuleId;$('successPurpose').textContent=`你剛才會了：${purposeCopy[rule].label}`;$('finishedInventory').innerHTML=makeObjects(session.coreState.workspace);$('discoveryBtn').hidden=!rule.includes('regroup');$('nextBtn').textContent=caseId==='run'&&missionIndex<3?'下一個任務 →':caseId==='run'?'點亮工坊 →':'再玩一題 →';
}
function renderDiscoveryObjects(side){return `<div class="discovery-side">${makeObjects(side)}</div>`}
function openDiscovery(){const discovery=starboxV3Discovery(session);session={...session,discoveryViewed:true};$('discoveryObjects').innerHTML=`${renderDiscoveryObjects({tens:discovery.objectBefore.sealedStarboxes,ones:discovery.objectBefore.looseStars})}<div class="discovery-arrow">→</div>${renderDiscoveryObjects({tens:discovery.objectAfter.sealedStarboxes,ones:discovery.objectAfter.looseStars})}`;$('discoveryStatement').textContent=discovery.statement;const v=discovery.vertical,operator=v.operator|| (session.problem.operation==='add'?'+':'−');$('verticalNotation').innerHTML=`<div>${session.problem.left}</div><div>${operator} ${session.problem.right}</div><div>${session.problem.answer}</div>`;$('discoveryDialog').showModal();updateFounder()}
function advance(){if(caseId!=='run'){seed++;beginMission();return}if(missionIndex<3){missionIndex++;beginMission()}else $('runCompleteDialog').showModal()}
function updateFounder(){if(!founder)return;$('founderPanel').hidden=false;$('founderDebug').textContent=JSON.stringify({...starboxV3FounderReadback(session,{pageErrors:window.__NQ_STARBOX_ERRORS__}),route:{caseId,seed,missionIndex},access:{flag:STARBOX_V3_FLAG,publicHomeEntry:false}},null,2)}

$('hintBtn').addEventListener('click',()=>showHint());$('soundBtn').addEventListener('click',()=>{sound=!sound;$('soundBtn').setAttribute('aria-pressed',String(sound));$('soundBtn').textContent=sound?'🔊':'🔇'});$('discoveryBtn').addEventListener('click',openDiscovery);$('closeDiscovery').addEventListener('click',()=>$('discoveryDialog').close());$('discoveryDone').addEventListener('click',()=>$('discoveryDialog').close());$('nextBtn').addEventListener('click',advance);$('replayRunBtn').addEventListener('click',()=>{missionIndex=0;$('runCompleteDialog').close();beginMission()});
if(!starboxV3AccessEnabled(location.search)){document.body.innerHTML='<main class="starbox-app"><section class="workshop"><div class="mission-copy"><h1>這扇工坊門還沒打開</h1><p>請從創辦人測試連結進入。</p><p><a class="back-link" href="index.html">← 回 Number Quest</a></p></div></section></main>'}else beginMission();
