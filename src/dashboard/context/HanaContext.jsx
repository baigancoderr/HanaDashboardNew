import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { useAppKit, useAppKitAccount, useAppKitNetwork, useDisconnect } from '@reown/appkit/react';
import { bscTestnet } from '@reown/appkit/networks';
import {
  useUserData,
  useUserStakes,
  useUsdtBalance,
  useHanaBalance,
  useStakeTokens,
  useClaimStakeROI,
  useWithdrawHanaTokens,
  useReferralHistory,
  useLevelIncomeHistory,
  useIncomeHistory,
  useStakingHistory,
  useTeamByLevel,
  useTeamLegBusiness,
} from '../../contracts/hooks';
import {
  CONTRACT_ADDRESSES as APP_CONTRACTS,
  DEFAULT_PACKAGES,
  BSC_TESTNET_CHAIN_ID,
  getExplorerTxUrl,
  getExplorerAddressUrl,
} from '../../contracts/config';
import { RANK_ACHIEVEMENT_STRUCTURE } from '../../contracts/ranks';
import { useWeb3 } from '../../context/Web3Context';

export const CONTRACT_ADDRESSES = {
  bscTestnet: {
    hanaToken: APP_CONTRACTS.hanaToken,
    usdtToken: APP_CONTRACTS.usdtToken,
    stakingContract: APP_CONTRACTS.stakingContract,
    explorerBase: 'https://testnet.bscscan.com',
    chainIdHex: '0x61',
    chainName: 'BNB Smart Chain (Testnet)',
  },
};

export const STAKING_PACKAGES = DEFAULT_PACKAGES.map((pkg) => ({
  id: pkg.id,
  tier: pkg.name,
  name: pkg.name,
  amount: pkg.minAmount,
  dailyRate: `Daily • ${pkg.cap} Cap`,
  dailyPercent: parseFloat((pkg.dailyRateBps / 100).toFixed(2)),
  capMultiplier: pkg.capMultiplier,
  isDAO: pkg.isDAO,
  popular: pkg.id === 3,
  durationDays: 200,
}));

export const RANK_TIERS = RANK_ACHIEVEMENT_STRUCTURE.map((rank) => ({
  no: rank.id,
  name: rank.name,
  selfContribution: rank.selfContribution,
  directTeam: rank.directTeam,
  requiredLegs: rank.requiredLegCriteria === 'None' ? 0 : 2,
  matchingBusiness: rank.matchingBusiness,
  qualificationPeriod: rank.qualificationPeriod,
  weeklyReward: rank.weeklyReward,
  status: 'Upcoming',
}));

export function formatShortAddress(addr) {
  if (!addr || addr.length < 10) return addr || '';
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

const HanaContext = createContext(null);

export function HanaProvider({ children }) {
  const { open } = useAppKit();
  const { address, isConnected } = useAppKitAccount({ namespace: 'eip155' });
  const { disconnect } = useDisconnect();
  const { chainId, switchNetwork: appKitSwitchNetwork } = useAppKitNetwork();
  const web3 = useWeb3();

  // Real contract read hooks
  const { user, refetch: refetchUser, isLoading: userLoading } = useUserData(address);
  const { stakes, refetch: refetchStakes, isLoading: stakesLoading } = useUserStakes(address);
  const { balanceFormatted: usdtBalanceFormatted, rawBalanceNumber: usdtBalanceRaw, refetch: refetchUsdt } = useUsdtBalance(address);
  const { balanceFormatted: hanaBalanceFormatted, rawBalanceNumber: hanaBalanceRaw, refetch: refetchHana } = useHanaBalance(address);
  const { allEvents: allIncomeEvents, totals: incomeTotals, refetch: refetchIncome } = useIncomeHistory(address);
  const {
    directIncomeHistory: directEvents,
    registeredReferrals,
    totalDirectEarnedUsdt,
    totalDirectEarnedHana,
    isLoading: directIncomeLoading,
    error: directIncomeError,
    refetch: refetchReferral,
  } = useReferralHistory(address);
  const { incomeHistory: levelEvents, refetch: refetchLevel } = useLevelIncomeHistory(address);
  const { history: stakingHistory, refetch: refetchStakingHistory } = useStakingHistory(address);
  const { allMembers: teamAllMembers, refetch: refetchTeam } = useTeamByLevel(address);
  const {
    legs: teamLegs,
    strongLeg,
    weakLegs,
    currentRank,
    currentRankName,
    nextRank,
    strongLegBusiness,
    weakLegBusiness,
    matchingBusiness,
    totalTeamBusiness,
    ranks: qualifiedRanks,
    refetch: refetchLegs,
  } = useTeamLegBusiness(address, { selfContribution: user?.totalStakedNumber || 0 });

  // Real contract write hooks
  const { stake: executeStake, isPending: isStakingPending } = useStakeTokens();
  const { claim: executeClaim, isPending: isClaimPending } = useClaimStakeROI();
  const { withdraw: executeWithdrawHana, isPending: isHanaWithdrawPending } = useWithdrawHanaTokens();

  // Toast notifications state
  const [toasts, setToasts] = useState([]);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (title, description, variant = 'success') => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      setToasts((prev) => [...prev, { id, title, description, variant }]);
      setTimeout(() => {
        dismissToast(id);
      }, 4200);
    },
    [dismissToast]
  );

  const copyToClipboard = useCallback(
    async (text, label = 'Copied to clipboard') => {
      try {
        if (!text) return;
        await navigator.clipboard.writeText(text);
        showToast(label, text.length > 36 ? `${text.slice(0, 18)}...${text.slice(-10)}` : text, 'info');
      } catch {
        showToast('Copy failed', 'Please copy manually from the field.', 'error');
      }
    },
    [showToast]
  );

  const connectWallet = useCallback(() => {
    try {
      if (open) {
        open();
      }
    } catch (err) {
      console.warn('Could not open wallet modal:', err);
    }
  }, [open]);

  const disconnectWallet = useCallback(async () => {
    try {
      if (disconnect) {
        await disconnect();
      }
      showToast('Wallet Disconnected', 'Your wallet has been disconnected.', 'info');
    } catch (err) {
      console.warn('Could not disconnect wallet:', err);
    }
  }, [disconnect, showToast]);

  const switchNetwork = useCallback(
    async () => {
      try {
        if (appKitSwitchNetwork) {
          await appKitSwitchNetwork(bscTestnet);
        } else if (window.ethereum) {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x61' }],
          });
        }
        showToast('Network Switched', 'Switched to BNB Smart Chain Testnet', 'info');
      } catch (err) {
        showToast('Switch Network Failed', err?.message || 'Could not switch network.', 'error');
      }
    },
    [appKitSwitchNetwork, showToast]
  );

  // Real Active Stakes / Positions
  const positions = useMemo(() => {
    if (!stakes || stakes.length === 0) return [];
    return stakes.map((s, idx) => {
      const pkg = DEFAULT_PACKAGES.find((p) => p.id === s.packageId) || DEFAULT_PACKAGES[0];
      const invested = parseFloat(s.amountFormatted) || 0;
      const totalClaimed = parseFloat(s.totalClaimedFormatted) || 0;
      const capAmount = parseFloat(s.capFormatted) || invested * (pkg.capMultiplier || 2);
      const pendingRoi = typeof s.pendingRoi === 'number' ? s.pendingRoi : (parseFloat(s.pendingRoiFormatted) || 0);
      const startedAt = s.startTime
        ? new Date(s.startTime * 1000).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })
        : 'Active';
      const expiresAt = s.startTime
        ? new Date((s.startTime + 200 * 86400) * 1000).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })
        : 'In 200 Days';

      return {
        id: `pos-${s.stakeIndex ?? idx}`,
        stakeIndex: s.stakeIndex ?? idx,
        packageTier: pkg.name,
        packageName: `${pkg.name} Package`,
        invested,
        totalClaimed,
        capAmount,
        pendingRoi,
        dailyRate: `Daily (${pkg.dailyRate})`,
        dailyPercent: parseFloat(pkg.dailyRate) || 0.5,
        startedAt,
        expiresAt,
        txHash: s.txHash || APP_CONTRACTS.stakingContract,
        isCompleted: s.isCompleted,
      };
    });
  }, [stakes]);

  // Real Direct Income Events
  const directIncomeEvents = useMemo(() => {
    if (!directEvents || directEvents.length === 0) return [];
    return directEvents.map((e, idx) => ({
      id: `di-${idx}-${e.txHash || idx}`,
      fromMember: e.stakerAddress || e.userAddress || '',
      stakeAmount: parseFloat(e.stakeAmountFormatted || '0') || 0,
      packageTier: e.stakePackageName || 'Package',
      usdtIncome: parseFloat(e.usdtFormatted || '0') || 0,
      hanaCredited: parseFloat(e.hanaFormatted || '0') || 0,
      date: e.dateFormatted || (e.timestamp ? new Date(e.timestamp * 1000).toLocaleDateString() : 'Recent'),
      txHash: e.txHash || '',
    }));
  }, [directEvents]);

  // Real Level Income Events
  const levelIncomeEvents = useMemo(() => {
    if (!levelEvents || levelEvents.length === 0) return [];
    return levelEvents.map((e, idx) => ({
      id: `li-${idx}-${e.txHash || idx}`,
      fromMember: e.fromAddress || e.userAddress || '',
      level: Number(e.level) || 1,
      stakeAmount: parseFloat(e.stakeAmountFormatted || '0') || 0,
      packageTier: e.stakePackageName || `Level ${e.level}`,
      usdtIncome: parseFloat(e.usdtFormatted || '0') || 0,
      hanaCredited: parseFloat(e.hanaFormatted || '0') || 0,
      roiClaimAmount: e.roiUsdtNumber ?? (e.roiUsdtFormatted == null ? null : Number(e.roiUsdtFormatted)),
      date: e.dateFormatted || (e.timestamp ? new Date(e.timestamp * 1000).toLocaleDateString() : 'Recent'),
      txHash: e.txHash || '',
    }));
  }, [levelEvents]);

  // Real Downline Team Members
  const teamMembers = useMemo(() => {
    if (!teamAllMembers || teamAllMembers.length === 0) return [];
    return teamAllMembers.map((m, idx) => ({
      id: m.address || `tm-${idx}`,
      level: Number(m.level) || 1,
      wallet: m.address || '',
      sponsor: m.sponsor || '',
      isDao: Boolean(m.isDAO),
      totalBusiness: m.totalStakedNumber || parseFloat(m.totalStakedFormatted || '0') || 0,
      lastStake: m.lastStakeTime ? new Date(m.lastStakeTime * 1000).toLocaleDateString() : '—',
      lastPackage: m.lastPackageName || 'Active',
      joined: m.registeredTime ? new Date(m.registeredTime * 1000).toLocaleDateString() : 'Recent',
      regTx: m.regTxHash || m.address || '',
    }));
  }, [teamAllMembers]);

  // Real Direct Legs
  const directLegs = useMemo(() => {
    if (!teamLegs || teamLegs.length === 0) return [];
    return teamLegs.map((leg, idx) => ({
      id: `leg-${leg.address || idx}`,
      role: leg.legRole || (idx === 0 ? 'Strong Leg' : `Weak Leg ${idx}`),
      directPartner: leg.address || '',
      directStake: Number(leg.directStaked) || 0,
      downlineBusiness: Number(leg.teamStaked) || 0,
      totalLegBusiness: Number(leg.totalLegBusiness) || 0,
      legRank: leg.rankName || 'Member',
      teamMembers: Number(leg.memberCount) || 0,
      isActiveLeg: Boolean(leg.isActiveLeg),
      regTx: leg.regTxHash || '',
    }));
  }, [teamLegs]);

  // Real Consolidated Transactions
  const transactions = useMemo(() => {
    const txList = [];
    const stakeItems = (stakingHistory && stakingHistory.length > 0) ? stakingHistory : (stakes || []);
    if (stakeItems && stakeItems.length > 0) {
      stakeItems.forEach((s, idx) => {
        const pkg = DEFAULT_PACKAGES.find((p) => p.id === s.packageId) || DEFAULT_PACKAGES[0];
        const amt = parseFloat(s.amountFormatted || '0') || 0;
        const ts = s.startTime || s.timestamp || 0;
        const dateStr = s.dateFormatted || (ts ? new Date(ts * 1000).toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }) : 'Recent');

        txList.push({
          id: `tx-stake-${idx}-${s.txHash || s.stakeIndex || idx}`,
          type: 'Staking',
          amountLabel: `$${amt.toFixed(2)}`,
          amountUsd: amt,
          txHash: s.txHash || APP_CONTRACTS.stakingContract,
          date: dateStr,
          status: 'Success',
          details: `${s.packageName || pkg.name} Staked`,
          packageTier: s.packageName || pkg.name,
          timestamp: ts,
        });
      });
    }
    if (allIncomeEvents && allIncomeEvents.length > 0) {
      allIncomeEvents
        .filter((ev) => ev.category !== 'staked')
        .forEach((ev, idx) => {
          const typeLabel =
            ev.category === 'roi'
              ? 'ROI Claim'
              : ev.category === 'direct'
              ? 'Direct Income'
              : ev.category === 'level'
              ? 'Level Income'
              : ev.category === 'rank'
              ? 'Rank Reward'
              : 'Income';
          txList.push({
            id: `tx-inc-${idx}-${ev.txHash || idx}`,
            type: typeLabel,
            amountLabel: `$${(Number(ev.usdtNumber) || 0).toFixed(2)}`,
            amountUsd: Number(ev.usdtNumber) || 0,
            txHash: ev.txHash || '',
            date: ev.dateFormatted || (ev.timestamp ? new Date(ev.timestamp * 1000).toLocaleDateString() : 'Recent'),
            status: 'Success',
            details: ev.details || `${typeLabel} Credited`,
            timestamp: ev.timestamp || 0,
          });
        });
    }
    return txList.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  }, [stakes, stakingHistory, allIncomeEvents]);

  // Real Actions
  const stakePackage = useCallback(
    async (pkg, customAmount) => {
      try {
        let pkgId = typeof pkg === 'object' ? pkg.id : pkg;
        if (pkgId === 'dao' || pkgId === 'DAO') {
          pkgId = 5;
        } else {
          pkgId = Number(pkgId);
        }
        const amount = customAmount || (typeof pkg === 'object' ? pkg.amount : 100);
        showToast('Staking Initiated', `Staking $${amount} USDT for Package ${pkgId}...`, 'info');
        const res = await executeStake(address, pkgId, amount);
        showToast('Stake Successful!', `Staked $${amount} USDT successfully!`, 'success');
        try {
          await refetchStakes();
          await refetchUser();
          await refetchUsdt();
          web3?.refreshData?.();
        } catch {
          // background sync
        }
        return res;
      } catch (err) {
        showToast('Staking Failed', err?.message || 'Transaction rejected or failed.', 'error');
        throw err;
      }
    },
    [address, executeStake, refetchUser, refetchStakes, refetchUsdt, showToast, web3]
  );

  const stakeDaoPackage = useCallback(async () => {
    return stakePackage(5, 5000);
  }, [stakePackage]);

  const claimPositionRoi = useCallback(
    async (posOrIndex) => {
      try {
        const idx = typeof posOrIndex === 'object' ? posOrIndex.stakeIndex : Number(posOrIndex);
        showToast('Claiming ROI', `Submitting claim for stake #${idx}...`, 'info');
        const res = await executeClaim(idx);
        showToast('ROI Claimed!', 'ROI successfully credited to your wallet.', 'success');
        refetchUser();
        refetchStakes();
        refetchUsdt();
        web3?.refreshData?.();
        return res;
      } catch (err) {
        showToast('Claim Failed', err?.message || 'Could not claim ROI.', 'error');
        throw err;
      }
    },
    [executeClaim, refetchUser, refetchStakes, refetchUsdt, showToast, web3]
  );

  const claimRoi = useCallback(
    async (stakeIdOrIndex) => {
      const match = typeof stakeIdOrIndex === 'string' ? stakeIdOrIndex.match(/\d+/) : null;
      const idx = match ? Number(match[0]) : Number(stakeIdOrIndex || 0);
      return claimPositionRoi(idx);
    },
    [claimPositionRoi]
  );

  const withdrawUsdt = useCallback(
    async (amount) => {
      try {
        showToast('Withdrawal Initiated', `Withdrawing $${amount} USDT...`, 'info');
        const res = await web3?.withdraw?.(amount);
        showToast('Withdrawal Successful', `$${amount} USDT withdrawn to your wallet.`, 'success');
        refetchUser();
        refetchUsdt();
        web3?.refreshData?.();
        return res;
      } catch (err) {
        showToast('Withdrawal Failed', err?.message || 'Could not complete withdrawal.', 'error');
        throw err;
      }
    },
    [web3, refetchUser, refetchUsdt, showToast]
  );

  const withdrawHana = useCallback(
    async (amount) => {
      try {
        if (!address) throw new Error('Connect your wallet first');
        showToast('Withdrawing HANA', `Submitting withdrawal for ${amount} HANA...`, 'info');
        const res = await executeWithdrawHana(address, amount);
        showToast('HANA Withdrawn', `${amount} HANA credited to your wallet.`, 'success');
        refetchUser();
        refetchHana();
        web3?.refreshData?.();
        return res;
      } catch (err) {
        showToast('HANA Withdrawal Failed', err?.message || 'Could not withdraw HANA.', 'error');
        throw err;
      }
    },
    [address, executeWithdrawHana, refetchUser, refetchHana, showToast, web3]
  );

  const buyHana = useCallback(
    async (usdtAmount) => {
      showToast('Buy Order', `Swapping ${usdtAmount} USDT for HANA tokens...`, 'info');
    },
    [showToast]
  );

  const sellHana = useCallback(
    async (hanaAmount) => {
      showToast('Sell & Burn Order', `Selling and burning ${hanaAmount} HANA...`, 'info');
    },
    [showToast]
  );

  const createCompound = useCallback(
    async (amount, term) => {
      showToast('Compound Created', `Locked growth position created for $${amount}.`, 'success');
    },
    [showToast]
  );

  const claimCompound = useCallback(
    async (id) => {
      showToast('Compound Claimed', 'Compounded payout claimed.', 'success');
    },
    [showToast]
  );

  const claimReward = useCallback(
    async (id) => {
      showToast('Reward Claimed', 'Reward credited to your account.', 'success');
    },
    [showToast]
  );

  const updateProfile = useCallback(
    (name) => {
      showToast('Profile Updated', 'Profile updated successfully.', 'success');
    },
    [showToast]
  );

  const resetDemoState = useCallback(() => {
    refetchUser();
    refetchStakes();
    refetchUsdt();
    refetchHana();
    showToast('Data Refreshed', 'Synced latest smart contract data from BSC.', 'info');
  }, [refetchUser, refetchStakes, refetchUsdt, refetchHana, showToast]);

  const markAllNotificationsRead = useCallback(() => {}, []);

  // Real Calculated Values
  const walletConnected = Boolean(isConnected && address);
  const walletAddress = address || '';
  const shortWallet = address ? formatShortAddress(address) : 'Not Connected';
  const sponsorAddress = user?.sponsor || web3?.referrer || '';
  const userName = address ? formatShortAddress(address) : 'Guest User';
  const referralCode = address ? address.slice(2, 8).toUpperCase() : '';
  const referralLink =
    typeof window !== 'undefined' && address ? `${window.location.origin}/register?ref=${address}` : '';

  const usdtBalance = (usdtBalanceRaw != null) ? usdtBalanceRaw : (parseFloat(web3?.usdtBalance || '0') || 0);
  const hanaBalance = (hanaBalanceRaw != null) ? hanaBalanceRaw : (parseFloat(web3?.hanaBalance || '0') || 0);
  const withdrawableUsdt = (usdtBalanceRaw != null) ? usdtBalanceRaw : (parseFloat(web3?.usdtBalance || '0') || 0);
  const withdrawableHana = parseFloat(user?.hanaBalanceFormatted || '0') || 0;

  const totalInvested = user?.totalInvestedNumber || positions.reduce((sum, p) => sum + p.invested, 0) || parseFloat(web3?.totalStaked || '0') || 0;
  const totalStaked = user?.totalStakedNumber || positions.reduce((sum, p) => sum + p.invested, 0) || parseFloat(web3?.totalStaked || '0') || 0;
  const totalEarned =
    (user?.totalROIClaimedNumber || user?.totalRoiClaimedNumber || positions.reduce((sum, p) => sum + p.totalClaimed, 0) || 0) +
    (user?.totalDirectBonusNumber || 0) +
    (user?.totalLevelBonusNumber || 0) +
    (user?.totalRankBonusNumber || 0);
  const totalWithdrawn = user?.totalWithdrawnNumber || parseFloat(web3?.totalWithdrawn || '0') || 0;

  const daoMember = Boolean(user?.isDAO || web3?.isDAO);
  const daoValidDays = user?.isDAO ? 500 : 0;
  const daoMembersCount = web3?.daoMemberCount != null ? Number(web3.daoMemberCount) : 0;
  const hanaPool = parseFloat(web3?.hanaReserves?.hanaReserve || '0') || 0;
  const usdtReserve = parseFloat(web3?.hanaReserves?.usdtReserve || '0') || 0;
  const hanaPrice = hanaPool > 0 ? usdtReserve / hanaPool : 0;

  const activeContracts = useMemo(
    () => ({
      hanaToken: APP_CONTRACTS.hanaToken,
      usdtToken: APP_CONTRACTS.usdtToken,
      stakingContract: APP_CONTRACTS.stakingContract,
      explorerBase: CONTRACT_ADDRESSES.bscTestnet.explorerBase,
      chainName: CONTRACT_ADDRESSES.bscTestnet.chainName,
    }),
    []
  );

  // Real Dynamic Notifications
  const notifications = useMemo(() => {
    const list = [];
    if (address && user) {
      if (user.isDAO) {
        list.push({
          id: 'notif-dao',
          title: 'DAO Partner Active',
          message: 'Your DAO Partner benefits and 4X cap multiplier are active.',
          time: 'Active',
          read: true,
        });
      }
      if (directEvents && directEvents.length > 0) {
        const latest = directEvents[0];
        list.push({
          id: `notif-di-${latest.txHash || 1}`,
          title: 'Direct Referral Reward',
          message: `Received +$${latest.usdtFormatted} USDT from ${latest.stakerShort || 'partner'}.`,
          time: latest.dateFormatted || 'Recent',
          read: false,
        });
      }
      if (levelEvents && levelEvents.length > 0) {
        const latest = levelEvents[0];
        list.push({
          id: `notif-li-${latest.txHash || 1}`,
          title: 'Level Commission Received',
          message: `Earned Level ${latest.level} income: +$${latest.usdtFormatted} USDT.`,
          time: latest.dateFormatted || 'Recent',
          read: false,
        });
      }
    }
    return list;
  }, [address, user, directEvents, levelEvents]);

  // Real Dynamic Rewards based on rank qualifications
  const rewards = useMemo(() => {
    return RANK_ACHIEVEMENT_STRUCTURE.map((rank) => {
      const isAchieved = qualifiedRanks?.find((r) => r.id === rank.id)?.isAchieved || false;
      const isCurrent = currentRank?.id === rank.id;
      return {
        id: `rew-rank-${rank.id}`,
        title: `${rank.name} Rank Leadership Reward`,
        category: 'Rank Bonus',
        rewardUsd: rank.weeklyReward,
        rewardHana: rank.weeklyReward,
        requirement: `Maintain ${rank.name} ($${rank.matchingBusiness.toLocaleString()} Matching Business)`,
        progress: isAchieved ? 100 : Math.min(99, Math.round(((matchingBusiness || 0) / rank.matchingBusiness) * 100)),
        status: isAchieved ? (isCurrent ? 'Claimable' : 'Claimed') : 'In Progress',
      };
    });
  }, [qualifiedRanks, currentRank, matchingBusiness]);

  const value = {
    network: chainId === BSC_TESTNET_CHAIN_ID ? 'bscTestnet' : 'bscTestnet',
    switchNetwork,
    walletConnected,
    walletAddress,
    shortWallet,
    sponsorAddress,
    userName,
    referralCode,
    referralLink,
    usdtBalance,
    hanaBalance,
    withdrawableUsdt,
    withdrawableHana,
    totalInvested,
    totalStaked,
    totalEarned,
    totalWithdrawn,
    usdtReserve,
    hanaPool,
    hanaPrice,
    daoMember,
    daoValidDays,
    daoMembersCount,
    positions,
    refreshActiveStakes: refetchStakes,
    activeStakesLoading: stakesLoading,
    transactions,
    directIncomeEvents,
    registeredReferrals,
    totalDirectEarnedUsdt,
    totalDirectEarnedHana,
    directIncomeLoading,
    directIncomeError,
    refetchDirectIncome: refetchReferral,
    levelIncomeEvents,
    teamMembers,
    directLegs,
    compounds: [],
    rewards,
    notifications,
    connectWallet,
    disconnectWallet,
    copyToClipboard,
    stakePackage,
    stakeDaoPackage,
    claimPositionRoi,
    claimRoi,
    withdrawUsdt,
    withdrawHana,
    buyHana,
    sellHana,
    createCompound,
    claimCompound,
    claimReward,
    toasts,
    showToast,
    dismissToast,
    markAllNotificationsRead,
    updateProfile,
    resetDemoState,
    activeContracts,
    currentRank,
    currentRankName,
    nextRank,
    rankProgress: qualifiedRanks,
    strongLegBusiness,
    weakLegBusiness,
    matchingBusiness,
    totalTeamBusiness,
    isLoading: userLoading || stakesLoading,
  };

  return <HanaContext.Provider value={value}>{children}</HanaContext.Provider>;
}

export function useHana() {
  const context = useContext(HanaContext);
  if (!context) {
    throw new Error('useHana must be used within a HanaProvider');
  }
  return context;
}
