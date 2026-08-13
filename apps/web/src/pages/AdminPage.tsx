import { useEffect, useMemo, useState } from 'react';
import { useAppKit } from '@reown/appkit/react';
import { Badge } from '../components/Badge';
import { Metric } from '../components/Metric';
import { fetchLaunches } from '../data/api';
import type { Launch } from '../data/types';
import { addresses } from '../contracts/addresses';
import { shortAddress } from '../wallet/chains';
import { useLaunchpadWallet } from '../wallet/useLaunchpadWallet';

const deployerWallet = '0x7dec46c3792e749a804d8923d74bdf59364cad9d';

function sameAddress(a?: string, b?: string) {
  return Boolean(a && b && a.toLowerCase() === b.toLowerCase());
}

function missingMetadata(launch: Launch) {
  return !launch.description || !launch.imageUrl || launch.socials.length === 0;
}

export function AdminPage() {
  const wallet = useLaunchpadWallet();
  const { open } = useAppKit();
  const [launches, setLaunches] = useState<Launch[]>([]);
  const [loading, setLoading] = useState(true);
  const isAdmin = sameAddress(wallet.address, deployerWallet);

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

  const operatorQueue = useMemo(() => {
    const missing = launches.filter(missingMetadata);
    const near = launches.filter((launch) => launch.status === 'Near graduation');
    const graduated = launches.filter((launch) => launch.status === 'Graduated');
    return [
      { type: 'Metadata/indexing review', subject: `${missing.length} launch${missing.length === 1 ? '' : 'es'} missing image/social/description`, state: missing.length ? 'review' : 'clear' },
      { type: 'Graduation queue', subject: `${near.length} launch${near.length === 1 ? '' : 'es'} near target`, state: near.length ? 'watch' : 'clear' },
      { type: 'LP/proof monitor', subject: `${graduated.length} graduated launch${graduated.length === 1 ? '' : 'es'}`, state: graduated.length ? 'verify proof' : 'none' },
    ];
  }, [launches]);

  if (!wallet.isConnected || !wallet.address) {
    return (
      <section className="panel opsGrid">
        <div className="miniPanel">
          <p className="eyebrow">Operator admin</p>
          <h2>Connect the deployer wallet to access Admin.</h2>
          <p className="lede">Admin is the CronosForge operator control plane. It is gated to the deployer wallet, not general creators.</p>
          <button className="button primary" type="button" onClick={() => open()}>Connect deployer wallet</button>
        </div>
        <div className="miniPanel">
          <p className="eyebrow">Required wallet</p>
          <h2>{shortAddress(deployerWallet)}</h2>
          <p>Creator wallets should use the Creator page. Admin is reserved for protocol/indexer/queue oversight.</p>
        </div>
      </section>
    );
  }

  if (!isAdmin) {
    return (
      <section className="panel opsGrid">
        <div className="miniPanel">
          <p className="eyebrow">Access denied</p>
          <h2>This wallet is not the CronosForge deployer.</h2>
          <p className="lede">Connected wallet: {shortAddress(wallet.address)}. Admin access requires deployer wallet {shortAddress(deployerWallet)}.</p>
          <div className="badges"><Badge tone="bad">not admin</Badge><Badge>read blocked</Badge></div>
        </div>
        <div className="miniPanel">
          <p className="eyebrow">Go to Creator instead</p>
          <h2>Manage launches created by this wallet.</h2>
          <p>Creator dashboard is the wallet-scoped page for non-operator launch owners.</p>
          <a className="button secondary" href="/creator">Open Creator dashboard</a>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="panel opsGrid">
        <div className="miniPanel">
          <p className="eyebrow">Operator admin</p>
          <h2>Deployer wallet verified.</h2>
          <p className="lede">Admin surfaces protocol/indexer health, disputed launch queues, graduation readiness, and deployment addresses.</p>
          <div className="creatorStats">
            <Metric label="indexed launches" value={launches.length.toString()} />
            <Metric label="queue items" value={operatorQueue.filter((item) => item.state !== 'clear' && item.state !== 'none').length.toString()} />
            <Metric label="admin wallet" value={shortAddress(wallet.address)} />
          </div>
        </div>
        <div className="miniPanel">
          <p className="eyebrow">Deployment addresses</p>
          <h2>Cronos testnet control plane.</h2>
          <div className="queueList">
            <div><span>Factory</span><b>{addresses.cronosTestnet.launchpadFactory ? shortAddress(addresses.cronosTestnet.launchpadFactory) : 'missing env'}</b><em>create</em></div>
            <div><span>Name registry</span><b>{addresses.cronosTestnet.nameRegistry ? shortAddress(addresses.cronosTestnet.nameRegistry) : 'missing env'}</b><em>identity</em></div>
            <div><span>LP vault</span><b>{addresses.cronosTestnet.lpVault ? shortAddress(addresses.cronosTestnet.lpVault) : 'missing env'}</b><em>proof</em></div>
          </div>
        </div>
      </section>

      <section className="panel opsGrid">
        <div className="miniPanel">
          <p className="eyebrow">Admin queue</p>
          <h2>{loading ? 'Refreshing live launch queue…' : 'Operator review queue.'}</h2>
          <div className="queueList">
            {operatorQueue.map((item) => (
              <div key={item.type}><span>{item.type}</span><b>{item.subject}</b><em>{item.state}</em></div>
            ))}
          </div>
        </div>
        <div className="miniPanel">
          <p className="eyebrow">Operator actions</p>
          <h2>Keep anti-vamp enforcement and indexing healthy.</h2>
          <p>Admin should reserve ecosystem names, review similar-symbol reports, watch failed launch-detail writes, reconcile data freshness, and verify graduation/LP-lock proof. This control plane is gated and read-only for now.</p>
          <div className="badges"><Badge tone="blue">deployer gated</Badge><Badge>read-only</Badge></div>
        </div>
      </section>
    </>
  );
}
