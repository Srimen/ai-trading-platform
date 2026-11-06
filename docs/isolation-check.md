# Per-user data isolation check

Each user's holdings are protected by row-level security (RLS) in Supabase.
The policies are defined in `supabase/migrations/0001_create_holdings.sql`.

## How the protection works

- Every row in `holdings` stores the `user_id` of its owner.
- RLS policies only allow reading, adding, updating, or deleting a row when `user_id` matches the signed-in user.
- Signed-out visitors have no access to the table at all.
- The app's query doesn't filter by user. The database enforces isolation itself, so a bug in app code can't leak another user's data.

## Manual test

1. Create two accounts in the app: **Account A** and **Account B**.
2. In Supabase, copy Account A's user ID from **Authentication → Users**.
3. In the Supabase SQL Editor, insert test holdings for Account A only:

```sql
insert into public.holdings (user_id, symbol, quantity, cost_basis)
values
  ('ACCOUNT-A-USER-ID', 'AAPL', 10, 1500.00),
  ('ACCOUNT-A-USER-ID', 'MSFT', 5, 1800.00);
```

4. Sign in as Account A. The Portfolio panel shows AAPL and MSFT.
5. Sign in as Account B. The Portfolio panel shows "No holdings yet."

## Result

| Date | Account A sees its holdings | Account B sees Account A's holdings | Result |
|------|-----------------------------|-------------------------------------|--------|
| 2026-11-06 | Yes | No | Pass |
