import { Badge } from '../components/Badge';
import { addresses } from '../contracts/addresses';
import { getProofPackage } from '../data/api';
import { explorerAddressUrl, shortAddress } from '../wallet/chains';

const readiness = [
  'Deploy and verify mainnet factory, registry, and LP vault.',
  'Set mainnet router/WCRO/factory/registry/vault envs in Vercel and indexer runtime.',
  'Run create → buy → sell → target → graduate smoke on the intended chain.',
  'Confirm trades, holders, reserve, LP vault, and proof links populate from indexed rows.',
  'Enable Cronos Mainnet in the network selector only after the smoke path is green.',
];

function AddressRow({ label, address }: { label: string; address?: string }) {
  return <div><span>{label}</span><b>{address ? shortAddress(address) : 'missing'}</b><em>{address ? <a href={explorerAddressUrl(address)} target="_blank" rel="noreferrer">open ↗</a> : 'env'}</em></div>;
}

export function ProofPage() {
  const proof = getProofPackage();
  return (
    <>
      <section className="panel deployPanel">
        <div>
          <p className="eyebrow">Cronos / liquidity proof package</p>
          <h2>Launch contract and LP-lock proof.</h2>
          <p>Verify the contracts that create launches, reserve names, seed liquidity, and hold LP tokens before trusting a graduation claim.</p>
        </div>
        <div className="deploySteps">{proof.map((item, index) => <div key={item.label}><strong>{index + 1}</strong><span>{item.label}</span><p className="small">{item.value}</p><Badge tone={item.status === 'ready' ? 'good' : 'warn'}>{item.status}</Badge></div>)}</div>
      </section>
      <section className="panel opsGrid">
        <div className="miniPanel">
          <p className="eyebrow">Current Testnet contracts</p>
          <h2>Verify addresses on explorer.</h2>
          <div className="queueList">
            <AddressRow label="Factory" address={addresses.cronosTestnet.launchpadFactory} />
            <AddressRow label="Name registry" address={addresses.cronosTestnet.nameRegistry} />
            <AddressRow label="LP vault" address={addresses.cronosTestnet.lpVault} />
          </div>
        </div>
        <div className="miniPanel">
          <p className="eyebrow">Mainnet readiness</p>
          <h2>Keep mainnet disabled until every item is green.</h2>
          <div className="queueList">{readiness.map((item, index) => <div key={item}><span>{index + 1}</span><b>{item}</b><em>required</em></div>)}</div>
        </div>
      </section>
    </>
  );
}
