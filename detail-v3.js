/* Brawl Helper detail V3: data-dense Brawler profile inspired by community stat pages.
   Uses only synchronized catalog/meta data; missing fields are explicitly marked. */
(function(){
'use strict';
const E=window.esc||((v)=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])));
const F=window.fmt||((n)=>Number(n||0).toLocaleString('en-US'));
const PCT=v=>{const n=Number(v);return Number.isFinite(n)?n.toFixed(n%1?1:0)+'%':'—'};
const N=v=>Number.isFinite(Number(v))?Number(v):null;

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
 return '<section class="v3Card v3Hyper"><div>'+sectionTitle('HYPERCHARGE',h?.name||'Hypercharge','verified data when available')+'</div><div class="v3HyperBody">'+(h?icon('hyperCharges',h,b):'<span class="v3UnknownIcon">?</span>')+'<div><b>'+E(h?.name||'Hypercharge effect pending')+'</b><p>'+E(h?.description||'The current synchronized source exposes the Hypercharge Buffie but not the complete Hypercharge definition.')+'</p></div></div>'+
 (buffs.length?'<div class="v3BuffieEffect"><b>BUFFIE</b><span>'+E(buffs[0].description||'')+'</span></div>':'')+
 '<div class="v3HcStats"><span>Hypercharge <b>ACTIVE</b></span><span>Buffie <b>'+(buffs.length?'AVAILABLE':'N/A')+'</b></span><span>Effect <b>SEE ABOVE</b></span></div></section>';
}
function abilityModalV3(b,type){const p=profile(b)||{},x=type==='attack'?p.attack:p.super;if(!x)return;const label=type==='attack'?'ATTACK':'SUPER';const stats=type==='attack'?(p.baseStats||{}):{};document.body.insertAdjacentHTML('beforeend','<div class="modal v3AbilityModal" onclick="if(event.target===this)this.remove()"><div class="modalBox v3AbilityBox"><div class="modalHead"><div><span class="small">GAMEPLAY ABILITY</span><h2>'+E(x.name||label)+'</h2></div><button onclick="this.closest(\'.modal\').remove()">×</button></div><div class="abilityModalHero '+type+'"><span>'+label+'</span><b>'+E(x.name||label)+'</b></div><p class="abilityModalDescription">'+E(x.description||'Description not available in synchronized game data.')+'</p>'+(type==='attack'?'<div class="abilityModalStats"><span>Damage <b>'+E(stats.attackDamage==null?'—':String(stats.attackDamage))+'</b></span><span>Range <b>'+E(stats.attackRange==null?'—':String(stats.attackRange))+'</b></span><span>Reload <b>'+E(stats.reloadMs==null?'—':String(Math.round(stats.reloadMs/100)))+'</b></span></div>':'')+'<div class="abilityModalNote">This ability is part of the Brawler kit. Component recommendations are shown separately below.</div><button class="close" onclick="this.closest(\'.modal\').remove()">Close</button></div></div>')}
window.abilityModalV3=abilityModalV3;
function attackBlock(b){
 const p=profile(b),st=p?.baseStats||{},a=p?.attack,s=p?.super;
 const stats=[['Health',st.health],['Movement Speed',st.speed],['Attack Damage',st.attackDamage],['Attack Range',st.attackRange],['Reload',st.reloadMs?Math.round(st.reloadMs/100):null],['Super Charge',st.superChargeMultiplier]];
 return '<section class="v3Card"><div>'+sectionTitle('GAME DATA','Stats & abilities',p?.coverage?.fields?.attack?'BrawlAPI':'partial')+'</div>'+
 '<div class="v3StatsGrid">'+stats.map(x=>'<div><span>'+E(x[0])+'</span><b>'+E(x[1]==null?'—':String(x[1]))+'</b></div>').join('')+'</div>'+
 '<div class="v3AbilityGrid"><button class="v3AbilityCard attack" type="button" onclick="abilityModalV3('+b.id+',\'attack\')"><div class="v3AbilityTag">ATTACK</div><b>'+E(a?.name||'Attack')+'</b><p>'+E(a?.description||'Description not available in synchronized game data.')+'</p><span class="v3TapHint">TAP FOR DETAILS</span></button><button class="v3AbilityCard super" type="button" onclick="abilityModalV3('+b.id+',\'super\')"><div class="v3AbilityTag super">SUPER</div><b>'+E(s?.name||'Super')+'</b><p>'+E(s?.description||'Description not available in synchronized game data.')+'</p><span class="v3TapHint">TAP FOR DETAILS</span></button></div></section>}
function trendsBlock(b){
 const n=noff(b),m=n?.stats||{};
 const rows=modeRows(b),maps=mapRows(b);
 return '<section class="v3Card">'+sectionTitle('BATTLE TRENDS','Current statistics',(n?.sample?F(n.sample)+' builds':'NOFF snapshot'))+
 '<div class="v3TrendHero"><div><span>WIN RATE</span><b>'+PCT(m.winRate)+'</b></div><div><span>PICK RATE</span><b>'+PCT(m.pickRate)+'</b></div><div><span>DATA SAMPLE</span><b>'+F(n?.sample||build(b)?.sample||0)+'</b></div></div>'+
 '<div class="v3ContextText">Mode and map values below are synchronized from the current NOFF community snapshot. They are contextual statistics, not official Supercell recommendations.</div>'+
 '<div class="v3SubTitle">BEST GAME MODES</div><div class="v3Table">'+rows.map((x,i)=>'<div class="v3TableRow '+(i<3?'hot':'')+'"><div class="v3Name"><span class="v3Index">'+(i+1)+'</span><b>'+E(x.name)+'</b></div><span>'+PCT(x.winRate)+'</span><span>'+PCT(x.pickRate)+'</span><strong>'+stat(x.score)+'</strong></div>').join('')+'</div>'+
 '<div class="v3SubTitle">BEST MAPS</div><div class="v3Table maps">'+maps.slice(0,15).map((x,i)=>'<div class="v3TableRow '+(i<4?'hot':'')+'"><div class="v3Name"><span class="v3Index">'+(i+1)+'</span><b>'+E(x.name)+'</b></div><span>'+PCT(x.winRate)+'</span><span>'+PCT(x.pickRate)+'</span><strong>'+stat(x.score)+'</strong></div>').join('')+'</div>'+
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
function buildsBlock(b){
 const e=build(b),url=sourceUrl(b),items=window.guideComponents?.(b)||[];
 return '<section class="v3Card">'+sectionTitle('COMMUNITY BUILDS','Recommended loadout',e?.sample?F(e.sample)+' builds analyzed':'snapshot')+
 '<div class="v3BuildHero">'+items.slice(0,4).map(([label,type,item])=>'<button type="button" onclick="componentModalV2ById('+b.id+','+JSON.stringify(type)+','+JSON.stringify(String(item?.id||0))+')">'+icon(type,item,b)+'<span>'+E(item?.name||'Data pending')+'</span><small>'+E(label)+'</small></button>').join('')+'</div>'+
 '<div class="v3Why"><b>What the current signal says</b><p>'+(e?'The recommended components are taken from the synchronized community build snapshot. Ownership/equipped status is shown separately in the account layer.':'No validated community build is available yet.')+'</p></div>'+
 (url?'<a class="v3Source" target="_blank" rel="noopener" href="'+E(url)+'">Open full community builds on NOFF →</a>':'')+'</section>';
}
function buffieBlock(b){
 const rows=window.buffieRows?.(b)||[];
 return '<section class="v3Card">'+sectionTitle('BUFFIES','Functional upgrades','3 categories')+'<div class="v3BuffGrid">'+rows.map(([label,key,items,own])=>'<button type="button" onclick="componentModalV2ById('+b.id+',\'buffies\',\''+key+'\')"><span class="v3BuffIcon">'+(own===true?'✓':items.length?'•':'×')+'</span><div><b>'+E(label)+'</b><small>'+E(own===true?'UNLOCKED':items.length?'AVAILABLE':'DATA N/A')+'</small><p>'+E(items[0]?.description||'Tap to inspect the available Buffie effects.')+'</p></div></button>').join('')+'</div></section>';
}

function detailV3(b){
 const p=profile(b)||{},id=p.identity||{},n=noff(b),s=n?.stats||{},owned=window.isOwnedAccount?.(b),actions=window.nextActions?.(b)||[];
 const role=id.class?.name||window.catalogEntry?.(b)?.class?.name||'Brawler',rarity=id.rarity?.name||window.catalogEntry?.(b)?.rarity?.name||'';
 return '<button class="back v3Back" onclick="selected=null;render()">← Back to Brawlers</button>'+
 '<section class="v3Hero"><div class="v3HeroImage"><img src="'+E(window.portrait(b))+'" alt="" onerror="imgFallback(this,'+JSON.stringify(b.name)+')"></div><div class="v3HeroCopy"><span class="v3Eyebrow">'+E(role)+'</span><h1>'+E(b.name)+'</h1><div class="v3HeroBadges"><span>'+E(rarity||'—')+'</span><span class="'+(owned?'owned':'')+'">'+(owned?'POWER '+E(b.power):'NOT OWNED')+'</span></div><p>'+E(id.description||window.catalogEntry?.(b)?.description||'')+'</p></div></section>'+
 '<section class="v3Overview"><div><span>WIN RATE</span><b>'+PCT(s.winRate)+'</b></div><div><span>PICK RATE</span><b>'+PCT(s.pickRate)+'</b></div><div><span>META SAMPLE</span><b>'+F(n?.sample||build(b)?.sample||0)+'</b></div><div><span>ACCOUNT</span><b>'+(owned?'OWNED':'CATALOG')+'</b></div></section>'+
 '<section class="v3Card v3MetaContext">'+sectionTitle('LIVE CONTEXT','Mode & map',window.playMode+(window.playMap!=='Random'?' · '+window.playMap:''))+'<div class="v3ContextControls"><div class="v3Pills">'+['General',...(Object.keys(window.MODES||{}).slice(0,7))].map(x=>'<button class="'+((window.playMode===x||(x==='General'&&window.playMode==='General'))?'active':'')+'" onclick="playMode=\''+x+'\';playMap=\'Random\';render()">'+E(x)+'</button>').join('')+'</div><select class="search" onchange="playMap=this.value;render()"><option value="Random">Random / overall</option>'+((window.MODES?.[window.playMode]||[]).map(x=>'<option '+(window.playMap===x?'selected':'')+'>'+E(x)+'</option>').join(''))+'</select></div><div class="v3SelectedMeta">'+(window.metaEntry?.(b,window.playMode,window.playMap)?'Context score '+Math.round(window.metaEntry(b,window.playMode,window.playMap).score||0)+' · Win '+PCT(window.metaEntry(b,window.playMode,window.playMap).winRate)+' · Pick '+PCT(window.metaEntry(b,window.playMode,window.playMap).pickRate):'No validated context for this selection')+'</div></section>'+
 '<section class="v3Card">'+sectionTitle('GUIDE','What to play',actions.length?'account-specific guidance':'current build signal')+'<div class="v3ActionStrip">'+(actions.length?actions.slice(0,3).map(a=>'<div><b>'+E(a.type==='POWER'?'IMPROVE':a.type==='BUY'?'BUY':a.type==='EQUIP'?'EQUIP':a.type==='VERIFY'?'VERIFY':'REVIEW')+'</b><span>'+E(a.label)+'</span><small>'+E(a.reason)+'</small></div>').join(''):'<div><b>BUILD</b><span>Review the recommended loadout</span><small>Ownership remains separate from community recommendations.</small></div>')+'</div></section>'+
 attackBlock(b)+
 trendsBlock(b)+
 loadoutBlock(b)+
 hyperchargeBlock(b)+
 buffieBlock(b)+
 buildsBlock(b)+
 '<section class="v3Card">'+sectionTitle('DATA','Coverage & sources','transparent data layer')+'<div class="v3Coverage"><span>Identity <b>READY</b></span><span>Stats <b>'+(p.baseStats?'READY':'N/A')+'</b></span><span>Meta <b>'+(n?'READY':'N/A')+'</b></span><span>Hypercharge <b>'+(p.hyperCharge?'READY':'PENDING')+'</b></span><span>Overdrive <b>'+(p.abilities?.overdrives?.length?'READY':'PENDING')+'</b></span><span>Buffies <b>'+(p.abilities?.buffies?'READY':'PENDING')+'</b></span></div><p class="v3Footnote">Missing fields are explicitly marked. Brawl Helper does not fabricate game data when a synchronized source has not supplied it.</p>'+(sourceUrl(b)?'<a class="v3Source" target="_blank" rel="noopener" href="'+E(sourceUrl(b))+'">Source: NOFF →</a>':'')+'</section>';
}
window.detailV3=detailV3;
const css=String.raw`
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
.v3AbilityCard{appearance:none;width:100%;text-align:left;color:#fff;background:linear-gradient(145deg,#1b2a43,#111b2c);border:1px solid #405778;border-radius:13px;padding:12px;cursor:pointer;transition:transform .16s,border-color .16s,box-shadow .16s}.v3AbilityCard:hover,.v3AbilityCard:focus-visible{transform:translateY(-2px);border-color:#ffd34e;box-shadow:0 10px 22px rgba(0,0,0,.24);outline:none}.v3AbilityCard p{min-height:44px}.v3AbilityCard.super{background:linear-gradient(145deg,#302b18,#111b2c)}.v3TapHint{display:block;margin-top:7px;color:#ffd34e;font-size:7px;font-weight:950;letter-spacing:1px}.v3AbilityBox{max-width:560px}.abilityModalHero{display:flex;align-items:center;gap:10px;border:1px solid #3e5575;border-radius:12px;padding:12px;background:#17263d}.abilityModalHero.super{background:#2a2517}.abilityModalHero span{font-size:8px;font-weight:950;color:#ffd34e;letter-spacing:1px}.abilityModalHero b{font-size:16px}.abilityModalDescription{font-size:12px;line-height:1.55;color:#d2dbe8}.abilityModalStats{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}.abilityModalStats span{background:#202c41;border:1px solid #3b4b65;border-radius:8px;padding:8px;font-size:8px;color:#9eacc0}.abilityModalStats b{display:block;color:#fff;font-size:13px;margin-top:2px}.abilityModalNote{margin-top:9px;padding:9px;border-left:3px solid #ffd34e;background:rgba(255,211,78,.06);font-size:9px;color:#aebbd0;line-height:1.4}.buffieVisual{display:grid!important;place-items:center!important;font-weight:1000!important;font-size:18px!important;color:#fff!important;background:linear-gradient(145deg,#6c4c7d,#30213d)!important;border:1px solid #c88df0!important;border-radius:12px!important;box-shadow:inset 0 0 0 2px rgba(255,255,255,.08),0 5px 10px rgba(0,0,0,.25)!important}.buffieVisual.gadget{background:linear-gradient(145deg,#496a9b,#1d2d4b)!important;border-color:#7eb3ff!important}.buffieVisual.starPower{background:linear-gradient(145deg,#8a5c42,#3d2418)!important;border-color:#ffbd78!important}.buffieVisual.hyperCharge{background:linear-gradient(145deg,#6b4aa0,#291c49)!important;border-color:#d5a4ff!important}`;
const st=document.createElement('style');st.id='bh-detail-v3';st.textContent=css;document.head.appendChild(st);
})();