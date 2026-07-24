// @ts-nocheck
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { network } from 'hardhat';
import { keccak256, stringToBytes } from 'viem';

const reservedNames = ['Cronos', 'Crypto.com', 'VVS Finance', 'Tectonic', 'Fulcrom'];
const reservedSymbols = ['CRO', 'WCRO', 'VVS', 'TONIC', 'FUL', 'PACK'];
const hash = (value: string) => keccak256(stringToBytes(value));

const { viem } = await network.connect();
const [deployer] = await viem.getWalletClients();
const publicClient = await viem.getPublicClient();
const chainId = await publicClient.getChainId();

const registry = await viem.deployContract('NameRegistry', [deployer.account.address]);
const vault = await viem.deployContract('TimelockedLpVault', [deployer.account.address]);
const router = await viem.deployContract('MockVvsRouter', ['0x000000000000000000000000000000000000c0fe']);
const factory = await viem.deployContract('LaunchpadFactory', [registry.address, vault.address, deployer.account.address]);

await registry.write.setRegistrar([factory.address, true], { account: deployer.account });
await vault.write.transferOwnership([factory.address], { account: deployer.account });

for (const label of reservedNames) await registry.write.reserveName([hash(label.toLowerCase()), label], { account: deployer.account });
for (const label of reservedSymbols) await registry.write.reserveSymbol([hash(label.toUpperCase()), label], { account: deployer.account });

const manifest = { chainId, deployer: deployer.account.address, mode: 'local-dry-run', contracts: { nameRegistry: registry.address, timelockedLpVault: vault.address, mockVvsRouter: router.address, launchpadFactory: factory.address }, reservedNames, reservedSymbols };
mkdirSync(join(process.cwd(), 'deployments'), { recursive: true });
const outPath = join(process.cwd(), 'deployments', `local-${chainId}.json`);
writeFileSync(outPath, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(JSON.stringify(manifest, null, 2));
console.log(`Local deployment manifest written: ${outPath}`);
