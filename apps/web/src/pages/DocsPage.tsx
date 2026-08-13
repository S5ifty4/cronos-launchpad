import { Badge } from '../components/Badge';

const trustItems = ['Source verification after deployment', 'Token tax currently disabled', 'Creator/operator graduation at reserve target', 'Liquidity route and LP lock shown publicly', 'Reserved ecosystem names blocked', 'Reports and disputed-status review planned', 'Holder concentration derived from token transfers'];

export function DocsPage({ topic }: { topic: 'how-it-works' | 'risks' | 'fees' }) {
  const content = {
    'how-it-works': ['How it works', 'Launches collect CRO reserves, distribute launch tokens on buy, allow pre-graduation sells, and seed liquidity when the reserve target is reached. CronosForge currently runs on Cronos Testnet while mainnet contracts are prepared. Graduation is submitted by the creator or operator so state can be verified before gas is paid.'],
    risks: ['Risks', 'Meme tokens can go to zero. Launch proof panels expose facts like tax, LP status, holder concentration, and reports; they are not guarantees of safety or value.'],
    fees: ['Fees', 'Launch cost, optional initial buy, and future platform fees are shown separately. The create form should explain the total cost before wallet signing.'],
  }[topic];
  return <section className="panel trustGrid"><div className="trustFeature"><p className="eyebrow">Docs</p><h2>{content[0]}</h2><p>{content[1]}</p><div className="badges"><Badge tone="blue">Cronos testnet</Badge><Badge>No official affiliation claim</Badge></div></div><div className="trustChecklist">{trustItems.map((item) => <div key={item}><span>✓</span>{item}</div>)}</div></section>;
}
