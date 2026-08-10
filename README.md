# Cronos Launchpad MVP

Cronos-native token launchpad prototype focused on:

- anti-vamp name/symbol protection,
- anti-snipe launch limits,
- transparent VVS graduation path,
- launch board + trust panel UX.

## Workspaces

- `packages/core` — tested TypeScript rules/math shared by backend and UI.
- `contracts` — Solidity launchpad/name-registry/LP-lock scaffold.
- `apps/web` — Vite React MVP UI.
- `docs/lp-policy.md` — recommendation: VVS V2 WCRO pair with LP tokens routed to a public 180-day timelock vault.
- `docs/testnet-readiness.md` — deploy prerequisites, scripts, VVS unknowns, and proof-package checklist.
- `docs/design-benchmark.md` — internal UX benchmark notes and Cronos brand alignment; public pages should not mention benchmarked competitors.
- `docs/backend-indexer-architecture.md` — event indexing, DB schema, worker loop, and API shape.
- `docs/trust-admin-creator-proof.md` — trust panel, moderation, creator profile, and proof-package specs.

## Commands

```bash
pnpm install
pnpm test
pnpm build
pnpm web:dev
pnpm contracts:test
pnpm --filter @cronos-launchpad/contracts deploy:local
pnpm --filter @cronos-launchpad/contracts simulate:launch
pnpm --filter @cronos-launchpad/api dev
LAUNCHPAD_FACTORY=0x... LP_VAULT=0x... pnpm --filter @cronos-launchpad/indexer poll:dry-run
pnpm --filter @cronos-launchpad/contracts deploy:check
# after deployer + VVS testnet router are configured:
pnpm --filter @cronos-launchpad/contracts deploy:cronos-testnet
```

## Current chain recommendation

Use Cronos testnet now. VVS testnet integration uses Cronos Testnet chain ID `338`, RPC `https://evm-t3.cronos.org/`, Smart Router `0xC74C960708f043E04a84038c6D1136EA7Fcb16a1`, and WCRO `0x6a3173618859C7cd40fAF6921b5E9eB6A76f1fD4`. Keep the VVS factory optional/configurable until direct factory usage or review requirements demand it.
