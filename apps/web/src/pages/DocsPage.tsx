import { Badge } from '../components/Badge';

const trustItems = ['Source verification pending until deploy', 'Tax disabled for v0', 'Auto-graduate on reserve target', 'LP sent to public timelock vault', 'VVS router configurable', 'Reserved ecosystem names blocked', 'Report / disputed-status hook', 'Top-holder concentration placeholder'];

export function DocsPage({ topic }: { topic: 'how-it-works' | 'risks' | 'fees' }) {
  const content = {
    'how-it-works': ['How it works', 'Launches start on a bonding curve, collect CRO reserves, and graduate into VVS-compatible liquidity when the reserve target is reached. LP tokens are routed to a public timelock vault.'],
    risks: ['Risks', 'Meme tokens can go to zero. Launch proof panels expose facts like tax, LP status, holder concentration, and reports; they are not guarantees of safety or value.'],
    fees: ['Fees', 'The MVP models launch cost, initial buy, and future platform fees separately. Public UI should explain total launch cost before wallet signing.'],
  }[topic];
  return <section className="panel trustGrid"><div className="trustFeature"><p className="eyebrow">Docs</p><h2>{content[0]}</h2><p>{content[1]}</p><div className="badges"><Badge tone="blue">Cronos testnet</Badge><Badge>No official affiliation claim</Badge></div></div><div className="trustChecklist">{trustItems.map((item) => <div key={item}><span>✓</span>{item}</div>)}</div></section>;
}
