export type LaunchRecord = {
  chainId: number;
  tokenAddress: string;
  creatorAddress: string;
  name: string;
  symbol: string;
  status: 'launching' | 'graduated' | 'disputed';
  graduationTargetWei: string;
  reserveRaisedWei: string;
  antiBotEnabled: boolean;
  taxBips: number;
  vvsRouter?: string;
  vvsPair?: string;
  lpVault?: string;
  lpUnlocksAt?: string;
};

export type TradeRecord = {
  tokenAddress: string;
  traderAddress: string;
  side: 'buy' | 'sell';
  croAmountWei: string;
  txHash: string;
  blockNumber: string;
};

export const schemaTables = ['launches', 'trades', 'creators', 'holder_snapshots', 'reports', 'moderation_flags'] as const;
