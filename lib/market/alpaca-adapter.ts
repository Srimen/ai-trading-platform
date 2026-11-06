import type { Quote } from "@/lib/types";
import type { MarketDataAdapter } from "./adapter";

// Server-only: this file reads secret API keys and must never run in the browser.

const DATA_URL = "https://data.alpaca.markets/v2/stocks";
const SOURCE = "Alpaca (IEX)";
const TIMEOUT_MS = 5000;

interface LatestTradeResponse {
  trade?: { t?: string; p?: number };
}

// Alpaca timestamps can have 9 decimal places; JavaScript dates support 3
function normalizeTime(value: string) {
  return new Date(value.replace(/(\.\d{3})\d+/, "$1")).toISOString();
}

export function createAlpacaAdapter(keyId: string, secretKey: string): MarketDataAdapter {
  return {
    name: SOURCE,

    async getQuote(symbol) {
      try {
        const res = await fetch(`${DATA_URL}/${encodeURIComponent(symbol)}/trades/latest?feed=iex`, {
          headers: {
            "APCA-API-KEY-ID": keyId,
            "APCA-API-SECRET-KEY": secretKey,
          },
          cache: "no-store",
          signal: AbortSignal.timeout(TIMEOUT_MS),
        });

        if (!res.ok) {
          console.error(`Alpaca quote for ${symbol} failed with status ${res.status}`);
          return null;
        }

        const data = (await res.json()) as LatestTradeResponse;
        const trade = data.trade;
        if (!trade || typeof trade.p !== "number" || !trade.t) return null;

        return {
          symbol,
          price: String(trade.p),
          currency: "USD",
          source: SOURCE,
          sourceType: "live",
          eventTime: normalizeTime(trade.t), // when the trade actually happened
          receivedAt: new Date().toISOString(), // when our server received it
        };
      } catch (err) {
        // Network errors and timeouts make this symbol "unavailable" instead of crashing the page
        console.error(`Alpaca quote for ${symbol} failed:`, err);
        return null;
      }
    },
  };
}

