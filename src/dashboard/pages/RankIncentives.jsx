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
} from "lucide-react";
import StatCard from "../components/StatCard";
import SectionCard from "../components/SectionCard";
import { useWeb3 } from "../../context/Web3Context";
import { useTeamLegBusiness } from "../../contracts/hooks";

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
    isLoading,
    isSyncingHistory,
    syncProgress,
    error,
    refetch,
  } = useTeamLegBusiness(address);

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
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
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
          icon={Award}
          label="Rank Income"
          value={`$${parseFloat(totalRankIncome || "0").toFixed(2)}`}
          sub={`Self staked: $${parseFloat(totalStaked || "0").toLocaleString()}${isDAO ? " · DAO" : ""}`}
          color="purple"
        />
      </div>

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

      <SectionCard
        title="Direct Legs Business Breakdown"
        subtitle="Direct partner stake plus full downline tree volume for every direct leg"
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
            <table className="w-full min-w-[740px] border-collapse text-left">
              <thead>
                <tr className="border-b border-[#222] text-[11px] uppercase tracking-wider text-[#737373]">
                  <th className="py-3 pr-3 font-medium">Leg Role</th>
                  <th className="px-3 py-3 font-medium">Direct Partner</th>
                  <th className="px-3 py-3 font-medium">Direct Stake</th>
                  <th className="px-3 py-3 font-medium">Downline Business</th>
                  <th className="px-3 py-3 font-medium">Total Leg Business</th>
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
