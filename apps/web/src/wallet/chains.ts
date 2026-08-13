const env = import.meta.env ?? {};
const envAddress = (value: unknown, fallback: `0x${string}`) => {
  const address = typeof value === 'string' ? value.trim() : '';
  return (address || fallback) as `0x${string}`;
};

export const cronosTestnet = {
  id: 338,
  name: 'Cronos Testnet',
  nativeCurrency: { name: 'Cronos', symbol: 'TCRO', decimals: 18 },
  rpcUrls: ['https://evm-t3.cronos.org/'],
  blockExplorerUrls: ['https://explorer.cronos.org/testnet'],
} as const;

export const cronosMainnet = {
  id: 25,
  name: 'Cronos',
  nativeCurrency: { name: 'Cronos', symbol: 'CRO', decimals: 18 },
  rpcUrls: ['https://evm.cronos.org'],
  blockExplorerUrls: ['https://explorer.cronos.org'],
} as const;

export const supportedChains = [cronosTestnet, cronosMainnet] as const;

export const liquidityContracts = {
  [cronosTestnet.id]: {
    smartRouter: envAddress(env.VITE_VVS_ROUTER, '0xC74C960708f043E04a84038c6D1136EA7Fcb16a1'),
    wcro: envAddress(env.VITE_VVS_WCRO, '0x6a3173618859C7cd40fAF6921b5E9eB6A76f1fD4'),
  },
  [cronosMainnet.id]: {
    smartRouter: envAddress(env.VITE_CRONOS_MAINNET_VVS_ROUTER, '0x0000000000000000000000000000000000000000'),
    wcro: envAddress(env.VITE_CRONOS_MAINNET_WCRO, '0x0000000000000000000000000000000000000000'),
  },
} as const;

export const vvsTestnetContracts = liquidityContracts[cronosTestnet.id];

export function getChainConfig(chainId: number = cronosTestnet.id) {
  return supportedChains.find((chain) => chain.id === chainId) ?? cronosTestnet;
}

export function getLiquidityContracts(chainId: number = cronosTestnet.id) {
  return liquidityContracts[chainId as keyof typeof liquidityContracts] ?? liquidityContracts[cronosTestnet.id];
}

export function isMainnetReady(chainId: number) {
  const contracts = getLiquidityContracts(chainId);
  return chainId === cronosTestnet.id || !Object.values(contracts).some((address) => address === '0x0000000000000000000000000000000000000000');
}

export function shortAddress(address?: string) {
  return address ? `${address.slice(0, 6)}…${address.slice(-4)}` : '';
}

export function toHexChainId(chainId: number) {
  return `0x${chainId.toString(16)}`;
}

export function explorerTxUrl(txHash: string, chainId: number = cronosTestnet.id) {
  return `${getChainConfig(chainId).blockExplorerUrls[0]}/tx/${txHash}`;
}

export function explorerAddressUrl(address: string, chainId: number = cronosTestnet.id) {
  return `${getChainConfig(chainId).blockExplorerUrls[0]}/address/${address}`;
}
