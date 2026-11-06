import { describe, expect, it } from "vitest";
import { analyzeRisk, RISK_FORMULA_VERSION } from "./risk";
import { valuePortfolio, type PriceInput } from "./valuation";
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

// The same reference portfolio as docs/calculations.md
function referenceValuation() {
  return valuePortfolio(
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
}

describe("analyzeRisk", () => {
  it("matches the hand-calculated allocation and concentration", () => {
    const report = analyzeRisk(referenceValuation());

    expect(report.totalValue).toBe("4284.33");
    expect(report.allocation).toEqual([
      { symbol: "MSFT", marketValue: "2085.50", weightPercent: "48.68" },
      { symbol: "AAPL", marketValue: "1894.20", weightPercent: "44.21" },
      { symbol: "NVDA", marketValue: "304.63", weightPercent: "7.11" },
    ]);
    expect(report.largestPosition).toEqual({ symbol: "MSFT", weightPercent: "48.68", aboveLimit: true });
    expect(report.excludedSymbols).toEqual(["TSLA"]);
  });

  it("matches the hand-calculated price-shock scenarios", () => {
    const report = analyzeRisk(referenceValuation());
    const byId = Object.fromEntries(report.scenarios.map((s) => [s.id, s]));

    expect(byId["all-down-20"]).toMatchObject({ valueAfter: "3427.46", change: "-856.87", changePercent: "-20.00" });
    expect(byId["all-down-10"]).toMatchObject({ valueAfter: "3855.89", change: "-428.44", changePercent: "-10.00" });
    expect(byId["all-up-10"]).toMatchObject({ valueAfter: "4712.76", change: "428.43", changePercent: "10.00" });
    expect(byId["largest-down-30"]).toMatchObject({
      affectedSymbols: ["MSFT"],
      valueAfter: "3658.68",
      change: "-625.65",
      changePercent: "-14.60",
    });
  });

  it("does not flag a position exactly at the limit", () => {
    const valuation = valuePortfolio(
      ["AAA", "BBB", "CCC", "DDD"].map((s) => holding(s, "1", "100.00")),
      Object.fromEntries(["AAA", "BBB", "CCC", "DDD"].map((s) => [s, price(s, "100")])),
      NOW
    );
    const report = analyzeRisk(valuation);
    expect(report.largestPosition).toEqual({ symbol: "AAA", weightPercent: "25.00", aboveLimit: false });
  });

  it("sorts positions with equal value by symbol", () => {
    const valuation = valuePortfolio(
      [holding("ZZZ", "1", "50.00"), holding("AAA", "1", "50.00")],
      { ZZZ: price("ZZZ", "50"), AAA: price("AAA", "50") },
      NOW
    );
    expect(analyzeRisk(valuation).allocation.map((row) => row.symbol)).toEqual(["AAA", "ZZZ"]);
  });

  it("handles an empty portfolio", () => {
    const report = analyzeRisk(valuePortfolio([], {}, NOW));
    expect(report.allocation).toEqual([]);
    expect(report.largestPosition).toBeNull();
    expect(report.scenarios.every((s) => s.valueAfter === "0.00" && s.changePercent === null)).toBe(true);
  });

  it("records its formula version and the valuation it was based on", () => {
    const report = analyzeRisk(referenceValuation());
    expect(report.formulaVersion).toBe(RISK_FORMULA_VERSION);
    expect(report.basedOn).toEqual({
      valuationFormulaVersion: "valuation-v1",
      valuationCalculatedAt: "2026-11-06T15:00:00.000Z",
    });
  });

  it("gives the same result for the same inputs", () => {
    expect(analyzeRisk(referenceValuation())).toEqual(analyzeRisk(referenceValuation()));
  });
});

