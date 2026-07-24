export const cronosTestnet = {
  id: 338,
  name: 'Cronos Testnet',
  nativeCurrency: { name: 'Cronos', symbol: 'TCRO', decimals: 18 },
  rpcUrls: ['https://evm-t3.cronos.com'],
  blockExplorerUrls: ['https://explorer.cronos.org/testnet'],
} as const;

export function shortAddress(address?: string) {
  return address ? `${address.slice(0, 6)}…${address.slice(-4)}` : '';
}

export function toHexChainId(chainId: number) {
  return `0x${chainId.toString(16)}`;
}
