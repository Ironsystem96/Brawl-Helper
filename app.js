const brawlers=[
["Spike","https://cdn.brawlify.com/brawlers/borderless/160/16000000.png","READY","Power 11"],
["Max","https://cdn.brawlify.com/brawlers/borderless/160/16000010.png","READY","Context build"],
["Belle","https://cdn.brawlify.com/brawlers/borderless/160/16000032.png","READY","Context build"],
["8-Bit","https://cdn.brawlify.com/brawlers/borderless/160/16000006.png","UPGRADE","Heist candidate"],
["Shelly","https://cdn.brawlify.com/brawlers/borderless/160/16000001.png","READY","Power 9"],
["Rico","https://cdn.brawlify.com/brawlers/borderless/160/16000008.png","UPGRADE","Build incomplete"]
];
const app=document.getElementById("app");
function card(b){return '<article class="card"><img class="portrait" src="'+b[1]+'" onerror="this.style.display=\'none\'"><div class="name">'+b[0]+'</div><div class="row"><span class="tag">'+b[2]+'</span><span class="tag">'+b[3]+'</span></div></article>'}
function render(tab){
let html='';
if(tab==="home") html='<div class="hero"><h2>Best For You</h2><div class="muted">Personalized opportunities based on your profile, build ownership and competitive context.</div></div><div class="section"><h3>Top opportunities</h3></div><div class="grid">'+brawlers.slice(0,5).map(card).join('')+'</div>';
if(tab==="play") html='<div class="hero"><h2>Play</h2><div class="muted">Select a mode and map to calculate the most relevant build context.</div></div><div class="grid">'+["Ranked","Knockout","Brawl Ball","Heist","Gem Grab","Hot Zone"].map(x=>'<article class="card"><h3>'+x+'</h3><div class="muted">Context ready</div></article>').join('')+'</div>';
if(tab==="brawlers") html='<div class="section"><h2>My Brawlers</h2><div class="muted">Profile data will be connected through the official API backend.</div></div><div class="grid">'+brawlers.map(card).join('')+'</div>';
if(tab==="upgrade") html='<div class="hero"><h2>Upgrade Advisor</h2><div class="muted">Prioritize upgrades that improve competitive readiness rather than completion alone.</div></div><div class="grid">'+brawlers.filter(x=>x[2]==="UPGRADE").map(card).join('')+'</div>';
if(tab==="meta") html='<div class="hero"><h2>Meta</h2><div class="muted">Meta changes by mode and map. Online data is intentionally optional at startup.</div></div><div class="grid">'+brawlers.slice(0,4).map(card).join('')+'</div>';
app.innerHTML=html;
}
document.querySelectorAll(".nav button").forEach(btn=>btn.onclick=()=>{document.querySelectorAll(".nav button").forEach(x=>x.classList.remove("active"));btn.classList.add("active");render(btn.dataset.tab)});
render("home");