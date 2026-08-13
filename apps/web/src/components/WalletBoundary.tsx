import { lazy, Suspense } from 'react';
import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { initializeAppKit, wagmiConfig } from '../wallet/reown';

initializeAppKit();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchInterval: 30_000,
    },
  },
});

export function WalletBoundary({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}

export function WalletRoute({ children }: { children: ReactNode }) {
  return <WalletBoundary>{children}</WalletBoundary>;
}

const LazyWalletStatus = lazy(() => import('./WalletStatus').then((module) => ({ default: module.WalletStatus })));

export function WalletStatusSlot() {
  return (
    <Suspense fallback={<button className="connectButton muted" disabled>Connect wallet</button>}>
      <WalletBoundary><LazyWalletStatus /></WalletBoundary>
    </Suspense>
  );
}
