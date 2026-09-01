import {
  STARBOX_V3_FLAG,STARBOX_V3_RULES,applyStarboxV3Action,canonicalStarboxV3Actions,createStarboxV3RunPlan,
  createStarboxV3Session,markStarboxV3SupportUsed,replayStarboxV3Actions,starboxV3AccessEnabled,
  starboxV3ActionFor,starboxV3Choices,starboxV3Discovery,starboxV3FounderReadback,starboxV3Hint,starboxV3NumberQuestReturnUrl,starboxV3Scene
} from './src/grade-2a-starbox-v3.mjs?v=3-6';

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
let session=null,sound=true,hintTimer=null,selectedSource=null,nativeDragSource=null,nativeDecisionHandled=false;

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
  if(params.get('discovery')==='1'&&session.problem.expectedExchange.direction!=null){session=replayStarboxV3Actions(session,canonicalStarboxV3Actions(session));render();openDiscovery()}
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
  selectedSource=null;$('successPanel').hidden=true;$('workbench').innerHTML=benchFor(scene.id);$('actionDock').innerHTML='<span>先選發光的貨物，再選它要去的地方。</span>';bindObjectInteractions();
  $('hintBtn').disabled=false;$('feedback').className='feedback';$('feedback').textContent='點貨物再點目的地，也可以直接拖過去。';scheduleHint();updateFounder();
}
function sourceButton(source,content,classes=''){const countLabel=source.count?`，${source.count} 個`:'';return `<button type="button" draggable="true" class="object-source ${classes}" data-source="${source.id}" aria-label="${source.label}${countLabel}；選好後送到目的地">${content}<span class="move-cue">拖我 ↗</span></button>`}
function targetButton(target,content,classes=''){return `<button type="button" class="object-target ${classes}" data-target="${target.id}" aria-label="目的地：${target.label}">${content}<span class="target-cue">放這裡</span></button>`}
function deliveryCard(index,label,value){const id=`${session.problem.sourceQuestionId}:starbox:delivery:${index}`,arrived=session.deliveredIds.includes(id),source={id,label,kind:'delivery',value};return arrived?`<div class="delivery arrived"><h3>${label}已入庫</h3>${makeObjects(digits(value))}</div>`:sourceButton(source,`<div class="delivery"><h3>${label}</h3>${makeObjects(digits(value))}</div>`,'delivery-source')}
function stagedInventory(){return session.deliveredIds.reduce((sum,id)=>sum+(id.endsWith(':0')?session.problem.left:session.problem.right),0)}
function inventoryTarget(state){const target=starboxV3Choices(session).targets.find(item=>item.id==='inventory');return targetButton(target,`<div class="inventory"><div class="inventory-title">中央庫存</div>${makeObjects(state)}</div>`,'inventory-target')}
function staticInventory(state,classes=''){return `<div class="inventory ${classes}"><div class="inventory-title">中央庫存</div>${makeObjects(state)}</div>`}
function orderTarget(){const target=starboxV3Choices(session).targets.find(item=>item.id==='order-zone');return targetButton(target,`<div class="order-zone"><strong>訂單</strong><div class="order-equation">要 ${session.problem.right}</div><small>${digits(session.problem.right).tens} 箱 · ${digits(session.problem.right).ones} 顆</small></div>`,'order-target')}
function returnTarget(){const target=starboxV3Choices(session).targets.find(item=>item.id==='return-shelf');return targetButton(target,'<div class="return-shelf">↩<strong>退回架</strong><small>暫時不出貨</small></div>','return-target')}
function groupChoices(){const choices=starboxV3Choices(session);return `<div class="choice-rack"><h3>${choices.sceneId==='scoop-ten'?'選一圈星星':'從庫存圈一組'}</h3><div class="choice-cards">${choices.sources.map((source,index)=>sourceButton(source,makeObjects(source.kind==='box-group'?{tens:source.count,ones:0}:{tens:0,ones:source.count}),`group-source choice-${index}`)).join('')}</div><small>每張卡都是從同一批庫存圈出的候選組</small></div>`}
function benchFor(scene){
  const p=session.problem,s=session.coreState;
  if(scene==='combine'){const staged=digits(stagedInventory()),targets=starboxV3Choices(session).targets,wrong=targets.find(item=>item.id==='packing-tray');return `<div class="bench-layout">${deliveryCard(0,'第一批',p.left)}<div class="target-stack">${inventoryTarget(staged)}${targetButton(wrong,'<div class="mini-target">📦<strong>裝箱托盤</strong><small>這裡只能放剛好十顆</small></div>','wrong-target')}</div>${deliveryCard(1,'第二批',p.right)}</div>`}
  if(scene==='scoop-ten'){const choices=starboxV3Choices(session),tray=choices.targets.find(item=>item.id==='packing-tray');return `<div class="bench-layout">${groupChoices()}${staticInventory(s.workspace)}<div class="target-stack">${targetButton(tray,`<div class="packing-tray"><h3>十格裝箱托盤</h3><div class="slot-grid">${Array.from({length:10},()=>'<i class="slot"></i>').join('')}</div></div>`,'tray-target')}${returnTarget()}</div></div>`}
  if(scene==='seal-box'){const choices=starboxV3Choices(session),source=choices.sources[0],sealer=choices.targets.find(item=>item.id==='sealer'),inventory=choices.targets.find(item=>item.id==='inventory');return `<div class="bench-layout">${sourceButton(source,`<div class="packing-tray"><h3>裝滿的托盤</h3><div class="slot-grid">${Array.from({length:10},()=>'<i class="slot filled"></i>').join('')}</div></div>`,'tray-source')}<div class="target-stack">${targetButton(sealer,'<div class="machine-target">✨<strong>封箱機</strong><small>十顆會變成同一箱</small></div>','sealer-target')}${targetButton(inventory,'<div class="mini-target"><strong>中央庫存</strong><small>先不改變</small></div>','wrong-target')}</div><div></div></div>`}
  if(scene==='fulfill-boxes'||scene==='fulfill-stars')return `<div class="bench-layout">${groupChoices()}${staticInventory(s.workspace,scene==='fulfill-stars'?'opened-stars':'') }<div class="target-stack">${orderTarget()}${returnTarget()}</div></div>`;
  if(scene==='open-box'){const choices=starboxV3Choices(session),opening=choices.targets.find(item=>item.id==='opening-station'),order=choices.targets.find(item=>item.id==='order-zone');return `<div class="bench-layout"><div class="choice-rack"><h3>選要打開的星箱</h3><div class="choice-cards">${choices.sources.map(source=>sourceButton(source,makeObjects({tens:source.count,ones:0}),'group-source opening-box')).join('')}</div></div>${staticInventory(s.workspace)}<div class="target-stack">${targetButton(opening,'<div class="machine-target">✨<strong>開箱台</strong><small>星箱會在這裡變成散星</small></div>','opening-target')}${targetButton(order,'<div class="mini-target"><strong>直接送訂單</strong><small>散星還不夠</small></div>','wrong-target')}</div></div>`}
  return '';
}
function actionForDecision(sourceId,targetId){const scene=starboxV3Scene(session).id,source=starboxV3Choices(session).sources.find(item=>item.id===sourceId),options={sourceId,targetId,count:source?.count};if(scene==='combine')return starboxV3ActionFor(session,'move-delivery',options);if(scene==='scoop-ten')return starboxV3ActionFor(session,'scoop-ten-stars',options);if(scene==='seal-box')return starboxV3ActionFor(session,'seal-starbox',options);if(scene==='fulfill-boxes')return starboxV3ActionFor(session,'fulfill-boxes',options);if(scene==='open-box')return starboxV3ActionFor(session,'open-starbox',options);if(scene==='fulfill-stars')return starboxV3ActionFor(session,'fulfill-stars',options);return null}
function selectSource(element,path){document.querySelectorAll('[data-source].selected').forEach(node=>node.classList.remove('selected'));selectedSource={id:element.dataset.source,path};element.classList.add('selected');$('feedback').textContent='選好了！現在點目的地，或直接把它拖過去。'}
function performDecision(sourceId,targetId,path){clearTimeout(hintTimer);const previousScene=starboxV3Scene(session).id,action=targetId==='outside'?starboxV3ActionFor(session,'outside-drop',{sourceId,targetId}):actionForDecision(sourceId,targetId);if(!action)return;session=applyStarboxV3Action(session,action,{interactionPath:path});const last=session.interactionLog.at(-1),accepted=last?.accepted,code=last?.resultCode;if(sound&&accepted)playChime(previousScene==='open-box'?280:440);$('feedback').textContent=accepted?'貨物到對地方了！':code==='outside-drop'?'還沒放進目的地；貨物安全回到原位。':code==='v3-wrong-quantity-choice'?'這一組數量和訂單／托盤對不上，再圈一組看看。':'這個目的地現在不適合這批貨，再想一想。';$('feedback').className=`feedback ${accepted?'success':'recover'}`;setTimeout(render,accepted?300:650)}
function bindObjectInteractions(){
  document.querySelectorAll('[data-source]').forEach(element=>{let start=null,moved=false,keyboard=false;element.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' ')keyboard=true});element.addEventListener('click',()=>{if(moved){moved=false;return}selectSource(element,keyboard?'keyboard':'tap-direct');keyboard=false});element.addEventListener('pointerdown',event=>{start={x:event.clientX,y:event.clientY};moved=false;element.setPointerCapture?.(event.pointerId)});element.addEventListener('pointermove',event=>{if(start&&Math.hypot(event.clientX-start.x,event.clientY-start.y)>12){moved=true;element.classList.add('dragging')}});element.addEventListener('pointerup',event=>{if(!start||nativeDragSource)return;const wasDrag=Math.hypot(event.clientX-start.x,event.clientY-start.y)>28;element.classList.remove('dragging');start=null;if(!wasDrag)return;const target=document.elementFromPoint(event.clientX,event.clientY)?.closest('[data-target]');performDecision(element.dataset.source,target?.dataset.target||'outside','pointer-drag')});element.addEventListener('pointercancel',()=>{start=null;element.classList.remove('dragging')});element.addEventListener('dragstart',event=>{nativeDragSource=element.dataset.source;nativeDecisionHandled=false;element.classList.add('dragging');event.dataTransfer?.setData('text/plain',nativeDragSource)});element.addEventListener('dragend',()=>{element.classList.remove('dragging');if(nativeDragSource&&!nativeDecisionHandled)performDecision(nativeDragSource,'outside','pointer-drag');nativeDragSource=null;nativeDecisionHandled=false})});
  document.querySelectorAll('[data-target]').forEach(element=>{let keyboard=false;element.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' ')keyboard=true});element.addEventListener('click',()=>{if(!selectedSource){$('feedback').textContent='先選一批發光的貨物。';element.classList.add('hint-pulse');return}performDecision(selectedSource.id,element.dataset.target,keyboard?'keyboard':selectedSource.path);keyboard=false})});
  $('workbench').ondragover=event=>event.preventDefault();$('workbench').ondrop=event=>{event.preventDefault();const sourceId=nativeDragSource||event.dataTransfer?.getData('text/plain'),target=event.target.closest('[data-target]');if(!sourceId)return;nativeDecisionHandled=true;performDecision(sourceId,target?.dataset.target||'outside','pointer-drag')};
}
function playChime(frequency){try{const AudioContext=window.AudioContext||window.webkitAudioContext,context=new AudioContext(),osc=context.createOscillator(),gain=context.createGain();osc.frequency.value=frequency;gain.gain.setValueAtTime(.035,context.currentTime);gain.gain.exponentialRampToValueAtTime(.001,context.currentTime+.12);osc.connect(gain).connect(context.destination);osc.start();osc.stop(context.currentTime+.12)}catch{}}
function scheduleHint(){clearTimeout(hintTimer);hintTimer=setTimeout(()=>{document.querySelector('[data-source]')?.classList.add('hint-pulse')},5000)}
function showHint(reason='child-requested-hint'){
  session=markStarboxV3SupportUsed(session,reason);const scene=starboxV3Scene(session),hint=starboxV3Hint(scene.id);document.querySelectorAll('[data-source],[data-target]').forEach(node=>node.classList.add('hint-pulse'));$('feedback').textContent={
    'move-deliveries-together':'看中央工作台：兩批貨都要到同一個地方。','show-ten-slot-outline':'托盤有十格；這次把十顆一起圈起來。','pulse-filled-lid':'十格都滿了，現在把它們封成同一箱。','pair-box-group-with-order':'先比較訂單需要幾個箱子。','pulse-single-openable-box':'打開一箱，原地會出現十顆星星。','pair-star-group-with-order':'把訂單剩下需要的星星一起送出。'
  }[hint.cue]||'看看正在發光的物件。';$('hintBtn').disabled=true;updateFounder()
}
function showSuccess(){
  clearTimeout(hintTimer);$('successPanel').hidden=false;$('successPurpose').textContent='你完成了這批任務。';$('finishedInventory').innerHTML=makeObjects(session.coreState.workspace);$('discoveryBtn').hidden=session.problem.expectedExchange.direction==null;$('nextBtn').textContent=caseId==='run'&&missionIndex<3?'下一個任務 →':caseId==='run'?'點亮工坊 →':'再玩一題 →';
}
function renderDiscoveryObjects(side){return `<div class="discovery-side">${makeObjects(side)}</div>`}
function openDiscovery(){const discovery=starboxV3Discovery(session);session={...session,discoveryViewed:true};$('discoveryObjects').innerHTML=`${renderDiscoveryObjects({tens:discovery.objectBefore.sealedStarboxes,ones:discovery.objectBefore.looseStars})}<div class="discovery-arrow">→</div>${renderDiscoveryObjects({tens:discovery.objectAfter.sealedStarboxes,ones:discovery.objectAfter.looseStars})}`;$('discoveryStatement').textContent=discovery.statement;const v=discovery.vertical,operator=v.operator|| (session.problem.operation==='add'?'+':'−');$('verticalNotation').innerHTML=`<div>${session.problem.left}</div><div>${operator} ${session.problem.right}</div><div>${session.problem.answer}</div>`;$('discoveryDialog').showModal();updateFounder()}
function advance(){if(caseId!=='run'){seed++;beginMission();return}if(missionIndex<3){missionIndex++;beginMission()}else $('runCompleteDialog').showModal()}
function updateFounder(){if(!founder)return;$('founderPanel').hidden=false;$('founderDebug').textContent=JSON.stringify({...starboxV3FounderReadback(session,{pageErrors:window.__NQ_STARBOX_ERRORS__}),route:{caseId,seed,missionIndex},access:{flag:STARBOX_V3_FLAG,publicHomeEntry:false}},null,2)}

$('hintBtn').addEventListener('click',()=>showHint());$('soundBtn').addEventListener('click',()=>{sound=!sound;$('soundBtn').setAttribute('aria-pressed',String(sound));$('soundBtn').textContent=sound?'🔊':'🔇'});$('discoveryBtn').addEventListener('click',openDiscovery);$('closeDiscovery').addEventListener('click',()=>$('discoveryDialog').close());$('discoveryDone').addEventListener('click',()=>$('discoveryDialog').close());$('nextBtn').addEventListener('click',advance);$('replayRunBtn').addEventListener('click',()=>{missionIndex=0;$('runCompleteDialog').close();beginMission()});
if(!starboxV3AccessEnabled(location.search)){document.body.innerHTML='<main class="starbox-app"><section class="workshop"><div class="mission-copy"><h1>這扇工坊門還沒打開</h1><p>請從創辦人測試連結進入。</p><p><a class="back-link" href="index.html">← 回 Number Quest</a></p></div></section></main>'}else beginMission();
