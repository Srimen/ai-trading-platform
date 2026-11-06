import { Suspense } from "react";
import Card from "@/components/Card";
import HoldingsList from "@/components/HoldingsList";
import Watchlist from "@/components/Watchlist";

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="mt-1 text-sm text-muted">
          Paper trading only. No real money and no live orders.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card title="Watchlist" className="md:col-span-2">
          <Watchlist />
        </Card>
        <Card title="Portfolio">
          <Suspense fallback={<p className="text-sm text-muted">Loading holdings…</p>}>
            <HoldingsList />
          </Suspense>
        </Card>
        <Card title="AI explanations">
          <p className="text-sm text-muted">
            No explanations yet. Each one will link to its sources.
          </p>
        </Card>
        <Card title="Paper orders" className="md:col-span-2">
          <p className="text-sm text-muted">
            No paper orders yet. Every order will need your confirmation.
          </p>
        </Card>
      </div>
    </div>
  );
}

