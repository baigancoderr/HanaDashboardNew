/**
 * HANA Network & Contract Configuration
 * Pattern: Same folder structure as DCC → src/config/contracts.js
 *
 * Flip USE_MAINNET to switch between BSC Mainnet and Testnet.
 * Currently set to false (Testnet) for development.
 */

export const USE_MAINNET = false;

// ======================== RPC URLs ========================

const DEFAULT_BSC_TESTNET_RPCS = [
  "https://bsc-testnet-rpc.publicnode.com",
  "https://bsc-testnet.bnbchain.org",
  "https://bsc-testnet.drpc.org",
  "https://bnb-testnet.api.onfinality.io/public",
  "https://data-seed-prebsc-1-s1.binance.org:8545",
  "https://data-seed-prebsc-2-s1.binance.org:8545",
  "https://data-seed-prebsc-1-s2.binance.org:8545",
];

const DEFAULT_BSC_MAINNET_RPCS = [
  "https://bsc-dataseed.binance.org",
  "https://bsc-dataseed1.binance.org",
  "https://bsc-dataseed2.binance.org",
  "https://bsc-dataseed3.binance.org",
  "https://bsc-dataseed4.binance.org",
  "https://bsc-rpc.publicnode.com",
];

function resolveRpcUrls(defaults) {
  const extra = import.meta.env.VITE_BSC_RPC_URL?.trim();
  const urls = extra ? [extra, ...defaults] : [...defaults];
  return [...new Set(urls)];
}

const testnetRpcUrls = resolveRpcUrls(DEFAULT_BSC_TESTNET_RPCS);
const mainnetRpcUrls = resolveRpcUrls(DEFAULT_BSC_MAINNET_RPCS);

// ======================== NETWORK CONFIGS ========================

export const BSC_TESTNET = {
  chainId: 97,
  chainIdHex: "0x61",
  rpcUrl: testnetRpcUrls[0],
  rpcUrls: testnetRpcUrls,
  name: "BSC Testnet",
  blockExplorer: "https://testnet.bscscan.com",
};

export const BSC_MAINNET = {
  chainId: 56,
  chainIdHex: "0x38",
  rpcUrl: mainnetRpcUrls[0],
  rpcUrls: mainnetRpcUrls,
  name: "BSC Mainnet",
  blockExplorer: "https://bscscan.com",
};

// ======================== CONTRACT ADDRESSES ========================

export const CONTRACTS_TESTNET = {
  hanaToken: "0xD8c54b4b3fAE85b1Dfba1B868b1873C12FDd75EA",
  usdt: "0x544E83aC9Fa1D0e29E95eBBd1B35A4F2798D81Ea",
  stakingContract: "0x50E2dEF4501A1573122c2134F6c1343aB1C72e6E",
};

export const CONTRACTS_MAINNET = {
  // TODO: Fill in mainnet addresses after deployment
  hanaToken: "0x0000000000000000000000000000000000000000",
  usdt: "0x55d398326f99059fF775485246999027B3197955", // BSC Mainnet USDT
  stakingContract: "0x0000000000000000000000000000000000000000",
};

// ======================== DEFAULT SPONSOR ========================

export const DEFAULT_SPONSOR_TESTNET =
  "0x0000000000000000000000000000000000000000";
export const DEFAULT_SPONSOR_MAINNET =
  "0x0000000000000000000000000000000000000000";

// ======================== ACTIVE CONFIG (Derived) ========================

/** Active network — derived from USE_MAINNET flag */
export const BSC = USE_MAINNET ? BSC_MAINNET : BSC_TESTNET;
export const CONTRACTS = USE_MAINNET ? CONTRACTS_MAINNET : CONTRACTS_TESTNET;
export const DEFAULT_SPONSOR = USE_MAINNET
  ? DEFAULT_SPONSOR_MAINNET
  : DEFAULT_SPONSOR_TESTNET;
