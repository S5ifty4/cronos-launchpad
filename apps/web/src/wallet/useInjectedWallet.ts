import { useCallback, useEffect, useState } from 'react';
import { cronosTestnet, toHexChainId } from './chains';

type SendTxRequest = { to?: `0x${string}`; value: bigint; data: `0x${string}`; ready: boolean };

type EthereumProvider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, handler: (...args: unknown[]) => void) => void;
};

declare global {
  interface Window { ethereum?: EthereumProvider }
}

export function useInjectedWallet() {
  const [address, setAddress] = useState<string>();
  const [chainId, setChainId] = useState<number>();
  const [error, setError] = useState<string>();
  const provider = typeof window !== 'undefined' ? window.ethereum : undefined;
  const isCorrectChain = chainId === cronosTestnet.id;

  const refresh = useCallback(async () => {
    if (!provider) return;
    const [accounts, chain] = await Promise.all([
      provider.request({ method: 'eth_accounts' }) as Promise<string[]>,
      provider.request({ method: 'eth_chainId' }) as Promise<string>,
    ]);
    setAddress(accounts[0]);
    setChainId(Number.parseInt(chain, 16));
  }, [provider]);

  const connect = useCallback(async () => {
    setError(undefined);
    if (!provider) { setError('No injected wallet found'); return; }
    try {
      const accounts = await provider.request({ method: 'eth_requestAccounts' }) as string[];
      setAddress(accounts[0]);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Wallet connection rejected');
    }
  }, [provider, refresh]);

  const switchToCronosTestnet = useCallback(async () => {
    if (!provider) return;
    try {
      await provider.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: toHexChainId(cronosTestnet.id) }] });
      await refresh();
    } catch (err) {
      try {
        await provider.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: toHexChainId(cronosTestnet.id),
            chainName: cronosTestnet.name,
            nativeCurrency: cronosTestnet.nativeCurrency,
            rpcUrls: cronosTestnet.rpcUrls,
            blockExplorerUrls: cronosTestnet.blockExplorerUrls,
          }],
        });
        await refresh();
      } catch (addErr) {
        setError(addErr instanceof Error ? addErr.message : err instanceof Error ? err.message : 'Could not switch network');
      }
    }
  }, [provider, refresh]);

  const sendTransaction = useCallback(async (tx: SendTxRequest) => {
    setError(undefined);
    if (!provider || !address) { setError('Connect wallet first'); return undefined; }
    if (!isCorrectChain) { setError(`Switch to ${cronosTestnet.name}`); return undefined; }
    if (!tx.ready || !tx.to) { setError('Transaction is missing required launch config'); return undefined; }
    try {
      return await provider.request({
        method: 'eth_sendTransaction',
        params: [{ from: address, to: tx.to, value: `0x${tx.value.toString(16)}`, data: tx.data }],
      }) as `0x${string}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Transaction rejected');
      return undefined;
    }
  }, [provider, address, isCorrectChain]);

  useEffect(() => {
    void refresh();
    if (!provider?.on) return;
    const handleAccounts = (accounts: unknown) => setAddress(Array.isArray(accounts) ? accounts[0] : undefined);
    const handleChain = (chain: unknown) => setChainId(typeof chain === 'string' ? Number.parseInt(chain, 16) : undefined);
    provider.on('accountsChanged', handleAccounts);
    provider.on('chainChanged', handleChain);
    return () => { provider.removeListener?.('accountsChanged', handleAccounts); provider.removeListener?.('chainChanged', handleChain); };
  }, [provider, refresh]);

  return { address, chainId, connect, switchToCronosTestnet, sendTransaction, isCorrectChain, hasWallet: Boolean(provider), error };
}
