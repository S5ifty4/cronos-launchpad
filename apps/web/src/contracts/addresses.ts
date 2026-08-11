export function envAddress(value: unknown) {
  const address = typeof value === 'string' ? value.trim() : '';
  return address ? address as `0x${string}` : undefined;
}

const env = import.meta.env ?? {};

export const addresses = {
  cronosTestnet: {
    launchpadFactory: envAddress(env.VITE_CRONOS_TESTNET_FACTORY),
    nameRegistry: envAddress(env.VITE_CRONOS_TESTNET_REGISTRY),
    lpVault: envAddress(env.VITE_CRONOS_TESTNET_VAULT),
  },
} as const;
