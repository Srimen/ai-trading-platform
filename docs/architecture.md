# Architecture

## Overview
A single Next.js app holds both the web interface and the backend API routes, deployed to Vercel.

```
Browser (React pages)
   │
   ▼
Next.js API routes  ──►  Market data adapter  ──►  Provider (fixture now, real API later)
   │                ──►  Paper broker adapter ──►  Broker sandbox (later)
   │                ──►  AI explanation service (later)
   ▼
PostgreSQL (later): users, holdings, order intents, order events, audit log
```

## Key decisions
- **Adapters:** market data and broker access go through interfaces, so test fixtures and real providers can be swapped without changing the UI.
- **Money as strings:** prices and quantities are stored as decimal strings to avoid floating-point errors.
- **Timestamps everywhere:** every quote stores its event time (from the provider) and received time (when we got it).
- **Order integrity:** each confirmed order intent has an idempotency key, so retrying a submission never creates a duplicate order.
- **Secrets:** API keys live in `.env.local` locally and in Vercel environment variables in production, and they are never sent to the browser.

## Data model (first version)
| Entity | Purpose |
|--------|---------|
| Quote | Price for a symbol, with source, currency, event time, and received time |
| Holding | A position from the imported portfolio: symbol, quantity, cost basis |
| EvidenceItem | A source the AI can cite, with publish and retrieval times |
| OrderIntent | A user's order, from draft to confirmed, with an idempotency key |
| OrderEvent | Every status change of an order (submitted, filled, cancelled, and so on) |

## Quote status rules
- **Fresh:** event time is within `STALE_AFTER_SECONDS` (default 60)
- **Stale:** older than that, shown with a warning
- **Unavailable:** no quote returned, shown as unavailable rather than hidden
