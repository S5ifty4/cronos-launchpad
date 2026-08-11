import { createAppKit } from '@reown/appkit/react';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { defineChain, http } from 'viem';
import { cronos } from 'wagmi/chains';
import type { AppKitNetwork } from '@reown/appkit/networks';
import { cronosTestnet } from './chains';

const rawWalletConnectProjectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID;
export const walletConnectProjectId = rawWalletConnectProjectId?.trim() || 'dev-placeholder-replace-me';

export const cronosTestnetChain = defineChain({
  id: cronosTestnet.id,
  name: cronosTestnet.name,
  nativeCurrency: cronosTestnet.nativeCurrency,
  rpcUrls: {
    default: { http: cronosTestnet.rpcUrls },
    public: { http: cronosTestnet.rpcUrls },
  },
  blockExplorers: {
    default: { name: 'Cronos Testnet Explorer', url: cronosTestnet.blockExplorerUrls[0] },
  },
  testnet: true,
});

export const reownNetworks = [cronosTestnetChain, cronos] as [AppKitNetwork, ...AppKitNetwork[]];

export const wagmiAdapter = new WagmiAdapter({
  networks: reownNetworks,
  projectId: walletConnectProjectId,
  transports: {
    [cronosTestnetChain.id]: http(cronosTestnet.rpcUrls[0]),
    [cronos.id]: http('https://evm.cronos.org'),
  },
});

export const wagmiConfig = wagmiAdapter.wagmiConfig;

let appKitInitialized = false;

export function initializeAppKit() {
  if (appKitInitialized || typeof window === 'undefined') return;
  appKitInitialized = true;
  createAppKit({
    adapters: [wagmiAdapter],
    networks: reownNetworks,
    projectId: walletConnectProjectId,
    metadata: {
      name: 'CronosForge',
      description: 'Protected Cronos testnet launchpad for meme tokens',
      url: 'https://cronosforge.com',
      icons: ['https://cronosforge.com/assets/cronosforge-logo-inverted.png'],
    },
    features: {
      analytics: false,
      email: false,
      socials: false,
      swaps: false,
      onramp: false,
      allWallets: true,
    },
    allWallets: 'SHOW',
    enableWallets: true,
    enableInjected: true,
    enableWalletConnect: true,
    themeMode: 'dark',
    themeVariables: {
      '--w3m-accent': '#ff7a1a',
      '--w3m-border-radius-master': '14px',
    },
    featuredWalletIds: [
      'f2436c67184f158d1beda5df53298ee84abfc367581e4505134b5bcf5f46697d',
      'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96',
    ],
  });
}

declare module 'wagmi' {
  interface Register {
    config: typeof wagmiConfig;
  }
}
