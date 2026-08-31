import {
  normalizeState as normalizeV09State,localDayKey,dueMemoryReviews,buildJourneyRecap as buildV09JourneyRecap,
  finishRun,finishSpecialRun
} from './v09-core.mjs';

export * from './v09-core.mjs';

export const ONBOARDING_STEPS=Object.freeze([
  Object.freeze({icon:'👆',title:'選一個答案',copy:'先自己想一想，再點你覺得對的答案。'}),
  Object.freeze({icon:'🧩',title:'卡住也沒關係',copy:'答錯是冒險的一部分，你可以選一句線索或看圖想一想。'}),
  Object.freeze({icon:'✨',title:'讓能力慢慢發光',copy:'自己想起來、換個故事也會，能力地圖就會越來越亮。'})
]);

export const CAPABILITY_STATES=Object.freeze({
  UNEXPLORED:Object.freeze({id:'unexplored',icon:'🗺️',label:'等你探索',rank:0}),
  EXPLORED:Object.freeze({id:'explored',icon:'🧭',label:'探索過',rank:1}),
  GROWING:Object.freeze({id:'growing',icon:'🌱',label:'正在長大',rank:2}),
  REMEMBERED:Object.freeze({id:'remembered',icon:'🧠',label:'記得回來',rank:3}),
  STRONG:Object.freeze({id:'strong',icon:'✨',label:'穩穩發光',rank:4})
});

const clone=value=>value===undefined?undefined:JSON.parse(JSON.stringify(value));
const cleanCount=value=>Math.max(0,Math.trunc(Number(value)||0));
const emptyProduct=()=>({onboardingComplete:false,dailyRewardDay:null,capabilityEvidence:{}});

function hasPriorLearning(raw){
  if(!raw||typeof raw!=='object')return false;
  const learning=raw.learning&&typeof raw.learning==='object'?raw.learning:{};
  return cleanCount(raw.gems)>0||cleanCount(raw.xp)>0||cleanCount(raw.daily?.solved)>0||cleanCount(learning.solvedTotal)>0||Object.keys(learning.skillHistory||{}).length>0||Object.keys(raw.skillStats||{}).length>0||Object.keys(raw.worldRuns||{}).some(key=>cleanCount(raw.worldRuns[key])>0)||(Array.isArray(raw.collection)&&raw.collection.length>0);
}

function cleanEvidence(source){
  if(!source||typeof source!=='object'||Array.isArray(source))return {};
  const result={};
  for(const [key,value] of Object.entries(source))if(typeof key==='string'&&value&&typeof value==='object')result[key]={
    independentRetrievals:cleanCount(value.independentRetrievals),independentTransfers:cleanCount(value.independentTransfers),
    lastEvidenceDay:typeof value.lastEvidenceDay==='string'?value.lastEvidenceDay:null
  };
  return result;
}

export function normalizeState(raw,day=localDayKey()){
  const state=normalizeV09State(raw,day),source=raw?.learning?.product;
  const onboardingComplete=typeof source?.onboardingComplete==='boolean'?source.onboardingComplete:hasPriorLearning(raw);
  state.learning.product={...emptyProduct(),onboardingComplete,dailyRewardDay:typeof source?.dailyRewardDay==='string'?source.dailyRewardDay:null,capabilityEvidence:cleanEvidence(source?.capabilityEvidence)};
  return state;
}

function ensureProduct(s){
  if(!s.learning||typeof s.learning!=='object')s.learning={};
  if(!s.learning.product||typeof s.learning.product!=='object')s.learning.product=emptyProduct();
  if(!s.learning.product.capabilityEvidence||typeof s.learning.product.capabilityEvidence!=='object')s.learning.product.capabilityEvidence={};
  return s.learning.product;
}

export function onboardingStatus(s){return {complete:Boolean(s?.learning?.product?.onboardingComplete),stepCount:ONBOARDING_STEPS.length}}
export function completeOnboarding(s){ensureProduct(s).onboardingComplete=true;return onboardingStatus(s)}
export function resetOnboarding(s){ensureProduct(s).onboardingComplete=false;return onboardingStatus(s)}

export function recordCapabilityEvidence(s,event,{day=localDayKey()}={}){
  if(!event?.completed||!event?.firstTry||typeof event.skillKey!=='string')return null;
  const retrieval=Boolean(event.isMemoryReview||event.isReview||event.purpose==='retrieval'),transfer=event.purpose==='transfer';
  if(!retrieval&&!transfer)return null;
  const product=ensureProduct(s),current=product.capabilityEvidence[event.skillKey]||{independentRetrievals:0,independentTransfers:0,lastEvidenceDay:null};
  const next={independentRetrievals:cleanCount(current.independentRetrievals)+(retrieval?1:0),independentTransfers:cleanCount(current.independentTransfers)+(transfer?1:0),lastEvidenceDay:day};
  product.capabilityEvidence[event.skillKey]=next;return clone(next);
}

function historyFor(s,key){return s?.learning?.skillHistory?.[key]||{} }
function evidenceFor(s,key){return s?.learning?.product?.capabilityEvidence?.[key]||{} }

export function capabilityState(s,key){
  const h=historyFor(s,key),e=evidenceFor(s,key),attempts=cleanCount(h.attempts),first=cleanCount(h.firstTryCorrect),revisits=Math.max(cleanCount(h.successfulRevisits),cleanCount(e.independentRetrievals)),transfers=cleanCount(e.independentTransfers),explored=attempts>0||Number(h.recentMisses)>0||typeof h.lastPracticedDay==='string';
  let state=CAPABILITY_STATES.UNEXPLORED;
  if(explored)state=CAPABILITY_STATES.EXPLORED;
  if(first>0)state=CAPABILITY_STATES.GROWING;
  if(revisits>0)state=CAPABILITY_STATES.REMEMBERED;
  if(revisits>=2||transfers>=2||(revisits>=1&&transfers>=1)||(attempts>=5&&first>=4&&(revisits+transfers)>=1))state=CAPABILITY_STATES.STRONG;
  return {...state,attempts,independentSuccesses:first,successfulRevisits:revisits,successfulTransfers:transfers};
}

export function capabilityMapSnapshot(s,keys=Object.keys(s?.learning?.skillHistory||{})){
  return [...new Set((keys||[]).filter(key=>typeof key==='string'))].map(key=>({skillKey:key,...capabilityState(s,key)}));
}

export function homeMissionSummary(s,{day=localDayKey(),excludeSkillKeys=[]}={}){
  const dueCount=dueMemoryReviews(s,{day,limit:Number.MAX_SAFE_INTEGER,excludeSkillKeys}).length,boundedMemory=Math.min(2,dueCount);
  return {questionCount:10,approxMinutes:'10～15 分鐘',dueCount,boundedMemory,theme:boundedMemory?`先找回 ${boundedMemory} 個以前的力量，再換個故事試試看`:'找回、轉換，再試一個剛剛好的新挑戰'};
}

function rankedKeys(s){
  const history=s?.learning?.skillHistory||{},keys=[...new Set([...Object.keys(history),...Object.keys(s?.learning?.product?.capabilityEvidence||{})])];
  return keys.sort((a,b)=>String(history[b]?.lastPracticedDay||'').localeCompare(String(history[a]?.lastPracticedDay||''))||cleanCount(history[b]?.attempts)-cleanCount(history[a]?.attempts)||a.localeCompare(b));
}

export function parentLearningSummary(s){
  const keys=rankedKeys(s),recentlyPracticed=keys.filter(key=>cleanCount(historyFor(s,key).attempts)>0).slice(0,4);
  const stableRetrieval=keys.filter(key=>cleanCount(historyFor(s,key).successfulRevisits)>0||cleanCount(evidenceFor(s,key).independentRetrievals)>0).slice(0,4);
  const stillBuilding=keys.filter(key=>['explored','growing'].includes(capabilityState(s,key).id)).slice(0,4);
  const recentTransfer=keys.filter(key=>cleanCount(evidenceFor(s,key).independentTransfers)>0).slice(0,4);
  const supportSuggestion=stillBuilding.length?'可以請孩子挑一個正在長大的能力，說說他先看見了哪些數量。':'可以請孩子選一個發光的能力，換個生活故事說說他怎麼想。';
  return {recentlyPracticed,stableRetrieval,stillBuilding,recentTransfer,supportSuggestion,localOnly:true};
}

export function buildJourneyRecap(events,options={}){
  const recap=buildV09JourneyRecap(events,options);return {...recap,lines:recap.lines.map(line=>line.replace(/([^\s])變得更穩了$/u,'$1 變得更穩了'))};
}

export function cosmeticRewardEligible(s,{day=localDayKey(),questionCount=10}={}){
  return Math.max(0,Math.trunc(Number(questionCount)||0))>=10&&ensureProduct(s).dailyRewardDay!==day;
}

export function finishDailyProductRun(s,{kind='special',worldIndex=0,boss=false,maxCombo=0,questionCount=10,mode='journey',day=localDayKey()}={}){
  const eligible=cosmeticRewardEligible(s,{day,questionCount}),before={gems:Number(s.gems)||0,xp:Number(s.xp)||0,collection:Array.isArray(s.collection)?[...s.collection]:[],claimed:{...(s.daily?.claimed||{})}};
  const out=kind==='world'?finishRun(s,worldIndex,{boss,maxCombo,questionCount}):finishSpecialRun(s,{mode,maxCombo,questionCount});
  if(eligible){ensureProduct(s).dailyRewardDay=day;return {...out,cosmeticAwarded:true}}
  s.gems=before.gems;s.xp=before.xp;s.collection=before.collection;if(s.daily)s.daily.claimed=before.claimed;
  return {...out,collectible:null,dailyBonus:0,cosmeticAwarded:false};
}

export function productSafetySnapshot(s){
  const product=ensureProduct(s);return {stateNamespace:'nq-state-v05',onboardingComplete:Boolean(product.onboardingComplete),dailyRewardDay:product.dailyRewardDay||null,localOnly:true,requiresAccount:false,requiresNetwork:false,capabilityEvidence:clone(product.capabilityEvidence)};
}
