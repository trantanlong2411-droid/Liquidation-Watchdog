import {readFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {assess,CONFIG} from '../src/engine.mjs';

const fail=message=>{throw new Error('USER_PROOF_INVALID: '+message)};
const demand=(value,message)=>{if(!value)fail(message)};
const isUtc=s=>typeof s==='string'&&/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d/.test(s)&&Number.isFinite(Date.parse(s));
const alerts=['WARNING','CRITICAL','LIQUIDATABLE','STALE_INTEREST'];

export function checkLiveProof(answer,warning,critical){
 demand(answer?.ok===true&&answer?.readOnly===true&&answer?.transactionBroadcast===false,'Missing real read-only API result');
 const d=answer.data,p=d?.position,r=d?.risk;
 demand(d?.ok===true&&d.chainId===1672&&d.network==='Pharos Mainnet','Wrong chain or unavailable live chain result');
 demand(d.core?.toLowerCase()===CONFIG.core.toLowerCase(),'Unexpected Morpho core address');
 demand(/^0x[0-9a-f]{64}$/i.test(d.marketId),'Invalid market ID');
 demand(/^0x[0-9a-f]{40}$/i.test(d.borrower),'Invalid borrower');
 demand(/^\d+$/.test(String(d.block))&&BigInt(d.block)>0n,'Invalid block');
 demand(isUtc(d.observedAt)&&isUtc(d.blockTimestamp),'Invalid on-chain timestamps');
 demand(d.readOnly===true&&d.transactionBroadcast===false,'Missing read-only chain declaration');
 demand(d.thresholds?.warning===warning&&d.thresholds?.critical===critical,'Thresholds not applied as claimed');
 demand(p&&r,'Missing market position or risk data');
 for(const key of ['collateralRaw','borrowSharesRaw','marketBorrowAssetsRaw','marketBorrowSharesRaw','oraclePriceRaw','lltvWad']){
  demand(/^\d+$/.test(String(p[key])),'Missing or invalid raw field '+key);
 }
 for(const key of ['loanDecimals','collateralDecimals'])demand(Number.isInteger(p[key])&&p[key]>=0&&p[key]<=36,'Invalid token precision');
 demand(Number.isInteger(r.marketAgeSeconds)&&r.marketAgeSeconds>=0,'Invalid interest age');
 for(const key of ['position','market','params','oracle']){
  const s=d.sources?.[key];
  demand(s?.chainId===1672&&s?.block===d.block&&/^0x[0-9a-f]{40}$/i.test(s.address),'Unverifiable source '+key);
 }
 demand(d.sources.position.address.toLowerCase()===d.core.toLowerCase(),'Position source is not core');
 demand(d.sources.market.address.toLowerCase()===d.core.toLowerCase(),'Market source is not core');
 demand(d.sources.oracle.address.toLowerCase()===p.oracle.toLowerCase(),'Oracle source mismatch');

 const recalc=assess({
  collateral:p.collateralRaw,borrowShares:p.borrowSharesRaw,
  totalBorrowAssets:p.marketBorrowAssetsRaw,totalBorrowShares:p.marketBorrowSharesRaw,
  price:p.oraclePriceRaw,lltv:p.lltvWad,
  loanDecimals:p.loanDecimals,collateralDecimals:p.collateralDecimals,
  marketAgeSeconds:r.marketAgeSeconds,
  warnWad:BigInt(Math.round(Number(warning)*10000))*10n**14n,
  critWad:BigInt(Math.round(Number(critical)*10000))*10n**14n
 });
 demand(recalc.healthFactor===r.healthFactor,'HF does not match independently recomputed raw chain values');
 demand(recalc.debtRaw===r.debtRaw,'Debt does not match borrow shares and market totals');
 demand(recalc.level===r.level,'Reported alert category does not match thresholds');
 demand(recalc.repaySuggested===r.repaySuggested,'Repay suggestion differs from raw-data recomputation');
 demand(recalc.addCollateralSuggested===r.addCollateralSuggested,'Collateral suggestion differs from raw-data recomputation');
 if(alerts.includes(r.level)){
  demand(answer.alert?.origin==='LIVE_ONCHAIN'&&answer.alert.level===r.level,'Missing real matching threshold alert');
  demand(answer.alert.block===d.block&&answer.alert.healthFactor===r.healthFactor,'Mismatched live alert facts');
  demand(isUtc(answer.alert.at),'Live alert has no UTC timestamp');
 }else demand(answer.alert===null,'Unexpected real alert for non-alert level');
 return {block:d.block,healthFactor:r.healthFactor,level:r.level,
  collateral:r.collateral+' '+p.collateralSymbol,debt:r.debt+' '+p.loanSymbol};
}

export function verifyUserExport(record){
 demand(record?.schema==='pharos-liquidation-watchdog-user-operated-proof-v1','Unknown export schema');
 demand(record.source==='USER_OPERATED_BROWSER_EXPORT','Expected a user-operated browser export');
 demand(isUtc(record.exportedAtUtc),'Missing export UTC timestamp');
 demand(record.userConfirmation?.manuallyChecked===true&&record.userConfirmation?.selfAttested===true,
  'Missing explicit user confirmation');
 demand(record.userConfirmation.cryptographicallySigned===false,'Unsupported signature claim');
 demand(isUtc(record.userConfirmation.atUtc),'Missing confirmation timestamp');
 const acknowledged=record.userConfirmation.acknowledged;
 demand(Array.isArray(acknowledged)&&acknowledged.length===4,'Expected four user confirmations');
 demand(['ackChain','ackThreshold','ackAlert','ackAction'].every(id=>
  acknowledged.some(x=>x.id===id&&x.checked===true)),'User has not confirmed all steps');
 const first=checkLiveProof(record.initialLiveCheck,'1.3','1.1');
 const second=checkLiveProof(record.changedThresholdsLiveCheck,'2.0','1.8');
 demand(record.initialLiveCheck.data.borrower.toLowerCase()===record.changedThresholdsLiveCheck.data.borrower.toLowerCase(),
  'Borrower differs across checks');
 demand(record.initialLiveCheck.data.marketId===record.changedThresholdsLiveCheck.data.marketId,
  'Market differs across checks');
 demand(BigInt(record.initialLiveCheck.data.risk.debtRaw)>0n,'No nonzero live debt was shown for remedy verification');
 demand(record.simulatedAlertTest?.origin==='SIMULATED_ALERT_ONLY_NOT_CHAIN_DATA',
  'Alert-channel simulation must be labeled simulated');
 demand(isUtc(record.simulatedAlertTest.at),'Simulated alert missing UTC timestamp');
 demand(record.simulatedAlertTest.level==='WARNING','Unexpected simulated alert category');
 if(record.liveAlertFromInitialCheck){
  demand(JSON.stringify(record.liveAlertFromInitialCheck)===JSON.stringify(record.initialLiveCheck.alert),
   'Browser live alert differs from API output');
 }
 return {ok:true,verificationType:'USER_OPERATED_SELF_ATTESTED_WITH_DETERMINISTIC_REPLAY',
  exportedAtUtc:record.exportedAtUtc,chainId:1672,first,second,
  userConfirmed:true,simulationLabeled:true,privateKeysUsed:false,transactionBroadcast:false,
  caveat:'This script replays the JSON arithmetic and formatting; it does not cryptographically authenticate RPC origin or operator identity.'};
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const path=process.argv[2];
 if(!path){console.error('Usage: node scripts/verify-user-export.mjs path/to/browser-export.json');process.exitCode=2;}
 else try{
  const content=JSON.parse(await readFile(path,'utf8'));
  const verdict=verifyUserExport(content);
  console.log('USER_OPERATED_PROOF_REPLAY_PASS',JSON.stringify(verdict,null,2));
 }catch(e){console.error('USER_OPERATED_PROOF_REPLAY_FAIL',e.message);process.exitCode=1;}
}
