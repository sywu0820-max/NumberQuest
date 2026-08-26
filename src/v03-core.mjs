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
  const [y,m,d]=key.split('-').map(Number);
  const x=new Date(y,m-1,d); x.setDate(x.getDate()-1); return localDayKey(x);
}
export function freshState(day=localDayKey()) {
  return {
    version:3,gems:0,xp:0,unlocked:1,best:{},worldRuns:{},weak:{},collection:[],
    streakDays:1,lastPlayDay:day,
    daily:{day,completedRuns:0,maxCombo:0,solved:0,bossWins:0,claimed:{}}
  };
}
export function normalizeState(raw, day=localDayKey()){
  const base=freshState(day), s={...base,...(raw||{})};
  s.best={...(raw?.best||{})}; s.worldRuns={...(raw?.worldRuns||{})}; s.weak={...(raw?.weak||{})};
  s.collection=Array.isArray(raw?.collection)?raw.collection:[];
  if(s.lastPlayDay!==day){
    s.streakDays = s.lastPlayDay===dayBefore(day) ? Math.max(1,(s.streakDays||0)+1) : 1;
    s.lastPlayDay=day;
  }
  if(!s.daily || s.daily.day!==day) s.daily={day,completedRuns:0,maxCombo:0,solved:0,bossWins:0,claimed:{}};
  return s;
}
export function dailyQuests(s){
  return [
    {id:'run',icon:'🗺️',label:'完成 1 次探險',now:s.daily.completedRuns,target:1,reward:8},
    {id:'combo',icon:'⚡',label:'達成 5 連擊',now:s.daily.maxCombo,target:5,reward:10},
    {id:'solve',icon:'🎯',label:'今天答對 15 題',now:s.daily.solved,target:15,reward:12},
  ];
}
export function claimReadyDaily(s){
  let gained=0;
  for(const q of dailyQuests(s)){
    if(q.now>=q.target && !s.daily.claimed[q.id]){
      s.daily.claimed[q.id]=true; s.gems+=q.reward; gained+=q.reward;
    }
  }
  return gained;
}
export function bossReady(s, wi){ return ((s.worldRuns[wi]||0) % 3) === 2; }
export function weightedPick(items, weightFn, rng=Math.random){
  const weights=items.map(x=>Math.max(0.01,Number(weightFn(x))||0.01));
  const total=weights.reduce((a,b)=>a+b,0); let r=rng()*total;
  for(let i=0;i<items.length;i++){ r-=weights[i]; if(r<=0)return items[i]; }
  return items[items.length-1];
}
function rnd(a,b,rng=Math.random){ return Math.floor(rng()*(b-a+1))+a; }
function shuffled(a,rng=Math.random){ return [...a].sort(()=>rng()-.5); }

export function adjustWeakness(s,key,correctFirstTry){
  const current=Number(s.weak[key]||0);
  s.weak[key]=correctFirstTry ? Math.max(0,current-0.5) : Math.min(8,current+2);
}
function opChoice(s,max,rng){
  const a=`add:${max}`, b=`sub:${max}`;
  return weightedPick(['add','sub'], op=>1+(s.weak[op==='add'?a:b]||0)*1.5,rng);
}
function mulQuestion(world,s,rng){
  const factors=world.factors;
  const a=weightedPick(factors,f=>1+(s.weak[`mul:${f}`]||0)*1.7,rng);
  const b=rnd(1,9,rng), ans=a*b;
  return {txt:`${a} × ${b} = ?`,ans,skillKey:`mul:${a}`};
}
function arithmeticQuestion(world,s,rng,forced=null){
  const max=world.max;
  const op=forced || (world.type==='mix'?opChoice(s,max,rng):world.type);
  if(op==='sub'){
    const a=rnd(1,max,rng), b=rnd(0,a,rng);
    return {txt:`${a} − ${b} = ?`,ans:a-b,skillKey:`sub:${max}`};
  }
  const a=rnd(0,max,rng), b=rnd(0,max-a,rng);
  return {txt:`${a} ＋ ${b} = ?`,ans:a+b,skillKey:`add:${max}`};
}
export function makeQuestion(wi,s,rng=Math.random){
  const world=WORLDS[wi]; let q;
  if(world.type==='mul') q=mulQuestion(world,s,rng);
  else if(world.type==='master'){
    const mulWeight=1+Math.max(...world.factors.map(f=>s.weak[`mul:${f}`]||0));
    const arWeight=1+Math.max(s.weak['add:100']||0,s.weak['sub:100']||0);
    q=weightedPick(['mul','arith'],x=>x==='mul'?mulWeight:arWeight,rng)==='mul'
      ? mulQuestion(world,s,rng) : arithmeticQuestion({type:'mix',max:100},s,rng);
  } else q=arithmeticQuestion(world,s,rng);
  const opts=[q.ans];
  let guard=0;
  while(opts.length<4 && guard++<50){
    const spread=q.ans>50?18:10;
    const x=Math.max(0,q.ans+rnd(-spread,spread,rng));
    if(!opts.includes(x))opts.push(x);
  }
  while(opts.length<4){ const x=opts.length; if(!opts.includes(x))opts.push(x); }
  q.opts=shuffled(opts,rng); return q;
}
export function awardCollectible(s,{rare=false,rng=Math.random}={}){
  const pool=COLLECTIBLES.filter(c=>c.rare===rare);
  const missing=pool.filter(c=>!s.collection.includes(c.id));
  const source=missing.length?missing:pool;
  const pick=source[Math.floor(rng()*source.length)];
  const isNew=!s.collection.includes(pick.id);
  if(isNew)s.collection.push(pick.id); else s.gems+=rare?8:3;
  return {...pick,isNew};
}
export function finishRun(s,wi,{boss=false,maxCombo=0}={}){
  s.worldRuns[wi]=(s.worldRuns[wi]||0)+1;
  s.daily.completedRuns+=1; s.daily.maxCombo=Math.max(s.daily.maxCombo,maxCombo);
  s.best[wi]=Math.max(s.best[wi]||0,5);
  if(s.unlocked===wi+1 && s.unlocked<WORLDS.length)s.unlocked++;
  s.gems+=boss?25:10; s.xp+=boss?55:25;
  if(boss)s.daily.bossWins+=1;
  const collectible=awardCollectible(s,{rare:boss});
  const dailyBonus=claimReadyDaily(s);
  return {collectible,dailyBonus};
}