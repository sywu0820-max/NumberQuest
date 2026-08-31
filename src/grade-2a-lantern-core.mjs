import {questionFingerprint,localDayKey} from './v10-core.mjs?v=10-10';

export const LANTERN_WORLD_ID='world.lantern-harbor';
export const LANTERN_CORE_SKILLS=Object.freeze([
  'g2a.num.count-200','g2a.num.compose-200','g2a.num.represent-200','g2a.num.compare-200'
]);
export const LANTERN_EXTENSION_SKILLS=Object.freeze([
  'g2a.num.count-300-extension','g2a.num.compose-300-extension','g2a.num.compare-300-extension'
]);
export const LANTERN_ALL_SKILLS=Object.freeze([...LANTERN_CORE_SKILLS,...LANTERN_EXTENSION_SKILLS]);

export const LANTERN_PEDAGOGY=Object.freeze({
  'g2a.num.count-200':Object.freeze({misconceptions:['pv-count-digits','pv-zero-placeholder'],hintStrategy:'place-value-build',retryStrategy:'concrete-then-symbolic',masteryProfile:'concept',reviewProfile:'standard'}),
  'g2a.num.compose-200':Object.freeze({misconceptions:['pv-count-digits','pv-zero-placeholder'],hintStrategy:'place-value-build',retryStrategy:'contrast-case',masteryProfile:'concept',reviewProfile:'standard'}),
  'g2a.num.represent-200':Object.freeze({misconceptions:['pv-count-digits','pv-zero-placeholder'],hintStrategy:'place-value-build',retryStrategy:'isomorphic-new-surface',masteryProfile:'concept',reviewProfile:'standard'}),
  'g2a.num.compare-200':Object.freeze({misconceptions:['pv-compare-length','pv-zero-placeholder'],hintStrategy:'compare-align',retryStrategy:'contrast-case',masteryProfile:'concept',reviewProfile:'standard'})
});

const clampRoll=rng=>Math.min(.999999999,Math.max(0,Number(rng())||0));
const pick=(items,rng)=>items[Math.floor(clampRoll(rng)*items.length)];
const integer=(min,max,rng)=>min+Math.floor(clampRoll(rng)*(max-min+1));
const digits=value=>({hundreds:Math.floor(value/100),tens:Math.floor(value%100/10),ones:value%10});
const isDue=(entry,state)=>Number(entry?.dueSolved)<=Number(state?.learning?.solvedTotal);

export function isLanternSkill(skillKey){return LANTERN_ALL_SKILLS.includes(skillKey)}

export function lanternEligibility({numberRange=200}={}){
  const range=Math.max(0,Math.trunc(Number(numberRange)||0));
  return {numberRange:range,coreSkillIds:[...LANTERN_CORE_SKILLS],eligibleExtensionSkillIds:range>=300?[...LANTERN_EXTENSION_SKILLS]:[],extensionDeferred:range<300,completionSkillIds:[...LANTERN_CORE_SKILLS]};
}

function countMission(skillKey,max,rng){
  const missing=integer(102,max-2,rng),slot=integer(0,2,rng),sequence=[missing-slot,missing-slot+1,missing-slot+2];
  const starts=[-6,-4,-3,3,4,6].map(offset=>missing+offset).filter(value=>value>=101&&value<=max),dialStart=pick(starts,rng);
  return {op:'lantern',variant:'lantern-count',skillKey,a:sequence[0],b:slot,result:missing,ans:missing,optionMin:101,optionMax:max,bounds:{dialStart},txt:`航道訊號 ${sequence.map((value,index)=>index===slot?'？':value).join('、')}`,hint:'先找出前後的數字，再把缺少的那一盞燈轉到正確位置。'};
}
function composeMission(skillKey,max,rng){
  const result=integer(101,max,rng),d=digits(result);
  return {op:'lantern',variant:'lantern-compose',skillKey,a:d.hundreds,b:d.tens,result,ans:result,optionMin:0,optionMax:max,txt:`救援船需要 ${result} 點亮度`,hint:'先放百光束，再放十光束，最後補上一光點。'};
}
function representMission(skillKey,max,rng){
  let result=integer(101,max,rng),d=digits(result);if(result===200){result=190;d=digits(result)}
  const surface=pick(['expanded','words'],rng),txt=surface==='expanded'?`${d.hundreds} 個百光束、${d.tens} 個十光束、${d.ones} 個一光點`:`${d.hundreds} 百 ${d.tens} 十 ${d.ones}`;
  return {op:'lantern',variant:`lantern-represent-${surface}`,skillKey,a:d.hundreds,b:d.tens,result,ans:result,optionMin:0,optionMax:max,txt:`舊航海圖寫著：${txt}`,hint:'把圖上的百、十、一逐一對到訊號塔。'};
}
function compareMission(skillKey,max,rng){
  let a=integer(101,max,rng),b=integer(101,max,rng);while(a===b)b=integer(101,max,rng);
  const direction=pick(['stronger','earlier'],rng),ans=direction==='stronger'?(a>b?'left':'right'):(a<b?'left':'right');
  return {op:'lantern',variant:`lantern-compare-${direction}`,skillKey,a,b,result:Math.max(a,b),ans,optionMin:101,optionMax:max,txt:direction==='stronger'?`哪座訊號 ${a} 或 ${b} 能照得更遠？`:`哪艘船的訊號 ${a} 或 ${b} 應該先進港？`,hint:'先比百位；相同再比十位，最後才比個位。'};
}

export function makeLanternMission(skillKey,{rng=Math.random,numberRange=200,excludeFingerprint=null}={}){
  if(!isLanternSkill(skillKey))throw new Error(`Unknown Lantern Harbor skill: ${skillKey}`);
  const extension=LANTERN_EXTENSION_SKILLS.includes(skillKey),max=extension?Math.max(201,Math.min(300,Math.trunc(Number(numberRange)||300))):Math.max(120,Math.min(200,Math.trunc(Number(numberRange)||200)));
  const factory=skillKey.includes('.count-')?countMission:skillKey.includes('.compose-')?composeMission:skillKey.includes('.represent-')?representMission:compareMission;
  let mission;for(let attempt=0;attempt<20;attempt++){mission=factory(skillKey,max,rng);if(questionFingerprint(mission)!==excludeFingerprint)break}
  return mission;
}

export function lanternMissionModel(q){
  if(!isLanternSkill(q?.skillKey))return null;
  const kind=q.variant==='lantern-count'?'count':q.variant==='lantern-compose'?'compose':q.variant?.startsWith('lantern-represent-')?'represent':'compare';
  return {kind,target:Number(q.result),left:Number(q.a),right:Number(q.b),direction:q.variant?.endsWith('earlier')?'earlier':'stronger',digits:digits(Number(q.result)),prompt:q.txt};
}

export function lanternCountDialStart(q){
  const model=lanternMissionModel(q);if(model?.kind!=='count')return null;
  const min=Number(q.optionMin),max=Number(q.optionMax),stored=Number(q.bounds?.dialStart);
  if(Number.isInteger(stored)&&stored>=min&&stored<=max&&stored!==Number(q.ans))return stored;
  const distance=3+Math.abs((Number(q.a)||0)+(Number(q.b)||0))%4,direction=((Number(q.a)||0)+(Number(q.b)||0))%2?-1:1;
  const preferred=Number(q.ans)+direction*distance,alternate=Number(q.ans)-direction*distance;
  return preferred>=min&&preferred<=max?preferred:Math.max(min,Math.min(max,alternate));
}

export function evaluateLanternAction(q,action){
  const model=lanternMissionModel(q);if(!model)return {correct:false};
  if(model.kind==='compare')return {correct:action?.side===q.ans,expected:q.ans};
  const value=model.kind==='count'?Number(action?.value):Number(action?.hundreds)*100+Number(action?.tens)*10+Number(action?.ones);
  return {correct:value===Number(q.ans),value,expected:Number(q.ans)};
}

export function lanternHint(q,{level=1}={}){
  const model=lanternMissionModel(q);if(!model)return '';
  if(model.kind==='count')return level>1?'先看問號前後各差多少；轉盤只移動一格一格。':'沿著燈號順序慢慢數，不用猜。';
  if(model.kind==='compare')return level>1?'把兩個數的百位排在一起；相同才往十位、個位走。':'先找最高位不同的地方。';
  return level>1?'先只放百光束，再放十光束，最後用一光點補齊。':'把百、十、一分開建造，總亮度不會改變。';
}

function reviewSourceFingerprint(q){return questionFingerprint(q?.reviewSourceQuestion||q)}
function lanternReviewEntries(state,excluded=[]){const fingerprints=new Set(excluded);return (state?.learning?.pendingReviews||[]).filter(entry=>isLanternSkill(entry?.q?.skillKey)&&!fingerprints.has(entry.fingerprint||questionFingerprint(entry.q)))}
function dueLanternReview(state,excluded=[]){return lanternReviewEntries(state,excluded).find(entry=>isDue(entry,state))||null}
function dueLanternMemory(state,day){return Object.values(state?.learning?.memorySchedule||{}).find(entry=>isLanternSkill(entry?.skillKey)&&typeof entry.dueDay==='string'&&entry.dueDay<=day)||null}
function freshReview(source,{rng,numberRange,kind}){
  const mission=makeLanternMission(source.skillKey,{rng,numberRange,excludeFingerprint:questionFingerprint(source)});
  return {...mission,[kind==='memory'?'isMemoryReview':'isReview']:true,reviewSourceQuestion:source};
}

export function planLanternRun(state,{count=8,day=localDayKey(),rng=Math.random,numberRange=200}={}){
  const bounded=Math.max(4,Math.min(12,Math.trunc(Number(count)||8))),plan=[];
  const memory=dueLanternMemory(state,day);if(memory?.question)plan.push(freshReview(memory.question,{rng,numberRange,kind:'memory'}));
  const session=dueLanternReview(state);if(session?.q&&(!memory||questionFingerprint(session.q)!==questionFingerprint(memory.question)))plan.push(freshReview(session.q,{rng,numberRange,kind:'session'}));
  const covered=new Set(plan.map(item=>item.skillKey));
  for(const skillKey of LANTERN_CORE_SKILLS)if(plan.length<bounded&&!covered.has(skillKey)){plan.push(makeLanternMission(skillKey,{rng,numberRange}));covered.add(skillKey)}
  let index=0;while(plan.length<bounded){const skillKey=LANTERN_CORE_SKILLS[index++%LANTERN_CORE_SKILLS.length],previous=plan.at(-1);plan.push(makeLanternMission(skillKey,{rng,numberRange,excludeFingerprint:previous?.skillKey===skillKey?questionFingerprint(previous):null}))}
  return plan;
}

export function reconcileLanternRunQueue(state,queue,{afterIndex=-1,rng=Math.random,numberRange=200}={}){
  if(!Array.isArray(queue))return {insertedReview:null,appendedIntervening:[],pendingWait:null};
  const insertAt=Math.max(0,Math.min(queue.length,Math.trunc(Number(afterIndex)||0)+1));
  const queuedFingerprints=queue.slice(insertAt).filter(item=>item?.isReview).map(reviewSourceFingerprint);
  const due=dueLanternReview(state,queuedFingerprints);
  if(due?.q){const review=freshReview(due.q,{rng,numberRange,kind:'session'});queue.splice(insertAt,0,review);return {insertedReview:review,appendedIntervening:[],pendingWait:0}}
  const entries=lanternReviewEntries(state,queuedFingerprints);if(!entries.length)return {insertedReview:null,appendedIntervening:[],pendingWait:null};
  const solved=Number(state?.learning?.solvedTotal)||0,pendingWait=Math.max(0,Math.min(...entries.map(entry=>Number(entry.dueSolved)||0))-solved),remaining=queue.length-insertAt,needed=Math.max(0,pendingWait-remaining),appendedIntervening=[];
  for(let index=0;index<needed;index++){const skillKey=LANTERN_CORE_SKILLS[(solved+remaining+index)%LANTERN_CORE_SKILLS.length],previous=queue.at(-1),mission=makeLanternMission(skillKey,{rng,numberRange,excludeFingerprint:previous?.skillKey===skillKey?questionFingerprint(previous):null});mission.journeyPurpose='growth';queue.push(mission);appendedIntervening.push(mission)}
  return {insertedReview:null,appendedIntervening,pendingWait};
}

export function freshLanternRetry(q,{rng=Math.random,numberRange=200}={}){
  return {...makeLanternMission(q.skillKey,{rng,numberRange,excludeFingerprint:questionFingerprint(q)}),retryOf:questionFingerprint(q),isReview:Boolean(q.isReview),isMemoryReview:Boolean(q.isMemoryReview),reviewSourceQuestion:q.reviewSourceQuestion||q};
}

export function lanternRunCompletion(events=[]){
  const completed=new Set(events.filter(event=>event?.completed).map(event=>event.skillKey));
  const missing=LANTERN_CORE_SKILLS.filter(skillKey=>!completed.has(skillKey));
  return {complete:missing.length===0,completedSkillIds:LANTERN_CORE_SKILLS.filter(skillKey=>completed.has(skillKey)),missingSkillIds:missing,requiredSkillIds:[...LANTERN_CORE_SKILLS],ignoredExtensionSkillIds:[...LANTERN_EXTENSION_SKILLS]};
}

export function lanternCapabilitySnapshot(state){
  const history=state?.learning?.skillHistory||{};
  return Object.fromEntries(LANTERN_CORE_SKILLS.map(skillKey=>[skillKey,{attempts:Number(history[skillKey]?.attempts)||0,independentSuccesses:Number(history[skillKey]?.firstTryCorrect)||0,successfulRevisits:Number(history[skillKey]?.successfulRevisits)||0}]));
}
