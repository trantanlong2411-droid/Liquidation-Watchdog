# Operator verification — before submission

> **Pending user confirmation.** No original browser-exported user verification is stored in this repository yet. Passing CI by itself does not equal the user's manual acceptance.

This is the same evidence workflow used by the other Pharos projects `Yield-Optimizer` and `Portfolio-Assistant`: real deployed read, on-page user interaction, original JSON export, independent deterministic replay, then a `USER-PROOF.md` referencing the untouched file and the passing replay.

## How to perform the real check

Open **https://liquidation-watchdog.trantanlong2411.workers.dev/verify**

1. Press **Run live position check (1.3 / 1.1)**. Read chain 1672, current block, actual collateral, debt, indicative health factor, risk classification, provenance and recommended repay/add-collateral alternatives. If the public borrower now has no debt, it is **not** acceptable as remedy proof; use another actual nonzero-debt Pharos Morpho borrower.
2. Press **Run check with thresholds 2.0 / 1.8** and verify the second response reports changed thresholds and recalculated severity.
3. Press **Test simulated warning + UTC console**. Open browser developer tools (F12 → Console). Confirm the `SIMULATED_ALERT_ONLY_NOT_CHAIN_DATA` timestamp. If the real borrower has breached a threshold, inspect the separate genuine `LIVE_ONCHAIN` alert as well.
4. Inspect approximate remedies. Check the four on-screen boxes only if the observations are genuine. Press **Confirm my test and export original JSON**.
5. **Upload the original exported JSON into the conversation** for independent replay. Do not post your private keys or wallet recovery phrases. No wallet connection or transaction is needed.

## What happens after you provide the file

- Replay locally: `node scripts/verify-user-export.mjs path/to/your-file.json`.
- The script validates all four self-attested checkboxes, the two **actual API results** with separate thresholds, chain 1672, pinned block and contract provenance. It recomputes Morpho debt, health factor, classification and approximate remedies from each source's raw on-chain field values.
- A passing replay verifies consistency of the user-exported JSON with the application's equations. It does not cryptographically authenticate who pressed the buttons, the underlying RPC, or the freshness of the oracle.
- The original export can then be committed unchanged under `proof/` with a SHA-256 and its precise observations documented in `proof/USER-PROOF.md`. This is not to be created from historical CI data or a mock fixture.
- Only when the operator confirms actual function and the replay passes should the task be marked **ready for submission** and proof/repo/notes instructions be provided.

## CI proof is separate

The previously passing live [GitHub Actions checks](https://github.com/trantanlong2411-droid/Liquidation-Watchdog/actions) demonstrate connectivity and reproducible calculations, but are not user confirmation. Public sample borrower may repay, be liquidated, or experience stale stored interest. Browser monitoring is not a 24/7 alert service.

## Review checklist

| Arena criterion | What the operator should actually see |
| --- | --- |
| Collateral, debt, HF from chain | Real read with chain 1672, pinned block, oracle and core contract refs, nonzero borrowing position |
| Editable thresholds | The initial 1.3/1.1 result and a second live 2.0/1.8 result |
| Timestamped alert | Browser console shows clear UTC and simulated-vs-live origin |
| Action in every alert | Concrete approximate repay or collateral quantity; disclaimer that it may not guarantee safety |

This guide is a **request for validation**, not a claim that user acceptance already occurred.
