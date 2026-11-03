export const VERIFY_HTML = String.raw`<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Operator Verification | Liquidation Watchdog</title>
<meta name="description" content="Run, inspect, verify and export user-operated evidence of the Pharos Liquidation Watchdog.">
<style>
:root{color-scheme:dark;--bg:#080f22;--pane:#141f38;--line:#334763;--text:#eaf1ff;--muted:#a6bcdd;--blue:#b6c9ff;--ok:#85efc5;--warn:#ffe1a1;--bad:#ff9aa6}
*{box-sizing:border-box}body{margin:0;background:radial-gradient(ellipse at 10% 0%,#203863,var(--bg) 64%);font:14px/1.6 system-ui,Segoe UI,sans-serif;color:var(--text)}main{max-width:1080px;margin:0 auto;padding:28px 20px 75px}
a{color:var(--blue)}header{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;font-size:13px}
h1{font-size:clamp(42px,7vw,68px);letter-spacing:-.065em;line-height:1.04;margin:42px 0 15px}h1 em{font-style:normal;color:var(--blue)}
.lead{font-size:18px;max-width:770px;color:var(--muted)}.panel{background:#141f38f2;border:1px solid var(--line);border-radius:17px;padding:24px;margin:17px 0}
h2{margin:0 0 14px;font-size:21px}h3{margin:10px 0;font-size:16px}p{margin:8px 0}.banner{border:1px solid #8b764b;background:#302a24;border-radius:11px;padding:13px;color:#ffdb9b;margin:20px 0}
.num{display:inline-flex;align-items:center;justify-content:center;background:#31466c;color:white;border-radius:999px;min-width:29px;height:29px;margin-right:8px}
label{display:block;color:var(--muted);font-size:12px;margin:12px 0 5px}
input[type=text]{width:100%;background:#0b1731;border:1px solid #46618b;border-radius:9px;padding:12px;color:#edf3ff;font:13px ui-monospace,Consolas,monospace}
button{background:#b0c5ff;color:#091a37;border:0;border-radius:10px;padding:11px 16px;font:700 14px system-ui;cursor:pointer}
button.secondary{background:#2d436a;color:#eff4ff}button:disabled{opacity:.44;cursor:not-allowed}
.actions{display:flex;gap:9px;align-items:center;flex-wrap:wrap;margin:14px 0}
.status{border:1px solid #365176;background:#0b1933;padding:10px 12px;border-radius:9px;color:var(--muted);overflow-wrap:anywhere}
.ok{color:var(--ok)}.warn{color:var(--warn)}.bad{color:var(--bad)}
.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.kv{padding:13px;border:1px solid #395479;border-radius:10px;background:#091831}
.kv small{display:block;color:var(--muted)}.kv strong{font-size:17px;overflow-wrap:anywhere}
.console{font:12px/1.7 ui-monospace,monospace;max-height:230px;overflow:auto;white-space:pre-wrap;background:#08142b;border:1px solid #324967;border-radius:10px;padding:14px}
.check{display:flex;gap:11px;align-items:flex-start;border:1px solid #344866;padding:13px;border-radius:10px;margin:9px 0;cursor:pointer}
.check input{width:20px;height:20px;accent-color:#acc3ff;flex:none;margin-top:3px}
details{margin-top:10px}summary{cursor:pointer;color:#b7caff}pre{max-height:390px;overflow:auto;white-space:pre-wrap;overflow-wrap:anywhere;font-size:11px;background:#071328;padding:14px;border-radius:9px;border:1px solid #314968}
.small{color:var(--muted);font-size:12px}footer{font-size:12px;color:var(--muted);margin-top:27px}
@media(max-width:700px){.grid{grid-template-columns:1fr}.panel{padding:17px}h1{margin-top:27px}}
</style></head>
<body><main>
<header><span>PHAROS / AGENT ARENA · LIQUIDATION WATCHDOG</span><nav><a href="/">Dashboard</a> · <a href="/proof">Historical proof</a> · <a href="https://github.com/trantanlong2411-droid/Liquidation-Watchdog" target="_blank" rel="noopener">GitHub</a></nav></header>
<h1>OPERATOR <em>VERIFICATION</em></h1>
<p class="lead">Follow each step yourself. Confirm the actual application behavior before producing an evidence file. This page never sends a transaction or asks for private keys.</p>
<div class="banner"><strong>Optional extra evidence:</strong> This page provides a user-operated proof export in addition to the independently running reviewer demo and CI suite. Complete each step if you want a self-attested browser JSON file; this is not a prerequisite for viewing the working product. The example borrower is a public third party. Estimated debt and risk can change on-chain.</div>
<section class="panel">
<h2><span class="num">1</span>Check a real on-chain borrowing position</h2>
<p class="small">No fabricated account data. Use the known public example or replace it with a verified Pharos Morpho borrower address and the correct market ID.</p>
<label for="borrower">Public borrower address</label><input id="borrower" type="text" spellcheck="false" value="0x6cc38cd9741cdcdcd6ffc05b527779596d140e29">
<label for="market">Morpho Blue market ID</label><input id="market" type="text" spellcheck="false" value="0x4cbedaf680d648926bafbce7d874ce717a1b3232ea7084c7c3593aa42bb429cd">
<div class="actions"><button id="live">Run live position check (1.3 / 1.1)</button></div><p class="status" id="liveStatus" role="status">Awaiting your live check.</p>
<div class="grid" id="liveGrid" hidden>
<div class="kv"><small>ON-CHAIN BLOCK</small><strong id="block">—</strong></div>
<div class="kv"><small>INDICATIVE HEALTH FACTOR</small><strong id="hf">—</strong></div>
<div class="kv"><small>COLLATERAL</small><strong id="collateral">—</strong></div>
<div class="kv"><small>STORED DEBT ESTIMATE</small><strong id="debt">—</strong></div>
<div class="kv"><small>RISK CLASSIFICATION</small><strong id="level">—</strong></div>
<div class="kv"><small>LAST STORED INTEREST UPDATE AGE</small><strong id="interest">—</strong></div>
</div>
<h3>Suggested alternatives</h3><p class="status" id="remedy">Run a live check to reveal approximate repayment and collateral amounts.</p>
<details><summary>Inspect complete pinned-block live JSON with source contract addresses</summary><pre id="raw1">No response yet.</pre></details>
</section>
<section class="panel">
<h2><span class="num">2</span>Prove editable warning / critical rules</h2>
<p>After the first check, repeat with different warning and critical thresholds: <strong>2.0 / 1.8</strong>. Verify that the response reflects these settings, not hard-coded defaults.</p>
<div class="actions"><button id="threshold" disabled>Run check with thresholds 2.0 / 1.8</button></div>
<p class="status" id="thresholdStatus">Complete step 1 first.</p>
<details><summary>Inspect second live RPC response</summary><pre id="raw2">No response yet.</pre></details>
</section>
<section class="panel">
<h2><span class="num">3</span>Verify timestamped alert channel</h2>
<p>When live health crosses a threshold, the application produces a <strong>LIVE_ONCHAIN</strong> UTC console alert. Also test the UI channel independently using an explicitly <strong>SIMULATED</strong> alert. Press <strong>F12 → Console</strong> to inspect timestamps.</p>
<div class="actions"><button class="secondary" id="simulate">Test simulated warning + UTC console</button></div>
<p class="status" id="alertStatus">No test notification produced on this page.</p>
<div class="console" id="alertLog">Alert audit will appear here.</div>
</section>
<section class="panel">
<h2><span class="num">4</span>Confirm that you personally tested the behavior</h2>
<p class="small">The following checkboxes are self-attested observations. They do not create an on-chain signature and cannot replace the actual JSON output.</p>
<label class="check"><input type="checkbox" id="ackChain"><span>I checked the live block, borrower, collateral, debt and health estimate. I understand the sample position is not my wallet.</span></label>
<label class="check"><input type="checkbox" id="ackThreshold"><span>I repeated the live check with changed thresholds and inspected the response.</span></label>
<label class="check"><input type="checkbox" id="ackAlert"><span>I opened the browser console and saw a UTC timestamped alert, with simulated and live sources clearly distinguished.</span></label>
<label class="check"><input type="checkbox" id="ackAction"><span>I inspected the repay/add-collateral alternatives derived from a genuine nonzero-debt position, and understand they are approximations.</span></label>
<div class="actions"><button id="export" disabled>Confirm my test and export original JSON</button></div>
<p class="status" id="exportStatus">The export button unlocks only after both successful live requests, an alert-channel test and all four manual confirmations.</p>
<p class="small">Keep the JSON unchanged. The browser export is user-operated evidence, not a cryptographically signed attestation. It is intended for independent replay and cross-checking with on-chain CI before any submission instructions are given.</p>
</section>
<footer>Read-only, Pharos Pacific Mainnet (1672) · No signing, broadcast or repayment. Morpho debt can accrue beyond the last stored market state; oracle freshness is not independently guaranteed.</footer>
</main>
<script>
(function(){
 const $=id=>document.getElementById(id);
 const params=()=>({borrower:$('borrower').value.trim(),marketId:$('market').value.trim()});
 const checks=['ackChain','ackThreshold','ackAlert','ackAction'];
 let first=null,second=null,simulated=null,firstAlert=null,locked=false;
 function stamp(){return new Date().toISOString();}
 function write(id,value){$(id).textContent=String(value);}
 function reset(){first=null;second=null;firstAlert=null;simulated=null;checks.forEach(id=>$(id).checked=false);$('threshold').disabled=true;
  $('liveGrid').hidden=true;write('thresholdStatus','Complete step 1 first.');
  write('raw1','No response yet.');write('raw2','No response yet.');write('alertStatus','No test notification produced on this page.');write('alertLog','Alert audit will appear here.');
  write('remedy','Run a live check to reveal approximate repayment and collateral amounts.');check();
 }
 async function request(thresholds){
  const r=await fetch('/api/check',{method:'POST',headers:{'content-type':'application/json'},
   body:JSON.stringify(Object.assign({},params(),thresholds))});
  const body=await r.json();
  if(!r.ok||!body.ok)throw Error(body.error||'On-chain read failed');
  if(body.data.chainId!==1672||!body.data.block||body.data.readOnly!==true||body.data.transactionBroadcast!==false)
   throw Error('Source or read-only state failed verification');
  return body;
 }
 function check(){
  const ready=first&&second&&simulated&&first.data.risk.debtRaw!=='0'&&checks.every(x=>$(x).checked);
  $('export').disabled=!ready;
  if(first&&first.data.risk.debtRaw==='0')
   write('exportStatus','No debt in this market: choose a real borrower with nonzero debt to verify remedy amounts.');
  else if(!ready)write('exportStatus','Complete both live checks, run simulated alert test and confirm the four observations.');
  else write('exportStatus','Ready to export a user-operated original JSON evidence file.');
 }
 function logAlert(a){
  const line='['+a.at+'] ['+a.origin+'] ['+a.level+'] HF '+(a.healthFactor??'N/A')+' · '+a.action;
  $('alertLog').textContent=line+'\\n'+$('alertLog').textContent;
  console.warn(line,a);
 }
 $('live').addEventListener('click',async()=>{
  if(locked)return;locked=true;reset();$('live').disabled=true;
  write('liveStatus','Reading fresh Pharos Mainnet position, market debt and oracle…');
  try{
   const x=await request({warning:'1.3',critical:'1.1'});
   first=x;const d=x.data,r=d.risk,p=d.position;
   $('liveGrid').hidden=false;write('block',d.block);write('hf',r.healthFactor??'NO DEBT');
   write('collateral',r.collateral+' '+p.collateralSymbol);write('debt',r.debt+' '+p.loanSymbol);
   write('level',r.level);write('interest',r.marketAgeSeconds+' seconds');
   write('liveStatus','SUCCESS · '+d.network+' · block '+d.block+' · observed '+d.observedAt+' UTC-format timestamp · '+r.level);
   write('remedy',r.repaySuggested===null?
    'No borrowing debt on this market. Choose another actual nonzero borrowing position to verify concrete remedies.':
    'To target estimated HF '+r.targetHealthFactor+': repay about '+r.repaySuggested+' '+p.loanSymbol+
    ' OR add about '+r.addCollateralSuggested+' '+p.collateralSymbol+'. '+r.remedyCaveat);
   write('raw1',JSON.stringify(x,null,2));
   $('threshold').disabled=false;
   if(x.alert){firstAlert=x.alert;logAlert(x.alert);write('alertStatus','Live threshold alert generated at '+x.alert.at+'. Open F12 → Console to inspect.');}
  }catch(e){write('liveStatus','FAILED / UNVERIFIED: '+String(e.message||e));}
  finally{locked=false;$('live').disabled=false;check();}
 });
 $('threshold').addEventListener('click',async()=>{
  if(locked||!first)return;locked=true;$('threshold').disabled=true;
  write('thresholdStatus','Reading same borrower / market with updated thresholds 2.0 / 1.8…');
  try{
   const x=await request({warning:'2.0',critical:'1.8'});
   if(x.data.borrower.toLowerCase()!==first.data.borrower.toLowerCase()||x.data.marketId!==first.data.marketId)
    throw Error('Changed borrower / market between checks');
   if(x.data.thresholds.warning!=='2.0'||x.data.thresholds.critical!=='1.8')
    throw Error('Updated thresholds were not applied');
   second=x;write('raw2',JSON.stringify(x,null,2));
   write('thresholdStatus','SUCCESS · applied WARNING 2.0 / CRITICAL 1.8 at block '+x.data.block+' · '+x.data.risk.level);
   if(x.alert)logAlert(x.alert);
  }catch(e){second=null;write('thresholdStatus','FAILED / UNVERIFIED: '+String(e.message||e));}
  finally{locked=false;$('threshold').disabled=false;check();}
 });
 $('simulate').addEventListener('click',()=>{
  simulated={origin:'SIMULATED_ALERT_ONLY_NOT_CHAIN_DATA',at:stamp(),level:'WARNING',healthFactor:'1.20',
   action:'SIMULATED UI test only. Example mitigation: repay debt or add collateral after verifying live values.'};
  logAlert(simulated);write('alertStatus','SIMULATED WARNING delivered at '+simulated.at+'. This is NOT proof of an on-chain warning.');
  check();
 });
 checks.forEach(id=>$(id).addEventListener('change',check));
 ['borrower','market'].forEach(id=>$(id).addEventListener('input',()=>{
  if(first||second){reset();write('liveStatus','Inputs changed. Rerun both live checks before exporting.');}
 }));
 $('export').addEventListener('click',()=>{
  check();if($('export').disabled)return;
  const payload={
   schema:'pharos-liquidation-watchdog-user-operated-proof-v1',exportedAtUtc:stamp(),
   source:'USER_OPERATED_BROWSER_EXPORT',userConfirmation:{
    manuallyChecked:true,atUtc:stamp(),acknowledged:checks.map(id=>({id,checked:$(id).checked})),
    selfAttested:true,cryptographicallySigned:false
   },application:'https://liquidation-watchdog.trantanlong2411.workers.dev',
   initialLiveCheck:first,changedThresholdsLiveCheck:second,simulatedAlertTest:simulated,
   liveAlertFromInitialCheck:firstAlert,
   limitations:[
    'The borrower is a public third party, not necessarily controlled by the operator.',
    'Historical stored interest totals may omit subsequently accrued interest.',
    'Oracle feed freshness is not independently guaranteed.',
    'Browser console alerting is not background monitoring.',
    'No transactions or wallet signatures were executed.'
   ]
  };
  const blob=new Blob([JSON.stringify(payload,null,2)+'\\n'],{type:'application/json'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);
  a.download='liquidation-watchdog-user-verification-'+Date.now()+'.json';
  a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1200);
  write('exportStatus','JSON exported locally. Keep it unchanged and provide the file for independent validation before any task submission.');
 });
 check();
})();
</script></body></html>`;
