import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { assessTokenIdentity, calculateGraduationProgress, getAntiBotBuyLimit } from '@cronos-launchpad/core';
import { launches, type LaunchCard } from './mockData';
import './styles.css';

type BadgeTone = 'good' | 'warn' | 'bad' | 'neutral' | 'blue';

const trades = [
  { side: 'Buy', wallet: '0x8f2a...c5a2', amount: '222 CRO', tokens: '14,204 CROJACK', age: '12s' },
  { side: 'Buy', wallet: '0x2109...771d', amount: '80 CRO', tokens: '5,092 CROJACK', age: '44s' },
  { side: 'Sell', wallet: '0x7b81...aa10', amount: '31 CRO', tokens: '1,840 CROJACK', age: '2m' },
  { side: 'Buy', wallet: '0x5d40...901e', amount: '410 CRO', tokens: '25,193 CROJACK', age: '4m' },
];

const holders = [
  { wallet: 'LP vault', share: '34.2%', note: 'locked on graduation' },
  { wallet: '0x6819...a923', share: '8.6%', note: 'creator' },
  { wallet: '0x2109...771d', share: '4.1%', note: 'buyer' },
  { wallet: '0x5d40...901e', share: '3.7%', note: 'buyer' },
];

const adminQueue = [
  ['Reserved-name review', 'CRO Bank', 'blocked'],
  ['Similar-symbol warning', 'CR0X', 'needs review'],
  ['Report queue', '2 launch reports', 'open'],
];

function Badge({ children, tone = 'neutral' }: { children: React.ReactNode; tone?: BadgeTone }) {
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

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="metric"><strong>{value}</strong><span>{label}</span></div>;
}

function ToggleRow({ label, enabled = true }: { label: string; enabled?: boolean }) {
  return <div className="toggleRow"><span>{label}</span><i className={enabled ? 'toggle on' : 'toggle'} /></div>;
}

function App() {
  const [name, setName] = useState('Cronos Vault');
  const [symbol, setSymbol] = useState('CVLT');
  const [description, setDescription] = useState('A Cronos-native fair launch with protected identity, VVS graduation, and public LP lock receipts.');
  const [graduationTarget, setGraduationTarget] = useState('65,000');
  const [initialBuy, setInitialBuy] = useState('250');
  const [xLink, setXLink] = useState('https://x.com/project');
  const selectedLaunch = launches[0];
  const existingIdentities = useMemo(() => launches, []);
  const identity = useMemo(() => assessTokenIdentity({ name, symbol }, existingIdentities), [name, symbol, existingIdentities]);
  const demoProgress = calculateGraduationProgress(57_330n, 65_000n);
  const currentLimit = getAntiBotBuyLimit({ elapsedSeconds: 180, baseLimitCro: 1_000 });
  const totalCost = Number(initialBuy.replace(/,/g, '') || 0) + 15;

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
          <a href="#token">Token page</a>
          <a href="#ops">Ops</a>
          <a href="#proof">Proof</a>
        </div>
        <a href="#create" className="connectButton">Create Token</a>
      </nav>

      <section id="top" className="hero">
        <div className="heroCopy">
          <div className="statusLine"><span className="liveDot" /> Cronos testnet MVP · VVS-first graduation</div>
          <h1>Launch Cronos memes with protection buyers can actually read.</h1>
          <p className="lede">
            A modern Cronos-native launchpad for fair launches, protected token identity, anti-snipe windows,
            visible VVS graduation, and public LP-lock proof.
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
            <Metric label="sample launches" value="4" />
            <Metric label="runner progress" value={`${demoProgress}%`} />
            <Metric label="LP lock default" value="180d" />
          </div>
          <div className="proofCard">
            <p className="eyebrow">Default trust policy</p>
            <ul>
              <li>Duplicate normalized names and symbols blocked on-chain.</li>
              <li>CRO, Cronos, VVS, Crypto.com, Tectonic, and Fulcrom reserved.</li>
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

      <section id="create" className="panel createV2">
        <div>
          <p className="eyebrow">Create token</p>
          <h2>Guided launch form with immutable-data warnings.</h2>
          <p>Name, ticker, image, and launch links should be treated as immutable after launch. The preflight checks reserved Cronos names, duplicate identities, homoglyph swaps, and near-matches before wallet signing.</p>
          <div className="formGrid">
            <label>Token name<input value={name} onChange={(event) => setName(event.target.value)} /></label>
            <label>Symbol<input value={symbol} onChange={(event) => setSymbol(event.target.value)} /></label>
            <label className="wide">Description<input value={description} onChange={(event) => setDescription(event.target.value)} /></label>
            <label>Graduation target<input value={graduationTarget} onChange={(event) => setGraduationTarget(event.target.value)} /></label>
            <label>Initial buy CRO<input value={initialBuy} onChange={(event) => setInitialBuy(event.target.value)} /></label>
            <label className="wide">X / Website link<input value={xLink} onChange={(event) => setXLink(event.target.value)} /></label>
          </div>
          <div className="toggles">
            <ToggleRow label="Auto-graduate when reserve fills" />
            <ToggleRow label="Anti-snipe launch window" />
            <ToggleRow label="Token tax" enabled={false} />
          </div>
        </div>
        <div className="createPreviewStack">
          <article className="launchCard previewCard">
            <div className="launchMain">
              <div className="uploadMock">IMG</div>
              <div>
                <div className="cardTop"><h3>{name || 'Token name'}</h3><span>${symbol || 'TICKER'}</span></div>
                <p className="description">{description}</p>
                <div className="socials"><span>X</span><span>Web</span></div>
              </div>
            </div>
            <div className="progress"><span style={{ width: '0%' }} /></div>
            <div className="badges"><Badge tone="blue">Preview</Badge><Badge tone="good">Anti-snipe</Badge><Badge>No tax</Badge></div>
          </article>
          <div className="terminalCard">
            <h3>Preflight + cost</h3>
            <Badge tone={identity.status === 'available' ? 'good' : identity.status === 'warn' ? 'warn' : 'bad'}>{identity.status}</Badge>
            <dl>
              <dt>Normalized name</dt><dd>{identity.normalizedName}</dd>
              <dt>Normalized symbol</dt><dd>{identity.normalizedSymbol}</dd>
              <dt>Reasons</dt><dd>{identity.reasons.length ? identity.reasons.join(', ') : 'None'}</dd>
              <dt>Minute 3 cap</dt><dd>{currentLimit} CRO max buy</dd>
              <dt>Estimated total</dt><dd>{totalCost.toLocaleString()} CRO incl. mock fee</dd>
            </dl>
          </div>
        </div>
      </section>

      <section id="token" className="panel tokenDetail">
        <div className="tokenMainColumn">
          <div className="tokenHeader">
            <TokenGlyph launch={selectedLaunch} />
            <div>
              <p className="eyebrow">Token detail prototype</p>
              <h2>{selectedLaunch.name} <span>${selectedLaunch.symbol}</span></h2>
              <p>{selectedLaunch.description}</p>
              <div className="badges"><Badge tone="good">Protected identity</Badge><Badge tone="blue">VVS route</Badge><Badge>No tax</Badge><Badge tone="warn">Launching</Badge></div>
            </div>
          </div>
          <div className="detailStats">
            <Metric label="market cap" value={selectedLaunch.marketCap} />
            <Metric label="24h volume" value={selectedLaunch.volume24h} />
            <Metric label="holders" value="128" />
            <Metric label="progress" value={`${selectedLaunch.progress}%`} />
          </div>
          <div className="chartPanel">
            <div className="chartLine" />
            <div className="chartBars">{Array.from({ length: 36 }).map((_, index) => <span key={index} style={{ height: `${18 + ((index * 17) % 72)}%` }} />)}</div>
          </div>
          <div className="tablesGrid">
            <div className="dataTable"><h3>Recent trades</h3>{trades.map((trade) => <div key={`${trade.wallet}${trade.age}`}><b className={trade.side === 'Buy' ? 'buy' : 'sell'}>{trade.side}</b><span>{trade.wallet}</span><span>{trade.amount}</span><span>{trade.age}</span></div>)}</div>
            <div className="dataTable"><h3>Holders</h3>{holders.map((holder) => <div key={holder.wallet}><b>{holder.share}</b><span>{holder.wallet}</span><span>{holder.note}</span></div>)}</div>
          </div>
        </div>
        <aside className="tradePanel">
          <h3>Trade preview</h3>
          <div className="buySell"><button>Buy</button><button>Sell</button></div>
          <input value="250 CRO" readOnly />
          <div className="amountChips"><span>50</span><span>100</span><span>250</span><span>500</span></div>
          <dl>
            <dt>Receive est.</dt><dd>15,940 CROJACK</dd>
            <dt>Slippage</dt><dd>1.0%</dd>
            <dt>Creator</dt><dd>{selectedLaunch.creator}</dd>
            <dt>LP status</dt><dd>Locks on graduation</dd>
          </dl>
          <a className="button primary" href="#create">Connect wallet later</a>
        </aside>
      </section>

      <section id="trust" className="panel trustGrid">
        <div className="trustFeature">
          <p className="eyebrow">Launch proof model</p>
          <h2>Every launch gets risk signals, not vague “safe” labels.</h2>
          <p>Use buyer-facing facts: owner posture, tax, router, pair, LP vault, unlock time, creator wallet, top holders, and clone-risk checks.</p>
        </div>
        <div className="trustChecklist">
          {['Source verification pending until deploy', 'Tax disabled for v0', 'Auto-graduate on reserve target', 'LP sent to public timelock vault', 'VVS router configurable', 'Reserved ecosystem names blocked', 'Report / disputed-status hook', 'Top-holder concentration placeholder'].map((item) => (
            <div key={item}><span>✓</span>{item}</div>
          ))}
        </div>
      </section>

      <section id="ops" className="panel opsGrid">
        <div className="miniPanel">
          <p className="eyebrow">Admin queue</p>
          <h2>Moderation surface for anti-vamp enforcement.</h2>
          <div className="queueList">{adminQueue.map(([type, subject, state]) => <div key={subject}><span>{type}</span><b>{subject}</b><em>{state}</em></div>)}</div>
        </div>
        <div className="miniPanel">
          <p className="eyebrow">Creator profile</p>
          <h2>Reputation follows the wallet.</h2>
          <div className="creatorStats"><Metric label="tokens launched" value="7" /><Metric label="graduated" value="3" /><Metric label="reports" value="0" /></div>
          <p className="small">Future creator pages should show reused socials, prior graduations, launch history, and report/dispute count.</p>
        </div>
      </section>

      <section id="proof" className="panel deployPanel">
        <div>
          <p className="eyebrow">Cronos / VVS proof package</p>
          <h2>Prepared up to the deployer-wallet boundary.</h2>
          <p>Mock VVS graduation is covered by tests. The deploy path is scripted; the remaining external inputs are the local private key and official VVS testnet addresses.</p>
        </div>
        <div className="deploySteps">
          <div><strong>1</strong><span>Factory + registry addresses</span></div>
          <div><strong>2</strong><span>Sample token graduation tx</span></div>
          <div><strong>3</strong><span>Pair + LP vault lock proof</span></div>
          <div><strong>4</strong><span>No-tax / trust-panel checklist</span></div>
        </div>
      </section>
    </main>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
