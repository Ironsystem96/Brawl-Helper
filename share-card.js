/* Brawl Helper — account share card
   Generates a shareable PNG from the live account/catalog state.
   No external rendering dependency. */
(function(){
'use strict';

const esc=v=>String(v??'').replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
const fmt=n=>Number(n||0).toLocaleString('en-US');

function accountBrawlers(){
  const raw=Array.isArray(window.P?.brawlers)?window.P.brawlers:[];
  return raw.filter(Boolean).sort((a,b)=>Number(b.trophies||0)-Number(a.trophies||0));
}
function catalogById(id){
  return window.allBrawlers?.().find(x=>String(x.id)===String(id))||null;
}
function imageUrl(type,item,b){
  return window.compIcon?.(type,item,b)||'';
}
function rawImgSrc(el){
  return el?.currentSrc||el?.src||'';
}
function loadImage(src){
  return new Promise(resolve=>{
    if(!src)return resolve(null);
    const img=new Image();
    img.crossOrigin='anonymous';
    img.onload=()=>resolve(img);
    img.onerror=()=>resolve(null);
    img.src=src;
  });
}
function ownedCount(type){
  const list=accountBrawlers();
  let n=0;
  for(const b of list){
    const arr=Array.isArray(b?.[type])?b[type]:[];
    n+=arr.length;
  }
  return n;
}
function statSummary(){
  const bs=accountBrawlers();
  const total=window.allBrawlers?.().length||107;
  const p11=bs.filter(b=>Number(b.power||0)>=11).length;
  return {
    owned:bs.length,total,p11,
    gadgets:ownedCount('gadgets'),
    stars:ownedCount('starPowers'),
    gears:ownedCount('gears')
  };
}
function drawCover(ctx,w,h){
  const g=ctx.createLinearGradient(0,0,w,h);
  g.addColorStop(0,'#4b1f8f');g.addColorStop(.42,'#241b55');g.addColorStop(1,'#101522');
  ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
  const rg=ctx.createRadialGradient(w*.82,h*.08,20,w*.82,h*.08,w*.55);
  rg.addColorStop(0,'rgba(255,210,70,.25)');rg.addColorStop(1,'rgba(255,210,70,0)');
  ctx.fillStyle=rg;ctx.fillRect(0,0,w,h);
}
function roundedRect(ctx,x,y,w,h,r){
  const q=Math.min(r,w/2,h/2);
  ctx.beginPath();ctx.moveTo(x+q,y);ctx.arcTo(x+w,y,x+w,y+h,q);ctx.arcTo(x+w,y+h,x,y+h,q);ctx.arcTo(x,y+h,x,y,q);ctx.arcTo(x,y,x+w,y,q);ctx.closePath();
}
function fitText(ctx,text,maxWidth,maxSize,minSize=14){
  let s=maxSize;ctx.font='900 '+s+'px Arial';
  while(ctx.measureText(text).width>maxWidth&&s>minSize){s--;ctx.font='900 '+s+'px Arial'}
  return s;
}
async function generateAccountCard(){
  if(!window.P)return null;
  const bs=accountBrawlers(), all=window.allBrawlers?.()||[];
  const summary=statSummary();
  const W=1080,H=1920;
  const canvas=document.createElement('canvas');canvas.width=W;canvas.height=H;
  const ctx=canvas.getContext('2d');
  drawCover(ctx,W,H);

  roundedRect(ctx,32,30,W-64,170,26);ctx.fillStyle='rgba(13,20,36,.82)';ctx.fill();
  ctx.fillStyle='#fff';ctx.font='900 54px Arial';ctx.fillText(String(window.P.name||'Brawl Stars Player'),58,91);
  ctx.fillStyle='#ffd34e';ctx.font='700 22px Arial';ctx.fillText(String(window.P.tag||window.active||''),60,126);
  ctx.fillStyle='#aebbd0';ctx.font='700 18px Arial';
  ctx.fillText('BRAWL HELPER · ACCOUNT SNAPSHOT',60,161);

  const stats=[
    ['TROPHIES',fmt(window.P.trophies)],
    ['BRAWLERS',summary.owned+'/'+summary.total],
    ['POWER 11',String(summary.p11)],
    ['GADGETS',String(summary.gadgets)],
    ['STAR POWERS',String(summary.stars)],
    ['GEARS',String(summary.gears)]
  ];
  const sw=(W-64-25*2)/3, sh=82;
  stats.forEach((s,i)=>{
    const col=i%3,row=Math.floor(i/3),x=32+col*(sw+12),y=220+row*(sh+10);
    roundedRect(ctx,x,y,sw,sh,14);ctx.fillStyle='rgba(17,28,48,.88)';ctx.fill();
    ctx.strokeStyle='rgba(78,103,140,.65)';ctx.lineWidth=2;ctx.stroke();
    ctx.fillStyle='#8194b0';ctx.font='900 13px Arial';ctx.fillText(s[0],x+14,y+24);
    ctx.fillStyle='#fff';ctx.font='900 25px Arial';ctx.fillText(s[1],x+14,y+57);
  });

  ctx.fillStyle='#fff';ctx.font='900 28px Arial';ctx.fillText('BRAWLER ROSTER',32,418);
  ctx.fillStyle='#8295b2';ctx.font='700 15px Arial';ctx.fillText('POWER · TROPHIES · CURRENT COMPONENTS',32,444);

  const cols=5,gap=8,cardW=(W-64-gap*(cols-1))/cols,cardH=62;
  const startY=464;
  const rows=Math.ceil(all.length/cols);
  const portraitCache=new Map();

  async function getPortrait(b){
    const key=String(b.id);
    if(portraitCache.has(key))return portraitCache.get(key);
    const src=window.portrait?.(b)||b.imageUrl||'';
    const im=await loadImage(src);portraitCache.set(key,im);return im;
  }

  const cards=all.map(b=>({b,acc:bs.find(x=>String(x.id)===String(b.id))||null}));
  for(let i=0;i<cards.length;i++){
    const {b,acc}=cards[i],col=i%cols,row=Math.floor(i/cols);
    const x=32+col*(cardW+gap),y=startY+row*(cardH+gap);
    roundedRect(ctx,x,y,cardW,cardH,11);
    ctx.fillStyle=acc?'rgba(38,61,78,.92)':'rgba(19,27,42,.72)';ctx.fill();
    ctx.strokeStyle=acc?'rgba(84,119,145,.8)':'rgba(55,69,92,.7)';ctx.lineWidth=1;ctx.stroke();

    const im=await getPortrait(b);
    if(im){
      ctx.save();roundedRect(ctx,x+4,y+4,54,54,9);ctx.clip();ctx.drawImage(im,x+4,y+4,54,54);ctx.restore();
    }
    const power=acc?String(acc.power??'—'):'—';
    const trophies=acc?fmt(acc.trophies||0):'—';
    ctx.fillStyle=acc?'#fff':'#71819b';ctx.font='900 13px Arial';
    const name=String(b.name||'');
    const fs=fitText(ctx,name,cardW-68,15,8);ctx.font='900 '+fs+'px Arial';ctx.fillText(name,x+63,y+20);
    ctx.fillStyle=acc?'#ffd34e':'#66758d';ctx.font='900 11px Arial';ctx.fillText('P'+power,x+63,y+39);
    ctx.fillStyle=acc?'#b9c8dc':'#53627a';ctx.font='700 9px Arial';ctx.fillText(trophies+' T',x+63,y+53);

    const c=window.catalogEntry?.(b)||b;
    const items=[
      ...(Array.isArray(c.gadgets)?c.gadgets.slice(0,2).map(v=>['gadgets',v]):[]),
      ...(Array.isArray(c.starPowers)?c.starPowers.slice(0,2).map(v=>['starPowers',v]):[])
    ];
    let ix=x+cardW-38;
    for(const [type,item] of items.slice(0,2)){
      const src=imageUrl(type,item,b);
      const icon=await loadImage(src);
      if(icon){ctx.drawImage(icon,ix,y+8,22,22);ix-=24}
    }
  }

  const footerY=Math.min(H-48,startY+rows*(cardH+gap)+18);
  ctx.fillStyle='#7184a1';ctx.font='700 12px Arial';ctx.fillText('Generated by Brawl Helper · Unofficial fan app',32,footerY);
  return canvas;
}
async function shareAccountCard(){
  const canvas=await generateAccountCard();
  if(!canvas)return;
  canvas.toBlob(async blob=>{
    if(!blob)return;
    const file=new File([blob],'brawl-helper-profile.png',{type:'image/png'});
    try{
      if(navigator.share && (!navigator.canShare || navigator.canShare({files:[file]}))){
        await navigator.share({title:'Brawl Helper profile',text:'My Brawl Stars profile',files:[file]});
        return;
      }
    }catch(e){if(e?.name==='AbortError')return}
    const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='brawl-helper-profile.png';a.click();
    setTimeout(()=>URL.revokeObjectURL(a.href),1500);
  },'image/png');
}
window.generateAccountCard=generateAccountCard;
window.shareAccountCard=shareAccountCard;
})();