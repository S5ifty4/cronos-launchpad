# Backend and indexer architecture

Cronos Launchpad needs an event-first backend so the UI can stay fast while contracts remain the source of truth.

## Goals

- Index factory, trade, graduation, and LP-vault events.
- Serve fast board/detail queries.
- Preserve public proof links for every launch.
- Keep fuzzy anti-vamp checks and moderation status off-chain while exact identity claims remain on-chain.

## Event sources

Primary contracts:

- `LaunchpadFactory`
  - `TokenCreated`
  - `TokenBought`
  - `TokenGraduated`
- `NameRegistry`
  - `TokenIdentityClaimed`
  - `NameReserved`
  - `SymbolReserved`
- `TimelockedLpVault`
  - `LpDeposited`
  - `LpWithdrawn`

Secondary chain reads:

- token `name`, `symbol`, `decimals`, `totalSupply`
- VVS pair address
- LP token balances
- holder snapshots
- explorer verification status

## Suggested stack

- Node/TypeScript worker
- Viem for RPC reads and log decoding
- Postgres/Supabase for indexed state
- API layer: Next.js/Express/Fastify later; static mock now
- Cron job / queue worker for holder snapshots and verification polling

## Tables

### launches

```sql
create table launches (
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
  telegram_url text,
  website_url text,
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
```

### trades

```sql
create table trades (
  id uuid primary key default gen_random_uuid(),
  chain_id integer not null,
  token_address text not null references launches(token_address),
  trader_address text not null,
  side text not null,
  cro_amount_wei numeric not null,
  token_amount numeric,
  tx_hash text not null,
  block_number bigint not null,
  traded_at timestamptz not null
);
```

### creators

```sql
create table creators (
  wallet_address text primary key,
  display_name text,
  x_url text,
  website_url text,
  launches_count integer not null default 0,
  graduated_count integer not null default 0,
  report_count integer not null default 0,
  first_seen_at timestamptz not null,
  updated_at timestamptz not null
);
```

### holder_snapshots

```sql
create table holder_snapshots (
  id uuid primary key default gen_random_uuid(),
  chain_id integer not null,
  token_address text not null references launches(token_address),
  holder_address text not null,
  balance numeric not null,
  share_bips integer not null,
  label text,
  snapshot_block bigint not null,
  captured_at timestamptz not null
);
```

### reports

```sql
create table reports (
  id uuid primary key default gen_random_uuid(),
  token_address text not null references launches(token_address),
  reporter_address text,
  reason text not null,
  status text not null default 'open',
  notes text,
  created_at timestamptz not null,
  reviewed_at timestamptz
);
```

### moderation_flags

```sql
create table moderation_flags (
  id uuid primary key default gen_random_uuid(),
  token_address text references launches(token_address),
  flag_type text not null,
  subject text not null,
  severity text not null,
  status text not null default 'open',
  created_at timestamptz not null,
  resolved_at timestamptz
);
```

## API shape

```text
GET /api/launches?status=launching&sort=volume24h&q=cro
GET /api/launches/:chainId/:tokenAddress
GET /api/launches/:chainId/:tokenAddress/trades
GET /api/launches/:chainId/:tokenAddress/holders
GET /api/creators/:walletAddress
POST /api/reports
GET /api/admin/flags
POST /api/admin/flags/:id/resolve
```

## Worker loop

1. Load last indexed block.
2. Fetch logs for known launchpad contracts.
3. Decode events.
4. Upsert launch/trade/graduation records.
5. On graduation, resolve pair and LP-vault lock state.
6. Periodically snapshot holders and source verification.
7. Recompute board metrics: progress, mcap, volume, holders, risk signals.
8. Persist last indexed block only after successful transaction commit.

## Trust-panel computed fields

- `identityStatus`: protected / warning / blocked
- `taxStatus`: no tax / tax present
- `graduationStatus`: launching / near graduation / graduated
- `lpStatus`: pending / locked / burned / unknown
- `sourceStatus`: pending / verified / failed
- `holderConcentration`: top 10 share and creator share
- `reportStatus`: clear / open reports / disputed

## MVP boundary

Before deployer wallet, this remains an architecture doc and static UI mock. After testnet deployment, build the worker against the emitted events and switch the board/detail page from mock data to indexed API data.
