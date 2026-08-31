import {
  CARRY_BRIDGE_PROTOTYPE_RULES,applyCarryBridgePrototypeIntent,carryBridgePrototypeAccessEnabled,
  carryBridgePrototypeDebugReadback,carryBridgePrototypeHint,carryBridgePrototypeNeutralSurface,
  createCarryBridgePrototypeSession
} from './src/grade-2a-carry-bridge-prototype.mjs?v=prototype-2';

const $=id=>document.getElementById(id),params=new URLSearchParams(location.search),enabled=carryBridgePrototypeAccessEnabled(location.search),debug=params.get('debug')==='1';
let seed=Math.max(1,Number(params.get('seed'))||1),session=null,selected={one:new Set(),ten:new Set()},dragUnit=null,pointerDrag=null,suppressBlockClick=false;
const seeded=value=>()=>((value=Math.imul(value,1664525)+1013904223>>>0)/4294967296);
const ruleFromQuery=()=>CARRY_BRIDGE_PROTOTYPE_RULES.includes(params.get('case'))?params.get('case'):'add-regroup';

if(enabled){$('prototypeGate').hidden=true;$('prototypeApp').hidden=false;$('qaPanel').hidden=!debug;startCase(ruleFromQuery())}

function startCase(ruleId){
  session=createCarryBridgePrototypeSession(ruleId,{rng:seeded(seed),sourceNonce:seed++});selected={one:new Set(),ten:new Set()};$('answerInput').value='';$('hintPanel').textContent='';$('caseRuleSelect').value=ruleId;render();
}

function digits(value){return {tens:Math.floor(Number(value)/10),ones:Number(value)%10}}
function bindPointerDrag(node,unit,index=null){node.addEventListener('pointerdown',event=>{if(event.button!==undefined&&event.button!==0)return;pointerDrag={unit,index,pointerId:event.pointerId,startX:event.clientX,startY:event.clientY,moved:false};node.classList.add('dragging')})}
function sourceCard(label,value){const card=document.createElement('button');card.className='load-card';card.draggable=true;card.innerHTML=`<b>${label}</b><span>${value} 件貨物</span>`;card.addEventListener('dragstart',event=>{dragUnit='load';event.dataTransfer?.setData('text/plain','load')});bindPointerDrag(card,'load');return card}
function renderSources(){
  const root=$('sourceLoads'),problem=session.problem;root.innerHTML='';
  if(problem.operation==='add'){root.append(sourceCard('第一批',problem.left),sourceCard('第二批',problem.right));$('missionTitle').textContent='讓兩批貨順利合流';$('missionPrompt').textContent=`第一批有 ${problem.left} 件，第二批有 ${problem.right} 件。親手整理工作台。`}
  else{root.append(sourceCard('工作台原有',problem.left),sourceCard('船要帶走',problem.right));$('missionTitle').textContent='替小船準備貨物';$('missionPrompt').textContent=`工作台有 ${problem.left} 件，船要帶走 ${problem.right} 件。親手把貨移過去。`}
}
function block(unit,index){
  const button=document.createElement('button'),set=selected[unit];button.className=`math-block ${unit}`;button.type='button';button.draggable=true;button.dataset.unit=unit;button.dataset.index=String(index);button.setAttribute('aria-pressed',String(set.has(index)));button.setAttribute('aria-label',unit==='ten'?`第 ${index+1} 捆十`:`第 ${index+1} 個一`);button.textContent=unit==='ten'?'10':'1';
  button.addEventListener('click',()=>{if(suppressBlockClick){suppressBlockClick=false;return}set.has(index)?set.delete(index):set.add(index);renderWorkspace();renderSelection()});
  button.addEventListener('dragstart',event=>{if(!set.has(index)){selected={one:new Set(),ten:new Set()};selected[unit].add(index)}dragUnit=unit;event.dataTransfer?.setData('text/plain',unit);renderSelection()});bindPointerDrag(button,unit,index);return button
}
function renderWorkspace(){
  const root=$('workspace'),state=session.coreState;root.innerHTML='';
  if(!state.workspace){const empty=document.createElement('div');empty.className='empty-workspace';empty.textContent=session.problem.operation==='add'?'把兩批貨拖到或點選「合流台」':'工作台準備中';root.append(empty);return}
  for(const unit of ['ten','one']){const key=unit==='ten'?'tens':'ones',column=document.createElement('section'),list=document.createElement('div');column.className='unit-column';column.innerHTML=`<h3>${unit==='ten'?'十':'一'}：${state.workspace[key]}</h3>`;list.className='blocks';for(let index=0;index<state.workspace[key];index++)list.append(block(unit,index));column.append(list);root.append(column)}
}
function renderSelection(){const tens=selected.ten.size,ones=selected.one.size;$('selectionStatus').textContent=tens||ones?`已選：${tens} 個十、${ones} 個一`:'還沒有選取貨物'}
function feedbackFor(code,accepted){
  const messages={
    'loads-joined':'兩批貨已經到同一張工作台。','ones-bundled-to-ten':'剛好十個一，換成一個十，數量沒有變。','ten-split-to-ones':'一個十打開成十個一，數量沒有變。','tens-unloaded':'十的貨物已送上船。','ones-unloaded':'一的貨物已送上船。','place-aligned':'放對停靠格了。','mission-complete':'貨單和工作台完全對上了！','numeric-answer-incorrect':'貨單還沒對上，再看看工作台。','semantic-action-incomplete':'數字對了，但工作台還有一步要親手完成。','unnecessary-exchange':'這批貨不用換裝，工作台沒有改變。','wrong-exchange-direction':'這個方向不適合現在的貨物，工作台沒有改變。','invalid-exchange-unit-count':'換裝數量還沒剛剛好，工作台沒有改變。','insufficient-ones-for-exchange':'還沒有十個一可以綁起來。','insufficient-tens-for-exchange':'現在沒有足夠的十可以打開。','exchange-required':'個位貨物不夠移，看看能不能打開一個十。','smaller-digit-first':'要從工作台原有的貨物往外移。','place-value-misalignment':'這個貨物有自己的停靠格，再試一次。','invalid-unload-action':'先選同一種貨物，再送到卸貨區。','unload-exceeds-target':'小船沒有要這麼多，工作台沒有改變。','loads-already-joined':'貨物已經合流了。','mission-already-complete':'這批貨已經整理完成。'};
  const root=$('feedback');root.className=`feedback ${accepted?'good':'neutral'}`;root.textContent=messages[code]||'這個操作沒有改變貨物，可以換個方法再試。'
}
function applyIntent(intent,path){session=applyCarryBridgePrototypeIntent(session,intent,{interactionPath:path});const result=session.coreState.lastActionResult;selected={one:new Set(),ten:new Set()};feedbackFor(result.code,result.accepted);render()}
function unitForTarget(dropUnit){if(dropUnit==='one'||dropUnit==='ten')return dropUnit;if(selected.one.size&&!selected.ten.size)return'one';if(selected.ten.size&&!selected.one.size)return'ten';return null}
function activate(target,path,dropUnit=null){
  if(target==='join')return applyIntent({type:'join-loads'},path);
  if(target==='bundle'){if(dropUnit==='one'&&!selected.one.size)selected.one.add(0);return applyIntent({type:'bundle-ones',count:selected.one.size},path)}
  if(target==='split'){if(dropUnit==='ten'&&!selected.ten.size)selected.ten.add(0);return applyIntent({type:'split-ten',count:selected.ten.size},path)}
  if(target==='unload'){const unit=unitForTarget(dropUnit),count=unit?selected[unit].size:0;return applyIntent({type:'unload-units',unit,count},path)}
  if(target==='tens-lane'||target==='ones-lane'){const unit=unitForTarget(dropUnit);return applyIntent({type:'place-unit',unit,lane:target==='tens-lane'?'tens':'ones'},path)}
}
function renderDebug(){if(!debug)return;const readback=carryBridgePrototypeDebugReadback(session);readback.pageErrors=[...(window.__NQ_PROTOTYPE_PAGE_ERRORS__||[])];readback.neutralSurface=carryBridgePrototypeNeutralSurface(session.problem);$('prototypeDebug').textContent=JSON.stringify(readback,null,2)}
function render(){renderSources();renderWorkspace();renderSelection();renderDebug()}

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
  suppressBlockClick=true;activate(zone.dataset.target,'pointer-drag',completed.unit);setTimeout(()=>{suppressBlockClick=false},0);
});
document.addEventListener('pointercancel',()=>{pointerDrag=null;document.body.classList.remove('pointer-dragging');document.querySelectorAll('.dragging,[data-target].drag-over').forEach(node=>node.classList.remove('dragging','drag-over'))});

document.querySelectorAll('[data-target]').forEach(zone=>{
  zone.addEventListener('click',()=>activate(zone.dataset.target,'tap-select-place'));
  zone.addEventListener('dragover',event=>{event.preventDefault();zone.classList.add('drag-over')});
  zone.addEventListener('dragleave',()=>zone.classList.remove('drag-over'));
  zone.addEventListener('drop',event=>{event.preventDefault();zone.classList.remove('drag-over');activate(zone.dataset.target,'pointer-drag',dragUnit);dragUnit=null});
});
$('submitAnswer').addEventListener('click',()=>applyIntent({type:'submit-answer',answer:$('answerInput').value},'tap-select-place'));
$('answerInput').addEventListener('keydown',event=>{if(event.key==='Enter')$('submitAnswer').click()});
$('hintButton').addEventListener('click',()=>{const hint=carryBridgePrototypeHint(session),copy={
  'add-align':'看看「十」和「一」各自的停靠格。','add-carry-value':'試著選出剛好十個一，再送到換裝台。','sub-direction':'從工作台原有的貨物往小船移。','sub-borrow-value':'個位不夠時，可以打開一個十看看。'
};$('hintPanel').textContent=`${copy[hint.signalId]} 線索停在這裡，下一步交給你。`});
$('leavePrototype').addEventListener('click',()=>location.assign('index.html'));
$('newCaseButton').addEventListener('click',()=>startCase($('caseRuleSelect').value));
$('caseRuleSelect').addEventListener('change',()=>startCase($('caseRuleSelect').value));
if('serviceWorker'in navigator)navigator.serviceWorker.register('./sw.js').catch(error=>window.__NQ_PROTOTYPE_PAGE_ERRORS__.push(String(error)));

window.carryBridgePrototypeQA={
  snapshot:()=>carryBridgePrototypeDebugReadback(session),
  startCase:ruleId=>startCase(ruleId),
  applyIntent:(intent,interactionPath='tap-select-place')=>{applyIntent(intent,interactionPath);return carryBridgePrototypeDebugReadback(session)},
  pageErrors:()=>[...(window.__NQ_PROTOTYPE_PAGE_ERRORS__||[])]
};
