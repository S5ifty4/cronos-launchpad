import { AppShell } from './components/AppShell';
import { AdminPage } from './pages/AdminPage';
import { CreatePage } from './pages/CreatePage';
import { CreatorPage } from './pages/CreatorPage';
import { DocsPage } from './pages/DocsPage';
import { HomePage } from './pages/HomePage';
import { ProofPage } from './pages/ProofPage';
import { TokenPage } from './pages/TokenPage';

function route(pathname: string) {
  if (pathname === '/create') return <CreatePage />;
  if (pathname.startsWith('/token/')) return <TokenPage address={pathname.split('/').at(-1)} />;
  if (pathname.startsWith('/creator/')) return <CreatorPage />;
  if (pathname === '/admin') return <AdminPage />;
  if (pathname === '/proof') return <ProofPage />;
  if (pathname === '/docs/risks') return <DocsPage topic="risks" />;
  if (pathname === '/docs/fees') return <DocsPage topic="fees" />;
  if (pathname === '/docs/how-it-works') return <DocsPage topic="how-it-works" />;
  return <HomePage />;
}

export function App() {
  return <AppShell>{route(window.location.pathname)}</AppShell>;
}
