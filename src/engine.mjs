import {Interface,AbiCoder,keccak256,getAddress,formatUnits} from 'ethers';
export const CONFIG={
 chainId:1672,rpc:'https://rpc.pharos.xyz',
 core:'0x18573fA18fd17dDfD790B4a5B5b2977aad3b4Efb',
 example:{marketId:'0x4cbedaf680d648926bafbce7d874ce717a1b3232ea7084c7c3593aa42bb429cd',
 borrower:'0x6cc38cd9741cdcdcd6ffc05b527779596d140e29'}
};
export const MORPHO=new Interface([
 'function market(bytes32) view returns(uint128 totalSupplyAssets,uint128 totalSupplyShares,uint128 totalBorrowAssets,uint128 totalBorrowShares,uint128 lastUpdate,uint128 fee)',
 'function position(bytes32,address) view returns(uint256 supplyShares,uint128 borrowShares,uint128 collateral)',
 'function idToMarketParams(bytes32) view returns(address loanToken,address collateralToken,address oracle,address irm,uint256 lltv)'
]);
const ERC20=new Interface(['function decimals() view returns(uint8)','function symbol() view returns(string)']);
const PRICE=new Interface(['function price() view returns(uint256)']);
const WAD=10n**18n,PRICE_SCALE=10n**36n;
const ceil=(a,b)=>{if(b<=0n)throw Error('Invalid denominator');return (a+b-1n)/b};
export function toWad(x){
 const s=String(x);
 if(!/^(0|[1-9]\d*)(?:\.\d{1,4})?$/.test(s))throw Error('Invalid threshold');
 const [whole,fraction='']=s.split('.');
 return BigInt(whole)*WAD+BigInt(fraction.padEnd(18,'0'));
}
export function validate(x={}){
 if(!x||Array.isArray(x)||typeof x!=='object')throw Error('Invalid request');
 let borrower;try{borrower=getAddress(String(x.borrower||CONFIG.example.borrower))}catch{throw Error('Invalid borrower address')}
 const marketId=String(x.marketId||CONFIG.example.marketId).toLowerCase();
 if(!/^0x[0-9a-f]{64}$/.test(marketId))throw Error('Invalid 32-byte market ID');
 const warning=String(x.warning??'1.3'),critical=String(x.critical??'1.1');
 const a=toWad(warning),b=toWad(critical);
 if(b<WAD||b>=a||a>5n*WAD)throw Error('Threshold rule: 1.0 <= critical < warning <= 5.0');
 return {borrower,marketId,warning,critical,warnWad:a.toString(),critWad:b.toString()};
}
export function assess(p){
 const C=BigInt(p.collateral),S=BigInt(p.borrowShares),A=BigInt(p.totalBorrowAssets),
 T=BigInt(p.totalBorrowShares),P=BigInt(p.price),L=BigInt(p.lltv),
 warn=BigInt(p.warnWad),crit=BigInt(p.critWad);
 if(C<0n||S<0n||A<0n||T<0n||P<=0n||L<=0n||L>WAD)
  throw Error('Unverified market values');
 // Morpho SharesMathLib virtual assets 1 and virtual shares 1,000,000.
 const debt=S?ceil(S*(A+1n),T+1000000n):0n;
 const collateralLoan=C*P/PRICE_SCALE;
 const maxBorrow=collateralLoan*L/WAD;
 const stale=Number(p.marketAgeSeconds)>600;
 const out={debtRaw:debt.toString(),collateralValueLoanRaw:collateralLoan.toString(),
  collateral:formatUnits(C,p.collateralDecimals),debt:formatUnits(debt,p.loanDecimals),
  collateralValueLoan:formatUnits(collateralLoan,p.loanDecimals),
  maxBorrowLoan:formatUnits(maxBorrow,p.loanDecimals),marketAgeSeconds:Number(p.marketAgeSeconds),
  interestMayBeUnaccrued:true,marketAccrualStale:stale};
 if(debt===0n)return {...out,level:C?'NO_DEBT':'NO_POSITION',healthFactor:null,
  repaySuggested:null,addCollateralSuggested:null,targetHealthFactor:null,
  action:'No debt is recorded for this borrower in the selected market. No liquidation alert is applicable.'};
 // HF (WAD) = collateral * Morpho oracle price * LLTV / 1e36 / debt,
 // where the oracle price includes collateral and loan decimal normalization.
 const hf=C*P*L/(PRICE_SCALE*debt);
 const level=hf<=WAD?'LIQUIDATABLE':hf<=crit?'CRITICAL':hf<=warn?'WARNING':
  stale?'STALE_INTEREST':'HEALTHY_ESTIMATE';
 const target=warn+2n*10n**17n;
 const maxDebtTarget=C*P*L/(PRICE_SCALE*target);
 const repay=debt>maxDebtTarget?debt-maxDebtTarget:0n;
 const neededCollateral=ceil(target*debt*PRICE_SCALE,P*L);
 const add=neededCollateral>C?neededCollateral-C:0n;
 const action=level==='LIQUIDATABLE'?
  'The loan may already be liquidatable. Urgently check the official lending interface; adding collateral or repaying debt might not prevent liquidation.':
  level==='CRITICAL'?'Critical estimated health. Verify actual market and oracle status, then consider repaying debt or adding collateral.':
  level==='WARNING'?'Health is approaching the critical zone; consider repaying part of the loan or adding collateral.':
  level==='STALE_INTEREST'?'Stored market interest is older than 10 minutes: refresh the market before trusting this estimate.':
  'Estimated health exceeds the warning threshold. Continue monitoring; verify oracle and interest freshness.';
 return {...out,healthFactor:formatUnits(hf,18),healthFactorWad:hf.toString(),
  level,targetHealthFactor:formatUnits(target,18),
  repaySuggested:formatUnits(repay,p.loanDecimals),
  addCollateralSuggested:formatUnits(add,p.collateralDecimals),
  action,remedyCaveat:'Two alternative approximate remedies to reach warning threshold + 0.2, assuming unchanged oracle price. Not a transaction quote or guarantee.'};
}
async function read(rpc,to,iface,method,args,block){
 const encoded=iface.encodeFunctionData(method,args);
 const raw=await rpc('eth_call',[{to,data:encoded},block]);
 if(!raw||raw==='0x')throw Error('Missing contract output: '+method);
 return iface.decodeFunctionResult(method,raw);
}
const src=(address,method,block)=>({address,method,block,chainId:1672,explorer:'https://pharosscan.xyz/address/'+address});
export async function inspect(rpc,raw,observedAt=new Date().toISOString()){
 const request=validate(raw);
 if(BigInt(await rpc('eth_chainId',[]))!==1672n)throw Error('Wrong network: Pharos Mainnet 1672 is required');
 const b=BigInt(await rpc('eth_blockNumber',[])),block='0x'+b.toString(16);
 if(b<=0n)throw Error('Invalid block');
 const blockInfo=await rpc('eth_getBlockByNumber',[block,false]);
 if(!blockInfo?.timestamp)throw Error('No block timestamp');
 const timestamp=Number(BigInt(blockInfo.timestamp));
 const code=await rpc('eth_getCode',[CONFIG.core,block]);
 if(!code||code==='0x')throw Error('Morpho core bytecode missing');
 const [params,market,position]=await Promise.all([
  read(rpc,CONFIG.core,MORPHO,'idToMarketParams',[request.marketId],block),
  read(rpc,CONFIG.core,MORPHO,'market',[request.marketId],block),
  read(rpc,CONFIG.core,MORPHO,'position',[request.marketId,request.borrower],block)
 ]);
 const [loan,collateral,oracle,irm,lltv]=params;
 const computed=keccak256(AbiCoder.defaultAbiCoder().encode(
  ['address','address','address','address','uint256'],[loan,collateral,oracle,irm,lltv]));
 if(computed.toLowerCase()!==request.marketId)throw Error('On-chain market parameters do not match the selected ID');
 const lastUpdate=Number(market[4]);
 if(lastUpdate<=0||lastUpdate>timestamp+60)throw Error('Market update timestamp invalid');
 const oracleCode=await rpc('eth_getCode',[oracle,block]);
 if(!oracleCode||oracleCode==='0x')throw Error('Missing market oracle contract');
 const [price,loanD,colD,loanSymbol,colSymbol]=await Promise.all([
  read(rpc,oracle,PRICE,'price',[],block),
  read(rpc,loan,ERC20,'decimals',[],block),
  read(rpc,collateral,ERC20,'decimals',[],block),
  read(rpc,loan,ERC20,'symbol',[],block),
  read(rpc,collateral,ERC20,'symbol',[],block)
 ]);
 const ld=Number(loanD[0]),cd=Number(colD[0]);
 if(!Number.isInteger(ld)||ld<0||ld>36||!Number.isInteger(cd)||cd<0||cd>36)
  throw Error('Invalid token precision');
 const risk=assess({
  collateral:position[2],borrowShares:position[1],
  totalBorrowAssets:market[2],totalBorrowShares:market[3],
  price:price[0],lltv,loanDecimals:ld,collateralDecimals:cd,
  marketAgeSeconds:Math.max(0,timestamp-lastUpdate),
  warnWad:request.warnWad,critWad:request.critWad
 });
 const blockNumber=b.toString();
 return {ok:true,network:'Pharos Mainnet',chainId:1672,observedAt,
  block:blockNumber,blockTimestamp:new Date(timestamp*1000).toISOString(),
  borrower:request.borrower,marketId:request.marketId,core:CONFIG.core,
  thresholds:{warning:request.warning,critical:request.critical},
  position:{loanToken:loan,loanSymbol:String(loanSymbol[0]),loanDecimals:ld,
   collateralToken:collateral,collateralSymbol:String(colSymbol[0]),collateralDecimals:cd,
   oracle,irm,lltvWad:String(lltv),lltvPercent:Number(lltv)/1e16,
   collateralRaw:String(position[2]),borrowSharesRaw:String(position[1]),
   marketBorrowAssetsRaw:String(market[2]),marketBorrowSharesRaw:String(market[3]),
   lastInterestUpdateUnix:lastUpdate,oraclePriceRaw:String(price[0])},
  risk,sources:{
   position:src(CONFIG.core,'position(bytes32,address)',blockNumber),
   market:src(CONFIG.core,'market(bytes32)',blockNumber),
   params:src(CONFIG.core,'idToMarketParams(bytes32)',blockNumber),
   oracle:src(oracle,'price()',blockNumber)},
  limitations:[
   'Morpho borrow assets are calculated from stored borrow totals and shares. Pending interest since lastUpdate can make true debt greater.',
   'The market oracle price() does not prove oracle freshness; check the oracle source before using it for decisions.',
   'This public sample borrower is a third party and not your wallet.',
   'Monitoring and alerts work only while the website remains open; no server-side notifications are configured.'
  ],readOnly:true,transactionBroadcast:false,alertChannel:'BROWSER_CONSOLE_WITH_UTC_TIMESTAMPS'};
}
export function alertOf(s){
 if(!['WARNING','CRITICAL','LIQUIDATABLE','STALE_INTEREST'].includes(s.risk.level))return null;
 return {origin:'LIVE_ONCHAIN',at:new Date().toISOString(),level:s.risk.level,
  borrower:s.borrower,marketId:s.marketId,block:s.block,
  healthFactor:s.risk.healthFactor,
  collateral:s.risk.collateral+' '+s.position.collateralSymbol,
  debt:s.risk.debt+' '+s.position.loanSymbol,
  action:s.risk.action,
  alternativeRepay:s.risk.repaySuggested+' '+s.position.loanSymbol,
  alternativeCollateral:s.risk.addCollateralSuggested+' '+s.position.collateralSymbol,
  targetHealth:s.risk.targetHealthFactor,
  caveat:s.risk.remedyCaveat||'Health is indicative; verify updated interest and oracle.'};
}
export function demoAlert(level){
 if(!['WARNING','CRITICAL','LIQUIDATABLE'].includes(level))throw Error('Unsupported demo level');
 const h={WARNING:'1.20',CRITICAL:'1.05',LIQUIDATABLE:'0.95'}[level];
 return {origin:'SIMULATED_ALERT_ONLY_NOT_CHAIN_DATA',at:new Date().toISOString(),
  level,healthFactor:h,borrower:'DEMO_ONLY',block:null,
  action:'DEMO: consider repaying debt or adding collateral after verifying real balances.',
  caveat:'Simulated threshold test, NOT a real Pharos borrower or a live on-chain reading.'};
}
