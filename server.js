const express=require("express");
const path=require("path");
const app=express();
app.use(express.json({limit:"2mb"}));
const PORT=process.env.PORT||3000;
const BACKEND=String(process.env.GELO_BACKEND_URL||"").replace(/\/$/,"");
const TOKEN=String(process.env.GELO_CONTROL_TOKEN||"");

app.use(express.static(path.join(__dirname,"public"),{
  setHeaders(res,file){
    if(/manifest|sw\.js$/.test(file))res.setHeader("Cache-Control","no-cache");
  }
}));

app.use("/api/controle",async(req,res)=>{
  if(!BACKEND||!TOKEN)return res.status(503).json({ok:false,error:"Integração ainda não configurada"});
  const suffix=req.originalUrl.replace(/^\/api\/controle/,"");
  const url=BACKEND+"/api/control-bridge"+suffix;
  try{
    const headers={"x-control-token":TOKEN};
    if(req.method!=="GET"&&req.method!=="HEAD")headers["content-type"]="application/json";
    const rr=await fetch(url,{
      method:req.method,
      headers,
      body:["GET","HEAD"].includes(req.method)?undefined:JSON.stringify(req.body||{})
    });
    const text=await rr.text();
    res.status(rr.status);
    res.setHeader("Cache-Control","no-store");
    res.type(rr.headers.get("content-type")||"application/json").send(text);
  }catch(e){
    res.status(502).json({ok:false,error:"Falha ao comunicar com o banco do Gelo Tutóia"});
  }
});

app.get("/health",(req,res)=>res.json({ok:true,app:"gelo-tutoia-controle"}));
app.use((req,res)=>res.sendFile(path.join(__dirname,"public","index.html")));
app.listen(PORT,()=>console.log("Gelo Tutoia Controle online na porta",PORT));