import {
  localDayKey,normalizeState as normalizeV06State,questionFingerprint,makeReviewQuestion,
  skillMastery,learningSkill
} from './v06-core.mjs';

export * from './v06-core.mjs';

export const MEMORY_INTERVAL_DAYS=Object.freeze([1,3,7,14]);
export const MEMORY_RUN_LIMIT=5;

function dayOrdinal(key){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(String(key||'')))return null;
  const [year,month,day]=key.split('-').map(Number),time=Date.UTC(year,month-1,day);
  const date=new Date(time);
  return date.getUTCFullYear()===year&&date.getUTCMonth()===month-1&&date.getUTCDate()===day?Math.floor(time/86400000):null;
}
function validDayKey(value){return dayOrdinal(value)!==null}
function dayKeyFromOrdinal(ordinal){
  const date=new Date(ordinal*86400000);
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth()+1).padStart(2,'0')}-${String(date.getUTCDate()).padStart(2,'0')}`;
}
export function addMemoryDays(day,amount){
  const ordinal=dayOrdinal(day);if(ordinal===null)throw new Error(`Invalid local day key: ${day}`);
  return dayKeyFromOrdinal(ordinal+Math.trunc(Number(amount)||0));
}
export function memoryDayDistance(fromDay,toDay){
  const from=dayOrdinal(fromDay),to=dayOrdinal(toDay);if(from===null||to===null)throw new Error('Memory day distance requires valid local day keys');
  return to-from;
}

function cloneMemoryQuestion(q){
  if(!q||typeof q!=='object'||typeof q.skillKey!=='string')return null;
  const keep=['op','a','b','result','skillKey','max','variant','ans','optionMin','optionMax','txt','hint','story','storyKind','dividend','divisor','quotient'];
  const out=Object.fromEntries(keep.filter(key=>q[key]!==undefined).map(key=>[key,q[key]]));
  if(Array.isArray(q.opts))out.opts=[...q.opts];
  if(q.bounds&&typeof q.bounds==='object')out.bounds={...q.bounds,...(Array.isArray(q.bounds.totals)?{totals:[...q.bounds.totals]}:{})};
  return out;
}
function ensureMemorySchedule(s){
  if(!s.learning||typeof s.learning!=='object')s.learning={};
  if(!s.learning.memorySchedule||typeof s.learning.memorySchedule!=='object'||Array.isArray(s.learning.memorySchedule))s.learning.memorySchedule={};
  return s.learning.memorySchedule;
}
function cleanMemoryEntry(key,value,day){
  const question=cloneMemoryQuestion(value?.question||value?.q);if(!question||question.skillKey!==key)return null;
  const intervalIndex=Math.max(0,Math.min(MEMORY_INTERVAL_DAYS.length-1,Math.trunc(Number(value?.intervalIndex)||0)));
  return {
    skillKey:key,question,fingerprint:questionFingerprint(question),intervalIndex,
    dueDay:validDayKey(value?.dueDay)?value.dueDay:addMemoryDays(day,MEMORY_INTERVAL_DAYS[intervalIndex]),
    lastReviewedDay:validDayKey(value?.lastReviewedDay)?value.lastReviewedDay:null,
    lastOutcome:['practice','miss','success'].includes(value?.lastOutcome)?value.lastOutcome:'practice'
  };
}

export function normalizeState(raw,day=localDayKey()){
  const state=normalizeV06State(raw,day),source=raw?.learning?.memorySchedule,schedule={};
  if(source&&typeof source==='object'&&!Array.isArray(source))for(const [key,value] of Object.entries(source)){
    const entry=cleanMemoryEntry(key,value,day);if(entry)schedule[key]=entry;
  }
  state.learning.memorySchedule=schedule;return state;
}

export function memoryScheduleSnapshot(s){return Object.fromEntries(Object.entries(ensureMemorySchedule(s)).map(([key,value])=>[key,{...value,question:cloneMemoryQuestion(value.question)}]))}

function setMemoryEntry(s,q,{day,intervalIndex,dueDay,lastOutcome}){
  const question=cloneMemoryQuestion(q);if(!question)return null;
  const schedule=ensureMemorySchedule(s),index=Math.max(0,Math.min(MEMORY_INTERVAL_DAYS.length-1,intervalIndex));
  const entry={skillKey:question.skillKey,question,fingerprint:questionFingerprint(question),intervalIndex:index,dueDay,lastReviewedDay:day,lastOutcome};
  schedule[question.skillKey]=entry;return entry;
}

export function recordMemoryPractice(s,q,{day=localDayKey(),missed=false}={}){
  const question=cloneMemoryQuestion(q);if(!question)return null;
  const existing=ensureMemorySchedule(s)[question.skillKey];
  if(missed)return setMemoryEntry(s,question,{day,intervalIndex:0,dueDay:addMemoryDays(day,1),lastOutcome:'miss'});
  if(!existing)return setMemoryEntry(s,question,{day,intervalIndex:0,dueDay:addMemoryDays(day,1),lastOutcome:'practice'});
  existing.question=question;existing.fingerprint=questionFingerprint(question);return existing;
}

export function recordMemoryMiss(s,q,{day=localDayKey()}={}){
  return setMemoryEntry(s,q,{day,intervalIndex:0,dueDay:addMemoryDays(day,1),lastOutcome:'miss'});
}

export function recordMemorySuccess(s,q,{day=localDayKey(),firstTry=true}={}){
  const question=cloneMemoryQuestion(q);if(!question)return null;
  const existing=ensureMemorySchedule(s)[question.skillKey],previous=Math.max(0,Math.min(3,Number(existing?.intervalIndex)||0));
  const intervalIndex=firstTry?Math.min(MEMORY_INTERVAL_DAYS.length-1,previous+1):0;
  return setMemoryEntry(s,question,{day,intervalIndex,dueDay:addMemoryDays(day,MEMORY_INTERVAL_DAYS[intervalIndex]),lastOutcome:firstTry?'success':'miss'});
}

export function memoryReviewWeight(s,entry,{day=localDayKey()}={}){
  if(!entry?.skillKey)return 0;
  const history=learningSkill(s,entry.skillKey),mastery=skillMastery(s,entry.skillKey),late=Math.max(0,memoryDayDistance(entry.dueDay,day));
  let weight=1+Math.min(4,late*.6)+Math.min(5,history.recentMisses*1.25)+(3-entry.intervalIndex)*.35;
  if(mastery.mastered)weight*=.35;
  return Math.max(.25,Math.min(12,weight));
}

export function dueMemoryReviews(s,{day=localDayKey(),limit=MEMORY_RUN_LIMIT}={}){
  const entries=Object.values(ensureMemorySchedule(s)).filter(entry=>validDayKey(entry.dueDay)&&memoryDayDistance(entry.dueDay,day)>=0);
  return entries.sort((a,b)=>memoryReviewWeight(s,b,{day})-memoryReviewWeight(s,a,{day})||a.dueDay.localeCompare(b.dueDay)||a.skillKey.localeCompare(b.skillKey)).slice(0,Math.max(0,Math.trunc(Number(limit)||0)));
}

export function memoryChestStatus(s,{day=localDayKey()}={}){
  const due=dueMemoryReviews(s,{day,limit:Number.MAX_SAFE_INTEGER});
  return {ready:due.length>0,dueCount:due.length,runCount:Math.min(MEMORY_RUN_LIMIT,due.length),label:due.length?`🧠 ${Math.min(MEMORY_RUN_LIMIT,due.length)} 個記憶寶箱在發光`:'🧠 明天再來看看哪些力量回來'};
}

export function makeMemoryReviewQuestion(entry,rng=Math.random){
  if(!entry?.question)throw new Error('Memory review requires a scheduled question');
  const question=makeReviewQuestion(entry.question,rng);
  return {...question,isReview:false,isMemoryReview:true,memoryDueDay:entry.dueDay,memoryFingerprint:entry.fingerprint};
}
