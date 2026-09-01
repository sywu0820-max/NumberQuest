const params=new URLSearchParams(location.search),link=document.getElementById('starboxPrototypeReturn');
if(link&&params.get('prototypeReturn')==='starbox-v3'){
  const supported=new Set(['run','add-no-regroup','add-regroup','sub-no-regroup','sub-regroup']);
  const caseId=supported.has(params.get('case'))?params.get('case'):'run';
  const seed=Math.max(1,Math.trunc(Number(params.get('seed'))||1));
  link.href=`starbox-v3.html?${new URLSearchParams({prototype:'starbox-v3',case:caseId,seed:String(seed)})}`;
  link.hidden=false;
}
