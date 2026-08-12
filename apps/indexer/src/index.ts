export type IndexerState = {
  chainId: number;
  lastIndexedBlock: bigint;
};

export type DecodedLaunchpadEvent =
  | { type: 'TokenCreated'; token: string; creator: string; name: string; symbol: string; graduationTargetWei: bigint; antiBotEnabled: boolean; vvsRouter: string; wrappedNative: string; lpBeneficiary: string; lpLockDurationSeconds: bigint; blockNumber: bigint; txHash: string }
  | { type: 'TokenBought'; token: string; buyer: string; croIn: bigint; tokensOut: bigint; reserveRaisedWei: bigint; blockNumber: bigint; txHash: string }
  | { type: 'TokenSold'; token: string; seller: string; tokensIn: bigint; croOut: bigint; reserveRaisedWei: bigint; blockNumber: bigint; txHash: string }
  | { type: 'TokenGraduated'; token: string; creator: string; vvsRouter: string; pair: string; lpVault: string; reserveRaisedWei: bigint; tokenLiquidity: bigint; liquidity: bigint; lpUnlocksAt: bigint; blockNumber: bigint; txHash: string }
  | { type: 'LpDeposited'; lpToken: string; beneficiary: string; amount: bigint; unlocksAt: bigint; blockNumber: bigint; txHash: string };

export function nextState(state: IndexerState, events: DecodedLaunchpadEvent[]): IndexerState {
  const maxBlock = events.reduce((max, event) => event.blockNumber > max ? event.blockNumber : max, state.lastIndexedBlock);
  return { ...state, lastIndexedBlock: maxBlock };
}

export function describeHandler(event: DecodedLaunchpadEvent): string {
  switch (event.type) {
    case 'TokenCreated': return `upsert launch ${event.token}`;
    case 'TokenBought': return `insert trade ${event.token}`;
    case 'TokenSold': return `insert sell ${event.token}`;
    case 'TokenGraduated': return `mark graduated ${event.token}`;
    case 'LpDeposited': return `record LP lock ${event.lpToken}`;
  }
}
