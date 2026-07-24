import { Badge } from '../components/Badge';
import { getProofPackage } from '../data/api';

export function ProofPage() {
  const proof = getProofPackage();
  return <section className="panel deployPanel"><div><p className="eyebrow">Cronos / VVS proof package</p><h2>Prepared up to the deployer-wallet boundary.</h2><p>Mock VVS graduation is covered by tests. The deploy path is scripted; the remaining external inputs are the local private key and official VVS testnet addresses.</p></div><div className="deploySteps">{proof.map((item, index) => <div key={item.label}><strong>{index + 1}</strong><span>{item.label}</span><p className="small">{item.value}</p><Badge tone={item.status === 'ready' ? 'good' : 'warn'}>{item.status}</Badge></div>)}</div></section>;
}
