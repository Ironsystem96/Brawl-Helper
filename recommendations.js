(function(){
  'use strict';
  function num(v,f=0){const n=Number(v);return Number.isFinite(n)?n:f}
  function scoreFromMeta(meta){if(!meta)return null;const s=num(meta.score,NaN);return Number.isFinite(s)?Math.max(0,Math.min(100,s)):null}
  function confidenceWeight(c){return c==='high'?1:c==='medium'?.82:c==='low'?.58:.4}
  function buildUsage(item){return Math.max(0,Math.min(100,num(item?.pick,0)))}
  function nextActions(b,ctx){
    const actions=[];
    if(!ctx.isOwnedAccount(b))return [{type:'UNLOCK',label:'Unlock Brawler',priority:100,reason:'This Brawler is not reported on the connected account.'}];
    if(num(b.power)<11)actions.push({type:'POWER',label:'Reach Power 11',priority:100-num(b.power),reason:'Power progression unlocks the complete build path.'});
    for(const [label,type,item] of ctx.buildItems(b)){
      const state=ctx.itemStatus(b,type,item),usage=buildUsage(item);
      if(state==='NOT OWNED')actions.push({type:'BUY',label:'Buy '+label+': '+item.name,priority:70+usage*.4,reason:'You confirmed this component is not owned and the current build data selects it.'});
      else if(state==='OWNED')actions.push({type:'EQUIP',label:'Equip '+label+': '+item.name,priority:55+usage*.3,reason:'You confirmed this component is owned but it is not currently equipped.'});
      else if(state==='UNKNOWN')actions.push({type:'CHECK',label:'Check '+label+': '+item.name,priority:20+usage*.1,reason:'The public profile does not prove ownership. Confirm it to unlock precise BUY/EQUIP guidance.'});
    }
    return actions.sort((a,b)=>b.priority-a.priority);
  }
  function upgradePriority(b,ctx){
    const actions=nextActions(b,ctx),meta=ctx.metaEntry(b,ctx.playMode,ctx.playMap),metaScore=scoreFromMeta(meta),confidence=confidenceWeight(meta?.confidence),readiness=Math.max(0,Math.min(100,num(ctx.readiness(b))));
    const topAction=actions[0]?.priority||0;
    const score=Math.round(Math.min(100,topAction*.72+(metaScore??50)*.18+readiness*.10*confidence));
    return {score,actions:actions.slice(0,4),metaScore,confidence};
  }
  window.BHRecommendations={nextActions,upgradePriority};
})();
