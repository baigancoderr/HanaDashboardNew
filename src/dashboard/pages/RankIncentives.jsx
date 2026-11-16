import { useState } from "react";
import {
  Award,
  TrendingUp,
  Users,
  Info,
  GitBranch,
  Scale,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  Clock,
  Crown,
  ShieldCheck,
  Lock,
  Sparkles,
  DollarSign,
  Calendar,
} from "lucide-react";
import StatCard from "../components/StatCard";
import SectionCard from "../components/SectionCard";
import { useWeb3 } from "../../context/Web3Context";
import {
  useTeamLegBusiness,
  RANK_ACHIEVEMENT_STRUCTURE,
} from "../../contracts/hooks";

function formatUsd(val) {
  return Number(val || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function RankIncentives() {
  const { address, isConnected, totalRankIncome, totalStaked, isDAO } =
    useWeb3();

  const {
    legs,
    strongLeg,
    weakLegs,
    strongLegBusiness,
    weakLegBusiness,
    totalTeamBusiness,
    matchingBusiness,
    activeLegsCount,
    totalLegsCount,
    qualifiedTwoLegs,
    strongLegRatioPct,
    weakLegRatioPct,
    selfContribution,
    currentRank,
    currentRankId,
    currentRankName,
    hasRank,
    nextRank,
    isMaxRank,
    achievedRanks,
    ranks,
    isLoading,
    isSyncingHistory,
    syncProgress,
    error,
    refetch,
  } = useTeamLegBusiness(address, { selfContribution: totalStaked });

  const [rankTab, setRankTab] = useState("all"); // "all" | "achieved" | "upcoming"

  const filteredRanks = (ranks || RANK_ACHIEVEMENT_STRUCTURE).filter((r) => {
    if (rankTab === "achieved") return r.isAchieved;
    if (rankTab === "upcoming") return !r.isAchieved;
    return true;
  });

  const actionControls = isConnected && address && (
    <div className="flex flex-wrap items-center gap-2">
      {isSyncingHistory && (
        <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#FFB51D]/30 bg-[#FFB51D]/10 px-2.5 py-1.5 text-[11px] font-medium text-[#FFB51D]">
          <RefreshCw size={12} className="animate-spin" />
          Syncing history {syncProgress}%
        </span>
      )}
      <button
        type="button"
        onClick={refetch}
        disabled={isLoading}
        className="inline-flex items-center gap-1.5 rounded-lg border border-[#2A2A2A] bg-[#161616] px-3 py-1.5 text-[12px] font-medium text-[#E5E5E5] transition hover:border-[#FFB51D]/50 hover:text-[#FFB51D] disabled:opacity-50"
      >
        <RefreshCw size={13} className={isLoading ? "animate-spin" : ""} />
        Refresh
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* 5 Top Stat Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-5">
        <StatCard
          icon={Award}
          label="Current Rank"
          value={hasRank ? currentRankName : "Unranked"}
          sub={
            hasRank
              ? `$${currentRank.weeklyReward}/wk · ${currentRank.qualificationPeriod}`
              : nextRank
              ? `Next: ${nextRank.name} ($${nextRank.weeklyReward}/wk)`
              : "No rank active"
          }
          color={hasRank ? "gold" : "purple"}
        />
        <StatCard
          icon={Scale}
          label="Matching Business"
          value={`$${formatUsd(matchingBusiness)}`}
          sub={
            qualifiedTwoLegs
              ? `Qualified · ${activeLegsCount} active legs`
              : `Need 2 active legs (${activeLegsCount}/2)`
          }
          color="green"
        />
        <StatCard
          icon={TrendingUp}
          label="Strong Leg Business"
          value={`$${formatUsd(strongLegBusiness)}`}
          sub={
            strongLeg
              ? `Main leg · ${strongLeg.addressShort}`
              : "No direct leg yet"
          }
          color="gold"
        />
        <StatCard
          icon={GitBranch}
          label="Weak Leg(s) Business"
          value={`$${formatUsd(weakLegBusiness)}`}
          sub={`${weakLegs.length} remaining leg${weakLegs.length === 1 ? "" : "s"}`}
          color="blue"
        />
        <StatCard
          icon={DollarSign}
          label="Rank Income"
          value={`$${parseFloat(totalRankIncome || "0").toFixed(2)}`}
          sub={`Self staked: $${formatUsd(selfContribution)}${isDAO ? " · DAO" : ""}`}
          color="purple"
        />
      </div>

      {/* Current Achieved Rank & Next Milestone Overview Banner */}
      {isConnected && address && (
        <div className="relative overflow-hidden rounded-2xl border border-[#FFB51D]/30 bg-gradient-to-br from-[#1C1708] via-[#14120B] to-[#0D0D0D] p-5 shadow-[0_10px_30px_rgba(0,0,0,0.5),inset_0_1px_15px_rgba(255,181,29,0.08)] sm:p-6">
          <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-[#FFB51D]/10 blur-3xl" />
          <div className="relative grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-center">
            {/* Left: Current Rank Status Badge */}
            <div className="lg:col-span-5">
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-[#FFB51D]">
                <Sparkles size={14} />
                Your Rank Achievement Status
              </div>

              <div className="mt-2.5 flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[#FFB51D]/40 bg-gradient-to-br from-[#FFE28A]/20 via-[#FFB51D]/15 to-transparent text-[#FFB51D] shadow-[0_0_20px_rgba(255,181,29,0.25)]">
                  {hasRank ? <Crown size={24} /> : <ShieldCheck size={24} />}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-chakra-petch text-2xl font-bold text-white sm:text-3xl">
                      {hasRank ? currentRankName : "Unranked"}
                    </h2>
                    {hasRank ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-300">
                        <CheckCircle2 size={12} />
                        Rank #{currentRankId} Achieved
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-amber-300">
                        <Clock size={12} />
                        In Progress
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-[12px] text-[#A3A3A3]">
                    {hasRank
                      ? `Entitled to $${currentRank.weeklyReward} USDT Weekly Reward for ${currentRank.qualificationPeriod}.`
                      : "Fulfill self-contribution, direct referrals & matching volume to unlock your first rank reward."}
                  </p>
                </div>
              </div>

              {hasRank && (
                <div className="mt-4 flex flex-wrap gap-2 text-[12px]">
                  <div className="flex items-center gap-1.5 rounded-lg border border-[#2E2816] bg-[#14120B] px-3 py-1.5 text-white">
                    <DollarSign size={13} className="text-[#FFB51D]" />
                    <span>Weekly Reward:</span>
                    <strong className="text-[#FFB51D]">
                      ${currentRank.weeklyReward} USDT
                    </strong>
                  </div>
                  <div className="flex items-center gap-1.5 rounded-lg border border-[#2E2816] bg-[#14120B] px-3 py-1.5 text-white">
                    <Calendar size={13} className="text-[#FFB51D]" />
                    <span>Period:</span>
                    <strong className="text-white">
                      {currentRank.qualificationPeriod}
                    </strong>
                  </div>
                </div>
              )}
            </div>

            {/* Right: Next Milestone & Progress */}
            <div className="rounded-xl border border-white/10 bg-black/40 p-4 backdrop-blur-sm lg:col-span-7">
              {isMaxRank ? (
                <div className="py-4 text-center">
                  <Crown size={32} className="mx-auto mb-2 text-[#FFB51D]" />
                  <p className="font-chakra-petch text-lg font-bold text-white">
                    Maximum Rank Achieved!
                  </p>
                  <p className="mt-1 text-[12px] text-[#A3A3A3]">
                    You have achieved Hana Monarch, the pinnacle rank of the ecosystem.
                  </p>
                </div>
              ) : nextRank ? (
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
                    <div>
                      <span className="text-[11px] font-medium uppercase tracking-wider text-[#A3A3A3]">
                        Next Milestone Target
                      </span>
                      <p className="font-chakra-petch text-base font-bold text-white sm:text-lg">
                        Rank #{nextRank.id}: {nextRank.name}{" "}
                        <span className="text-[12px] font-normal text-[#FFB51D]">
                          (${nextRank.weeklyReward} / Week · {nextRank.qualificationPeriod})
                        </span>
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="font-chakra-petch text-base font-bold text-[#FFB51D]">
                        {nextRank.overallProgressPct}%
                      </span>
                      <p className="text-[10px] text-[#A3A3A3]">Overall Progress</p>
                    </div>
                  </div>

                  {/* Overall bar */}
                  <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#D99112] via-[#FFB51D] to-[#FFE28A] transition-all duration-500"
                      style={{ width: `${nextRank.overallProgressPct}%` }}
                    />
                  </div>

                  {/* 4 Requirements Checklist */}
                  <div className="mt-3.5 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    {/* 1. Self Contribution */}
                    <div className="rounded-lg border border-white/5 bg-white/[0.02] p-2.5 text-[11px]">
                      <div className="flex items-center justify-between">
                        <span className="text-[#A3A3A3]">Self-Contribution</span>
                        {nextRank.selfMet ? (
                          <span className="inline-flex items-center gap-1 font-semibold text-emerald-400">
                            <CheckCircle2 size={11} /> Met
                          </span>
                        ) : (
                          <span className="font-medium text-amber-300">
                            ${formatUsd(nextRank.selfContribution - selfContribution)} needed
                          </span>
                        )}
                      </div>
                      <div className="mt-1 flex items-baseline justify-between font-mono text-[12px]">
                        <span className="text-white">${formatUsd(selfContribution)}</span>
                        <span className="text-[#737373]">/ ${formatUsd(nextRank.selfContribution)}</span>
                      </div>
                      <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full bg-emerald-400"
                          style={{ width: `${nextRank.selfProgressPct}%` }}
                        />
                      </div>
                    </div>

                    {/* 2. Direct Team */}
                    <div className="rounded-lg border border-white/5 bg-white/[0.02] p-2.5 text-[11px]">
                      <div className="flex items-center justify-between">
                        <span className="text-[#A3A3A3]">Direct Team</span>
                        {nextRank.directsMet ? (
                          <span className="inline-flex items-center gap-1 font-semibold text-emerald-400">
                            <CheckCircle2 size={11} /> Met
                          </span>
                        ) : (
                          <span className="font-medium text-amber-300">
                            {nextRank.directTeam - totalLegsCount} more needed
                          </span>
                        )}
                      </div>
                      <div className="mt-1 flex items-baseline justify-between font-mono text-[12px]">
                        <span className="text-white">{totalLegsCount} Directs</span>
                        <span className="text-[#737373]">/ {nextRank.directTeam} Directs</span>
                      </div>
                      <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full bg-emerald-400"
                          style={{ width: `${nextRank.directProgressPct}%` }}
                        />
                      </div>
                    </div>

                    {/* 3. Matching Business */}
                    <div className="rounded-lg border border-white/5 bg-white/[0.02] p-2.5 text-[11px]">
                      <div className="flex items-center justify-between">
                        <span className="text-[#A3A3A3]">Matching Business</span>
                        {nextRank.matchingMet ? (
                          <span className="inline-flex items-center gap-1 font-semibold text-emerald-400">
                            <CheckCircle2 size={11} /> Met
                          </span>
                        ) : (
                          <span className="font-medium text-amber-300">
                            ${formatUsd(nextRank.matchingBusiness - matchingBusiness)} needed
                          </span>
                        )}
                      </div>
                      <div className="mt-1 flex items-baseline justify-between font-mono text-[12px]">
                        <span className="text-white">${formatUsd(matchingBusiness)}</span>
                        <span className="text-[#737373]">/ ${formatUsd(nextRank.matchingBusiness)}</span>
                      </div>
                      <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full bg-emerald-400"
                          style={{ width: `${nextRank.matchingProgressPct}%` }}
                        />
                      </div>
                    </div>

                    {/* 4. Leg Rank Criteria */}
                    <div className="rounded-lg border border-white/5 bg-white/[0.02] p-2.5 text-[11px]">
                      <div className="flex items-center justify-between">
                        <span className="text-[#A3A3A3]">Leg Rank Criteria</span>
                        {nextRank.legsMet ? (
                          <span className="inline-flex items-center gap-1 font-semibold text-emerald-400">
                            <CheckCircle2 size={11} /> Met
                          </span>
                        ) : (
                          <span className="font-medium text-amber-300">Pending</span>
                        )}
                      </div>
                      <div className="mt-1 text-[12px] font-semibold text-white">
                        {nextRank.requiredLegCriteria}
                      </div>
                      <p className="mt-1 text-[10px] text-[#737373]">
                        {nextRank.requiredLegCriteria === "None"
                          ? "No rank requirement in downline legs"
                          : "Separate direct legs required"}
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* Rank Achievement Structure Master Table */}
      <SectionCard
        title="Rank Achievement Structure"
        subtitle="10-Tier Rank Progression, Qualification Criteria, and Weekly Rewards"
        action={
          <div className="flex items-center gap-1.5 rounded-lg border border-[#222] bg-[#0A0A0A] p-1">
            <button
              type="button"
              onClick={() => setRankTab("all")}
              className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition ${
                rankTab === "all"
                  ? "bg-[#FFB51D] text-black shadow-sm"
                  : "text-[#A3A3A3] hover:text-white"
              }`}
            >
              All Ranks (10)
            </button>
            <button
              type="button"
              onClick={() => setRankTab("achieved")}
              className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition ${
                rankTab === "achieved"
                  ? "bg-[#FFB51D] text-black shadow-sm"
                  : "text-[#A3A3A3] hover:text-white"
              }`}
            >
              Achieved ({achievedRanks?.length || 0})
            </button>
            <button
              type="button"
              onClick={() => setRankTab("upcoming")}
              className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition ${
                rankTab === "upcoming"
                  ? "bg-[#FFB51D] text-black shadow-sm"
                  : "text-[#A3A3A3] hover:text-white"
              }`}
            >
              Upcoming ({10 - (achievedRanks?.length || 0)})
            </button>
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] border-collapse text-left">
            <thead>
              <tr className="border-b border-[#222] text-[11px] uppercase tracking-wider text-[#737373]">
                <th className="py-3 pr-2 font-medium">No.</th>
                <th className="px-3 py-3 font-medium">Rank</th>
                <th className="px-3 py-3 font-medium">Self-Contribution</th>
                <th className="px-3 py-3 font-medium">Direct Team</th>
                <th className="px-3 py-3 font-medium">Required Rank Criteria in Legs</th>
                <th className="px-3 py-3 font-medium">Matching Business</th>
                <th className="px-3 py-3 font-medium">Qualification Period</th>
                <th className="px-3 py-3 font-medium">Weekly Reward</th>
                <th className="py-3 pl-3 text-right font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1A1A1A] text-[13px]">
              {filteredRanks.map((rank) => {
                const isCurrent = currentRank && currentRank.id === rank.id;
                const isNext = nextRank && nextRank.id === rank.id;
                const isAchieved = rank.isAchieved;

                let rowBgClass = "transition-colors hover:bg-white/[0.02]";
                if (isCurrent) {
                  rowBgClass =
                    "border-l-4 border-l-[#FFB51D] bg-[#FFB51D]/[0.08] shadow-[inset_0_1px_10px_rgba(255,181,29,0.06)]";
                } else if (isNext) {
                  rowBgClass =
                    "border-l-4 border-l-sky-500 bg-sky-500/[0.04]";
                }

                return (
                  <tr key={rank.id} className={rowBgClass}>
                    {/* No. */}
                    <td className="py-3.5 pr-2 font-mono text-[12px] font-semibold text-[#737373]">
                      #{rank.id}
                    </td>

                    {/* Rank */}
                    <td className="px-3 py-3.5">
                      <div className="flex items-center gap-2">
                        <div
                          className={`flex h-7 w-7 items-center justify-center rounded-lg border text-[11px] font-bold ${
                            isCurrent
                              ? "border-[#FFB51D]/50 bg-[#FFB51D]/20 text-[#FFB51D]"
                              : isAchieved
                              ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-400"
                              : isNext
                              ? "border-sky-500/40 bg-sky-500/15 text-sky-300"
                              : "border-white/10 bg-white/5 text-[#737373]"
                          }`}
                        >
                          {isCurrent ? (
                            <Crown size={14} />
                          ) : isAchieved ? (
                            <CheckCircle2 size={14} />
                          ) : (
                            rank.id
                          )}
                        </div>
                        <div>
                          <span
                            className={`font-chakra-petch font-bold ${
                              isCurrent
                                ? "text-[#FFB51D]"
                                : isAchieved
                                ? "text-emerald-300"
                                : "text-white"
                            }`}
                          >
                            {rank.name}
                          </span>
                          {isCurrent && (
                            <span className="ml-2 inline-flex items-center rounded-full bg-[#FFB51D] px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wide text-black">
                              Current
                            </span>
                          )}
                          {isNext && (
                            <span className="ml-2 inline-flex items-center rounded-full bg-sky-500 px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wide text-black">
                              Target
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Self-Contribution */}
                    <td className="px-3 py-3.5 font-mono">
                      <span className="font-semibold text-white">
                        ${rank.selfContribution.toLocaleString()}
                      </span>
                      {isConnected && (
                        <div className="mt-0.5 text-[11px]">
                          {rank.selfMet ? (
                            <span className="text-emerald-400">✓ Met</span>
                          ) : (
                            <span className="text-[#737373]">
                              ${formatUsd(selfContribution)}
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Direct Team */}
                    <td className="px-3 py-3.5">
                      <span className="font-semibold text-white">
                        {rank.directTeam} Directs
                      </span>
                      {isConnected && (
                        <div className="mt-0.5 text-[11px]">
                          {rank.directsMet ? (
                            <span className="text-emerald-400">✓ Met</span>
                          ) : (
                            <span className="text-[#737373]">
                              {totalLegsCount} Directs
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Required Rank Criteria in Legs */}
                    <td className="px-3 py-3.5">
                      <span
                        className={`text-[12px] ${
                          rank.requiredLegCriteria === "None"
                            ? "text-[#737373]"
                            : "font-medium text-white"
                        }`}
                      >
                        {rank.requiredLegCriteria}
                      </span>
                      {isConnected && rank.requiredLegCriteria !== "None" && (
                        <div className="mt-0.5 text-[11px]">
                          {rank.legsMet ? (
                            <span className="text-emerald-400">✓ Met</span>
                          ) : (
                            <span className="text-amber-400/80">Pending in legs</span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Matching Business */}
                    <td className="px-3 py-3.5 font-mono">
                      <span className="font-semibold text-white">
                        ${rank.matchingBusiness.toLocaleString()}
                      </span>
                      {isConnected && (
                        <div className="mt-0.5 text-[11px]">
                          {rank.matchingMet ? (
                            <span className="text-emerald-400">✓ Met</span>
                          ) : (
                            <span className="text-[#737373]">
                              ${formatUsd(matchingBusiness)}
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Qualification Period */}
                    <td className="px-3 py-3.5">
                      <span className="inline-flex items-center gap-1 rounded-md border border-[#222] bg-[#111] px-2 py-0.5 text-[12px] text-[#A3A3A3]">
                        <Clock size={11} className="text-[#737373]" />
                        {rank.qualificationPeriod}
                      </span>
                    </td>

                    {/* Weekly Reward */}
                    <td className="px-3 py-3.5">
                      <span className="font-chakra-petch font-bold text-[#FFB51D]">
                        ${rank.weeklyReward.toLocaleString()}
                      </span>
                      <span className="text-[11px] text-[#737373]"> / wk</span>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 pl-3 text-right">
                      {isCurrent ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-[#FFB51D]/40 bg-[#FFB51D]/20 px-2.5 py-1 text-[11px] font-bold text-[#FFB51D]">
                          <Crown size={12} />
                          Active Rank
                        </span>
                      ) : isAchieved ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-400">
                          <CheckCircle2 size={12} />
                          Achieved
                        </span>
                      ) : isNext ? (
                        <div className="inline-flex flex-col items-end">
                          <span className="inline-flex items-center gap-1 rounded-full border border-sky-500/40 bg-sky-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-sky-300">
                            <Clock size={11} />
                            {rank.overallProgressPct}%
                          </span>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full border border-white/5 bg-white/[0.02] px-2 py-0.5 text-[11px] text-[#525252]">
                          <Lock size={10} />
                          Locked
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* Strong Leg & Weak Leg Business Summary */}
      <SectionCard
        title="Strong Leg & Weak Leg Business"
        subtitle="Computed live from on-chain Registered and Staked event logs across your team legs"
        action={actionControls}
      >
        {!isConnected || !address ? (
          <div className="rounded-lg border border-[#222] bg-[#0B0B0B] p-6 text-center text-[13px] text-[#A3A3A3]">
            Connect your wallet to calculate your Strong Leg, Weak Leg, and Matching Business from on-chain events.
          </div>
        ) : (
          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-[#222] bg-[#0B0B0B] p-4">
                <p className="text-[11px] uppercase tracking-wider text-[#737373]">
                  Total Team Business
                </p>
                <p className="mt-1 font-chakra-petch text-lg font-bold text-white">
                  ${formatUsd(totalTeamBusiness)}
                </p>
                <p className="mt-0.5 text-[11px] text-[#737373]">
                  Strong Leg + Weak Leg(s)
                </p>
              </div>

              <div className="rounded-lg border border-[#222] bg-[#0B0B0B] p-4">
                <p className="text-[11px] uppercase tracking-wider text-[#737373]">
                  Active Direct Legs
                </p>
                <p className="mt-1 font-chakra-petch text-lg font-bold text-white">
                  {activeLegsCount}{" "}
                  <span className="text-sm font-normal text-[#737373]">
                    / {totalLegsCount} total
                  </span>
                </p>
                <p className="mt-0.5 text-[11px] text-[#737373]">
                  Legs with at least 1 active stake
                </p>
              </div>

              <div className="rounded-lg border border-[#222] bg-[#0B0B0B] p-4">
                <p className="text-[11px] uppercase tracking-wider text-[#737373]">
                  2-Leg Rule Status
                </p>
                <div className="mt-1.5 flex items-center gap-2">
                  {qualifiedTwoLegs ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[12px] font-semibold text-emerald-400">
                      <CheckCircle2 size={13} />
                      Qualified (2+ Active Legs)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[12px] font-semibold text-amber-300">
                      <Clock size={13} />
                      {activeLegsCount}/2 Active Legs
                    </span>
                  )}
                </div>
                <p className="mt-1 text-[11px] text-[#737373]">
                  Matching = min(Strong, Weak)
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-[#222] bg-[#0B0B0B] p-4">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-[12px]">
                <span className="font-medium text-[#FFB51D]">
                  Strong Leg: ${formatUsd(strongLegBusiness)} (
                  {strongLegRatioPct.toFixed(1)}%)
                </span>
                <span className="font-medium text-sky-400">
                  Weak Leg(s): ${formatUsd(weakLegBusiness)} (
                  {weakLegRatioPct.toFixed(1)}%)
                </span>
              </div>
              <div className="flex h-3 w-full overflow-hidden rounded-full bg-[#1A1A1A]">
                <div
                  className="bg-[#FFB51D] transition-all duration-500"
                  style={{ width: `${strongLegRatioPct}%` }}
                />
                <div
                  className="bg-sky-500 transition-all duration-500"
                  style={{ width: `${weakLegRatioPct}%` }}
                />
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-lg border border-[#222] bg-[#0D0D0D] p-3.5">
              <Info size={16} className="mt-0.5 shrink-0 text-[#FFB51D]" />
              <p className="text-[12px] leading-relaxed text-[#A3A3A3]">
                Your highest-volume direct referral leg counts as the{" "}
                <span className="font-semibold text-[#FFB51D]">Strong Leg</span>{" "}
                (main leg), and all remaining direct legs combine as{" "}
                <span className="font-semibold text-sky-400">Weak Leg Business</span>.
                Matching Business equals the lesser of your Strong Leg and combined Weak Leg(s), requiring at least 2 active legs.
              </p>
            </div>
          </div>
        )}
      </SectionCard>

      {/* Direct Legs Breakdown Table */}
      <SectionCard
        title="Direct Legs Business Breakdown"
        subtitle="Direct partner stake, downline tree volume, and leg rank for every direct leg"
      >
        {!isConnected || !address ? (
          <div className="rounded-lg border border-[#222] bg-[#0B0B0B] p-6 text-center text-[13px] text-[#737373]">
            Wallet not connected.
          </div>
        ) : error ? (
          <div className="flex flex-col items-start justify-between gap-3 rounded-lg border border-red-500/30 bg-red-500/10 p-4 sm:flex-row sm:items-center">
            <p className="text-[13px] text-red-300">{error}</p>
            <button
              type="button"
              onClick={refetch}
              className="rounded-lg border border-red-400/40 bg-red-500/20 px-3 py-1.5 text-[12px] font-medium text-red-200 hover:bg-red-500/30"
            >
              Retry
            </button>
          </div>
        ) : isLoading && legs.length === 0 ? (
          <div className="flex items-center justify-center gap-2.5 py-10 text-[13px] text-[#A3A3A3]">
            <RefreshCw size={16} className="animate-spin text-[#FFB51D]" />
            Loading leg business from on-chain event logs...
          </div>
        ) : legs.length === 0 ? (
          <div className="rounded-lg border border-[#222] bg-[#0B0B0B] p-8 text-center">
            <Users size={24} className="mx-auto mb-2 text-[#525252]" />
            <p className="text-[13px] text-[#A3A3A3]">
              No direct legs found in Registered event logs yet.
            </p>
            {isSyncingHistory && (
              <p className="mt-1 text-[11px] text-[#FFB51D]">
                Historical archive scan in progress ({syncProgress}%)...
              </p>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] border-collapse text-left">
              <thead>
                <tr className="border-b border-[#222] text-[11px] uppercase tracking-wider text-[#737373]">
                  <th className="py-3 pr-3 font-medium">Leg Role</th>
                  <th className="px-3 py-3 font-medium">Direct Partner</th>
                  <th className="px-3 py-3 font-medium">Direct Stake</th>
                  <th className="px-3 py-3 font-medium">Downline Business</th>
                  <th className="px-3 py-3 font-medium">Total Leg Business</th>
                  <th className="px-3 py-3 font-medium">Leg Rank</th>
                  <th className="px-3 py-3 font-medium">Team Members</th>
                  <th className="py-3 pl-3 text-right font-medium">Reg Tx</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1A1A1A] text-[13px]">
                {legs.map((leg) => {
                  const isStrong = leg.legRole === "Strong Leg";
                  return (
                    <tr
                      key={leg.address}
                      className="transition-colors hover:bg-white/[0.02]"
                    >
                      <td className="py-3.5 pr-3">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-semibold text-[#737373]">
                            #{leg.rankOrder}
                          </span>
                          <span
                            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${
                              isStrong
                                ? "border-[#FFB51D]/40 bg-[#FFB51D]/15 text-[#FFB51D]"
                                : "border-sky-500/30 bg-sky-500/10 text-sky-400"
                            }`}
                          >
                            {leg.legRole}
                          </span>
                        </div>
                      </td>

                      <td className="px-3 py-3.5">
                        <a
                          href={leg.explorerUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 font-mono text-[12px] text-white hover:text-[#FFB51D]"
                        >
                          {leg.addressShort}
                          <ExternalLink size={11} className="text-[#737373]" />
                        </a>
                        <div className="mt-0.5 text-[11px] text-[#737373]">
                          {leg.joinedFormatted}
                        </div>
                      </td>

                      <td className="px-3 py-3.5">
                        <span className="font-semibold text-white">
                          ${formatUsd(leg.directStaked)}
                        </span>
                        <div className="text-[11px] text-[#737373]">
                          {leg.stakeCount} stake{leg.stakeCount === 1 ? "" : "s"}
                        </div>
                      </td>

                      <td className="px-3 py-3.5">
                        <span className="font-semibold text-white">
                          ${formatUsd(leg.teamStaked)}
                        </span>
                        <div className="text-[11px] text-[#737373]">
                          {leg.downlineMembers} downline member
                          {leg.downlineMembers === 1 ? "" : "s"}
                        </div>
                      </td>

                      <td className="px-3 py-3.5">
                        <span
                          className={`font-chakra-petch font-bold ${
                            isStrong ? "text-[#FFB51D]" : "text-sky-300"
                          }`}
                        >
                          ${formatUsd(leg.totalLegBusiness)}
                        </span>
                        <div className="text-[11px] text-[#737373]">
                          {leg.sharePct.toFixed(1)}% of team
                        </div>
                      </td>

                      <td className="px-3 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${
                            leg.rankId > 0
                              ? "border-[#FFB51D]/40 bg-[#FFB51D]/15 text-[#FFB51D]"
                              : "border-white/10 bg-white/5 text-[#737373]"
                          }`}
                        >
                          {leg.rankId > 0 ? (
                            <>
                              <Award size={11} /> {leg.rankName}
                            </>
                          ) : (
                            "Unranked"
                          )}
                        </span>
                      </td>

                      <td className="px-3 py-3.5">
                        <span className="text-white">
                          {leg.activeMemberCount} active
                        </span>
                        <span className="text-[#737373]">
                          {" "}
                          / {leg.memberCount} total
                        </span>
                      </td>

                      <td className="py-3.5 pl-3 text-right">
                        {leg.regExplorerUrl && leg.regTxShort ? (
                          <a
                            href={leg.regExplorerUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 rounded border border-[#262626] bg-[#161616] px-2 py-1 font-mono text-[11px] text-[#D4D4D4] hover:border-[#FFB51D]/40 hover:text-[#FFB51D]"
                          >
                            {leg.regTxShort}
                            <ExternalLink size={10} />
                          </a>
                        ) : (
                          <span className="text-[#525252]">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
