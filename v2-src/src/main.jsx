import React,{useEffect,useMemo,useState} from 'react';
import {createRoot} from 'react-dom/client';
import './styles.css';

const ROOT='/Brawl-Helper/';
const DEMO=['Edgar','8-Bit','Mortis'];
const pct=v=>v==null?'—':Number(v).toFixed(1)+'%';

const gearImage={'SPEED':'62000000','HEALTH':'62000001','DAMAGE':'62000002','VISION':'62000003','SHIELD':'62000004','RELOAD SPEED':'62000005','SUPER CHARGE':'62000006','GADGET COOLDOWN':'62000017'};
const gearSrc=name=>gearImage[String(name||'').toUpperCase()]?'https://cdn.brawlify.com/gears/regular/'+gearImage[String(name||'').toUpperCase()]+'.png':'';
function findItem(list,name){return (list||[]).find(x=>x.name===name)||null}

function buildFor(b,build,components){
  const e=build?.entries?.[b.name]||{};
  const ce=components?.entries?.[String(b.id)]||{};
  const gadget=findItem(b.gadgets,e.gadget?.[0]?.name);
  const star=findItem(b.starPowers,e.starPower?.[0]?.name);
  const gearPool=ce.gears||[];
  const gearByName=name=>gearPool.find(x=>x.name===name)||{name};
  const gears=(e.gears||[]).slice(0,2).map(x=>gearByName(x.name));
  return [
    {label:'GADGET',item:gadget,pick:e.gadget?.[0]?.pick,status:'VERIFIED'},
    {label:'STAR POWER',item:star,pick:e.starPower?.[0]?.pick,status:'IN USE'},
    {label:'GEAR 1',item:gears[0],pick:e.gears?.[0]?.pick,status:'VERIFIED'},
    {label:'GEAR 2',item:gears[1],pick:e.gears?.[1]?.pick,status:'VERIFIED'},
    {label:'OVERDRIVE',item:(e.overdrives||[])[0]||null,pick:(e.overdrives||[])[0]?.pick,status:e.overdrives?.length?'VERIFIED':'NOT AVAILABLE'}
  ];
}

function App(){
  const [catalog,setCatalog]=useState([]);
  const [build,setBuild]=useState(null);
  const [components,setComponents]=useState(null);
  const [selected,setSelected]=useState(null);
  const [loading,setLoading]=useState(true);
  useEffect(()=>{
    Promise.all([
      fetch(ROOT+'data/brawlers.json').then(r=>r.json()),
      fetch(ROOT+'data/build-meta.json').then(r=>r.json()),
      fetch(ROOT+'data/components.json').then(r=>r.json())
    ]).then(([c,b,co])=>{
      const all=c.brawlers||[];setCatalog(all);setBuild(b);setComponents(co);setSelected(null);
    }).finally(()=>setLoading(false));
  },[]);
  const demos=useMemo(()=>DEMO.map(n=>catalog.find(b=>b.name===n)).filter(Boolean),[catalog]);
  if(loading)return <div className="v2Loading"><b>BRAWL HELPER</b><span>Preparing the new interface…</span></div>;
  return <main className="v2App">{!selected?<Chooser demos={demos} onSelect={setSelected}/>:<BrawlerProfile b={selected} build={build} components={components} onBack={()=>setSelected(null)}/>}</main>;
}

function Chooser({demos,onSelect}){
  return <section className="chooser">
    <div className="brand"><span>BRAWL HELPER</span><h1>Master Brawler</h1><p>New interface · 3 data-rich profiles</p></div>
    <div className="chooserGrid">{demos.map((b,i)=><button className="demoCard" key={b.id} onClick={()=>onSelect(b)}>
      <div className="demoNo">0{i+1}</div><img src={b.imageUrl2||b.imageUrl} alt=""/><div><small>{b.class?.name}</small><strong>{b.name}</strong><span>{b.rarity?.name}</span></div><i>›</i>
    </button>)}</div>
    <div className="baseNote"><b>BASE REBUILD</b><span>UI, data model and components are being rebuilt independently. New Brawlers will plug into this same system.</span></div>
  </section>;
}

function BrawlerProfile({b,build,components,onBack}){
  const e=build?.entries?.[b.name]||{};
  const loadout=buildFor(b,build,components);
  const modes=Object.entries(e.noff?.modes||{}).sort((a,z)=>(z[1].score||0)-(a[1].score||0)).slice(0,3);
  const maps=(e.noff?.maps||[]).slice(0,3);
  const stats=e.noff?.stats||{};
  const buffies=(e.buffies||[]).slice(0,3);
  return <div className="profile">
    <div className="topBar"><button className="back" onClick={onBack}>‹ <span>BRAWLERS</span></button><div className="topActions"><button aria-label="favorite">☆</button><button className="team">+ TEAM</button></div></div>
    <section className="heroBanner"><div className="heroGradient"/><div className="heroGlow"/><div className="heroText"><small>{b.class?.name||'BRAWLER'}</small><h2>{b.name}</h2><p>{b.shortDescription||b.description||'Brawler profile'}</p><div className="chips"><span>{b.rarity?.name}</span><span>{b.class?.name}</span></div></div><img className="heroArt" src={b.imageUrl2||b.imageUrl} alt=""/></section>
    <section className="stats"><Stat label="WIN RATE" value={pct(stats.winRate)}/><Stat label="PICK RATE" value={pct(stats.pickRate)}/><Stat label="SAMPLE" value={e.sample?.toLocaleString()||'—'}/><Stat label="ACCOUNT" value="OWNED"/></section>
    <section className="card buildCard"><SectionTitle label="RECOMMENDED LOADOUT" title="Build meta" badge="5 SLOTS"/><p className="sectionIntro">La configurazione consigliata per giocare {b.name}.</p><div className="buildRow">{loadout.map((x,i)=><LoadoutSlot key={x.label+i} {...x} index={i}/>)}</div><button className="upgradeCta"><span>CHECK UPGRADE</span><b>›</b></button></section>
    <section className="card playCard"><SectionTitle label="PLAYSTYLE" title="How to play"/><div className="playGrid"><div><b>{b.class?.name||'BRAWLER'}</b><span>Primary role</span></div><div><b>PRESSURE</b><span>Keep tempo</span></div><div><b>CONTROL</b><span>Win space</span></div></div><p>Use the recommended setup as the baseline. Map and mode context will refine the recommendation later.</p></section>
    <section className="card"><SectionTitle label="PROGRESSION" title="Upgrade path" badge="POWER"/><div className="powerPath">{Array.from({length:11},(_,i)=><i className={i<9?'done':''} key={i}>{i+1}</i>)}</div><div className="pathLegend"><span><i className="dot doneDot"/>Current target</span><span><i className="dot"/>Next</span></div></section>
    <section className="card"><SectionTitle label="GAME DATA" title="Stats"/><div className="dataGrid"><Data label="CLASS" value={b.class?.name}/><Data label="RARITY" value={b.rarity?.name}/><Data label="SAMPLE" value={e.sample||'—'}/><Data label="GADGETS" value={b.gadgets?.length||0}/><Data label="STAR POWERS" value={b.starPowers?.length||0}/><Data label="GEARS" value={(components?.entries?.[String(b.id)]?.gears||[]).length||0}/></div></section>
    <section className="card"><SectionTitle label="META PERFORMANCE" title="Top modes" badge="NOFF"/><div className="list">{modes.map(([name,x],i)=><div className="listRow" key={name}><em>0{i+1}</em><strong>{name}</strong><span>{pct(x.winRate)} WR · {pct(x.pickRate)} USE</span><b>{Math.round(x.score||0)}</b></div>)}</div></section>
    <section className="card"><SectionTitle label="MAP PERFORMANCE" title="Top maps" badge="TOP 3"/><div className="maps">{maps.map((x,i)=><div className="map" key={x.name+i}><div className="mapImg"><span>0{i+1}</span><i/></div><strong>{x.name}</strong><small>{pct(x.winRate)} WR · {pct(x.pickRate)} USE</small></div>)}</div></section>
    <section className="card extrasCard"><SectionTitle label="EXTRAS" title="Buffies"/>{buffies.length?<div className="buffies">{buffies.map(x=><div className="buffie" key={x.id+x.name}><div className="buffieIcon">✦</div><div><span>{x.slot}</span><strong>{x.name.replace(' Buffie','')}</strong><p>{x.description}</p></div></div>)}</div>:<div className="emptyState">No validated Buffie data for this Brawler.</div>}</section>
    <div className="footerNote">BRAWL HELPER · V2 FOUNDATION · {DEMO.join(' · ')}</div>
  </div>;
}
function LoadoutSlot({label,item,pick,status,index}){
  const type=label==='GADGET'?'gadgets':label==='STAR POWER'?'starPowers':label.startsWith('GEAR')?'gears':'overdrives';
  const src=item?.imageUrl||gearSrc(item?.name);
  return <div className={'slot '+(type==='overdrives'?'overdrive':'')}><div className="slotNum">{index+1}</div>{src?<img src={src} alt=""/>:<div className="emptyIcon">{type==='overdrives'?'⚡':'—'}</div>}<small>{label}</small><strong>{item?.name||'Not available'}</strong>{pick!=null?<em>{pick}% PICK</em>:<em className="mutedStatus">{status}</em>}</div>;
}
function Stat({label,value}){return <div><small>{label}</small><strong>{value}</strong></div>}
function Data({label,value}){return <div><small>{label}</small><strong>{value??'—'}</strong></div>}
function SectionTitle({label,title,badge}){return <div className="sectionTitle"><div><span>{label}</span><h3>{title}</h3></div>{badge&&<b>{badge}</b>}</div>}
createRoot(document.getElementById('root')).render(<App/>);
