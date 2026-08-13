import { useEffect, useMemo, useState } from 'react';
import { usePublicClient } from 'wagmi';
import type { Launch } from '../data/types';
import { checkGraduationCompatibility, prepareApproveTokenTx, prepareBuyContributionTx, prepareGraduateTokenTx, prepareSellTokenTx } from '../contracts/launchpadClient';
import { explorerTxUrl, shortAddress } from '../wallet/chains';
import { useLaunchpadWallet } from '../wallet/useLaunchpadWallet';

function parseCro(value: string) {
  const match = value.replace(/,/g, '').match(/[\d.]+/);
  return match ? Number(match[0]) : 0;
}

function sameAddress(a?: string, b?: string) {
  return Boolean(a && b && a.toLowerCase() === b.toLowerCase());
}

export function TradePanel({ launch, onConfirmed }: { launch: Launch; onConfirmed?: () => void }) {
  const [mode, setMode] = useState<'buy' | 'sell'>('buy');
  const [amount, setAmount] = useState('1');
  const [txHash, setTxHash] = useState<string>();
  const [status, setStatus] = useState<'idle' | 'approving' | 'simulating' | 'submitted' | 'confirmed' | 'graduating' | 'failed'>('idle');
  const [error, setError] = useState<string>();
  const [graduationCompatibility, setGraduationCompatibility] = useState<{ compatible: boolean; reason: string } | null>(null);
  const wallet = useLaunchpadWallet();
  const publicClient = usePublicClient({ chainId: wallet.chainId });
  const reserve = parseCro(launch.reserveRaised);
  const target = parseCro(launch.graduationTarget);
  const targetReached = target > 0 && reserve >= target;
  const isCreator = sameAddress(wallet.address, launch.creator);
  const buyTx = useMemo(() => prepareBuyContributionTx({ tokenAddress: launch.address, amountCro: amount }), [launch.address, amount]);
  const approveTx = useMemo(() => prepareApproveTokenTx({ tokenAddress: launch.address, amountTokens: amount }), [launch.address, amount]);
  const sellTx = useMemo(() => prepareSellTokenTx({ tokenAddress: launch.address, amountTokens: amount }), [launch.address, amount]);
  const graduateTx = useMemo(() => prepareGraduateTokenTx({ tokenAddress: launch.address }), [launch.address]);
  useEffect(() => {
    let active = true;
    if (!targetReached || launch.status === 'Graduated') {
      setGraduationCompatibility(null);
      return () => { active = false; };
    }
    setGraduationCompatibility(null);
    checkGraduationCompatibility(launch.address).then((next) => {
      if (active) setGraduationCompatibility(next);
    }).catch(() => {
      if (active) setGraduationCompatibility({ compatible: false, reason: 'Graduation compatibility check failed. Try again after refreshing.' });
    });
    return () => { active = false; };
  }, [launch.address, launch.status, targetReached]);
  const graduationCompatible = !targetReached || launch.status === 'Graduated' || graduationCompatibility?.compatible === true;
  const activeTx = mode === 'buy' ? buyTx : sellTx;
  const busy = status === 'approving' || status === 'simulating' || status === 'submitted' || status === 'graduating';
  const canTrade = !targetReached && activeTx.ready && wallet.isConnected && wallet.isCorrectChain && !wallet.isPending && !busy;
  const canGraduate = targetReached && graduationCompatible && !launch.status.includes('Graduated') && isCreator && graduateTx.ready && wallet.isConnected && wallet.isCorrectChain && !wallet.isPending && !busy;
  const readiness = targetReached
    ? launch.status === 'Graduated'
      ? 'Graduated. Trading is closed and LP has been seeded.'
      : isCreator
        ? graduationCompatibility?.compatible === false
          ? graduationCompatibility.reason
          : graduationCompatibility === null
            ? 'Checking graduation route compatibility…'
            : 'Target reached. Creator can graduate this launch when ready.'
        : 'Target reached. Waiting for the creator to run graduation.'
    : !wallet.isConnected
      ? 'Connect wallet to trade this launch.'
      : !wallet.isCorrectChain
        ? 'Switch to Cronos Testnet.'
        : activeTx.ready ? (mode === 'buy' ? 'Ready to buy launch tokens.' : 'Ready to sell launch tokens back to reserve.') : `Waiting: ${activeTx.missing.join(', ')}`;

  const submitTrade = async () => {
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

  const graduate = async () => {
    if (!canGraduate) return;
    setError(undefined);
    setTxHash(undefined);
    try {
      if (!publicClient || !graduateTx.to) throw new Error('Graduation preflight is not ready yet.');
      setStatus('simulating');
      await publicClient.call({ account: wallet.address as `0x${string}`, to: graduateTx.to, data: graduateTx.data, value: graduateTx.value });
      setStatus('graduating');
      const hash = await wallet.sendTransaction(graduateTx);
      if (!hash) return;
      setTxHash(hash);
      setStatus('submitted');
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      if (receipt.status === 'reverted') throw new Error('Graduation reverted on Cronos.');
      setStatus('confirmed');
      onConfirmed?.();
    } catch (err) {
      setStatus('failed');
      setError(err instanceof Error ? err.message : 'Graduation failed');
    }
  };

  return (
    <aside className="tradePanel">
      <h3>{targetReached ? 'Graduation ready' : 'Trade launch'}</h3>
      {targetReached ? (
        <div className="miniPanel graduationNotice">
          <p className="eyebrow">Target reached</p>
          <h3>{launch.reserveRaised} / {launch.graduationTarget}</h3>
          <p>{launch.status === 'Graduated' ? 'This launch has graduated and trading on the launch curve is closed.' : graduationCompatibility?.compatible === false ? 'Graduation is paused while the liquidity route is updated for Cronos Testnet.' : isCreator ? 'You are the creator. Run graduation to seed VVS-compatible liquidity.' : 'Trading is closed while the launch waits for the creator to graduate it.'}</p>
          <button className="button primary" disabled={!canGraduate} onClick={graduate} type="button">
            {status === 'graduating' ? 'Submitting graduation…' : status === 'submitted' ? 'Waiting for graduation…' : launch.status === 'Graduated' ? 'Graduated' : graduationCompatibility?.compatible === false ? 'Graduation paused' : isCreator ? 'Graduate token' : 'Creator only'}
          </button>
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
        <dt>LP status</dt><dd>{launch.status === 'Graduated' ? 'Seeded' : targetReached && graduationCompatibility?.compatible === false ? 'Route update needed' : targetReached ? 'Ready for graduation' : 'Locks on graduation'}</dd>
        <dt>Readiness</dt><dd>{readiness}</dd>
      </dl>
      <button className="button primary" disabled={!canTrade} onClick={submitTrade} type="button">
        {targetReached ? 'Trading closed' : status === 'approving' ? 'Approving…' : status === 'simulating' ? 'Checking tx…' : status === 'submitted' ? 'Waiting for confirmation…' : mode === 'buy' ? 'Buy tokens' : 'Sell tokens'}
      </button>
      <p className="small">Phase 2 factory adds token output on buy, sell redemption, and WCRO-compatible graduation. Old-factory launches cannot use these new functions.</p>
      {txHash && <p className="small">Tx: <a href={explorerTxUrl(txHash, wallet.chainId)} target="_blank" rel="noreferrer">{shortAddress(txHash)} ↗</a></p>}
      {status === 'confirmed' && <p className="small">{targetReached ? 'Graduation' : mode === 'buy' ? 'Buy' : 'Sell'} confirmed.</p>}
      {error && <p className="small">Wallet: {error}</p>}
    </aside>
  );
}
