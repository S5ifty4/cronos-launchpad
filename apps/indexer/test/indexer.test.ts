import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { describeHandler, nextState } from '../src/index.js';

describe('indexer skeleton', () => {
  it('advances last indexed block from decoded events', () => {
    const state = nextState({ chainId: 338, lastIndexedBlock: 10n }, [
      { type: 'TokenCreated', token: '0x1', creator: '0x2', blockNumber: 12n, txHash: '0xaaa' },
      { type: 'TokenBought', token: '0x1', buyer: '0x3', croIn: 1n, blockNumber: 11n, txHash: '0xbbb' },
    ]);
    assert.equal(state.lastIndexedBlock, 12n);
  });

  it('maps event handlers', () => {
    assert.equal(describeHandler({ type: 'LpDeposited', lpToken: '0xlp', beneficiary: '0xben', amount: 1n, unlocksAt: 2n, blockNumber: 3n, txHash: '0xhash' }), 'record LP lock 0xlp');
  });
});
