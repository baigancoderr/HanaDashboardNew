import React, { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useAppKit, useAppKitAccount, useAppKitProvider } from "@reown/appkit/react";
import { ethers } from "ethers";
import { BSC, CONTRACTS, DEFAULT_SPONSOR } from "../config/contracts";
import { setActiveWalletProvider, clearActiveWalletProvider } from "../services/walletProvider";
import * as hanaService from "../services/hanaContract";

export const Web3Context = createContext(null);

export function useWeb3() {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error("useWeb3 must be used within a Web3Provider");
  }
  return context;
}

export function Web3Provider({ children }) {
  const { open } = useAppKit();
  const { address, isConnected } = useAppKitAccount({ namespace: "eip155" });
  const { walletProvider } = useAppKitProvider("eip155");

  // Sync wallet provider into proxy service
  useEffect(() => {
    if (walletProvider) {
      setActiveWalletProvider(walletProvider);
    } else {
      clearActiveWalletProvider();
    }
  }, [walletProvider]);

  // Balances
  const [hanaBalance, setHanaBalance] = useState("0.00");
  const [usdtBalance, setUsdtBalance] = useState("0.00");
  const [bnbBalance, setBnbBalance] = useState("0.00");
  const [hanaPrice, setHanaPrice] = useState("0.00");
  const [hanaReserves, setHanaReserves] = useState({ usdtReserve: "0", hanaReserve: "0", price: "0" });

  // User contract data
  const [isRegistered, setIsRegistered] = useState(false);
  const [referrer, setReferrer] = useState(ethers.ZeroAddress);
  const [totalStaked, setTotalStaked] = useState("0.00");
  const [totalDirectIncome, setTotalDirectIncome] = useState("0.00");
  const [totalLevelIncome, setTotalLevelIncome] = useState("0.00");
  const [totalRankIncome, setTotalRankIncome] = useState("0.00");
  const [totalWithdrawn, setTotalWithdrawn] = useState("0.00");
  const [lastWithdrawalTime, setLastWithdrawalTime] = useState(0);
  const [firstStakeTime, setFirstStakeTime] = useState(0);
  const [isDAO, setIsDAO] = useState(false);
  const [daoJoinTime, setDaoJoinTime] = useState(0);
  const [daoEndTime, setDaoEndTime] = useState(0);

  // User stakes & ROI
  const [userStakes, setUserStakes] = useState([]);
  const [totalPendingROI, setTotalPendingROI] = useState("0.00");
  const [packages, setPackages] = useState([]);
  const [daoMemberCount, setDaoMemberCount] = useState(null);
  const [maxDaoMembers, setMaxDaoMembers] = useState(null);
  const [withdrawalConfig, setWithdrawalConfig] = useState(null);

  // Status & notifications
  const [isLoading, setIsLoading] = useState(true);
  const hasLoadedAddress = useRef(false);
  const [isTransacting, setIsTransacting] = useState(false);
  const [txMessage, setTxMessage] = useState("");
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = "info") => {
    setToast({ message, type });
    window.setTimeout(() => setToast(null), 4000);
  }, []);

  // Fetch all user and protocol data from contract
  const refreshData = useCallback(async () => {
    const shouldShowLoading =
      !hasLoadedAddress.current || hasLoadedAddress.current !== (address || null);

    try {
      if (shouldShowLoading) setIsLoading(true);

      // 1. Fetch protocol data
      try {
        const [price, reserves, daoCount, daoMax, packageList, withdrawalRules] = await Promise.allSettled([
          hanaService.getHanaPrice(),
          hanaService.getHanaReserves(),
          hanaService.getDaoMemberCount(),
          hanaService.getMaxDaoMembers(),
          hanaService.getAllPackages(),
          hanaService.getWithdrawalConfig(),
        ]);

        if (price.status === "fulfilled") setHanaPrice(price.value);
        if (reserves.status === "fulfilled") setHanaReserves(reserves.value);
        if (daoCount.status === "fulfilled") {
          setDaoMemberCount(daoCount.value);
        } else {
          console.warn("Unable to load DAO member count:", daoCount.reason);
          setDaoMemberCount(null);
        }
        if (daoMax.status === "fulfilled") {
          setMaxDaoMembers(daoMax.value);
        } else {
          console.warn("Unable to load DAO member limit:", daoMax.reason);
          setMaxDaoMembers(null);
        }
        if (packageList.status === "fulfilled") {
          setPackages(packageList.value);
        } else {
          console.warn("Unable to load staking packages:", packageList.reason);
          setPackages([]);
        }
        if (withdrawalRules.status === "fulfilled") {
          setWithdrawalConfig(withdrawalRules.value);
        } else {
          console.warn("Unable to load withdrawal rules:", withdrawalRules.reason);
          setWithdrawalConfig(null);
        }
      } catch (err) {
        console.warn("Protocol read error:", err);
      }

      // 2. Fetch user-specific data if wallet connected
      if (address) {
        const [
          hanaBalRes,
          usdtBalRes,
          bnbBalRes,
          isRegRes,
          userDataRes,
          stakesRes,
        ] = await Promise.allSettled([
          hanaService.getHanaBalance(address),
          hanaService.getUsdtBalance(address),
          hanaService.getBnbBalance(address),
          hanaService.isUserRegistered(address),
          hanaService.getUserData(address),
          hanaService.getUserStakes(address),
        ]);

        if (hanaBalRes.status === "fulfilled") setHanaBalance(hanaBalRes.value);
        if (usdtBalRes.status === "fulfilled") setUsdtBalance(usdtBalRes.value);
        if (bnbBalRes.status === "fulfilled") setBnbBalance(bnbBalRes.value);

        setIsRegistered(isRegRes.status === "fulfilled" && Boolean(isRegRes.value));

        if (userDataRes.status === "fulfilled" && userDataRes.value) {
          const d = userDataRes.value;
          setReferrer(d.referrer || ethers.ZeroAddress);
          setTotalStaked(d.totalStaked || "0.00");
          setTotalDirectIncome(d.totalDirectIncome || "0.00");
          setTotalLevelIncome(d.totalLevelIncome || "0.00");
          setTotalRankIncome(d.totalRankIncome || "0.00");
          setTotalWithdrawn(d.totalWithdrawn || "0.00");
          setLastWithdrawalTime(d.lastWithdrawalTime || 0);
          setFirstStakeTime(d.firstStakeTime || 0);
          setIsDAO(Boolean(d.isDAO));
          setDaoJoinTime(d.daoJoinTime || 0);
          setDaoEndTime(d.daoEndTime || 0);
        } else {
          if (userDataRes.status === "rejected") {
            console.warn("Unable to load wallet staking data:", userDataRes.reason);
          }
          setReferrer(ethers.ZeroAddress);
          setTotalStaked("0.00");
          setTotalDirectIncome("0.00");
          setTotalLevelIncome("0.00");
          setTotalRankIncome("0.00");
          setTotalWithdrawn("0.00");
          setLastWithdrawalTime(0);
          setFirstStakeTime(0);
          setIsDAO(false);
          setDaoJoinTime(0);
          setDaoEndTime(0);
        }

        if (stakesRes.status === "fulfilled" && Array.isArray(stakesRes.value)) {
          const rawStakes = stakesRes.value;
          // Calculate pending ROI for each active stake
          const enrichedStakes = await Promise.all(
            rawStakes.map(async (st) => {
              let pending = "0.00";
              if (st.active) {
                try {
                  pending = await hanaService.getPendingROI(address, st.index);
                } catch {
                  pending = "0.00";
                }
              }
              return { ...st, pendingROI: pending };
            })
          );
          setUserStakes(enrichedStakes);

          const sumPending = enrichedStakes.reduce(
            (acc, s) => acc + (parseFloat(s.pendingROI) || 0),
            0
          );
          setTotalPendingROI(sumPending.toFixed(4));
        } else {
          setUserStakes([]);
          setTotalPendingROI("0.00");
        }
      } else {
        // Reset user data on disconnect
        setHanaBalance("0.00");
        setUsdtBalance("0.00");
        setBnbBalance("0.00");
        setIsRegistered(false);
        setReferrer(ethers.ZeroAddress);
        setTotalStaked("0.00");
        setTotalDirectIncome("0.00");
        setTotalLevelIncome("0.00");
        setTotalRankIncome("0.00");
        setTotalWithdrawn("0.00");
        setLastWithdrawalTime(0);
        setFirstStakeTime(0);
        setIsDAO(false);
        setDaoJoinTime(0);
        setDaoEndTime(0);
        setUserStakes([]);
        setTotalPendingROI("0.00");
      }
    } catch (error) {
      console.warn("refreshData error:", error);
    } finally {
      if (shouldShowLoading) {
        hasLoadedAddress.current = address || null;
        setIsLoading(false);
      }
    }
  }, [address]);

  // Initial load and periodic refresh
  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 15000); // 15 sec poll
    return () => clearInterval(interval);
  }, [refreshData]);

  // ======================== ACTIONS ========================

  const register = useCallback(
    async (referrerAddress) => {
      if (!isConnected || !address) {
        showToast("Please connect your wallet first", "error");
        return { success: false, error: "Wallet not connected" };
      }

      setIsTransacting(true);
      setTxMessage("Registering on-chain...");

      try {
        const refToUse =
          referrerAddress && ethers.isAddress(referrerAddress) && referrerAddress.toLowerCase() !== address.toLowerCase()
            ? referrerAddress
            : DEFAULT_SPONSOR;

        // Save local fallback
        const receipt = await hanaService.registerUser(refToUse);
        setIsRegistered(true);
        showToast("Successfully registered on-chain!", "success");
        await refreshData();
        return { success: true, receipt };
      } catch (err) {
        const msg = hanaService.parseContractError(err);
        // If error says "Already registered", mark as registered
        if (msg.toLowerCase().includes("already registered")) {
          setIsRegistered(true);
          showToast("Wallet already registered on-chain!", "success");
          await refreshData();
          return { success: true };
        }
        showToast(`Registration failed: ${msg}`, "error");
        return { success: false, error: msg };
      } finally {
        setIsTransacting(false);
        setTxMessage("");
      }
    },
    [address, isConnected, refreshData, showToast]
  );

  const stake = useCallback(
    async (packageId, amount) => {
      if (!isConnected || !address) {
        showToast("Please connect your wallet first", "error");
        return { success: false, error: "Wallet not connected" };
      }

      setIsTransacting(true);
      setTxMessage("Approving USDT & confirming stake...");

      try {
        const receipt = await hanaService.stakeTokens(packageId, amount);
        showToast(`Staked $${amount} successfully!`, "success");
        await refreshData();
        return { success: true, receipt };
      } catch (err) {
        const msg = hanaService.parseContractError(err);
        showToast(`Staking failed: ${msg}`, "error");
        return { success: false, error: msg };
      } finally {
        setIsTransacting(false);
        setTxMessage("");
      }
    },
    [address, isConnected, refreshData, showToast]
  );

  const claimSingleROI = useCallback(
    async (stakeIndex) => {
      if (!isConnected || !address) {
        showToast("Please connect your wallet first", "error");
        return { success: false, error: "Wallet not connected" };
      }

      setIsTransacting(true);
      setTxMessage(`Claiming ROI for stake #${stakeIndex}...`);

      try {
        const receipt = await hanaService.claimROI(stakeIndex);
        showToast("ROI claimed and HANA minted to your wallet!", "success");
        await refreshData();
        return { success: true, receipt };
      } catch (err) {
        const msg = hanaService.parseContractError(err);
        showToast(`Claim failed: ${msg}`, "error");
        return { success: false, error: msg };
      } finally {
        setIsTransacting(false);
        setTxMessage("");
      }
    },
    [address, isConnected, refreshData, showToast]
  );

  const claimAllROI = useCallback(async () => {
    if (!isConnected || !address) {
      showToast("Please connect your wallet first", "error");
      return { success: false, error: "Wallet not connected" };
    }

    const activeIndices = userStakes
      .filter((s) => s.active && parseFloat(s.pendingROI) > 0)
      .map((s) => s.index);

    if (activeIndices.length === 0) {
      showToast("No pending ROI available to claim right now", "info");
      return { success: false, error: "Nothing to claim" };
    }

    setIsTransacting(true);
    setTxMessage(`Claiming ROI for ${activeIndices.length} stake(s)...`);

    try {
      const receipts = await hanaService.claimAllROI(activeIndices);
      showToast("All pending ROI claimed successfully!", "success");
      await refreshData();
      return { success: true, receipts };
    } catch (err) {
      const msg = hanaService.parseContractError(err);
      showToast(`Claim all failed: ${msg}`, "error");
      return { success: false, error: msg };
    } finally {
      setIsTransacting(false);
      setTxMessage("");
    }
  }, [address, isConnected, refreshData, showToast, userStakes]);

  const withdraw = useCallback(
    async (amount) => {
      if (!isConnected || !address) {
        showToast("Please connect your wallet first", "error");
        return { success: false, error: "Wallet not connected" };
      }

      setIsTransacting(true);
      setTxMessage(`Processing withdrawal of ${amount} USDT...`);

      try {
        const receipt = await hanaService.withdrawFunds(amount);
        showToast(`Withdrawal of ${amount} USDT successful!`, "success");
        await refreshData();
        return { success: true, receipt };
      } catch (err) {
        const msg = hanaService.parseContractError(err);
        showToast(`Withdrawal failed: ${msg}`, "error");
        return { success: false, error: msg };
      } finally {
        setIsTransacting(false);
        setTxMessage("");
      }
    },
    [address, isConnected, refreshData, showToast]
  );

  const buy = useCallback(
    async (usdtAmount) => {
      if (!isConnected || !address) {
        showToast("Please connect your wallet first", "error");
        return { success: false, error: "Wallet not connected" };
      }

      setIsTransacting(true);
      setTxMessage("Buying HANA tokens with USDT...");

      try {
        const receipt = await hanaService.buyHana(usdtAmount);
        showToast("Bought HANA tokens successfully!", "success");
        await refreshData();
        return { success: true, receipt };
      } catch (err) {
        const msg = hanaService.parseContractError(err);
        showToast(`Buy failed: ${msg}`, "error");
        return { success: false, error: msg };
      } finally {
        setIsTransacting(false);
        setTxMessage("");
      }
    },
    [address, isConnected, refreshData, showToast]
  );

  const sell = useCallback(
    async (hanaAmount) => {
      if (!isConnected || !address) {
        showToast("Please connect your wallet first", "error");
        return { success: false, error: "Wallet not connected" };
      }

      setIsTransacting(true);
      setTxMessage("Selling HANA tokens for USDT...");

      try {
        const receipt = await hanaService.sellHana(hanaAmount);
        showToast("Sold HANA tokens successfully!", "success");
        await refreshData();
        return { success: true, receipt };
      } catch (err) {
        const msg = hanaService.parseContractError(err);
        showToast(`Sell failed: ${msg}`, "error");
        return { success: false, error: msg };
      } finally {
        setIsTransacting(false);
        setTxMessage("");
      }
    },
    [address, isConnected, refreshData, showToast]
  );

  const value = useMemo(
    () => ({
      // Wallet state
      isConnected,
      address,
      openWalletModal: open,
      network: BSC,
      contracts: CONTRACTS,

      // Balances
      hanaBalance,
      usdtBalance,
      bnbBalance,
      hanaPrice,
      hanaReserves,

      // User on-chain data
      isRegistered,
      referrer,
      totalStaked,
      totalDirectIncome,
      totalLevelIncome,
      totalRankIncome,
      totalWithdrawn,
      lastWithdrawalTime,
      firstStakeTime,
      isDAO,
      daoJoinTime,
      daoEndTime,

      // Stakes & ROI
      userStakes,
      totalPendingROI,
      packages,
      daoMemberCount,
      maxDaoMembers,
      withdrawalConfig,

      // State flags
      isLoading,
      isTransacting,
      txMessage,
      toast,

      // Actions
      refreshData,
      showToast,
      register,
      stake,
      claimROI: claimSingleROI,
      claimAllROI,
      withdraw,
      buyHana: buy,
      sellHana: sell,
      formatAddress: hanaService.formatAddress,
      getExplorerUrl: hanaService.getExplorerUrl,
      getContractExplorerUrl: hanaService.getContractExplorerUrl,
    }),
    [
      isConnected,
      address,
      open,
      hanaBalance,
      usdtBalance,
      bnbBalance,
      hanaPrice,
      hanaReserves,
      isRegistered,
      referrer,
      totalStaked,
      totalDirectIncome,
      totalLevelIncome,
      totalRankIncome,
      totalWithdrawn,
      lastWithdrawalTime,
      firstStakeTime,
      isDAO,
      daoJoinTime,
      daoEndTime,
      userStakes,
      totalPendingROI,
      packages,
      daoMemberCount,
      maxDaoMembers,
      withdrawalConfig,
      isLoading,
      isTransacting,
      txMessage,
      toast,
      refreshData,
      showToast,
      register,
      stake,
      claimSingleROI,
      claimAllROI,
      withdraw,
      buy,
      sell,
    ]
  );

  return (
    <Web3Context.Provider value={value}>
      {children}
      {/* Global Transaction / Notification Toast */}
      {toast && (
        <div
          className={`fixed right-4 top-4 z-[150] flex max-h-[40vh] w-[calc(100vw-2rem)] max-w-sm items-start gap-3 overflow-y-auto rounded-xl border px-4 py-3 text-sm font-semibold shadow-2xl backdrop-blur-md transition-all ${
            toast.type === "success"
              ? "border-green-500/40 bg-black/90 text-green-300 shadow-[0_0_20px_rgba(34,197,94,0.2)]"
              : toast.type === "error"
              ? "border-red-500/40 bg-black/90 text-red-300 shadow-[0_0_20px_rgba(239,68,68,0.2)]"
              : "border-[#FFB51D]/40 bg-black/90 text-[#F8E096] shadow-[0_0_20px_rgba(255,181,29,0.2)]"
          }`}
        >
          <span className="min-w-0 whitespace-normal break-words [overflow-wrap:anywhere]">{toast.message}</span>
        </div>
      )}
      {/* Global Transaction Modal Overlay */}
      {isTransacting && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/35 p-4 backdrop-blur-[2px]">
          <div
            role="status"
            aria-live="polite"
            className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-[#FFB51D]/40 bg-[#111]/95 px-6 py-7 text-center shadow-[0_20px_80px_rgba(0,0,0,0.65),0_0_35px_rgba(255,181,29,0.12)] backdrop-blur-xl"
          >
            <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[#FFB51D]/80 to-transparent" />
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-[#FFB51D]/20 bg-[#FFB51D]/[0.08]">
              <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-[#FFB51D]/20 border-t-[#FFB51D]" />
            </div>
            <p className="text-base font-bold tracking-wide text-white">Transaction in Progress</p>
            <p className="mx-auto mt-2 max-w-xs break-words text-sm leading-5 text-[#C2C2C2]">
              {txMessage || "Confirm the request in your wallet..."}
            </p>
            <div className="mx-auto mt-6 h-1 w-full max-w-[190px] overflow-hidden rounded-full bg-white/10">
              <div className="h-full w-1/3 animate-pulse rounded-full bg-gradient-to-r from-[#D99112] via-[#FFE28A] to-[#D99112]" />
            </div>
            <p className="mt-4 text-xs text-[#858585]">Please keep this tab open while the transaction completes.</p>
          </div>
        </div>
      )}
    </Web3Context.Provider>
  );
}
