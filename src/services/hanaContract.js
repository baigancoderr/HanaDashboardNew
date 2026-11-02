/**
 * HANA Contract Service
 * Pattern: Same as DCC → src/services/dccContract.ts
 *
 * Provides all contract interaction functions:
 * - Provider management (read/write)
 * - Network switching
 * - HANA Token operations (buy, sell, getPrice, getReserves, balances)
 * - USDT operations (approve, allowance, balance)
 * - Staking operations (register, stake, claimROI, withdraw, getUserStakes, pendingROI)
 */

import { ethers } from "ethers";
import { BSC, CONTRACTS } from "../config/contracts";
import { HANA_TOKEN_ABI } from "../contracts/hanaTokenABI";
import { USDT_ABI } from "../contracts/usdtABI";
import { STAKING_ABI } from "../contracts/stakingABI";
import { getActiveWalletProvider } from "./walletProvider";

// ======================== ERROR HANDLING ========================

export class Web3Error extends Error {
  constructor(message) {
    super(message);
    this.name = "Web3Error";
  }
}

// ======================== PROVIDERS ========================

const jsonRpcOptions = {
  staticNetwork: true,
  polling: false,
  batchMaxCount: 1,
};

function createTimedJsonRpcProvider(url) {
  const connection = new ethers.FetchRequest(url);
  connection.timeout = 8000;
  return new ethers.JsonRpcProvider(connection, BSC.chainId, jsonRpcOptions);
}

const jsonRpcProviders = BSC.rpcUrls.map(createTimedJsonRpcProvider);

const readProvider = new ethers.FallbackProvider(
  jsonRpcProviders.map((provider, index) => ({
    provider,
    priority: index + 1,
    stallTimeout: 2500,
    weight: 1,
  })),
  BSC.chainId,
  { quorum: 1, pollingInterval: 4000 }
);

// ======================== WALLET / BROWSER PROVIDER ========================

export function createWalletBrowserProvider(walletProvider) {
  return new ethers.BrowserProvider(walletProvider, BSC.chainId, {
    staticNetwork: true,
    polling: false,
  });
}

const ADD_BSC_PARAMS = {
  chainId: BSC.chainIdHex,
  chainName: BSC.name,
  nativeCurrency: { name: "BNB", symbol: "BNB", decimals: 18 },
  rpcUrls: [...BSC.rpcUrls],
  blockExplorerUrls: [BSC.blockExplorer],
};

export async function getBrowserProvider() {
  const activeProvider = getActiveWalletProvider();
  const rawProvider =
    activeProvider ||
    (typeof window !== "undefined" && window.ethereum ? window.ethereum : null);

  if (!rawProvider) {
    throw new Web3Error("Wallet not connected. Please connect your wallet first.");
  }
  return new ethers.BrowserProvider(rawProvider, BSC.chainId, {
    staticNetwork: true,
    polling: false,
  });
}

export async function getSigner() {
  const provider = await getBrowserProvider();
  await ensureBscNetwork(provider);
  return provider.getSigner();
}

// ======================== NETWORK ========================

function isUnknownChainError(error) {
  const err = error;
  const message = (err.message ?? "").toLowerCase();
  return (
    err.code === 4902 ||
    message.includes("unrecognized chain") ||
    message.includes("wallet_addethereumchain") ||
    message.includes("chain not added") ||
    message.includes("unknown chain")
  );
}

export async function switchToBscNetwork(provider) {
  try {
    await provider.send("wallet_switchEthereumChain", [
      { chainId: BSC.chainIdHex },
    ]);
    return;
  } catch (error) {
    if (!isUnknownChainError(error)) throw error;
  }

  try {
    await provider.send("wallet_addEthereumChain", [ADD_BSC_PARAMS]);
  } catch (addError) {
    throw new Web3Error(parseContractError(addError));
  }
}

export async function ensureBscNetwork(provider) {
  const chainIdHex = await provider.send("eth_chainId", []);
  if (BigInt(chainIdHex) === BigInt(BSC.chainId)) return;
  await switchToBscNetwork(provider);
}

// ======================== CONTRACT INSTANCES ========================

function getHanaTokenContract(signerOrProvider) {
  return new ethers.Contract(CONTRACTS.hanaToken, HANA_TOKEN_ABI, signerOrProvider);
}

function getUsdtContract(signerOrProvider) {
  return new ethers.Contract(CONTRACTS.usdt, USDT_ABI, signerOrProvider);
}

function getStakingContract(signerOrProvider) {
  return new ethers.Contract(CONTRACTS.stakingContract, STAKING_ABI, signerOrProvider);
}

// ======================== ERROR PARSER ========================

export function parseContractError(error) {
  const limitMessage = (message) => {
    const text = String(message);
    return text.length > 200 ? `${text.slice(0, 200)}...` : text;
  };

  if (!error) return "Unknown error";

  // User rejected
  if (error.code === 4001 || error.code === "ACTION_REJECTED") {
    return "Transaction rejected by user.";
  }

  // Revert reason string
  if (error.reason) return limitMessage(error.reason);

  // Nested error
  if (error.error?.message) return limitMessage(error.error.message);

  // Data-based revert
  if (error.data) {
    try {
      if (typeof error.data === "string" && error.data.startsWith("0x08c379a0")) {
        const [reason] = ethers.AbiCoder.defaultAbiCoder().decode(
          ["string"],
          `0x${error.data.slice(10)}`
        );
        return limitMessage(reason);
      }
    } catch {
      // ignore
    }
  }

  if (error.message) {
    // Clean up ethers error messages
    const msg = error.message;
    if (msg.includes("insufficient funds")) return "Insufficient BNB for gas fees.";
    if (msg.includes("nonce")) return "Transaction nonce error. Please reset your wallet.";
    return limitMessage(msg);
  }

  return "Transaction failed. Please try again.";
}

// ======================== HANA TOKEN — READ ========================

export async function getHanaPrice() {
  const contract = getHanaTokenContract(readProvider);
  const price = await contract.getPrice();
  return ethers.formatEther(price);
}

export async function getHanaReserves() {
  const contract = getHanaTokenContract(readProvider);
  const [usdt, hana, price] = await contract.getReserves();
  return {
    usdtReserve: ethers.formatEther(usdt),
    hanaReserve: ethers.formatEther(hana),
    price: ethers.formatEther(price),
  };
}

export async function getHanaBalance(address) {
  const contract = getHanaTokenContract(readProvider);
  const balance = await contract.balanceOf(address);
  return ethers.formatEther(balance);
}

export async function getHanaTotalSupply() {
  const contract = getHanaTokenContract(readProvider);
  const supply = await contract.totalSupply();
  return ethers.formatEther(supply);
}

export async function isTradingEnabled() {
  const contract = getHanaTokenContract(readProvider);
  return contract.tradingEnabled();
}

// ======================== HANA TOKEN — WRITE ========================

export async function buyHana(usdtAmount) {
  const signer = await getSigner();
  const amountWei = ethers.parseEther(usdtAmount.toString());

  // Approve USDT first
  const usdtContract = getUsdtContract(signer);
  const allowance = await usdtContract.allowance(await signer.getAddress(), CONTRACTS.hanaToken);

  if (allowance < amountWei) {
    const approveTx = await usdtContract.approve(CONTRACTS.hanaToken, amountWei);
    await approveTx.wait();
  }

  // Buy
  const hanaContract = getHanaTokenContract(signer);
  const tx = await hanaContract.buy(amountWei);
  const receipt = await tx.wait();
  return receipt;
}

export async function sellHana(hanaAmount) {
  const signer = await getSigner();
  const amountWei = ethers.parseEther(hanaAmount.toString());

  const hanaContract = getHanaTokenContract(signer);
  const tx = await hanaContract.sell(amountWei);
  const receipt = await tx.wait();
  return receipt;
}

// ======================== USDT — READ ========================

export async function getUsdtBalance(address) {
  if (!address) return "0";
  try {
    const contract = getUsdtContract(readProvider);
    const balance = await contract.balanceOf(address);
    return ethers.formatEther(balance);
  } catch (err) {
    console.warn("getUsdtBalance failed:", err);
    return "0";
  }
}

export async function getBnbBalance(address) {
  if (!address) return "0";
  try {
    const balance = await readProvider.getBalance(address);
    return ethers.formatEther(balance);
  } catch (err) {
    console.warn("getBnbBalance failed:", err);
    return "0";
  }
}

export async function getUsdtAllowance(ownerAddress, spenderAddress) {
  if (!ownerAddress || !spenderAddress) return "0";
  try {
    const contract = getUsdtContract(readProvider);
    const allowance = await contract.allowance(ownerAddress, spenderAddress);
    return ethers.formatEther(allowance);
  } catch (err) {
    console.warn("getUsdtAllowance failed:", err);
    return "0";
  }
}

// ======================== USDT — WRITE ========================

export async function approveUsdt(spenderAddress, amount) {
  const signer = await getSigner();
  const amountWei = ethers.parseEther(amount.toString());

  const usdtContract = getUsdtContract(signer);
  const tx = await usdtContract.approve(spenderAddress, amountWei);
  const receipt = await tx.wait();
  return receipt;
}

// ======================== STAKING — READ ========================

export async function isUserRegistered(address) {
  const contract = getStakingContract(readProvider);
  return contract.isRegistered(address);
}

export async function getUserData(address) {
  const contract = getStakingContract(readProvider);
  const data = await contract.users(address);
  return {
    referrer: data.referrer,
    totalStaked: ethers.formatEther(data.totalStaked),
    totalDirectIncome: ethers.formatEther(data.totalDirectIncome),
    totalLevelIncome: ethers.formatEther(data.totalLevelIncome),
    totalRankIncome: ethers.formatEther(data.totalRankIncome),
    totalWithdrawn: ethers.formatEther(data.totalWithdrawn),
    lastWithdrawalTime: Number(data.lastWithdrawalTime),
    firstStakeTime: Number(data.firstStakeTime),
    isDAO: data.isDAO,
    daoJoinTime: Number(data.daoJoinTime),
    daoEndTime: Number(data.daoEndTime),
  };
}

export async function getUserStakes(address) {
  const contract = getStakingContract(readProvider);
  const stakes = await contract.getUserStakes(address);
  return stakes.map((s, index) => ({
    index,
    packageId: Number(s.packageId),
    amount: ethers.formatEther(s.amount),
    startTime: Number(s.startTime),
    lastClaimTime: Number(s.lastClaimTime),
    totalClaimed: ethers.formatEther(s.totalClaimed),
    cap: ethers.formatEther(s.cap),
    active: s.active,
  }));
}

export async function getPendingROI(address, stakeIndex) {
  const contract = getStakingContract(readProvider);
  const pending = await contract.pendingROI(address, stakeIndex);
  return ethers.formatEther(pending);
}

export async function getPackageInfo(packageId) {
  const contract = getStakingContract(readProvider);
  const pkg = await contract.packages(packageId);
  return {
    minAmount: ethers.formatEther(pkg.minAmount),
    dailyRateBps: Number(pkg.dailyRateBps),
    capMultiplier: Number(pkg.capMultiplier),
    isDAO: pkg.isDAO,
    active: pkg.active,
  };
}

export async function getPackageCount() {
  const contract = getStakingContract(readProvider);
  const count = await contract.packageCount();
  return Number(count);
}

export async function getAllPackages() {
  const count = await getPackageCount();
  const packages = [];
  for (let i = 0; i < count; i++) {
    const pkg = await getPackageInfo(i);
    packages.push({ id: i, ...pkg });
  }
  return packages;
}

export async function getDaoMemberCount() {
  const contract = getStakingContract(readProvider);
  const count = await contract.daoMemberCount();
  return Number(count);
}

export async function getMaxDaoMembers() {
  const contract = getStakingContract(readProvider);
  const max = await contract.MAX_DAO_MEMBERS();
  return Number(max);
}

export async function getWithdrawalConfig() {
  const contract = getStakingContract(readProvider);
  const [adminFeeBps, swapFeeBps, ecosystemFeeBps, maxWithdrawalPerDay, coolingPeriod] =
    await Promise.all([
      contract.adminFeeBps(),
      contract.swapFeeBps(),
      contract.ecosystemFeeBps(),
      contract.maxWithdrawalPerDay(),
      contract.coolingPeriod(),
    ]);

  return {
    adminFeeBps: Number(adminFeeBps),
    swapFeeBps: Number(swapFeeBps),
    ecosystemFeeBps: Number(ecosystemFeeBps),
    maxWithdrawalPerDay: ethers.formatEther(maxWithdrawalPerDay),
    coolingPeriod: Number(coolingPeriod),
  };
}

// ======================== STAKING — WRITE ========================

export async function registerUser(referrerAddress) {
  const signer = await getSigner();
  const contract = getStakingContract(signer);
  const tx = await contract.register(referrerAddress);
  const receipt = await tx.wait();
  return receipt;
}

export async function stakeTokens(packageId, amount) {
  const signer = await getSigner();
  const amountWei = ethers.parseEther(amount.toString());

  // Approve USDT for staking contract
  const usdtContract = getUsdtContract(signer);
  const userAddress = await signer.getAddress();
  const allowance = await usdtContract.allowance(userAddress, CONTRACTS.stakingContract);

  if (allowance < amountWei) {
    const approveTx = await usdtContract.approve(CONTRACTS.stakingContract, amountWei);
    await approveTx.wait();
  }

  // Stake
  const contract = getStakingContract(signer);
  const tx = await contract.stake(packageId, amountWei);
  const receipt = await tx.wait();
  return receipt;
}

export async function claimROI(stakeIndex) {
  const signer = await getSigner();
  const contract = getStakingContract(signer);
  const tx = await contract.claimROI(stakeIndex);
  const receipt = await tx.wait();
  return receipt;
}

export async function claimAllROI(stakeIndices) {
  const receipts = [];
  for (const index of stakeIndices) {
    const r = await claimROI(index);
    receipts.push(r);
  }
  return receipts;
}

export async function withdrawFunds(usdtAmount) {
  const signer = await getSigner();
  const amountWei = ethers.parseEther(usdtAmount.toString());
  const contract = getStakingContract(signer);
  const tx = await contract.withdraw(amountWei);
  const receipt = await tx.wait();
  return receipt;
}

// ======================== UTILITY ========================

export function formatAddress(address) {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function getExplorerUrl(txHashOrAddress, type = "tx") {
  return `${BSC.blockExplorer}/${type}/${txHashOrAddress}`;
}

export function getContractExplorerUrl(contractName) {
  const address = CONTRACTS[contractName];
  if (!address) return "#";
  return `${BSC.blockExplorer}/address/${address}`;
}
