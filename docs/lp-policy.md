# LP policy recommendation

## Recommendation

For MVP and eventual Cronos/VVS whitelist-readiness, use a **VVS V2 WCRO pair with LP tokens sent to a public timelock vault**.

Default policy:

- Graduation DEX: VVS V2.
- Pair: launched token / WCRO.
- LP recipient: launchpad-controlled `TimelockedLpVault`, not creator wallet.
- Minimum lock: 180 days for MVP; consider 365 days for serious mainnet launches.
- Public proof: token page shows VVS pair, LP token address, LP vault address, unlock timestamp, and whether emergency withdrawal is impossible.
- Creator taxes: disabled in v0 unless explicitly approved for a launch.

## Why timelock beats burn for v0

Burning LP is the strongest rug-resistance signal, but it is irreversible and can create operational issues if VVS/Cronos whitelist criteria require migration, correction, or rebalancing. A timelock gives strong buyer confidence while preserving a narrow path for future protocol-level changes after the lock expires.

## Permission / approval model

Adding liquidity to a Uniswap V2-style router like VVS Router is generally permissionless: a contract can call `addLiquidityETH` if it has tokens/CRO and has approved the router. We should not need VVS team approval just to create a pool and seed LP.

What likely does require VVS/Cronos coordination:

- token whitelist / official UI token list,
- co-marketing or featured placement,
- confirming exact whitelist requirements,
- confirming whether LP lock duration/minimum liquidity/admin controls matter,
- any special launchpad partnership or official integration.

## Current verified public VVS mainnet contract facts

Official VVS docs list Cronos mainnet V2 contracts:

- VVS Router: `0x145863Eb42Cf62847A6Ca784e6416C1682b1b2Ae`
- VVS Factory: `0x3b44b2a187a7b3824131f8db5a74194d0a42fc15`
- WCRO: `0x5C7F8A570d578ED84E63fdFA7b1eE72dEae1AE23`

Source: `https://docs.vvs.finance/docs/smart-contracts-and-security/vvs-exchange-contracts-vvs-router.md`

## Still needed from Cronos/VVS team

Public docs confirm mainnet addresses, but I did not find authoritative VVS testnet router/factory/WCRO addresses. Before testnet graduation, get or verify:

- Cronos testnet VVS router address,
- Cronos testnet VVS factory address,
- Cronos testnet WCRO address,
- whether a public VVS testnet deployment exists at all,
- whitelist requirements: min liquidity, lock/burn policy, token admin controls, tax limits, pair requirements.

If no VVS testnet exists, use a local/mock Uniswap V2 router for contract tests and deploy the launchpad to Cronos testnet with graduation disabled until mainnet/testnet router details are confirmed.
