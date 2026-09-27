const fs=require('fs'),path=require('path');
const ROOT=path.join(__dirname,'..'),CATALOG=path.join(ROOT,'data','brawlers.json'),OUT=path.join(ROOT,'data','components.json');
async function get(url){const ctl=new AbortController(),t=setTimeout(()=>ctl.abort(),10000);try{const r=await fetch(url,{headers:{'user-agent':'BrawlHelper-ComponentSync/1.0'},signal:ctl.signal});if(!r.ok)throw Error('HTTP '+r.status);return await r.json()}finally{clearTimeout(t)}}
const norm=s=>String(s||'').toUpperCase().replace(/[^A-Z0-9]+/g,' ').trim();
async function main(){
 const catalog=JSON.parse(fs.readFileSync(CATALOG,'utf8')),list=catalog.brawlers||[];
 if(list.length<90)throw Error('Catalog unexpectedly small: '+list.length);
 const [gearBoosts,characters,texts]=await Promise.all([
  get('https://api.brawlapi.com/game/csv_logic/gear_boosts'),
  get('https://api.brawlapi.com/game/csv_logic/characters'),
  get('https://api.brawlapi.com/game/localization/texts')
 ]);
 const gearRows=Object.values(gearBoosts||{}).filter(x=>x&&x.Name);
 const textMap=new Map(Object.values(texts||{}).map(x=>[x.TID||x.Name,x.EN||x.IT||x.name||'']));
 const gears=gearRows.map(g=>({id:'gear:'+g.Name,name:textMap.get(g.TID)||g.Name,internalName:g.Name,rarity:g.Rarity,availableToAll:!g.ExtraHerosAvailableTo,extraHeroes:String(g.ExtraHerosAvailableTo||'').split(',').map(norm).filter(Boolean),deprecated:g.HeroDeprecated===true,description:textMap.get(g.InfoTID)||'',infoTid:g.InfoTID||null,titleTid:g.TID||null,modifierValue:g.ModifierValue??null,modifierType:g.ModifierType||null,iconExportName:g.IconExportName||null})).filter(g=>!g.deprecated);
 const charRows=Object.values(characters||{}),byItem=new Map(charRows.filter(x=>x&&x.ItemName).map(x=>[norm(x.ItemName),x]));
 const out={schemaVersion:2,generatedAt:new Date().toISOString(),source:'BrawlAPI game CSV mirror',sources:[{name:'BrawlAPI gear_boosts',url:'https://api.brawlapi.com/game/csv_logic/gear_boosts'},{name:'BrawlAPI characters',url:'https://api.brawlapi.com/game/csv_logic/characters'},{name:'BrawlAPI localization',url:'https://api.brawlapi.com/game/localization/texts'}],note:'Validated game-data catalog for Gear availability and descriptions. Overdrive/Buffie descriptions are not inferred when the public game-data mirror does not expose a validated component record.',globalGears:gears,entries:{}};
 for(const b of list){
  const internal=norm(b.hash||b.path||b.name),row=byItem.get(internal);
  const available=gears.filter(g=>g.availableToAll||g.extraHeroes.includes(internal)).map(g=>({...g}));
  out.entries[String(b.id)]={id:b.id,name:b.name,gears:available,overdrives:[],buffies:{gadget:{id:'buffie:gadget',name:'Gadget Buffie',available:false},starPower:{id:'buffie:starPower',name:'Star Buffie',available:false},hyperCharge:{id:'buffie:hyperCharge',name:'Hyper Buffie',available:false}},gameCharacter:row?.Name||null};
 }
 fs.writeFileSync(OUT,JSON.stringify(out,null,2)+'\n');
 console.log(JSON.stringify({brawlers:list.length,globalGears:gears.length,avgGears:Math.round(Object.values(out.entries).reduce((a,x)=>a+x.gears.length,0)/list.length)},null,2));
}
main().catch(e=>{console.error(e);process.exit(1)})