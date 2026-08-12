import { useMemo, useState } from 'react';
import { usePublicClient } from 'wagmi';
import type { Launch } from '../data/types';
import { prepareBuyContributionTx } from '../contracts/launchpadClient';
import { explorerTxUrl, shortAddress } from '../wallet/chains';
import { useLaunchpadWallet } from '../wallet/useLaunchpadWallet';

export function TradePanel({ launch, onConfirmed }: { launch: Launch; onConfirmed?: () => void }) {
  const [mode, setMode] = useState<'buy' | 'sell'>('buy');
  const [amountCro, setAmountCro] = useState('1');
  const [txHash, setTxHash] = useState<string>();
  const [status, setStatus] = useState<'idle' | 'simulating' | 'submitted' | 'confirmed' | 'failed'>('idle');
  const [error, setError] = useState<string>();
  const wallet = useLaunchpadWallet();
  const publicClient = usePublicClient({ chainId: wallet.chainId });
  const tx = useMemo(() => prepareBuyContributionTx({ tokenAddress: launch.address, amountCro }), [launch.address, amountCro]);
  const disabled = mode !== 'buy' || !tx.ready || !wallet.isConnected || !wallet.isCorrectChain || wallet.isPending || status === 'simulating' || status === 'submitted';
  const readiness = mode !== 'buy'
    ? 'Sell is not available in the current launch contract.'
    : !wallet.isConnected
      ? 'Connect wallet to contribute CRO.'
      : !wallet.isCorrectChain
        ? 'Switch to Cronos Testnet.'
        : tx.ready ? 'Ready to contribute CRO reserve.' : `Waiting: ${tx.missing.join(', ')}`;

  const contribute = async () => {
    if (disabled) return;
    setError(undefined);
    setTxHash(undefined);
    try {
      if (!publicClient || !tx.to) throw new Error('Live chain preflight is not ready yet.');
      setStatus('simulating');
      await publicClient.call({ account: wallet.address as `0x${string}`, to: tx.to, data: tx.data, value: tx.value });
      const hash = await wallet.sendTransaction(tx);
      if (!hash) return;
      setTxHash(hash);
      setStatus('submitted');
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      if (receipt.status === 'reverted') throw new Error('Contribution reverted on Cronos.');
      setStatus('confirmed');
      onConfirmed?.();
    } catch (err) {
      setStatus('failed');
      setError(err instanceof Error ? err.message : 'Contribution failed');
    }
  };

  return (
    <aside className="tradePanel">
      <h3>Reserve contribution</h3>
      <div className="buySell">
        <button className={mode === 'buy' ? 'active' : ''} type="button" onClick={() => setMode('buy')}>Contribute</button>
        <button className={mode === 'sell' ? 'active' : ''} type="button" onClick={() => setMode('sell')}>Sell</button>
      </div>
      <label className="tradeAmountLabel">CRO amount<input inputMode="decimal" value={amountCro} onChange={(event) => setAmountCro(event.target.value)} disabled={mode !== 'buy'} /></label>
      <div className="amountChips">{['1', '5', '10', '25'].map((amount) => <button type="button" key={amount} onClick={() => setAmountCro(amount)} disabled={mode !== 'buy'}>{amount}</button>)}</div>
      <dl>
        <dt>Action</dt><dd>{mode === 'buy' ? 'Add CRO to launch reserve' : 'Unavailable in v0 contract'}</dd>
        <dt>Token output</dt><dd>No token distribution yet</dd>
        <dt>Creator</dt><dd title={launch.creator}>{shortAddress(launch.creator)}</dd>
        <dt>LP status</dt><dd>Locks on graduation</dd>
        <dt>Readiness</dt><dd>{readiness}</dd>
      </dl>
      <button className="button primary" disabled={disabled} onClick={contribute} type="button">
        {status === 'simulating' ? 'Checking tx…' : status === 'submitted' ? 'Waiting for confirmation…' : 'Contribute CRO'}
      </button>
      <p className="small">Phase 1 wires the live factory <code>buy(token)</code> reserve contribution. Sell and token-output pricing need Phase 2 contract changes.</p>
      {txHash && <p className="small">Tx: <a href={explorerTxUrl(txHash, wallet.chainId)} target="_blank" rel="noreferrer">{shortAddress(txHash)} ↗</a></p>}
      {status === 'confirmed' && <p className="small">Contribution confirmed. Recent trades update after the indexer writes the event.</p>}
      {error && <p className="small">Wallet: {error}</p>}
    </aside>
  );
}
