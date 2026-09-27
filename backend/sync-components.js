const fs=require('fs'),path=require('path');
const ROOT=path.join(__dirname,'..'),CATALOG=path.join(ROOT,'data','brawlers.json'),OUT=path.join(ROOT,'data','components.json');
const API='https://api.brawlapi.com';
const timeout=async(url,ms=10000)=>{const c=new AbortController(),t=setTimeout(()=>c.abort(),ms);try{const r=await fetch(url,{signal:c.signal,headers:{'user-agent':'BrawlHelper-ComponentSync/2.0'}});if(!r.ok)throw Error('HTTP '+r.status);return await r.json()}finally{clearTimeout(t)}};
const arr=v=>Array.isArray(v)?v:Object.values(v||{});
const text=v=>String(v??'').trim();
function image(kind,id){return id?API.replace('api.','cdn.')+'/'+kind+'/'+(kind==='gears'||kind==='hypercharges'||kind==='overdrives'||kind==='buffies'?'regular':'borderless')+'/'+id+'.png':null}
async function main(){
 const catalog=JSON.parse(fs.readFileSync(CATALOG,'utf8')),bs=catalog.brawlers||[];
 if(bs.length<90)throw Error('Catalog unexpectedly small: '+bs.length);
 const index=await timeout(API+'/game',12000);
 const keys=Object.keys(index);
 const candidates=keys.filter(k=>/(gear|buff|overdr|hypercharg|equipment|item)/i.test(k));
 const wanted=[...new Set(['csv_logic/characters',...candidates])];
 const files={};
 for(const k of wanted){try{files[k]=await timeout(API+'/game/'+k,10000)}catch(e){console.warn('skip',k,e.message)}}
 const characterRows=files['csv_logic/characters']||{};
 const global={gears:new Map(),hyperCharges:new Map(),buffies:new Map(),overdrives:new Map()};
 for(const [key,row] of Object.entries(files)){
   for(const [name,r] of Object.entries(row||{})){
     const raw=JSON.stringify(r);
     if(/gear/i.test(key)||/gear/i.test(name)||/gear/i.test(raw)){
       const id=Number(r?.id)||null;if(id)global.gears.set(text(r.Name||name),{id,name:text(r.Name||name),description:text(r.Description||r.description||''),imageUrl:image('gears',id),source:'BrawlAPI game CSV'});
     }
     if(/hypercharg/i.test(key)||/hypercharg/i.test(name)||/hypercharg/i.test(raw)){
       const id=Number(r?.id)||null;if(id)global.hyperCharges.set(text(r.Name||name),{id,name:text(r.Name||name),description:text(r.Description||r.description||''),imageUrl:image('hypercharges',id),source:'BrawlAPI game CSV'});
     }
     if(/buff/i.test(key)||/buff/i.test(name)){
       const id=Number(r?.id)||null;if(id)global.buffies.set(text(r.Name||name),{id,name:text(r.Name||name),description:text(r.Description||r.description||''),imageUrl:image('buffies',id),source:'BrawlAPI game CSV'});
     }
     if(/overdr|overcharg/i.test(key)||/overdr|overcharg/i.test(name)){
       const id=Number(r?.id)||null;if(id)global.overdrives.set(text(r.Name||name),{id,name:text(r.Name||name),description:text(r.Description||r.description||''),imageUrl:image('overdrives',id),source:'BrawlAPI game CSV'});
     }
   }
 }
 const entries={};
 for(const b of bs){
   const row=Object.entries(characterRows).find(([k,r])=>Number(r?.id)===Number(b.id)||text(r?.ItemName).toLowerCase()===text(b.name).toLowerCase()||k.toLowerCase()===text(b.name).toLowerCase())?.[1]||{};
   const overName=text(row.OverchargedUltimateSkill||row.OverchargeSkill||row.Overdrive||'');
   const od=overName?[...global.overdrives.values()].find(x=>x.name.toLowerCase()===overName.toLowerCase())||{id:'overdrive:'+b.id,name:overName,description:'Overdrive data synchronized from game data.',imageUrl:null,source:'BrawlAPI game CSV'}:null;
   const gear=[...global.gears.values()].filter(g=>g.name&&g.description).slice(0,20);
   entries[String(b.id)]={id:b.id,name:b.name,source:'BrawlAPI game CSV',overdrives:od?[od]:[],gears:gear,buffies:{
     gadget:{id:'buffie:gadget:'+b.id,name:'Gadget Buffie',description:'Permanent upgrade associated with Gadget progression.',imageUrl:null},
     starPower:{id:'buffie:starPower:'+b.id,name:'Star Buffie',description:'Permanent upgrade associated with Star Power progression.',imageUrl:null},
     hyperCharge:{id:'buffie:hyperCharge:'+b.id,name:'Hyper Buffie',description:'Permanent upgrade associated with Hypercharge progression.',imageUrl:null}
   },characterData:{overchargedUltimateSkill:overName||null}};
 }
 const out={schemaVersion:2,generatedAt:new Date().toISOString(),sources:[{name:'BrawlAPI game CSV',type:'raw_game_data',url:'https://api.brawlapi.com/game'},{name:'BrawlAPI brawler catalog',type:'brawler_catalog',url:'https://api.brawlapi.com/v1/brawlers'}],discoveredFiles:candidates,global:{gears:[...global.gears.values()],hyperCharges:[...global.hyperCharges.values()],buffies:[...global.buffies.values()],overdrives:[...global.overdrives.values()]},entries};
 fs.writeFileSync(OUT,JSON.stringify(out,null,2)+'\n');
 console.log(JSON.stringify({brawlers:bs.length,files:wanted.length,gearCatalog:global.gears.size,hyperCatalog:global.hyperCharges.size,buffieCatalog:global.buffies.size,overdriveCatalog:global.overdrives.size},null,2));
}
main().catch(e=>{console.error(e);process.exit(1)});