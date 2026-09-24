const fs=require('fs');
const path=require('path');

const ROOT=path.join(__dirname,'..');
const BUILD_PATH=path.join(ROOT,'data','build-meta.json');
const META_PATH=path.join(ROOT,'data','meta.json');
const CATALOG_PATH=path.join(ROOT,'data','brawlers.json');
const BRAWLAPI='https://api.brawlapi.com/v1/brawlers';
const NOFF='https://www.noff.gg/brawl-stars/app/builds/';
const BT='https://brawltime.ninja/tier-list/brawler/';

const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const clean=s=>String(s||'').replace(/&amp;/g,'&').replace(/&#39;|&apos;/g,"'").replace(/&quot;/g,'"').replace(/&nbsp;/g,' ').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
const norm=s=>String(s||'').toUpperCase().replace(/[’']/g,"'").replace(/[^A-Z0-9]+/g,' ').trim();

async function get(url){
  const r=await fetch(url,{headers:{'user-agent':'BrawlHelper-MetaSync/1.0'}});
  if(!r.ok)throw new Error(url+' HTTP '+r.status);
  return r.text();
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

function parseNoff(html){
  const text=clean(html);
  const gadgets=parsePickList(pickSection(text,'Gadgets','Star Powers'));
  const starPowers=parsePickList(pickSection(text,'Star Powers','Gear Pick Rates'));
  const gears=parsePickList(pickSection(text,'Gear Pick Rates','Hypercharge'));
  const sample=(text.match(/Curated from\s+([\d,]+)\s+user-created builds/i)||[])[1];
  return {
    sample:sample?Number(sample.replace(/,/g,'')):null,
    gadget:gadgets.slice(0,1),
    starPower:starPowers.slice(0,1),
    gears:gears.slice(0,2)
  };
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
    try{
      const parsed=parseNoff(await get(NOFF+encodeURIComponent(slug)));
      if(parsed.gadget.length||parsed.starPower.length||parsed.gears.length||parsed.sample){
        build={sourceUrl:NOFF+slug,sample:parsed.sample,gadget:parsed.gadget,starPower:parsed.starPower,gears:parsed.gears};
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
      stats
    };
    await sleep(80);
  }

  const buildMeta={schemaVersion:2,updatedAt:now,sourceStatus:{brawlApi:list.length,noff:noffOk,brawlTimeNinja:btOk},sources:[
    {name:'NOFF',type:'community_build_statistics',url:'https://www.noff.gg/brawl-stars/app/builds'},
    {name:'Brawl Time Ninja',type:'brawler_statistics',url:'https://brawltime.ninja/tier-list/brawler'},
    {name:'BrawlAPI',type:'game_catalog',url:'https://brawlapi.com/'}
  ],note:'Automatically synchronized community/build/statistics snapshot. Values are source data, not official Supercell recommendations.',entries};
  fs.writeFileSync(BUILD_PATH,JSON.stringify(buildMeta,null,2)+'\n');

  // Contextual meta: mode-level rankings from Brawl Time Ninja.
  // Global and mode data stay separate so the UI can show the actual context rank.
  const modesResp=await (await fetch('https://api.brawlapi.com/v1/gamemodes',{headers:{'user-agent':'BrawlHelper-MetaSync/1.0'}})).json();
  const modes=(modesResp.list||[]).filter(m=>!m.disabled);
  const modeMeta={};
  let modeOk=0;

  function parseModeRanking(html,brawlers){
    const text=clean(html);
    const section=pickSection(text,'Best Brawlers for','Tier List');
    const out={};
    for(const b of brawlers){
      const i=section.toLowerCase().indexOf(String(b.name).toLowerCase());
      if(i<0)continue;
      const before=section.slice(Math.max(0,i-32),i);
      const after=section.slice(i+String(b.name).length,i+String(b.name).length+80);
      const rm=before.match(/(\d+)\s*$/);
      const sm=after.match(/(\d+(?:\.\d+)?)%\s+(\d+(?:\.\d+)?)%/);
      if(rm&&sm)out[b.name]={rank:Number(rm[1]),adjustedWinRate:Number(sm[1]),pickRate:Number(sm[2])};
    }
    return out;
  }

  for(const mode of modes){
    const slug=mode.hash||mode.scHash;
    if(!slug)continue;
    try{
      const html=await get('https://brawltime.ninja/tier-list/mode/'+encodeURIComponent(String(slug).toLowerCase()));
      const ranking=parseModeRanking(html,list);
      if(Object.keys(ranking).length>=Math.min(10,list.length)){
        modeMeta[mode.scHash||mode.hash]={
          name:mode.name,
          hash:mode.hash,
          sourceUrl:'https://brawltime.ninja/tier-list/mode/'+encodeURIComponent(String(slug).toLowerCase()),
          updatedAt:now,
          entries:ranking
        };
        modeOk++;
      }
    }catch(e){}
    await sleep(70);
  }

  const metaEntries={};
  for(const b of list){
    const e=entries[b.name];
    const s=e.stats||{};
    const base=s.adjustedWinRate??s.winRate;
    const buildPicks=[...(e.gadget||[]),...(e.starPower||[]),...(e.gears||[])].map(x=>Number(x.pick)).filter(Number.isFinite);
    const buildScore=buildPicks.length?Math.min(100,Math.round(buildPicks.reduce((a,v)=>a+v,0)/buildPicks.length)):50;
    const score=base!=null?Math.round(base):buildScore;
    const modesOut={};
    for(const [modeKey,md] of Object.entries(modeMeta)){
      const r=md.entries?.[b.name];
      if(r)modesOut[modeKey]={score:r.adjustedWinRate,rank:r.rank,winRate:r.adjustedWinRate,pickRate:r.pickRate,reason:md.name+' adjusted win rate',source:'Brawl Time Ninja',confidence:r.rank<=10?'medium':'low'};
    }
    metaEntries[b.name]={
      default:{score,rank:null,reason:base!=null?'Brawl Time Ninja adjusted win rate':'Community build data only',source:base!=null?'Brawl Time Ninja':'NOFF',confidence:base!=null?'medium':'low'},
      modes:modesOut
    };
  }
  const meta={schemaVersion:2,updatedAt:now,source:'Brawl Time Ninja + NOFF',method:'Global + mode snapshot. Map-specific data is only shown when a verified map snapshot exists.',coverage:{brawlers:list.length,modes:modeOk,totalModes:modes.length},entries:metaEntries};
  fs.writeFileSync(META_PATH,JSON.stringify(meta,null,2)+'\n');

  const catalogOut=list.map(b=>({id:b.id,name:b.name,assetId:b.id,gadgets:(b.gadgets||[]).map(x=>({id:x.id,name:x.name})),starPowers:(b.starPowers||[]).map(x=>({id:x.id,name:x.name})),gears:(b.gears||[]).map(x=>({id:x.id,name:x.name})),hyperCharges:(b.hypercharges||b.hyperCharges||[]).map(x=>({id:x.id,name:x.name}))}));
  fs.writeFileSync(CATALOG_PATH,JSON.stringify(catalogOut,null,2)+'\n');

  if(noffOk<Math.floor(list.length*.5) || btOk<Math.floor(list.length*.5) || modeOk<3) {
    throw new Error('Sync quality gate failed: NOFF '+noffOk+'/'+list.length+', BrawlTime '+btOk+'/'+list.length+', modes '+modeOk+'/'+modes.length);
  }
  console.log(JSON.stringify({updatedAt:now,brawlers:list.length,noffOk,btOk,modeOk,totalModes:modes.length},null,2));
}
main().catch(e=>{console.error(e);process.exit(1)});