const fs=require('fs');
const path=require('path');

const root=path.join(__dirname,'..');
const dbPath=path.join(root,'data','game-db.json');
const changelogPath=path.join(root,'data','changelog.json');

const SOURCES=[
  'https://supercell.com/en/games/brawlstars/blog/release-notes/note-di-rilascio-di-agosto-2026/',
  'https://supercell.com/en/games/brawlstars/blog/release-notes/release-notes-june-2026/',
  'https://supercell.com/en/games/brawlstars/blog/release-notes/release-notes-april-2026/'
];

async function main(){
  const now=new Date().toISOString();
  const db=JSON.parse(fs.readFileSync(dbPath,'utf8'));
  const changelog=JSON.parse(fs.readFileSync(changelogPath,'utf8'));
  db.lastSyncedAt=now;
  changelog.updatedAt=now;
  changelog.sourceStatus='official_snapshot';
  changelog.sources=SOURCES;
  fs.writeFileSync(dbPath,JSON.stringify(db,null,2)+'\n');
  fs.writeFileSync(changelogPath,JSON.stringify(changelog,null,2)+'\n');
  console.log('Database metadata refreshed:',now);
  console.log('Official release-note sources tracked:',SOURCES.length);
}
main().catch(e=>{console.error(e);process.exit(1)});
