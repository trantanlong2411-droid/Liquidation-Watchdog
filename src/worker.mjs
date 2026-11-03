import {CONFIG,inspect,validate,alertOf} from './engine.mjs';
import {HTML} from './page.mjs';
import {PROOF_HTML,PROOF_RECORD} from './proof.mjs';
const json=(x,status=200)=>new Response(JSON.stringify(x),{status,headers:{
 'content-type':'application/json;charset=utf-8','cache-control':'no-store',
 'x-content-type-options':'nosniff'}});
let serial=0;
const pause=ms=>new Promise(r=>setTimeout(r,ms));
async function rpc(method,params=[]){
 const methods=['eth_chainId','eth_blockNumber','eth_getBlockByNumber','eth_getCode','eth_call'];
 if(!methods.includes(method))throw Error('Forbidden: read-only RPC method allowlist');
 let last;
 for(let i=0;i<3;i++){
  try{
   const id=++serial;
   const response=await fetch(CONFIG.rpc,{method:'POST',
    headers:{'content-type':'application/json','accept':'application/json'},
    body:JSON.stringify({jsonrpc:'2.0',id,method,params}),
    signal:AbortSignal.timeout(15000)});
   if(!response.ok)throw Error('Pharos RPC HTTP '+response.status);
   const payload=await response.json();
   if(payload.jsonrpc!=='2.0'||payload.id!==id)throw Error('Mismatched RPC response');
   if(payload.error)throw Error(method+': '+String(payload.error.message||'unknown RPC error'));
   if(payload.result===null||payload.result===undefined)throw Error(method+' returned null');
   return payload.result;
  }catch(e){last=e;if(i<2)await pause(500*(i+1))}
 }
 throw Error(String(last?.message||last||'RPC unavailable').slice(0,250));
}
export default{
 async fetch(request){
  const url=new URL(request.url);
  if(request.method==='GET'&&url.pathname==='/')return new Response(HTML,{headers:{
   'content-type':'text/html;charset=utf-8','cache-control':'no-store',
   'x-content-type-options':'nosniff'}});
  if(request.method==='GET'&&(url.pathname==='/proof'||url.pathname==='/proof/'))
   return new Response(PROOF_HTML,{headers:{
    'content-type':'text/html;charset=utf-8','cache-control':'no-store',
    'x-content-type-options':'nosniff'}});
  if(request.method==='GET'&&url.pathname==='/api/proof')
   return json(PROOF_RECORD);
  if(request.method==='GET'&&url.pathname==='/api/health')
   return json({ok:true,service:'liquidation-watchdog',chainId:1672,
    core:CONFIG.core,example:CONFIG.example,
    alertChannel:'browser-console-with-UTC-timestamps',
    autoMonitor:'browser-only-while-open',readOnly:true,transactionBroadcast:false,
    note:'Health checks only the Worker; live RPC requires /api/check'});
  if(request.method!=='POST'||url.pathname!=='/api/check')
   return json({ok:false,error:'Not found'},404);
  let args;
  try{
   if(Number(request.headers.get('content-length')||0)>3000)throw Error('Input too large');
   const raw=await request.text();
   if(raw.length>3000)throw Error('Input too large');
   args=validate(JSON.parse(raw));
  }catch(e){return json({ok:false,error:String(e.message||e),transactionBroadcast:false},400)}
  try{
   const data=await inspect(rpc,args);
   const alert=alertOf(data);
   return json({ok:true,data,alert,readOnly:true,transactionBroadcast:false});
  }catch(e){return json({ok:false,decision:'NO_VERIFIED_HEALTH',error:String(e.message||e).slice(0,350),
   alert:null,transactionBroadcast:false},502)}
 }
};
