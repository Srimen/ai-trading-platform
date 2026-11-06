import { describe, expect, it } from "vitest";
import { VALUATION_FORMULA_VERSION, valuePortfolio, type PriceInput } from "./valuation";
import type { Holding, QuoteStatus } from "@/lib/types";

const NOW = new Date("2026-11-06T15:00:00.000Z");

function holding(symbol: string, quantity: string, costBasis: string): Holding {
  return { symbol, quantity, costBasis, currency: "USD" };
}

function price(symbol: string, value: string, status: QuoteStatus = "fresh"): PriceInput {
  return {
    status,
    quote: {
      symbol,
      price: value,
      currency: "USD",
      source: "Test fixture",
      sourceType: "fixture",
      eventTime: NOW.toISOString(),
      receivedAt: NOW.toISOString(),
    },
  };
}

describe("valuePortfolio", () => {
  // Reference portfolio, calculated by hand in docs/calculations.md
  it("matches the hand-calculated reference portfolio", () => {
    const result = valuePortfolio(
      [
        holding("AAPL", "10", "1500.00"),
        holding("MSFT", "5", "1800.00"),
        holding("NVDA", "2.5", "400.00"),
        holding("TSLA", "3", "600.00"),
      ],
      {
        AAPL: price("AAPL", "189.42"),
        MSFT: price("MSFT", "417.10"),
        NVDA: price("NVDA", "121.85", "stale"),
        TSLA: { quote: null, status: "unavailable" },
      },
      NOW
    );

    const bySymbol = Object.fromEntries(result.positions.map((p) => [p.symbol, p]));

    expect(bySymbol.AAPL).toMatchObject({ marketValue: "1894.20", unrealizedPnl: "394.20", unrealizedPnlPercent: "26.28" });
    expect(bySymbol.MSFT).toMatchObject({ marketValue: "2085.50", unrealizedPnl: "285.50", unrealizedPnlPercent: "15.86" });
    expect(bySymbol.NVDA).toMatchObject({ marketValue: "304.63", unrealizedPnl: "-95.37", unrealizedPnlPercent: "-23.84", priceStatus: "stale" });
    expect(bySymbol.TSLA).toMatchObject({ marketValue: null, unrealizedPnl: null, priceStatus: "unavailable" });

    expect(result.pricedValue).toBe("4284.33");
    expect(result.pricedCostBasis).toBe("3700.00");
    expect(result.unrealizedPnl).toBe("584.33");
    expect(result.unrealizedPnlPercent).toBe("15.79");
    expect(result.unpricedSymbols).toEqual(["TSLA"]);
    expect(result.staleSymbols).toEqual(["NVDA"]);
    expect(result.isComplete).toBe(false);
  });

  it("avoids floating-point rounding errors", () => {
    // In plain JavaScript, (1.005).toFixed(2) gives "1.00". The correct half-up result is "1.01".
    const result = valuePortfolio([holding("ABC", "1", "1.00")], { ABC: price("ABC", "1.005") }, NOW);
    expect(result.positions[0].marketValue).toBe("1.01");
  });

  it("treats a symbol with no price entry as unpriced", () => {
    const result = valuePortfolio([holding("AAPL", "1", "100.00")], {}, NOW);
    expect(result.unpricedSymbols).toEqual(["AAPL"]);
    expect(result.pricedValue).toBe("0.00");
    expect(result.isComplete).toBe(false);
  });

  it("leaves P/L percent empty when the cost basis is zero", () => {
    const result = valuePortfolio([holding("GIFT", "2", "0.00")], { GIFT: price("GIFT", "50") }, NOW);
    expect(result.positions[0].unrealizedPnl).toBe("100.00");
    expect(result.positions[0].unrealizedPnlPercent).toBeNull();
    expect(result.unrealizedPnlPercent).toBeNull();
  });

  it("handles an empty portfolio", () => {
    const result = valuePortfolio([], {}, NOW);
    expect(result.pricedValue).toBe("0.00");
    expect(result.unrealizedPnl).toBe("0.00");
    expect(result.unrealizedPnlPercent).toBeNull();
    expect(result.isComplete).toBe(true);
  });

  it("records the formula version and calculation time", () => {
    const result = valuePortfolio([], {}, NOW);
    expect(result.formulaVersion).toBe(VALUATION_FORMULA_VERSION);
    expect(result.calculatedAt).toBe("2026-11-06T15:00:00.000Z");
  });

  it("gives the same result for the same inputs", () => {
    const run = () =>
      valuePortfolio([holding("AAPL", "10", "1500.00")], { AAPL: price("AAPL", "189.42") }, NOW);
    expect(run()).toEqual(run());
  });
});

