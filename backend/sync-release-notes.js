const fs=require('fs');
const path=require('path');

const root=path.join(__dirname,'..');
const dbPath=path.join(root,'data','game-db.json');
const changelogPath=path.join(root,'data','changelog.json');
const ARCHIVE='https://supercell.com/en/games/brawlstars/blog/';

async function main(){
  const now=new Date().toISOString();
  const archive=await fetch(ARCHIVE).then(r=>{if(!r.ok)throw new Error('Official archive HTTP '+r.status);return r.text()});
  const urls=[...archive.matchAll(/https:\/\/supercell\.com\/en\/games\/brawlstars\/blog\/release-notes\/[^"'< ]+/g)].map(m=>m[0].replace(/\\$/,''));
  const unique=[...new Set(urls)];
  const db=JSON.parse(fs.readFileSync(dbPath,'utf8'));
  const changelog=JSON.parse(fs.readFileSync(changelogPath,'utf8'));
  const known=new Set((changelog.releases||[]).map(x=>x.url));
  for(const url of unique){
    if(known.has(url))continue;
    changelog.releases.unshift({
      id:'pending-'+Date.now(),
      title:'New official release note detected',
      publishedAt:null,
      maintenance:null,
      url,
      status:'pending-normalization',
      highlights:['Detected from the official Brawl Stars news archive.']
    });
  }
  changelog.releases=changelog.releases.slice(0,50);
  changelog.updatedAt=now;
  changelog.sourceStatus='official_archive_checked';
  db.lastSyncedAt=now;
  db.meta.status='foundation';
  fs.writeFileSync(dbPath,JSON.stringify(db,null,2)+'\\n');
  fs.writeFileSync(changelogPath,JSON.stringify(changelog,null,2)+'\\n');
  console.log(JSON.stringify({checkedAt:now,releaseNoteUrlsFound:unique.length,pending:changelog.releases.filter(x=>x.status==='pending-normalization').length},null,2));
}
main().catch(e=>{console.error(e);process.exit(1)});
