const fs=require('fs'),path=require('path');
const ROOT=path.join(__dirname,'..');
const CATALOG=path.join(ROOT,'data','brawlers.json');
const BUILD=path.join(ROOT,'data','build-meta.json');
const COMPONENTS=path.join(ROOT,'data','components.json');
const OUT=path.join(ROOT,'data','brawler-profiles.json');
async function get(url){const ctl=new AbortController(),t=setTimeout(()=>ctl.abort(),12000);try{const r=await fetch(url,{headers:{'user-agent':'BrawlHelper-ProfileSync/1.0'},signal:ctl.signal});if(!r.ok)throw Error('HTTP '+r.status);return await r.json()}finally{clearTimeout(t)}}
const clean=s=>String(s||'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
const norm=s=>String(s||'').toUpperCase().replace(/[^A-Z0-9]+/g,' ').trim();
const firstNonEmpty=(...v)=>v.find(x=>x!==null&&x!==undefined&&x!=='')??null;
function skillDef(key,skills,textMap){
 if(!key)return null;
 const row=skills[key]||Object.values(skills).find(x=>norm(x?.Name||x?.name)===norm(key));
 if(!row)return {key,name:key,description:null,source:'BrawlAPI game CSV',status:'REFERENCE_ONLY'};
 const tid=row.TID||row.InfoTID||row.DescriptionTID;
 return {key,name:textMap.get(row.TID)||textMap.get(row.Name)||row.Name||key,description:clean(textMap.get(row.InfoTID)||textMap.get(row.DescriptionTID)||row.Description||row.description||''),source:'BrawlAPI game CSV',status:'VERIFIED',raw:{tid:row.TID||null,infoTid:row.InfoTID||null}};
}
async function main(){
 const catalog=JSON.parse(fs.readFileSync(CATALOG,'utf8')),list=catalog.brawlers||[];
 const build=JSON.parse(fs.readFileSync(BUILD,'utf8')),components=JSON.parse(fs.readFileSync(COMPONENTS,'utf8'));
 if(list.length<90)throw Error('Catalog unexpectedly small: '+list.length);
 const [characters,skills,texts]=await Promise.all([
  get('https://api.brawlapi.com/v2/raw/csv_logic/characters').then(x=>x.data||{}),
  get('https://api.brawlapi.com/v2/raw/csv_logic/skills').then(x=>x.data||{}),
  get('https://api.brawlapi.com/v2/raw/localization/texts').then(x=>x.data||{})
 ]);
 const textMap=new Map(Object.values(texts).map(x=>[x.TID||x.Name,x.EN||x.IT||x.name||'']));
 const rows=Object.values(characters),byId=new Map(rows.map(x=>[Number(x.id),x])),byName=new Map(rows.map(x=>[norm(x.Name||x.ItemName),x]));
 const profiles={schemaVersion:1,generatedAt:new Date().toISOString(),sources:[
  {name:'BrawlAPI Brawler catalog',url:'https://api.brawlapi.com/v1/brawlers'},
  {name:'BrawlAPI characters CSV',url:'https://api.brawlapi.com/v2/raw/csv_logic/characters'},
  {name:'BrawlAPI skills CSV',url:'https://api.brawlapi.com/v2/raw/csv_logic/skills'},
  {name:'BrawlAPI localization',url:'https://api.brawlapi.com/v2/raw/localization/texts'},
  {name:'Brawl Helper community build snapshot',url:'https://www.noff.gg/brawl-stars/app/builds/'}
 ],entries:{}};
 for(const b of list){
  const ch=byId.get(Number(b.id))||byName.get(norm(b.name))||null;
  const comp=components.entries?.[String(b.id)]||{};
  const meta=build.entries?.[b.name]||{};
  const attack=skillDef(ch?.WeaponSkill,skills,textMap),superDef=skillDef(ch?.UltimateSkill,skills,textMap),hyperDef=skillDef(ch?.OverchargedUltimateSkill,skills,textMap);
  const abilities={
   gadgets:(b.gadgets||[]).map(x=>({id:x.id,name:x.name,description:x.description||'',imageUrl:x.imageUrl||null,released:x.released!==false})),
   starPowers:(b.starPowers||[]).map(x=>({id:x.id,name:x.name,description:x.description||'',imageUrl:x.imageUrl||null,released:x.released!==false})),
   hyperCharges:(b.hyperCharges?.length?b.hyperCharges:((ch?.OverchargedUltimateSkill&&hyperDef?.status==='VERIFIED')?[{id:'hyper:'+ch.OverchargedUltimateSkill,name:hyperDef.name,description:hyperDef.description||'',imageUrl:null,released:true,source:'BrawlAPI game CSV'}]:[])).map(x=>({...x,source:x.source||'BrawlAPI'})),
   overdrives:(comp.overdrives||[]),
   buffies:{gadget:comp.buffies?.gadget||null,starPower:comp.buffies?.starPower||null,hyperCharge:comp.buffies?.hyperCharge||null},
   gears:comp.gears||[]
  };
  const coverage={
   identity:!!(b.id&&b.name),
   portrait:!!(b.imageUrl2||b.imageUrl),
   rarity:!!b.rarity?.name,
   role:!!b.class?.name,
   lore:!!b.description,
   attack:!!attack,
   super:!!superDef,
   gadgets:abilities.gadgets.length>0,
   starPowers:abilities.starPowers.length>0,
   gears:abilities.gears.length>0,
   hyperCharge:abilities.hyperCharges.length>0,
   overdrive:abilities.overdrives.length>0,
   buffies:Object.values(abilities.buffies).filter(Boolean).length===3,
   meta:!!(meta.stats||meta.noff||meta.gadget?.length||meta.starPower?.length||meta.gears?.length)
  };
  const coreComplete=coverage.identity&&coverage.portrait&&coverage.rarity&&coverage.role&&coverage.lore&&coverage.attack&&coverage.super&&coverage.gadgets&&coverage.starPowers&&coverage.gears;
  const optionalKnown=Object.entries({hyperCharge:coverage.hyperCharge,overdrive:coverage.overdrive,buffies:coverage.buffies}).filter(([,v])=>v).length;
  const score=Math.round(((Object.values(coverage).filter(Boolean).length)/Object.keys(coverage).length)*100);
  const complete=Object.values(coverage).every(Boolean);
  const usable=coreComplete&&coverage.meta;
  const optionalStatus={hyperCharge:coverage.hyperCharge?'VERIFIED':'UNKNOWN',overdrive:coverage.overdrive?'VERIFIED':'UNKNOWN',buffies:coverage.buffies?'VERIFIED':'UNKNOWN'};
  profiles.entries[String(b.id)]={
   id:b.id,name:b.name,identity:{assetId:b.assetId,avatarId:b.avatarId,rarity:b.rarity||null,class:b.class||null,description:b.description||'',shortDescription:b.shortDescription||''},
   portrait:{imageUrl:b.imageUrl||null,imageUrl2:b.imageUrl2||null},
   baseStats:ch?{health:firstNonEmpty(ch.Hitpoints,ch.Health),speed:firstNonEmpty(ch.Speed),attackDamage:firstNonEmpty(ch.AutoAttackDamage),attackBullets:firstNonEmpty(ch.AutoAttackBulletsPerShot),attackRange:firstNonEmpty(ch.AutoAttackRange),reloadMs:firstNonEmpty(ch.AutoAttackSpeedMs),regeneratePerSecond:firstNonEmpty(ch.RegeneratePerSecond),superChargeMultiplier:firstNonEmpty(ch.UltiChargeMul),superChargeDivider:firstNonEmpty(ch.UltiChargeDiv)}:null,
   attack,super:superDef,hyperCharge:hyperDef,
   abilities,meta,
   coverage:{complete,usable,coreComplete,score,fields:coverage,optionalKnown,optionalStatus,missing:Object.entries(coverage).filter(([,ok])=>!ok).map(([k])=>k)},
   sources:{catalog:'BrawlAPI',gameData:'BrawlAPI game CSV',buildMeta:meta.sourceUrl||meta.noff?.sourceUrl||null}
  };
 }
 const vals=Object.values(profiles.entries);
 profiles.quality={brawlers:vals.length,coreComplete:vals.filter(x=>x.coverage.coreComplete).length,complete:vals.filter(x=>x.coverage.complete).length,partial:vals.filter(x=>!x.coverage.complete).length,usable:vals.filter(x=>x.coverage.usable).length,averageScore:Math.round(vals.reduce((a,x)=>a+x.coverage.score,0)/vals.length),missingByField:Object.fromEntries([...new Set(vals.flatMap(x=>x.coverage.missing))].map(k=>[k,vals.filter(x=>x.coverage.missing.includes(k)).length]))};
 fs.writeFileSync(OUT,JSON.stringify(profiles,null,2)+'\n');
 console.log(JSON.stringify(profiles.quality,null,2));
 if(profiles.quality.coreComplete<profiles.quality.brawlers-2)throw Error('Unexpected core Brawler profile gap: '+(profiles.quality.brawlers-profiles.quality.coreComplete));
}
main().catch(e=>{console.error(e);process.exit(1)})