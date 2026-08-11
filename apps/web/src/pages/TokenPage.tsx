import { useEffect, useState } from 'react';
import { Badge } from '../components/Badge';
import { ChartMock } from '../components/ChartMock';
import { HoldersTable, TradesTable } from '../components/DataTable';
import { Metric } from '../components/Metric';
import { SocialLinks } from '../components/SocialLinks';
import { TokenGlyph } from '../components/TokenGlyph';
import { TradePanel } from '../components/TradePanel';
import { fetchLaunchByAddress, getLaunchByAddress, getLaunchHolders, getLaunchTrades, getLaunches } from '../data/api';
import type { Launch } from '../data/types';
import { cronosTestnet, shortAddress } from '../wallet/chains';

export function TokenPage({ address }: { address?: string }) {
  const knownLaunch = getLaunches().find((launch) => launch.address.toLowerCase() === address?.toLowerCase());
  const [indexedLaunch, setIndexedLaunch] = useState<Launch | null>(knownLaunch ?? null);
  const launch = indexedLaunch ?? knownLaunch ?? getLaunchByAddress(address);

  useEffect(() => {
    if (!address) return;
    let active = true;
    fetchLaunchByAddress(address)
      .then((nextLaunch) => {
        if (active && nextLaunch.address.toLowerCase() === address.toLowerCase()) setIndexedLaunch(nextLaunch);
      })
      .catch(() => undefined);
    return () => { active = false; };
  }, [address]);

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
        <div className="tokenHeader"><TokenGlyph launch={launch} size="large" /><div><p className="eyebrow">Token detail</p><h2>{launch.name} <span>${launch.symbol}</span></h2><p>{launch.description || 'Indexed launch metadata pending.'}</p><SocialLinks socials={launch.socials} /><div className="badges"><Badge>No tax</Badge><Badge tone="warn">{launch.status}</Badge></div></div></div>
        <div className="detailStats"><Metric label="market cap" value={launch.marketCap} /><Metric label="24h volume" value={launch.volume24h} /><Metric label="holders" value={launch.holders} /><Metric label="progress" value={`${launch.progress}%`} /></div>
        <ChartMock />
        <div className="tablesGrid"><TradesTable trades={getLaunchTrades()} /><HoldersTable holders={getLaunchHolders()} /></div>
      </div>
      <TradePanel launch={launch} />
    </section>
  );
}
