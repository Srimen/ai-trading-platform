import { getHoldings } from "@/lib/holdings";
import { fixtureAdapter } from "@/lib/market/fixture-adapter";
import { getQuoteStatus } from "@/lib/market/staleness";
import { valuePortfolio, type PriceInput, type PortfolioValuation } from "./valuation";

// Loads the signed-in user's holdings, looks up a price for each one,
// and runs the valuation. All prices are checked against the same moment in time.
export async function getPortfolioValuation(): Promise<PortfolioValuation> {
  const holdings = await getHoldings();
  const now = new Date();

  const entries = await Promise.all(
    holdings.map(async (holding) => {
      const quote = await fixtureAdapter.getQuote(holding.symbol);
      const { status } = getQuoteStatus(quote, now);
      return [holding.symbol, { quote, status }] as const;
    })
  );

  const prices: Record<string, PriceInput> = Object.fromEntries(entries);
  return valuePortfolio(holdings, prices, now);
}

