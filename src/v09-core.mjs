import {
  normalizeState as normalizeV08State,localDayKey,mixedSkillKeys,storySkillKeys,
  makeQuestionForSkill,makeDivisionQuestion,makeStoryQuestion,makeMemoryReviewQuestion,makeReviewQuestion,
  dueMemoryReviews,questionFingerprint,learningSkill,skillMastery,challengeWeights,
  visualHintModel,visualHintRevealsAnswer
} from './v08-core.mjs';

export * from './v08-core.mjs';

export const JOURNEY_PURPOSES=Object.freeze(['retrieval','repair','transfer','confidence','growth']);
export const JOURNEY_PURPOSE_COPY=Object.freeze({
  retrieval:'🧠 找回一個以前會的力量',repair:'🧩 再整理一個快要懂的能力',
  transfer:'🔄 換個故事也會嗎？',confidence:'✨ 這題你已經很熟了',growth:'🌱 試試下一個小挑戰'
});

const clone=value=>value===undefined?undefined:JSON.parse(JSON.stringify(value));
const clampRoll=rng=>Math.min(.999999999,Math.max(0,Number(rng())||0));
const unique=items=>[...new Set(items.filter(Boolean))];
const representation=q=>q?.story?'story':'symbolic';
const emptyJourney=()=>({recentPurposes:[],recentRepresentations:[]});

export function normalizeState(raw,day=localDayKey()){
  const state=normalizeV08State(raw,day),source=raw?.learning?.journey;
  const recentPurposes=Array.isArray(source?.recentPurposes)?source.recentPurposes.filter(value=>JOURNEY_PURPOSES.includes(value)).slice(-10):[];
  const recentRepresentations=Array.isArray(source?.recentRepresentations)?source.recentRepresentations.filter(item=>item&&typeof item.skillKey==='string'&&['story','symbolic'].includes(item.representation)).slice(-12).map(item=>({skillKey:item.skillKey,representation:item.representation})):[];
  state.learning.journey={...emptyJourney(),recentPurposes,recentRepresentations};
  return state;
}

function historyFor(s,key){return s?.learning?.skillHistory?.[key]||{} }
function previousRepresentation(s,key){
  const recent=s?.learning?.journey?.recentRepresentations||[];
  for(let index=recent.length-1;index>=0;index--)if(recent[index]?.skillKey===key)return recent[index].representation;
  const scheduled=s?.learning?.memorySchedule?.[key]?.question;
  return scheduled?representation(scheduled):null;
}
function weightedSkillPick(s,skills,{rng,lastSkills=[],preferNew=true}={}){
  let pool=unique(skills);if(!pool.length)return null;
  const allowed=pool.filter(key=>!(lastSkills.length>=2&&lastSkills.at(-1)===key&&lastSkills.at(-2)===key));if(allowed.length)pool=allowed;
  if(preferNew){const unseen=pool.filter(key=>!lastSkills.includes(key));if(unseen.length)pool=unseen}
  const weights=challengeWeights(s,pool,{recentSkills:lastSkills.slice(-4)}),total=pool.reduce((sum,key)=>sum+weights[key],0);
  let roll=clampRoll(rng)*total;
  for(const key of pool){roll-=weights[key];if(roll<0)return key}
  return pool.at(-1);
}
function purposePools(s,{day}){
  const eligible=mixedSkillKeys(s,{challengeLevel:3}),stories=new Set(storySkillKeys(s,{challengeLevel:3}));
  const practiced=eligible.filter(key=>Number(historyFor(s,key).attempts)>0);
  const retrieval=practiced.filter(key=>{
    const h=historyFor(s,key);return Boolean(h.lastPracticedDay&&h.lastPracticedDay<day)||Number(h.successfulRevisits)>0;
  });
  const repair=eligible.filter(key=>Number(historyFor(s,key).recentMisses)>0||Number(historyFor(s,key).pendingRevisits)>0);
  const transfer=practiced.filter(key=>stories.has(key));
  const confidence=practiced.filter(key=>{const h=historyFor(s,key),accuracy=Number(h.attempts)?Number(h.firstTryCorrect)/Number(h.attempts):0;return h.attempts>=2&&accuracy>=.6&&Number(h.recentMisses||0)<=1});
  const growth=eligible.filter(key=>!skillMastery(s,key).mastered);
  return {eligible,retrieval,repair,transfer,confidence,growth:growth.length?growth:eligible};
}
function dueSessionItems(s){return (s?.learning?.pendingReviews||[]).filter(item=>Number(item?.dueSolved)<=Number(s?.learning?.solvedTotal)).map(item=>makeReviewQuestion(item.q,()=>.5));}
function missionPurposeSequence(count){
  const base=['retrieval','confidence','growth','transfer','repair','growth','confidence','transfer','retrieval','growth'];
  return Array.from({length:count},(_,index)=>base[index%base.length]);
}
function fallbackOrder(desired){
  const orders={retrieval:['retrieval','repair','transfer','growth','confidence'],repair:['repair','retrieval','growth','confidence','transfer'],transfer:['transfer','growth','retrieval','confidence','repair'],confidence:['confidence','growth','retrieval','transfer','repair'],growth:['growth','transfer','confidence','retrieval','repair']};
  return orders[desired];
}
function makePurposeQuestion(purpose,key,s,context){
  const {rng,recentTemplateIds,recentThemeIds}=context;
  if(purpose==='transfer'){
    const from=previousRepresentation(s,key)||'symbolic',target=from==='story'?'symbolic':'story';
    const q=target==='story'?makeStoryQuestion(s,{skillKey:key,challengeLevel:3,rng,recentTemplateIds,recentThemeIds}):key.startsWith('div:')?makeDivisionQuestion(s,{family:Number(key.split(':')[1]),variant:0,rng}):makeQuestionForSkill(key,s,{challengeLevel:3,rng});
    return {...q,journeyPurpose:purpose,journeyRepresentation:target,transferFrom:from};
  }
  const q=makeQuestionForSkill(key,s,{challengeLevel:purpose==='confidence'?1:3,rng});
  return {...q,journeyPurpose:purpose,journeyRepresentation:representation(q)};
}
function decorateSpecial(q,purpose){return {...clone(q),journeyPurpose:purpose,journeyRepresentation:representation(q)} }

export function planTodaysAdventure(raw,{count=10,day=localDayKey(),rng=Math.random,memoryLimit=2}={}){
  const s=normalizeState(clone(raw),day),pools=purposePools(s,{day}),plan=[],fingerprints=new Set(),lastSkills=[],recentTemplateIds=[],recentThemeIds=[];
  const memory=dueMemoryReviews(s,{day,limit:Math.min(2,Math.max(0,memoryLimit)),rng}).map(entry=>decorateSpecial(makeMemoryReviewQuestion(entry,rng),'retrieval'));
  const session=dueSessionItems(s).map(q=>decorateSpecial(q,'repair'));
  const specials={retrieval:memory,repair:session};
  const availability=purpose=>Boolean(specials[purpose]?.length||pools[purpose]?.length);
  const addQuestion=(question,purpose)=>{
    if(!question)return false;const fingerprint=questionFingerprint(question);if(fingerprints.has(fingerprint))return false;
    if(plan.length&&questionFingerprint(plan.at(-1))===fingerprint)return false;
    const item={...question,journeyPurpose:purpose,journeyRepresentation:question.journeyRepresentation||representation(question)};
    plan.push(item);fingerprints.add(fingerprint);lastSkills.push(item.skillKey);
    if(item.storyTemplateId){recentTemplateIds.push(item.storyTemplateId);if(recentTemplateIds.length>5)recentTemplateIds.shift()}
    if(item.storyThemeId){recentThemeIds.push(item.storyThemeId);if(recentThemeIds.length>3)recentThemeIds.shift()}
    return true;
  };
  for(const desired of missionPurposeSequence(Math.max(1,Math.trunc(Number(count)||10)))){
    let added=false;
    for(const purpose of fallbackOrder(desired)){
      if(!availability(purpose))continue;
      while(specials[purpose]?.length&&!added){
        const safeIndex=specials[purpose].findIndex(item=>!(lastSkills.length>=2&&lastSkills.at(-1)===item.skillKey&&lastSkills.at(-2)===item.skillKey));
        if(safeIndex<0)break;const [item]=specials[purpose].splice(safeIndex,1);if(addQuestion(item,purpose))added=true;
      }
      for(let attempt=0;attempt<24&&!added;attempt++){
        const preferNew=new Set(lastSkills).size<4,key=weightedSkillPick(s,pools[purpose]||[],{rng,lastSkills,preferNew});if(!key)break;
        try{added=addQuestion(makePurposeQuestion(purpose,key,s,{rng,recentTemplateIds,recentThemeIds}),purpose)}catch{added=false}
      }
      if(added)break;
    }
    if(!added)break;
  }
  return plan;
}

export function journeyPlanSummary(plan){
  const purposes=Object.fromEntries(JOURNEY_PURPOSES.map(purpose=>[purpose,(plan||[]).filter(item=>item?.journeyPurpose===purpose).length]));
  let maxSkillStreak=0,maxFrictionStreak=0,skillStreak=0,frictionStreak=0,lastSkill=null;
  for(const item of plan||[]){skillStreak=item.skillKey===lastSkill?skillStreak+1:1;lastSkill=item.skillKey;maxSkillStreak=Math.max(maxSkillStreak,skillStreak);frictionStreak=item.journeyPurpose==='repair'?frictionStreak+1:0;maxFrictionStreak=Math.max(maxFrictionStreak,frictionStreak)}
  return {count:(plan||[]).length,purposes,distinctSkills:new Set((plan||[]).map(item=>item.skillKey)).size,memoryCount:(plan||[]).filter(item=>item.isMemoryReview).length,duplicateConsecutive:(plan||[]).some((item,index)=>index>0&&questionFingerprint(item)===questionFingerprint(plan[index-1])),maxSkillStreak,maxFrictionStreak};
}

export function helpChoicesForQuestion(q){
  const text=answerSafeTextHint(q),model=answerSafeVisualHintModel(q,{level:1}),visualSafe=!visualHintRevealsAnswer(model,q)&&model?.kind!=='strategy-card';
  return {text:{id:'text',label:'💬 給我一句線索',text},visual:visualSafe?{id:'visual',label:'👀 看圖想一想',model}:null};
}
export function answerSafeTextHint(q){
  const hint=String(q?.hint||'先找出已知的數量，再想想問號代表什麼。');
  return /答案是|正確答案|final answer|solution/i.test(hint)?'先找出已知的數量，再想想問號代表什麼。':hint;
}
export function answerSafeVisualHintModel(q,{level=1}={}){
  if(q?.op==='div'&&!q?.storyRelationshipId&&q?.variant!=='missing-divisor')return {kind:'unknown-equal-groups',strength:level>=2?2:1,knownTotal:Number(q.dividend)||0,groupCount:Number(q.divisor)||0,groupSize:'?',sampleItems:[],poolCount:level>=2?Number(q.dividend)||0:0,copy:`平均分成 ${q.divisor} 組，每組的數量先留成問號。`};
  return visualHintModel(q,{level});
}
export function strongerHintIsAnswerSafe(q){return !visualHintRevealsAnswer(answerSafeVisualHintModel(q,{level:2}),q)}

export function rememberJourneyEvent(s,event){
  if(!s.learning)s.learning={};if(!s.learning.journey)s.learning.journey=emptyJourney();
  const purpose=JOURNEY_PURPOSES.includes(event?.purpose)?event.purpose:'growth',rep=event?.representation==='story'?'story':'symbolic';
  s.learning.journey.recentPurposes=[...(s.learning.journey.recentPurposes||[]),purpose].slice(-10);
  s.learning.journey.recentRepresentations=[...(s.learning.journey.recentRepresentations||[]),{skillKey:event.skillKey,representation:rep}].slice(-12);
  return s.learning.journey;
}

export function buildJourneyRecap(events,{skillLabel=key=>key}={}){
  const completed=(events||[]).filter(event=>event?.completed);
  const independentlyRetrieved=completed.filter(event=>event.isMemoryReview&&event.firstTry).length;
  const independentTransfers=completed.filter(event=>event.purpose==='transfer'&&event.firstTry).length;
  const recoveries=completed.filter(event=>event.recovered).length;
  const successBySkill=new Map();for(const event of completed)successBySkill.set(event.skillKey,(successBySkill.get(event.skillKey)||0)+1);
  const secureSkillKey=[...successBySkill].sort((a,b)=>b[1]-a[1])[0]?.[0]||null,lines=[];
  if(independentlyRetrieved)lines.push(`🧠 今天自己想起來 ${independentlyRetrieved} 個以前學過的力量`);
  if(independentTransfers)lines.push(`🔄 ${independentTransfers} 次換個故事還是會`);
  if(recoveries)lines.push(`🧩 ${recoveries} 次卡住後自己找回來`);
  if(secureSkillKey)lines.push(`✨ ${skillLabel(secureSkillKey)}變得更穩了`);
  return {completed:completed.length,independentlyRetrieved,independentTransfers,recoveries,secureSkillKey,lines};
}
