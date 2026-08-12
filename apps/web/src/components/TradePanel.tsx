import { useMemo, useState } from 'react';
import { usePublicClient } from 'wagmi';
import type { Launch } from '../data/types';
import { prepareApproveTokenTx, prepareBuyContributionTx, prepareSellTokenTx } from '../contracts/launchpadClient';
import { explorerTxUrl, shortAddress } from '../wallet/chains';
import { useLaunchpadWallet } from '../wallet/useLaunchpadWallet';

function parseCro(value: string) {
  const match = value.replace(/,/g, '').match(/[\d.]+/);
  return match ? Number(match[0]) : 0;
}

export function TradePanel({ launch, onConfirmed }: { launch: Launch; onConfirmed?: () => void }) {
  const [mode, setMode] = useState<'buy' | 'sell'>('buy');
  const [amount, setAmount] = useState('1');
  const [txHash, setTxHash] = useState<string>();
  const [status, setStatus] = useState<'idle' | 'approving' | 'simulating' | 'submitted' | 'confirmed' | 'failed'>('idle');
  const [error, setError] = useState<string>();
  const wallet = useLaunchpadWallet();
  const publicClient = usePublicClient({ chainId: wallet.chainId });
  const reserve = parseCro(launch.reserveRaised);
  const target = parseCro(launch.graduationTarget);
  const targetReached = target > 0 && reserve >= target;
  const buyTx = useMemo(() => prepareBuyContributionTx({ tokenAddress: launch.address, amountCro: amount }), [launch.address, amount]);
  const approveTx = useMemo(() => prepareApproveTokenTx({ tokenAddress: launch.address, amountTokens: amount }), [launch.address, amount]);
  const sellTx = useMemo(() => prepareSellTokenTx({ tokenAddress: launch.address, amountTokens: amount }), [launch.address, amount]);
  const activeTx = mode === 'buy' ? buyTx : sellTx;
  const canTrade = !targetReached && activeTx.ready && wallet.isConnected && wallet.isCorrectChain && !wallet.isPending && status !== 'approving' && status !== 'simulating' && status !== 'submitted';
  const readiness = targetReached
    ? 'Graduation target reached. Trading/contributions close before LP seeding.'
    : !wallet.isConnected
      ? 'Connect wallet to trade this launch.'
      : !wallet.isCorrectChain
        ? 'Switch to Cronos Testnet.'
        : activeTx.ready ? (mode === 'buy' ? 'Ready to buy launch tokens.' : 'Ready to sell launch tokens back to reserve.') : `Waiting: ${activeTx.missing.join(', ')}`;

  const submit = async () => {
    if (!canTrade) return;
    setError(undefined);
    setTxHash(undefined);
    try {
      if (!publicClient || !activeTx.to) throw new Error('Live chain preflight is not ready yet.');
      if (mode === 'sell') {
        if (!approveTx.ready || !approveTx.to) throw new Error(`Approval not ready: ${approveTx.missing.join(', ')}`);
        setStatus('approving');
        const approveHash = await wallet.sendTransaction(approveTx);
        if (!approveHash) return;
        const approveReceipt = await publicClient.waitForTransactionReceipt({ hash: approveHash });
        if (approveReceipt.status === 'reverted') throw new Error('Token approval reverted on Cronos.');
      }
      setStatus('simulating');
      await publicClient.call({ account: wallet.address as `0x${string}`, to: activeTx.to, data: activeTx.data, value: activeTx.value });
      const hash = await wallet.sendTransaction(activeTx);
      if (!hash) return;
      setTxHash(hash);
      setStatus('submitted');
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      if (receipt.status === 'reverted') throw new Error(`${mode === 'buy' ? 'Buy' : 'Sell'} reverted on Cronos.`);
      setStatus('confirmed');
      onConfirmed?.();
    } catch (err) {
      setStatus('failed');
      setError(err instanceof Error ? err.message : `${mode === 'buy' ? 'Buy' : 'Sell'} failed`);
    }
  };

  return (
    <aside className="tradePanel">
      <h3>{targetReached ? 'Graduation ready' : 'Trade launch'}</h3>
      {targetReached ? (
        <div className="miniPanel graduationNotice">
          <p className="eyebrow">Target reached</p>
          <h3>{launch.reserveRaised} / {launch.graduationTarget}</h3>
          <p>The reserve target is met. Trading closes before LP seeding. Run graduation on the Phase 2 factory.</p>
        </div>
      ) : null}
      <div className="buySell">
        <button className={mode === 'buy' ? 'active' : ''} type="button" onClick={() => setMode('buy')} disabled={targetReached}>Buy</button>
        <button className={mode === 'sell' ? 'active' : ''} type="button" onClick={() => setMode('sell')} disabled={targetReached}>Sell</button>
      </div>
      <label className="tradeAmountLabel">{mode === 'buy' ? 'CRO amount' : `${launch.symbol} amount`}<input inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} disabled={targetReached} /></label>
      <div className="amountChips">{['1', '5', '10', '25'].map((nextAmount) => <button type="button" key={nextAmount} onClick={() => setAmount(nextAmount)} disabled={targetReached}>{nextAmount}</button>)}</div>
      <dl>
        <dt>Action</dt><dd>{targetReached ? 'Graduate launch' : mode === 'buy' ? 'Buy launch tokens' : 'Sell launch tokens'}</dd>
        <dt>Pricing</dt><dd>Fixed v1 curve: target reserve buys 50% supply</dd>
        <dt>Creator</dt><dd title={launch.creator}>{shortAddress(launch.creator)}</dd>
        <dt>LP status</dt><dd>{targetReached ? 'Ready for graduation' : 'Locks on graduation'}</dd>
        <dt>Readiness</dt><dd>{readiness}</dd>
      </dl>
      <button className="button primary" disabled={!canTrade} onClick={submit} type="button">
        {targetReached ? 'Trading closed' : status === 'approving' ? 'Approving…' : status === 'simulating' ? 'Checking tx…' : status === 'submitted' ? 'Waiting for confirmation…' : mode === 'buy' ? 'Buy tokens' : 'Sell tokens'}
      </button>
      <p className="small">Phase 2 factory adds token output on buy, sell redemption, and WCRO-compatible graduation. Existing old-factory launches cannot use these new functions.</p>
      {txHash && <p className="small">Tx: <a href={explorerTxUrl(txHash, wallet.chainId)} target="_blank" rel="noreferrer">{shortAddress(txHash)} ↗</a></p>}
      {status === 'confirmed' && <p className="small">{mode === 'buy' ? 'Buy' : 'Sell'} confirmed.</p>}
      {error && <p className="small">Wallet: {error}</p>}
    </aside>
  );
}
