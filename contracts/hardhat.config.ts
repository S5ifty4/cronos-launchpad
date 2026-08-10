import { HardhatUserConfig } from 'hardhat/config';
import hardhatToolboxViem from '@nomicfoundation/hardhat-toolbox-viem';

const config: HardhatUserConfig = {
  plugins: [hardhatToolboxViem],
  solidity: {
    version: '0.8.28',
    settings: {
      optimizer: { enabled: true, runs: 200 },
      viaIR: true,
    },
  },
  networks: {
    cronosTestnet: {
      type: 'http',
      chainType: 'l1',
      url: process.env.CRONOS_TESTNET_RPC_URL ?? 'https://evm-t3.cronos.org/',
      accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : [],
    },
  },
};

export default config;
