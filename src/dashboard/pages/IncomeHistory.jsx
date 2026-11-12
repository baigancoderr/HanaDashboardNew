import { useState } from "react";
import { useAppKitAccount } from "@reown/appkit/react";
import {
  TrendingUp,
  Users,
  Layers,
  Shield,
  ExternalLink,
  Loader2,
  RefreshCw,
  Activity,
} from "lucide-react";
import StatCard from "../components/StatCard";
import SectionCard from "../components/SectionCard";
import { useIncomeHistory } from "../../contracts/hooks";
import { getExplorerAddressUrl } from "../../contracts/config";

const TABS = [
  { key: "all",     label: "All Events",     icon: Activity  },
  { key: "roi",     label: "ROI Claimed",    icon: TrendingUp },
  { key: "direct",  label: "Direct Income",  icon: Users      },
  { key: "level",   label: "Level Income",   icon: Layers     },
  { key: "staked",  label: "Staking",        icon: Shield     },
];

const CATEGORY_COLORS = {
  roi:    { dot: "bg-[#FFB51D]",  text: "text-[#FFB51D]",  badge: "border-[#FFB51D]/20 bg-[#FFB51D]/10 text-[#FFB51D]" },
  direct: { dot: "bg-green-400",  text: "text-green-400",  badge: "border-green-400/20 bg-green-400/10 text-green-400"  },
  level:  { dot: "bg-violet-400", text: "text-violet-400", badge: "border-violet-400/20 bg-violet-400/10 text-violet-400"},
  staked: { dot: "bg-sky-400",    text: "text-sky-400",    badge: "border-sky-400/20 bg-sky-400/10 text-sky-400"        },
};

function CategoryBadge({ category }) {
  const c = CATEGORY_COLORS[category] || CATEGORY_COLORS.roi;
  const tab = TABS.find((t) => t.key === category);
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${c.badge}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
      {tab?.label ?? category}
    </span>
  );
}

function EmptyState({ tab }) {
  const tab_ = TABS.find((t) => t.key === tab);
  const Icon = tab_?.icon ?? Activity;
  return (
    <div className="rounded-lg border border-dashed border-white/10 p-8 text-center">
      <Icon size={28} className="mx-auto mb-3 text-neutral-500" />
      <p className="text-sm font-medium text-white">No {tab_?.label ?? "events"} yet</p>
      <p className="mt-1 text-xs text-neutral-400">
        On-chain events for your wallet will appear here once confirmed.
      </p>
    </div>
  );
}

function EventTable({ rows, activeTab }) {
  if (rows.length === 0) return <EmptyState tab={activeTab} />;

  const showFrom    = activeTab === "all" || activeTab === "level";
  const showStaker  = activeTab === "direct";
  const showStakeAmt = activeTab === "direct";
  const showStake   = activeTab === "all" || activeTab === "roi" || activeTab === "staked";
  const showCategory = activeTab === "all";

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[700px] text-left text-xs">
        <thead>
          <tr className="border-b border-[#222] text-[11px] uppercase tracking-wider text-[#737373]">
            {showCategory  && <th className="pb-3 font-semibold">Type</th>}
            {showFrom      && <th className="pb-3 font-semibold">From</th>}
            {showStaker    && <th className="pb-3 font-semibold">Staker</th>}
            {showStakeAmt  && <th className="pb-3 font-semibold">Stake Amount</th>}
            {showStakeAmt  && <th className="pb-3 font-semibold">Package</th>}
            {showStake     && <th className="pb-3 font-semibold">Stake ID</th>}
            <th className="pb-3 font-semibold">USDT Value</th>
            <th className="pb-3 font-semibold">HANA Allotted</th>
            <th className="pb-3 font-semibold">Date &amp; Time</th>
            <th className="pb-3 text-right font-semibold">Transaction</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#222]">
          {rows.map((row, idx) => (
            <tr
              key={`${row.txHash}-${row.blockNumber}-${idx}`}
              className="transition hover:bg-white/[0.02]"
            >
              {showCategory && (
                <td className="py-3">
                  <CategoryBadge category={row.category} />
                </td>
              )}

              {showFrom && (
                <td className="py-3">
                  {row.fromAddress ? (
                    <a
                      href={row.fromExplorerUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="font-mono text-white hover:text-[#FFB51D] hover:underline"
                    >
                      {row.fromShort}
                    </a>
                  ) : (
                    <span className="text-neutral-500">—</span>
                  )}
                </td>
              )}

              {showStaker && (
                <td className="py-3">
                  {row.stakerAddress ? (
                    <a
                      href={row.stakerExplorerUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="font-mono text-white hover:text-[#FFB51D] hover:underline"
                    >
                      {row.stakerShort}
                    </a>
                  ) : (
                    <span className="text-neutral-400">Referred Member</span>
                  )}
                </td>
              )}

              {showStakeAmt && (
                <td className="py-3 font-semibold text-white">
                  {row.stakeAmountFormatted
                    ? `$${row.stakeAmountFormatted} USDT`
                    : <span className="text-neutral-500">—</span>}
                </td>
              )}

              {showStakeAmt && (
                <td className="py-3">
                  {row.stakePackageName ? (
                    <span className="rounded-md border border-[#FFB51D]/20 bg-[#FFB51D]/5 px-2 py-0.5 text-[11px] font-semibold text-[#FFB51D]">
                      {row.stakePackageName}
                    </span>
                  ) : (
                    <span className="text-neutral-500">—</span>
                  )}
                </td>
              )}

              {showStake && (
                <td className="py-3">
                  {row.stakeDisplayId ? (
                    <span className="rounded-md border border-[#FFB51D]/20 bg-[#FFB51D]/5 px-2 py-0.5 font-mono text-[11px] text-[#FFB51D]">
                      {row.stakeDisplayId}
                    </span>
                  ) : (
                    <span className="text-neutral-500">—</span>
                  )}
                </td>
              )}

              <td className="py-3">
                {row.category === "staked" ? (
                  <span className="font-semibold text-sky-400">
                    ${row.usdtFormatted} USDT
                  </span>
                ) : (
                  <span className="font-semibold text-green-400">
                    +${row.usdtFormatted} USDT
                  </span>
                )}
              </td>

              <td className="py-3">
                {row.hanaFormatted === "-" ? (
                  <span className="text-neutral-500">—</span>
                ) : (
                  <span className="font-semibold text-[#FFB51D]">
                    +{row.hanaFormatted} HANA
                  </span>
                )}
              </td>

              <td className="py-3 text-neutral-400">{row.dateFormatted}</td>

              <td className="py-3 text-right">
                <a
                  href={row.explorerUrl}
                  target="_blank"
                  rel="noreferrer"
                  title={row.txHash}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#FFB51D]/20 bg-[#FFB51D]/5 px-2.5 py-1 font-mono text-[#FFB51D] transition hover:bg-[#FFB51D]/15"
                >
                  {row.txShort}
                  <ExternalLink size={12} />
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function IncomeHistory() {
  const { address } = useAppKitAccount({ namespace: "eip155" });
  const [activeTab, setActiveTab] = useState("all");

  const {
    allEvents,
    roiEvents,
    directEvents,
    levelEvents,
    stakingEvents,
    totals,
    isLoading,
    error,
    refetch,
  } = useIncomeHistory(address);

  const tabRows = {
    all:    allEvents,
    roi:    roiEvents,
    direct: directEvents,
    level:  levelEvents,
    staked: stakingEvents,
  };

  const totalIncome = totals.roiUsdt + totals.directUsdt + totals.levelUsdt;
  const totalHana   = totals.roiHana  + totals.directHana + totals.levelHana;

  return (
    <div className="space-y-6 font-chakra-petch">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <StatCard
          icon={TrendingUp}
          label="ROI Claimed"
          value={`$${totals.roiUsdt.toFixed(2)}`}
          sub={`${roiEvents.length} claim${roiEvents.length !== 1 ? "s" : ""} · ${totals.roiHana.toFixed(2)} HANA`}
          color="gold"
        />
        <StatCard
          icon={Users}
          label="Direct Income"
          value={`$${totals.directUsdt.toFixed(2)}`}
          sub={`${directEvents.length} event${directEvents.length !== 1 ? "s" : ""} · ${totals.directHana.toFixed(2)} HANA`}
          color="green"
        />
        <StatCard
          icon={Layers}
          label="Level Income"
          value={`$${totals.levelUsdt.toFixed(2)}`}
          sub={`${levelEvents.length} event${levelEvents.length !== 1 ? "s" : ""} · ${totals.levelHana.toFixed(2)} HANA`}
          color="blue"
        />
        <StatCard
          icon={Shield}
          label="Total Staked"
          value={`$${totals.stakedUsdt.toFixed(2)}`}
          sub={`${stakingEvents.length} stake${stakingEvents.length !== 1 ? "s" : ""} on-chain`}
          color="purple"
        />
      </div>

      {/* Total Income Banner */}
      <div className="relative overflow-hidden rounded-xl border border-[#FFB51D]/20 bg-gradient-to-r from-[#111] via-[#111] to-[#0A0A0A] p-4 sm:p-5">
        <div className="pointer-events-none absolute right-0 top-0 h-48 w-48 rounded-full bg-[#FFB51D]/5 blur-3xl" />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#737373]">
              Total Income Earned (ROI + Direct + Level)
            </p>
            <p className="mt-1 text-[26px] font-bold text-white">
              $<span className="gold-gradient-text">{totalIncome.toFixed(2)}</span>
              <span className="ml-2 text-[14px] font-normal text-neutral-400">USDT</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#737373]">
              Total HANA Received
            </p>
            <p className="mt-1 text-[22px] font-bold text-[#FFB51D]">
              {totalHana.toFixed(4)}
              <span className="ml-2 text-[14px] font-normal text-neutral-400">HANA</span>
            </p>
          </div>
        </div>
      </div>

      {/* Event Log Table */}
      <SectionCard
        title="Transaction Event Log"
        subtitle="On-chain event receipts from the staking contract"
        action={
          <button
            type="button"
            onClick={() => refetch?.()}
            disabled={isLoading || !address}
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-[#161616] px-3 py-2 text-xs font-medium text-neutral-300 transition hover:border-[#FFB51D]/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw size={13} className={isLoading ? "animate-spin" : ""} />
            Refresh
          </button>
        }
      >
        {/* Tab Bar */}
        <div className="mb-5 flex flex-wrap gap-1.5 border-b border-[#1E1E1E] pb-4">
          {TABS.map((tab) => {
            const count = tabRows[tab.key]?.length ?? 0;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-semibold transition-all ${
                  isActive
                    ? "border border-[#FFB51D]/30 bg-[#FFB51D]/10 text-[#FFD16A]"
                    : "border border-transparent text-neutral-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <tab.icon size={13} />
                {tab.label}
                {count > 0 && (
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold leading-none ${
                      isActive
                        ? "bg-[#FFB51D]/30 text-[#FFD16A]"
                        : "bg-white/10 text-neutral-400"
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Content */}
        {!address ? (
          <p className="rounded-lg border border-dashed border-white/10 p-6 text-center text-sm text-neutral-400">
            Connect your wallet to view income history.
          </p>
        ) : isLoading ? (
          <div className="flex items-center justify-center py-12 text-[#FFB51D]">
            <Loader2 size={22} className="mr-2 animate-spin" />
            <span className="text-xs">Fetching on-chain events…</span>
          </div>
        ) : error ? (
          <p
            className="rounded-lg border border-red-400/20 bg-red-400/[0.05] p-4 text-sm text-red-300"
            role="alert"
          >
            {error}
          </p>
        ) : (
          <EventTable rows={tabRows[activeTab] ?? []} activeTab={activeTab} />
        )}
      </SectionCard>
    </div>
  );
}
