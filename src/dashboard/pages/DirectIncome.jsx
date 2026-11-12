import { useState } from "react";
import { useAppKitAccount } from "@reown/appkit/react";
import {
  ArrowUpRight,
  Check,
  Coins,
  Copy,
  RefreshCw,
  TrendingUp,
  UserCheck,
  Users,
} from "lucide-react";
import StatCard from "../components/StatCard";
import SectionCard from "../components/SectionCard";
import EventLogTable, {
  ExplorerAddressLink,
  ExplorerTxBadge,
} from "../components/EventLogTable";
import { useReferralHistory, useUserData } from "../../contracts/hooks";

const incomeColumns = [
  {
    key: "from",
    label: "From Member",
    render: (row) => (
      <ExplorerAddressLink
        address={row.stakerAddress}
        shortLabel={row.stakerShort}
        href={row.stakerExplorerUrl}
        fallback="Referred Member"
      />
    ),
  },
  {
    key: "stakeAmount",
    label: "Stake Amount",
    render: (row) =>
      row.stakeAmountFormatted ? (
        <span className="font-semibold text-white">
          ${row.stakeAmountFormatted} USDT
        </span>
      ) : (
        <span className="text-neutral-500">—</span>
      ),
  },
  {
    key: "package",
    label: "Package",
    render: (row) =>
      row.stakePackageName ? (
        <span className="rounded-md border border-[#FFB51D]/20 bg-[#FFB51D]/5 px-2 py-0.5 text-[11px] font-semibold text-[#FFB51D]">
          {row.stakePackageName}
        </span>
      ) : (
        <span className="text-neutral-500">—</span>
      ),
  },
  {
    key: "usdt",
    label: "Your Income (5%)",
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

const referralColumns = [
  {
    key: "member",
    label: "Member Wallet",
    render: (row) => (
      <ExplorerAddressLink
        address={row.userAddress}
        shortLabel={row.userShort}
        href={row.userExplorerUrl}
        fallback="Registered Member"
      />
    ),
  },
  {
    key: "date",
    label: "Registered Date",
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

export default function DirectIncome() {
  const { address } = useAppKitAccount({ namespace: "eip155" });
  const { user, refetch: refetchUser } = useUserData(address);
  const {
    directIncomeHistory,
    registeredReferrals,
    totalDirectEarnedUsdt,
    totalDirectEarnedHana,
    isLoading,
    error,
    refetch,
  } = useReferralHistory(address);

  const [activeTab, setActiveTab] = useState("earnings");
  const [copiedLink, setCopiedLink] = useState(false);

  const referralLink = address
    ? `${window.location.origin}/register?ref=${encodeURIComponent(address)}`
    : "";

  const contractDirectTotal = parseFloat(user?.totalDirectFormatted || "0");
  const displayDirectUsdt =
    contractDirectTotal > 0 ? contractDirectTotal : totalDirectEarnedUsdt;

  const handleCopyLink = async () => {
    if (!referralLink) return;
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopiedLink(true);
      window.setTimeout(() => setCopiedLink(false), 2000);
    } catch (err) {
      console.warn("Could not copy referral link:", err);
    }
  };

  const handleRefresh = () => {
    refetch?.();
    refetchUser?.();
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          icon={TrendingUp}
          label="Total Direct Income"
          value={`$${displayDirectUsdt.toFixed(2)}`}
          sub={`${directIncomeHistory.length} on-chain income events`}
          color="gold"
        />
        <StatCard
          icon={Coins}
          label="HANA Credited"
          value={`${totalDirectEarnedHana.toFixed(2)} HANA`}
          sub="From direct referral rewards"
          color="blue"
        />
        <StatCard
          icon={UserCheck}
          label="Valid Directs"
          value={(user?.validDirects ?? 0).toString()}
          sub={`${registeredReferrals.length} registered referral${registeredReferrals.length === 1 ? "" : "s"}`}
          color="green"
        />
        <StatCard
          icon={Users}
          label="Income Events"
          value={directIncomeHistory.length.toString()}
          sub="Verified via IncomeAllotted"
          color="purple"
        />
      </div>

      {address && (
        <div className="flex flex-col gap-3 rounded-xl border border-[#FFB51D]/20 bg-[#111] p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#FFB51D]">
              Your Referral Link
            </p>
            <code className="mt-1 block truncate rounded-md border border-white/10 bg-black/50 px-3 py-1.5 font-mono text-xs text-[#F8E096]">
              {referralLink}
            </code>
          </div>
          <button
            type="button"
            onClick={handleCopyLink}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-[#FFB51D]/30 bg-[#FFB51D]/10 px-4 py-2 text-xs font-semibold text-[#FFB51D] transition hover:bg-[#FFB51D] hover:text-black cursor-pointer"
          >
            {copiedLink ? <Check size={14} /> : <Copy size={14} />}
            {copiedLink ? "Copied!" : "Copy Referral Link"}
          </button>
        </div>
      )}

      <SectionCard
        title="Direct Income Event Log"
        subtitle="Real-time direct referral income fetched from BSC Testnet contract events"
        action={
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-lg border border-white/10 bg-[#161616] p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab("earnings")}
                className={`rounded-md px-3 py-1.5 font-medium transition cursor-pointer ${
                  activeTab === "earnings"
                    ? "bg-[#FFB51D] font-bold text-black"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                Income Logs ({directIncomeHistory.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("referrals")}
                className={`rounded-md px-3 py-1.5 font-medium transition cursor-pointer ${
                  activeTab === "referrals"
                    ? "bg-[#FFB51D] font-bold text-black"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                Direct Referrals ({registeredReferrals.length})
              </button>
            </div>
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
            Direct income rewards credited when your direct referrals stake are indexed directly from on-chain{" "}
            <code className="text-[#FFE28A]">IncomeAllotted</code> (<code className="text-[#FFE28A]">direct</code>) and{" "}
            <code className="text-[#FFE28A]">Registered</code> event logs.
          </p>
        </div>

        {activeTab === "earnings" ? (
          <EventLogTable
            address={address}
            connectMessage="Connect your wallet to view direct income event logs."
            isLoading={isLoading}
            loadingMessage="Loading direct income events from BSC Testnet..."
            error={error}
            errorPrefix="Could not load direct income logs"
            rows={directIncomeHistory}
            columns={incomeColumns}
            emptyIcon={Coins}
            emptyTitle="No direct income events yet"
            emptyDescription="Direct referral rewards allotted to your wallet on-chain will appear here."
            tableLabel="Direct income event logs"
            minWidthClass="min-w-[900px]"
          />
        ) : (
          <EventLogTable
            address={address}
            connectMessage="Connect your wallet to view direct referrals."
            isLoading={isLoading}
            loadingMessage="Loading registered direct referrals..."
            error={error}
            errorPrefix="Could not load direct referrals"
            rows={registeredReferrals}
            columns={referralColumns}
            emptyIcon={Users}
            emptyTitle="No direct referrals registered yet"
            emptyDescription="Wallets that register using your referral address will appear here."
            tableLabel="Registered direct referrals"
            minWidthClass="min-w-[540px]"
          />
        )}
      </SectionCard>
    </div>
  );
}

