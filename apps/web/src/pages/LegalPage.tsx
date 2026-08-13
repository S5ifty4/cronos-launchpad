type LegalTopic = 'terms' | 'privacy' | 'risks';

type LegalSection = { title: string; body: string[] };

const updated = 'August 10, 2026';

const pages: Record<LegalTopic, { eyebrow: string; title: string; intro: string; sections: LegalSection[] }> = {
  terms: {
    eyebrow: 'Terms of use',
    title: 'CronosForge Terms of Use',
    intro: 'These terms are a practical baseline for using CronosForge. They are not a substitute for legal advice and may be updated as the product, chain support, and business entity details mature.',
    sections: [
      { title: 'Acceptance', body: ['By accessing CronosForge, connecting a wallet, creating a launch, or interacting with token pages, you agree to use the app responsibly and comply with applicable laws and network rules.'] },
      { title: 'Current network status', body: ['CronosForge currently supports Cronos Testnet while production mainnet contracts are prepared. Testnet assets have no guaranteed value. Features, fees, graduation rules, launch details, and displayed chain data may change before mainnet.'] },
      { title: 'No financial advice', body: ['CronosForge provides launch, discovery, and proof-style UI. Nothing on the site is financial, investment, legal, tax, or trading advice. You are responsible for your own decisions and wallet actions.'] },
      { title: 'User-created launches', body: ['Creators are responsible for the accuracy of token names, symbols, artwork, descriptions, websites, and social links they submit. Names, symbols, and on-chain launch data may be immutable once submitted. Off-chain metadata may be moderated or hidden if it is misleading, abusive, illegal, or impersonates another project.'] },
      { title: 'Wallets and transactions', body: ['You control your wallet and approve transactions through third-party wallet software. CronosForge cannot reverse blockchain transactions, recover keys, guarantee transaction success, or guarantee any third-party wallet/explorer behavior. Always review wallet prompts before signing.'] },
      { title: 'Availability and changes', body: ['The app is provided as-is. We may pause, modify, remove, or limit features for security, maintenance, legal, abuse-prevention, or product reasons.'] },
      { title: 'Contact', body: ['For support, abuse reports, or legal notices, use the project contact channel provided by the site owner. Entity name, registered address, and formal notice details should be added before a mainnet/commercial launch.'] },
    ],
  },
  privacy: {
    eyebrow: 'Privacy policy',
    title: 'CronosForge Privacy Policy',
    intro: 'This policy explains the practical data flows for CronosForge and should be reviewed before production mainnet support goes live.',
    sections: [
      { title: 'Information you provide', body: ['When you create or preview a launch, you may provide token metadata such as name, symbol, description, image, website, X, Discord, and Telegram links. If you connect a wallet, the app can read your public wallet address and chain state.'] },
      { title: 'Public blockchain data', body: ['Wallet addresses, token contracts, transaction hashes, events, and balances are public blockchain data. CronosForge indexes and displays some of this information to power Explore, token detail, proof, and admin views.'] },
      { title: 'Off-chain metadata and storage', body: ['Token images and social metadata may be stored off-chain so Explore and token pages can render richer cards. Public metadata may be visible to anyone and should not include private, sensitive, or confidential information.'] },
      { title: 'Technical data', body: ['The app and its infrastructure may process technical data such as browser type, device information, request logs, error diagnostics, timestamps, and basic usage events to keep the site secure and reliable.'] },
      { title: 'Service providers', body: ['We may use service provider categories such as cloud hosting, databases, file storage, wallet connection tooling, analytics, error monitoring, RPC nodes, and blockchain explorers. These providers process data only as needed to operate the app.'] },
      { title: 'Future account features', body: ['If account or social sign-in features are added later, CronosForge may receive profile information authorized by the user, such as name, email, avatar, and provider ID. The UI should disclose this at the time the feature goes live.'] },
      { title: 'Your choices', body: ['You can avoid submitting optional metadata. You can disconnect your wallet through your wallet software. Public blockchain data cannot generally be deleted or changed by CronosForge.'] },
      { title: 'Contact', body: ['For privacy questions or deletion requests related to off-chain metadata, contact the site owner through the project support channel. Formal entity and privacy contact details should be finalized before mainnet/commercial launch.'] },
    ],
  },
  risks: {
    eyebrow: 'Risk disclaimer',
    title: 'CronosForge Risk Disclaimer',
    intro: 'Crypto launches are risky. CronosForge surfaces proof signals and launch configuration, but those signals are not guarantees of safety, liquidity, legality, or token value.',
    sections: [
      { title: 'Token value risk', body: ['Tokens discovered or created through CronosForge can lose all value. Meme tokens and early launches are especially volatile and may have thin liquidity, concentrated holders, or incomplete communities.'] },
      { title: 'Liquidity and graduation risk', body: ['A graduation target, VVS route, reserve figure, or LP-lock intent does not guarantee that a token will graduate, sustain liquidity, or trade at any particular price. Indexing delays or network issues can make displayed data temporarily stale.'] },
      { title: 'Smart contract and integration risk', body: ['Smart contracts, routers, wallets, RPC nodes, and indexers may contain bugs, downtime, misconfiguration, or unexpected behavior. Testnet success does not guarantee mainnet safety.'] },
      { title: 'Metadata and impersonation risk', body: ['Token names, artwork, descriptions, websites, and social links can be misleading. CronosForge performs preflight checks and may show warnings, but users must still verify official sources independently.'] },
      { title: 'No endorsement', body: ['Listing a token, showing a card, indexing an event, or displaying a proof panel does not mean CronosForge endorses the token, creator, or linked community.'] },
      { title: 'User responsibility', body: ['Only connect wallets and sign transactions you understand. Do not rely solely on CronosForge UI to evaluate a token, creator, or transaction.'] },
    ],
  },
};

export function LegalPage({ topic }: { topic: LegalTopic }) {
  const page = pages[topic];
  return (
    <section className="panel legalPage">
      <div className="legalHero">
        <p className="eyebrow">{page.eyebrow}</p>
        <h2>{page.title}</h2>
        <p className="lede">{page.intro}</p>
        <p className="small">Last updated: {updated}</p>
      </div>
      <div className="legalSections">
        {page.sections.map((section) => (
          <article className="miniPanel" key={section.title}>
            <h3>{section.title}</h3>
            {section.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          </article>
        ))}
      </div>
    </section>
  );
}
