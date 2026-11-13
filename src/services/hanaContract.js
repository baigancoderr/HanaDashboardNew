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
import { HANA_STAKING_ABI } from "../contracts/abis";
import { getActiveWalletProvider } from "./walletProvider";
import { readStakingIsRegistered } from "../contracts/registration";

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
  return new ethers.Contract(CONTRACTS.stakingContract, HANA_STAKING_ABI, signerOrProvider);
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
  return readStakingIsRegistered(address);
}

export async function getUserData(address) {
  const contract = getStakingContract(readProvider);
  const data = await contract.users(address);
  return {
    referrer: data.referrer ?? data[0],
    totalStaked: ethers.formatEther(data.totalStaked ?? data[1] ?? 0n),
    totalDirectIncome: ethers.formatEther(data.totalDirectIncome ?? data.totalDirect ?? data[3] ?? 0n),
    totalLevelIncome: ethers.formatEther(data.totalLevelIncome ?? data.totalLevel ?? data[4] ?? 0n),
    totalRankIncome: ethers.formatEther(data.totalRankIncome ?? data.totalRank ?? data[5] ?? 0n),
    totalWithdrawn: ethers.formatEther(data.totalWithdrawn ?? data.totalWithdrawnHana ?? data[8] ?? 0n),
    lastWithdrawalTime: Number(data.lastWithdrawalTime ?? data[10] ?? 0n),
    firstStakeTime: Number(data.firstStakeTime ?? data[9] ?? 0n),
    isDAO: Boolean(data.isDAO ?? data[14]),
    daoJoinTime: Number(data.daoJoinTime ?? data[15] ?? 0n),
    daoEndTime: Number(data.daoEndTime ?? data[16] ?? 0n),
  };
}

export async function getUserStakes(address) {
  const contract = getStakingContract(readProvider);
  const stakes = await contract.getUserStakes(address);
  return stakes.map((s, index) => ({
    index,
    packageId: Number(s.packageId ?? s[0] ?? 0n),
    amount: ethers.formatEther(s.amount ?? s[1] ?? 0n),
    startTime: Number(s.startTime ?? s[3] ?? 0n),
    lastClaimTime: Number(s.lastClaimTime ?? s[4] ?? 0n),
    totalClaimed: ethers.formatEther(s.totalClaimed ?? s[5] ?? 0n),
    cap: ethers.formatEther(s.cap ?? s[6] ?? 0n),
    active: Boolean(s.active ?? s[7]),
  }));
}

export async function getPendingROI(address, stakeIndex) {
  const contract = getStakingContract(readProvider);
  const pending = await contract.pendingROI(address, stakeIndex);
  return ethers.formatEther(pending);
}

const unsupportedViewCache = new Set();

async function callOptionalUint256(contractAddress, signature) {
  const cacheKey = `${contractAddress.toLowerCase()}:${signature}`;
  if (unsupportedViewCache.has(cacheKey)) return null;

  try {
    const selector = ethers.id(signature).slice(0, 10);
    const raw = await readProvider.call({ to: contractAddress, data: selector });
    if (!raw || raw === "0x") {
      unsupportedViewCache.add(cacheKey);
      return null;
    }
    return BigInt(raw);
  } catch (err) {
    if (err?.code === "CALL_EXCEPTION") {
      unsupportedViewCache.add(cacheKey);
    }
    return null;
  }
}

export async function getPackageInfo(packageId) {
  const contract = getStakingContract(readProvider);
  const pkg = await contract.packages(packageId);
  return {
    name: pkg.name ?? pkg[0] ?? `Package #${packageId}`,
    minAmount: ethers.formatEther(pkg.minAmount ?? pkg[1] ?? 0n),
    dailyRateBps: Number(pkg.dailyRateBps ?? pkg[2] ?? 0n),
    capMultiplier: Number(pkg.capMultiplier ?? pkg[3] ?? 0n),
    canOpenLevels: Boolean(pkg.canOpenLevels ?? pkg[4]),
    isDAO: Boolean(pkg.isDAO ?? pkg[5]),
    active: Boolean(pkg.active ?? pkg[6]),
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
  const count = await callOptionalUint256(
    CONTRACTS.stakingContract,
    "daoMemberCount()"
  );
  return count !== null ? Number(count) : null;
}

export async function getMaxDaoMembers() {
  const contract = getStakingContract(readProvider);
  const max = await contract.MAX_DAO_MEMBERS();
  return Number(max);
}

export async function getWithdrawalConfig() {
  const contract = getStakingContract(readProvider);
  const [adminFeeBps, swapFeeBps, ecosystemFeeBps, coolingPeriod, maxWithdrawalRaw] =
    await Promise.all([
      contract.adminFeeBps(),
      contract.swapFeeBps(),
      contract.ecosystemFeeBps(),
      contract.coolingPeriod(),
      callOptionalUint256(CONTRACTS.stakingContract, "maxWithdrawalPerDay()"),
    ]);

  return {
    adminFeeBps: Number(adminFeeBps),
    swapFeeBps: Number(swapFeeBps),
    ecosystemFeeBps: Number(ecosystemFeeBps),
    maxWithdrawalPerDay:
      maxWithdrawalRaw !== null ? ethers.formatEther(maxWithdrawalRaw) : null,
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
