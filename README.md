# Liquidation Watchdog — Pharos Agent Arena

[Live Cloudflare Worker](https://liquidation-watchdog.trantanlong2411.workers.dev/) · [GitHub source](https://github.com/trantanlong2411-droid/Liquidation-Watchdog)

## Reviewer-ready evidence — automatic verification, no manual prerequisite

The task's four requirements are demonstrated by the public deployed Worker, a pinned-block on-chain read engine, 60-second browser monitoring with timestamped console alerts, user-configurable thresholds, approximate repayment/add-collateral alternatives, and independently tested live evidence.

- **Live dashboard:** https://liquidation-watchdog.trantanlong2411.workers.dev/
- **Public proof page:** https://liquidation-watchdog.trantanlong2411.workers.dev/proof
- **Live read API:** POST `/api/check` with public borrower/market ID and warning/critical thresholds.
- **Historical proof metadata:** GET `/api/proof`.
- **Automated CI:** GitHub Actions re-reads real Pharos Mainnet and recalculates the response, in addition to unit/build checks. A successful historical CI run demonstrates blockchain connectivity at its recorded timestamp, not guaranteed current risk.

There is **no mandatory user-approval step** to demonstrate the working deployed application. The optional [user verification page](https://liquidation-watchdog.trantanlong2411.workers.dev/verify) and [manual proof guide](./proof/USER-VERIFICATION-GUIDE.md) remain available if a reviewer requests a user-operated JSON export; such files are only attributed to a user if actually exported by that user.

### Accrued-interest estimation

Morpho Blue's `market().totalBorrowAssets` is stored at the last interest accrual and can understate borrowing debt. The monitor now attempts the protocol IRM's **read-only `borrowRateView(marketParams, market)`** at the same pinned block and applies Morpho's three-term WAD Taylor compounding to estimate interest through that block. The projected borrow total is used to convert borrower debt shares, calculate indicative health factor and approximate mitigation quantities.

When IRM reading fails, the Worker falls back transparently to stored borrow totals, marks `borrowInterestSource=STORED_MARKET`, and warns that unaccrued interest may understate debt. A projected value is marked `IRM_PROJECTED`; its separate raw basis, calculation inputs and IRM contract method are returned in the JSON. Neither calculation guarantees actual transaction-time debt or oracle feed freshness. No execution or signatures occur. This approach follows [Morpho's IRM view documentation](https://docs.morpho.org/developers/contracts/irm/) and [Morpho Blue interest accounting](https://docs.morpho.org/developers/contracts/blue/).

## Verified public on-chain proof

- [Permanent evidence summary with an actual CRITICAL alert](./proof/README.md)
- [Machine-readable verified-run summary](./proof/verified-run.json)
- [Passing GitHub Actions run 41632625949](https://github.com/trantanlong2411-droid/Liquidation-Watchdog/actions/runs/41632625949): 9/9 unit tests, Worker bundle, and real live Morpho borrower reading.

## What is implemented

This is a fully read-only **Morpho Blue** borrower risk monitor on **Pharos Mainnet, chain ID 1672**. It fetches *real borrower collateral, debt shares, market borrow totals, LLTV and the actual market oracle price* at one pinned on-chain block, and derives an **indicative** health factor. With editable warning and critical thresholds, it records timestamped browser-console alerts and offers two approximate ways to improve health: repay loan tokens or add collateral.

Auto-monitoring every 60 seconds runs **only while the browser page remains open**; it is not a background daemon or Telegram push service. No credentials, private keys, transactions, signatures, approvals or transfers are needed.

## Verified public on-chain example

Morpho Blue core address is confirmed via [DefiLlama's Pharos fee adapter](https://github.com/DefiLlama/dimension-adapters/blob/master/fees/morpho/index.ts) and the [Morpho contract addresses reference](https://docs.morpho.org/developers/contracts/addresses/):

\`0x18573fA18fd17dDfD790B4a5B5b2977aad3b4Efb\`

A recent \`Borrow(bytes32,address,address,address,uint256,uint256)\` event from that contract was queried directly using Pharos JSON-RPC \`eth_getLogs\` in 1,000-block windows (because the RPC rejects larger ranges). The borrower's currently nonzero debt and collateral were verified using the live core \`position\`, \`market\`, \`idToMarketParams\` functions and \`oracle.price()\`:

- Market ID: \`0x4cbedaf680d648926bafbce7d874ce717a1b3232ea7084c7c3593aa42bb429cd\`
- Public third-party borrower: \`0x6cc38cd9741cdcdcd6ffc05b527779596d140e29\` (not the site's owner or the user's wallet).
- Loan token: USDC; collateral: strUSD; LLTV = 86%.
- The position in the first RPC probe held roughly 90,050.87952 strUSD collateral and owed roughly 79,500.059194 USDC, with **indicative HF ~ 1.0093**, based on stored Morpho borrow totals. This was a historical observation; later checks can produce different values or interest-projected debt.
- The oracle quoted a real token-pair price (Morpho price scale 1e36). The sample state may evolve, liquidate or close; the app reads it afresh each request and never hardcodes its health.

Morpho's official [liquidation documentation](https://docs.morpho.org/developers/borrow/concepts/liquidation/) explains that HF nearing 1 exposes the borrower to liquidation, and that reducing debt or adding collateral can improve it.

## Actual read-only chain flow

\`\`\`mermaid
flowchart TD
 A[User selects public borrower and market ID] --> B[Verify Pharos mainnet 1672 and latest block]
 B --> C[Confirm Morpho core code and market ID hash]
 C --> D[Read position: collateral and borrow shares]
 D --> E[Read market totals and last interest accrual]
 E --> F[Read market oracle price and loan/collateral token decimals]
 F --> G[Calculate debt and estimated health factor]
 G --> H{Compare with configurable 1.3 warning and 1.1 critical}
 H -->|Warning, critical or liquidatable| I[UTC alert in browser console and on-page audit]
 H -->|No debt| J[NO_DEBT or NO_POSITION; no invented HF]
 H -->|Estimated healthy| K[No liquidation alert]
 I --> L[Suggest partial repayment OR extra collateral quantities]
 L --> M[Export complete live JSON evidence]
\`\`\`

### Health factor calculation and limitations

- Morpho stores \`borrowShares\` rather than a direct borrowing balance. The code converts borrow shares using \`totalBorrowAssets\` and \`totalBorrowShares\`, virtual assets 1, virtual shares 1,000,000 and **rounds up**.
- For the Morpho oracle \`price()\` (scaled by 1e36), collateral value in loan base units equals \`collateralRaw * price / 1e36\`. The indicative health factor is \`(collateralRaw * price * LLTV) / (1e36 * debtRaw)\`, where LLTV is WAD (1e18); all main comparisons use BigInt, not floating-point token math.
- Actual effective borrow interest can have accrued *since* the stored market's \`lastUpdate\`; this model does **not** compute unaccrued interest. When the last update exceeds ten minutes, the app flags staleness. An above-threshold estimated health therefore is **not** a guarantee of loan safety.
- A Morpho oracle \`price()\` does not itself reveal when its feeds updated; the app does not claim verified oracle freshness.
- The proposed repayment/additional-collateral quantities assume stable prices and no extra accrued debt, and are clearly labeled approximations, not executable orders or guaranteed fixes.
- If there is no borrowing debt, HF is \`null\`, not fake 999 or infinity. A malformed market ID or oracle call fails rather than inventing a reading.
- An actual liquidation might occur at HF 1 or less before an alert is processed. Monitoring is **not** protection or insurance.

## Four requirements

| Requirement | How demonstrated |
| --- | --- |
| Reads position collateral, debt and HF/equivalent on-chain | Real \`position\`, \`market\`, \`idToMarketParams\`, oracle \`price\`, same block and raw values, with computed estimated health |
| Configurable warning thresholds | UI takes warning and critical thresholds; verified server-side ordering \`1.0 <= critical < warning <= 5.0\` |
| At least one timestamped alert channel | Browser \`console.warn\` with UTC ISO 8601 timestamps, visible persistent-in-browser audit log, live alerts when health is below threshold. Simulated warning/critical buttons are **clearly marked simulated**, not presented as on-chain proof |
| Concrete action suggested for every alert | Calculate approximate loan repayment amount or added collateral to target configured warning + 0.2; never move funds |

## Reviewer walkthrough

1. Open the [public website](https://liquidation-watchdog.trantanlong2411.workers.dev/). The market and borrower are prefilled from verified live Pharos events.
2. Click **Check real position**. Inspect collateral (strUSD), debt (USDC), LLTV 86%, block, oracle, estimated health factor and source contracts.
3. If the borrower still has debt near liquidation, a **CRITICAL** or **LIQUIDATABLE** UTC alert will appear in the audit and in the browser developer console. If the position changed or closed, the app will report what the blockchain currently shows.
4. Edit warning/critical thresholds (e.g. 1.3/1.1, or 2.0/1.8) and rerun.
5. Click **Test warning (simulated)** and **Test critical (simulated)** to confirm channel formatting independent of the changing on-chain position. These tests are clearly distinguished from real alerts.
6. **Start 60s monitoring** while the tab stays open; optionally export the full live evidence JSON and alert history.
7. GitHub Actions independently calls the **deployed Worker** to verify the live borrower and recalculates its HF from raw on-chain values. Download \`pharos-liquidation-watchdog-live-proof\` from the successful Actions run.

## Safety and execution

This site has a strict RPC allowlist: \`eth_chainId\`, \`eth_blockNumber\`, \`eth_getBlockByNumber\`, \`eth_getCode\`, \`eth_call\`. It does not use public \`debug_traceTransaction\` or \`trace_filter\`, which Pharos planned to disable in November 2026. It cannot execute repayments, liquidations, withdrawals, or wallet signing.

The sample borrower is not controlled by this project. It is publicly observed for a test and should not be described as the user's own portfolio.

## Local tests

\`\`\`bash
npm install
npm test
npm run build
npx wrangler deploy
\`\`\`

[GitHub Actions live integration tests](https://github.com/trantanlong2411-droid/Liquidation-Watchdog/actions/workflows/verify.yml)
