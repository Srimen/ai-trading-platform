import { createClient } from "@/lib/supabase/server";
import type { Holding } from "@/lib/types";

interface HoldingRow {
  symbol: string;
  quantity: string;
  cost_basis: string;
}

// Loads the signed-in user's holdings. Row-level security in the database
// guarantees only their own rows come back, even without a user filter here.
export async function getHoldings(): Promise<Holding[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("holdings")
    // ::text keeps exact decimal values instead of converting them to JavaScript numbers
    .select("symbol, quantity::text, cost_basis::text")
    .order("symbol");

  if (error) throw new Error(`Could not load holdings: ${error.message}`);

  return ((data ?? []) as HoldingRow[]).map((row) => ({
    symbol: row.symbol,
    quantity: row.quantity,
    costBasis: row.cost_basis,
    currency: "USD",
  }));
}

