(function(){
  'use strict';
  function num(v,f=0){const n=Number(v);return Number.isFinite(n)?n:f}
  function clamp(v,a=0,b=100){return Math.max(a,Math.min(b,v))}
  function scoreFromMeta(meta){if(!meta)return null;const s=num(meta.score,NaN);return Number.isFinite(s)?clamp(s):null}
  function confidenceWeight(c){return c==='high'?1:c==='medium'?.82:c==='low'?.58:.4}
  function buildUsage(item){return clamp(num(item?.pick,0))}
  function componentPriority(type,usage,metaScore,confidence){
    const base={POWER:100,BUY:72,EQUIP:58,CHECK:24,UNLOCK:100}[type]||30;
    const usageBoost=usage*.34;
    const contextBoost=metaScore==null?0:metaScore*.12;
    const confidenceBoost=confidence*.10;
    return base+usageBoost+contextBoost+confidenceBoost;
  }
  function addComponentAction(actions,b,type,item,ctx,metaScore,confidence){
    if(!item||!item.name||/^data pending$/i.test(String(item.name)))return;
    const state=ctx.itemStatus(b,type,item),usage=buildUsage(item),priority=componentPriority(state==='NOT OWNED'?'BUY':state==='OWNED'?'EQUIP':state==='UNKNOWN'?'CHECK':'READY',usage,metaScore,confidence);
    if(state==='NOT OWNED')actions.push({type:'BUY',componentType:type,label:'Buy '+labelFor(type)+': '+item.name,priority,reason:'Confirmed not owned; the synchronized build signal selects this component.',evidence:{pick:usage,contextScore:metaScore,confidence}});
    else if(state==='OWNED')actions.push({type:'EQUIP',componentType:type,label:'Equip '+labelFor(type)+': '+item.name,priority,reason:'Confirmed owned but not equipped; this is the current synchronized build signal.',evidence:{pick:usage,contextScore:metaScore,confidence}});
    else if(state==='UNKNOWN')actions.push({type:'CHECK',componentType:type,label:'Check '+labelFor(type)+': '+item.name,priority,reason:'Ownership is not exposed reliably by the public profile. Confirm it before buying or equipping.',evidence:{pick:usage,contextScore:metaScore,confidence}});
  }
  function labelFor(type){return type==='starPowers'?'Star Power':type==='hyperCharges'?'Hypercharge':type==='overdrives'?'Overdrive':type==='gears'?'Gear':'Gadget'}
  function nextActions(b,ctx){
    const actions=[];
    if(!ctx.isOwnedAccount(b))return [{type:'UNLOCK',label:'Unlock Brawler',priority:100,reason:'This Brawler is not reported on the connected account.'}];
    if(num(b.power)<11)actions.push({type:'POWER',label:'Reach Power 11',priority:100-num(b.power),reason:'Power progression unlocks the complete build path.',evidence:{currentPower:num(b.power),targetPower:11}});
    const meta=ctx.metaEntry(b,ctx.playMode,ctx.playMap),metaScore=scoreFromMeta(meta),confidence=confidenceWeight(meta?.confidence);
    for(const [label,type,item] of (ctx.buildItems(b)||[]))addComponentAction(actions,b,type,item,ctx,metaScore,confidence);
    for(const [label,type,item] of (ctx.guideComponents?.(b)||[]))if(type==='overdrives')addComponentAction(actions,b,type,item,ctx,metaScore,confidence);
    return actions.sort((a,z)=>z.priority-a.priority);
  }
  function upgradePriority(b,ctx){
    const actions=nextActions(b,ctx),meta=ctx.metaEntry(b,ctx.playMode,ctx.playMap),metaScore=scoreFromMeta(meta),confidence=confidenceWeight(meta?.confidence),readiness=clamp(num(ctx.readiness(b))),topAction=actions[0]?.priority||0;
    const evidenceWeight=metaScore==null?0.35:0.18;
    const score=Math.round(clamp(topAction*(1-evidenceWeight)*.72+(metaScore??50)*evidenceWeight+readiness*.10*confidence));
    return {score,actions:actions.slice(0,4),metaScore,confidence,readiness,evidence:{mode:ctx.playMode,map:ctx.playMap,metaScore,confidence}};
  }
  window.BHRecommendations={nextActions,upgradePriority};
})();