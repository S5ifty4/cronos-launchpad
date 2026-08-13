-- Token activity hardening: dedupe indexed event rows and speed public token pages.
create unique index if not exists trades_tx_hash_key on public.trades (tx_hash);
create unique index if not exists holder_snapshots_token_holder_key on public.holder_snapshots (token_address, holder_address);
create index if not exists trades_token_block_idx on public.trades (token_address, block_number desc);
create index if not exists holder_snapshots_token_share_idx on public.holder_snapshots (token_address, share_bips desc);
create index if not exists launches_chain_created_block_idx on public.launches (chain_id, created_block desc);
