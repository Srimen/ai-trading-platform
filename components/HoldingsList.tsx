import { connection } from "next/server";
import { getHoldings } from "@/lib/holdings";
import type { Holding } from "@/lib/types";

export default async function HoldingsList() {
  // Holdings are different for every user, so never prepare this ahead of time
  await connection();

  const result = await getHoldings().then(
    (holdings) => ({ holdings, error: null as string | null }),
    (err: unknown) => ({
      holdings: [] as Holding[],
      error: err instanceof Error ? err.message : "Could not load holdings.",
    })
  );

  if (result.error) {
    return <p className="text-sm text-danger">{result.error}</p>;
  }

  if (result.holdings.length === 0) {
    return (
      <p className="text-sm text-muted">
        No holdings yet. You&apos;ll be able to import a CSV file here.
      </p>
    );
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-muted">
            <tr>
              <th className="py-2 font-normal">Symbol</th>
              <th className="py-2 text-right font-normal">Quantity</th>
              <th className="py-2 text-right font-normal">Cost basis</th>
            </tr>
          </thead>
          <tbody>
            {result.holdings.map((holding) => (
              <tr key={holding.symbol} className="border-t border-line">
                <td className="py-2 font-medium">{holding.symbol}</td>
                <td className="py-2 text-right tabular-nums">{holding.quantity}</td>
                <td className="py-2 text-right tabular-nums">
                  {holding.costBasis} {holding.currency}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-muted">Saved to your account. Only you can see these holdings.</p>
    </div>
  );
}
