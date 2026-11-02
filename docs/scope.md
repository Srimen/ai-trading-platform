# Scope

## The demo journey
Sign in → view timestamped market data → import a portfolio → review reproducible risk numbers → read a cited AI explanation → confirm and track a paper order.

## Target user
A self-directed investor who wants to understand their portfolio's risk and practice trades without real money.

## Market
US equities, priced in USD only.

## Paper-only boundary
- The app connects to a paper (sandbox) broker only. Live trading is out of scope.
- Every account and order screen is labeled PAPER.
- The AI can explain, but it has no ability to place orders.
- Test fixtures are always labeled as test data, never shown as live data.

## In scope (2 months)
- One market data provider, plus a watchlist with stale-data handling
- CSV portfolio import (one currency)
- Valuation, unrealized P/L, concentration, and simple price-shock scenarios
- AI explanations with citations, uncertainty, and numeric validation
- Market and limit paper orders with confirmation, duplicate prevention, cancellation, and reconciliation
- Private deployment on Vercel

## Out of scope
- Live trading or real money
- Multiple markets or currencies
- Advanced analytics and complex order types
- Autonomous (AI-placed) orders
- Public launch 
