import { connection } from "next/server";
import { formatUtc, pnlClass, signed, withCommas } from "@/lib/format";
import { getPortfolioValuation } from "@/lib/portfolio/get-valuation";

export default async function HoldingsList() {
  // Holdings and prices are different for every user and every moment
  await connection();

  const result = await getPortfolioValuation().then(
    (valuation) => ({ valuation, error: null as string | null }),
    (err: unknown) => ({
      valuation: null,
      error: err instanceof Error ? err.message : "Could not load your portfolio.",
    })
  );

  if (!result.valuation) {
    return <p className="text-sm text-danger">{result.error}</p>;
  }

  const valuation = result.valuation;

  if (valuation.positions.length === 0) {
    return (
      <p className="text-sm text-muted">
        No holdings yet. Import a CSV file below to get started.
      </p>
    );
  }

  const usesTestData = valuation.positions.some((p) => p.priceSource === "Test fixture");

  return (
    <div className="space-y-4">
      <dl className="grid gap-4 sm:grid-cols-2">
        <div>
          <dt className="text-sm text-muted">Portfolio value</dt>
          <dd className="text-2xl font-semibold tabular-nums">
            {withCommas(valuation.pricedValue)}{" "}
            <span className="text-sm font-normal text-muted">{valuation.currency}</span>
          </dd>
        </div>
        <div>
          <dt className="text-sm text-muted">Unrealized P/L</dt>
          <dd className={`text-2xl font-semibold tabular-nums ${pnlClass(valuation.unrealizedPnl)}`}>
            {signed(valuation.unrealizedPnl)}
            {valuation.unrealizedPnlPercent && (
              <span className="ml-2 text-sm font-normal">({signed(valuation.unrealizedPnlPercent)}%)</span>
            )}
          </dd>
        </div>
      </dl>

      {!valuation.isComplete && (
        <div role="status" className="space-y-1 rounded-md border border-stale/40 px-3 py-2 text-sm text-stale">
          {valuation.unpricedSymbols.length > 0 && (
            <p>
              No price for {valuation.unpricedSymbols.join(", ")}, so{" "}
              {valuation.unpricedSymbols.length === 1 ? "it's" : "they're"} left out of the totals.
            </p>
          )}
          {valuation.staleSymbols.length > 0 && (
            <p>
              The price for {valuation.staleSymbols.join(", ")} is stale, so the totals may be out of date.
            </p>
          )}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-muted">
            <tr>
              <th className="py-2 font-normal">Symbol</th>
              <th className="py-2 text-right font-normal">Quantity</th>
              <th className="py-2 text-right font-normal">Price</th>
              <th className="py-2 text-right font-normal">Market value</th>
              <th className="py-2 text-right font-normal">Cost basis</th>
              <th className="py-2 text-right font-normal">Unrealized P/L</th>
            </tr>
          </thead>
          <tbody>
            {valuation.positions.map((position) => (
              <tr key={position.symbol} className="border-t border-line">
                <td className="py-2 font-medium">{position.symbol}</td>
                <td className="py-2 text-right tabular-nums">{withCommas(position.quantity)}</td>
                <td className="py-2 text-right tabular-nums">
                  {position.price ? (
                    <>
                      {withCommas(position.price)}
                      {position.priceStatus === "stale" && (
                        <span className="ml-1 text-xs text-stale">(stale)</span>
                      )}
                    </>
                  ) : (
                    <span className="text-muted">No price</span>
                  )}
                </td>
                <td className="py-2 text-right tabular-nums">
                  {position.marketValue ? withCommas(position.marketValue) : <span className="text-muted">None</span>}
                </td>
                <td className="py-2 text-right tabular-nums">{withCommas(position.costBasis)}</td>
                <td className={`py-2 text-right tabular-nums ${pnlClass(position.unrealizedPnl)}`}>
                  {position.unrealizedPnl ? (
                    <>
                      {signed(position.unrealizedPnl)}
                      {position.unrealizedPnlPercent && (
                        <span className="ml-1 text-xs">({signed(position.unrealizedPnlPercent)}%)</span>
                      )}
                    </>
                  ) : (
                    <span className="text-muted">None</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted">
        Calculated {formatUtc(valuation.calculatedAt)} with formula {valuation.formulaVersion}.
        {usesTestData && " Prices are made-up test data."} Only you can see these holdings.
      </p>
    </div>
  );
}

