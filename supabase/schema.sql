-- Alcogram Diary · Supabase schema (free tier)
-- Run in Supabase SQL Editor after creating a project.

-- Drinks
create table if not exists public.drinks (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  date text not null,
  drink_index integer not null default 1,
  alcohol text not null default '',
  amount double precision not null default 0,
  unit text not null default 'ml',
  amount_ml double precision not null default 0,
  abv double precision,
  price double precision,
  currency text not null default '₽',
  notes text not null default '',
  created_at bigint not null,
  updated_at bigint not null,
  source text not null default 'manual',
  deleted boolean not null default false
);

create index if not exists drinks_user_date_idx on public.drinks (user_id, date);
create index if not exists drinks_user_updated_idx on public.drinks (user_id, updated_at);

-- Sober / "did not drink" marks
create table if not exists public.sober_days (
  user_id uuid not null references auth.users (id) on delete cascade,
  date text not null,
  created_at bigint not null,
  updated_at bigint not null,
  source text not null default 'manual',
  deleted boolean not null default false,
  primary key (user_id, date)
);

-- RLS: each user sees only own rows
alter table public.drinks enable row level security;
alter table public.sober_days enable row level security;

drop policy if exists "drinks_select_own" on public.drinks;
drop policy if exists "drinks_insert_own" on public.drinks;
drop policy if exists "drinks_update_own" on public.drinks;
drop policy if exists "drinks_delete_own" on public.drinks;

create policy "drinks_select_own" on public.drinks
  for select using (auth.uid() = user_id);
create policy "drinks_insert_own" on public.drinks
  for insert with check (auth.uid() = user_id);
create policy "drinks_update_own" on public.drinks
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "drinks_delete_own" on public.drinks
  for delete using (auth.uid() = user_id);

drop policy if exists "sober_select_own" on public.sober_days;
drop policy if exists "sober_insert_own" on public.sober_days;
drop policy if exists "sober_update_own" on public.sober_days;
drop policy if exists "sober_delete_own" on public.sober_days;

create policy "sober_select_own" on public.sober_days
  for select using (auth.uid() = user_id);
create policy "sober_insert_own" on public.sober_days
  for insert with check (auth.uid() = user_id);
create policy "sober_update_own" on public.sober_days
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "sober_delete_own" on public.sober_days
  for delete using (auth.uid() = user_id);
