const express=require('express');
const cors=require('cors');
const app=express();
const PORT=process.env.PORT||3000;
const TOKEN=process.env.BRAWL_STARS_API_TOKEN;
const ALLOWED_ORIGIN=process.env.ALLOWED_ORIGIN||'*';

app.use(cors({origin:ALLOWED_ORIGIN}));
app.get('/api/health',(req,res)=>res.json({ok:true,service:'brawl-helper-backend',version:'0.2.0'}));
app.get('/api/player/:tag',async(req,res)=>{
  if(!TOKEN)return res.status(500).json({error:'Backend token non configurato'});
  const tag=String(req.params.tag||'').replace(/^#/,'').toUpperCase();
  if(!/^[A-Z0-9]+$/.test(tag))return res.status(400).json({error:'Player Tag non valido'});
  try{
    const r=await fetch('https://api.brawlstars.com/v1/players/%23'+encodeURIComponent(tag),{
      headers:{Authorization:'Bearer '+TOKEN,Accept:'application/json'}
    });
    const body=await r.text();
    res.status(r.status).type('application/json').send(body);
  }catch(e){res.status(502).json({error:'Errore chiamando Brawl Stars API'});}
});
app.listen(PORT,()=>console.log('Brawl Helper backend listening on '+PORT));
