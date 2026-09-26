let P=null,active=localStorage.getItem('bh_player_tag')||'',profileStatus='OFFLINE',profileSyncAt=null,tab='home',query='',filter='all',selected=null,playMode='Ranked',playMap='Random';
const DEV_MODE=false;
const DEV_TEST_TAG='#22QYOQRGY';

const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const fmt=n=>Number(n||0).toLocaleString('en-US');
const apiBase=()=>localStorage.getItem('bh_api_base')||'https://brawl-helper-backend.onrender.com';
const normalizeTag=v=>{const t=String(v||'').trim().toUpperCase();return t.startsWith('#')?t:'#'+t};
const META_STATE={loaded:false,source:null,updatedAt:null,entries:{}};
const DB_STATE={loaded:false,version:null,patch:null,lastSyncedAt:null,changelog:[]};
const BUILD_STATE={loaded:false,updatedAt:null,entries:{},sources:[]};
const CATALOG_STATE={loaded:false,count:0,entries:{}};
const PROVIDER_STATE={loaded:false,providers:[],report:null};

async function fetchJson(url,ms=7000){const ctl=new AbortController();const t=setTimeout(()=>ctl.abort(),ms);try{const r=await fetch(url,{cache:'no-store',signal:ctl.signal});if(!r.ok)throw new Error('HTTP '+r.status+' · '+url);return await r.json()}finally{clearTimeout(t)}}

function img(kind,id){return 'https://cdn.brawlify.com/'+kind+'/'+id+'.png'}
function catalogEntry(b){if(!b)return null;return CATALOG_STATE.entries[b.name]||Object.values(CATALOG_STATE.entries||{}).find(x=>x&&x.id===b.id)||null}
function portrait(b){return catalogEntry(b)?.imageUrl||b?.imageUrl||img('brawlers/borders',b?.id)}
function owned(b){return {gadgets:b?.gadgets?.length||0,stars:b?.starPowers?.length||0,gears:b?.gears?.length||0,hc:b?.hyperCharges?.length||0,buffies:b?.buffies||{}}}
function readiness(b){if(!b)return 0;const e=b.power||1;const eq=(b.gadgets?.length||0)+(b.starPowers?.length||0)+(b.gears?.length||0)+(b.hyperCharges?.length||0);return Math.min(100,Math.round(e*6+Math.min(eq,6)*3))}
function equippedNames(b,type){return (b?.[type]||[]).filter(Boolean).map(x=>norm(x?.name))}
function ownedMapKey(b){return 'bh_owned_'+active+'_'+(b?.id||'unknown')}
function manualOwnership(b){try{return JSON.parse(localStorage.getItem(ownedMapKey(b)||'{}')||'{}')||{}}catch{return {}}}
function manualItemState(b,type,item){if(!item)return null;const m=manualOwnership(b),k=type+':'+(item.id??norm(item.name));return Object.prototype.hasOwnProperty.call(m,k)?m[k]:null}
function setManualOwnership(bid,type,itemId,value){const b=allBrawlers().find(x=>x&&x.id===bid);if(!b)return;const m=manualOwnership(b),k=type+':'+itemId;if(value===null)delete m[k];else m[k]=!!value;localStorage.setItem(ownedMapKey(b),JSON.stringify(m));render()}
function itemStatus(b,type,item){if(!item)return 'DATA N/A';if(equippedNames(b,type).includes(norm(item.name)))return 'EQUIPPED';const manual=manualItemState(b,type,item);if(manual===true)return 'OWNED';if(manual===false)return 'NOT OWNED';return 'UNKNOWN'}
function actionForItem(b,type,item){const s=itemStatus(b,type,item);return s==='EQUIPPED'?'READY':s==='OWNED'?'EQUIP':s==='NOT OWNED'?'BUY':'CHECK'}
function itemState(b,type,item){return itemStatus(b,type,item)}
function ownershipControl(b,type,item){if(!item)return '';const s=itemStatus(b,type,item);if(s==='EQUIPPED')return '<span class="ownershipApi">EQUIPPED · API</span>';return '<div class="ownershipControls"><button type="button" onclick="event.stopPropagation();setManualOwnership('+b.id+',\''+type+'\','+item.id+',true)">I OWN IT</button><button type="button" onclick="event.stopPropagation();setManualOwnership('+b.id+',\''+type+'\','+item.id+',false)">BUY</button><button type="button" onclick="event.stopPropagation();setManualOwnership('+b.id+',\''+type+'\','+item.id+',null)">RESET</button></div>'}
function recommendationAction(b,type,item){return actionForItem(b,type,item)}
function buildItems(b){const e=buildEntry(b);return [['Gadget','gadgets',bestBuildItem(e,'gadget')],['Star Power','starPowers',bestBuildItem(e,'starPower')],['Gear 1','gears',bestBuildItem(e,'gears',0)],['Gear 2','gears',bestBuildItem(e,'gears',1)]].filter(x=>x[2])}
function nextActions(b){const actions=[];if(!isOwnedAccount(b))return [{type:'UNLOCK',label:'Unlock Brawler',priority:100,reason:'This Brawler is not on the account.'}];if((b.power||0)<11)actions.push({type:'POWER',label:'Reach Power 11',priority:100-(b.power||0),reason:'Power 11 unlocks the full build path.'});for(const [label,type,item] of buildItems(b)){const s=itemStatus(b,type,item);if(s==='NOT OWNED')actions.push({type:'BUY',label:'Buy '+label+': '+item.name,priority:70+Number(item.pick||0)*.4,reason:'Marked as not owned and selected by the current build data.'});else if(s==='OWNED')actions.push({type:'EQUIP',label:'Equip '+label+': '+item.name,priority:55+Number(item.pick||0)*.3,reason:'You marked this component as owned but it is not currently equipped.'});else if(s==='UNKNOWN')actions.push({type:'CHECK',label:'Check '+label+': '+item.name,priority:20+Number(item.pick||0)*.1,reason:'Ownership is not available from the public profile. Confirm it once to unlock precise BUY/EQUIP guidance.'})}return actions.sort((a,z)=>z.priority-a.priority)}
function upgradePriority(b){const actions=nextActions(b),m=metaEntry(b,playMode,playMap),metaScore=Number(m?.score||0);return {score:Math.round(Math.min(100,(actions[0]?.priority||0)+metaScore*.12)),actions:actions.slice(0,4),metaScore}}
function componentCatalogItem(type,item,b=null){if(!item)return null;const c=catalogEntry(b);const key=({gadgets:'gadgets',gadget:'gadgets',starPowers:'starPowers',star:'starPowers',gears:'gears',gear:'gears',hyperCharges:'hyperCharges',hc:'hyperCharges',buffies:'buffies',buffie:'buffies'})[type];const local=c?.[key]||[];const pool=Object.values(CATALOG_STATE.entries||{}).flatMap(x=>x?.[key]||[]);return [...local,...pool].find(x=>x&&((x.id!=null&&item.id!=null&&x.id===item.id)||norm(x.name)===norm(item.name)))||null}
function compIcon(type,item,b=null){const sym={gadgets:'◈',starPowers:'★',gears:'⚙',hyperCharges:'⚡',buffies:'✦',overdrives:'◉',gadget:'◈',star:'★',gear:'⚙',hc:'⚡',buffie:'✦',overdrive:'◉'}[type]||'•';if(!item)return '<span class="compIcon fallbackIcon">'+sym+'</span>';const paths={gadgets:'gadgets/borderless',starPowers:'star-powers/borderless',gears:'gears/regular',hyperCharges:'hypercharges/regular',buffies:'buffies/regular',overdrives:'overdrives/regular',gadget:'gadgets/borderless',star:'star-powers/borderless',gear:'gears/regular',hc:'hypercharges/regular',buffie:'buffies/regular',overdrive:'overdrives/regular'};const mapped=componentCatalogItem(type,item,b),src=mapped?.imageUrl||(paths[type]&&item.id?img(paths[type],item.id):'');return src?'<img class="compIcon" loading="lazy" src="'+esc(src)+'" alt="" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\'"><span class="compIcon fallbackIcon" style="display:none">'+sym+'</span>':'<span class="compIcon fallbackIcon">'+sym+'</span>'}
function comp(type,label,item){return '<div class="comp '+(item?'owned':'missing')+'">'+compIcon(type,item)+'<div><span>'+label+'</span><b>'+esc(item?.name||'Not owned')+'</b></div></div>'}
function first(a){return Array.isArray(a)&&a.length?a[0]:null}
function buildLabel(b){const o=owned(b);return [o.gadgets?'Gadget':'Gadget missing',o.stars?'Star Power':'Star Power missing',o.gears?'Gear':'Gear missing',o.hc?'Hypercharge':'Hypercharge missing'].join(' · ')}
function why(b,mode,map){const m=metaEntry(b,mode,map);const reasons=[];if(readiness(b)>=75)reasons.push('build already ready');if(b.power>=11)reasons.push('Power 11');if((b.trophies||0)>=500)reasons.push('good Brawler experience');if(m?.reason)reasons.push(m.reason);if(!reasons.length)reasons.push('account data available');return reasons.join(' · ')}
function recommendationTag(b,mode,map){return META_STATE.loaded&&metaEntry(b,mode,map)?'META + ACCOUNT':'ACCOUNT ONLY'}
function norm(s){return String(s||'').toUpperCase().replace(/[’']/g,"'").replace(/[^A-Z0-9]+/g,' ').trim()}
function buildEntry(b){if(!b)return null;return BUILD_STATE.entries[b.name]||BUILD_STATE.entries[norm(b.name)]||BUILD_STATE.entries[String(b.name||'').toUpperCase()]||null}
function bestBuildItem(entry,type,index=0){const a=entry?.[type]||[];return a[index]||null}
function ownedNames(b,type){return b?(b[type]||[]).filter(Boolean).map(x=>norm(x?.name)):[]}
function itemState(b,type,item){if(!item)return 'DATA MISSING';return ownedNames(b,type).includes(norm(item.name))?'OWNED':'BUY'}
function missingBuildActions(b){const e=buildEntry(b),actions=[];if(!isOwnedAccount(b))return [{type:'UNLOCK',label:'Unlock Brawler',priority:30,reason:'This Brawler is not owned on the account.'}];if((b.power||0)<11)actions.push({type:'POWER',label:'Reach Power 11',priority:100+(11-(b.power||0))*8,reason:'Power level is below the full build threshold.'});const defs=[['Gadget','gadgets',bestBuildItem(e,'gadget'),70],['Star Power','starPowers',bestBuildItem(e,'starPower'),64],['Gear','gears',bestBuildItem(e,'gears',0),48],['Gear','gears',bestBuildItem(e,'gears',1),42]];for(const [label,type,item,base] of defs){if(!item)continue;if(!ownedNames(b,type).includes(norm(item.name)))actions.push({type:'BUY',label:'Buy '+label,priority:base+Number(item.pick||0)*.5,reason:item.name+' is the current community build component.'})}if((b.power||0)>=11&&!(b.hyperCharges?.length))actions.push({type:'CONSIDER',label:'Consider Hypercharge',priority:36,reason:'Power 11 is reached and no Hypercharge is recorded.'});return actions.sort((a,z)=>z.priority-a.priority)}
function upgradePriority(b){const actions=missingBuildActions(b),m=metaEntry(b,playMode,playMap);const metaScore=Number(m?.score||0),progress=Math.max(0,11-(b.power||0))*8;const score=Math.round(Math.min(100,(actions[0]?.priority||0)+metaScore*.1+progress));return {score,actions:actions.slice(0,3),metaScore,readinessScore:readiness(b)}}
function advisorRow(b,label,type,item){if(!item)return '';const state=itemStatus(b,type,item),act=recommendationAction(b,type,item),pct=item.pick!=null?' · '+item.pick+'% pick':'';return '<div class="advisorRow"><div class="advisorIcon">'+compIcon(type,item,b)+'</div><div class="grow"><b>'+esc(item.name)+'</b><span class="small">'+esc(label)+pct+'</span></div><span class="chip '+(state==='EQUIPPED'?'ok':state==='NOT OWNED'?'miss':'')+'">'+state+'</span><span class="advisorAction">'+act+'</span></div>'}
function buildActionLine(b){const actions=nextActions(b).slice(0,3);if(!actions.length)return '<span class="actionPill mutedAction">READY</span>';return actions.map(a=>'<span class="actionPill '+(a.type==='BUY'?'buyAction':a.type==='EQUIP'?'equipAction':a.type==='POWER'?'powerAction':'mutedAction')+'">'+esc(a.type==='POWER'?'POWER 11':a.type)+'</span>').join('')}
function miniBuild(b){const items=buildItems(b);if(!items.length)return '<div class="miniBuild mutedBuild"><span class="miniState">BUILD N/A</span><span class="miniHint">verified build data pending</span></div>';return '<div class="miniBuild">'+items.map(([label,type,item])=>{const s=itemStatus(b,type,item),action=s==='EQUIPPED'?'✓':s==='OWNED'?'●':s==='NOT OWNED'?'＋':'?';return '<span class="miniItem '+(s==='EQUIPPED'?'equippedMini':s==='OWNED'?'ownedMini':s==='NOT OWNED'?'buyMini':'unknownMini')+'">'+compIcon(type,item,b)+'<b>'+esc(label)+'</b><em>'+action+'</em></span>'}).join('')+'</div>'}
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
function recommendationTag(b,mode,map){const s=metaScope(b,mode,map);return s==='NOT AVAILABLE'?'DATI N/D':s}
function guideEntry(b){return catalogEntry(b)||b||null}
function guideItem(b,type,item){
 const c=guideEntry(b); if(!item)return null;
 const pool=c?.[type]||[]; return pool.find(x=>x&&((x.id!=null&&x.id===item.id)||norm(x.name)===norm(item.name)))||item;
}
function cleanGuideText(v){return String(v||'').replace(/<[^>]*>/g,' ').replace(/<![^>]*>/g,' ').replace(/\s+/g,' ').trim()}
function componentModal(b,type,item){const x=guideItem(b,type,item);if(!x)return;const title=type==='gadgets'?'Gadget':type==='starPowers'?'Star Power':type==='gears'?'Gear':type==='hyperCharges'?'Hypercharge':type==='buffies'?'Buffie':type==='overdrives'?'Overdrive':'Component';const description=cleanGuideText(x.description||x.descriptionHtml||'No description available.');const state=itemStatus(b,type,item);document.body.insertAdjacentHTML('beforeend','<div class="modal componentModal"><div class="modalBox"><div class="modalHead"><h2>'+esc(x.name||title)+'</h2><button onclick="closeModal()">×</button></div><div class="componentDetail">'+compIcon(type,item,b)+'<div class="eyebrow">'+title.toUpperCase()+'</div><p>'+esc(description)+'</p><div class="stateBox"><b>'+state+'</b><span>'+esc(recommendationAction(b,type,item))+'</span></div>'+ownershipControl(b,type,item)+'</div><button class="close" onclick="closeModal()">Close</button></div></div>')}
function guideComponent(b,label,type,item){if(!item)return '';const x=guideItem(b,type,item),desc=cleanGuideText(x?.description||''),state=itemStatus(b,type,item),act=recommendationAction(b,type,item);return '<button class="guideComponent '+(state==='EQUIPPED'?'equipped':state==='OWNED'?'owned':state==='NOT OWNED'?'missing':'unknown')+'" onclick="componentModalById('+b.id+',\''+type+'\','+(item.id||0)+')" type="button">'+compIcon(type,item,b)+'<span class="grow"><small>'+esc(label)+'</small><b>'+esc(item.name)+'</b><em>'+esc(desc||'View details')+'</em></span><strong>'+state+'</strong><span class="guideAction">'+act+'</span></button>'}
function componentModalById(bid,type,itemId){const b=allBrawlers().find(x=>x&&x.id===bid);if(!b)return;const c=guideEntry(b),item=(c?.[type]||[]).find(x=>x&&x.id===itemId)||null;componentModal(b,type,item)}
function brawlerGuide(b){
 const e=buildEntry(b), c=guideEntry(b), m=metaEntry(b,playMode,playMap);
 const g=bestBuildItem(e,'gadget'),sp=bestBuildItem(e,'starPower'),g1=bestBuildItem(e,'gears',0),g2=bestBuildItem(e,'gears',1),hc=first(b.hyperCharges);
 const desc=cleanGuideText(c?.description||c?.shortDescription||'');
 const modeText=m?('Recommended for '+playMode+(playMap!=='Random'?' on '+playMap:'')):'Meta context not available for this selection.';
 const buildReason=e?'Community build usage is used as the build signal. '+(e.sample?fmt(e.sample)+' submitted builds were available.':''):'No verified community build is available yet.';
 return '<section class="card guideCard"><div class="sectionTitle"><h2>Brawler Guide</h2><span class="chip">'+esc(metaScope(b,playMode,playMap))+'</span></div>'+
 '<p class="guideDescription">'+esc(desc||'Brawler description not available in the current catalog.')+'</p>'+
 '<div class="guideContext"><span>BEST CONTEXT</span><b>'+esc(modeText)+'</b></div>'+
 '<div class="guideGrid">'+guideComponent(b,'Recommended Gadget','gadgets',g)+guideComponent(b,'Recommended Star Power','starPowers',sp)+guideComponent(b,'Recommended Gear 1','gears',g1)+guideComponent(b,'Recommended Gear 2','gears',g2)+'</div>'+
 (hc?guideComponent(b,'Hypercharge','hyperCharges',hc):'')+
 '<div class="guideWhy"><b>Why this build?</b><p>'+esc(buildReason)+'</p></div>'+
 '<p class="small">Tap a component to see what it does. Recommendations are based on available community data and current account context, not official Supercell recommendations.</p></section>';
}
function buildAdvisor(b){
 const e=buildEntry(b);
 if(!e)return '<section class="card"><div class="sectionTitle"><h3>Build Advisor</h3><span class="chip">DATA PENDING</span></div><p class="small">No verified community build is available for this Brawler yet. No recommendation is invented; it will be added after a validated sync.</p></section>';
 const rows=[advisorRow(b,'Recommended Gadget','gadgets',bestBuildItem(e,'gadget')),advisorRow(b,'Recommended Star Power','starPowers',bestBuildItem(e,'starPower')),advisorRow(b,'Recommended Gear 1','gears',bestBuildItem(e,'gears',0)),advisorRow(b,'Recommended Gear 2','gears',bestBuildItem(e,'gears',1))].join('');
 const hc=b.power>=11&&(!b.hyperCharges||!b.hyperCharges.length)?'<div class="advisorRow"><div class="grow"><b>Hypercharge</b><span class="small">Power 11 reached but Hypercharge is not owned</span></div><span class="chip">CONSIDER</span></div>':'';
 return '<section class="card"><div class="sectionTitle"><h3>Build Advisor</h3><span class="chip ok">COMMUNITY</span></div><p class="small">This advisor compares the community build with your account. If a component is missing: BUY. If you own it: EQUIP.</p>'+rows+hc+'<p class="small">Source: <a href="'+esc(e.sourceUrl)+'" target="_blank" rel="noopener">NOFF</a>'+(e.sample?' · '+fmt(e.sample)+' build':'')+'</p></section>';
}

function nav(){return '<nav class="nav">'+[['home','⌂','Home'],['play','▶','Play'],['brawlers','●','Brawlers'],['upgrade','↗','Upgrade'],['meta','✦','Meta']].map(x=>'<button class="'+(tab===x[0]?'active':'')+'" onclick="setTab(\''+x[0]+'\')">'+x[1]+'<br>'+x[2]+'</button>').join('')}
function shell(body){document.getElementById('app').innerHTML='<div class="app"><header class="top"><div class="brand"><div class="logo">Brawl <span>Helper</span></div><div class="sync">'+(active?'PROFILE · '+esc(profileStatus):'NO PROFILE')+'</div></div><button class="profileBtn" onclick="profilePanel()">'+esc(P?.name||active||'Connect profile')+'</button></header><main class="content">'+body+'</main>'+nav()+'</div>'}
function setTab(t){tab=t;selected=null;query='';filter='all';render()}

function bcard(b,compact=false,mode=playMode,map=playMap,rank=null,kind=''){
 if(!b)return '';
 const o=owned(b),st=status(b),score=contextScore(b,mode,map),m=metaEntry(b,mode,map),metaRank=rank||metaRankOf(b,mode,map);
 const ownedAccount=isOwnedAccount(b);
 const titleRank=metaRank?'<span class="metaRank">#'+metaRank+'</span>':'';
 const action=buildActionLine(b);
 return '<div class="card bcard '+(kind==='recommended'?'recommendedCard':'')+'" onclick="openB('+b.id+')"><div class="row"><div class="rankBadge">'+titleRank+'</div><img class="portrait" src="'+portrait(b)+'" onerror="this.style.opacity=.25"><div class="grow"><div class="bname">'+esc(b.name)+'</div><div class="small bMetaLine">'+(ownedAccount?'P'+b.power+' · '+fmt(b.trophies)+' 🏆':'NOT OWNED')+' <span>·</span> '+esc(metaScope(b,mode,map))+'</div><div class="chips"><span class="chip '+st[1]+'">'+(ownedAccount?st[0]:'UNLOCK')+'</span><span class="chip '+(m?'metaChip':'')+'">'+(m?'META':'N/D')+'</span><span class="chip">Score '+score+'</span></div>'+miniBuild(b)+'<div class="actionLine">'+action+'</div></div></div>'+(!compact?'<div class="chips detailChips"><span class="chip '+(o.gadgets?'ok':'miss')+'">G '+o.gadgets+'/2</span><span class="chip '+(o.stars?'ok':'miss')+'">SP '+o.stars+'/2</span><span class="chip '+(o.gears?'ok':'miss')+'">Gear '+o.gears+'/2</span><span class="chip '+(o.hc?'ok':'miss')+'">HC '+o.hc+'</span></div>':'')+'</div>'
}

function home(){const ownedList=[...(P?.brawlers||[])].filter(Boolean);const plans=ownedList.map(b=>({b,plan:upgradePriority(b)}));const upgrades=plans.filter(x=>x.plan.actions.some(a=>a.type==='BUY'||a.type==='POWER')).sort((a,z)=>(z.plan.score-a.plan.score)||((z.b.power||0)-(a.b.power||0))).slice(0,5);const ready=ownedList.filter(b=>missingBuildActions(b).length===0).sort((a,z)=>personalScore(z)-personalScore(a)).slice(0,5);return '<section class="hero"><div class="eyebrow">ACCOUNT</div><h1>'+esc(P.name)+'</h1><div class="tag">'+esc(P.tag)+' · Level '+P.expLevel+'</div><div class="stats"><div class="stat"><b>'+fmt(P.trophies)+'</b><span>TROPHIES</span></div><div class="stat"><b>'+P.brawlers.length+'</b><span>BRAWLERS</span></div><div class="stat"><b>'+fmt(P['3vs3Victories'])+'</b><span>3v3 WINS</span></div></div><div class="rank"><span>Ranked · '+esc(P.rankedRankName||'—')+'</span><b>'+fmt(P.rankedElo)+' Elo</b></div></section>'+'<section class="section"><div class="sectionTitle"><h2>What should I upgrade?</h2><span class="small">'+(upgrades.length?'Next actions':'No urgent purchases')+'</span></div><div class="notice upgradeIntro"><b>BUY = not owned · OWNED = already unlocked</b><br>Only missing progression is shown here. A fully built Brawler is not treated as an upgrade target.</div>'+(upgrades.length?upgrades.map((x,i)=>upgradeCard(x,i+1)).join(''):'<div class="card emptyState"><b>No detected purchase priority on this account.</b><span class="small">Open Upgrade for the full progression view.</span></div>')+'</section>'+'<section class="section"><div class="sectionTitle"><h2>Ready to play</h2><span class="small">Your developed Brawlers</span></div>'+(ready.length?ready.map(b=>bcard(b,true,playMode,playMap,null,'ready')).join(''):'<div class="card emptyState"><b>No fully built Brawlers detected yet.</b><span class="small">Complete the recommended build components to move a Brawler here.</span></div>')+'</section>'+'<section class="section"><div class="sectionTitle"><h2>Explore Brawlers</h2><span class="small">Open the full catalog</span></div><button class="browseCta" onclick="setTab(\'brawlers\')">Open Brawler Browser <span>→</span></button></section>'}
function upgradeCard(x,rank){const b=x.b,plan=x.plan;return '<div class="upgradeCard" onclick="openB('+b.id+')"><div class="upgradeTop"><span class="priorityNum">'+rank+'</span><img class="upgradePortrait" src="'+portrait(b)+'" onerror="this.style.opacity=.25"><div class="grow"><b>'+esc(b.name)+'</b><span class="small">Power '+b.power+' · '+fmt(b.trophies)+' trophies</span></div><span class="priorityLabel">NEXT</span></div><div class="upgradeActions">'+plan.actions.map(a=>'<div class="priorityAction"><span class="priorityIcon">'+(a.type==='BUY'?'＋':a.type==='POWER'?'↑':'◆')+'</span><div><b>'+esc(a.label)+'</b><span>'+esc(a.reason)+'</span></div></div>').join('')+'</div>'+miniBuild(b)+'</div>'}
function brawlers(){let bs=[...(P.brawlers||[])].filter(Boolean);if(query)bs=bs.filter(b=>b.name.toLowerCase().includes(query.toLowerCase()));if(filter==='p11')bs=bs.filter(b=>b.power>=11);if(filter==='upgrade')bs=bs.filter(b=>upgradePriority(b).actions.length>0);if(filter==='missing')bs=bs.filter(b=>missingBuildActions(b).some(a=>a.type==='BUY'||a.type==='POWER'));bs.sort((a,b)=>b.trophies-a.trophies);return '<section class="section"><div class="sectionTitle"><h2>Brawler Browser</h2><span class="small">'+bs.length+' shown · '+P.brawlers.length+' owned</span></div><div class="notice browserIntro"><b>Tap any Brawler to open its full build.</b><br>Icons show the recommended build; BUY means you do not own it, OWNED means it is already unlocked.</div><input class="search" placeholder="Search Brawler..." value="'+esc(query)+'" oninput="query=this.value;render()"><div class="filters"><button class="'+(filter==='all'?'active':'')+'" onclick="filter=\'all\';render()">All</button><button class="'+(filter==='p11'?'active':'')+'" onclick="filter=\'p11\';render()">Power 11</button><button class="'+(filter==='upgrade'?'active':'')+'" onclick="filter=\'upgrade\';render()">Upgrade next</button><button class="'+(filter==='missing'?'active':'')+'" onclick="filter=\'missing\';render()">Missing items</button></div>'+bs.map(bcard).join('')+'</section>'}
function detail(){
 const b=P.brawlers.find(x=>x&&x.id===selected)||allBrawlers().find(x=>x&&x.id===selected); if(!b)return '';
 const accountOwned=isOwnedAccount(b),o=owned(b),g=first(b.gadgets),sp=first(b.starPowers),gear1=b.gears?.[0],gear2=b.gears?.[1],hc=first(b.hyperCharges),m=metaEntry(b,playMode,playMap);
 return '<button class="back" onclick="selected=null;render()">← Back to Brawlers</button>'+
 '<section class="hero"><div class="row"><img class="portrait" src="'+portrait(b)+'"><div class="grow"><div class="eyebrow">BRAWLERS</div><h1>'+esc(b.name)+'</h1><div class="muted">'+(accountOwned?'Power '+b.power+' · Rank '+b.rank:'Not owned')+'</div><div class="muted">'+(accountOwned?fmt(b.trophies)+' / '+fmt(b.highestTrophies)+' trophies':'Meta #'+(metaRankOf(b,playMode,playMap)||'—'))+'</div></div></div><div class="chips"><span class="chip">Personal '+personalScore(b)+'</span><span class="chip '+status(b)[1]+'">'+status(b)[0]+'</span></div></section>'+
 '<section class="section"><h2>Account build</h2><div class="actionLine">'+buildActionLine(b)+'</div><div class="componentGrid">'+comp('gadget','Gadget',g)+comp('star','Star Power',sp)+comp('gear','Gear 1',gear1)+comp('gear','Gear 2',gear2)+comp('hc','Hypercharge',hc)+'</div></section>'+brawlerGuide(b)+buildAdvisor(b)+
 '<section class="card"><b>Current context</b><div class="context"><span>MODE</span><b>'+esc(playMode)+'</b><span>MAP</span><b>'+esc(playMap)+'</b></div><div class="notice">'+(m?esc(m.reason||'Meta entry disponibile'):'Live meta is unavailable; this explanation uses account data only.')+'</div><p class="small">'+esc(why(b,playMode,playMap))+'</p></section>'+
 '<section class="card"><b>Progression</b><div class="grid"><div class="action"><b>'+o.gadgets+'/2</b><span class="small">Gadget</span></div><div class="action"><b>'+o.stars+'/2</b><span class="small">Star Power</span></div><div class="action"><b>'+o.gears+'/2</b><span class="small">Gear</span></div><div class="action"><b>'+o.hc+'/1</b><span class="small">Hypercharge</span></div></div></section>'
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
 return '<section class="section"><div class="sectionTitle"><h2>Play</h2><span class="small">'+esc(metaScope(ready[0]?.b||recommended[0]?.b,playMode,playMap))+'</span></div><div class="notice">Cambiando modalità o mappa cambia la classifica. La Top 5 personale considera solo i Brawler posseduti; i consigliati mantengono il loro rank reale nel meta.</div><div class="filters">'+Object.keys(MODES).map(m=>'<button class="'+(playMode===m?'active':'')+'" onclick="playMode=\''+m+'\';playMap=\'Random\';render()">'+m+'</button>').join('')+'</div><select class="search" onchange="playMap=this.value;render()">'+names.map(m=>'<option '+(playMap===m?'selected':'')+'>'+m+'</option>').join('')+'</select><div class="context"><span>MODE</span><b>'+esc(playMode)+'</b><span>MAP</span><b>'+esc(playMap)+'</b></div><section class="section"><div class="sectionTitle"><h2>I tuoi 5</h2><span class="small">meta + account combination</span></div>'+ready.slice(0,5).map((x,i)=>'<div class="rankPick"><span class="num">'+(i+1)+'</span><div class="grow">'+bcard(x.b,true,playMode,playMap,x.meta.rank||metaRankOf(x.b,playMode,playMap),'ownedTop')+'</div></div>').join('')+'</section><section class="section"><div class="sectionTitle"><h2>Meta to consider</h2><span class="small">not owned</span></div>'+recommended.map(x=>'<div class="rankPick"><span class="num">#'+(x.meta.rank||metaRankOf(x.b,playMode,playMap)||'—')+'</span><div class="grow">'+bcard(x.b,true,playMode,playMap,x.meta.rank||metaRankOf(x.b,playMode,playMap),'recommended')+'</div></div>').join('')+'</section></section>'
}

function upgradePriority(b){
 const e=buildEntry(b), m=metaEntry(b,playMode,playMap), actions=[];
 const metaScore=Number(m?.score??50), readinessScore=readiness(b), experience=Math.min(100,Number(b.trophies||0)/8);
 if((b.power||0)<11) actions.push({type:'POWER',label:'Reach Power 11',priority:40+(11-(b.power||0))*3,reason:'Unlock the full build potential and advanced progression options.'});
 const defs=[['Gadget','gadgets',bestBuildItem(e,'gadget'),18],['Star Power','starPowers',bestBuildItem(e,'starPower'),20],['Gear','gears',bestBuildItem(e,'gears',0),12],['Gear','gears',bestBuildItem(e,'gears',1),10]];
 for(const [label,type,item,weight] of defs){
   if(!item)continue;
   const has=ownedNames(b,type).includes(norm(item.name));
   const pick=Number(item.pick||0);
   if(!has)actions.push({type:'BUY',label:'Buy '+label+': '+item.name,priority:weight+(pick*.45)+(metaScore*.12),reason:'Missing a community-recommended component for the current context.'});
   else actions.push({type:'EQUIP',label:'Equip '+label+': '+item.name,priority:weight+(pick*.25)+(metaScore*.10),reason:'You already own the recommended component; equip it for the selected context.'});
 }
 if((b.power||0)>=11&&b.hyperCharges?.length===0) actions.push({type:'CONSIDER',label:'Consider Hypercharge',priority:10+(metaScore*.08),reason:'Power 11 is reached and no Hypercharge is recorded on the account.'});
 const best=actions.sort((a,z)=>z.priority-a.priority).slice(0,3);
 const total=Math.round(Math.min(100,metaScore*.45+readinessScore*.30+experience*.10+(best.length?15:0)));
 return {score:total,actions:best,metaScore,readinessScore};
}
function upgrade(){
 const list=[...(P.brawlers||[])].filter(Boolean).map(b=>({b,plan:upgradePriority(b)})).filter(x=>x.plan.actions.length).sort((a,z)=>(z.plan.score-a.plan.score)||personalScore(z.b)-personalScore(a.b)).slice(0,20);
 return '<section class="section"><div class="sectionTitle"><h2>Upgrade Advisor</h2><span class="small">Prioritized for your account</span></div><div class="notice">Recommendations combine account progression, current Meta context and verified community build data. Each action explains what to do next.</div>'+list.map((x,i)=>'<div class="upgradeRow" onclick="openB('+x.b.id+')"><span class="num">'+(i+1)+'</span><div class="grow"><b class="upgradeName">'+esc(x.b.name)+'</b><span class="small upgradeMetaLine">Power '+x.b.power+' · '+fmt(x.b.trophies)+' trophies · Priority '+x.plan.score+'</span>'+x.plan.actions.map(a=>'<div class="upgradeAction"><b>'+esc(a.label)+'</b><span>'+esc(a.reason)+'</span></div>').join('')+'</div><span class="score">'+esc(x.plan.actions[0]?.type||'REVIEW')+'</span></div>').join('')+'</section>'
}

function meta(){
 const names=Object.keys(META_STATE.entries);
 const releases=DB_STATE.changelog||[];
 return '<section class="section"><h2>Meta & Database</h2>'+
 '<div class="notice"><b>'+(META_STATE.loaded?'Meta snapshot loaded':'Live meta not connected yet')+'</b><br>'+
 (META_STATE.loaded?'Source: '+esc(META_STATE.source||'snapshot')+' · Updated: '+esc(META_STATE.updatedAt||'—'):'Il database di gioco e il changelog ufficiale sono separati dai dati personali dell’account.')+
 '</div>'+
 '<div class="card"><b>Meta Agent</b><p class="small">Provider esterni, freschezza e confidence vengono separati dai dati account. Il meta contestuale viene applicato prima della personalizzazione.</p><div class="grid"><div class="action"><b>'+PROVIDER_STATE.providers.filter(x=>x.enabled).length+'</b><span class="small">Active providers</span></div><div class="action"><b>'+esc(PROVIDER_STATE.report?.summary?.brawlersWithGlobalMeta??'—')+'</b><span class="small">Brawlers with meta</span></div></div></div><div class="card"><b>Game Database</b><div class="grid"><div class="action"><b>'+fmt(CATALOG_STATE.count)+'</b><span class="small">Brawlers in catalog</span></div><div class="action"><b>'+esc(DB_STATE.patch||'—')+'</b><span class="small">Current patch</span></div><div class="action"><b>'+esc(DB_STATE.version||'—')+'</b><span class="small">DB version</span></div></div><p class="small">Last sync: '+esc(DB_STATE.lastSyncedAt||'—')+'</p></div>'+
 '<div class="card"><b>Official changelog</b>'+ (releases.length?releases.slice(0,5).map(c=>'<div class="action"><b>'+esc(c.title)+'</b><span class="small">'+esc(c.publishedAt||'')+' · '+esc(c.highlights?.[0]||c.status||'Fonte ufficiale Supercell')+'</span></div>').join(''):'<p class="small">No changelog available.</p>')+'</div>'+
 (names.length?'<div class="card"><b>Meta snapshot</b>'+names.map(n=>{const b=P.brawlers.find(x=>x&&x.name===n);return b?bcard(b,true):''}).join('')+'</div>':'<div class="card"><b>Meta provider</b><p class="small">The structure is ready for verified snapshots by patch, mode and map.</p></div>')+
 '</section>'
}

async function loadCatalog(){
 try{
  let d=null;
  try{d=await fetchJson('https://api.brawlapi.com/v1/brawlers',6000)}catch(e){d=await fetchJson('data/brawlers.json',6000)}
  const list=Array.isArray(d?.list)?d.list:(Array.isArray(d?.brawlers)?d.brawlers:[]);
  CATALOG_STATE.loaded=list.length>0;CATALOG_STATE.count=list.length;
  CATALOG_STATE.entries=Object.fromEntries(list.filter(x=>x&&x.id&&x.name).map(x=>[x.name,x]));
  list.forEach(b=>{const im=new Image();if(b.imageUrl)im.src=b.imageUrl;(b.gadgets||[]).concat(b.starPowers||[],b.gears||[],b.hyperCharges||[]).forEach(x=>{if(x?.imageUrl){const ci=new Image();ci.src=x.imageUrl}})});
 }catch(e){console.warn('Brawler catalog unavailable',e)}
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

function profilePanel(first=false){
 const current=active||'';
 const title=first?'Connect your account':'Brawl Stars Profile';
 const intro=first
  ?'<div class="onboardIntro"><div class="onboardIcon">BH</div><div><h3>Enter your Brawl Stars Player Tag</h3><p>The tag identifies your account. It is used to retrieve public data through the Brawl Helper backend.</p></div></div>'
  :'<p class="small modalLead">Connected account: <b>'+esc(P?.name||current||'none')+'</b><br>Status: '+esc(profileStatus)+(profileSyncAt?' · last updated '+esc(profileSyncAt):'')+'</p>';
 const form='<div class="profileForm '+(first?'onboardForm':'')+'"><label for="newTag">PLAYER TAG BRAWL STARS</label><input id="newTag" class="tagInput" value="'+esc(current)+'" placeholder="#22QYOQRGY" autocomplete="off" autocapitalize="characters" spellcheck="false"><span class="fieldHint">Example: #22QYOQRGY · the tag starts with #</span><button class="primary" onclick="savePlayerTag()">'+(current?'Change / update profile':'Connect account')+'</button></div>';
 const help='<div class="onboardHelp"><b>Where do I find the Player Tag?</b><span>Open Brawl Stars → Profile → under the player name you will find the code starting with #.</span></div>';
 const dev=DEV_MODE?'<button class="secondaryBtn" onclick="useDevProfile()">Open BlackShark TEST</button>':'';
 const settings='<details class="small" style="margin-top:14px"><summary>Technical settings</summary><div class="profileForm"><label for="apiBase">BACKEND API URL</label><input id="apiBase" placeholder="Backend API URL" value="'+esc(apiBase())+'"><button class="secondaryBtn" onclick="saveApiBase()">Save backend</button></div></details>';
 document.getElementById('app').insertAdjacentHTML('beforeend','<div class="modal '+(first?'onboardingModal':'')+'"><div class="modalBox">'+(first?'<div class="modalBrand">BRAWL HELPER</div>':'<div class="modalHead"><h2>'+title+'</h2><button onclick="closeModal()">×</button></div>')+intro+form+help+dev+settings+(first?'':'<button class="close" onclick="closeModal()">Close</button>')+'</div></div>');
 setTimeout(()=>document.getElementById('newTag')?.focus(),180);
}
function closeModal(){document.querySelector('.modal')?.remove()}
function fanNoticeDismiss(){localStorage.setItem('bh_fan_notice_seen','1');closeModal()}
function fanNotice(){if(localStorage.getItem('bh_fan_notice_seen'))return;document.body.insertAdjacentHTML('beforeend','<div class="modal fanNoticeModal"><div class="modalBox fanNoticeBox"><div class="modalBrand">BRAWL HELPER</div><h2>Unofficial fan app</h2><p class="modalLead">Brawl Helper is an independent companion app and is not sponsored, endorsed or administered by Supercell.</p><div class="notice"><b>What this means</b><br>Game data and community build statistics are used to provide guidance. They are not official Supercell recommendations.</div><p class="small">Brawl Stars and related content belong to their respective owners.</p><button class="primary" onclick="fanNoticeDismiss()">Continue</button><a class="legalLink" href="privacy.html">Privacy & legal information</a></div></div>');}
function savePlayerTag(){
 const raw=document.getElementById('newTag')?.value||'';
 const tag=normalizeTag(raw);
 if(!/^#[A-Z0-9]{3,20}$/.test(tag)){alert('Enter a valid Player Tag, for example #22QYOQRGY.');return}
 localStorage.setItem('bh_player_tag',tag);
 active=tag;
 localStorage.removeItem('bh_profile_cache_'+tag);
 closeModal();
 loadProfile(tag);
}
function useDevProfile(){localStorage.setItem('bh_player_tag',DEV_TEST_TAG);active=DEV_TEST_TAG;closeModal();loadProfile(DEV_TEST_TAG)}
function saveApiBase(){const v=document.getElementById('apiBase')?.value.trim().replace(/\/$/,'');if(v)localStorage.setItem('bh_api_base',v);else localStorage.removeItem('bh_api_base');closeModal();alert('Backend saved.')}
async function loadProfile(tag){
 selected=null;tab='home';
 tag=normalizeTag(tag);
 active=tag;localStorage.setItem('bh_player_tag',tag);
 const bs=document.getElementById('bootStatus');if(bs)bs.textContent='stage: loadProfile('+tag+')';
 if(DEV_MODE && tag===DEV_TEST_TAG && window.BH_TEST_PROFILE){
   P=window.BH_TEST_PROFILE;profileStatus='DEV';profileSyncAt=new Date().toLocaleString('en-US');render();return;
 }
 try{
   const ctl=new AbortController();const timer=setTimeout(()=>ctl.abort(),8000);
   const r=await fetch(apiBase()+'/api/player/'+encodeURIComponent(tag.slice(1)),{cache:'no-store',signal:ctl.signal});
   clearTimeout(timer);
   const cacheState=r.headers.get('X-Brawl-Helper-Cache')||'MISS';
   const sync=r.headers.get('X-Brawl-Helper-Sync-At');
   if(!r.ok){let body={};try{body=await r.json()}catch{};throw new Error(body.error||('HTTP '+r.status))}
   const d=await r.json();P=d;
   profileStatus=cacheState==='HIT'?'CACHE':cacheState==='STALE'?'OFFLINE':'ONLINE';
   profileSyncAt=sync||new Date().toLocaleString('en-US');
   localStorage.setItem('bh_profile_cache_'+tag,JSON.stringify({savedAt:Date.now(),data:d}));
   render();
   localStorage.setItem('bh_onboarding_seen','1');
 }catch(e){
   const cached=localStorage.getItem('bh_profile_cache_'+tag);
   if(cached){try{const c=JSON.parse(cached);P=c.data;profileStatus='OFFLINE';profileSyncAt=new Date(c.savedAt).toLocaleString('en-US');render();return}catch{}}
   P=null;profileStatus='OFFLINE';render();
   document.getElementById('app').insertAdjacentHTML('beforeend','<div class="modal"><div class="modalBox"><h2>Profile unavailable</h2><p>'+esc(e.name==='AbortError'?'Backend connection timed out.':e.message)+'</p><p class="small">The Player Tag remains saved. Try again when the backend is available.</p><button class="close" onclick="closeModal()">OK</button></div></div>');
 }
}
function render(){
 try{
  if(!P){shell('<section class="hero"><div class="eyebrow">ACCOUNT</div><h1>No active profile</h1><p class="muted">Connect your Player Tag to load your profile. Development test profiles are not available in production.</p><button class="primary" onclick="profilePanel()">Manage profile</button></section>');return}
  if(selected)shell(detail());
  else if(tab==='home')shell(home());
  else if(tab==='brawlers')shell(brawlers());
  else if(tab==='play')shell(play());
  else if(tab==='upgrade')shell(upgrade());
  else shell(meta());
  if(P && !selected) setTimeout(fanNotice,180);
 }catch(e){showFatal(e)}
}
function showFatal(e){console.error('Brawl Helper fatal error',e);const msg=e?.message||String(e);const stack=e?.stack?'<details style="margin-top:12px"><summary>Technical details</summary><pre style="white-space:pre-wrap;color:#ff9b9b;font-size:11px">'+esc(e.stack)+'</pre></details>':'';document.getElementById('app').innerHTML='<div style="min-height:100vh;background:#10131a;color:#fff;font-family:Arial,sans-serif;padding:28px;box-sizing:border-box"><h1>Brawl Helper</h1><p>A loading error occurred.</p><pre style="white-space:pre-wrap;color:#ff9b9b">'+esc(msg)+'</pre>'+stack+'<button style="padding:14px 18px;border:0;border-radius:12px" onclick="location.reload()">Retry</button></div>'}
function loading(){document.getElementById('app').innerHTML='<div style="min-height:100vh;background:#10131a;color:#fff;font-family:Arial,sans-serif;display:flex;align-items:center;justify-content:center"><div style="text-align:center"><div style="font-size:28px;font-weight:800">Brawl Helper</div><div style="opacity:.65;margin-top:8px">Starting application…</div><div id="bootStatus" style="opacity:.5;margin-top:10px;font-size:12px">stage: loading()</div></div></div>'}
async function boot(){
 try{
  loading();
  const tag=localStorage.getItem('bh_player_tag');
  if(!tag){
    P=null;profileStatus='OFFLINE';render();
    setTimeout(()=>profilePanel(true),250);
    return;
  }
  await loadProfile(tag);
  Promise.allSettled([loadMeta(),loadCatalog()]).then(()=>{if(P)render()});
 }catch(e){showFatal(e)}
}
boot().catch(showFatal);
