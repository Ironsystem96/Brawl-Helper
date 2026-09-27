const fs=require('fs');
const path=require('path');
const ROOT=path.join(__dirname,'..');
const CATALOG_PATH=path.join(ROOT,'data','brawlers.json');
const MANIFEST_PATH=path.join(ROOT,'data','asset-manifest.json');
const ASSET_ROOT=path.join(ROOT,'assets','brawl');
const safe=s=>String(s||'unknown').replace(/[^a-zA-Z0-9_-]+/g,'_');
async function download(url,target){
  if(!url)return {ok:false,reason:'missing-url'};
  const r=await fetch(url,{headers:{'user-agent':'BrawlHelper-AssetSync/1.0'}});
  if(!r.ok)throw new Error(url+' HTTP '+r.status);
  const buf=Buffer.from(await r.arrayBuffer());
  fs.mkdirSync(path.dirname(target),{recursive:true});
  fs.writeFileSync(target,buf);
  return {ok:true,bytes:buf.length};
}
async function main(){
  const catalog=JSON.parse(fs.readFileSync(CATALOG_PATH,'utf8')),list=Array.isArray(catalog.brawlers)?catalog.brawlers:[];
  if(list.length<90)throw new Error('Catalog unexpectedly small: '+list.length);
  const manifest={schemaVersion:1,generatedAt:new Date().toISOString(),source:'BrawlAPI catalog image URLs',localRoot:'assets/brawl/',entries:{}};
  let ok=0,failed=0;
  for(const b of list){
    const entry={name:b.name,id:b.id,portrait:null,gadgets:{},starPowers:{},gears:{},hyperCharges:{},buffies:{},overdrives:{}};
    const jobs=[];
    if(b.imageUrl2||b.imageUrl)jobs.push(['portrait',null,b.imageUrl2||b.imageUrl]);
    for(const type of ['gadgets','starPowers','gears','hyperCharges','buffies','overdrives'])for(const item of (b[type]||[]))if(item?.id&&item?.imageUrl)jobs.push([type,item.id,item.imageUrl]);
    const results=await Promise.all(jobs.map(async ([type,id,url])=>{
      const file=(id==null?'portrait':String(id))+'.png',target=path.join(ASSET_ROOT,safe(b.name),type,file),rel='assets/brawl/'+safe(b.name)+'/'+type+'/'+file;
      try{
        if(fs.existsSync(target)&&fs.statSync(target).size>100)return {ok:true,type,id,rel,cached:true};
        await download(url,target);
        return {ok:true,type,id,rel,cached:false};
      }catch(e){return {ok:false,type,id,rel,error:e.message}}
    }));
    for(const r of results){if(r.ok){if(r.type==='portrait')entry.portrait=r.rel;else entry[r.type][String(r.id)]=r.rel;ok++;}else{failed++;console.warn('Asset failed:',b.name,r.type,r.id,r.error)}}
    manifest.entries[String(b.id)]=entry;
  }
  fs.writeFileSync(MANIFEST_PATH,JSON.stringify(manifest,null,2)+'\n');
  console.log(JSON.stringify({generatedAt:manifest.generatedAt,brawlers:list.length,downloaded:ok,failed},null,2));
}
main().catch(e=>{console.error(e);process.exit(1)});
