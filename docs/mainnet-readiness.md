# CronosForge Mainnet Readiness Checklist

Keep Cronos Mainnet disabled until every section is green.

## Contracts
- [ ] Mainnet launchpad factory deployed and verified.
- [ ] Mainnet name registry deployed and verified.
- [ ] Mainnet LP vault deployed and verified.
- [ ] Router and WCRO addresses confirmed against Cronos mainnet docs and bytecode.
- [ ] Deployment manifest records addresses, deployer, commit, chain ID, and block.

## Frontend / Vercel
- [ ] `VITE_CRONOS_MAINNET_FACTORY` configured.
- [ ] `VITE_CRONOS_MAINNET_REGISTRY` configured.
- [ ] `VITE_CRONOS_MAINNET_VAULT` configured.
- [ ] `VITE_CRONOS_MAINNET_VVS_ROUTER` configured.
- [ ] `VITE_CRONOS_MAINNET_WCRO` configured.
- [ ] Production bundle inspected to confirm baked mainnet addresses.
- [ ] Network selector enables Mainnet only after smoke path passes.

## API / Indexer
- [ ] `CHAIN_ID=25` indexer config tested in dry-run mode.
- [ ] Mainnet RPC URL configured outside the browser.
- [ ] Metadata API verifies create txs against mainnet factory.
- [ ] Trades table has tx-hash dedupe.
- [ ] Holder snapshots refresh from confirmed Transfer logs.
- [ ] Backfill command tested against a small block range.

## Smoke path
- [ ] Create a fresh mainnet launch with small target.
- [ ] Initial buy confirmed and visible.
- [ ] Buy after launch confirmed and visible in Trades.
- [ ] Approve/sell confirmed and visible in Trades.
- [ ] Target reached state shown correctly.
- [ ] Manual graduation succeeds.
- [ ] Pair address, LP vault, and unlock proof visible.
- [ ] Post-graduation launch-curve trading is disabled.

## Security / Operations
- [ ] `pnpm audit --audit-level high` passes.
- [ ] Secret scan completed against tree and history.
- [ ] GitHub CI green on main.
- [ ] Admin dashboard shows data freshness and proof queues.
- [ ] Legal/risk copy reviewed for mainnet language.
