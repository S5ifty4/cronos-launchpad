import { lazy, Suspense } from 'react';
import { AppShell } from './components/AppShell';
import { HomePage } from './pages/HomePage';

const WalletRoute = lazy(() => import('./components/WalletBoundary').then((module) => ({ default: module.WalletRoute })));

const AdminPage = lazy(() => import('./pages/AdminPage').then((module) => ({ default: module.AdminPage })));
const CreatePage = lazy(() => import('./pages/CreatePage').then((module) => ({ default: module.CreatePage })));
const CreatorPage = lazy(() => import('./pages/CreatorPage').then((module) => ({ default: module.CreatorPage })));
const DocsPage = lazy(() => import('./pages/DocsPage').then((module) => ({ default: module.DocsPage })));
const LegalPage = lazy(() => import('./pages/LegalPage').then((module) => ({ default: module.LegalPage })));
const ProofPage = lazy(() => import('./pages/ProofPage').then((module) => ({ default: module.ProofPage })));
const TokenPage = lazy(() => import('./pages/TokenPage').then((module) => ({ default: module.TokenPage })));

function route(pathname: string) {
  if (pathname === '/create') return <WalletRoute><CreatePage /></WalletRoute>;
  if (pathname.startsWith('/token/')) return <WalletRoute><TokenPage address={pathname.split('/').at(-1)} /></WalletRoute>;
  if (pathname === '/creator' || pathname.startsWith('/creator/')) return <WalletRoute><CreatorPage /></WalletRoute>;
  if (pathname === '/admin') return <WalletRoute><AdminPage /></WalletRoute>;
  if (pathname === '/proof') return <ProofPage />;
  if (pathname === '/docs/risks') return <DocsPage topic="risks" />;
  if (pathname === '/docs/fees') return <DocsPage topic="fees" />;
  if (pathname === '/docs/how-it-works') return <DocsPage topic="how-it-works" />;
  if (pathname === '/terms') return <LegalPage topic="terms" />;
  if (pathname === '/privacy') return <LegalPage topic="privacy" />;
  if (pathname === '/risk-disclaimer') return <LegalPage topic="risks" />;
  return <HomePage />;
}

export function App() {
  return <AppShell><Suspense fallback={<section className="panel"><div className="miniPanel"><p className="eyebrow">Loading</p><h2>Opening page…</h2></div></section>}>{route(window.location.pathname)}</Suspense></AppShell>;
}
