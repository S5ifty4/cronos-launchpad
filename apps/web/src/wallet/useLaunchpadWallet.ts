import { useCallback } from 'react';
import { useAccount, useSendTransaction, useSwitchChain } from 'wagmi';
import { cronosTestnet } from './chains';

type SendTxRequest = { to?: `0x${string}`; value: bigint; data: `0x${string}`; ready: boolean };

export function useLaunchpadWallet() {
  const { address, chainId, isConnected } = useAccount();
  const { switchChainAsync, error: switchError } = useSwitchChain();
  const { sendTransactionAsync, error: sendError, isPending } = useSendTransaction();
  const isCorrectChain = chainId === cronosTestnet.id;

  const switchToCronosTestnet = useCallback(async () => {
    await switchChainAsync({ chainId: cronosTestnet.id });
  }, [switchChainAsync]);

  const sendTransaction = useCallback(async (tx: SendTxRequest) => {
    if (!isConnected || !address) throw new Error('Connect wallet first');
    if (!isCorrectChain) throw new Error(`Switch to ${cronosTestnet.name}`);
    if (!tx.ready || !tx.to) throw new Error('Transaction is missing required launch config');
    return sendTransactionAsync({ to: tx.to, value: tx.value, data: tx.data });
  }, [address, isConnected, isCorrectChain, sendTransactionAsync]);

  const error = sendError?.message || switchError?.message;

  return {
    address,
    chainId,
    isConnected,
    isCorrectChain,
    isPending,
    switchToCronosTestnet,
    sendTransaction,
    error,
  };
}
