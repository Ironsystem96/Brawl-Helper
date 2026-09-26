function brawlers(){
 let bs=[...(P.brawlers||[])].filter(Boolean);
 if(query)bs=bs.filter(b=>b.name.toLowerCase().includes(query.toLowerCase()));
 if(filter==='p11')bs=bs.filter(b=>b.power>=11);
 if(filter==='upgrade')bs=bs.filter(b=>b.power<11);
 if(filter==='missing')bs=bs.filter(b=>{const o=owned(b);return o.gadgets<2||o.stars<2||o.gears<2||o.hc<1});
 bs.sort((a,b)=>b.trophies-a.trophies);
 return '<section class="section"><div class="sectionTitle"><h2>My Brawlers · '+P.brawlers.length+'</h2><span class="small">'+bs.length+' shown</span></div><input class="search" placeholder="Cerca Brawler..." value="'+esc(query)+'" oninput="query=this.value;render()"><div class="filters"><button class="'+(filter==='all'?'active':'')+'" onclick="filter=\'all\';render()">All</button><button class="'+(filter==='p11'?'active':'')+'" onclick="filter=\'p11\';render()">Power 11</button><button class="'+(filter==='upgrade'?'active':'')+'" onclick="filter=\'upgrade\';render()">Needs improvement</button><button class="'+(filter==='missing'?'active':'')+'" onclick="filter=\'missing\';render()">Incomplete build</button></div>'+bs.map(bcard).join('')+'</section>'
}
function brawlers(){
 let bs=[...(P.brawlers||[])].filter(Boolean);
 if(query)bs=bs.filter(b=>b.name.toLowerCase().includes(query.toLowerCase()));
 if(filter==='p11')bs=bs.filter(b=>b.power>=11);
 if(filter==='upgrade')bs=bs.filter(b=>upgradePriority(b).actions.length>0);
 if(filter==='missing')bs=bs.filter(b=>missingBuildActions(b).some(a=>a.type==='BUY'||a.type==='POWER'));
 bs.sort((a,b)=>b.trophies-a.trophies);
 return '<section class="section"><div class="sectionTitle"><h2>Brawler Browser</h2><span class="small">'+bs.length+' shown · '+P.brawlers.length+' owned</span></div>'+
 '<div class="notice browserIntro"><b>Tap any Brawler to open its full build.</b><br>Icons show the recommended build; BUY means you do not own it, OWNED means it is already unlocked.</div>'+
 '<input class="search" placeholder="Search Brawler..." value="'+esc(query)+'" oninput="query=this.value;render()">'+
 '<div class="filters"><button class="'+(filter==='all'?'active':'')+'" onclick="filter=\'all\';render()">All</button><button class="'+(filter==='p11'?'active':'')+'" onclick="filter=\'p11\';render()">Power 11</button><button class="'+(filter==='upgrade'?'active':'')+'" onclick="filter=\'upgrade\';render()">Upgrade next</button><button class="'+(filter==='missing'?'active':'')+'" onclick="filter=\'missing\';render()">Missing items</button></div>'+
 bs.map(bcard).join('')+'</section>';
}
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
function fanNotice(){if(localStorage.getItem('bh_fan_notice_seen'))return;document.body.insertAdjacentHTML('beforeend','<div class="modal fanNoticeModal"><div class="modalBox fanNoticeBox"><div class="modalBrand">BRAWL HELPER</div><h2>Unofficial fan app</h2><p class="modalLead">Brawl Helper is an independent companion app and is not sponsored, endorsed or administered by Supercell.</p><div class="notice"><b>What this means</b><br>Game data and community build statistics are used to provide guidance. They are not official Supercell recommendations.</div><p class="small">Brawl Stars and related content belong to their respective owners.</p><button class="primary" onclick="localStorage.setItem('bh_fan_notice_seen','1');closeModal()">Continue</button><a class="legalLink" href="privacy.html">Privacy & legal information</a></div></div>')}
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
