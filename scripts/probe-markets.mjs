const calls=[
 ['markets','https://api.morpho.org/v1/blue/markets?chain_id=1672&limit=5'],
 ['positions','https://api.morpho.org/v0/blue/users/0x74B2c2E4E4B771F0C75dcE44f40787468E323f79/positions?chain_ids=1672&limit=5'],
 ['pharos-rpc','https://rpc.pharos.xyz'],
 ['morpho-app','https://app.morpho.org/pharos/markets']
];
for(const [name,url] of calls){
 try{
  const r=await fetch(url,name==='pharos-rpc'?{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method:'eth_chainId',params:[]}),signal:AbortSignal.timeout(18000)}:{headers:{accept:'application/json'},signal:AbortSignal.timeout(18000)});
  const t=await r.text();
  console.log('NETWORK_PROBE',name,'http',r.status,'length',t.length,'body',t.slice(0,4500));
 }catch(e){console.log('NETWORK_PROBE_ERROR',name,String(e.message))}
}
