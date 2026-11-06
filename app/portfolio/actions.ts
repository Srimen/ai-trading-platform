"use server";

import { revalidatePath } from "next/cache";
import { parseHoldingsCsv } from "@/lib/portfolio/parse-holdings-csv";
import { createClient } from "@/lib/supabase/server";
import type { ImportState } from "@/lib/types";

// 100 KB is far more than 500 rows of holdings needs
const MAX_FILE_BYTES = 100_000;

export async function importHoldings(_prev: ImportState, formData: FormData): Promise<ImportState> {
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    return { status: "error", message: "Choose a CSV file to import.", errors: [] };
  }
  if (!file.name.toLowerCase().endsWith(".csv")) {
    return { status: "error", message: "The file must be a .csv file.", errors: [] };
  }
  if (file.size > MAX_FILE_BYTES) {
    return {
      status: "error",
      message: "The file is larger than 100 KB. Import up to 500 holdings at a time.",
      errors: [],
    };
  }

  // Check every row first. If any row is invalid, nothing is imported.
  const { holdings, errors } = parseHoldingsCsv(await file.text());
  if (errors.length > 0) {
    return {
      status: "error",
      message: `Nothing was imported. Fix ${errors.length === 1 ? "this row" : `these ${errors.length} rows`} and try again.`,
      errors: errors.slice(0, 50),
    };
  }

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData?.claims) {
    return { status: "error", message: "Your session has ended. Sign in again.", errors: [] };
  }

  // Replaces the user's holdings in one database transaction
  const { data, error } = await supabase.rpc("replace_holdings", {
    items: holdings.map((holding) => ({
      symbol: holding.symbol,
      quantity: holding.quantity,
      cost_basis: holding.costBasis,
    })),
  });

  if (error) {
    return {
      status: "error",
      message: `Nothing was imported. The database rejected the file: ${error.message}`,
      errors: [],
    };
  }

  // Reload the dashboard so the Portfolio panel shows the new holdings
  revalidatePath("/");

  const count = typeof data === "number" ? data : holdings.length;
  return {
    status: "success",
    message: `Imported ${count} ${count === 1 ? "holding" : "holdings"}. Your previous holdings were replaced.`,
    errors: [],
  };
}
