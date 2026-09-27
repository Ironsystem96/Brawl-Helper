const fs=require('fs'),path=require('path');
const ROOT=path.join(__dirname,'..');
async function get(url){const r=await fetch(url,{headers:{'user-agent':'BrawlHelper-ComponentInspect/1.0'}});if(!r.ok)throw Error('HTTP '+r.status);return r.json()}
async function main(){
 const out={generatedAt:new Date().toISOString(),sources:{}};
 for(const p of ['csv_logic/components_logic','csv_client/components_client']){
  const url='https://api.brawlapi.com/game/'+p;
  try{const d=await get(url);out.sources[p]={topKeys:Object.keys(d||{}).slice(0,40),sample:Object.entries(d||{}).slice(0,8)}}catch(e){out.sources[p]={error:e.message}}
 }
 fs.writeFileSync(path.join(ROOT,'data','component-source-debug.json'),JSON.stringify(out,null,2)+'\n');
}
main().catch(e=>{console.error(e);process.exit(1)});