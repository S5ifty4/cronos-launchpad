import { useCallback, useEffect, useState } from 'react';
import { Badge } from '../components/Badge';
import { HoldersTable, TradesTable } from '../components/DataTable';
import { Metric } from '../components/Metric';
import { ReserveChart } from '../components/ReserveChart';
import { SocialLinks } from '../components/SocialLinks';
import { TokenGlyph } from '../components/TokenGlyph';
import { TradePanel } from '../components/TradePanel';
import { fetchOnchainHolders, fetchOnchainLaunchState, fetchOnchainTradeEvents } from '../contracts/launchpadClient';
import { fetchLaunchByAddress, fetchLaunchHolders, fetchLaunchTrades, getLaunches } from '../data/api';
import type { HolderSnapshot, Launch, Trade } from '../data/types';
import { cronosTestnet, explorerAddressUrl, shortAddress } from '../wallet/chains';

function parseCroAmount(value: string) {
  const match = value.replace(/,/g, '').match(/[\d.]+/);
  return match ? Number(match[0]) : 0;
}

function withReserve(launch: Launch, reserveRaised: string, graduated: boolean, graduationTarget?: string): Launch {
  const nextTarget = graduationTarget ?? launch.graduationTarget;
  const target = parseCroAmount(nextTarget) || 1;
  const reserve = parseCroAmount(reserveRaised);
  const targetReached = reserve / target >= 1;
  return {
    ...launch,
    reserveRaised,
    graduationTarget: nextTarget,
    progress: Math.min(100, Number(((reserve / target) * 100).toFixed(1))),
    status: graduated ? 'Graduated' : targetReached ? 'Near graduation' : reserve / target >= 0.85 ? 'Near graduation' : launch.status,
  };
}

function CopyAddressButton({ address }: { address: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      aria-label="Copy token address"
      className="copyAddressButton"
      title={copied ? 'Copied' : 'Copy token address'}
      type="button"
      onClick={() => {
        navigator.clipboard?.writeText(address).then(() => {
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1800);
        }).catch(() => undefined);
      }}
    >
      <span>{shortAddress(address)}</span>
      <b aria-hidden="true">{copied ? '✓' : '⧉'}</b>
    </button>
  );
}

function ExplorerAddressLink({ address }: { address: string }) {
  return (
    <a
      aria-label="Open token contract on explorer"
      className="addressExplorerLink"
      href={explorerAddressUrl(address)}
      rel="noreferrer"
      target="_blank"
      title="Open token contract on explorer"
    >
      ↗
    </a>
  );
}

function TokenSkeleton({ address }: { address?: string }) {
  return (
    <section className="panel tokenDetail">
      <div className="miniPanel tokenLoadingPanel">
        <div className="skeletonHeader"><span /><div><i /><i /></div></div>
        <div className="skeletonLines"><span /><span /><span /></div>
        {address && <a className="button secondary tokenLoadingExplorer" href={`${cronosTestnet.blockExplorerUrls[0]}/address/${address}`} target="_blank" rel="noreferrer">View contract on explorer ↗</a>}
      </div>
    </section>
  );
}

export function TokenPage({ address }: { address?: string }) {
  const knownLaunch = getLaunches().find((launch) => launch.address.toLowerCase() === address?.toLowerCase());
  const [indexedLaunch, setIndexedLaunch] = useState<Launch | null>(knownLaunch ?? null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [holders, setHolders] = useState<HolderSnapshot[]>([]);
  const [loading, setLoading] = useState(Boolean(address && !knownLaunch));
  const [tradesLoading, setTradesLoading] = useState(Boolean(address));
  const [holdersLoading, setHoldersLoading] = useState(Boolean(address));
  const launch = indexedLaunch ?? knownLaunch;

  const refreshTokenData = useCallback(() => {
    if (!address) return;
    setLoading(true);
    Promise.all([fetchLaunchByAddress(address), fetchOnchainLaunchState(address)])
      .then(([nextLaunch, state]) => {
        if (nextLaunch?.address.toLowerCase() !== address.toLowerCase()) return;
        setIndexedLaunch(state ? withReserve(nextLaunch, state.reserveRaised, state.graduated, state.graduationTarget) : nextLaunch);
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
    setTradesLoading(true);
    Promise.allSettled([fetchLaunchTrades(address), fetchOnchainTradeEvents(address)])
      .then(([indexedResult, onchainResult]) => {
        const indexedTrades = indexedResult.status === 'fulfilled' ? indexedResult.value : [];
        const onchainTrades = onchainResult.status === 'fulfilled' ? onchainResult.value : [];
        setTrades(onchainTrades.length ? onchainTrades : indexedTrades);
      })
      .catch(() => setTrades([]))
      .finally(() => setTradesLoading(false));
    setHoldersLoading(true);
    Promise.allSettled([fetchLaunchHolders(address), fetchOnchainHolders(address)])
      .then(([indexedResult, onchainResult]) => {
        const indexedHolders = indexedResult.status === 'fulfilled' ? indexedResult.value : [];
        const onchainHolders = onchainResult.status === 'fulfilled' ? onchainResult.value : [];
        setHolders(onchainHolders.length ? onchainHolders : indexedHolders);
      })
      .catch(() => setHolders([]))
      .finally(() => setHoldersLoading(false));
  }, [address]);

  useEffect(() => {
    refreshTokenData();
  }, [refreshTokenData]);

  if (!address) {
    return (
      <section className="panel tokenDetail">
        <div className="miniPanel">
          <p className="eyebrow">Token detail</p>
          <h2>Token address missing.</h2>
          <p className="lede">Open a token page with /token/:address.</p>
        </div>
      </section>
    );
  }

  if (!launch && loading) return <TokenSkeleton address={address} />;

  if (!launch) {
    return (
      <section className="panel tokenDetail">
        <div className="miniPanel">
          <p className="eyebrow">Token detail</p>
          <h2>Launch not found yet.</h2>
          <p className="lede">This token is not available on the live board yet. If you just created it, give the page a moment and refresh; otherwise verify the contract on Cronos Testnet.</p>
          <div className="queueList"><div><span>Token address</span><b>{shortAddress(address)}</b><em>pending</em></div><div><span>Visibility</span><b>Not on live board yet</b><em>pending</em></div></div>
          <a className="button secondary" href={`${cronosTestnet.blockExplorerUrls[0]}/address/${address}`} target="_blank" rel="noreferrer">View contract on explorer ↗</a>
        </div>
      </section>
    );
  }

  return (
    <section className="panel tokenDetail">
      <div className="tokenMainColumn">
        <div className="tokenHeader">
          <TokenGlyph launch={launch} size="large" />
          <div>
            <div className="tokenHeaderMeta"><p className="eyebrow">Token detail</p><CopyAddressButton address={launch.address} /><ExplorerAddressLink address={launch.address} /></div>
            <h2>{launch.name} <span>${launch.symbol}</span></h2>
            <p>{launch.description || 'Launch details are still filling in.'}</p>
            <SocialLinks socials={launch.socials} />
            <div className="badges"><Badge>No tax</Badge><Badge tone={launch.status === 'Graduated' ? 'blue' : launch.status === 'Near graduation' ? 'warn' : 'neutral'}>{launch.status}</Badge><Badge tone="blue">Live trading</Badge></div>
          </div>
        </div>
        <div className="detailStats"><Metric label="reserve raised" value={launch.reserveRaised} /><Metric label="graduation target" value={launch.graduationTarget} /><Metric label="trades" value={tradesLoading && !trades.length ? '…' : trades.length.toString()} /><Metric label="progress" value={`${launch.progress}%`} /></div>
        <ReserveChart launch={launch} trades={trades} />
        <div className="tablesGrid"><TradesTable trades={trades} loading={tradesLoading} /><HoldersTable holders={holders} loading={holdersLoading} /></div>
      </div>
      <TradePanel launch={launch} onConfirmed={refreshTokenData} />
    </section>
  );
}
