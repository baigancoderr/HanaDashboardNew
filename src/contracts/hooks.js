import { useState, useEffect, useCallback } from "react";
import {
  useAppKitAccount,
  useAppKitNetwork,
  useAppKitProvider,
} from "@reown/appkit/react";
import { bscTestnet } from "@reown/appkit/networks";
import {
  Contract,
  BrowserProvider,
  Interface,
  parseEther,
  formatEther,
  isAddress,
  getAddress,
} from "ethers";
import {
  BSC_TESTNET_CHAIN_ID,
  CONTRACT_ADDRESSES,
  ZERO_ADDRESS,
  getReadOnlyProvider,
  CONTRACT_START_BLOCK,
  DEFAULT_PACKAGES,
  getExplorerTxUrl,
  getExplorerAddressUrl,
} from "./config";
import { HANA_STAKING_ABI, ERC20_ABI, HANA_TOKEN_ABI } from "./abis";
import {
  dummyRegistrationStorageKey,
  referralStorageKey,
} from "../dashboard/referralStorage";

/**
 * Check if a wallet is registered on the Staking Contract
 */
export function useIsRegistered(address) {
  const [onChainRegistered, setOnChainRegistered] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);

  const isAddrValid = Boolean(address && isAddress(address));
  const normalizedAddr = isAddrValid ? getAddress(address) : null;

  const localRegistered =
    typeof window !== "undefined" && normalizedAddr
      ? localStorage.getItem(dummyRegistrationStorageKey(normalizedAddr)) ===
        "true"
      : false;

  const fetchStatus = useCallback(async () => {
    if (!normalizedAddr) {
      setOnChainRegistered(false);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setIsError(false);

    try {
      const provider = getReadOnlyProvider();
      const staking = new Contract(
        CONTRACT_ADDRESSES.stakingContract,
        HANA_STAKING_ABI,
        provider
      );
      const registered = await staking.isRegistered(normalizedAddr);
      setOnChainRegistered(Boolean(registered));
    } catch (err) {
      console.warn("Could not check on-chain registration:", err);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }, [normalizedAddr]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const isRegistered = Boolean(onChainRegistered || localRegistered);

  return {
    isRegistered,
    onChainRegistered,
    isLoading,
    isError,
    refetch: fetchStatus,
  };
}

/**
 * Read detailed user info from the contract
 */
export function useUserData(address) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const isAddrValid = Boolean(address && isAddress(address));
  const normalizedAddr = isAddrValid ? getAddress(address) : null;

  const fetchData = useCallback(async () => {
    if (!normalizedAddr) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const provider = getReadOnlyProvider();
      const staking = new Contract(
        CONTRACT_ADDRESSES.stakingContract,
        HANA_STAKING_ABI,
        provider
      );
      const [data, openLevelsRaw] = await Promise.all([
        staking.users(normalizedAddr),
        staking.getOpenLevels(normalizedAddr).catch(() => 0n),
      ]);

      setUser({
        referrer: data[0],
        totalStaked: data[1],
        totalStakedFormatted: formatEther(data[1] || 0n),
        totalROIClaimed: data[2],
        totalROIClaimedFormatted: formatEther(data[2] || 0n),
        totalDirect: data[3],
        totalDirectFormatted: formatEther(data[3] || 0n),
        totalLevel: data[4],
        totalLevelFormatted: formatEther(data[4] || 0n),
        totalRank: data[5],
        totalRankFormatted: formatEther(data[5] || 0n),
        totalDAO: data[6],
        totalDAOFormatted: formatEther(data[6] || 0n),
        hanaBalance: data[7],
        hanaBalanceFormatted: formatEther(data[7] || 0n),
        totalWithdrawnHana: data[8],
        totalWithdrawnHanaFormatted: formatEther(data[8] || 0n),
        firstStakeTime: Number(data[9] || 0n),
        lastWithdrawalTime: Number(data[10] || 0n),
        validDirects: Number(data[11] || 0n),
        extraOpenLevels: Number(data[12] || 0n),
        openLevels: Number(openLevelsRaw || 0n),
        isLeader: Boolean(data[13]),
        isDAO: Boolean(data[14]),
        daoJoinTime: Number(data[15] || 0n),
        daoEndTime: Number(data[16] || 0n),
      });
    } catch (err) {
      console.warn("Could not fetch user contract data:", err);
    } finally {
      setIsLoading(false);
    }
  }, [normalizedAddr]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { user, isLoading, refetch: fetchData };
}

// Shared in-memory caches to avoid redundant RPC calls across hooks
const blockCache = new Map();
const txSenderCache = new Map();
// txHash → { staker: address, stakeAmount: BigInt } for direct income enrichment
const txStakeCache = new Map();

/**
 * Query a block range with automatic halving fallback if an RPC rejects large ranges
 */
async function queryFilterRange(contract, filter, start, end, minSpan = 5000) {
  try {
    return await contract.queryFilter(filter, start, end);
  } catch (err) {
    const span = end - start;
    if (span > minSpan) {
      const mid = start + Math.floor(span / 2);
      const [left, right] = await Promise.all([
        queryFilterRange(contract, filter, start, mid, minSpan),
        queryFilterRange(contract, filter, mid + 1, end, minSpan),
      ]);
      return [...left, ...right];
    }
    console.warn(`Query logs chunk [${start} - ${end}] failed:`, err);
    return [];
  }
}

/**
 * Safely query contract logs in bounded chunks to prevent RPC batch/range rate limits
 */
async function fetchLogsInChunks(
  contract,
  filter,
  fromBlock,
  toBlock,
  chunkSize = 49999
) {
  const firstBlock = Math.max(0, fromBlock);
  const lastBlock = Math.max(0, toBlock);
  if (lastBlock < firstBlock) return [];

  const ranges = [];
  for (let start = firstBlock; start <= lastBlock; start += chunkSize + 1) {
    ranges.push([start, Math.min(start + chunkSize, lastBlock)]);
  }

  const allEvents = [];
  const concurrency = 6;
  for (let index = 0; index < ranges.length; index += concurrency) {
    const batch = await Promise.all(
      ranges
        .slice(index, index + concurrency)
        .map(([start, end]) => queryFilterRange(contract, filter, start, end)),
    );
    allEvents.push(...batch.flat());
  }

  return allEvents;
}

async function populateBlockTimestamps(provider, events) {
  const blockNumbers = [...new Set(events.map((e) => e.blockNumber))];
  await Promise.all(
    blockNumbers.map(async (bNum) => {
      if (!blockCache.has(bNum)) {
        try {
          const b = await provider.getBlock(bNum);
          if (b?.timestamp) {
            blockCache.set(bNum, Number(b.timestamp));
          }
        } catch (err) {
          console.warn("Could not fetch block timestamp:", err);
        }
      }
    }),
  );
}

async function populateTxSenders(provider, events) {
  const txHashes = [...new Set(events.map((e) => e.transactionHash))];
  await Promise.all(
    txHashes.map(async (hash) => {
      if (!txSenderCache.has(hash)) {
        try {
          const tx = await provider.getTransaction(hash);
          if (tx?.from) {
            txSenderCache.set(hash, tx.from);
          }
        } catch (err) {
          console.warn("Could not fetch tx sender:", err);
        }
      }
    }),
  );
}

function formatEventDate(timestamp, blockNumber) {
  return timestamp
    ? new Date(timestamp * 1000).toLocaleString("en-US", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : `Block #${blockNumber}`;
}

/**
 * Read user's active stakes array from Staking contract
 */
export function useUserStakes(address) {
  const [stakes, setStakes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const isAddrValid = Boolean(address && isAddress(address));
  const normalizedAddr = isAddrValid ? getAddress(address) : null;

  const fetchStakes = useCallback(async () => {
    if (!normalizedAddr) {
      setStakes([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const provider = getReadOnlyProvider();
      const staking = new Contract(
        CONTRACT_ADDRESSES.stakingContract,
        HANA_STAKING_ABI,
        provider
      );

      // Query block number safely
      const currentBlock = await provider.getBlockNumber().catch(() => 0);
      const fromBlock = Math.max(0, CONTRACT_START_BLOCK);
      const toBlock = currentBlock > 0 ? currentBlock : fromBlock + 50000;

      // 1. Fetch on-chain Staked events to match tx hashes and for fallback
      const stakedEvents = await fetchLogsInChunks(
        staking,
        staking.filters.Staked(normalizedAddr),
        fromBlock,
        toBlock
      ).catch(() => []);

      const txMap = new Map();
      stakedEvents.forEach((ev) => {
        const idx = Number(ev.args?.[3] ?? ev.args?.stakeIndex ?? 0);
        txMap.set(idx, ev.transactionHash);
      });

      // 2. Attempt contract getUserStakes view call
      let rawStakes = [];
      try {
        rawStakes = await staking.getUserStakes(normalizedAddr);
      } catch (err) {
        console.warn("getUserStakes contract call failed, checking event fallback:", err);
      }

      let parsed = [];

      if (rawStakes && rawStakes.length > 0) {
        parsed = rawStakes.map((st, index) => {
          const txHash = txMap.get(index) || null;
          const packageId = Number(st.packageId ?? st[0] ?? 0);
          const amount = st.amount ?? st[1] ?? 0n;
          const pkg =
            DEFAULT_PACKAGES.find((p) => p.id === packageId) ||
            DEFAULT_PACKAGES[0];

          let startTime, lastClaimTime, totalClaimed, cap, active, roiBaseAmount;
          if (st.roiBaseAmount !== undefined) {
            roiBaseAmount = st.roiBaseAmount;
            startTime = Number(st.startTime ?? st[3] ?? 0);
            lastClaimTime = Number(st.lastClaimTime ?? st[4] ?? 0);
            totalClaimed = st.totalClaimed ?? st[5] ?? 0n;
            cap = st.cap ?? st[6] ?? 0n;
            active = Boolean(st.active ?? st[7]);
          } else if (st[7] !== undefined) {
            roiBaseAmount = st[2] ?? 0n;
            startTime = Number(st[3] ?? 0);
            lastClaimTime = Number(st[4] ?? 0);
            totalClaimed = st[5] ?? 0n;
            cap = st[6] ?? 0n;
            active = Boolean(st[7]);
          } else {
            roiBaseAmount = amount;
            startTime = Number(st.startTime ?? st[2] ?? 0);
            lastClaimTime = Number(st.lastClaimTime ?? st[3] ?? 0);
            totalClaimed = st.totalClaimed ?? st[4] ?? 0n;
            cap = st.cap ?? st[5] ?? (amount * BigInt(pkg.capMultiplier || 2));
            active =
              st.active !== undefined
                ? Boolean(st.active)
                : st[6] !== undefined
                ? Boolean(st[6])
                : true;
          }

          return {
            stakeIndex: index,
            packageId,
            packageName: pkg.name,
            dailyRate: pkg.dailyRate,
            amount,
            amountFormatted: formatEther(amount),
            amountNumber: Number(formatEther(amount)),
            roiBaseAmount,
            roiBaseAmountFormatted: formatEther(roiBaseAmount || 0n),
            startTime,
            lastClaimTime,
            totalClaimed,
            totalClaimedFormatted: formatEther(totalClaimed || 0n),
            cap,
            capFormatted: formatEther(cap || 0n),
            active,
            txHash,
            explorerUrl: txHash ? getExplorerTxUrl(txHash) : null,
          };
        });
      }

      // If getUserStakes returned empty but verified Staked events exist for this wallet, reconstruct from logs!
      if ((!parsed || parsed.length === 0) && stakedEvents && stakedEvents.length > 0) {
        parsed = stakedEvents.map((ev, index) => {
          const stakeIndex = Number(ev.args?.[3] ?? ev.args?.stakeIndex ?? index);
          const packageId = Number(ev.args?.[1] ?? ev.args?.packageId ?? 0);
          const amount = ev.args?.[2] ?? ev.args?.amount ?? 0n;
          const pkg =
            DEFAULT_PACKAGES.find((p) => p.id === packageId) ||
            DEFAULT_PACKAGES[0];
          const cap = amount * BigInt(pkg.capMultiplier || 2);

          return {
            stakeIndex,
            packageId,
            packageName: pkg.name,
            dailyRate: pkg.dailyRate,
            amount,
            amountFormatted: formatEther(amount),
            amountNumber: Number(formatEther(amount)),
            roiBaseAmount: amount,
            roiBaseAmountFormatted: formatEther(amount),
            startTime: 0,
            lastClaimTime: 0,
            totalClaimed: 0n,
            totalClaimedFormatted: "0.00",
            cap,
            capFormatted: formatEther(cap),
            active: true,
            txHash: ev.transactionHash,
            explorerUrl: getExplorerTxUrl(ev.transactionHash),
          };
        });
      }

      setStakes(parsed);
    } catch (err) {
      console.warn("Could not fetch user stakes:", err);
    } finally {
      setIsLoading(false);
    }
  }, [normalizedAddr]);

  useEffect(() => {
    fetchStakes();
  }, [fetchStakes]);

  return { stakes, isLoading, refetch: fetchStakes };
}

/**
 * Read USDT balance of an address
 */
export function useUsdtBalance(address) {
  const [balance, setBalance] = useState(0n);
  const [isLoading, setIsLoading] = useState(false);

  const isAddrValid = Boolean(address && isAddress(address));
  const normalizedAddr = isAddrValid ? getAddress(address) : null;

  const fetchBalance = useCallback(async () => {
    if (!normalizedAddr) {
      setBalance(0n);
      return;
    }
    setIsLoading(true);
    try {
      const provider = getReadOnlyProvider();
      const usdt = new Contract(
        CONTRACT_ADDRESSES.usdtToken,
        ERC20_ABI,
        provider
      );
      const b = await usdt.balanceOf(normalizedAddr);
      setBalance(b);
    } catch (err) {
      console.warn("Could not fetch USDT balance:", err);
    } finally {
      setIsLoading(false);
    }
  }, [normalizedAddr]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  const balanceFormatted = Number(formatEther(balance)).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return {
    balance,
    balanceFormatted,
    rawBalanceNumber: Number(formatEther(balance)),
    isLoading,
    refetch: fetchBalance,
  };
}

/**
 * Read HANA token balance of an address
 */
export function useHanaBalance(address) {
  const [balance, setBalance] = useState(0n);
  const [isLoading, setIsLoading] = useState(false);

  const isAddrValid = Boolean(address && isAddress(address));
  const normalizedAddr = isAddrValid ? getAddress(address) : null;

  const fetchBalance = useCallback(async () => {
    if (!normalizedAddr) {
      setBalance(0n);
      return;
    }
    setIsLoading(true);
    try {
      const provider = getReadOnlyProvider();
      const hana = new Contract(
        CONTRACT_ADDRESSES.hanaToken,
        HANA_TOKEN_ABI,
        provider
      );
      const b = await hana.balanceOf(normalizedAddr);
      setBalance(b);
    } catch (err) {
      console.warn("Could not fetch HANA balance:", err);
    } finally {
      setIsLoading(false);
    }
  }, [normalizedAddr]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  const balanceFormatted = Number(formatEther(balance)).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return {
    balance,
    balanceFormatted,
    rawBalanceNumber: Number(formatEther(balance)),
    isLoading,
    refetch: fetchBalance,
  };
}

/**
 * Read pending ROI for a stake
 */
export function usePendingROI(address, stakeIndex) {
  const [pending, setPending] = useState(0n);
  const [isLoading, setIsLoading] = useState(false);

  const isAddrValid = Boolean(address && isAddress(address));
  const normalizedAddr = isAddrValid ? getAddress(address) : null;

  const fetchPending = useCallback(async () => {
    if (!normalizedAddr || stakeIndex === undefined) return;
    setIsLoading(true);
    try {
      const provider = getReadOnlyProvider();
      const staking = new Contract(
        CONTRACT_ADDRESSES.stakingContract,
        HANA_STAKING_ABI,
        provider
      );
      const p = await staking.pendingROI(normalizedAddr, BigInt(stakeIndex));
      setPending(p);
    } catch (err) {
      console.warn("Could not fetch pending ROI:", err);
    } finally {
      setIsLoading(false);
    }
  }, [normalizedAddr, stakeIndex]);

  useEffect(() => {
    fetchPending();
  }, [fetchPending]);

  const pendingFormatted = Number(formatEther(pending)).toFixed(4);

  return { pending, pendingFormatted, isLoading, refetch: fetchPending };
}

/**
 * Registration write hook with Ethers v6
 */
export function useRegisterWallet() {
  const [step, setStep] = useState("idle"); // idle | checking | submitting | confirming | success | error
  const [error, setError] = useState("");
  const [txHash, setTxHash] = useState(null);

  const { chainId, switchNetwork } = useAppKitNetwork();
  const { walletProvider } = useAppKitProvider("eip155");

  const register = useCallback(
    async (userAddress, referrerAddress) => {
      setError("");
      setStep("checking");

      try {
        if (!userAddress || !isAddress(userAddress)) {
          throw new Error("Please connect a valid wallet first.");
        }

        if (!walletProvider) {
          throw new Error("No wallet provider detected. Please reconnect your wallet.");
        }

        // Switch to BSC testnet if needed
        const currentChainId = Number(chainId);
        if (currentChainId !== BSC_TESTNET_CHAIN_ID && switchNetwork) {
          try {
            await switchNetwork(bscTestnet);
          } catch {
            throw new Error(
              "Please switch your wallet network to BNB Smart Chain Testnet (Chain ID 97)."
            );
          }
        }

        let finalReferrer = ZERO_ADDRESS;
        const readProvider = getReadOnlyProvider();
        const stakingRead = new Contract(
          CONTRACT_ADDRESSES.stakingContract,
          HANA_STAKING_ABI,
          readProvider
        );

        if (referrerAddress && referrerAddress.trim() !== "") {
          const clean = referrerAddress.trim();
          if (!isAddress(clean)) {
            throw new Error("Invalid referral EVM wallet address.");
          }
          finalReferrer = getAddress(clean);

          if (finalReferrer.toLowerCase() === userAddress.toLowerCase()) {
            throw new Error("You cannot refer yourself.");
          }

          // Check if referrer is registered on-chain
          const isRefRegistered = await stakingRead.isRegistered(finalReferrer);

          if (!isRefRegistered) {
            throw new Error(
              "Referrer wallet address is not registered in the staking contract."
            );
          }
        } else {
          if (finalReferrer.toLowerCase() === userAddress.toLowerCase()) {
            finalReferrer = "0x0000000000000000000000000000000000000000";
          } else if (finalReferrer !== "0x0000000000000000000000000000000000000000") {
            try {
              const isDefaultReg = await stakingRead.isRegistered(finalReferrer);
              if (!isDefaultReg) {
                finalReferrer = "0x0000000000000000000000000000000000000000";
              }
            } catch {
              finalReferrer = "0x0000000000000000000000000000000000000000";
            }
          }
        }

        setStep("submitting");

        const browserProvider = new BrowserProvider(walletProvider);
        const signer = await browserProvider.getSigner();

        const stakingContract = new Contract(
          CONTRACT_ADDRESSES.stakingContract,
          HANA_STAKING_ABI,
          signer
        );

        const tx = await stakingContract.register(finalReferrer);
        setTxHash(tx.hash);
        setStep("confirming");

        await tx.wait(1);

        // Save local state for instant responsiveness
        localStorage.setItem(
          dummyRegistrationStorageKey(userAddress),
          "true"
        );
        if (finalReferrer !== ZERO_ADDRESS) {
          localStorage.setItem(
            referralStorageKey(userAddress),
            finalReferrer
          );
        }

        setStep("success");
        return { success: true, hash: tx.hash };
      } catch (err) {
        console.error("Registration error:", err);
        const msg =
          err?.reason ||
          err?.shortMessage ||
          err?.message ||
          "Failed to register on smart contract.";
        setError(msg);
        setStep("error");
        throw new Error(msg);
      }
    },
    [chainId, switchNetwork, walletProvider]
  );

  return { register, step, error, txHash, reset: () => setStep("idle") };
}

/**
 * Staking write hook (handles USDT approval + stake call with Ethers v6)
 */
export function useStakeTokens() {
  const [step, setStep] = useState("idle"); // idle | checking | approving | approved | staking | confirming | success | error
  const [error, setError] = useState("");
  const [txHash, setTxHash] = useState(null);

  const { chainId, switchNetwork } = useAppKitNetwork();
  const { walletProvider } = useAppKitProvider("eip155");

  const stake = useCallback(
    async (userAddress, packageId, amountUsdt) => {
      setError("");
      setStep("checking");

      try {
        if (!userAddress || !isAddress(userAddress)) {
          throw new Error("Please connect your wallet first.");
        }

        if (!walletProvider) {
          throw new Error("No wallet provider detected. Please reconnect your wallet.");
        }

        const currentChainId = Number(chainId);
        if (currentChainId !== BSC_TESTNET_CHAIN_ID && switchNetwork) {
          try {
            await switchNetwork(bscTestnet);
          } catch {
            throw new Error(
              "Please switch your wallet to BNB Smart Chain Testnet (Chain ID 97)."
            );
          }
        }

        const browserProvider = new BrowserProvider(walletProvider);
        const signer = await browserProvider.getSigner();
        const amountWei = parseEther(amountUsdt.toString());

        const usdt = new Contract(
          CONTRACT_ADDRESSES.usdtToken,
          ERC20_ABI,
          signer
        );

        // Check balance
        const balance = await usdt.balanceOf(getAddress(userAddress));
        if (balance < amountWei) {
          throw new Error(
            `Insufficient USDT balance. You have ${formatEther(
              balance
            )} USDT but need ${amountUsdt} USDT.`
          );
        }

        // Check allowance
        const allowance = await usdt.allowance(
          getAddress(userAddress),
          CONTRACT_ADDRESSES.stakingContract
        );

        if (allowance < amountWei) {
          setStep("approving");
          const approveTx = await usdt.approve(
            CONTRACT_ADDRESSES.stakingContract,
            amountWei
          );
          await approveTx.wait(1);
          setStep("approved");
        }

        // Execute stake
        setStep("staking");
        const staking = new Contract(
          CONTRACT_ADDRESSES.stakingContract,
          HANA_STAKING_ABI,
          signer
        );

        const stakeTx = await staking.stake(BigInt(packageId), amountWei);
        setTxHash(stakeTx.hash);
        setStep("confirming");

        await stakeTx.wait(1);

        setStep("success");
        return { success: true, hash: stakeTx.hash };
      } catch (err) {
        console.error("Staking error:", err);
        const msg =
          err?.reason ||
          err?.shortMessage ||
          err?.message ||
          "Failed to stake USDT into the contract.";
        setError(msg);
        setStep("error");
        throw new Error(msg);
      }
    },
    [chainId, switchNetwork, walletProvider]
  );

  return { stake, step, error, txHash, reset: () => setStep("idle") };
}

/**
 * Claim ROI hook with Ethers v6
 */
export function useClaimStakeROI() {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState("");
  const { walletProvider } = useAppKitProvider("eip155");

  const claim = useCallback(
    async (stakeIndex) => {
      setIsPending(true);
      setError("");

      try {
        if (!walletProvider) {
          throw new Error("No wallet provider detected. Please reconnect.");
        }

        const browserProvider = new BrowserProvider(walletProvider);
        const signer = await browserProvider.getSigner();

        const staking = new Contract(
          CONTRACT_ADDRESSES.stakingContract,
          HANA_STAKING_ABI,
          signer
        );

        const tx = await staking.claimROI(BigInt(stakeIndex));
        await tx.wait(1);

        setIsPending(false);
        return { success: true, hash: tx.hash };
      } catch (err) {
        console.error("Claim error:", err);
        const msg =
          err?.reason || err?.shortMessage || err?.message || "Failed to claim ROI.";
        setError(msg);
        setIsPending(false);
        throw new Error(msg);
      }
    },
    [walletProvider]
  );

  return { claim, isPending, error };
}

/**
 * Withdraw HANA credited to a user's staking-contract balance
 */
export function useWithdrawHanaTokens() {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState("");
  const { chainId, switchNetwork } = useAppKitNetwork();
  const { walletProvider } = useAppKitProvider("eip155");

  const withdraw = useCallback(
    async (userAddress, amount) => {
      setIsPending(true);
      setError("");

      try {
        if (!userAddress || !isAddress(userAddress)) {
          throw new Error("Please connect a valid wallet first.");
        }
        if (!walletProvider) {
          throw new Error("No wallet provider detected. Please reconnect.");
        }

        if (Number(chainId) !== BSC_TESTNET_CHAIN_ID) {
          if (!switchNetwork) {
            throw new Error("Please switch your wallet to BNB Smart Chain Testnet.");
          }
          try {
            await switchNetwork(bscTestnet);
          } catch {
            throw new Error(
              "Please switch your wallet to BNB Smart Chain Testnet (Chain ID 97)."
            );
          }
        }

        const amountWei = parseEther(String(amount).trim());
        if (amountWei <= 0n) {
          throw new Error("Enter a HANA amount greater than zero.");
        }

        const normalizedAddress = getAddress(userAddress);
        const browserProvider = new BrowserProvider(walletProvider);
        const network = await browserProvider.getNetwork();
        if (network.chainId !== BigInt(BSC_TESTNET_CHAIN_ID)) {
          throw new Error(
            "Wallet is not connected to BNB Smart Chain Testnet (Chain ID 97)."
          );
        }
        const signer = await browserProvider.getSigner();
        const signerAddress = await signer.getAddress();
        if (signerAddress.toLowerCase() !== normalizedAddress.toLowerCase()) {
          throw new Error("Connected wallet changed. Please refresh and try again.");
        }

        const staking = new Contract(
          CONTRACT_ADDRESSES.stakingContract,
          HANA_STAKING_ABI,
          signer
        );
        const userData = await staking.users(normalizedAddress);
        const availableHana = userData.hanaBalance ?? userData[7] ?? 0n;
        if (amountWei > availableHana) {
          throw new Error(
            `Insufficient withdrawable HANA. Available: ${formatEther(availableHana)} HANA.`
          );
        }

        const tx = await staking.withdrawTokens(amountWei);
        await tx.wait(1);
        return { success: true, hash: tx.hash };
      } catch (err) {
        console.error("HANA withdrawal error:", err);
        const message =
          err?.reason ||
          err?.shortMessage ||
          err?.message ||
          "Failed to withdraw HANA.";
        setError(message);
        throw new Error(message);
      } finally {
        setIsPending(false);
      }
    },
    [chainId, switchNetwork, walletProvider]
  );

  return { withdraw, isPending, error };
}

/**
 * Read on-chain Staking history from Staked events with transaction hashes
 */
export function useStakingHistory(address) {
  const [stakingHistory, setStakingHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const isAddrValid = Boolean(address && isAddress(address));
  const normalizedAddr = isAddrValid ? getAddress(address) : null;

  const fetchHistory = useCallback(async () => {
    if (!normalizedAddr) {
      setStakingHistory([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const provider = getReadOnlyProvider();
      const staking = new Contract(
        CONTRACT_ADDRESSES.stakingContract,
        HANA_STAKING_ABI,
        provider
      );

      const currentBlock = await provider.getBlockNumber();
      const fromBlock = Math.max(0, CONTRACT_START_BLOCK);

      const filter = staking.filters.Staked(normalizedAddr);
      const events = await fetchLogsInChunks(
        staking,
        filter,
        fromBlock,
        currentBlock
      );

      // Fetch block timestamps in parallel (cached)
      const blockNumbers = [...new Set(events.map((e) => e.blockNumber))];
      await Promise.all(
        blockNumbers.map(async (bNum) => {
          if (!blockCache.has(bNum)) {
            try {
              const b = await provider.getBlock(bNum);
              if (b?.timestamp) {
                blockCache.set(bNum, Number(b.timestamp));
              }
            } catch (err) {
              console.warn("Could not fetch block timestamp:", err);
            }
          }
        })
      );

      const parsed = events.map((event) => {
        const packageId = Number(event.args?.[1] ?? event.args?.packageId ?? 0);
        const amountWei = event.args?.[2] ?? event.args?.amount ?? 0n;
        const stakeIndex = Number(event.args?.[3] ?? event.args?.stakeIndex ?? 0);
        const pkg =
          DEFAULT_PACKAGES.find((p) => p.id === packageId) || {
            name: `Package #${packageId}`,
            dailyRate: "0%",
          };
        const timestamp = blockCache.get(event.blockNumber) || null;

        return {
          stakeIndex,
          stakeDisplayId: `#S-${stakeIndex + 1}`,
          packageId,
          packageName: pkg.name,
          dailyRate: pkg.dailyRate,
          amount: amountWei,
          amountFormatted: formatEther(amountWei),
          amountNumber: Number(formatEther(amountWei)),
          txHash: event.transactionHash,
          txShort: `${event.transactionHash.slice(0, 8)}...${event.transactionHash.slice(-6)}`,
          blockNumber: event.blockNumber,
          explorerUrl: getExplorerTxUrl(event.transactionHash),
          timestamp,
          dateFormatted: timestamp
            ? new Date(timestamp * 1000).toLocaleString("en-US", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })
            : `Block #${event.blockNumber}`,
        };
      });

      // Sort newest stakes first
      parsed.sort((a, b) => b.stakeIndex - a.stakeIndex);
      setStakingHistory(parsed);
    } catch (err) {
      console.warn("Could not fetch staking history events:", err);
    } finally {
      setIsLoading(false);
    }
  }, [normalizedAddr]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return { stakingHistory, isLoading, refetch: fetchHistory };
}

/**
 * Read on-chain Referral history:
 * 1. Direct referral rewards from IncomeAllotted (where incomeType == 'direct')
 * 2. Registered direct referrals from Registered (where referrer == address)
 */
export function useReferralHistory(address, { includeRegistrations = true } = {}) {
  const [directIncomeHistory, setDirectIncomeHistory] = useState([]);
  const [registeredReferrals, setRegisteredReferrals] = useState([]);
  const [totalDirectEarnedUsdt, setTotalDirectEarnedUsdt] = useState(0);
  const [totalDirectEarnedHana, setTotalDirectEarnedHana] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const isAddrValid = Boolean(address && isAddress(address));
  const normalizedAddr = isAddrValid ? getAddress(address) : null;

  const fetchReferralData = useCallback(async () => {
    if (!normalizedAddr) {
      setDirectIncomeHistory([]);
      setRegisteredReferrals([]);
      setTotalDirectEarnedUsdt(0);
      setTotalDirectEarnedHana(0);
      setError("");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError("");
    try {
      const provider = getReadOnlyProvider();
      const staking = new Contract(
        CONTRACT_ADDRESSES.stakingContract,
        HANA_STAKING_ABI,
        provider
      );

      const currentBlock = await provider.getBlockNumber();
      const fromBlock = Math.max(0, CONTRACT_START_BLOCK);

      // 1. Fetch IncomeAllotted where user is normalizedAddr
      const incomeFilter = staking.filters.IncomeAllotted(normalizedAddr);
      // 2. Fetch Registered where referrer is normalizedAddr
      const regFilter = staking.filters.Registered(null, normalizedAddr);

      const [incomeEvents, regEvents] = await Promise.all([
        fetchLogsInChunks(staking, incomeFilter, fromBlock, currentBlock).catch(() => []),
        includeRegistrations
          ? fetchLogsInChunks(staking, regFilter, fromBlock, currentBlock).catch(() => [])
          : Promise.resolve([]),
      ]);

      // Cache block timestamps & tx senders
      const allEvents = [...incomeEvents, ...regEvents];
      const blockNumbers = [...new Set(allEvents.map((e) => e.blockNumber))];
      await Promise.all(
        blockNumbers.map(async (bNum) => {
          if (!blockCache.has(bNum)) {
            try {
              const b = await provider.getBlock(bNum);
              if (b?.timestamp) {
                blockCache.set(bNum, Number(b.timestamp));
              }
            } catch (err) {
              console.warn("Could not fetch block timestamp:", err);
            }
          }
        })
      );

      // For direct income events, fetch the transaction sender (the staker who generated commission)
      // Also fetch Staked events from same tx hashes to get stake amount
      const txHashes = [...new Set(incomeEvents.map((e) => e.transactionHash))];

      // Fetch tx receipts to get staker address + Staked event logs (for stake amount)
      await Promise.all(
        txHashes.map(async (hash) => {
          const needSender = !txSenderCache.has(hash);
          const needStake  = !txStakeCache.has(hash);
          if (!needSender && !needStake) return;
          try {
            const [tx, receipt] = await Promise.all([
              needSender ? provider.getTransaction(hash) : Promise.resolve(null),
              needStake  ? provider.getTransactionReceipt(hash) : Promise.resolve(null),
            ]);
            if (tx?.from) txSenderCache.set(hash, tx.from);
            if (receipt) {
              // Parse Staked event logs from the receipt
              const stakedIface = new Interface(
                HANA_STAKING_ABI.filter((x) => x.name === "Staked")
              );
              for (const log of receipt.logs) {
                try {
                  const parsed = stakedIface.parseLog(log);
                  if (parsed?.name === "Staked") {
                    txStakeCache.set(hash, {
                      staker:      parsed.args[0],
                      stakeAmount: parsed.args[2], // BigInt wei
                      packageId:   Number(parsed.args[1]),
                      stakeIndex:  Number(parsed.args[3]),
                    });
                    break;
                  }
                } catch {}
              }
            }
          } catch (err) {
            console.warn("Could not fetch tx details:", err);
          }
        })
      );

      // Parse IncomeAllotted events
      let sumUsdt = 0;
      let sumHana = 0;
      const parsedIncome = incomeEvents
        .filter((e) => {
          const type = (e.args?.[3] ?? e.args?.incomeType ?? "").toString().toLowerCase();
          return type === "direct";
        })
        .map((e) => {
          const usdtWei = e.args?.[1] ?? e.args?.usdtValue ?? 0n;
          const hanaWei = e.args?.[2] ?? e.args?.hanaAllotted ?? 0n;
          const usdtNum = Number(formatEther(usdtWei));
          const hanaNum = Number(formatEther(hanaWei));
          sumUsdt += usdtNum;
          sumHana += hanaNum;

          const timestamp = blockCache.get(e.blockNumber) || null;
          const stakerAddress = txSenderCache.get(e.transactionHash) || null;
          const stakeInfo    = txStakeCache.get(e.transactionHash) || null;
          const stakeAmountNum = stakeInfo ? Number(formatEther(stakeInfo.stakeAmount)) : null;
          const pkg = stakeInfo ? DEFAULT_PACKAGES.find((p) => p.id === stakeInfo.packageId) : null;

          return {
            type: "direct",
            usdtValue: usdtWei,
            usdtFormatted: usdtNum.toFixed(2),
            usdtNumber: usdtNum,
            hanaAllotted: hanaWei,
            hanaFormatted: hanaNum.toFixed(2),
            hanaNumber: hanaNum,
            stakerAddress,
            stakerShort: stakerAddress
              ? `${stakerAddress.slice(0, 6)}...${stakerAddress.slice(-4)}`
              : "Referred Member",
            stakerExplorerUrl: stakerAddress ? getExplorerAddressUrl(stakerAddress) : null,
            // Stake details that generated this direct income
            stakeAmount: stakeInfo?.stakeAmount ?? null,
            stakeAmountFormatted: stakeAmountNum !== null ? stakeAmountNum.toFixed(2) : null,
            stakePackageId: stakeInfo?.packageId ?? null,
            stakePackageName: pkg?.name ?? null,
            stakeIndex: stakeInfo?.stakeIndex ?? null,
            txHash: e.transactionHash,
            txShort: `${e.transactionHash.slice(0, 8)}...${e.transactionHash.slice(-6)}`,
            blockNumber: e.blockNumber,
            explorerUrl: getExplorerTxUrl(e.transactionHash),
            timestamp,
            dateFormatted: timestamp
              ? new Date(timestamp * 1000).toLocaleString("en-US", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : `Block #${e.blockNumber}`,
          };
        });

      // Sort newest direct income first
      parsedIncome.sort((a, b) => b.blockNumber - a.blockNumber);
      setDirectIncomeHistory(parsedIncome);
      setTotalDirectEarnedUsdt(sumUsdt);
      setTotalDirectEarnedHana(sumHana);

      // Parse Registered events
      const parsedReg = regEvents.map((e) => {
        const userAddr = e.args?.[0] ?? e.args?.user;
        const timestamp = blockCache.get(e.blockNumber) || null;
        return {
          userAddress: userAddr,
          userShort: userAddr
            ? `${userAddr.slice(0, 6)}...${userAddr.slice(-4)}`
            : "Unknown",
          txHash: e.transactionHash,
          txShort: `${e.transactionHash.slice(0, 8)}...${e.transactionHash.slice(-6)}`,
          blockNumber: e.blockNumber,
          explorerUrl: getExplorerTxUrl(e.transactionHash),
          userExplorerUrl: userAddr ? getExplorerAddressUrl(userAddr) : null,
          timestamp,
          dateFormatted: timestamp
            ? new Date(timestamp * 1000).toLocaleString("en-US", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })
            : `Block #${e.blockNumber}`,
        };
      });

      parsedReg.sort((a, b) => b.blockNumber - a.blockNumber);
      setRegisteredReferrals(parsedReg);
    } catch (err) {
      console.warn("Could not fetch referral history:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Could not load referral income history.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [includeRegistrations, normalizedAddr]);

  useEffect(() => {
    fetchReferralData();
  }, [fetchReferralData]);

  return {
    directIncomeHistory,
    registeredReferrals,
    totalDirectEarnedUsdt,
    totalDirectEarnedHana,
    isLoading,
    error,
    refetch: fetchReferralData,
  };
}

export function useLevelIncomeHistory(address) {
  const [incomeHistory, setIncomeHistory] = useState([]);
  const [totalUsdt, setTotalUsdt] = useState(0);
  const [totalHana, setTotalHana] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const isAddrValid = Boolean(address && isAddress(address));
  const normalizedAddr = isAddrValid ? getAddress(address) : null;

  const fetchLevelIncomeHistory = useCallback(async () => {
    if (!normalizedAddr) {
      setIncomeHistory([]);
      setTotalUsdt(0);
      setTotalHana(0);
      setError("");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError("");
    try {
      const provider = getReadOnlyProvider();
      const staking = new Contract(
        CONTRACT_ADDRESSES.stakingContract,
        HANA_STAKING_ABI,
        provider,
      );
      const currentBlock = await provider.getBlockNumber();
      const fromBlock = Math.max(0, CONTRACT_START_BLOCK);
      const levelFilter = staking.filters.LevelIncomeAllotted(null, normalizedAddr);
      const incomeFilter = staking.filters.IncomeAllotted(normalizedAddr);

      const [levelEvents, incomeEvents] = await Promise.all([
        fetchLogsInChunks(staking, levelFilter, fromBlock, currentBlock),
        fetchLogsInChunks(staking, incomeFilter, fromBlock, currentBlock),
      ]);

      const levelTxSet = new Set(levelEvents.map((e) => e.transactionHash));
      const fallbackLevelIncomeEvents = incomeEvents.filter((event) => {
        const incomeType = (event.args?.[3] ?? event.args?.incomeType ?? "")
          .toString()
          .toLowerCase();
        return incomeType.includes("level") && !levelTxSet.has(event.transactionHash);
      });

      const relevantEvents = [...levelEvents, ...fallbackLevelIncomeEvents];
      await Promise.all([
        populateBlockTimestamps(provider, relevantEvents),
        populateTxSenders(provider, fallbackLevelIncomeEvents),
      ]);

      let sumUsdt = 0;
      let sumHana = 0;
      const buildLevelIncomeRow = ({ fromAddress, level, usdtWei, hanaWei, event }) => {
        const usdtNumber = Number(formatEther(usdtWei));
        const hanaNumber = Number(formatEther(hanaWei));
        const timestamp = blockCache.get(event.blockNumber) || null;
        sumUsdt += usdtNumber;
        sumHana += hanaNumber;

        return {
          fromAddress,
          fromShort: fromAddress
            ? `${fromAddress.slice(0, 6)}...${fromAddress.slice(-4)}`
            : "Network member",
          fromExplorerUrl: fromAddress
            ? getExplorerAddressUrl(fromAddress)
            : null,
          level,
          usdtNumber,
          hanaNumber,
          usdtFormatted: usdtNumber.toFixed(2),
          hanaFormatted: hanaNumber.toFixed(2),
          txHash: event.transactionHash,
          txShort: `${event.transactionHash.slice(0, 8)}...${event.transactionHash.slice(-6)}`,
          blockNumber: event.blockNumber,
          explorerUrl: getExplorerTxUrl(event.transactionHash),
          timestamp,
          dateFormatted: formatEventDate(timestamp, event.blockNumber),
        };
      };

      const parsedPrimary = levelEvents.map((event) =>
        buildLevelIncomeRow({
          fromAddress: event.args?.[0] ?? event.args?.from,
          level: Number(event.args?.[2] ?? event.args?.level ?? 0n),
          usdtWei: event.args?.[3] ?? event.args?.usdtValue ?? 0n,
          hanaWei: event.args?.[4] ?? event.args?.hanaAllotted ?? 0n,
          event,
        }),
      );

      const parsedFallback = fallbackLevelIncomeEvents.map((event) => {
        const incomeType = (event.args?.[3] ?? event.args?.incomeType ?? "").toString();
        const levelMatch = incomeType.match(/(\d+)/);
        return buildLevelIncomeRow({
          fromAddress: txSenderCache.get(event.transactionHash) || null,
          level: levelMatch ? Number(levelMatch[1]) : 0,
          usdtWei: event.args?.[1] ?? event.args?.usdtValue ?? 0n,
          hanaWei: event.args?.[2] ?? event.args?.hanaAllotted ?? 0n,
          event,
        });
      });

      const parsedIncome = [...parsedPrimary, ...parsedFallback];
      parsedIncome.sort((a, b) => b.blockNumber - a.blockNumber);
      setIncomeHistory(parsedIncome);
      setTotalUsdt(sumUsdt);
      setTotalHana(sumHana);
    } catch (fetchError) {
      console.warn("Could not fetch level income history:", fetchError);
      setError(
        fetchError instanceof Error
          ? fetchError.message
          : "Could not load level income history.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [normalizedAddr]);

  useEffect(() => {
    fetchLevelIncomeHistory();
  }, [fetchLevelIncomeHistory]);

  return {
    incomeHistory,
    totalUsdt,
    totalHana,
    isLoading,
    error,
    refetch: fetchLevelIncomeHistory,
  };
}

/**
 * Read on-chain ROI Claim history from ROIClaimed events
 * Event: ROIClaimed(address indexed user, uint256 stakeIndex, uint256 usdtValue, uint256 hanaAllotted)
 */
export function useROIHistory(address) {
  const [roiHistory, setRoiHistory] = useState([]);
  const [totalUsdt, setTotalUsdt] = useState(0);
  const [totalHana, setTotalHana] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const isAddrValid = Boolean(address && isAddress(address));
  const normalizedAddr = isAddrValid ? getAddress(address) : null;

  const fetchRoiHistory = useCallback(async () => {
    if (!normalizedAddr) {
      setRoiHistory([]);
      setTotalUsdt(0);
      setTotalHana(0);
      setError("");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError("");
    try {
      const provider = getReadOnlyProvider();
      const staking = new Contract(
        CONTRACT_ADDRESSES.stakingContract,
        HANA_STAKING_ABI,
        provider
      );

      const currentBlock = await provider.getBlockNumber();
      const fromBlock = Math.max(0, CONTRACT_START_BLOCK);

      const filter = staking.filters.ROIClaimed(normalizedAddr);
      const events = await fetchLogsInChunks(staking, filter, fromBlock, currentBlock).catch(() => []);

      // Cache block timestamps
      const blockNumbers = [...new Set(events.map((e) => e.blockNumber))];
      await Promise.all(
        blockNumbers.map(async (bNum) => {
          if (!blockCache.has(bNum)) {
            try {
              const b = await provider.getBlock(bNum);
              if (b?.timestamp) blockCache.set(bNum, Number(b.timestamp));
            } catch {}
          }
        })
      );

      let sumUsdt = 0;
      let sumHana = 0;

      const parsed = events.map((e) => {
        const stakeIndex = Number(e.args?.[1] ?? e.args?.stakeIndex ?? 0);
        const usdtWei = e.args?.[2] ?? e.args?.usdtValue ?? 0n;
        const hanaWei = e.args?.[3] ?? e.args?.hanaAllotted ?? 0n;
        const usdtNum = Number(formatEther(usdtWei));
        const hanaNum = Number(formatEther(hanaWei));
        const timestamp = blockCache.get(e.blockNumber) || null;

        sumUsdt += usdtNum;
        sumHana += hanaNum;

        const pkg = DEFAULT_PACKAGES[0]; // fallback; we don't have packageId in this event

        return {
          stakeIndex,
          stakeDisplayId: `#S-${stakeIndex + 1}`,
          usdtValue: usdtWei,
          usdtFormatted: usdtNum.toFixed(2),
          usdtNumber: usdtNum,
          hanaAllotted: hanaWei,
          hanaFormatted: hanaNum.toFixed(4),
          hanaNumber: hanaNum,
          txHash: e.transactionHash,
          txShort: `${e.transactionHash.slice(0, 8)}...${e.transactionHash.slice(-6)}`,
          blockNumber: e.blockNumber,
          explorerUrl: getExplorerTxUrl(e.transactionHash),
          timestamp,
          dateFormatted: timestamp
            ? new Date(timestamp * 1000).toLocaleString("en-US", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })
            : `Block #${e.blockNumber}`,
        };
      });

      parsed.sort((a, b) => b.blockNumber - a.blockNumber);
      setRoiHistory(parsed);
      setTotalUsdt(sumUsdt);
      setTotalHana(sumHana);
    } catch (err) {
      console.warn("Could not fetch ROI history:", err);
      setError(err instanceof Error ? err.message : "Could not load ROI history.");
    } finally {
      setIsLoading(false);
    }
  }, [normalizedAddr]);

  useEffect(() => {
    fetchRoiHistory();
  }, [fetchRoiHistory]);

  return { roiHistory, totalUsdt, totalHana, isLoading, error, refetch: fetchRoiHistory };
}

/**
 * Combined income history hook — merges:
 *  - ROIClaimed events (roi income)
 *  - IncomeAllotted events (direct / roi income credited)
 *  - LevelIncomeAllotted events (level income)
 *  - Staked events (staking history)
 *
 * Returns a unified sorted log and per-category summaries.
 */
export function useIncomeHistory(address) {
  const [allEvents, setAllEvents] = useState([]);
  const [roiEvents, setRoiEvents] = useState([]);
  const [directEvents, setDirectEvents] = useState([]);
  const [levelEvents, setLevelEvents] = useState([]);
  const [stakingEvents, setStakingEvents] = useState([]);

  const [totals, setTotals] = useState({
    roiUsdt: 0, roiHana: 0,
    directUsdt: 0, directHana: 0,
    levelUsdt: 0, levelHana: 0,
    stakedUsdt: 0,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const isAddrValid = Boolean(address && isAddress(address));
  const normalizedAddr = isAddrValid ? getAddress(address) : null;

  const fetchAll = useCallback(async () => {
    if (!normalizedAddr) {
      setAllEvents([]); setRoiEvents([]); setDirectEvents([]);
      setLevelEvents([]); setStakingEvents([]);
      setTotals({ roiUsdt: 0, roiHana: 0, directUsdt: 0, directHana: 0, levelUsdt: 0, levelHana: 0, stakedUsdt: 0 });
      setError(""); setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const provider = getReadOnlyProvider();
      const staking = new Contract(CONTRACT_ADDRESSES.stakingContract, HANA_STAKING_ABI, provider);

      const currentBlock = await provider.getBlockNumber();
      const fromBlock = Math.max(0, CONTRACT_START_BLOCK);

      // Fire all 4 event queries in parallel
      const [roiEvts, incomeEvts, levelEvts, stakedEvts] = await Promise.all([
        fetchLogsInChunks(staking, staking.filters.ROIClaimed(normalizedAddr), fromBlock, currentBlock).catch(() => []),
        fetchLogsInChunks(staking, staking.filters.IncomeAllotted(normalizedAddr), fromBlock, currentBlock).catch(() => []),
        fetchLogsInChunks(staking, staking.filters.LevelIncomeAllotted(null, normalizedAddr), fromBlock, currentBlock).catch(() => []),
        fetchLogsInChunks(staking, staking.filters.Staked(normalizedAddr), fromBlock, currentBlock).catch(() => []),
      ]);

      // Cache block timestamps for all events at once
      const allRaw = [...roiEvts, ...incomeEvts, ...levelEvts, ...stakedEvts];
      const blockNumbers = [...new Set(allRaw.map((e) => e.blockNumber))];
      await Promise.all(
        blockNumbers.map(async (bNum) => {
          if (!blockCache.has(bNum)) {
            try {
              const b = await provider.getBlock(bNum);
              if (b?.timestamp) blockCache.set(bNum, Number(b.timestamp));
            } catch {}
          }
        })
      );

      const fmt = (ts) =>
        ts
          ? new Date(ts * 1000).toLocaleString("en-US", {
              day: "2-digit", month: "short", year: "numeric",
              hour: "2-digit", minute: "2-digit",
            })
          : null;

      // For direct income events, fetch tx receipts to get staker address + stake amount
      const directIncomeEvts = incomeEvts.filter((e) => {
        const type = (e.args?.[3] ?? e.args?.incomeType ?? "").toString().toLowerCase();
        return type === "direct";
      });
      const directTxHashes = [...new Set(directIncomeEvts.map((e) => e.transactionHash))];
      const stakedIface = new Interface(HANA_STAKING_ABI.filter((x) => x.name === "Staked"));
      await Promise.all(
        directTxHashes.map(async (hash) => {
          const needSender = !txSenderCache.has(hash);
          const needStake  = !txStakeCache.has(hash);
          if (!needSender && !needStake) return;
          try {
            const [tx, receipt] = await Promise.all([
              needSender ? provider.getTransaction(hash)        : Promise.resolve(null),
              needStake  ? provider.getTransactionReceipt(hash) : Promise.resolve(null),
            ]);
            if (tx?.from) txSenderCache.set(hash, tx.from);
            if (receipt) {
              for (const log of receipt.logs) {
                try {
                  const parsed = stakedIface.parseLog(log);
                  if (parsed?.name === "Staked") {
                    txStakeCache.set(hash, {
                      staker:      parsed.args[0],
                      stakeAmount: parsed.args[2],
                      packageId:   Number(parsed.args[1]),
                      stakeIndex:  Number(parsed.args[3]),
                    });
                    break;
                  }
                } catch {}
              }
            }
          } catch {}
        })
      );

      // --- ROIClaimed events ---
      let roiUsdtSum = 0, roiHanaSum = 0;
      const parsedRoi = roiEvts.map((e) => {
        const stakeIndex = Number(e.args?.[1] ?? e.args?.stakeIndex ?? 0);
        const usdtWei = e.args?.[2] ?? e.args?.usdtValue ?? 0n;
        const hanaWei = e.args?.[3] ?? e.args?.hanaAllotted ?? 0n;
        const usdtNum = Number(formatEther(usdtWei));
        const hanaNum = Number(formatEther(hanaWei));
        const ts = blockCache.get(e.blockNumber) || null;
        roiUsdtSum += usdtNum;
        roiHanaSum += hanaNum;
        return {
          category: "roi",
          label: "ROI Claimed",
          stakeIndex,
          stakeDisplayId: `#S-${stakeIndex + 1}`,
          usdtFormatted: usdtNum.toFixed(2),
          hanaFormatted: hanaNum.toFixed(4),
          usdtNumber: usdtNum,
          hanaNumber: hanaNum,
          txHash: e.transactionHash,
          txShort: `${e.transactionHash.slice(0, 8)}...${e.transactionHash.slice(-6)}`,
          blockNumber: e.blockNumber,
          explorerUrl: getExplorerTxUrl(e.transactionHash),
          timestamp: ts,
          dateFormatted: fmt(ts) ?? `Block #${e.blockNumber}`,
        };
      });

      // --- IncomeAllotted events (direct & roi credited) ---
      let directUsdtSum = 0, directHanaSum = 0;
      const parsedDirect = incomeEvts
        .filter((e) => {
          const type = (e.args?.[3] ?? e.args?.incomeType ?? "").toString().toLowerCase();
          return type === "direct";
        })
        .map((e) => {
          const usdtWei = e.args?.[1] ?? e.args?.usdtValue ?? 0n;
          const hanaWei = e.args?.[2] ?? e.args?.hanaAllotted ?? 0n;
          const usdtNum = Number(formatEther(usdtWei));
          const hanaNum = Number(formatEther(hanaWei));
          const ts = blockCache.get(e.blockNumber) || null;
          directUsdtSum += usdtNum;
          directHanaSum += hanaNum;

          const stakerAddress  = txSenderCache.get(e.transactionHash) || null;
          const stakeInfo      = txStakeCache.get(e.transactionHash) || null;
          const stakeAmountNum = stakeInfo ? Number(formatEther(stakeInfo.stakeAmount)) : null;
          const pkg = stakeInfo ? DEFAULT_PACKAGES.find((p) => p.id === stakeInfo.packageId) : null;

          return {
            category: "direct",
            label: "Direct Income",
            stakerAddress,
            stakerShort: stakerAddress
              ? `${stakerAddress.slice(0, 6)}...${stakerAddress.slice(-4)}`
              : null,
            stakerExplorerUrl: stakerAddress ? getExplorerAddressUrl(stakerAddress) : null,
            stakeAmountFormatted: stakeAmountNum !== null ? stakeAmountNum.toFixed(2) : null,
            stakePackageName: pkg?.name ?? null,
            stakeIndex: stakeInfo?.stakeIndex ?? null,
            usdtFormatted: usdtNum.toFixed(2),
            hanaFormatted: hanaNum.toFixed(4),
            usdtNumber: usdtNum,
            hanaNumber: hanaNum,
            txHash: e.transactionHash,
            txShort: `${e.transactionHash.slice(0, 8)}...${e.transactionHash.slice(-6)}`,
            blockNumber: e.blockNumber,
            explorerUrl: getExplorerTxUrl(e.transactionHash),
            timestamp: ts,
            dateFormatted: fmt(ts) ?? `Block #${e.blockNumber}`,
          };
        });

      // --- LevelIncomeAllotted events ---
      let levelUsdtSum = 0, levelHanaSum = 0;
      const parsedLevel = levelEvts.map((e) => {
        const fromAddress = e.args?.[0] ?? e.args?.from;
        const level = Number(e.args?.[2] ?? e.args?.level ?? 0n);
        const usdtWei = e.args?.[3] ?? e.args?.usdtValue ?? 0n;
        const hanaWei = e.args?.[4] ?? e.args?.hanaAllotted ?? 0n;
        const usdtNum = Number(formatEther(usdtWei));
        const hanaNum = Number(formatEther(hanaWei));
        const ts = blockCache.get(e.blockNumber) || null;
        levelUsdtSum += usdtNum;
        levelHanaSum += hanaNum;
        return {
          category: "level",
          label: `Level ${level} Income`,
          fromAddress,
          fromShort: fromAddress ? `${fromAddress.slice(0, 6)}...${fromAddress.slice(-4)}` : "Network",
          fromExplorerUrl: fromAddress ? getExplorerAddressUrl(fromAddress) : null,
          level,
          usdtFormatted: usdtNum.toFixed(2),
          hanaFormatted: hanaNum.toFixed(4),
          usdtNumber: usdtNum,
          hanaNumber: hanaNum,
          txHash: e.transactionHash,
          txShort: `${e.transactionHash.slice(0, 8)}...${e.transactionHash.slice(-6)}`,
          blockNumber: e.blockNumber,
          explorerUrl: getExplorerTxUrl(e.transactionHash),
          timestamp: ts,
          dateFormatted: fmt(ts) ?? `Block #${e.blockNumber}`,
        };
      });

      // --- Staked events ---
      let stakedUsdtSum = 0;
      const parsedStaked = stakedEvts.map((e) => {
        const packageId = Number(e.args?.[1] ?? e.args?.packageId ?? 0);
        const amountWei = e.args?.[2] ?? e.args?.amount ?? 0n;
        const stakeIndex = Number(e.args?.[3] ?? e.args?.stakeIndex ?? 0);
        const amountNum = Number(formatEther(amountWei));
        const pkg = DEFAULT_PACKAGES.find((p) => p.id === packageId) || { name: `Package #${packageId}` };
        const ts = blockCache.get(e.blockNumber) || null;
        stakedUsdtSum += amountNum;
        return {
          category: "staked",
          label: `Staked – ${pkg.name}`,
          packageId,
          packageName: pkg.name,
          stakeIndex,
          stakeDisplayId: `#S-${stakeIndex + 1}`,
          usdtFormatted: amountNum.toFixed(2),
          hanaFormatted: "-",
          usdtNumber: amountNum,
          hanaNumber: 0,
          txHash: e.transactionHash,
          txShort: `${e.transactionHash.slice(0, 8)}...${e.transactionHash.slice(-6)}`,
          blockNumber: e.blockNumber,
          explorerUrl: getExplorerTxUrl(e.transactionHash),
          timestamp: ts,
          dateFormatted: fmt(ts) ?? `Block #${e.blockNumber}`,
        };
      });

      // Sort each category newest-first
      const sortByBlock = (a, b) => b.blockNumber - a.blockNumber;
      parsedRoi.sort(sortByBlock);
      parsedDirect.sort(sortByBlock);
      parsedLevel.sort(sortByBlock);
      parsedStaked.sort(sortByBlock);

      // Unified log — combine all categories and re-sort
      const unified = [...parsedRoi, ...parsedDirect, ...parsedLevel, ...parsedStaked];
      unified.sort(sortByBlock);

      setRoiEvents(parsedRoi);
      setDirectEvents(parsedDirect);
      setLevelEvents(parsedLevel);
      setStakingEvents(parsedStaked);
      setAllEvents(unified);
      setTotals({
        roiUsdt: roiUsdtSum,
        roiHana: roiHanaSum,
        directUsdt: directUsdtSum,
        directHana: directHanaSum,
        levelUsdt: levelUsdtSum,
        levelHana: levelHanaSum,
        stakedUsdt: stakedUsdtSum,
      });
    } catch (err) {
      console.warn("Could not fetch income history:", err);
      setError(err instanceof Error ? err.message : "Could not load income history.");
    } finally {
      setIsLoading(false);
    }
  }, [normalizedAddr]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return {
    allEvents,
    roiEvents,
    directEvents,
    levelEvents,
    stakingEvents,
    totals,
    isLoading,
    error,
    refetch: fetchAll,
  };
}
