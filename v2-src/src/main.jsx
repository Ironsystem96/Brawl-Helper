import React,{useEffect,useMemo,useState} from 'react';
import {createRoot} from 'react-dom/client';
import './styles.css';

const ROOT='/Brawl-Helper/';
const DEMO=['Edgar','8-Bit','Mortis'];
const pct=v=>v==null?'—':Number(v).toFixed(1)+'%';

function findItem(list,name){return (list||[]).find(x=>x.name===name)||null}
function buildFor(b,build){
  const e=build?.entries?.[b.name]||{};
  const gadget=findItem(b.gadgets,e.gadget?.[0]?.name);
  const star=findItem(b.starPowers,e.starPower?.[0]?.name);
  const gears=(e.gears||[]).slice(0,2).map(x=>findItem(b.gears,x.name)||x);
  return [
    {label:'Gadget',item:gadget,pick:e.gadget?.[0]?.pick},
    {label:'Star Power',item:star,pick:e.starPower?.[0]?.pick},
    {label:'Gear 1',item:gears[0],pick:e.gears?.[0]?.pick},
    {label:'Gear 2',item:gears[1],pick:e.gears?.[1]?.pick},
    {label:'Overdrive',item:(e.overdrives||[])[0]||null,pick:(e.overdrives||[])[0]?.pick}
  ];
}

function App(){
  const [catalog,setCatalog]=useState([]);
  const [build,setBuild]=useState(null);
  const [selected,setSelected]=useState(null);
  const [loading,setLoading]=useState(true);

  useEffect(()=>{
    Promise.all([
      fetch(ROOT+'data/brawlers.json').then(r=>r.json()),
      fetch(ROOT+'data/build-meta.json').then(r=>r.json())
    ]).then(([c,b])=>{
      const all=c.brawlers||[];
      setCatalog(all);
      setBuild(b);
      setSelected(all.find(x=>DEMO.includes(x.name))||all[0]||null);
    }).finally(()=>setLoading(false));
  },[]);

  const demos=useMemo(()=>DEMO.map(n=>catalog.find(b=>b.name===n)).filter(Boolean),[catalog]);
  if(loading)return <div className="v2Loading">Brawl Helper<small>Caricamento V2…</small></div>;

  return <main className="v2App">
    {!selected ? <Chooser demos={demos} onSelect={setSelected}/> :
      <BrawlerProfile b={selected} build={build} onBack={()=>setSelected(null)}/>}
  </main>;
}

function Chooser({demos,onSelect}){
  return <section className="chooser">
    <div className="brand"><span>BRAWL HELPER</span><h1>Master Brawler V2</h1></div>
    <div className="sectionTitle"><div><span>BASE DATASET</span><h2>3 Brawler iniziali</h2></div><b>EDGAR · 8-BIT · MORTIS</b></div>
    <p className="muted">Partiamo da tre profili con dati ricchi. La struttura resta volutamente compatta.</p>
    <div className="demoGrid">{demos.map(b=><button className="demoCard" key={b.id} onClick={()=>onSelect(b)}>
      <img src={b.imageUrl2||b.imageUrl} alt=""/><div><small>{b.class?.name}</small><strong>{b.name}</strong><span>{b.rarity?.name}</span></div>
    </button>)}</div>
  </section>;
}

function BrawlerProfile({b,build,onBack}){
  const e=build?.entries?.[b.name]||{};
  const loadout=buildFor(b,build);
  const modes=Object.entries(e.noff?.modes||{}).sort((a,z)=>(z[1].score||0)-(a[1].score||0)).slice(0,3);
  const maps=(e.noff?.maps||[]).slice(0,3);
  return <div className="profile">
    <div className="profileTop"><button className="back" onClick={onBack}>‹ BRAWLERS</button><span className="profileLabel">MASTER V2</span></div>

    <section className="heroBanner">
      <div className="heroGradient"/>
      <div className="heroText">
        <small>{b.class?.name||'BRAWLER'}</small>
        <h2>{b.name}</h2>
        <p>{b.description||'Brawler profile'}</p>
        <div className="chips"><span>{b.rarity?.name}</span><span>{b.class?.name}</span></div>
      </div>
      <img className="heroArt" src={b.imageUrl2||b.imageUrl} alt=""/>
    </section>

    <section className="stats">
      <Stat label="WIN RATE" value={pct(e.noff?.stats?.winRate)}/>
      <Stat label="PICK RATE" value={pct(e.noff?.stats?.pickRate)}/>
      <Stat label="SAMPLE" value={e.sample?e.sample.toLocaleString():'—'}/>
      <Stat label="ACCOUNT" value="CATALOG"/>
    </section>

    <section className="card">
      <SectionTitle label="RECOMMENDED LOADOUT" title="Build meta" badge="5 SLOT"/>
      <div className="buildRow">{loadout.map((x,i)=><LoadoutSlot key={x.label+i} {...x} index={i}/>)}</div>
    </section>

    <section className="split">
      <section className="card compact"><SectionTitle label="PLAYSTYLE" title="Come usarlo"/>
        <div className="tags"><span>{b.class?.name}</span><span>Pressione</span><span>Controllo</span></div>
        <p>La build viene scelta dai dati community disponibili. Adatta il setup alla modalità e alla mappa.</p>
      </section>
      <section className="card compact"><SectionTitle label="PROGRESSION" title="Upgrade path" badge="POWER"/>
        <div className="powerPath">{Array.from({length:11},(_,i)=><i className={i<8?'done':''} key={i}>{i+1}</i>)}</div>
        <p><b>Prossimo:</b> completamento della build consigliata.</p>
      </section>
    </section>

    <section className="card">
      <SectionTitle label="GAME DATA" title="Stats"/>
      <div className="dataGrid">
        <Data label="CLASS" value={b.class?.name}/><Data label="RARITY" value={b.rarity?.name}/><Data label="SAMPLE" value={e.sample||'—'}/>
        <Data label="GADGETS" value={b.gadgets?.length||0}/><Data label="STAR POWERS" value={b.starPowers?.length||0}/><Data label="GEARS" value={b.gears?.length||0}/>
      </div>
    </section>

    <section className="card"><SectionTitle label="META PERFORMANCE" title="Top modes"/>
      <div className="list">{modes.map(([name,x])=><div className="listRow" key={name}><strong>{name}</strong><span>{pct(x.winRate)} WR · {pct(x.pickRate)} USE</span><b>{Math.round(x.score||0)}</b></div>)}</div>
    </section>

    <section className="card"><SectionTitle label="MAP PERFORMANCE" title="Top maps"/>
      <div className="maps">{maps.map((x,i)=><div className="map" key={x.name+i}><div className="mapImg"><span>#{i+1}</span></div><strong>{x.name}</strong><small>{pct(x.winRate)} WR · {pct(x.pickRate)} USE</small></div>)}</div>
    </section>

    <section className="card"><SectionTitle label="EXTRAS" title="Buffies"/>
      <div className="buffies">{(e.buffies||[]).slice(0,3).map(x=><div className="buffie" key={x.id+x.name}><span>{x.slot}</span><strong>{x.name}</strong><p>{x.description}</p></div>)}</div>
    </section>
  </div>;
}

function LoadoutSlot({label,item,pick,index}){
  return <div className="slot">
    <div className="slotNum">{index+1}</div>
    {item?.imageUrl?<img src={item.imageUrl} alt=""/>:<div className="emptyIcon">—</div>}
    <small>{label}</small><strong>{item?.name||'Non disponibile'}</strong>{pick!=null&&<em>{pick}%</em>}
  </div>;
}
function Stat({label,value}){return <div><small>{label}</small><strong>{value}</strong></div>}
function Data({label,value}){return <div><small>{label}</small><strong>{value??'—'}</strong></div>}
function SectionTitle({label,title,badge}){return <div className="sectionTitle"><div><span>{label}</span><h3>{title}</h3></div>{badge&&<b>{badge}</b>}</div>}

createRoot(document.getElementById('root')).render(<App/>);
