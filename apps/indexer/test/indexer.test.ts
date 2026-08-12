import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { describeHandler, nextState } from '../src/index.js';
import { blockRanges, summarizeSimulationProof } from '../src/poller.js';

describe('indexer skeleton', () => {
  it('advances last indexed block from decoded events', () => {
    const state = nextState({ chainId: 338, lastIndexedBlock: 10n }, [
      { type: 'TokenCreated', token: '0x1', creator: '0x2', name: 'Test Token', symbol: 'TEST', graduationTargetWei: 65_000n, antiBotEnabled: true, vvsRouter: '0xrouter', wrappedNative: '0xwcro', lpBeneficiary: '0xlpben', lpLockDurationSeconds: 15552000n, blockNumber: 12n, txHash: '0xaaa' },
      { type: 'TokenBought', token: '0x1', buyer: '0x3', croIn: 1n, tokensOut: 2n, reserveRaisedWei: 1n, blockNumber: 11n, txHash: '0xbbb' },
    ]);
    assert.equal(state.lastIndexedBlock, 12n);
  });

  it('maps event handlers', () => {
    assert.equal(describeHandler({ type: 'LpDeposited', lpToken: '0xlp', beneficiary: '0xben', amount: 1n, unlocksAt: 2n, blockNumber: 3n, txHash: '0xhash' }), 'record LP lock 0xlp');
  });

  it('chunks log scans under Cronos RPC block-range limits', () => {
    assert.deepEqual(blockRanges(10n, 15n, 2n), [
      { fromBlock: 10n, toBlock: 12n },
      { fromBlock: 13n, toBlock: 15n },
    ]);
  });

  it('summarizes local simulation proof completeness', () => {
    const summary = summarizeSimulationProof({ expectedEvents: ['TokenCreated', 'TokenBought', 'TokenGraduated', 'LpDeposited'] });
    assert.equal(summary.complete, true);
    assert.equal(summary.lpDeposited, true);
  });
});
