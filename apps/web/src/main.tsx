import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { assessTokenIdentity, calculateGraduationProgress, getAntiBotBuyLimit } from '@cronos-launchpad/core';
import { launches, type LaunchCard } from './mockData';
import './styles.css';

function Badge({ children, tone = 'neutral' }: { children: React.ReactNode; tone?: 'good' | 'warn' | 'bad' | 'neutral' | 'blue' }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

function TokenGlyph({ launch }: { launch: LaunchCard }) {
  return (
    <div className="tokenGlyph" style={{ '--glyph': launch.color } as React.CSSProperties}>
      <span>{launch.symbol.slice(0, 2)}</span>
    </div>
  );
}

function LaunchCardView({ launch }: { launch: LaunchCard }) {
  return (
    <article className="launchCard">
      <div className="launchMain">
        <TokenGlyph launch={launch} />
        <div>
          <div className="cardTop">
            <h3>{launch.name}</h3>
            <span>${launch.symbol}</span>
          </div>
          <p className="description">{launch.description}</p>
          <div className="socials">
            {launch.socials.map((social) => <span key={social}>{social}</span>)}
          </div>
        </div>
      </div>
      <div className="progress"><span style={{ width: `${launch.progress}%` }} /></div>
      <div className="cardMetrics">
        <span>{launch.progress}% to graduation</span>
        <span>{launch.marketCap} mcap</span>
        <span>{launch.volume24h} vol</span>
      </div>
      <div className="badges">
        <Badge tone={launch.status === 'Graduated' ? 'blue' : launch.status === 'Near graduation' ? 'warn' : 'neutral'}>{launch.status}</Badge>
        {launch.antiBot && <Badge tone="good">Anti-snipe</Badge>}
        {launch.protectedName && <Badge tone="good">Protected name</Badge>}
        {launch.vvsGraduation && <Badge tone="blue">VVS route</Badge>}
        {launch.taxBips === 0 && <Badge>No tax</Badge>}
      </div>
      <p className="small">Created by {launch.creator} · {launch.age} ago</p>
    </article>
  );
}

function App() {
  const [name, setName] = useState('Teen W0lf');
  const [symbol, setSymbol] = useState('TEENW');
  const existingIdentities = useMemo(
    () => [...launches, { ...launches[0], name: 'Teen Wolf', symbol: 'TWOLF', creator: '0xe...F5de', progress: 1.5 }],
    [],
  );
  const identity = useMemo(() => assessTokenIdentity({ name, symbol }, existingIdentities), [name, symbol, existingIdentities]);
  const demoProgress = calculateGraduationProgress(57_330n, 65_000n);
  const currentLimit = getAntiBotBuyLimit({ elapsedSeconds: 180, baseLimitCro: 1_000 });

  return (
    <main>
      <nav className="topNav">
        <a className="brand" href="#top" aria-label="Cronos Launchpad home">
          <span className="brandMark" />
          <span>cronos<span>launch</span></span>
        </a>
        <div className="navLinks">
          <a href="#board">Explore</a>
          <a href="#create">Create</a>
          <a href="#trust">Trust</a>
          <a href="#deploy">Testnet</a>
        </div>
        <a href="#create" className="connectButton">Create Token</a>
      </nav>

      <section id="top" className="hero">
        <div className="heroCopy">
          <div className="statusLine"><span className="liveDot" /> Cronos testnet MVP · VVS-first graduation</div>
          <h1>Launch Cronos memes with protection buyers can actually read.</h1>
          <p className="lede">
            A modern Cronos-native launchpad surface inspired by the speed of pump.fun, the launch board clarity of
            WolfSwap, and the proof-first trust layer Cronos projects need before whitelist conversations.
          </p>
          <div className="heroActions">
            <a href="#create" className="button primary">Start protected launch</a>
            <a href="#board" className="button secondary">Explore runners</a>
          </div>
        </div>
        <aside className="heroBoard" aria-label="Launchpad summary">
          <div className="tickerTape">
            <span>0x8...c5a2 bought 222 CRO</span>
            <span>MVVS 88.2% to VVS</span>
            <span>CROF launched 6m ago</span>
          </div>
          <div className="statsGrid">
            <div><strong>4</strong><span>sample launches</span></div>
            <div><strong>{demoProgress}%</strong><span>runner progress</span></div>
            <div><strong>180d</strong><span>LP lock default</span></div>
          </div>
          <div className="proofCard">
            <p className="eyebrow">Default trust policy</p>
            <ul>
              <li>Duplicate normalized names and symbols blocked on-chain.</li>
              <li>CRO, Cronos, VVS, Crypto.com, Tectonic, Fulcrom, WolfSwap reserved.</li>
              <li>Graduation seeds VVS-compatible liquidity and locks LP.</li>
            </ul>
          </div>
        </aside>
      </section>

      <section id="board" className="panel boardPanel">
        <div className="sectionHeader">
          <div>
            <p className="eyebrow">Explore launches</p>
            <h2>Live board UX for protected Cronos runners</h2>
          </div>
          <div className="viewControls"><button>Grid</button><button>List</button><button>Filters</button></div>
        </div>
        <div className="filterBar">
          <div className="search">⌕ Search name, ticker, creator…</div>
          <div className="tabs">
            <Badge tone="blue">Launching</Badge><Badge>Newest</Badge><Badge>Near graduation</Badge><Badge>Graduated</Badge><Badge tone="good">No tax</Badge>
          </div>
        </div>
        <div className="cards">
          {launches.map((launch) => <LaunchCardView launch={launch} key={launch.symbol} />)}
        </div>
      </section>

      <section id="create" className="panel createPanel">
        <div>
          <p className="eyebrow">Create token</p>
          <h2>Anti-vamp preflight before a wallet ever signs.</h2>
          <p>
            Pump-style creation should still protect the ecosystem. The form checks reserved Cronos names, duplicate
            identities, homoglyph swaps, and near-matches before launch.
          </p>
          <label>Token name<input value={name} onChange={(event) => setName(event.target.value)} /></label>
          <label>Symbol<input value={symbol} onChange={(event) => setSymbol(event.target.value)} /></label>
        </div>
        <div className="terminalCard">
          <div className="terminalTop"><span /><span /><span /></div>
          <h3>Identity assessment</h3>
          <Badge tone={identity.status === 'available' ? 'good' : identity.status === 'warn' ? 'warn' : 'bad'}>{identity.status}</Badge>
          <dl>
            <dt>Normalized name</dt><dd>{identity.normalizedName}</dd>
            <dt>Normalized symbol</dt><dd>{identity.normalizedSymbol}</dd>
            <dt>Reasons</dt><dd>{identity.reasons.length ? identity.reasons.join(', ') : 'None'}</dd>
            <dt>Minute 3 anti-snipe cap</dt><dd>{currentLimit} CRO max buy</dd>
          </dl>
          <p className="small">`Teen W0lf` is blocked because W0LF folds into an existing Teen Wolf identity.</p>
        </div>
      </section>

      <section id="trust" className="panel trustGrid">
        <div className="trustFeature">
          <p className="eyebrow">Buyer-facing proof</p>
          <h2>Every launch gets a trust panel, not just a chart.</h2>
          <p>Token pages should make the important facts visible at a glance: owner posture, tax, router, pair, LP vault, unlock time, creator wallet, and clone-risk checks.</p>
        </div>
        <div className="trustChecklist">
          {['Source verification pending until deploy', 'Tax disabled for v0', 'Auto-graduate on reserve target', 'LP sent to public timelock vault', 'VVS router configurable', 'Reserved ecosystem names blocked'].map((item) => (
            <div key={item}><span>✓</span>{item}</div>
          ))}
        </div>
      </section>

      <section id="deploy" className="panel deployPanel">
        <div>
          <p className="eyebrow">Testnet readiness</p>
          <h2>Prepared up to the deployer-wallet boundary.</h2>
          <p>Mock VVS graduation is covered by tests. The deploy path is scripted; the remaining external inputs are the local private key and official VVS testnet addresses.</p>
        </div>
        <div className="deploySteps">
          <div><strong>1</strong><span>NameRegistry + reserved names</span></div>
          <div><strong>2</strong><span>LaunchpadFactory registrar</span></div>
          <div><strong>3</strong><span>Timelocked LP vault</span></div>
          <div><strong>4</strong><span>VVS-compatible graduation</span></div>
        </div>
      </section>
    </main>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
