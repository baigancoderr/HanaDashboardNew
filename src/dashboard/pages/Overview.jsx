import { useEffect, useState } from "react";
import { useAppKitAccount } from "@reown/appkit/react";
import {
  Wallet,
  TrendingUp,
  Users,
  Coins,
  Award,
  ArrowUpRight,
  Clock,
  Shield,
  Zap,
  Copy,
  Check,
  ExternalLink,
  Loader2,
  History,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import StatCard from "../components/StatCard";
import SectionCard from "../components/SectionCard";
import GoldBadge from "../components/GoldBadge";
import {
  useUserData,
  useUserStakes,
  useUsdtBalance,
  useHanaBalance,
} from "../../contracts/hooks";
import { DEFAULT_PACKAGES, getExplorerTxUrl } from "../../contracts/config";

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
  const { stakes, isLoading: stakesLoading } = useUserStakes(address);
  const { balanceFormatted: usdtBalance } = useUsdtBalance(address);
  const { balanceFormatted: hanaBalance } = useHanaBalance(address);

  const referralLink = address
    ? `${window.location.origin}/register?ref=${encodeURIComponent(address)}`
    : "";

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
              <GoldBadge>{user?.isLeader ? "👑 Leader" : "🌟 Member"}</GoldBadge>
              <GoldBadge>{user?.isDAO ? "DAO Member" : "Standard"}</GoldBadge>
            </div>
            <h2 className="mt-2 text-[20px] sm:text-[24px] font-bold text-white">
              Welcome back, <span className="gold-gradient-text">Hana Member</span>
            </h2>
            <p className="mt-1 text-[13px] text-[#A3A3A3]">
              Active Positions: {stakes?.length || 0} · Network: BSC Testnet (Chain 97)
            </p>
            <div className="mt-3 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[13px] text-[#A3A3A3]">Referral link:</span>
                <code className="min-w-0 break-all rounded-md border border-[#FFB51D]/10 bg-black/40 px-2.5 py-1 font-mono text-xs text-[#F8E096]">
                  {referralLink || "Connect wallet to create a referral link"}
                </code>
                <button
                  className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-semibold transition-all duration-300 ease-out hover:-translate-y-0.5 hover:bg-[#FFB51D]/10 active:scale-95 cursor-pointer ${
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
              <span className="text-[12px] text-[#A3A3A3]">Credit Interval:</span>
              <span className="text-[14px] font-bold text-[#FFB51D]">Every 12h</span>
            </div>
            <p className="text-[11px] text-[#737373]">ROI split in 2 equal halves</p>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          icon={Wallet}
          label="USDT Balance"
          value={`$${usdtBalance}`}
          sub="Wallet balance"
          color="gold"
        />
        <StatCard
          icon={Coins}
          label="HANA Balance"
          value={`${hanaBalance}`}
          sub="Tokens allotted"
          color="blue"
        />
        <StatCard
          icon={Shield}
          label="Total Staked"
          value={`$${totalStaked.toLocaleString()}`}
          sub={`${stakes?.length || 0} active position${stakes?.length === 1 ? "" : "s"}`}
          color="green"
        />
        <StatCard
          icon={TrendingUp}
          label="Total ROI Claimed"
          value={`$${totalClaimed.toLocaleString()}`}
          sub="Direct contract earnings"
          color="purple"
        />
      </div>

      {/* Second row stats */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          icon={Users}
          label="Valid Directs"
          value={user?.validDirects?.toString() || "0"}
          sub="Level qualified members"
          color="gold"
        />

        <StatCard
          icon={Coins}
          label="Withdrawable Amount"
          value={`${parseFloat(user?.hanaBalanceFormatted || "0").toLocaleString(undefined, { maximumFractionDigits: 2 })} HANA`}
          sub="HANA balance from staking contract"
          color="blue"
        />

        {/* <StatCard
          icon={Users}
          label="Direct Income"
          value={`$${directIncome.toLocaleString()}`}
          sub="5% direct referral"
          color="blue"
        /> */}


        <StatCard
          icon={Zap}
          label="Level Income"
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

      {/* Active Staking Positions for Connected Wallet */}
      {/* <SectionCard
        title="Your Active Staking Positions"
        subtitle={`${stakes?.length || 0} position${stakes?.length === 1 ? "" : "s"} · BSC Testnet`}
        className="border-[#FFB51D]/20 bg-gradient-to-br from-[#17140D] via-[#111] to-[#0B0B0B]"
        action={
          <a
            href="/dashboard/staking"
            className="inline-flex w-fit items-center gap-1.5 rounded-lg border border-[#FFB51D]/25 bg-[#FFB51D]/[0.07] px-3 py-2 text-xs font-semibold text-[#FFCF61] transition hover:border-[#FFB51D]/50 hover:bg-[#FFB51D]/[0.12]"
          >
            <span>New Stake / Manage</span>
            <ExternalLink size={12} />
          </a>
        }
      >
        {stakesLoading ? (
          <div className="flex items-center justify-center py-8 text-[#FFB51D]">
            <Loader2 size={20} className="animate-spin mr-2" />
            <span className="text-xs">Loading active positions...</span>
          </div>
        ) : stakes && stakes.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {stakes.map((stake) => {
              const pkg =
                DEFAULT_PACKAGES.find((p) => p.id === stake.packageId) ||
                DEFAULT_PACKAGES[0];
              const totalClaimedNum =
                parseFloat(stake.totalClaimedFormatted) || 0;
              const capNum = parseFloat(stake.capFormatted) || 0;
              const amountNum = parseFloat(stake.amountFormatted) || 0;
              const usedPercent = Math.min(
                100,
                Math.max(
                  0,
                  capNum > 0 ? Math.round((totalClaimedNum / capNum) * 100) : 0
                )
              );
              const startDate = stake.startTime
                ? new Date(stake.startTime * 1000).toLocaleDateString("en-US", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })
                : "Active Position";

              return (
                <div
                  key={stake.stakeIndex}
                  className="group relative overflow-hidden rounded-xl border border-white/[0.08] bg-gradient-to-br from-[#1A1710] via-[#111] to-[#0A0A0A] p-4 transition-all hover:border-[#FFB51D]/35 hover:shadow-[0_8px_24px_rgba(0,0,0,0.2)] sm:p-5"
                >
                  <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[#FFB51D]/[0.05] blur-3xl transition group-hover:bg-[#FFB51D]/10" />
                  <div className="relative">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-bold tracking-wide text-white">
                            {pkg.name} Package
                          </p>
                          <GoldBadge>{pkg.isDAO ? "DAO" : "Main"}</GoldBadge>
                        </div>
                        <p className="mt-1 text-[11px] text-[#858585]">
                          Position #{stake.stakeIndex + 1}
                          <span className="mx-1.5 text-white/20">·</span>
                          Started {startDate}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold ${
                            stake.active
                              ? "border-green-500/25 bg-green-500/10 text-green-400"
                              : "border-white/10 bg-white/5 text-[#A3A3A3]"
                          }`}
                        >
                          <span
                            className={
                              stake.active ? "text-green-400" : "text-[#737373]"
                            }
                          >
                            ●
                          </span>
                          {stake.active ? "Active" : "Capped"}
                        </span>
                        <span className="inline-flex items-center rounded-full border border-[#FFB51D]/20 bg-[#FFB51D]/[0.07] px-2.5 py-1 text-[10px] font-semibold text-[#FFCF61]">
                          {pkg.dailyRate} daily
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-2">
                      <div className="rounded-lg border border-white/[0.06] bg-black/25 p-2.5">
                        <p className="text-[9px] font-medium uppercase tracking-wider text-[#737373]">
                          Invested
                        </p>
                        <p className="mt-1 text-xs font-bold text-white">
                          ${amountNum.toLocaleString()}
                        </p>
                      </div>
                      <div className="rounded-lg border border-white/[0.06] bg-black/25 p-2.5">
                        <p className="text-[9px] font-medium uppercase tracking-wider text-[#737373]">
                          Claimed
                        </p>
                        <p className="mt-1 text-xs font-bold text-green-400">
                          ${totalClaimedNum.toFixed(2)}
                        </p>
                      </div>
                      <div className="rounded-lg border border-white/[0.06] bg-black/25 p-2.5">
                        <p className="text-[9px] font-medium uppercase tracking-wider text-[#737373]">
                          Earnings Cap
                        </p>
                        <p className="mt-1 text-xs font-bold text-[#FFCF61]">
                          ${capNum.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3">
                      <div className="mb-1.5 flex items-center justify-between gap-2 text-[10px]">
                        <span className="text-[#858585]">Cap progress</span>
                        <span className="font-semibold text-[#FFCF61]">
                          {usedPercent}%
                        </span>
                      </div>
                      <div
                        className="h-1.5 w-full overflow-hidden rounded-full bg-white/10"
                        role="progressbar"
                        aria-label={`Position ${stake.stakeIndex + 1} cap progress`}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={usedPercent}
                      >
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#FFE28A] to-[#FFB51D] transition-all duration-500"
                          style={{ width: `${usedPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-[#FFB51D]/20 bg-gradient-to-br from-[#FFB51D]/[0.04] to-transparent p-6 text-center">
            <Shield size={32} className="mx-auto mb-2 text-neutral-500" />
            <p className="text-xs font-bold text-white">No Active Stakes Yet</p>
            <p className="mx-auto mt-1 max-w-sm text-[11px] text-neutral-400">
              Your wallet is connected. Choose a staking package to start earning 12-hour ROI credits on BSC Testnet.
            </p>
            <a
              href="/dashboard/staking"
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-[#FFE28A] to-[#FFB51D] px-4 py-2 text-xs font-bold text-black transition hover:brightness-110"
            >
              <span>Explore Staking Packages</span>
              <ArrowUpRight size={13} />
            </a>
          </div>
        )}
      </SectionCard> */}

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

      {/* Quick Links */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "New Stake", icon: Shield, path: "/dashboard/staking", color: "from-[#FFE28A]/10 to-[#FFB51D]/5 border-[#FFB51D]/20 text-[#FFB51D]" },
          // { label: "View Packages", icon: Award, path: "/dashboard/packages", color: "from-purple-500/10 to-violet-500/5 border-purple-500/20 text-purple-400" },
          { label: "Level Income", icon: Users, path: "/dashboard/levels", color: "from-white/10 to-white/5 border-white/15 text-neutral-200" },
          { label: "Referral History", icon: History, path: "/dashboard/history/referral-income", color: "from-blue-500/10 to-cyan-500/5 border-blue-500/20 text-blue-300" },
          { label: "Withdraw Tokens", icon: Wallet, path: "/dashboard/withdrawals", color: "from-green-500/10 to-emerald-500/5 border-green-500/20 text-green-400" },
        ].map((item) => (
          <a
            key={item.label}
            href={item.path}
            className={`flex flex-col items-center gap-2 rounded-xl border bg-gradient-to-br ${item.color} p-4 text-center transition-all hover:-translate-y-0.5 hover:shadow-lg`}
          >
            <item.icon size={20} />
            <span className="text-[12px] font-semibold">{item.label}</span>
          </a>
        ))}
      </div>
    </div>
  );
}
