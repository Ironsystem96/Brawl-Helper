const fs=require('fs');
const path=require('path');
const root=path.join(__dirname,'..');
const meta=JSON.parse(fs.readFileSync(path.join(root,'data/meta.json'),'utf8'));
const build=JSON.parse(fs.readFileSync(path.join(root,'data/build-meta.json'),'utf8'));
const warnings=[];
for(const [name,e] of Object.entries(meta.entries||{})){
  const score=e?.default?.score;
  if(typeof score!=='number'||score<0||score>100)warnings.push(name+': invalid meta score');
  const b=build.entries?.[name];
  if(!b)warnings.push(name+': missing build entry');
  if((b?.gadget?.length||0)>1)warnings.push(name+': more than one primary gadget recommendation');
}
if((build.sourceStatus?.brawlApi||0)<90)warnings.push('BrawlAPI catalog coverage below 90%');
if((build.sourceStatus?.noff||0)<50)warnings.push('NOFF coverage below 50%');
if((build.sourceStatus?.brawlTimeNinja||0)<50)warnings.push('Brawl Time Ninja coverage below 50%');
const report={checkedAt:new Date().toISOString(),status:warnings.length?'warning':'ok',warnings};
fs.writeFileSync(path.join(root,'data','meta-review.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
if(warnings.length>20)process.exit(1);