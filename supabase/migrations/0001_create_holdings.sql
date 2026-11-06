-- Holdings for each user's paper portfolio.
-- Row-level security keeps every row private to the user who owns it.

create table public.holdings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  symbol text not null check (symbol ~ '^[A-Z]{1,5}$'),
  quantity numeric not null check (quantity > 0),
  cost_basis numeric(20, 2) not null check (cost_basis >= 0),
  currency text not null default 'USD' check (currency = 'USD'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, symbol)
);

create index holdings_user_id_idx on public.holdings (user_id);

alter table public.holdings enable row level security;

-- Signed-in users can only see and change their own rows
create policy "Users can view their own holdings"
  on public.holdings for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can add their own holdings"
  on public.holdings for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own holdings"
  on public.holdings for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own holdings"
  on public.holdings for delete to authenticated
  using ((select auth.uid()) = user_id);

-- New tables aren't exposed automatically, so grant access explicitly.
-- Signed-out visitors get no access at all.
grant select, insert, update, delete on public.holdings to authenticated;
revoke all on public.holdings from anon;

