/* Brawl Helper detail V3: data-dense Brawler profile inspired by community stat pages.
   Uses only synchronized catalog/meta data; missing fields are explicitly marked. */
(function(){
'use strict';
const E=window.esc||((v)=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])));
const F=window.fmt||((n)=>Number(n||0).toLocaleString('en-US'));
const PCT=v=>{const n=Number(v);return Number.isFinite(n)?n.toFixed(n%1?1:0)+'%':'—'};

const N=v=>Number.isFinite(Number(v))?Number(v):null;
function uiIcon(kind){
 const p={home:'<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10.5V20h13v-9.5"/><path d="M9 20v-5h6v5"/>',build:'<path d="m14.5 5.5-9 9 4 4 9-9"/><path d="m13 7 4 4"/><path d="m17.5 3.5 3 3"/><path d="M4 20h5"/>',upgrade:'<path d="M12 20V5"/><path d="m6.5 11 5.5-6 5.5 6"/><path d="M5 20h14"/>',modes:'<circle cx="12" cy="12" r="8"/><path d="m9 9 6 3-6 3Z"/>',map:'<path d="m4 6 5-2 6 2 5-2v14l-5 2-6-2-5 2Z"/><path d="M9 4v14M15 6v14"/>',stats:'<path d="M5 19V11M12 19V6M19 19V3"/><path d="M3 19h18"/>',video:'<rect x="3" y="5" width="18" height="14" rx="3"/><path d="m10 9 5 3-5 3Z"/>',more:'<circle cx="5" cy="12" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="19" cy="12" r="1.2"/>',team:'<circle cx="9" cy="9" r="3"/><circle cx="17" cy="10" r="2.5"/><path d="M3.5 20c.6-3.2 2.4-5 5.5-5s4.9 1.8 5.5 5"/><path d="M14.5 16c2.8-.6 5.1.8 5.8 4"/>'};
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
 const p=profile(b),st=p?.baseStats||{},a=p?.attack,s=p?.super;
 const stats=[['Health',st.health],['Movement Speed',st.speed],['Attack Damage',st.attackDamage],['Attack Range',st.attackRange],['Reload',st.reloadMs?Math.round(st.reloadMs/100):null],['Super Charge',st.superChargeMultiplier]];
 const attackType=JSON.stringify('attack'),superType=JSON.stringify('super');
 return '<section class="v3Card" id="game-data"><div>'+sectionTitle('GAME DATA','Stats & abilities',p?.coverage?.fields?.attack?'BrawlAPI':'partial')+
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
     return item?icon('gadgets',item,b):'<img class="compIcon generatedIcon" src="'+(window.svgComponentIcon?window.svgComponentIcon('buffie','G'):'')+'" alt="Gadget Buffie">';
   }
   if(key==='starPower'){
     const src=set?.abilities?.[0]?.source;
     const item=src?itemByName(b,'starPower',src):null;
     return item?icon('starPowers',item,b):'<img class="compIcon generatedIcon" src="'+(window.svgComponentIcon?window.svgComponentIcon('buffie','S'):'')+'" alt="Star Power Buffie">';
   }
   const h=profile(b)?.hyperCharge||window.catalogEntry?.(b)?.hyperCharges?.[0];
   return h?icon('hyperCharges',h,b):'<img class="compIcon generatedIcon" src="'+(window.svgComponentIcon?window.svgComponentIcon('hyperCharge','H'):'')+'" alt="Hypercharge Buffie">';
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
 const H=v=>JSON.stringify(String(v)).replace(/\"/g,'&quot;');
 const p=profile(b)||{}, id=p.identity||{}, n=noff(b), stats=n?.stats||p?.baseStats||{}, owned=window.isOwnedAccount?.(b);
 const role=id.class?.name||window.catalogEntry?.(b)?.class?.name||'Brawler';
 const rarity=id.rarity?.name||window.catalogEntry?.(b)?.rarity?.name||'';
 const mode=window.playMode||'Ranked', map=window.playMap||'Random';
 const meta=window.metaEntry?.(b,mode,map), rank=window.metaRankOf?.(b,mode,map);
 const buildItems=window.guideComponents?.(b)||[];
 const actions=window.nextActions?.(b)||[];
 const next=actions.find(a=>['POWER','BUY','EQUIP','VERIFY'].includes(a.type))||actions[0];
 const over=buildItems[4]?.[2]||null;
 const buffRows=window.buffieRows?.(b)||[];
 const buffAvailable=buffRows.filter(x=>x[2]?.length).length;
 const buffOwned=buffRows.filter(x=>x[3]===true).length;
 const modes=Object.keys(window.MODES||{}).map(name=>({name,m:window.metaEntry?.(b,name,'Random')})).filter(x=>x.m?.score!=null).sort((a,z)=>Number(z.m.score)-Number(a.m.score));
 const modeCards=modes.map(x=>'<button class="rhModeRow" type="button" onclick="playMode='+H(x.name)+';render()"><span class="rhModeIcon">'+E(String(x.name).slice(0,1).toUpperCase())+'</span><div><b>'+E(x.name)+'</b><small>'+E(PCT(x.m.winRate))+' WR · '+E(PCT(x.m.pickRate))+' USE</small></div><em>'+E(Math.round(Number(x.m.score)||0))+'</em><i>›</i></button>').join('');
 const bestMaps=(noff(b)?.maps||[]).filter(x=>Number.isFinite(Number(x.score))).sort((a,z)=>Number(z.score)-Number(a.score)).slice(0,3);
 const mapSlug=v=>String(v||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/&/g,'and').replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'');
 const mapCards=bestMaps.map((x,i)=>{
   const src='https://www.noff.gg/brawl-stars/res/img/maps/'+mapSlug(x.name)+'.webp';
   return '<button class="rhMapCard" type="button" onclick="playMap='+H(x.name)+';render()"><div class="rhMapThumb"><img src="'+src+'" alt="'+E(x.name)+'" onerror="this.style.display=\'none\'"><span>#'+(i+1)+'</span></div><div><b>'+E(x.name)+'</b><small>'+E(PCT(x.winRate))+' WR · '+E(PCT(x.pickRate))+' USE</small></div><strong>'+E(Math.round(x.score))+'</strong></button>';
 }).join('');
 const accountConfig=buildItems.map(([label,type,item])=>{
   const pending=!item||String(item.id||'').startsWith('pending:')||String(item.id||'').startsWith('none:');
   const st=pending?'DA OTTENERE':window.itemStatus?.(b,type,item)||'NON VERIFICATO';
   const cls=st==='EQUIPPED'?'ok':st==='OWNED'?'owned':st==='NOT OWNED'?'missing':'verify';
   return '<button class="rhConfigSlot '+cls+'" type="button" '+(pending?'':'onclick="componentModalV2ById('+b.id+','+H(type)+','+H(String(item?.id||''))+')"')+'>'+window.compIcon(type,item,b)+'<div><small>'+E(label)+'</small><b>'+E(item?.name||'Data unavailable')+'</b></div><span>'+E(st==='EQUIPPED'?'In uso':st==='OWNED'?'Posseduto':st==='NOT OWNED'?'Da ottenere':pending?'Da ottenere':'Verifica')+'</span></button>';
 }).join('');
 const missing=buildItems.filter(([label,type,item])=>item&&window.itemStatus?.(b,type,item)==='NOT OWNED');
 const missingRows=missing.map(([label,type,item])=>'<button class="rhMissingRow" type="button" onclick="componentModalV2ById('+b.id+','+H(type)+','+H(String(item.id))+')">'+window.compIcon(type,item,b)+'<div><small>'+E(label)+'</small><b>'+E(item.name)+'</b></div><strong>Non possiedi</strong><i>›</i></button>').join('');
 const tabs=(activeId)=>'<div class="rhTabs">'+[['overview','Panoramica'],['build','Build'],['modes','Modalità'],['stats','Stat'],['more','Altro']].map(x=>'<button class="'+(x[0]===activeId?'active':'')+'" type="button" onclick="document.getElementById(\'rh-'+x[0]+'\')?.scrollIntoView({behavior:\'smooth\',block:\'start\'})">'+x[1]+'</button>').join('')+'</div>';
 const context=mode+(map!=='Random'?' · '+map:'');
 const nextTitle=next?(next.type==='POWER'?'Potenzia '+b.name:next.type==='BUY'?'Ottieni componente':next.type==='EQUIP'?'Equipaggia componente':'Controlla configurazione'):'Pronto a giocare';
 const nextText=next?.label||'La configurazione consigliata è pronta. Adatta la build alla modalità e alla mappa.';
 const heroDescription=id.description||window.catalogEntry?.(b)?.description||'';
 const statsGrid=[['Salute',stats.health],['Attacco',stats.attackDamage],['Super',stats.superDamage],['Velocità',stats.speed],['Ricarica Super',stats.superChargeMultiplier],['Portata',stats.attackRange]];
 const statCells=statsGrid.map(([l,v])=>'<div><span>'+E(l)+'</span><b>'+E(v==null?'—':String(v))+'</b></div>').join('');
 const buffMeta=buffRows.map(([label,key,items,state])=>'<button class="rhBuffRow '+(items.length?'available':'empty')+'" type="button" '+(items.length?'onclick="componentModalV2ById('+b.id+',\'buffies\',\''+key+'\')"':'')+'>'+window.compIcon('buffies',{id:'buffie:'+key,name:label},b)+'<div><b>'+E(items[0]?.name||label)+'</b><small>'+E(items[0]?.description||'Buffie non ancora verificato per questo Brawler.')+'</small></div><span>'+(state===true?'In uso':items.length?'Disponibile':'—')+'</span></button>').join('');
 return '<button class="rhBack" type="button" onclick="selected=null;render()">← Brawlers</button>'+
 '<section class="rhHero" id="rh-overview"><div class="rhHeroArt"><div class="rhHeroGlow"></div><img src="'+E((window.catalogEntry?.(b)?.imageUrl2)||window.portrait(b))+'" alt="'+E(b.name)+'" onerror="this.onerror=null;this.src='+JSON.stringify(window.portrait(b))+'"></div><div class="rhHeroActions"><button class="rhFav" type="button" aria-label="Preferito" onclick="toggleFavoriteV3('+b.id+')">'+uiIcon("star")+'</button><button class="rhTeam" type="button" onclick="addToTeamV3('+b.id+')">'+uiIcon("team")+'<span class="rhTeamStatus">Aggiungi al Team</span></button></div><div class="rhHeroInfo"><span class="rhRole">'+E(role)+'</span><h1>'+E(b.name)+'</h1><p>'+E(id.title||'Danni a distanza · Controllo · Visione')+'</p><div class="rhBadges"><span>'+E(rarity||'—')+'</span><span>'+E(role)+'</span><b>'+(rank?'#'+rank+' META':'META')+'</b></div><p class="rhHeroDescription">'+E(heroDescription||'Informazioni sul Brawler non ancora disponibili nei dati sincronizzati.')+'</p></div></section>'+
 '<section class="rhHeroSummary"><div><span>WIN RATE</span><b>'+PCT(meta?.winRate??n?.stats?.winRate)+'</b></div><div><span>USO</span><b>'+PCT(meta?.pickRate??n?.stats?.pickRate)+'</b></div><div><span>META</span><b>'+(rank?'#'+rank:'—')+'</b></div><div><span>ACCOUNT</span><b>'+E(owned?'Posseduto':'Catalogo')+'</b></div></section>'+
 '<section class="rhPowerCard"><div><small>POTENZIA '+E(b.name).toUpperCase()+'</small><h2>Power '+E(b.power||'—')+'</h2><p>Porta il Brawler a Power 11 per sbloccare il percorso completo della build.</p><button type="button" onclick="document.getElementById(\'rh-upgrade\')?.scrollIntoView({behavior:\'smooth\'})">Vedi percorso upgrade <strong>›</strong></button></section>'+
 '<section class="rhToolRail" aria-label="Navigazione Brawler"><button type="button" data-target="rh-overview" onclick="document.getElementById(this.dataset.target)?.scrollIntoView({behavior:\'smooth\'})"><span class="rhToolIcon home">'+uiIcon("home")+'</span><div><b>Panoramica</b><small>Build & meta</small></div><i>›</i></button><button type="button" data-target="rh-build" onclick="document.getElementById(this.dataset.target)?.scrollIntoView({behavior:\'smooth\'})"><span class="rhToolIcon build">'+uiIcon("build")+'</span><div><b>Build</b><small>5 componenti</small></div><i>›</i></button><button type="button" data-target="rh-upgrade" onclick="document.getElementById(this.dataset.target)?.scrollIntoView({behavior:\'smooth\'})"><span class="rhToolIcon upgrade">'+uiIcon("upgrade")+'</span><div><b>Upgrade</b><small>Cosa fare</small></div><i>›</i></button><button type="button" data-target="rh-modes" onclick="document.getElementById(this.dataset.target)?.scrollIntoView({behavior:\'smooth\'})"><span class="rhToolIcon modes">'+uiIcon("modes")+'</span><div><b>Modalità</b><small>Dove rende</small></div><i>›</i></button><button type="button" data-target="rh-maps" onclick="document.getElementById(this.dataset.target)?.scrollIntoView({behavior:\'smooth\'})"><span class="rhToolIcon map">'+uiIcon("map")+'</span><div><b>Mappe</b><small>Top mappe</small></div><i>›</i></button><button type="button" data-target="rh-stats" onclick="document.getElementById(this.dataset.target)?.scrollIntoView({behavior:\'smooth\'})"><span class="rhToolIcon stats">'+uiIcon("stats")+'</span><div><b>Statistiche</b><small>Game data</small></div><i>›</i></button><button type="button" data-target="rh-video" onclick="document.getElementById(this.dataset.target)?.scrollIntoView({behavior:\'smooth\'})"><span class="rhToolIcon video">'+uiIcon("video")+'</span><div><b>Video</b><small>Gameplay</small></div><i>›</i></button><button type="button" data-target="rh-more" onclick="document.getElementById(this.dataset.target)?.scrollIntoView({behavior:\'smooth\'})"><span class="rhToolIcon more">'+uiIcon("more")+'</span><div><b>Altro</b><small>Account & extra</small></div><i>›</i></button></section>'+
 '<section class="rhPanel rhBuildPanel" id="rh-build"><div class="rhPanelHead"><div><small>BUILD CONSIGLIATA</small><h2>Build meta</h2></div><div class="rhBuildHeadActions"><span class="rhConfigCount">'+buildItems.length+'/5</span><button type="button" class="rhCopyBuild" onclick="copyBuildV3('+b.id+')"><span class="rhCopyStatus">Copia build</span></button></div></div><p class="rhConfigIntro">La configurazione più forte disponibile nel dataset sincronizzato per questo Brawler.</p><div class="rhConfigList">'+accountConfig+'</div><div class="rhBuildSource">Community signal · '+E(build(b)?.sample||'—')+' build analizzate</div></section>'+
 '<section class="rhPanel rhPlaystylePanel"><div class="rhPanelHead"><div><small>STILI DI GIOCO</small><h2>Come usarlo</h2></div><span>Diff. '+playstyleV3(b).difficulty+'</span></div><div class="rhStyleTags">'+playstyleV3(b).tags.map(x=>'<span>'+E(x)+'</span>').join('')+'</div><p class="rhDescription">'+E(b.name)+' rende al meglio combinando la funzione di '+E(role.toLowerCase())+' con il controllo dello spazio e la pressione sugli avversari. Adatta la build alla modalità e alla mappa selezionata.</p></section>'+
 '<section class="rhPanel" id="rh-upgrade"><div class="rhPanelHead"><div><small>PERCORSO DI PROGRESSIONE</small><h2>Upgrade consigliato</h2></div><span class="rhPowerNow">Power '+E(b.power||'—')+'/11</span></div><div class="rhUpgradeTrack">'+[1,2,3,4,5,6,7,8,9,10,11].map(n=>'<span class="'+(Number(b.power)>=n?'done ':'')+(Number(b.power)+1===n?'next':'')+'">'+n+'</span>').join('')+'</div><div class="rhUpgradeSummary"><div><small>Potenza attuale</small><b>'+E(b.power||'—')+'</b></div><div><small>Prossimo obiettivo</small><b>'+E(next?.type==='POWER'?'Power '+Math.min(11,Number(b.power||1)+1):next?.label||'Power 11')+'</b></div><div><small>Priorità</small><b>'+E(next?.reason||'Completa la build consigliata')+'</b></div></div><button class="rhNextAction" type="button" onclick="document.getElementById(\'rh-more\')?.scrollIntoView({behavior:\'smooth\'})"><div><small>VEDI PERCORSO COMPLETO</small><b>Apri upgrade e mancanti</b><span>Confronta ciò che possiedi e ciò che conviene sbloccare.</span></div><strong>›</strong></button></section>'+
 '<section class="rhPanel" id="rh-stats"><div class="rhPanelHead"><div><small>STATISTICHE BASE</small><h2>Game data</h2></div><span>Power '+E(b.power||'—')+'</span></div><div class="rhStatGrid">'+statCells+'</div><div class="rhGrowth"><h3>Progressione</h3><div><i style="width:'+Math.min(100,Math.round((Number(b.power)||1)/11*100))+'%"></i></div><p>Power '+E(b.power||'—')+' / 11 · Readiness '+E(window.readiness?.(b)||0)+'%</p></div></section>'+
 '<section class="rhPanel" id="rh-modes"><div class="rhPanelHead"><div><small>PRESTAZIONI PER MODALITÀ</small><h2>Dove rende meglio</h2></div><span>Top '+Math.min(5,modes.length)+'</span></div><div class="rhModeList">'+(modeCards||'<div class="rhEmpty">Nessun dato meta validato per questo Brawler.</div>')+'</div></section>'+
 '<section class="rhPanel" id="rh-maps"><div class="rhPanelHead"><div><small>MAP PERFORMANCE</small><h2>Le migliori mappe</h2></div><span>Top 3</span></div><div class="rhMapList">'+(mapCards||'<div class="rhEmpty">Nessun dato mappa disponibile.</div>')+'</div></section>'+
 overdriveBlock(b)+buffieBlock(b)+
 '<section class="rhPanel" id="rh-video"><div class="rhPanelHead"><div><small>GAMEPLAY</small><h2>Video</h2></div><span>'+E(b.name)+'</span></div><div class="rhVideoCard"><div class="rhVideoIcon">'+uiIcon("video")+'</div><div><b>Gameplay e guide</b><p>Apri la ricerca aggiornata per questo Brawler.</p></div><a target="_blank" rel="noopener" href="https://www.youtube.com/results?search_query=Brawl+Stars+'+encodeURIComponent(b.name)+'+gameplay">Apri YouTube</a></div></section>'+
 '<section class="rhPanel" id="rh-more"><div class="rhPanelHead"><div><small>IL TUO ACCOUNT</small><h2>Cosa ti manca</h2></div><span>'+E(missing.length)+' elementi</span></div><div class="rhMissingList">'+(missingRows||'<div class="rhReady">✓ I componenti consigliati risultano equipaggiati o posseduti.</div>')+'<div class="rhMissingRow static">'+window.compIcon('overdrives',over||{id:'overdrive:missing',name:'Overdrive'},b)+'<div><small>Overdrive</small><b>'+E(over?.name||'Non verificato')+'</b></div><strong>'+E(over?'Disponibile':'Non verificato')+'</strong><i>›</i></div><div class="rhMissingRow static">'+window.compIcon('buffies',{id:'buffie:hyperCharge',name:'Buffies'},b)+'<div><small>Buffies</small><b>Disponibili '+buffAvailable+'/3</b></div><strong>'+buffOwned+'/3</strong><i>›</i></div><div class="rhMissingRow static">'+window.compIcon('hyperCharges',{id:'hypercharge:missing',name:'Hypercharge'},b)+'<div><small>Hypercharge</small><b>'+E(p?.hyperCharge?.name||'Non disponibile')+'</b></div><strong>—</strong><i>›</i></div></div><div class="rhSubHead"><h3>Buffies disponibili</h3><button type="button" onclick="componentModalV2ById('+b.id+',\'buffies\',\'gadget\')">Vedi tutti</button></div><div class="rhBuffList">'+(buffMeta||'<div class="rhEmpty">Nessun Buffie verificato per questo Brawler.</div>')+'</div></section>'+
 '<section class="rhPanel"><div class="rhPanelHead"><div><small>ABILITÀ</small><h2>Panoramica di gioco</h2></div></div><p class="rhDescription">'+E(heroDescription||'Descrizione non disponibile nei dati sincronizzati.')+'</p>'+attackBlock(b)+'</section>';
}
window.detailV3=detailV3;
const css=String.raw`
.v3FeatureComponent{width:100%;display:grid;grid-template-columns:64px 1fr auto;align-items:center;gap:11px;text-align:left;background:#18243a;border:1px solid #4b6285;border-radius:14px;padding:10px;color:#eef4ff;cursor:pointer}.v3FeatureComponent:hover{border-color:#ffd34e;transform:translateY(-1px)}.v3FeatureComponent .compIcon{width:58px!important;height:58px!important;object-fit:contain}.v3FeatureComponent span{min-width:0}.v3FeatureComponent span>b{display:block;font-size:15px}.v3FeatureComponent span>small{display:block;color:#ffd34e;font-size:8px;font-weight:950;letter-spacing:1px;margin-top:2px}.v3FeatureComponent p{margin:5px 0 0;color:#aebbd0;font-size:10px;line-height:1.35}.v3FeatureComponent>strong{font-size:9px;color:#9ff0c6;white-space:nowrap}.v3OverdriveCard{background:linear-gradient(145deg,#1c2840,#121b2d)}
.v3Back{color:#dce5f7!important}.v3Hero{position:relative;min-height:260px;display:flex;align-items:flex-end;overflow:hidden;border:1px solid #405274;border-radius:0 0 24px 24px;background:linear-gradient(180deg,#6fc4e5 0%,#3c78a0 37%,#121b2e 72%,#0d1524 100%);margin:0 -14px 10px;padding:16px}.v3Hero:after{content:"";position:absolute;inset:48% 0 0;background:linear-gradient(0deg,#0b1220 4%,rgba(11,18,32,.1) 100%);pointer-events:none}.v3HeroImage{position:absolute;inset:0 0 30px;display:flex;align-items:flex-end;justify-content:center}.v3HeroImage img{height:230px;width:auto;max-width:90%;object-fit:contain;filter:drop-shadow(0 14px 9px rgba(0,0,0,.3))}.v3HeroCopy{position:relative;z-index:1;width:100%;padding:0 2px}.v3Eyebrow{font-size:12px;font-weight:950;color:#a8e8ff;text-transform:uppercase;text-shadow:2px 2px #172238}.v3Hero h1{font-size:48px;line-height:.9;margin:4px 0 8px;text-transform:uppercase;color:#fff;text-shadow:3px 4px #080e1b;letter-spacing:-1px}.v3HeroCopy p{font-size:13px;line-height:1.45;color:#dbe4f4;max-width:520px;text-shadow:1px 1px #111827;margin:8px 0 0}.v3HeroBadges{display:flex;gap:7px}.v3HeroBadges span{font-size:10px;font-weight:950;color:#b9eaff;background:#17243a;border:1px solid #58708f;padding:6px 9px;border-radius:9px}.v3HeroBadges span.owned{color:#a7ffd1;border-color:#3f8067}
.v3Overview{display:grid;grid-template-columns:repeat(4,1fr);gap:5px;margin:0 0 10px}.v3Overview>div{background:#162238;border:1px solid #334765;border-radius:11px;padding:9px}.v3Overview span{display:block;color:#8c9bb2;font-size:7px;font-weight:950}.v3Overview b{display:block;font-size:15px;color:#fff;margin-top:2px}.v3Card{background:#2c3448;border:1px solid #4a5368;border-radius:0;padding:14px;margin:10px 0;box-shadow:0 5px 14px rgba(0,0,0,.2);color:#e8edf6}.v3Card a{color:#a8e8ff}.v3Title{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:11px}.v3Title>div>span{display:block;color:#9edff2;font-size:10px;font-weight:950;letter-spacing:1.5px}.v3Title h2{margin:2px 0 0;font-size:23px;color:#fff}.v3Title small{font-size:9px;color:#9ba9bd}
.v3MetaContext{background:linear-gradient(145deg,#18243a,#111a2b)}.v3Pills{display:flex;gap:5px;overflow:auto;padding-bottom:7px}.v3Pills button{white-space:nowrap;border:1px solid #445775;background:#18263e;color:#b7c5d9;border-radius:999px;padding:7px 9px;font-size:9px;font-weight:900}.v3Pills button.active{color:#111827;background:#ffd34e;border-color:#ffe38a}.v3ContextControls .search{margin-top:2px}.v3SelectedMeta{margin-top:8px;border-left:3px solid #ffd34e;background:rgba(255,211,78,.06);padding:8px;font-size:10px;color:#c8d2e1}.v3ActionStrip{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}.v3ActionStrip>div{background:#18243a;border:1px solid #3d4e6b;border-radius:10px;padding:9px}.v3ActionStrip b{display:block;color:#ffd34e;font-size:8px}.v3ActionStrip span{display:block;color:#fff;font-size:10px;font-weight:900;margin-top:2px}.v3ActionStrip small{display:block;color:#9aa8bc;font-size:8px;line-height:1.3;margin-top:3px}
.v3StatsGrid{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}.v3StatsGrid>div{background:#252d40;border:1px solid #3e4860;border-radius:9px;padding:9px}.v3StatsGrid span{display:block;color:#9caac0;font-size:8px}.v3StatsGrid b{font-size:14px}.v3AbilityGrid{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:8px}.v3AbilityGrid article{background:#252d40;border:1px solid #3e4860;border-radius:10px;padding:10px}.v3AbilityGrid b{font-size:13px}.v3AbilityGrid p{font-size:10px;line-height:1.45;color:#c0cad9}.v3AbilityTag{display:inline-block;color:#ff8ba0;font-size:9px;font-weight:950;letter-spacing:1px}.v3AbilityTag.super{color:#ffd34e}
.v3TrendHero{display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px}.v3TrendHero>div{background:#252d40;border-radius:10px;padding:10px}.v3TrendHero span{display:block;color:#9caac0;font-size:8px}.v3TrendHero b{font-size:21px}.v3ContextText{font-size:9px;color:#aab6c8;line-height:1.4;margin:9px 0}.v3SubTitle{font-size:11px;font-weight:950;color:#fff;margin:14px 0 6px}.v3Table{border:1px solid #414b62;overflow:hidden}.v3TableRow{display:grid;grid-template-columns:1.65fr .7fr .7fr .55fr;align-items:center;gap:4px;min-height:48px;padding:5px 8px;background:#30384c;border-top:1px solid #414b62;font-size:10px}.v3TableRow:first-child{border-top:0}.v3TableRow.hot{background:linear-gradient(90deg,rgba(137,85,115,.38),rgba(65,92,95,.34))}.v3TableRow span{color:#d0d8e6}.v3TableRow strong{text-align:right;color:#fff}.v3Name{display:flex;align-items:center;gap:7px;min-width:0}.v3Name b{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.v3Index{width:20px;height:20px;display:grid;place-items:center;border-radius:6px;background:#202a3d;color:#b5c4d8;font-size:8px}.v3Table.maps .v3Index{background:#344459}.v3Source{display:block;margin-top:11px;font-size:10px;font-weight:900;text-decoration:none}.v3Footnote{font-size:8px;line-height:1.45;color:#8f9eb4}
.v3ComponentList{display:grid;gap:7px}.v3Component{display:block;width:100%;text-align:left;background:#30384c;border:1px solid #424d64;border-radius:10px;color:#fff;padding:10px}.v3CompHead{display:flex;align-items:center;gap:9px}.v3CompHead .compIcon{width:44px;height:44px}.v3CompName{flex:1;min-width:0}.v3CompName b{display:block;font-size:13px}.v3CompName small{display:block;color:#a5b1c4;font-size:9px;margin-top:2px}.v3Component p{font-size:10px;line-height:1.45;color:#c1cbda;margin:8px 0}.v3CompFoot{display:flex;align-items:center;gap:7px}.v3State{font-size:8px;font-weight:950;color:#9faec2;border:1px solid #46546d;padding:4px 6px;border-radius:6px}.v3State.good{color:#9ff0c6;border-color:#3f8067}.v3State.owned{color:#9ecbff}.v3State.missing{color:#ff9daa}.v3Rec{font-style:normal;font-size:7px;color:#ffd34e;border:1px solid #806d2f;padding:4px 5px;border-radius:6px}.v3Bar{height:4px;flex:1;background:#1b2537;border-radius:999px;overflow:hidden}.v3Bar i{display:block;height:100%;background:#ffd34e}.v3GearList{border-top:1px solid #414b62}.v3GearRow{display:flex;align-items:center;gap:8px;width:100%;background:transparent;color:#fff;border:0;border-bottom:1px solid #414b62;padding:8px 2px;text-align:left}.v3GearRow .compIcon{width:36px;height:36px}.v3GearRow span{flex:1}.v3GearRow b{display:block;font-size:11px}.v3GearRow small{display:block;color:#8f9eb4;font-size:7px;margin-top:2px}.v3GearRow strong{font-size:14px}.v3GearRow.recommended{background:rgba(255,211,78,.06)}
.v3Hyper{background:linear-gradient(145deg,#3b3450,#2b3348)}.v3HyperBody{display:flex;align-items:center;gap:10px}.v3HyperBody .compIcon,.v3UnknownIcon{width:58px;height:58px;display:grid;place-items:center;font-size:28px;background:#202a3d;border-radius:14px}.v3HyperBody b{font-size:16px}.v3HyperBody p{font-size:10px;line-height:1.45;color:#c1cadd;margin:3px 0}.v3BuffieEffect{display:flex;gap:8px;margin-top:8px;background:#242c40;border:1px solid #3e4860;padding:9px;border-radius:9px;font-size:9px}.v3BuffieEffect b{color:#f2a8ff}.v3HcStats{display:grid;grid-template-columns:repeat(3,1fr);gap:5px;margin-top:8px}.v3HcStats span{background:#252d40;border-radius:8px;padding:7px;font-size:8px}.v3HcStats b{display:block;font-size:12px;color:#fff;margin-top:2px}
.v3BuffGrid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px}.v3BuffGrid button{background:#252d40;border:1px solid #414b62;border-radius:10px;color:#fff;text-align:left;padding:9px}.v3BuffIcon{display:grid;place-items:center;width:25px;height:25px;border-radius:7px;background:#334158;color:#ffd34e;font-weight:950}.v3BuffGrid b{display:block;font-size:9px;margin-top:6px}.v3BuffGrid small{display:block;color:#8f9eb4;font-size:7px;margin-top:2px}.v3BuffGrid p{font-size:8px;line-height:1.35;color:#b8c3d4}
.v3BuildHero{display:grid;grid-template-columns:repeat(4,1fr);gap:5px}.v3BuildHero button{background:#202a3d;border:1px solid #414d65;border-radius:9px;color:#fff;padding:8px 4px}.v3BuildHero .compIcon{width:38px;height:38px}.v3BuildHero span{display:block;font-size:8px;font-weight:900;line-height:1.15;margin-top:4px}.v3BuildHero small{display:block;color:#8795aa;font-size:6px;margin-top:2px}.v3Why{margin-top:8px;background:#252d40;border-left:3px solid #ffd34e;padding:8px}.v3Why b{font-size:9px}.v3Why p{font-size:8px;color:#aab6c8;line-height:1.4;margin:3px 0}
.v3Coverage{display:grid;grid-template-columns:1fr 1fr;gap:5px}.v3Coverage span{font-size:8px;color:#aab6c8;background:#252d40;padding:8px;border-radius:8px}.v3Coverage b{float:right;color:#fff}.v3Missing{padding:10px;border:1px dashed #53627c;background:#252d40;border-radius:9px;color:#aab6c8;font-size:9px;line-height:1.45}
.v3TableButton{appearance:none;width:100%;text-align:left;color:inherit;cursor:pointer}.v3TableButton:hover,.v3TableButton:focus-visible{outline:none;background:#263650!important;border-color:#ffd34e}.v3TableButton strong{font:inherit;color:#fff}.v3TableButton .v3Name{min-width:0}.v3TableButton span{min-width:0}.v3InfoModal .modalBox{max-width:560px}
@media(max-width:430px){.v3Hero{min-height:245px}.v3HeroImage img{height:220px}.v3Hero h1{font-size:42px}.v3Overview{grid-template-columns:1fr 1fr}.v3ActionStrip{grid-template-columns:1fr}.v3StatsGrid{grid-template-columns:1fr 1fr}.v3AbilityGrid{grid-template-columns:1fr}.v3TableRow{grid-template-columns:1.5fr .7fr .7fr .5fr}.v3BuffGrid{grid-template-columns:1fr}.v3BuildHero{grid-template-columns:repeat(4,1fr)}}

/* Visual refresh: component-first Brawler detail */
.v3Hero{background:linear-gradient(145deg,#101b2d 0%,#172842 58%,#1c2d48 100%)!important;border:1px solid #405879!important;box-shadow:0 18px 45px rgba(0,0,0,.28)!important}
.v3HeroImage{filter:drop-shadow(0 12px 18px rgba(0,0,0,.35));transform:scale(1.04)}
.v3HeroCopy h1{font-size:clamp(28px,7vw,42px)!important;letter-spacing:-.8px}
.v3HeroBadges span,.v3Pills span{border-color:#4a6286!important;background:#111d30!important}
.v3Card{background:linear-gradient(145deg,#152238,#101a2b)!important;border-color:#334b6d!important;box-shadow:0 8px 22px rgba(0,0,0,.16)!important}
.v3ComponentList{display:grid!important;grid-template-columns:repeat(5,minmax(0,1fr))!important;gap:7px!important}
.v3Component{min-height:138px!important;padding:9px!important;border-radius:14px!important;background:linear-gradient(160deg,#1a2b45,#101b2c)!important;border:1px solid #3b5477!important;position:relative;overflow:hidden}
.v3Component:after{content:"";position:absolute;inset:auto 0 0;height:3px;background:#334b6d}
.v3Component:has(.v3State.good):after{background:#63e6a7}
.v3Component:has(.v3State.owned):after{background:#ffd34e}
.v3Component:has(.v3State.missing):after{background:#ff6b6b}
.v3CompHead{min-height:38px!important}
.v3CompName{font-size:10px!important;font-weight:950!important;color:#fff!important}
.v3Component .compIcon{width:48px!important;height:48px!important;object-fit:contain!important;filter:drop-shadow(0 4px 6px rgba(0,0,0,.35))}
.v3CompFoot{margin-top:auto!important}
.v3State{font-size:7px!important;font-weight:950!important;letter-spacing:.5px}
.v3Rec{font-size:7px!important;color:#ffd34e!important}
.v3Card.v3Hyper{border-color:#705f2c!important;background:linear-gradient(145deg,#2a2414,#111b2d)!important}
.v3BuffGrid{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:8px!important}
.v3BuffGrid button{min-height:105px!important;padding:10px!important;border-radius:13px!important;background:linear-gradient(145deg,#182945,#101a2b)!important;border:1px solid #3c5578!important}
.v3BuffGrid button:hover{border-color:#ffd34e!important;transform:translateY(-1px)}
.v3BuffIcon{width:34px!important;height:34px!important;display:grid!important;place-items:center!important;border-radius:10px!important;background:#0d1726!important;border:1px solid #4b6385!important;color:#ffd34e!important;font-weight:950}
.v3BuffGrid b{font-size:9px!important;color:#fff!important}
.v3BuffGrid small{font-size:6px!important;letter-spacing:.5px}
.v3BuffGrid p{font-size:7px!important;color:#aebbd0!important;line-height:1.35!important}
@media(max-width:700px){.v3ComponentList{grid-template-columns:repeat(2,minmax(0,1fr))!important}.v3Component{min-height:126px!important}.v3Component:last-child{grid-column:1/-1}.v3BuffGrid{grid-template-columns:1fr!important}.v3BuffGrid button{min-height:84px!important}}
@media(min-width:701px) and (max-width:1050px){.v3ComponentList{grid-template-columns:repeat(3,minmax(0,1fr))!important}}
.v3AbilityCard{appearance:none;width:100%;text-align:left;color:#fff;background:linear-gradient(145deg,#1b2a43,#111b2c);border:1px solid #405778;border-radius:13px;padding:12px;cursor:pointer;transition:transform .16s,border-color .16s,box-shadow .16s}.v3AbilityCard:hover,.v3AbilityCard:focus-visible{transform:translateY(-2px);border-color:#ffd34e;box-shadow:0 10px 22px rgba(0,0,0,.24);outline:none}.v3AbilityCard p{min-height:44px}.v3AbilityCard.super{background:linear-gradient(145deg,#302b18,#111b2c)}.v3TapHint{display:block;margin-top:7px;color:#ffd34e;font-size:7px;font-weight:950;letter-spacing:1px}.v3AbilityBox{max-width:560px}.abilityModalHero{display:flex;align-items:center;gap:10px;border:1px solid #3e5575;border-radius:12px;padding:12px;background:#17263d}.abilityModalHero.super{background:#2a2517}.abilityModalHero span{font-size:8px;font-weight:950;color:#ffd34e;letter-spacing:1px}.abilityModalHero b{font-size:16px}.abilityModalDescription{font-size:12px;line-height:1.55;color:#d2dbe8}.abilityModalStats{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}.abilityModalStats span{background:#202c41;border:1px solid #3b4b65;border-radius:8px;padding:8px;font-size:8px;color:#9eacc0}.abilityModalStats b{display:block;color:#fff;font-size:13px;margin-top:2px}.abilityModalNote{margin-top:9px;padding:9px;border-left:3px solid #ffd34e;background:rgba(255,211,78,.06);font-size:9px;color:#aebbd0;line-height:1.4}.buffieVisual{display:grid!important;place-items:center!important;font-weight:1000!important;font-size:18px!important;color:#fff!important;background:linear-gradient(145deg,#6c4c7d,#30213d)!important;border:1px solid #c88df0!important;border-radius:12px!important;box-shadow:inset 0 0 0 2px rgba(255,255,255,.08),0 5px 10px rgba(0,0,0,.25)!important}.buffieVisual.gadget{background:linear-gradient(145deg,#496a9b,#1d2d4b)!important;border-color:#7eb3ff!important}.buffieVisual.starPower{background:linear-gradient(145deg,#8a5c42,#3d2418)!important;border-color:#ffbd78!important}.buffieVisual.hyperCharge{background:linear-gradient(145deg,#6b4aa0,#291c49)!important;border-color:#d5a4ff!important}.overdriveVisual{background:linear-gradient(145deg,#7c5a2d,#352513)!important;border-color:#e0b15b!important}`;

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
`;st.textContent=css+css2+css3+css4+css5;document.head.appendChild(st);
})();