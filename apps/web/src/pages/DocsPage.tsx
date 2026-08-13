import { Badge } from '../components/Badge';

const trustItems = [
  'Source verification after deployment',
  'Token tax currently disabled',
  'Creator/operator graduation at reserve target',
  'Liquidity route and LP lock shown publicly',
  'Reserved ecosystem names blocked',
  'Reports and disputed-status review planned',
  'Holder concentration derived from token transfers',
];

const protectionDetails = [
  {
    title: 'Anti-snipe launch window',
    body: 'When enabled, early buys are capped by the launch contract for the first 10 minutes. The default cap starts at 50 CRO, relaxes to 150 CRO after 2 minutes, then 350 CRO after 5 minutes, and clears after 10 minutes. This is a per-transaction cap, not a cumulative per-wallet limit.',
  },
  {
    title: 'Anti-vamp identity guard',
    body: 'CronosForge normalizes names and tickers before launch, folds common lookalike characters, blocks exact duplicate names/tickers, blocks reserved ecosystem names/tickers, and warns on near-matches. Exact duplicate and reserved-name enforcement is on-chain through the Name Registry; fuzzy warnings happen before wallet signing.',
  },
  {
    title: 'What protection does not mean',
    body: 'These checks reduce obvious sniping and impersonation, but they do not guarantee token value, prevent every copycat, identify every bot, or replace reviewing contract/source, token page data, and wallet prompts before signing.',
  },
];

export function DocsPage({ topic }: { topic: 'how-it-works' | 'risks' | 'fees' }) {
  const content = {
    'how-it-works': ['How it works', 'Launches collect CRO reserves, distribute launch tokens on buy, allow pre-graduation sells, and seed liquidity when the reserve target is reached. CronosForge currently runs on Cronos Testnet while mainnet contracts are prepared. Graduation is submitted by the creator or operator so state can be verified before gas is paid.'],
    risks: ['Risks', 'Meme tokens can go to zero. Launch proof panels expose facts like tax, LP status, holder concentration, and reports; they are not guarantees of safety or value.'],
    fees: ['Fees', 'Launch cost, optional initial buy, and future platform fees are shown separately. The create form should explain the total cost before wallet signing.'],
  }[topic];
  return (
    <>
      <section className="panel trustGrid">
        <div className="trustFeature">
          <p className="eyebrow">Docs</p>
          <h2>{content[0]}</h2>
          <p>{content[1]}</p>
          <div className="badges"><Badge tone="blue">Cronos testnet</Badge><Badge>No official affiliation claim</Badge></div>
        </div>
        <div className="trustChecklist">{trustItems.map((item) => <div key={item}><span>✓</span>{item}</div>)}</div>
      </section>
      {topic === 'how-it-works' && (
        <section className="panel opsGrid">
          <div className="miniPanel">
            <p className="eyebrow">Protection details</p>
            <h2>Anti-snipe and anti-vamp checks.</h2>
            <p className="lede">These details are for creators and reviewers who want the technical shape without putting contract internals on the homepage.</p>
          </div>
          <div className="miniPanel protectionList">
            {protectionDetails.map((item) => <div key={item.title}><b>{item.title}</b><p>{item.body}</p></div>)}
          </div>
        </section>
      )}
    </>
  );
}
