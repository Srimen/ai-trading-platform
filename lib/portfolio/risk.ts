import Decimal from "decimal.js";
import type { PortfolioValuation } from "./valuation";

// Change this whenever a formula, threshold, or rounding rule changes.
export const RISK_FORMULA_VERSION = "risk-v1";

// A single position above this share of the portfolio is flagged as concentrated.
// A common rule of thumb, not financial advice.
export const CONCENTRATION_LIMIT_PERCENT = "25";

const Money = Decimal.clone({ precision: 40, rounding: Decimal.ROUND_HALF_UP });

export interface ScenarioDefinition {
  id: string;
  label: string;
  shockPercent: string; // e.g. "-20" means prices fall 20%
  appliesTo: "all" | "largest";
}

export const DEFAULT_SCENARIOS: ScenarioDefinition[] = [
  { id: "all-down-20", label: "All prices fall 20%", shockPercent: "-20", appliesTo: "all" },
  { id: "all-down-10", label: "All prices fall 10%", shockPercent: "-10", appliesTo: "all" },
  { id: "all-up-10", label: "All prices rise 10%", shockPercent: "10", appliesTo: "all" },
  { id: "largest-down-30", label: "Largest position falls 30%", shockPercent: "-30", appliesTo: "largest" },
];

export interface AllocationRow {
  symbol: string;
  marketValue: string;
  weightPercent: string; // share of the priced portfolio, rounded to 2 decimals
}

export interface ScenarioResult extends ScenarioDefinition {
  affectedSymbols: string[];
  valueAfter: string;
  change: string;
  changePercent: string | null; // null when the portfolio is worth 0
}

export interface RiskReport {
  formulaVersion: string;
  basedOn: { valuationFormulaVersion: string; valuationCalculatedAt: string };
  totalValue: string;
  allocation: AllocationRow[]; // largest first; ties sorted by symbol
  largestPosition: { symbol: string; weightPercent: string; aboveLimit: boolean } | null;
  concentrationLimitPercent: string;
  scenarios: ScenarioResult[];
  excludedSymbols: string[]; // no price, so left out of every calculation
}

export function analyzeRisk(
  valuation: PortfolioValuation,
  scenarios: ScenarioDefinition[] = DEFAULT_SCENARIOS
): RiskReport {
  // Only positions with a price can be measured
  const priced = valuation.positions.flatMap((position) =>
    position.marketValue !== null && position.price !== null
      ? [
          {
            symbol: position.symbol,
            quantity: new Money(position.quantity),
            price: new Money(position.price),
            value: new Money(position.marketValue),
          },
        ]
      : []
  );
  const excludedSymbols = valuation.positions
    .filter((position) => position.marketValue === null)
    .map((position) => position.symbol);

  const total = priced.reduce((sum, position) => sum.plus(position.value), new Money(0));

  // Allocation: market value ÷ total value × 100
  const allocation = priced
    .map((position) => ({
      symbol: position.symbol,
      value: position.value,
      weight: total.isZero() ? new Money(0) : position.value.div(total).times(100),
    }))
    .sort((a, b) => b.value.comparedTo(a.value) || a.symbol.localeCompare(b.symbol));

  // Concentration: the largest position, compared with the limit before rounding
  const largest = allocation[0];
  const largestPosition =
    largest && !total.isZero()
      ? {
          symbol: largest.symbol,
          weightPercent: largest.weight.toFixed(2),
          aboveLimit: largest.weight.greaterThan(CONCENTRATION_LIMIT_PERCENT),
        }
      : null;

  // Scenarios: shocked value = quantity × price × (1 + shock ÷ 100), rounded to cents
  const scenarioResults = scenarios.map((scenario): ScenarioResult => {
    const factor = new Money(1).plus(new Money(scenario.shockPercent).div(100));
    const affectedSymbols =
      scenario.appliesTo === "all"
        ? priced.map((position) => position.symbol)
        : largest
          ? [largest.symbol]
          : [];

    const valueAfter = priced.reduce((sum, position) => {
      const shocked = affectedSymbols.includes(position.symbol)
        ? position.quantity.times(position.price).times(factor).toDecimalPlaces(2)
        : position.value;
      return sum.plus(shocked);
    }, new Money(0));

    const change = valueAfter.minus(total);

    return {
      ...scenario,
      affectedSymbols,
      valueAfter: valueAfter.toFixed(2),
      change: change.toFixed(2),
      changePercent: total.isZero() ? null : change.div(total).times(100).toFixed(2),
    };
  });

  return {
    formulaVersion: RISK_FORMULA_VERSION,
    basedOn: {
      valuationFormulaVersion: valuation.formulaVersion,
      valuationCalculatedAt: valuation.calculatedAt,
    },
    totalValue: total.toFixed(2),
    allocation: allocation.map((row) => ({
      symbol: row.symbol,
      marketValue: row.value.toFixed(2),
      weightPercent: row.weight.toFixed(2),
    })),
    largestPosition,
    concentrationLimitPercent: CONCENTRATION_LIMIT_PERCENT,
    scenarios: scenarioResults,
    excludedSymbols,
  };
}

