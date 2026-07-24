import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { assessTokenIdentity, calculateGraduationProgress, getAntiBotBuyLimit } from '@cronos-launchpad/core';
import { launches } from './mockData';
import './styles.css';

function Badge({ children, tone = 'neutral' }: { children: React.ReactNode; tone?: 'good' | 'warn' | 'bad' | 'neutral' }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

function App() {
  const [name, setName] = useState('Teen W0lf');
  const [symbol, setSymbol] = useState('TEENW');
  const existingIdentities = useMemo(
    () => [...launches, { name: 'Teen Wolf', symbol: 'TWOLF', creator: '0xe...F5de', progress: 1.5, reserveRaised: '975 CRO', graduationTarget: '65,000 CRO', age: '8h', antiBot: true, protectedName: true, vvsGraduation: true, taxBips: 0 }],
    [],
  );
  const identity = useMemo(() => assessTokenIdentity({ name, symbol }, existingIdentities), [name, symbol, existingIdentities]);
  const demoProgress = calculateGraduationProgress(27_105n, 65_000n);
  const currentLimit = getAntiBotBuyLimit({ elapsedSeconds: 180, baseLimitCro: 1_000 });

  return (
    <main>
      <section className="hero">
        <div>
          <p className="eyebrow">Cronos testnet MVP</p>
          <h1>Fair launches with anti-vamp token identity and VVS graduation.</h1>
          <p className="lede">
            A Cronos-native launchpad prototype focused on protected names/symbols, anti-snipe windows,
            transparent graduation, and buyer-facing trust panels.
          </p>
          <div className="heroActions">
            <a href="#create" className="button primary">Create protected launch</a>
            <a href="#board" className="button secondary">View launch board</a>
          </div>
        </div>
        <aside className="trustCard">
          <h2>Default safety policy</h2>
          <ul>
            <li>Duplicate names/symbols blocked</li>
            <li>Reserved Cronos ecosystem names blocked</li>
            <li>Anti-bot launch enabled by default</li>
            <li>VVS graduation route by default</li>
            <li>Tax disabled for v0 whitelist friendliness</li>
          </ul>
        </aside>
      </section>

      <section id="create" className="panel grid2">
        <div>
          <p className="eyebrow">Create token</p>
          <h2>Anti-vamp preflight</h2>
          <label>Token name<input value={name} onChange={(event) => setName(event.target.value)} /></label>
          <label>Symbol<input value={symbol} onChange={(event) => setSymbol(event.target.value)} /></label>
        </div>
        <div className="resultBox">
          <h3>Identity assessment</h3>
          <Badge tone={identity.status === 'available' ? 'good' : identity.status === 'warn' ? 'warn' : 'bad'}>{identity.status}</Badge>
          <dl>
            <dt>Normalized name</dt><dd>{identity.normalizedName}</dd>
            <dt>Normalized symbol</dt><dd>{identity.normalizedSymbol}</dd>
            <dt>Reasons</dt><dd>{identity.reasons.length ? identity.reasons.join(', ') : 'None'}</dd>
          </dl>
          <p className="small">Homoglyphs like W0LF are folded before exact collision checks, so obvious copycats are blocked.</p>
        </div>
      </section>

      <section id="board" className="panel">
        <div className="sectionHeader">
          <div>
            <p className="eyebrow">Launch board</p>
            <h2>Protected Cronos launches</h2>
          </div>
          <div className="tabs"><Badge tone="good">Protected</Badge><Badge>Near graduation</Badge><Badge>New</Badge></div>
        </div>
        <div className="cards">
          {launches.map((launch) => (
            <article className="launchCard" key={launch.symbol}>
              <div className="tokenIcon">{launch.symbol.slice(0, 2)}</div>
              <div className="cardTop">
                <h3>{launch.name}</h3>
                <span>${launch.symbol}</span>
              </div>
              <div className="progress"><span style={{ width: `${launch.progress}%` }} /></div>
              <p>{launch.reserveRaised} / {launch.graduationTarget} · {launch.progress}%</p>
              <div className="badges">
                {launch.antiBot && <Badge tone="good">Anti-bot</Badge>}
                {launch.protectedName && <Badge tone="good">Name protected</Badge>}
                {launch.vvsGraduation && <Badge tone="good">VVS route</Badge>}
                {launch.taxBips === 0 && <Badge>No tax</Badge>}
              </div>
              <p className="small">Creator {launch.creator} · launched {launch.age} ago</p>
            </article>
          ))}
        </div>
      </section>

      <section className="panel grid2">
        <div>
          <p className="eyebrow">Graduation mechanics</p>
          <h2>VVS-first by configuration, not hardcoded.</h2>
          <p>
            The contract scaffold records the intended VVS router for each launch. The next adapter slice should call
            VVS-compatible router methods after we confirm official testnet router/factory/WCRO addresses.
          </p>
        </div>
        <div className="resultBox">
          <h3>Live math examples</h3>
          <dl>
            <dt>Progress helper</dt><dd>{demoProgress}%</dd>
            <dt>Anti-bot limit at minute 3</dt><dd>{currentLimit} CRO max buy</dd>
            <dt>Graduation target</dt><dd>65,000 CRO default</dd>
          </dl>
        </div>
      </section>
    </main>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
