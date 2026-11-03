# Liquidation Watchdog — real Pharos liquidation risk proof

Verified against **live Pharos Mainnet chain ID 1672** on **3 November 2026** using the deployed Cloudflare Worker.

- [Public website](https://liquidation-watchdog.trantanlong2411.workers.dev/)
- [Passing GitHub Actions run 41632625949](https://github.com/trantanlong2411-droid/Liquidation-Watchdog/actions/runs/41632625949)
- [Machine-readable verification summary](./verified-run.json)
- [Live full JSON artifact](https://github.com/trantanlong2411-droid/Liquidation-Watchdog/actions/runs/41632625949) named `pharos-liquidation-watchdog-live-proof`
- [On-chain read engine](../src/engine.mjs)
- [CI re-calculation test](../scripts/smoke-deployed.mjs)

## What was actually observed on-chain

- Network: Pharos Mainnet `1672`, block `22010881`.
- Morpho Blue core: `0x18573fA18fd17dDfD790B4a5B5b2977aad3b4Efb`.
- Morpho market ID: `0x4cbedaf680d648926bafbce7d874ce717a1b3232ea7084c7c3593aa42bb429cd`.
- Example borrower: `0x6cC38cd9741CDcdCD6FFC05b527779596d140e29`, an unrelated **public third-party** position found by an actual indexed Borrow event query.
- Collateral: `90050.87952 strUSD`.
- Estimated debt using the stored market borrow totals and borrow shares: `79500.059194 USDC`.
- Market liquidation LLTV: `86%`.
- Indicative health factor: `1.00931578836241036`.
- Observed oracle price in Morpho scale: `1036115352141062678000000`.
- At this read the market's last stored interest update was already **702 seconds old**, so the estimate might understate actual accrued debt.

The on-chain contract source for the formula and position is documented in [Morpho Blue](https://docs.morpho.org/developers/contracts/blue/), and the [liquidation rule](https://docs.morpho.org/developers/borrow/concepts/liquidation/) considers a health factor at or below 1 eligible for liquidation. No current price feed timestamp was verified by this app.

## Actual alert and concrete alternatives

Configured thresholds were WARNING `1.3` and CRITICAL `1.1`.

The deployed integration test produced this real live-alert entry, with UTC timestamp:

```
[2026-11-03T12:04:35.044Z] [LIVE_ONCHAIN] [CRITICAL]
Health 1.00931578836241036
Critical estimated health. Verify actual market and oracle status,
then consider repaying debt or adding collateral.
```

For a hypothetical target health factor of `1.5`, the app calculated two **alternative** remedial quantities:

- Repay approximately `26006.282581 USDC`, **or**
- Add approximately `43778.711612382811458598 strUSD` collateral.

These are rough risk-mitigation estimates using unchanged oracle prices and stored debt, **not a guarantee**, and the application does not prepare or send transactions.

The CI performed a second live check with different warning/critical thresholds `2.0 / 1.8`, confirming the backend uses user-configured values rather than a hard-coded alert boundary.

## Task requirement verification

| Requirement | Evidence |
| --- | --- |
| Read collateral, debt and health from chain | Actual Morpho `position`, `market`, `idToMarketParams`, oracle `price()` and token decimals, pinned to one Pharos block; re-calculated HF independently in live CI |
| Configurable warning thresholds | UI fields WARNING=1.3, CRITICAL=1.1; actual secondary call with 2.0 / 1.8; strict ordering validation |
| Sends timestamped alerts through one channel | Actual `[LIVE_ONCHAIN] [CRITICAL]` UTC console alert, plus browser-local log. Warning/critical simulation controls are separately labeled `SIMULATED` |
| Concrete action per alert | Approximate repayment or added collateral computed using live position, LLTV and oracle, with target HF and clear uncertainty |

## Instructions for reviewer

1. Open the [public demo](https://liquidation-watchdog.trantanlong2411.workers.dev/), which is prefilled with the verified public borrower and market.
2. Click **Check real position**. Inspect live collateral, debt, LLTV, HF estimate, status, on-chain block and source contracts.
3. Open browser developer console. At a warning/critical level, you will see a timestamped `[LIVE_ONCHAIN]` message; a copy also appears under **Alert console (UTC)**.
4. Edit thresholds and repeat to verify configurable behavior. Click **Test warning (simulated)** or **Test critical (simulated)** to validate notifications even if the borrower's position has changed.
5. Click **Start 60s monitoring**, keep the browser tab open, and observe recurring checks. The app does not send notifications when the page is closed.
6. Download JSON via **Export JSON evidence** and compare with the independent [passing CI run](https://github.com/trantanlong2411-droid/Liquidation-Watchdog/actions/runs/41632625949).

## Limitations and honesty

- **Not exact current borrow health**: Morpho stores borrow shares and totals from its last interest accrual; this model does not simulate accrued interest after `market.lastUpdate`. At the verified live check, the totals were 702 seconds old. Near liquidation, a borrower could already be liquidatable.
- **No oracle update-time validation**: `price()` returns a value without a feed update timestamp. External verification is necessary before financial action.
- **No 24/7 notifications**: browser polling is only active when the tab remains open. There is no Telegram, Discord or scheduled Worker Cron deployment.
- **No funded demonstration ownership**: the borrower is a publicly observed unrelated on-chain address, not the submitter's loan.
- **No execution**: the service uses an allowlist of read-only methods. There is no wallet signature or private key handling, and no transaction broadcast.

The app should be assessed as an informative liquidation-risk monitoring prototype, not a custody, insurance or guaranteed emergency-response service.
