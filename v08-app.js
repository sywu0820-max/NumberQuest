import {
  WORLDS,CHALLENGE_LENGTHS,COLLECTIBLES,NUMBER_SENSE_SKILLS,MULTIPLICATION_SKILLS,DIVISION_SKILLS,
  localDayKey,normalizeState,dailyQuests,bossReady,makeQuestion,makeMixedQuestion,makeFocusQuestion,
  makeDivisionQuestion,makeStoryQuestion,storyDiversitySummary,visualHintModel,takeDueReview,queueSpacedReview,completeSpacedReview,
  recordSkillMiss,recordSkillSuccess,skillMastery,challengeWeights,mixedSkillKeys,divisionUnlocked,
  beginLearningSession,finishRun,finishSpecialRun,claimReadyDaily,memoryChestStatus,dueMemoryReviews,
  makeMemoryReviewQuestion,recordMemoryPractice,recordMemoryMiss,completeMemoryRetrieval
} from './src/v08-core.mjs';

const STATE_KEY='nq-state-v05',LEGACY_KEY='nq-state-v04';
const $=id=>document.getElementById(id);
const QA_MODE=new URLSearchParams(location.search).get('qa')==='v08';
let S=normalizeState(load(),localDayKey());
let wi=0,q=null,correct=0,attempted=false,missRecorded=false,missCount=0,combo=0,maxCombo=0,boss=false,bossHP=0,totalNeeded=10,locked=false;
let runMode='world',challengeLevel=2,comboRewards=new Set(),introContinuation=null,activeUtterance=null,memoryQueue=[];
let storyRecentTemplates=[],storyRecentThemes=[],storyRunLog=[];

function load(){
  try{const current=localStorage.getItem(STATE_KEY);if(current)return JSON.parse(current);const legacy=localStorage.getItem(LEGACY_KEY);return legacy?JSON.parse(legacy):null}catch{return null}
}
function save(){localStorage.setItem(STATE_KEY,JSON.stringify(S));hud()}
function hud(){
  $('gems').textContent=S.gems;$('gameGems').textContent=S.gems;$('level').textContent=Math.floor(S.xp/100)+1;$('streakDays').textContent=S.streakDays;$('collectionCount').textContent=S.collection.length;
  const keys=[...MULTIPLICATION_SKILLS,...DIVISION_SKILLS,'add:20','sub:20','add:50','sub:50','add:100','sub:100',...NUMBER_SENSE_SKILLS];
  $('powerCount').textContent=keys.filter(key=>skillMastery(S,key).mastered).length;
}
function renderDaily(){
  $('daily').innerHTML='';dailyQuests(S).forEach(x=>{const done=x.now>=x.target,el=document.createElement('div');el.className='quest'+(done?' done':'');const pct=Math.min(100,x.now/x.target*100);el.innerHTML=`<div class="qtop">${x.icon} ${x.label}</div><small>${Math.min(x.now,x.target)} / ${x.target} · 💎${x.reward}</small><div class="mini"><i style="width:${pct}%"></i></div>`;$('daily').append(el)})
}
function renderLengths(){
  $('lengths').innerHTML='';CHALLENGE_LENGTHS.forEach(x=>{const b=document.createElement('button');b.className='length'+(S.selectedLength===x.count?' active':'');b.innerHTML=`<b>${x.icon} ${x.label}</b><small>${x.count===5?'輕鬆暖身':x.count===10?'剛剛好的冒險':'我還要更多！'}</small>`;b.onclick=()=>{S.selectedLength=x.count;save();renderLengths()};$('lengths').append(b)});
  $('storyStatus').textContent=`${S.selectedLength} 題 · 看故事、找關係、用圖想一想`;
}
function renderWorlds(){
  $('worlds').innerHTML='';WORLDS.forEach((w,i)=>{const b=document.createElement('button');b.className='world';b.disabled=i>=S.unlocked;const ready=i<S.unlocked&&bossReady(S,i);b.innerHTML=`<b>${w.icon} ${w.name}</b><span>${i<S.unlocked?w.desc:'🔒 繼續闖關解鎖'}</span><div class="stars">${'★'.repeat(S.best[i]||0)}${'☆'.repeat(5-(S.best[i]||0))}</div>${ready?'<span class="boss-tag">👾 Boss 出現！</span>':''}`;b.onclick=()=>startWorld(i,ready);$('worlds').append(b)})
}
function renderBridge(){
  const open=divisionUnlocked(S),b=$('divisionBtn');b.disabled=!open;b.classList.toggle('locked-bridge',!open);
  $('divisionStatus').textContent=open?'用熟悉的乘法跨過新橋':'先完成 5 題乘法，橋就會亮起來';
}
function renderMemory(){
  const status=memoryChestStatus(S,{day:localDayKey()}),button=$('memoryBtn');button.disabled=!status.ready;button.classList.toggle('ready',status.ready);$('memoryStatus').textContent=status.label;
}
function renderHome(){
  cancelSpeech();S=normalizeState(S,localDayKey());claimReadyDaily(S);save();renderDaily();renderLengths();renderBridge();renderMemory();renderWorlds();$('home').style.display='block';$('game').style.display='none'
}
function levelForLength(n){return n>=20?3:n>=10?2:1}
function updateQaOutput(){if(!QA_MODE)return;const output=$('v08Debug');if(output)output.textContent=JSON.stringify({currentQuestion:q?JSON.parse(JSON.stringify(q)):null,storyRun:storyRunLog.map(item=>({...item})),diversity:storyDiversitySummary(storyRunLog.map(item=>({story:true,storyTemplateId:item.templateId,storyThemeId:item.themeId,txt:item.text})))})}
function resetRun(){correct=0;combo=0;maxCombo=0;locked=false;attempted=false;missRecorded=false;missCount=0;memoryQueue=[];storyRecentTemplates=[];storyRecentThemes=[];storyRunLog=[];comboRewards=new Set();cancelSpeech();clearVisualHint();updateQaOutput();beginLearningSession(S);save()}
function showGame(){$('home').style.display='none';$('game').style.display='block';$('bossPanel').style.display=boss?'block':'none';updateBars();next()}
function startWorld(i,isBoss){resetRun();wi=i;boss=isBoss;runMode='world';challengeLevel=levelForLength(S.selectedLength);totalNeeded=boss?Math.min(12,S.selectedLength+2):S.selectedLength;bossHP=boss?totalNeeded:0;$('worldTitle').textContent=`${WORLDS[i].icon} ${WORLDS[i].name}`;$('mode').textContent=boss?'⚔️ BOSS 戰':`🚀 ${totalNeeded} 題遠征`;showGame()}
function startStory(){resetRun();boss=false;runMode='story';challengeLevel=levelForLength(S.selectedLength);totalNeeded=S.selectedLength;$('worldTitle').textContent='📖 故事任務';$('mode').textContent=`📖 ${totalNeeded} 題故事冒險`;showGame()}
function startFocus(){resetRun();boss=false;runMode='focus';challengeLevel=3;totalNeeded=10;$('worldTitle').textContent='🎯 下一個能力冒險';$('mode').textContent='🎯 10 題弱點特訓';showGame()}
function startAcademy(){resetRun();boss=false;runMode='academy';challengeLevel=3;totalNeeded=20;$('worldTitle').textContent='🏆 數字大師遠征';$('mode').textContent='🏆 20 題混合挑戰';showGame()}
function startDivision(){if(!divisionUnlocked(S))return;resetRun();boss=false;runMode='division';challengeLevel=2;totalNeeded=10;$('worldTitle').textContent='🌉 除法橋';$('mode').textContent='🌉 10 題橋梁探險';showGame()}
function startMemory(){
  const due=dueMemoryReviews(S,{day:localDayKey()});if(!due.length)return;resetRun();boss=false;runMode='memory';challengeLevel=2;memoryQueue=due.map(entry=>makeMemoryReviewQuestion(entry));totalNeeded=memoryQueue.length;$('worldTitle').textContent='🧠 記憶寶箱';$('mode').textContent=`🧠 ${totalNeeded} 題力量回憶`;showGame();
}

function next(){
  cancelSpeech();clearVisualHint();attempted=false;missRecorded=false;missCount=0;locked=false;q=runMode==='memory'?memoryQueue[correct]:takeDueReview(S);
  if(!q){if(runMode==='academy')q=makeMixedQuestion(S,{challengeLevel});else if(runMode==='focus')q=makeFocusQuestion(S,{challengeLevel});else if(runMode==='division')q=makeDivisionQuestion(S);else if(runMode==='story')q=makeStoryQuestion(S,{challengeLevel,recentTemplateIds:storyRecentTemplates,recentThemeIds:storyRecentThemes});else q=makeQuestion(wi,S,{challengeLevel})}
  if(runMode==='story'&&q.story){
    storyRunLog.push({templateId:q.storyTemplateId||null,themeId:q.storyThemeId||null,relationshipId:q.storyRelationshipId||null,skillKey:q.skillKey,text:q.txt});
    if(q.storyTemplateId){storyRecentTemplates.push(q.storyTemplateId);storyRecentTemplates=storyRecentTemplates.slice(-5)}
    if(q.storyThemeId){storyRecentThemes.push(q.storyThemeId);storyRecentThemes=storyRecentThemes.slice(-3)}
  }
  updateQaOutput();
  save();
  if(q.op==='div'&&!S.learning.divisionIntroSeen){showDivisionIntro(()=>{S.learning.divisionIntroSeen=true;save();renderQuestion()});return}
  renderQuestion();
}
function renderQuestion(){
  $('question').textContent=q.txt;$('question').classList.toggle('word-question',Boolean(q.story)||q.variant==='compare'||q.variant==='decompose');
  $('readBtn').classList.toggle('visible',Boolean(q.story));$('readBtn').disabled=false;$('readBtn').classList.remove('speaking');
  $('msg').textContent=q.isMemoryReview?'🧠 昨天的力量回來了！':q.isReview?'🧠 這個能力回來了！試試看還記得嗎？':boss?'攻擊 Boss！':q.story?'先找出故事裡的數量關係！':'選一個答案！';$('answers').innerHTML='';
  q.opts.forEach(n=>{const b=document.createElement('button');b.className='ans'+(typeof n==='string'?' expression':'');b.textContent=n;b.onclick=()=>answer(n,b);$('answers').append(b)})
}
function showDivisionIntro(continuation){introContinuation=continuation;$('divisionIntro').style.display='flex'}
function closeDivisionIntro(){$('divisionIntro').style.display='none';const continuation=introContinuation;introContinuation=null;if(continuation)continuation()}

function cancelSpeech(){
  if(window.speechSynthesis&&typeof window.speechSynthesis.cancel==='function')window.speechSynthesis.cancel();activeUtterance=null;
  const button=$('readBtn');if(button){button.disabled=false;button.classList.remove('speaking');button.textContent='🔊 朗讀題目'}
}
function readQuestion(){
  if(!q?.story)return;
  if(!window.speechSynthesis||typeof window.speechSynthesis.cancel!=='function'||typeof window.speechSynthesis.speak!=='function'||typeof window.SpeechSynthesisUtterance!=='function'){$('msg').textContent='🔈 這台裝置暫時不能朗讀，自己慢慢讀也很厲害！';return}
  try{
    window.speechSynthesis.cancel();const utterance=new window.SpeechSynthesisUtterance(q.txt),voices=window.speechSynthesis.getVoices?.()||[];
    utterance.lang='zh-TW';utterance.rate=.86;utterance.pitch=1.05;utterance.voice=voices.find(voice=>/^zh-(TW|Hant)/i.test(voice.lang))||voices.find(voice=>/^zh/i.test(voice.lang))||null;
    activeUtterance=utterance;$('readBtn').classList.add('speaking');$('readBtn').textContent='🔊 正在朗讀';
    const done=()=>{if(activeUtterance===utterance){activeUtterance=null;$('readBtn').classList.remove('speaking');$('readBtn').textContent='🔊 再讀一次'}};
    utterance.onend=done;utterance.onerror=done;window.speechSynthesis.speak(utterance);
  }catch{$('msg').textContent='🔈 這台裝置暫時不能朗讀，自己慢慢讀也很厲害！';cancelSpeech()}
}

function el(tag,className,text){const node=document.createElement(tag);if(className)node.className=className;if(text!==undefined)node.textContent=text;return node}
function clearVisualHint(){const root=$('visualHint');if(!root)return;root.className='visual-hint';root.innerHTML=''}
function renderVisualHint(level){
  const model=visualHintModel(q,{level}),root=$('visualHint');root.innerHTML='';root.className=`visual-hint visible${level>=2?' strong':''}`;
  root.append(el('div','visual-title',level>=2?'🧩 再整理清楚一點':'👀 先看一個小線索'),el('div','visual-copy',model.copy));
  if(model.kind==='number-journey'){
    const row=el('div','journey');row.append(el('span','point',String(model.start)));
    model.steps.forEach(step=>row.append(el('span','jump',typeof step==='number'?`${step>0?'+':'−'}${Math.abs(step)}`:'?')));row.append(el('span',model.end==='?'?'point unknown':'point',String(model.end)));root.append(row);
  }else if(model.kind==='equal-groups'||model.kind==='equal-sharing'){
    const grid=el('div','group-grid');model.groups.forEach(group=>{const box=el('div','visual-group');group.forEach(()=>box.append(el('i','visual-dot')));grid.append(box)});root.append(grid);
  }else if(model.kind==='unknown-equal-groups'){
    const equation=el('div','group-equation');
    if(model.groupCount==='?'){
      const sample=el('div','visual-group');model.sampleItems.forEach(()=>sample.append(el('i','visual-dot')));
      equation.append(sample,el('span','unknown-multiplier','× ? 組'));
    }else{
      const grid=el('div','group-grid');for(let i=0;i<model.groupCount;i++)grid.append(el('div','visual-group unknown-size','?'));equation.append(grid);
    }
    root.append(equation,el('div','known-total',`合起來共有 ${model.knownTotal} 顆`));
    if(model.poolCount){const pool=el('div','pool-dots');for(let i=0;i<model.poolCount;i++)pool.append(el('i','visual-dot'));root.append(pool)}
  }else if(model.kind==='ten-frame'){
    const grid=el('div','ten-frame');model.cells.forEach(state=>grid.append(el('i',`ten-cell ${state}`)));root.append(grid);
  }else if(model.kind==='hundred-tens'){
    const grid=el('div','tens-rods');model.rods.forEach(state=>grid.append(el('i',`ten-rod ${state}`)));root.append(grid);
  }else if(model.kind==='target-estimate'){
    root.append(el('div','visual-copy',`🎯 目標在 ${model.target}`));const list=el('div','estimate-list');
    model.choices.forEach(choice=>{const row=el('div','estimate-row'),track=el('div','estimate-track'),bar=el('i');bar.style.width=`${Math.min(100,choice.tenBand*10)}%`;track.append(bar);row.append(el('span','',choice.label),track);list.append(row)});root.append(list);
  }else if(model.kind==='split-number'){
    const row=el('div','split-visual');row.append(el('span','split-piece',String(model.whole)),el('span','', '→'),el('span','split-piece',String(model.parts[0])),el('span','', '＋'),el('span','split-piece unknown','?'));root.append(row);
  }
}

function answer(n,b){
  if(locked)return;
  if(n===q.ans){
    locked=true;cancelSpeech();correct++;S.daily.solved++;S.gems+=attempted?1:2;S.xp+=attempted?6:10;if(q.isMemoryReview)completeMemoryRetrieval(S,q,{day:localDayKey(),firstTry:!attempted});else{if(q.isReview&&!attempted)completeSpacedReview(S,q);recordSkillSuccess(S,q.skillKey,{firstTry:!attempted,isRevisit:Boolean(q.isReview)});recordMemoryPractice(S,q,{day:localDayKey(),missed:attempted})}
    if(attempted){combo=0;$('msg').textContent=q.isMemoryReview?'✨ 找回來了！明天它會再發光。':q.isReview?'✨ 找到線索了！它之後還會再來。':'✨ 找到了！先繼續冒險，等等再挑戰一次。'}
    else{combo++;maxCombo=Math.max(maxCombo,combo);S.daily.maxCombo=Math.max(S.daily.maxCombo,maxCombo);if(combo>=10&&combo%10===0&&!comboRewards.has(combo)){comboRewards.add(combo);S.gems+=5;$('msg').textContent=`🌟 ${combo} 連擊寶箱！+💎5`}else $('msg').textContent=q.isMemoryReview?'✨ 這個能力記得更久了！':q.isReview?'🧠 自己想起來了！這個能力更亮了！':combo>=3?`⚡ ${combo} 連擊！超強！`:'🎉 一次答對！'}
    if(boss)bossHP--;[...$('answers').children].forEach(x=>x.disabled=true);save();updateBars();if(correct>=totalNeeded)setTimeout(finish,650);else setTimeout(next,560)
  }else{
    attempted=true;missCount+=1;combo=0;if(!missRecorded){missRecorded=true;recordSkillMiss(S,q.skillKey);queueSpacedReview(S,q);if(q.isMemoryReview)recordMemoryMiss(S,q,{day:localDayKey()});else recordMemoryPractice(S,q,{day:localDayKey(),missed:true});save()}b.disabled=true;b.classList.add('wrong-choice');renderVisualHint(missCount>=2?2:1);$('msg').textContent=missCount>=2?`🧩 換個方式整理：${q.hint||'慢慢看圖，再試一次。'}`:(q.hint||'💡 差一點！看看小線索，再試一次。');updateBars()
  }
}
function updateBars(){$('bar').style.width=`${Math.min(100,correct/totalNeeded*100)}%`;$('counter').textContent=`${correct} / ${totalNeeded}`;$('combo').textContent=combo>=2?`⚡ ${combo} 連擊`:'';if(boss)$('hpbar').style.width=`${Math.max(0,bossHP/totalNeeded*100)}%`}
function finish(){
  cancelSpeech();const out=runMode==='world'?finishRun(S,wi,{boss,maxCombo,questionCount:totalNeeded}):finishSpecialRun(S,{mode:runMode,maxCombo,questionCount:totalNeeded});save();
  $('resultEmoji').textContent=boss?'🎆':runMode==='memory'?'🧠':runMode==='academy'?'🏅':runMode==='focus'?'🎯':runMode==='division'?'🌉':runMode==='story'?'📖':'🏆';$('resultTitle').textContent=boss?'Boss 擊破！':runMode==='memory'?'記憶寶箱點亮了！':runMode==='academy'?'20 題大師遠征完成！':runMode==='focus'?'弱點特訓完成！':runMode==='division'?'除法橋探險完成！':runMode==='story'?'故事任務完成！':`${totalNeeded} 題遠征完成！`;
  $('resultText').textContent=`今天又完成 ${totalNeeded} 個挑戰！${out.dailyBonus?` · 今日任務 +💎${out.dailyBonus}`:''}`;$('newCollectible').textContent=out.collectible.isNew?`${out.collectible.icon} 新寶物：${out.collectible.name}${out.collectible.rare?' ✨稀有！':''}`:`${out.collectible.icon} ${out.collectible.name} 已收集，變成額外寶石！`;$('resultOverlay').style.display='flex'
}
function showCollection(){$('collectionGrid').innerHTML='';COLLECTIBLES.forEach(c=>{const got=S.collection.includes(c.id),item=document.createElement('div');item.className='collect'+(!got?' locked':'')+(c.rare?' rare':'');item.innerHTML=`<div class="emoji">${got?c.icon:'❔'}</div><b>${got?c.name:'神秘寶物'}</b>${c.rare?'<div>✨ BOSS</div>':''}`;$('collectionGrid').append(item)});$('collectionOverlay').style.display='flex'}
const powerName=m=>m.power===3?'🏅 徽章覺醒':m.power===2?'✨ 能量成長':m.power===1?'🌱 已經點亮':'🗺️ 等你探索';
function masteryCard(label,key){const m=skillMastery(S,key);return `<div class="master-card power-${m.power}"><b>${label}</b><small>${powerName(m)}${m.successfulRevisits?` · 想起來 ${m.successfulRevisits} 次`:''}</small><div class="power-pips" aria-label="能力等級 ${m.power} / 3"><i></i><i></i><i></i></div></div>`}
function badge(label,key){const m=skillMastery(S,key),item=document.createElement('div');item.className=`table-badge power-${m.power}`;item.innerHTML=`<strong>${label}</strong><span>${m.power===3?'🏅':'✨'.repeat(m.power)||'○'}</span>`;return item}
function skillLabel(key){if(key.startsWith('mul:'))return `${key.split(':')[1]} 的乘法`;if(key.startsWith('div:'))return `${key.split(':')[1]} 的除法橋`;const labels={'add:20':'20 內加法','sub:20':'20 內減法','add:50':'50 內加法','sub:50':'50 內減法','add:100':'100 內加法','sub:100':'100 內減法','sense:missing':'神秘空格','sense:make10':'湊成 10','sense:make100':'湊成 100','sense:compare':'靠近目標','sense:decompose':'拆數魔法'};return labels[key]||'新能力'}
function showMastery(){
  $('mulMastery').innerHTML='';MULTIPLICATION_SKILLS.forEach((key,i)=>$('mulMastery').append(badge(`${i+1}×`,key)));$('divMastery').innerHTML='';DIVISION_SKILLS.forEach((key,i)=>$('divMastery').append(badge(`${i+1}÷`,key)));$('divisionMasterySection').hidden=!divisionUnlocked(S);
  $('arithMastery').innerHTML=[masteryCard('20 內加法','add:20'),masteryCard('20 內減法','sub:20'),masteryCard('50 內加法','add:50'),masteryCard('50 內減法','sub:50'),masteryCard('100 內加法','add:100'),masteryCard('100 內減法','sub:100'),...NUMBER_SENSE_SKILLS.map(key=>masteryCard(skillLabel(key),key))].join('');
  const keys=mixedSkillKeys(S,{challengeLevel:3}),weights=challengeWeights(S,keys,{recentSkills:[]}),nextKey=[...keys].sort((a,b)=>weights[b]-weights[a])[0];$('nextAdventure').textContent=`🧭 下一段冒險：${skillLabel(nextKey)}。多遇見幾次，能力就會慢慢亮起來！`;$('masteryOverlay').style.display='flex'
}

$('homeBtn').onclick=renderHome;$('collectionBtn').onclick=showCollection;$('masteryBtn').onclick=showMastery;$('memoryBtn').onclick=startMemory;$('storyBtn').onclick=startStory;$('focusBtn').onclick=startFocus;$('academyBtn').onclick=startAcademy;$('divisionBtn').onclick=startDivision;$('readBtn').onclick=readQuestion;
$('closeCollection').onclick=()=>$('collectionOverlay').style.display='none';$('closeMastery').onclick=()=>$('masteryOverlay').style.display='none';$('divisionIntroBtn').onclick=closeDivisionIntro;$('resultBtn').onclick=()=>{$('resultOverlay').style.display='none';renderHome()};
Object.defineProperty(window,'__NQ_V08_DEBUG__',{value:{
  getStoryRun:()=>storyRunLog.map(item=>({...item})),
  getStoryDiversity:()=>storyDiversitySummary(storyRunLog.map(item=>({story:true,storyTemplateId:item.templateId,storyThemeId:item.themeId,txt:item.text}))),
  getCurrentQuestion:()=>q?JSON.parse(JSON.stringify(q)):null
},configurable:false,writable:false});
window.addEventListener('pagehide',cancelSpeech);hud();renderHome();if('serviceWorker'in navigator)navigator.serviceWorker.register('./sw.js');
