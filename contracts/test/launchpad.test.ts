import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { network } from 'hardhat';
import { getAddress, keccak256, stringToBytes, zeroAddress } from 'viem';

const nameHash = (value: string) => keccak256(stringToBytes(value));
const eth = (value: number) => BigInt(value) * 1_000000000000000000n;

const defaultArgs = (router: `0x${string}`, lpBeneficiary: `0x${string}`, wrappedNative: `0x${string}` = '0x000000000000000000000000000000000000c0fe') =>
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
    wrappedNative,
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

    const token = await registry.read.tokenByNameHash([nameHash('blue gecko')]) as `0x${string}`;
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
      `0x${string}`,
      number,
    ];
    args[10] = zeroAddress;

    await assert.rejects(factory.write.createToken(args, { account: creator.account }), /InvalidAddress/);
  });

  it('transfers priced launch tokens to buyers and lets them sell before graduation', async () => {
    const { creator, lpBeneficiary, registry, router, factory } = await deployFixture();
    const args = defaultArgs(router.address, lpBeneficiary.account.address);

    await factory.write.createToken(args, { account: creator.account });
    const token = await registry.read.tokenByNameHash([nameHash('blue gecko')]) as `0x${string}`;
    const launchToken = await viem.getContractAt('LaunchToken', token);

    await factory.write.buy([token], { account: creator.account, value: eth(10) });
    assert.equal(await launchToken.read.balanceOf([creator.account.address]), 250_000_000_000000000000000000n);

    await launchToken.write.approve([factory.address, 50_000_000_000000000000000000n], { account: creator.account });
    await factory.write.sell([token, 50_000_000_000000000000000000n, 0n], { account: creator.account });

    assert.equal(await launchToken.read.balanceOf([creator.account.address]), 200_000_000_000000000000000000n);
    const launchState = (await factory.read.launchStateByToken([token])) as readonly [bigint, boolean, `0x${string}`, `0x${string}`, bigint, bigint, bigint];
    assert.equal(launchState[0], eth(8));
  });

  it('graduates with a Cronos smart-router style WCRO address instead of requiring WETH()', async () => {
    const [owner, creator, lpBeneficiary] = await viem.getWalletClients();
    const registry = await viem.deployContract('NameRegistry', [owner.account.address]);
    const vault = await viem.deployContract('TimelockedLpVault', [owner.account.address]);
    const router = await viem.deployContract('MockCronosSmartRouter', ['0x000000000000000000000000000000000000c0fe']);
    const factory = await viem.deployContract('LaunchpadFactory', [registry.address, vault.address, owner.account.address]);
    await registry.write.setRegistrar([factory.address, true], { account: owner.account });
    await vault.write.transferOwnership([factory.address], { account: owner.account });

    const args = defaultArgs(router.address, lpBeneficiary.account.address);
    await factory.write.createToken(args, { account: creator.account, value: eth(20) });
    const token = await registry.read.tokenByNameHash([nameHash('blue gecko')]) as `0x${string}`;

    const publicClient = await viem.getPublicClient();
    const block = await publicClient.getBlock();
    await factory.write.graduate([token, 0n, 0n, block.timestamp + 3600n], { account: creator.account });

    const launchState = (await factory.read.launchStateByToken([token])) as readonly [bigint, boolean, `0x${string}`, `0x${string}`, bigint, bigint, bigint];
    assert.equal(launchState[1], true);
    assert.notEqual(launchState[2], zeroAddress);
  });

  it('pre-creates a readable pair and deposits graduation LP into the timelock vault when supported', async () => {
    const { creator, lpBeneficiary, registry, vault, router, factory } = await deployFixture();
    const args = defaultArgs(router.address, lpBeneficiary.account.address);

    await factory.write.createToken(args, { account: creator.account, value: eth(10) });
    const token = await registry.read.tokenByNameHash([nameHash('blue gecko')]) as `0x${string}`;

    await factory.write.buy([token], { account: creator.account, value: eth(10) });

    const publicClient = await viem.getPublicClient();
    const block = await publicClient.getBlock();
    const deadline = Number(block.timestamp + 3600n);
    await factory.write.graduate([token, 0n, 0n, BigInt(deadline)], { account: creator.account });

    const launchState = (await factory.read.launchStateByToken([token])) as readonly [bigint, boolean, `0x${string}`, `0x${string}`, bigint, bigint, bigint];
    const pair = getAddress(launchState[2]);
    const lpVaultAddress = getAddress(launchState[3]);
    const liquidity = launchState[4];
    const lpUnlocksAt = launchState[5];

    assert.notEqual(pair, zeroAddress);
    assert.equal(lpVaultAddress, getAddress(vault.address));
    assert(liquidity > 0n);
    assert(lpUnlocksAt > 0n);
  });
});
