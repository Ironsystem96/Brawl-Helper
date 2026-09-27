const fs=require('fs'),path=require('path');
const ROOT=path.join(__dirname,'..');
const CATALOG=path.join(ROOT,'data','brawlers.json');
const OUT=path.join(ROOT,'data','overdrives.json');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const clean=s=>String(s||'').replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/&#39;|&apos;/g,"'").replace(/&quot;/g,'"').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
const norm=s=>String(s||'').toUpperCase().replace(/[’']/g,"'").replace(/[^A-Z0-9]+/g,' ').trim();
async function get(url){const c=new AbortController(),t=setTimeout(()=>c.abort(),10000);try{const r=await fetch(url,{headers:{'user-agent':'BrawlHelper-OverdriveSync/1.0'},signal:c.signal});if(!r.ok)throw Error('HTTP '+r.status);return await r.text()}finally{clearTimeout(t)}}
function headingsAndText(html){
 const out=[];const re=/<(h1|h2|h3|h4)[^>]*>([\s\S]*?)<\/\1>/gi;let m;
 while((m=re.exec(html)))out.push({heading:clean(m[2]),at:m.index});
 return out;
}
function extract(html,list){
 const text=clean(html),heads=headingsAndText(html),found=[];
 for(let i=0;i<heads.length;i++){
  const h=heads[i],b=list.find(x=>norm(x.name)===norm(h.heading));if(!b)continue;
  const end=heads[i+1]?.at??html.length,section=clean(html.slice(h.at,end));
  const re=/Overdrive\s*:\s*([^\n]{2,100}?)(?=\s+\*|\s+\-|\s+Overdrive\s*:|$)/gi;let m;
  while((m=re.exec(section))){let name=clean(m[1]).replace(/^(?:Image\s*:\s*)/i,'');if(name&&!/^overdrive$/i.test(name)&&!found.some(x=>x.brawlerId===b.id)){const effect=section.slice(m.index+m[0].length,m.index+m[0].length+900).split(/\b(?:Gadget|Star Power|Hypercharge|Buffie|Overdrive)\b/i)[0].trim();found.push({brawlerId:b.id,brawler:b.name,name,description:effect,sourceUrl:'https://supercell.com/en/games/brawlstars/blog/release-notes/'});}}
 }
 return found;
}
async function main(){
 const list=(JSON.parse(fs.readFileSync(CATALOG,'utf8')).brawlers||[]);if(list.length<90)throw Error('Catalog too small');
 const index='https://supercell.com/en/games/brawlstars/blog/release-notes/';
 let html='';try{html=await get(index)}catch(e){console.warn('release index unavailable',e.message)}
 const urls=[...new Set([index,...[...html.matchAll(/href=["']([^"']*release-notes[^"']*)["']/gi)].map(m=>m[1]).filter(Boolean).map(u=>u.startsWith('http')?u:'https://supercell.com'+u)])].slice(0,80);
 const entries={};let pages=0;
 for(const url of urls){try{const page=url===index?html:await get(url);for(const x of extract(page,list))entries[String(x.brawlerId)]=x;pages++;}catch(e){}await sleep(60)}
 const out={schemaVersion:1,generatedAt:new Date().toISOString(),source:'Supercell Brawl Stars official release notes',sourceIndex:index,pagesScanned:pages,entries};
 fs.writeFileSync(OUT,JSON.stringify(out,null,2)+'\n');console.log(JSON.stringify({pagesScanned:pages,overdrives:Object.keys(entries).length},null,2));
}
main().catch(e=>{console.error(e);process.exit(1)})