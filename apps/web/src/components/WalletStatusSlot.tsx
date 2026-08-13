import { lazy, Suspense } from 'react';

const LazyWalletStatusSlot = lazy(() => import('./WalletBoundary').then((module) => ({ default: module.WalletStatusSlot }))); 

export function WalletStatusSlot() {
  return (
    <Suspense fallback={<button className="connectButton muted" disabled>Connect wallet</button>}>
      <LazyWalletStatusSlot />
    </Suspense>
  );
}
