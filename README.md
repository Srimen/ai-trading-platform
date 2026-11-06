# AI Trading Platform

![CI](https://github.com/Srimen/ai-trading-platform/actions/workflows/ci.yml/badge.svg)

A web app for researching stocks, understanding portfolio risk, and placing **paper** (simulated) trades, with AI explanations that cite their sources.

> **Paper trading only.** This project never places real orders or uses real money. Test data is always labeled as test data. Not financial advice.

**Status:** In progress. Currently building portfolio valuation and risk calculations.

## What it does

The goal is one complete, working journey:

1. Sign in
2. View a watchlist where every price shows its source, currency, and age
3. Import a portfolio from a CSV file
4. See portfolio value, profit/loss, concentration, and simple "what if prices drop 10%?" scenarios
5. Read an AI explanation where every claim links to its evidence
6. Preview, confirm, and track a paper order

## Features

- [x] Next.js + TypeScript + Tailwind setup
- [x] Dashboard with a clear PAPER label
- [x] Watchlist with fresh, stale, and unavailable price states
- [x] Automated tests and CI on every push
- [x] Email sign-in with Supabase Auth, with every page protected
- [x] Per-user data isolation with row-level security ([how it's tested](docs/isolation-check.md))
- [x] CSV portfolio import with row-by-row validation
- [ ] Portfolio valuation and risk scenarios (decimal math, reproducible)
- [ ] AI explanations with citations and uncertainty
- [ ] Paper orders with explicit confirmation and duplicate prevention
- [ ] Deployed on Vercel

## Importing a portfolio

Upload a CSV file from the Portfolio panel on the dashboard. A [sample file](public/sample-portfolio.csv) is included.

```csv
symbol,quantity,cost_basis
AAPL,10,1500.00
MSFT,5,1800.00
```

- **Required columns:** `symbol`, `quantity`, `cost_basis` (the total cost of the position). Common names like `ticker`, `shares`, and `Cost Basis` also work.
- **Optional column:** `currency`, which must be USD.
- **Cleanup:** symbols are uppercased and values like `$1,500.00` are accepted.
- **Validation:** every invalid row is reported with its row number and how to fix it.
- **All or nothing:** if any row is invalid, nothing is imported. A valid import replaces your current holdings in a single database transaction.

## Design principles

- **Paper only.** Every account and order screen says PAPER.
- **No hidden staleness.** Every price shows where it came from and when. Old or missing data is clearly marked.
- **Reproducible numbers.** Calculations use decimal math and record their inputs.
- **Private by default.** The database itself makes sure each user can only see their own data.
- **The AI explains, it never trades.** Orders always need explicit confirmation from the user.
- **No secrets in code.** API keys live in environment variables only.

## Tech stack

- **Built with:** Next.js (App Router), TypeScript, Tailwind CSS, Supabase (Auth and PostgreSQL with row-level security), Vitest, GitHub Actions
- **Planned:** a market data provider, a paper-broker sandbox, Vercel hosting

## Getting started

1. Create a free project at [supabase.com](https://supabase.com).
2. In the Supabase **SQL Editor**, run the files in `supabase/migrations/` in order.
3. Clone the repo and install dependencies:

```bash
git clone https://github.com/Srimen/ai-trading-platform.git
cd ai-trading-platform
npm install
cp .env.example .env.local
```

4. In `.env.local`, fill in `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` from your Supabase project's **Connect** dialog.
5. Start the app:

```bash
npm run dev
```

Then open http://localhost:3000 and create an account.

## Running checks

```bash
npm test        # unit tests
npm run lint    # code style
npm run build   # production build
```

These also run automatically on GitHub for every push.

## Project structure

```
app/                   Pages, API routes, and server actions
components/            UI components
lib/                   Types, config, Supabase clients, data access, CSV parsing, and market data adapters
supabase/migrations/   Database tables, functions, and row-level security policies
docs/                  Scope, architecture, and security checks
public/                Static files, including the sample portfolio CSV
proxy.ts               Refreshes sessions and protects every page
```

## Roadmap

| Weeks | Focus |
|-------|-------|
| 1–2 | Foundation: setup, dashboard, watchlist, sign-in, database |
| 3–4 | Portfolio import and risk calculations |
| 5–6 | AI explanations and paper orders |
| 7–8 | Testing, failure handling, Vercel deployment, demo |

See [docs/scope.md](docs/scope.md) and [docs/architecture.md](docs/architecture.md) for details.

