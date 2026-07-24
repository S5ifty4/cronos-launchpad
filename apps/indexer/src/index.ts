export type IndexerState = {
  chainId: number;
  lastIndexedBlock: bigint;
};

export type DecodedLaunchpadEvent =
  | { type: 'TokenCreated'; token: string; creator: string; blockNumber: bigint; txHash: string }
  | { type: 'TokenBought'; token: string; buyer: string; croIn: bigint; blockNumber: bigint; txHash: string }
  | { type: 'TokenGraduated'; token: string; pair: string; lpVault: string; blockNumber: bigint; txHash: string }
  | { type: 'LpDeposited'; lpToken: string; beneficiary: string; amount: bigint; unlocksAt: bigint; blockNumber: bigint; txHash: string };

export function nextState(state: IndexerState, events: DecodedLaunchpadEvent[]): IndexerState {
  const maxBlock = events.reduce((max, event) => event.blockNumber > max ? event.blockNumber : max, state.lastIndexedBlock);
  return { ...state, lastIndexedBlock: maxBlock };
}

export function describeHandler(event: DecodedLaunchpadEvent): string {
  switch (event.type) {
    case 'TokenCreated': return `upsert launch ${event.token}`;
    case 'TokenBought': return `insert trade ${event.token}`;
    case 'TokenGraduated': return `mark graduated ${event.token}`;
    case 'LpDeposited': return `record LP lock ${event.lpToken}`;
  }
}
