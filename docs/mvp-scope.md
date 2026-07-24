# Cronos Launchpad MVP Scope

## Product thesis

Cronos-native bonding-curve launches with stronger trust and identity protection than existing launchpads.

Core wedge: **anti-vamp token identity protection + transparent VVS graduation + anti-snipe launches**.

## MVP surfaces

1. Launch board
   - New, Trending, Near Graduation, Graduated, Protected Launches.
   - Token cards show progress, age, creator, anti-bot badge, name-protection badge, tax badge, socials, quick buy.

2. Create token
   - image, name, symbol, description, socials.
   - graduation target.
   - initial buy.
   - anti-bot mode default enabled.
   - VVS graduation default.
   - name/symbol assessment before submit.

3. Token detail
   - buy/sell panel.
   - progress to graduation.
   - recent trades.
   - holder/activity stats.
   - trust panel: name protected, symbol unique, tax/admin flags, graduation target, VVS route, LP policy.

4. Creator profile
   - launched tokens.
   - graduated tokens.
   - repeated collisions/reports.

5. Admin/moderation
   - reserved names/symbols.
   - report review.
   - verified/project-protected labels.

## MVP non-goals

- No promises of returns/yield.
- No complex taxes in v0.
- No staking/rewards in v0.
- No mainnet deploy until testnet launch flow is proven.
- No formal VVS partnership required before testnet proof.

## Anti-vamp rules

### On-chain

- block duplicate normalized name hash.
- block duplicate normalized symbol hash.
- block reserved ecosystem names/symbols.

### Off-chain

- fuzzy name similarity warning.
- homoglyph folding.
- impersonation/reserved list review.
- report/dispute queue.

## Cronos testnet path

1. Deploy NameRegistry.
2. Deploy LaunchpadFactory with registry address.
3. Configure VVS router/factory addresses once confirmed.
4. Launch sample token.
5. Buy along curve.
6. Hit test graduation target.
7. Graduate to VVS testnet liquidity.
8. Verify UI trust panel and indexer events.
