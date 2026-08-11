export const launchpadFactoryAbi = [
  {
    type: 'function',
    name: 'createToken',
    stateMutability: 'payable',
    inputs: [
      { name: 'name', type: 'string' },
      { name: 'symbol', type: 'string' },
      { name: 'normalizedNameHash', type: 'bytes32' },
      { name: 'normalizedSymbolHash', type: 'bytes32' },
      { name: 'totalSupply', type: 'uint256' },
      { name: 'graduationTarget', type: 'uint256' },
      { name: 'antiBotEnabled', type: 'bool' },
      { name: 'antiBotDurationSeconds', type: 'uint64' },
      { name: 'antiBotBaseLimitWei', type: 'uint256' },
      { name: 'vvsRouter', type: 'address' },
      { name: 'lpBeneficiary', type: 'address' },
      { name: 'lpLockDurationSeconds', type: 'uint64' },
    ],
    outputs: [{ name: 'token', type: 'address' }],
  },
  { type: 'event', name: 'TokenCreated', inputs: [{ name: 'token', type: 'address', indexed: true }, { name: 'creator', type: 'address', indexed: true }] },
  { type: 'event', name: 'TokenBought', inputs: [{ name: 'token', type: 'address', indexed: true }, { name: 'buyer', type: 'address', indexed: true }, { name: 'croIn', type: 'uint256', indexed: false }] },
  { type: 'event', name: 'TokenGraduated', inputs: [{ name: 'token', type: 'address', indexed: true }, { name: 'pair', type: 'address', indexed: false }, { name: 'lpVault', type: 'address', indexed: false }] },
] as const;

export const lpVaultAbi = [
  { type: 'event', name: 'LpDeposited', inputs: [{ name: 'lpToken', type: 'address', indexed: true }, { name: 'beneficiary', type: 'address', indexed: true }, { name: 'amount', type: 'uint256', indexed: false }, { name: 'unlocksAt', type: 'uint256', indexed: false }] },
] as const;
