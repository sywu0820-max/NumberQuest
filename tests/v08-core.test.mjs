import test from 'node:test';
import assert from 'node:assert/strict';
import {
  STORY_CATALOG,STORY_THEMES,STORY_RELATIONSHIPS,storySkillKeys,makeStoryQuestion,makeStoryRun,
  storyDiversitySummary,selectStoryTemplate,visualHintModel,visualHintKnownTotalLabel,visualHintRevealsAnswer,
  freshState,normalizeState,recordSkillSuccess,recordSkillMiss,queueSpacedReview,takeDueReview,
  completeSpacedReview,questionFingerprint,recordMemoryPractice,dueMemoryReviews,makeMemoryReviewQuestion,
  completeMemoryRetrieval,memoryScheduleSnapshot
} from '../src/v08-core.mjs';

const seeded=seed=>()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296);
const rngSeq=values=>{let i=0;return()=>values[(i++)%values.length]};
const seedAll=()=>{
  const s=freshState('2026-08-29');s.unlocked=8;
  for(let family=1;family<=9;family++)recordSkillSuccess(s,`mul:${family}`,{day:'2026-08-29'});
  return s;
};
const assertChoices=q=>{
  assert.equal(q.opts.length,4);assert.equal(new Set(q.opts).size,4);
  assert.equal(q.opts.filter(value=>value===q.ans).length,1);
};

test('catalog has stable unique IDs and eight child-friendly reusable themes',()=>{
  assert.equal(STORY_THEMES.length,8);assert.equal(STORY_CATALOG.length,32);
  assert.equal(new Set(STORY_CATALOG.map(item=>item.id)).size,STORY_CATALOG.length);
  assert.ok(STORY_CATALOG.every(item=>/^[a-z]+-[a-z0-9-]+$/.test(item.id)));
  for(const theme of STORY_THEMES){
    const entries=STORY_CATALOG.filter(item=>item.themeId===theme.id);
    assert.deepEqual(new Set(entries.map(item=>item.op)),new Set(['add','sub','mul','div']));
  }
});

test('anti-shortcut guard fails any one-theme one-operation collapse',()=>{
  for(const theme of STORY_THEMES){
    const operations=new Set(STORY_CATALOG.filter(item=>item.themeId===theme.id).map(item=>item.op));
    assert.ok(operations.size>1,`${theme.id} collapsed to one operation`);
  }
});

test('catalog covers both required relationship families for every operation',()=>{
  const expected=Object.values(STORY_RELATIONSHIPS);
  assert.deepEqual(new Set(STORY_CATALOG.map(item=>item.relationshipId)),new Set(expected));
  for(const relationship of expected)assert.ok(STORY_CATALOG.filter(item=>item.relationshipId===relationship).length>=4);
});

test('addition combine and increase stories preserve exact quantities',()=>{
  const s=seedAll();
  for(const relationshipId of [STORY_RELATIONSHIPS.ADD_COMBINE,STORY_RELATIONSHIPS.ADD_INCREASE]){
    const q=makeStoryQuestion(s,{skillKey:'add:100',relationshipId,rng:seeded(11)});
    assert.equal(q.storyRelationshipId,relationshipId);assert.equal(q.ans,q.a+q.b);assert.equal(q.result,q.ans);assert.ok(q.ans<=100);assertChoices(q);
    for(const value of [q.a,q.b])assert.match(q.txt,new RegExp(String(value)));
  }
});

test('subtraction remove and comparison stories stay nonnegative and semantically ordered',()=>{
  const s=seedAll();
  for(const relationshipId of [STORY_RELATIONSHIPS.SUB_REMOVE,STORY_RELATIONSHIPS.SUB_COMPARE]){
    const q=makeStoryQuestion(s,{skillKey:'sub:100',relationshipId,rng:seeded(22)});
    assert.equal(q.storyRelationshipId,relationshipId);assert.equal(q.ans,q.a-q.b);assert.ok(q.a>=q.b&&q.ans>=0);assertChoices(q);
    if(relationshipId===STORY_RELATIONSHIPS.SUB_COMPARE)assert.ok(q.a>q.b);
  }
});

test('multiplication equal-group and repeated-rate stories keep factors within 1 to 9',()=>{
  const s=seedAll();
  for(const relationshipId of [STORY_RELATIONSHIPS.MUL_EQUAL_GROUPS,STORY_RELATIONSHIPS.MUL_REPEATED_RATE]){
    const q=makeStoryQuestion(s,{skillKey:'mul:7',relationshipId,rng:seeded(33)});
    assert.equal(q.a,7);assert.ok(q.b>=1&&q.b<=9);assert.equal(q.ans,q.a*q.b);assert.ok(q.ans<=81);assertChoices(q);
  }
});

test('division sharing and grouping stories preserve divisor orientation and eligibility',()=>{
  const s=seedAll();
  for(const relationshipId of [STORY_RELATIONSHIPS.DIV_SHARING,STORY_RELATIONSHIPS.DIV_GROUPING]){
    const q=makeStoryQuestion(s,{skillKey:'div:7',relationshipId,rng:seeded(44)});
    assert.equal(q.divisor,7);assert.equal(q.dividend,q.divisor*q.quotient);assert.equal(q.ans,q.quotient);assert.equal(q.dividend%q.divisor,0);assertChoices(q);
  }
  const fresh=freshState();assert.throws(()=>makeStoryQuestion(fresh,{skillKey:'div:7'}),/not eligible/);
});

test('division visual hints keep the unknown semantic dimension hidden at both levels',()=>{
  const s=seedAll();
  const sharing=makeStoryQuestion(s,{skillKey:'div:7',relationshipId:STORY_RELATIONSHIPS.DIV_SHARING,rng:rngSeq([0,.5,.2,.4,.6])});
  const grouping=makeStoryQuestion(s,{skillKey:'div:7',relationshipId:STORY_RELATIONSHIPS.DIV_GROUPING,rng:rngSeq([0,.5,.2,.4,.6])});
  for(const level of [1,2]){
    const shared=visualHintModel(sharing,{level});assert.equal(shared.kind,'unknown-equal-groups');assert.equal(shared.groupCount,7);assert.equal(shared.groupSize,'?');assert.equal(shared.knownTotal,sharing.dividend);assert.equal(visualHintRevealsAnswer(shared,sharing),false);
    const grouped=visualHintModel(grouping,{level});assert.equal(grouped.kind,'unknown-equal-groups');assert.equal(grouped.groupCount,'?');assert.equal(grouped.groupSize,7);assert.equal(grouped.knownTotal,grouping.dividend);assert.equal(visualHintRevealsAnswer(grouped,grouping),false);
  }
  assert.equal(visualHintRevealsAnswer({groupSize:sharing.ans},sharing),true);
  assert.equal(visualHintRevealsAnswer({groupCount:grouping.ans},grouping),true);
});

test('every division theme uses a unit-neutral known-total label at both hint levels',()=>{
  const s=seedAll(),divisionTemplates=STORY_CATALOG.filter(item=>item.op==='div');
  for(const definition of divisionTemplates){
    const exclusions=divisionTemplates.filter(item=>item.relationshipId===definition.relationshipId&&item.id!==definition.id).map(item=>item.id);
    const q=makeStoryQuestion(s,{skillKey:'div:7',relationshipId:definition.relationshipId,recentTemplateIds:exclusions,rng:()=>0});
    assert.equal(q.storyTemplateId,definition.id);
    for(const level of [1,2]){
      const label=visualHintKnownTotalLabel(visualHintModel(q,{level}));
      assert.equal(label,`總數：${q.dividend}`);assert.doesNotMatch(label,/顆|位|塊|枚|張|罐|根|公里|公尺/);
    }
  }
});

test('story prompts contain no operator symbols or explicit operation labels',()=>{
  const s=seedAll();
  for(const definition of STORY_CATALOG){
    const family=definition.op==='mul'||definition.op==='div'?7:100;
    const q=makeStoryQuestion(s,{skillKey:`${definition.op}:${family}`,relationshipId:definition.relationshipId,recentTemplateIds:STORY_CATALOG.filter(item=>item.op===definition.op&&item.id!==definition.id).map(item=>item.id),rng:()=>0});
    assert.equal(q.storyTemplateId,definition.id);assert.doesNotMatch(q.txt,/[+＋\-−×÷=]/);assert.doesNotMatch(q.txt,/請用加法|這是除法題|加法|減法|乘法|除法/);assert.ok(q.txt.length<=48);
  }
});

test('template selection and complete questions are deterministic with injected RNG',()=>{
  const args={op:'add',recentTemplateIds:['space-add-increase'],recentThemeIds:['animals']};
  assert.equal(selectStoryTemplate({...args,rng:seeded(123)}).id,selectStoryTemplate({...args,rng:seeded(123)}).id);
  const s=seedAll(),a=makeStoryQuestion(s,{skillKey:'add:100',rng:seeded(987)}),b=makeStoryQuestion(s,{skillKey:'add:100',rng:seeded(987)});
  assert.deepEqual(a,b);
});

test('stress generation respects arithmetic eligibility, bounds, and answer uniqueness',()=>{
  const s=seedAll(),skills=storySkillKeys(s),rng=seeded(20260830);
  for(let i=0;i<3000;i++){
    const skillKey=skills[i%skills.length],q=makeStoryQuestion(s,{skillKey,rng});assertChoices(q);
    if(q.op==='add'){assert.equal(q.ans,q.a+q.b);assert.ok(q.ans<=100)}
    if(q.op==='sub'){assert.equal(q.ans,q.a-q.b);assert.ok(q.ans>=0&&q.a<=100)}
    if(q.op==='mul'){assert.ok(q.a>=1&&q.a<=9&&q.b>=1&&q.b<=9);assert.equal(q.ans,q.a*q.b)}
    if(q.op==='div'){assert.equal(q.dividend,q.divisor*q.quotient);assert.ok(q.dividend<=81)}
  }
});

test('seeded 10-question runs always meet within-run diversity guards',()=>{
  const s=seedAll();
  for(let seed=1;seed<=500;seed++){
    const run=makeStoryRun(s,{count:10,skillKey:'add:100',rng:seeded(seed)}),summary=storyDiversitySummary(run);
    assert.ok(summary.templateCount>=6,`seed ${seed} templates ${summary.templateCount}`);assert.ok(summary.themeCount>=4,`seed ${seed} themes ${summary.themeCount}`);
    assert.equal(summary.immediateTemplateRepeat,false);assert.equal(summary.immediateTextRepeat,false);assert.ok(summary.maxThemeStreak<=2);
  }
});

test('same-session miss retry and spaced revisit preserve exact story metadata identity',()=>{
  const s=seedAll(),q=makeStoryQuestion(s,{skillKey:'add:100',rng:seeded(55)}),before=questionFingerprint(q);
  recordSkillMiss(s,q.skillKey);assert.equal(queueSpacedReview(s,q),true);recordSkillSuccess(s,q.skillKey,{firstTry:false});recordSkillSuccess(s,'add:100');recordSkillSuccess(s,'add:100');
  const review=takeDueReview(s,seeded(77));assert.equal(questionFingerprint(review),before);assert.equal(review.txt,q.txt);assert.equal(review.storyTemplateId,q.storyTemplateId);assert.equal(review.storyThemeId,q.storyThemeId);assert.equal(review.storyRelationshipId,q.storyRelationshipId);
  assert.equal(completeSpacedReview(s,review),true);
});

test('cross-day Memory Chest freezes and replays exact v0.8 story identity',()=>{
  const s=seedAll(),q=makeStoryQuestion(s,{skillKey:'div:7',relationshipId:STORY_RELATIONSHIPS.DIV_GROUPING,rng:seeded(66)});
  recordMemoryPractice(s,q,{day:'2026-08-29'});const frozen=memoryScheduleSnapshot(s)[q.skillKey];
  const replacement=makeStoryQuestion(s,{skillKey:'div:7',relationshipId:STORY_RELATIONSHIPS.DIV_SHARING,rng:seeded(67)});recordMemoryPractice(s,replacement,{day:'2026-08-30'});
  const due=dueMemoryReviews(s,{day:'2026-08-30'})[0],review=makeMemoryReviewQuestion(due,seeded(68));
  assert.equal(due.fingerprint,frozen.fingerprint);assert.equal(review.storyTemplateId,q.storyTemplateId);assert.equal(review.storyRelationshipId,q.storyRelationshipId);assert.equal(review.txt,q.txt);
  const result=completeMemoryRetrieval(s,review,{day:'2026-08-30',firstTry:true});assert.equal(result.entry.dueDay,'2026-09-02');
});

test('old v0.5-v0.7 state normalization remains non-mutating and metadata-optional',()=>{
  const old=freshState('2026-08-29'),before=structuredClone(old),normalized=normalizeState(old,'2026-08-29');
  assert.deepEqual(old,before);assert.deepEqual(normalized.learning.memorySchedule,{});
  const legacyStory={op:'add',variant:'story-add',story:true,skillKey:'add:20',a:4,b:5,result:9,ans:9,optionMin:0,optionMax:20,txt:'你有 4 顆寶石，又找到 5 顆。現在有幾顆？',hint:'hint',opts:[9,8,10,11]};
  recordMemoryPractice(normalized,legacyStory,{day:'2026-08-29'});const restored=normalizeState(normalized,'2026-08-30').learning.memorySchedule['add:20'].question;
  assert.equal(restored.txt,legacyStory.txt);assert.equal(restored.storyTemplateId,undefined);assert.equal(restored.storyRelationshipId,undefined);
});
