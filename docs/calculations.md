# Portfolio calculations

| Engine | Formula version | Code |
|--------|-----------------|------|
| Valuation | **valuation-v1** | `lib/portfolio/valuation.ts` |
| Risk | **risk-v1** | `lib/portfolio/risk.ts` |

## Rules for all calculations

- **Exact decimals.** All math uses `decimal.js`, never JavaScript floating-point numbers.
- **Half-up rounding** to cents (1.005 becomes 1.01).
- **Missing prices** are left out and listed by symbol.
- **Stale prices** are used, but the result is flagged as incomplete.
- Every result records its formula version and the inputs it was based on, so it can be reproduced.

## Valuation formulas

| Value | Formula |
|-------|---------|
| Market value | quantity × price, rounded to cents |
| Unrealized P/L | market value − cost basis |
| Unrealized P/L % | unrealized P/L ÷ cost basis × 100, rounded to 2 decimals (empty when cost basis is 0) |
| Portfolio value | sum of market values for positions with a price |
| Portfolio P/L | portfolio value − cost basis of those same positions |

Each position is rounded first, so the totals always equal the sum of the rows.

## Risk formulas

| Value | Formula |
|-------|---------|
| Allocation (weight) | position market value ÷ portfolio value × 100, rounded to 2 decimals |
| Largest position | the position with the highest weight (ties sorted by symbol) |
| Concentration flag | largest weight is **more than 25%** (compared before rounding) |
| Shocked position value | quantity × price × (1 + shock ÷ 100), rounded to cents |
| Scenario change | value after shock − current portfolio value |
| Scenario change % | scenario change ÷ current portfolio value × 100, rounded to 2 decimals |

Positions not affected by a scenario keep their current market value. Rounded weights may not add up to exactly 100.00%.

**Scenarios (risk-v1):**

- All prices fall 20%
- All prices fall 10%
- All prices rise 10%
- Largest position falls 30%

The 25% concentration limit is a common rule of thumb, not financial advice.

## Reference portfolio (calculated by hand)

### Valuation

| Symbol | Quantity | Cost basis | Price | Market value | Unrealized P/L | P/L % |
|--------|----------|------------|-------|--------------|----------------|-------|
| AAPL | 10 | 1,500.00 | 189.42 | 10 × 189.42 = **1,894.20** | 1,894.20 − 1,500.00 = **394.20** | 394.20 ÷ 1,500.00 = **26.28%** |
| MSFT | 5 | 1,800.00 | 417.10 | 5 × 417.10 = **2,085.50** | 2,085.50 − 1,800.00 = **285.50** | 285.50 ÷ 1,800.00 = **15.86%** |
| NVDA (stale) | 2.5 | 400.00 | 121.85 | 2.5 × 121.85 = 304.625 → **304.63** | 304.63 − 400.00 = **−95.37** | −95.37 ÷ 400.00 = **−23.84%** |
| TSLA | 3 | 600.00 | none | left out | left out | left out |

- Portfolio value: 1,894.20 + 2,085.50 + 304.63 = **4,284.33**
- Cost basis: 1,500.00 + 1,800.00 + 400.00 = **3,700.00**
- Unrealized P/L: 4,284.33 − 3,700.00 = **584.33** (584.33 ÷ 3,700.00 = **15.79%**)
- Flags: TSLA has no price and NVDA's price is stale, so the result is **incomplete**.

### Allocation and concentration

| Symbol | Market value | Weight |
|--------|--------------|--------|
| MSFT | 2,085.50 | 2,085.50 ÷ 4,284.33 = **48.68%** |
| AAPL | 1,894.20 | 1,894.20 ÷ 4,284.33 = **44.21%** |
| NVDA | 304.63 | 304.63 ÷ 4,284.33 = **7.11%** |

Largest position: **MSFT at 48.68%**, which is above the 25% limit, so it's **flagged**.

### Scenarios

| Scenario | Shocked values | Value after | Change | Change % |
|----------|----------------|-------------|--------|----------|
| All prices fall 20% | AAPL 1,515.36 + MSFT 1,668.40 + NVDA 243.70 | **3,427.46** | **−856.87** | **−20.00%** |
| All prices fall 10% | AAPL 1,704.78 + MSFT 1,876.95 + NVDA 274.16 | **3,855.89** | **−428.44** | **−10.00%** |
| All prices rise 10% | AAPL 2,083.62 + MSFT 2,294.05 + NVDA 335.09 | **4,712.76** | **+428.43** | **+10.00%** |
| Largest (MSFT) falls 30% | AAPL 1,894.20 + MSFT 1,459.85 + NVDA 304.63 | **3,658.68** | **−625.65** | **−14.60%** |

NVDA's shocked values come from 304.625 × 0.9 = 274.1625 → 274.16 and 304.625 × 1.1 = 335.0875 → 335.09. That's why the −10% and +10% changes differ by a cent.

The tests in `lib/portfolio/valuation.test.ts` and `lib/portfolio/risk.test.ts` check every number above.

