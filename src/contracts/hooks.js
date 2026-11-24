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
  getArchiveProvider,
  CONTRACT_START_BLOCK,
  DEFAULT_PACKAGES,
  getExplorerTxUrl,
  getExplorerAddressUrl,
} from "./config";
import { HANA_STAKING_ABI, ERC20_ABI, HANA_TOKEN_ABI } from "./abis";
import {
  referralStorageKey,
} from "../dashboard/referralStorage";
import { readStakingIsRegistered } from "./registration";
import {
  RANK_ACHIEVEMENT_STRUCTURE,
  calculateUserRankStatus,
} from "./ranks";

export { RANK_ACHIEVEMENT_STRUCTURE, calculateUserRankStatus };

/**
 * Check if a wallet is registered on the Staking Contract
 */
export function useIsRegistered(address) {
  const [onChainRegistered, setOnChainRegistered] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [checkedAddress, setCheckedAddress] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  const isAddrValid = Boolean(address && isAddress(address));
  const normalizedAddr = isAddrValid ? getAddress(address) : null;

  const refetch = useCallback(async () => {
    setReloadKey((key) => key + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    if (!normalizedAddr) {
      setOnChainRegistered(false);
      setCheckedAddress(null);
      setIsLoading(false);
      setIsError(false);
      return undefined;
    }

    // Drop the previous wallet immediately. A stale `true` was opening the
    // dashboard for old users whose new-contract isRegistered is false.
    setOnChainRegistered(false);
    setCheckedAddress(null);
    setIsLoading(true);
    setIsError(false);

    (async () => {
      try {
        const registered = await readStakingIsRegistered(normalizedAddr);
        if (cancelled) return;
        setOnChainRegistered(registered === true);
        setCheckedAddress(normalizedAddr);
      } catch (err) {
        console.warn("Could not check on-chain registration:", err);
        if (cancelled) return;
        setOnChainRegistered(false);
        setCheckedAddress(normalizedAddr);
        setIsError(true);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [normalizedAddr, reloadKey]);

  const isReady =
    !isLoading &&
    (normalizedAddr == null || checkedAddress === normalizedAddr);
  const isRegistered = isReady && onChainRegistered === true;

  return {
    isRegistered,
    onChainRegistered: isRegistered,
    isReady,
    checkedAddress,
    isLoading: Boolean(normalizedAddr) && !isReady,
    isError,
    refetch,
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
        totalStakedNumber: Number(formatEther(data[1] || 0n)),
        totalInvestedNumber: Number(formatEther(data[1] || 0n)),
        totalROIClaimed: data[2],
        totalROIClaimedFormatted: formatEther(data[2] || 0n),
        totalROIClaimedNumber: Number(formatEther(data[2] || 0n)),
        totalDirect: data[3],
        totalDirectFormatted: formatEther(data[3] || 0n),
        totalDirectBonusNumber: Number(formatEther(data[3] || 0n)),
        totalLevel: data[4],
        totalLevelFormatted: formatEther(data[4] || 0n),
        totalLevelBonusNumber: Number(formatEther(data[4] || 0n)),
        totalRank: data[5],
        totalRankFormatted: formatEther(data[5] || 0n),
        totalRankBonusNumber: Number(formatEther(data[5] || 0n)),
        totalDAO: data[6],
        totalDAOFormatted: formatEther(data[6] || 0n),
        totalDAOBonusNumber: Number(formatEther(data[6] || 0n)),
        hanaBalance: data[7],
        hanaBalanceFormatted: formatEther(data[7] || 0n),
        totalWithdrawnHana: data[8],
        totalWithdrawnHanaFormatted: formatEther(data[8] || 0n),
        totalWithdrawnNumber: Number(formatEther(data[8] || 0n)),
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
// txHashLower → { staker, stakeAmount, packageId, stakeIndex }
const txStakeCache = new Map();
// txHashLower → { claimer, stakeIndex, usdtValue, hanaAllotted }
const txRoiClaimCache = new Map();

// ─── Unified Hybrid Contract Log Sync Store ──────────────────────────────────
const stakingIface = new Interface(HANA_STAKING_ABI);
const LOG_SYNC_STORAGE_KEY = `hana_staking_logs_v5_${CONTRACT_ADDRESSES.stakingContract.toLowerCase()}`;
const TAIL_BLOCK_SPAN = 49999;
const ARCHIVE_CHUNK_SPAN = 4999; // Keep public RPC archive scans small
const ARCHIVE_CHUNK_DELAY_MS = 700;

const logSyncStore = {
  initialized: false,
  rawLogMap: new Map(), // `${txHashLower}:${logIndex}` -> raw parsed entry
  parsedEvents: [], // sorted ascending by blockNumber, logIndex
  historicalCursor: Math.max(0, CONTRACT_START_BLOCK - 1),
  tailHead: 0,
  lastTailSyncAt: 0,
  hasCompletedInitialTail: false,
  isSyncingHistory: false,
  syncProgress: 0,
  dataRevision: 0,
  progressRevision: 0,
  listeners: new Set(),
  tailPromise: null,
  archivePromise: null,
};

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function notifyLogSyncListeners() {
  logSyncStore.listeners.forEach((cb) => {
    try {
      cb({
        dataRevision: logSyncStore.dataRevision,
        progressRevision: logSyncStore.progressRevision,
        isSyncingHistory: logSyncStore.isSyncingHistory,
        syncProgress: logSyncStore.syncProgress,
      });
    } catch {}
  });
}

function rebuildParsedEventsAndIndexes() {
  const list = Array.from(logSyncStore.rawLogMap.values());
  list.sort((a, b) =>
    a.blockNumber !== b.blockNumber
      ? a.blockNumber - b.blockNumber
      : a.logIndex - b.logIndex
  );
  logSyncStore.parsedEvents = list;

  // Populate cross-event tx caches in memory with zero extra RPC calls
  for (const ev of list) {
    const txLower = ev.transactionHash.toLowerCase();
    if (ev.eventName === "Staked") {
      txStakeCache.set(ev.transactionHash, {
        staker: ev.args?.[0] ?? ev.args?.user,
        packageId: Number(ev.args?.[1] ?? ev.args?.packageId ?? 0),
        stakeAmount: ev.args?.[2] ?? ev.args?.amount ?? 0n,
        stakeIndex: Number(ev.args?.[3] ?? ev.args?.stakeIndex ?? 0),
      });
      txStakeCache.set(txLower, txStakeCache.get(ev.transactionHash));
      const stakerAddr = ev.args?.[0] ?? ev.args?.user;
      if (stakerAddr) {
        txSenderCache.set(ev.transactionHash, stakerAddr);
      }
    } else if (ev.eventName === "ROIClaimed") {
      const info = {
        claimer: ev.args?.[0] ?? ev.args?.user,
        stakeIndex: Number(ev.args?.[1] ?? ev.args?.stakeIndex ?? 0),
        usdtValue: ev.args?.[2] ?? ev.args?.usdtValue ?? 0n,
        hanaAllotted: ev.args?.[3] ?? ev.args?.hanaAllotted ?? 0n,
      };
      txRoiClaimCache.set(ev.transactionHash, info);
      txRoiClaimCache.set(txLower, info);
    }
  }
}

function mergeRawLogs(logs) {
  let addedCount = 0;
  for (const raw of logs || []) {
    const txHash = raw.transactionHash ?? raw.h;
    const blockNumber = Number(raw.blockNumber ?? raw.b ?? 0);
    const logIndex = Number(raw.index ?? raw.logIndex ?? raw.i ?? 0);
    const topics = raw.topics ?? raw.t;
    const data = raw.data ?? raw.d;
    if (!txHash || !topics || !topics.length) continue;

    const key = `${txHash.toLowerCase()}:${logIndex}`;
    if (logSyncStore.rawLogMap.has(key)) continue;

    let parsed = null;
    try {
      parsed = stakingIface.parseLog({ topics, data });
    } catch {
      parsed = null;
    }
    if (!parsed) continue;

    logSyncStore.rawLogMap.set(key, {
      eventName: parsed.name,
      args: parsed.args,
      blockNumber,
      transactionHash: txHash,
      logIndex,
      index: logIndex,
      topics,
      data,
    });
    addedCount += 1;
  }

  if (addedCount > 0) {
    rebuildParsedEventsAndIndexes();
  }
  return addedCount;
}

function persistLogSyncStore() {
  if (typeof window === "undefined") return;
  try {
    const payload = {
      historicalCursor: logSyncStore.historicalCursor,
      tailHead: logSyncStore.tailHead,
      logs: Array.from(logSyncStore.rawLogMap.values()).map((ev) => ({
        b: ev.blockNumber,
        h: ev.transactionHash,
        i: ev.logIndex,
        t: ev.topics,
        d: ev.data,
      })),
    };
    window.localStorage.setItem(LOG_SYNC_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Ignore storage quota / private mode failures
  }
}

function purgeLegacyLogCaches() {
  if (typeof window === "undefined") return;
  try {
    const staleKeys = [];
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const key = window.localStorage.key(i);
      if (
        key &&
        key.startsWith("hana_staking_logs") &&
        key !== LOG_SYNC_STORAGE_KEY
      ) {
        staleKeys.push(key);
      }
    }
    staleKeys.forEach((key) => window.localStorage.removeItem(key));
  } catch {
    // Ignore private mode / quota failures
  }
}

function initLogSyncStore() {
  if (logSyncStore.initialized) return;
  logSyncStore.initialized = true;
  if (typeof window === "undefined") return;
  purgeLegacyLogCaches();

  try {
    const rawJson = window.localStorage.getItem(LOG_SYNC_STORAGE_KEY);
    if (!rawJson) return;
    const saved = JSON.parse(rawJson);
    if (Number.isFinite(saved?.historicalCursor)) {
      logSyncStore.historicalCursor = Math.max(
        CONTRACT_START_BLOCK - 1,
        Number(saved.historicalCursor)
      );
    }
    if (Number.isFinite(saved?.tailHead)) {
      logSyncStore.tailHead = Number(saved.tailHead);
    }
    if (Array.isArray(saved?.logs)) {
      mergeRawLogs(saved.logs);
    }
    if (logSyncStore.tailHead > CONTRACT_START_BLOCK) {
      const totalSpan = Math.max(1, logSyncStore.tailHead - CONTRACT_START_BLOCK + 1);
      const scannedSpan = Math.max(
        0,
        logSyncStore.historicalCursor - CONTRACT_START_BLOCK + 1
      );
      logSyncStore.syncProgress = Math.min(
        100,
        Math.round((scannedSpan / totalSpan) * 100)
      );
    }
  } catch {
    // Ignore corrupt localStorage entries
  }
}

function isRetryableRpcError(err) {
  const msg = String(
    err?.shortMessage || err?.message || err?.info?.error?.message || ""
  ).toLowerCase();
  const code = err?.code ?? err?.info?.error?.code;
  return (
    code === -32029 ||
    code === 429 ||
    msg.includes("-32029") ||
    msg.includes("429") ||
    msg.includes("too many requests") ||
    msg.includes("rate limit") ||
    msg.includes("timeout") ||
    msg.includes("network") ||
    msg.includes("failed to fetch")
  );
}

function isRangeLimitError(err) {
  const msg = String(
    err?.shortMessage || err?.message || err?.info?.error?.message || ""
  ).toLowerCase();
  const code = err?.code ?? err?.info?.error?.code;
  return (
    code === -32602 ||
    msg.includes("range") ||
    msg.includes("exceeded") ||
    msg.includes("too large") ||
    msg.includes("block")
  );
}

async function fetchArchiveLogsWithRetry(
  archiveProvider,
  address,
  fromBlock,
  toBlock,
  attempt = 1
) {
  try {
    return await archiveProvider.getLogs({ address, fromBlock, toBlock });
  } catch (err) {
    if (isRangeLimitError(err) && toBlock > fromBlock) {
      const mid = fromBlock + Math.floor((toBlock - fromBlock) / 2);
      const left = await fetchArchiveLogsWithRetry(
        archiveProvider,
        address,
        fromBlock,
        mid,
        1
      );
      await sleep(ARCHIVE_CHUNK_DELAY_MS);
      const right = await fetchArchiveLogsWithRetry(
        archiveProvider,
        address,
        mid + 1,
        toBlock,
        1
      );
      return [...left, ...right];
    }
    if (attempt < 4 && isRetryableRpcError(err)) {
      await sleep(1600 * attempt);
      return fetchArchiveLogsWithRetry(
        archiveProvider,
        address,
        fromBlock,
        toBlock,
        attempt + 1
      );
    }
    throw err;
  }
}

async function runArchiveSync(archiveEnd) {
  if (logSyncStore.archivePromise) return logSyncStore.archivePromise;

  logSyncStore.archivePromise = (async () => {
    const startBlock = Math.max(CONTRACT_START_BLOCK, logSyncStore.historicalCursor + 1);
    if (archiveEnd < startBlock) {
      logSyncStore.historicalCursor = Math.max(
        logSyncStore.historicalCursor,
        logSyncStore.tailHead
      );
      logSyncStore.syncProgress = 100;
      logSyncStore.isSyncingHistory = false;
      persistLogSyncStore();
      notifyLogSyncListeners();
      return;
    }

    const archiveProvider = getArchiveProvider();
    const contractAddr = CONTRACT_ADDRESSES.stakingContract;
    const totalToScan = Math.max(1, archiveEnd - CONTRACT_START_BLOCK + 1);

    logSyncStore.isSyncingHistory = true;
    logSyncStore.progressRevision += 1;
    notifyLogSyncListeners();

    let cursor = startBlock;
    let chunksSincePersist = 0;
    let hadFailure = false;

    try {
      while (cursor <= archiveEnd) {
        const chunkEnd = Math.min(cursor + ARCHIVE_CHUNK_SPAN, archiveEnd);
        let chunkLogs = [];
        try {
          chunkLogs = await fetchArchiveLogsWithRetry(
            archiveProvider,
            contractAddr,
            cursor,
            chunkEnd
          );
        } catch (err) {
          console.warn(
            `Archive log sync paused at [${cursor}-${chunkEnd}]:`,
            err?.shortMessage || err?.message || err
          );
          hadFailure = true;
          break;
        }

        const added = mergeRawLogs(chunkLogs);
        logSyncStore.historicalCursor = chunkEnd;
        const scanned = Math.max(0, chunkEnd - CONTRACT_START_BLOCK + 1);
        logSyncStore.syncProgress = Math.min(
          99,
          Math.max(1, Math.round((scanned / totalToScan) * 100))
        );
        chunksSincePersist += 1;

        if (added > 0) {
          logSyncStore.dataRevision += 1;
          logSyncStore.progressRevision += 1;
          persistLogSyncStore();
          chunksSincePersist = 0;
          notifyLogSyncListeners();
        } else if (chunksSincePersist >= 4) {
          logSyncStore.progressRevision += 1;
          persistLogSyncStore();
          chunksSincePersist = 0;
          notifyLogSyncListeners();
        }

        cursor = chunkEnd + 1;
        if (cursor <= archiveEnd) {
          await sleep(ARCHIVE_CHUNK_DELAY_MS);
        }
      }

      if (!hadFailure && logSyncStore.historicalCursor >= archiveEnd) {
        logSyncStore.historicalCursor = Math.max(
          logSyncStore.historicalCursor,
          logSyncStore.tailHead
        );
        logSyncStore.syncProgress = 100;
      }
      persistLogSyncStore();
    } finally {
      logSyncStore.isSyncingHistory = false;
      logSyncStore.progressRevision += 1;
      notifyLogSyncListeners();
      logSyncStore.archivePromise = null;
    }
  })();

  return logSyncStore.archivePromise;
}

export async function syncStakingContractLogs({ forceRecent = false } = {}) {
  initLogSyncStore();

  const shouldRunTail =
    forceRecent ||
    !logSyncStore.hasCompletedInitialTail ||
    Date.now() - logSyncStore.lastTailSyncAt > 8000;

  if (!shouldRunTail && !logSyncStore.tailPromise) {
    const tailStart = Math.max(
      CONTRACT_START_BLOCK,
      logSyncStore.tailHead - TAIL_BLOCK_SPAN
    );
    if (
      !logSyncStore.archivePromise &&
      logSyncStore.tailHead > 0 &&
      logSyncStore.historicalCursor < tailStart - 1
    ) {
      void runArchiveSync(tailStart - 1);
    }
    return logSyncStore.parsedEvents;
  }

  if (logSyncStore.tailPromise && !forceRecent) {
    await logSyncStore.tailPromise;
    return logSyncStore.parsedEvents;
  }

  const runTail = async () => {
    const provider = getReadOnlyProvider();
    try {
      const headBlock = await provider.getBlockNumber();
      const tailFrom = Math.max(CONTRACT_START_BLOCK, headBlock - TAIL_BLOCK_SPAN);
      const tailLogs = await provider.getLogs({
        address: CONTRACT_ADDRESSES.stakingContract,
        fromBlock: tailFrom,
        toBlock: headBlock,
      });

      const added = mergeRawLogs(tailLogs);
      const wasInitial = !logSyncStore.hasCompletedInitialTail;
      logSyncStore.tailHead = headBlock;
      logSyncStore.lastTailSyncAt = Date.now();
      logSyncStore.hasCompletedInitialTail = true;

      if (tailFrom <= CONTRACT_START_BLOCK) {
        logSyncStore.historicalCursor = Math.max(
          logSyncStore.historicalCursor,
          headBlock
        );
        logSyncStore.syncProgress = 100;
      } else if (logSyncStore.historicalCursor >= tailFrom - 1) {
        logSyncStore.historicalCursor = Math.max(
          logSyncStore.historicalCursor,
          headBlock
        );
        logSyncStore.syncProgress = 100;
      }

      if (added > 0 || wasInitial || forceRecent) {
        if (added > 0 || forceRecent) {
          logSyncStore.dataRevision += 1;
        }
        persistLogSyncStore();
        notifyLogSyncListeners();
      }

      if (logSyncStore.historicalCursor < tailFrom - 1) {
        void runArchiveSync(tailFrom - 1);
      }
    } catch (err) {
      console.warn("Tail log sync failed, falling back to archive scan:", err);
      logSyncStore.hasCompletedInitialTail = true;
      // Attempt archive scan up to latest known or archive head
      try {
        const archiveProvider = getArchiveProvider();
        const archiveHead = await archiveProvider.getBlockNumber();
        logSyncStore.tailHead = archiveHead;
        if (logSyncStore.historicalCursor < archiveHead) {
          void runArchiveSync(archiveHead);
        }
      } catch (archiveErr) {
        console.warn("Archive provider blockNumber failed:", archiveErr);
      }
    } finally {
      if (logSyncStore.tailPromise === tailExecution) {
        logSyncStore.tailPromise = null;
      }
    }
  };

  const tailExecution = runTail();
  logSyncStore.tailPromise = tailExecution;
  await tailExecution;
  return logSyncStore.parsedEvents;
}

export function useContractLogSyncStatus() {
  initLogSyncStore();
  const [status, setStatus] = useState(() => ({
    dataRevision: logSyncStore.dataRevision,
    progressRevision: logSyncStore.progressRevision,
    isSyncingHistory: logSyncStore.isSyncingHistory,
    syncProgress: logSyncStore.syncProgress,
  }));

  useEffect(() => {
    const listener = (next) => {
      setStatus(next);
    };
    logSyncStore.listeners.add(listener);
    return () => {
      logSyncStore.listeners.delete(listener);
    };
  }, []);

  return status;
}

function matchesTopicFilter(rawTopics, topicFilter) {
  if (!topicFilter || topicFilter.length === 0) return true;
  for (let i = 0; i < topicFilter.length; i += 1) {
    const expected = topicFilter[i];
    if (expected == null) continue;
    const actual = rawTopics?.[i]?.toLowerCase();
    if (!actual) return false;
    if (Array.isArray(expected)) {
      if (!expected.some((item) => item?.toLowerCase() === actual)) return false;
    } else if (expected.toLowerCase() !== actual) {
      return false;
    }
  }
  return true;
}

/**
 * Shared synced log reader replacing per-hook RPC chunk scans.
 * Returns decoded logs from the in-memory + localStorage hybrid sync store.
 */
async function fetchLogsInChunks(_contract, filter, fromBlock = 0, toBlock = Number.MAX_SAFE_INTEGER) {
  const events = await syncStakingContractLogs();
  const topicFilter =
    filter && typeof filter.getTopicFilter === "function"
      ? await filter.getTopicFilter()
      : null;

  return events.filter(
    (ev) =>
      ev.blockNumber >= fromBlock &&
      ev.blockNumber <= toBlock &&
      matchesTopicFilter(ev.topics, topicFilter)
  );
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
  const { dataRevision } = useContractLogSyncStatus();

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

      // 1. Direct contract getUserStakes view call (fast and direct)
      let rawStakes = [];
      try {
        rawStakes = await staking.getUserStakes(normalizedAddr);
      } catch (err) {
        console.warn("getUserStakes contract call failed, checking event fallback:", err);
      }

      // 2. Fetch on-chain Staked events for tx hash mapping
      const stakedEvents = await fetchLogsInChunks(
        staking,
        staking.filters.Staked(normalizedAddr),
        CONTRACT_START_BLOCK
      ).catch(() => []);

      const txMap = new Map();
      stakedEvents.forEach((ev) => {
        const idx = Number(ev.args?.[3] ?? ev.args?.stakeIndex ?? 0);
        txMap.set(idx, ev.transactionHash);
      });

      let parsed = [];

      if (rawStakes && rawStakes.length > 0) {
        parsed = await Promise.all(
          rawStakes.map(async (st, index) => {
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

            let pendingRoi = 0n;
            try {
              pendingRoi = await staking.pendingROI(normalizedAddr, index);
            } catch {
              pendingRoi = 0n;
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
              pendingRoi: Number(formatEther(pendingRoi)),
              pendingRoiFormatted: Number(formatEther(pendingRoi)).toFixed(2),
              active,
              txHash,
              explorerUrl: txHash ? getExplorerTxUrl(txHash) : null,
            };
          })
        );
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
  }, [normalizedAddr, dataRevision]);

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

        if (referrerAddress && referrerAddress.trim() !== "") {
          const clean = referrerAddress.trim();
          if (!isAddress(clean)) {
            throw new Error("Invalid referral EVM wallet address.");
          }
          finalReferrer = getAddress(clean);

          if (finalReferrer.toLowerCase() === userAddress.toLowerCase()) {
            throw new Error("You cannot refer yourself.");
          }

          // Check if referrer is registered on the current staking contract
          const isRefRegistered = await readStakingIsRegistered(finalReferrer);

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
              const isDefaultReg = await readStakingIsRegistered(finalReferrer);
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
        void syncStakingContractLogs({ forceRecent: true });

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
    async (userAddressOrPkgId, packageIdMaybe, amountUsdtMaybe) => {
      setError("");
      setStep("checking");

      try {
        if (!walletProvider) {
          throw new Error("No wallet provider detected. Please reconnect your wallet.");
        }

        const browserProvider = new BrowserProvider(walletProvider);
        const signer = await browserProvider.getSigner();

        // Support flexible call patterns:
        // Pattern A: stake(userAddress, packageId, amountUsdt)
        // Pattern B: stake(packageId, amountUsdt)
        // Pattern C: stake(packageId)
        let resolvedUserAddress = userAddressOrPkgId;
        let resolvedPackageId = packageIdMaybe;
        let resolvedAmount = amountUsdtMaybe;

        if (
          typeof userAddressOrPkgId === "number" ||
          (typeof userAddressOrPkgId === "string" && !isAddress(userAddressOrPkgId))
        ) {
          resolvedPackageId = userAddressOrPkgId;
          resolvedAmount = packageIdMaybe;
          resolvedUserAddress = await signer.getAddress();
        }

        if (!resolvedUserAddress || !isAddress(resolvedUserAddress)) {
          resolvedUserAddress = await signer.getAddress();
        }

        if (!resolvedUserAddress || !isAddress(resolvedUserAddress)) {
          throw new Error("Please connect your wallet first.");
        }

        if (resolvedPackageId === 'dao' || resolvedPackageId === 'DAO') {
          resolvedPackageId = 5;
        }

        const packageIndex = Number(resolvedPackageId);
        if (isNaN(packageIndex)) {
          throw new Error(`Invalid package selected: ${resolvedPackageId}`);
        }
        const pkgConfig = DEFAULT_PACKAGES[packageIndex];
        const finalAmount =
          resolvedAmount !== undefined &&
          resolvedAmount !== null &&
          !isNaN(Number(resolvedAmount))
            ? Number(resolvedAmount)
            : (pkgConfig?.minAmount ?? 50);

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

        const amountWei = parseEther(finalAmount.toString());

        const usdt = new Contract(
          CONTRACT_ADDRESSES.usdtToken,
          ERC20_ABI,
          signer
        );

        // Check balance
        const balance = await usdt.balanceOf(getAddress(resolvedUserAddress));
        if (balance < amountWei) {
          throw new Error(
            `Insufficient USDT balance. You have ${formatEther(
              balance
            )} USDT but need ${finalAmount} USDT.`
          );
        }

        // Check allowance
        const allowance = await usdt.allowance(
          getAddress(resolvedUserAddress),
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

        // Execute stake on active contract: stake(packageId) only — amount is pkg.minAmount on-chain
        setStep("staking");
        const staking = new Contract(
          CONTRACT_ADDRESSES.stakingContract,
          HANA_STAKING_ABI,
          signer
        );

        const stakeTx = await staking.stake(BigInt(packageIndex));
        setTxHash(stakeTx.hash);
        setStep("confirming");

        await stakeTx.wait(1);
        void syncStakingContractLogs({ forceRecent: true });

        setStep("success");
        return { success: true, hash: stakeTx.hash };
      } catch (err) {
        console.error("Staking error:", err);
        let msg =
          err?.reason ||
          err?.shortMessage ||
          err?.data?.message ||
          err?.message ||
          "";

        // Map generic/empty revert messages to actionable text
        if (
          !msg ||
          msg === "require(false)" ||
          msg.toLowerCase().includes("require(false)") ||
          msg.toLowerCase().includes("execution reverted") ||
          msg.toLowerCase().includes("transaction reverted without a reason")
        ) {
          msg =
            "Staking failed: the contract's internal liquidity or buyback call reverted. " +
            "This usually means the HANA liquidity pool has insufficient funds. " +
            "Please contact the admin or try again later.";
        }

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
        void syncStakingContractLogs({ forceRecent: true });

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
        void syncStakingContractLogs({ forceRecent: true });
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
  const { dataRevision, isSyncingHistory, syncProgress } =
    useContractLogSyncStatus();

  const isAddrValid = Boolean(address && isAddress(address));
  const normalizedAddr = isAddrValid ? getAddress(address) : null;

  const fetchHistory = useCallback(async (forceRefresh = false) => {
    if (!normalizedAddr) {
      setStakingHistory([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      if (forceRefresh) {
        await syncStakingContractLogs({ forceRecent: true });
      }
      const provider = getReadOnlyProvider();
      const staking = new Contract(
        CONTRACT_ADDRESSES.stakingContract,
        HANA_STAKING_ABI,
        provider
      );

      const filter = staking.filters.Staked(normalizedAddr);
      const events = await fetchLogsInChunks(
        staking,
        filter,
        CONTRACT_START_BLOCK
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
  }, [normalizedAddr, dataRevision]);

  useEffect(() => {
    fetchHistory(false);
  }, [fetchHistory]);

  return {
    stakingHistory,
    isLoading,
    isSyncingHistory,
    syncProgress,
    refetch: () => fetchHistory(true),
  };
}

export function useWithdrawalHistory(address) {
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { dataRevision } = useContractLogSyncStatus();

  const isAddrValid = Boolean(address && isAddress(address));
  const normalizedAddr = isAddrValid ? getAddress(address) : null;

  const fetchHistory = useCallback(async (forceRefresh = false) => {
    if (!normalizedAddr) {
      setHistory([]);
      setError("");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError("");
    try {
      if (forceRefresh) {
        await syncStakingContractLogs({ forceRecent: true });
      }

      const provider = getReadOnlyProvider();
      const staking = new Contract(
        CONTRACT_ADDRESSES.stakingContract,
        HANA_STAKING_ABI,
        provider
      );
      const events = await fetchLogsInChunks(
        staking,
        staking.filters.TokensWithdrawn(normalizedAddr),
        CONTRACT_START_BLOCK
      );

      await populateBlockTimestamps(provider, events);
      const parsed = events.map((event) => {
        const netAmount = BigInt(event.args?.netAmount ?? event.args?.[1] ?? 0n);
        const fee = BigInt(event.args?.fee ?? event.args?.[2] ?? 0n);
        const timestamp = blockCache.get(event.blockNumber) || null;

        return {
          id: `withdraw-${event.transactionHash}-${event.index ?? event.logIndex ?? 0}`,
          type: "Withdraw HANA",
          amountLabel: `${formatEther(netAmount)} HANA`,
          txHash: event.transactionHash,
          date: timestamp
            ? new Date(timestamp * 1000).toLocaleString("en-US", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })
            : `Block #${event.blockNumber}`,
          status: "Success",
          details: `Gross ${formatEther(netAmount + fee)} HANA; fee ${formatEther(fee)} HANA`,
          timestamp: timestamp || 0,
          explorerUrl: getExplorerTxUrl(event.transactionHash),
        };
      });

      parsed.sort((a, b) => b.timestamp - a.timestamp || b.id.localeCompare(a.id));
      setHistory(parsed);
    } catch (err) {
      console.warn("Could not fetch withdrawal history events:", err);
      setError(err?.message || "Could not load on-chain withdrawal history.");
      setHistory([]);
    } finally {
      setIsLoading(false);
    }
  }, [normalizedAddr, dataRevision]);

  useEffect(() => {
    fetchHistory(false);
  }, [fetchHistory]);

  return {
    history,
    isLoading,
    error,
    refetch: () => fetchHistory(true),
  };
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
  const { dataRevision, isSyncingHistory, syncProgress } =
    useContractLogSyncStatus();

  const isAddrValid = Boolean(address && isAddress(address));
  const normalizedAddr = isAddrValid ? getAddress(address) : null;

  const fetchReferralData = useCallback(async (forceRefresh = false) => {
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
      if (forceRefresh) {
        await syncStakingContractLogs({ forceRecent: true });
      }
      const provider = getReadOnlyProvider();
      const staking = new Contract(
        CONTRACT_ADDRESSES.stakingContract,
        HANA_STAKING_ABI,
        provider
      );

      // 1. Fetch IncomeAllotted where user is normalizedAddr
      const incomeFilter = staking.filters.IncomeAllotted(normalizedAddr);
      // 2. Fetch Registered where referrer is normalizedAddr
      const regFilter = staking.filters.Registered(null, normalizedAddr);

      // First try shared sync store (fast, cached)
      let [incomeEvents, regEvents] = await Promise.all([
        fetchLogsInChunks(staking, incomeFilter, CONTRACT_START_BLOCK).catch(() => []),
        includeRegistrations
          ? fetchLogsInChunks(staking, regFilter, CONTRACT_START_BLOCK).catch(() => [])
          : Promise.resolve([]),
      ]);

      // If sync store returned nothing, fallback to direct RPC scan of last 49999 blocks
      if (incomeEvents.length === 0 || regEvents.length === 0) {
        try {
          const headBlock = await provider.getBlockNumber();
          const tailFrom = Math.max(CONTRACT_START_BLOCK, headBlock - 49999);

          const incomeTopic = await incomeFilter.getTopicFilter();
          const regTopic = await regFilter.getTopicFilter();

          const [rawIncome, rawReg] = await Promise.all([
            incomeEvents.length === 0
              ? provider.getLogs({ address: CONTRACT_ADDRESSES.stakingContract, fromBlock: tailFrom, toBlock: headBlock, topics: incomeTopic }).catch(() => [])
              : Promise.resolve([]),
            (includeRegistrations && regEvents.length === 0)
              ? provider.getLogs({ address: CONTRACT_ADDRESSES.stakingContract, fromBlock: tailFrom, toBlock: headBlock, topics: regTopic }).catch(() => [])
              : Promise.resolve([]),
          ]);

          // Parse raw logs using the staking interface
          if (rawIncome.length > 0 && incomeEvents.length === 0) {
            incomeEvents = rawIncome.flatMap((log) => {
              try {
                const parsed = staking.interface.parseLog(log);
                if (!parsed) return [];
                return [{ ...log, eventName: parsed.name, args: parsed.args, logIndex: log.index ?? log.logIndex ?? 0 }];
              } catch { return []; }
            });
          }
          if (rawReg.length > 0 && regEvents.length === 0) {
            regEvents = rawReg.flatMap((log) => {
              try {
                const parsed = staking.interface.parseLog(log);
                if (!parsed) return [];
                return [{ ...log, eventName: parsed.name, args: parsed.args, logIndex: log.index ?? log.logIndex ?? 0 }];
              } catch { return []; }
            });
          }
        } catch (rpcErr) {
          console.warn("Direct RPC fallback for referral history failed:", rpcErr);
        }
      }

      // Cache block timestamps
      const allEvents = [...incomeEvents, ...regEvents];
      await populateBlockTimestamps(provider, allEvents);

      // Only query receipt/tx as fallback if synced Staked logs haven't populated txStakeCache yet
      const directEvents = incomeEvents.filter((e) => {
        const type = (e.args?.[3] ?? e.args?.incomeType ?? "").toString().toLowerCase();
        return type === "direct";
      });
      const txHashes = [...new Set(directEvents.map((e) => e.transactionHash))];

      await Promise.all(
        txHashes.map(async (hash) => {
          const hashLower = hash.toLowerCase();
          const needStake = !txStakeCache.has(hash) && !txStakeCache.has(hashLower);
          const needSender = !txSenderCache.has(hash);
          if (!needSender && !needStake) return;
          try {
            const [tx, receipt] = await Promise.all([
              needSender ? provider.getTransaction(hash) : Promise.resolve(null),
              needStake ? provider.getTransactionReceipt(hash) : Promise.resolve(null),
            ]);
            if (tx?.from) txSenderCache.set(hash, tx.from);
            if (receipt) {
              const stakedIface = new Interface(
                HANA_STAKING_ABI.filter((x) => x.name === "Staked")
              );
              for (const log of receipt.logs) {
                try {
                  const parsed = stakedIface.parseLog(log);
                  if (parsed?.name === "Staked") {
                    const info = {
                      staker: parsed.args[0],
                      stakeAmount: parsed.args[2],
                      packageId: Number(parsed.args[1]),
                      stakeIndex: Number(parsed.args[3]),
                    };
                    txStakeCache.set(hash, info);
                    txStakeCache.set(hashLower, info);
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
      const parsedIncome = directEvents.map((e) => {
          const usdtWei = e.args?.[1] ?? e.args?.usdtValue ?? 0n;
          const hanaWei = e.args?.[2] ?? e.args?.hanaAllotted ?? 0n;
          const usdtNum = Number(formatEther(usdtWei));
          const hanaNum = Number(formatEther(hanaWei));
          sumUsdt += usdtNum;
          sumHana += hanaNum;

          const timestamp = blockCache.get(e.blockNumber) || null;
          const stakeInfo =
            txStakeCache.get(e.transactionHash) ||
            txStakeCache.get(e.transactionHash.toLowerCase()) ||
            null;
          const stakerAddress =
            stakeInfo?.staker || txSenderCache.get(e.transactionHash) || null;
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
            stakeDisplayId:
              stakeInfo?.stakeIndex !== undefined ? `#S-${stakeInfo.stakeIndex + 1}` : null,
            txHash: e.transactionHash,
            txShort: `${e.transactionHash.slice(0, 8)}...${e.transactionHash.slice(-6)}`,
            blockNumber: e.blockNumber,
            explorerUrl: getExplorerTxUrl(e.transactionHash),
            timestamp,
            dateFormatted: formatEventDate(timestamp, e.blockNumber),
          };
        });

      // Sort newest direct income first
      parsedIncome.sort((a, b) => b.blockNumber - a.blockNumber);

      let totalDirectUsdt = sumUsdt;
      let totalDirectHana = sumHana;
      try {
        const userData = await staking.users(normalizedAddr);
        const onChainDirectUsdt = Number(formatEther(userData.totalDirect ?? userData[3] ?? 0n));
        if (onChainDirectUsdt > 0) totalDirectUsdt = onChainDirectUsdt;
      } catch {}

      setDirectIncomeHistory(parsedIncome);
      setTotalDirectEarnedUsdt(totalDirectUsdt);
      setTotalDirectEarnedHana(totalDirectHana);

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
          dateFormatted: formatEventDate(timestamp, e.blockNumber),
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
  }, [includeRegistrations, normalizedAddr, dataRevision]);

  useEffect(() => {
    fetchReferralData(false);
  }, [fetchReferralData]);

  return {
    directIncomeHistory,
    registeredReferrals,
    totalDirectEarnedUsdt,
    totalDirectEarnedHana,
    isLoading,
    isSyncingHistory,
    syncProgress,
    error,
    refetch: () => fetchReferralData(true),
  };
}

// ─── Level income cache ──────────────────────────────────────────────────────
// addr → { incomeHistory, totalUsdt, totalHana }
const levelIncomeCache = new Map();

export function useLevelIncomeHistory(address) {
  const [incomeHistory, setIncomeHistory] = useState([]);
  const [totalUsdt, setTotalUsdt] = useState(0);
  const [totalHana, setTotalHana] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [fromCache, setFromCache] = useState(false);
  const [error, setError] = useState("");
  const { dataRevision, isSyncingHistory, syncProgress } =
    useContractLogSyncStatus();

  const isAddrValid = Boolean(address && isAddress(address));
  const normalizedAddr = isAddrValid ? getAddress(address) : null;

  const fetchLevelIncomeHistory = useCallback(async (forceRefresh = false) => {
    if (!normalizedAddr) {
      setIncomeHistory([]);
      setTotalUsdt(0);
      setTotalHana(0);
      setError("");
      setFromCache(false);
      setIsLoading(false);
      return;
    }

    const cacheKey = normalizedAddr.toLowerCase();

    // Serve from cache only if it matches the latest synced log revision
    const cachedEntry = levelIncomeCache.get(cacheKey);
    if (!forceRefresh && cachedEntry && cachedEntry.revision === dataRevision) {
      setIncomeHistory(cachedEntry.incomeHistory);
      setTotalUsdt(cachedEntry.totalUsdt);
      setTotalHana(cachedEntry.totalHana);
      setFromCache(true);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setFromCache(false);
    setError("");
    try {
      if (forceRefresh) {
        await syncStakingContractLogs({ forceRecent: true });
      }
      const provider = getReadOnlyProvider();
      const staking = new Contract(
        CONTRACT_ADDRESSES.stakingContract,
        HANA_STAKING_ABI,
        provider,
      );
      const levelFilter = staking.filters.LevelIncomeAllotted(null, normalizedAddr);
      const incomeFilter = staking.filters.IncomeAllotted(normalizedAddr);

      const [levelEvents, incomeEvents] = await Promise.all([
        fetchLogsInChunks(staking, levelFilter, CONTRACT_START_BLOCK),
        fetchLogsInChunks(staking, incomeFilter, CONTRACT_START_BLOCK),
      ]);

      let recentLevelEvents = levelEvents;
      let recentIncomeEvents = incomeEvents;
      if (recentLevelEvents.length === 0 || recentIncomeEvents.length === 0) {
        try {
          const headBlock = await provider.getBlockNumber();
          const tailFrom = Math.max(CONTRACT_START_BLOCK, headBlock - TAIL_BLOCK_SPAN);
          const [rawLevel, rawIncome] = await Promise.all([
            recentLevelEvents.length === 0
              ? provider.getLogs({
                  address: CONTRACT_ADDRESSES.stakingContract,
                  fromBlock: tailFrom,
                  toBlock: headBlock,
                  topics: await levelFilter.getTopicFilter(),
                }).catch(() => [])
              : Promise.resolve([]),
            recentIncomeEvents.length === 0
              ? provider.getLogs({
                  address: CONTRACT_ADDRESSES.stakingContract,
                  fromBlock: tailFrom,
                  toBlock: headBlock,
                  topics: await incomeFilter.getTopicFilter(),
                }).catch(() => [])
              : Promise.resolve([]),
          ]);

          if (rawLevel.length > 0) {
            recentLevelEvents = [
              ...recentLevelEvents,
              ...rawLevel.map((log) => ({
                ...staking.interface.parseLog(log),
                blockNumber: log.blockNumber,
                transactionHash: log.transactionHash,
                logIndex: log.index,
              })),
            ];
          }
          if (rawIncome.length > 0) {
            recentIncomeEvents = [
              ...recentIncomeEvents,
              ...rawIncome.map((log) => ({
                ...staking.interface.parseLog(log),
                blockNumber: log.blockNumber,
                transactionHash: log.transactionHash,
                logIndex: log.index,
              })),
            ];
          }
        } catch {}
      }

      const levelTxSet = new Set(recentLevelEvents.map((e) => e.transactionHash));
      const fallbackLevelIncomeEvents = recentIncomeEvents.filter((event) => {
        const incomeType = (event.args?.[3] ?? event.args?.incomeType ?? "")
          .toString()
          .toLowerCase();
        return incomeType.includes("level") && !levelTxSet.has(event.transactionHash);
      });

      const relevantEvents = [...recentLevelEvents, ...fallbackLevelIncomeEvents];
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
        const roiInfo =
          txRoiClaimCache.get(event.transactionHash) ||
          txRoiClaimCache.get(event.transactionHash.toLowerCase()) ||
          null;
        const resolvedFrom = fromAddress || roiInfo?.claimer || null;
        const roiUsdtNumber = roiInfo ? Number(formatEther(roiInfo.usdtValue || 0n)) : null;
        const roiHanaNumber = roiInfo ? Number(formatEther(roiInfo.hanaAllotted || 0n)) : null;

        sumUsdt += usdtNumber;
        sumHana += hanaNumber;

        return {
          fromAddress: resolvedFrom,
          fromShort: resolvedFrom
            ? `${resolvedFrom.slice(0, 6)}...${resolvedFrom.slice(-4)}`
            : "Network member",
          fromExplorerUrl: resolvedFrom
            ? getExplorerAddressUrl(resolvedFrom)
            : null,
          level,
          usdtNumber,
          hanaNumber,
          usdtFormatted: usdtNumber.toFixed(2),
          hanaFormatted: hanaNumber.toFixed(2),
          // Enriched ROIClaimed details from the same claimROI transaction
          stakeIndex: roiInfo?.stakeIndex ?? null,
          stakeDisplayId:
            roiInfo?.stakeIndex !== undefined ? `#S-${roiInfo.stakeIndex + 1}` : null,
          roiUsdtNumber,
          roiUsdtFormatted: roiUsdtNumber !== null ? roiUsdtNumber.toFixed(2) : null,
          roiHanaNumber,
          roiHanaFormatted: roiHanaNumber !== null ? roiHanaNumber.toFixed(2) : null,
          txHash: event.transactionHash,
          txShort: `${event.transactionHash.slice(0, 8)}...${event.transactionHash.slice(-6)}`,
          blockNumber: event.blockNumber,
          explorerUrl: getExplorerTxUrl(event.transactionHash),
          timestamp,
          dateFormatted: formatEventDate(timestamp, event.blockNumber),
        };
      };

      const parsedPrimary = recentLevelEvents.map((event) =>
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

      let onChainLevelUsdt = sumUsdt;
      try {
        const userData = await staking.users(normalizedAddr);
        const contractLevelUsdt = Number(formatEther(userData.totalLevel ?? userData[4] ?? 0n));
        if (contractLevelUsdt > 0) onChainLevelUsdt = contractLevelUsdt;
      } catch {}

      // Store in cache keyed to current log revision
      levelIncomeCache.set(cacheKey, {
        revision: dataRevision,
        incomeHistory: parsedIncome,
        totalUsdt: onChainLevelUsdt,
        totalHana: sumHana,
      });

      setIncomeHistory(parsedIncome);
      setTotalUsdt(onChainLevelUsdt);
      setTotalHana(sumHana);
      setFromCache(false);
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
  }, [normalizedAddr, dataRevision]);

  useEffect(() => {
    fetchLevelIncomeHistory();
  }, [fetchLevelIncomeHistory]);

  const hardRefetch = useCallback(() => {
    if (normalizedAddr) levelIncomeCache.delete(normalizedAddr.toLowerCase());
    fetchLevelIncomeHistory(true);
  }, [normalizedAddr, fetchLevelIncomeHistory]);

  return {
    incomeHistory,
    totalUsdt,
    totalHana,
    fromCache,
    isLoading,
    isSyncingHistory,
    syncProgress,
    error,
    refetch: hardRefetch,
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
  const { dataRevision } = useContractLogSyncStatus();

  const isAddrValid = Boolean(address && isAddress(address));
  const normalizedAddr = isAddrValid ? getAddress(address) : null;

  const fetchRoiHistory = useCallback(async (forceRefresh = false) => {
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
      if (forceRefresh) {
        await syncStakingContractLogs({ forceRecent: true });
      }
      const provider = getReadOnlyProvider();
      const staking = new Contract(
        CONTRACT_ADDRESSES.stakingContract,
        HANA_STAKING_ABI,
        provider
      );

      const filter = staking.filters.ROIClaimed(normalizedAddr);
      const events = await fetchLogsInChunks(staking, filter, CONTRACT_START_BLOCK).catch(() => []);

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
  }, [normalizedAddr, dataRevision]);

  useEffect(() => {
    fetchRoiHistory(false);
  }, [fetchRoiHistory]);

  return {
    roiHistory,
    totalUsdt,
    totalHana,
    isLoading,
    error,
    refetch: () => fetchRoiHistory(true),
  };
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
const incomeHistoryCache = new Map();

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
  const { dataRevision } = useContractLogSyncStatus();

  const isAddrValid = Boolean(address && isAddress(address));
  const normalizedAddr = isAddrValid ? getAddress(address) : null;

  const fetchAll = useCallback(async (forceRefresh = false) => {
    if (!normalizedAddr) {
      setAllEvents([]); setRoiEvents([]); setDirectEvents([]);
      setLevelEvents([]); setStakingEvents([]);
      setTotals({ roiUsdt: 0, roiHana: 0, directUsdt: 0, directHana: 0, levelUsdt: 0, levelHana: 0, stakedUsdt: 0 });
      setError(""); setIsLoading(false);
      return;
    }

    const cacheKey = normalizedAddr.toLowerCase();
    const cachedEntry = incomeHistoryCache.get(cacheKey);
    if (
      !forceRefresh &&
      cachedEntry &&
      cachedEntry.revision === dataRevision
    ) {
      setAllEvents(cachedEntry.allEvents);
      setRoiEvents(cachedEntry.roiEvents);
      setDirectEvents(cachedEntry.directEvents);
      setLevelEvents(cachedEntry.levelEvents);
      setStakingEvents(cachedEntry.stakingEvents);
      setTotals(cachedEntry.totals);
      setError("");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      if (forceRefresh) {
        await syncStakingContractLogs({ forceRecent: true });
      }

      const provider = getReadOnlyProvider();
      const staking = new Contract(CONTRACT_ADDRESSES.stakingContract, HANA_STAKING_ABI, provider);

      const fromBlock = Math.max(0, CONTRACT_START_BLOCK);
      const currentBlock = Number.MAX_SAFE_INTEGER;

      // Fire all 4 event queries from shared hybrid sync store
      const [roiEvts, incomeEvts, levelEvts, stakedEvts] = await Promise.all([
        fetchLogsInChunks(staking, staking.filters.ROIClaimed(normalizedAddr), fromBlock, currentBlock),
        fetchLogsInChunks(staking, staking.filters.IncomeAllotted(normalizedAddr), fromBlock, currentBlock),
        fetchLogsInChunks(staking, staking.filters.LevelIncomeAllotted(null, normalizedAddr), fromBlock, currentBlock),
        fetchLogsInChunks(staking, staking.filters.Staked(normalizedAddr), fromBlock, currentBlock),
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

      const nextTotals = {
        roiUsdt: roiUsdtSum,
        roiHana: roiHanaSum,
        directUsdt: directUsdtSum,
        directHana: directHanaSum,
        levelUsdt: levelUsdtSum,
        levelHana: levelHanaSum,
        stakedUsdt: stakedUsdtSum,
      };
      incomeHistoryCache.set(cacheKey, {
        revision: logSyncStore.dataRevision,
        allEvents: unified,
        roiEvents: parsedRoi,
        directEvents: parsedDirect,
        levelEvents: parsedLevel,
        stakingEvents: parsedStaked,
        totals: nextTotals,
      });
      setRoiEvents(parsedRoi);
      setDirectEvents(parsedDirect);
      setLevelEvents(parsedLevel);
      setStakingEvents(parsedStaked);
      setAllEvents(unified);
      setTotals(nextTotals);
    } catch (err) {
      console.warn("Could not fetch income history:", err);
      setError(err instanceof Error ? err.message : "Could not load income history.");
    } finally {
      setIsLoading(false);
    }
  }, [normalizedAddr, dataRevision]);

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
    refetch: () => fetchAll(true),
  };
}

/**
 * My Team hook — fetches all direct downline members (registered under my address)
 * and enriches each with their on-chain business data:
 *   - totalStaked (from users() mapping)
 *   - total staking count + last stake date (from Staked events)
 *   - registration date (from Registered event block timestamp)
 */
export function useMyTeam(address) {
  const [members, setMembers] = useState([]);
  const [totalTeamBusiness, setTotalTeamBusiness] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { dataRevision } = useContractLogSyncStatus();

  const isAddrValid = Boolean(address && isAddress(address));
  const normalizedAddr = isAddrValid ? getAddress(address) : null;

  const fetchTeam = useCallback(async () => {
    if (!normalizedAddr) {
      setMembers([]);
      setTotalTeamBusiness(0);
      setError("");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const provider = getReadOnlyProvider();
      const staking = new Contract(CONTRACT_ADDRESSES.stakingContract, HANA_STAKING_ABI, provider);

      const fromBlock = Math.max(0, CONTRACT_START_BLOCK);
      const currentBlock = Number.MAX_SAFE_INTEGER;

      // 1. Fetch all Registered events where referrer == my address
      const regFilter = staking.filters.Registered(null, normalizedAddr);
      const regEvents = await fetchLogsInChunks(staking, regFilter, fromBlock, currentBlock).catch(() => []);

      if (regEvents.length === 0) {
        setMembers([]);
        setTotalTeamBusiness(0);
        setIsLoading(false);
        return;
      }

      // Cache block timestamps for registration events
      const regBlockNums = [...new Set(regEvents.map((e) => e.blockNumber))];
      await Promise.all(
        regBlockNums.map(async (bNum) => {
          if (!blockCache.has(bNum)) {
            try {
              const b = await provider.getBlock(bNum);
              if (b?.timestamp) blockCache.set(bNum, Number(b.timestamp));
            } catch {}
          }
        })
      );

      // 2. Get unique member addresses
      const memberAddresses = [
        ...new Set(
          regEvents
            .map((e) => e.args?.[0] ?? e.args?.user)
            .filter(Boolean)
            .map((a) => getAddress(a))
        ),
      ];

      // 3. For each member: fetch users() data + their Staked events — in parallel batches
      const BATCH = 5; // max concurrent RPC calls
      const enriched = [];

      for (let i = 0; i < memberAddresses.length; i += BATCH) {
        const batch = memberAddresses.slice(i, i + BATCH);

        const batchResults = await Promise.all(
          batch.map(async (memberAddr) => {
            // Find registration event for this member
            const regEv = regEvents.find(
              (e) => e.args?.[0] && getAddress(e.args[0]) === memberAddr
            );
            const regTimestamp = regEv ? blockCache.get(regEv.blockNumber) || null : null;

            // Fetch user contract data + staked events in parallel
            const [userData, stakedEvts] = await Promise.allSettled([
              staking.users(memberAddr),
              fetchLogsInChunks(
                staking,
                staking.filters.Staked(memberAddr),
                fromBlock,
                currentBlock
              ).catch(() => []),
            ]);

            // Parse users() struct
            let totalStakedWei = 0n;
            let isDAO = false;
            if (userData.status === "fulfilled" && userData.value) {
              const d = userData.value;
              totalStakedWei = d.totalStaked ?? d[1] ?? 0n;
              isDAO = Boolean(d.isDAO ?? d[14]);
            }
            const totalStakedNum = Number(formatEther(totalStakedWei));

            // Parse Staked events
            let stakeCount = 0;
            let lastStakeTimestamp = null;
            let lastStakeAmount = null;
            let lastPackageName = null;

            if (stakedEvts.status === "fulfilled" && stakedEvts.value.length > 0) {
              const evts = stakedEvts.value;
              stakeCount = evts.length;

              // Cache timestamps for stake events
              const stakeBlocks = [...new Set(evts.map((e) => e.blockNumber))];
              await Promise.all(
                stakeBlocks.map(async (bNum) => {
                  if (!blockCache.has(bNum)) {
                    try {
                      const b = await provider.getBlock(bNum);
                      if (b?.timestamp) blockCache.set(bNum, Number(b.timestamp));
                    } catch {}
                  }
                })
              );

              // Last stake = highest block number
              const lastEv = evts.reduce((a, b) =>
                a.blockNumber > b.blockNumber ? a : b
              );
              lastStakeTimestamp = blockCache.get(lastEv.blockNumber) || null;
              const lastAmtWei = lastEv.args?.[2] ?? lastEv.args?.amount ?? 0n;
              lastStakeAmount = Number(formatEther(lastAmtWei));
              const lastPkgId = Number(lastEv.args?.[1] ?? lastEv.args?.packageId ?? 0);
              const pkg = DEFAULT_PACKAGES.find((p) => p.id === lastPkgId);
              lastPackageName = pkg?.name ?? `Package #${lastPkgId}`;
            }

            const fmtDate = (ts) =>
              ts
                ? new Date(ts * 1000).toLocaleString("en-US", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })
                : null;

            return {
              address: memberAddr,
              addressShort: `${memberAddr.slice(0, 6)}...${memberAddr.slice(-4)}`,
              explorerUrl: getExplorerAddressUrl(memberAddr),
              isDAO,
              // Registration
              joinedTimestamp: regTimestamp,
              joinedFormatted: fmtDate(regTimestamp) ?? "—",
              regTxHash: regEv?.transactionHash ?? null,
              regTxShort: regEv
                ? `${regEv.transactionHash.slice(0, 8)}...${regEv.transactionHash.slice(-6)}`
                : null,
              regExplorerUrl: regEv ? getExplorerTxUrl(regEv.transactionHash) : null,
              // Business
              totalStaked: totalStakedWei,
              totalStakedFormatted: totalStakedNum.toFixed(2),
              totalStakedNum,
              stakeCount,
              lastStakeTimestamp,
              lastStakeFormatted: fmtDate(lastStakeTimestamp) ?? "—",
              lastStakeAmount,
              lastStakeAmountFormatted:
                lastStakeAmount !== null ? lastStakeAmount.toFixed(2) : null,
              lastPackageName,
            };
          })
        );

        enriched.push(...batchResults);
      }

      // Sort by total staked desc
      enriched.sort((a, b) => b.totalStakedNum - a.totalStakedNum);

      const totalBusiness = enriched.reduce((sum, m) => sum + m.totalStakedNum, 0);
      setMembers(enriched);
      setTotalTeamBusiness(totalBusiness);
    } catch (err) {
      console.warn("Could not fetch team data:", err);
      setError(err instanceof Error ? err.message : "Could not load team data.");
    } finally {
      setIsLoading(false);
    }
  }, [normalizedAddr, dataRevision]);

  useEffect(() => {
    fetchTeam();
  }, [fetchTeam]);

  return { members, totalTeamBusiness, isLoading, error, refetch: fetchTeam };
}

/**
 * useTeamByLevel — BFS tree traversal up to MAX_LEVEL (20) depth.
 *
 * Strategy:
 *  - Level 1 = wallets registered directly under `address` (Registered(null, address))
 *  - Level 2 = wallets registered under each Level-1 member
 *  - ... and so on up to level 20.
 *
 * To avoid re-fetching the same address twice (diamond referrals), we keep
 * a global `visited` Set.
 *
 * Returns:
 *   levelMap   — Map<levelNumber, MemberInfo[]>
 *   allMembers — flat array with { ...memberInfo, level }
 *   levelStats — array of { level, count, totalBusiness } for all 20 levels
 *   isLoading / error / refetch
 */
const MAX_LEVEL = 20;

// ─── Team caches (module-level, persist for browser session) ───────────────
// childrenCache: parentAddr → { children: addr[], evts: LogEvent[] }
const teamChildrenCache  = new Map();
// memberDataCache: memberAddr → enriched member data object (without level/reg)
const teamMemberDataCache = new Map();
// resultCache: rootAddr → { levelMap, allMembers, levelStats } — full BFS result
const teamResultCache    = new Map();

export function useTeamByLevel(address) {
  const [levelMap, setLevelMap]     = useState(new Map());
  const [allMembers, setAllMembers] = useState([]);
  const [levelStats, setLevelStats] = useState([]);
  const [isLoading, setIsLoading]   = useState(false);
  const [error, setError]           = useState("");

  // Track if we imported from cache so UI shows instantly
  const [fromCache, setFromCache]   = useState(false);
  const { dataRevision }            = useContractLogSyncStatus();

  const isAddrValid    = Boolean(address && isAddress(address));
  const normalizedAddr = isAddrValid ? getAddress(address) : null;

  const fetchTree = useCallback(async (forceRefresh = false) => {
    if (!normalizedAddr) {
      setLevelMap(new Map());
      setAllMembers([]);
      setLevelStats([]);
      setError("");
      setIsLoading(false);
      setFromCache(false);
      return;
    }

    const cacheKey = normalizedAddr.toLowerCase();

    // ── Serve from result cache immediately only if same log sync revision ──
    const cachedTree = teamResultCache.get(cacheKey);
    if (!forceRefresh && cachedTree && cachedTree.revision === dataRevision) {
      setLevelMap(cachedTree.levelMap);
      setAllMembers(cachedTree.allMembers);
      setLevelStats(cachedTree.levelStats);
      setFromCache(true);
      setIsLoading(false);
      return;
    }
    teamChildrenCache.clear();

    setIsLoading(true);
    setFromCache(false);
    setError("");

    try {
      const provider   = getReadOnlyProvider();
      const staking    = new Contract(CONTRACT_ADDRESSES.stakingContract, HANA_STAKING_ABI, provider);

      const fromBlock    = Math.max(0, CONTRACT_START_BLOCK);
      const currentBlock = Number.MAX_SAFE_INTEGER;

      // ── Helper 1: get direct children of a set of parents ──────────────────
      // Uses teamChildrenCache to avoid re-querying same parent address
      const getChildrenOfSet = async (parentAddrs) => {
        const childMap = new Map();
        const uncached = parentAddrs.filter((p) => !teamChildrenCache.has(p.toLowerCase()));

        // Fetch only uncached parents (8 concurrent)
        const BATCH = 8;
        for (let i = 0; i < uncached.length; i += BATCH) {
          const slice   = uncached.slice(i, i + BATCH);
          const results = await Promise.all(
            slice.map(async (parent) => {
              try {
                const filter   = staking.filters.Registered(null, parent);
                let evts = await fetchLogsInChunks(staking, filter, fromBlock, currentBlock).catch(() => []);

                if (evts.length === 0) {
                  try {
                    const headBlock = await provider.getBlockNumber();
                    const tailFrom = Math.max(CONTRACT_START_BLOCK, headBlock - TAIL_BLOCK_SPAN);
                    const topics = await filter.getTopicFilter();
                    const raw = await provider.getLogs({
                      address: CONTRACT_ADDRESSES.stakingContract,
                      fromBlock: tailFrom,
                      toBlock: headBlock,
                      topics,
                    });
                    evts = raw.map((log) => ({
                      ...staking.interface.parseLog(log),
                      blockNumber: log.blockNumber,
                      transactionHash: log.transactionHash,
                      logIndex: log.index,
                    }));
                  } catch {
                    evts = [];
                  }
                }
                const children = evts
                  .map((e) => e.args?.[0] ?? e.args?.user)
                  .filter(Boolean)
                  .map((a) => getAddress(a));
                return { parent, children, evts };
              } catch {
                return { parent, children: [], evts: [] };
              }
            })
          );
          for (const { parent, children, evts } of results) {
            teamChildrenCache.set(parent.toLowerCase(), { children, evts });
          }
        }

        // Build result from cache (now all parents are cached)
        for (const parent of parentAddrs) {
          const cached = teamChildrenCache.get(parent.toLowerCase()) ?? { children: [], evts: [] };
          childMap.set(parent, cached);
        }
        return childMap;
      };

      // ── Helper 2: enrich addresses with business data ───────────────────────
      // Uses teamMemberDataCache to skip already-fetched addresses
      const enrichAddresses = async (addrs) => {
        const uncached = addrs.filter((a) => !teamMemberDataCache.has(a.toLowerCase()));

        const BATCH = 5;
        for (let i = 0; i < uncached.length; i += BATCH) {
          const slice = uncached.slice(i, i + BATCH);
          const batch = await Promise.all(
            slice.map(async (memberAddr) => {
              const [userData, stakedEvts] = await Promise.allSettled([
                staking.users(memberAddr),
                fetchLogsInChunks(
                  staking,
                  staking.filters.Staked(memberAddr),
                  fromBlock,
                  currentBlock
                ).catch(() => []),
              ]);

              let totalStakedWei = 0n, isDAO = false;
              if (userData.status === "fulfilled" && userData.value) {
                const d        = userData.value;
                totalStakedWei = d.totalStaked ?? d[1] ?? 0n;
                isDAO          = Boolean(d.isDAO ?? d[14]);
              }
              const totalStakedNum = Number(formatEther(totalStakedWei));

              let stakeCount = 0, lastStakeTimestamp = null, lastStakeAmount = null, lastPackageName = null;
              if (stakedEvts.status === "fulfilled" && stakedEvts.value.length > 0) {
                const evts  = stakedEvts.value;
                stakeCount  = evts.length;

                const blks = [...new Set(evts.map((e) => e.blockNumber))];
                await Promise.all(blks.map(async (bNum) => {
                  if (!blockCache.has(bNum)) {
                    try {
                      const b = await provider.getBlock(bNum);
                      if (b?.timestamp) blockCache.set(bNum, Number(b.timestamp));
                    } catch {}
                  }
                }));

                const lastEv       = evts.reduce((a, b) => a.blockNumber > b.blockNumber ? a : b);
                lastStakeTimestamp = blockCache.get(lastEv.blockNumber) || null;
                const lastAmtWei   = lastEv.args?.[2] ?? lastEv.args?.amount ?? 0n;
                lastStakeAmount    = Number(formatEther(lastAmtWei));
                const lastPkgId    = Number(lastEv.args?.[1] ?? lastEv.args?.packageId ?? 0);
                lastPackageName    = DEFAULT_PACKAGES.find((p) => p.id === lastPkgId)?.name ?? `Package #${lastPkgId}`;
              }

              const fmtDate = (ts) =>
                ts
                  ? new Date(ts * 1000).toLocaleString("en-US", {
                      day: "2-digit", month: "short", year: "numeric",
                    })
                  : null;

              const memberData = {
                address:                 memberAddr,
                addressShort:            `${memberAddr.slice(0, 6)}...${memberAddr.slice(-4)}`,
                explorerUrl:             getExplorerAddressUrl(memberAddr),
                isDAO,
                totalStaked:             totalStakedWei,
                totalStakedFormatted:    totalStakedNum.toFixed(2),
                totalStakedNum,
                stakeCount,
                lastStakeTimestamp,
                lastStakeFormatted:          fmtDate(lastStakeTimestamp) ?? "—",
                lastStakeAmount,
                lastStakeAmountFormatted: lastStakeAmount !== null ? lastStakeAmount.toFixed(2) : null,
                lastPackageName,
              };

              // Store in member cache
              teamMemberDataCache.set(memberAddr.toLowerCase(), memberData);
              return memberData;
            })
          );
        }

        // Return all (cached + newly fetched)
        return addrs.map(
          (a) => teamMemberDataCache.get(a.toLowerCase()) ?? { address: a, totalStakedNum: 0, stakeCount: 0 }
        );
      };

      // ── BFS traversal ───────────────────────────────────────────────────────
      const visited      = new Set([normalizedAddr.toLowerCase()]);
      const newLevelMap  = new Map();
      const flatAll      = [];

      let currentParents = [normalizedAddr];

      for (let level = 1; level <= MAX_LEVEL; level++) {
        const childrenMap = await getChildrenOfSet(currentParents);

        const childAddrs  = [];
        const regEventMap = new Map();

        for (const [, { children, evts }] of childrenMap) {
          for (let ci = 0; ci < children.length; ci++) {
            const child     = children[ci].toLowerCase();
            const childNorm = getAddress(children[ci]);
            if (!visited.has(child)) {
              visited.add(child);
              childAddrs.push(childNorm);
              if (evts[ci]) regEventMap.set(childNorm, evts[ci]);
            }
          }
        }

        if (childAddrs.length === 0) break;

        // Cache reg block timestamps
        const regBlocks = [...new Set([...regEventMap.values()].map((e) => e.blockNumber))];
        await Promise.all(regBlocks.map(async (bNum) => {
          if (!blockCache.has(bNum)) {
            try {
              const b = await provider.getBlock(bNum);
              if (b?.timestamp) blockCache.set(bNum, Number(b.timestamp));
            } catch {}
          }
        }));

        const enriched = await enrichAddresses(childAddrs);

        const withReg = enriched.map((m) => {
          const regEv        = regEventMap.get(m.address) || null;
          const regTimestamp = regEv ? (blockCache.get(regEv.blockNumber) || null) : null;
          const sponsorAddr  = regEv ? (regEv.args?.[1] ?? regEv.args?.referrer ?? null) : null;
          const sponsor      = sponsorAddr ? getAddress(sponsorAddr) : null;
          const fmtDate = (ts) =>
            ts
              ? new Date(ts * 1000).toLocaleString("en-US", {
                  day: "2-digit", month: "short", year: "numeric",
                })
              : null;
          return {
            ...m,
            level,
            joinedTimestamp: regTimestamp,
            joinedFormatted: fmtDate(regTimestamp) ?? "—",
            regTxHash:       regEv?.transactionHash ?? null,
            regTxShort:      regEv
              ? `${regEv.transactionHash.slice(0, 8)}...${regEv.transactionHash.slice(-6)}`
              : null,
            regExplorerUrl:  regEv ? getExplorerTxUrl(regEv.transactionHash) : null,
            // Sponsor (referrer) data from Registered event args[1]
            sponsor,
            sponsorShort:       sponsor ? `${sponsor.slice(0, 6)}...${sponsor.slice(-4)}` : null,
            sponsorExplorerUrl: sponsor ? getExplorerAddressUrl(sponsor) : null,
          };
        });

        newLevelMap.set(level, withReg);
        flatAll.push(...withReg);
        currentParents = childAddrs;
      }

      const stats = Array.from({ length: MAX_LEVEL }, (_, i) => {
        const lvl     = i + 1;
        const mems    = newLevelMap.get(lvl) ?? [];
        return {
          level:         lvl,
          count:         mems.length,
          totalBusiness: mems.reduce((s, m) => s + m.totalStakedNum, 0),
        };
      });

      // ── Store full result in result cache ────────────────────────────────────
      teamResultCache.set(cacheKey, {
        revision: dataRevision,
        levelMap: newLevelMap,
        allMembers: flatAll,
        levelStats: stats,
      });

      setLevelMap(newLevelMap);
      setAllMembers(flatAll);
      setLevelStats(stats);
      setFromCache(false);
    } catch (err) {
      console.warn("useTeamByLevel error:", err);
      setError(err instanceof Error ? err.message : "Could not load team levels.");
    } finally {
      setIsLoading(false);
    }
  }, [normalizedAddr, dataRevision]);

  // On mount / address change — serve cache first, then background refresh
  useEffect(() => {
    fetchTree(false);
  }, [fetchTree]);

  // Manual refetch clears result cache for this address so fresh data is fetched
  const hardRefetch = useCallback(() => {
    if (normalizedAddr) {
      teamResultCache.delete(normalizedAddr.toLowerCase());
      // Also clear member-level caches so stale business data is re-fetched
      teamChildrenCache.clear();
      teamMemberDataCache.clear();
    }
    fetchTree(true);
  }, [normalizedAddr, fetchTree]);

  return { levelMap, allMembers, levelStats, fromCache, isLoading, error, refetch: hardRefetch };
}

/**
 * Pure helper to compute Strong Leg, Weak Legs, Matching Business, and per-leg breakdown
 * from decoded Registered + Staked contract events.
 */
export function computeTeamLegBusiness(
  events,
  rootAddress,
  timestampLookup = null,
  overrideSelfContribution = 0
) {
  if (!rootAddress || !isAddress(rootAddress)) {
    const emptyRankStatus = calculateUserRankStatus({
      selfContribution: 0,
      directTeam: 0,
      matchingBusiness: 0,
    });
    return {
      legs: [],
      strongLeg: null,
      weakLegs: [],
      strongLegBusiness: 0,
      weakLegBusiness: 0,
      totalTeamBusiness: 0,
      matchingBusiness: 0,
      activeLegsCount: 0,
      totalLegsCount: 0,
      qualifiedTwoLegs: false,
      strongLegRatioPct: 0,
      weakLegRatioPct: 0,
      selfContribution: 0,
      ...emptyRankStatus,
    };
  }

  const rootNormalized = getAddress(rootAddress);
  const rootLower = rootNormalized.toLowerCase();

  const seenChildren = new Set();
  const childrenByReferrer = new Map();
  const stakeStatsByUser = new Map();

  for (const ev of events || []) {
    if (ev.eventName === "Registered") {
      const rawUser = ev.args?.[0] ?? ev.args?.user;
      const rawReferrer = ev.args?.[1] ?? ev.args?.referrer;
      if (!rawUser || !rawReferrer || !isAddress(rawUser) || !isAddress(rawReferrer)) {
        continue;
      }
      const userAddr = getAddress(rawUser);
      const refAddr = getAddress(rawReferrer);
      const userLower = userAddr.toLowerCase();
      const refLower = refAddr.toLowerCase();
      if (userLower === refLower || seenChildren.has(userLower)) continue;
      seenChildren.add(userLower);

      if (!childrenByReferrer.has(refLower)) {
        childrenByReferrer.set(refLower, []);
      }
      childrenByReferrer.get(refLower).push({
        address: userAddr,
        txHash: ev.transactionHash,
        blockNumber: ev.blockNumber,
      });
    } else if (ev.eventName === "Staked") {
      const rawUser = ev.args?.[0] ?? ev.args?.user;
      if (!rawUser || !isAddress(rawUser)) continue;
      const userLower = getAddress(rawUser).toLowerCase();
      const amountWei = ev.args?.[2] ?? ev.args?.amount ?? 0n;
      const prev = stakeStatsByUser.get(userLower) || {
        totalStakedWei: 0n,
        stakeCount: 0,
      };
      stakeStatsByUser.set(userLower, {
        totalStakedWei: prev.totalStakedWei + amountWei,
        stakeCount: prev.stakeCount + 1,
      });
    }
  }

  const directChildren = childrenByReferrer.get(rootLower) || [];

  const rawLegs = directChildren.map((child) => {
    const childLower = child.address.toLowerCase();
    const directStats = stakeStatsByUser.get(childLower) || {
      totalStakedWei: 0n,
      stakeCount: 0,
    };

    const visited = new Set([rootLower, childLower]);
    const queue = [...(childrenByReferrer.get(childLower) || [])];
    let downlineWei = 0n;
    let downlineMembers = 0;
    let activeDownlineMembers = 0;

    while (queue.length > 0) {
      const member = queue.shift();
      const memberLower = member.address.toLowerCase();
      if (visited.has(memberLower)) continue;
      visited.add(memberLower);

      downlineMembers += 1;
      const memberStats = stakeStatsByUser.get(memberLower);
      if (memberStats && memberStats.totalStakedWei > 0n) {
        downlineWei += memberStats.totalStakedWei;
        activeDownlineMembers += 1;
      }

      const subChildren = childrenByReferrer.get(memberLower) || [];
      for (const sub of subChildren) {
        if (!visited.has(sub.address.toLowerCase())) {
          queue.push(sub);
        }
      }
    }

    const directStaked = Number(formatEther(directStats.totalStakedWei));
    const teamStaked = Number(formatEther(downlineWei));
    const totalLegBusiness = directStaked + teamStaked;
    const directIsActive = directStats.totalStakedWei > 0n ? 1 : 0;
    const memberCount = 1 + downlineMembers;
    const activeMemberCount = directIsActive + activeDownlineMembers;
    const timestamp = timestampLookup ? timestampLookup.get(child.blockNumber) || null : null;

    // Calculate matching business for this direct leg to determine its rank
    const childDirects = childrenByReferrer.get(childLower) || [];
    let childMatchingBusiness = 0;
    if (childDirects.length >= 2) {
      const subLegSums = childDirects
        .map((sc) => {
          const scLower = sc.address.toLowerCase();
          let subSum = stakeStatsByUser.get(scLower)?.totalStakedWei || 0n;
          const subVis = new Set([rootLower, childLower, scLower]);
          const subQ = [...(childrenByReferrer.get(scLower) || [])];
          while (subQ.length > 0) {
            const m = subQ.shift();
            const ml = m.address.toLowerCase();
            if (subVis.has(ml)) continue;
            subVis.add(ml);
            subSum += stakeStatsByUser.get(ml)?.totalStakedWei || 0n;
            const deeper = childrenByReferrer.get(ml) || [];
            for (const d of deeper) {
              if (!subVis.has(d.address.toLowerCase())) subQ.push(d);
            }
          }
          return Number(formatEther(subSum));
        })
        .sort((a, b) => b - a);

      const strongSub = subLegSums[0] || 0;
      const weakSub = subLegSums.slice(1).reduce((s, x) => s + x, 0);
      childMatchingBusiness = Math.min(strongSub, weakSub);
    }

    const legRankStatus = calculateUserRankStatus({
      selfContribution: directStaked,
      directTeam: childDirects.length,
      matchingBusiness: childMatchingBusiness,
    });

    return {
      address: child.address,
      addressShort: `${child.address.slice(0, 6)}...${child.address.slice(-4)}`,
      explorerUrl: getExplorerAddressUrl(child.address),
      regTxHash: child.txHash,
      regTxShort: child.txHash
        ? `${child.txHash.slice(0, 8)}...${child.txHash.slice(-6)}`
        : null,
      regExplorerUrl: child.txHash ? getExplorerTxUrl(child.txHash) : null,
      blockNumber: child.blockNumber,
      timestamp,
      joinedFormatted: formatEventDate(timestamp, child.blockNumber),
      directStaked,
      directStakedFormatted: directStaked.toFixed(2),
      teamStaked,
      teamStakedFormatted: teamStaked.toFixed(2),
      totalLegBusiness,
      totalLegBusinessFormatted: totalLegBusiness.toFixed(2),
      stakeCount: directStats.stakeCount,
      memberCount,
      downlineMembers,
      activeMemberCount,
      isActiveLeg: totalLegBusiness > 0,
      rankId: legRankStatus.currentRankId,
      rankName: legRankStatus.currentRankName,
    };
  });

  rawLegs.sort((a, b) => {
    if (b.totalLegBusiness !== a.totalLegBusiness) {
      return b.totalLegBusiness - a.totalLegBusiness;
    }
    if (b.activeMemberCount !== a.activeMemberCount) {
      return b.activeMemberCount - a.activeMemberCount;
    }
    return b.memberCount - a.memberCount;
  });

  const totalTeamBusiness = rawLegs.reduce((sum, l) => sum + l.totalLegBusiness, 0);
  const legs = rawLegs.map((leg, index) => ({
    ...leg,
    rankOrder: index + 1,
    legRole: index === 0 ? "Strong Leg" : "Weak Leg",
    sharePct:
      totalTeamBusiness > 0 ? (leg.totalLegBusiness / totalTeamBusiness) * 100 : 0,
  }));

  const strongLeg = legs[0] || null;
  const weakLegs = legs.slice(1);
  const strongLegBusiness = strongLeg ? strongLeg.totalLegBusiness : 0;
  const weakLegBusiness = weakLegs.reduce((sum, l) => sum + l.totalLegBusiness, 0);
  const matchingBusiness = Math.min(strongLegBusiness, weakLegBusiness);
  const activeLegsCount = legs.filter((l) => l.isActiveLeg).length;

  const legHighestRankIds = legs.map((l) => l.rankId || 0);
  const rootStats = stakeStatsByUser.get(rootLower);
  const eventSelfContribution = rootStats
    ? Number(formatEther(rootStats.totalStakedWei))
    : 0;
  const finalSelfContribution = Math.max(
    eventSelfContribution,
    Number(overrideSelfContribution || 0)
  );

  const rankStatus = calculateUserRankStatus({
    selfContribution: finalSelfContribution,
    directTeam: legs.length,
    matchingBusiness,
    legHighestRankIds,
  });

  return {
    legs,
    strongLeg,
    weakLegs,
    strongLegBusiness,
    weakLegBusiness,
    totalTeamBusiness,
    matchingBusiness,
    activeLegsCount,
    totalLegsCount: legs.length,
    qualifiedTwoLegs: activeLegsCount >= 2,
    strongLegRatioPct:
      totalTeamBusiness > 0 ? (strongLegBusiness / totalTeamBusiness) * 100 : 0,
    weakLegRatioPct:
      totalTeamBusiness > 0 ? (weakLegBusiness / totalTeamBusiness) * 100 : 0,
    selfContribution: finalSelfContribution,
    ...rankStatus,
  };
}

/**
 * Compute Strong Leg vs Weak Leg business breakdown for Rank Incentives from event logs
 */
export function useTeamLegBusiness(address, { selfContribution: overrideSelfContribution } = {}) {
  const [data, setData] = useState(() =>
    computeTeamLegBusiness([], null, null, overrideSelfContribution)
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { dataRevision, isSyncingHistory, syncProgress } =
    useContractLogSyncStatus();

  const isAddrValid = Boolean(address && isAddress(address));
  const normalizedAddr = isAddrValid ? getAddress(address) : null;

  const fetchLegBusiness = useCallback(
    async (forceRefresh = false) => {
      if (!normalizedAddr) {
        setData(computeTeamLegBusiness([], null, null, overrideSelfContribution));
        setError("");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError("");
      try {
        const events = await syncStakingContractLogs({
          forceRecent: forceRefresh,
        });

        const directRegEvents = events.filter(
          (ev) =>
            ev.eventName === "Registered" &&
            ev.args?.[1] &&
            isAddress(ev.args[1]) &&
            getAddress(ev.args[1]).toLowerCase() === normalizedAddr.toLowerCase()
        );
        if (directRegEvents.length > 0) {
          await populateBlockTimestamps(getReadOnlyProvider(), directRegEvents);
        }

        const computed = computeTeamLegBusiness(
          events,
          normalizedAddr,
          blockCache,
          overrideSelfContribution
        );
        setData(computed);
      } catch (err) {
        console.warn("Could not compute team leg business:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Could not calculate strong leg & weak leg business."
        );
      } finally {
        setIsLoading(false);
      }
    },
    [normalizedAddr, dataRevision, overrideSelfContribution]
  );

  useEffect(() => {
    fetchLegBusiness(false);
  }, [fetchLegBusiness]);

  return {
    ...data,
    isLoading,
    isSyncingHistory,
    syncProgress,
    error,
    refetch: () => fetchLegBusiness(true),
  };
}
