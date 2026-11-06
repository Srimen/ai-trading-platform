# Portfolio calculations

Formula version: **valuation-v1** (`lib/portfolio/valuation.ts`)

## Formulas

| Value | Formula |
|-------|---------|
| Market value | quantity × price, rounded to cents |
| Unrealized P/L | market value − cost basis |
| Unrealized P/L % | unrealized P/L ÷ cost basis × 100, rounded to 2 decimals (empty when cost basis is 0) |
| Portfolio value | sum of market values for positions with a price |
| Portfolio P/L | portfolio value − cost basis of those same positions |

## Rules

- **Exact decimals.** All math uses `decimal.js`, never JavaScript floating-point numbers.
- **Half-up rounding** to cents (1.005 becomes 1.01).
- **Rows add up.** Each position is rounded first, so the totals always equal the sum of the rows.
- **Missing prices** are left out of the totals and listed by symbol.
- **Stale prices** are used, but the result is flagged as incomplete.
- Every result records its formula version and calculation time.

## Reference portfolio (calculated by hand)

| Symbol | Quantity | Cost basis | Price | Market value | Unrealized P/L | P/L % |
|--------|----------|------------|-------|--------------|----------------|-------|
| AAPL | 10 | 1,500.00 | 189.42 | 10 × 189.42 = **1,894.20** | 1,894.20 − 1,500.00 = **394.20** | 394.20 ÷ 1,500.00 = **26.28%** |
| MSFT | 5 | 1,800.00 | 417.10 | 5 × 417.10 = **2,085.50** | 2,085.50 − 1,800.00 = **285.50** | 285.50 ÷ 1,800.00 = **15.86%** |
| NVDA (stale) | 2.5 | 400.00 | 121.85 | 2.5 × 121.85 = 304.625 → **304.63** | 304.63 − 400.00 = **−95.37** | −95.37 ÷ 400.00 = **−23.84%** |
| TSLA | 3 | 600.00 | none | left out | left out | left out |

**Totals (priced positions only):**

- Portfolio value: 1,894.20 + 2,085.50 + 304.63 = **4,284.33**
- Cost basis: 1,500.00 + 1,800.00 + 400.00 = **3,700.00**
- Unrealized P/L: 4,284.33 − 3,700.00 = **584.33**
- Unrealized P/L %: 584.33 ÷ 3,700.00 = **15.79%**
- Flags: TSLA has no price, NVDA's price is stale, so the result is **incomplete**.

The test `matches the hand-calculated reference portfolio` in `lib/portfolio/valuation.test.ts` checks every number above.

