create table if not exists launches (
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

create table if not exists trades (
  id uuid primary key default gen_random_uuid(),
  token_address text not null references launches(token_address),
  trader_address text not null,
  side text not null,
  cro_amount_wei numeric not null,
  token_amount numeric,
  tx_hash text not null,
  block_number bigint not null,
  traded_at timestamptz not null
);

create table if not exists creators (
  wallet_address text primary key,
  display_name text,
  launches_count integer not null default 0,
  graduated_count integer not null default 0,
  report_count integer not null default 0,
  updated_at timestamptz not null
);

create table if not exists holder_snapshots (
  id uuid primary key default gen_random_uuid(),
  token_address text not null references launches(token_address),
  holder_address text not null,
  balance numeric not null,
  share_bips integer not null,
  label text,
  snapshot_block bigint not null,
  captured_at timestamptz not null
);

create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  token_address text not null references launches(token_address),
  reporter_address text,
  reason text not null,
  status text not null default 'open',
  created_at timestamptz not null,
  reviewed_at timestamptz
);

create table if not exists moderation_flags (
  id uuid primary key default gen_random_uuid(),
  token_address text references launches(token_address),
  flag_type text not null,
  subject text not null,
  severity text not null,
  status text not null default 'open',
  created_at timestamptz not null,
  resolved_at timestamptz
);
