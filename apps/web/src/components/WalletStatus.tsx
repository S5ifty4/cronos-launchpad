import { cronosTestnet, shortAddress } from '../wallet/chains';
import { useInjectedWallet } from '../wallet/useInjectedWallet';

export function WalletStatus() {
  const wallet = useInjectedWallet();
  if (!wallet.hasWallet) return <button className="connectButton muted" title="Install a wallet to connect">No wallet</button>;
  if (!wallet.address) return <button className="connectButton" onClick={wallet.connect}>Connect wallet</button>;
  if (!wallet.isCorrectChain) return <button className="connectButton warn" onClick={wallet.switchToCronosTestnet}>Switch to {cronosTestnet.name}</button>;
  return <button className="connectButton connected" title={wallet.address}>{shortAddress(wallet.address)}</button>;
}
