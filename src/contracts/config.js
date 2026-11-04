import { JsonRpcProvider } from "ethers";

export const BSC_TESTNET_CHAIN_ID = 97;

export const BSC_TESTNET_RPC = "https://bsc-testnet.publicnode.com";
export const BSC_TESTNET_RPC_FALLBACK = "https://data-seed-prebsc-1-s1.binance.org:8545";

// Deployment block for staking contract 0xdd3D1F695F922B1AAD4Ae36Ab6193E647e2F74da
export const CONTRACT_START_BLOCK = 140760000;

let _readOnlyProvider = null;
export const getReadOnlyProvider = () => {
  if (!_readOnlyProvider) {
    _readOnlyProvider = new JsonRpcProvider(BSC_TESTNET_RPC, {
      chainId: BSC_TESTNET_CHAIN_ID,
      name: "bscTestnet",
    });
  }
  return _readOnlyProvider;
};

export const CONTRACT_ADDRESSES = {
  // HANA Token (Testnet)
  hanaToken: "0xdF8Bb2Fb2329B17F8C3a8c6B2a97c3372Bd7fa16",
  // USDT Token (Testnet - DUSDT)
  usdtToken: "0x544E83aC9Fa1D0e29E95eBBd1B35A4F2798D81Ea",
  // HANA Staking Contract (Testnet)
  stakingContract: "0xdd3D1F695F922B1AAD4Ae36Ab6193E647e2F74da",
};

export const ZERO_ADDRESS = "0x42EC3cf99Bbc169C1d22c70339b5625A993CC033";

export const EXPLORER_URL = "https://testnet.bscscan.com";

export const getExplorerAddressUrl = (address) =>
  `${EXPLORER_URL}/address/${address}`;

export const getExplorerTxUrl = (txHash) =>
  `${EXPLORER_URL}/tx/${txHash}`;

export const DEFAULT_PACKAGES = [
  {
    id: 0,
    name: "Core",
    minAmount: 50,
    dailyRateBps: 20,
    dailyRate: "0.20%",
    capMultiplier: 2,
    cap: "2X",
    color: "blue",
    canOpenLevels: false,
    isDAO: false,
  },
  {
    id: 1,
    name: "Bronze",
    minAmount: 100,
    dailyRateBps: 50,
    dailyRate: "0.50%",
    capMultiplier: 2,
    cap: "2X",
    color: "purple",
    canOpenLevels: true,
    isDAO: false,
  },
  {
    id: 2,
    name: "Silver",
    minAmount: 300,
    dailyRateBps: 60,
    dailyRate: "0.60%",
    capMultiplier: 2,
    cap: "2X",
    color: "gold",
    canOpenLevels: true,
    isDAO: false,
  },
  {
    id: 3,
    name: "Gold",
    minAmount: 500,
    dailyRateBps: 70,
    dailyRate: "0.70%",
    capMultiplier: 2,
    cap: "2X",
    color: "gold",
    canOpenLevels: true,
    isDAO: false,
  },
  {
    id: 4,
    name: "Platinum",
    minAmount: 1000,
    dailyRateBps: 100,
    dailyRate: "1.00%",
    capMultiplier: 2,
    cap: "2X",
    popular: true,
    color: "green",
    canOpenLevels: true,
    isDAO: false,
  },
  {
    id: 5,
    name: "DAO",
    minAmount: 5000,
    dailyRateBps: 100,
    dailyRate: "1.00%",
    capMultiplier: 2,
    cap: "2X",
    color: "purple",
    canOpenLevels: true,
    isDAO: true,
  },
];
