let P=null,profiles=loadProfiles(),active=localStorage.getItem('bh_active')||'',tab='home',query='',filter='all',selected=null,playMode='Ranked',playMap='Random';

const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const fmt=n=>Number(n||0).toLocaleString('it-IT');
const apiBase=()=>localStorage.getItem('bh_api_base')||'';
const META_STATE={loaded:false,source:null,updatedAt:null,entries:{}};
const DB_STATE={loaded:false,version:null,patch:null,lastSyncedAt:null,changelog:[]};

function loadProfiles(){try{return JSON.parse(localStorage.getItem('bh_profiles')||'[]')}catch{return[]}}
function saveProfiles(){localStorage.setItem('bh_profiles',JSON.stringify(profiles))}
function img(kind,id){return 'https://cdn.brawlify.com/'+kind+'/'+id+'.png'}
function portrait(b){return img('brawlers/borders',b.id)}
function owned(b){return {gadgets:b.gadgets?.length||0,stars:b.starPowers?.length||0,gears:b.gears?.length||0,hc:b.hyperCharges?.length||0}}
function readiness(b){const o=owned(b);return Math.min(100,Math.round((b.power||1)*5+Math.min(o.gadgets,2)*5+Math.min(o.stars,2)*5+Math.min(o.gears,2)*5+Math.min(o.hc,1)*8))}
function powerScore(b){return Math.min(100,(b.power||1)*7+(b.trophies||0)/20)}
function personalScore(b){return Math.round(readiness(b)*.45+powerScore(b)*.35+Math.min(100,(b.highestTrophies||0)/8)*.20)}
function metaEntry(b,mode,map){return META_STATE.entries[b.name]?.[mode]?.[map]||META_STATE.entries[b.name]?.[mode]?.default||META_STATE.entries[b.name]?.default||null}
function contextScore(b,mode,map){const m=metaEntry(b,mode,map);const personal=personalScore(b);const meta=m?.score??50;return Math.round(meta*.40+personal*.60)}
function status(b){const r=readiness(b);if((b.power||0)>=11&&r>=75)return ['PLAY NOW','ok'];if((b.power||0)>=9)return ['UPGRADE TO META',''];return ['LOW POWER','miss']}
function compIcon(type,item){if(!item)return '';const path={gadget:'gadgets/borderless',star:'star-powers/borderless',gear:'gears/regular',hc:'hypercharges/regular'}[type];return path?'<img class="compIcon" src="'+img(path,item.id)+'" onerror="this.style.display=\\'none\\'">':''}
function comp(type,label,item){return '<div class="comp '+(item?'owned':'missing')+'">'+compIcon(type,item)+'<div><span>'+label+'</span><b>'+esc(item?.name||'Not owned')+'</b></div></div>'}
function first(a){return Array.isArray(a)&&a.length?a[0]:null}
function buildLabel(b){const o=owned(b);return [o.gadgets?'Gadget':'Gadget missing',o.stars?'Star Power':'Star Power missing',o.gears?'Gear':'Gear missing',o.hc?'Hypercharge':'Hypercharge missing'].join(' · ')}
function why(b,mode,map){const m=metaEntry(b,mode,map);const reasons=[];if(readiness(b)>=75)reasons.push('build già pronta');if(b.power>=11)reasons.push('Power 11');if((b.trophies||0)>=500)reasons.push('buona esperienza sul Brawler');if(m?.reason)reasons.push(m.reason);if(!reasons.length)reasons.push('dati account disponibili');return reasons.join(' · ')}
function recommendationTag(b,mode,map){return META_STATE.loaded&&metaEntry(b,mode,map)?'META + ACCOUNT':'ACCOUNT ONLY'}

function nav(){return '<nav class="nav">'+[['home','⌂','Home'],['play','▶','Play'],['brawlers','●','Brawlers'],['upgrade','↗','Upgrade'],['meta','✦','Meta']].map(x=>'<button class="'+(tab===x[0]?'active':'')+'" onclick="setTab(\\''+x[0]+'\\')">'+x[1]+'<br>'+x[2]+'</button>').join('')}
function shell(body){document.getElementById('app').innerHTML='<div class="app"><header class="top"><div class="brand"><div class="logo">Brawl <span>Helper</span></div><div class="sync">'+(active?'PROFILE':'NO PROFILE')+'</div></div><button class="profileBtn" onclick="profilePanel()">'+esc(active||'Profilo')+'</button></header><main class="content">'+body+'</main>'+nav()+'</div>'}
function setTab(t){tab=t;selected=null;query='';filter='all';render()}

function bcard(b,compact=false,mode=playMode,map=playMap){
 const o=owned(b),st=status(b),score=contextScore(b,mode,map);
 return '<div class="card bcard" onclick="openB('+b.id+')"><div class="row"><img class="portrait" src="'+portrait(b)+'" onerror="this.style.opacity=.25"><div class="grow"><div class="bname">'+esc(b.name)+'</div><div class="small">Power '+b.power+' · Rank '+b.rank+' · '+fmt(b.trophies)+' 🏆</div><div class="chips"><span class="chip '+st[1]+'">'+st[0]+'</span><span class="chip">Personal '+personalScore(b)+'</span></div></div></div>'+(!compact?'<div class="chips"><span class="chip '+(o.gadgets?'ok':'miss')+'">G '+o.gadgets+'/2</span><span class="chip '+(o.stars?'ok':'miss')+'">★ '+o.stars+'/2</span><span class="chip '+(o.gears?'ok':'miss')+'">Gear '+o.gears+'/2</span><span class="chip '+(o.hc?'ok':'miss')+'">HC '+o.hc+'</span><span class="chip">Context '+score+'</span></div>':'')+'</div>'
}

function home(){
 const bs=[...P.brawlers].sort((a,b)=>personalScore(b)-personalScore(a));
 const upgrades=[...P.brawlers].filter(b=>b.power<11).sort((a,b)=>personalScore(b)-personalScore(a)).slice(0,4);
 return '<section class="hero"><div class="eyebrow">ACCOUNT</div><h1>'+esc(P.name)+'</h1><div class="tag">'+esc(P.tag)+' · livello '+P.expLevel+'</div><div class="stats"><div class="stat"><b>'+fmt(P.trophies)+'</b><span>TROFEI</span></div><div class="stat"><b>'+P.brawlers.length+'</b><span>BRAWLER</span></div><div class="stat"><b>'+fmt(P['3vs3Victories'])+'</b><span>VITTORIE 3V3</span></div></div><div class="rank"><span>Ranked · '+esc(P.rankedRankName||'—')+'</span><b>'+fmt(P.rankedElo)+' Elo</b></div></section>'+
 '<section class="section"><div class="sectionTitle"><h2>Best For You</h2><span class="small">Personal Score</span></div><div class="notice">La selezione usa Power, trofei, progressione e build posseduta. Il meta live viene applicato solo quando è disponibile una snapshot verificata.</div>'+bs.slice(0,5).map(b=>bcard(b,true)).join('')+'</section>'+
 '<section class="section"><div class="sectionTitle"><h2>Upgrade Advisor</h2><span class="small">Opportunità</span></div>'+upgrades.map(b=>'<div class="action" onclick="openB('+b.id+')"><b>'+esc(b.name)+' · Power '+b.power+'</b><span class="small">'+fmt(b.trophies)+' trofei · '+buildLabel(b)+'</span></div>').join('')+'</section>'
}

function brawlers(){
 let bs=[...P.brawlers];
 if(query)bs=bs.filter(b=>b.name.toLowerCase().includes(query.toLowerCase()));
 if(filter==='p11')bs=bs.filter(b=>b.power>=11);
 if(filter==='upgrade')bs=bs.filter(b=>b.power<11);
 if(filter==='missing')bs=bs.filter(b=>{const o=owned(b);return o.gadgets<2||o.stars<2||o.gears<2||o.hc<1});
 bs.sort((a,b)=>b.trophies-a.trophies);
 return '<section class="section"><div class="sectionTitle"><h2>My Brawlers · '+P.brawlers.length+'</h2><span class="small">'+bs.length+' visualizzati</span></div><input class="search" placeholder="Cerca Brawler..." value="'+esc(query)+'" oninput="query=this.value;render()"><div class="filters"><button class="'+(filter==='all'?'active':'')+'" onclick="filter=\\'all\\';render()">Tutti</button><button class="'+(filter==='p11'?'active':'')+'" onclick="filter=\\'p11\\';render()">Power 11</button><button class="'+(filter==='upgrade'?'active':'')+'" onclick="filter=\\'upgrade\\';render()">Da migliorare</button><button class="'+(filter==='missing'?'active':'')+'" onclick="filter=\\'missing\\';render()">Build incomplete</button></div>'+bs.map(bcard).join('')+'</section>'
}

function detail(){
 const b=P.brawlers.find(x=>x.id===selected); if(!b)return '';
 const o=owned(b),g=first(b.gadgets),sp=first(b.starPowers),gear1=b.gears?.[0],gear2=b.gears?.[1],hc=first(b.hyperCharges),m=metaEntry(b,playMode,playMap);
 return '<button class="back" onclick="selected=null;render()">← Torna ai Brawler</button>'+
 '<section class="hero"><div class="row"><img class="portrait" src="'+portrait(b)+'"><div class="grow"><div class="eyebrow">BRAWLER</div><h1>'+esc(b.name)+'</h1><div class="muted">Power '+b.power+' · Rank '+b.rank+'</div><div class="muted">'+fmt(b.trophies)+' / '+fmt(b.highestTrophies)+' trofei</div></div></div><div class="chips"><span class="chip">Personal '+personalScore(b)+'</span><span class="chip '+status(b)[1]+'">'+status(b)[0]+'</span></div></section>'+
 '<section class="section"><h2>Build account</h2><div class="componentGrid">'+comp('gadget','Gadget',g)+comp('star','Star Power',sp)+comp('gear','Gear 1',gear1)+comp('gear','Gear 2',gear2)+comp('hc','Hypercharge',hc)+'</div></section>'+
 '<section class="card"><b>Contesto attuale</b><div class="context"><span>MODALITÀ</span><b>'+esc(playMode)+'</b><span>MAPPA</span><b>'+esc(playMap)+'</b></div><div class="notice">'+(m?esc(m.reason||'Meta entry disponibile'):'Meta live non collegato: questa spiegazione usa solo i dati dell’account.')+'</div><p class="small">'+esc(why(b,playMode,playMap))+'</p></section>'+
 '<section class="card"><b>Progressione</b><div class="grid"><div class="action"><b>'+o.gadgets+'/2</b><span class="small">Gadget</span></div><div class="action"><b>'+o.stars+'/2</b><span class="small">Star Power</span></div><div class="action"><b>'+o.gears+'/2</b><span class="small">Gear</span></div><div class="action"><b>'+o.hc+'/1</b><span class="small">Hypercharge</span></div></div></section>'
}

const MODES={
 'Ranked':['Random','Open Business','Belle’s Rock','Goldarm Gulch','Kaboom Canyon'],
 'Knockout':['Random','Goldarm Gulch','Belle’s Rock','Out in the Open'],
 'Gem Grab':['Random','Hard Rock Mine','Last Stop','Minecart Madness'],
 'Brawl Ball':['Random','Field Goal','Pinball Dreams','Super Beach'],
 'Heist':['Random','Kaboom Canyon','Safe Zone','Hot Potato'],
 'Hot Zone':['Random','Dueling Beetles','Ring of Fire','Split']
};
function play(){
 const names=MODES[playMode]||MODES.Ranked;
 const ready=[...P.brawlers].sort((a,b)=>contextScore(b,playMode,playMap)-contextScore(a,playMode,playMap));
 return '<section class="section"><div class="sectionTitle"><h2>Play</h2><span class="small">'+(META_STATE.loaded?'Meta + Account':'Account only')+'</span></div><div class="notice">Seleziona modalità e mappa. Il punteggio combina il profilo personale e, quando presente, la snapshot meta contestuale.</div><div class="filters">'+Object.keys(MODES).map(m=>'<button class="'+(playMode===m?'active':'')+'" onclick="playMode=\\''+m+'\\';playMap=\\'Random\\';render()">'+m+'</button>').join('')+'</div><select class="search" onchange="playMap=this.value;render()">'+names.map(m=>'<option '+(playMap===m?'selected':'')+'>'+m+'</option>').join('')+'</select><div class="context"><span>MODALITÀ</span><b>'+esc(playMode)+'</b><span>MAPPA</span><b>'+esc(playMap)+'</b></div><section class="section"><div class="sectionTitle"><h2>Top 5</h2><span class="small">'+esc(playMode)+' · '+esc(playMap)+'</span></div>'+ready.slice(0,5).map((b,i)=>'<div class="rankPick"><span class="num">'+(i+1)+'</span><div class="grow"><div class="card"><div class="row"><img class="portrait" src="'+portrait(b)+'"><div class="grow"><div class="bname">'+esc(b.name)+'</div><div class="small">Context Score '+contextScore(b,playMode,playMap)+' · '+recommendationTag(b,playMode,playMap)+'</div><div class="small">'+esc(why(b,playMode,playMap))+'</div></div></div></div></div></div>').join('')+'</section></section>'
}

function upgrade(){
 const list=[...P.brawlers].filter(b=>b.power<11||owned(b).gears<2||owned(b).hc<1).sort((a,b)=>personalScore(b)-personalScore(a)).slice(0,20);
 return '<section class="section"><div class="sectionTitle"><h2>Upgrade Advisor</h2><span class="small">20 priorità</span></div><div class="notice">Questo indice misura l’opportunità sul tuo account. Non è un ranking del meta.</div>'+list.map((b,i)=>'<div class="upgradeRow" onclick="openB('+b.id+')"><span class="num">'+(i+1)+'</span><div class="grow"><b>'+esc(b.name)+'</b><span class="small">Power '+b.power+' · '+fmt(b.trophies)+' trofei · Personal '+personalScore(b)+'</span></div><span class="score">'+(b.power<11?'POWER':'BUILD')+'</span></div>').join('')+'</section>'
}

function meta(){
 const names=Object.keys(META_STATE.entries);
 const releases=DB_STATE.changelog||[];
 return '<section class="section"><h2>Meta & Database</h2>'+
 '<div class="notice"><b>'+(META_STATE.loaded?'Snapshot meta caricata':'Meta live non ancora collegato')+'</b><br>'+
 (META_STATE.loaded?'Fonte: '+esc(META_STATE.source||'snapshot')+' · Aggiornamento: '+esc(META_STATE.updatedAt||'—'):'Il database di gioco e il changelog ufficiale sono separati dai dati personali dell’account.')+
 '</div>'+
 '<div class="card"><b>Game Database</b><div class="grid"><div class="action"><b>'+esc(DB_STATE.patch||'—')+'</b><span class="small">Patch corrente</span></div><div class="action"><b>'+esc(DB_STATE.version||'—')+'</b><span class="small">DB version</span></div></div><p class="small">Ultimo sync: '+esc(DB_STATE.lastSyncedAt||'—')+'</p></div>'+
 '<div class="card"><b>Changelog ufficiale</b>'+ (releases.length?releases.slice(0,5).map(c=>'<div class="action"><b>'+esc(c.title)+'</b><span class="small">'+esc(c.publishedAt||'')+' · '+esc(c.highlights?.[0]||c.status||'Fonte ufficiale Supercell')+'</span></div>').join(''):'<p class="small">Nessun changelog disponibile.</p>')+'</div>'+
 (names.length?'<div class="card"><b>Meta snapshot</b>'+names.map(n=>{const b=P.brawlers.find(x=>x.name===n);return b?bcard(b,true):''}).join('')+'</div>':'<div class="card"><b>Meta provider</b><p class="small">La struttura è pronta per ricevere snapshot verificabili per patch, modalità e mappa.</p></div>')+
 '</section>'
}

async function loadMeta(){
  try{
    const r=await fetch('data/meta.json',{cache:'no-store'});
    if(r.ok){const d=await r.json();META_STATE.loaded=!!d.updatedAt;META_STATE.source=d.source;META_STATE.updatedAt=d.updatedAt;META_STATE.entries=d.entries||{}}
  }catch(e){console.warn('Meta snapshot non disponibile',e)}
  try{
    const base=apiBase();
    const dbUrl=base?base+'/api/database':'data/game-db.json';
    const clUrl=base?base+'/api/changelog':'data/changelog.json';
    const [dr,cr]=await Promise.all([fetch(dbUrl,{cache:'no-store'}),fetch(clUrl,{cache:'no-store'})]);
    if(dr.ok){const d=await dr.json();DB_STATE.loaded=true;DB_STATE.version=d.databaseVersion||null;DB_STATE.patch=d.patch?.id||null;DB_STATE.lastSyncedAt=d.lastSyncedAt||null}
    if(cr.ok){const c=await cr.json();DB_STATE.changelog=c.releases||[]}
  }catch(e){console.warn('Game database non disponibile',e)}
}

function profilePanel(){
 const rows=profiles.map(p=>'<div class="profileRow"><button onclick="activate(\\''+esc(p.name)+'\\')"><b>'+esc(p.name)+'</b><span>'+esc(p.tag)+(p.test?' · TEST':'')+'</span></button><button class="del" onclick="removeProfile(\\''+esc(p.name)+'\\')">×</button></div>').join('');
 document.getElementById('app').insertAdjacentHTML('beforeend','<div class="modal"><div class="modalBox"><div class="modalHead"><h2>Profili</h2><button onclick="closeModal()">×</button></div>'+rows+'<div class="profileForm"><input id="newName" placeholder="Nome profilo"><input id="newTag" placeholder="Player Tag, es. #22QYOQRGY"><button class="primary" onclick="addProfile()">Aggiungi account</button></div><div class="profileForm"><input id="apiBase" placeholder="Backend API URL (opzionale)" value="'+esc(apiBase())+'"><button onclick="saveApiBase()">Salva backend</button></div><div class="small">BlackShark è esclusivamente il profilo di test. I clienti useranno il proprio Player Tag.</div><button class="close" onclick="closeModal()">Chiudi</button></div></div>')
}
function closeModal(){document.querySelector('.modal')?.remove()}
function activate(name){const p=profiles.find(x=>x.name===name);if(!p)return;active=name;localStorage.setItem('bh_active',name);closeModal();loadProfile(p)}
function removeProfile(name){profiles=profiles.filter(p=>p.name!==name);saveProfiles();if(active===name){active='';localStorage.removeItem('bh_active');P=null}closeModal();render()}
async function addProfile(){const name=document.getElementById('newName').value.trim(),tag=document.getElementById('newTag').value.trim().toUpperCase();if(!name||!/^#[A-Z0-9]+$/.test(tag)){alert('Inserisci nome e Player Tag valido.');return}if(profiles.some(p=>p.name===name)){alert('Nome profilo già presente.');return}const p={name,tag,test:false};profiles.push(p);saveProfiles();active=name;localStorage.setItem('bh_active',name);closeModal();await loadProfile(p)}
function saveApiBase(){const v=document.getElementById('apiBase').value.trim().replace(/\\/$/,'');if(v)localStorage.setItem('bh_api_base',v);else localStorage.removeItem('bh_api_base');closeModal();alert('Backend salvato.')}
async function loadProfile(p){
 selected=null;tab='home';
 if(p.test){try{P=await fetch('data/player-response.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error('Test profile HTTP '+r.status);return r.json()})}catch(e){console.warn(e);P=null}render();return}
 if(!apiBase()){P=null;render();document.getElementById('app').insertAdjacentHTML('beforeend','<div class="modal"><div class="modalBox"><h2>Collega account</h2><p>Player Tag salvato. Per i dati reali serve il backend Brawl Helper.</p><p class="small">La chiave Brawl Stars non deve mai essere inserita nell’app.</p><button class="close" onclick="closeModal()">OK</button></div></div>');return}
 try{const r=await fetch(apiBase()+'/api/player/'+encodeURIComponent(p.tag.slice(1)));if(!r.ok)throw new Error('Backend HTTP '+r.status);P=await r.json();render()}catch(e){P=null;render();document.getElementById('app').insertAdjacentHTML('beforeend','<div class="modal"><div class="modalBox"><h2>Errore collegamento</h2><p>'+esc(e.message)+'</p><button class="close" onclick="closeModal()">OK</button></div></div>')}
}
function openB(id){selected=id;render()}
function render(){if(!P){shell('<section class="hero"><div class="eyebrow">ACCOUNT</div><h1>Nessun profilo attivo</h1><p class="muted">Apri Profili e aggiungi il tuo Player Tag. Il profilo BlackShark è disponibile solo come ambiente di test.</p><button class="primary" onclick="profilePanel()">Gestisci profili</button></section>');return}if(selected)shell(detail());else if(tab==='home')shell(home());else if(tab==='brawlers')shell(brawlers());else if(tab==='play')shell(play());else if(tab==='upgrade')shell(upgrade());else shell(meta())}
function showFatal(e){document.getElementById('app').innerHTML='<div style="min-height:100vh;background:#10131a;color:#fff;font-family:Arial,sans-serif;padding:28px;box-sizing:border-box"><h1>Brawl Helper</h1><p>Si è verificato un errore di caricamento.</p><pre style="white-space:pre-wrap;color:#ff9b9b">'+esc(e?.message||e)+'</pre><button style="padding:14px 18px;border:0;border-radius:12px" onclick="location.reload()">Riprova</button></div>'}
function loading(){document.getElementById('app').innerHTML='<div style="min-height:100vh;background:#10131a;color:#fff;font-family:Arial,sans-serif;display:flex;align-items:center;justify-content:center"><div style="text-align:center"><div style="font-size:28px;font-weight:800">Brawl Helper</div><div style="opacity:.65;margin-top:8px">Caricamento profilo…</div></div></div>'}
async function boot(){try{loading();await loadMeta();if(!profiles.length){profiles=[{name:'BlackShark TEST',tag:'#22QYOQRGY',test:true}];saveProfiles();active=profiles[0].name;localStorage.setItem('bh_active',active)}const p=profiles.find(x=>x.name===active)||profiles[0];active=p.name;localStorage.setItem('bh_active',active);await loadProfile(p);if('serviceWorker'in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{})}catch(e){showFatal(e)}}
boot().catch(showFatal);