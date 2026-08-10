import type { Launch } from '../data/types';
import { Badge } from './Badge';
import { ProgressBar } from './ProgressBar';
import { SocialLinks } from './SocialLinks';
import { TokenGlyph } from './TokenGlyph';

export function LaunchCard({ launch }: { launch: Launch }) {
  return (
    <article className="launchCard">
      <div className="launchMain">
        <TokenGlyph launch={launch} />
        <div>
          <div className="cardTop"><h3>{launch.name}</h3><span>${launch.symbol}</span></div>
          <p className="description">{launch.description}</p>
          <SocialLinks socials={launch.socials} />
        </div>
      </div>
      <ProgressBar value={launch.progress} />
      <div className="cardMetrics"><span>{launch.progress}% to graduation</span><span>{launch.marketCap} mcap</span><span>{launch.volume24h} vol</span></div>
      <div className="badges">
        <Badge tone={launch.status === 'Graduated' ? 'blue' : launch.status === 'Near graduation' ? 'warn' : 'neutral'}>{launch.status}</Badge>
        {launch.antiBot && <Badge tone="good">Anti-snipe</Badge>}
        {launch.protectedName && <Badge tone="good">Protected name</Badge>}
        {launch.vvsGraduation && <Badge tone="blue">VVS route</Badge>}
        {launch.taxBips === 0 && <Badge>No tax</Badge>}
      </div>
      <p className="small">Created by {launch.creator} · {launch.age} ago</p>
    </article>
  );
}
