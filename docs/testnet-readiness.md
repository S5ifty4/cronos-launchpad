# Cronos testnet deploy readiness

This repo is ready to deploy once a local deployer wallet is configured. Do **not** paste private keys into chat or commit `.env`.

Official docs used for this config:

- MetaMask/testnet config: https://docs.cronos.com/for-users/metamask.md
- Public RPC endpoints: https://docs.cronos.com/for-dapp-developers/chain-integration/public-rpc-endpoints.md
- Testnet faucet: https://docs.cronos.com/for-users/testnet-faucet.md
- Contract deployment: https://docs.cronos.com/for-dapp-developers/cronos-smart-contract/contract-deployment.md

## Required inputs

Create `contracts/.env` or export these in your shell before deployment:

```bash
CRONOS_TESTNET_RPC_URL=https://evm-t3.cronos.org/
DEPLOYER_PRIVATE_KEY=0x...
VVS_TESTNET_ROUTER=0xC74C960708f043E04a84038c6D1136EA7Fcb16a1
```

Optional but recommended once the Cronos/VVS team confirms them:

```bash
VVS_TESTNET_FACTORY=0x...
VVS_TESTNET_WCRO=0x6a3173618859C7cd40fAF6921b5E9eB6A76f1fD4
CRONOS_EXPLORER_API_KEY=...
```

## Confirmed VVS testnet inputs

VVS does not run a separate VVS-only chain for testnet integration. Its SDK targets Cronos Testnet:

```text
Chain: Cronos Testnet
Chain ID: 338
RPC: https://evm-t3.cronos.org/
Explorer: https://explorer.cronos.org/testnet
VVS Smart Router: 0xC74C960708f043E04a84038c6D1136EA7Fcb16a1
VVS WCRO: 0x6a3173618859C7cd40fAF6921b5E9eB6A76f1fD4
```

The router and WCRO addresses were sourced from the official `vvs-finance/swap-sdk` Cronos testnet config and verified to have bytecode on Cronos Testnet RPC.

## Still needed from Cronos/VVS team

- VVS testnet factory address.
- Whether whitelist review expects VVS liquidity at launch or only after graduation.
- Minimum reserve / liquidity expectations.
- Required LP posture: locked, burned, or public timelock acceptable.
- Whether token taxes or owner/admin controls disqualify tokens.

## Pre-deploy checks

From repo root:

```bash
pnpm install
pnpm test
pnpm build
pnpm --filter @cronos-launchpad/contracts deploy:check
```

`deploy:check` only verifies local environment variables are present.

## Deploy to Cronos testnet

```bash
pnpm --filter @cronos-launchpad/contracts deploy:cronos-testnet
```

The deploy script will:

1. Deploy `NameRegistry`.
2. Deploy `TimelockedLpVault`.
3. Deploy `LaunchpadFactory` with registry + vault references.
4. Authorize the factory as the registry registrar.
5. Transfer LP vault ownership to the factory so graduation can lock LP tokens.
6. Seed reserved ecosystem names/symbols.
7. Write a deployment manifest to `contracts/deployments/cronos-testnet-<chainId>.json`.

## Graduation flow now covered by tests

The contract suite includes a mock VVS-compatible router/factory path that proves:

```text
launch created
→ reserve target reached
→ graduate() calls addLiquidityETH()
→ mock pair / LP token is created
→ LP tokens are sent to LaunchpadFactory
→ LP tokens are deposited into TimelockedLpVault
→ lock beneficiary + unlock timestamp are recorded
```

The production router address remains configurable. Use the SDK-confirmed VVS testnet router for Cronos Testnet deployments, and keep the VVS factory optional until direct factory usage is required.

## Public proof package after deploy

Capture these before asking Cronos/VVS for review:

- Factory address.
- NameRegistry address.
- TimelockedLpVault address.
- Sample launched token address.
- Sample graduation transaction.
- VVS pair / LP token address.
- LP vault lock info and unlock timestamp.
- Website proof page showing tax disabled, VVS route, LP lock, creator wallet, and contract links.
