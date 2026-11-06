-- Replaces the signed-in user's holdings with a new set, all at once.
-- Runs as the calling user (security invoker), so the row-level security
-- policies on holdings still apply. If any row fails, nothing changes.

create or replace function public.replace_holdings(items jsonb)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  inserted_count integer;
begin
  if auth.uid() is null then
    raise exception 'Not signed in';
  end if;

  if jsonb_typeof(items) <> 'array' then
    raise exception 'Holdings must be a list';
  end if;

  if jsonb_array_length(items) > 500 then
    raise exception 'Import up to 500 holdings at a time';
  end if;

  delete from public.holdings where user_id = auth.uid();

  insert into public.holdings (user_id, symbol, quantity, cost_basis)
  select
    auth.uid(),
    item ->> 'symbol',
    (item ->> 'quantity')::numeric,
    (item ->> 'cost_basis')::numeric
  from jsonb_array_elements(items) as item;

  get diagnostics inserted_count = row_count;
  return inserted_count;
end;
$$;

-- Only signed-in users can call this function
revoke all on function public.replace_holdings(jsonb) from public, anon;
grant execute on function public.replace_holdings(jsonb) to authenticated;

