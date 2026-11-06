import { cache } from "react";
import { getHoldings } from "@/lib/holdings";
import { getMarketDataAdapter } from "@/lib/market";
import { getQuoteStatus } from "@/lib/market/staleness";
import { valuePortfolio, type PriceInput, type PortfolioValuation } from "./valuation";

// Loads the signed-in user's holdings, looks up a price for each one,
// and runs the valuation. All prices are checked against the same moment in time.
// cache() runs this once per page load, so every panel uses the exact same numbers.
export const getPortfolioValuation = cache(async (): Promise<PortfolioValuation> => {
  const holdings = await getHoldings();
  const adapter = getMarketDataAdapter();

  const entries = await Promise.all(
    holdings.map(async (holding) => [holding.symbol, await adapter.getQuote(holding.symbol)] as const)
  );

  // Check staleness after all prices arrive, against one shared moment
  const now = new Date();
  const prices: Record<string, PriceInput> = Object.fromEntries(
    entries.map(([symbol, quote]) => [symbol, { quote, status: getQuoteStatus(quote, now).status }])
  );

  return valuePortfolio(holdings, prices, now);
}); 

