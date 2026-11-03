import {Interface,id} from 'ethers';
const BLUE='0x18573fA18fd17dDfD790B4a5B5b2977aad3b4Efb',rpc='https://rpc.pharos.xyz';
let n=5;
async function call(method,params=[]){
 for(let tries=0;tries<3;tries++)try{
  const r=await fetch(rpc,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:++n,method,params}),signal:AbortSignal.timeout(13000)});
  const j=await r.json();if(j.error)throw Error(j.error.message);return j.result;
 }catch(e){if(tries===2)throw e;await new Promise(res=>setTimeout(res,400*(tries+1)))}
}
const topic=id('Borrow(bytes32,address,address,address,uint256,uint256)');
const head=Number(BigInt(await call('eth_blockNumber')));
console.log('LENDING_SCAN_HEAD',head,'topic',topic);
let found=[];
let failures=0;
for(let group=0;group<35&&!found.length;group++){
 const endpoints=Array.from({length:6},(_,i)=>{
  const back=group*6+i;
  const to=head-1000*back,from=to-999;
  return {from,to};
 }).filter(x=>x.from>4202147);
 const output=await Promise.all(endpoints.map(async r=>{
  try{
   const result=await call('eth_getLogs',[{address:BLUE,topics:[topic],fromBlock:'0x'+r.from.toString(16),toBlock:'0x'+r.to.toString(16)}]);
   if(result.length)console.log('BORROW_LOG_RANGE',r.from,r.to,result.length);
   return result;
  }catch(e){failures++;console.log('BORROW_LOG_ERROR',r.from,String(e.message).slice(0,120));return []}
 }));
 found=output.flat();
 if(group%6===0)console.log('SCAN_PROGRESS',group,found.length,failures);
}
const iface=new Interface([
 'function position(bytes32,address) view returns(uint256 supplyShares,uint128 borrowShares,uint128 collateral)',
 'function market(bytes32) view returns(uint128 totalSupplyAssets,uint128 totalSupplyShares,uint128 totalBorrowAssets,uint128 totalBorrowShares,uint128 lastUpdate,uint128 fee)',
 'function idToMarketParams(bytes32) view returns(address loanToken,address collateralToken,address oracle,address irm,uint256 lltv)',
 'function price() view returns(uint256)'
]);
async function read(to,name,args){
 const r=await call('eth_call',[{to,data:iface.encodeFunctionData(name,args)},'latest']);
 return iface.decodeFunctionResult(name,r).map(x=>typeof x==='bigint'?x.toString():String(x));
}
for(const log of found.slice(-15)){
 const market=log.topics[1],borrower='0x'+log.topics[3].slice(-40);
 try{
  const [pos,state,params]=await Promise.all([
   read(BLUE,'position',[market,borrower]),
   read(BLUE,'market',[market]),
   read(BLUE,'idToMarketParams',[market])
  ]);
  const oracle=params[2];let price;
  try{price=(await read(oracle,'price',[]))[0];}catch(e){price='ERROR: '+e.message.slice(0,110)}
  console.log('LIVE_BORROW_POSITION',JSON.stringify({market,borrower,block:log.blockNumber,
   position:pos,state,params,price}));
 }catch(e){console.log('LIVE_BORROW_POSITION_ERROR',market,borrower,e.message)}
}
console.log('BORROW_SCAN_FINISHED',found.length,failures);
