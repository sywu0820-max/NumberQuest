import {
  storySkillKeys,nextChallenge,visualHintModel as inheritedVisualHintModel,
  visualHintRevealsAnswer as inheritedVisualHintRevealsAnswer
} from './v07-core.mjs';

export * from './v07-core.mjs';

export const STORY_RELATIONSHIPS=Object.freeze({
  ADD_COMBINE:'add-combine',ADD_INCREASE:'add-increase',
  SUB_REMOVE:'sub-remove',SUB_COMPARE:'sub-compare',
  MUL_EQUAL_GROUPS:'mul-equal-groups',MUL_REPEATED_RATE:'mul-repeated-rate',
  DIV_SHARING:'div-sharing',DIV_GROUPING:'div-grouping'
});

export const STORY_THEMES=Object.freeze([
  {id:'space',label:'太空探險'},{id:'animals',label:'動物朋友'},
  {id:'picnic',label:'野餐食物'},{id:'transport',label:'交通旅行'},
  {id:'building',label:'建造工程'},{id:'ocean',label:'海洋自然'},
  {id:'games',label:'遊戲收集'},{id:'art',label:'美術貼紙'}
]);

const R=STORY_RELATIONSHIPS;
const template=(id,themeId,op,relationshipId,render,hint)=>Object.freeze({id,themeId,op,relationshipId,render,hint});

export const STORY_CATALOG=Object.freeze([
  template('space-add-increase','space','add',R.ADD_INCREASE,q=>`太空船原有 ${q.a} 顆能量晶，又收集了 ${q.b} 顆。現在有幾顆？`,'把後來收集的數量分成十和一，再往前走。'),
  template('space-sub-remove','space','sub',R.SUB_REMOVE,q=>`太空站有 ${q.a} 罐氧氣，用了 ${q.b} 罐。還剩幾罐？`,'從原有的數量往回走，先走十，再走一。'),
  template('space-mul-trips','space','mul',R.MUL_REPEATED_RATE,q=>`探測車每趟帶回 ${q.a} 顆岩石，走了 ${q.b} 趟。共帶回幾顆？`,'把每一趟看成同樣多的一組。'),
  template('space-div-sharing','space','div',R.DIV_SHARING,q=>`${q.dividend} 顆能量球平均分給 ${q.divisor} 艘太空船。每艘分到幾顆？`,'先畫出太空船，再把能量球一輪一輪平均分。'),

  template('animals-add-combine','animals','add',R.ADD_COMBINE,q=>`草地上有 ${q.a} 隻兔子和 ${q.b} 隻小鹿。共有幾隻動物？`,'把兩群動物合在一起數。'),
  template('animals-sub-compare','animals','sub',R.SUB_COMPARE,q=>`松鼠找到 ${q.a} 顆果子，兔子找到 ${q.b} 顆。兩者相差幾顆？`,'從較小的數走到較大的數，看看相隔多遠。'),
  template('animals-mul-baskets','animals','mul',R.MUL_EQUAL_GROUPS,q=>`有 ${q.b} 個飼料籃，每籃放 ${q.a} 根胡蘿蔔。共有幾根？`,'每個籃子都放同樣多，再把各組合起來。'),
  template('animals-div-grouping','animals','div',R.DIV_GROUPING,q=>`有 ${q.dividend} 顆飼料，每袋裝 ${q.divisor} 顆。可以裝成幾袋？`,'先看一袋需要幾顆，再找能裝成幾袋。'),

  template('picnic-add-combine','picnic','add',R.ADD_COMBINE,q=>`野餐籃裡有 ${q.a} 顆蘋果和 ${q.b} 顆橘子。共有幾顆水果？`,'把兩種水果的數量合起來。'),
  template('picnic-sub-remove','picnic','sub',R.SUB_REMOVE,q=>`桌上有 ${q.a} 塊餅乾，大家吃了 ${q.b} 塊。還剩幾塊？`,'從桌上原有的數量往回走。'),
  template('picnic-mul-plates','picnic','mul',R.MUL_EQUAL_GROUPS,q=>`有 ${q.b} 個盤子，每盤放 ${q.a} 顆葡萄。共有幾顆？`,'先排好盤子，讓每盤一樣多。'),
  template('picnic-div-sharing','picnic','div',R.DIV_SHARING,q=>`${q.dividend} 顆草莓平均放在 ${q.divisor} 個盤子。每盤有幾顆？`,'先畫出盤子，再輪流放入草莓。'),

  template('transport-add-increase','transport','add',R.ADD_INCREASE,q=>`公車上原有 ${q.a} 位乘客，又上車 ${q.b} 位。現在有幾位？`,'從原有乘客數往前走。'),
  template('transport-sub-compare','transport','sub',R.SUB_COMPARE,q=>`紅車走了 ${q.a} 公里，藍車走了 ${q.b} 公里。相差幾公里？`,'從較短的距離走到較長的距離。'),
  template('transport-mul-trips','transport','mul',R.MUL_REPEATED_RATE,q=>`小巴每趟載 ${q.a} 位乘客，開了 ${q.b} 趟。共載了幾位？`,'把每一趟相同的人數排成幾組。'),
  template('transport-div-grouping','transport','div',R.DIV_GROUPING,q=>`有 ${q.dividend} 位乘客，每輛車坐 ${q.divisor} 位。需要幾輛車？`,'先看一輛坐幾位，再找需要幾輛。'),

  template('building-add-combine','building','add',R.ADD_COMBINE,q=>`工地有 ${q.a} 塊紅磚和 ${q.b} 塊灰磚。共有幾塊磚？`,'把兩堆磚合起來數。'),
  template('building-sub-remove','building','sub',R.SUB_REMOVE,q=>`材料區有 ${q.a} 根木條，用掉 ${q.b} 根。還剩幾根？`,'從原有木條數量往回走。'),
  template('building-mul-towers','building','mul',R.MUL_EQUAL_GROUPS,q=>`要蓋 ${q.b} 座小塔，每座用 ${q.a} 塊積木。共用幾塊？`,'每座塔使用同樣多的積木。'),
  template('building-div-sharing','building','div',R.DIV_SHARING,q=>`${q.dividend} 塊積木平均分給 ${q.divisor} 組工人。每組分到幾塊？`,'先畫出工作小組，再平均分積木。'),

  template('ocean-add-increase','ocean','add',R.ADD_INCREASE,q=>`水池原有 ${q.a} 隻小魚，又游來 ${q.b} 隻。現在有幾隻？`,'從原有小魚數量往前走。'),
  template('ocean-sub-compare','ocean','sub',R.SUB_COMPARE,q=>`大海龜游了 ${q.a} 公尺，小海龜游了 ${q.b} 公尺。相差幾公尺？`,'從較短的距離走到較長的距離。'),
  template('ocean-mul-days','ocean','mul',R.MUL_REPEATED_RATE,q=>`探險隊每天找到 ${q.a} 顆貝殼，找了 ${q.b} 天。共找到幾顆？`,'把每天找到的數量看成同樣多的一組。'),
  template('ocean-div-grouping','ocean','div',R.DIV_GROUPING,q=>`有 ${q.dividend} 顆貝殼，每盒放 ${q.divisor} 顆。可以裝成幾盒？`,'先看每盒的數量，再找能裝成幾盒。'),

  template('games-add-combine','games','add',R.ADD_COMBINE,q=>`遊戲袋裡有 ${q.a} 顆藍珠和 ${q.b} 顆黃珠。共有幾顆？`,'把兩種珠子的數量合起來。'),
  template('games-sub-remove','games','sub',R.SUB_REMOVE,q=>`玩家有 ${q.a} 枚代幣，換寶物用了 ${q.b} 枚。還剩幾枚？`,'從原有代幣數量往回走。'),
  template('games-mul-chests','games','mul',R.MUL_EQUAL_GROUPS,q=>`有 ${q.b} 個獎勵盒，每盒放 ${q.a} 枚代幣。共有幾枚？`,'每個盒子都放同樣多的代幣。'),
  template('games-div-sharing','games','div',R.DIV_SHARING,q=>`${q.dividend} 枚代幣平均分給 ${q.divisor} 位玩家。每位分到幾枚？`,'先畫出玩家，再輪流平均分代幣。'),

  template('art-add-increase','art','add',R.ADD_INCREASE,q=>`畫冊原有 ${q.a} 張貼紙，又貼上 ${q.b} 張。現在有幾張？`,'從原有貼紙數量往前走。'),
  template('art-sub-compare','art','sub',R.SUB_COMPARE,q=>`小安畫了 ${q.a} 顆星，小樂畫了 ${q.b} 顆。兩者相差幾顆？`,'從較小的數走到較大的數。'),
  template('art-mul-rows','art','mul',R.MUL_REPEATED_RATE,q=>`海報每排畫 ${q.a} 個圓點，共畫 ${q.b} 排。有幾個圓點？`,'把每一排看成同樣多的一組。'),
  template('art-div-grouping','art','div',R.DIV_GROUPING,q=>`有 ${q.dividend} 張貼紙，每頁貼 ${q.divisor} 張。可以貼滿幾頁？`,'先看每頁貼幾張，再找能貼滿幾頁。')
]);

const clampRoll=rng=>Math.min(.999999999,Math.max(0,Number(rng())||0));
function rnd(min,max,rng=Math.random){return Math.floor(clampRoll(rng)*(max-min+1))+min}
function shuffled(items,rng=Math.random){const out=[...items];for(let i=out.length-1;i>0;i--){const j=Math.floor(clampRoll(rng)*(i+1));[out[i],out[j]]=[out[j],out[i]]}return out}
function storyOptions(answer,min,max,rng){
  const values=[answer],spread=max<=10?4:max<=50?10:18;let guard=0;
  while(values.length<4&&guard++<100){const value=Math.min(max,Math.max(min,answer+rnd(-spread,spread,rng)));if(!values.includes(value))values.push(value)}
  for(let value=min;values.length<4&&value<=max;value++)if(!values.includes(value))values.push(value);
  return shuffled(values,rng);
}
function storyProbe(s){
  const learning=s?.learning||{};
  return {...s,learning:{...learning,recentSkills:[...(learning.recentSkills||[])],skillHistory:Object.fromEntries(Object.entries(learning.skillHistory||{}).map(([key,value])=>[key,{...(value||{})}]))}};
}

export function selectStoryTemplate({op,relationshipId,recentTemplateIds=[],recentThemeIds=[],rng=Math.random}={}){
  let eligible=STORY_CATALOG.filter(item=>item.op===op&&(!relationshipId||item.relationshipId===relationshipId));
  if(!eligible.length)throw new Error(`No story template for ${op||'unknown operation'}${relationshipId?` / ${relationshipId}`:''}`);
  const templateExclusions=new Set(recentTemplateIds),withoutTemplates=eligible.filter(item=>!templateExclusions.has(item.id));
  if(withoutTemplates.length)eligible=withoutTemplates;
  const themeExclusions=new Set(recentThemeIds),withoutThemes=eligible.filter(item=>!themeExclusions.has(item.themeId));
  if(withoutThemes.length)eligible=withoutThemes;
  return eligible[Math.floor(clampRoll(rng)*eligible.length)];
}

function storyMath(op,family,relationshipId,rng){
  if(op==='add'){
    const a=rnd(1,Math.max(1,family-1),rng),b=rnd(1,Math.max(1,family-a),rng),ans=a+b;
    return {a,b,result:ans,ans,optionMin:0,optionMax:family,bounds:{max:family}};
  }
  if(op==='sub'){
    const a=rnd(2,family,rng),upper=relationshipId===R.SUB_COMPARE?Math.max(1,a-1):a,b=rnd(1,upper,rng),ans=a-b;
    return {a,b,result:ans,ans,optionMin:0,optionMax:family,bounds:{max:family}};
  }
  if(op==='mul'){
    const b=rnd(1,9,rng),ans=family*b;
    return {a:family,b,result:ans,ans,optionMin:0,optionMax:81,bounds:{factorMax:9,max:81}};
  }
  if(op==='div'){
    const quotient=rnd(1,9,rng),dividend=family*quotient;
    return {dividend,divisor:family,quotient,result:quotient,ans:quotient,optionMin:1,optionMax:9,bounds:{dividendMax:81,factorMax:9}};
  }
  throw new Error(`Unsupported Story Mission operation: ${op}`);
}

export function renderStoryTemplate(definition,math){
  if(!definition||!STORY_CATALOG.includes(definition))throw new Error('Story rendering requires a catalog template');
  return {txt:definition.render(math),hint:`💡 ${definition.hint}`};
}

export function makeStoryQuestion(s,{skillKey,rng=Math.random,challengeLevel=3,relationshipId,recentTemplateIds=[],recentThemeIds=[]}={}){
  const eligible=storySkillKeys(s,{challengeLevel});
  if(!eligible.length)throw new Error('Story Mission requires at least one eligible arithmetic skill');
  if(skillKey!==undefined&&!eligible.includes(skillKey))throw new Error(`Story skill ${skillKey} is not eligible`);
  const key=skillKey??nextChallenge(storyProbe(s),eligible,{rng}),[op,raw]=key.split(':'),family=Number(raw);
  const definition=selectStoryTemplate({op,relationshipId,recentTemplateIds,recentThemeIds,rng}),math=storyMath(op,family,definition.relationshipId,rng),surface=renderStoryTemplate(definition,math);
  return {
    op,variant:`story-${op}`,story:true,storyKind:definition.relationshipId,skillKey:key,...math,...surface,
    storyTemplateId:definition.id,storyThemeId:definition.themeId,storyRelationshipId:definition.relationshipId,
    opts:storyOptions(math.ans,math.optionMin,math.optionMax,rng)
  };
}

export function makeStoryRun(s,{count=10,skillKey,rng=Math.random,challengeLevel=3}={}){
  const questions=[],recentTemplateIds=[],recentThemeIds=[];
  for(let i=0;i<count;i++){
    const q=makeStoryQuestion(s,{skillKey,rng,challengeLevel,recentTemplateIds,recentThemeIds});questions.push(q);
    recentTemplateIds.push(q.storyTemplateId);if(recentTemplateIds.length>5)recentTemplateIds.shift();
    recentThemeIds.push(q.storyThemeId);if(recentThemeIds.length>3)recentThemeIds.shift();
  }
  return questions;
}

export function storyDiversitySummary(questions){
  const items=(questions||[]).filter(q=>q?.story);
  let maxThemeStreak=0,currentTheme=null,currentStreak=0;
  for(const q of items){if(q.storyThemeId===currentTheme)currentStreak+=1;else{currentTheme=q.storyThemeId;currentStreak=1}maxThemeStreak=Math.max(maxThemeStreak,currentStreak)}
  return {
    count:items.length,templateCount:new Set(items.map(q=>q.storyTemplateId)).size,themeCount:new Set(items.map(q=>q.storyThemeId)).size,
    immediateTemplateRepeat:items.some((q,i)=>i>0&&q.storyTemplateId===items[i-1].storyTemplateId),
    immediateTextRepeat:items.some((q,i)=>i>0&&q.txt===items[i-1].txt),maxThemeStreak
  };
}

function expandedSteps(amount,sign,strength){
  const tens=Math.floor(amount/10),ones=amount%10,steps=[];
  if(strength===1){if(tens)steps.push(sign*tens*10);if(ones)steps.push(sign*ones)}
  else{for(let i=0;i<tens;i++)steps.push(sign*10);for(let i=0;i<ones;i++)steps.push(sign)}
  return steps;
}

export function visualHintModel(q,{level=1}={}){
  if(!q?.storyRelationshipId)return inheritedVisualHintModel(q,{level});
  const strength=level>=2?2:1,relation=q.storyRelationshipId;
  if(relation===R.ADD_COMBINE||relation===R.ADD_INCREASE)return {kind:'number-journey',strength,start:Number(q.a)||0,steps:expandedSteps(Number(q.b)||0,1,strength),end:'?',copy:relation===R.ADD_COMBINE?'把兩群數量接在一起往前走。':'從原有數量出發，把後來增加的數量往前走。'};
  if(relation===R.SUB_REMOVE)return {kind:'number-journey',strength,start:Number(q.a)||0,steps:expandedSteps(Number(q.b)||0,-1,strength),end:'?',copy:'從原有數量出發，把用掉或離開的數量往回走。'};
  if(relation===R.SUB_COMPARE)return {kind:'number-journey',strength,start:Number(q.b)||0,steps:['?'],end:Number(q.a)||0,copy:'從較小的數走到較大的數，問號是兩者相隔多遠。'};
  if(relation===R.MUL_EQUAL_GROUPS||relation===R.MUL_REPEATED_RATE){
    const groups=Array.from({length:Number(q.b)||0},()=>Array.from({length:Number(q.a)||0},()=> 'star'));
    return {kind:'equal-groups',strength,groups,copy:relation===R.MUL_EQUAL_GROUPS?'每一組都要放一樣多。':'每一次或每一排都有同樣多。'};
  }
  if(relation===R.DIV_SHARING)return {kind:'unknown-equal-groups',strength,knownTotal:Number(q.dividend)||0,groupCount:Number(q.divisor)||0,groupSize:'?',sampleItems:[],poolCount:strength>=2?Number(q.dividend)||0:0,copy:`平均分成 ${q.divisor} 組，每組的數量先留成問號。`};
  if(relation===R.DIV_GROUPING)return {kind:'unknown-equal-groups',strength,knownTotal:Number(q.dividend)||0,groupCount:'?',groupSize:Number(q.divisor)||0,sampleItems:Array.from({length:Number(q.divisor)||0},()=> 'star'),poolCount:strength>=2?Number(q.dividend)||0:0,copy:`每組放 ${q.divisor} 個，組數先留成問號。`};
  return inheritedVisualHintModel(q,{level});
}

export function visualHintKnownTotalLabel(model){
  return Number.isFinite(Number(model?.knownTotal))?`總數：${Number(model.knownTotal)}`:'';
}

export function visualHintRevealsAnswer(model,q){
  if(q?.storyRelationshipId===R.DIV_SHARING&&Boolean(model?.groupSize===q.ans||model?.groups?.some(group=>group?.length===q.ans)))return true;
  if(q?.storyRelationshipId===R.DIV_GROUPING&&Boolean(model?.groupCount===q.ans||model?.groups?.length===q.ans))return true;
  return inheritedVisualHintRevealsAnswer(model,q);
}
