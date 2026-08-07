import type { ReactNode } from 'react';
import { WalletStatus } from './WalletStatus';

const nav = [['Explore', '/'], ['Create', '/create'], ['Token page', '/token/338/0xcrojack'], ['Creator', '/creator/0x6819'], ['Admin', '/admin'], ['Proof', '/proof'], ['Docs', '/docs/how-it-works']];

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <main>
      <nav className="topNav">
        <a className="brand" href="/" aria-label="CronosForge home"><img className="brandMark" src="/assets/cronosforge-logo-inverted.png" alt="" /><span>cronos<span>forge</span></span></a>
        <div className="navLinks">{nav.map(([label, href]) => <a key={href} href={href}>{label}</a>)}</div>
        <WalletStatus />
      </nav>
      {children}
    </main>
  );
}
