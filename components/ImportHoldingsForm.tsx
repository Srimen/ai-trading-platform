"use client";

import { useActionState } from "react";
import { importHoldings } from "@/app/portfolio/actions";
import type { ImportState } from "@/lib/types";

const initialState: ImportState = { status: "idle", message: null, errors: [] };

export default function ImportHoldingsForm() {
  const [state, formAction, pending] = useActionState(importHoldings, initialState);

  return (
    <form action={formAction} className="mt-5 space-y-3 border-t border-line pt-4">
      <div className="space-y-1">
        <label htmlFor="holdings-file" className="text-sm font-medium">
          Import holdings from CSV
        </label>
        <p className="text-xs text-muted">
          Columns: symbol, quantity, cost_basis. Importing replaces your current holdings.{" "}
          <a
            href="/sample-portfolio.csv"
            download
            className="text-paper underline-offset-4 hover:underline"
          >
            Download a sample file
          </a>
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          id="holdings-file"
          name="file"
          type="file"
          accept=".csv,text/csv"
          required
          className="text-sm text-muted file:mr-3 file:rounded-md file:border file:border-line file:bg-ink file:px-3 file:py-1.5 file:text-sm file:text-text hover:file:bg-panel"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-paper px-4 py-1.5 text-sm font-medium text-ink disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-text"
        >
          {pending ? "Importing…" : "Import CSV"}
        </button>
      </div>

      {state.message && (
        <p
          role={state.status === "error" ? "alert" : "status"}
          className={`text-sm ${state.status === "error" ? "text-danger" : "text-fresh"}`}
        >
          {state.message}
        </p>
      )}

      {state.errors.length > 0 && (
        <ul className="max-h-48 space-y-1 overflow-y-auto rounded-md border border-line p-3 text-sm">
          {state.errors.map((error) => (
            <li key={error.row}>
              <span className="font-medium">Row {error.row}:</span>{" "}
              <span className="text-muted">{error.message}</span>
            </li>
          ))}
        </ul>
      )}
    </form>
  );
}

