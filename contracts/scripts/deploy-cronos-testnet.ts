// @ts-nocheck
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { network } from 'hardhat';
import { keccak256, stringToBytes } from 'viem';

const required = ['CRONOS_TESTNET_RPC_URL', 'DEPLOYER_PRIVATE_KEY', 'VVS_TESTNET_ROUTER'];
const missing = required.filter((name) => !process.env[name]);
if (missing.length) {
  throw new Error(`Missing required env vars: ${missing.join(', ')}`);
}

const reservedNames = ['Cronos', 'Crypto.com', 'VVS Finance', 'Tectonic', 'Fulcrom', 'WolfSwap'];
const reservedSymbols = ['CRO', 'WCRO', 'VVS', 'TONIC', 'FUL', 'WOLF', 'PACK'];
const hash = (value: string) => keccak256(stringToBytes(value));

const { viem } = await network.connect();
const [deployer] = await viem.getWalletClients();
const publicClient = await viem.getPublicClient();
const chainId = await publicClient.getChainId();

console.log(`Deploying Cronos Launchpad from ${deployer.account.address} on chain ${chainId}`);

const registry = await viem.deployContract('NameRegistry', [deployer.account.address]);
console.log(`NameRegistry: ${registry.address}`);

const vault = await viem.deployContract('TimelockedLpVault', [deployer.account.address]);
console.log(`TimelockedLpVault: ${vault.address}`);

const factory = await viem.deployContract('LaunchpadFactory', [
  registry.address,
  vault.address,
  deployer.account.address,
]);
console.log(`LaunchpadFactory: ${factory.address}`);

await registry.write.setRegistrar([factory.address, true], { account: deployer.account });
await vault.write.transferOwnership([factory.address], { account: deployer.account });

for (const label of reservedNames) {
  await registry.write.reserveName([hash(label.toLowerCase()), label], { account: deployer.account });
}
for (const label of reservedSymbols) {
  await registry.write.reserveSymbol([hash(label.toUpperCase()), label], { account: deployer.account });
}

const deployment = {
  chainId,
  deployer: deployer.account.address,
  deployedAt: new Date().toISOString(),
  contracts: {
    nameRegistry: registry.address,
    timelockedLpVault: vault.address,
    launchpadFactory: factory.address,
  },
  graduation: {
    vvsRouter: process.env.VVS_TESTNET_ROUTER,
    vvsFactory: process.env.VVS_TESTNET_FACTORY ?? null,
    wcro: process.env.VVS_TESTNET_WCRO ?? null,
    defaultLpLockDays: 180,
  },
  reservedNames,
  reservedSymbols,
};

const outDir = join(process.cwd(), 'deployments');
mkdirSync(outDir, { recursive: true });
const outPath = join(outDir, `cronos-testnet-${chainId}.json`);
writeFileSync(outPath, `${JSON.stringify(deployment, null, 2)}\n`);
console.log(`Deployment manifest written: ${outPath}`);
