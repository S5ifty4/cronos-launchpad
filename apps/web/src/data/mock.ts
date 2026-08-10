import type { CreatorProfile, HolderSnapshot, Launch, ProofPackage, Trade } from './types';

export const launches: Launch[] = [
  { address: '0xcrojack', chainId: 338, name: 'Crojack Protocol', symbol: 'CROJACK', creator: '0x6819...a923', progress: 41.7, reserveRaised: '27,105 CRO', graduationTarget: '65,000 CRO', age: '18m', antiBot: true, protectedName: true, vvsGraduation: true, taxBips: 0, marketCap: '$18.4k', volume24h: '$2.7k', holders: '128', description: 'A protected Cronos meme launch with VVS-first graduation and public LP lock receipts.', status: 'Launching', socials: ['X', 'Website'], color: '#4CDBFF' },
  { address: '0xmvvs', chainId: 338, name: 'Meme VVS Runner', symbol: 'MVVS', creator: '0x7610...1b29', progress: 88.2, reserveRaised: '57,330 CRO', graduationTarget: '65,000 CRO', age: '2h', antiBot: true, protectedName: true, vvsGraduation: true, taxBips: 0, marketCap: '$39.8k', volume24h: '$8.1k', holders: '244', description: 'Near graduation runner with anti-snipe launch rules and configurable VVS router path.', status: 'Near graduation', socials: ['X', 'Telegram'], color: '#9afcff' },
  { address: '0xcrof', chainId: 338, name: 'Crofessor', symbol: 'CROF', creator: '0x4200...7ad1', progress: 12.4, reserveRaised: '8,060 CRO', graduationTarget: '65,000 CRO', age: '6m', antiBot: true, protectedName: true, vvsGraduation: true, taxBips: 0, marketCap: '$6.2k', volume24h: '$940', holders: '49', description: 'Education-themed test launch showing trust badges, creator profile, and blocked clone checks.', status: 'Launching', socials: ['Website'], color: '#ffffff' },
  { address: '0xbcg', chainId: 338, name: 'Blue Chain Gecko', symbol: 'BCG', creator: '0x0c0a...19e8', progress: 100, reserveRaised: '65,000 CRO', graduationTarget: '65,000 CRO', age: '1d', antiBot: true, protectedName: true, vvsGraduation: true, taxBips: 0, marketCap: '$72.5k', volume24h: '$14.2k', holders: '391', description: 'Graduated sample state for the VVS pair, LP vault, and proof panel UX.', status: 'Graduated', socials: ['X', 'Website', 'Discord'], color: '#2f83ff' },
  { address: '0xcrodog', chainId: 338, name: 'Cronos Doghouse', symbol: 'CDOG', creator: '0x9ab1...7e02', progress: 63.9, reserveRaised: '41,535 CRO', graduationTarget: '65,000 CRO', age: '41m', antiBot: true, protectedName: true, vvsGraduation: true, taxBips: 0, marketCap: '$27.9k', volume24h: '$5.9k', holders: '186', description: 'Community kennel runner with Discord raids, Telegram alerts, and no-tax launch rules.', status: 'Launching', socials: ['X', 'Website', 'Discord', 'Telegram'], color: '#ffb84c' },
  { address: '0xmooncro', chainId: 338, name: 'MoonCRO Mission', symbol: 'MCRO', creator: '0x58d2...44af', progress: 95.6, reserveRaised: '62,140 CRO', graduationTarget: '65,000 CRO', age: '3h', antiBot: true, protectedName: true, vvsGraduation: true, taxBips: 0, marketCap: '$51.6k', volume24h: '$11.4k', holders: '312', description: 'Final approach launch showing near-graduation pressure, holder growth, and LP-lock readiness.', status: 'Near graduation', socials: ['Website', 'Telegram'], color: '#b98cff' },
  { address: '0xtectoad', chainId: 338, name: 'Tectonic Toads', symbol: 'TOAD', creator: '0x7730...0c19', progress: 5.8, reserveRaised: '3,770 CRO', graduationTarget: '65,000 CRO', age: '9m', antiBot: true, protectedName: true, vvsGraduation: true, taxBips: 0, marketCap: '$3.1k', volume24h: '$410', holders: '31', description: 'Fresh-launch sample for low-progress filtering and early trust-signal review.', status: 'Launching', socials: ['X', 'Discord'], color: '#72ff91' },
  { address: '0xfulfox', chainId: 338, name: 'Fulcrum Fox', symbol: 'FFOX', creator: '0x6cc1...d91b', progress: 100, reserveRaised: '65,000 CRO', graduationTarget: '65,000 CRO', age: '2d', antiBot: true, protectedName: true, vvsGraduation: true, taxBips: 0, marketCap: '$88.2k', volume24h: '$18.6k', holders: '522', description: 'Graduated reference launch with active socials and a completed LP-lock proof path.', status: 'Graduated', socials: ['X', 'Website', 'Telegram'], color: '#ff6aa8' },
];

export const trades: Trade[] = [
  { side: 'Buy', wallet: '0x8f2a...c5a2', amount: '222 CRO', tokens: '14,204 CROJACK', age: '12s' },
  { side: 'Buy', wallet: '0x2109...771d', amount: '80 CRO', tokens: '5,092 CROJACK', age: '44s' },
  { side: 'Sell', wallet: '0x7b81...aa10', amount: '31 CRO', tokens: '1,840 CROJACK', age: '2m' },
  { side: 'Buy', wallet: '0x5d40...901e', amount: '410 CRO', tokens: '25,193 CROJACK', age: '4m' },
];

export const holders: HolderSnapshot[] = [
  { wallet: 'LP vault', share: '34.2%', note: 'locked on graduation' },
  { wallet: '0x6819...a923', share: '8.6%', note: 'creator' },
  { wallet: '0x2109...771d', share: '4.1%', note: 'buyer' },
  { wallet: '0x5d40...901e', share: '3.7%', note: 'buyer' },
];

export const creatorProfile: CreatorProfile = { wallet: '0x6819...a923', launches: '7', graduated: '3', reports: '0', totalVolume: '$28.1k', socials: ['X', 'Website'] };

export const proofPackage: ProofPackage = [
  { label: 'Factory + registry addresses', value: 'pending deployer wallet', status: 'pending' },
  { label: 'Sample token graduation tx', value: 'covered by mock VVS test', status: 'ready' },
  { label: 'Pair + LP vault lock proof', value: 'covered by LP vault test', status: 'ready' },
  { label: 'No-tax / trust-panel checklist', value: 'documented and visible', status: 'ready' },
];
