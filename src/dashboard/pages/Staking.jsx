import { useState, useEffect } from "react";
import { useAppKitAccount } from "@reown/appkit/react";
import {
  Shield,
  Zap,
  Users,
  TrendingUp,
  Plus,
  CheckCircle,
  Clock,
  Info,
  Loader2,
  ExternalLink,
  Coins,
  AlertCircle,
  X,
  Wallet,
} from "lucide-react";
import StatCard from "../components/StatCard";
import SectionCard from "../components/SectionCard";
import GoldBadge from "../components/GoldBadge";
import {
  useUserData,
  useUserStakes,
  useUsdtBalance,
  useHanaBalance,
  useStakeTokens,
  useClaimStakeROI,
  usePendingROI,
  useStakingHistory,
} from "../../contracts/hooks";
import {
  DEFAULT_PACKAGES,
  CONTRACT_ADDRESSES,
  getExplorerAddressUrl,
  getExplorerTxUrl,
} from "../../contracts/config";

const subIdRules = [
  "Sub-IDs can only be invested under a single $1,000 package",
  "Sub-ID investment allowed 10 minutes after main ID activation",
  "Reinvest Wallet can only be used to top up a $1,000 ID",
  "No P2P (internal) transfer of HANA tokens between members",
];

// Single Active Stake Component with pending ROI query and Claim action
function ActiveStakeItem({ stake, userAddress, onClaimSuccess }) {
  const { pending, pendingFormatted, refetch: refetchPending } = usePendingROI(
    userAddress,
    stake.stakeIndex
  );
  const { claim, isPending: isClaiming, error: claimError } = useClaimStakeROI();
  const [claimSuccessMsg, setClaimSuccessMsg] = useState("");

  const pkg =
    DEFAULT_PACKAGES.find((p) => p.id === stake.packageId) ||
    DEFAULT_PACKAGES[0];

  const startDate = stake.startTime
    ? new Date(stake.startTime * 1000).toLocaleDateString("en-US", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "Recent";

  const totalClaimedNum = parseFloat(stake.totalClaimedFormatted) || 0;
  const capNum = parseFloat(stake.capFormatted) || 1;
  const usedPercent = Math.min(
    100,
    Math.max(0, Math.round((totalClaimedNum / capNum) * 100))
  );

  const pendingNum = parseFloat(pendingFormatted) || 0;
  const canClaim = pendingNum >= 10; // Contract requires at least $10

  const handleClaim = async () => {
    setClaimSuccessMsg("");
    try {
      await claim(stake.stakeIndex);
      setClaimSuccessMsg("ROI claimed successfully!");
      refetchPending();
      onClaimSuccess?.();
      setTimeout(() => setClaimSuccessMsg(""), 4000);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="rounded-xl border border-[#FFB51D]/20 bg-[#FFB51D]/5 p-4 sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#FFE28A] to-[#FFB51D]">
            <Shield size={18} className="text-black" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-[15px] font-bold text-white">
                ${parseFloat(stake.amountFormatted).toLocaleString()} {pkg.name}{" "}
                Package
              </p>
              <GoldBadge>{pkg.isDAO ? "DAO" : "Main"}</GoldBadge>
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-0.5">
              <p className="text-[12px] text-[#A3A3A3]">
                ID: #S-{stake.stakeIndex + 1} · Started: {startDate}
              </p>
              {stake.txHash && (
                <a
                  href={stake.explorerUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-mono text-[#FFB51D] hover:underline"
                  title="View creation transaction on BscScan"
                >
                  <span>Tx: {stake.txHash.slice(0, 6)}...{stake.txHash.slice(-4)}</span>
                  <ExternalLink size={10} />
                </a>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <GoldBadge>{stake.active ? "● Active" : "○ Capped"}</GoldBadge>
          <span className="inline-flex items-center rounded-full border border-green-500/30 bg-green-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-green-400">
            {pkg.dailyRate} Daily
          </span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg border border-[#222] bg-[#0A0A0A] p-3 text-center">
          <p className="text-[10px] text-[#737373]">Invested</p>
          <p className="mt-1 text-[14px] font-bold text-white">
            ${parseFloat(stake.amountFormatted).toLocaleString()}
          </p>
        </div>
        <div className="rounded-lg border border-[#222] bg-[#0A0A0A] p-3 text-center">
          <p className="text-[10px] text-[#737373]">Total Claimed</p>
          <p className="mt-1 text-[14px] font-bold text-green-400">
            ${totalClaimedNum.toFixed(2)}
          </p>
        </div>
        <div className="rounded-lg border border-[#222] bg-[#0A0A0A] p-3 text-center">
          <p className="text-[10px] text-[#737373]">2X Cap</p>
          <p className="mt-1 text-[14px] font-bold text-[#FFB51D]">
            ${capNum.toLocaleString()}
          </p>
        </div>
        <div className="rounded-lg border border-[#222] bg-[#0A0A0A] p-3 text-center">
          <p className="text-[10px] text-[#737373]">Claimable Pending</p>
          <p className="mt-1 text-[14px] font-bold text-[#FFB51D]">
            ${pendingNum.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Progress towards 2X cap */}
      <div className="mt-4">
        <div className="mb-1 flex justify-between">
          <span className="text-[11px] text-[#A3A3A3]">Cap Progress</span>
          <span className="text-[11px] font-semibold text-[#FFB51D]">
            ${totalClaimedNum.toFixed(2)} / ${capNum.toLocaleString()} ({usedPercent}%)
          </span>
        </div>
        <div className="h-2.5 w-full rounded-full bg-[#222] overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#FFE28A] to-[#FFB51D] transition-all duration-500"
            style={{ width: `${usedPercent}%` }}
          />
        </div>
      </div>

      {/* Claim ROI Action */}
      {stake.active && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/5 pt-3">
          <div className="text-[11px] text-[#A3A3A3]">
            {canClaim ? (
              <span className="text-green-400 font-medium">
                ${pendingNum.toFixed(2)} ROI ready to claim (in HANA tokens)
              </span>
            ) : (
              <span>
                Pending: ${pendingNum.toFixed(2)} / $10.00 min required to claim
              </span>
            )}
          </div>
          <button
            onClick={handleClaim}
            disabled={!canClaim || isClaiming}
            className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-[#FFE28A] to-[#FFB51D] px-4 py-1.5 text-xs font-bold text-black transition hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isClaiming ? (
              <>
                <Loader2 size={13} className="animate-spin" /> Claiming...
              </>
            ) : (
              <>
                <Coins size={13} /> Claim ROI
              </>
            )}
          </button>
        </div>
      )}

      {claimError && (
        <p className="mt-2 text-xs text-red-400">{claimError}</p>
      )}
      {claimSuccessMsg && (
        <p className="mt-2 text-xs text-green-400">{claimSuccessMsg}</p>
      )}
    </div>
  );
}

export default function Staking() {
  const { address } = useAppKitAccount({ namespace: "eip155" });

  // Read Balances & User Contract Data
  const {
    balanceFormatted: usdtBalanceFormatted,
    rawBalanceNumber: usdtBalanceNum,
    refetch: refetchUsdt,
  } = useUsdtBalance(address);

  const {
    balanceFormatted: hanaBalanceFormatted,
    refetch: refetchHana,
  } = useHanaBalance(address);

  const {
    user,
    isLoading: userLoading,
    refetch: refetchUser,
  } = useUserData(address);

  const {
    stakes,
    isLoading: stakesLoading,
    refetch: refetchStakes,
  } = useUserStakes(address);

  // Staking history from on-chain Staked events
  const {
    stakingHistory,
    isLoading: historyLoading,
    isSyncingHistory,
    syncProgress,
    refetch: refetchHistory,
  } = useStakingHistory(address);

  // Staking Write Hook
  const {
    stake: executeStake,
    step: stakeStep,
    error: stakeError,
    txHash: stakeTxHash,
    reset: resetStake,
  } = useStakeTokens();

  // Selected package for modal/staking flow
  const [selectedPkg, setSelectedPkg] = useState(null);
  const [stakeAmount, setStakeAmount] = useState("");
  const [formError, setFormError] = useState("");

  const openStakeModal = (pkg) => {
    setSelectedPkg(pkg);
    setStakeAmount(pkg.minAmount.toString());
    setFormError("");
    resetStake();
  };

  const closeStakeModal = () => {
    setSelectedPkg(null);
    setStakeAmount("");
    setFormError("");
    resetStake();
  };

  const handleStakeSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!selectedPkg) return;

    const amountNum = parseFloat(stakeAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setFormError("Enter a valid stake amount.");
      return;
    }

    if (amountNum < selectedPkg.minAmount) {
      setFormError(`Minimum stake for ${selectedPkg.name} is $${selectedPkg.minAmount}.`);
      return;
    }

    if (selectedPkg.isDAO && user?.isDAO && amountNum % 1000 !== 0) {
      setFormError("DAO top-ups must be a multiple of $1,000.");
      return;
    }

    if (amountNum > usdtBalanceNum) {
      setFormError(
        `Insufficient USDT. You have $${usdtBalanceFormatted} USDT.`
      );
      return;
    }

    try {
      await executeStake(address, selectedPkg.id, amountNum);
      await refetchStakes();
      await refetchHistory();
      await refetchUsdt();
      await refetchHana();
      await refetchUser();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRefreshAll = () => {
    refetchStakes();
    refetchHistory();
    refetchUsdt();
    refetchHana();
    refetchUser();
  };

  const totalStakedDisplay = user?.totalStakedFormatted
    ? `$${parseFloat(user.totalStakedFormatted).toLocaleString()}`
    : "$0.00";

  const totalEarnedDisplay = user?.totalROIClaimedFormatted
    ? `$${parseFloat(user.totalROIClaimedFormatted).toLocaleString()}`
    : "$0.00";

  return (
    <div className="space-y-6 font-chakra-petch">
      {/* Wallet Balance Strip */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-white/10 bg-[#111] p-4 text-xs">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-[#737373]">USDT Balance:</span>
            <span className="font-bold text-white">${usdtBalanceFormatted} USDT</span>
          </div>
          <div className="h-3 w-px bg-white/10 hidden sm:block" />
          <div className="flex items-center gap-2">
            <span className="text-[#737373]">HANA Balance:</span>
            <span className="font-bold text-[#FFB51D]">{hanaBalanceFormatted} HANA</span>
          </div>
          <div className="h-3 w-px bg-white/10 hidden sm:block" />
          <div className="flex items-center gap-2 text-neutral-400">
            <span>Network:</span>
            <span className="inline-flex items-center gap-1 rounded bg-amber-400/10 px-2 py-0.5 text-[11px] font-semibold text-amber-300">
              BSC Testnet (Chain 97)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={getExplorerAddressUrl(CONTRACT_ADDRESSES.stakingContract)}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 text-[#FFB51D] hover:underline"
          >
            <span>Contract</span>
            <ExternalLink size={12} />
          </a>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          icon={Shield}
          label="Total Staked"
          value={totalStakedDisplay}
          sub={`${stakes.length} active position${stakes.length === 1 ? "" : "s"}`}
          color="gold"
        />
        <StatCard
          icon={TrendingUp}
          label="Total Earned"
          value={totalEarnedDisplay}
          sub="ROI claimed on-chain"
          color="blue"
        />
        <StatCard
          icon={Users}
          label="Valid Directs"
          value={user?.validDirects?.toString() || "0"}
          sub="Direct referrals staked"
          color="green"
        />
        <StatCard
          icon={Clock}
          label="Credit Interval"
          value="12 Hours"
          sub="Twice daily ROI"
          color="purple"
        />
      </div>

      {/* New Stake Packages */}
      <SectionCard
        title="New Staking Position"
        subtitle="Choose a package to stake USDT into the verified HANA contract on BSC Testnet"
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {DEFAULT_PACKAGES.map((pkg) => (
            <button
              key={pkg.id}
              onClick={() => openStakeModal(pkg)}
              className="group relative rounded-xl border border-white/10 bg-[#111] p-4 text-left transition-all hover:-translate-y-1 hover:border-[#FFB51D]/60 hover:shadow-[0_4px_20px_rgba(255,181,29,0.12)] cursor-pointer"
            >
              {pkg.popular && (
                <div className="absolute right-0 top-0 rounded-bl-xl rounded-tr-xl bg-gradient-to-r from-[#FFE28A] to-[#FFB51D] px-2 py-0.5">
                  <span className="text-[9px] font-bold text-black">BEST</span>
                </div>
              )}
              {pkg.isDAO && (
                <div className="absolute right-0 top-0 rounded-bl-xl rounded-tr-xl bg-gradient-to-r from-purple-400 to-indigo-500 px-2 py-0.5">
                  <span className="text-[9px] font-bold text-black">DAO</span>
                </div>
              )}
              <span className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">
                {pkg.name}
              </span>
              <p className="mt-1 text-[20px] font-bold text-white">
                ${pkg.minAmount.toLocaleString()}
              </p>
              <p className="mt-1 text-[11px] font-semibold text-[#FFB51D]">
                {pkg.dailyRate}/day
              </p>
              <p className="mt-0.5 text-[11px] text-[#737373]">Cap: {pkg.cap}</p>
              <div className="mt-3 flex items-center justify-center gap-1 rounded-md border border-[#222] bg-[#0A0A0A] py-1.5 transition group-hover:bg-[#FFB51D] group-hover:text-black">
                <Plus size={12} className="text-[#A3A3A3] group-hover:text-black" />
                <span className="text-[11px] font-medium text-[#A3A3A3] group-hover:text-black">
                  Stake
                </span>
              </div>
            </button>
          ))}
        </div>
      </SectionCard>

      {/* Active Stakes List */}
      <SectionCard
        title="Active Stakes"
        subtitle="Your real-time staking positions on BSC Testnet"
      >
        {stakesLoading ? (
          <div className="flex items-center justify-center py-12 text-[#FFB51D]">
            <Loader2 size={24} className="animate-spin mr-2" />
            <span className="text-sm">Loading staking positions...</span>
          </div>
        ) : stakes.length > 0 ? (
          <div className="space-y-4">
            {stakes.map((stake) => (
              <ActiveStakeItem
                key={stake.stakeIndex}
                stake={stake}
                userAddress={address}
                onClaimSuccess={handleRefreshAll}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-white/15 bg-white/[0.02] p-8 text-center">
            <Shield size={36} className="mx-auto mb-3 text-neutral-500" />
            <h4 className="text-sm font-bold text-white">No Active Stakes Yet</h4>
            <p className="mx-auto mt-1 max-w-sm text-xs text-neutral-400">
              Select one of the packages above to stake USDT and start earning daily ROI credited every 12 hours.
            </p>
          </div>
        )}
      </SectionCard>

      {/* Staking History */}
      <SectionCard
        title="Staking History"
        subtitle="All your on-chain staking transactions"
        action={
          <button
            onClick={() => refetchHistory()}
            disabled={historyLoading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-[#161616] px-3 py-1.5 text-xs font-medium text-neutral-300 hover:border-[#FFB51D]/40 hover:text-white transition disabled:opacity-50 cursor-pointer"
          >
            <Loader2 size={12} className={historyLoading ? "animate-spin" : ""} />
            Refresh
          </button>
        }
      >
        {/* Sync progress bar */}
        {isSyncingHistory && (
          <div className="mb-4">
            <div className="mb-1 flex justify-between text-[11px] text-[#737373]">
              <span>Scanning on-chain events...</span>
              <span>{syncProgress}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-[#222] overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#FFE28A] to-[#FFB51D] transition-all duration-300"
                style={{ width: `${syncProgress}%` }}
              />
            </div>
          </div>
        )}

        {historyLoading && stakingHistory.length === 0 ? (
          <div className="flex items-center justify-center py-10 text-[#FFB51D]">
            <Loader2 size={22} className="animate-spin mr-2" />
            <span className="text-xs">Loading staking history...</span>
          </div>
        ) : stakingHistory.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[580px] text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 text-[#737373] uppercase tracking-wider text-[11px]">
                  <th className="pb-3 pr-4 font-semibold">#</th>
                  <th className="pb-3 pr-4 font-semibold">Package</th>
                  <th className="pb-3 pr-4 font-semibold">Amount</th>
                  <th className="pb-3 pr-4 font-semibold">Daily Rate</th>
                  <th className="pb-3 pr-4 font-semibold">Date</th>
                  <th className="pb-3 font-semibold text-right">Tx Hash</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {stakingHistory.map((item) => (
                  <tr key={item.txHash + item.stakeIndex} className="hover:bg-white/[0.02] transition">
                    <td className="py-3.5 pr-4">
                      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[#FFB51D]/10 text-[11px] font-bold text-[#FFB51D]">
                        #{item.stakeIndex + 1}
                      </span>
                    </td>
                    <td className="py-3.5 pr-4">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">{item.packageName}</span>
                        {DEFAULT_PACKAGES.find(p => p.id === item.packageId)?.isDAO && (
                          <span className="rounded-full bg-purple-500/20 border border-purple-500/30 px-1.5 py-0.5 text-[9px] font-bold text-purple-300">DAO</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 pr-4">
                      <span className="font-bold text-[#FFB51D]">
                        ${item.amountNumber.toLocaleString()} USDT
                      </span>
                    </td>
                    <td className="py-3.5 pr-4">
                      <span className="inline-flex items-center rounded-full border border-green-500/30 bg-green-500/10 px-2 py-0.5 text-[10px] font-semibold text-green-400">
                        {item.dailyRate}
                      </span>
                    </td>
                    <td className="py-3.5 pr-4 text-[#A3A3A3]">
                      {item.dateFormatted}
                    </td>
                    <td className="py-3.5 text-right">
                      <a
                        href={item.explorerUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-[#FFB51D]/20 bg-[#FFB51D]/5 px-2.5 py-1 text-xs font-mono font-medium text-[#FFB51D] hover:bg-[#FFB51D]/15 transition"
                        title={item.txHash}
                      >
                        {item.txShort}
                        <ExternalLink size={11} />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.01] p-8 text-center">
            <Clock size={28} className="mx-auto mb-2 text-neutral-500" />
            <p className="text-xs font-medium text-white">No Staking Transactions Yet</p>
            <p className="mt-1 text-[11px] text-neutral-400">
              Your staking transactions will appear here once you stake into any package.
            </p>
          </div>
        )}
      </SectionCard>

      {/* Sub-ID Rules */}
      <SectionCard
        title="Sub-ID & Staking Rules"
        subtitle="Protocol rules for staking, sub-accounts, and capping"
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {subIdRules.map((rule, i) => (
            <div
              key={i}
              className="flex items-start gap-3 rounded-lg border border-[#222] bg-[#0A0A0A] p-3"
            >
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#FFB51D]/10 text-[9px] font-bold text-[#FFB51D]">
                {i + 1}
              </div>
              <p className="text-[12px] text-[#A3A3A3]">{rule}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-lg border border-[#222] bg-[#0A0A0A] p-4">
          <div className="flex items-start gap-2">
            <Info size={13} className="mt-0.5 text-[#FFB51D] shrink-0" />
            <p className="text-[12px] text-[#A3A3A3]">
              <span className="font-semibold text-white">Capping Note:</span> Level
              Income + ROI + Direct Referral income all count toward your 2X capping.
              Rank Income and DAO Income are{" "}
              <span className="text-green-400 font-semibold">excluded</span> from
              capping calculations.
            </p>
          </div>
        </div>
      </SectionCard>

      {/* Credit Schedule */}
      {/* <SectionCard title="Credit Schedule" subtitle="How ROI is credited to your account">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            {
              icon: Clock,
              color: "text-[#FFB51D]",
              bg: "bg-[#FFB51D]/10",
              title: "Every 12 Hours",
              desc: "ROI is split into two equal halves and credited at 12-hour intervals automatically.",
            },
            {
              icon: Zap,
              color: "text-[#FFB51D]",
              bg: "bg-[#FFB51D]/10",
              title: "Instant Credit",
              desc: "Direct referral income (5%) is credited immediately when a referral stakes any package.",
            },
            {
              icon: CheckCircle,
              color: "text-green-400",
              bg: "bg-green-500/10",
              title: "Level Income",
              desc: "Level income (ROI of ROI) is credited whenever your downline receives their ROI credit.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-lg border border-[#222] bg-[#0A0A0A] p-4"
            >
              <div
                className={`mb-2 flex h-8 w-8 items-center justify-center rounded-lg ${item.bg}`}
              >
                <item.icon size={15} className={item.color} />
              </div>
              <p className="text-[13px] font-semibold text-white">{item.title}</p>
              <p className="mt-1 text-[11px] text-[#A3A3A3]">{item.desc}</p>
            </div>
          ))}
        </div>
      </SectionCard> */}

      {/* Staking Modal / Dialog */}
      {selectedPkg && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md rounded-2xl border border-[#FFB51D]/30 bg-[#141414] p-6 shadow-2xl">
            <button
              onClick={closeStakeModal}
              className="absolute right-4 top-4 text-neutral-400 hover:text-white"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#FFE28A] to-[#FFB51D]">
                <Shield size={20} className="text-black" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">
                  Stake in {selectedPkg.name} Package
                </h3>
                <p className="text-xs text-neutral-400">
                  Daily ROI: <span className="text-[#FFB51D] font-semibold">{selectedPkg.dailyRate}</span> · 2X Capping
                </p>
              </div>
            </div>

            {stakeStep === "success" ? (
              <div className="py-4 text-center">
                <CheckCircle size={48} className="mx-auto mb-3 text-green-400" />
                <h4 className="text-base font-bold text-white">Staking Successful!</h4>
                <p className="mt-1 text-xs text-neutral-300">
                  Your position has been activated on the BSC Testnet contract.
                </p>
                {stakeTxHash && (
                  <a
                    href={getExplorerTxUrl(stakeTxHash)}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex items-center gap-1.5 text-xs text-[#FFB51D] underline"
                  >
                    <span>View on BscScan</span>
                    <ExternalLink size={12} />
                  </a>
                )}
                <button
                  onClick={closeStakeModal}
                  className="mt-6 w-full rounded-lg bg-gradient-to-r from-[#FFE28A] to-[#FFB51D] py-2.5 text-sm font-bold text-black transition hover:brightness-110"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleStakeSubmit} className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <label className="text-neutral-300">Amount to Stake (USDT)</label>
                    <span className="text-neutral-400">
                      Balance: <strong className="text-white">${usdtBalanceFormatted}</strong>
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      step="any"
                      min={selectedPkg.minAmount}
                      value={stakeAmount}
                      readOnly
                      disabled={stakeStep !== "idle" && stakeStep !== "error"}
                      className="w-full rounded-xl border border-white/20 bg-black/60 px-4 py-3 text-white focus:border-[#FFB51D] focus:outline-none read-only:cursor-not-allowed"
                      placeholder={`Minimum $${selectedPkg.minAmount}`}
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-neutral-400">
                    Minimum required: ${selectedPkg.minAmount} USDT
                  </p>
                </div>

                {/* Staking Summary */}
                <div className="rounded-xl border border-white/10 bg-black/40 p-3 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Selected Package</span>
                    <span className="font-semibold text-white">{selectedPkg.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Daily Return</span>
                    <span className="font-semibold text-[#FFB51D]">{selectedPkg.dailyRate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Expected 2X Cap</span>
                    <span className="font-semibold text-green-400">
                      ${(parseFloat(stakeAmount || 0) * 2).toLocaleString()} USDT
                    </span>
                  </div>
                </div>

                {/* Progress Indicators */}
                {stakeStep !== "idle" && stakeStep !== "error" && (
                  <div className="rounded-lg border border-[#FFB51D]/30 bg-[#FFB51D]/10 p-3 text-xs text-[#FFB51D] flex items-center gap-2">
                    <Loader2 size={16} className="animate-spin shrink-0" />
                    <span>
                      {stakeStep === "checking" && "Checking balances and allowances..."}
                      {stakeStep === "approving" && "Please approve USDT allowance in your wallet..."}
                      {stakeStep === "approved" && "USDT approved! Initiating staking..."}
                      {stakeStep === "staking" && "Confirm staking transaction in your wallet..."}
                      {stakeStep === "confirming" && "Staking submitted! Waiting for BSC block confirmation..."}
                    </span>
                  </div>
                )}

                {(formError || stakeError) && (
                  <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400 flex items-start gap-2">
                    <AlertCircle size={15} className="shrink-0 mt-0.5" />
                    <span>{formError || stakeError}</span>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={closeStakeModal}
                    className="w-1/3 rounded-lg border border-white/20 py-2.5 text-xs font-semibold text-neutral-300 hover:bg-white/5"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={stakeStep !== "idle" && stakeStep !== "error"}
                    className="w-2/3 rounded-lg bg-gradient-to-r from-[#FFE28A] to-[#FFB51D] py-2.5 text-xs font-bold text-black transition hover:brightness-110 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {stakeStep === "approving" ? (
                      <>
                        <Loader2 size={14} className="animate-spin" /> Approving USDT...
                      </>
                    ) : stakeStep === "staking" || stakeStep === "confirming" ? (
                      <>
                        <Loader2 size={14} className="animate-spin" /> Staking...
                      </>
                    ) : (
                      <>
                        Confirm Stake <Plus size={14} />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
