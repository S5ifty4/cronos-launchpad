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
- `docs/design-benchmark.md` — UX notes from Robinfun, WolfSwap, pump.fun, and Cronos brand alignment.

## Commands

```bash
pnpm install
pnpm test
pnpm build
pnpm web:dev
pnpm contracts:test
pnpm --filter @cronos-launchpad/contracts deploy:check
# after deployer + VVS testnet router are configured:
pnpm --filter @cronos-launchpad/contracts deploy:cronos-testnet
```

## Current chain recommendation

Use Cronos testnet now. Keep VVS router/factory addresses configurable until Cronos/VVS confirms the exact whitelisting requirements and testnet/mainnet addresses.
