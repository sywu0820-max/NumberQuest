import {
  mixedSkillKeys,eligibleDivisionSkills,learningSkill,nextChallenge
} from './v05-core.mjs';

export * from './v05-core.mjs';

function rnd(min,max,rng=Math.random){return Math.floor(rng()*(max-min+1))+min}
function shuffled(items,rng=Math.random){
  const out=[...items];
  for(let i=out.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[out[i],out[j]]=[out[j],out[i]]}
  return out;
}
function storyOptions(answer,min,max,rng){
  const values=[answer];let guard=0;
  const spread=max<=10?4:max<=50?10:18;
  while(values.length<4&&guard++<100){
    const value=Math.min(max,Math.max(min,answer+rnd(-spread,spread,rng)));
    if(!values.includes(value))values.push(value);
  }
  for(let value=min;values.length<4&&value<=max;value++)if(!values.includes(value))values.push(value);
  return shuffled(values,rng);
}
function completedExposure(s,key){return Math.max(0,Number(s?.learning?.skillHistory?.[key]?.attempts)||0)}
function storyProbe(s){
  const learning=s?.learning||{};
  return {...s,learning:{...learning,recentSkills:[...(learning.recentSkills||[])],skillHistory:Object.fromEntries(Object.entries(learning.skillHistory||{}).map(([key,value])=>[key,{...(value||{})}]))}};
}

export function storySkillKeys(s,{challengeLevel=3}={}){
  const probe=storyProbe(s),division=new Set(eligibleDivisionSkills(probe));
  return mixedSkillKeys(probe,{challengeLevel}).filter(key=>{
    if(key.startsWith('add:')||key.startsWith('sub:'))return Number(key.split(':')[1])<=100;
    if(key.startsWith('mul:'))return completedExposure(s,key)>=1;
    if(key.startsWith('div:'))return division.has(key);
    return false;
  });
}

export function makeStoryQuestion(s,{skillKey,rng=Math.random,challengeLevel=3}={}){
  const eligible=storySkillKeys(s,{challengeLevel});
  if(!eligible.length)throw new Error('Story Mission requires at least one eligible arithmetic skill');
  if(skillKey!==undefined&&!eligible.includes(skillKey))throw new Error(`Story skill ${skillKey} is not eligible`);
  const key=skillKey??nextChallenge(storyProbe(s),eligible,{rng}),[op,raw]=key.split(':'),family=Number(raw);
  if(op==='add'){
    const a=rnd(1,Math.max(1,family-1),rng),b=rnd(1,Math.max(1,family-a),rng),ans=a+b;
    return {op:'add',variant:'story-add',story:true,storyKind:'add',skillKey:key,a,b,result:ans,ans,optionMin:0,optionMax:family,bounds:{max:family},txt:`你有 ${a} 顆寶石，又找到 ${b} 顆。現在有幾顆？`,hint:'💡 把新找到的寶石拆成「十」和「一」，再一步一步加上去。',opts:storyOptions(ans,0,family,rng)};
  }
  if(op==='sub'){
    const a=rnd(2,family,rng),b=rnd(1,a,rng),ans=a-b;
    return {op:'sub',variant:'story-sub',story:true,storyKind:'sub',skillKey:key,a,b,result:ans,ans,optionMin:0,optionMax:family,bounds:{max:family},txt:`火箭有 ${a} 點能量，用掉 ${b} 點。還剩多少？`,hint:'💡 從火箭原本的能量往回走，先減「十」，再減「一」。',opts:storyOptions(ans,0,family,rng)};
  }
  if(op==='mul'){
    const groups=rnd(1,9,rng),ans=family*groups;
    return {op:'mul',variant:'story-mul',story:true,storyKind:'mul',skillKey:key,a:family,b:groups,result:ans,ans,optionMin:0,optionMax:81,bounds:{factorMax:9,max:81},txt:`每個寶箱放 ${family} 顆星星，${groups} 個寶箱共有幾顆？`,hint:'💡 先畫出每個寶箱，再讓每一箱都放一樣多的星星。',opts:storyOptions(ans,0,81,rng)};
  }
  if(op==='div'){
    const quotient=rnd(1,9,rng),dividend=family*quotient;
    return {op:'div',variant:'story-div',story:true,storyKind:'div',skillKey:key,dividend,divisor:family,quotient,result:quotient,ans:quotient,optionMin:1,optionMax:9,bounds:{dividendMax:81,factorMax:9},txt:`${dividend} 顆星平均放進 ${family} 個寶箱，每箱幾顆？`,hint:`💡 畫出 ${family} 個寶箱，把星星一輪一輪平均放進去。`,opts:storyOptions(quotient,1,9,rng)};
  }
  throw new Error(`Unsupported Story Mission skill: ${key}`);
}

function tensAndOnes(value){return {tens:Math.floor(value/10),ones:value%10}}
function parseFirstNumber(text){return Number(String(text||'').match(/\d+/)?.[0]||0)}
function expressionTotal(text){const values=String(text||'').match(/\d+/g)?.map(Number)||[];return values.reduce((sum,value)=>sum+value,0)}
function itemGroups(groupCount,itemCount){return Array.from({length:groupCount},()=>Array.from({length:itemCount},()=> 'star'))}

export function visualHintModel(q,{level=1}={}){
  const strength=level>=2?2:1;
  if(q?.op==='add'||q?.op==='sub'){
    if(q.variant==='missing'&&q.op==='add'){
      const known=q.a===q.ans?Number(q.b)||0:Number(q.a)||0;
      return {kind:'number-journey',strength,start:known,steps:['?'],end:Number(q.result)||0,copy:'從已知的加數走到總數，問號是中間走了多遠。'};
    }
    if(q.variant==='missing'&&q.op==='sub'&&q.a!==q.ans){
      return {kind:'number-journey',strength,start:Number(q.a)||0,steps:['?'],end:Number(q.result)||0,copy:'從原本的數走到剩下的數，問號是往回走了多遠。'};
    }
    const amount=Number(q.b)||0;
    const parts=tensAndOnes(amount),sign=q.op==='add'?1:-1;
    const steps=[];
    if(strength===1){if(parts.tens)steps.push(sign*parts.tens*10);if(parts.ones)steps.push(sign*parts.ones)}
    else{for(let i=0;i<parts.tens;i++)steps.push(sign*10);for(let i=0;i<parts.ones;i++)steps.push(sign)}
    const inverseMissing=q.variant==='missing'&&q.op==='sub'&&q.a===q.ans;
    return {kind:'number-journey',strength,start:inverseMissing?Number(q.result)||0:Number(q.a)||0,steps:inverseMissing?steps.map(step=>-step):steps,end:'?',copy:inverseMissing?'從剩下的數往前走，把用掉的能量加回去。':q.op==='add'?'從原本的數出發，往前走。':'從原本的數出發，往回走。'};
  }
  if(q?.op==='mul')return {kind:'equal-groups',strength,groups:itemGroups(Number(q.b)||0,Number(q.a)||0),copy:'每一箱都要放一樣多。'};
  if(q?.op==='div'){
    const divisor=Number(q.divisor)||1,quotient=Number(q.quotient)||1;
    const groups=itemGroups(divisor,quotient);
    return {kind:'equal-sharing',strength,groups,copy:`把星星平均放進 ${divisor} 個寶箱。`};
  }
  if(q?.variant==='make10'){
    const filled=parseFirstNumber(q.txt);
    return {kind:'ten-frame',strength,cells:Array.from({length:10},(_,i)=>i<filled?'filled':'open'),copy:'先把十格框填滿。'};
  }
  if(q?.variant==='make100'){
    const filled=Math.floor(parseFirstNumber(q.txt)/10);
    return {kind:'hundred-tens',strength,rods:Array.from({length:10},(_,i)=>i<filled?'filled':'open'),copy:'把 100 想成十條「十」。'};
  }
  if(q?.variant==='compare'){
    return {kind:'target-estimate',strength,target:Number(q.bounds?.target)||0,choices:(q.opts||[]).map(label=>({label,tenBand:Math.floor(expressionTotal(label)/10)})),copy:'先看每個算式大約落在哪個十位。'};
  }
  if(q?.variant==='decompose'){
    const match=String(q.txt||'').match(/^(\d+)\s*＋\s*(\d+).*拆成\s*(\d+)/),whole=Number(match?.[2])||0,first=Number(match?.[3])||0;
    return {kind:'split-number',strength,whole,parts:[first,'?'],copy:'已經拿出一部分去湊整十，剩下的先留空。'};
  }
  return {kind:'strategy-card',strength,copy:'把題目裡的數量畫成小點，再一步一步移動。'};
}

export function visualHintRevealsAnswer(model){
  if(!model||typeof model!=='object')return true;
  const forbidden=/^(ans|answer|result|solution|finalAnswer|answerText)$/i;
  const visit=value=>{
    if(typeof value==='string')return /答案是|等於\s*\d+/.test(value);
    if(Array.isArray(value))return value.some(visit);
    if(value&&typeof value==='object')return Object.entries(value).some(([key,nested])=>forbidden.test(key)||visit(nested));
    return false;
  };
  return visit(model);
}

export function storyLearningSnapshot(s,key){return {...learningSkill(s,key)} }
