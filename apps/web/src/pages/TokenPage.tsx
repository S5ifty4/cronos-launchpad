import { useCallback, useEffect, useState } from 'react';
import { Badge } from '../components/Badge';
import { HoldersTable, TradesTable } from '../components/DataTable';
import { Metric } from '../components/Metric';
import { ReserveChart } from '../components/ReserveChart';
import { SocialLinks } from '../components/SocialLinks';
import { TokenGlyph } from '../components/TokenGlyph';
import { TradePanel } from '../components/TradePanel';
import { fetchOnchainBuyEvents, fetchOnchainLaunchState } from '../contracts/launchpadClient';
import { fetchLaunchByAddress, fetchLaunchHolders, fetchLaunchTrades, getLaunchByAddress, getLaunches } from '../data/api';
import type { HolderSnapshot, Launch, Trade } from '../data/types';
import { cronosTestnet, shortAddress } from '../wallet/chains';

function parseCroAmount(value: string) {
  const match = value.replace(/,/g, '').match(/[\d.]+/);
  return match ? Number(match[0]) : 0;
}

function withReserve(launch: Launch, reserveRaised: string, graduated: boolean): Launch {
  const target = parseCroAmount(launch.graduationTarget) || 1;
  const reserve = parseCroAmount(reserveRaised);
  return {
    ...launch,
    reserveRaised,
    progress: Math.min(100, Number(((reserve / target) * 100).toFixed(1))),
    status: graduated ? 'Graduated' : reserve / target >= 0.85 ? 'Near graduation' : launch.status,
  };
}

export function TokenPage({ address }: { address?: string }) {
  const knownLaunch = getLaunches().find((launch) => launch.address.toLowerCase() === address?.toLowerCase());
  const [indexedLaunch, setIndexedLaunch] = useState<Launch | null>(knownLaunch ?? null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [holders, setHolders] = useState<HolderSnapshot[]>([]);
  const launch = indexedLaunch ?? knownLaunch ?? getLaunchByAddress(address);

  const refreshTokenData = useCallback(() => {
    if (!address) return;
    fetchLaunchByAddress(address)
      .then((nextLaunch) => {
        if (nextLaunch.address.toLowerCase() === address.toLowerCase()) setIndexedLaunch(nextLaunch);
      })
      .catch(() => undefined);
    fetchLaunchTrades(address).then(setTrades).catch(() => setTrades([]));
    fetchOnchainLaunchState(address)
      .then((state) => {
        if (!state) return;
        setIndexedLaunch((current) => withReserve(current ?? knownLaunch ?? getLaunchByAddress(address), state.reserveRaised, state.graduated));
      })
      .catch(() => undefined);
    fetchOnchainBuyEvents(address)
      .then((onchainTrades) => {
        if (onchainTrades.length) setTrades(onchainTrades);
      })
      .catch(() => undefined);
    fetchLaunchHolders(address).then(setHolders).catch(() => setHolders([]));
  }, [address, knownLaunch]);

  useEffect(() => {
    refreshTokenData();
  }, [refreshTokenData]);

  if (address && !indexedLaunch && !knownLaunch) {
    return (
      <section className="panel tokenDetail">
        <div className="miniPanel">
          <p className="eyebrow">Launch confirmed</p>
          <h2>Indexing token data…</h2>
          <p className="lede">Your token contract exists on Cronos Testnet, but the Explore/indexed detail data has not been written yet.</p>
          <div className="queueList">
            <div><span>Token address</span><b>{shortAddress(address)}</b><em>confirmed</em></div>
            <div><span>Explore visibility</span><b>Waiting for indexer</b><em>pending</em></div>
          </div>
          <p className="small">Keep this page open or check Explore again after the indexer catches up. We show this pending state instead of falling back to sample launch data.</p>
          <a className="button secondary" href={`${cronosTestnet.blockExplorerUrls[0]}/address/${address}`} target="_blank" rel="noreferrer">View contract on explorer ↗</a>
        </div>
      </section>
    );
  }

  return (
    <section className="panel tokenDetail">
      <div className="tokenMainColumn">
        <div className="tokenHeader"><TokenGlyph launch={launch} size="large" /><div><p className="eyebrow">Token detail</p><h2>{launch.name} <span>${launch.symbol}</span></h2><p>{launch.description || 'Indexed launch metadata pending.'}</p><SocialLinks socials={launch.socials} /><div className="badges"><Badge>No tax</Badge><Badge tone={launch.status === 'Graduated' ? 'blue' : launch.status === 'Near graduation' ? 'warn' : 'neutral'}>{launch.status}</Badge><Badge tone="blue">Reserve contribution v0</Badge></div></div></div>
        <div className="detailStats"><Metric label="reserve raised" value={launch.reserveRaised} /><Metric label="graduation target" value={launch.graduationTarget} /><Metric label="indexed buys" value={trades.length.toString()} /><Metric label="progress" value={`${launch.progress}%`} /></div>
        <ReserveChart launch={launch} trades={trades} />
        <div className="tablesGrid"><TradesTable trades={trades} /><HoldersTable holders={holders} /></div>
      </div>
      <TradePanel launch={launch} onConfirmed={refreshTokenData} />
    </section>
  );
}
