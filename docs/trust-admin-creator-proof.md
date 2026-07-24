# Trust, admin, creator, and proof surfaces

This document defines the non-contract product surfaces that make Cronos Launchpad different from generic fair-launch boards.

## Trust panel model

Avoid vague claims like “safe token.” Use factual risk signals.

### Launch proof fields

- Name protection: protected / warning / blocked.
- Symbol uniqueness: unique / similar / reserved.
- Reserved ecosystem name check: passed / blocked.
- Anti-snipe: enabled / disabled / expired.
- Tax: no tax / tax present / unknown.
- Source: pending / verified / mismatch.
- Graduation: launching / near graduation / graduated.
- VVS route: configured / missing / unknown.
- LP status: pending / locked / burned / unknown.
- Creator wallet: visible and linked.
- Top holders: top 10 %, creator %, LP/vault %.
- Reports: none / open / disputed / hidden.

### Public wording

Use:

```text
Launch Proof
Risk Signals
LP lock status
Identity protection
```

Avoid:

```text
Guaranteed safe
Approved investment
Official Cronos token
Bot-proof
Rug-proof
```

## Admin / moderation dashboard

Anti-vamp protection needs an operator surface.

### Queues

- Reserved-name requests.
- Similar name/symbol warnings.
- User reports.
- Inappropriate media.
- Impersonation claims.
- Creator appeal / review.

### Actions

- Block reserved name/symbol.
- Mark launch as disputed.
- Hide abusive image/text from UI while preserving on-chain facts.
- Add verified-project exception.
- Resolve report.
- Add admin note.

### Data required

- token address
- creator wallet
- submitted name/symbol
- normalized/folded name/symbol
- matching launches
- report count
- admin status
- created/resolved timestamps

## Creator profile

Creator reputation should follow wallets.

### Public profile fields

- wallet address
- display name if claimed
- social links reused across launches
- total launches
- graduated launches
- total volume
- report/dispute count
- launch history
- average graduation progress
- most recent launch

### Why this matters

Meme launchpads need social context. Creator history makes spam/clones easier to identify without slowing legitimate launches.

## Cronos / VVS proof package page

Before approaching Cronos/VVS, publish a proof page or section with placeholders that become real links after deploy.

### Fields

- LaunchpadFactory address
- NameRegistry address
- TimelockedLpVault address
- sample launch token address
- sample graduation transaction
- VVS router address
- VVS pair address
- LP token address
- LP lock vault address
- unlock timestamp
- tax/admin-control checklist
- source verification links

### Narrative

```text
Cronos Launchpad defaults to protected names, no-tax v0 launches, anti-snipe windows, VVS-compatible graduation, and public LP-lock proof.
```

Do not mention internal competitors or benchmarked products on the public page.
