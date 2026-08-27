export const WORLDS = [
  { icon:'🌱', name:'加法草原', desc:'20 內加法', type:'add', max:20 },
  { icon:'🌲', name:'減法森林', desc:'20 內減法', type:'sub', max:20 },
  { icon:'🌊', name:'數字海灣', desc:'50 內加減', type:'mix', max:50 },
  { icon:'⛰️', name:'乘法山谷', desc:'1、2、5 乘法', type:'mul', factors:[1,2,5] },
  { icon:'🌋', name:'九九火山', desc:'3、4、6 乘法', type:'mul', factors:[3,4,6] },
  { icon:'🪐', name:'星空乘法站', desc:'7、8、9 乘法', type:'mul', factors:[7,8,9] },
  { icon:'🏰', name:'百數王城', desc:'100 內加減', type:'mix', max:100 },
  { icon:'👑', name:'數字大師塔', desc:'九九＋百內加減', type:'master', max:100, factors:[1,2,3,4,5,6,7,8,9] },
];

export const CHALLENGE_LENGTHS = [
  {id:'quick',count:5,icon:'⚡',label:'5 題快閃',level:1},
  {id:'quest',count:10,icon:'🚀',label:'10 題遠征',level:2},
  {id:'epic',count:20,icon:'🏆',label:'20 題大挑戰',level:3},
];

export const COLLECTIBLES = [
  {id:'sprout',icon:'🌱',name:'勇氣嫩芽',rare:false},{id:'acorn',icon:'🌰',name:'森林橡果',rare:false},
  {id:'shell',icon:'🐚',name:'海灣貝殼',rare:false},{id:'crystal',icon:'🔮',name:'山谷水晶',rare:false},
  {id:'ember',icon:'🔥',name:'火山火種',rare:false},{id:'star',icon:'🌟',name:'星空徽章',rare:false},
  {id:'key',icon:'🗝️',name:'王城鑰匙',rare:false},{id:'crown',icon:'👑',name:'大師皇冠',rare:false},
  {id:'fox',icon:'🦊',name:'狐狸夥伴',rare:false},{id:'panda',icon:'🐼',name:'熊貓夥伴',rare:false},
  {id:'tiger',icon:'🐯',name:'老虎夥伴',rare:false},{id:'dino',icon:'🦕',name:'恐龍夥伴',rare:false},
  {id:'rocket',icon:'🚀',name:'探險火箭',rare:false},{id:'moon',icon:'🌙',name:'月亮碎片',rare:false},
  {id:'rainbow',icon:'🌈',name:'彩虹貼紙',rare:false},{id:'gem',icon:'💎',name:'藍寶石',rare:false},
  {id:'dragon',icon:'🐲',name:'稀有龍徽章',rare:true},{id:'meteor',icon:'☄️',name:'流星核心',rare:true},
  {id:'phoenix',icon:'🦅',name:'鳳凰羽毛',rare:true},{id:'ufo',icon:'🛸',name:'神秘飛船',rare:true},
];

export function localDayKey(d = new Date()) {
  const y=d.getFullYear(), m=String(d.getMonth()+1).padStart(2,'0'), day=String(d.getDate()).padStart(2,'0');
  return `${y}-${m}-${day}`;
}
export function dayBefore(key){
  const [y,m,d]=key.split('-').map(Number); const x=new Date(y,m-1,d); x.setDate(x.getDate()-1); return localDayKey(x);
}
export function freshState(day=localDayKey()) {
  return {
    version:4,gems:0,xp:0,unlocked:1,best:{},worldRuns:{},weak:{},skillStats:{},collection:[],
    streakDays:1,lastPlayDay:day,selectedLength:10,
    daily:{day,completedRuns:0,maxCombo:0,solved:0,bossWins:0,claimed:{}}
  };
}
export function normalizeState(raw, day=localDayKey()){
  const base=freshState(day), s={...base,...(raw||{}),version:4};
  s.best={...(raw?.best||{})}; s.worldRuns={...(raw?.worldRuns||{})}; s.weak={...(raw?.weak||{})};
  s.skillStats={...(raw?.skillStats||{})}; s.collection=Array.isArray(raw?.collection)?raw.collection:[];
  if(![5,10,20].includes(Number(s.selectedLength))) s.selectedLength=10;
  if(s.lastPlayDay!==day){
    s.streakDays = s.lastPlayDay===dayBefore(day) ? Math.max(1,(s.streakDays||0)+1) : 1; s.lastPlayDay=day;
  }
  if(!s.daily || s.daily.day!==day) s.daily={day,completedRuns:0,maxCombo:0,solved:0,bossWins:0,claimed:{}};
  return s;
}
export function dailyQuests(s){
  return [
    {id:'run',icon:'🗺️',label:'完成 1 次探險',now:s.daily.completedRuns,target:1,reward:8},
    {id:'combo',icon:'⚡',label:'達成 8 連擊',now:s.daily.maxCombo,target:8,reward:10},
    {id:'solve',icon:'🎯',label:'今天答對 25 題',now:s.daily.solved,target:25,reward:15},
  ];
}
export function claimReadyDaily(s){
  let gained=0; for(const q of dailyQuests(s)) if(q.now>=q.target && !s.daily.claimed[q.id]){
    s.daily.claimed[q.id]=true; s.gems+=q.reward; gained+=q.reward;
  } return gained;
}
export function bossReady(s, wi){ return ((s.worldRuns[wi]||0) % 3) === 2; }
export function weightedPick(items, weightFn, rng=Math.random){
  const weights=items.map(x=>Math.max(0.01,Number(weightFn(x))||0.01));
  const total=weights.reduce((a,b)=>a+b,0); let r=rng()*total;
  for(let i=0;i<items.length;i++){r-=weights[i];if(r<=0)return items[i]} return items[items.length-1];
}
function rnd(a,b,rng=Math.random){ return Math.floor(rng()*(b-a+1))+a; }
function shuffled(a,rng=Math.random){ return [...a].sort(()=>rng()-.5); }

export function adjustWeakness(s,key,correctFirstTry){
  const current=Number(s.weak[key]||0); s.weak[key]=correctFirstTry?Math.max(0,current-0.5):Math.min(8,current+2);
}
export function recordSkillResult(s,key,correctFirstTry){
  const cur=s.skillStats[key]||{seen:0,first:0}; cur.seen+=1; if(correctFirstTry)cur.first+=1; s.skillStats[key]=cur; return cur;
}
export function skillMastery(s,key){
  const x=s.skillStats[key]||{seen:0,first:0};
  const accuracy=x.seen?x.first/x.seen:0; const confidence=Math.min(1,x.seen/5); const score=Math.round(accuracy*confidence*100);
  return {seen:x.seen,first:x.first,accuracy,score,mastered:x.seen>=5&&accuracy>=0.8};
}
function opChoice(s,max,rng){
  const a=`add:${max}`, b=`sub:${max}`; return weightedPick(['add','sub'],op=>1+(s.weak[op==='add'?a:b]||0)*1.5,rng);
}
function mulBase(world,s,rng){
  const a=weightedPick(world.factors,f=>1+(s.weak[`mul:${f}`]||0)*1.7,rng), b=rnd(1,9,rng);
  return {op:'mul',a,b,result:a*b,skillKey:`mul:${a}`,max:81};
}
function arithmeticBase(world,s,rng,forced=null){
  const max=world.max, op=forced||(world.type==='mix'?opChoice(s,max,rng):world.type);
  if(op==='sub'){const a=rnd(1,max,rng),b=rnd(0,a,rng);return {op:'sub',a,b,result:a-b,skillKey:`sub:${max}`,max}}
  const a=rnd(0,max,rng),b=rnd(0,max-a,rng);return {op:'add',a,b,result:a+b,skillKey:`add:${max}`,max};
}
function baseForWorld(wi,s,rng){
  const world=WORLDS[wi];
  if(world.type==='mul')return mulBase(world,s,rng);
  if(world.type==='master'){
    const mulWeight=1+Math.max(...world.factors.map(f=>s.weak[`mul:${f}`]||0));
    const arWeight=1+Math.max(s.weak['add:100']||0,s.weak['sub:100']||0);
    return weightedPick(['mul','arith'],x=>x==='mul'?mulWeight:arWeight,rng)==='mul'
      ?mulBase(world,s,rng):arithmeticBase({type:'mix',max:100},s,rng);
  }
  return arithmeticBase(world,s,rng);
}
function variantProbability(level){return level<=1?0:level===2?0.28:0.46}
function formatBase(base,level,rng){
  const useGap=rng()<variantProbability(level);
  if(base.op==='mul'){
    if(useGap){
      const left=rng()<0.5; const ans=left?base.a:base.b;
      return {...base,variant:'missing',ans,optionMin:1,optionMax:9,
        txt:left?`? × ${base.b} = ${base.result}`:`${base.a} × ? = ${base.result}`,
        hint:left?`💡 幾個 ${base.b} 會變成 ${base.result}？`:`💡 ${base.a} 乘幾會變成 ${base.result}？`};
    }
    return {...base,variant:'normal',ans:base.result,optionMin:0,optionMax:81,txt:`${base.a} × ${base.b} = ?`,hint:`💡 可以把 ${base.a} 想成重複加 ${base.b}。`};
  }
  if(base.op==='add'){
    if(useGap){
      const left=rng()<0.5,ans=left?base.a:base.b;
      return {...base,variant:'missing',ans,optionMin:0,optionMax:base.max,
        txt:left?`? ＋ ${base.b} = ${base.result}`:`${base.a} ＋ ? = ${base.result}`,
        hint:`💡 想一想：從已知的數字還差多少會到 ${base.result}？`};
    }
    return {...base,variant:'normal',ans:base.result,optionMin:0,optionMax:base.max,txt:`${base.a} ＋ ${base.b} = ?`,hint:'💡 可以先湊整十，再把剩下的加回去。'};
  }
  if(useGap){
    const askMinuend=rng()<0.35;
    if(askMinuend)return {...base,variant:'missing',ans:base.a,optionMin:0,optionMax:base.max,txt:`? − ${base.b} = ${base.result}`,hint:`💡 從 ${base.result} 加回 ${base.b} 就能找到答案。`};
    return {...base,variant:'missing',ans:base.b,optionMin:0,optionMax:base.max,txt:`${base.a} − ? = ${base.result}`,hint:`💡 ${base.a} 要減掉多少才會剩 ${base.result}？`};
  }
  return {...base,variant:'normal',ans:base.result,optionMin:0,optionMax:base.max,txt:`${base.a} − ${base.b} = ?`,hint:`💡 可以從 ${base.result} 往回加到 ${base.a}。`};
}
function addOptions(q,rng){
  const opts=[q.ans]; let guard=0;
  while(opts.length<4&&guard++<80){
    let x;
    if(q.optionMax<=9)x=rnd(q.optionMin,q.optionMax,rng);
    else {const spread=q.optionMax>50?18:10;x=Math.min(q.optionMax,Math.max(q.optionMin,q.ans+rnd(-spread,spread,rng)))}
    if(!opts.includes(x))opts.push(x);
  }
  for(let x=q.optionMin;opts.length<4&&x<=q.optionMax;x++)if(!opts.includes(x))opts.push(x);
  q.opts=shuffled(opts,rng);return q;
}
export function makeQuestion(wi,s,{rng=Math.random,challengeLevel=1}={}){
  return addOptions(formatBase(baseForWorld(wi,s,rng),challengeLevel,rng),rng);
}
export function makeReviewQuestion(q,rng=Math.random){
  return addOptions({...q,isReview:true,opts:undefined},rng);
}
export function worldWeakness(s,wi){
  const w=WORLDS[wi];
  if(w.type==='mul')return Math.max(...w.factors.map(f=>s.weak[`mul:${f}`]||0));
  if(w.type==='add'||w.type==='sub')return s.weak[`${w.type}:${w.max}`]||0;
  if(w.type==='mix')return Math.max(s.weak[`add:${w.max}`]||0,s.weak[`sub:${w.max}`]||0);
  return Math.max(0,...w.factors.map(f=>s.weak[`mul:${f}`]||0),s.weak['add:100']||0,s.weak['sub:100']||0);
}
export function weakestUnlockedWorld(s,rng=Math.random){
  const count=Math.max(1,Math.min(WORLDS.length,s.unlocked||1)); const ids=Array.from({length:count},(_,i)=>i);
  return weightedPick(ids,i=>1+worldWeakness(s,i)*2,rng);
}
export function makeMixedQuestion(s,{rng=Math.random,challengeLevel=3}={}){
  return makeQuestion(weakestUnlockedWorld(s,rng),s,{rng,challengeLevel});
}
export function awardCollectible(s,{rare=false,rng=Math.random}={}){
  const pool=COLLECTIBLES.filter(c=>c.rare===rare),missing=pool.filter(c=>!s.collection.includes(c.id)),source=missing.length?missing:pool;
  const pick=source[Math.floor(rng()*source.length)],isNew=!s.collection.includes(pick.id); if(isNew)s.collection.push(pick.id);else s.gems+=rare?8:3; return {...pick,isNew};
}
function lengthMultiplier(n){return n>=20?3:n>=10?1.8:1}
export function finishRun(s,wi,{boss=false,maxCombo=0,questionCount=5}={}){
  s.worldRuns[wi]=(s.worldRuns[wi]||0)+1;s.daily.completedRuns+=1;s.daily.maxCombo=Math.max(s.daily.maxCombo,maxCombo);s.best[wi]=Math.max(s.best[wi]||0,5);
  if(s.unlocked===wi+1&&s.unlocked<WORLDS.length)s.unlocked++;
  const mult=lengthMultiplier(questionCount);s.gems+=Math.round((boss?25:10)*mult);s.xp+=Math.round((boss?55:25)*mult);if(boss)s.daily.bossWins+=1;
  const collectible=awardCollectible(s,{rare:boss}),dailyBonus=claimReadyDaily(s);return {collectible,dailyBonus};
}
export function finishSpecialRun(s,{mode='focus',maxCombo=0,questionCount=10}={}){
  s.daily.completedRuns+=1;s.daily.maxCombo=Math.max(s.daily.maxCombo,maxCombo);const mult=lengthMultiplier(questionCount);
  s.gems+=Math.round((mode==='academy'?16:12)*mult);s.xp+=Math.round((mode==='academy'?40:30)*mult);
  const collectible=awardCollectible(s,{rare:false}),dailyBonus=claimReadyDaily(s);return {collectible,dailyBonus};
}
