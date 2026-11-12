import { useMemo, useState } from "react";
import { useAppKitAccount } from "@reown/appkit/react";
import {
  ArrowUpRight,
  Coins,
  Layers,
  RefreshCw,
  Unlock,
  Zap,
} from "lucide-react";
import StatCard from "../components/StatCard";
import SectionCard from "../components/SectionCard";
import EventLogTable, {
  ExplorerAddressLink,
  ExplorerTxBadge,
} from "../components/EventLogTable";
import { useLevelIncomeHistory, useUserData } from "../../contracts/hooks";

const levelColumns = [
  {
    key: "from",
    label: "From Member",
    render: (row) => (
      <ExplorerAddressLink
        address={row.fromAddress}
        shortLabel={row.fromShort}
        href={row.fromExplorerUrl}
        fallback="Network member"
      />
    ),
  },
  {
    key: "level",
    label: "Level",
    render: (row) => (
      <span className="inline-flex items-center rounded-md border border-[#FFB51D]/25 bg-[#FFB51D]/10 px-2 py-0.5 font-semibold text-[#FFD16A]">
        {row.level > 0 ? `Level ${row.level}` : "Level"}
      </span>
    ),
  },
  {
    key: "usdt",
    label: "USDT Income",
    render: (row) => (
      <span className="font-semibold text-green-400">+${row.usdtFormatted} USDT</span>
    ),
  },
  {
    key: "hana",
    label: "HANA Credited",
    render: (row) => (
      <span className="font-semibold text-[#FFB51D]">+{row.hanaFormatted} HANA</span>
    ),
  },
  {
    key: "date",
    label: "Date & Time",
    render: (row) => <span className="text-neutral-400">{row.dateFormatted}</span>,
  },
  {
    key: "tx",
    label: "Transaction",
    align: "right",
    render: (row) => (
      <ExplorerTxBadge
        txHash={row.txHash}
        txShort={row.txShort}
        href={row.explorerUrl}
      />
    ),
  },
];

export default function LevelIncome() {
  const { address } = useAppKitAccount({ namespace: "eip155" });
  const { user, refetch: refetchUser } = useUserData(address);
  const {
    incomeHistory,
    totalUsdt,
    totalHana,
    fromCache,
    isLoading,
    error,
    refetch,
  } = useLevelIncomeHistory(address);

  const [selectedLevel, setSelectedLevel] = useState("all");

  const contractLevelTotal = parseFloat(user?.totalLevelFormatted || "0");
  const displayLevelUsdt = contractLevelTotal > 0 ? contractLevelTotal : totalUsdt;

  const levelBreakdown = useMemo(() => {
    const grouped = new Map();
    for (const item of incomeHistory) {
      const lvl = item.level || 0;
      const existing = grouped.get(lvl) || {
        level: lvl,
        count: 0,
        usdt: 0,
        hana: 0,
      };
      existing.count += 1;
      existing.usdt += Number(item.usdtNumber ?? item.usdtFormatted ?? 0);
      existing.hana += Number(item.hanaNumber ?? item.hanaFormatted ?? 0);
      grouped.set(lvl, existing);
    }
    return [...grouped.values()].sort((a, b) => a.level - b.level);
  }, [incomeHistory]);

  const filteredRows = useMemo(() => {
    if (selectedLevel === "all") return incomeHistory;
    const targetLevel = Number(selectedLevel);
    return incomeHistory.filter((row) => row.level === targetLevel);
  }, [incomeHistory, selectedLevel]);

  const handleRefresh = () => {
    refetch?.();
    refetchUser?.();
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          icon={Zap}
          label="Total Level Income"
          value={`$${displayLevelUsdt.toFixed(2)}`}
          sub={`${incomeHistory.length} on-chain income events`}
          color="gold"
        />
        <StatCard
          icon={Coins}
          label="HANA Credited"
          value={`${totalHana.toFixed(2)} HANA`}
          sub="Across all network levels"
          color="blue"
        />
        <StatCard
          icon={Unlock}
          label="Open Levels"
          value={(user?.openLevels ?? 0).toString()}
          sub={`${user?.validDirects ?? 0} valid direct${(user?.validDirects ?? 0) === 1 ? "" : "s"}`}
          color="green"
        />
        <StatCard
          icon={Layers}
          label="Income Events"
          value={incomeHistory.length.toString()}
          sub="Verified via LevelIncomeAllotted"
          color="purple"
        />
      </div>

      {levelBreakdown.length > 0 && (
        <SectionCard
          title="Level-Wise Earnings Summary"
          subtitle="Aggregated directly from on-chain LevelIncomeAllotted events"
        >
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {levelBreakdown.map((entry) => {
              const isSelected = selectedLevel === String(entry.level);
              return (
                <button
                  key={entry.level}
                  type="button"
                  onClick={() =>
                    setSelectedLevel(isSelected ? "all" : String(entry.level))
                  }
                  className={`rounded-xl border p-3 text-left transition cursor-pointer ${
                    isSelected
                      ? "border-[#FFB51D]/50 bg-[#FFB51D]/10"
                      : "border-[#222] bg-[#0A0A0A] hover:border-white/20"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#FFB51D]">
                      {entry.level > 0 ? `Level ${entry.level}` : "Other"}
                    </span>
                    <span className="text-[11px] text-neutral-400">
                      {entry.count} tx
                    </span>
                  </div>
                  <p className="mt-1.5 text-sm font-bold text-white">
                    ${entry.usdt.toFixed(2)}
                  </p>
                  <p className="text-[11px] text-neutral-400">
                    +{entry.hana.toFixed(2)} HANA
                  </p>
                </button>
              );
            })}
          </div>
        </SectionCard>
      )}

      <SectionCard
        title="Level Income Event Log"
        subtitle="Verified level commissions credited to your wallet on BSC Testnet"
        action={
          <div className="flex flex-wrap items-center gap-2">
            {fromCache && (
              <span className="inline-flex items-center gap-1 rounded-md border border-[#FFB51D]/20 bg-[#FFB51D]/5 px-2 py-1 text-[10px] font-semibold text-[#FFB51D]">
                ⚡ Cached
              </span>
            )}
            {levelBreakdown.length > 0 && (
              <select
                aria-label="Filter by level"
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="rounded-lg border border-white/10 bg-[#161616] px-3 py-2 text-xs font-medium text-neutral-200 outline-none focus:border-[#FFB51D]/50"
              >
                <option value="all">All Levels ({incomeHistory.length})</option>
                {levelBreakdown.map((entry) => (
                  <option key={entry.level} value={String(entry.level)}>
                    {entry.level > 0 ? `Level ${entry.level}` : "Other"} ({entry.count})
                  </option>
                ))}
              </select>
            )}
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isLoading || !address}
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-[#161616] px-3 py-2 text-xs font-medium text-neutral-300 transition hover:border-[#FFB51D]/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw size={13} className={isLoading ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>
        }
      >
        <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-[#FFB51D]/20 bg-[#FFB51D]/5 p-3">
          <ArrowUpRight size={15} className="mt-0.5 shrink-0 text-[#FFB51D]" />
          <p className="text-[12px] text-[#A3A3A3]">
            Multi-level network commissions earned by your wallet are queried directly from on-chain{" "}
            <code className="text-[#FFE28A]">LevelIncomeAllotted</code> event logs with transaction hashes.
          </p>
        </div>

        <EventLogTable
          address={address}
          connectMessage="Connect your wallet to view level income event logs."
          isLoading={isLoading}
          loadingMessage="Loading level income events from BSC Testnet..."
          error={error}
          errorPrefix="Could not load level income logs"
          rows={filteredRows}
          columns={levelColumns}
          emptyIcon={Layers}
          emptyTitle="No level income events yet"
          emptyDescription="On-chain level income events credited to your wallet will appear here."
          tableLabel="Level income event logs"
          minWidthClass="min-w-[760px]"
        />
      </SectionCard>
    </div>
  );
}
