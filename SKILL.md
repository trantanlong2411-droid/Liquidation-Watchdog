---
name: pharos-liquidation-watchdog
description: Inspect a real Morpho Blue borrowing position on Pharos Mainnet, classify indicative liquidation risk using configurable thresholds, emit UTC timestamped browser alerts and suggest approximate repay/add-collateral alternatives. Read-only; no signing.
---

# Liquidation Watchdog — Pharos Agent Arena

1. Accept a public borrower address, Morpho Blue market ID and two configurable health-factor thresholds. Never request wallet secrets or signing.
2. Verify Pharos Pacific Mainnet chain ID 1672. Pin the latest block number and timestamp.
3. Verify Morpho Blue core bytecode. Read `position(bytes32,address)`, `market(bytes32)` and `idToMarketParams(bytes32)` at the exact same block. Recompute and check the market ID from parameters.
4. Read the market oracle `price()` and token `decimals()` and `symbol()`, also pinned to the same block. Missing contract, invalid market ID or oracle errors must fail without inventing a result.
5. Calculate approximate borrowing debt from borrow shares using Morpho's virtual-asset/share accounting and round upward. Calculate indicative health factor from loan-token collateral value and LLTV. Mark missing debt as NO_DEBT instead of infinity; label unaccrued interest and unverified oracle freshness.
6. Classify `WARNING`, `CRITICAL`, `LIQUIDATABLE` with editable thresholds (defaults 1.30 / 1.10), and `STALE_INTEREST` when relevant. Emit UTC timestamped `LIVE_ONCHAIN` browser-console alerts and locally displayed audit; clearly separate `SIMULATED_ALERT_ONLY_NOT_CHAIN_DATA` tests.
7. For a real position with nonzero debt, compute approximate alternatives: repay a quantity of loan token **or** top up collateral to reach warning threshold + 0.2, assuming unchanged oracle prices. This is not a transaction quote or guarantee.
8. For human review, open `/verify`: user runs live read with default thresholds, repeats with 2.0 / 1.8, observes timestamped console alert, inspects remedies and explicitly checks four manual confirmations. Export **unaltered** `liquidation-watchdog-user-verification-*.json` locally.
9. Run `node scripts/verify-user-export.mjs path/to/file.json` to independently recompute health, debt, severity, alternative amounts and contract/block consistency from the exported data. User export is self-attested browser evidence, **not** a cryptographic RPC or wallet signature.
10. The primary reviewer proof is independently demonstrated through deployed live on-chain CI and the public /proof page; separate user acceptance is optional. If the operator additionally supplies an original browser JSON export and replay succeeds, archive it unchanged under `proof/` with its SHA-256 and create `proof/USER-PROOF.md`. Never claim user confirmation or fabricate user-generated evidence.

Safe read-only workflow; 60-second auto-refresh only operates while the browser is open, not a server-side continuous notification service.