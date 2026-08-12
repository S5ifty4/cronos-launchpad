import { Badge } from '../components/Badge';

const trustItems = ['Source verification after testnet deployment', 'Tax disabled for MVP launches', 'Manual creator/admin graduation at reserve target', 'LP routed according to VVS router/pair path', 'VVS router configurable', 'Reserved ecosystem names blocked', 'Report / disputed-status hook planned', 'Holder concentration requires transfer indexing'];

export function DocsPage({ topic }: { topic: 'how-it-works' | 'risks' | 'fees' }) {
  const content = {
    'how-it-works': ['How it works', 'Launches collect CRO reserves on Cronos Testnet, distribute launch tokens on buy, allow pre-graduation sells, and graduate into VVS-compatible liquidity when the reserve target is reached. Graduation is manual for the MVP so the creator/operator can verify state before paying gas.'],
    risks: ['Risks', 'Meme tokens can go to zero. Launch proof panels expose facts like tax, LP status, holder concentration, and reports; they are not guarantees of safety or value.'],
    fees: ['Fees', 'The MVP models launch cost, initial buy, and future platform fees separately. Public UI should explain total launch cost before wallet signing.'],
  }[topic];
  return <section className="panel trustGrid"><div className="trustFeature"><p className="eyebrow">Docs</p><h2>{content[0]}</h2><p>{content[1]}</p><div className="badges"><Badge tone="blue">Cronos testnet</Badge><Badge>No official affiliation claim</Badge></div></div><div className="trustChecklist">{trustItems.map((item) => <div key={item}><span>✓</span>{item}</div>)}</div></section>;
}
