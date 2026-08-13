import type { ReactNode } from 'react';
import { NetworkSelector } from './NetworkSelector';
import { WalletStatus } from './WalletStatus';

const nav = [['Explore', '/'], ['Create', '/create'], ['Creator', '/creator'], ['Admin', '/admin'], ['Proof', '/proof'], ['Docs', '/docs/how-it-works']];
const legal = [['Terms', '/terms'], ['Privacy', '/privacy'], ['Risk disclaimer', '/risk-disclaimer']];

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <main>
      <nav className="topNav">
        <a className="brand" href="/" aria-label="CronosForge home"><img className="brandMark" src="/assets/cronosforge-logo-inverted.png" alt="" /><span>cronos<span>forge</span></span></a>
        <div className="navLinks">{nav.map(([label, href]) => <a key={href} href={href}>{label}</a>)}</div>
        <WalletStatus />
      </nav>
      <div className="networkSlot"><NetworkSelector /></div>
      {children}
      <footer className="siteFooter">
        <div>
          <strong>CronosForge</strong>
          <p>Testnet MVP for protected Cronos launches. Not financial advice; verify every wallet prompt and token source before signing.</p>
        </div>
        <div className="footerLinks">
          {legal.map(([label, href]) => <a key={href} href={href}>{label}</a>)}
          <a href="/docs/risks">Docs: risks</a>
        </div>
      </footer>
    </main>
  );
}
