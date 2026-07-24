// @ts-nocheck
const required = ['CRONOS_TESTNET_RPC_URL', 'DEPLOYER_PRIVATE_KEY', 'VVS_TESTNET_ROUTER'];
const optional = ['VVS_TESTNET_FACTORY', 'VVS_TESTNET_WCRO', 'CRONOS_EXPLORER_API_KEY'];

const missing = required.filter((key) => !process.env[key]);
if (missing.length) {
  console.error(`Missing required env vars: ${missing.join(', ')}`);
  process.exit(1);
}

console.log('Required deploy environment is present.');
for (const key of required) console.log(`✓ ${key}`);
for (const key of optional) console.log(`${process.env[key] ? '✓' : '–'} ${key}`);
