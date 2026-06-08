-- Warungin v2 schema draft
-- Scope: repository migration draft only. Do not apply to production without explicit approval.
-- This migration keeps WarkopKuu v1 tables intact and creates separate Warungin v2 tables.

create extension if not exists pgcrypto;

-- Shared timestamp helper for updated_at maintenance.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Profiles are keyed by Supabase auth user id.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  display_name text,
  email text
);

create table if not exists public.stores (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  name text not null,
  business_type text,
  address text,
  phone text,
  receipt_footer text,
  receipt_prefix text not null default 'WRG',
  theme_key text,
  onboarding_completed boolean not null default false,
  demo_data_seeded boolean not null default false,
  constraint stores_receipt_prefix_not_empty check (length(trim(receipt_prefix)) > 0)
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  name text not null,
  color text,
  icon text,
  sort_order integer not null default 0,
  is_deleted boolean not null default false,
  is_sample boolean not null default false,
  constraint categories_name_not_empty check (length(trim(name)) > 0)
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  name text not null,
  price numeric not null default 0 check (price >= 0),
  hpp numeric not null default 0 check (hpp >= 0),
  stock numeric not null default 0 check (stock >= 0),
  unit text not null default 'pcs',
  sku text,
  barcode text,
  photo_url text,
  is_active boolean not null default true,
  is_deleted boolean not null default false,
  is_sample boolean not null default false,
  constraint products_name_not_empty check (length(trim(name)) > 0)
);

create table if not exists public.payment_methods (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  name text not null,
  kind text not null,
  is_default boolean not null default false,
  is_active boolean not null default true,
  constraint payment_methods_name_not_empty check (length(trim(name)) > 0),
  constraint payment_methods_kind_allowed check (kind in ('cash', 'qris', 'transfer', 'ewallet', 'other'))
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  payment_method_id uuid references public.payment_methods(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  receipt_number text not null,
  transaction_date timestamptz not null default now(),
  subtotal numeric not null default 0 check (subtotal >= 0),
  discount_amount numeric not null default 0 check (discount_amount >= 0),
  total numeric not null default 0 check (total >= 0),
  payment_method_snapshot text,
  payment_amount numeric not null default 0 check (payment_amount >= 0),
  change_amount numeric not null default 0 check (change_amount >= 0),
  profit_estimate numeric not null default 0,
  status text not null default 'completed',
  notes text,
  is_deleted boolean not null default false,
  is_sample boolean not null default false,
  constraint transactions_receipt_not_empty check (length(trim(receipt_number)) > 0),
  constraint transactions_status_allowed check (status in ('completed', 'cancelled')),
  constraint transactions_store_receipt_unique unique (store_id, receipt_number)
);

create table if not exists public.transaction_items (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references public.transactions(id) on delete cascade,
  store_id uuid not null references public.stores(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  product_name_snapshot text not null,
  price_snapshot numeric not null default 0 check (price_snapshot >= 0),
  hpp_snapshot numeric not null default 0 check (hpp_snapshot >= 0),
  quantity numeric not null check (quantity > 0),
  subtotal numeric not null default 0 check (subtotal >= 0),
  profit_estimate numeric not null default 0,
  notes text,
  constraint transaction_items_product_snapshot_not_empty check (length(trim(product_name_snapshot)) > 0)
);

create table if not exists public.expense_categories (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  name text not null,
  color text,
  icon text,
  is_default boolean not null default false,
  is_deleted boolean not null default false,
  is_sample boolean not null default false,
  constraint expense_categories_name_not_empty check (length(trim(name)) > 0)
);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  expense_category_id uuid references public.expense_categories(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  expense_date timestamptz not null default now(),
  title text not null,
  amount numeric not null default 0 check (amount >= 0),
  notes text,
  is_deleted boolean not null default false,
  is_sample boolean not null default false,
  constraint expenses_title_not_empty check (length(trim(title)) > 0)
);

-- updated_at triggers.
drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_stores_updated_at on public.stores;
create trigger set_stores_updated_at
before update on public.stores
for each row execute function public.set_updated_at();

drop trigger if exists set_categories_updated_at on public.categories;
create trigger set_categories_updated_at
before update on public.categories
for each row execute function public.set_updated_at();

drop trigger if exists set_products_updated_at on public.products;
create trigger set_products_updated_at
before update on public.products
for each row execute function public.set_updated_at();

drop trigger if exists set_payment_methods_updated_at on public.payment_methods;
create trigger set_payment_methods_updated_at
before update on public.payment_methods
for each row execute function public.set_updated_at();

drop trigger if exists set_transactions_updated_at on public.transactions;
create trigger set_transactions_updated_at
before update on public.transactions
for each row execute function public.set_updated_at();

drop trigger if exists set_transaction_items_updated_at on public.transaction_items;
create trigger set_transaction_items_updated_at
before update on public.transaction_items
for each row execute function public.set_updated_at();

drop trigger if exists set_expense_categories_updated_at on public.expense_categories;
create trigger set_expense_categories_updated_at
before update on public.expense_categories
for each row execute function public.set_updated_at();

drop trigger if exists set_expenses_updated_at on public.expenses;
create trigger set_expenses_updated_at
before update on public.expenses
for each row execute function public.set_updated_at();

-- Indexes for ownership, RLS, reporting, and sync-style queries.
create index if not exists stores_owner_user_id_idx on public.stores(owner_user_id);
create index if not exists stores_deleted_at_idx on public.stores(deleted_at);

create index if not exists categories_store_id_idx on public.categories(store_id);
create index if not exists categories_store_sort_idx on public.categories(store_id, sort_order, name);
create index if not exists categories_updated_at_idx on public.categories(updated_at);

create index if not exists products_store_id_idx on public.products(store_id);
create index if not exists products_category_id_idx on public.products(category_id);
create index if not exists products_store_active_idx on public.products(store_id, is_active, is_deleted);
create index if not exists products_updated_at_idx on public.products(updated_at);

create index if not exists payment_methods_store_id_idx on public.payment_methods(store_id);
create index if not exists payment_methods_store_active_idx on public.payment_methods(store_id, is_active);

create index if not exists transactions_store_id_idx on public.transactions(store_id);
create index if not exists transactions_store_date_idx on public.transactions(store_id, transaction_date desc);
create index if not exists transactions_store_status_idx on public.transactions(store_id, status);
create index if not exists transactions_updated_at_idx on public.transactions(updated_at);

create index if not exists transaction_items_transaction_id_idx on public.transaction_items(transaction_id);
create index if not exists transaction_items_store_id_idx on public.transaction_items(store_id);
create index if not exists transaction_items_product_id_idx on public.transaction_items(product_id);

create index if not exists expense_categories_store_id_idx on public.expense_categories(store_id);
create index if not exists expense_categories_updated_at_idx on public.expense_categories(updated_at);

create index if not exists expenses_store_id_idx on public.expenses(store_id);
create index if not exists expenses_category_id_idx on public.expenses(expense_category_id);
create index if not exists expenses_store_date_idx on public.expenses(store_id, expense_date desc);
create index if not exists expenses_updated_at_idx on public.expenses(updated_at);

-- RLS enablement.
alter table public.profiles enable row level security;
alter table public.stores enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.payment_methods enable row level security;
alter table public.transactions enable row level security;
alter table public.transaction_items enable row level security;
alter table public.expense_categories enable row level security;
alter table public.expenses enable row level security;

-- Policy reset for idempotent re-apply / partial-apply recovery.
-- Delete policies are intentionally dropped and not recreated for v2 operational tables;
-- Warungin v2 uses soft delete fields (`is_deleted`, `deleted_at`) for operational/history safety.
drop policy if exists "profiles own select" on public.profiles;
drop policy if exists "profiles own insert" on public.profiles;
drop policy if exists "profiles own update" on public.profiles;

drop policy if exists "stores owner select" on public.stores;
drop policy if exists "stores owner insert" on public.stores;
drop policy if exists "stores owner update" on public.stores;
drop policy if exists "stores owner delete" on public.stores;

drop policy if exists "categories store owner select" on public.categories;
drop policy if exists "categories store owner insert" on public.categories;
drop policy if exists "categories store owner update" on public.categories;
drop policy if exists "categories store owner delete" on public.categories;

drop policy if exists "products store owner select" on public.products;
drop policy if exists "products store owner insert" on public.products;
drop policy if exists "products store owner update" on public.products;
drop policy if exists "products store owner delete" on public.products;

drop policy if exists "payment methods store owner select" on public.payment_methods;
drop policy if exists "payment methods store owner insert" on public.payment_methods;
drop policy if exists "payment methods store owner update" on public.payment_methods;
drop policy if exists "payment methods store owner delete" on public.payment_methods;

drop policy if exists "transactions store owner select" on public.transactions;
drop policy if exists "transactions store owner insert" on public.transactions;
drop policy if exists "transactions store owner update" on public.transactions;
drop policy if exists "transactions store owner delete" on public.transactions;

drop policy if exists "transaction items store owner select" on public.transaction_items;
drop policy if exists "transaction items store owner insert" on public.transaction_items;
drop policy if exists "transaction items store owner update" on public.transaction_items;
drop policy if exists "transaction items store owner delete" on public.transaction_items;

drop policy if exists "expense categories store owner select" on public.expense_categories;
drop policy if exists "expense categories store owner insert" on public.expense_categories;
drop policy if exists "expense categories store owner update" on public.expense_categories;
drop policy if exists "expense categories store owner delete" on public.expense_categories;

drop policy if exists "expenses store owner select" on public.expenses;
drop policy if exists "expenses store owner insert" on public.expenses;
drop policy if exists "expenses store owner update" on public.expenses;
drop policy if exists "expenses store owner delete" on public.expenses;

-- Profiles: users can manage their own profile row.
create policy "profiles own select" on public.profiles
  for select to authenticated
  using ((select auth.uid()) = id);

create policy "profiles own insert" on public.profiles
  for insert to authenticated
  with check ((select auth.uid()) = id);

create policy "profiles own update" on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- Stores: users can read/create/update stores they own. Hard delete is not allowed by policy.
create policy "stores owner select" on public.stores
  for select to authenticated
  using ((select auth.uid()) = owner_user_id);

create policy "stores owner insert" on public.stores
  for insert to authenticated
  with check ((select auth.uid()) = owner_user_id);

create policy "stores owner update" on public.stores
  for update to authenticated
  using ((select auth.uid()) = owner_user_id)
  with check ((select auth.uid()) = owner_user_id);

-- Store-owned operational tables: select/insert/update only. Deletes should be soft deletes.
create policy "categories store owner select" on public.categories
  for select to authenticated
  using (exists (select 1 from public.stores s where s.id = categories.store_id and s.owner_user_id = (select auth.uid())));

create policy "categories store owner insert" on public.categories
  for insert to authenticated
  with check (exists (select 1 from public.stores s where s.id = categories.store_id and s.owner_user_id = (select auth.uid())));

create policy "categories store owner update" on public.categories
  for update to authenticated
  using (exists (select 1 from public.stores s where s.id = categories.store_id and s.owner_user_id = (select auth.uid())))
  with check (exists (select 1 from public.stores s where s.id = categories.store_id and s.owner_user_id = (select auth.uid())));

create policy "products store owner select" on public.products
  for select to authenticated
  using (exists (select 1 from public.stores s where s.id = products.store_id and s.owner_user_id = (select auth.uid())));

create policy "products store owner insert" on public.products
  for insert to authenticated
  with check (exists (select 1 from public.stores s where s.id = products.store_id and s.owner_user_id = (select auth.uid())));

create policy "products store owner update" on public.products
  for update to authenticated
  using (exists (select 1 from public.stores s where s.id = products.store_id and s.owner_user_id = (select auth.uid())))
  with check (exists (select 1 from public.stores s where s.id = products.store_id and s.owner_user_id = (select auth.uid())));

create policy "payment methods store owner select" on public.payment_methods
  for select to authenticated
  using (exists (select 1 from public.stores s where s.id = payment_methods.store_id and s.owner_user_id = (select auth.uid())));

create policy "payment methods store owner insert" on public.payment_methods
  for insert to authenticated
  with check (exists (select 1 from public.stores s where s.id = payment_methods.store_id and s.owner_user_id = (select auth.uid())));

create policy "payment methods store owner update" on public.payment_methods
  for update to authenticated
  using (exists (select 1 from public.stores s where s.id = payment_methods.store_id and s.owner_user_id = (select auth.uid())))
  with check (exists (select 1 from public.stores s where s.id = payment_methods.store_id and s.owner_user_id = (select auth.uid())));

create policy "transactions store owner select" on public.transactions
  for select to authenticated
  using (exists (select 1 from public.stores s where s.id = transactions.store_id and s.owner_user_id = (select auth.uid())));

create policy "transactions store owner insert" on public.transactions
  for insert to authenticated
  with check (exists (select 1 from public.stores s where s.id = transactions.store_id and s.owner_user_id = (select auth.uid())));

create policy "transactions store owner update" on public.transactions
  for update to authenticated
  using (exists (select 1 from public.stores s where s.id = transactions.store_id and s.owner_user_id = (select auth.uid())))
  with check (exists (select 1 from public.stores s where s.id = transactions.store_id and s.owner_user_id = (select auth.uid())));

create policy "transaction items store owner select" on public.transaction_items
  for select to authenticated
  using (exists (select 1 from public.stores s where s.id = transaction_items.store_id and s.owner_user_id = (select auth.uid())));

create policy "transaction items store owner insert" on public.transaction_items
  for insert to authenticated
  with check (exists (select 1 from public.stores s where s.id = transaction_items.store_id and s.owner_user_id = (select auth.uid())));

create policy "transaction items store owner update" on public.transaction_items
  for update to authenticated
  using (exists (select 1 from public.stores s where s.id = transaction_items.store_id and s.owner_user_id = (select auth.uid())))
  with check (exists (select 1 from public.stores s where s.id = transaction_items.store_id and s.owner_user_id = (select auth.uid())));

create policy "expense categories store owner select" on public.expense_categories
  for select to authenticated
  using (exists (select 1 from public.stores s where s.id = expense_categories.store_id and s.owner_user_id = (select auth.uid())));

create policy "expense categories store owner insert" on public.expense_categories
  for insert to authenticated
  with check (exists (select 1 from public.stores s where s.id = expense_categories.store_id and s.owner_user_id = (select auth.uid())));

create policy "expense categories store owner update" on public.expense_categories
  for update to authenticated
  using (exists (select 1 from public.stores s where s.id = expense_categories.store_id and s.owner_user_id = (select auth.uid())))
  with check (exists (select 1 from public.stores s where s.id = expense_categories.store_id and s.owner_user_id = (select auth.uid())));

create policy "expenses store owner select" on public.expenses
  for select to authenticated
  using (exists (select 1 from public.stores s where s.id = expenses.store_id and s.owner_user_id = (select auth.uid())));

create policy "expenses store owner insert" on public.expenses
  for insert to authenticated
  with check (exists (select 1 from public.stores s where s.id = expenses.store_id and s.owner_user_id = (select auth.uid())));

create policy "expenses store owner update" on public.expenses
  for update to authenticated
  using (exists (select 1 from public.stores s where s.id = expenses.store_id and s.owner_user_id = (select auth.uid())))
  with check (exists (select 1 from public.stores s where s.id = expenses.store_id and s.owner_user_id = (select auth.uid())));
