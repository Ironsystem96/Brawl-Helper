const fs=require('fs'),path=require('path');
const ROOT=path.join(__dirname,'..'),CATALOG=path.join(ROOT,'data','brawlers.json'),BUILD=path.join(ROOT,'data','build-meta.json'),OUT=path.join(ROOT,'data','components.json');
async function get(url){const ctl=new AbortController(),t=setTimeout(()=>ctl.abort(),10000);try{const r=await fetch(url,{headers:{'user-agent':'BrawlHelper-ComponentSync/1.0'},signal:ctl.signal});if(!r.ok)throw Error('HTTP '+r.status);return await r.json()}finally{clearTimeout(t)}}
const norm=s=>String(s||'').toUpperCase().replace(/[^A-Z0-9]+/g,' ').trim();
async function main(){
 const catalog=JSON.parse(fs.readFileSync(CATALOG,'utf8')),list=catalog.brawlers||[];
 if(list.length<90)throw Error('Catalog unexpectedly small: '+list.length);
 const [gearBoosts,characters,skills,texts]=await Promise.all([
  get('https://api.brawlapi.com/v2/raw/csv_logic/gear_boosts').then(x=>x.data||{}),
  get('https://api.brawlapi.com/v2/raw/csv_logic/characters').then(x=>x.data||{}),
  get('https://api.brawlapi.com/v2/raw/csv_logic/skills').then(x=>x.data||{}).catch(()=>({})),
  get('https://api.brawlapi.com/v2/raw/localization/texts').then(x=>x.data||{})
 ]);
 const gearRows=Object.values(gearBoosts||{}).filter(x=>x&&x.Name);
 const textMap=new Map(Object.values(texts||{}).map(x=>[x.TID||x.Name,x.EN||x.IT||x.name||'']));
 const gears=gearRows.map((g,i)=>({id:'gear:'+g.Name,name:textMap.get(g.TID)||g.Name,internalName:g.Name,rarity:g.Rarity,availableToAll:!g.ExtraHerosAvailableTo,extraHeroes:String(g.ExtraHerosAvailableTo||'').split(',').map(norm).filter(Boolean),deprecated:g.HeroDeprecated===true,description:textMap.get(g.InfoTID)||'',infoTid:g.InfoTID||null,titleTid:g.TID||null,modifierValue:g.ModifierValue??null,modifierType:g.ModifierType||null,iconExportName:g.IconExportName||null,imageUrl:'https://cdn.brawlify.com/gears/regular/'+(62000000+i)+'.png'})).filter(g=>!g.deprecated);
 const charRows=Object.values(characters||{}),byItem=new Map(charRows.filter(x=>x&&x.ItemName).map(x=>[norm(x.ItemName),x]));
 const skillRows=Object.values(skills||{}),bySkill=new Map(skillRows.filter(x=>x).map(x=>[norm(x.Name||x.name||x.id),x]));
 const build=fs.existsSync(BUILD)?JSON.parse(fs.readFileSync(BUILD,'utf8')):{entries:{}};
 const out={schemaVersion:3,generatedAt:new Date().toISOString(),source:'BrawlAPI game CSV mirror',sources:[{name:'BrawlAPI gear_boosts',url:'https://api.brawlapi.com/game/csv_logic/gear_boosts'},{name:'BrawlAPI characters',url:'https://api.brawlapi.com/game/csv_logic/characters'},{name:'BrawlAPI localization',url:'https://api.brawlapi.com/game/localization/texts'}],note:'Validated game-data catalog for Gear availability and descriptions, supplemented by synchronized community guide data for Overdrive and Buffie descriptions. Community fields remain clearly separated from game-data fields.',globalGears:gears,entries:{}};
 for(const b of list){
  const internal=norm(b.hash||b.path||b.name),row=byItem.get(internal);
  const available=gears.filter(g=>g.availableToAll||g.extraHeroes.includes(internal)).map(g=>({...g}));
  const be=build.entries?.[b.name]||{};
  const buffieMap={gadget:(be.buffies||[]).find(x=>x.slot==='gadget')||null,starPower:(be.buffies||[]).find(x=>x.slot==='starPower')||null,hyperCharge:(be.buffies||[]).find(x=>x.slot==='hypercharge')||null};
  const odKey=row?.OverchargedUltimateSkill||null,od=odKey?bySkill.get(norm(odKey)):null;
  const odName=od?(textMap.get(od.TID)||textMap.get(od.Name)||od.Name||od.name||odKey):odKey;
  const overdrive=odKey?{id:'overdrive:'+b.id,skillKey:odKey,name:odName,description:textMap.get(od.InfoTID)||od.Description||od.description||'',source:'BrawlAPI game CSV'}:null;
  out.entries[String(b.id)]={id:b.id,name:b.name,gears:available,overdrives:overdrive?[overdrive]:(be.overdrives||[]),buffies:{gadget:buffieMap.gadget,starPower:buffieMap.starPower,hyperCharge:buffieMap.hyperCharge},gameCharacter:row?.Name||null};
 }
 fs.writeFileSync(OUT,JSON.stringify(out,null,2)+'\n');
 console.log(JSON.stringify({brawlers:list.length,globalGears:gears.length,avgGears:Math.round(Object.values(out.entries).reduce((a,x)=>a+x.gears.length,0)/list.length)},null,2));
}
main().catch(e=>{console.error(e);process.exit(1)})