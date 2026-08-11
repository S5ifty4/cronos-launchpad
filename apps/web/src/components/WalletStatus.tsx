import { useEffect, useState } from 'react';
import { useAccount, useDisconnect, useSwitchChain } from 'wagmi';
import { useAppKit } from '@reown/appkit/react';
import { cronosTestnet, shortAddress } from '../wallet/chains';

export function WalletStatus() {
  const { address, chainId, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();
  const { open } = useAppKit();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return <button className="connectButton muted" disabled>Connect wallet</button>;

  if (!isConnected || !address) {
    return <button className="connectButton" onClick={() => open()}>Connect wallet</button>;
  }

  if (chainId !== cronosTestnet.id) {
    return (
      <button className="connectButton warn" onClick={() => switchChain({ chainId: cronosTestnet.id })}>
        Switch to {cronosTestnet.name}
      </button>
    );
  }

  return (
    <div className="walletGroup">
      <button className="connectButton connected" title={address} onClick={() => open({ view: 'Account' })}>
        <span className="walletDot" aria-hidden />{shortAddress(address)}
      </button>
      <button className="disconnectButton" onClick={() => disconnect()} aria-label="Disconnect wallet">×</button>
    </div>
  );
}
