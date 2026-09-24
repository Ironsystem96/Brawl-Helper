const fs=require('fs');
const path=require('path');
const DB_PATH=path.join(__dirname,'..','data','game-db.json');
const CHANGELOG_PATH=path.join(__dirname,'..','data','changelog.json');

function readJson(file){
  return JSON.parse(fs.readFileSync(file,'utf8'));
}
function getDb(){return readJson(DB_PATH);}
function getChangelog(){return readJson(CHANGELOG_PATH);}
module.exports={getDb,getChangelog,DB_PATH,CHANGELOG_PATH};
