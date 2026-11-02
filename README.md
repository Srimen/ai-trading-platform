# AI Trading Platform

A web app for researching stocks, understanding portfolio risk, and placing **paper** (simulated) trades, with AI explanations that cite their sources.

> **Paper trading only.** This project never places real orders or uses real money. Test data is always labeled as test data. Not financial advice.

**Status:** In progress (week 1 of 8)

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
- [ ] Sign-in and per-user data isolation
- [ ] CSV portfolio import with row-by-row validation
- [ ] Portfolio valuation and risk scenarios (decimal math, reproducible)
- [ ] AI explanations with citations and uncertainty
- [ ] Paper orders with explicit confirmation and duplicate prevention
- [ ] Deployed on Vercel

## Design principles

- **Paper only.** Every account and order screen says PAPER.
- **No hidden staleness.** Every price shows where it came from and when. Old or missing data is clearly marked.
- **Reproducible numbers.** Calculations use decimal math and record their inputs.
- **The AI explains, it never trades.** Orders always need explicit confirmation from the user.
- **No secrets in code.** API keys live in environment variables only.

## Tech stack

- **Built with:** Next.js (App Router), TypeScript, Tailwind CSS
- **Planned:** PostgreSQL, authentication, a market data provider, a paper-broker sandbox, Vercel hosting

## Getting started

```bash
git clone https://github.com/Srimen/ai-trading-platform.git
cd ai-trading-platform
npm install
cp .env.example .env.local
npm run dev
```

Then open http://localhost:3000.

## Project structure

```
app/          Pages and API routes
components/   UI components
lib/          Types, config, and market data adapters
docs/         Scope and architecture notes
```

## Roadmap

| Weeks | Focus |
|-------|-------|
| 1–2 | Foundation: setup, dashboard, watchlist, sign-in, database |
| 3–4 | Portfolio import and risk calculations |
| 5–6 | AI explanations and paper orders |
| 7–8 | Testing, failure handling, Vercel deployment, demo |

See [docs/scope.md](docs/scope.md) and [docs/architecture.md](docs/architecture.md) for details. 

