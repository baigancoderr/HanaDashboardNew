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

  return (
    <div className="space-y-6">
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
              <GoldBadge>{isDAO ? "DAO Member" : "No DAO membership"}</GoldBadge>
              <GoldBadge>{activeStakesCount > 0 ? `${activeStakesCount} Active Stake(s)` : "Ready to Stake"}</GoldBadge>
            </div>
            <h2 className="mt-2 text-[20px] sm:text-[24px] font-bold text-white">
              Welcome back, <span className="gold-gradient-text">{address ? formatAddress(address) : "Hana Member"}</span>
            </h2>
            <p className="mt-1 text-[13px] text-[#A3A3A3]">
              Wallet: {address ? formatAddress(address) : "Not connected"} · Total Staked: ${parseFloat(totalStaked || "0").toLocaleString()} · DAO: {isDAO ? "Member" : "Not joined"}
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
              <span className="text-[12px] text-[#A3A3A3]">Cycle:</span>
              <span className="text-[14px] font-bold text-[#FFB51D]">12 Hours</span>
            </div>
            <p className="text-[11px] text-[#737373]">ROI credited every 12h</p>
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
          value={`$${parseFloat(usdtBalance || "0").toFixed(2)}`}
          sub={`${parseFloat(hanaBalance || "0").toFixed(2)} HANA`}
          color="gold"
        />
        <StatCard
          icon={TrendingUp}
          label="Total Earned"
          value={`$${totalEarnedNum}`}
          sub="Claimed and distributed income"
          color="blue"
        />
        <StatCard
          icon={Shield}
          label="Total Staked"
          value={`$${parseFloat(totalStaked || "0").toLocaleString()}`}
          sub={`${activeStakesCount} active position(s)`}
          color="green"
        />
        <StatCard
          icon={Award}
          label="DAO Membership"
          value={isDAO ? "Member" : "Not joined"}
          sub="On-chain membership status"
          color="purple"
        />
      </div>

      {/* Second row stats */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
        <StatCard
          icon={Coins}
          label="Claimable ROI"
          value={`$${totalPendingROI}`}
          sub="Credited every 12h"
          color="gold"
        />
        <StatCard
          icon={Users}
          label="Direct Income"
          value={`$${parseFloat(totalDirectIncome || "0").toFixed(2)}`}
          sub="Cumulative contract total"
          color="blue"
        />
        <StatCard
          icon={Zap}
          label="Level Income"
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

      {/* Quick Links */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "View Packages", icon: Shield, path: "/dashboard/packages", color: "from-[#FFE28A]/10 to-[#FFB51D]/5 border-[#FFB51D]/20 text-[#FFB51D]" },
          { label: "Claim Rewards", icon: Award, path: "/dashboard/ranks", color: "from-purple-500/10 to-violet-500/5 border-purple-500/20 text-purple-400" },
          { label: "DAO Program", icon: Users, path: "/dashboard/dao", color: "from-white/10 to-white/5 border-white/15 text-neutral-200" },
          { label: "Withdraw", icon: Wallet, path: "/dashboard/withdrawals", color: "from-green-500/10 to-emerald-500/5 border-green-500/20 text-green-400" },
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
