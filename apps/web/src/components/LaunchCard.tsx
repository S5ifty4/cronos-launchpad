import type { KeyboardEvent } from 'react';
import type { Launch } from '../data/types';
import { shortAddress } from '../wallet/chains';
import { Badge } from './Badge';
import { ProgressBar } from './ProgressBar';
import { SocialLinks } from './SocialLinks';
import { TokenGlyph } from './TokenGlyph';

function openTokenPage(address: string) {
  window.location.assign(`/token/${address}`);
}

function handleCardKeyDown(event: KeyboardEvent<HTMLElement>, address: string) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    openTokenPage(address);
  }
}

function cleanMetric(value: string) {
  return value.toLowerCase().includes('indexed') ? 'Pending' : value;
}

export function LaunchCard({ launch }: { launch: Launch }) {
  return (
    <article className="launchCard clickableCard" role="link" tabIndex={0} onClick={() => openTokenPage(launch.address)} onKeyDown={(event) => handleCardKeyDown(event, launch.address)} aria-label={`Open ${launch.name} token page`}>
      <div className="launchMain">
        <TokenGlyph launch={launch} />
        <div className="launchCardBody">
          <div className="cardTop"><h3>{launch.name}</h3><span>${launch.symbol}</span></div>
          <p className="description">{launch.description || 'Launch details are still filling in.'}</p>
          <SocialLinks socials={launch.socials} />
        </div>
      </div>
      <div className="cardFooterStack">
        <ProgressBar value={launch.progress} />
        <div className="cardMetrics"><span>{launch.progress}% to graduation</span><span>{cleanMetric(launch.marketCap)} mcap</span><span>{cleanMetric(launch.volume24h)} vol</span></div>
        <div className="badges">
          <Badge tone={launch.status === 'Graduated' ? 'blue' : launch.status === 'Near graduation' ? 'warn' : 'neutral'}>{launch.status}</Badge>
          {launch.taxBips === 0 && <Badge>No tax</Badge>}
        </div>
        <p className="small creatorLine" title={launch.creator}>Created by {shortAddress(launch.creator)} · {launch.age} ago</p>
      </div>
    </article>
  );
}
