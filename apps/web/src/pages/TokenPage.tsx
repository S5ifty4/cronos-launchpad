import { Badge } from '../components/Badge';
import { ChartMock } from '../components/ChartMock';
import { HoldersTable, TradesTable } from '../components/DataTable';
import { Metric } from '../components/Metric';
import { SocialLinks } from '../components/SocialLinks';
import { TokenGlyph } from '../components/TokenGlyph';
import { TradePanel } from '../components/TradePanel';
import { getLaunchByAddress, getLaunchHolders, getLaunchTrades } from '../data/api';

export function TokenPage({ address }: { address?: string }) {
  const launch = getLaunchByAddress(address);
  return (
    <section className="panel tokenDetail">
      <div className="tokenMainColumn">
        <div className="tokenHeader"><TokenGlyph launch={launch} size="large" /><div><p className="eyebrow">Token detail prototype</p><h2>{launch.name} <span>${launch.symbol}</span></h2><p>{launch.description}</p><SocialLinks socials={launch.socials} /><div className="badges"><Badge tone="good">Protected identity</Badge><Badge tone="blue">VVS route</Badge><Badge>No tax</Badge><Badge tone="warn">{launch.status}</Badge></div></div></div>
        <div className="detailStats"><Metric label="market cap" value={launch.marketCap} /><Metric label="24h volume" value={launch.volume24h} /><Metric label="holders" value={launch.holders} /><Metric label="progress" value={`${launch.progress}%`} /></div>
        <ChartMock />
        <div className="tablesGrid"><TradesTable trades={getLaunchTrades()} /><HoldersTable holders={getLaunchHolders()} /></div>
      </div>
      <TradePanel launch={launch} />
    </section>
  );
}
