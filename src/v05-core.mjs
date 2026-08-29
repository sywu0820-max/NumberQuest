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

export const NUMBER_SENSE_SKILLS = ['sense:missing','sense:make10','sense:make100','sense:compare','sense:decompose'];
export const MULTIPLICATION_SKILLS = Array.from({length:9},(_,i)=>`mul:${i+1}`);
export const DIVISION_SKILLS = Array.from({length:9},(_,i)=>`div:${i+1}`);

export function localDayKey(d = new Date()) {
  const y=d.getFullYear(), m=String(d.getMonth()+1).padStart(2,'0'), day=String(d.getDate()).padStart(2,'0');
  return `${y}-${m}-${day}`;
}
export function dayBefore(key){
  const [y,m,d]=key.split('-').map(Number); const x=new Date(y,m-1,d); x.setDate(x.getDate()-1); return localDayKey(x);
}
function dailyState(day){return {day,completedRuns:0,maxCombo:0,solved:0,bossWins:0,claimed:{}}}
export function freshState(day=localDayKey()) {
  return {
    version:5,gems:0,xp:0,unlocked:1,best:{},worldRuns:{},weak:{},skillStats:{},collection:[],
    streakDays:1,lastPlayDay:day,selectedLength:10,daily:dailyState(day),
    learning:{session:0,solvedTotal:0,recentSkills:[],skillHistory:{},pendingReviews:[],divisionIntroSeen:false}
  };
}
function cleanHistory(x={}){
  return {
    attempts:Math.max(0,Number(x.attempts)||0),
    firstTryCorrect:Math.max(0,Number(x.firstTryCorrect)||0),
    recentMisses:Math.max(0,Number(x.recentMisses)||0),
    successfulRevisits:Math.max(0,Number(x.successfulRevisits)||0),
    pendingRevisits:Math.max(0,Number(x.pendingRevisits)||0),
    lastPracticedDay:typeof x.lastPracticedDay==='string'?x.lastPracticedDay:null,
    lastPracticedSession:Number.isFinite(Number(x.lastPracticedSession))?Number(x.lastPracticedSession):null,
  };
}
function cloneQuestion(q){
  if(!q||typeof q!=='object')return null;
  const keep=['op','a','b','result','skillKey','max','variant','ans','optionMin','optionMax','txt','hint','story','dividend','divisor','quotient','bounds'];
  return Object.fromEntries(keep.filter(k=>q[k]!==undefined).map(k=>[k,q[k]]));
}
export function normalizeState(raw, day=localDayKey()){
  const source=raw&&typeof raw==='object'?raw:{}, base=freshState(day);
  const s={...base,...source,version:5};
  s.best={...(source.best||{})};s.worldRuns={...(source.worldRuns||{})};s.weak={...(source.weak||{})};
  s.skillStats=Object.fromEntries(Object.entries(source.skillStats||{}).map(([key,value])=>[key,{...(value||{})}]));
  s.collection=Array.isArray(source.collection)?[...new Set(source.collection.filter(x=>typeof x==='string'))]:[];
  if(![5,10,20].includes(Number(s.selectedLength)))s.selectedLength=10;else s.selectedLength=Number(s.selectedLength);
  const oldLearning=source.learning&&typeof source.learning==='object'?source.learning:{};
  const skillHistory={};
  for(const [key,value] of Object.entries(oldLearning.skillHistory||{}))skillHistory[key]=cleanHistory(value);
  for(const [key,value] of Object.entries(source.skillStats||{}))if(!skillHistory[key]){
    skillHistory[key]=cleanHistory({attempts:value?.seen,firstTryCorrect:value?.first,recentMisses:Math.ceil(Number(source.weak?.[key]||0)/2)});
  }
  const pendingReviews=Array.isArray(oldLearning.pendingReviews)?oldLearning.pendingReviews.map(item=>({
    dueSolved:Math.max(0,Number(item?.dueSolved)||0),q:cloneQuestion(item?.q)
  })).filter(item=>item.q?.skillKey):[];
  s.learning={
    session:Math.max(0,Number(oldLearning.session)||0),solvedTotal:Math.max(0,Number(oldLearning.solvedTotal)||Number(source.daily?.solved)||0),
    recentSkills:Array.isArray(oldLearning.recentSkills)?oldLearning.recentSkills.filter(x=>typeof x==='string').slice(-4):[],
    skillHistory,pendingReviews,divisionIntroSeen:Boolean(oldLearning.divisionIntroSeen)
  };
  if(s.lastPlayDay!==day){s.streakDays=s.lastPlayDay===dayBefore(day)?Math.max(1,(Number(s.streakDays)||0)+1):1;s.lastPlayDay=day}
  s.daily=source.daily&&source.daily.day===day?{...dailyState(day),...source.daily,claimed:{...(source.daily.claimed||{})}}:dailyState(day);
  return s;
}
export function migrateV4State(v4,day=localDayKey()){return normalizeState(v4,day)}

export function learningSkill(s,key){
  if(!s.learning)s.learning=freshState().learning;
  if(!s.learning.skillHistory[key])s.learning.skillHistory[key]=cleanHistory();
  return s.learning.skillHistory[key];
}
function rememberSkill(s,key){s.learning.recentSkills=[...s.learning.recentSkills.filter(x=>x!==key),key].slice(-4)}
export function recordSkillMiss(s,key,{day=localDayKey()}={}){
  const h=learningSkill(s,key);h.recentMisses=Math.min(12,h.recentMisses+1);h.pendingRevisits+=1;h.lastPracticedDay=day;h.lastPracticedSession=s.learning.session;rememberSkill(s,key);return h;
}
export function recordSkillSuccess(s,key,{firstTry=true,isRevisit=false,day=localDayKey()}={}){
  const h=learningSkill(s,key);h.attempts+=1;if(firstTry)h.firstTryCorrect+=1;
  if(firstTry&&isRevisit){h.successfulRevisits+=1;h.pendingRevisits=Math.max(0,h.pendingRevisits-1);h.recentMisses=Math.max(0,h.recentMisses-1)}
  else if(firstTry)h.recentMisses=Math.max(0,h.recentMisses-.25);
  h.lastPracticedDay=day;h.lastPracticedSession=s.learning.session;s.learning.solvedTotal+=1;rememberSkill(s,key);
  s.skillStats[key]={seen:h.attempts,first:h.firstTryCorrect};s.weak[key]=Math.max(0,Math.min(8,h.recentMisses*2));return h;
}
export function recordSkillResult(s,key,correctFirstTry){return recordSkillSuccess(s,key,{firstTry:correctFirstTry})}
export function adjustWeakness(s,key,correctFirstTry){
  const current=Number(s.weak[key]||0);s.weak[key]=correctFirstTry?Math.max(0,current-.5):Math.min(8,current+2);return s.weak[key];
}
export function skillMastery(s,key){
  const h=learningSkill(s,key),accuracy=h.attempts?h.firstTryCorrect/h.attempts:0;
  const confidence=Math.min(1,h.attempts/6),score=Math.round(Math.max(0,accuracy*confidence*100-h.recentMisses*4));
  const mastered=h.attempts>=5&&accuracy>=.8&&h.recentMisses<=1;
  const power=mastered?3:h.attempts>=3&&accuracy>=.55?2:h.attempts>=1?1:0;
  return {...h,accuracy,score,mastered,power};
}
export function divisionUnlocked(s){return MULTIPLICATION_SKILLS.reduce((n,key)=>n+learningSkill(s,key).attempts,0)>=5}

export function weightedPick(items,weightFn,rng=Math.random){
  const weights=items.map(x=>Math.max(.01,Number(weightFn(x))||.01));const total=weights.reduce((a,b)=>a+b,0);let r=Math.min(.999999999,Math.max(0,rng()))*total;
  for(let i=0;i<items.length;i++){r-=weights[i];if(r<0)return items[i]}return items[items.length-1];
}
export function challengeWeights(s,skillKeys,{session=s.learning.session,recentSkills=s.learning.recentSkills}={}){
  return Object.fromEntries(skillKeys.map(key=>{
    const h=learningSkill(s,key),accuracy=h.attempts?h.firstTryCorrect/h.attempts:.6;
    const stale=h.lastPracticedSession===null?2:Math.min(3,Math.max(0,session-h.lastPracticedSession)/2);
    let weight=1+(1-accuracy)*3+h.recentMisses*1.4+h.pendingRevisits*2+stale;
    if(skillMastery(s,key).mastered)weight*=.5;
    const distance=[...recentSkills].reverse().indexOf(key);if(distance===0)weight*=.25;else if(distance===1)weight*=.55;
    return [key,Math.max(.35,Math.min(14,weight))];
  }));
}
export function nextChallenge(s,skillKeys,{rng=Math.random,session=s.learning.session,recentSkills=s.learning.recentSkills}={}){
  const unique=[...new Set(skillKeys)];if(!unique.length)throw new Error('nextChallenge requires at least one skill');
  const weights=challengeWeights(s,unique,{session,recentSkills});return weightedPick(unique,key=>weights[key],rng);
}

function rnd(a,b,rng=Math.random){return Math.floor(rng()*(b-a+1))+a}
function shuffled(items,rng=Math.random){const a=[...items];for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function addOptions(q,rng){
  if(Array.isArray(q.opts))return {...q,opts:shuffled(q.opts,rng)};
  const opts=[q.ans];let guard=0;
  while(opts.length<4&&guard++<100){let x;if(q.optionMax<=9)x=rnd(q.optionMin,q.optionMax,rng);else{const spread=q.optionMax>50?18:10;x=Math.min(q.optionMax,Math.max(q.optionMin,q.ans+rnd(-spread,spread,rng)))}if(!opts.includes(x))opts.push(x)}
  for(let x=q.optionMin;opts.length<4&&x<=q.optionMax;x++)if(!opts.includes(x))opts.push(x);
  return {...q,opts:shuffled(opts,rng)};
}
function mulBase(family,rng){const b=rnd(1,9,rng);return {op:'mul',a:family,b,result:family*b,skillKey:`mul:${family}`,max:81}}
function arithmeticBase(op,max,rng){
  if(op==='sub'){const a=rnd(1,max,rng),b=rnd(0,a,rng);return {op,a,b,result:a-b,skillKey:`sub:${max}`,max}}
  const a=rnd(0,max,rng),b=rnd(0,max-a,rng);return {op:'add',a,b,result:a+b,skillKey:`add:${max}`,max};
}
function variantProbability(level){return level<=1?0:level===2?.3:.5}
function formatBase(base,level,rng,forceMissing=false){
  const useGap=forceMissing||rng()<variantProbability(level);
  if(base.op==='mul'){
    if(useGap){const left=rng()<.5,ans=left?base.a:base.b;return {...base,variant:'missing',ans,optionMin:1,optionMax:9,txt:left?`? × ${base.b} = ${base.result}`:`${base.a} × ? = ${base.result}`,hint:left?`💡 想想看，幾組 ${base.b} 才會到 ${base.result}？`:`💡 從 ${base.a}、${base.a*2}、${base.a*3} 慢慢數。`}}
    return {...base,variant:'normal',ans:base.result,optionMin:0,optionMax:81,txt:`${base.a} × ${base.b} = ?`,hint:`💡 先找你熟悉的 ${base.a} × ${Math.max(1,base.b-1)}，再加一組 ${base.a}。`};
  }
  if(base.op==='add'){
    if(useGap){const left=rng()<.5,ans=left?base.a:base.b;return {...base,variant:'missing',ans,optionMin:0,optionMax:base.max,txt:left?`? ＋ ${base.b} = ${base.result}`:`${base.a} ＋ ? = ${base.result}`,hint:`💡 從已知的數字往上數到 ${base.result}，先別急著看答案。`}}
    return {...base,variant:'normal',ans:base.result,optionMin:0,optionMax:base.max,txt:`${base.a} ＋ ${base.b} = ?`,hint:'💡 先湊到最近的整十，再把剩下的加回去。'};
  }
  if(useGap){const askMinuend=rng()<.35;if(askMinuend)return {...base,variant:'missing',ans:base.a,optionMin:0,optionMax:base.max,txt:`? − ${base.b} = ${base.result}`,hint:`💡 從 ${base.result} 加回 ${base.b}，一步一步找。`};return {...base,variant:'missing',ans:base.b,optionMin:0,optionMax:base.max,txt:`${base.a} − ? = ${base.result}`,hint:`💡 從 ${base.result} 往上數到 ${base.a}，數了多少？`}}
  return {...base,variant:'normal',ans:base.result,optionMin:0,optionMax:base.max,txt:`${base.a} − ${base.b} = ?`,hint:`💡 把 ${base.b} 拆小一點，分兩次從 ${base.a} 減。`};
}

export function makeDivisionQuestion(s,{family,rng=Math.random,variant}={}){
  const divisor=family||rnd(1,9,rng),quotient=rnd(1,9,rng),dividend=divisor*quotient,kind=variant??rnd(0,3,rng);
  const base={op:'div',skillKey:`div:${divisor}`,dividend,divisor,quotient,result:quotient,optionMin:1,optionMax:9,bounds:{dividendMax:81,factorMax:9}};
  if(kind===1)return addOptions({...base,variant:'missing-divisor',ans:divisor,txt:`${dividend} ÷ ? = ${quotient}`,hint:`💡 想一想：幾組 ${quotient} 會合起來變成 ${dividend}？`},rng);
  if(kind===2)return addOptions({...base,variant:'inverse',ans:quotient,txt:`? × ${divisor} = ${dividend}`,hint:`💡 除法橋的另一邊是乘法：從 ${divisor} 的乘法找線索。`},rng);
  if(kind===3)return addOptions({...base,variant:'story',story:true,ans:quotient,txt:`${dividend} 顆星平均放進 ${divisor} 個寶箱，每箱幾顆？`,hint:`💡 先每個寶箱放 1 顆，再想想能平均放幾輪。`},rng);
  return addOptions({...base,variant:'quotient',ans:quotient,txt:`${dividend} ÷ ${divisor} = ?`,hint:`💡 想想看：${divisor} × 幾會等於 ${dividend}？`},rng);
}

function expressionForTotal(total,rng){const a=rnd(Math.max(0,total-24),Math.max(0,total-1),rng),b=total-a;return `${a} ＋ ${b}`}
export function makeNumberSenseQuestion(kind,{rng=Math.random}={}){
  if(kind==='sense:make10'){const a=rnd(1,9,rng),ans=10-a;return addOptions({op:'sense',variant:'make10',skillKey:kind,ans,optionMin:0,optionMax:10,txt:`${a} ＋ ? = 10`,hint:`💡 用手指從 ${a} 數到 10，看看還差幾步。`,bounds:{max:10}},rng)}
  if(kind==='sense:make100'){const a=rnd(1,9,rng)*10,ans=100-a;return addOptions({op:'sense',variant:'make100',skillKey:kind,ans,optionMin:0,optionMax:100,txt:`${a} ＋ ? = 100`,hint:`💡 把十位數想成幾個「十」，還差幾個十？`,bounds:{max:100}},rng)}
  if(kind==='sense:compare'){
    const target=rng()<.5?50:100,distances=target===50?[1,5,9,14]:[2,8,15,23],totals=distances.map((d,i)=>target-d+(target===50&&i%2?d*2:0));
    const opts=totals.map(t=>expressionForTotal(t,rng)),ans=opts[0];return addOptions({op:'sense',variant:'compare',skillKey:kind,ans,opts,txt:`哪一個算式最接近 ${target}？`,hint:`💡 不用全算完；先看看每個算式離 ${target} 大約多遠。`,bounds:{max:100,target,totals}},rng);
  }
  if(kind==='sense:decompose'){
    let a,b,toTen,rest;do{a=rnd(21,79,rng);if(a%10===0)continue;toTen=10-a%10;b=rnd(toTen,100-a,rng);rest=b-toTen}while(rest===undefined||b<toTen);
    return addOptions({op:'sense',variant:'decompose',skillKey:kind,ans:rest,optionMin:0,optionMax:100,txt:`${a} ＋ ${b}：把 ${b} 拆成 ${toTen} 和 ?`,hint:`💡 已經拿出 ${toTen} 去湊整十，看看 ${b} 還剩多少。`,bounds:{max:100,result:a+b}},rng);
  }
  const op=rng()<.5?'add':'sub',base=arithmeticBase(op,100,rng);return addOptions({...formatBase(base,3,rng,true),skillKey:'sense:missing'},rng);
}

export function skillKeysForWorld(wi,{challengeLevel=1}={}){
  const w=WORLDS[wi];if(!w)return [];
  if(w.type==='mul')return w.factors.map(f=>`mul:${f}`);
  if(w.type==='add'||w.type==='sub')return [`${w.type}:${w.max}`,...(challengeLevel>1?['sense:missing']:[])];
  if(w.type==='mix')return [`add:${w.max}`,`sub:${w.max}`,...(challengeLevel>1?['sense:missing']:[])];
  return [...MULTIPLICATION_SKILLS,'add:100','sub:100',...(challengeLevel>1?NUMBER_SENSE_SKILLS:[])];
}
export function makeQuestionForSkill(key,s,{rng=Math.random,challengeLevel=1}={}){
  if(key.startsWith('div:'))return makeDivisionQuestion(s,{family:Number(key.split(':')[1]),rng});
  if(key.startsWith('sense:'))return makeNumberSenseQuestion(key,{rng});
  const [op,n]=key.split(':');if(op==='mul')return addOptions(formatBase(mulBase(Number(n),rng),challengeLevel,rng),rng);
  return addOptions(formatBase(arithmeticBase(op,Number(n),rng),challengeLevel,rng),rng);
}
export function makeQuestion(wi,s,{rng=Math.random,challengeLevel=1}={}){
  const keys=skillKeysForWorld(wi,{challengeLevel}),key=nextChallenge(s,keys,{rng});return makeQuestionForSkill(key,s,{rng,challengeLevel});
}
export function mixedSkillKeys(s,{challengeLevel=3}={}){
  const count=Math.max(1,Math.min(WORLDS.length,Number(s.unlocked)||1)),keys=[];
  for(let i=0;i<count;i++)keys.push(...skillKeysForWorld(i,{challengeLevel}));
  if(challengeLevel>1)keys.push(...NUMBER_SENSE_SKILLS);if(divisionUnlocked(s))keys.push(...DIVISION_SKILLS);return [...new Set(keys)];
}
export function makeMixedQuestion(s,{rng=Math.random,challengeLevel=3}={}){
  const key=nextChallenge(s,mixedSkillKeys(s,{challengeLevel}),{rng});return makeQuestionForSkill(key,s,{rng,challengeLevel});
}
export function makeFocusQuestion(s,{rng=Math.random,challengeLevel=3}={}){
  const keys=mixedSkillKeys(s,{challengeLevel}),weights=challengeWeights(s,keys),ranked=[...keys].sort((a,b)=>weights[b]-weights[a]),pool=ranked.slice(0,Math.min(6,ranked.length));
  return makeQuestionForSkill(nextChallenge(s,pool,{rng}),s,{rng,challengeLevel});
}
export function makeReviewQuestion(q,rng=Math.random){return addOptions({...cloneQuestion(q),isReview:true},rng)}
export function queueSpacedReview(s,q,spacing=3){
  if(s.learning.pendingReviews.some(x=>x.q.skillKey===q.skillKey&&x.q.txt===q.txt))return false;
  s.learning.pendingReviews.push({q:cloneQuestion(q),dueSolved:s.learning.solvedTotal+Math.max(3,Number(spacing)||3)});return true;
}
export function takeDueReview(s,rng=Math.random){
  const idx=s.learning.pendingReviews.findIndex(x=>x.dueSolved<=s.learning.solvedTotal);if(idx<0)return null;
  const [{q}]=s.learning.pendingReviews.splice(idx,1);return makeReviewQuestion(q,rng);
}
export function beginLearningSession(s){s.learning.session+=1;s.learning.recentSkills=[];return s.learning.session}

export function dailyQuests(s){return [
  {id:'run',icon:'🗺️',label:'完成 1 次探險',now:s.daily.completedRuns,target:1,reward:8},
  {id:'combo',icon:'⚡',label:'達成 8 連擊',now:s.daily.maxCombo,target:8,reward:10},
  {id:'solve',icon:'🎯',label:'今天答對 25 題',now:s.daily.solved,target:25,reward:15},
]}
export function claimReadyDaily(s){let gained=0;for(const q of dailyQuests(s))if(q.now>=q.target&&!s.daily.claimed[q.id]){s.daily.claimed[q.id]=true;s.gems+=q.reward;gained+=q.reward}return gained}
export function bossReady(s,wi){return ((s.worldRuns[wi]||0)%3)===2}
export function worldWeakness(s,wi){const keys=skillKeysForWorld(wi,{challengeLevel:1}),weights=challengeWeights(s,keys);return Math.max(0,...keys.map(k=>weights[k]-1))}
export function weakestUnlockedWorld(s,rng=Math.random){const count=Math.max(1,Math.min(WORLDS.length,s.unlocked||1)),ids=Array.from({length:count},(_,i)=>i);return weightedPick(ids,i=>1+worldWeakness(s,i),rng)}
export function awardCollectible(s,{rare=false,rng=Math.random}={}){const pool=COLLECTIBLES.filter(c=>c.rare===rare),missing=pool.filter(c=>!s.collection.includes(c.id)),source=missing.length?missing:pool,pick=source[Math.floor(rng()*source.length)],isNew=!s.collection.includes(pick.id);if(isNew)s.collection.push(pick.id);else s.gems+=rare?8:3;return {...pick,isNew}}
function lengthMultiplier(n){return n>=20?3:n>=10?1.8:1}
export function finishRun(s,wi,{boss=false,maxCombo=0,questionCount=5}={}){s.worldRuns[wi]=(s.worldRuns[wi]||0)+1;s.daily.completedRuns+=1;s.daily.maxCombo=Math.max(s.daily.maxCombo,maxCombo);s.best[wi]=Math.max(s.best[wi]||0,5);if(s.unlocked===wi+1&&s.unlocked<WORLDS.length)s.unlocked++;const mult=lengthMultiplier(questionCount);s.gems+=Math.round((boss?25:10)*mult);s.xp+=Math.round((boss?55:25)*mult);if(boss)s.daily.bossWins+=1;const collectible=awardCollectible(s,{rare:boss}),dailyBonus=claimReadyDaily(s);return {collectible,dailyBonus}}
export function finishSpecialRun(s,{mode='focus',maxCombo=0,questionCount=10}={}){s.daily.completedRuns+=1;s.daily.maxCombo=Math.max(s.daily.maxCombo,maxCombo);const mult=lengthMultiplier(questionCount);s.gems+=Math.round((mode==='academy'?16:12)*mult);s.xp+=Math.round((mode==='academy'?40:30)*mult);const collectible=awardCollectible(s,{rare:false}),dailyBonus=claimReadyDaily(s);return {collectible,dailyBonus}}
