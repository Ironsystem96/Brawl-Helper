/* Brawl Helper — unified component modal bridge.
   Keeps every component card clickable across Home, Brawler detail and Meta. */
(function(){
'use strict';
const E=window.esc||((v)=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])));
function findBrawler(id){
 const n=Number(id);
 return (window.P?.brawlers||[]).find(b=>Number(b?.id)===n)
   || (window.allBrawlers?.()||[]).find(b=>Number(b?.id)===n)
   || null;
}
function resolve(type,id,b){
 const t=String(type||'');
 if(t==='buffies'||t==='buffie'){
   const key=String(id||'').split(':').pop();
   const rows=window.buffieRows?.(b)||[];
   const row=rows.find(x=>x[1]===key);
   return row?.[2]?.[0]||window.buffieOptions?.(b,key)?.[0]||null;
 }
 const c=window.catalogEntry?.(b)||{};
 const key={gadget:'gadgets',gadgets:'gadgets',star:'starPowers',starPower:'starPowers',starPowers:'starPowers',gear:'gears',gears:'gears',hc:'hyperCharges',hyperCharge:'hyperCharges',hyperCharges:'hyperCharges',overdrive:'overdrives',overdrives:'overdrives'}[t]||t;
 const arr=Array.isArray(c[key])?c[key]:Object.values(c[key]||{});
 const sid=String(id??'');
 return arr.find(x=>String(x?.id)===sid)||arr.find(x=>window.norm?.(x?.name)===window.norm?.(sid))||null;
}
function open(id,type,itemId){
 const b=findBrawler(id); if(!b)return;
 const item=resolve(type,itemId,b);
 const title={gadgets:'Gadget',gadget:'Gadget',starPowers:'Star Power',starPower:'Star Power',gears:'Gear',gear:'Gear',hyperCharges:'Hypercharge',hyperCharge:'Hypercharge',overdrives:'Overdrive',overdrive:'Overdrive',buffies:'Buffie',buffie:'Buffie'}[type]||'Component';
 const desc=window.componentDescription?.(item)||item?.description||'Detailed data is not available for this component.';
 const icon=window.compIcon?.(type,item,b)||'<span class="compIcon fallbackIcon">?</span>';
 let state='NOT VERIFIED';
 if(type==='buffies'||type==='buffie'){
   const key=String(itemId||'').split(':')[1]||'';
   const s=window.buffieState?.(b,key);
   state=s===true?'UNLOCKED':s===false?'NOT UNLOCKED':'OWNERSHIP NOT VERIFIED';
 } else if(item && window.itemStatus) state=window.itemStatus(b,type,item);
 const source=item?.source||'Synchronized Brawl Helper catalog';
 const sourceUrl=item?.sourceUrl||'';
 const signal=window.componentSignal?.(b,type,item);
 const signalText=signal?.label?(signal.label+(signal.pick!=null?' · '+signal.pick+'% pick':'')):'Current build signal unavailable';
 const modal=document.createElement('div');
 modal.className='modal componentModal bhUnifiedModal';
 modal.innerHTML='<div class="modalBox bhUnifiedComponentBox">'+
   '<div class="modalHead"><div><span class="small">'+E(title.toUpperCase())+'</span><h2>'+E(item?.name||'Data pending')+'</h2></div><button type="button" class="bhModalX">×</button></div>'+
   '<div class="bhUnifiedHero">'+icon+'<div><span class="bhModalStatus">'+E(state)+'</span><b>'+E(signalText)+'</b><small>'+E(b.name)+'</small></div></div>'+
   '<p class="bhUnifiedDescription">'+E(desc)+'</p>'+
   '<div class="bhUnifiedFacts"><div><span>TYPE</span><b>'+E(title)+'</b></div><div><span>STATUS</span><b>'+E(state)+'</b></div><div><span>SOURCE</span><b>'+E(source)+'</b></div></div>'+
   (sourceUrl?'<a class="v3Source" target="_blank" rel="noopener" href="'+E(sourceUrl)+'">Open source →</a>':'')+
   '<button type="button" class="close bhModalClose">Close</button></div>';
 modal.addEventListener('click',e=>{if(e.target===modal)modal.remove()});
 modal.querySelector('.bhModalX').onclick=()=>modal.remove();
 modal.querySelector('.bhModalClose').onclick=()=>modal.remove();
 document.body.appendChild(modal);
}
window.componentModalV2ById=open;
window.BHComponentModal={open};
})();