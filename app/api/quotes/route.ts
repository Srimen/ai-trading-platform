import { NextResponse } from "next/server";
import { getMarketDataAdapter } from "@/lib/market";
import { getQuoteStatus } from "@/lib/market/staleness";
import type { WatchlistItem } from "@/lib/types";

const SYMBOL_PATTERN = /^[A-Z]{1,5}$/;
const DEFAULT_WATCHLIST = ["AAPL", "MSFT", "NVDA", "TSLA"];
const MAX_SYMBOLS = 20;

export async function GET(request: Request) {
  const param = new URL(request.url).searchParams.get("symbols");
  const symbols = param
    ? param.split(",").map((s) => s.trim().toUpperCase()).filter(Boolean)
    : DEFAULT_WATCHLIST;

  if (symbols.length === 0 || symbols.length > MAX_SYMBOLS) {
    return NextResponse.json(
      { error: `Provide between 1 and ${MAX_SYMBOLS} symbols.` },
      { status: 400 }
    );
  }

  const invalid = symbols.filter((s) => !SYMBOL_PATTERN.test(s));
  if (invalid.length > 0) {
    return NextResponse.json(
      { error: `Invalid symbols: ${invalid.join(", ")}. Use 1 to 5 letters.` },
      { status: 400 }
    );
  }

  const adapter = getMarketDataAdapter();
  const items: WatchlistItem[] = await Promise.all(
    symbols.map(async (symbol) => {
      const quote = await adapter.getQuote(symbol);
      return { symbol, quote, ...getQuoteStatus(quote) };
    })
  );

  return NextResponse.json({
    items,
    source: adapter.name,
    generatedAt: new Date().toISOString(),
  });
}

