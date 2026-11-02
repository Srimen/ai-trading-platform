import type { Quote } from "@/lib/types";

// Every market data provider (fixtures now, a real API later) implements this.
export interface MarketDataAdapter {
  name: string;
  getQuote(symbol: string): Promise<Quote | null>;
}

