import {
  WORLDS,COLLECTIBLES,localDayKey,normalizeState,dailyQuests,bossReady,
  makeQuestion,adjustWeakness,finishRun,claimReadyDaily
} from './src/v03-core.mjs';

const STATE_KEY='nq-state-v03';
const $=id=>document.getElementById(id);
let S=normalizeState(load(),localDayKey());
let wi=0,q=null,correct=0,attempted=false,combo=0,maxCombo=0,boss=false,bossHP=0,totalNeeded=5,locked=false;

function load(){try{return JSON.parse(localStorage.getItem(STATE_KEY)||'null')}catch{return null}}
function save(){localStorage.setItem(STATE_KEY,JSON.stringify(S));hud()}
function hud(){
  $('gems').textContent=S.gems;$('gameGems').textContent=S.gems;$('level').textContent=Math.floor(S.xp/100)+1;
  $('streakDays').textContent=S.streakDays;$('collectionCount').textContent=S.collection.length;
}
function renderDaily(){
  const qs=dailyQuests(S); $('daily').innerHTML='';
  qs.forEach(x=>{
    const done=x.now>=x.target, el=document.createElement('div'); el.className='quest'+(done?' done':'');
    const pct=Math.min(100,x.now/x.target*100);
    el.innerHTML=`<div class="qtop">${x.icon} ${x.label}</div><small>${Math.min(x.now,x.target)} / ${x.target} · 💎${x.reward}</small><div class="mini"><i style="width:${pct}%"></i></div>`;
    $('daily').append(el);
  });
}
function renderWorlds(){
  $('worlds').innerHTML='';
  WORLDS.forEach((w,i)=>{
    const b=document.createElement('button'); b.className='world'; b.disabled=i>=S.unlocked;
    const ready=i<S.unlocked&&bossReady(S,i);
    b.innerHTML=`<b>${w.icon} ${w.name}</b><span>${i<S.unlocked?w.desc:'🔒 繼續闖關解鎖'}</span>
      <div class="stars">${'★'.repeat(S.best[i]||0)}${'☆'.repeat(5-(S.best[i]||0))}</div>
      ${ready?'<span class="boss-tag">👾 Boss 出現！稀有寶物</span>':''}`;
    b.onclick=()=>start(i,ready); $('worlds').append(b);
  });
}
function renderHome(){
  S=normalizeState(S,localDayKey()); claimReadyDaily(S); save(); renderDaily(); renderWorlds();
  $('home').style.display='block'; $('game').style.display='none';
}
function start(i,isBoss){
  wi=i;boss=isBoss;correct=0;combo=0;maxCombo=0;locked=false;
  totalNeeded=boss?7:5;bossHP=boss?7:0;
  $('home').style.display='none';$('game').style.display='block';
  $('worldTitle').textContent=`${WORLDS[i].icon} ${WORLDS[i].name}`;
  $('mode').textContent=boss?'⚔️ BOSS 戰':'🚀 探險中';
  $('bossPanel').style.display=boss?'block':'none';
  updateBars(); next();
}
function next(){
  attempted=false;locked=false;q=makeQuestion(wi,S);
  $('question').textContent=q.txt;$('msg').textContent=boss?'攻擊 Boss！':'選一個答案！';
  $('answers').innerHTML='';
  q.opts.forEach(n=>{
    const b=document.createElement('button');b.className='ans';b.textContent=n;
    b.onclick=()=>answer(n,b);$('answers').append(b);
  });
}
function answer(n,b){
  if(locked)return;
  if(n===q.ans){
    locked=true;correct++;S.daily.solved++;S.gems+=attempted?1:2;S.xp+=attempted?6:10;
    adjustWeakness(S,q.skillKey,!attempted);
    if(attempted){combo=0;$('msg').textContent='✨ 找到了！下一題！'}
    else{combo++;maxCombo=Math.max(maxCombo,combo);S.daily.maxCombo=Math.max(S.daily.maxCombo,maxCombo);$('msg').textContent=combo>=3?`⚡ ${combo} 連擊！超強！`:'🎉 一次答對！'}
    if(boss)bossHP--;
    $('mascot').classList.add('celebrate');setTimeout(()=>$('mascot').classList.remove('celebrate'),350);
    [...$('answers').children].forEach(x=>x.disabled=true);save();updateBars();
    if(correct>=totalNeeded)setTimeout(finish,600);else setTimeout(next,550);
  }else{
    attempted=true;combo=0;adjustWeakness(S,q.skillKey,false);b.disabled=true;b.style.opacity=.3;
    $('msg').textContent='💡 差一點！這題等等會偷偷再來找你。';save();updateBars();
  }
}
function updateBars(){
  $('bar').style.width=`${Math.min(100,correct/totalNeeded*100)}%`;
  $('combo').textContent=combo>=2?`⚡ ${combo} 連擊`:'';
  if(boss)$('hpbar').style.width=`${Math.max(0,bossHP/7*100)}%`;
}
function finish(){
  const out=finishRun(S,wi,{boss,maxCombo});save();
  $('resultEmoji').textContent=boss?'🎆':'🏆';
  $('resultTitle').textContent=boss?'Boss 擊破！':'探險完成！';
  const rewards=boss?'Boss 寶箱：💎25 · XP55':'探險寶箱：💎10 · XP25';
  $('resultText').textContent=rewards+(out.dailyBonus?` · 今日任務 +💎${out.dailyBonus}`:'');
  $('newCollectible').textContent=out.collectible.isNew
    ? `${out.collectible.icon} 新寶物：${out.collectible.name}${out.collectible.rare?' ✨稀有！':''}`
    : `${out.collectible.icon} ${out.collectible.name} 已收集，變成額外寶石！`;
  $('resultOverlay').style.display='flex';
}
function showCollection(){
  $('collectionGrid').innerHTML='';
  COLLECTIBLES.forEach(c=>{
    const got=S.collection.includes(c.id), el=document.createElement('div');
    el.className='collect'+(!got?' locked':'')+(c.rare?' rare':'');
    el.innerHTML=`<div class="emoji">${got?c.icon:'❔'}</div><b>${got?c.name:'神秘寶物'}</b>${c.rare?'<div>✨ BOSS</div>':''}`;
    $('collectionGrid').append(el);
  });$('collectionOverlay').style.display='flex';
}
$('homeBtn').onclick=renderHome;
$('collectionBtn').onclick=showCollection;
$('closeCollection').onclick=()=>$('collectionOverlay').style.display='none';
$('resultBtn').onclick=()=>{$('resultOverlay').style.display='none';renderHome()};
hud();renderHome();
if('serviceWorker'in navigator)navigator.serviceWorker.register('./sw.js');