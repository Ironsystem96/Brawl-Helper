(function(){
  'use strict';
  function num(v,f=0){const n=Number(v);return Number.isFinite(n)?n:f}
  function clamp(v,a=0,b=100){return Math.max(a,Math.min(b,v))}
  function metaScore(meta){const n=num(meta?.score,NaN);return Number.isFinite(n)?clamp(n):null}
  function confidenceWeight(c){return c==='high'?1:c==='medium'?.82:c==='low'?.58:.4}
  function usage(item){return clamp(num(item?.pick,0))}
  function buildSignal(entry,type,item){
    const list=entry?.[type]||[];
    if(!item||!list.length)return {rank:null,total:0,pick:null};
    const sorted=[...list].filter(x=>x?.name).sort((a,b)=>usage(b)-usage(a));
    const rank=sorted.findIndex(x=>String(x.name).toUpperCase()===String(item.name).toUpperCase())+1;
    return {rank:rank>0?rank:null,total:sorted.length,pick:usage(item)};
  }
  function contextLabel(meta,signal){
    if(!meta)return 'NO META DATA';
    if(metaScore(meta)==null)return 'META CONTEXT AVAILABLE';
    if(signal?.rank===1&&signal.pick>0)return 'TOP COMMUNITY PICK';
    if(signal?.rank&&signal.rank<=2)return 'HIGH USAGE PICK';
    return 'AVAILABLE OPTION';
  }
  function componentPriority(type,usageValue,score,confidence){
    const base={POWER:100,BUY:70,EQUIP:55,VERIFY:18,CHECK:18,UNLOCK:100}[type]||30;
    return base+usageValue*.4+(score==null?0:score*.12)+confidence*.1;
  }
  function addComponentAction(actions,b,type,item,ctx,meta,confidence){
    if(!item||!item.name||/^pending:/i.test(String(item.id||'')))return;
    const state=ctx.itemStatus(b,type,item),signal=buildSignal(ctx.buildEntry?.(b)||{},type==='starPowers'?'starPower':type,item);
    const score=metaScore(meta),cname=contextLabel(meta,signal);
    const priority=componentPriority(state==='NOT OWNED'?'BUY':state==='OWNED'?'EQUIP':state==='UNKNOWN'?'CHECK':'READY',signal.pick,score,confidence);
    const evidence={pick:signal.pick,rank:signal.rank,available:signal.total,contextScore:score,confidence};
    if(state==='NOT OWNED')actions.push({type:'BUY',componentType:type,label:'Buy '+labelFor(type)+': '+item.name,priority,reason:cname+'; confirmed not owned.',evidence});
    else if(state==='OWNED')actions.push({type:'EQUIP',componentType:type,label:'Equip '+labelFor(type)+': '+item.name,priority,reason:cname+'; confirmed owned but not equipped.',evidence});
    else if(state==='NOT VERIFIED'||state==='UNKNOWN')actions.push({type:'VERIFY',componentType:type,label:'Verify '+labelFor(type)+': '+item.name,priority,reason:cname+'; ownership is not exposed by the public profile. Mark OWN IT or BUY to personalize the recommendation.',evidence});
  }
  function labelFor(type){return type==='starPowers'?'Star Power':type==='hyperCharges'?'Hypercharge':type==='overdrives'?'Overdrive':type==='gears'?'Gear':'Gadget'}
  function nextActions(b,ctx){
    const actions=[];
    if(!ctx.isOwnedAccount(b))return [{type:'UNLOCK',label:'Unlock Brawler',priority:100,reason:'This Brawler is not reported on the connected account.'}];
    if(num(b.power)<11)actions.push({type:'POWER',label:'Reach Power 11',priority:100-num(b.power),reason:'Power progression unlocks the complete build path.',evidence:{currentPower:num(b.power),targetPower:11}});
    const meta=ctx.metaEntry(b,ctx.playMode,ctx.playMap),confidence=confidenceWeight(meta?.confidence);
    for(const [,type,item] of (ctx.buildItems(b)||[]))addComponentAction(actions,b,type,item,ctx,meta,confidence);
    for(const [,type,item] of (ctx.guideComponents?.(b)||[]))if(type==='overdrives')addComponentAction(actions,b,type,item,ctx,meta,confidence);
    return actions.sort((a,z)=>z.priority-a.priority);
  }
  function upgradePriority(b,ctx){
    const actions=nextActions(b,ctx),meta=ctx.metaEntry(b,ctx.playMode,ctx.playMap),score=metaScore(meta),confidence=confidenceWeight(meta?.confidence),readiness=clamp(num(ctx.readiness(b))),topAction=actions[0]?.priority||0;
    const evidenceWeight=score==null?0.35:0.18;
    const finalScore=Math.round(clamp(topAction*(1-evidenceWeight)*.72+(score??50)*evidenceWeight+readiness*.10*confidence));
    return {score:finalScore,actions:actions.slice(0,4),metaScore:score,confidence,readiness,evidence:{mode:ctx.playMode,map:ctx.playMap,metaScore:score,confidence}};
  }
  window.BHRecommendations={nextActions,upgradePriority};
})();