# Cronos Testnet create-token debug handoff

Date: 2026-08-10

## Current status

The live create-token UI can submit a transaction, but the currently configured live factory still reverts on Cronos Testnet.

Most recent user-failed tx:

- Tx hash: `0x37c3f6be67ba78ef55b3cc6a63539681b8b93193b8aa2e39728e7298cafe6a3b`
- To: `0xb39452a805657c6aaef5d804934d44c814f35906`
- From: `0x7dec46c3792e749a804d8923d74bdf59364cad9d`
- Value: `1 TCRO`
- Status: failed / `0x0`
- Gas used: `10,500,000`
- Logs: `0`

Important: this tx went to the original deployed factory `0xb394...5906`, which is known to revert. It did not use later experimental redeploys.

## Already fixed and pushed

- `d124885 fix: chunk Cronos indexer log scans`
  - Indexer now chunks Cronos `eth_getLogs` scans under the 2,000-block RPC limit.
- `1f4e5a5 fix: trim contract address env values`
  - Frontend trims hidden newlines from Vercel env-loaded addresses.
- `9640609 fix: wrap long wallet errors`
  - Long viem/MetaMask errors wrap and do not stretch the create card.
- `71db3f2 fix: require create token fields before submit`
  - Submit stays disabled until wallet, token name, symbol, and positive graduation target are valid.

## UI validation behavior now expected

Blank create form should show readiness like:

`waiting: wallet address, token name, symbol, graduation target`

and the submit button should be disabled.

## Contract/debug findings

The original factory at `0xb39452a805657c6aaef5d804934d44c814f35906` reverts during `createToken` with no revert data.

Decoded failed user tx args looked valid:

- name: `Cronut`
- symbol: `CRONUT`
- graduation target: `5 TCRO`
- initial buy: `1 TCRO`
- anti-snipe: enabled
- router: `0xC74C960708f043E04a84038c6D1136EA7Fcb16a1`
- lp beneficiary: `0x7Dec46c3792E749A804D8923d74BdF59364CAd9d`
- LP lock duration: 180 days

Registry checks for `cronut` / `CRONUT` returned zero address, so duplicate name/symbol was not the cause.

A diagnostic factory that deploys `LaunchToken`, calls `NameRegistry.claimIdentity`, stores config, and emits simplified events successfully passed `eth_estimateGas` on Cronos Testnet. This means token deployment + registry claim can work on Cronos Testnet.

Several experimental changes to `LaunchpadFactory` were tried locally and/or redeployed experimentally but did not yet produce a green estimate:

- set Hardhat `evmVersion: paris`
- remove `nonReentrant` from `createToken`
- remove `ReentrancyGuard` entirely
- replace immutable `NameRegistry`/`TimelockedLpVault` with plain address storage
- remove `Ownable` inheritance

Those experimental changes were not committed as production fixes because the replacement factory still did not pass `eth_estimateGas`.

## Important local state handling

The uncommitted experimental contract/debug files should be stashed before starting a fresh session, not committed to `main` unless explicitly continuing that line of debugging.

## Recommended next step

Start a fresh session and continue systematic contract isolation:

1. Reproduce the original factory revert with `eth_estimateGas` against the configured live factory.
2. Keep a minimal diagnostic factory that is known green.
3. Diff the green diagnostic factory against `LaunchpadFactory`.
4. Add production features back one at a time until estimate fails.
5. Once a replacement factory passes `eth_estimateGas` for a create-token tx on Cronos Testnet, deploy it, update Vercel/indexer envs, and only then ask the user to retry.

Do **not** ask the user to retry create-token until the replacement factory is proven green by `eth_estimateGas`.
