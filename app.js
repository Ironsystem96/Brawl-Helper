let P=null,profiles=loadProfiles(),active=localStorage.getItem('bh_active')||'',tab='home',query='',filter='all',selected=null,playMode='Ranked',playMap='Random';

const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const fmt=n=>Number(n||0).toLocaleString('it-IT');
const apiBase=()=>localStorage.getItem('bh_api_base')||'';
const META_STATE={loaded:false,source:null,updatedAt:null,entries:{}};
const DB_STATE={loaded:false,version:null,patch:null,lastSyncedAt:null,changelog:[]};
const BUILD_STATE={loaded:false,updatedAt:null,entries:{},sources:[]};
const CATALOG_STATE={loaded:false,count:0,entries:{}};

async function fetchJson(url,ms=7000){const ctl=new AbortController();const t=setTimeout(()=>ctl.abort(),ms);try{const r=await fetch(url,{cache:'no-store',signal:ctl.signal});if(!r.ok)throw new Error('HTTP '+r.status+' · '+url);return await r.json()}finally{clearTimeout(t)}}

function loadProfiles(){try{return JSON.parse(localStorage.getItem('bh_profiles')||'[]')}catch{return[]}}
function saveProfiles(){localStorage.setItem('bh_profiles',JSON.stringify(profiles))}
function img(kind,id){return 'https://cdn.brawlify.com/'+kind+'/'+id+'.png'}
function catalogEntry(b){if(!b)return null;return CATALOG_STATE.entries[b.name]||Object.values(CATALOG_STATE.entries||{}).find(x=>x&&x.id===b.id)||null}
function portrait(b){return catalogEntry(b)?.imageUrl||b?.imageUrl||img('brawlers/borders',b?.id)}
function owned(b){if(!b)return {gadgets:0,stars:0,gears:0,hc:0};return {gadgets:b.gadgets?.length||0,stars:b.starPowers?.length||0,gears:b.gears?.length||0,hc:b.hyperCharges?.length||0}}
function readiness(b){if(!b)return 0;const o=owned(b);return Math.min(100,Math.round((b.power||1)*5+Math.min(o.gadgets,2)*5+Math.min(o.stars,2)*5+Math.min(o.gears,2)*5+Math.min(o.hc,1)*8))}
function powerScore(b){if(!b)return 0;return Math.min(100,(b.power||1)*7+(b.trophies||0)/20)}
function personalScore(b){if(!b)return 0;return Math.round(readiness(b)*.45+powerScore(b)*.35+Math.min(100,(b.highestTrophies||0)/8)*.20)}
function modeKey(mode){return String(mode||'').trim().toLowerCase().replace(/[^a-z0-9]+([a-z0-9])/g,(_,x)=>x.toUpperCase()).replace(/[^a-z0-9]/g,'')}
function isOwnedAccount(b){if(!b)return false;return !!P?.brawlers?.some(x=>x&&((x.id!=null&&x.id===b.id)||norm(x.name)===norm(b.name)))}
function accountBrawler(c){if(!c)return null;const a=P?.brawlers?.find(x=>x&&((x.id!=null&&x.id===c.id)||norm(x.name)===norm(c.name)));return a||{...c,power:0,rank:0,trophies:0,highestTrophies:0,gadgets:[],starPowers:[],gears:[],hyperCharges:[]}}
function allBrawlers(){const by=Object.values(CATALOG_STATE.entries||{});return (by.length?by.map(accountBrawler):[...(P?.brawlers||[])]).filter(Boolean)}
function metaEntry(b,mode,map){
 if(!b)return null;
 const e=META_STATE.entries[b.name];
 if(!e)return null;
 const mk=modeKey(mode);
 const mapHit=map&&map!=='Random'?(e.maps?.[mk]?.[map]||e.modes?.[mk]?.maps?.[map]):null;
 return mapHit||e.modes?.[mk]||e[mode]?.[map]||e[mode]?.default||e.default||null;
}
function metaScope(b,mode,map){
 if(!b)return 'NON DISPONIBILE';
 const e=META_STATE.entries[b.name];
 if(!e)return 'NON DISPONIBILE';
 const mk=modeKey(mode);
 if(map&&map!=='Random'&&(e.maps?.[mk]?.[map]||e.modes?.[mk]?.maps?.[map]))return 'META MAPPA';
 if(e.modes?.[mk]||e[mode])return 'META MODALITÀ';
 if(e.default)return 'META GLOBALE';
 return 'NON DISPONIBILE';
}
function contextScore(b,mode,map){if(!b)return 0;const m=metaEntry(b,mode,map);const personal=personalScore(b);const meta=m?.score??50;return Math.round(meta*.55+personal*.45)}
function status(b){const r=readiness(b);if((b.power||0)>=11&&r>=75)return ['PLAY NOW','ok'];if((b.power||0)>=9)return ['UPGRADE TO META',''];return ['LOW POWER','miss']}
function compIcon(type,item,b=null){if(!item)return '';const paths={gadgets:'gadgets/borderless',starPowers:'star-powers/borderless',gears:'gears/regular',hyperCharges:'hypercharges/regular',gadget:'gadgets/borderless',star:'star-powers/borderless',gear:'gears/regular',hc:'hypercharges/regular'};const c=catalogEntry(b);const pool=Object.values(CATALOG_STATE.entries||{});const list=type==='gadgets'||type==='gadget'?c?.gadgets:type==='starPowers'||type==='star'?c?.starPowers:null;const mapped=list?.find(x=>x&&((x.id!=null&&x.id===item.id)||norm(x.name)===norm(item.name)))||pool.flatMap(x=>type==='gadgets'||type==='gadget'?(x.gadgets||[]):type==='starPowers'||type==='star'?(x.starPowers||[]):[]).find(x=>x&&((x.id!=null&&x.id===item.id)||norm(x.name)===norm(item.name)));const src=mapped?.imageUrl||(paths[type]&&item.id?img(paths[type],item.id):'');return src?'<img class="compIcon" loading="lazy" src="'+esc(src)+'" alt="">':''}
function comp(type,label,item){return '<div class="comp '+(item?'owned':'missing')+'">'+compIcon(type,item)+'<div><span>'+label+'</span><b>'+esc(item?.name||'Non posseduto')+'</b></div></div>'}
function first(a){return Array.isArray(a)&&a.length?a[0]:null}
function buildLabel(b){const o=owned(b);return [o.gadgets?'Gadget':'Gadget missing',o.stars?'Star Power':'Star Power missing',o.gears?'Gear':'Gear missing',o.hc?'Hypercharge':'Hypercharge missing'].join(' · ')}
function why(b,mode,map){const m=metaEntry(b,mode,map);const reasons=[];if(readiness(b)>=75)reasons.push('build già pronta');if(b.power>=11)reasons.push('Power 11');if((b.trophies||0)>=500)reasons.push('buona esperienza sul Brawler');if(m?.reason)reasons.push(m.reason);if(!reasons.length)reasons.push('dati account disponibili');return reasons.join(' · ')}
function recommendationTag(b,mode,map){return META_STATE.loaded&&metaEntry(b,mode,map)?'META + ACCOUNT':'ACCOUNT ONLY'}
function norm(s){return String(s||'').toUpperCase().replace(/[’']/g,"'").replace(/[^A-Z0-9]+/g,' ').trim()}
function buildEntry(b){if(!b)return null;return BUILD_STATE.entries[b.name]||BUILD_STATE.entries[norm(b.name)]||BUILD_STATE.entries[String(b.name||'').toUpperCase()]||null}
function bestBuildItem(entry,type,index=0){const a=entry?.[type]||[];return a[index]||null}
function ownedNames(b,type){return b?(b[type]||[]).filter(Boolean).map(x=>norm(x?.name)):[]}
function itemState(b,type,item){
 if(!item)return 'DATA MISSING';
 const owned=ownedNames(b,type).includes(norm(item.name));
 return owned?'EQUIPAGGIA':'DA COMPRARE';
}
function advisorRow(b,label,type,item){
 if(!item)return '';
 const state=itemState(b,type,item);
 const pct=item.pick!=null?' · '+item.pick+'% pick':'';
 return '<div class="advisorRow"><div class="advisorIcon">'+compIcon(type,item)+'</div><div class="grow"><b>'+esc(item.name)+'</b><span class="small">'+esc(label)+pct+'</span></div><span class="chip '+(state==='EQUIPAGGIA'?'ok':'')+'">'+state+'</span></div>';
}
function buildActionLine(b){
 const e=buildEntry(b);
 if(!isOwnedAccount(b))return '<span class="actionPill buyAction">DA SBLOCCARE</span>';
 if(!e)return '<span class="actionPill mutedAction">BUILD DA VERIFICARE</span>';
 const actions=[];
 const defs=[['GADGET','gadgets',bestBuildItem(e,'gadget')],['SP','starPowers',bestBuildItem(e,'starPower')],['G1','gears',bestBuildItem(e,'gears',0)],['G2','gears',bestBuildItem(e,'gears',1)]];
 for(const [label,type,item] of defs){
   if(!item)continue;
   const has=ownedNames(b,type).includes(norm(item.name));
   actions.push('<span class="actionPill '+(has?'equipAction':'buyAction')+'">'+(has?'EQUIPAGGIA ':'COMPRA ')+esc(label)+'</span>');
 }
 if((b.power||0)<11)actions.unshift('<span class="actionPill powerAction">PORTA P11</span>');
 return actions.slice(0,3).join('');
}
function miniBuild(b){
 const e=buildEntry(b);
 if(!e)return '<div class="miniBuild mutedBuild"><span class="miniState">BUILD N/D</span><span class="miniHint">nessun dato verificato</span></div>';
 const items=[
  ['G','gadgets',bestBuildItem(e,'gadget')],
  ['SP','starPowers',bestBuildItem(e,'starPower')],
  ['G1','gears',bestBuildItem(e,'gears',0)],
  ['G2','gears',bestBuildItem(e,'gears',1)]
 ];
 return '<div class="miniBuild">'+items.map(([label,type,item])=>{
   if(!item)return '<span class="miniItem unknown">'+label+' · —</span>';
   const has=isOwnedAccount(b)&&ownedNames(b,type).includes(norm(item.name));
   const pick=item.pick!=null?' '+item.pick+'%':'';
   return '<span class="miniItem '+(has?'ownedMini':'buyMini')+'">'+compIcon(type,item,b)+'<b>'+label+'</b><em>'+ (has?'✓':'＋')+pick+'</em></span>';
 }).join('')+'</div>';
}
function metaRankList(mode,map){
 return allBrawlers().map(b=>({b,meta:metaEntry(b,mode,map)})).filter(x=>x.meta?.score!=null).sort((a,z)=>(z.meta.score-a.meta.score)||((a.meta.rank||999)-(z.meta.rank||999)));
}
function globalRankList(){return metaRankList('','Random').sort((a,z)=>(z.meta.score-a.meta.score)||((a.meta.rank||999)-(z.meta.rank||999)))}
function metaRankOf(b,mode,map){
 if(!b)return null;
 const list=metaRankList(mode,map);
 const i=list.findIndex(x=>x.b.id===b.id||norm(x.b.name)===norm(b.name));
 return i>=0?i+1:null;
}
function recommendationTag(b,mode,map){const s=metaScope(b,mode,map);return s==='NON DISPONIBILE'?'DATI N/D':s}
function buildAdvisor(b){
 const e=buildEntry(b);
 if(!e)return '<section class="card"><div class="sectionTitle"><h3>Build Advisor</h3><span class="chip">DATI IN ATTESA</span></div><p class="small">Non abbiamo ancora una build community verificata per questo Brawler. Non inventiamo una scelta: verrà aggiunta con il prossimo sync.</p></section>';
 const rows=[advisorRow(b,'Gadget consigliato','gadgets',bestBuildItem(e,'gadget')),advisorRow(b,'Star Power consigliata','starPowers',bestBuildItem(e,'starPower')),advisorRow(b,'Gear 1 consigliato','gears',bestBuildItem(e,'gears',0)),advisorRow(b,'Gear 2 consigliato','gears',bestBuildItem(e,'gears',1))].join('');
 const hc=b.power>=11&&(!b.hyperCharges||!b.hyperCharges.length)?'<div class="advisorRow"><div class="grow"><b>Hypercharge</b><span class="small">Power 11 raggiunto ma Hypercharge non posseduta</span></div><span class="chip">DA CONSIDERARE</span></div>':'';
 return '<section class="card"><div class="sectionTitle"><h3>Build Advisor</h3><span class="chip ok">COMMUNITY</span></div><p class="small">Il consiglio confronta la build community con ciò che possiedi. Se manca un componente: DA COMPRARE. Se lo possiedi: EQUIPAGGIA.</p>'+rows+hc+'<p class="small">Fonte: <a href="'+esc(e.sourceUrl)+'" target="_blank" rel="noopener">NOFF</a>'+(e.sample?' · '+fmt(e.sample)+' build':'')+'</p></section>';
}

function nav(){return '<nav class="nav">'+[['home','⌂','Home'],['play','▶','Play'],['brawlers','●','Brawlers'],['upgrade','↗','Upgrade'],['meta','✦','Meta']].map(x=>'<button class="'+(tab===x[0]?'active':'')+'" onclick="setTab(\''+x[0]+'\')">'+x[1]+'<br>'+x[2]+'</button>').join('')}
function shell(body){document.getElementById('app').innerHTML='<div class="app"><header class="top"><div class="brand"><div class="logo">Brawl <span>Helper</span></div><div class="sync">'+(active?'PROFILE':'NO PROFILE')+'</div></div><button class="profileBtn" onclick="profilePanel()">'+esc(active||'Profilo')+'</button></header><main class="content">'+body+'</main>'+nav()+'</div>'}
function setTab(t){tab=t;selected=null;query='';filter='all';render()}

function bcard(b,compact=false,mode=playMode,map=playMap,rank=null,kind=''){
 if(!b)return '';
 const o=owned(b),st=status(b),score=contextScore(b,mode,map),m=metaEntry(b,mode,map),metaRank=rank||metaRankOf(b,mode,map);
 const ownedAccount=isOwnedAccount(b);
 const titleRank=metaRank?'<span class="metaRank">#'+metaRank+'</span>':'';
 const action=buildActionLine(b);
 return '<div class="card bcard '+(kind==='recommended'?'recommendedCard':'')+'" onclick="openB('+b.id+')"><div class="row"><div class="rankBadge">'+titleRank+'</div><img class="portrait" src="'+portrait(b)+'" onerror="this.style.opacity=.25"><div class="grow"><div class="bname">'+esc(b.name)+'</div><div class="small bMetaLine">'+(ownedAccount?'P'+b.power+' · '+fmt(b.trophies)+' 🏆':'NON POSSEDUTO')+' <span>·</span> '+esc(metaScope(b,mode,map))+'</div><div class="chips"><span class="chip '+st[1]+'">'+(ownedAccount?st[0]:'DA SBLOCCARE')+'</span><span class="chip '+(m?'metaChip':'')+'">'+(m?'META':'N/D')+'</span><span class="chip">Score '+score+'</span></div>'+miniBuild(b)+'<div class="actionLine">'+action+'</div></div></div>'+(!compact?'<div class="chips detailChips"><span class="chip '+(o.gadgets?'ok':'miss')+'">G '+o.gadgets+'/2</span><span class="chip '+(o.stars?'ok':'miss')+'">SP '+o.stars+'/2</span><span class="chip '+(o.gears?'ok':'miss')+'">Gear '+o.gears+'/2</span><span class="chip '+(o.hc?'ok':'miss')+'">HC '+o.hc+'</span></div>':'')+'</div>'
}

function home(){
 const ranked=metaRankList(playMode,playMap);
 const hasMeta=ranked.length>0;
 const my=hasMeta?ranked.filter(x=>isOwnedAccount(x.b)).sort((a,z)=>contextScore(z.b,playMode,playMap)-contextScore(a.b,playMode,playMap)).slice(0,5):[...(P?.brawlers||[])].sort((a,z)=>personalScore(z)-personalScore(a)).slice(0,5).map(b=>({b,meta:null}));
 const myIds=new Set(my.map(x=>x.b.id));
 const catalog=allBrawlers().filter(b=>b&&!myIds.has(b.id)&&!isOwnedAccount(b));
 const rec=hasMeta?ranked.filter(x=>!myIds.has(x.b.id)).slice(0,5):catalog.sort((a,z)=>z.id-a.id).slice(0,5).map(b=>({b,meta:null}));
 const ctx=hasMeta?metaScope(my[0]?.b||rec[0]?.b,playMode,playMap):'ACCOUNT ONLY';
 return '<section class="hero"><div class="eyebrow">ACCOUNT</div><h1>'+esc(P.name)+'</h1><div class="tag">'+esc(P.tag)+' · livello '+P.expLevel+'</div><div class="stats"><div class="stat"><b>'+fmt(P.trophies)+'</b><span>TROFEI</span></div><div class="stat"><b>'+P.brawlers.length+'</b><span>BRAWLER</span></div><div class="stat"><b>'+fmt(P['3vs3Victories'])+'</b><span>VITTORIE 3V3</span></div></div><div class="rank"><span>Ranked · '+esc(P.rankedRankName||'—')+'</span><b>'+fmt(P.rankedElo)+' Elo</b></div></section>'+
 '<section class="section"><div class="sectionTitle"><h2>Top 10 per te</h2><span class="small">'+esc(playMode)+' · '+esc(playMap)+'</span></div><div class="top10Legend"><span class="legendOwned">TUOI · combinazione migliore</span><span class="legendMeta">'+(hasMeta?'META · prossimi consigliati':'CATALOGO · da considerare')+'</span></div><div class="subhead">I TUOI 5</div>'+my.map((x,i)=>bcard(x.b,true,playMode,playMap,x.meta?.rank||metaRankOf(x.b,playMode,playMap),'ownedTop')).join('')+'<div class="subhead">5 DA CONSIDERARE</div>'+rec.map(x=>bcard(x.b,true,playMode,playMap,x.meta.rank||metaRankOf(x.b,playMode,playMap),'recommended')).join('')+'</section>'+
 '<section class="section"><div class="sectionTitle"><h2>Upgrade Advisor</h2><span class="small">Azioni immediate</span></div>'+my.slice(0,4).map(x=>'<div class="action" onclick="openB('+x.b.id+')"><b>'+esc(x.b.name)+' · Meta #'+(x.meta.rank||metaRankOf(x.b,playMode,playMap)||'—')+'</b><span class="small">'+buildActionLine(x.b)+'</span></div>').join('')+'</section>'
}

function brawlers(){
 let bs=[...(P.brawlers||[])].filter(Boolean);
 if(query)bs=bs.filter(b=>b.name.toLowerCase().includes(query.toLowerCase()));
 if(filter==='p11')bs=bs.filter(b=>b.power>=11);
 if(filter==='upgrade')bs=bs.filter(b=>b.power<11);
 if(filter==='missing')bs=bs.filter(b=>{const o=owned(b);return o.gadgets<2||o.stars<2||o.gears<2||o.hc<1});
 bs.sort((a,b)=>b.trophies-a.trophies);
 return '<section class="section"><div class="sectionTitle"><h2>My Brawlers · '+P.brawlers.length+'</h2><span class="small">'+bs.length+' visualizzati</span></div><input class="search" placeholder="Cerca Brawler..." value="'+esc(query)+'" oninput="query=this.value;render()"><div class="filters"><button class="'+(filter==='all'?'active':'')+'" onclick="filter=\'all\';render()">Tutti</button><button class="'+(filter==='p11'?'active':'')+'" onclick="filter=\'p11\';render()">Power 11</button><button class="'+(filter==='upgrade'?'active':'')+'" onclick="filter=\'upgrade\';render()">Da migliorare</button><button class="'+(filter==='missing'?'active':'')+'" onclick="filter=\'missing\';render()">Build incomplete</button></div>'+bs.map(bcard).join('')+'</section>'
}

function detail(){
 const b=P.brawlers.find(x=>x&&x.id===selected)||allBrawlers().find(x=>x&&x.id===selected); if(!b)return '';
 const accountOwned=isOwnedAccount(b),o=owned(b),g=first(b.gadgets),sp=first(b.starPowers),gear1=b.gears?.[0],gear2=b.gears?.[1],hc=first(b.hyperCharges),m=metaEntry(b,playMode,playMap);
 return '<button class="back" onclick="selected=null;render()">← Torna ai Brawler</button>'+
 '<section class="hero"><div class="row"><img class="portrait" src="'+portrait(b)+'"><div class="grow"><div class="eyebrow">BRAWLER</div><h1>'+esc(b.name)+'</h1><div class="muted">'+(accountOwned?'Power '+b.power+' · Rank '+b.rank:'Non posseduto')+'</div><div class="muted">'+(accountOwned?fmt(b.trophies)+' / '+fmt(b.highestTrophies)+' trofei':'Meta #'+(metaRankOf(b,playMode,playMap)||'—'))+'</div></div></div><div class="chips"><span class="chip">Personal '+personalScore(b)+'</span><span class="chip '+status(b)[1]+'">'+status(b)[0]+'</span></div></section>'+
 '<section class="section"><h2>Build account</h2><div class="actionLine">'+buildActionLine(b)+'</div><div class="componentGrid">'+comp('gadget','Gadget',g)+comp('star','Star Power',sp)+comp('gear','Gear 1',gear1)+comp('gear','Gear 2',gear2)+comp('hc','Hypercharge',hc)+'</div></section>'+buildAdvisor(b)+
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
 const ranked=metaRankList(playMode,playMap);
 const ready=ranked.filter(x=>isOwnedAccount(x.b)).sort((a,z)=>contextScore(z.b,playMode,playMap)-contextScore(a.b,playMode,playMap));
 const recommended=ranked.filter(x=>!isOwnedAccount(x.b)).slice(0,5);
 return '<section class="section"><div class="sectionTitle"><h2>Play</h2><span class="small">'+esc(metaScope(ready[0]?.b||recommended[0]?.b,playMode,playMap))+'</span></div><div class="notice">Cambiando modalità o mappa cambia la classifica. La Top 5 personale considera solo i Brawler posseduti; i consigliati mantengono il loro rank reale nel meta.</div><div class="filters">'+Object.keys(MODES).map(m=>'<button class="'+(playMode===m?'active':'')+'" onclick="playMode=\''+m+'\';playMap=\'Random\';render()">'+m+'</button>').join('')+'</div><select class="search" onchange="playMap=this.value;render()">'+names.map(m=>'<option '+(playMap===m?'selected':'')+'>'+m+'</option>').join('')+'</select><div class="context"><span>MODALITÀ</span><b>'+esc(playMode)+'</b><span>MAPPA</span><b>'+esc(playMap)+'</b></div><section class="section"><div class="sectionTitle"><h2>I tuoi 5</h2><span class="small">combinazione meta + account</span></div>'+ready.slice(0,5).map((x,i)=>'<div class="rankPick"><span class="num">'+(i+1)+'</span><div class="grow">'+bcard(x.b,true,playMode,playMap,x.meta.rank||metaRankOf(x.b,playMode,playMap),'ownedTop')+'</div></div>').join('')+'</section><section class="section"><div class="sectionTitle"><h2>Meta da considerare</h2><span class="small">non posseduti</span></div>'+recommended.map(x=>'<div class="rankPick"><span class="num">#'+(x.meta.rank||metaRankOf(x.b,playMode,playMap)||'—')+'</span><div class="grow">'+bcard(x.b,true,playMode,playMap,x.meta.rank||metaRankOf(x.b,playMode,playMap),'recommended')+'</div></div>').join('')+'</section></section>'
}

function upgrade(){
 const list=[...(P.brawlers||[])].filter(Boolean).filter(b=>b.power<11||owned(b).gears<2||owned(b).hc<1).sort((a,b)=>personalScore(b)-personalScore(a)).slice(0,20);
 return '<section class="section"><div class="sectionTitle"><h2>Upgrade Advisor</h2><span class="small">20 opportunità</span></div><div class="notice">Qui vediamo cosa hai già e cosa manca rispetto alla build community disponibile.</div>'+list.map((b,i)=>'<div class="upgradeRow" onclick="openB('+b.id+')"><span class="num">'+(i+1)+'</span><div class="grow"><b class="upgradeName">'+esc(b.name)+'</b><span class="small upgradeMetaLine">Power '+b.power+' · '+fmt(b.trophies)+' trofei · Personal '+personalScore(b)+'</span>'+miniBuild(b)+'</div><span class="score">'+(b.power<11?'POWER':'BUILD')+'</span></div>').join('')+'</section>'
}

function meta(){
 const names=Object.keys(META_STATE.entries);
 const releases=DB_STATE.changelog||[];
 return '<section class="section"><h2>Meta & Database</h2>'+
 '<div class="notice"><b>'+(META_STATE.loaded?'Snapshot meta caricata':'Meta live non ancora collegato')+'</b><br>'+
 (META_STATE.loaded?'Fonte: '+esc(META_STATE.source||'snapshot')+' · Aggiornamento: '+esc(META_STATE.updatedAt||'—'):'Il database di gioco e il changelog ufficiale sono separati dai dati personali dell’account.')+
 '</div>'+
 '<div class="card"><b>Game Database</b><div class="grid"><div class="action"><b>'+fmt(CATALOG_STATE.count)+'</b><span class="small">Brawler nel catalogo</span></div><div class="action"><b>'+esc(DB_STATE.patch||'—')+'</b><span class="small">Patch corrente</span></div><div class="action"><b>'+esc(DB_STATE.version||'—')+'</b><span class="small">DB version</span></div></div><p class="small">Ultimo sync: '+esc(DB_STATE.lastSyncedAt||'—')+'</p></div>'+
 '<div class="card"><b>Changelog ufficiale</b>'+ (releases.length?releases.slice(0,5).map(c=>'<div class="action"><b>'+esc(c.title)+'</b><span class="small">'+esc(c.publishedAt||'')+' · '+esc(c.highlights?.[0]||c.status||'Fonte ufficiale Supercell')+'</span></div>').join(''):'<p class="small">Nessun changelog disponibile.</p>')+'</div>'+
 (names.length?'<div class="card"><b>Meta snapshot</b>'+names.map(n=>{const b=P.brawlers.find(x=>x&&x.name===n);return b?bcard(b,true):''}).join('')+'</div>':'<div class="card"><b>Meta provider</b><p class="small">La struttura è pronta per ricevere snapshot verificabili per patch, modalità e mappa.</p></div>')+
 '</section>'
}

async function loadCatalog(){
 try{
  const d=await fetchJson('https://api.brawlapi.com/v1/brawlers',6000);
  const list=d.list||[];
  CATALOG_STATE.loaded=true;CATALOG_STATE.count=list.length;
  CATALOG_STATE.entries=Object.fromEntries(list.filter(x=>x&&x.id&&x.name).map(x=>[x.name,x]));list.forEach(b=>{const im=new Image();if(b.imageUrl)im.src=b.imageUrl;(b.gadgets||[]).concat(b.starPowers||[]).forEach(x=>{if(x.imageUrl){const ci=new Image();ci.src=x.imageUrl}})});
 }catch(e){console.warn('Catalogo BrawlAPI non disponibile',e)}
}
async function loadMeta(){
  try{
    const d=await fetchJson('data/meta.json',5000);META_STATE.loaded=!!d.updatedAt;META_STATE.source=d.source;META_STATE.updatedAt=d.updatedAt;META_STATE.entries=d.entries||{}
  }catch(e){console.warn('Meta snapshot non disponibile',e)}
  try{
    const base=apiBase();
    const dbUrl=base?base+'/api/database':'data/game-db.json';
    const clUrl=base?base+'/api/changelog':'data/changelog.json';
    const [dr,cr,br]=await Promise.allSettled([fetchJson(dbUrl,5000),fetchJson(clUrl,5000),fetchJson('data/build-meta.json',5000)]);
    if(dr.status==='fulfilled'){const d=dr.value;DB_STATE.loaded=true;DB_STATE.version=d.databaseVersion||null;DB_STATE.patch=d.patch?.id||null;DB_STATE.lastSyncedAt=d.lastSyncedAt||null}
    if(cr.status==='fulfilled'){const c=cr.value;DB_STATE.changelog=c.releases||[]}
    if(br.status==='fulfilled'){const b=br.value;BUILD_STATE.loaded=true;BUILD_STATE.updatedAt=b.updatedAt||null;BUILD_STATE.entries=b.entries||{};BUILD_STATE.sources=b.sources||[]}
  }catch(e){console.warn('Game database non disponibile',e)}
}

function profilePanel(){
 const rows=profiles.map(p=>'<div class="profileRow"><button onclick="activate(\''+esc(p.name||p.tag)+'\')"><b>'+esc(p.name||p.tag)+'</b><span>'+esc(p.tag)+(p.test?' · TEST':'')+'</span></button><button class="del" onclick="removeProfile(\''+esc(p.name||p.tag)+'\')">×</button></div>').join('');
 document.getElementById('app').insertAdjacentHTML('beforeend','<div class="modal"><div class="modalBox"><div class="modalHead"><h2>Profili</h2><button onclick="closeModal()">×</button></div>'+rows+'<div class="profileForm"><input id="newName" placeholder="Nome profilo (opzionale)"><input id="newTag" placeholder="Player Tag, es. #22QYOQRGY"><button class="primary" onclick="addProfile()">Aggiungi account</button></div><div class="profileForm"><input id="apiBase" placeholder="Backend API URL (opzionale)" value="'+esc(apiBase())+'"><button onclick="saveApiBase()">Salva backend</button></div><div class="small">Il nome è opzionale: con un account reale verrà usato automaticamente il nome restituito dall'API Brawl Stars.</div><button class="close" onclick="closeModal()">Chiudi</button></div></div>')
}
function closeModal(){document.querySelector('.modal')?.remove()}
function activate(name){const p=profiles.find(x=>(x.name||x.tag)===name);if(!p)return;active=p.name||p.tag;localStorage.setItem('bh_active',active);closeModal();loadProfile(p)}
function removeProfile(name){const p=profiles.find(x=>(x.name||x.tag)===name);profiles=profiles.filter(x=>x!==p);saveProfiles();if(p&&(active===p.name||active===p.tag)){active='';localStorage.removeItem('bh_active');P=null}closeModal();render()}
async function addProfile(){
 const name=document.getElementById('newName').value.trim();
 const tag=document.getElementById('newTag').value.trim().toUpperCase();
 if(!/^#[A-Z0-9]+$/.test(tag)){alert('Inserisci un Player Tag valido.');return}
 if(profiles.some(p=>p.tag===tag)){alert('Player Tag già presente.');return}
 const p={name:name||'',tag,test:false};
 profiles.push(p);saveProfiles();active=name||tag;localStorage.setItem('bh_active',active);closeModal();await loadProfile(p)
}
function saveApiBase(){const v=document.getElementById('apiBase').value.trim().replace(/\/$/,'');if(v)localStorage.setItem('bh_api_base',v);else localStorage.removeItem('bh_api_base');closeModal();alert('Backend salvato.')}
async function loadProfile(p){
 selected=null;tab='home';
 if(p.test || (p.tag==='#22QYOQRGY' && window.BH_TEST_PROFILE)){P=window.BH_TEST_PROFILE||null;if(!P)console.warn('Profilo TEST incorporato non disponibile');render();return}
 if(!apiBase()){P=null;render();document.getElementById('app').insertAdjacentHTML('beforeend','<div class="modal"><div class="modalBox"><h2>Backend non collegato</h2><p>Il Player Tag è stato salvato, ma questa versione web non può chiamare direttamente l'API ufficiale Brawl Stars senza un backend.</p><p class="small">Inserisci il Backend API URL nelle impostazioni Profili. La chiave API non deve mai essere inserita nell'app.</p><button class="close" onclick="closeModal()">OK</button></div></div>');return}
 try{const r=await fetch(apiBase()+'/api/player/'+encodeURIComponent(p.tag.slice(1)));if(!r.ok)throw new Error('Backend HTTP '+r.status);P=await r.json();
 const serverName=String(P?.name||'').trim();
 if(serverName && !p.test){
   const oldKey=p.name||p.tag;
   p.name=serverName;
   profiles=profiles.map(x=>x===p?{...p}:x);
   saveProfiles();
   if(active===oldKey || active===p.tag){active=serverName;localStorage.setItem('bh_active',active)}
 }
 render()}catch(e){P=null;render();document.getElementById('app').insertAdjacentHTML('beforeend','<div class="modal"><div class="modalBox"><h2>Errore collegamento</h2><p>'+esc(e.message)+'</p><button class="close" onclick="closeModal()">OK</button></div></div>')}
}
function openB(id){selected=id;render()}
function render(){
 const paint=()=>{if(!P){shell('<section class="hero"><div class="eyebrow">ACCOUNT</div><h1>Nessun profilo attivo</h1><p class="muted">Apri Profili e aggiungi il tuo Player Tag. Il profilo BlackShark è disponibile solo come ambiente di test.</p><button class="primary" onclick="profilePanel()">Gestisci profili</button></section>');return}if(selected)shell(detail());else if(tab==='home')shell(home());else if(tab==='brawlers')shell(brawlers());else if(tab==='play')shell(play());else if(tab==='upgrade')shell(upgrade());else shell(meta())};
 if(document.startViewTransition){document.startViewTransition(paint)}else{paint()}
}
function showFatal(e){console.error('Brawl Helper fatal error',e);const msg=e?.message||String(e);const stack=e?.stack?'<details style="margin-top:12px"><summary>Dettagli tecnici</summary><pre style="white-space:pre-wrap;color:#ff9b9b;font-size:11px">'+esc(e.stack)+'</pre></details>':'';document.getElementById('app').innerHTML='<div style="min-height:100vh;background:#10131a;color:#fff;font-family:Arial,sans-serif;padding:28px;box-sizing:border-box"><h1>Brawl Helper</h1><p>Si è verificato un errore di caricamento.</p><pre style="white-space:pre-wrap;color:#ff9b9b">'+esc(msg)+'</pre>'+stack+'<button style="padding:14px 18px;border:0;border-radius:12px" onclick="location.reload()">Riprova</button></div>'}
function loading(){document.getElementById('app').innerHTML='<div style="min-height:100vh;background:#10131a;color:#fff;font-family:Arial,sans-serif;display:flex;align-items:center;justify-content:center"><div style="text-align:center"><div style="font-size:28px;font-weight:800">Brawl Helper</div><div style="opacity:.65;margin-top:8px">Caricamento profilo…</div></div></div>'}
async function boot(){try{loading();let testProfile=profiles.find(x=>x.test);if(!testProfile){testProfile={name:'BlackShark TEST',tag:'#22QYOQRGY',test:true};profiles=[testProfile,...profiles];saveProfiles()}let p=profiles.find(x=>(x.name||x.tag)===active);
if(!p||(!apiBase()&&!p.test&&p.tag!=='#22QYOQRGY')){p=testProfile;active=p.name;localStorage.setItem('bh_active',active)}
else{active=p.name||p.tag;localStorage.setItem('bh_active',active)}await loadProfile(p);Promise.allSettled([loadMeta(),loadCatalog()]).then(()=>{if(P)render()});}catch(e){showFatal(e)}}
boot().catch(showFatal);