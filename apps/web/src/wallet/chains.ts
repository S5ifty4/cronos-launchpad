export const vvsTestnetContracts = {
  smartRouter: '0xC74C960708f043E04a84038c6D1136EA7Fcb16a1',
  wcro: '0x6a3173618859C7cd40fAF6921b5E9eB6A76f1fD4',
} as const;

export const cronosTestnet = {
  id: 338,
  name: 'Cronos Testnet',
  nativeCurrency: { name: 'Cronos', symbol: 'TCRO', decimals: 18 },
  rpcUrls: ['https://evm-t3.cronos.org/'],
  blockExplorerUrls: ['https://explorer.cronos.org/testnet'],
} as const;

export function shortAddress(address?: string) {
  return address ? `${address.slice(0, 6)}…${address.slice(-4)}` : '';
}

export function toHexChainId(chainId: number) {
  return `0x${chainId.toString(16)}`;
}
