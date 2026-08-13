import { useEffect, useMemo, useState } from 'react';
import { useAppKit } from '@reown/appkit/react';
import { Badge } from '../components/Badge';
import { LaunchCard } from '../components/LaunchCard';
import { Metric } from '../components/Metric';
import { fetchLaunches } from '../data/api';
import type { Launch } from '../data/types';
import { shortAddress } from '../wallet/chains';
import { useLaunchpadWallet } from '../wallet/useLaunchpadWallet';

function sameAddress(a?: string, b?: string) {
  return Boolean(a && b && a.toLowerCase() === b.toLowerCase());
}

function countByStatus(launches: Launch[], status: Launch['status']) {
  return launches.filter((launch) => launch.status === status).length.toString();
}

function metadataState(launch: Launch) {
  const missing = [
    !launch.description && 'description',
    !launch.imageUrl && 'image',
    launch.socials.length === 0 && 'socials',
  ].filter(Boolean);
  return missing.length ? `missing ${missing.join(', ')}` : 'complete';
}

export function CreatorPage() {
  const wallet = useLaunchpadWallet();
  const { open } = useAppKit();
  const [launches, setLaunches] = useState<Launch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetchLaunches()
      .then((nextLaunches) => {
        if (active) setLaunches(nextLaunches);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const myLaunches = useMemo(() => launches.filter((launch) => sameAddress(launch.creator, wallet.address)), [launches, wallet.address]);
  const needsMetadata = myLaunches.filter((launch) => metadataState(launch) !== 'complete').length;
  const nearGraduation = myLaunches.filter((launch) => launch.status === 'Near graduation').length;

  if (!wallet.isConnected || !wallet.address) {
    return (
      <section className="panel opsGrid">
        <div className="miniPanel">
          <p className="eyebrow">Creator dashboard</p>
          <h2>Connect wallet to manage your launches.</h2>
          <p className="lede">Creator pages are wallet-scoped. After connecting, this dashboard shows only tokens created by your connected wallet.</p>
          <button className="button primary" type="button" onClick={() => open()}>Connect wallet</button>
        </div>
        <div className="miniPanel">
          <p className="eyebrow">What creators see</p>
          <h2>Launch health, links, and graduation readiness.</h2>
          <div className="queueList">
            <div><span>My launches</span><b>Filtered by creator wallet</b><em>private view</em></div>
            <div><span>Launch details</span><b>Image, links, and description status</b><em>read-only</em></div>
            <div><span>Actions</span><b>Copy token links, open explorer</b><em>safe ops</em></div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="panel opsGrid">
        <div className="miniPanel">
          <p className="eyebrow">Creator dashboard</p>
          <h2>My launches for {shortAddress(wallet.address)}.</h2>
          <p className="lede">This page only shows launches where the creator address matches your connected wallet.</p>
          <div className="creatorStats">
            <Metric label="tokens launched" value={myLaunches.length.toString()} />
            <Metric label="near graduation" value={nearGraduation.toString()} />
            <Metric label="graduated" value={countByStatus(myLaunches, 'Graduated')} />
          </div>
        </div>
        <div className="miniPanel">
          <p className="eyebrow">Launch health</p>
          <h2>{loading ? 'Refreshing launches…' : needsMetadata ? `${needsMetadata} launch${needsMetadata === 1 ? '' : 'es'} need metadata attention.` : 'All launch details look complete.'}</h2>
          <div className="queueList">
            <div><span>Wallet</span><b>{shortAddress(wallet.address)}</b><em>connected</em></div>
            <div><span>Scope</span><b>Creator-owned tokens</b><em>live board</em></div>
            <div><span>Launch details</span><b>Name, symbol, image, links treated permanent</b><em>locked after launch</em></div>
          </div>
        </div>
      </section>

      <section className="panel boardPanel">
        <div className="sectionHeader"><div><p className="eyebrow">My launches</p><h2>Tokens created by this wallet</h2></div></div>
        {myLaunches.length ? (
          <div className="cards">{myLaunches.map((launch) => <LaunchCard launch={launch} key={launch.address} />)}</div>
        ) : (
          <div className="miniPanel">
            <h2>No launches found for this wallet yet.</h2>
            <p className="lede">If you just created a token, it can take a moment for the launch details to appear.</p>
            <a className="button primary" href="/create">Create a protected launch</a>
          </div>
        )}
      </section>

      {myLaunches.length > 0 && (
        <section className="panel opsGrid">
          <div className="miniPanel">
            <p className="eyebrow">Creator actions</p>
            <h2>Per-launch status and actions.</h2>
            <div className="queueList">
              {myLaunches.slice(0, 4).map((launch) => (
                <div key={launch.address}>
                  <span>{launch.name}</span>
                  <b>{metadataState(launch)}</b>
                  <em>{launch.status}</em>
                </div>
              ))}
            </div>
          </div>
          <div className="miniPanel">
            <p className="eyebrow">Launch details</p>
            <h2>Public launch details are treated as permanent.</h2>
            <p>Creator currently shows launch health and links rather than post-launch editing. Treat the token name, ticker, image, and launch links as final before signing creation.</p>
            <div className="badges"><Badge>No post-launch edits</Badge><Badge tone="blue">Wallet scoped</Badge></div>
          </div>
        </section>
      )}
    </>
  );
}
