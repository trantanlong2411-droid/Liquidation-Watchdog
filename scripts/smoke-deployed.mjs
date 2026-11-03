import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {CONFIG,assess,alertOf} from '../src/engine.mjs';
const url=(process.env.WATCHDOG_URL||'https://liquidation-watchdog.trantanlong2411.workers.dev').replace(/\/$/,'');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function api(path,body){
 const r=await fetch(url+path,{method:body?'POST':'GET',
  headers:body?{'content-type':'application/json'}:{},
  body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(110000)});
 const text=await r.text();let j;
 try{j=JSON.parse(text)}catch{throw Error('Non-JSON HTTP '+r.status+': '+text.slice(0,160))}
 if(!r.ok||!j.ok)throw Error('HTTP '+r.status+': '+JSON.stringify(j).slice(0,480));
 return j;
}
let health;
for(let i=0;i<22;i++){
 try{health=await api('/api/health');if(health.service==='liquidation-watchdog')break}
 catch(e){console.log('WAITING WORKER',i+1,e.message.slice(0,120))}
 await sleep(4800);
}
assert.equal(health?.chainId,1672,'Worker has not deployed');
assert.equal(health.readOnly,true);
assert.equal(health.transactionBroadcast,false);
let result,error;
for(let i=0;i<3;i++){
 try{result=await api('/api/check',{...CONFIG.example,warning:'1.3',critical:'1.1'});break}
 catch(e){error=e;console.log('LIVE MORPHO RETRY',i+1,e.message);if(i<2)await sleep(13000)}
}
if(!result)throw Error('On-chain monitor unavailable: '+error?.message);
const s=result.data,p=s.position,r=s.risk;
assert.equal(s.chainId,1672);
assert.equal(s.core.toLowerCase(),CONFIG.core.toLowerCase());
assert.equal(s.marketId,CONFIG.example.marketId);
assert.equal(s.borrower.toLowerCase(),CONFIG.example.borrower.toLowerCase());
assert.equal(p.loanToken.toLowerCase(),'0xc879c018db60520f4355c26ed1a6d572cdac1815');
assert.equal(p.lltvPercent,86);
assert.ok(BigInt(p.collateralRaw)>0n);
assert.ok(BigInt(p.borrowSharesRaw)>0n);
assert.ok(BigInt(r.debtRaw)>0n);
assert.ok(Number(r.healthFactor)>0);
assert.equal(result.transactionBroadcast,false);
assert.equal(s.transactionBroadcast,false);
assert.equal(s.sources.position.block,s.block);
assert.equal(s.sources.market.block,s.block);
assert.equal(s.sources.oracle.block,s.block);
assert.ok(s.blockTimestamp.endsWith('Z'));
const recomputed=assess({
 collateral:p.collateralRaw,borrowShares:p.borrowSharesRaw,
 totalBorrowAssets:p.marketBorrowAssetsRaw,totalBorrowShares:p.marketBorrowSharesRaw,
 price:p.oraclePriceRaw,lltv:p.lltvWad,
 loanDecimals:p.loanDecimals,collateralDecimals:p.collateralDecimals,
 marketAgeSeconds:r.marketAgeSeconds,warnWad:'1300000000000000000',
 critWad:'1100000000000000000'
});
assert.equal(r.healthFactor,recomputed.healthFactor);
assert.equal(r.debtRaw,recomputed.debtRaw);
assert.equal(r.level,recomputed.level);
assert.deepEqual(result.alert,alertOf(s));
console.log('LIVE_MORPHO_POSITION_VERIFIED',JSON.stringify({
 block:s.block,market:s.marketId,borrower:s.borrower,
 collateral:r.collateral+' '+p.collateralSymbol,debt:r.debt+' '+p.loanSymbol,
 hf:r.healthFactor,level:r.level,marketAgeSeconds:r.marketAgeSeconds,
 repayApprox:r.repaySuggested,collateralApprox:r.addCollateralSuggested,
 oraclePriceRaw:p.oraclePriceRaw,readOnly:true
}));
if(result.alert){
 console.warn('['+result.alert.at+'] [LIVE_ONCHAIN] ['+result.alert.level+'] '+
  'Health '+result.alert.healthFactor+' · '+result.alert.action);
}
const altered=await api('/api/check',{...CONFIG.example,warning:'2.0',critical:'1.8'});
assert.ok(Number(altered.data.risk.healthFactor)>0);
assert.equal(altered.data.thresholds.warning,'2.0');
assert.equal(altered.data.thresholds.critical,'1.8');
assert.equal(altered.transactionBroadcast,false);
const compareAlert=altered.alert;
if(compareAlert){
 console.warn('['+compareAlert.at+'] [LIVE_ONCHAIN] ['+compareAlert.level+'] '+
  'configurable thresholds demonstrated');
}
await mkdir('proof',{recursive:true});
await writeFile('proof/live-watchdog-evidence.json',JSON.stringify({
 schema:'pharos-liquidation-watchdog-proof-v1',testAt:new Date().toISOString(),
 website:url,source:'Real Pharos Mainnet JSON-RPC, no mocked data for integration',
 original:result,changedThresholds:altered,privateKeys:false,transactionsSent:false
},null,2)+'\n');
console.log('LIQUIDATION WATCHDOG LIVE ONCHAIN PROOF SUCCESS',JSON.stringify({
 block:s.block,healthFactor:r.healthFactor,alert:result.alert?.level,
 secondCheck:altered.data.risk.level,output:'proof/live-watchdog-evidence.json'}));
