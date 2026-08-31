import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  freshState,normalizeState,recordSkillSuccess,queueSpacedReview,takeDueReview,recordMemoryPractice,dueMemoryReviews,
  completeSpacedReview,questionFingerprint,planTodaysAdventure
} from '../src/v10-core.mjs';
import {
  LANTERN_CORE_SKILLS,LANTERN_EXTENSION_SKILLS,LANTERN_ALL_SKILLS,LANTERN_PEDAGOGY,isLanternSkill,lanternEligibility,
  makeLanternMission,lanternMissionModel,evaluateLanternAction,lanternHint,planLanternRun,freshLanternRetry,lanternRunCompletion
} from '../src/grade-2a-lantern-core.mjs';

const seeded=seed=>()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296);
const correctAction=q=>{const m=lanternMissionModel(q);return m.kind==='compare'?{side:q.ans}:m.kind==='count'?{value:q.ans}:{hundreds:m.digits.hundreds,tens:m.digits.tens,ones:m.digits.ones}};

test('runtime skill IDs and pedagogy are the exact frozen 百光港 foundation subset',()=>{
  const graph=JSON.parse(fs.readFileSync(new URL('../curriculum/grade-2a.skill-graph.json',import.meta.url)));
  const world=graph.worlds.find(item=>item.id==='world.lantern-harbor');
  assert.deepEqual(LANTERN_CORE_SKILLS,world.requiredForCompletionSkillIds);
  assert.deepEqual(LANTERN_EXTENSION_SKILLS,world.eligibilityBranchSkillIds);
  for(const id of LANTERN_CORE_SKILLS)assert.deepEqual(LANTERN_PEDAGOGY[id],graph.skills.find(skill=>skill.id===id).pedagogy,id);
});

test('default run covers every core signal skill and never silently requires an extension',()=>{
  const state=freshState('2026-08-31'),plan=planLanternRun(state,{rng:seeded(7),day:'2026-08-31'});
  assert.equal(plan.length,8);for(const id of LANTERN_CORE_SKILLS)assert.ok(plan.some(q=>q.skillKey===id),id);
  assert.equal(plan.some(q=>LANTERN_EXTENSION_SKILLS.includes(q.skillKey)),false);
  assert.deepEqual(lanternEligibility({numberRange:200}),{numberRange:200,coreSkillIds:[...LANTERN_CORE_SKILLS],eligibleExtensionSkillIds:[],extensionDeferred:true,completionSkillIds:[...LANTERN_CORE_SKILLS]});
  assert.deepEqual(lanternEligibility({numberRange:300}).eligibleExtensionSkillIds,[...LANTERN_EXTENSION_SKILLS]);
  assert.deepEqual(lanternEligibility({numberRange:300}).completionSkillIds,[...LANTERN_CORE_SKILLS]);
});

test('every signal interaction evaluates the child math action instead of a detached answer choice',()=>{
  for(const [index,id] of LANTERN_CORE_SKILLS.entries()){
    const q=makeLanternMission(id,{rng:seeded(index+20)}),model=lanternMissionModel(q),action=correctAction(q);
    assert.equal(evaluateLanternAction(q,action).correct,true,id);
    const wrong=model.kind==='compare'?{side:q.ans==='left'?'right':'left'}:model.kind==='count'?{value:q.ans-1}:{hundreds:0,tens:0,ones:0};
    assert.equal(evaluateLanternAction(q,wrong).correct,false,id);assert.doesNotMatch(lanternHint(q,{level:2}),new RegExp(`答案.{0,2}${q.ans}`));
  }
});

test('same-session repair is fresh, keeps shared ownership, and can retire the original identity',()=>{
  const state=freshState('2026-08-31'),source=makeLanternMission(LANTERN_CORE_SKILLS[0],{rng:seeded(31)}),fingerprint=questionFingerprint(source);
  queueSpacedReview(state,source);for(const id of ['add:20','sub:20','mul:2'])recordSkillSuccess(state,id,{day:'2026-08-31'});
  const plan=planLanternRun(state,{rng:seeded(42),day:'2026-08-31'}),review=plan.find(q=>q.isReview);
  assert.ok(review);assert.equal(review.skillKey,source.skillKey);assert.notEqual(questionFingerprint(review),fingerprint);assert.equal(questionFingerprint(review.reviewSourceQuestion),fingerprint);
  assert.equal(completeSpacedReview(state,review.reviewSourceQuestion),true);assert.equal(state.learning.pendingReviews.length,0);
});

test('fresh retry preserves review role but changes the exact problem',()=>{
  const source=makeLanternMission(LANTERN_CORE_SKILLS[2],{rng:seeded(52)}),review={...source,isMemoryReview:true,reviewSourceQuestion:source},retry=freshLanternRetry(review,{rng:seeded(61)});
  assert.equal(retry.isMemoryReview,true);assert.equal(retry.skillKey,source.skillKey);assert.notEqual(questionFingerprint(retry),questionFingerprint(source));assert.equal(questionFingerprint(retry.reviewSourceQuestion),questionFingerprint(source));
});

test('standard journey and Memory Chest exclude interactive harbor identities while harbor owns them',()=>{
  const state=normalizeState(freshState('2026-08-30'),'2026-08-30'),source=makeLanternMission(LANTERN_CORE_SKILLS[1],{rng:seeded(72)});
  recordMemoryPractice(state,source,{day:'2026-08-30'});queueSpacedReview(state,source);state.learning.solvedTotal+=3;
  const nextDay=normalizeState(state,'2026-08-31');
  assert.equal(takeDueReview(nextDay,seeded(1),{excludeSkillKeys:LANTERN_ALL_SKILLS}),null);
  assert.equal(dueMemoryReviews(nextDay,{day:'2026-08-31',excludeSkillKeys:LANTERN_ALL_SKILLS}).length,0);
  assert.equal(planTodaysAdventure(nextDay,{day:'2026-08-31',rng:seeded(2),excludeSkillKeys:LANTERN_ALL_SKILLS}).some(q=>isLanternSkill(q.skillKey)),false);
  const harbor=planLanternRun(nextDay,{day:'2026-08-31',rng:seeded(3)});assert.ok(harbor.some(q=>q.isMemoryReview||q.isReview));
});

test('World completion is based on four core skills and ignores extension-only evidence',()=>{
  const extensionOnly=LANTERN_EXTENSION_SKILLS.map(skillKey=>({completed:true,skillKey}));assert.equal(lanternRunCompletion(extensionOnly).complete,false);
  const core=LANTERN_CORE_SKILLS.map(skillKey=>({completed:true,skillKey})),result=lanternRunCompletion([...core,...extensionOnly]);assert.equal(result.complete,true);assert.deepEqual(result.requiredSkillIds,[...LANTERN_CORE_SKILLS]);assert.deepEqual(result.ignoredExtensionSkillIds,[...LANTERN_EXTENSION_SKILLS]);
});

test('stress: generated core missions stay in 101-200 with valid nonnegative place values',()=>{
  for(let seed=1;seed<=1200;seed++)for(const id of LANTERN_CORE_SKILLS){const q=makeLanternMission(id,{rng:seeded(seed)}),m=lanternMissionModel(q);assert.ok(q.result>=101&&q.result<=200,`${id} ${seed}`);assert.equal(isLanternSkill(q.skillKey),true);if(m.kind==='compare'){assert.ok(q.a>=101&&q.a<=200);assert.ok(q.b>=101&&q.b<=200);assert.notEqual(q.a,q.b)}else if(m.kind!=='count')assert.equal(m.digits.hundreds*100+m.digits.tens*10+m.digits.ones,q.result)}
});
