export const PROOF_RECORD = Object.freeze({
  schema: 'pharos-liquidation-watchdog-review-v1',
  project: 'Liquidation Watchdog',
  challenge: 'Pharos Agent Arena — Medium / DeFi / Portfolio',
  chainId: 1672,
  network: 'Pharos Pacific Mainnet',
  status: 'HISTORICAL_VERIFIED_RUN_NOT_CURRENT_POSITION',
  observedAtUtc: '2026-11-03T12:04:35.044Z',
  verifiedBlock: '22010881',
  historicalHealthFactor: '1.00931578836241036',
  historicalAlert: 'CRITICAL',
  collateral: '90050.87952 strUSD',
  debt: '79500.059194 USDC (estimated using stored borrow totals)',
  thresholds: { warning: '1.3', critical: '1.1' },
  monitor: 'Browser console / browser-local history; 60 second polling only while tab open',
  requirements: [
    { id: 1, name: 'Position from chain', evidence: 'Morpho Blue position, market, idToMarketParams, oracle.price; all reads pinned to one block' },
    { id: 2, name: 'Configurable thresholds', evidence: 'Editable WARNING / CRITICAL, validated ordering; 1.3/1.1 and 2.0/1.8 verified' },
    { id: 3, name: 'Timestamped alerts', evidence: 'Actual UTC [LIVE_ONCHAIN] [CRITICAL] console alert; separate simulated controls' },
    { id: 4, name: 'Concrete action per alert', evidence: 'Estimated repay and additional-collateral alternatives to an explicit target health' }
  ],
  references: {
    github: 'https://github.com/trantanlong2411-droid/Liquidation-Watchdog',
    evidence: 'https://github.com/trantanlong2411-droid/Liquidation-Watchdog/blob/main/proof/README.md',
    verifiedRun: 'https://github.com/trantanlong2411-droid/Liquidation-Watchdog/actions/runs/41632625949',
    machineReadableSummary: 'https://github.com/trantanlong2411-droid/Liquidation-Watchdog/blob/main/proof/verified-run.json'
  },
  warnings: [
    'The sample borrower is an unrelated public third-party account.',
    'The verified on-chain snapshot was recorded on 3 November 2026 and is not a current borrower balance.',
    'Estimated debt may omit interest accrued after the market lastUpdate timestamp.',
    'Oracle price freshness is not independently verified.',
    'No background Telegram/Discord alerts are configured; browser monitoring stops when the page closes.',
    'The app does not move funds or sign transactions.'
  ]
});

export const PROOF_HTML = String.raw`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Proof of Build | Liquidation Watchdog · Pharos</title>
<meta name="description" content="Reviewer evidence for the four Pharos Liquidation Watchdog requirements. Includes a verified historical on-chain alert and a fresh live check.">
<style>
:root{color-scheme:dark;--bg:#090f20;--panel:#14213d;--line:#33496b;--txt:#edf3ff;--muted:#9fb5db;--accent:#b3c7ff;--teal:#89f1cb;--gold:#ffe0a0}
*{box-sizing:border-box}body{margin:0;background:radial-gradient(ellipse at 0% 0%,#213b68,var(--bg) 60%);color:var(--txt);font:15px/1.6 system-ui,Segoe UI,sans-serif}
main{max-width:1160px;margin:0 auto;padding:32px 20px 70px}a{color:var(--accent)}header,.between{display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap}
header{font-size:12px;letter-spacing:.05em}h1{font-size:clamp(42px,7vw,72px);letter-spacing:-.065em;line-height:1.02;margin:55px 0 18px}h1 em{color:var(--accent);font-style:normal}
p{margin:9px 0}h2{font-size:23px;margin:0 0 14px}h3{font-size:17px;margin:0 0 8px}small,.muted{color:var(--muted)}
.intro{max-width:870px;font-size:18px;color:var(--muted);margin-bottom:26px}.eyebrow{font-size:12px;color:#a9c5fa;letter-spacing:.13em}
.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:15px}.panel{background:rgba(18,31,57,.95);border:1px solid var(--line);border-radius:16px;padding:23px;margin:14px 0}
.card{background:#101d36;border:1px solid var(--line);border-radius:14px;padding:19px}.card b{color:var(--teal)}
.tag{display:inline-block;border:1px solid #496ca4;border-radius:30px;padding:3px 9px;font-size:11px;color:#c8d8ff}
.good{color:var(--teal)}.caution{color:var(--gold)}.banner{border:1px solid #8d7444;background:#302a22;padding:16px;border-radius:12px;color:#ffdfab}
.kpi{background:#0a182e;border:1px solid var(--line);border-radius:11px;padding:15px;min-width:0}
.kpi label{display:block;color:var(--muted);font-size:12px}.kpi strong{display:block;font-size:22px;overflow-wrap:anywhere}
button{border:0;border-radius:9px;background:#abc2ff;color:#0d1a35;font:700 14px system-ui;padding:12px 20px;cursor:pointer}button:disabled{opacity:.55;cursor:wait}
.buttons{display:flex;flex-wrap:wrap;gap:11px;margin:16px 0}
pre{white-space:pre-wrap;overflow-wrap:anywhere;background:#081429;color:#cde0ff;padding:18px;border:1px solid var(--line);border-radius:10px;max-height:430px;overflow:auto;font-size:12px}
ul{padding-left:21px}li{margin:6px 0}.links{display:flex;gap:16px;flex-wrap:wrap}footer{color:var(--muted);font-size:12px;margin-top:35px}
@media(max-width:760px){.grid{grid-template-columns:1fr}h1{margin-top:30px}}
</style>
</head>
<body><main>
<header><span>PHAROS / AGENT ARENA <span class="tag">MEDIUM · DeFi / Portfolio</span></span><a href="/">← Back to dashboard</a></header>
<h1>PROOF OF <em>BUILD</em></h1>
<p class="intro">Liquidation Watchdog · Reviewable evidence for all four challenge requirements. Historical results are labeled as historical, and the button below requests a new on-chain read before showing any current health estimate.</p>
<div class="banner"><strong>Operator acceptance pending:</strong> Automated tests and historical on-chain observations are independent engineering evidence, not proof that the website has been checked by its owner. <a href="/verify">Run the four-stage manual verification and export your original JSON</a> before preparing any challenge submission.</div>
<div class="banner"><strong>Evidence integrity:</strong> The verified sample belongs to a public third party. The recorded health factor is a historical estimate, not the current value. Morpho interest may accrue after the stored market update; oracle freshness is not independently proven. This is a read-only monitor, not liquidation insurance.</div>
<section class="panel"><div class="between"><h2>01 / Requirement coverage</h2><span class="tag">4 / 4 implemented</span></div>
<div class="grid">
<div class="card"><b>01 · READ FROM CHAIN</b><h3>Collateral, debt and indicative HF</h3><p>Position shares, market borrow totals, LLTV and oracle.price are queried from real Morpho Blue contracts at the same Pharos block.</p></div>
<div class="card"><b>02 · CONFIGURABLE THRESHOLDS</b><h3>Warning 1.30 / critical 1.10</h3><p>Editable input values and validation; 2.0 / 1.8 were also verified in live integration tests.</p></div>
<div class="card"><b>03 · TIMESTAMPED ALERT CHANNEL</b><h3>Browser console + on-page history</h3><p>A live CRITICAL alert was logged at 2026-11-03 12:04:35 UTC. Browser-only monitoring refreshes every 60 seconds while the tab remains open.</p></div>
<div class="card"><b>04 · CONCRETE REMEDIES</b><h3>Repay loan or add collateral</h3><p>Estimates how much loan asset to repay OR collateral to add to target the warning threshold plus 0.2, assuming unchanged prices.</p></div>
</div></section>
<section class="panel"><h2>02 / Historical verified on-chain observation</h2>
<div class="grid">
<div class="kpi"><label>INDICATIVE HEALTH FACTOR · THEN</label><strong class="caution">1.009315788</strong></div>
<div class="kpi"><label>RECORDED SEVERITY</label><strong class="caution">CRITICAL</strong></div>
<div class="kpi"><label>COLLATERAL · THEN</label><strong>90,050.87952 strUSD</strong></div>
<div class="kpi"><label>DEBT · THEN</label><strong>79,500.059194 USDC</strong></div>
<div class="kpi"><label>BLOCK</label><strong>22010881</strong></div>
<div class="kpi"><label>SNAPSHOT UTC</label><strong>2026-11-03 12:04:35</strong></div>
</div>
<p class="muted">The successful CI independently recomputed the estimate from raw on-chain values (9/9 unit tests, Worker bundle and live integration passed). At the historical read, stored market interest was already 702 seconds old.</p>
<div class="links"><a href="https://github.com/trantanlong2411-droid/Liquidation-Watchdog/actions/runs/41632625949" target="_blank" rel="noopener noreferrer">Verified GitHub Actions run ↗</a><a href="https://github.com/trantanlong2411-droid/Liquidation-Watchdog/blob/main/proof/README.md" target="_blank" rel="noopener noreferrer">Permanent evidence ↗</a><a href="/api/proof">Evidence JSON ↗</a></div>
</section>
<section class="panel"><h2>03 / Verify a fresh on-chain reading</h2>
<p class="muted">The example borrower and market are read again using /api/check. They may no longer be at risk or may have zero debt, which is a legitimate current result. Nothing is mocked.</p>
<div class="buttons"><button id="verify">Check real position now</button><a href="/">Open interactive dashboard →</a></div>
<p id="status" role="status">Not yet checked. Click the button to query Pharos Mainnet.</p>
<pre id="live" aria-live="polite">Awaiting a live check.</pre>
</section>
<section class="panel"><h2>04 / Independent audit and limitations</h2>
<ul><li>The verified live borrower example is not owned or controlled by this project.</li><li>Borrow debt is calculated from stored market totals; interest accrued afterward can reduce the actual health factor.</li><li>No external oracle feed update timestamp is independently checked.</li><li>Console/browser alerts are the required channel. No background 24/7 notification service is claimed.</li><li>Simulated alerts on the dashboard are clearly labeled, separate from real blockchain evidence.</li><li>Transactions, wallet signing, approvals and automatic liquidations are not performed.</li></ul>
<div class="links"><a href="https://github.com/trantanlong2411-droid/Liquidation-Watchdog" target="_blank" rel="noopener noreferrer">Source code ↗</a><a href="https://docs.morpho.org/developers/borrow/concepts/liquidation/" target="_blank" rel="noopener noreferrer">Morpho liquidation docs ↗</a><a href="https://docs.pharos.xyz/getting-started/network" target="_blank" rel="noopener noreferrer">Pharos network docs ↗</a></div>
</section>
<footer>Liquidation Watchdog · Pharos Pacific Mainnet (1672) · Reviewer proof page. All historical figures are timestamped and deliberately not represented as current live prices.</footer>
</main>
<script>
(function(){
  const button=document.getElementById('verify');
  const status=document.getElementById('status');
  const output=document.getElementById('live');
  button.addEventListener('click',async function(){
    button.disabled=true;status.textContent='Reading Pharos Mainnet block, Morpho market and oracle…';
    output.textContent='Live RPC verification in progress.';
    try{
      const r=await fetch('/api/check',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({
        borrower:'0x6cc38cd9741cdcdcd6ffc05b527779596d140e29',
        marketId:'0x4cbedaf680d648926bafbce7d874ce717a1b3232ea7084c7c3593aa42bb429cd',
        warning:'1.3',critical:'1.1'
      })});
      const j=await r.json();
      if(!r.ok||!j.ok)throw Error(j.error||'Live check failed');
      const d=j.data,p=d.position,k=d.risk;
      status.textContent='Live on-chain read completed at '+d.observedAt+' · block '+d.block+' · '+k.level;
      output.textContent=[
        'Source: LIVE_ONCHAIN (not a simulation)',
        'Chain ID: '+d.chainId+' · Block: '+d.block,
        'Borrower: '+d.borrower,
        'Collateral: '+k.collateral+' '+p.collateralSymbol,
        'Debt: '+k.debt+' '+p.loanSymbol,
        'Indicative Health Factor: '+(k.healthFactor??'No debt'),
        'Risk classification: '+k.level,
        'Interest update age: '+k.marketAgeSeconds+' seconds',
        'Warning threshold: '+d.thresholds.warning+' · Critical: '+d.thresholds.critical,
        'Suggested action: '+k.action,
        'Alternative A, approximate repay: '+(k.repaySuggested??'N/A')+' '+p.loanSymbol,
        'Alternative B, approximate add collateral: '+(k.addCollateralSuggested??'N/A')+' '+p.collateralSymbol,
        'CAUTION: Unaccrued interest and oracle freshness have not been independently resolved.',
        '',
        JSON.stringify(j,null,2)
      ].join('\n');
      if(j.alert)console.warn('['+j.alert.at+'] [LIVE_ONCHAIN] ['+j.alert.level+'] '+j.alert.action,j.alert);
    }catch(e){
      status.textContent='Could not verify a live reading. Do not interpret historical numbers as current.';
      output.textContent=String(e.message||e);
    }finally{button.disabled=false;}
  });
})();
</script></body></html>`;
