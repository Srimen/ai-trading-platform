import { connection } from "next/server";
import { formatUtc, pnlClass, signed, withCommas } from "@/lib/format";
import { getPortfolioValuation } from "@/lib/portfolio/get-valuation";
import { analyzeRisk } from "@/lib/portfolio/risk";

export default async function RiskPanel() {
  // Risk depends on each user's holdings and current prices
  await connection();

  const result = await getPortfolioValuation().then(
    (valuation) => ({ report: analyzeRisk(valuation), error: null as string | null }),
    (err: unknown) => ({
      report: null,
      error: err instanceof Error ? err.message : "Could not calculate risk.",
    })
  );

  if (!result.report) {
    return <p className="text-sm text-danger">{result.error}</p>;
  }

  const report = result.report;

  if (report.allocation.length === 0) {
    return (
      <p className="text-sm text-muted">
        Import holdings with prices to see allocation, concentration, and scenarios.
      </p>
    );
  }

  const largest = report.largestPosition;

  return (
    <div className="space-y-6">
      {largest && (
        <p
          role="status"
          className={`rounded-md border px-3 py-2 text-sm ${
            largest.aboveLimit ? "border-stale/40 text-stale" : "border-line text-muted"
          }`}
        >
          {largest.aboveLimit
            ? `${largest.symbol} is ${largest.weightPercent}% of your portfolio, above the ${report.concentrationLimitPercent}% concentration guideline. A drop in this one stock would have an outsized effect.`
            : `Your largest position, ${largest.symbol}, is ${largest.weightPercent}% of your portfolio, within the ${report.concentrationLimitPercent}% concentration guideline.`}
        </p>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <section>
          <h3 className="mb-3 text-sm font-medium">Allocation</h3>
          <ul className="space-y-3">
            {report.allocation.map((row) => {
              const flagged = largest?.aboveLimit && largest.symbol === row.symbol;
              return (
                <li key={row.symbol} className="text-sm">
                  <div className="flex justify-between gap-4">
                    <span className="font-medium">{row.symbol}</span>
                    <span className="tabular-nums text-muted">
                      {row.weightPercent}% ({withCommas(row.marketValue)} USD)
                    </span>
                  </div>
                  <div aria-hidden="true" className="mt-1 h-2 rounded-full bg-line">
                    <div
                      className={`h-2 rounded-full ${flagged ? "bg-stale" : "bg-muted"}`}
                      style={{ width: `${row.weightPercent}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        <section>
          <h3 className="mb-3 text-sm font-medium">Price-shock scenarios</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-muted">
                <tr>
                  <th className="py-2 font-normal">Scenario</th>
                  <th className="py-2 text-right font-normal">Value after</th>
                  <th className="py-2 text-right font-normal">Change</th>
                </tr>
              </thead>
              <tbody>
                {report.scenarios.map((scenario) => (
                  <tr key={scenario.id} className="border-t border-line">
                    <td className="py-2">
                      {scenario.label}
                      {scenario.appliesTo === "largest" && scenario.affectedSymbols.length > 0 && (
                        <span className="text-muted"> ({scenario.affectedSymbols.join(", ")})</span>
                      )}
                    </td>
                    <td className="py-2 text-right tabular-nums">{withCommas(scenario.valueAfter)}</td>
                    <td className={`py-2 text-right tabular-nums ${pnlClass(scenario.change)}`}>
                      {signed(scenario.change)}
                      {scenario.changePercent && (
                        <span className="ml-1 text-xs">({signed(scenario.changePercent)}%)</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {report.excludedSymbols.length > 0 && (
        <p className="text-sm text-stale">
          {report.excludedSymbols.join(", ")} {report.excludedSymbols.length === 1 ? "has" : "have"} no price, so{" "}
          {report.excludedSymbols.length === 1 ? "it isn't" : "they aren't"} included in these numbers.
        </p>
      )}

      <p className="text-xs text-muted">
        Calculated with formula {report.formulaVersion}, based on {report.basedOn.valuationFormulaVersion} from{" "}
        {formatUtc(report.basedOn.valuationCalculatedAt)}. Scenarios are simple what-ifs, not predictions or
        financial advice.
      </p>
    </div>
  );
}

