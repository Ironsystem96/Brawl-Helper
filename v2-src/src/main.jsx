import React,{useEffect,useMemo,useState} from 'react';
import {createRoot} from 'react-dom/client';
import './styles.css';

const ROOT='/Brawl-Helper/';
const BACKEND='https://brawl-helper-backend.onrender.com';
const DEFAULT_TAG='22QYOQRGY';
const DEMO=['Edgar','8-Bit','Mortis'];
const TABS=['Panoramica','Build','Modalità','Stat','Altro'];
const pct=v=>v==null?'—':Number(v).toFixed(1)+'%';
const gearImage={'SPEED':'62000000','HEALTH':'62000001','DAMAGE':'62000002','VISION':'62000003','SHIELD':'62000004','RELOAD SPEED':'62000005','SUPER CHARGE':'62000006','GADGET COOLDOWN':'62000017'};
const gearSrc=name=>gearImage[String(name||'').toUpperCase()]?'https://cdn.brawlify.com/gears/regular/'+gearImage[String(name||'').toUpperCase()]+'.png':'';
const findItem=(list,name)=>(list||[]).find(x=>x.name===name)||null;

function buildFor(b,build,components,account){
 const e=build?.entries?.[b.name]||{}, ce=components?.entries?.[String(b.id)]||{};
 const gadget=findItem(b.gadgets,e.gadget?.[0]?.name), star=findItem(b.starPowers,e.starPower?.[0]?.name);
 const gearPool=ce.gears||[], gearByName=name=>gearPool.find(x=>x.name===name)||{name};
 const gears=(e.gears||[]).slice(0,2).map(x=>gearByName(x.name));
 return [
  {label:'Gadget',item:gadget,pick:e.gadget?.[0]?.pick,status:account?.gadgets?.some(x=>x.name===gadget?.name)?'IN USO':'DA OTTENERE'},
  {label:'Star Power',item:star,pick:e.starPower?.[0]?.pick,status:account?.starPowers?.some(x=>x.name===star?.name)?'IN USO':'DA OTTENERE'},
  {label:'Gear 1',item:gears[0],pick:e.gears?.[0]?.pick,status:account?.gears?.some(x=>x.name===gears[0]?.name)?'IN USO':'DA OTTENERE'},
  {label:'Gear 2',item:gears[1],pick:e.gears?.[1]?.pick,status:account?.gears?.some(x=>x.name===gears[1]?.name)?'IN USO':'DA OTTENERE'},
  {label:'Overdrive',item:(e.overdrives||[])[0]||null,pick:e.overdrives?.[0]?.pick,status:e.overdrives?.length?'IN USO':'DA OTTENERE'}
 ];
}

function App(){
 const [catalog,setCatalog]=useState([]),[build,setBuild]=useState(null),[components,setComponents]=useState(null),[profile,setProfile]=useState(null),[selected,setSelected]=useState(null),[loading,setLoading]=useState(true),[profileLoading,setProfileLoading]=useState(true),[profileError,setProfileError]=useState('');
 useEffect(()=>{Promise.all([fetch(ROOT+'data/brawlers.json').then(r=>r.json()),fetch(ROOT+'data/build-meta.json').then(r=>r.json()),fetch(ROOT+'data/components.json').then(r=>r.json())]).then(([c,b,co])=>{setCatalog(c.brawlers||[]);setBuild(b);setComponents(co)}).finally(()=>setLoading(false))},[]);
 const demos=useMemo(()=>DEMO.map(n=>catalog.find(b=>b.name===n)).filter(Boolean),[catalog]);
 if(loading)return <div className="v2Loading"><b>BRAWL HELPER</b><span>Caricamento interfaccia…</span></div>;
 const owned=new Map((profile?.brawlers||[]).map(x=>[x.name,x]));
 const accountDemos=demos.map(b=>({...b,account:owned.get(b.name)||null}));
 return <main className="v2App">{selected?<BrawlerProfile b={selected} build={build} components={components} profile={profile} onBack={()=>setSelected(null)}/>:<Chooser demos={accountDemos} profile={profile} profileLoading={profileLoading} profileError={profileError} onSelect={setSelected}/>}</main>;
}

function Chooser({demos,profile,profileLoading,profileError,onSelect}){
 return <section className="chooser"><div className="brand"><span>BRAWL HELPER</span><h1>Brawlers</h1><p>Master UI · real account data</p></div><div className="accountHeader"><div><small>ACCOUNT</small><strong>{profile?.name||'BlackShark'}</strong><span>#{profile?.tag||DEFAULT_TAG}</span></div><div><b>{profile?.trophies?.toLocaleString()||'—'}</b><small>TROPHIES</small></div><div><b>{profile?.brawlers?.length||'—'}</b><small>BRAWLERS</small></div></div>{profileError&&<div className="profileError">Profilo reale non raggiungibile: {profileError}</div>}<div className="chooserGrid">{demos.map((b,i)=><button className="demoCard" key={b.id} onClick={()=>onSelect(b)}><div className="demoNo">0{i+1}</div><img src={b.imageUrl2||b.imageUrl} alt=""/><div><small>{b.class?.name}</small><strong>{b.name}</strong><span>{b.rarity?.name} · {b.account?`Power ${b.account.power}`:'Non posseduto'}</span></div><i>›</i></button>)}</div></section>;
}

function BrawlerProfile({b,build,components,profile,onBack}){
 const [tab,setTab]=useState('Panoramica');
 const e=build?.entries?.[b.name]||{}, account=(profile?.brawlers||[]).find(x=>x.name===b.name)||null, loadout=buildFor(b,build,components,account), stats=e.noff?.stats||{};
 const modes=Object.entries(e.noff?.modes||{}).sort((a,z)=>(z[1].score||0)-(a[1].score||0)).slice(0,6), maps=(e.noff?.maps||[]).slice(0,3), buffies=(e.buffies||[]).slice(0,3);
 return <div className="profile">
  <header className="appTop"><button onClick={onBack}>‹</button><strong>{b.name}</strong><button>⚙</button></header>
  <section className="heroBanner" data-brawler={b.name.replace(/[^a-z0-9]/gi,'').toLowerCase()}>
   <div className="heroGradient"/><div className="heroTexture"/><div className="heroText"><small>{b.class?.name||'BRAWLER'}</small><h1>{b.name}</h1><p>{b.shortDescription||b.description||'Brawler profile'}</p><div className="chips"><span>● {b.class?.name}</span><span>{b.rarity?.name}</span></div></div><img className="heroArt" src={b.imageUrl2||b.imageUrl} alt=""/>
   <button className="heroStar">☆</button>
  </section>
  <nav className="tabs">{TABS.map(x=><button className={tab===x?'active':''} key={x} onClick={()=>setTab(x)}>{x}</button>)}</nav>
  {tab==='Panoramica'&&<Overview b={b} e={e} account={account} stats={stats} loadout={loadout} modes={modes} maps={maps} buffies={buffies}/>}
  {tab==='Build'&&<BuildPage b={b} loadout={loadout}/>}
  {tab==='Modalità'&&<ModesPage modes={modes}/>}
  {tab==='Stat'&&<StatsPage b={b} e={e} account={account}/>}
  {tab==='Altro'&&<ExtrasPage b={b} buffies={buffies}/>}
  <BottomNav active="Brawler"/>
 </div>;
}

function Overview({b,e,account,stats,loadout,modes,maps,buffies}){
 return <div className="content">
  <section className="sectionHeading"><h2>Build consigliata</h2><span>Top Ranked</span></section>
  <section className="buildPanel"><div className="buildRow">{loadout.map((x,i)=><LoadoutSlot key={x.label} {...x} index={i}/>)}</div></section>
  <section className="sectionHeading"><h2>Stato nel tuo account</h2></section>
  <section className="accountBuild">{loadout.map((x,i)=><LoadoutMini key={x.label} {...x} index={i}/>)}</section>
  <section className="actionBanner"><div className="actionIcon">⚡</div><div><small>PROSSIMA AZIONE</small><strong>{loadout[4].item?'Usa Overdrive':'Ottieni Overdrive'}</strong><p>Completa la configurazione consigliata.</p></div><b>›</b></section>
  <section className="sectionHeading"><h2>Migliore in queste modalità</h2><button>Vedi tutte ›</button></section>
  <div className="modeTiles">{modes.slice(0,4).map(([name,x],i)=><div className="modeTile" key={name}><ModeIcon index={i}/><strong>{name}</strong><span>{pct(x.winRate)} WR</span></div>)}</div>
  <section className="sectionHeading compactHead"><h2>Statistiche rapide</h2></section>
  <section className="quickStats"><Data label="WIN RATE" value={pct(stats.winRate)}/><Data label="PICK RATE" value={pct(stats.pickRate)}/><Data label="SAMPLE" value={e.sample||'—'}/><Data label="POWER" value="9/11"/></section>
  <section className="sectionHeading compactHead"><h2>Mappe migliori</h2></section>
  <div className="maps">{maps.map((x,i)=><div className="map" key={x.name+i}><div className="mapImg"><span>0{i+1}</span></div><strong>{x.name}</strong><small>{pct(x.winRate)} WR</small></div>)}</div>
 </div>;
}

function BuildPage({b,loadout}){
 return <div className="content"><section className="sectionHeading"><h2>Dettaglio build</h2><span>Top Ranked</span></section><div className="detailList">{loadout.map((x,i)=><LoadoutDetail key={x.label} {...x} index={i}/>)}</div><section className="sectionHeading"><h2>Build alternativa</h2><button>Vedi tutte ›</button></section><div className="filterRow"><button className="selected">Ranked</button><button>Gem Grab</button><button>Brawl Ball</button><button>Knockout</button></div><div className="alternative"><div className="altIcons">{loadout.map((x,i)=><LoadoutMini key={x.label} {...x} index={i}/>)}</div><button className="yellowBtn">Usa questa build</button></div></div>;
}
function ModesPage({modes}){return <div className="content"><section className="sectionHeading"><h2>Prestazioni per modalità</h2></section><div className="modeList">{modes.map(([name,x],i)=><div className="modeRow" key={name}><ModeIcon index={i}/><strong>{name}</strong><b className={'tier tier'+i}>{i<1?'S':i<3?'A':i<6?'B':'C'}</b><span>Win Rate<br/><b>{pct(x.winRate)}</b></span><span>Uso<br/><b>{pct(x.pickRate)}</b></span><i>›</i></div>)}</div></div>}
function StatsPage({b,e,account}){return <div className="content"><section className="sectionHeading"><h2>Statistiche</h2></section><div className="powerTabs"><button>Power 9</button><button>Power 10</button><button className="selected">Power 11</button></div><div className="statGrid"><Data label="SALUTE" value={account?.power?`Power ${account.power}`:'—'}/><Data label="ATTACCO" value={account?.trophies?.toLocaleString()||'—'}/><Data label="SUPER" value={account?.highestTrophies?.toLocaleString()||'—'}/><Data label="VELOCITÀ" value="Normale"/><Data label="RICARICA SUPER" value="Normale"/><Data label="PORTATA" value="Lunga"/></div><section className="sectionHeading compactHead"><h2>Progressione</h2></section><div className="growthChart"><span>● Salute</span><span>● Attacco</span><span>● Super</span><div className="chartLines"><i/><i/><i/><i/><i/></div></div></div>}
function ExtrasPage({b,buffies}){return <div className="content"><section className="sectionHeading"><h2>Cosa ti manca</h2></section><div className="missingList"><div><b>⚡</b><strong>Overdrive</strong><span>{b.name} · Non posseduto</span><em>Non posseduto</em></div><div><b>◉</b><strong>Buffies</strong><span>Disponibili</span><em>0/3</em></div><div><b>◈</b><strong>Hypercharge</strong><span>Non disponibile</span><em>—</em></div></div><section className="sectionHeading compactHead"><h2>Buffies disponibili</h2><button>Vedi tutti ›</button></section>{buffies.length?<div className="buffies">{buffies.map(x=><div className="buffie" key={x.id+x.name}><div className="buffieIcon">✦</div><div><span>{x.slot}</span><strong>{x.name.replace(' Buffie','')}</strong><p>{x.description}</p></div></div>)}</div>:<div className="emptyState">Nessun Buffie validato per questo Brawler.</div>}</div>}

function LoadoutSlot({label,item,pick,status,index}){const type=label==='Gadget'?'gadgets':label==='Star Power'?'starPowers':label.startsWith('Gear')?'gears':'overdrives',src=item?.imageUrl||gearSrc(item?.name);return <div className={'slot '+(type==='overdrives'?'overdrive':'')}><small>{label}</small><div className="slotVisual">{src?<img src={src} alt=""/>:<div className="emptyIcon">⚡</div>}</div><strong>{item?.name||'Non disponibile'}</strong><em className={item?'owned':''}>{item?status:'DA OTTENERE'}</em></div>}
function LoadoutMini({label,item,status,index}){const type=label==='Gadget'?'gadgets':label==='Star Power'?'starPowers':label.startsWith('Gear')?'gears':'overdrives',src=item?.imageUrl||gearSrc(item?.name);return <div className="mini"><div>{src?<img src={src} alt=""/>:<span>⚡</span>}</div><small>{item?.name||'—'}</small><em className={item?'ok':'lock'}>{item?'In uso':'Non posseduto'}</em></div>}
function LoadoutDetail({label,item,status,index}){const type=label==='Gadget'?'gadgets':label==='Star Power'?'starPowers':label.startsWith('Gear')?'gears':'overdrives',src=item?.imageUrl||gearSrc(item?.name);return <div className="detailRow"><div className={'detailIcon '+(type==='overdrives'?'purple':'')}>{src?<img src={src} alt=""/>:<span>⚡</span>}</div><div><small>{label}</small><strong>{item?.name||'Non disponibile'}</strong><p>{item?'Configurazione consigliata e validata.':'Componente non ancora disponibile.'}</p></div><em className={item?'ok':'lock'}>{item?'In uso':'Non possiedi'}</em><b>›</b></div>}
function ModeIcon({index}){return <div className={'modeIcon m'+index}>{index===0?'◉':index===1?'◆':index===2?'●':'◎'}</div>}
function Stat({label,value}){return <div><small>{label}</small><strong>{value}</strong></div>}
function Data({label,value}){return <div><small>{label}</small><strong>{value??'—'}</strong></div>}
function BottomNav({active}){return <nav className="bottomNav"><button>⌂<span>Home</span></button><button className={active==='Brawler'?'active':''}>♙<span>Brawler</span></button><button>⇧<span>Upgrade</span></button><button>★<span>Meta</span></button><button>•••<span>Altro</span></button></nav>}

createRoot(document.getElementById('root')).render(<App/>);
