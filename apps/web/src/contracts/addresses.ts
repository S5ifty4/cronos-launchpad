export const addresses = {
  cronosTestnet: {
    launchpadFactory: import.meta.env.VITE_CRONOS_TESTNET_FACTORY as `0x${string}` | undefined,
    nameRegistry: import.meta.env.VITE_CRONOS_TESTNET_REGISTRY as `0x${string}` | undefined,
    lpVault: import.meta.env.VITE_CRONOS_TESTNET_VAULT as `0x${string}` | undefined,
  },
} as const;
