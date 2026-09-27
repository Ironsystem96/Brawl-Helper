const fs=require('fs'),path=require('path');
const ROOT=path.join(__dirname,'..'),CATALOG=path.join(ROOT,'data','brawlers.json'),BUILD=path.join(ROOT,'data','build-meta.json'),OUT=path.join(ROOT,'data','components.json');
async function get(url){const ctl=new AbortController(),t=setTimeout(()=>ctl.abort(),10000);try{const r=await fetch(url,{headers:{'user-agent':'BrawlHelper-ComponentSync/1.0'},signal:ctl.signal});if(!r.ok)throw Error('HTTP '+r.status);return await r.json()}finally{clearTimeout(t)}}
async function brawlFindData(name){
 const slug=String(name||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
 const url='https://www.brawlfind.com/it/brawlers/'+slug;
 try{
  const html=await (async()=>{const ctl=new AbortController(),t=setTimeout(()=>ctl.abort(),8000);try{const r=await fetch(url,{headers:{'user-agent':'BrawlHelper-ComponentSync/1.0'},signal:ctl.signal});if(!r.ok)throw Error('HTTP '+r.status);return await r.text()}finally{clearTimeout(t)}})();
  const clean=x=>String(x||'').replace(/&amp;/g,'&').replace(/&#39;/g,"'").replace(/&quot;/g,'"').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
  const imgs=[];const ir=/<img\b[^>]*>/gi;let m;while((m=ir.exec(html))){const tag=m[0],src=tag.match(/(?:src|data-src)=["']([^"']+)["']/i),alt=tag.match(/(?:alt|title)=["']([^"']+)["']/i);if(src?.[1])imgs.push({url:src[1],alt:clean(alt?.[1]||'')})}
  const text=clean(html),pos=text.toUpperCase().indexOf('OVERDRIVE');
  if(pos<0)return {url};
  const tail=text.slice(pos,pos+2500),lines=tail.split(/(?=IMAGE:)|(?=GADGET)|(?=ABILITÀ STELLARE)|(?=DURATA OVERDRIVE)/);
  const nameLine=lines.find(x=>!/^OVERDRIVE/i.test(x)&&!/^IMAGE:/i.test(x)&&x.length>2)?.trim()||null;
  const matchImg=imgs.find(x=>x.alt&&nameLine&&x.alt.toUpperCase().includes(nameLine.toUpperCase()))||imgs.slice(0,1)[0]||null;
  return {url,name:nameLine,imageUrl:matchImg?.url||null,raw:tail};
 }catch(e){return {url,error:e.message}}
}
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
 const gears=gearRows.map((g,i)=>({id:'gear:'+g.Name,name:textMap.get(g.TID)||g.Name,internalName:g.Name,rarity:g.Rarity,availableToAll:!g.ExtraHerosAvailableTo,extraHeroes:String(g.ExtraHerosAvailableTo||'').split(',').map(norm).filter(Boolean),deprecated:g.HeroDeprecated===true,description:textMap.get(g.InfoTID)||'',infoTid:g.InfoTID||null,titleTid:g.TID||null,modifierValue:g.ModifierValue??null,modifierType:g.ModifierType||null,iconExportName:g.IconExportName||null,imageUrl:'https://cdn.brawlify.com/gears/regular/'+(g.id||62000000+i)+'.png'})).filter(g=>!g.deprecated);
 const charRows=Object.values(characters||{}),byItem=new Map(charRows.filter(x=>x&&x.ItemName).map(x=>[norm(x.ItemName),x]));
 const skillRows=Object.values(skills||{}),bySkill=new Map(skillRows.filter(x=>x).map(x=>[norm(x.Name||x.name||x.id),x]));
 const build=fs.existsSync(BUILD)?JSON.parse(fs.readFileSync(BUILD,'utf8')):{entries:{}};
 const bfMap={};let next=0;await Promise.all(Array.from({length:10},async()=>{while(true){const i=next++;if(i>=list.length)return;bfMap[String(list[i].id)]=await brawlFindData(list[i].name)}}));
 const out={schemaVersion:4,generatedAt:new Date().toISOString(),source:'BrawlAPI game CSV mirror + BrawlFind Overdrive catalog',sources:[{name:'BrawlAPI gear_boosts',url:'https://api.brawlapi.com/game/csv_logic/gear_boosts'},{name:'BrawlAPI characters',url:'https://api.brawlapi.com/game/csv_logic/characters'},{name:'BrawlAPI localization',url:'https://api.brawlapi.com/game/localization/texts'},{name:'BrawlFind Overdrive catalog',url:'https://www.brawlfind.com/it/brawlers/'}],note:'Validated game-data catalog for Gear availability and descriptions. Overdrive data is synchronized from BrawlAPI game data when available and BrawlFind when the game-data mapping is absent. Buffie data is kept separate from build recommendations.',globalGears:gears,entries:{}};
 for(const b of list){
  const internal=norm(b.hash||b.path||b.name),row=byItem.get(internal);
  const available=gears.filter(g=>g.availableToAll||g.extraHeroes.includes(internal)).map(g=>({...g}));
  const be=build.entries?.[b.name]||{};
  const buffieMap={gadget:(be.buffies||[]).filter(x=>x.slot==='gadget'),starPower:(be.buffies||[]).filter(x=>x.slot==='starPower'),hyperCharge:(be.buffies||[]).filter(x=>x.slot==='hypercharge')};
  const odKey=row?.OverchargedUltimateSkill||null,od=odKey?bySkill.get(norm(odKey)):null;
  const odName=od?(textMap.get(od.TID)||textMap.get(od.Name)||od.Name||od.name||odKey):odKey;
  let overdrive=odKey?{id:'overdrive:'+b.id,skillKey:odKey,name:odName,description:textMap.get(od.InfoTID)||od.Description||od.description||'',source:'BrawlAPI game CSV',imageUrl:null}:null; const bf=bfMap[String(b.id)]||{}; if(!overdrive&&(bf.name||bf.imageUrl)) overdrive={id:'overdrive:'+b.id,name:bf.name||('Overdrive · '+b.name),description:bf.raw||'',source:'BrawlFind',sourceUrl:bf.url,imageUrl:bf.imageUrl||null};
  out.entries[String(b.id)]={id:b.id,name:b.name,gears:available,overdrives:overdrive?[overdrive]:(be.overdrives||[]),buffies:{gadget:buffieMap.gadget,starPower:buffieMap.starPower,hyperCharge:buffieMap.hyperCharge},gameCharacter:row?.Name||null};
 }
 fs.writeFileSync(OUT,JSON.stringify(out,null,2)+'\n');
 console.log(JSON.stringify({brawlers:list.length,globalGears:gears.length,avgGears:Math.round(Object.values(out.entries).reduce((a,x)=>a+x.gears.length,0)/list.length)},null,2));
}
main().catch(e=>{console.error(e);process.exit(1)})