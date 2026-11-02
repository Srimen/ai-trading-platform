"use client";

import { useEffect, useState } from "react";
import type { QuoteStatus, WatchlistItem } from "@/lib/types";

const REFRESH_MS = 15_000;

const STATUS_STYLES: Record<QuoteStatus, string> = {
  fresh: "bg-fresh/15 text-fresh",
  stale: "bg-stale/15 text-stale",
  unavailable: "bg-line text-muted",
};

function formatAge(seconds: number) {
  return seconds < 60 ? `${seconds}s old` : `${Math.floor(seconds / 60)}m old`;
}

function StatusBadge({ status, ageSeconds }: { status: QuoteStatus; ageSeconds: number | null }) {
  const label =
    status === "unavailable"
      ? "Unavailable"
      : `${status === "fresh" ? "Fresh" : "Stale"} (${formatAge(ageSeconds ?? 0)})`;

  return (
    <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[status]}`}>
      {label}
    </span>
  );
}

export default function Watchlist() {
  const [items, setItems] = useState<WatchlistItem[] | null>(null);
  const [checkedAt, setCheckedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/quotes", { cache: "no-store" });
        if (!res.ok) throw new Error(`Quote request failed with status ${res.status}`);
        const data = await res.json();
        if (!cancelled) {
          setItems(data.items);
          setCheckedAt(data.generatedAt);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Quotes could not load");
      }
    }

    load();
    const timer = setInterval(load, REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  if (!items && error) {
    return <p className="text-sm text-danger">Quotes could not load: {error}</p>;
  }
  if (!items) {
    return <p className="text-sm text-muted">Loading quotes…</p>;
  }

  const usesTestData = items.some((item) => item.quote?.sourceType === "fixture");

  return (
    <div>
      {usesTestData && (
        <p className="mb-3 rounded-md border border-paper/40 px-3 py-2 text-sm text-paper">
          Test data: these prices are made up for development and are not real market data.
        </p>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-muted">
            <tr>
              <th className="py-2 font-normal">Symbol</th>
              <th className="py-2 font-normal">Price</th>
              <th className="py-2 font-normal">Source</th>
              <th className="py-2 font-normal">Price time</th>
              <th className="py-2 font-normal">Status</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.symbol} className="border-t border-line">
                <td className="py-2 font-medium">{item.symbol}</td>
                <td className="py-2 tabular-nums">
                  {item.quote ? `${item.quote.price} ${item.quote.currency}` : "No price"}
                </td>
                <td className="py-2 text-muted">{item.quote?.source ?? "None"}</td>
                <td className="py-2 text-muted tabular-nums">
                  {item.quote ? new Date(item.quote.eventTime).toLocaleTimeString() : "None"}
                </td>
                <td className="py-2">
                  <StatusBadge status={item.status} ageSeconds={item.ageSeconds} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {error && (
        <p className="mt-2 text-sm text-danger">
          The latest refresh failed, so these are the last loaded prices. {error}
        </p>
      )}
      {checkedAt && (
        <p className="mt-3 text-xs text-muted">
          Last checked at {new Date(checkedAt).toLocaleTimeString()}. Refreshes every 15 seconds.
        </p>
      )}
    </div>
  );
}

