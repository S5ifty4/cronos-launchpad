import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { network } from 'hardhat';
import { keccak256, stringToBytes } from 'viem';

const nameHash = (value: string) => keccak256(stringToBytes(value));

describe('NameRegistry + LaunchpadFactory', async () => {
  const { viem } = await network.connect();

  it('blocks duplicate normalized token identities', async () => {
    const [owner, creator] = await viem.getWalletClients();
    const registry = await viem.deployContract('NameRegistry', [owner.account.address]);
    const factory = await viem.deployContract('LaunchpadFactory', [registry.address, owner.account.address]);

    await registry.write.setRegistrar([factory.address, true], { account: owner.account });

    const args = [
      'Teen Wolf',
      'TWOLF',
      nameHash('teen wolf'),
      nameHash('TWOLF'),
      1_000_000_000_000000000000000000n,
      65_000_000000000000000000n,
      true,
      600,
      1_000_000000000000000000n,
      '0x0000000000000000000000000000000000000000',
    ] as const;

    await factory.write.createToken(args, { account: creator.account, value: 10_000000000000000000n });

    await assert.rejects(
      factory.write.createToken(args, { account: creator.account, value: 10_000000000000000000n }),
      /NameAlreadyClaimed|SymbolAlreadyClaimed/,
    );
  });
});
