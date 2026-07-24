// @ts-nocheck
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { network } from 'hardhat';
import { formatEther, keccak256, parseEther, stringToBytes } from 'viem';

const hash = (value: string) => keccak256(stringToBytes(value));
const eth = (value: string) => parseEther(value);

const { viem } = await network.connect();
const [creator, buyer, lpBeneficiary] = await viem.getWalletClients();
const publicClient = await viem.getPublicClient();
const chainId = await publicClient.getChainId();
const startBlock = await publicClient.getBlockNumber();

const registry = await viem.deployContract('NameRegistry', [creator.account.address]);
const vault = await viem.deployContract('TimelockedLpVault', [creator.account.address]);
const router = await viem.deployContract('MockVvsRouter', ['0x000000000000000000000000000000000000c0fe']);
const factory = await viem.deployContract('LaunchpadFactory', [registry.address, vault.address, creator.account.address]);

await registry.write.setRegistrar([factory.address, true], { account: creator.account });
await vault.write.transferOwnership([factory.address], { account: creator.account });

const name = 'Local Proof Runner';
const symbol = 'LPR';
const graduationTarget = eth('2');
const totalSupply = eth('1000000000');
const createHash = await factory.write.createToken([
  name,
  symbol,
  hash(name.toLowerCase()),
  hash(symbol.toUpperCase()),
  totalSupply,
  graduationTarget,
  false,
  0,
  eth('1000'),
  router.address,
  lpBeneficiary.account.address,
  180n * 24n * 60n * 60n,
], { account: creator.account, value: eth('1') });

const token = await registry.read.tokenByNameHash([hash(name.toLowerCase())]);
const buyHash = await factory.write.buy([token], { account: buyer.account, value: eth('1') });
const graduateHash = await factory.write.graduate([token, 0n, 0n, BigInt(Math.floor(Date.now() / 1000) + 3600)], { account: creator.account });

const state = await factory.read.launchStateByToken([token]);
const lock = await vault.read.locks([state[2]]);
const endBlock = await publicClient.getBlockNumber();

const proof = {
  chainId,
  mode: 'local-simulation',
  blockRange: { fromBlock: startBlock.toString(), toBlock: endBlock.toString() },
  accounts: { creator: creator.account.address, buyer: buyer.account.address, lpBeneficiary: lpBeneficiary.account.address },
  contracts: { nameRegistry: registry.address, timelockedLpVault: vault.address, mockVvsRouter: router.address, launchpadFactory: factory.address, token, pair: state[2] },
  transactions: { create: createHash, buy: buyHash, graduate: graduateHash },
  graduation: { reserveRaisedCro: formatEther(state[0]), graduated: state[1], liquidity: state[4].toString(), lpUnlocksAt: state[5].toString() },
  lpLock: { beneficiary: lock[0], amount: lock[1].toString(), unlocksAt: lock[2].toString() },
  expectedEvents: ['TokenCreated', 'TokenBought', 'TokenGraduated', 'LpDeposited'],
};

mkdirSync(join(process.cwd(), 'deployments'), { recursive: true });
const outPath = join(process.cwd(), 'deployments', `simulation-${chainId}.json`);
writeFileSync(outPath, `${JSON.stringify(proof, null, 2)}\n`);
console.log(JSON.stringify(proof, null, 2));
console.log(`Simulation proof written: ${outPath}`);
