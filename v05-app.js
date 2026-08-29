import {
  WORLDS,CHALLENGE_LENGTHS,COLLECTIBLES,NUMBER_SENSE_SKILLS,MULTIPLICATION_SKILLS,DIVISION_SKILLS,
  localDayKey,normalizeState,dailyQuests,bossReady,makeQuestion,makeMixedQuestion,makeFocusQuestion,
  makeDivisionQuestion,takeDueReview,queueSpacedReview,recordSkillMiss,recordSkillSuccess,skillMastery,
  challengeWeights,mixedSkillKeys,divisionUnlocked,beginLearningSession,finishRun,finishSpecialRun,claimReadyDaily
} from './src/v05-core.mjs';

const STATE_KEY='nq-state-v05',LEGACY_KEY='nq-state-v04';
const $=id=>document.getElementById(id);
let S=normalizeState(load(),localDayKey());
let wi=0,q=null,correct=0,attempted=false,missRecorded=false,combo=0,maxCombo=0,boss=false,bossHP=0,totalNeeded=10,locked=false;
let runMode='world',challengeLevel=2,comboRewards=new Set(),introContinuation=null;

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
  $('lengths').innerHTML='';CHALLENGE_LENGTHS.forEach(x=>{const b=document.createElement('button');b.className='length'+(S.selectedLength===x.count?' active':'');b.innerHTML=`<b>${x.icon} ${x.label}</b><small>${x.count===5?'輕鬆暖身':x.count===10?'剛剛好的冒險':'我還要更多！'}</small>`;b.onclick=()=>{S.selectedLength=x.count;save();renderLengths()};$('lengths').append(b)})
}
function renderWorlds(){
  $('worlds').innerHTML='';WORLDS.forEach((w,i)=>{const b=document.createElement('button');b.className='world';b.disabled=i>=S.unlocked;const ready=i<S.unlocked&&bossReady(S,i);b.innerHTML=`<b>${w.icon} ${w.name}</b><span>${i<S.unlocked?w.desc:'🔒 繼續闖關解鎖'}</span><div class="stars">${'★'.repeat(S.best[i]||0)}${'☆'.repeat(5-(S.best[i]||0))}</div>${ready?'<span class="boss-tag">👾 Boss 出現！</span>':''}`;b.onclick=()=>startWorld(i,ready);$('worlds').append(b)})
}
function renderBridge(){
  const open=divisionUnlocked(S),b=$('divisionBtn');b.disabled=!open;b.classList.toggle('locked-bridge',!open);
  $('divisionStatus').textContent=open?'用熟悉的乘法跨過新橋':'先完成 5 題乘法，橋就會亮起來';
}
function renderHome(){
  S=normalizeState(S,localDayKey());claimReadyDaily(S);save();renderDaily();renderLengths();renderBridge();renderWorlds();$('home').style.display='block';$('game').style.display='none'
}
function levelForLength(n){return n>=20?3:n>=10?2:1}
function resetRun(){correct=0;combo=0;maxCombo=0;locked=false;attempted=false;missRecorded=false;comboRewards=new Set();beginLearningSession(S);save()}
function showGame(){
  $('home').style.display='none';$('game').style.display='block';$('bossPanel').style.display=boss?'block':'none';updateBars();next()
}
function startWorld(i,isBoss){resetRun();wi=i;boss=isBoss;runMode='world';challengeLevel=levelForLength(S.selectedLength);totalNeeded=boss?Math.min(12,S.selectedLength+2):S.selectedLength;bossHP=boss?totalNeeded:0;$('worldTitle').textContent=`${WORLDS[i].icon} ${WORLDS[i].name}`;$('mode').textContent=boss?'⚔️ BOSS 戰':`🚀 ${totalNeeded} 題遠征`;showGame()}
function startFocus(){resetRun();boss=false;runMode='focus';challengeLevel=3;totalNeeded=10;$('worldTitle').textContent='🎯 下一個能力冒險';$('mode').textContent='🎯 10 題弱點特訓';showGame()}
function startAcademy(){resetRun();boss=false;runMode='academy';challengeLevel=3;totalNeeded=20;$('worldTitle').textContent='🏆 數字大師遠征';$('mode').textContent='🏆 20 題混合挑戰';showGame()}
function startDivision(){if(!divisionUnlocked(S))return;resetRun();boss=false;runMode='division';challengeLevel=2;totalNeeded=10;$('worldTitle').textContent='🌉 除法橋';$('mode').textContent='🌉 10 題橋梁探險';showGame()}

function next(){
  attempted=false;missRecorded=false;locked=false;q=takeDueReview(S);
  if(!q){if(runMode==='academy')q=makeMixedQuestion(S,{challengeLevel});else if(runMode==='focus')q=makeFocusQuestion(S,{challengeLevel});else if(runMode==='division')q=makeDivisionQuestion(S);else q=makeQuestion(wi,S,{challengeLevel})}
  save();
  if(q.op==='div'&&!S.learning.divisionIntroSeen){showDivisionIntro(()=>{S.learning.divisionIntroSeen=true;save();renderQuestion()});return}
  renderQuestion();
}
function renderQuestion(){
  $('question').textContent=q.txt;$('question').classList.toggle('word-question',Boolean(q.story)||q.variant==='compare'||q.variant==='decompose');
  $('msg').textContent=q.isReview?'🧠 這個能力回來了！試試看還記得嗎？':boss?'攻擊 Boss！':'選一個答案！';$('answers').innerHTML='';
  q.opts.forEach(n=>{const b=document.createElement('button');b.className='ans'+(typeof n==='string'?' expression':'');b.textContent=n;b.onclick=()=>answer(n,b);$('answers').append(b)})
}
function showDivisionIntro(continuation){introContinuation=continuation;$('divisionIntro').style.display='flex'}
function closeDivisionIntro(){
  $('divisionIntro').style.display='none';const continuation=introContinuation;introContinuation=null;if(continuation)continuation()
}
function answer(n,b){
  if(locked)return;
  if(n===q.ans){
    locked=true;correct++;S.daily.solved++;S.gems+=attempted?1:2;S.xp+=attempted?6:10;recordSkillSuccess(S,q.skillKey,{firstTry:!attempted,isRevisit:Boolean(q.isReview)});
    if(attempted){combo=0;$('msg').textContent=q.isReview?'✨ 找到線索了！它之後還會再來。':'✨ 找到了！先繼續冒險，等等再挑戰一次。'}
    else{combo++;maxCombo=Math.max(maxCombo,combo);S.daily.maxCombo=Math.max(S.daily.maxCombo,maxCombo);if(combo>=10&&combo%10===0&&!comboRewards.has(combo)){comboRewards.add(combo);S.gems+=5;$('msg').textContent=`🌟 ${combo} 連擊寶箱！+💎5`}else $('msg').textContent=q.isReview?'🧠 自己想起來了！這個能力更亮了！':combo>=3?`⚡ ${combo} 連擊！超強！`:'🎉 一次答對！'}
    if(boss)bossHP--;[...$('answers').children].forEach(x=>x.disabled=true);save();updateBars();if(correct>=totalNeeded)setTimeout(finish,650);else setTimeout(next,560)
  }else{
    attempted=true;combo=0;if(!missRecorded){missRecorded=true;recordSkillMiss(S,q.skillKey);queueSpacedReview(S,q);save()}b.disabled=true;b.classList.add('wrong-choice');$('msg').textContent=q.hint||'💡 差一點！換個方法再試一次。';updateBars()
  }
}
function updateBars(){$('bar').style.width=`${Math.min(100,correct/totalNeeded*100)}%`;$('counter').textContent=`${correct} / ${totalNeeded}`;$('combo').textContent=combo>=2?`⚡ ${combo} 連擊`:'';if(boss)$('hpbar').style.width=`${Math.max(0,bossHP/totalNeeded*100)}%`}
function finish(){
  const out=runMode==='world'?finishRun(S,wi,{boss,maxCombo,questionCount:totalNeeded}):finishSpecialRun(S,{mode:runMode,maxCombo,questionCount:totalNeeded});save();
  $('resultEmoji').textContent=boss?'🎆':runMode==='academy'?'🏅':runMode==='focus'?'🎯':runMode==='division'?'🌉':'🏆';$('resultTitle').textContent=boss?'Boss 擊破！':runMode==='academy'?'20 題大師遠征完成！':runMode==='focus'?'弱點特訓完成！':runMode==='division'?'除法橋探險完成！':`${totalNeeded} 題遠征完成！`;
  $('resultText').textContent=`今天又完成 ${totalNeeded} 個挑戰！${out.dailyBonus?` · 今日任務 +💎${out.dailyBonus}`:''}`;$('newCollectible').textContent=out.collectible.isNew?`${out.collectible.icon} 新寶物：${out.collectible.name}${out.collectible.rare?' ✨稀有！':''}`:`${out.collectible.icon} ${out.collectible.name} 已收集，變成額外寶石！`;$('resultOverlay').style.display='flex'
}
function showCollection(){$('collectionGrid').innerHTML='';COLLECTIBLES.forEach(c=>{const got=S.collection.includes(c.id),el=document.createElement('div');el.className='collect'+(!got?' locked':'')+(c.rare?' rare':'');el.innerHTML=`<div class="emoji">${got?c.icon:'❔'}</div><b>${got?c.name:'神秘寶物'}</b>${c.rare?'<div>✨ BOSS</div>':''}`;$('collectionGrid').append(el)});$('collectionOverlay').style.display='flex'}
const powerName=m=>m.power===3?'🏅 徽章覺醒':m.power===2?'✨ 能量成長':m.power===1?'🌱 已經點亮':'🗺️ 等你探索';
function masteryCard(label,key){const m=skillMastery(S,key);return `<div class="master-card power-${m.power}"><b>${label}</b><small>${powerName(m)}${m.successfulRevisits?` · 想起來 ${m.successfulRevisits} 次`:''}</small><div class="power-pips" aria-label="能力等級 ${m.power} / 3"><i></i><i></i><i></i></div></div>`}
function badge(label,key){const m=skillMastery(S,key),el=document.createElement('div');el.className=`table-badge power-${m.power}`;el.innerHTML=`<strong>${label}</strong><span>${m.power===3?'🏅':'✨'.repeat(m.power)||'○'}</span>`;return el}
function skillLabel(key){if(key.startsWith('mul:'))return `${key.split(':')[1]} 的乘法`;if(key.startsWith('div:'))return `${key.split(':')[1]} 的除法橋`;const labels={ 'add:20':'20 內加法','sub:20':'20 內減法','add:50':'50 內加法','sub:50':'50 內減法','add:100':'100 內加法','sub:100':'100 內減法','sense:missing':'神秘空格','sense:make10':'湊成 10','sense:make100':'湊成 100','sense:compare':'靠近目標','sense:decompose':'拆數魔法'};return labels[key]||'新能力'}
function showMastery(){
  $('mulMastery').innerHTML='';MULTIPLICATION_SKILLS.forEach((key,i)=>$('mulMastery').append(badge(`${i+1}×`,key)));
  $('divMastery').innerHTML='';DIVISION_SKILLS.forEach((key,i)=>$('divMastery').append(badge(`${i+1}÷`,key)));
  $('divisionMasterySection').hidden=!divisionUnlocked(S);
  $('arithMastery').innerHTML=[masteryCard('20 內加法','add:20'),masteryCard('20 內減法','sub:20'),masteryCard('50 內加法','add:50'),masteryCard('50 內減法','sub:50'),masteryCard('100 內加法','add:100'),masteryCard('100 內減法','sub:100'),...NUMBER_SENSE_SKILLS.map(key=>masteryCard(skillLabel(key),key))].join('');
  const keys=mixedSkillKeys(S,{challengeLevel:3}),weights=challengeWeights(S,keys,{recentSkills:[]}),next=[...keys].sort((a,b)=>weights[b]-weights[a])[0];$('nextAdventure').textContent=`🧭 下一段冒險：${skillLabel(next)}。多遇見幾次，能力就會慢慢亮起來！`;$('masteryOverlay').style.display='flex'
}

$('homeBtn').onclick=renderHome;$('collectionBtn').onclick=showCollection;$('masteryBtn').onclick=showMastery;$('focusBtn').onclick=startFocus;$('academyBtn').onclick=startAcademy;$('divisionBtn').onclick=startDivision;
$('closeCollection').onclick=()=>$('collectionOverlay').style.display='none';$('closeMastery').onclick=()=>$('masteryOverlay').style.display='none';$('divisionIntroBtn').onclick=closeDivisionIntro;$('resultBtn').onclick=()=>{$('resultOverlay').style.display='none';renderHome()};
hud();renderHome();if('serviceWorker'in navigator)navigator.serviceWorker.register('./sw.js');
