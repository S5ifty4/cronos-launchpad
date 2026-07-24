import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { network } from 'hardhat';
import { getAddress, keccak256, stringToBytes, zeroAddress } from 'viem';

const nameHash = (value: string) => keccak256(stringToBytes(value));
const eth = (value: number) => BigInt(value) * 1_000000000000000000n;

const defaultArgs = (router: `0x${string}`, lpBeneficiary: `0x${string}`) =>
  [
    'Blue Gecko',
    'BGECKO',
    nameHash('blue gecko'),
    nameHash('BGECKO'),
    1_000_000_000_000000000000000000n,
    eth(20),
    true,
    600,
    eth(1_000),
    router,
    lpBeneficiary,
    180 * 24 * 60 * 60,
  ] as const;

describe('NameRegistry + LaunchpadFactory', async () => {
  const { viem } = await network.connect();

  async function deployFixture() {
    const [owner, creator, lpBeneficiary] = await viem.getWalletClients();
    const registry = await viem.deployContract('NameRegistry', [owner.account.address]);
    const vault = await viem.deployContract('TimelockedLpVault', [owner.account.address]);
    const router = await viem.deployContract('MockVvsRouter', ['0x000000000000000000000000000000000000c0fe']);
    const factory = await viem.deployContract('LaunchpadFactory', [
      registry.address,
      vault.address,
      owner.account.address,
    ]);

    await registry.write.setRegistrar([factory.address, true], { account: owner.account });
    await vault.write.transferOwnership([factory.address], { account: owner.account });

    return { owner, creator, lpBeneficiary, registry, vault, router, factory };
  }

  it('blocks duplicate normalized token identities', async () => {
    const { creator, lpBeneficiary, registry, router, factory } = await deployFixture();
    const args = defaultArgs(router.address, lpBeneficiary.account.address);

    await factory.write.createToken(args, { account: creator.account, value: eth(10) });
    await assert.rejects(
      factory.write.createToken(args, { account: creator.account, value: eth(10) }),
      /NameAlreadyClaimed|SymbolAlreadyClaimed/,
    );

    const token = await registry.read.tokenByNameHash([nameHash('blue gecko')]);
    assert.notEqual(token, zeroAddress);
  });

  it('rejects unsafe graduation config', async () => {
    const { creator, lpBeneficiary, router, factory } = await deployFixture();
    const args = [...defaultArgs(router.address, lpBeneficiary.account.address)] as unknown as [
      string,
      string,
      `0x${string}`,
      `0x${string}`,
      bigint,
      bigint,
      boolean,
      number,
      bigint,
      `0x${string}`,
      `0x${string}`,
      number,
    ];
    args[9] = zeroAddress;

    await assert.rejects(factory.write.createToken(args, { account: creator.account }), /InvalidAddress/);
  });

  it('graduates into a VVS-compatible router and locks LP tokens', async () => {
    const { creator, lpBeneficiary, registry, vault, router, factory } = await deployFixture();
    const args = defaultArgs(router.address, lpBeneficiary.account.address);

    await factory.write.createToken(args, { account: creator.account, value: eth(10) });
    const token = await registry.read.tokenByNameHash([nameHash('blue gecko')]);

    await factory.write.buy([token], { account: creator.account, value: eth(10) });

    const publicClient = await viem.getPublicClient();
    const block = await publicClient.getBlock();
    const deadline = Number(block.timestamp + 3600n);
    await factory.write.graduate([token, 0n, 0n, BigInt(deadline)], { account: creator.account });

    const launchState = (await factory.read.launchStateByToken([token])) as readonly [bigint, boolean, `0x${string}`, `0x${string}`, bigint, bigint];
    const pair = getAddress(launchState[2]);
    const lpVaultAddress = getAddress(launchState[3]);
    const liquidity = launchState[4];
    const lpUnlocksAt = launchState[5];

    assert.notEqual(pair, zeroAddress);
    assert.equal(lpVaultAddress, getAddress(vault.address));
    assert(liquidity > 0n);
    assert(lpUnlocksAt > block.timestamp);

    const lockInfo = (await vault.read.locks([pair])) as readonly [`0x${string}`, bigint, bigint];
    assert.equal(getAddress(lockInfo[0]), getAddress(lpBeneficiary.account.address));
    assert.equal(lockInfo[1], liquidity);
    assert.equal(lockInfo[2], lpUnlocksAt);
  });
});
