import { useAppKitAccount } from "@reown/appkit/react";
import { Coins, ExternalLink, Loader2, RefreshCw, Users } from "lucide-react";
import StatCard from "../components/StatCard";
import SectionCard from "../components/SectionCard";
import { useReferralHistory } from "../../contracts/hooks";
import { getExplorerAddressUrl } from "../../contracts/config";

export default function ReferralIncomeHistory() {
  const { address } = useAppKitAccount({ namespace: "eip155" });
  const {
    directIncomeHistory,
    totalDirectEarnedUsdt,
    totalDirectEarnedHana,
    isLoading,
    error,
    refetch,
  } = useReferralHistory(address, { includeRegistrations: false });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        <StatCard
          icon={Coins}
          label="Total Referral Income"
          value={`$${totalDirectEarnedUsdt.toFixed(2)}`}
          sub={`${directIncomeHistory.length} on-chain income events`}
          color="gold"
        />
        <StatCard
          icon={Users}
          label="HANA Credited"
          value={`${totalDirectEarnedHana.toFixed(2)} HANA`}
          sub="Across direct referrals"
          color="blue"
        />
        <StatCard
          icon={Coins}
          label="Income Events"
          value={directIncomeHistory.length.toString()}
          sub="Verified on-chain"
          color="green"
        />
      </div>

      <SectionCard
        title="Referral Income History"
        subtitle="Direct referral income recorded on-chain — with staker address and stake amount"
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
        {!address ? (
          <p className="rounded-lg border border-dashed border-white/10 p-6 text-center text-sm text-neutral-400">
            Connect your wallet to view referral income history.
          </p>
        ) : isLoading ? (
          <div className="flex items-center justify-center py-10 text-[#FFB51D]">
            <Loader2 size={20} className="mr-2 animate-spin" />
            <span className="text-xs">Loading referral income history…</span>
          </div>
        ) : error ? (
          <p className="rounded-lg border border-red-400/20 bg-red-400/[0.05] p-4 text-sm text-red-300" role="alert">
            Could not load referral income history: {error}
          </p>
        ) : directIncomeHistory.length === 0 ? (
          <div className="rounded-lg border border-dashed border-white/10 p-6 text-center">
            <Users size={26} className="mx-auto mb-2 text-neutral-500" />
            <p className="text-sm font-medium text-white">No referral income yet</p>
            <p className="mt-1 text-xs text-neutral-400">
              On-chain referral income events for your wallet will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-xs">
              <thead>
                <tr className="border-b border-[#222] text-[11px] uppercase tracking-wider text-[#737373]">
                  <th className="pb-3 font-semibold">Staker (Who Staked)</th>
                  <th className="pb-3 font-semibold">Stake Amount</th>
                  <th className="pb-3 font-semibold">Package</th>
                  <th className="pb-3 font-semibold">Your Income (5%)</th>
                  <th className="pb-3 font-semibold">HANA Credited</th>
                  <th className="pb-3 font-semibold">Date &amp; Time</th>
                  <th className="pb-3 text-right font-semibold">Transaction</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222]">
                {directIncomeHistory.map((row, index) => (
                  <tr
                    key={`${row.txHash}-${index}`}
                    className="transition hover:bg-white/[0.02]"
                  >
                    {/* Staker address */}
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

                    {/* Stake amount */}
                    <td className="py-3">
                      {row.stakeAmountFormatted ? (
                        <span className="font-semibold text-white">
                          ${row.stakeAmountFormatted} USDT
                        </span>
                      ) : (
                        <span className="text-neutral-500">—</span>
                      )}
                    </td>

                    {/* Package name */}
                    <td className="py-3">
                      {row.stakePackageName ? (
                        <span className="rounded-md border border-[#FFB51D]/20 bg-[#FFB51D]/5 px-2 py-0.5 text-[11px] font-semibold text-[#FFB51D]">
                          {row.stakePackageName}
                        </span>
                      ) : (
                        <span className="text-neutral-500">—</span>
                      )}
                    </td>

                    {/* Income earned (5%) */}
                    <td className="py-3 font-semibold text-green-400">
                      +${row.usdtFormatted} USDT
                    </td>

                    {/* HANA credited */}
                    <td className="py-3 font-semibold text-[#FFB51D]">
                      +{row.hanaFormatted} HANA
                    </td>

                    {/* Date */}
                    <td className="py-3 text-neutral-400">{row.dateFormatted}</td>

                    {/* Tx link */}
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
        )}
      </SectionCard>
    </div>
  );
}
