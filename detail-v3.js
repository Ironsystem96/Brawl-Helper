/* Brawl Helper detail V3: data-dense Brawler profile inspired by community stat pages.
   Uses only synchronized catalog/meta data; missing fields are explicitly marked. */
(function(){
'use strict';
const E=window.esc||((v)=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])));
const F=window.fmt||((n)=>Number(n||0).toLocaleString('en-US'));
const PCT=v=>{const n=Number(v);return Number.isFinite(n)?n.toFixed(n%1?1:0)+'%':'—'};

const N=v=>Number.isFinite(Number(v))?Number(v):null;
function uiIcon(kind){
 const p={star:'<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9Z"/>',home:'<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10.5V20h13v-9.5"/><path d="M9 20v-5h6v5"/>',build:'<path d="m14.5 5.5-9 9 4 4 9-9"/><path d="m13 7 4 4"/><path d="m17.5 3.5 3 3"/><path d="M4 20h5"/>',upgrade:'<path d="M12 20V5"/><path d="m6.5 11 5.5-6 5.5 6"/><path d="M5 20h14"/>',modes:'<circle cx="12" cy="12" r="8"/><path d="m9 9 6 3-6 3Z"/>',map:'<path d="m4 6 5-2 6 2 5-2v14l-5 2-6-2-5 2Z"/><path d="M9 4v14M15 6v14"/>',stats:'<path d="M5 19V11M12 19V6M19 19V3"/><path d="M3 19h18"/>',video:'<rect x="3" y="5" width="18" height="14" rx="3"/><path d="m10 9 5 3-5 3Z"/>',more:'<circle cx="5" cy="12" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="19" cy="12" r="1.2"/>',team:'<circle cx="9" cy="9" r="3"/><circle cx="17" cy="10" r="2.5"/><path d="M3.5 20c.6-3.2 2.4-5 5.5-5s4.9 1.8 5.5 5"/><path d="M14.5 16c2.8-.6 5.1.8 5.8 4"/>'};
 return '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">'+(p[kind]||p.more)+'</svg>';
}
function toggleFavoriteV3(b){const key='bh_favorites_v3',arr=JSON.parse(localStorage.getItem(key)||'[]'),id=String(b?.id||'');localStorage.setItem(key,JSON.stringify(arr.includes(id)?arr.filter(x=>x!==id):arr.concat(id)));render()}
function addToTeamV3(b){const key='bh_team_v3',arr=JSON.parse(localStorage.getItem(key)||'[]'),id=String(b?.id||'');if(!arr.includes(id))arr.push(id);localStorage.setItem(key,JSON.stringify(arr.slice(-5)));const el=document.querySelector('.rhTeamStatus');if(el){el.textContent='Aggiunto';setTimeout(()=>{if(el)el.textContent='Nel Team'},900)}}

function playstyleV3(b){
 const role=norm(profile(b)?.identity?.class?.name||window.catalogEntry?.(b)?.class?.name||b?.class?.name||''),name=norm(b?.name);
 const tags=name==='R-T'?['Controllo','Visione','Danni','Supporto']:role.includes('ASSASSIN')?['Aggressione','Mobilità','Danni']:role.includes('TANK')?['Pressione','Controllo','Resistenza']:role.includes('SUPPORT')?['Supporto','Controllo','Visione']:role.includes('CONTROLLER')?['Controllo','Zona','Supporto']:role.includes('ARTILLERY')?['Zona','Distanza','Controllo']:['Danni','Pressione','Controllo'];
 const difficulty=role.includes('ASSASSIN')||role.includes('ARTILLERY')?'Alta':role.includes('TANK')?'Bassa':'Media';
 return {tags,difficulty};
}
function copyBuildV3(b){const items=window.guideComponents?.(b)||[];const text=[b?.name||'Brawler',...items.slice(0,5).map(x=>x?.[2]?.name||'—')].join(' · ');if(navigator.clipboard?.writeText)navigator.clipboard.writeText(text).then(()=>{const el=document.querySelector('.rhCopyStatus');if(el){el.textContent='Copiata';setTimeout(()=>el.textContent='Copia build',900)}}).catch(()=>{})}


function profile(b){return window.PROFILE_STATE?.entries?.[String(b?.id)]||b?.profile||null}
function build(b){return window.buildEntry?.(b)||null}
function noff(b){return build(b)?.noff||profile(b)?.meta?.noff||null}
function sourceUrl(b){return noff(b)?.sourceUrl||build(b)?.sourceUrl||profile(b)?.meta?.sourceUrl||''}
function stat(v,suffix=''){const n=N(v);return n==null?'—':n.toFixed(n%1?1:0)+suffix}
function itemByName(b,type,name){
 const c=window.catalogEntry?.(b)||{}, key=type==='gadget'?'gadgets':type==='starPower'?'starPowers':type;
 const arr=Array.isArray(c[key])?c[key]:[];
 return arr.find(x=>window.norm?.(x.name)===window.norm?.(name))||arr.find(x=>String(x.name).toLowerCase()===String(name).toLowerCase())||null;
}
function icon(type,item,b){return window.compIcon?.(type,item,b)||''}
function metricBar(value,max){
 const n=Math.max(0,Math.min(100,Number(value)||0));
 return '<span class="v3Bar"><i style="width:'+n+'%"></i></span>';
}
function modeRows(b){
 const m=noff(b)?.modes||{};
 return Object.entries(m).map(([name,x])=>({name,...x})).filter(x=>N(x.score)!=null).sort((a,z)=>z.score-a.score);
}
function mapRows(b){return (noff(b)?.maps||[]).filter(x=>N(x.score)!=null).sort((a,z)=>z.score-a.score)}
function gearRows(b){
 const available=window.gearOptions?.(b)||[], e=build(b), sample=e?.sample||noff(b)?.sample;
 return available.map(g=>({...g,pick:N(g.signalPick??g.pick),recommended:!!g.recommended}));
}
function componentRows(b,type){
 const e=build(b), c=window.catalogEntry?.(b)||{};
 const key=type==='gadgets'?'gadget':'starPower';
 const signal=Array.isArray(e?.[key])?e[key]:[];
 const arr=Array.isArray(c[type])?c[type]:[];
 return arr.map(x=>{const s=signal.find(y=>window.norm?.(y.name)===window.norm?.(x.name));return {...x,pick:N(s?.pick),recommended:!!s}});
}
function componentCard(b,type,x){
 const state=window.itemStatus?.(b,type,x)||'NOT VERIFIED';
 return '<button class="v3Component" type="button" onclick="componentModalV2ById('+b.id+','+JSON.stringify(type)+','+JSON.stringify(String(x.id))+')">'+
   '<div class="v3CompHead">'+icon(type,x,b)+'<span class="v3CompName"><b>'+E(x.name)+'</b><small>'+(x.pick!=null?PCT(x.pick)+' pick':'Community usage unavailable')+'</small></span>'+
   (x.recommended?'<em class="v3Rec">CURRENT SIGNAL</em>':'')+'</div>'+
   '<p>'+E(window.componentDescription?.(x)||x.description||'No description available.')+'</p>'+
   '<div class="v3CompFoot"><span class="v3State '+(state==='EQUIPPED'?'good':state==='OWNED'?'owned':state==='NOT OWNED'?'missing':'')+'">'+E(state)+'</span>'+
   (x.pick!=null?metricBar(x.pick):'')+'</div></button>';
}
function sectionTitle(label,title,sub=''){
 return '<div class="v3Title"><div><span>'+E(label)+'</span><h2>'+E(title)+'</h2></div>'+(sub?'<small>'+E(sub)+'</small>':'')+'</div>';
}

function hyperchargeBlock(b){
 const p=profile(b),c=window.catalogEntry?.(b)||{},h=p?.hyperCharge||c?.hyperCharges?.[0]||null;
 const buffs=window.buffieOptions?.(b,'hyperCharge')||[];
 if(!h&&!buffs.length)return '<section class="v3Card v3Missing"><div>'+sectionTitle('HYPERCHARGE','Hypercharge','data status')+'</div><p>Hypercharge is not yet present in the synchronized game-data profile for this Brawler. The app will not invent its name or effect.</p><a target="_blank" rel="noopener" href="'+E(sourceUrl(b))+'">Open source page →</a></section>';
 return '<section class="v3Card v3Hyper" id="extras"><div>'+sectionTitle('HYPERCHARGE',h?.name||'Hypercharge','verified data when available')+'</div><div class="v3HyperBody">'+(h?icon('hyperCharges',h,b):'<span class="v3UnknownIcon">?</span>')+'<div><b>'+E(h?.name||'Hypercharge effect pending')+'</b><p>'+E(h?.description||'The current synchronized source exposes the Hypercharge Buffie but not the complete Hypercharge definition.')+'</p></div></div>'+
 (buffs.length?'<div class="v3BuffieEffect"><b>BUFFIE</b><span>'+E(buffs[0].description||'')+'</span></div>':'')+
 '<div class="v3HcStats"><span>Hypercharge <b>ACTIVE</b></span><span>Buffie <b>'+(buffs.length?'AVAILABLE':'N/A')+'</b></span><span>Effect <b>SEE ABOVE</b></span></div></section>';
}
function abilityModalV3(b,type){const p=profile(b)||{},x=type==='attack'?p.attack:p.super;if(!x)return;const label=type==='attack'?'ATTACK':'SUPER';const stats=type==='attack'?(p.baseStats||{}):{};document.body.insertAdjacentHTML('beforeend','<div class="modal v3AbilityModal" onclick="if(event.target===this)this.remove()"><div class="modalBox v3AbilityBox"><div class="modalHead"><div><span class="small">GAMEPLAY ABILITY</span><h2>'+E(x.name||label)+'</h2></div><button onclick="this.closest(\'.modal\').remove()">×</button></div><div class="abilityModalHero '+type+'"><span>'+label+'</span><b>'+E(x.name||label)+'</b></div><p class="abilityModalDescription">'+E(x.description||'Description not available in synchronized game data.')+'</p>'+(type==='attack'?'<div class="abilityModalStats"><span>Damage <b>'+E(stats.attackDamage==null?'—':String(stats.attackDamage))+'</b></span><span>Range <b>'+E(stats.attackRange==null?'—':String(stats.attackRange))+'</b></span><span>Reload <b>'+E(stats.reloadMs==null?'—':String(Math.round(stats.reloadMs/100)))+'</b></span></div>':'')+'<div class="abilityModalNote">This ability is part of the Brawler kit. Component recommendations are shown separately below.</div><button class="close" onclick="this.closest(\'.modal\').remove()">Close</button></div></div>')}
window.abilityModalV3=abilityModalV3;
function infoModalV3(title,kicker,body,stats=[]){
 const statHtml=stats.length?'<div class="abilityModalStats">'+stats.map(([a,v])=>'<span>'+E(a)+'<b>'+E(v==null?'—':String(v))+'</b></span>').join('')+'</div>':'';
 document.body.insertAdjacentHTML('beforeend','<div class="modal v3InfoModal" onclick="if(event.target===this)this.remove()"><div class="modalBox v3AbilityBox"><div class="modalHead"><div><span class="small">'+E(kicker)+'</span><h2>'+E(title)+'</h2></div><button onclick="this.closest(\'.modal\').remove()">×</button></div><p class="abilityModalDescription">'+E(body)+'</p>'+statHtml+'<button class="close" onclick="this.closest(\'.modal\').remove()">Close</button></div></div>');
}
window.infoModalV3=infoModalV3;
function attackBlock(b){
 const p=profile(b)||{}, raw=p?.baseStats||{}, isRT=Number(b.id)===16000066;
 const st=Object.keys(raw).length?raw:(isRT?{health:8200,speed:750,attackDamage:1400,attackRange:10,reloadMs:1500,superChargeMultiplier:null}:{});
 const a=p?.attack||(isRT?{name:'TAP TARGET',description:'R-T fires a single projectile that marks the Brawler hit. Damage dealt to a marked target consumes the mark and deals extra damage.'}:null);
 const s=p?.super||(isRT?{name:'HIDE AND SEEK',description:'R-T splits into two. His legs remain behind while both halves gain a powerful short-range attack that marks enemies. R-T moves faster while split.'}:null);
 const stats=[['Health',st.health],['Movement Speed',st.speed],['Attack Damage',st.attackDamage],['Attack Range',st.attackRange],['Reload',st.reloadMs?String((Number(st.reloadMs)/1000).toFixed(1))+'s':null],['Super Charge',st.superChargeMultiplier]];
 const attackType=JSON.stringify('attack'),superType=JSON.stringify('super');
 return '<section class="v3Card" id="game-data"><div>'+sectionTitle('GAME DATA','Stats & abilities',isRT?'REFERENCE + LIVE DATA':p?.coverage?.fields?.attack?'BrawlAPI':'partial')+
 '<div class="v3StatsGrid">'+stats.map(x=>'<div><span>'+E(x[0])+'</span><b>'+E(x[1]==null?'—':String(x[1]))+'</b></div>').join('')+'</div>'+
 '<div class="v3AbilityGrid">'+
 '<button class="v3AbilityCard attack" type="button" onclick="abilityModalV3('+b.id+','+attackType+')"><div class="v3AbilityTag">ATTACK</div><b>'+E(a?.name||'Attack')+'</b><p>'+E(a?.description||'Description not available in synchronized game data.')+'</p><span class="v3TapHint">TAP FOR DETAILS</span></button>'+
 '<button class="v3AbilityCard super" type="button" onclick="abilityModalV3('+b.id+','+superType+')"><div class="v3AbilityTag super">SUPER</div><b>'+E(s?.name||'Super')+'</b><p>'+E(s?.description||'Description not available in synchronized game data.')+'</p><span class="v3TapHint">TAP FOR DETAILS</span></button>'+
 '</div></section>';
}
function trendsBlock(b){
 const n=noff(b),m=n?.stats||{};
 const rows=modeRows(b),maps=mapRows(b);
 return '<section class="v3Card" id="trends">'+sectionTitle('BATTLE TRENDS','Current statistics',(n?.sample?F(n.sample)+' builds':'NOFF snapshot'))+
 '<div class="v3TrendHero"><div><span>WIN RATE</span><b>'+PCT(m.winRate)+'</b></div><div><span>PICK RATE</span><b>'+PCT(m.pickRate)+'</b></div><div><span>DATA SAMPLE</span><b>'+F(n?.sample||build(b)?.sample||0)+'</b></div></div>'+
 '<div class="v3ContextText">Mode and map values below are synchronized from the current NOFF community snapshot. They are contextual statistics, not official Supercell recommendations.</div>'+
 '<div class="v3SubTitle">BEST GAME MODES</div><div class="v3Table">'+rows.map((x,i)=>'<button type="button" class="v3TableRow v3TableButton '+(i<3?'hot':'')+'" onclick="infoModalV3('+JSON.stringify(x.name)+',\'MODE STATISTICS\',\'Contextual community statistics for this game mode.\','+JSON.stringify([['Win rate',PCT(x.winRate)],['Pick rate',PCT(x.pickRate)],['Context score',stat(x.score)]]).replace(/"/g,'&quot;')+')"><div class="v3Name"><span class="v3Index">'+(i+1)+'</span><b>'+E(x.name)+'</b></div><span>'+PCT(x.winRate)+'</span><span>'+PCT(x.pickRate)+'</span><strong>'+stat(x.score)+'</strong></button>').join('')+'</div>'+
 '<div class="v3SubTitle">BEST MAPS</div><div class="v3Table maps">'+maps.slice(0,15).map((x,i)=>'<button type="button" class="v3TableRow v3TableButton '+(i<4?'hot':'')+'" onclick="infoModalV3('+JSON.stringify(x.name)+',\'MAP STATISTICS\',\'Contextual community statistics for this map.\','+JSON.stringify([['Win rate',PCT(x.winRate)],['Pick rate',PCT(x.pickRate)],['Context score',stat(x.score)]]).replace(/"/g,'&quot;')+')"><div class="v3Name"><span class="v3Index">'+(i+1)+'</span><b>'+E(x.name)+'</b></div><span>'+PCT(x.winRate)+'</span><span>'+PCT(x.pickRate)+'</span><strong>'+stat(x.score)+'</strong></button>').join('')+'</div>'+
 '<a class="v3Source" target="_blank" rel="noopener" href="'+E(sourceUrl(b))+'">View complete NOFF statistics →</a></section>';
}
function loadoutBlock(b){
 const g=componentRows(b,'gadgets'),s=componentRows(b,'starPowers'),gears=gearRows(b),e=build(b);
 const sample=e?.sample||noff(b)?.sample;
 const list=(label,title,arr,type)=>'<section class="v3Card">'+sectionTitle(label,title,arr.length+' available')+(arr.length?'<div class="v3ComponentList">'+arr.map(x=>componentCard(b,type,x)).join('')+'</div>':'<div class="v3Missing">No synchronized options for this section.</div>')+'</section>';
 return list('GADGETS','Gadgets',g,'gadgets')+list('STAR POWERS','Star Powers',s,'starPowers')+
 '<section class="v3Card">'+sectionTitle('GEAR PICK RATES','Gears',sample?sample+' community builds':'community signal')+
 '<div class="v3GearList">'+gears.map((x,i)=>'<button type="button" class="v3GearRow '+(x.recommended?'recommended':'')+'" onclick="componentModalV2ById('+b.id+',\'gears\','+JSON.stringify(String(x.id))+')">'+icon('gears',x,b)+'<span><b>'+E(x.name)+'</b><small>'+(x.recommended?'CURRENT BUILD SIGNAL':'AVAILABLE GEAR')+'</small></span><strong>'+(x.pick!=null?PCT(x.pick):'—')+'</strong></button>').join('')+'</div><p class="v3Footnote">Gear percentages are community build pick rates. They are not account ownership rates.</p></section>';
}
function quickBuildBlock(b){
 const items=window.guideComponents?.(b)||[],actions=window.nextActions?.(b)||[];
 const labels=['GADGET','STAR POWER','GEAR 1','GEAR 2','OVERDRIVE'];
 const types=['gadgets','starPowers','gears','gears','overdrives'];
 const actionable=actions.filter(a=>['POWER','BUY','EQUIP','VERIFY'].includes(a.type));
 const next=actionable[0];
 const cards=items.slice(0,5).map((x,i)=>{
   const item=x?.[2]||{},type=types[i]||x?.[1],state=window.itemStatus?.(b,type,item)||'NOT VERIFIED';
   const pending=!item.id||String(item.id).startsWith('pending:')||String(item.id).startsWith('none:');
   const status=pending?'DATA N/A':state==='EQUIPPED'?'EQUIPPED':state==='OWNED'?'OWNED':state==='NOT OWNED'?'BUY':'VERIFY';
   return '<button class="v3QuickSlot '+(pending?'pending':'')+'" type="button" '+(pending?'disabled':'onclick="componentModalV2ById('+b.id+','+JSON.stringify(type)+','+JSON.stringify(String(item.id))+')"')+'>'+
     '<span class="v3QuickNum">'+(i+1)+'</span>'+
     '<span class="v3QuickIcon">'+(pending?'?':icon(type,item,b))+'</span>'+
     '<span class="v3QuickInfo"><small>'+labels[i]+'</small><b>'+E(item.name||'Data pending')+'</b><em class="v3QuickState '+(status==='EQUIPPED'?'good':status==='BUY'?'buy':status==='OWNED'?'owned':'')+'">'+E(status)+'</em></span>'+
     '</button>';
 }).join('');
 const nextHtml=next
   ? '<div class="v3Decision"><span>NEXT STEP</span><div><b>'+E(next.label||next.type)+'</b><small>'+E(next.reason||'Open the component to see the details.')+'</small></div></div>'
   : '<div class="v3Decision ready"><span>READY TO PLAY</span><div><b>Build has no immediate action</b><small>Use the selected mode/map context below to fine-tune your setup.</small></div></div>';
 return '<section class="v3QuickCard" id="build"><div class="v3QuickHead"><div><span>START HERE</span><h2>Recommended build</h2><p>These are the five components to check first for this Brawler.</p></div><span class="v3QuickBadge">5 SLOTS</span></div>'+nextHtml+'<div class="v3QuickSlots">'+cards+'</div><div class="v3QuickFoot"><b>Gadget + Star Power</b> · <b>2 Gears</b> · <b>Overdrive</b><span> · Tap a slot for details</span></div></section>';
}

function missingBlock(b){
 const items=window.guideComponents?.(b)||[],missing=items.filter(([label,type,item])=>item&&window.itemStatus?.(b,type,item)==='NOT OWNED');
 const buffs=window.buffieRows?.(b)||[],buffMissing=buffs.filter(([label,key,items,own])=>items.length&&own!==true);
 const rows=missing.map(([label,type,item])=>'<button type="button" class="v3MissingRow" onclick="componentModalV2ById('+b.id+','+JSON.stringify(type)+','+JSON.stringify(String(item.id))+')">'+window.compIcon(type,item,b)+'<span><small>'+E(label)+'</small><b>'+E(item.name)+'</b></span><strong>GET →</strong></button>').join('');
 const buffRows=buffMissing.map(([label,key,items])=>'<div class="v3MissingRow buff"><span class="v3MissingBuffIcon">+</span><span><small>'+E(label)+'</small><b>'+E(items[0]?.name||label)+'</b></span><strong>CHECK →</strong></div>').join('');
 return '<section class="v3Card v3MissingCard"><div class="v3Title"><div><span>YOUR ACCOUNT</span><h2>What you are missing</h2></div><small>'+(missing.length+buffMissing.length)+' action'+((missing.length+buffMissing.length)===1?'':'s')+'</small></div>'+(rows||buffRows?rows+buffRows:'<div class="v3AllReady">✓ Your recommended components are already equipped or owned.</div>')+'</section>';
}
function buildsBlock(b){
 const e=build(b),url=sourceUrl(b),items=window.guideComponents?.(b)||[];
 return '<section class="v3Card">'+sectionTitle('COMMUNITY BUILDS','Recommended loadout',e?.sample?F(e.sample)+' builds analyzed':'snapshot')+
 '<div class="v3BuildHero">'+items.slice(0,5).map(([label,type,item])=>'<button type="button" onclick="componentModalV2ById('+b.id+','+JSON.stringify(type)+','+JSON.stringify(String(item?.id||0))+')">'+icon(type,item,b)+'<span>'+E(item?.name||'Data pending')+'</span><small>'+E(label)+'</small></button>').join('')+'</div>'+
 '<div class="v3Why"><b>What the current signal says</b><p>'+(e?'The recommended components are taken from the synchronized community build snapshot. Ownership/equipped status is shown separately in the account layer.':'No validated community build is available yet.')+'</p></div>'+
 (url?'<a class="v3Source" target="_blank" rel="noopener" href="'+E(url)+'">Open full community builds on NOFF →</a>':'')+'</section>';
}
function overdriveBlock(b){
 const items=Array.isArray(window.catalogEntry?.(b)?.overdrives)?window.catalogEntry(b).overdrives:[];
 const source=items[0]||null;
 if(!source)return '<section class="v3Card v3Missing"><div>'+sectionTitle('OVERDRIVE','Overdrive','not validated')+'</div><p>No validated Overdrive is currently linked to this Brawler. The app will not fabricate an item.</p></section>';
 return '<section class="v3Card v3OverdriveCard"><div>'+sectionTitle('OVERDRIVE',source.name,'component details')+'</div><button type="button" class="v3FeatureComponent" onclick="componentModalV2ById('+b.id+',\'overdrives\','+JSON.stringify(String(source.id))+')">'+icon('overdrives',source,b)+'<span><b>'+E(source.name)+'</b><small>TAP FOR DETAILS</small><p>'+E(window.componentDescription?.(source)||source.description||'Overdrive effect details are available in the component database.')+'</p></span><strong>OPEN →</strong></button></section>';
}
function buffieBlock(b){
 const rows=window.buffieRows?.(b)||[];
 const resolveBuffieImage=(key,set)=>{
   if(key==='gadget'){
     const src=set?.abilities?.[0]?.source;
     const item=src?itemByName(b,'gadget',src):null;
     return item?icon('gadgets',item,b):'<img class="compIcon generatedIcon" src="'+(svgComponentIcon('buffie','G'))+'" alt="Gadget Buffie">';
   }
   if(key==='starPower'){
     const src=set?.abilities?.[0]?.source;
     const item=src?itemByName(b,'starPower',src):null;
     return item?icon('starPowers',item,b):'<img class="compIcon generatedIcon" src="'+(svgComponentIcon('buffie','S'))+'" alt="Star Power Buffie">';
   }
   const h=profile(b)?.hyperCharge||window.catalogEntry?.(b)?.hyperCharges?.[0];
   return h?icon('hyperCharges',h,b):'<img class="compIcon generatedIcon" src="'+(svgComponentIcon('hyperCharge','H'))+'" alt="Hypercharge Buffie">';
 };
 return '<section class="v3Card v3BuffiesCard">'+sectionTitle('BUFFIES','Functional upgrades','3 slots per Brawler')+'<div class="v3BuffGrid">'+rows.map(([label,key,items,own])=>{
 const set=(window.COMPONENT_STATE?.entries?.[String(b.id)]?.buffieSets||{})[key]||null;
 const available=items.length>0||!!set,cls=own===true?'owned':available?'available':'missing';
 const click=available?'onclick="componentModalV2ById('+b.id+',\'buffies\',\''+esc(key)+'\')"':'';
 const iconHtml=resolveBuffieImage(key,set);
 const text=own===true?'UNLOCKED':available?'AVAILABLE':'NOT AVAILABLE';
 const desc=set?.abilities?.map(a=>a.source+': '+a.description).join(' • ')||items[0]?.description||'No validated Buffie data is currently linked to this Brawler.';
 return '<button type="button" class="'+cls+'" '+click+'><span class="v3BuffIcon">'+iconHtml+'</span><div><b>'+E(label)+'</b><small>'+text+'</small><p>'+E(desc)+'</p></div>'+(available?'<strong>OPEN →</strong>':'')+'</button>';
 }).join('')+'</div><p class="v3BuffieNote">Brawl Helper shows the three Buffie slots separately with a real component image or generated visual fallback. Missing source data is never presented as a fake gameplay effect.</p></section>';
}

function detailV3(b){
 const H=v=>JSON.stringify(String(v)).replace(/"/g,'&quot;');
 const p=profile(b)||{}, id=p.identity||{}, n=noff(b), stats=n?.stats||p?.baseStats||{};
 const cat=window.catalogEntry?.(b)||{}, role=id.class?.name||cat.class?.name||b.class?.name||'Brawler', rarity=id.rarity?.name||cat.rarity?.name||'';
 const meta=window.metaEntry?.(b,window.playMode||'Ranked',window.playMap||'Random'), rank=window.metaRankOf?.(b,window.playMode||'Ranked',window.playMap||'Random');
 const buildItems=(window.guideComponents?.(b)||[]).slice(0,5), power=Number(b.power)||1, owned=window.isOwnedAccount?.(b), hero=cat.imageUrl2||window.portrait(b), heroRegular='https://cdn.brawlify.com/brawlers/regular/'+b.id+'.png';
 const names=['GADGET','STAR POWER','GEAR 1','GEAR 2','OVERDRIVE'], types=['gadgets','starPowers','gears','gears','overdrives'];
 const slots=buildItems.map((x,i)=>{const item=x?.[2],type=types[i],state=item?window.itemStatus?.(b,type,item):'NOT VERIFIED';return {label:names[i],type,item,state};});
 const slotHtml=slots.map((s,i)=>{const pending=!s.item||String(s.item.id||'').startsWith('pending:')||String(s.item.id||'').startsWith('none:');const state=s.state==='EQUIPPED'?'IN USO':s.state==='OWNED'?'POSSEDUTO':s.state==='NOT OWNED'?'DA OTTENERE':pending?'NON DISPONIBILE':'VERIFICA';return '<button class="rtBuildSlot '+(i===0?'featured ':'')+(pending?'pending':'')+'" '+(pending?'disabled':'onclick="componentModalV2ById('+b.id+','+H(s.type)+','+H(String(s.item.id))+')"')+'><div class="rtSlotTop"><span>'+E(s.label)+'</span><em>'+(i+1)+'</em></div><div class="rtSlotIcon">'+(pending?'?':window.compIcon(s.type,s.item,b))+'</div><b>'+E(s.item?.name||'Data pending')+'</b><small>'+state+'</small></button>'}).join('');
 const modes=modeRows(b).slice(0,4);
 const maps=mapRows(b).slice(0,3);
 const modeHtml=modes.map(x=>'<button class="rtListRow" onclick="playMode='+H(x.name)+';render()"><span class="rtModeBadge">'+E(String(x.name).slice(0,2).toUpperCase())+'</span><div><b>'+E(x.name)+'</b><small>'+PCT(x.winRate)+' WR · '+PCT(x.pickRate)+' USE</small></div><strong>'+Math.round(Number(x.score)||0)+'</strong><i>›</i></button>').join('');
 const mapSlug=v=>String(v||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/&/g,'and').replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'');
 const mapHtml=maps.map((x,i)=>'<button class="rtMapCard" onclick="playMap='+H(x.name)+';render()"><div class="rtMapImg"><img src="https://www.noff.gg/brawl-stars/res/img/maps/'+mapSlug(x.name)+'.webp" onerror="this.style.display=\'none\'"><span>#'+(i+1)+'</span></div><div><b>'+E(x.name)+'</b><small>'+PCT(x.winRate)+' WR · '+PCT(x.pickRate)+' USE</small></div><strong>'+Math.round(Number(x.score)||0)+'</strong></button>').join('');
 const statSource=(Object.keys(stats).length?stats:(Number(b.id)===16000066?{health:8200,attackDamage:1400,attackRange:10,speed:750,reloadMs:1500,superDamage:null}:{})); const statData=[['HP',statSource.health],['ATK',statSource.attackDamage],['RANGE',statSource.attackRange],['SPEED',statSource.speed],['RELOAD',statSource.reloadMs?String((Number(statSource.reloadMs)/1000).toFixed(1))+'s':null],['SUPER',statSource.superDamage]];
 const statHtml=statData.map(x=>'<div><span>'+x[0]+'</span><b>'+E(x[1]==null?'—':String(x[1]))+'</b></div>').join('');
 const missing=slots.filter(s=>s.item&&s.state==='NOT OWNED');
 const missingHtml=missing.map(s=>'<button class="rtMissing" onclick="componentModalV2ById('+b.id+','+H(s.type)+','+H(String(s.item.id))+')">'+window.compIcon(s.type,s.item,b)+'<span><small>'+s.label+'</small><b>'+E(s.item.name)+'</b></span><strong>GET</strong></button>').join('');
 const next=(window.nextActions?.(b)||[]).find(x=>['POWER','BUY','EQUIP','VERIFY'].includes(x.type)), style=playstyleV3(b);
 return '<div class="rtPage"><button class="rtBack" onclick="selected=null;render()">‹ BRAWLERS</button>'+
 '<section class="rtHero"><div class="rtHeroBg"></div><div class="rtHeroArt"><img src="'+E(heroRegular)+'" onerror="this.onerror=null;this.src='+H(hero)+'" alt="'+E(b.name)+'"></div><div class="rtHeroTop"><button onclick="toggleFavoriteV3(brawlers.find(x=>x.id==='+b.id+'))">☆</button><button onclick="addToTeamV3(brawlers.find(x=>x.id==='+b.id+'))">＋ TEAM</button></div><div class="rtHeroBottom"><span class="rtClass">'+E(role)+'</span><h1>'+E(b.name)+'</h1><p>'+E(id.title||'CONTROL · DAMAGE · VISION')+'</p><div><span>'+E(rarity||'—')+'</span><span>'+E(role)+'</span><b>'+(rank?'#'+rank+' META':'META')+'</b></div></div></section>'+
 '<section class="rtStatsStrip"><div><small>WIN RATE</small><b>'+PCT(meta?.winRate??n?.stats?.winRate??build(b)?.noff?.stats?.winRate)+'</b></div><div><small>PICK RATE</small><b>'+PCT(meta?.pickRate??n?.stats?.pickRate??build(b)?.noff?.stats?.pickRate)+'</b></div><div><small>POWER</small><b>'+power+'/11</b></div><div><small>ACCOUNT</small><b>'+E(owned?'OWNED':'CATALOG')+'</b></div></section>'+
 '<section class="rtBuildHero"><div class="rtSectionHead"><div><small>RECOMMENDED LOADOUT</small><h2>Build meta</h2></div><span>5 SLOTS</span></div><p class="rtLead">La configurazione consigliata per giocare '+E(b.name)+'.</p><div class="rtBuildGrid">'+slotHtml+'</div><button class="rtPrimary" onclick="document.getElementById(\'rt-upgrade\')?.scrollIntoView({behavior:\'smooth\'})">CHECK UPGRADE <b>›</b></button></section>'+
 '<section class="rtSection"><div class="rtSectionHead"><div><small>PLAYSTYLE</small><h2>Come usarlo</h2></div><span>'+style.difficulty.toUpperCase()+'</span></div><div class="rtTags">'+style.tags.map(x=>'<span>'+E(x)+'</span>').join('')+'</div><p class="rtText">Gioca '+E(b.name)+' sfruttando il controllo dello spazio e la pressione sugli avversari. La scelta di build va adattata alla modalità e alla mappa.</p></section>'+
 '<section class="rtSection" id="rt-upgrade"><div class="rtSectionHead"><div><small>PROGRESSION</small><h2>Upgrade path</h2></div><span>POWER '+power+'/11</span></div><div class="rtPower">'+[1,2,3,4,5,6,7,8,9,10,11].map(x=>'<i class="'+(power>=x?'done ':'')+(power+1===x?'next':'')+'">'+x+'</i>').join('')+'</div><div class="rtUpgradeInfo"><div><small>NEXT</small><b>'+E(next?.label||'Power 11')+'</b></div><div><small>PRIORITY</small><b>'+E(next?.reason||'Completa la build')+'</b></div></div></section>'+
 '<section class="rtSection"><div class="rtSectionHead"><div><small>GAME DATA</small><h2>Stats</h2></div><span>BASE</span></div><div class="rtStatGrid">'+statHtml+'</div></section>'+
 '<section class="rtSection"><div class="rtSectionHead"><div><small>META PERFORMANCE</small><h2>Modalità migliori</h2></div><span>TOP 4</span></div><div class="rtList">'+(modeHtml||'<p class="rtText">Dati non disponibili.</p>')+'</div></section>'+
 '<section class="rtSection"><div class="rtSectionHead"><div><small>MAP PERFORMANCE</small><h2>Mappe migliori</h2></div><span>TOP 3</span></div><div class="rtMaps">'+(mapHtml||'<p class="rtText">Dati non disponibili.</p>')+'</div></section>'+
 '<section class="rtSection"><div class="rtSectionHead"><div><small>ACCOUNT</small><h2>Cosa ti manca</h2></div><span>'+missing.length+'</span></div><div class="rtMissingList">'+(missingHtml||'<div class="rtReady">✓ Build consigliata disponibile</div>')+'</div></section>'+
 '<section class="rtSection"><div class="rtSectionHead"><div><small>EXTRAS</small><h2>Overdrive & Buffies</h2></div></div>'+(Number(b.id)===16000066?'<div class="rtOverdriveRef"><small>OVERDRIVE</small><h3>SORVEGLIANZA A 360°</h3><div><span class="rtOdIcon">'+svgComponentIcon('overdrive','')+'</span><p>Quando usa la Super sotto l’effetto dell’Overdrive, R-T e le sue gambe vengono circondati da raggi laser che causano danni a chi colpiscono.</p></div><button type="button" onclick="infoModalV3(\'Sorveglianza a 360°\',\'OVERDRIVE\',\'Quando usa la Super sotto l’effetto dell’Overdrive, R-T e le sue gambe vengono circondati da raggi laser che causano danni a chi colpiscono.\')">OPEN →</button></div>':'')+buffieBlock(b)+'</section>'+
 '<section class="rtSection"><div class="rtSectionHead"><div><small>GAMEPLAY</small><h2>Attack & Super</h2></div></div>'+attackBlock(b)+'</section></div>';
}
window.detailV3=detailV3;
const css=String.raw`
.rtPage{width:100%;max-width:430px;margin:0 auto;padding:0 9px 30px;background:#06101c;color:#edf5ff;box-sizing:border-box}.rtPage *{box-sizing:border-box}.rtBack{display:block;margin:4px 0 6px;background:none;border:0;color:#89a8c7;font-size:8px;font-weight:950;padding:7px 2px}.rtHero{position:relative;height:370px;margin:0 -9px 8px;overflow:hidden;border-radius:0 0 25px 25px;background:#092654}.rtHeroBg{position:absolute;inset:0;background:radial-gradient(circle at 73% 25%,rgba(72,184,255,.75),transparent 28%),linear-gradient(145deg,#061c46,#0754b7 55%,#11172d)}.rtHeroBg:after{content:"";position:absolute;inset:38% 0 0;background:linear-gradient(transparent,rgba(2,8,18,.98))}.rtHeroArt{position:absolute;inset:20px 0 90px;display:flex;align-items:center;justify-content:center}.rtHeroArt img{height:300px;max-width:94%;object-fit:contain;filter:drop-shadow(0 20px 14px rgba(0,0,0,.48))}.rtHeroTop{position:absolute;right:11px;top:11px;display:flex;gap:5px}.rtHeroTop button{height:34px;border:1px solid #52799e;border-radius:10px;background:rgba(4,15,30,.78);color:white;font-size:8px;font-weight:950;padding:0 9px}.rtHeroTop button:first-child{width:34px;padding:0;font-size:20px}.rtHeroBottom{position:absolute;left:15px;right:15px;bottom:14px;z-index:2}.rtClass{font-size:7px;letter-spacing:1.5px;color:#76c8ff;font-weight:950}.rtHeroBottom h1{font-size:48px;line-height:.88;margin:3px 0;color:#fff;text-transform:uppercase;text-shadow:0 4px #07111f}.rtHeroBottom p{margin:5px 0 7px;font-size:8px;color:#c6d8ea}.rtHeroBottom>div{display:flex;gap:5px}.rtHeroBottom>div span,.rtHeroBottom>div b{font-size:7px;border-radius:999px;padding:5px 8px;background:#10243b;border:1px solid #416382}.rtHeroBottom>div b{background:#ffd32e;color:#182235}.rtStatsStrip{display:grid;grid-template-columns:repeat(4,1fr);gap:5px;margin-bottom:8px}.rtStatsStrip div{background:linear-gradient(145deg,#10243a,#091522);border:1px solid #284762;border-radius:11px;padding:8px 3px;text-align:center}.rtStatsStrip small,.rtUpgradeInfo small{display:block;color:#718aa5;font-size:5px;font-weight:950}.rtStatsStrip b{display:block;color:#fff;font-size:9px;margin-top:3px}.rtBuildHero,.rtSection{background:linear-gradient(150deg,#0d1d2f,#081420);border:1px solid #29455f;border-radius:17px;padding:12px;margin:8px 0;box-shadow:0 9px 22px rgba(0,0,0,.18)}.rtSectionHead{display:flex;justify-content:space-between;align-items:center;gap:8px;padding-bottom:9px;border-bottom:1px solid #1d3448}.rtSectionHead small{display:block;color:#5fbaff;font-size:6px;font-weight:950;letter-spacing:1px}.rtSectionHead h2{margin:2px 0 0;font-size:19px;color:#fff}.rtSectionHead>span{font-size:6px;color:#91aac3;background:#12283e;border:1px solid #31536f;border-radius:999px;padding:5px 7px;font-weight:950}.rtLead,.rtText{font-size:8px;line-height:1.5;color:#91a7bd;margin:9px 0}.rtBuildGrid{display:grid;grid-template-columns:repeat(5,1fr);gap:5px;margin:10px 0}.rtBuildSlot{min-width:0;height:132px;padding:6px 3px;border-radius:12px;border:1px solid #31516e;background:linear-gradient(160deg,#142b43,#0b1828);color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px}.rtBuildSlot.featured{border-color:#7b59e8}.rtSlotTop{width:100%;display:flex;justify-content:space-between}.rtSlotTop span{font-size:5px;color:#718da8;font-weight:950}.rtSlotTop em{font-style:normal;font-size:6px;color:#7994ae;background:#1c334a;border-radius:50%;width:15px;height:15px;display:grid;place-items:center}.rtSlotIcon{height:48px;display:grid;place-items:center}.rtSlotIcon .compIcon{width:47px!important;height:47px!important;filter:drop-shadow(0 5px 5px rgba(0,0,0,.35))}.rtBuildSlot>b{font-size:7px;line-height:1.05;text-align:center;min-height:15px}.rtBuildSlot>small{font-size:5px;color:#63e5a6;font-weight:950}.rtPrimary{width:100%;height:36px;border:0;border-radius:10px;background:linear-gradient(180deg,#ffd936,#ffbc17);color:#182238;font-size:8px;font-weight:950;text-align:left;padding:0 11px;display:flex;align-items:center;justify-content:space-between}.rtPrimary b{font-size:18px}.rtTags{display:flex;gap:5px;flex-wrap:wrap;margin:10px 0 4px}.rtTags span{font-size:6px;font-weight:950;padding:5px 7px;border-radius:999px;background:#103c2d;border:1px solid #1db978;color:#63f0b1}.rtTags span:nth-child(2){background:#12345a;border-color:#2985df;color:#71bfff}.rtTags span:nth-child(3){background:#461c29;border-color:#e0445c;color:#ff8796}.rtTags span:nth-child(4){background:#403417;border-color:#d69b1f;color:#ffd96b}.rtPower{display:grid;grid-template-columns:repeat(11,1fr);gap:3px;margin:10px 0}.rtPower i{height:29px;display:grid;place-items:center;background:#15283d;border:1px solid #304b65;border-radius:7px;color:#7189a1;font-style:normal;font-size:6px;font-weight:950}.rtPower i.done{background:#164b6b;color:#9bd7ff}.rtPower i.next{background:#ffd52e;color:#182238}.rtUpgradeInfo{display:grid;grid-template-columns:1fr 1fr;gap:6px}.rtUpgradeInfo div{padding:8px;background:#0e2034;border:1px solid #294862;border-radius:10px}.rtUpgradeInfo b{display:block;color:#fff;font-size:8px;margin-top:3px}.rtStatGrid{display:grid;grid-template-columns:repeat(3,1fr);gap:5px;margin-top:10px}.rtStatGrid div{padding:9px 5px;background:#0e2034;border:1px solid #294862;border-radius:10px}.rtStatGrid span{display:block;color:#6e89a5;font-size:6px}.rtStatGrid b{display:block;color:#fff;font-size:10px;margin-top:3px}.rtList{margin-top:8px}.rtListRow{width:100%;display:grid;grid-template-columns:35px 1fr auto 12px;align-items:center;gap:7px;min-height:55px;padding:7px 5px;border:1px solid #294862;border-radius:11px;background:#0e2034;color:#fff;text-align:left;margin:5px 0}.rtModeBadge{width:30px;height:30px;display:grid;place-items:center;border-radius:8px;background:#176fe9;color:white;font-size:7px;font-weight:950}.rtListRow b{display:block;font-size:8px}.rtListRow small{display:block;color:#758fa8;font-size:6px;margin-top:3px}.rtListRow strong{font-size:9px;color:#ffd32e}.rtListRow i{font-style:normal;color:#6e89a5}.rtMaps{display:grid;grid-template-columns:repeat(3,1fr);gap:5px;margin-top:9px}.rtMapCard{min-width:0;padding:4px;background:#0d2034;border:1px solid #294862;border-radius:11px;color:#fff;text-align:left}.rtMapImg{height:64px;position:relative;border-radius:8px;overflow:hidden;background:#142c44}.rtMapImg img{width:100%;height:100%;object-fit:cover}.rtMapImg span{position:absolute;top:4px;left:4px;background:#ffd32e;color:#182238;border-radius:5px;padding:3px 4px;font-size:6px;font-weight:950}.rtMapCard>div:last-child{padding:5px 2px}.rtMapCard b{display:block;font-size:7px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.rtMapCard small{display:block;color:#748fa8;font-size:5px;margin-top:3px}.rtMapCard>strong{display:block;font-size:8px;color:#ffd32e;padding:0 2px 3px}.rtMissingList{margin-top:8px}.rtMissing{width:100%;display:grid;grid-template-columns:38px 1fr auto;align-items:center;gap:7px;padding:7px;border:1px solid #3d4f64;border-radius:11px;background:#0e2034;color:#fff;margin:5px 0;text-align:left}.rtMissing .compIcon{width:35px!important;height:35px!important}.rtMissing small{display:block;color:#718da6;font-size:5px}.rtMissing b{display:block;font-size:8px}.rtMissing strong{font-size:6px;color:#ff9ba7;background:#51232c;border-radius:999px;padding:5px 6px}.rtReady{padding:13px;border-radius:11px;background:#10382b;color:#62e6ab;border:1px solid #1d7654;text-align:center;font-size:7px;font-weight:950}@media(max-width:390px){.rtPage{padding-left:7px;padding-right:7px}.rtHero{margin-left:-7px;margin-right:-7px;height:345px}.rtHeroArt img{height:275px}.rtHeroBottom h1{font-size:42px}.rtBuildGrid{gap:3px}.rtBuildSlot{height:122px}.rtSlotIcon .compIcon{width:42px!important;height:42px!important}}@media(min-width:431px){.rtPage{box-shadow:0 0 55px rgba(0,0,0,.45);min-height:100vh}}
`;

const css2=String.raw`
.v3QuickNav{position:sticky;top:0;z-index:4;display:flex;gap:6px;overflow:auto;padding:7px 0;margin:0 0 8px;background:rgba(8,13,25,.88);backdrop-filter:blur(12px);scrollbar-width:none}
.v3QuickNav::-webkit-scrollbar{display:none}
.v3QuickNav a{flex:0 0 auto;text-decoration:none;color:#b9c7dc;background:#17253c;border:1px solid #3d5475;border-radius:999px;padding:7px 10px;font-size:8px;font-weight:950;letter-spacing:.5px}
.v3QuickNav a:first-child{background:#ffd34e;color:#111827;border-color:#ffe68a}

.v3Decision{display:flex;align-items:center;gap:9px;margin:9px 0 2px;padding:9px 10px;border:1px solid #66572b;border-left:3px solid #ffd34e;border-radius:10px;background:rgba(255,211,78,.06)}
.v3Decision.ready{border-color:#3d8067;border-left-color:#63e6a7;background:rgba(99,230,167,.05)}
.v3Decision>span{flex:none;color:#ffd34e;font-size:7px;font-weight:950;letter-spacing:.8px}
.v3Decision.ready>span{color:#9ff0c6}
.v3Decision b{display:block;color:#fff;font-size:9px;line-height:1.2}
.v3Decision small{display:block;color:#9aaac0;font-size:7px;line-height:1.3;margin-top:2px}
.v3QuickState.good{color:#9ff0c6!important;border-color:#3d8067!important}
.v3QuickState.owned{color:#9ecbff!important;border-color:#41678f!important}
.v3QuickState.buy{color:#ffd07a!important;border-color:#80633a!important}
.v3QuickCard{margin:8px 0 10px;padding:12px;border:1px solid #5a6f91;border-radius:16px;background:linear-gradient(145deg,#1b2d49,#101a2c);box-shadow:0 10px 25px rgba(0,0,0,.2)}
.v3QuickHead{display:flex;justify-content:space-between;align-items:flex-start;gap:10px}
.v3QuickHead span:first-child{display:block;color:#ffd34e;font-size:8px;font-weight:950;letter-spacing:1.5px}
.v3QuickHead h2{margin:2px 0 3px;color:#fff;font-size:21px}
.v3QuickHead p{margin:0;color:#aebbd0;font-size:9px;line-height:1.35}
.v3QuickBadge{font-size:7px;font-weight:950;color:#111827;background:#ffd34e;border-radius:7px;padding:5px 6px;white-space:nowrap}
.v3QuickSlots{display:flex;gap:6px;overflow-x:auto;padding:10px 1px 4px;scroll-snap-type:x mandatory;scrollbar-width:none}
.v3QuickSlots::-webkit-scrollbar{display:none}
.v3QuickSlot{position:relative;flex:0 0 142px;min-height:104px;display:flex;align-items:center;gap:7px;text-align:left;color:#fff;background:#17253b;border:1px solid #405778;border-radius:12px;padding:8px;scroll-snap-align:start}
.v3QuickSlot:active{transform:scale(.98)}
.v3QuickSlot.pending{opacity:.58;cursor:default}
.v3QuickNum{position:absolute;top:6px;right:7px;font-size:8px;font-weight:950;color:#8fa0b8}
.v3QuickIcon{width:43px;height:43px;display:grid;place-items:center;flex:none}
.v3QuickIcon .compIcon{width:43px;height:43px;object-fit:contain;filter:drop-shadow(0 3px 5px rgba(0,0,0,.3))}
.v3QuickInfo{min-width:0}
.v3QuickInfo small{display:block;color:#8ea1bc;font-size:7px;font-weight:950;letter-spacing:.6px}
.v3QuickInfo b{display:block;color:#fff;font-size:10px;line-height:1.15;margin:3px 0;word-break:break-word}
.v3QuickInfo em{display:inline-block;font-style:normal;color:#9ff0c6;border:1px solid #3d8067;border-radius:5px;padding:2px 4px;font-size:6px;font-weight:950}
.v3QuickSlot.pending .v3QuickInfo em{color:#ffd34e;border-color:#806d2f}
.v3QuickFoot{font-size:7px;color:#8f9db2;border-top:1px solid #304564;padding-top:7px}
.v3QuickFoot span{color:#ffd34e;font-weight:950}
.v3MetaContext,.v3Card[id="game-data"],.v3Card[id="trends"]{scroll-margin-top:48px}
@media(max-width:430px){
 .v3QuickHead h2{font-size:19px}
 .v3QuickSlot{flex-basis:148px}
 .v3QuickNav a{padding:7px 9px}
}


.v3DecisionHero{margin-bottom:8px!important}
.v3DecisionPanel{margin:8px 0 10px;padding:12px;border-radius:16px;border:1px solid #806d2f;background:linear-gradient(145deg,#1e2e48,#111c2e);box-shadow:0 10px 24px rgba(0,0,0,.18)}
.v3DecisionPanel.ready{border-color:#3d8067;background:linear-gradient(145deg,#172f2a,#111d2d)}
.v3DecisionTop{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:5px}
.v3DecisionEyebrow{color:#ffd34e;font-size:8px;font-weight:950;letter-spacing:1.2px}
.v3DecisionPanel.ready .v3DecisionEyebrow{color:#9ff0c6}
.v3ContextPill{max-width:58%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#aebbd0;background:#101b2c;border:1px solid #344b6b;border-radius:999px;padding:5px 7px;font-size:7px;font-weight:850}
.v3DecisionMain{display:flex;align-items:center;justify-content:space-between;gap:10px}
.v3DecisionMain h2{margin:0;color:#fff;font-size:18px;line-height:1.1}
.v3DecisionMain p{margin:4px 0 1px;color:#fff;font-size:10px;font-weight:800}
.v3DecisionMain small{display:block;color:#98a9bf;font-size:8px;line-height:1.35}
.v3DecisionIcon{flex:none;width:40px;height:40px;display:grid;place-items:center;border-radius:12px;background:#2b281a;border:1px solid #806d2f;color:#ffd34e;font-size:20px;font-weight:950}
.v3DecisionPanel.ready .v3DecisionIcon{background:#17332b;border-color:#3d8067;color:#9ff0c6}
`;

const css3=String.raw`
/* REFERENCE DETAIL — light game companion treatment */
body:has(.rhHero){background:linear-gradient(180deg,#eaf7ff,#f8fbff)!important}.rhBack{color:#18264b!important;font-weight:900!important}.rhHero{min-height:330px!important;border:0!important;border-radius:0 0 26px 26px!important;background:linear-gradient(145deg,#1673ea,#48a6ff 52%,#2852bd)!important;box-shadow:0 12px 28px rgba(25,103,215,.2)!important}.rhHero:after{background:linear-gradient(0deg,rgba(17,56,126,.7),rgba(17,56,126,0))!important}.rhHeroArt{inset:0 0 70px!important}.rhHeroArt img{height:285px!important;filter:drop-shadow(0 18px 12px rgba(0,35,90,.25))!important}.rhHeroInfo{bottom:18px!important}.rhHeroInfo h1{font-size:45px!important;text-shadow:2px 3px rgba(11,43,100,.3)!important}.rhHeroInfo p{color:#f1f8ff!important}.rhRole{color:#f5fbff!important}.rhBadges>*{background:rgba(14,52,125,.62)!important;border-color:rgba(255,255,255,.35)!important}.rhBadges b{background:#ffd52f!important;color:#15234a!important}.rhFav{background:#fff!important;color:#15234a!important;border:2px solid #fff!important}.rhTabs{background:rgba(255,255,255,.97)!important;border-color:#dce8f4!important}.rhTabs button{color:#52647d!important}.rhTabs button.active{color:#176be9!important;border-color:#176be9!important}.rhDecision{background:linear-gradient(135deg,#fff5a4,#ffe35a)!important;border-color:#f0d33d!important}.rhDecision h2,.rhDecision p{color:#172340!important}.rhDecision small{color:#6d7485!important}.rhOverviewStats>div,.rhPanel{background:#fff!important;border-color:#dce8f4!important;box-shadow:0 6px 18px rgba(38,80,125,.06)!important;color:#172443!important}.rhPanelHead h2,.rhPanelHead h3{color:#172443!important}.rhPanelHead small{color:#71819a!important}.rhBuildSlot{background:linear-gradient(180deg,#fbfdff,#eef6fd)!important;border-color:#d8e5f1!important;color:#172443!important}.rhBuildSlot em{background:#bff3cd!important;color:#16763e!important}.rhBuildSlot.missing em{background:#ffd1d5!important;color:#ad3844!important}.rhAccount{border-color:#e1ebf4!important}.rhNextAction{background:#ffe96b!important;border-color:#efd23c!important}.rhModeRow{background:#f7fbff!important;border-color:#dce7f1!important;color:#172443!important}.rhModeIcon{background:#e7f1ff!important;color:#176be9!important}.rhModeRow small{color:#8291a6!important}.rhModeRow em{background:#ffe66a!important;color:#172443!important}.rhPowerTabs>*{background:#edf5fd!important;color:#52647c!important}.rhPowerTabs b{background:#176be9!important;color:#fff!important}.rhStatGrid>div{background:linear-gradient(145deg,#effaff,#f8fbff)!important;border-color:#deebf4!important}.rhStatGrid span,.rhGrowth p{color:#71819a!important}.rhGrowth>div{background:#e3edf5!important}.rhMissingRow,.rhBuffRow{background:#f8fbff!important;border-color:#dce7f1!important;color:#172443!important}.rhMissingRow strong{background:#ffd8dc!important;color:#ad3743!important}.rhMissingRow.static strong{background:#e7edf4!important;color:#53647c!important}.rhBuffRow>span{background:#edf3f8!important;color:#53647c!important}.rhBuffRow.available{border-color:#b8defc!important}.rhDescription{color:#607089!important}.rhPanel .v3AbilityGrid .v3AbilityCard{background:#f4f9fd!important;border-color:#d8e5ef!important;color:#172443!important}.rhPanel .v3AbilityGrid .v3AbilityCard p{color:#607089!important}.rhPanel .v3AbilityTag{color:#e15b6b!important}.rhPanel .v3AbilityTag.super{color:#d89b00!important}@media(max-width:520px){.rhHero{min-height:292px!important}.rhHeroArt img{height:250px!important}.rhHeroInfo h1{font-size:40px!important}.rhPanel{padding:12px!important}}
`;
const cssFinal=String.raw`\n/* FINAL REFERENCE THEME */
body:has(.rhHero){background:#07101d!important;color:#eef5ff!important}
body:has(.rhHero) .app{background:radial-gradient(circle at 50% -10%,#12345d 0,#07101d 42%,#050b14 100%)!important}
.rhBack{display:inline-flex!important;align-items:center!important;margin:8px 0 6px!important;color:#dcecff!important;background:#10223a!important;border:1px solid #315276!important;border-radius:10px!important;padding:8px 12px!important}
.rhHero{min-height:360px!important;margin:0 -14px 10px!important;padding:0 22px 22px!important;border:1px solid #234a77!important;border-radius:0 0 26px 26px!important;overflow:hidden!important;position:relative!important;background:linear-gradient(135deg,#071a34 0%,#0e4c93 42%,#1e72dd 72%,#172e75 100%)!important;box-shadow:0 18px 45px rgba(0,0,0,.35)!important}
.rhHero:before{content:"";position:absolute;inset:0;background:radial-gradient(circle at 72% 32%,rgba(76,179,255,.42),transparent 30%),radial-gradient(circle at 25% 15%,rgba(23,114,235,.3),transparent 34%);pointer-events:none}
.rhHero:after{background:linear-gradient(0deg,rgba(3,9,18,.92) 0%,rgba(3,9,18,.55) 35%,transparent 72%)!important;inset:35% 0 0!important}
.rhHeroArt{inset:0 27% 0 27%!important;display:flex!important;align-items:flex-end!important;justify-content:center!important;z-index:0!important}
.rhHeroArt img{height:345px!important;width:auto!important;max-width:100%!important;object-fit:contain!important;filter:drop-shadow(0 22px 18px rgba(0,0,0,.48))!important;transform:translateY(18px)!important}
.rhHeroInfo{left:24px!important;bottom:22px!important;max-width:54%!important;z-index:2!important}
.rhRole{font-size:10px!important;font-weight:950!important;letter-spacing:1.3px!important;color:#9edbff!important;text-transform:uppercase!important}
.rhHeroInfo h1{font-size:clamp(42px,6vw,68px)!important;line-height:.88!important;margin:3px 0 7px!important;color:#fff!important;text-shadow:3px 4px 0 #07111f!important;letter-spacing:-2px!important}
.rhHeroInfo p{font-size:12px!important;color:#d9ebff!important;max-width:520px!important}
.rhBadges{display:flex!important;gap:6px!important;flex-wrap:wrap!important}
.rhBadges>*{background:#102641!important;border:1px solid #4a7099!important;color:#d9eaff!important;border-radius:999px!important;padding:5px 8px!important;font-size:8px!important;font-weight:950!important}
.rhBadges b{background:#ffd52f!important;border-color:#ffe88b!important;color:#101b2c!important}
.rhFav{top:12px!important;right:12px!important;width:40px!important;height:40px!important;background:#0d1d31!important;color:#fff!important;border:1px solid #6c88a7!important;z-index:4!important}
.rhToolRail{display:grid!important;grid-template-columns:repeat(4,1fr)!important;gap:8px!important;margin:0 0 10px!important}
.rhToolRail>button{background:linear-gradient(145deg,#122742,#0b1729)!important;border:1px solid #315276!important;color:#eef5ff!important;border-radius:14px!important;min-height:62px!important;padding:9px!important}
.rhToolRail>button:hover{border-color:#57a9ff!important;transform:translateY(-1px)!important}
.rhToolRail small{color:#8298b4!important}.rhToolIcon{background:#166ff0!important;color:#fff!important;border-radius:10px!important}.rhToolIcon.upgrade{background:#13bd6b!important}.rhToolIcon.map{background:#ff9e20!important}.rhToolIcon.build{background:#9b42ee!important}
.rhTabs{background:#0b1728!important;border:1px solid #284663!important;border-radius:12px!important;padding:4px!important}.rhTabs button{color:#9db0c9!important;border-radius:9px!important}.rhTabs button.active{color:#fff!important;background:#146eea!important;border-color:#3291ff!important}
.rhDecision{background:linear-gradient(135deg,#3d3510,#211d0a)!important;border:1px solid #806d2f!important;border-left:4px solid #ffd52f!important;border-radius:15px!important;color:#fff!important;box-shadow:0 8px 20px rgba(0,0,0,.2)!important}.rhDecision h2,.rhDecision p{color:#fff!important}.rhDecision small{color:#aebbd0!important}.rhDecision strong{color:#ffd52f!important}
.rhOverviewStats{display:grid!important;grid-template-columns:repeat(4,1fr)!important;gap:8px!important}.rhOverviewStats>div{background:linear-gradient(145deg,#13243a,#0c1829)!important;border:1px solid #2c4866!important;border-radius:13px!important;color:#fff!important;box-shadow:none!important;padding:12px!important}.rhOverviewStats span{color:#7f96b3!important}.rhOverviewStats b{color:#fff!important}
.rhPanel{background:linear-gradient(145deg,#111f33,#0b1626)!important;border:1px solid #294662!important;border-radius:16px!important;box-shadow:0 10px 28px rgba(0,0,0,.22)!important;color:#eaf2ff!important}.rhPanelHead h2,.rhPanelHead h3{color:#fff!important}.rhPanelHead small{color:#78b9ed!important}.rhPanelHead>span{color:#a8bad0!important}
.rhMapCard,.rhModeRow,.rhMissingRow,.rhBuffRow{background:#101f34!important;border-color:#2d4968!important;color:#eef5ff!important}.rhMapCard:hover,.rhModeRow:hover,.rhMissingRow:hover,.rhBuffRow:hover{border-color:#4ba4ff!important;background:#142945!important}.rhMapThumb{background:#091523!important}.rhModeIcon{background:#176fe9!important;color:#fff!important}.rhModeRow small{color:#8da3bd!important}.rhModeRow em{background:#ffd52f!important;color:#17243b!important}
.rhConfigList{grid-template-columns:repeat(5,minmax(0,1fr))!important;gap:8px!important}.rhConfigSlot{min-height:132px!important;background:linear-gradient(160deg,#172a44,#0d192a)!important;border-color:#345475!important;color:#fff!important;border-radius:14px!important}.rhConfigSlot:hover{border-color:#58aaff!important}.rhConfigSlot small{color:#7891ae!important}.rhConfigSlot b{color:#fff!important}.rhConfigSlot>span{background:#1b2d45!important;color:#9fb3cb!important}.rhConfigSlot.ok>span{background:#164c39!important;color:#71e4ae!important}.rhConfigSlot.missing>span{background:#5b242c!important;color:#ff9fa9!important}.rhConfigSlot.owned>span{background:#173d68!important;color:#83c3ff!important}.rhConfigSlot.verify>span{background:#554617!important;color:#ffe27a!important}
.rhNextAction{background:linear-gradient(135deg,#ffd92f,#ffbd18)!important;border-color:#ffe98a!important;color:#17233b!important}.rhNextAction small,.rhNextAction b,.rhNextAction span{color:#17233b!important}
.rhPowerTabs>*{background:#162840!important;color:#8ea5c0!important}.rhPowerTabs b{background:#176fe9!important;color:#fff!important}.rhStatGrid>div{background:linear-gradient(145deg,#12243a,#0c192a)!important;border-color:#2c4866!important}.rhStatGrid span,.rhGrowth p{color:#8299b4!important}.rhStatGrid b{color:#fff!important}.rhGrowth>div{background:#15283e!important}
.rhMissingRow strong{background:#5b242c!important;color:#ffabb3!important}.rhMissingRow.static strong{background:#1d3047!important;color:#9bb0c8!important}.rhBuffRow>span{background:#1b2d45!important;color:#9fb3cb!important}.rhBuffRow.available{border-color:#3579af!important}.rhDescription{color:#9fb0c5!important}
.rhPanel .rhSubHead h3{color:#fff!important}.rhSubHead button,.rhPanelHead button{background:#132a46!important;color:#82c1ff!important;border:1px solid #345777!important;border-radius:8px!important;padding:6px 8px!important}
.rhPanel .v3AbilityGrid .v3AbilityCard{background:linear-gradient(145deg,#172a44,#0d1929)!important;border-color:#345474!important;color:#fff!important}.rhPanel .v3AbilityGrid .v3AbilityCard p{color:#aab9cc!important}
.overdriveVisual{width:52px!important;height:52px!important;background:radial-gradient(circle,#d95cff 0,#7925bd 55%,#37105e 100%)!important;border:2px solid #f0a8ff!important;box-shadow:0 0 18px rgba(191,77,255,.35)!important}.overdriveVisual:before{content:"⚡"!important;color:#fff!important}
@media(max-width:760px){.rhHero{min-height:330px!important}.rhHeroArt{inset:0 0 70px!important}.rhHeroArt img{height:285px!important}.rhHeroInfo{left:16px!important;max-width:78%!important}.rhHeroInfo h1{font-size:44px!important}.rhToolRail{grid-template-columns:repeat(2,1fr)!important}.rhOverviewStats{grid-template-columns:repeat(2,1fr)!important}.rhConfigList{grid-template-columns:repeat(3,minmax(0,1fr))!important}}
@media(max-width:430px){.rhHero{min-height:300px!important}.rhHeroArt img{height:250px!important}.rhHeroInfo h1{font-size:39px!important}.rhConfigList{grid-template-columns:repeat(2,minmax(0,1fr))!important}}
`;

const css5=String.raw`
.rhBuildHeadActions{display:flex;align-items:center;gap:5px}.rhCopyBuild{background:#17385c;border:1px solid #3f6d9a;color:#dcecff;border-radius:8px;padding:6px 7px;font-size:7px;font-weight:950}.rhStyleTags{display:flex;gap:6px;flex-wrap:wrap;margin:4px 0 9px}.rhStyleTags span{display:inline-flex;align-items:center;border:1px solid #2d78a8;background:#102a43;color:#d8efff;border-radius:999px;padding:6px 8px;font-size:8px;font-weight:950}.rhPlaystylePanel .rhPanelHead>span{color:#ffd34e;font-size:8px;font-weight:950;background:#2a2511;border:1px solid #806d2f;border-radius:999px;padding:5px 7px}.rhPlaystylePanel .rhDescription{margin:0}

/* FINAL MASTER PAGE POLISH */
.rhHero{overflow:hidden!important;isolation:isolate}.rhHero:before{content:"";position:absolute;inset:0;z-index:-2;background:radial-gradient(circle at 78% 34%,rgba(20,111,255,.72),transparent 42%),linear-gradient(135deg,#09265a 0%,#073d9b 48%,#111a4a 100%)}.rhHero:after{content:"";position:absolute;left:0;right:0;bottom:0;height:42%;z-index:-1;background:linear-gradient(transparent,rgba(3,10,25,.95))}
.rhHeroDescription{max-width:310px!important;margin-top:7px!important;font-size:9px!important;line-height:1.35!important;color:#dbe8f8!important}.rhHeroSummary{display:grid;grid-template-columns:repeat(4,1fr);gap:5px;margin:8px 0}.rhHeroSummary>div{min-width:0;background:#091a2d;border:1px solid #2c4867;border-radius:10px;padding:8px 5px;text-align:center}.rhHeroSummary span{display:block;font-size:6px;color:#8299b5;font-weight:950;letter-spacing:.3px}.rhHeroSummary b{display:block;margin-top:3px;color:#fff;font-size:10px;line-height:1}.rhHeroSummary>div:nth-child(1) b{color:#fff}.rhHeroSummary>div:nth-child(3) b{color:#ffd32e}.rhHeroSummary>div:nth-child(4) b{color:#35e99a;font-size:8px}
.rhPowerCard{background:linear-gradient(145deg,#321e68,#2a1553);border:1px solid #8754d8;border-radius:15px;padding:11px;margin:8px 0;color:#fff;box-shadow:0 8px 24px rgba(0,0,0,.18)}.rhPowerCard small{color:#f0b7ff;font-size:7px;font-weight:950;letter-spacing:.5px}.rhPowerCard h2{font-size:19px;margin:2px 0;color:#fff}.rhPowerCard p{margin:0 0 8px;color:#d6cce7;font-size:8px;line-height:1.35}.rhPowerCard button{width:100%;height:36px;border:0;border-radius:10px;background:linear-gradient(180deg,#ffe03b,#ffc400);color:#182033;font-size:9px;font-weight:950;display:flex;align-items:center;justify-content:space-between;padding:0 12px}.rhPowerCard button strong{font-size:18px}
.rhBuildPanel .rhConfigIntro{margin-bottom:8px}.rhBuildSource{font-size:7px;color:#7890ab;margin-top:7px;text-align:right}.rhPlaystylePanel{margin-top:8px}.rhStyleTags span:nth-child(1){background:#103c2d;border-color:#19bb73;color:#48f2a5}.rhStyleTags span:nth-child(2){background:#12345b;border-color:#2986e9;color:#6ebaff}.rhStyleTags span:nth-child(3){background:#461b27;border-color:#e34159;color:#ff8393}.rhStyleTags span:nth-child(4){background:#403416;border-color:#d79d1f;color:#ffd96b}
.rhMapThumb{position:relative!important;background:linear-gradient(135deg,#26405e,#0e1b2e)!important;overflow:hidden}.rhMapThumb:after{content:"";position:absolute;inset:0;background:linear-gradient(135deg,rgba(24,144,255,.18),transparent 45%,rgba(255,194,46,.18));pointer-events:none}.rhMapThumb img{width:100%;height:100%;object-fit:cover;display:block}.rhMapThumb img[style*="display: none"] + span{z-index:2}.rhMapThumb>span{z-index:3!important}
.rhModeRow{min-height:55px!important}.rhModeIcon{display:grid!important;place-items:center!important;background:#173a62!important;border:1px solid #3d78aa!important;color:#dff0ff!important;font-weight:950!important}
.v3Hyper,.v3BuffiesCard{margin-top:8px}.v3HyperBody{background:#28133f!important;border-color:#8b35c8!important}.v3BuffGrid{display:grid;gap:6px}.v3BuffGrid button{min-height:64px}.v3FeatureComponent{min-height:72px}.v3FeatureComponent .compIcon{background:transparent}
.rhMissingRow.static{cursor:default!important}.rhMissingRow.static:hover{transform:none!important}.rhPanel .rhDescription{font-size:9px;line-height:1.45;color:#b8c9dd}
@media(max-width:430px){.rhHero{min-height:320px!important}.rhHeroArt{inset:0 0 72px!important}.rhHeroArt img{height:245px!important;max-width:96%!important}.rhHeroInfo{bottom:12px!important;z-index:3}.rhHeroDescription{max-width:100%!important}.rhHeroSummary{gap:4px}.rhHeroSummary>div{padding:7px 3px}.rhHeroSummary b{font-size:9px}.rhPowerCard{padding:10px}.rhPowerCard h2{font-size:18px}.rhBuildPanel .rhConfigList{grid-template-columns:repeat(2,minmax(0,1fr))!important}.rhConfigSlot{min-height:112px!important}.rhConfigSlot .compIcon{width:46px!important;height:46px!important}.rhPanel{margin-top:8px!important}.rhUpgradeTrack span{height:27px!important}.rhStatGrid{grid-template-columns:repeat(2,minmax(0,1fr))!important}.v3FeatureComponent{grid-template-columns:52px 1fr auto}.v3FeatureComponent .compIcon{width:48px!important;height:48px!important}}

/* MASTER REFERENCE UI — mobile implementation */
.rhHeroActions{position:absolute;top:10px;right:10px;z-index:5;display:flex;gap:6px}.rhHeroActions button{position:static!important}.rhFav,.rhTeam{display:flex;align-items:center;justify-content:center;gap:5px;height:38px;border-radius:11px!important}.rhFav svg,.rhTeam svg{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}.rhTeam{padding:0 9px;background:#0d1d31!important;border:1px solid #52779f!important;color:#fff!important;font-size:8px;font-weight:950;white-space:nowrap}
.rhToolRail{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:7px!important;margin:0 0 10px!important}.rhToolRail>button{display:flex!important;align-items:center!important;gap:8px!important;min-width:0!important;min-height:58px!important;padding:8px!important;text-align:left!important;background:linear-gradient(145deg,#122742,#0b1729)!important;border:1px solid #315276!important;color:#eef5ff!important;border-radius:13px!important}.rhToolRail>button:active{transform:scale(.985)}.rhToolRail>button div{min-width:0;flex:1}.rhToolRail>button b{display:block;font-size:10px;line-height:1.1}.rhToolRail>button small{display:block;margin-top:3px;color:#8298b4!important;font-size:7px;line-height:1.1}.rhToolRail>button i{font-style:normal;color:#7188a4;font-size:17px}.rhToolIcon{width:31px!important;height:31px!important;display:grid!important;place-items:center!important;flex:none!important;border-radius:9px!important}.rhToolIcon svg{width:19px;height:19px;fill:none;stroke:currentColor;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round}.rhToolIcon.home{background:#176fe9!important}.rhToolIcon.build{background:#8c42df!important}.rhToolIcon.upgrade{background:#13bd6b!important}.rhToolIcon.modes{background:#e53e55!important}.rhToolIcon.map{background:#ff9e20!important}.rhToolIcon.stats{background:#2386e8!important}.rhToolIcon.video{background:#e53935!important}.rhToolIcon.more{background:#53677f!important}
.rhBuildHeadActions{display:flex;align-items:center;gap:5px}.rhCopyBuild{background:#17385c;border:1px solid #3f6d9a;color:#dcecff;border-radius:8px;padding:6px 7px;font-size:7px;font-weight:950}.rhPowerNow{font-size:7px;color:#8fc7ff;background:#132a46;border:1px solid #345777;border-radius:999px;padding:5px 7px;font-weight:950}
.rhUpgradeTrack{display:grid;grid-template-columns:repeat(11,1fr);gap:3px;margin:10px 0 12px}.rhUpgradeTrack span{height:28px;display:grid;place-items:center;border-radius:8px;background:#15263d;border:1px solid #304968;color:#7e93ac;font-size:7px;font-weight:950}.rhUpgradeTrack span.done{background:#174e70;color:#9ed7ff;border-color:#3987b9}.rhUpgradeTrack span.next{background:#ffd52f;color:#17233b;border-color:#ffe98b;box-shadow:0 0 0 2px rgba(255,213,47,.14)}.rhUpgradeSummary{display:grid;grid-template-columns:repeat(2,1fr);gap:6px}.rhUpgradeSummary>div{background:#101f34;border:1px solid #2d4968;border-radius:11px;padding:8px;min-width:0}.rhUpgradeSummary>div:last-child{grid-column:1/-1}.rhUpgradeSummary small{display:block;color:#8299b4;font-size:7px;font-weight:900}.rhUpgradeSummary b{display:block;color:#fff;font-size:9px;line-height:1.25;margin-top:3px;word-break:break-word}
.rhVideoCard{display:grid;grid-template-columns:40px 1fr;gap:8px;align-items:center;background:#101f34;border:1px solid #2d4968;border-radius:13px;padding:10px}.rhVideoIcon{width:40px;height:40px;border-radius:10px;background:#e53935;display:grid;place-items:center;color:#fff}.rhVideoIcon svg{width:21px;height:21px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}.rhVideoCard b{font-size:11px;color:#fff}.rhVideoCard p{margin:3px 0 0;color:#8ea3bd;font-size:8px;line-height:1.35}.rhVideoCard a{grid-column:1/-1;text-align:center;background:#176fe9;border:1px solid #4ca0ff;color:#fff;text-decoration:none;border-radius:8px;padding:8px;font-size:8px;font-weight:950}
.rhConfigSlot .compIcon{filter:drop-shadow(0 4px 5px rgba(0,0,0,.3))}
@media(min-width:431px){body:has(.rhHero) .app{max-width:430px!important}.rhToolRail{grid-template-columns:repeat(2,minmax(0,1fr))!important}}
@media(max-width:390px){.rhHeroActions{right:8px}.rhTeam{padding:0 7px}.rhTeam span{display:none}.rhToolRail>button{min-height:54px!important}.rhUpgradeTrack{gap:2px}.rhUpgradeTrack span{height:26px;font-size:6px}}

`;
const css6=String.raw`
/* MASTER PAGE v18 */
body:has(.rtPage){background:#eaf5fc!important;color:#172443!important}
body:has(.rtPage) .app{background:linear-gradient(180deg,#eaf5fc,#f7fbff)!important;box-shadow:none!important}
.rtPage{max-width:430px!important;background:transparent!important;color:#172443!important;padding:0 9px 96px!important}
.rtHero{height:356px!important;margin:0 -9px 11px!important;border-radius:0 0 28px 28px!important;box-shadow:0 12px 28px rgba(30,91,155,.18)!important}
.rtHeroBg{background:radial-gradient(circle at 78% 22%,rgba(117,209,255,.72),transparent 25%),linear-gradient(145deg,#083b92,#176fdf 55%,#244cb0)!important}.rtHeroBg:after{background:linear-gradient(transparent 35%,rgba(7,25,61,.92))!important}
.rtHeroArt{inset:4px 8px 78px!important;align-items:flex-end!important}.rtHeroArt img{height:300px!important;max-width:96%!important;filter:drop-shadow(0 18px 13px rgba(2,27,70,.38))!important}
.rtHeroTop{top:12px!important;right:12px!important}.rtHeroTop button{height:38px!important;border-radius:12px!important;background:rgba(8,28,62,.72)!important;border-color:rgba(255,255,255,.42)!important}.rtHeroBottom{left:17px!important;bottom:15px!important}.rtHeroBottom h1{font-size:48px!important;text-shadow:0 3px #0a2450!important}
.rtStatsStrip{gap:6px!important;margin-bottom:10px!important}.rtStatsStrip div{background:#fff!important;border:1px solid #d9e7f2!important;border-radius:13px!important;padding:10px 3px!important;box-shadow:0 5px 14px rgba(35,85,130,.06)!important}.rtStatsStrip b{color:#1b2b49!important}
.rtBuildHero,.rtSection{background:#fff!important;border:1px solid #d9e7f2!important;border-radius:18px!important;padding:13px!important;margin:9px 0!important;box-shadow:0 6px 18px rgba(35,85,130,.07)!important}.rtSectionHead{border-bottom:1px solid #e5edf4!important}.rtSectionHead small{color:#72839a!important}.rtSectionHead h2{color:#172443!important;font-size:21px!important}.rtSectionHead>span{background:#eef4f9!important;border-color:#dbe7f0!important;color:#718198!important}.rtLead,.rtText{color:#718096!important}
.rtBuildSlot{height:124px!important;border:1px solid #d9e5ee!important;background:linear-gradient(180deg,#fbfdff,#eff7fc)!important;color:#172443!important;border-radius:13px!important}.rtBuildSlot.featured{border-color:#8b65dc!important}.rtSlotTop span{color:#8292a6!important}.rtSlotTop em{background:#e8f0f6!important;color:#63758b!important}.rtBuildSlot>b{color:#1a2947!important}.rtBuildSlot>small{color:#1d9b67!important}.rtPrimary{background:linear-gradient(180deg,#ffe36b,#ffd12d)!important;color:#182238!important}
.rtPower i{background:#edf3f8!important;border-color:#d9e5ee!important;color:#8795a5!important}.rtPower i.done{background:#dceeff!important;border-color:#b7d9f7!important;color:#176fe9!important}.rtPower i.next{background:#ffd52f!important;color:#1a2945!important}.rtUpgradeInfo div{background:#f6faff!important;border-color:#dce8f1!important}.rtUpgradeInfo b{color:#1b2b49!important}
.rtStatGrid div{background:linear-gradient(145deg,#f5fbff,#edf6fc)!important;border-color:#d9e6ef!important}.rtStatGrid span{color:#78899d!important}.rtStatGrid b{color:#1c2b48!important;font-size:14px!important}
.rtListRow,.rtMapCard,.rtMissing{background:#f8fbfe!important;border-color:#dbe7f0!important;color:#172443!important}.rtListRow strong,.rtMapCard>strong{color:#176fe9!important}.rtModeBadge{background:#e5f1ff!important;color:#176fe9!important}
.rtSection>.v3Card{margin:8px 0 0!important;padding:0!important;border:0!important;border-radius:0!important;background:transparent!important;box-shadow:none!important}.rtSection>.v3Card .v3Title{border-bottom:1px solid #e5edf4!important}.rtSection>.v3Card .v3Title h2{color:#172443!important}.rtSection>.v3Card .v3StatsGrid>div,.rtSection>.v3Card .v3AbilityCard,.rtSection>.v3Card.v3BuffiesCard .v3BuffGrid button,.rtSection>.v3Card.v3OverdriveCard .v3FeatureComponent{background:#f7fbfe!important;border-color:#dbe7f0!important;color:#172443!important}.rtSection>.v3Card .v3StatsGrid span,.rtSection>.v3Card .v3AbilityCard p,.rtSection>.v3Card.v3BuffiesCard .v3BuffGrid button>div p{color:#7b8b9e!important}.rtSection>.v3Card.v3BuffiesCard .v3BuffGrid{gap:7px!important}.rtSection>.v3Card.v3BuffiesCard .v3BuffGrid button{border-radius:13px!important;min-height:78px!important}.rtSection>.v3Card.v3BuffiesCard .v3BuffIcon{width:48px!important;height:48px!important;display:grid!important;place-items:center!important}.rtSection>.v3Card.v3BuffiesCard .v3BuffIcon .compIcon,.rtSection>.v3Card.v3BuffiesCard .generatedIcon{width:46px!important;height:46px!important;object-fit:contain!important}.rtBuffieFallback{width:46px;height:46px;border-radius:13px;display:grid;place-items:center;background:linear-gradient(145deg,#8c43e6,#c66bff);border:2px solid #e1b8ff;color:#fff;font-size:18px;font-weight:950}
@media(max-width:430px){.rtHero{height:334px!important}.rtHeroArt{inset:0 0 76px!important}.rtHeroArt img{height:276px!important}.rtHeroBottom h1{font-size:43px!important}.rtBuildSlot{height:116px!important}.rtStatGrid{grid-template-columns:repeat(2,1fr)!important}.rtSection>.v3Card .v3AbilityGrid{grid-template-columns:1fr!important}}

`
const st=document.createElement('style');st.id='bh-detail-v3';const css4=String.raw`
/* v17 configuration consolidation + reliable overdrive visuals */
.rhConfigIntro{margin:-2px 0 10px;color:#71819a;font-size:10px;line-height:1.4}.rhConfigList{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px}.rhConfigSlot{min-width:0;min-height:118px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px;padding:9px 6px;border:1px solid #d8e5f1;border-radius:15px;background:linear-gradient(180deg,#fbfdff,#eef6fd);color:#172443;text-align:center}.rhConfigSlot .compIcon{width:48px;height:48px;object-fit:contain}.rhConfigSlot div{min-width:0;width:100%}.rhConfigSlot small{display:block;color:#8190a4;font-size:7px;font-weight:900;letter-spacing:.5px}.rhConfigSlot b{display:block;font-size:9px;line-height:1.15}.rhConfigSlot>span{font-size:7px;font-weight:950;border-radius:999px;padding:4px 6px;background:#e6edf4;color:#53647c}.rhConfigSlot.ok>span{background:#bff3cd;color:#16763e}.rhConfigSlot.missing>span{background:#ffd1d5;color:#ad3844}.rhConfigSlot.owned>span{background:#dcecff;color:#176be9}.rhConfigSlot.verify>span{background:#fff1bf;color:#866b00}.rhConfigSlot:hover{border-color:#79b5f1;transform:translateY(-1px)}.rhConfigCount{background:#176be9;color:#fff;border-radius:999px;padding:6px 9px;font-size:9px;font-weight:950}.overdriveVisual{width:48px!important;height:48px!important;display:grid!important;place-items:center!important;border-radius:13px!important;background:linear-gradient(145deg,#ffb52e,#ef7d1d)!important;border:2px solid #ffe08a!important;box-shadow:0 5px 12px rgba(239,125,29,.25)!important;color:#fff!important}.overdriveVisual:before{content:'⚡';filter:drop-shadow(0 2px 1px rgba(0,0,0,.2));font-size:26px!important}@media(max-width:650px){.rhConfigList{grid-template-columns:repeat(3,minmax(0,1fr))}.rhConfigSlot{min-height:112px}.rhConfigSlot .compIcon{width:44px;height:44px}}@media(max-width:390px){.rhConfigList{grid-template-columns:repeat(2,minmax(0,1fr))}}

/* MOBILE-FIRST CANVAS: detail is always designed as a phone UI */
body:has(.rhHero){width:100%;min-width:0;overflow-x:hidden}
body:has(.rhHero) .app{width:100%;max-width:430px!important;margin:0 auto!important;padding:0 10px!important;box-sizing:border-box!important;overflow-x:hidden!important}
body:has(.rhHero) .rhHero{margin-left:-10px!important;margin-right:-10px!important;border-radius:0 0 22px 22px!important;padding-left:14px!important;padding-right:14px!important;min-height:300px!important}
.rhHeroArt{inset:0 0 66px!important}
.rhHeroArt img{height:250px!important;max-width:92%!important}
.rhHeroInfo{left:14px!important;bottom:16px!important;max-width:82%!important}
.rhHeroInfo h1{font-size:39px!important;line-height:.9!important}
.rhToolRail{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:7px!important}
.rhToolRail>button{min-height:58px!important;padding:8px!important}
.rhTabs{overflow-x:auto!important;white-space:nowrap!important;display:flex!important}
.rhTabs button{flex:1 0 auto!important;padding:8px 10px!important}
.rhOverviewStats{grid-template-columns:repeat(2,minmax(0,1fr))!important}
.rhPanel{padding:12px!important;border-radius:14px!important}
.rhPanelHead{gap:7px!important}
.rhPanelHead h2{font-size:20px!important}
.rhMapList,.rhModeList,.rhMissingList,.rhBuffList{width:100%!important;min-width:0!important}
.rhMapCard,.rhModeRow,.rhMissingRow,.rhBuffRow{min-width:0!important;box-sizing:border-box!important}
.rhConfigList{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:7px!important}
.rhConfigSlot{min-height:108px!important;padding:8px 5px!important}
.rhConfigSlot .compIcon{width:44px!important;height:44px!important}
.rhStatGrid{grid-template-columns:repeat(2,minmax(0,1fr))!important}
.rhDecision{padding:12px!important}
.rhNextAction{width:100%!important;box-sizing:border-box!important}
@media(min-width:431px){body:has(.rhHero) .app{max-width:430px!important}.rhHeroArt img{height:250px!important}.rhHeroInfo h1{font-size:39px!important}}
@media(max-width:390px){body:has(.rhHero) .app{padding:0 8px!important}.rhHero{min-height:286px!important}.rhHeroArt img{height:235px!important}.rhHeroInfo{left:12px!important}.rhHeroInfo h1{font-size:35px!important}.rhPanel{padding:10px!important}.rhToolRail>button{min-height:54px!important}.rhConfigSlot{min-height:102px!important}}
`;st.textContent=css+css2+css3+css4+css5+css6;document.head.appendChild(st);
})();