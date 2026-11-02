import type { Quote } from "@/lib/types";
import type { MarketDataAdapter } from "./adapter";

// TEST DATA ONLY. Made-up prices used until a real provider is connected.
// ageSeconds sets how old each quote is, so we can test stale-data handling.
const FIXTURES: Record<string, { price: string; ageSeconds: number }> = {
  AAPL: { price: "189.42", ageSeconds: 5 },
  MSFT: { price: "417.10", ageSeconds: 20 },
  NVDA: { price: "121.85", ageSeconds: 600 }, // deliberately stale
  // TSLA is missing on purpose, to test the "unavailable" state
};

export const fixtureAdapter: MarketDataAdapter = {
  name: "Test fixture",

  async getQuote(symbol) {
    const fixture = FIXTURES[symbol];
    if (!fixture) return null;

    const now = Date.now();
    return {
      symbol,
      price: fixture.price,
      currency: "USD",
      source: "Test fixture",
      sourceType: "fixture",
      eventTime: new Date(now - fixture.ageSeconds * 1000).toISOString(),
      receivedAt: new Date(now).toISOString(),
    };
  },
};

