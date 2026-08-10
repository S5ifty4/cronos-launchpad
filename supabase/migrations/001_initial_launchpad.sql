create extension if not exists pgcrypto;

create table if not exists public.launches (
  id uuid primary key default gen_random_uuid(),
  chain_id integer not null,
  token_address text not null unique,
  creator_address text not null,
  name text not null,
  symbol text not null,
  normalized_name text not null,
  normalized_symbol text not null,
  description text,
  image_url text,
  x_url text,
  website_url text,
  discord_url text,
  telegram_url text,
  status text not null default 'launching',
  graduation_target_wei numeric not null,
  reserve_raised_wei numeric not null default 0,
  anti_bot_enabled boolean not null default true,
  tax_bips integer not null default 0,
  vvs_router text,
  vvs_pair text,
  lp_vault text,
  lp_unlocks_at timestamptz,
  created_tx text not null,
  created_block bigint not null,
  created_at timestamptz not null
);

create table if not exists public.trades (
  id uuid primary key default gen_random_uuid(),
  token_address text not null references public.launches(token_address),
  trader_address text not null,
  side text not null,
  cro_amount_wei numeric not null,
  token_amount numeric,
  tx_hash text not null,
  block_number bigint not null,
  traded_at timestamptz not null
);

create table if not exists public.creators (
  wallet_address text primary key,
  display_name text,
  launches_count integer not null default 0,
  graduated_count integer not null default 0,
  report_count integer not null default 0,
  updated_at timestamptz not null
);

create table if not exists public.holder_snapshots (
  id uuid primary key default gen_random_uuid(),
  token_address text not null references public.launches(token_address),
  holder_address text not null,
  balance numeric not null,
  share_bips integer not null,
  label text,
  snapshot_block bigint not null,
  captured_at timestamptz not null
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  token_address text not null references public.launches(token_address),
  reporter_address text,
  reason text not null,
  status text not null default 'open',
  created_at timestamptz not null,
  reviewed_at timestamptz
);

create table if not exists public.moderation_flags (
  id uuid primary key default gen_random_uuid(),
  token_address text references public.launches(token_address),
  flag_type text not null,
  subject text not null,
  severity text not null,
  status text not null default 'open',
  created_at timestamptz not null,
  resolved_at timestamptz
);

alter table public.launches enable row level security;
alter table public.trades enable row level security;
alter table public.creators enable row level security;
alter table public.holder_snapshots enable row level security;
alter table public.reports enable row level security;
alter table public.moderation_flags enable row level security;

create policy "public read launches" on public.launches for select using (true);
create policy "public read trades" on public.trades for select using (true);
create policy "public read creators" on public.creators for select using (true);
create policy "public read holder snapshots" on public.holder_snapshots for select using (true);
create policy "public read moderation flags" on public.moderation_flags for select using (status <> 'private');

insert into storage.buckets (id, name, public)
values ('token-images', 'token-images', true)
on conflict (id) do nothing;

create policy "public read token images" on storage.objects
  for select using (bucket_id = 'token-images');

create policy "public upload token images" on storage.objects
  for insert with check (bucket_id = 'token-images');
