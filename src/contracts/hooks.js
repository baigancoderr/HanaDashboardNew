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
      const data = await staking.users(normalizedAddr);

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

/**
 * Safely query contract logs in bounded chunks to prevent RPC batch/range rate limits
 */
async function fetchLogsInChunks(
  contract,
  filter,
  fromBlock,
  toBlock,
  chunkSize = 40000
) {
  let allEvents = [];
  let start = Math.max(0, fromBlock);
  const endLimit = Math.max(start, toBlock);

  while (start <= endLimit) {
    const end = Math.min(start + chunkSize, endLimit);
    try {
      const events = await contract.queryFilter(filter, start, end);
      if (events && events.length) {
        allEvents = allEvents.concat(events);
      }
    } catch (err) {
      console.warn(`Query logs chunk [${start} - ${end}] failed:`, err);
    }
    start = end + 1;
  }
  return allEvents;
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

      // Fetch both stakes data and Staked events to match tx hashes
      const currentBlock = await provider.getBlockNumber();
      const fromBlock = Math.max(0, CONTRACT_START_BLOCK);

      const [data, stakedEvents] = await Promise.all([
        staking.getUserStakes(normalizedAddr),
        fetchLogsInChunks(
          staking,
          staking.filters.Staked(normalizedAddr),
          fromBlock,
          currentBlock
        ).catch(() => []),
      ]);

      const txMap = new Map();
      stakedEvents.forEach((ev) => {
        const idx = Number(ev.args?.[3] ?? ev.args?.stakeIndex ?? 0);
        txMap.set(idx, ev.transactionHash);
      });

      const parsed = (data || []).map((st, index) => {
        const txHash = txMap.get(index) || null;
        return {
          stakeIndex: index,
          packageId: Number(st[0]),
          amount: st[1],
          amountFormatted: formatEther(st[1] || 0n),
          roiBaseAmount: st[2],
          roiBaseAmountFormatted: formatEther(st[2] || 0n),
          startTime: Number(st[3]),
          lastClaimTime: Number(st[4]),
          totalClaimed: st[5],
          totalClaimedFormatted: formatEther(st[5] || 0n),
          cap: st[6],
          capFormatted: formatEther(st[6] || 0n),
          active: Boolean(st[7]),
          txHash,
          explorerUrl: txHash ? getExplorerTxUrl(txHash) : null,
        };
      });

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
export function useReferralHistory(address) {
  const [directIncomeHistory, setDirectIncomeHistory] = useState([]);
  const [registeredReferrals, setRegisteredReferrals] = useState([]);
  const [totalDirectEarnedUsdt, setTotalDirectEarnedUsdt] = useState(0);
  const [totalDirectEarnedHana, setTotalDirectEarnedHana] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const isAddrValid = Boolean(address && isAddress(address));
  const normalizedAddr = isAddrValid ? getAddress(address) : null;

  const fetchReferralData = useCallback(async () => {
    if (!normalizedAddr) {
      setDirectIncomeHistory([]);
      setRegisteredReferrals([]);
      setTotalDirectEarnedUsdt(0);
      setTotalDirectEarnedHana(0);
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

      // 1. Fetch IncomeAllotted where user is normalizedAddr
      const incomeFilter = staking.filters.IncomeAllotted(normalizedAddr);
      // 2. Fetch Registered where referrer is normalizedAddr
      const regFilter = staking.filters.Registered(null, normalizedAddr);

      const [incomeEvents, regEvents] = await Promise.all([
        fetchLogsInChunks(staking, incomeFilter, fromBlock, currentBlock).catch(() => []),
        fetchLogsInChunks(staking, regFilter, fromBlock, currentBlock).catch(() => []),
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
      const txHashes = [...new Set(incomeEvents.map((e) => e.transactionHash))];
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
    } finally {
      setIsLoading(false);
    }
  }, [normalizedAddr]);

  useEffect(() => {
    fetchReferralData();
  }, [fetchReferralData]);

  return {
    directIncomeHistory,
    registeredReferrals,
    totalDirectEarnedUsdt,
    totalDirectEarnedHana,
    isLoading,
    refetch: fetchReferralData,
  };
}
