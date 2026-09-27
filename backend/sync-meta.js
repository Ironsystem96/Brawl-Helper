const fs=require('fs');
const path=require('path');

const ROOT=path.join(__dirname,'..');
const BUILD_PATH=path.join(ROOT,'data','build-meta.json');
const META_PATH=path.join(ROOT,'data','meta.json');
const CATALOG_PATH=path.join(ROOT,'data','brawlers.json');
const BRAWLAPI='https://api.brawlapi.com/v1/brawlers';
const NOFF='https://www.noff.gg/brawl-stars/app/brawler/';
const BT='https://brawltime.ninja/tier-list/brawler/';

const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const clean=s=>String(s||'').replace(/&amp;/g,'&').replace(/&#39;|&apos;/g,"'").replace(/&quot;/g,'"').replace(/&nbsp;/g,' ').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
const norm=s=>String(s||'').toUpperCase().replace(/[’']/g,"'").replace(/[^A-Z0-9]+/g,' ').trim();

async function get(url){
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),15000);
  try{
    const r=await fetch(url,{headers:{'user-agent':'BrawlHelper-MetaSync/1.0'},signal:controller.signal});
    if(!r.ok)throw new Error(url+' HTTP '+r.status);
    return await r.text();
  }finally{clearTimeout(timer)}
}

function pickSection(text,start,end){
  const a=text.toLowerCase().indexOf(start.toLowerCase());
  if(a<0)return '';
  const b=end?text.toLowerCase().indexOf(end.toLowerCase(),a+start.length):text.length;
  return text.slice(a,b<0?text.length:b);
}

function parsePickList(section){
  const out=[];
  const re=/([A-Z][A-Za-z0-9&'’+:.\- ]{2,70}?)\s+(\d{1,3})%pick/gi;
  let m;
  while((m=re.exec(section))){
    const name=m[1].trim().replace(/^(?:Image|Gadget|Star Power|Gear 1|Gear 2)\s+/i,'');
    if(name && !/pick$/i.test(name))out.push({name,pick:Number(m[2])});
  }
  return out.slice(0,6);
}

function escRe(s){return String(s||'').replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}
function parseNoff(html,brawler){
  const text=clean(html);
  const gadgets=[],starPowers=[],gears=[],overdrives=[],buffies=[];
  const parseNamed=(names)=>{const out=[],low=text.toLowerCase();for(const item of names||[]){const name=item?.name||item,key=String(name).toLowerCase();let i=low.indexOf(key),pick=null;while(i>=0){const m=text.slice(i+key.length,i+key.length+120).match(/\s*(\d{1,3})%\s*pick/i);if(m){pick=Number(m[1]);break}i=low.indexOf(key,i+key.length)}if(pick!=null)out.push({name,pick});}return out;};
  gadgets.push(...parseNamed(brawler?.gadgets));
  starPowers.push(...parseNamed(brawler?.starPowers));
  const gearBlock=pickSection(text,'Gear Pick Rates','Hypercharge');
  const gearOut=[];
  const gearRe=/([A-Z][A-Za-z0-9&'’+:.- ]{2,60}?)\s+([0-9]{1,3})%/g;
  let gm;
  while((gm=gearRe.exec(gearBlock))){
    let name=gm[1].trim().replace(/^Image/i,'').replace(/^(?:Gear\s*)/i,'').replace(/\s+/g,' ');
    if(!name||/^(?:Gear Pick Rates|Damage|Speed|Shield|Health|Vision|Gadget Cooldown|Reload Speed|Super Charge|Pet Power|Talk to the Hand|Thicc Head|Exhausting Storm|Quadruplets|Super Turret)$/i.test(name) && false) continue;
    if(!gearOut.some(x=>norm(x.name)===norm(name)))gearOut.push({name,pick:Number(gm[2])});
  }
  gears.push(...gearOut.slice(0,6));
  // NOFF exposes the current Overdrive and the three Buffie effects in the brawler page.
  // Keep them as named guide data so the frontend does not have to infer them from slots.
  const odPatterns=[
    /Overdrive\s+(?:Image\s*:?\s*)?([A-Z][A-Za-z0-9&'’:+.\- ]{2,70}?)(?=\s+(?:Image\s*:?\s*)?Super\b|\s+Super\b|\s+Buffie\b|\s+Damage\b|\s+Speed\b|\s+Shield\b)/i,
    /Overdrive[\s\S]{0,250}?(?:Image\s*:?\s*)?([A-Z][A-Za-z0-9&'’:+.\- ]{2,70}?)(?=\s+(?:Super|Buffie))/i
  ];
  let odMatch=null;
  for(const re of odPatterns){const m=text.match(re);if(m){odMatch=m;break}}
  if(odMatch){
    const name=odMatch[1].trim().replace(/^Image\s*:?\s*/i,'').replace(/\s+/g,' ');
    if(name && !/^(?:Overdrive|Super|Buffie)$/i.test(name)) overdrives.push({id:'od:'+norm(brawler?.name||name).replace(/ /g,'_'),name,description:''});
  }
  const bNames=[
    ...(brawler?.gadgets||[]).map(x=>({slot:'gadget',name:x?.name})),
    ...(brawler?.starPowers||[]).map(x=>({slot:'starPower',name:x?.name}))
  ];
  for(const x of bNames){
    if(!x.name)continue;
    const re=new RegExp(escRe(x.name)+'[\\s\\S]{0,1200}?(?:Image\\s*:?\\s*)?Buffie(?:\\s*:\\s*|\\s+)([^\\.]{10,500}\\.)','i');
    const bm=text.match(re);
    if(bm)buffies.push({id:'buffie:'+x.slot+':'+norm(brawler.name).replace(/ /g,'_'),slot:x.slot,source:x.name,name:x.name+' Buffie',description:bm[1].trim()});
  }
  const hcName=brawler?.name+' Hypercharge';
  const hcIdx=text.toLowerCase().indexOf('hypercharge');
  if(hcIdx>=0){
    const tail=text.slice(hcIdx,hcIdx+1800);
    const bm=tail.match(/Buffie\s*:\s*([^\.]{10,500}\.)/i);
    if(bm)buffies.push({id:'buffie:hypercharge:'+norm(brawler.name).replace(/ /g,'_'),slot:'hypercharge',source:'Hypercharge',name:'Hypercharge Buffie',description:bm[1].trim()});
  }
  const stats={winRate:Number((text.match(/Win Rate\s*\(?([0-9.]+)%/i)||[])[1]||'NaN'),pickRate:Number((text.match(/Pick Rate\s*\(?([0-9.]+)%/i)||[])[1]||'NaN')};
  if(!Number.isFinite(stats.winRate))stats.winRate=null;
  if(!Number.isFinite(stats.pickRate))stats.pickRate=null;
  const sample=(text.match(/pick % from\s+([\d,]+)\s+builds/i)||text.match(/Curated from\s+([\d,]+)\s+user-created builds/i)||[])[1];
  const modeBlock=pickSection(text,'Best Game Modes','Best Maps');
  const mapBlock=pickSection(text,'Best Maps','Attacks');
  const modeNames=['Showdown','Duo Showdown','Trio Showdown','Bounty','Gem Grab','Heist','Brawl Ball','Hot Zone','Knockout','Wipeout','Basket Brawl','Duels','Hunters'];
  const modes={};
  for(const name of modeNames){const re=new RegExp(escRe(name)+'\\s+([0-9.]+)%\\s*([0-9.]+)%\\s*([0-9.]+)','i');const m=modeBlock.match(re);if(m)modes[name]={winRate:Number(m[1]),pickRate:Number(m[2]),score:Number(m[3])};}
  const maps=[];
  const mapRe=/([A-Za-z0-9][A-Za-z0-9'’&.\- ]{1,70}?)\s+([0-9.]+)%\s*([0-9.]+)%\s*([0-9.]+)/g;
  let mm;
  while((mm=mapRe.exec(mapBlock))){const name=mm[1].trim().replace(/^Image\s*/i,'');if(name&&!/^(?:Map|Win Rate|Pick Rate|Score|Show More)$/i.test(name)&&!/^Best Maps Map Win Rate Pick Rate Score/i.test(name))maps.push({name,winRate:Number(mm[2]),pickRate:Number(mm[3]),score:Number(mm[4])});}
  return {sample:sample?Number(sample.replace(/,/g,'')):null,gadget:gadgets.sort((a,b)=>b.pick-a.pick).slice(0,1),starPower:starPowers.sort((a,b)=>b.pick-a.pick).slice(0,1),gears:gears.sort((a,b)=>b.pick-a.pick).slice(0,6),overdrives,buffies,stats,modes,maps:maps.slice(0,20)};
}
function parseBT(html){
  const text=clean(html);
  const win=(text.match(/Win Rate\s*\(?([0-9.]+)%/i)||text.match(/Tasso di Vincita\s*\(?([0-9.]+)%/i)||[])[1];
  const pick=(text.match(/Pick Rate\s*\(?([0-9.]+)%/i)||text.match(/Tasso di Pick\s*\(?([0-9.]+)%/i)||[])[1];
  const adjusted=(text.match(/Adjusted Win Rate\s*\(?([0-9.]+)%/i)||text.match(/Tasso di Vincita Corretto\s*\(?([0-9.]+)%/i)||[])[1];
  return {winRate:win?Number(win):null,pickRate:pick?Number(pick):null,adjustedWinRate:adjusted?Number(adjusted):null};
}

async function main(){
  const now=new Date().toISOString();
  const catalog=await (await fetch(BRAWLAPI,{headers:{'user-agent':'BrawlHelper-MetaSync/1.0'}})).json();
  const list=catalog.list||[];
  if(list.length<90)throw new Error('BrawlAPI catalog unexpectedly small: '+list.length);

  const previous=fs.existsSync(BUILD_PATH)?JSON.parse(fs.readFileSync(BUILD_PATH,'utf8')):{entries:{}};
  const entries={};
  let noffOk=0,btOk=0;

  for(const b of list){
    const slug=String(b.name).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
    let build=previous.entries?.[b.name]||null;
    let noff=null;
    try{
      const parsed=parseNoff(await get(NOFF+encodeURIComponent(slug)),b);
      noff={sourceUrl:NOFF+slug,stats:parsed.stats,modes:parsed.modes,maps:parsed.maps,sample:parsed.sample};
      if(parsed.gadget.length||parsed.starPower.length||parsed.gears.length||parsed.sample){
        build={sourceUrl:NOFF+slug,sample:parsed.sample,gadget:parsed.gadget,starPower:parsed.starPower,gears:parsed.gears,overdrives:parsed.overdrives,buffies:parsed.buffies};
        noffOk++;
      }
    }catch(e){}
    let stats=previous.entries?.[b.name]?.stats||null;
    try{
      const st=parseBT(await get(BT+encodeURIComponent(slug)));
      if(st.adjustedWinRate||st.winRate){
        stats={sourceUrl:BT+slug,...st,updatedAt:now};
        btOk++;
      }
    }catch(e){}
    entries[b.name]={
      sourceUrl:build?.sourceUrl||NOFF+slug,
      sample:build?.sample??null,
      gadget:build?.gadget||[],
      starPower:build?.starPower||[],
      gears:build?.gears||[],
      overdrives:build?.overdrives||[],
      buffies:build?.buffies||[],
      stats,
      noff:noff||previous.entries?.[b.name]?.noff||null
    };
    await sleep(25);
  }

  const buildMeta={schemaVersion:2,updatedAt:now,sourceStatus:{brawlApi:list.length,noff:noffOk,brawlTimeNinja:btOk},sources:[
    {name:'NOFF',type:'community_build_statistics',url:'https://www.noff.gg/brawl-stars/app/brawler'},
    {name:'Brawl Time Ninja',type:'brawler_statistics',url:'https://brawltime.ninja/tier-list/brawler'},
    {name:'BrawlAPI',type:'game_catalog',url:'https://brawlapi.com/'}
  ],note:'Automatically synchronized community/build/statistics snapshot. Values are source data, not official Supercell recommendations.',entries};
  fs.writeFileSync(BUILD_PATH,JSON.stringify(buildMeta,null,2)+'\n');

  // Contextual meta: mode-level rankings from BrawlMetrics.
  const modeSlugs={
    'Ranked':'ranked',
    'Gem Grab':'gem-grab',
    'Heist':'heist',
    'Bounty':'bounty',
    'Brawl Ball':'brawl-ball',
    'Hot Zone':'hot-zone',
    'Knockout':'knockout',
    'Solo Showdown':'solo-showdown'
  };
  const modeMeta={};
  let modeOk=0;
  function parseBrawlMetricsRanking(html,brawlers){
    const text=clean(html);
    const low=text.toLowerCase();
    const a=low.lastIndexOf('full brawler rankings');
    const section=text.slice(a<0?0:a);
    const sectionLow=section.toLowerCase();
    const out={};
    for(const b of brawlers){
      const i=sectionLow.indexOf(String(b.name).toLowerCase());
      if(i<0)continue;
      const before=section.slice(Math.max(0,i-140),i);
      const after=section.slice(i+String(b.name).length,i+String(b.name).length+120);
      const rm=before.match(/(\d+)\s+[A-Za-z0-9 .&'’+\-]+$/);
      const sm=after.match(/(?:S\+|S|A|B|C|D)\s+(\d+(?:\.\d+)?)%\s+(\d+(?:\.\d+)?)%/);
      if(rm&&sm)out[b.name]={rank:Number(rm[1]),winRate:Number(sm[1]),pickRate:Number(sm[2])};
    }
    return out;
  }
  for(const [modeName,slug] of Object.entries(modeSlugs)){
    try{
      const url='https://brawlmetrics.gg/tier-list/'+slug;
      const html=await get(url);
      const ranking=parseBrawlMetricsRanking(html,list);
      const sample=(clean(html).match(/([\d,]+)\s+battles\s+analyzed/i)||[])[1];
      if(Object.keys(ranking).length>=Math.min(50,list.length)){
        modeMeta[modeName]={name:modeName,sourceUrl:url,updatedAt:now,sample:sample?Number(sample.replace(/,/g,'')):null,entries:ranking};
        modeOk++;
      }
    }catch(e){}
    await sleep(70);
  }
  const metaEntries={};
  for(const b of list){
    const e=entries[b.name];
    const s=e.stats||{};
    const ns=e.noff?.stats||{};
    const base=ns.winRate??s.adjustedWinRate??s.winRate;
    const buildPicks=[...(e.gadget||[]),...(e.starPower||[]),...(e.gears||[])].map(x=>Number(x.pick)).filter(Number.isFinite);
    const buildScore=buildPicks.length?Math.min(100,Math.round(buildPicks.reduce((a,v)=>a+v,0)/buildPicks.length)):50;
    const score=base!=null?Math.round(base):buildScore;
    const modesOut={};
    for(const [modeKey,r] of Object.entries(e.noff?.modes||{}))modesOut[modeKey]={score:r.score,rank:null,winRate:r.winRate,pickRate:r.pickRate,reason:'NOFF battle-trend score',source:'NOFF',confidence:r.pickRate>=0.5?'medium':'low'};
    for(const [modeKey,md] of Object.entries(modeMeta)){
      const r=md.entries?.[b.name];
      if(r&&!modesOut[modeKey])modesOut[modeKey]={score:r.winRate,rank:r.rank,winRate:r.winRate,pickRate:r.pickRate,reason:md.name+' Wilson-adjusted win rate',source:'BrawlMetrics',confidence:r.rank<=10?'medium':'low'};
    }
    metaEntries[b.name]={
      default:{score,rank:null,reason:base!=null?'Brawl Time Ninja adjusted win rate':'Community build data only',source:base!=null?'Brawl Time Ninja':'NOFF',confidence:base!=null?'medium':'low'},
      modes:modesOut,
      maps:Object.fromEntries((e.noff?.maps||[]).map(r=>[r.name,{score:r.score,winRate:r.winRate,pickRate:r.pickRate,source:'NOFF',confidence:r.pickRate>=1?'medium':'low'}]))
    };
  }
  const modeBrawlerCoverage=Object.values(metaEntries).filter(e=>Object.keys(e.modes||{}).length>0).length;
  const meta={schemaVersion:2,updatedAt:now,source:'Brawl Time Ninja + NOFF + optional BrawlMetrics fallback',method:'Global battle signal from Brawl Time Ninja; mode and map context from NOFF when available; BrawlMetrics is an optional fallback.',coverage:{brawlers:list.length,modes:modeBrawlerCoverage,totalModes:Object.keys(modeSlugs).length},entries:metaEntries};
  fs.writeFileSync(META_PATH,JSON.stringify(meta,null,2)+'\n');

  const catalogOut=list.map(b=>({
    id:b.id,name:b.name,assetId:b.id,avatarId:b.avatarId||null,
    imageUrl:b.imageUrl||null,imageUrl2:b.imageUrl2||null,
    rarity:b.rarity||null,class:b.class||null,
    description:b.description||'',shortDescription:b.shortDescription||'',
    gadgets:(b.gadgets||[]).map(x=>({id:x.id,name:x.name,description:x.description||'',descriptionHtml:x.descriptionHtml||'',imageUrl:x.imageUrl||null,released:x.released!==false})),
    starPowers:(b.starPowers||[]).map(x=>({id:x.id,name:x.name,description:x.description||'',descriptionHtml:x.descriptionHtml||'',imageUrl:x.imageUrl||null,released:x.released!==false})),
    gears:(b.gears||[]).map(x=>({id:x.id,name:x.name,description:x.description||'',descriptionHtml:x.descriptionHtml||'',imageUrl:x.imageUrl||null,released:x.released!==false})),
    hyperCharges:(b.hypercharges||b.hyperCharges||[]).map(x=>({id:x.id,name:x.name,description:x.description||'',descriptionHtml:x.descriptionHtml||'',imageUrl:x.imageUrl||null,released:x.released!==false})),
    overdrives:(entries[b.name]?.overdrives||[]).map(x=>({id:x.id,name:x.name,description:x.description||'',descriptionHtml:x.descriptionHtml||'',imageUrl:x.imageUrl||null,released:true})),
    buffies:(entries[b.name]?.buffies||[]).map(x=>({id:x.id,name:x.name,slot:x.slot,source:x.source,description:x.description||'',descriptionHtml:x.description||'',imageUrl:x.imageUrl||null,released:true}))
  }));
  const catalogDocument={schemaVersion:2,generatedFrom:'BrawlAPI catalog snapshot',generatedAt:now,count:catalogOut.length,brawlers:catalogOut};
  fs.writeFileSync(CATALOG_PATH,JSON.stringify(catalogDocument,null,2)+'\n');

  if(noffOk<Math.floor(list.length*.5) || btOk<Math.floor(list.length*.5)) {
    throw new Error('Sync quality gate failed: NOFF '+noffOk+'/'+list.length+', BrawlTime '+btOk+'/'+list.length);
  }
  if(modeOk===0) console.warn('Mode snapshot unavailable: BrawlMetrics returned no validated mode pages. Global meta remains publishable; mode data is omitted rather than fabricated.');
  console.log(JSON.stringify({updatedAt:now,brawlers:list.length,noffOk,btOk,modeOk,totalModes:Object.keys(modeSlugs).length},null,2));
}
main().catch(e=>{console.error(e);process.exit(1)});