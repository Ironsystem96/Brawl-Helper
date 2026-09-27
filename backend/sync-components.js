const fs=require('fs'),path=require('path');
const ROOT=path.join(__dirname,'..'),CATALOG=path.join(ROOT,'data','brawlers.json'),BUILD=path.join(ROOT,'data','build-meta.json'),OUT=path.join(ROOT,'data','components.json');
async function get(url){const ctl=new AbortController(),t=setTimeout(()=>ctl.abort(),10000);try{const r=await fetch(url,{headers:{'user-agent':'BrawlHelper-ComponentSync/1.0'},signal:ctl.signal});if(!r.ok)throw Error('HTTP '+r.status);return await r.json()}finally{clearTimeout(t)}}
async function brawlFindData(name){
 const slug=String(name||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
 const url='https://www.brawlfind.com/it/brawlers/'+slug;
 const direct=async()=>{const ctl=new AbortController(),t=setTimeout(()=>ctl.abort(),8000);try{const r=await fetch(url,{headers:{'user-agent':'Mozilla/5.0 BrawlHelper/1.0'},signal:ctl.signal});if(!r.ok)throw Error('HTTP '+r.status);return await r.text()}finally{clearTimeout(t)}};
 const parseHtml=html=>{
  const clean=x=>String(x||'').replace(/&amp;/g,'&').replace(/&#39;|&apos;/g,"'").replace(/&quot;/g,'"').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
  const imgs=[],ir=/<img\\b[^>]*>/gi;let m;while((m=ir.exec(html))){const tag=m[0],src=tag.match(/(?:src|data-src)=["']([^"']+)["']/i),alt=tag.match(/(?:alt|title)=["']([^"']+)["']/i);if(src?.[1])imgs.push({url:src[1],alt:clean(alt?.[1]||'')})}
  const normAlt=x=>clean(x).toUpperCase().replace(/[^A-Z0-9À-ÖØ-Ý]+/g,' ').trim(),oi=imgs.findIndex(x=>normAlt(x.alt)==='OVERDRIVE');
  if(oi<0)return null;
  const generic=new Set(['OVERDRIVE','SUPER','BUFFIE DELL OVERDRIVE','BUFFIE DELL\'OVERDRIVE','GADGET','ABILITÀ STELLARE','EQUIPAGGIAMENTO']);
  const overImg=imgs.slice(oi+1).find(x=>x.alt&&!generic.has(normAlt(x.alt))&&!normAlt(x.alt).startsWith('BUFFIE'));
  if(!overImg?.alt)return null;
  const text=clean(html),pos=text.toUpperCase().indexOf('OVERDRIVE'),tail=pos>=0?text.slice(pos,pos+1800):'';
  return {url,name:overImg.alt,imageUrl:overImg.url||null,raw:tail};
 };
 try{const html=await direct();const parsed=parseHtml(html);if(parsed)return parsed}catch(e){}
 try{
  const proxy='https://r.jina.ai/http://www.brawlfind.com/it/brawlers/'+slug;
  const ctl=new AbortController(),t=setTimeout(()=>ctl.abort(),10000);
  let md;try{const r=await fetch(proxy,{headers:{'user-agent':'BrawlHelper-ComponentSync/1.0'},signal:ctl.signal});if(!r.ok)throw Error('HTTP '+r.status);md=await r.text()}finally{clearTimeout(t)}
  const lines=md.split(/\r?\n/).map(x=>x.trim()).filter(Boolean),idx=lines.findIndex(x=>/^#+\\s*OVERDRIVE/i.test(x)||/^OVERDRIVE$/i.test(x));if(idx<0)return {url};
  const candidates=lines.slice(idx+1,idx+12).filter(x=>x&&!/^#+\\s*(SUPER|BUFFIE|GADGET|ABILIT)/i.test(x)&&!/^Image:\s*(Overdrive|Super|Buffie)/i.test(x));
  const nameLine=candidates.find(x=>!/^\*/.test(x)&&x.length>2)||null;
  const imageMatch=md.match(/!\\[[^\\]]*\\]\\(([^)]+)\\)/g)?.find(x=>nameLine&&x.toUpperCase().includes(nameLine.toUpperCase()));
  return {url,name:nameLine?nameLine.replace(/^Image:\s*/i,'').replace(/^#+\s*/,'').trim():null,imageUrl:imageMatch?imageMatch.match(/\\(([^)]+)\\)/)?.[1]||null:null,raw:lines.slice(idx,idx+12).join(' ')};
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