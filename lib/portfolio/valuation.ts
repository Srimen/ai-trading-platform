import Decimal from "decimal.js";
import type { Holding, Quote, QuoteStatus } from "@/lib/types";

// Change this whenever a formula or rounding rule changes, so every result can be traced.
export const VALUATION_FORMULA_VERSION = "valuation-v1";

// Exact decimal math. Money rounds half-up to cents, like a typical brokerage statement.
const Money = Decimal.clone({ precision: 40, rounding: Decimal.ROUND_HALF_UP });

export interface PriceInput {
  quote: Quote | null;
  status: QuoteStatus;
}

export interface PositionValuation {
  symbol: string;
  quantity: string;
  costBasis: string;
  price: string | null;
  priceTime: string | null;
  priceSource: string | null;
  priceStatus: QuoteStatus;
  marketValue: string | null; // quantity × price, rounded to cents
  unrealizedPnl: string | null; // market value − cost basis
  unrealizedPnlPercent: string | null; // P/L ÷ cost basis × 100; null when cost basis is 0
}

export interface PortfolioValuation {
  formulaVersion: string;
  calculatedAt: string;
  currency: "USD";
  positions: PositionValuation[];
  pricedValue: string; // sum of market values for positions that have a price
  pricedCostBasis: string; // sum of cost basis for those same positions
  unrealizedPnl: string;
  unrealizedPnlPercent: string | null;
  unpricedSymbols: string[]; // no price, so left out of totals
  staleSymbols: string[]; // priced, but the price is old
  isComplete: boolean; // true only when every position has a fresh price
}

function percentOf(part: Decimal, whole: Decimal): string | null {
  if (whole.isZero()) return null;
  return part.div(whole).times(100).toFixed(2);
}

export function valuePortfolio(
  holdings: Holding[],
  prices: Record<string, PriceInput | undefined>,
  calculatedAt: Date
): PortfolioValuation {
  let pricedValue = new Money(0);
  let pricedCost = new Money(0);
  const unpricedSymbols: string[] = [];
  const staleSymbols: string[] = [];

  const positions = holdings.map((holding): PositionValuation => {
    const input = prices[holding.symbol];
    const quote = input && input.status !== "unavailable" ? input.quote : null;

    if (!quote || !input) {
      unpricedSymbols.push(holding.symbol);
      return {
        symbol: holding.symbol,
        quantity: holding.quantity,
        costBasis: holding.costBasis,
        price: null,
        priceTime: null,
        priceSource: null,
        priceStatus: "unavailable",
        marketValue: null,
        unrealizedPnl: null,
        unrealizedPnlPercent: null,
      };
    }

    if (input.status === "stale") staleSymbols.push(holding.symbol);

    const cost = new Money(holding.costBasis);
    // Each position is rounded to cents, so the totals always equal the sum of the rows
    const marketValue = new Money(holding.quantity).times(quote.price).toDecimalPlaces(2);
    const pnl = marketValue.minus(cost);

    pricedValue = pricedValue.plus(marketValue);
    pricedCost = pricedCost.plus(cost);

    return {
      symbol: holding.symbol,
      quantity: holding.quantity,
      costBasis: holding.costBasis,
      price: quote.price,
      priceTime: quote.eventTime,
      priceSource: quote.source,
      priceStatus: input.status,
      marketValue: marketValue.toFixed(2),
      unrealizedPnl: pnl.toFixed(2),
      unrealizedPnlPercent: percentOf(pnl, cost),
    };
  });

  const totalPnl = pricedValue.minus(pricedCost);

  return {
    formulaVersion: VALUATION_FORMULA_VERSION,
    calculatedAt: calculatedAt.toISOString(),
    currency: "USD",
    positions,
    pricedValue: pricedValue.toFixed(2),
    pricedCostBasis: pricedCost.toFixed(2),
    unrealizedPnl: totalPnl.toFixed(2),
    unrealizedPnlPercent: percentOf(totalPnl, pricedCost),
    unpricedSymbols,
    staleSymbols,
    isComplete: unpricedSymbols.length === 0 && staleSymbols.length === 0,
  };
}
