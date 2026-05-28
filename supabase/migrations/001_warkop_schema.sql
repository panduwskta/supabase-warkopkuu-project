create table if not exists public.menu_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  created_at timestamptz not null default now(),
  name text not null,
  price numeric not null check (price >= 0),
  category text not null,
  stock numeric
);
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  created_at timestamptz not null default now(),
  timestamp bigint not null,
  items jsonb not null,
  total numeric not null check (total >= 0)
);
create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  created_at timestamptz not null default now(),
  timestamp bigint not null,
  name text not null,
  amount numeric not null check (amount >= 0),
  category text not null
);
alter table public.menu_items enable row level security;
alter table public.orders enable row level security;
alter table public.expenses enable row level security;
create policy "menu own select" on public.menu_items for select to authenticated using (auth.uid() = user_id);
create policy "menu own insert" on public.menu_items for insert to authenticated with check (auth.uid() = user_id);
create policy "menu own update" on public.menu_items for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "menu own delete" on public.menu_items for delete to authenticated using (auth.uid() = user_id);
create policy "orders own select" on public.orders for select to authenticated using (auth.uid() = user_id);
create policy "orders own insert" on public.orders for insert to authenticated with check (auth.uid() = user_id);
create policy "orders own delete" on public.orders for delete to authenticated using (auth.uid() = user_id);
create policy "expenses own select" on public.expenses for select to authenticated using (auth.uid() = user_id);
create policy "expenses own insert" on public.expenses for insert to authenticated with check (auth.uid() = user_id);
create policy "expenses own delete" on public.expenses for delete to authenticated using (auth.uid() = user_id);
