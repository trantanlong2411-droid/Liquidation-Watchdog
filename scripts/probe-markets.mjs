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


const blue='0x18573fA18fd17dDfD790B4a5B5b2977aad3b4Efb';
const eventTopic='0x'+(await import('ethers')).id('CreateMarket(bytes32,(address,address,address,address,uint256))').slice(2);
const providers=[
 'https://blockscout.routescan.io/1672/api/v2/addresses/'+blue+'/logs?topic='+eventTopic,
 'https://pharosscan.xyz/api/v2/addresses/'+blue+'/logs',
 'https://api.blockscout.com/1672/api/v2/addresses/'+blue+'/logs'
];
for(const url of providers){
 try{const r=await fetch(url,{signal:AbortSignal.timeout(12000),headers:{accept:'application/json'}});
 const s=await r.text();console.log('EXPLORER_MARKETS',url,'HTTP',r.status,'BODY',s.slice(0,6500));}
 catch(e){console.log('EXPLORER_MARKETS_ERROR',url,String(e.message))}
}
const rpc='https://rpc.pharos.xyz';
let seq=10;
async function q(method,params){const r=await fetch(rpc,{method:'POST',headers:{'content-type':'application/json'},
 body:JSON.stringify({id:++seq,jsonrpc:'2.0',method,params}),signal:AbortSignal.timeout(26000)});
 const x=await r.json();if(x.error)throw Error(x.error.message);return x.result;}
const latest=Number(BigInt(await q('eth_blockNumber',[])));
for(const width of [1000000,200000,20000,2000]){
 const from=Math.max(4202147,latest-width);
 try{const logs=await q('eth_getLogs',[{address:blue,fromBlock:'0x'+from.toString(16),toBlock:'0x'+latest.toString(16),topics:[eventTopic]}]);
 console.log('RPC_MARKETS',width,'count',logs.length,'data',JSON.stringify(logs.slice(-12).map(x=>({block:x.blockNumber,id:x.topics[1],data:x.data}))).slice(0,12000));
 if(logs.length)break;
 }catch(e){console.log('RPC_MARKETS_ERROR',width,e.message)}
}
