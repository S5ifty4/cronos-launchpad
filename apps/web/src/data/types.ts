export type LaunchStatus = 'Launching' | 'Near graduation' | 'Graduated';
export type SocialPlatform = 'website' | 'x' | 'discord' | 'telegram';
export type SocialLink = { platform: SocialPlatform; url: string };

export type Launch = {
  address: string;
  chainId: number;
  name: string;
  symbol: string;
  creator: string;
  progress: number;
  reserveRaised: string;
  graduationTarget: string;
  age: string;
  antiBot: boolean;
  protectedName: boolean;
  vvsGraduation: boolean;
  taxBips: number;
  marketCap: string;
  volume24h: string;
  holders: string;
  description: string;
  status: LaunchStatus;
  socials: SocialLink[];
  color: string;
  imageUrl?: string;
  createdBlock?: number;
  createdTx?: string;
  factoryAddress?: string;
  pairAddress?: string;
  lpVault?: string;
};

export type Trade = { side: 'Buy' | 'Sell'; wallet: string; amount: string; tokens: string; age: string; txHash?: string; blockNumber?: number; timestamp?: string; croAmountWei?: string; reserveRaisedWei?: string };
export type HolderSnapshot = { wallet: string; share: string; note: string };
export type CreatorProfile = { wallet: string; launches: string; graduated: string; reports: string; totalVolume: string; socials: SocialLink[] };
export type ProofPackage = { label: string; value: string; status: 'ready' | 'pending' }[];
