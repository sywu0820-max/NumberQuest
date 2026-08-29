import test from 'node:test';
import assert from 'node:assert/strict';
import {
  freshState,recordSkillSuccess,recordSkillMiss,queueSpacedReview,takeDueReview,completeSpacedReview,
  storySkillKeys,makeStoryQuestion,visualHintModel,visualHintRevealsAnswer,questionFingerprint
} from '../src/v06-core.mjs';

const rngSeq=(values)=>{let i=0;return()=>values[(i++)%values.length]};
const itemGroupsForTest=(groupCount,itemCount)=>Array.from({length:groupCount},()=>Array.from({length:itemCount},()=> 'star'));
const seedExposure=(s)=>{s.unlocked=8;for(const family of [1,2,5])recordSkillSuccess(s,`mul:${family}`);recordSkillSuccess(s,'mul:1');recordSkillSuccess(s,'mul:2')};
function assertChoices(q){assert.equal(q.opts.length,4);assert.equal(new Set(q.opts).size,4);assert.equal(q.opts.filter(value=>value===q.ans).length,1)}

test('story eligibility follows unlocked arithmetic and completed multiplication exposure',()=>{
  const s=freshState();
  assert.deepEqual(storySkillKeys(s),['add:20']);
  s.unlocked=8;recordSkillSuccess(s,'mul:2');recordSkillSuccess(s,'mul:5');
  const keys=storySkillKeys(s);
  assert.ok(keys.includes('add:100'));assert.ok(keys.includes('sub:100'));assert.ok(keys.includes('mul:2'));assert.ok(keys.includes('mul:5'));
  assert.ok(!keys.includes('mul:8'));assert.ok(!keys.some(key=>key.startsWith('div:')));
  for(let i=0;i<3;i++)recordSkillSuccess(s,'mul:1');
  assert.ok(keys.length<storySkillKeys(s).length);assert.deepEqual(storySkillKeys(s).filter(key=>key.startsWith('div:')),['div:1','div:2','div:5']);
});

test('story eligibility and generation do not mutate learning state',()=>{
  const s=freshState(),before=structuredClone(s);storySkillKeys(s);makeStoryQuestion(s,{rng:rngSeq([.2,.7,.3,.9])});assert.deepEqual(s,before);
});

test('deterministic add and subtract stories stay unambiguous and within the eligible range',()=>{
  const s=freshState();s.unlocked=8;
  for(const skillKey of ['add:20','sub:20','add:50','sub:50','add:100','sub:100'])for(let i=0;i<120;i++){
    const q=makeStoryQuestion(s,{skillKey,rng:rngSeq([.17,.63,.31,.89,.42,.74])});
    assert.equal(q.story,true);assert.equal(q.skillKey,skillKey);assertChoices(q);
    assert.ok(q.result>=0&&q.result<=Number(skillKey.split(':')[1]));assert.equal(q.ans,q.result);
    assert.match(q.txt,/\d+/);assert.ok(q.txt.length<=40);
  }
});

test('multiplication and division stories use only exposed matching families',()=>{
  const s=freshState();seedExposure(s);
  for(const family of [1,2,5])for(let i=0;i<80;i++){
    const mul=makeStoryQuestion(s,{skillKey:`mul:${family}`});assert.equal(mul.a,family);assert.ok(mul.b>=1&&mul.b<=9);assert.equal(mul.ans,mul.a*mul.b);assertChoices(mul);
    const div=makeStoryQuestion(s,{skillKey:`div:${family}`});assert.equal(div.divisor,family);assert.equal(div.dividend,div.divisor*div.quotient);assert.equal(div.dividend%div.divisor,0);assert.ok(div.dividend<=81);assertChoices(div);
  }
  assert.throws(()=>makeStoryQuestion(s,{skillKey:'mul:8'}),/not eligible/);
  assert.throws(()=>makeStoryQuestion(s,{skillKey:'div:8'}),/not eligible/);
  for(let i=0;i<200;i++){const q=makeStoryQuestion(s);if(q.op==='mul'||q.op==='div')assert.ok([1,2,5].includes(Number(q.skillKey.split(':')[1])))}
});

test('visual hint models exactly encode representative add sub mul div make10 and make100 problems without answer fields',()=>{
  const questions=[
    {op:'add',a:37,b:28,ans:65,variant:'story-add'},
    {op:'sub',a:73,b:26,ans:47,variant:'story-sub'},
    {op:'mul',a:7,b:6,ans:42,variant:'story-mul'},
    {op:'div',dividend:42,divisor:7,quotient:6,ans:6,variant:'story-div'},
    {op:'sense',variant:'make10',txt:'7 ＋ ? = 10',ans:3},
    {op:'sense',variant:'make100',txt:'60 ＋ ? = 100',ans:40},
  ];
  const [add,sub,mul,div,make10,make100]=questions.map(q=>visualHintModel(q));
  assert.deepEqual(add.steps,[20,8]);assert.equal(add.start,37);assert.equal(add.end,'?');
  assert.deepEqual(sub.steps,[-20,-6]);assert.equal(sub.start,73);assert.equal(sub.end,'?');
  assert.equal(mul.groups.length,6);assert.ok(mul.groups.every(group=>group.length===7));
  assert.equal(div.groups.length,7);assert.ok(div.groups.every(group=>group.length===6));
  assert.equal(make10.cells.filter(x=>x==='filled').length,7);assert.equal(make10.cells.filter(x=>x==='open').length,3);
  assert.equal(make100.rods.filter(x=>x==='filled').length,6);assert.equal(make100.rods.filter(x=>x==='open').length,4);
  for(const q of questions)for(const level of [1,2])assert.equal(visualHintRevealsAnswer(visualHintModel(q,{level}),q),false);
});

test('comparison visual estimates stay paired with shuffled expression choices',()=>{
  const q={op:'sense',variant:'compare',ans:'49 ＋ 0',opts:['81 ＋ 4','49 ＋ 0','26 ＋ 15','50 ＋ 5'],bounds:{target:50,totals:[49,55,41,85]}};
  const model=visualHintModel(q);assert.deepEqual(model.choices.map(choice=>choice.tenBand),[8,4,4,5]);
});

test('stronger visual organization expands the exact operand without exposing the endpoint',()=>{
  const add=visualHintModel({op:'add',a:37,b:28,ans:65},{level:2}),sub=visualHintModel({op:'sub',a:73,b:26,ans:47},{level:2});
  assert.deepEqual(add.steps,[10,10,1,1,1,1,1,1,1,1]);assert.equal(add.steps.reduce((a,b)=>a+b,0),28);assert.equal(add.end,'?');
  assert.deepEqual(sub.steps,[-10,-10,-1,-1,-1,-1,-1,-1]);assert.equal(sub.steps.reduce((a,b)=>a+b,0),-26);assert.equal(sub.end,'?');
});

test('missing-number visual journeys keep the hidden operand behind a question mark',()=>{
  const missingAdd=visualHintModel({op:'add',variant:'missing',a:37,b:28,result:65,ans:37}),missingSubtrahend=visualHintModel({op:'sub',variant:'missing',a:73,b:26,result:47,ans:26}),missingMinuend=visualHintModel({op:'sub',variant:'missing',a:73,b:26,result:47,ans:73});
  assert.deepEqual(missingAdd,{kind:'number-journey',strength:1,start:28,steps:['?'],end:65,copy:'從已知的加數走到總數，問號是中間走了多遠。'});
  assert.deepEqual(missingSubtrahend,{kind:'number-journey',strength:1,start:73,steps:['?'],end:47,copy:'從原本的數走到剩下的數，問號是往回走了多遠。'});
  assert.equal(missingMinuend.start,47);assert.deepEqual(missingMinuend.steps,[20,6]);assert.equal(missingMinuend.end,'?');
});

test('missing multiplication factors remain structurally unknown at both hint levels',()=>{
  const missingGroupSize={op:'mul',variant:'missing',a:7,b:6,result:42,ans:7,txt:'? × 6 = 42'};
  const missingGroupCount={op:'mul',variant:'missing',a:7,b:6,result:42,ans:6,txt:'7 × ? = 42'};
  for(const level of [1,2]){
    const sizeModel=visualHintModel(missingGroupSize,{level});
    assert.equal(sizeModel.kind,'unknown-equal-groups');assert.equal(sizeModel.groupCount,6);assert.equal(sizeModel.groupSize,'?');assert.deepEqual(sizeModel.sampleItems,[]);assert.equal(sizeModel.groups,undefined);
    assert.equal(sizeModel.poolCount,level===2?42:0);assert.equal(visualHintRevealsAnswer(sizeModel,missingGroupSize),false);
    const countModel=visualHintModel(missingGroupCount,{level});
    assert.equal(countModel.kind,'unknown-equal-groups');assert.equal(countModel.groupCount,'?');assert.equal(countModel.groupSize,7);assert.equal(countModel.sampleItems.length,7);assert.equal(countModel.groups,undefined);
    assert.equal(countModel.poolCount,level===2?42:0);assert.equal(visualHintRevealsAnswer(countModel,missingGroupCount),false);
  }
  assert.equal(visualHintRevealsAnswer({kind:'equal-groups',groups:itemGroupsForTest(6,7)},missingGroupSize),true);
  assert.equal(visualHintRevealsAnswer({kind:'equal-groups',groups:itemGroupsForTest(6,7)},missingGroupCount),true);
});

test('missing division divisor remains an unknown group count at both hint levels',()=>{
  const q={op:'div',variant:'missing-divisor',dividend:42,divisor:7,quotient:6,result:6,ans:7};
  for(const level of [1,2]){
    const model=visualHintModel(q,{level});
    assert.equal(model.kind,'unknown-equal-groups');assert.equal(model.knownTotal,42);assert.equal(model.groupCount,'?');assert.equal(model.groupSize,6);assert.equal(model.sampleItems.length,6);assert.equal(model.groups,undefined);
    assert.equal(model.poolCount,level===2?42:0);assert.equal(visualHintRevealsAnswer(model,q),false);
  }
  assert.equal(visualHintRevealsAnswer({kind:'equal-sharing',groups:itemGroupsForTest(7,6)},q),true);
});

test('a missed story keeps its identity through retry spacing and independent revisit',()=>{
  const s=freshState(),q=makeStoryQuestion(s,{skillKey:'add:20',rng:rngSeq([.2,.7,.3,.9,.1,.8])});
  recordSkillMiss(s,q.skillKey);assert.equal(queueSpacedReview(s,q),true);recordSkillSuccess(s,q.skillKey,{firstTry:false});recordSkillSuccess(s,'add:20');recordSkillSuccess(s,'add:20');
  const review=takeDueReview(s,rngSeq([.8,.2,.6,.4]));assert.equal(review.story,true);assert.equal(review.txt,q.txt);assert.equal(questionFingerprint(review),questionFingerprint(q));assertChoices(review);
  assert.equal(completeSpacedReview(s,review),true);recordSkillSuccess(s,review.skillKey,{firstTry:true,isRevisit:true});assert.equal(s.learning.pendingReviews.length,0);
});
