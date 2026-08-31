# Lump Sum Trust Group Modeler — simplified trustee logic

Date: 2026-07-25

## Requirements

| ID | Requirement |
|----|-------------|
| R1 | At each 21, recalc from actual pot balance and remaining children only. |
| R2 | Real dollars = purchasing power at this 21 (not month 0). |
| R3 | Weight for child turning 21 today = 1; younger kids = 1 ÷ real growth to their 21. |
| R4 | T = pot ÷ sum(weights); pay T nominal to today’s child; reinvest remainder. |
| R5 | Policy CPI and market = trailing ~10-year lookbacks (defaults 3.2% / 10.3%). |
| R6 | Trustee worksheet in docs; modeler mirrors the same steps. |

## Wave 1 — Algorithm

- [x] Replace month-0 PV weights with anchor-at-this-21 slice weights
- [x] Payout nominal = T at current 21; payoutReal = T (same ruler)
- Verification: `npm test` — maturing child weight 1; payout equals T

## Wave 2 — Docs and UI

- [x] Rewrite maturity-calculation.md and description.txt
- [x] Update render copy, hints (10-year lookback), payout table labels
- Verification: read results table — “Equal slice at this 21” column

## Wave 3 — Run

- [x] `npm run build` in app; `npm run dev` at repo root
- Verification: open `/lump-sum-trust-group-modeler/`

## Notes

- Diverges from Lump-Sum Pot Share Calculator (month-0 real). Intentional.
- Later maturities may show different T_k (each in that 21’s dollars).
