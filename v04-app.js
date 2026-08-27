import {
  WORLDS,CHALLENGE_LENGTHS,COLLECTIBLES,localDayKey,normalizeState,dailyQuests,bossReady,
  makeQuestion,makeMixedQuestion,makeReviewQuestion,adjustWeakness,recordSkillResult,skillMastery,
  weakestUnlockedWorld,finishRun,finishSpecialRun,claimReadyDaily
} from './src/v04-core.mjs';

const STATE_KEY='nq-state-v04', LEGACY_KEY='nq-state-v03';
const $=id=>document.getElementById(id);
let S=normalizeState(load(),localDayKey());
let wi=0,q=null,correct=0,attempted=false,combo=0,maxCombo=0,boss=false,bossHP=0,totalNeeded=10,locked=false;
let runMode='world',reviewQueue=[],challengeLevel=2,comboRewards=new Set();

function load(){
  try{
    const current=localStorage.getItem(STATE_KEY); if(current)return JSON.parse(current);
    const legacy=localStorage.getItem(LEGACY_KEY); return legacy?JSON.parse(legacy):null;
  }catch{return null}
}
function save(){localStorage.setItem(STATE_KEY,JSON.stringify(S));hud()}
function hud(){
  $('gems').textContent=S.gems;$('gameGems').textContent=S.gems;$('level').textContent=Math.floor(S.xp/100)+1;
  $('streakDays').textContent=S.streakDays;$('collectionCount').textContent=S.collection.length;
  $('masteredCount').textContent=Array.from({length:9},(_,i)=>skillMastery(S,`mul:${i+1}`).mastered).filter(Boolean).length;
}
function renderDaily(){
  $('daily').innerHTML='';dailyQuests(S).forEach(x=>{
    const done=x.now>=x.target,el=document.createElement('div');el.className='quest'+(done?' done':'');const pct=Math.min(100,x.now/x.target*100);
    el.innerHTML=`<div class="qtop">${x.icon} ${x.label}</div><small>${Math.min(x.now,x.target)} / ${x.target} · 💎${x.reward}</small><div class="mini"><i style="width:${pct}%"></i></div>`;$('daily').append(el);
  });
}
function renderLengths(){
  $('lengths').innerHTML='';CHALLENGE_LENGTHS.forEach(x=>{
    const b=document.createElement('button');b.className='length'+(S.selectedLength===x.count?' active':'');b.innerHTML=`<b>${x.icon} ${x.label}</b><small>${x.count===5?'輕鬆暖身':x.count===10?'剛剛好的冒險':'我還要更多！'}</small>`;
    b.onclick=()=>{S.selectedLength=x.count;save();renderLengths()};$('lengths').append(b);
  });
}
function renderWorlds(){
  $('worlds').innerHTML='';WORLDS.forEach((w,i)=>{
    const b=document.createElement('button');b.className='world';b.disabled=i>=S.unlocked;const ready=i<S.unlocked&&bossReady(S,i);
    b.innerHTML=`<b>${w.icon} ${w.name}</b><span>${i<S.unlocked?w.desc:'🔒 繼續闖關解鎖'}</span><div class="stars">${'★'.repeat(S.best[i]||0)}${'☆'.repeat(5-(S.best[i]||0))}</div>${ready?'<span class="boss-tag">👾 Boss 出現！</span>':''}`;
    b.onclick=()=>startWorld(i,ready);$('worlds').append(b);
  });
}
function renderHome(){
  S=normalizeState(S,localDayKey());claimReadyDaily(S);save();renderDaily();renderLengths();renderWorlds();
  $('home').style.display='block';$('game').style.display='none';
}
function levelForLength(n){return n>=20?3:n>=10?2:1}
function resetRun(){correct=0;combo=0;maxCombo=0;locked=false;attempted=false;reviewQueue=[];comboRewards=new Set()}
function showGame(){
  $('home').style.display='none';$('game').style.display='block';$('bossPanel').style.display=boss?'block':'none';updateBars();next();
}
function startWorld(i,isBoss){
  resetRun();wi=i;boss=isBoss;runMode='world';challengeLevel=levelForLength(S.selectedLength);totalNeeded=boss?Math.min(12,S.selectedLength+2):S.selectedLength;bossHP=boss?totalNeeded:0;
  $('worldTitle').textContent=`${WORLDS[i].icon} ${WORLDS[i].name}`;$('mode').textContent=boss?'⚔️ BOSS 戰':`🚀 ${totalNeeded} 題遠征`;showGame();
}
function startFocus(){
  resetRun();wi=weakestUnlockedWorld(S);boss=false;runMode='focus';challengeLevel=3;totalNeeded=10;
  $('worldTitle').textContent=`🎯 弱點特訓 · ${WORLDS[wi].name}`;$('mode').textContent='🎯 10 題弱點特訓';showGame();
}
function startAcademy(){
  resetRun();wi=0;boss=false;runMode='academy';challengeLevel=3;totalNeeded=20;
  $('worldTitle').textContent='🏆 數字大師遠征';$('mode').textContent='🏆 20 題混合挑戰';showGame();
}
function dueReview(){const idx=reviewQueue.findIndex(x=>x.due<=correct);if(idx<0)return null;return reviewQueue.splice(idx,1)[0].q}
function next(){
  attempted=false;locked=false;const review=dueReview();
  if(review)q=makeReviewQuestion(review);
  else if(runMode==='academy')q=makeMixedQuestion(S,{challengeLevel});
  else q=makeQuestion(wi,S,{challengeLevel});
  $('question').textContent=q.txt;$('msg').textContent=q.isReview?'🧠 這題回來了！看看你記住了嗎？':boss?'攻擊 Boss！':'選一個答案！';$('answers').innerHTML='';
  q.opts.forEach(n=>{const b=document.createElement('button');b.className='ans';b.textContent=n;b.onclick=()=>answer(n,b);$('answers').append(b)});
}
function queueReview(){if(q.reviewQueued)return;q.reviewQueued=true;reviewQueue.push({q:{...q},due:correct+2})}
function answer(n,b){
  if(locked)return;
  if(n===q.ans){
    locked=true;correct++;S.daily.solved++;S.gems+=attempted?1:2;S.xp+=attempted?6:10;
    adjustWeakness(S,q.skillKey,!attempted);recordSkillResult(S,q.skillKey,!attempted);
    if(attempted){combo=0;$('msg').textContent=q.isReview?'✨ 這次抓到了！':'✨ 找到了！這題等等還會回來一次。'}
    else{
      combo++;maxCombo=Math.max(maxCombo,combo);S.daily.maxCombo=Math.max(S.daily.maxCombo,maxCombo);
      if(combo>=10&&combo%10===0&&!comboRewards.has(combo)){comboRewards.add(combo);S.gems+=5;$('msg').textContent=`🌟 ${combo} 連擊寶箱！+💎5`}
      else $('msg').textContent=q.isReview?'🧠 記住了！漂亮！':combo>=3?`⚡ ${combo} 連擊！超強！`:'🎉 一次答對！';
    }
    if(boss)bossHP--;[...$('answers').children].forEach(x=>x.disabled=true);save();updateBars();
    if(correct>=totalNeeded)setTimeout(finish,650);else setTimeout(next,560);
  }else{
    attempted=true;combo=0;queueReview();b.disabled=true;b.style.opacity=.3;$('msg').textContent=q.hint||'💡 差一點！再試一次。';updateBars();
  }
}
function updateBars(){
  $('bar').style.width=`${Math.min(100,correct/totalNeeded*100)}%`;$('counter').textContent=`${correct} / ${totalNeeded}`;$('combo').textContent=combo>=2?`⚡ ${combo} 連擊`:'';
  if(boss)$('hpbar').style.width=`${Math.max(0,bossHP/totalNeeded*100)}%`;
}
function finish(){
  const out=runMode==='world'?finishRun(S,wi,{boss,maxCombo,questionCount:totalNeeded}):finishSpecialRun(S,{mode:runMode,maxCombo,questionCount:totalNeeded});save();
  $('resultEmoji').textContent=boss?'🎆':runMode==='academy'?'🏅':runMode==='focus'?'🎯':'🏆';
  $('resultTitle').textContent=boss?'Boss 擊破！':runMode==='academy'?'20 題大師遠征完成！':runMode==='focus'?'弱點特訓完成！':`${totalNeeded} 題遠征完成！`;
  $('resultText').textContent=`今天又答對 ${totalNeeded} 題！${out.dailyBonus?` · 今日任務 +💎${out.dailyBonus}`:''}`;
  $('newCollectible').textContent=out.collectible.isNew?`${out.collectible.icon} 新寶物：${out.collectible.name}${out.collectible.rare?' ✨稀有！':''}`:`${out.collectible.icon} ${out.collectible.name} 已收集，變成額外寶石！`;
  $('resultOverlay').style.display='flex';
}
function showCollection(){
  $('collectionGrid').innerHTML='';COLLECTIBLES.forEach(c=>{const got=S.collection.includes(c.id),el=document.createElement('div');el.className='collect'+(!got?' locked':'')+(c.rare?' rare':'');el.innerHTML=`<div class="emoji">${got?c.icon:'❔'}</div><b>${got?c.name:'神秘寶物'}</b>${c.rare?'<div>✨ BOSS</div>':''}`;$('collectionGrid').append(el)});$('collectionOverlay').style.display='flex';
}
function masteryCard(label,key){const m=skillMastery(S,key);return `<div class="master-card ${m.mastered?'mastered':''}"><b>${m.mastered?'✨ ':''}${label}</b><small>${m.seen?`${m.score}% · 練過 ${m.seen} 題`:'還沒開始'}</small><div class="masterbar"><i style="width:${m.score}%"></i></div></div>`}
function showMastery(){
  $('mulMastery').innerHTML='';for(let f=1;f<=9;f++){const m=skillMastery(S,`mul:${f}`),el=document.createElement('div');el.className='table-badge'+(m.mastered?' mastered':'');el.innerHTML=`<strong>${f}×</strong><span>${m.mastered?'🏅':m.score+'%'}</span>`;$('mulMastery').append(el)}
  $('arithMastery').innerHTML=[masteryCard('20 內加法','add:20'),masteryCard('20 內減法','sub:20'),masteryCard('50 內加法','add:50'),masteryCard('50 內減法','sub:50'),masteryCard('100 內加法','add:100'),masteryCard('100 內減法','sub:100')].join('');$('masteryOverlay').style.display='flex';
}
$('homeBtn').onclick=renderHome;$('collectionBtn').onclick=showCollection;$('masteryBtn').onclick=showMastery;$('focusBtn').onclick=startFocus;$('academyBtn').onclick=startAcademy;
$('closeCollection').onclick=()=>$('collectionOverlay').style.display='none';$('closeMastery').onclick=()=>$('masteryOverlay').style.display='none';$('resultBtn').onclick=()=>{$('resultOverlay').style.display='none';renderHome()};
hud();renderHome();if('serviceWorker'in navigator)navigator.serviceWorker.register('./sw.js');
