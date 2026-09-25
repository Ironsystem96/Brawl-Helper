const fs=require('fs');
const path=require('path');

const ROOT=path.join(__dirname,'..');
const sources=JSON.parse(fs.readFileSync(path.join(ROOT,'data','meta-sources.json'),'utf8'));
const meta=JSON.parse(fs.readFileSync(path.join(ROOT,'data','meta.json'),'utf8'));
const build=JSON.parse(fs.readFileSync(path.join(ROOT,'data','build-meta.json'),'utf8'));

const now=Date.now();
const ageHours=(iso)=>iso?Math.max(0,(now-Date.parse(iso))/36e5):Infinity;

const providerHealth=sources.providers.map(p=>{
  let coverage=0,updatedAt=meta.updatedAt||build.updatedAt||null;
  if(p.id==='brawlmetrics') coverage=meta.coverage?.modes||0;
  else if(p.id==='noff') coverage=build.sourceStatus?.noff||0;
  else if(p.id==='brawltime') coverage=build.sourceStatus?.brawlTimeNinja||0;
  else if(p.id==='brawlify') coverage=build.sourceStatus?.brawlApi||0;
  else if(p.id==='supercell') coverage=build.sourceStatus?.brawlApi||0;
  return {
    id:p.id,name:p.name,role:p.role,enabled:p.enabled,
    coverage,updatedAt,ageHours:Number.isFinite(ageHours(updatedAt))?Number(ageHours(updatedAt).toFixed(1)):null,
    status:!p.enabled?'disabled':(coverage>0?'ok':'missing')
  };
});

const entries=Object.values(meta.entries||{});
let metaCount=0,modeCount=0,lowConfidence=0;
for(const e of entries){
  if(typeof e?.default?.score==='number')metaCount++;
  if(Object.keys(e?.modes||{}).length)modeCount++;
  if(['low','unknown'].includes(e?.default?.confidence))lowConfidence++;
}

const warnings=[];
if(metaCount<90)warnings.push('Global meta coverage below 90 brawlers.');
if(modeCount<50)warnings.push('Mode coverage is incomplete; keep global fallback visible.');
if(ageHours(meta.updatedAt)>72)warnings.push('Meta snapshot is stale (>72h).');
if((build.sourceStatus?.noff||0)<50)warnings.push('NOFF build coverage below 50%.');
if((build.sourceStatus?.brawlTimeNinja||0)<50)warnings.push('Brawl Time Ninja coverage below 50%.');

const report={
 schemaVersion:1,
 generatedAt:new Date().toISOString(),
 agent:"Brawl Helper Meta Agent",
 policy:{
  externalMetaFirst:true,
  accountPersonalizationAfterMeta:true,
  mapFallback:"mode -> global",
  disagreement:"lower confidence; do not invent a winner"
 },
 providerHealth,
 summary:{brawlersWithGlobalMeta:metaCount,brawlersWithModeMeta:modeCount,lowConfidence},
 warnings
};

fs.writeFileSync(path.join(ROOT,'data','meta-agent-report.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
if(warnings.length>4)process.exit(1);
