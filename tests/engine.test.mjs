import test from 'node:test';import assert from 'node:assert/strict';
import {Interface} from 'ethers';
import {CONFIG,MORPHO,validate,assess,inspect,alertOf,demoAlert} from '../src/engine.mjs';
const loan='0xC879C018dB60520F4355C26eD1a6D572cdAC1815';
const collateral='0x25419E949b485d481BED4ea0c5A0496f6C7f7c63';
const oracle='0x06552294d4D2113bf12DD6da9Be66d47Bc376f05';
const irm='0xD5E02889C13230458506CC842347c4E62F8cDF3a';
const lltv=860000000000000000n;
const token=new Interface(['function decimals() view returns(uint8)','function symbol() view returns(string)']);
const priceAbi=new Interface(['function price() view returns(uint256)']);
const params=[loan,collateral,oracle,irm,lltv];
const totals=[573632663727n,569335078146942417n,79500945914n,78833225048111432n,1793706768n,0n];
const position=[0n,78832345775183124n,90050879520000000000000n];
function mocked({empty=false,wrongChain=false,oldInterest=false}={}){
 return async function(method,args=[]){
  if(method==='eth_chainId')return wrongChain?'0x1':'0x688';
  if(method==='eth_blockNumber')return '0x14fda00';
  if(method==='eth_getBlockByNumber')return {timestamp:'0x'+(1793706900).toString(16)};
  if(method==='eth_getCode')return '0x6000';
  if(method==='eth_call'){
   const {to,data}=args[0];
   if(to.toLowerCase()===CONFIG.core.toLowerCase()){
    const tx=MORPHO.parseTransaction({data});
    if(tx.name==='idToMarketParams')return MORPHO.encodeFunctionResult(tx.name,params);
    if(tx.name==='market')return MORPHO.encodeFunctionResult(tx.name,
     oldInterest?[...totals.slice(0,4),1793690000n,0n]:totals);
    if(tx.name==='position')return MORPHO.encodeFunctionResult(tx.name,
     empty?[0n,0n,0n]:position);
   }
   if(to.toLowerCase()===oracle.toLowerCase())return priceAbi.encodeFunctionResult('price',[1036103938880045933000000n]);
   if([loan,collateral].some(x=>x.toLowerCase()===to.toLowerCase())){
    const tx=token.parseTransaction({data});
    if(tx.name==='decimals')return token.encodeFunctionResult('decimals',[to.toLowerCase()===loan.toLowerCase()?6:18]);
    if(tx.name==='symbol')return token.encodeFunctionResult('symbol',[to.toLowerCase()===loan.toLowerCase()?'USDC':'strUSD']);
   }
  }
  throw Error('Unexpected method '+method);
 }
}
test('threshold validation is ordered and bounded',()=>{
 assert.equal(validate({}).warning,'1.3');
 assert.throws(()=>validate({warning:'1.05',critical:'1.1'}),/Threshold rule/);
 assert.throws(()=>validate({critical:'0.5'}),/Threshold rule/);
 assert.throws(()=>validate({marketId:'not-a-hash'}),/market ID/);
});
test('public live borrower probe produces a critical health estimate with sourced collateral and debt',async()=>{
 const snapshot=await inspect(mocked(),{});
 assert.equal(snapshot.chainId,1672);
 assert.equal(snapshot.position.loanSymbol,'USDC');
 assert.equal(snapshot.position.collateralSymbol,'strUSD');
 assert.equal(snapshot.position.lltvPercent,86);
 assert.equal(snapshot.position.collateralRaw,position[2].toString());
 assert.equal(snapshot.position.borrowSharesRaw,position[1].toString());
 const hf=Number(snapshot.risk.healthFactor);
 assert.ok(hf>1&&hf<1.1);
 assert.equal(snapshot.risk.level,'CRITICAL');
 assert.equal(snapshot.risk.marketAccrualStale,false);
 assert.equal(snapshot.risk.debtRaw,'79500059194');
 assert.ok(Number(snapshot.risk.repaySuggested)>0);
 assert.ok(Number(snapshot.risk.addCollateralSuggested)>0);
 const alert=alertOf(snapshot);
 assert.equal(alert.origin,'LIVE_ONCHAIN');assert.equal(alert.level,'CRITICAL');
 assert.equal(alert.block,snapshot.block);
 assert.match(alert.action,/repaying debt or adding collateral/i);
 assert.equal(snapshot.transactionBroadcast,false);
});
test('warning, healthy, liquidatable thresholds derive only from the real-size model inputs',()=>{
 const data={collateral:position[2],borrowShares:position[1],
 totalBorrowAssets:totals[2],totalBorrowShares:totals[3],
 price:1036103938880045933000000n,lltv,loanDecimals:6,collateralDecimals:18,
 marketAgeSeconds:40,warnWad:'1300000000000000000',critWad:'1100000000000000000'};
 assert.equal(assess({...data,collateral:position[2]*12n/10n}).level,'WARNING');
 assert.equal(assess({...data,collateral:position[2]*14n/10n}).level,'HEALTHY_ESTIMATE');
 assert.equal(assess({...data,collateral:position[2]*8n/10n}).level,'LIQUIDATABLE');
});
test('no on-chain loan is not a fake infinite health reading',async()=>{
 const s=await inspect(mocked({empty:true}),{});
 assert.equal(s.risk.level,'NO_POSITION');
 assert.equal(s.risk.healthFactor,null);
 assert.equal(alertOf(s),null);
});
test('old accrued market borrow data is flagged explicitly',async()=>{
 const s=await inspect(mocked({oldInterest:true}),{});
 assert.equal(s.risk.marketAccrualStale,true);
 assert.ok(s.risk.marketAgeSeconds>600);
});
test('wrong chain blocks processing',async()=>{
 await assert.rejects(inspect(mocked({wrongChain:true}),{}),/Wrong network/);
});
test('warning and critical simulations are visibly marked NOT blockchain evidence',()=>{
 for(const lvl of ['WARNING','CRITICAL','LIQUIDATABLE']){
  const alert=demoAlert(lvl);
  assert.equal(alert.level,lvl);
  assert.match(alert.origin,/SIMULATED/);
  assert.equal(alert.block,null);
  assert.ok(alert.at.endsWith('Z'));
 }
});
