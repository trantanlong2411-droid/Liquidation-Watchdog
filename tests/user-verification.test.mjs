import test from 'node:test';
import assert from 'node:assert/strict';
import {VERIFY_HTML} from '../src/verify.mjs';
import worker from '../src/worker.mjs';
import {assess,CONFIG} from '../src/engine.mjs';
import {verifyUserExport} from '../scripts/verify-user-export.mjs';

test('GET /verify serves interactive operator checklist and export UI',async()=>{
 const response=await worker.fetch(new Request('https://watchdog.example/verify'));
 assert.equal(response.status,200);
 const page=await response.text();
 assert.match(page,/Run live position check/);
 assert.match(page,/thresholds 2\.0 \/ 1\.8/);
 assert.match(page,/Test simulated warning/);
 assert.match(page,/ackChain/);
 assert.match(page,/ackThreshold/);
 assert.match(page,/ackAlert/);
 assert.match(page,/ackAction/);
 assert.match(page,/Confirm my test and export original JSON/);
 assert.match(page,/Do not submit the task yet/);
 assert.equal(page,VERIFY_HTML);
});

const iso='2026-11-03T12:30:00.000Z';
const borrower='0x'+'b'.repeat(40);
const marketId='0x'+'a'.repeat(64);
const oracle='0x'+'c'.repeat(40);
function makeLive(warning,critical){
 const p={
  collateralRaw:'90000000000',borrowSharesRaw:'80000000000',
  marketBorrowAssetsRaw:'80000000000',marketBorrowSharesRaw:'80000000000',
  oraclePriceRaw:'1000000000000000000000000000000000000',
  lltvWad:'860000000000000000',loanDecimals:6,collateralDecimals:6,
  oracle,loanSymbol:'USDC',collateralSymbol:'TEST',
 };
 const risk=assess({
  collateral:p.collateralRaw,borrowShares:p.borrowSharesRaw,
  totalBorrowAssets:p.marketBorrowAssetsRaw,totalBorrowShares:p.marketBorrowSharesRaw,
  price:p.oraclePriceRaw,lltv:p.lltvWad,loanDecimals:6,collateralDecimals:6,
  marketAgeSeconds:100,
  warnWad:(BigInt(Math.round(Number(warning)*10000))*10n**14n).toString(),
  critWad:(BigInt(Math.round(Number(critical)*10000))*10n**14n).toString()
 });
 const source=(address)=>({address,block:'100',chainId:1672,method:'eth_call'});
 const alert=['WARNING','CRITICAL','LIQUIDATABLE','STALE_INTEREST'].includes(risk.level)?
  {at:iso,origin:'LIVE_ONCHAIN',level:risk.level,block:'100',healthFactor:risk.healthFactor,action:risk.action}:null;
 return {ok:true,readOnly:true,transactionBroadcast:false,alert,data:{
  ok:true,readOnly:true,transactionBroadcast:false,network:'Pharos Mainnet',
  chainId:1672,block:'100',observedAt:iso,blockTimestamp:iso,
  core:CONFIG.core,borrower,marketId,thresholds:{warning,critical},
  position:p,risk,sources:{
   position:source(CONFIG.core),market:source(CONFIG.core),
   params:source(CONFIG.core),oracle:source(oracle)
  }
 }};
}
function makeFixture(){
 const first=makeLive('1.3','1.1'),second=makeLive('2.0','1.8');
 return {
  schema:'pharos-liquidation-watchdog-user-operated-proof-v1',
  exportedAtUtc:iso,source:'USER_OPERATED_BROWSER_EXPORT',
  userConfirmation:{
   manuallyChecked:true,atUtc:iso,selfAttested:true,cryptographicallySigned:false,
   acknowledged:['ackChain','ackThreshold','ackAlert','ackAction'].map(id=>({id,checked:true}))
  },
  initialLiveCheck:first,changedThresholdsLiveCheck:second,
  simulatedAlertTest:{origin:'SIMULATED_ALERT_ONLY_NOT_CHAIN_DATA',at:iso,level:'WARNING'},
  liveAlertFromInitialCheck:first.alert
 };
}
test('independent JSON replay recalculates mock fixture consistently (not a real-chain proof)',()=>{
 const result=verifyUserExport(makeFixture());
 assert.equal(result.ok,true);
 assert.equal(result.chainId,1672);
 assert.equal(result.userConfirmed,true);
 assert.equal(result.transactionBroadcast,false);
});
test('user-proof replay refuses a tampered health factor',()=>{
 const data=makeFixture();data.initialLiveCheck.data.risk.healthFactor='123456';
 assert.throws(()=>verifyUserExport(data),/independently recomputed/);
});
test('user-proof replay refuses missing operator approval',()=>{
 const data=makeFixture();data.userConfirmation.acknowledged[2].checked=false;
 assert.throws(()=>verifyUserExport(data),/not confirmed all steps/);
});
test('user-proof replay refuses a simulated alert mislabeled as live',()=>{
 const data=makeFixture();data.simulatedAlertTest.origin='LIVE_ONCHAIN';
 assert.throws(()=>verifyUserExport(data),/labeled simulated/);
});
