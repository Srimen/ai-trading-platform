import type { MarketDataAdapter } from "./adapter";
import { createAlpacaAdapter } from "./alpaca-adapter";
import { fixtureAdapter } from "./fixture-adapter";

// Uses real Alpaca prices when both keys are set. Otherwise falls back to the
// labeled test fixtures, so tests and CI never need real keys.
export function getMarketDataAdapter(): MarketDataAdapter {
  const keyId = process.env.ALPACA_API_KEY_ID;
  const secretKey = process.env.ALPACA_API_SECRET_KEY;

  return keyId && secretKey ? createAlpacaAdapter(keyId, secretKey) : fixtureAdapter;
}

