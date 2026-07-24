# VVS graduation recommendation

## Recommendation

Build the MVP so **graduation creates/seeds liquidity on VVS by default**. Do not require a formal VVS partnership for the first testnet version; use public router/factory interfaces where possible, then pursue VVS/Cronos whitelist coordination once we can demonstrate a clean end-to-end launch on testnet.

## Why

Cronos team guidance says whitelist candidates need VVS liquidity. That makes VVS the safest canonical graduation destination for serious launch candidates.

## MVP design

- Bonding curve collects CRO on Cronos testnet.
- When the reserve target is reached, the launch can graduate.
- Graduation path:
  1. mint/allocate unsold token supply for liquidity,
  2. wrap native CRO to WCRO if required by router,
  3. call VVS-compatible router `addLiquidityETH` / `addLiquidity`,
  4. send LP tokens to a locker/burn address or time-lock contract,
  5. emit `TokenGraduated` with router, pair, LP recipient, and liquidity amounts.

## Partnership / tie-up path

A formal tie-up is useful later for credibility and routing, but it should not block MVP. The ask to VVS/Cronos should be concrete:

- launchpad factory address on testnet/mainnet,
- token template address,
- graduation manager address,
- sample graduated token,
- LP lock policy,
- whitelist criteria checklist,
- UI proof page showing liquidity, LP recipient, tax/admin flags, and creator wallet.

## Verified public VVS mainnet facts

Official VVS docs confirm VVS V2 is Uniswap-v2-style and exposes permissionless router methods including `addLiquidityETH` for CRC20/WCRO liquidity.

Mainnet contracts from VVS docs:

- VVS Router: `0x145863Eb42Cf62847A6Ca784e6416C1682b1b2Ae`
- VVS Factory: `0x3b44b2a187a7b3824131f8db5a74194d0a42fc15`
- WCRO: `0x5C7F8A570d578ED84E63fdFA7b1eE72dEae1AE23`

Source: `https://docs.vvs.finance/docs/smart-contracts-and-security/vvs-exchange-contracts-vvs-router.md`

## Open items requiring Cronos/VVS confirmation

- Current Cronos testnet VVS router/factory/WCRO addresses, or confirmation that no public VVS testnet deployment exists.
- Whether whitelist requires VVS liquidity at launch or after launchpad graduation.
- Minimum liquidity / reserve expectation.
- Whether LP must be locked, burned, or simply public.
- Whether creator/admin controls disqualify tokens.
- Whether token tax disqualifies or complicates whitelisting.

## MVP default policy

- Cronos testnet first.
- VVS graduation adapter as the default.
- Router/factory addresses configurable, not hardcoded.
- If no public VVS testnet router exists, use a mock Uniswap V2 adapter in tests and keep live Cronos-testnet graduation disabled until addresses are confirmed.
- LP tokens routed into a public timelock vault by default, minimum 180-day lock.
- Token tax disabled in v0 unless a specific launch requires it.
- Auto-graduation on by default once target is met.
