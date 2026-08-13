import { Badge } from '../components/Badge';
import { getProofPackage } from '../data/api';

export function ProofPage() {
  const proof = getProofPackage();
  return <section className="panel deployPanel"><div><p className="eyebrow">Cronos / liquidity proof package</p><h2>Deployment readiness checklist.</h2><p>This operator-facing page tracks source verification, launch contracts, liquidity configuration, and LP-lock proof before mainnet support is enabled.</p></div><div className="deploySteps">{proof.map((item, index) => <div key={item.label}><strong>{index + 1}</strong><span>{item.label}</span><p className="small">{item.value}</p><Badge tone={item.status === 'ready' ? 'good' : 'warn'}>{item.status}</Badge></div>)}</div></section>;
}
