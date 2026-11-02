import { useEffect, useState, useMemo } from "react";
import {
  Wallet,
  TrendingUp,
  Users,
  Coins,
  Flame,
  Award,
  Clock,
  Shield,
  Zap,
  Copy,
  Check,
  Sparkles,
} from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Link } from "react-router-dom";
import StatCard from "../components/StatCard";
import SectionCard from "../components/SectionCard";
import GoldBadge from "../components/GoldBadge";
<<<<<<< HEAD
import {
  useUserData,
  useUserStakes,
  useUsdtBalance,
  useHanaBalance,
} from "../../contracts/hooks";

const earningsData = [
  { day: "Day 1", roi: 5, direct: 2, level: 1 },
  { day: "Day 3", roi: 8, direct: 5, level: 2 },
  { day: "Day 5", roi: 12, direct: 5, level: 3 },
  { day: "Day 7", roi: 14, direct: 10, level: 4 },
  { day: "Day 9", roi: 16, direct: 10, level: 6 },
  { day: "Day 11", roi: 20, direct: 15, level: 7 },
  { day: "Day 14", roi: 24, direct: 20, level: 9 },
];

const incomeBreakdown = [
  { name: "ROI Income", value: 45, color: "#FFB51D" },
  { name: "Direct Income", value: 25, color: "#E5E5E5" },
  { name: "Level Income", value: 20, color: "#a78bfa" },
  { name: "Rank Rewards", value: 10, color: "#34d399" },
];

const recentActivity = [
  { type: "ROI Credit", amount: "+$5.00", time: "12 hrs ago", icon: TrendingUp, color: "text-[#FFB51D]" },
  { type: "Direct Referral", amount: "+$25.00", time: "1 day ago", icon: Users, color: "text-[#FFB51D]" },
  { type: "Level 2 Income", amount: "+$3.50", time: "1 day ago", icon: Coins, color: "text-purple-400" },
  { type: "Withdrawal", amount: "-$100.00", time: "2 days ago", icon: Wallet, color: "text-red-400" },
  { type: "ROI Credit", amount: "+$5.00", time: "2 days ago", icon: TrendingUp, color: "text-[#FFB51D]" },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-[#222] bg-[#111] p-3 shadow-xl">
        <p className="mb-2 text-[12px] font-medium text-[#A3A3A3]">{label}</p>
        {payload.map((entry) => (
          <p key={entry.name} className="text-[12px]" style={{ color: entry.color }}>
            {entry.name}: <span className="font-bold">${entry.value}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function Overview() {
  const [toast, setToast] = useState("");
  const { address } = useAppKitAccount({ namespace: "eip155" });
  const { user } = useUserData(address);
  const { stakes } = useUserStakes(address);
  const { balanceFormatted: usdtBalance } = useUsdtBalance(address);
  const { balanceFormatted: hanaBalance } = useHanaBalance(address);
=======
import DataUnavailable from "../components/DataUnavailable";
import { useWeb3 } from "../../context/Web3Context";

export default function Overview() {
  const [toast, setToast] = useState("");
  const {
    address,
    usdtBalance,
    hanaBalance,
    hanaPrice,
    totalStaked,
    totalDirectIncome,
    totalLevelIncome,
    totalRankIncome,
    userStakes,
    totalPendingROI,
    claimAllROI,
    isTransacting,
    isDAO,
    formatAddress,
  } = useWeb3();
>>>>>>> a517f8edf55efb225c43ad309cdcbb680f4eadf4

  const referralLink = address
    ? `${window.location.origin}/register?ref=${encodeURIComponent(address)}`
    : "";

  const totalEarnedNum = useMemo(() => {
    const direct = parseFloat(totalDirectIncome) || 0;
    const level = parseFloat(totalLevelIncome) || 0;
    const rank = parseFloat(totalRankIncome) || 0;
    const roiClaimed = userStakes.reduce(
      (acc, s) => acc + (parseFloat(s.totalClaimed) || 0),
      0
    );
    return (direct + level + rank + roiClaimed).toFixed(2);
  }, [totalDirectIncome, totalLevelIncome, totalRankIncome, userStakes]);

  const activeStakesCount = userStakes.filter((s) => s.active).length;
  const totalPositionCap = userStakes.reduce(
    (acc, stake) => acc + (parseFloat(stake.cap) || 0),
    0
  );
  const totalRoiClaimed = userStakes.reduce(
    (acc, stake) => acc + (parseFloat(stake.totalClaimed) || 0),
    0
  );

  const incomeBreakdown = useMemo(() => [
    { name: "Pending ROI", value: parseFloat(totalPendingROI) || 0, color: "#FFB51D" },
    { name: "Direct Income", value: parseFloat(totalDirectIncome) || 0, color: "#E5E5E5" },
    { name: "Level Income", value: parseFloat(totalLevelIncome) || 0, color: "#a78bfa" },
    { name: "Rank Income", value: parseFloat(totalRankIncome) || 0, color: "#34d399" },
  ], [totalPendingROI, totalDirectIncome, totalLevelIncome, totalRankIncome]);
  const incomeTotal = incomeBreakdown.reduce((sum, item) => sum + item.value, 0);
  const latestStakes = [...userStakes]
    .sort((a, b) => b.startTime - a.startTime)
    .slice(0, 5);

  useEffect(() => {
    if (!toast) return undefined;
    const timeoutId = window.setTimeout(() => setToast(""), 2500);
    return () => window.clearTimeout(timeoutId);
  }, [toast]);

  const copyReferralLink = async () => {
    if (!referralLink) {
      setToast("Connect a wallet to create your referral link");
      return;
    }
    try {
      await navigator.clipboard.writeText(referralLink);
      setToast("Referral link copied");
    } catch (error) {
      console.error("Unable to copy referral link:", error);
      setToast("Could not copy referral link");
    }
  };

  const totalStaked = parseFloat(user?.totalStakedFormatted || 0);
  const totalClaimed = parseFloat(user?.totalROIClaimedFormatted || 0);
  const directIncome = parseFloat(user?.totalDirectFormatted || 0);
  const levelIncome = parseFloat(user?.totalLevelFormatted || 0);

  return (
    <div className="space-y-6 font-chakra-petch">
      {toast && (
        <div
          className="fixed right-5 top-5 z-[120] flex items-center gap-2 rounded-lg border border-[#FFB51D]/40 bg-[#15120A] px-4 py-3 text-sm font-semibold text-[#F8E096] shadow-[0_8px_30px_rgba(0,0,0,0.5),0_0_18px_rgba(255,181,29,0.12)]"
          role="status"
        >
          {toast === "Referral link copied" && <Check size={16} />}
          {toast}
        </div>
      )}

      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-xl border border-[#FFB51D]/20 bg-gradient-to-r from-[#111111] via-[#111111] to-[#0A0A0A] p-5 sm:p-6">
        <div className="pointer-events-none absolute right-0 top-0 h-64 w-64 rounded-full bg-[#FFB51D]/5 blur-3xl" />
        <div className="pointer-events-none absolute left-1/2 bottom-0 h-32 w-32 rounded-full bg-white/[0.04] blur-2xl" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
<<<<<<< HEAD
              <GoldBadge>{user?.isLeader ? "👑 Leader" : "🌟 Member"}</GoldBadge>
              <GoldBadge>{user?.isDAO ? "DAO Member" : "Standard"}</GoldBadge>
=======
              <GoldBadge>{isDAO ? "DAO Member" : "No DAO membership"}</GoldBadge>
              <GoldBadge>{activeStakesCount > 0 ? `${activeStakesCount} Active Stake(s)` : "Ready to Stake"}</GoldBadge>
>>>>>>> a517f8edf55efb225c43ad309cdcbb680f4eadf4
            </div>
            <h2 className="mt-2 text-[20px] sm:text-[24px] font-bold text-white">
              Welcome back, <span className="gold-gradient-text">{address ? formatAddress(address) : "Hana Member"}</span>
            </h2>
            <p className="mt-1 text-[13px] text-[#A3A3A3]">
<<<<<<< HEAD
              Active Positions: {stakes?.length || 0} · Network: BSC Testnet (Chain 97)
=======
              Wallet: {address ? formatAddress(address) : "Not connected"} · Total Staked: ${parseFloat(totalStaked || "0").toLocaleString()} · DAO: {isDAO ? "Member" : "Not joined"}
>>>>>>> a517f8edf55efb225c43ad309cdcbb680f4eadf4
            </p>
            <div className="mt-3 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[13px] text-[#A3A3A3]">Referral link:</span>
                <code className="min-w-0 break-all rounded-md border border-[#FFB51D]/10 bg-black/40 px-2.5 py-1 font-mono text-xs text-[#F8E096]">
                  {referralLink || "Connect wallet to view referral link"}
                </code>
                <button
                  className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-semibold transition-all duration-300 ease-out hover:-translate-y-0.5 hover:bg-[#FFB51D]/10 active:scale-95 ${
                    toast === "Referral link copied"
                      ? "border-[#FFB51D]/60 bg-[#FFB51D]/10 text-[#F8E096] shadow-[0_0_12px_rgba(255,181,29,0.2)]"
                      : "border-[#FFB51D]/30 text-[#FFB51D]"
                  }`}
                  onClick={copyReferralLink}
                  type="button"
                >
                  {toast === "Referral link copied" ? (
                    <Check className="animate-[bounce_0.5s_ease-out]" size={13} />
                  ) : (
                    <Copy size={13} />
                  )}
                  {toast === "Referral link copied" ? "Copied!" : "Copy link"}
                </button>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-start gap-2 sm:items-end">
            <div className="flex items-center gap-2 rounded-lg border border-[#222] bg-[#0A0A0A] px-4 py-2">
              <Clock size={14} className="text-[#FFB51D]" />
<<<<<<< HEAD
              <span className="text-[12px] text-[#A3A3A3]">Credit Interval:</span>
              <span className="text-[14px] font-bold text-[#FFB51D]">Every 12h</span>
            </div>
            <p className="text-[11px] text-[#737373]">ROI split in 2 equal halves</p>
=======
              <span className="text-[12px] text-[#A3A3A3]">Cycle:</span>
              <span className="text-[14px] font-bold text-[#FFB51D]">12 Hours</span>
            </div>
            <p className="text-[11px] text-[#737373]">ROI credited every 12h</p>
>>>>>>> a517f8edf55efb225c43ad309cdcbb680f4eadf4
          </div>
        </div>
      </div>

      {/* Pending ROI Claim Banner */}
      {parseFloat(totalPendingROI || "0") > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl border border-[#FFB51D]/40 bg-gradient-to-r from-[#FFB51D]/10 via-[#FFB51D]/5 to-transparent p-4 sm:p-5 shadow-[0_0_20px_rgba(255,181,29,0.1)]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#FFE28A] to-[#FFB51D]">
              <Sparkles size={20} className="text-black" />
            </div>
            <div>
              <p className="text-[15px] font-bold text-white">Pending Staking Reward Ready!</p>
              <p className="text-[12px] text-[#A3A3A3]">
                You have <span className="text-[#FFB51D] font-bold">${totalPendingROI} USDT</span> equivalent ROI available to claim into HANA tokens.
              </p>
            </div>
          </div>
          <button
            onClick={() => claimAllROI()}
            disabled={isTransacting}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#FFE28A] to-[#FFB51D] px-5 py-2.5 text-xs font-bold text-black shadow-lg hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
          >
            <Sparkles size={14} />
            {isTransacting ? "Claiming..." : "Claim All Pending ROI"}
          </button>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
        <StatCard
          icon={Wallet}
          label="USDT Balance"
<<<<<<< HEAD
          value={`$${usdtBalance}`}
          sub="Wallet balance"
          color="gold"
        />
        <StatCard
          icon={Coins}
          label="HANA Balance"
          value={`${hanaBalance}`}
          sub="Tokens allotted"
=======
          value={`$${parseFloat(usdtBalance || "0").toFixed(2)}`}
          sub={`${parseFloat(hanaBalance || "0").toFixed(2)} HANA`}
          color="gold"
        />
        <StatCard
          icon={TrendingUp}
          label="Total Earned"
          value={`$${totalEarnedNum}`}
          sub="Claimed and distributed income"
>>>>>>> a517f8edf55efb225c43ad309cdcbb680f4eadf4
          color="blue"
        />
        <StatCard
          icon={Shield}
          label="Total Staked"
<<<<<<< HEAD
          value={`$${totalStaked.toLocaleString()}`}
          sub={`${stakes?.length || 0} active position${stakes?.length === 1 ? "" : "s"}`}
          color="green"
        />
        <StatCard
          icon={TrendingUp}
          label="Total ROI Claimed"
          value={`$${totalClaimed.toLocaleString()}`}
          sub="Direct contract earnings"
=======
          value={`$${parseFloat(totalStaked || "0").toLocaleString()}`}
          sub={`${activeStakesCount} active position(s)`}
          color="green"
        />
        <StatCard
          icon={Award}
          label="DAO Membership"
          value={isDAO ? "Member" : "Not joined"}
          sub="On-chain membership status"
>>>>>>> a517f8edf55efb225c43ad309cdcbb680f4eadf4
          color="purple"
        />
      </div>

      {/* Second row stats */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
        <StatCard
<<<<<<< HEAD
          icon={Users}
          label="Valid Directs"
          value={user?.validDirects?.toString() || "0"}
          sub="Level qualified members"
=======
          icon={Coins}
          label="Claimable ROI"
          value={`$${totalPendingROI}`}
          sub="Credited every 12h"
>>>>>>> a517f8edf55efb225c43ad309cdcbb680f4eadf4
          color="gold"
        />
        <StatCard
          icon={Users}
          label="Direct Income"
<<<<<<< HEAD
          value={`$${directIncome.toLocaleString()}`}
          sub="5% direct referral"
=======
          value={`$${parseFloat(totalDirectIncome || "0").toFixed(2)}`}
          sub="Cumulative contract total"
>>>>>>> a517f8edf55efb225c43ad309cdcbb680f4eadf4
          color="blue"
        />
        <StatCard
          icon={Zap}
          label="Level Income"
<<<<<<< HEAD
          value={`$${levelIncome.toLocaleString()}`}
          sub="Downline ROI matching"
          color="green"
        />
        <StatCard
          icon={Award}
          label="DAO Earnings"
          value={`$${parseFloat(user?.totalDAOFormatted || 0).toLocaleString()}`}
          sub="Weekly pool share"
          color="purple"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Earnings Chart */}
        <SectionCard
          title="Earnings Overview"
          subtitle="Performance tracking"
          className="lg:col-span-2"
        >
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={earningsData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="roiGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FFB51D" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#FFB51D" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="directGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#E5E5E5" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#E5E5E5" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="levelGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#a78bfa" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#222222" />
              <XAxis dataKey="day" tick={{ fill: "#737373", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#737373", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="roi" name="ROI" stroke="#FFB51D" strokeWidth={2} fill="url(#roiGrad)" />
              <Area type="monotone" dataKey="direct" name="Direct" stroke="#E5E5E5" strokeWidth={2} fill="url(#directGrad)" />
              <Area type="monotone" dataKey="level" name="Level" stroke="#a78bfa" strokeWidth={2} fill="url(#levelGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </SectionCard>

        {/* Income Breakdown */}
        <SectionCard title="Income Breakdown" subtitle="Distribution of earnings" className="min-w-0">
          <div className="min-w-0">
            <ResponsiveContainer width="100%" height={190}>
              <PieChart>
                <Pie
                  data={incomeBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius="48%"
                  outerRadius="70%"
                  paddingAngle={4}
                  dataKey="value"
                >
                  {incomeBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-2">
              {incomeBreakdown.map((entry) => (
                <div key={entry.name} className="flex min-w-0 items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="truncate text-[11px] text-[#A3A3A3]">{entry.name}</span>
                  <span className="ml-auto text-[11px] font-semibold text-white">{entry.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </SectionCard>
      </div>

=======
          value={`$${parseFloat(totalLevelIncome || "0").toFixed(2)}`}
          sub="Lifetime distributed"
          color="green"
        />
        <StatCard
          icon={Flame}
          label="HANA Price"
          value={`$${parseFloat(hanaPrice || "0").toFixed(4)}`}
          sub="Contract DEX Price"
          color="red"
        />
      </div>

      {/* Time-series history is not indexed; only current on-chain totals are available. */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SectionCard title="Earnings History" subtitle="Historical events are not indexed in this dashboard">
          <DataUnavailable>
            The contract exposes current cumulative totals and pending ROI, but no historical earnings series is loaded here.
          </DataUnavailable>
        </SectionCard>

        <SectionCard title="Income Breakdown" subtitle="Current on-chain cumulative totals">
          {incomeTotal <= 0 ? (
            <DataUnavailable>No on-chain income totals are available to chart yet.</DataUnavailable>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={190}>
                <PieChart>
                  <Pie
                    data={incomeBreakdown.filter((entry) => entry.value > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius="48%"
                    outerRadius="70%"
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {incomeBreakdown
                      .filter((entry) => entry.value > 0)
                      .map((entry) => (
                        <Cell key={entry.name} fill={entry.color} strokeWidth={0} />
                      ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-2">
                {incomeBreakdown.map((entry) => (
                  <div key={entry.name} className="flex min-w-0 items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: entry.color }}
                    />
                    <span className="truncate text-[11px] text-[#A3A3A3]">{entry.name}</span>
                    <span className="ml-auto text-[11px] font-semibold text-white">
                      ${entry.value.toFixed(2)} ({((entry.value / incomeTotal) * 100).toFixed(1)}%)
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SectionCard title="Staking Positions" subtitle="Most recently created positions recorded on-chain">
          {latestStakes.length === 0 ? (
            <DataUnavailable>No staking positions were returned for this wallet.</DataUnavailable>
          ) : (
            <div className="space-y-3">
              {latestStakes.map((stake) => (
                <div key={stake.index} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#222] bg-[#0A0A0A] px-4 py-3">
                  <div>
                    <p className="text-[13px] font-medium text-white">
                      Position #{stake.index + 1} · ${Number(stake.amount).toLocaleString()}
                    </p>
                    <p className="text-[11px] text-[#737373]">
                      Started {new Date(stake.startTime * 1000).toLocaleDateString()} · {stake.active ? "Active" : "Inactive"}
                    </p>
                  </div>
                  <p className="text-[12px] text-[#A3A3A3]">
                    Claimed ${Number(stake.totalClaimed).toFixed(2)} / ${Number(stake.cap).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard title="Position ROI Cap" subtitle="Claimed ROI compared with caps stored on-chain">
          {totalPositionCap <= 0 ? (
            <DataUnavailable>No on-chain stake caps are available for this wallet.</DataUnavailable>
          ) : (
            <div>
              <div className="mb-1.5 flex justify-between">
                <span className="text-[12px] text-[#A3A3A3]">Claimed / Total Position Caps</span>
                <span className="text-[12px] font-semibold text-[#FFB51D]">
                  ${totalRoiClaimed.toFixed(2)} / ${totalPositionCap.toFixed(2)}
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-[#222]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#FFE28A] to-[#FFB51D]"
                  style={{ width: `${Math.min(100, (totalRoiClaimed / totalPositionCap) * 100)}%` }}
                />
              </div>
              <p className="mt-1 text-[11px] text-[#737373]">
                {((totalRoiClaimed / totalPositionCap) * 100).toFixed(1)}% of recorded stake caps claimed
              </p>
            </div>
          )}
          <p className="mt-4 text-[11px] leading-relaxed text-[#737373]">
            The contract tracks a cap per stake; rank, network and withdrawal progress are not available from its current user data.
          </p>
        </SectionCard>
      </div>

>>>>>>> a517f8edf55efb225c43ad309cdcbb680f4eadf4
      {/* Quick Links */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "New Stake", icon: Shield, path: "/dashboard/staking", color: "from-[#FFE28A]/10 to-[#FFB51D]/5 border-[#FFB51D]/20 text-[#FFB51D]" },
          { label: "View Packages", icon: Award, path: "/dashboard/packages", color: "from-purple-500/10 to-violet-500/5 border-purple-500/20 text-purple-400" },
          { label: "Level Income", icon: Users, path: "/dashboard/levels", color: "from-white/10 to-white/5 border-white/15 text-neutral-200" },
          { label: "Withdraw Tokens", icon: Wallet, path: "/dashboard/withdrawals", color: "from-green-500/10 to-emerald-500/5 border-green-500/20 text-green-400" },
        ].map((item) => (
          <Link
            key={item.label}
            to={item.path}
            className={`flex flex-col items-center gap-2 rounded-xl border bg-gradient-to-br ${item.color} p-4 text-center transition-all hover:-translate-y-0.5 hover:shadow-lg`}
          >
            <item.icon size={20} />
            <span className="text-[12px] font-semibold">{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
