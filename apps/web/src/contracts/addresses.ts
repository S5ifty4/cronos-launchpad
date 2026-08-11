export function envAddress(value: unknown) {
  const address = typeof value === 'string' ? value.trim() : '';
  return address ? address as `0x${string}` : undefined;
}

export const addresses = {
  cronosTestnet: {
    launchpadFactory: envAddress(import.meta.env.VITE_CRONOS_TESTNET_FACTORY),
    nameRegistry: envAddress(import.meta.env.VITE_CRONOS_TESTNET_REGISTRY),
    lpVault: envAddress(import.meta.env.VITE_CRONOS_TESTNET_VAULT),
  },
} as const;
