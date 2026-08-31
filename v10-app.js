import {
  WORLDS,CHALLENGE_LENGTHS,COLLECTIBLES,NUMBER_SENSE_SKILLS,MULTIPLICATION_SKILLS,DIVISION_SKILLS,
  JOURNEY_PURPOSE_COPY,localDayKey,normalizeState,dailyQuests,bossReady,makeQuestion,makeMixedQuestion,makeFocusQuestion,
  makeDivisionQuestion,makeStoryQuestion,storyDiversitySummary,answerSafeVisualHintModel,visualHintKnownTotalLabel,
  helpChoicesForQuestion,answerSafeTextHint,takeDueReview,queueSpacedReview,completeSpacedReview,questionFingerprint,
  recordSkillMiss,recordSkillSuccess,skillMastery,challengeWeights,mixedSkillKeys,divisionUnlocked,
  beginLearningSession,finishDailyProductRun,memoryChestStatus,dueMemoryReviews,
  makeMemoryReviewQuestion,recordMemoryPractice,recordMemoryMiss,completeMemoryRetrieval,
  planTodaysAdventure,journeyPlanSummary,takeNextJourneyQuestion,rememberJourneyEvent,buildJourneyRecap,
  ONBOARDING_STEPS,onboardingStatus,completeOnboarding,resetOnboarding,homeMissionSummary,
  capabilityState,parentLearningSummary,recordCapabilityEvidence
} from './src/v10-core.mjs?v=10-10';
import {
  LANTERN_CORE_SKILLS,LANTERN_ALL_SKILLS,isLanternSkill,planLanternRun,lanternMissionModel,evaluateLanternAction,
  lanternHint,lanternCountDialStart,freshLanternRetry,reconcileLanternRunQueue,lanternRunCompletion,lanternCapabilitySnapshot,lanternEligibility
} from './src/grade-2a-lantern-core.mjs?v=10-10';
import {
  appendGrade2ALedgerRecord,evaluateLanternLedgerSkill,grade2AEvidenceLedgerSnapshot,lanternLedgerInput,stableQuestionSourceId
} from './src/grade-2a-evidence-ledger.mjs?v=10-10';

const STATE_KEY='nq-state-v05',LEGACY_KEY='nq-state-v04';
const $=id=>document.getElementById(id);
const QA_MODE=new URLSearchParams(location.search).get('qa')==='v10';
const loadedState=load();let S=normalizeState(loadedState,localDayKey());
let wi=0,q=null,correct=0,attempted=false,missRecorded=false,missCount=0,combo=0,maxCombo=0,boss=false,bossHP=0,totalNeeded=10,locked=false;
let runMode='world',challengeLevel=2,comboRewards=new Set(),introContinuation=null,activeUtterance=null,memoryQueue=[];
let storyRecentTemplates=[],storyRecentThemes=[],storyRunLog=[],journeyQueue=[],journeyPlanSnapshot=[],journeyEvents=[];
let onboardingIndex=0;
let lanternQueue=[],lanternPlanSnapshot=[],lanternEvents=[],lanternQuestion=null,lanternIndex=0,lanternAttempted=false,lanternHintUsed=false,lanternSessionId=null,lanternSelection={value:101,hundreds:0,tens:0,ones:0};
const LANTERN_NUMBER_RANGE=new URLSearchParams(location.search).get('lanternRange')==='300'?300:200;

function load(){try{const current=localStorage.getItem(STATE_KEY);if(current)return JSON.parse(current);const legacy=localStorage.getItem(LEGACY_KEY);return legacy?JSON.parse(legacy):null}catch{return null}}
function save(){localStorage.setItem(STATE_KEY,JSON.stringify(S));hud()}
function hud(){
  $('gems').textContent=S.gems;$('gameGems').textContent=S.gems;$('level').textContent=Math.floor(S.xp/100)+1;$('collectionCount').textContent=S.collection.length;
  const keys=[...MULTIPLICATION_SKILLS,...DIVISION_SKILLS,'add:20','sub:20','add:50','sub:50','add:100','sub:100',...NUMBER_SENSE_SKILLS];$('powerCount').textContent=keys.filter(key=>capabilityState(S,key).rank>=2).length;
}
function renderDaily(){$('daily').innerHTML='';dailyQuests(S).forEach(x=>{const done=x.now>=x.target,el=document.createElement('div');el.className='quest'+(done?' done':'');const pct=Math.min(100,x.now/x.target*100);el.innerHTML=`<div class="qtop">${x.icon} ${x.label}</div><small>${Math.min(x.now,x.target)} / ${x.target} · 今天的足跡</small><div class="mini"><i style="width:${pct}%"></i></div>`;$('daily').append(el)})}
function renderLengths(){
  $('lengths').innerHTML='';CHALLENGE_LENGTHS.forEach(x=>{const b=document.createElement('button');b.className='length'+(S.selectedLength===x.count?' active':'');b.innerHTML=`<b>${x.icon} ${x.label}</b><small>${x.count===5?'輕鬆暖身':x.count===10?'剛剛好的冒險':'我還要更多！'}</small>`;b.onclick=()=>{S.selectedLength=x.count;save();renderLengths()};$('lengths').append(b)});
  $('storyStatus').textContent=`${S.selectedLength} 題 · 看故事、找關係、用圖想一想`;
}
function renderWorlds(){$('worlds').innerHTML='';WORLDS.forEach((w,i)=>{const b=document.createElement('button');b.className='world';b.disabled=i>=S.unlocked;const ready=i<S.unlocked&&bossReady(S,i);b.innerHTML=`<b>${w.icon} ${w.name}</b><span>${i<S.unlocked?w.desc:'🔒 繼續闖關解鎖'}</span><div class="stars">${'★'.repeat(S.best[i]||0)}${'☆'.repeat(5-(S.best[i]||0))}</div>${ready?'<span class="boss-tag">👾 Boss 出現！</span>':''}`;b.onclick=()=>startWorld(i,ready);$('worlds').append(b)})}
function renderBridge(){const open=divisionUnlocked(S),b=$('divisionBtn');b.disabled=!open;b.classList.toggle('locked-bridge',!open);$('divisionStatus').textContent=open?'用熟悉的乘法跨過新橋':'先完成 5 題乘法，橋就會亮起來'}
function renderMemory(){const status=memoryChestStatus(S,{day:localDayKey(),excludeSkillKeys:LANTERN_ALL_SKILLS}),button=$('memoryBtn');button.disabled=!status.ready;button.hidden=!status.ready;button.classList.toggle('ready',status.ready);$('memoryStatus').textContent=status.label}
function renderMission(){const summary=homeMissionSummary(S,{day:localDayKey(),excludeSkillKeys:LANTERN_ALL_SKILLS});$('missionLength').textContent=`大約 ${summary.approxMinutes} · ${summary.questionCount} 個小挑戰`;$('journeyMemory').textContent=summary.theme;$('missionNote').textContent=summary.dueCount>summary.boundedMemory?`🧠 今天的冒險會帶走 ${summary.boundedMemory} 個記憶力量，另外 ${summary.dueCount-summary.boundedMemory} 個仍會在記憶寶箱等你。`:'🌱 卡住可以選幫助；完成今天這一趟就很夠了。'}
function renderHome(){cancelSpeech();S=normalizeState(S,localDayKey());save();renderDaily();renderLengths();renderBridge();renderMemory();renderMission();renderWorlds();$('home').style.display='block';$('game').style.display='none';$('lanternWorld').style.display='none'}
function levelForLength(n){return n>=20?3:n>=10?2:1}
function updateQaOutput(){if(!QA_MODE)return;const output=$('v10Debug');if(output)output.textContent=JSON.stringify({currentQuestion:q?JSON.parse(JSON.stringify(q)):null,journeyPlan:journeyPlanSnapshot,journeySummary:journeyPlanSummary(journeyPlanSnapshot),journeyEvents,onboarding:onboardingStatus(S),parent:parentLearningSummary(S),storyRun:storyRunLog.map(item=>({...item})),diversity:storyDiversitySummary(storyRunLog.map(item=>({story:true,storyTemplateId:item.templateId,storyThemeId:item.themeId,txt:item.text}))),pageErrors:[...(window.__NQ_PAGE_ERRORS__||[])]})}
function resetRun(){correct=0;combo=0;maxCombo=0;locked=false;attempted=false;missRecorded=false;missCount=0;memoryQueue=[];storyRecentTemplates=[];storyRecentThemes=[];storyRunLog=[];journeyQueue=[];journeyPlanSnapshot=[];journeyEvents=[];comboRewards=new Set();cancelSpeech();clearVisualHint();clearHelpChoices();updateQaOutput();beginLearningSession(S);save()}
function showGame(){$('home').style.display='none';$('game').style.display='block';$('bossPanel').style.display=boss?'block':'none';updateBars();next()}
function startJourney(){resetRun();boss=false;runMode='journey';challengeLevel=3;journeyQueue=planTodaysAdventure(S,{count:10,day:localDayKey(),excludeSkillKeys:LANTERN_ALL_SKILLS});journeyPlanSnapshot=journeyQueue.map(item=>JSON.parse(JSON.stringify(item)));totalNeeded=journeyQueue.length;$('worldTitle').textContent='🧭 今日冒險';$('mode').textContent=`🧭 ${totalNeeded} 題能力旅程`;showGame()}
function startWorld(i,isBoss){resetRun();wi=i;boss=isBoss;runMode='world';challengeLevel=levelForLength(S.selectedLength);totalNeeded=boss?Math.min(12,S.selectedLength+2):S.selectedLength;bossHP=boss?totalNeeded:0;$('worldTitle').textContent=`${WORLDS[i].icon} ${WORLDS[i].name}`;$('mode').textContent=boss?'⚔️ BOSS 戰':`🚀 ${totalNeeded} 題遠征`;showGame()}
function startStory(){resetRun();boss=false;runMode='story';challengeLevel=levelForLength(S.selectedLength);totalNeeded=S.selectedLength;$('worldTitle').textContent='📖 故事任務';$('mode').textContent=`📖 ${totalNeeded} 題故事冒險`;showGame()}
function startFocus(){resetRun();boss=false;runMode='focus';challengeLevel=3;totalNeeded=10;$('worldTitle').textContent='🎯 下一個能力冒險';$('mode').textContent='🎯 10 題能力練習';showGame()}
function startAcademy(){resetRun();boss=false;runMode='academy';challengeLevel=3;totalNeeded=20;$('worldTitle').textContent='🏆 數字大師遠征';$('mode').textContent='🏆 20 題混合挑戰';showGame()}
function startDivision(){if(!divisionUnlocked(S))return;resetRun();boss=false;runMode='division';challengeLevel=2;totalNeeded=10;$('worldTitle').textContent='🌉 除法橋';$('mode').textContent='🌉 10 題橋梁探險';showGame()}
function startMemory(){const due=dueMemoryReviews(S,{day:localDayKey(),excludeSkillKeys:LANTERN_ALL_SKILLS});if(!due.length)return;resetRun();boss=false;runMode='memory';challengeLevel=2;memoryQueue=due.map(entry=>makeMemoryReviewQuestion(entry));totalNeeded=memoryQueue.length;$('worldTitle').textContent='🧠 記憶寶箱';$('mode').textContent=`🧠 ${totalNeeded} 題力量回憶`;showGame()}

function nextJourneyQuestion(){
  return takeNextJourneyQuestion(S,journeyQueue,{excludeSkillKeys:LANTERN_ALL_SKILLS});
}
function next(){
  cancelSpeech();clearVisualHint();clearHelpChoices();attempted=false;missRecorded=false;missCount=0;locked=false;
  q=runMode==='memory'?memoryQueue[correct]:runMode==='journey'?nextJourneyQuestion():takeDueReview(S,Math.random,{excludeSkillKeys:LANTERN_ALL_SKILLS});
  if(!q){if(runMode==='academy')q=makeMixedQuestion(S,{challengeLevel});else if(runMode==='focus')q=makeFocusQuestion(S,{challengeLevel});else if(runMode==='division')q=makeDivisionQuestion(S);else if(runMode==='story')q=makeStoryQuestion(S,{challengeLevel,recentTemplateIds:storyRecentTemplates,recentThemeIds:storyRecentThemes});else if(runMode==='world')q=makeQuestion(wi,S,{challengeLevel})}
  if(!q){finish();return}
  if((runMode==='story'||runMode==='journey')&&q.story){storyRunLog.push({templateId:q.storyTemplateId||null,themeId:q.storyThemeId||null,relationshipId:q.storyRelationshipId||null,skillKey:q.skillKey,text:q.txt});if(q.storyTemplateId){storyRecentTemplates.push(q.storyTemplateId);storyRecentTemplates=storyRecentTemplates.slice(-5)}if(q.storyThemeId){storyRecentThemes.push(q.storyThemeId);storyRecentThemes=storyRecentThemes.slice(-3)}}
  updateQaOutput();save();if(q.op==='div'&&!S.learning.divisionIntroSeen){showDivisionIntro(()=>{S.learning.divisionIntroSeen=true;save();renderQuestion()});return}renderQuestion();
}
function renderQuestion(){
  $('question').textContent=q.txt;$('question').classList.toggle('word-question',Boolean(q.story)||q.variant==='compare'||q.variant==='decompose');$('readBtn').classList.toggle('visible',Boolean(q.story));$('readBtn').disabled=false;$('readBtn').classList.remove('speaking');
  const purpose=runMode==='journey'?JOURNEY_PURPOSE_COPY[q.journeyPurpose]:'';$('purposeBanner').textContent=purpose||'';$('purposeBanner').classList.toggle('visible',Boolean(purpose));
  $('msg').textContent=q.isMemoryReview?'🧠 以前學過的力量回來了！':q.isReview?'🧠 這個能力回來了！試試看還記得嗎？':boss?'攻擊 Boss！':q.story?'先找出故事裡的數量關係！':'選一個答案！';$('answers').innerHTML='';q.opts.forEach(n=>{const b=document.createElement('button');b.className='ans'+(typeof n==='string'?' expression':'');b.textContent=n;b.onclick=()=>answer(n,b);$('answers').append(b)})
}
function showDivisionIntro(continuation){introContinuation=continuation;$('divisionIntro').style.display='flex'}
function closeDivisionIntro(){$('divisionIntro').style.display='none';const continuation=introContinuation;introContinuation=null;if(continuation)continuation()}

function cancelSpeech(){if(window.speechSynthesis&&typeof window.speechSynthesis.cancel==='function')window.speechSynthesis.cancel();activeUtterance=null;const button=$('readBtn');if(button){button.disabled=false;button.classList.remove('speaking');button.textContent='🔊 朗讀題目'}}
function readQuestion(){if(!q?.story)return;if(!window.speechSynthesis||typeof window.speechSynthesis.cancel!=='function'||typeof window.speechSynthesis.speak!=='function'||typeof window.SpeechSynthesisUtterance!=='function'){$('msg').textContent='🔈 這台裝置暫時不能朗讀，自己慢慢讀也很厲害！';return}try{window.speechSynthesis.cancel();const utterance=new window.SpeechSynthesisUtterance(q.txt),voices=window.speechSynthesis.getVoices?.()||[];utterance.lang='zh-TW';utterance.rate=.86;utterance.pitch=1.05;utterance.voice=voices.find(voice=>/^zh-(TW|Hant)/i.test(voice.lang))||voices.find(voice=>/^zh/i.test(voice.lang))||null;activeUtterance=utterance;$('readBtn').classList.add('speaking');$('readBtn').textContent='🔊 正在朗讀';const done=()=>{if(activeUtterance===utterance){activeUtterance=null;$('readBtn').classList.remove('speaking');$('readBtn').textContent='🔊 再讀一次'}};utterance.onend=done;utterance.onerror=done;window.speechSynthesis.speak(utterance)}catch{$('msg').textContent='🔈 這台裝置暫時不能朗讀，自己慢慢讀也很厲害！';cancelSpeech()}}

function el(tag,className,text){const node=document.createElement(tag);if(className)node.className=className;if(text!==undefined)node.textContent=text;return node}
function clearVisualHint(){const root=$('visualHint');if(!root)return;root.className='visual-hint';root.innerHTML=''}
function clearHelpChoices(){const root=$('helpChoices');if(root){root.className='help-choices';root.innerHTML=''}}
function showHelpChoices(){
  const choices=helpChoicesForQuestion(q),root=$('helpChoices');root.innerHTML='';root.className='help-choices visible';
  if(choices.visual){const visual=el('button','help-choice',choices.visual.label);visual.onclick=()=>{renderVisualHint(1);visual.disabled=true;$('msg').textContent='👀 圖把關係排好了，答案還是由你找！'};root.append(visual)}
  const text=el('button','help-choice',choices.text.label);text.onclick=()=>{text.disabled=true;$('msg').textContent=choices.text.text};root.append(text);
}
function renderVisualHint(level){
  const model=answerSafeVisualHintModel(q,{level}),root=$('visualHint');root.innerHTML='';root.className=`visual-hint visible${level>=2?' strong':''}`;root.append(el('div','visual-title',level>=2?'🧩 再整理清楚一點':'👀 先看一個小線索'),el('div','visual-copy',model.copy));
  if(model.kind==='number-journey'){const row=el('div','journey');row.append(el('span','point',String(model.start)));model.steps.forEach(step=>row.append(el('span','jump',typeof step==='number'?`${step>0?'+':'−'}${Math.abs(step)}`:'?')));row.append(el('span',model.end==='?'?'point unknown':'point',String(model.end)));root.append(row)}
  else if(model.kind==='equal-groups'||model.kind==='equal-sharing'){const grid=el('div','group-grid');model.groups.forEach(group=>{const box=el('div','visual-group');group.forEach(()=>box.append(el('i','visual-dot')));grid.append(box)});root.append(grid)}
  else if(model.kind==='unknown-equal-groups'){const equation=el('div','group-equation');if(model.groupCount==='?'){const sample=el('div','visual-group');model.sampleItems.forEach(()=>sample.append(el('i','visual-dot')));equation.append(sample,el('span','unknown-multiplier','× ? 組'))}else{const grid=el('div','group-grid');for(let i=0;i<model.groupCount;i++)grid.append(el('div','visual-group unknown-size','?'));equation.append(grid)}root.append(equation,el('div','known-total',visualHintKnownTotalLabel(model)));if(model.poolCount){const pool=el('div','pool-dots');for(let i=0;i<model.poolCount;i++)pool.append(el('i','visual-dot'));root.append(pool)}}
  else if(model.kind==='ten-frame'){const grid=el('div','ten-frame');model.cells.forEach(state=>grid.append(el('i',`ten-cell ${state}`)));root.append(grid)}
  else if(model.kind==='hundred-tens'){const grid=el('div','tens-rods');model.rods.forEach(state=>grid.append(el('i',`ten-rod ${state}`)));root.append(grid)}
  else if(model.kind==='target-estimate'){root.append(el('div','visual-copy',`🎯 目標在 ${model.target}`));const list=el('div','estimate-list');model.choices.forEach(choice=>{const row=el('div','estimate-row'),track=el('div','estimate-track'),bar=el('i');bar.style.width=`${Math.min(100,choice.tenBand*10)}%`;track.append(bar);row.append(el('span','',choice.label),track);list.append(row)});root.append(list)}
  else if(model.kind==='split-number'){const row=el('div','split-visual');row.append(el('span','split-piece',String(model.whole)),el('span','','→'),el('span','split-piece',String(model.parts[0])),el('span','','＋'),el('span','split-piece unknown','?'));root.append(row)}
}

function answer(n,b){
  if(locked)return;
  if(n===q.ans){
    locked=true;cancelSpeech();correct++;S.daily.solved++;
    if(q.isMemoryReview)completeMemoryRetrieval(S,q,{day:localDayKey(),firstTry:!attempted});else{if(q.isReview&&!attempted)completeSpacedReview(S,q);recordSkillSuccess(S,q.skillKey,{firstTry:!attempted,isRevisit:Boolean(q.isReview)});recordMemoryPractice(S,q,{day:localDayKey(),missed:attempted})}
    const learningEvent={completed:true,purpose:q.journeyPurpose||(q.isMemoryReview||q.isReview?'retrieval':'growth'),skillKey:q.skillKey,representation:q.story?'story':'symbolic',isMemoryReview:Boolean(q.isMemoryReview),isReview:Boolean(q.isReview),firstTry:!attempted,recovered:attempted,fingerprint:questionFingerprint(q)};recordCapabilityEvidence(S,learningEvent,{day:localDayKey()});
    if(runMode==='journey'){journeyEvents.push(learningEvent);rememberJourneyEvent(S,learningEvent)}
    if(attempted){combo=0;$('msg').textContent=q.isMemoryReview?'✨ 找回來了！明天它會再發光。':q.isReview?'✨ 找到線索了！它之後還會再來。':'✨ 找到了！先繼續冒險，等等再挑戰一次。'}else{combo++;maxCombo=Math.max(maxCombo,combo);S.daily.maxCombo=Math.max(S.daily.maxCombo,maxCombo);$('msg').textContent=q.isMemoryReview?'✨ 這個能力記得更久了！':q.isReview?'🧠 自己想起來了！這個能力更亮了！':combo>=3?`⚡ ${combo} 連擊！超強！`:'🎉 一次答對！'}
    if(boss)bossHP--;[...$('answers').children].forEach(x=>x.disabled=true);clearHelpChoices();save();updateQaOutput();updateBars();if(correct>=totalNeeded)setTimeout(finish,650);else setTimeout(next,560);
  }else{
    attempted=true;missCount+=1;combo=0;if(!missRecorded){missRecorded=true;recordSkillMiss(S,q.skillKey);queueSpacedReview(S,q);if(q.isMemoryReview)recordMemoryMiss(S,q,{day:localDayKey()});else recordMemoryPractice(S,q,{day:localDayKey(),missed:true});save()}b.disabled=true;b.classList.add('wrong-choice');
    if(missCount===1){showHelpChoices();$('msg').textContent='差一點！你想用哪一種方法幫忙想？'}else{clearHelpChoices();renderVisualHint(2);$('msg').textContent=`🧩 換個方式整理：${answerSafeTextHint(q)}`}
    updateBars();
  }
}
function updateBars(){$('bar').style.width=`${Math.min(100,correct/totalNeeded*100)}%`;$('counter').textContent=`${correct} / ${totalNeeded}`;$('combo').textContent=combo>=2?`⚡ ${combo} 連擊`:'';if(boss)$('hpbar').style.width=`${Math.max(0,bossHP/totalNeeded*100)}%`}
function finish(){
  cancelSpeech();const out=finishDailyProductRun(S,{kind:runMode==='world'?'world':'special',worldIndex:wi,boss,maxCombo,questionCount:totalNeeded,mode:runMode,day:localDayKey()});save();const recap=runMode==='journey'?buildJourneyRecap(journeyEvents,{skillLabel}):null;
  $('resultEmoji').textContent=boss?'🎆':runMode==='journey'?'🧭':runMode==='memory'?'🧠':runMode==='academy'?'🏅':runMode==='focus'?'🎯':runMode==='division'?'🌉':runMode==='story'?'📖':'🏆';$('resultTitle').textContent=boss?'Boss 擊破！':runMode==='journey'?'今天的冒險完成！':runMode==='memory'?'記憶寶箱點亮了！':runMode==='academy'?'20 題大師遠征完成！':runMode==='focus'?'能力練習完成！':runMode==='division'?'除法橋探險完成！':runMode==='story'?'故事任務完成！':`${totalNeeded} 題遠征完成！`;
  $('resultText').textContent=runMode==='journey'?'你完成了找回、轉換和新挑戰。先看看今天真的長出的力量。':`今天又完成 ${totalNeeded} 個挑戰！${out.dailyBonus?` · 今日任務 +💎${out.dailyBonus}`:''}`;const recapRoot=$('capabilityRecap');recapRoot.innerHTML='';recapRoot.classList.toggle('visible',Boolean(recap));if(recap){for(const line of recap.lines)recapRoot.append(el('div','recap-line',line));if(!recap.lines.length)recapRoot.append(el('div','recap-line','🌱 今天完成了一段自己的數字冒險'))}
  $('newCollectible').textContent=out.cosmeticAwarded&&out.collectible?(out.collectible.isNew?`${out.collectible.icon} 新寶物：${out.collectible.name}${out.collectible.rare?' ✨稀有！':''}`:`${out.collectible.icon} ${out.collectible.name} 已收集，變成額外寶石！`):'🌱 今天完整任務的寶物已經收好了；學習可以照自己的步調繼續。';$('resultOverlay').style.display='flex';updateQaOutput();
}

function syncLanternPlanSnapshot(){lanternPlanSnapshot=lanternQueue.map(item=>JSON.parse(JSON.stringify(item)))}
function lanternFormalReadback(){return Object.fromEntries(LANTERN_CORE_SKILLS.map(skillId=>[skillId,evaluateLanternLedgerSkill(S,skillId)]))}
function lanternQaOutput(){if(!QA_MODE)return;const output=$('lanternDebug');if(output)output.textContent=JSON.stringify({currentQuestion:lanternQuestion?JSON.parse(JSON.stringify(lanternQuestion)):null,selection:{...lanternSelection},plan:lanternPlanSnapshot,events:lanternEvents,evidenceLedger:grade2AEvidenceLedgerSnapshot(S),formalReadback:lanternFormalReadback(),completion:lanternRunCompletion(lanternEvents),capabilityEvidence:lanternCapabilitySnapshot(S),eligibility:lanternEligibility({numberRange:LANTERN_NUMBER_RANGE}),pageErrors:[...(window.__NQ_PAGE_ERRORS__||[])]})}
function recordLanternEvidence(outcome,attemptKind){
  const fingerprint=questionFingerprint(lanternQuestion),sourceQuestionId=stableQuestionSourceId(fingerprint),source=lanternQuestion.reviewSourceQuestion||lanternQuestion;
  const schedulerId=lanternQuestion.isReview||lanternQuestion.isMemoryReview?`scheduler-${stableQuestionSourceId(questionFingerprint(source))}`:null;
  const described=lanternLedgerInput(lanternQuestion,{sessionId:lanternSessionId,localDay:localDayKey(),sourceQuestionId,schedulerId,outcome,attemptKind});
  return described.valid?appendGrade2ALedgerRecord(S,described.input):{appended:false,record:null,errors:described.errors};
}
function clearLanternScene(){for(const id of ['beaconLeft','beaconCenter','beaconRight'])$(id).classList.remove('lit','fog');$('rescueShip').classList.remove('sailing');$('lanternWorld').classList.remove('complete')}
function lanternButton(label,className,onClick){const button=el('button',className,label);button.type='button';button.onclick=onClick;return button}
function lanternSendButton(){return lanternButton('點亮信號','send-signal',()=>submitLantern({value:lanternSelection.value,hundreds:lanternSelection.hundreds,tens:lanternSelection.tens,ones:lanternSelection.ones}))}
function renderLanternControls(model){
  const root=$('lanternControls');root.innerHTML='';lanternSelection={value:model.kind==='count'?lanternCountDialStart(lanternQuestion):0,hundreds:0,tens:0,ones:0};
  if(model.kind==='count'){
    const dial=el('div','signal-dial'),value=el('output','signal-value',String(lanternSelection.value));
    const move=delta=>{lanternSelection.value=Math.max(Number(lanternQuestion.optionMin),Math.min(Number(lanternQuestion.optionMax),lanternSelection.value+delta));value.textContent=String(lanternSelection.value)};
    dial.append(lanternButton('−','',()=>move(-1)),value,lanternButton('＋','',()=>move(1)));root.append(dial,el('div','signal-actions'));root.lastChild.append(lanternSendButton());return;
  }
  if(model.kind==='compare'){
    const routes=el('div','route-grid'),left=lanternButton(String(lanternQuestion.a),'route-signal',()=>submitLantern({side:'left'})),right=lanternButton(String(lanternQuestion.b),'route-signal',()=>submitLantern({side:'right'}));
    left.append(el('small','',model.direction==='stronger'?'讓這座燈塔領航':'讓這艘船先進港'));right.append(el('small','',model.direction==='stronger'?'讓這座燈塔領航':'讓這艘船先進港'));routes.append(left,right);root.append(routes);return;
  }
  const builders=el('div','place-builders');for(const [key,label,max] of [['hundreds','百光束',2],['tens','十光束',9],['ones','一光點',9]]){
    const card=el('div','place-stepper'),value=el('output','',String(lanternSelection[key])),button=lanternButton(`＋ 1 ${label}`,'',()=>{lanternSelection[key]=(lanternSelection[key]+1)%(max+1);value.textContent=String(lanternSelection[key])});card.append(el('span','',label),value,button);builders.append(card)
  }
  const actions=el('div','signal-actions');actions.append(lanternButton('全部重放','clear-signal',()=>{lanternSelection.hundreds=0;lanternSelection.tens=0;lanternSelection.ones=0;renderLanternControls(model)}),lanternSendButton());root.append(builders,actions);
}
function renderLanternMission(){
  clearLanternScene();lanternQuestion=lanternQueue[lanternIndex];if(!lanternQuestion){finishLantern();return}const model=lanternMissionModel(lanternQuestion);lanternAttempted=false;lanternHintUsed=false;
  $('lanternCounter').textContent=`${lanternIndex} / ${lanternQueue.length}`;$('lanternBar').style.width=`${lanternIndex/lanternQueue.length*100}%`;
  $('lanternPurpose').textContent=lanternQuestion.isMemoryReview?'🧠 昨天的航路又亮了':lanternQuestion.isReview?'🧩 回來修穩一座訊號':'🚢 幫一艘船找到航路';$('lanternPrompt').textContent=lanternQuestion.txt;
  $('lanternInstruction').textContent=model.kind==='count'?'轉動缺少的燈號，再送出訊號。':model.kind==='compare'?(model.direction==='stronger'?'選一座能照得更遠的訊號塔。':'按下應該先進港的船號。'):'親手放入百光束、十光束和一光點。';$('lanternFeedback').className='lantern-feedback';$('lanternFeedback').textContent='數字就是你要修好的訊號。';$('lanternHelp').innerHTML='';renderLanternControls(model);lanternQaOutput();save();
}
function startLantern(){
  resetRun();runMode='lantern';lanternSessionId=`lantern-session-${S.learning.session}`;lanternQueue=planLanternRun(S,{count:8,day:localDayKey(),numberRange:LANTERN_NUMBER_RANGE});syncLanternPlanSnapshot();lanternEvents=[];lanternIndex=0;lanternQuestion=null;$('home').style.display='none';$('game').style.display='none';$('lanternWorld').style.display='block';renderLanternMission();
}
function showLanternRecovery(){
  const root=$('lanternHelp');root.innerHTML='';const feedback=$('lanternFeedback');feedback.className='lantern-feedback recover';feedback.textContent='霧跑出來了，但訊號沒有壞掉。選一種方法整理，再換一組新訊號。';
  const textHint=lanternButton('💬 一句線索','',()=>{lanternHintUsed=true;feedback.textContent=lanternHint(lanternQuestion,{level:1});textHint.disabled=true}),placeHint=lanternButton('👀 排好百十個','',()=>{lanternHintUsed=true;feedback.textContent=lanternHint(lanternQuestion,{level:2});placeHint.disabled=true}),retry=lanternButton('🛠️ 換一組訊號再試','',()=>{const usedHint=lanternHintUsed;lanternQueue[lanternIndex]=freshLanternRetry(lanternQuestion,{numberRange:LANTERN_NUMBER_RANGE});renderLanternMission();lanternAttempted=true;lanternHintUsed=usedHint;lanternQaOutput()});root.append(textHint,placeHint,retry);
}
function submitLantern(action){
  const outcome=evaluateLanternAction(lanternQuestion,action);if(!outcome.correct){recordLanternEvidence('miss','miss');lanternAttempted=true;recordSkillMiss(S,lanternQuestion.skillKey);queueSpacedReview(S,lanternQuestion);if(lanternQuestion.isMemoryReview)recordMemoryMiss(S,lanternQuestion.reviewSourceQuestion||lanternQuestion,{day:localDayKey()});else recordMemoryPractice(S,lanternQuestion,{day:localDayKey(),missed:true});for(const button of $('lanternControls').querySelectorAll('button'))button.disabled=true;for(const id of ['beaconLeft','beaconCenter','beaconRight'])$(id).classList.add('fog');showLanternRecovery();save();lanternQaOutput();return}
  const firstTry=!lanternAttempted,source=lanternQuestion.reviewSourceQuestion||lanternQuestion;S.daily.solved++;
  recordLanternEvidence('correct',firstTry?'independent-first-try':lanternHintUsed?'hinted':'recovered');
  if(lanternQuestion.isMemoryReview)completeMemoryRetrieval(S,source,{day:localDayKey(),firstTry});else{if(lanternQuestion.isReview&&firstTry)completeSpacedReview(S,source);recordSkillSuccess(S,lanternQuestion.skillKey,{firstTry,isRevisit:Boolean(lanternQuestion.isReview),day:localDayKey()});recordMemoryPractice(S,lanternQuestion,{day:localDayKey(),missed:lanternAttempted})}
  const event={completed:true,purpose:lanternQuestion.isMemoryReview||lanternQuestion.isReview?'retrieval':'growth',skillKey:lanternQuestion.skillKey,representation:lanternMissionModel(lanternQuestion).kind,isMemoryReview:Boolean(lanternQuestion.isMemoryReview),isReview:Boolean(lanternQuestion.isReview),firstTry,recovered:lanternAttempted,fingerprint:questionFingerprint(lanternQuestion)};recordCapabilityEvidence(S,event,{day:localDayKey()});lanternEvents.push(event);
  const model=lanternMissionModel(lanternQuestion);if(model.kind==='compare')$(outcome.expected==='left'?'beaconLeft':'beaconRight').classList.add('lit');else for(const id of model.kind==='count'?['beaconCenter']:['beaconLeft','beaconCenter','beaconRight'])$(id).classList.add('lit');$('rescueShip').classList.add('sailing');$('lanternFeedback').className='lantern-feedback success';$('lanternFeedback').textContent=lanternAttempted?'✨ 重新整理後，船看見你修好的光了！':'✨ 訊號一次接通，船正沿著你的數字進港！';for(const button of $('lanternControls').querySelectorAll('button'))button.disabled=true;$('lanternHelp').innerHTML='';reconcileLanternRunQueue(S,lanternQueue,{afterIndex:lanternIndex,numberRange:LANTERN_NUMBER_RANGE});syncLanternPlanSnapshot();save();lanternQaOutput();setTimeout(()=>{lanternIndex++;renderLanternMission()},720);
}
function finishLantern(){
  const completion=lanternRunCompletion(lanternEvents);if(!completion.complete){for(const skillKey of completion.missingSkillIds)lanternQueue.push(planLanternRun(S,{count:4,numberRange:LANTERN_NUMBER_RANGE}).find(item=>item.skillKey===skillKey));renderLanternMission();return}
  finishDailyProductRun(S,{kind:'special',mode:'lantern',maxCombo:0,questionCount:lanternEvents.length,day:localDayKey()});save();$('lanternWorld').classList.add('complete');$('lanternCounter').textContent=`${lanternEvents.length} / ${lanternEvents.length}`;$('lanternBar').style.width='100%';$('resultEmoji').textContent='🏮';$('resultTitle').textContent='百光港重新發亮！';$('resultText').textContent='你用數數、組合、換一種樣子和比較，讓迷航的船都找到了回家的光。';const root=$('capabilityRecap');root.innerHTML='';root.classList.add('visible');root.append(el('div','recap-line','🚢 四種核心訊號都由你親手修好了'),el('div','recap-line','🌱 卡住後找回來的力量，也會留在能力地圖裡'));$('newCollectible').textContent='✨ 港口已經記住你的訊號；之後會在剛好的時間再請你回來。';$('resultOverlay').style.display='flex';lanternQaOutput();
}
function showCollection(){$('collectionGrid').innerHTML='';COLLECTIBLES.forEach(c=>{const got=S.collection.includes(c.id),item=document.createElement('div');item.className='collect'+(!got?' locked':'')+(c.rare?' rare':'');item.innerHTML=`<div class="emoji">${got?c.icon:'❔'}</div><b>${got?c.name:'神秘寶物'}</b>${c.rare?'<div>✨ BOSS</div>':''}`;$('collectionGrid').append(item)});$('collectionOverlay').style.display='flex'}
function masteryCard(label,key){const state=capabilityState(S,key);return `<div class="master-card capability-${state.id}"><b>${label}</b><small>${state.icon} ${state.label}</small><div class="capability-path" aria-label="${label}：${state.label}">${Array.from({length:4},(_,index)=>`<i class="${index<state.rank?'lit':''}"></i>`).join('')}</div></div>`}
function badge(label,key){const state=capabilityState(S,key),item=document.createElement('div');item.className=`table-badge capability-${state.id}`;item.innerHTML=`<strong>${label}</strong><span aria-label="${state.label}">${state.icon}</span>`;return item}
function skillLabel(key){if(key.startsWith('mul:'))return `${key.split(':')[1]} 的乘法`;if(key.startsWith('div:'))return `${key.split(':')[1]} 的除法橋`;const labels={'add:20':'20 內加法','sub:20':'20 內減法','add:50':'50 內加法','sub:50':'50 內減法','add:100':'100 內加法','sub:100':'100 內減法','sense:missing':'神秘空格','sense:make10':'湊成 10','sense:make100':'湊成 100','sense:compare':'靠近目標','sense:decompose':'拆數魔法','g2a.num.count-200':'百光燈號順序','g2a.num.compose-200':'百十個光束','g2a.num.represent-200':'航海圖訊號','g2a.num.compare-200':'訊號強弱'};return labels[key]||'新能力'}
function showMastery(){$('lanternMastery').innerHTML=LANTERN_CORE_SKILLS.map(key=>masteryCard(skillLabel(key),key)).join('');$('mulMastery').innerHTML='';MULTIPLICATION_SKILLS.forEach((key,i)=>$('mulMastery').append(badge(`${i+1}×`,key)));$('divMastery').innerHTML='';DIVISION_SKILLS.forEach((key,i)=>$('divMastery').append(badge(`${i+1}÷`,key)));$('divisionMasterySection').hidden=!divisionUnlocked(S);$('arithMastery').innerHTML=[masteryCard('20 內加法','add:20'),masteryCard('20 內減法','sub:20'),masteryCard('50 內加法','add:50'),masteryCard('50 內減法','sub:50'),masteryCard('100 內加法','add:100'),masteryCard('100 內減法','sub:100'),...NUMBER_SENSE_SKILLS.map(key=>masteryCard(skillLabel(key),key))].join('');const keys=mixedSkillKeys(S,{challengeLevel:3}),weights=challengeWeights(S,keys,{recentSkills:[]}),nextKey=[...keys].sort((a,b)=>weights[b]-weights[a])[0];$('nextAdventure').textContent=`🧭 下一段冒險會帶你再遇見：${skillLabel(nextKey)}。每次自己想一想，地圖就會慢慢發光。`;$('masteryOverlay').style.display='flex'}

function parentList(title,keys,empty){const section=el('section','adult-signal'),heading=el('h3','',title),list=el('div','adult-tags');if(keys.length)keys.forEach(key=>list.append(el('span','adult-tag',skillLabel(key))));else list.append(el('span','adult-empty',empty));section.append(heading,list);return section}
function showAdult(){const summary=parentLearningSummary(S),root=$('adultSummary');root.innerHTML='';root.append(parentList('最近遇見的能力',summary.recentlyPracticed,'完成第一趟冒險後，這裡會出現足跡。'),parentList('已經能自己想起來',summary.stableRetrieval,'能力會在隔一段時間仍想起來後出現在這裡。'),parentList('正在慢慢建立',summary.stillBuilding,'目前沒有需要特別標記的能力。'),parentList('換個故事也會',summary.recentTransfer,'完成一次獨立的故事轉換後會出現在這裡。'));const support=el('section','adult-support');support.append(el('h3','','一起支持的方法'),el('p','',summary.supportSuggestion));root.append(support);$('adultOverlay').style.display='flex'}

function renderOnboarding(){const step=ONBOARDING_STEPS[onboardingIndex];$('onboardingIcon').textContent=step.icon;$('onboardingProgress').textContent=`${onboardingIndex+1} / ${ONBOARDING_STEPS.length}`;$('onboardingTitle').textContent=step.title;$('onboardingCopy').textContent=step.copy;$('onboardingDots').innerHTML=ONBOARDING_STEPS.map((_,index)=>`<i class="${index===onboardingIndex?'active':''}"></i>`).join('');$('onboardingNext').textContent=onboardingIndex===ONBOARDING_STEPS.length-1?'🚀 開始第一趟冒險':'下一步';$('onboardingOverlay').style.display='flex'}
function advanceOnboarding(){if(onboardingIndex<ONBOARDING_STEPS.length-1){onboardingIndex++;renderOnboarding();return}completeOnboarding(S);save();$('onboardingOverlay').style.display='none';startJourney()}

$('homeBtn').onclick=renderHome;$('lanternHomeBtn').onclick=renderHome;$('lanternBtn').onclick=startLantern;$('journeyBtn').onclick=startJourney;$('collectionBtn').onclick=showCollection;$('masteryBtn').onclick=showMastery;$('mapPeekBtn').onclick=showMastery;$('adultBtn').onclick=showAdult;$('memoryBtn').onclick=startMemory;$('storyBtn').onclick=startStory;$('focusBtn').onclick=startFocus;$('academyBtn').onclick=startAcademy;$('divisionBtn').onclick=startDivision;$('readBtn').onclick=readQuestion;
$('closeCollection').onclick=()=>$('collectionOverlay').style.display='none';$('closeMastery').onclick=()=>$('masteryOverlay').style.display='none';$('closeAdult').onclick=()=>$('adultOverlay').style.display='none';$('resetOnboardingBtn').onclick=()=>{resetOnboarding(S);save();$('adultOverlay').style.display='none';onboardingIndex=0;renderOnboarding()};$('onboardingNext').onclick=advanceOnboarding;$('divisionIntroBtn').onclick=closeDivisionIntro;$('resultBtn').onclick=()=>{$('resultOverlay').style.display='none';renderHome()};
Object.defineProperty(window,'__NQ_V10_DEBUG__',{value:{getState:()=>JSON.parse(JSON.stringify(S)),getJourneyPlan:()=>journeyPlanSnapshot.map(item=>JSON.parse(JSON.stringify(item))),getJourneySummary:()=>journeyPlanSummary(journeyPlanSnapshot),getJourneyEvents:()=>journeyEvents.map(item=>({...item})),getParentSummary:()=>parentLearningSummary(S),getStoryRun:()=>storyRunLog.map(item=>({...item})),getStoryDiversity:()=>storyDiversitySummary(storyRunLog.map(item=>({story:true,storyTemplateId:item.templateId,storyThemeId:item.themeId,txt:item.text}))),getCurrentQuestion:()=>q?JSON.parse(JSON.stringify(q)):null,getLanternPlan:()=>lanternPlanSnapshot.map(item=>JSON.parse(JSON.stringify(item))),getLanternEvents:()=>lanternEvents.map(item=>({...item})),getLanternQuestion:()=>lanternQuestion?JSON.parse(JSON.stringify(lanternQuestion)):null,getLanternCompletion:()=>lanternRunCompletion(lanternEvents),getLanternCapabilityEvidence:()=>lanternCapabilitySnapshot(S),getGrade2AEvidenceLedger:()=>grade2AEvidenceLedgerSnapshot(S),getGrade2AFormalReadback:()=>lanternFormalReadback(),startLantern},configurable:false,writable:false});
window.addEventListener('pagehide',cancelSpeech);hud();renderHome();if(!onboardingStatus(S).complete)renderOnboarding();if('serviceWorker'in navigator)navigator.serviceWorker.register('./sw.js');
