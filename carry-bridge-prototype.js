import {
  CARRY_BRIDGE_PROTOTYPE_RULES,applyCarryBridgePrototypeIntent,carryBridgeDigitDialAnswer,
  carryBridgeDogfoodSelection,carryBridgeExactTenTray,carryBridgePrototypeAccessEnabled,
  carryBridgePrototypeDebugReadback,carryBridgePrototypeHint,carryBridgePrototypeNeutralSurface,
  carryBridgePrototypeResultReady,createCarryBridgePrototypeSession,normalizeCarryBridgeDogfoodVariants
} from './src/grade-2a-carry-bridge-prototype.mjs?v=dogfood-3';

const $=id=>document.getElementById(id),params=new URLSearchParams(location.search),enabled=carryBridgePrototypeAccessEnabled(location.search),debug=params.get('debug')==='1',founder=params.get('founder')==='1',variants=normalizeCarryBridgeDogfoodVariants(params);
let seed=Math.max(1,Number(params.get('seed'))||1),session=null,selected={one:new Set(),ten:new Set()},selectedLoads=new Set(),dragPayload=null,pointerDrag=null,suppressBlockClick=false,dials={tens:0,ones:0};
const seeded=value=>()=>((value=Math.imul(value,1664525)+1013904223>>>0)/4294967296);
const ruleFromQuery=()=>CARRY_BRIDGE_PROTOTYPE_RULES.includes(params.get('case'))?params.get('case'):'add-regroup';

if(enabled){
  $('prototypeGate').hidden=true;$('prototypeApp').hidden=false;$('qaPanel').hidden=!debug;$('founderPanel').hidden=!founder;
  configureVariants();startCase(ruleFromQuery());
}

function configureVariants(){
  const copy={
    'tap-first':'先點選貨物，再點目的地；想拖也可以。',
    'drag-first':'把貨物拖到目的地；點選路徑也一直保留。',
    balanced:'點一下選取，或直接拖到目的地。'
  };
  $('interactionHelp').textContent=copy[variants.interaction];
  $('cargoSlipEntry').hidden=variants.result!=='cargo-slip';$('digitDialEntry').hidden=variants.result!=='digit-dials';
  if(founder){
    $('interactionVariant').value=variants.interaction;$('bundleVariant').value=variants.bundle;$('resultVariant').value=variants.result;
    $('variantReadback').textContent=`目前：${variants.interaction} · ${variants.bundle} · ${variants.result}。所有版本共用相同語意核心，且不寫入進度。`;
  }
}

function startCase(ruleId){
  session=createCarryBridgePrototypeSession(ruleId,{rng:seeded(seed),sourceNonce:seed++,variants});selected={one:new Set(),ten:new Set()};selectedLoads=new Set();dials={tens:0,ones:0};
  $('answerInput').value='';$('hintPanel').textContent='';$('feedback').className='feedback';$('feedback').textContent='慢慢試，每一次操作都可以再調整。';$('caseRuleSelect').value=ruleId;render();
}

function bindPointerDrag(node,unit,index=null){node.addEventListener('pointerdown',event=>{if(event.button!==undefined&&event.button!==0)return;pointerDrag={unit,index,pointerId:event.pointerId,startX:event.clientX,startY:event.clientY,moved:false};node.classList.add('dragging')})}
function uiFeedback(message,tone='neutral'){const root=$('feedback');root.className=`feedback ${tone}`;root.textContent=message;renderDebug()}

function sourceCard(label,value,index,{interactive=true}={}){
  const card=document.createElement(interactive?'button':'div');card.className=`load-card${selectedLoads.has(index)?' selected':''}`;card.innerHTML=`<b>${label}</b><span>${value} 件貨物</span>`;
  if(!interactive)return card;
  card.type='button';card.draggable=true;card.setAttribute('aria-pressed',String(selectedLoads.has(index)));card.setAttribute('aria-label',`${label} ${value} 件；選取後送往合流台`);
  card.addEventListener('click',()=>{selectedLoads.has(index)?selectedLoads.delete(index):selectedLoads.add(index);renderSources();renderDebug()});
  card.addEventListener('dragstart',event=>{dragPayload={unit:'load',index};event.dataTransfer?.setData('text/plain',`load:${index}`)});bindPointerDrag(card,'load',index);return card;
}
function renderSources(){
  const root=$('sourceLoads'),problem=session.problem;root.innerHTML='';
  if(problem.operation==='add'){
    root.append(sourceCard('第一批',problem.left,0),sourceCard('第二批',problem.right,1));$('missionTitle').textContent='讓兩批貨順利合流';$('missionPrompt').textContent=`第一批有 ${problem.left} 件，第二批有 ${problem.right} 件。把兩批都送上合流台。`;
    $('sourceArrivalStatus').textContent=session.coreState.joined?'兩批已合流。':`合流台已收到 ${selectedLoads.size} / 2 批`;
  }else{
    root.append(sourceCard('工作台原有',problem.left,0,{interactive:false}),sourceCard('小船要帶走',problem.right,1,{interactive:false}));$('missionTitle').textContent='替小船準備貨物';$('missionPrompt').textContent=`工作台有 ${problem.left} 件，小船要帶走 ${problem.right} 件。親手把貨移過去。`;$('sourceArrivalStatus').textContent='貨物已在工作台等你。';
  }
}
function selectBlock(unit,index){
  const key=unit==='ten'?'tens':'ones',values=carryBridgeDogfoodSelection(selected[unit],index,{unit,bundleVariant:variants.bundle,workspaceCount:Number(session.coreState.workspace?.[key]||0)});selected[unit]=new Set(values);renderWorkspace();renderSelection();renderTenTray();renderDebug();
}
function block(unit,index){
  const button=document.createElement('button'),set=selected[unit];button.className=`math-block ${unit}`;button.type='button';button.draggable=true;button.dataset.unit=unit;button.dataset.index=String(index);button.setAttribute('aria-pressed',String(set.has(index)));button.setAttribute('aria-label',unit==='ten'?`第 ${index+1} 捆十`:`第 ${index+1} 個一`);button.textContent=unit==='ten'?'10':'1';
  button.addEventListener('click',()=>{if(suppressBlockClick){suppressBlockClick=false;return}selectBlock(unit,index)});
  button.addEventListener('dragstart',event=>{if(!set.has(index)){selected={one:new Set(),ten:new Set()};selected[unit].add(index)}dragPayload={unit,index};event.dataTransfer?.setData('text/plain',unit);renderSelection();renderTenTray()});bindPointerDrag(button,unit,index);return button;
}
function renderWorkspace(){
  const root=$('workspace'),state=session.coreState;root.innerHTML='';
  if(!state.workspace){const empty=document.createElement('div');empty.className='empty-workspace';empty.innerHTML='<span aria-hidden="true">🛠️</span><b>先把兩批貨送上合流台</b>';root.append(empty);return}
  for(const unit of ['ten','one']){const key=unit==='ten'?'tens':'ones',column=document.createElement('section'),list=document.createElement('div');column.className='unit-column';column.innerHTML=`<h3><span>${unit==='ten'?'十':'一'}</span><b>${state.workspace[key]}</b></h3>`;list.className='blocks';for(let index=0;index<state.workspace[key];index++)list.append(block(unit,index));column.append(list);root.append(column)}
}
function renderSelection(){const tens=selected.ten.size,ones=selected.one.size;$('selectionStatus').textContent=tens||ones?`集貨盤：${tens} 個十、${ones} 個一`:'點貨物，把它放進集貨盤'}
function renderTenTray(){
  const tray=carryBridgeExactTenTray(selected.one.size),root=$('tenTraySlots');root.innerHTML='';
  for(let index=0;index<10;index++){const slot=document.createElement('span');slot.className=index<tray.filledSlots?'filled':'';slot.textContent=index<tray.filledSlots?'1':'·';root.append(slot)}
  $('tenTrayCount').className=tray.exactTen?'ready':tray.overflowCount?'overflow':'';$('tenTrayCount').textContent=tray.overflowCount?`${tray.selectedOneCount} 個（多了 ${tray.overflowCount} 個）`:`${tray.selectedOneCount} / 10`;
  $('tenTrayTitle').textContent=variants.bundle==='pair-scoop'?'十格雙貨鏟':'十格集貨盤';
}
function feedbackFor(code,accepted){
  const messages={
    'loads-joined':'咔噠！兩批貨已經到同一張工作台。','ones-bundled-to-ten':'剛好十個一，綁成一個十；貨物一件也沒少。','ten-split-to-ones':'一個十打開成十個一；貨物一件也沒少。','tens-unloaded':'十的貨物已送上小船。','ones-unloaded':'一的貨物已送上小船。','place-aligned':'停靠成功。','mission-complete':'貨單和工作台完全對上了！','numeric-answer-incorrect':'這張貨單還沒對上，再看看工作台。','semantic-action-incomplete':'數字可能對了，但貨物還要親手整理完。','unnecessary-exchange':'這批貨不用換裝，工作台沒有改變。','wrong-exchange-direction':'這個方向不適合現在的貨物，工作台沒有改變。','invalid-exchange-unit-count':'集貨盤要剛好十個一，工作台沒有改變。','insufficient-ones-for-exchange':'還沒有十個一可以綁起來。','insufficient-tens-for-exchange':'現在沒有足夠的十可以打開。','exchange-required':'個位貨物不夠移，看看能不能打開一個十。','smaller-digit-first':'要從工作台原有的貨物往外移。','place-value-misalignment':'這個貨物有自己的停靠格，再試一次。','invalid-unload-action':'先選同一種貨物，再送到卸貨區。','unload-exceeds-target':'小船沒有要這麼多，工作台沒有改變。','loads-already-joined':'貨物已經合流了。','mission-already-complete':'這批貨已經整理完成。'};
  const root=$('feedback');root.className=`feedback ${accepted?'good':'neutral'}`;root.textContent=messages[code]||'這個操作沒有改變貨物，可以換個方法再試。';
}
function applyIntent(intent,path){session=applyCarryBridgePrototypeIntent(session,intent,{interactionPath:path});const result=session.coreState.lastActionResult;selected={one:new Set(),ten:new Set()};feedbackFor(result.code,result.accepted);render()}
function unitForTarget(payload){if(payload?.unit==='one'||payload?.unit==='ten')return payload.unit;if(selected.one.size&&!selected.ten.size)return'one';if(selected.ten.size&&!selected.one.size)return'ten';return null}
function stageLoad(index,path){
  if(session.problem.operation!=='add')return uiFeedback('這兩張牌只是告訴你小船的任務。');
  if(Number.isInteger(index))selectedLoads.add(index);
  if(selectedLoads.size<2){renderSources();return uiFeedback('合流台收到一批，還有另一批在等你。')}
  selectedLoads.clear();applyIntent({type:'join-loads'},path);
}
function activate(target,path,payload=null){
  if(target==='join')return stageLoad(payload?.unit==='load'?payload.index:null,path);
  if(target==='bundle'){if(payload?.unit==='one'&&!selected.one.size)selected.one.add(payload.index??0);return applyIntent({type:'bundle-ones',count:selected.one.size},path)}
  if(target==='split'){if(payload?.unit==='ten'&&!selected.ten.size)selected.ten.add(payload.index??0);return applyIntent({type:'split-ten',count:selected.ten.size},path)}
  if(target==='unload'){const unit=unitForTarget(payload),count=unit?selected[unit].size:0;return applyIntent({type:'unload-units',unit,count},path)}
  if(target==='tens-lane'||target==='ones-lane'){const unit=unitForTarget(payload);return applyIntent({type:'place-unit',unit,lane:target==='tens-lane'?'tens':'ones'},path)}
}
function resultReady(){return carryBridgePrototypeResultReady(session)}
function renderFinish(){
  const ready=resultReady(),complete=session.coreState.complete,controls=[$('answerInput'),$('submitAnswer'),$('submitDialAnswer'),...document.querySelectorAll('[data-dial]')];$('finishCard').classList.toggle('is-locked',!ready);$('finishCard').classList.toggle('is-complete',complete);$('finishGateMessage').hidden=ready;for(const control of controls)control.disabled=!ready||complete;
}
function renderRhythm(){
  const ready=resultReady(),complete=session.coreState.complete,started=session.problem.operation==='add'?session.coreState.joined:session.coreState.actionTrace.some(item=>item.accepted);
  const set=(id,state)=>{$(id).className=state};set('rhythmMove',complete||ready||started?'done':'active');set('rhythmBuild',complete||ready?'done':started?'active':'');set('rhythmStamp',complete?'done':ready?'active':'');
}
function renderDebug(){
  if(!debug)return;const readback=carryBridgePrototypeDebugReadback(session);readback.pageErrors=[...(window.__NQ_PROTOTYPE_PAGE_ERRORS__||[])];readback.neutralSurface=carryBridgePrototypeNeutralSurface(session.problem);readback.dogfoodUI={selectedLoads:[...selectedLoads],selected:{one:[...selected.one],ten:[...selected.ten]},resultReady:resultReady(),variants:{...variants},founderSwitcherVisible:founder};$('prototypeDebug').textContent=JSON.stringify(readback,null,2);
}
function render(){renderSources();renderWorkspace();renderSelection();renderTenTray();renderFinish();renderRhythm();renderDebug()}

document.addEventListener('pointermove',event=>{
  if(!pointerDrag||event.pointerId!==pointerDrag.pointerId)return;
  if(Math.hypot(event.clientX-pointerDrag.startX,event.clientY-pointerDrag.startY)>8)pointerDrag.moved=true;
  document.body.classList.toggle('pointer-dragging',pointerDrag.moved);document.querySelectorAll('[data-target]').forEach(node=>node.classList.remove('drag-over'));
  if(pointerDrag.moved)document.elementFromPoint(event.clientX,event.clientY)?.closest?.('[data-target]')?.classList.add('drag-over');
});
document.addEventListener('pointerup',event=>{
  if(!pointerDrag||event.pointerId!==pointerDrag.pointerId)return;
  const completed=pointerDrag,zone=document.elementFromPoint(event.clientX,event.clientY)?.closest?.('[data-target]');pointerDrag=null;document.body.classList.remove('pointer-dragging');document.querySelectorAll('.dragging,[data-target].drag-over').forEach(node=>node.classList.remove('dragging','drag-over'));
  if(!completed.moved||!zone)return;
  if(completed.unit==='one'||completed.unit==='ten')selected[completed.unit].add(completed.index??0);
  suppressBlockClick=true;activate(zone.dataset.target,'pointer-drag',{unit:completed.unit,index:completed.index});setTimeout(()=>{suppressBlockClick=false},0);
});
document.addEventListener('pointercancel',()=>{pointerDrag=null;document.body.classList.remove('pointer-dragging');document.querySelectorAll('.dragging,[data-target].drag-over').forEach(node=>node.classList.remove('dragging','drag-over'))});

document.querySelectorAll('[data-target]').forEach(zone=>{
  zone.addEventListener('click',()=>activate(zone.dataset.target,'tap-select-place'));
  zone.addEventListener('dragover',event=>{event.preventDefault();zone.classList.add('drag-over')});
  zone.addEventListener('dragleave',()=>zone.classList.remove('drag-over'));
  zone.addEventListener('drop',event=>{event.preventDefault();zone.classList.remove('drag-over');activate(zone.dataset.target,'pointer-drag',dragPayload);dragPayload=null});
});
$('answerInput').addEventListener('input',event=>{event.target.value=event.target.value.replace(/\D/g,'').slice(0,2)});
$('submitAnswer').addEventListener('click',()=>applyIntent({type:'submit-answer',answer:$('answerInput').value},'tap-select-place'));
$('answerInput').addEventListener('keydown',event=>{if(event.key==='Enter')$('submitAnswer').click()});
document.querySelectorAll('[data-dial]').forEach(button=>button.addEventListener('click',()=>{const key=button.dataset.dial,step=Number(button.dataset.step);dials[key]=(dials[key]+step+10)%10;$(`${key}Dial`).textContent=String(dials[key]);renderDebug()}));
$('submitDialAnswer').addEventListener('click',()=>applyIntent({type:'submit-answer',answer:carryBridgeDigitDialAnswer(dials.tens,dials.ones)},'tap-select-place'));
$('hintButton').addEventListener('click',()=>{const hint=carryBridgePrototypeHint(session),copy={
  'add-align':'看看「十」和「一」各自的停靠格。','add-carry-value':'把「一」送進十格集貨盤，看看何時剛好填滿。','sub-direction':'從工作台原有的貨物往小船移。','sub-borrow-value':'個位不夠時，可以打開一個十看看。'
};$('hintPanel').textContent=`${copy[hint.signalId]} 線索停在這裡，下一步交給你。`});
$('leavePrototype').addEventListener('click',()=>location.assign('index.html'));
$('newCaseButton').addEventListener('click',()=>startCase($('caseRuleSelect').value));
$('caseRuleSelect').addEventListener('change',()=>startCase($('caseRuleSelect').value));
$('applyVariants').addEventListener('click',()=>{const next=new URLSearchParams(location.search);next.set('prototype','carry-bridge');next.set('founder','1');next.set('interaction',$('interactionVariant').value);next.set('bundle',$('bundleVariant').value);next.set('result',$('resultVariant').value);location.search=next.toString()});
if('serviceWorker'in navigator)navigator.serviceWorker.register('./sw.js').catch(error=>window.__NQ_PROTOTYPE_PAGE_ERRORS__.push(String(error)));

window.carryBridgePrototypeQA={
  snapshot:()=>({...carryBridgePrototypeDebugReadback(session),dogfoodUI:{variants:{...variants},resultReady:resultReady(),selectedLoads:[...selectedLoads],selected:{one:[...selected.one],ten:[...selected.ten]}}}),
  startCase:ruleId=>startCase(ruleId),
  applyIntent:(intent,interactionPath='tap-select-place')=>{applyIntent(intent,interactionPath);return carryBridgePrototypeDebugReadback(session)},
  variants:()=>({...variants}),pageErrors:()=>[...(window.__NQ_PROTOTYPE_PAGE_ERRORS__||[])]
};
