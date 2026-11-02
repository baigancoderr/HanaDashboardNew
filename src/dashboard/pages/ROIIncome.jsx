import { useState } from "react";
import { useAppKitAccount } from "@reown/appkit/react";
import {
  TrendingUp,
  Clock,
  Coins,
  ArrowUpRight,
  Repeat,
  ExternalLink,
  Loader2,
  Users,
  Copy,
  Check,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import StatCard from "../components/StatCard";
import SectionCard from "../components/SectionCard";
import GoldBadge from "../components/GoldBadge";
import { useUserData, useReferralHistory } from "../../contracts/hooks";
import { getExplorerTxUrl, getExplorerAddressUrl } from "../../contracts/config";

const roiHistory = [
  { period: "Day 1 AM", amount: 5.0 },
  { period: "Day 1 PM", amount: 5.0 },
  { period: "Day 2 AM", amount: 5.0 },
  { period: "Day 2 PM", amount: 5.0 },
  { period: "Day 3 AM", amount: 5.0 },
  { period: "Day 3 PM", amount: 5.0 },
  { period: "Day 4 AM", amount: 5.0 },
  { period: "Day 4 PM", amount: 5.0 },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-[#222] bg-[#111] p-3">
        <p className="text-[11px] text-[#A3A3A3]">{label}</p>
        <p className="text-[13px] font-bold text-[#FFB51D]">+${payload[0]?.value}</p>
      </div>
    );
  }
  return null;
};

export default function ROIIncome() {
  const { address } = useAppKitAccount({ namespace: "eip155" });
  const { user } = useUserData(address);
  const {
    directIncomeHistory,
    registeredReferrals,
    totalDirectEarnedUsdt,
    totalDirectEarnedHana,
    isLoading: referralLoading,
    refetch: refetchReferral,
  } = useReferralHistory(address);

  const [activeTab, setActiveTab] = useState("earnings"); // "earnings" | "registered"
  const [copiedAddress, setCopiedAddress] = useState("");

  const handleCopy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedAddress(text);
      setTimeout(() => setCopiedAddress(""), 2000);
    } catch (err) {
      console.warn("Could not copy:", err);
    }
  };

  const totalRoiClaimedDisplay = user?.totalROIClaimedFormatted
    ? `$${parseFloat(user.totalROIClaimedFormatted).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`
    : "$0.00";

  const totalDirectDisplay = user?.totalDirectFormatted
    ? `$${parseFloat(user.totalDirectFormatted).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`
    : totalDirectEarnedUsdt > 0
    ? `$${totalDirectEarnedUsdt.toFixed(2)}`
    : "$0.00";

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          icon={TrendingUp}
          label="Total ROI Earned"
          value={totalRoiClaimedDisplay}
          sub="On-chain claimed ROI"
          color="gold"
        />
        <StatCard
          icon={Coins}
          label="Direct Income"
          value={totalDirectDisplay}
          sub={`${registeredReferrals.length} registered referral${
            registeredReferrals.length === 1 ? "" : "s"
          }`}
          color="blue"
        />
        <StatCard
          icon={Repeat}
          label="Next Credit"
          value="12 Hours"
          sub="Twice daily ROI cycle"
          color="green"
        />
        <StatCard
          icon={Clock}
          label="Valid Directs"
          value={user?.validDirects?.toString() || "0"}
          sub="Staked direct members"
          color="purple"
        />
      </div>

      {/* ROI Structure */}
      <SectionCard title="ROI Rate Structure" subtitle="Credits split and issued every 12 hours">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { package: "$100", daily: "0.50%", per12h: "0.25%", daily$: "$0.50", cap: "$200" },
            { package: "$300", daily: "0.60%", per12h: "0.30%", daily$: "$1.80", cap: "$600" },
            { package: "$500", daily: "0.70%", per12h: "0.35%", daily$: "$3.50", cap: "$1,000" },
            { package: "$1,000", daily: "1.00%", per12h: "0.50%", daily$: "$10.00", cap: "$2,000" },
          ].map((row) => (
            <div
              key={row.package}
              className={`rounded-xl border ${row.package === "$1,000" ? "border-[#FFB51D]/30 bg-[#FFB51D]/5" : "border-[#222] bg-[#111]"} p-4`}
            >
              {row.package === "$1,000" && (
                <div className="mb-2">
                  <GoldBadge>Your Package</GoldBadge>
                </div>
              )}
              <p className="text-[18px] font-bold text-white">{row.package}</p>
              <div className="mt-3 space-y-2">
                <div className="flex justify-between">
                  <span className="text-[11px] text-[#737373]">Daily Rate</span>
                  <span className="text-[12px] font-bold text-[#FFB51D]">{row.daily}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[11px] text-[#737373]">Per 12h</span>
                  <span className="text-[12px] text-[#A3A3A3]">{row.per12h}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[11px] text-[#737373]">Daily Earn</span>
                  <span className="text-[12px] font-bold text-green-400">{row.daily$}</span>
                </div>
                <div className="flex justify-between border-t border-[#222] pt-2">
                  <span className="text-[11px] text-[#737373]">2X Cap</span>
                  <span className="text-[12px] font-bold text-white">{row.cap}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-lg border border-[#222] bg-[#0A0A0A] p-3">
          <p className="text-[12px] text-[#A3A3A3]">
            <span className="font-semibold text-[#FFB51D]">Capping Rule:</span> 2X for Investors · 4X for Networkers · ROI, Direct & Level income counts toward capping.
            Rank income and DAO income are <span className="text-green-400 font-semibold">excluded</span> from capping.
          </p>
        </div>
      </SectionCard>

      {/* ROI History Chart */}
      <SectionCard title="ROI Credit History" subtitle="Per-credit earnings (12h intervals)">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={roiHistory} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#222222" />
            <XAxis dataKey="period" tick={{ fill: "#737373", fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#737373", fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="amount" fill="#FFB51D" radius={[4, 4, 0, 0]} maxBarSize={40} />
          </BarChart>
        </ResponsiveContainer>
      </SectionCard>

      {/* Direct Income & Referral History from On-Chain Events */}
      <SectionCard
        title="Direct Referral Income & History"
        subtitle="Real-time 5% referral commissions and registered members from BSC Testnet event logs"
        action={
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-white/10 bg-[#161616] p-0.5 text-xs">
              <button
                onClick={() => setActiveTab("earnings")}
                className={`rounded-md px-3 py-1 font-medium transition cursor-pointer ${
                  activeTab === "earnings"
                    ? "bg-[#FFB51D] text-black font-bold"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                Earnings ({directIncomeHistory.length})
              </button>
              <button
                onClick={() => setActiveTab("registered")}
                className={`rounded-md px-3 py-1 font-medium transition cursor-pointer ${
                  activeTab === "registered"
                    ? "bg-[#FFB51D] text-black font-bold"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                Direct Members ({registeredReferrals.length})
              </button>
            </div>
            <button
              onClick={() => refetchReferral?.()}
              disabled={referralLoading}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-[#161616] px-3 py-1.5 text-xs font-medium text-neutral-300 hover:border-[#FFB51D]/40 hover:text-white transition disabled:opacity-50 cursor-pointer"
            >
              <Loader2
                size={12}
                className={referralLoading ? "animate-spin" : ""}
              />
              Refresh
            </button>
          </div>
        }
      >
        <div className="mb-4 rounded-lg border border-[#FFB51D]/20 bg-[#FFB51D]/5 p-3 flex items-center gap-2">
          <ArrowUpRight size={15} className="text-[#FFB51D] shrink-0" />
          <p className="text-[12px] text-[#A3A3A3]">
            Earn <span className="font-bold text-[#FFB51D]">5%</span> instantly on every staking action by your direct referrals. Verified on-chain via <code className="text-[#FFE28A]">IncomeAllotted</code> events.
          </p>
        </div>

        {referralLoading ? (
          <div className="flex items-center justify-center py-10 text-[#FFB51D]">
            <Loader2 size={22} className="animate-spin mr-2" />
            <span className="text-xs">Querying on-chain referral events...</span>
          </div>
        ) : activeTab === "earnings" ? (
          directIncomeHistory.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] text-left text-xs">
                <thead>
                  <tr className="border-b border-[#222] text-[#737373] uppercase tracking-wider text-[11px]">
                    <th className="pb-3 font-semibold">Staker Address</th>
                    <th className="pb-3 font-semibold">USDT Value</th>
                    <th className="pb-3 font-semibold">HANA Credited</th>
                    <th className="pb-3 font-semibold">Date & Time</th>
                    <th className="pb-3 font-semibold text-right">Transaction Hash</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#222]">
                  {directIncomeHistory.map((row, i) => (
                    <tr key={row.txHash + i} className="hover:bg-white/[0.02] transition">
                      <td className="py-3">
                        <div className="flex items-center gap-1.5">
                          {row.stakerAddress ? (
                            <>
                              <a
                                href={row.stakerExplorerUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="font-mono text-white hover:text-[#FFB51D] hover:underline"
                              >
                                {row.stakerShort}
                              </a>
                              <button
                                onClick={() => handleCopy(row.stakerAddress)}
                                className="text-neutral-500 hover:text-white"
                                title="Copy full address"
                              >
                                {copiedAddress === row.stakerAddress ? (
                                  <Check size={11} className="text-green-400" />
                                ) : (
                                  <Copy size={11} />
                                )}
                              </button>
                            </>
                          ) : (
                            <span className="text-[#A3A3A3]">Direct Referral</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 font-bold text-green-400">
                        +${row.usdtFormatted} USDT
                      </td>
                      <td className="py-3 font-semibold text-[#FFB51D]">
                        +{row.hanaFormatted} HANA
                      </td>
                      <td className="py-3 text-[12px] text-[#A3A3A3]">
                        {row.dateFormatted}
                      </td>
                      <td className="py-3 text-right">
                        <a
                          href={row.explorerUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-lg border border-[#FFB51D]/20 bg-[#FFB51D]/5 px-2.5 py-1 text-xs font-mono font-medium text-[#FFB51D] hover:bg-[#FFB51D]/15 transition"
                          title={row.txHash}
                        >
                          <span>{row.txShort}</span>
                          <ExternalLink size={12} />
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.01] p-6 text-center">
              <Coins size={28} className="mx-auto mb-2 text-neutral-500" />
              <p className="text-xs font-medium text-white">No Direct Referral Income Events Yet</p>
              <p className="mt-1 text-[11px] text-neutral-400">
                When your direct referrals stake USDT into the contract, your 5% reward and transaction hash will appear here.
              </p>
            </div>
          )
        ) : registeredReferrals.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px] text-left text-xs">
              <thead>
                <tr className="border-b border-[#222] text-[#737373] uppercase tracking-wider text-[11px]">
                  <th className="pb-3 font-semibold">Registered Member</th>
                  <th className="pb-3 font-semibold">Registration Date</th>
                  <th className="pb-3 font-semibold text-right">Registration Tx</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222]">
                {registeredReferrals.map((row, i) => (
                  <tr key={row.txHash + i} className="hover:bg-white/[0.02] transition">
                    <td className="py-3">
                      <div className="flex items-center gap-1.5">
                        <a
                          href={row.userExplorerUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="font-mono font-medium text-white hover:text-[#FFB51D] hover:underline"
                        >
                          {row.userShort}
                        </a>
                        <button
                          onClick={() => handleCopy(row.userAddress)}
                          className="text-neutral-500 hover:text-white"
                          title="Copy full address"
                        >
                          {copiedAddress === row.userAddress ? (
                            <Check size={11} className="text-green-400" />
                          ) : (
                            <Copy size={11} />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="py-3 text-[12px] text-[#A3A3A3]">
                      {row.dateFormatted}
                    </td>
                    <td className="py-3 text-right">
                      <a
                        href={row.explorerUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-[#FFB51D]/20 bg-[#FFB51D]/5 px-2.5 py-1 text-xs font-mono font-medium text-[#FFB51D] hover:bg-[#FFB51D]/15 transition"
                        title={row.txHash}
                      >
                        <span>{row.txShort}</span>
                        <ExternalLink size={12} />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.01] p-6 text-center">
            <Users size={28} className="mx-auto mb-2 text-neutral-500" />
            <p className="text-xs font-medium text-white">No Registered Direct Members Yet</p>
            <p className="mt-1 text-[11px] text-neutral-400">
              Share your referral link with new members to register them under your address on-chain.
            </p>
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#222] bg-[#0A0A0A] px-4 py-3">
          <div>
            <span className="text-[13px] font-semibold text-white">Total Direct Referral Income</span>
            <p className="text-[11px] text-[#737373]">
              Earned across {directIncomeHistory.length} staking action{directIncomeHistory.length === 1 ? "" : "s"}
            </p>
          </div>
          <div className="text-right">
            <span className="text-[16px] font-bold text-green-400">
              +{totalDirectDisplay}
            </span>
            {totalDirectEarnedHana > 0 && (
              <p className="text-[11px] text-[#FFB51D]">
                ({totalDirectEarnedHana.toFixed(2)} HANA credited)
              </p>
            )}
          </div>
        </div>
      </SectionCard>
    </div>
  );
}