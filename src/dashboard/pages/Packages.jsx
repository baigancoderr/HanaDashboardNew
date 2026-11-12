import { useEffect, useState } from "react";
import {
  Shield,
  CheckCircle,
  ArrowUpRight,
  Clock,
  Plus,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAppKitAccount } from "@reown/appkit/react";
import SectionCard from "../components/SectionCard";
import GoldBadge from "../components/GoldBadge";
import { useUserData, useUserStakes } from "../../contracts/hooks";
import { DEFAULT_PACKAGES } from "../../contracts/config";

const packages = [
  {
    id: 1,
    amount: 100,
    dailyRate: "0.50%",
    split: "0.25% + 0.25%",
    cap: "2X",
    capAmount: "$200",
    color: "blue",
    label: "Bronze",
    features: ["12-hour credit cycle", "2X capping", "5% direct referral", "Level income eligible"],
  },
  {
    id: 2,
    amount: 300,
    dailyRate: "0.60%",
    split: "0.30% + 0.30%",
    cap: "2X",
    capAmount: "$600",
    color: "purple",
    label: "Silver",
    features: ["12-hour credit cycle", "2X capping", "5% direct referral", "Level income eligible"],
  },
  {
    id: 3,
    amount: 500,
    dailyRate: "0.70%",
    split: "0.35% + 0.35%",
    cap: "2X",
    capAmount: "$1,000",
    color: "gold",
    label: "Gold",
    features: ["12-hour credit cycle", "2X capping", "5% direct referral", "Level income eligible"],
  },
  {
    id: 4,
    amount: 1000,
    dailyRate: "1.00%",
    split: "0.50% + 0.50%",
    cap: "2X",
    capAmount: "$2,000",
    color: "green",
    label: "Platinum",
    popular: true,
    features: ["12-hour credit cycle", "2X capping", "5% direct referral", "Level income eligible", "Sub-IDs allowed (after 10 min)", "Reinvest wallet eligible"],
  },
];

const colorMap = {
  blue: {
    border: "border-white/15",
    badge: "bg-white/5 text-neutral-200 border-white/10",
    rate: "text-neutral-200",
    btn: "from-[#2A2A2A] to-[#525252]",
    glow: "bg-white/5",
  },
  purple: {
    border: "border-purple-500/30",
    badge: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    rate: "text-purple-400",
    btn: "from-purple-500 to-violet-500",
    glow: "bg-purple-500/5",
  },
  gold: {
    border: "border-[#FFB51D]/30",
    badge: "bg-[#FFB51D]/10 text-[#FFB51D] border-[#FFB51D]/20",
    rate: "text-[#FFB51D]",
    btn: "from-[#FFE28A] to-[#FFB51D]",
    glow: "bg-[#FFB51D]/5",
  },
  green: {
    border: "border-green-500/30",
    badge: "bg-green-500/10 text-green-400 border-green-500/20",
    rate: "text-green-400",
    btn: "from-green-400 to-emerald-500",
    glow: "bg-green-500/5",
  },
};

export default function Packages() {
  const navigate = useNavigate();
  const { address } = useAppKitAccount({ namespace: "eip155" });
  const { user } = useUserData(address);
  const { stakes } = useUserStakes(address);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;
  const totalPages = Math.ceil((stakes?.length || 0) / pageSize);
  const visiblePage = Math.min(currentPage, Math.max(totalPages, 1));
  const visibleStakes = stakes?.slice(
    (visiblePage - 1) * pageSize,
    visiblePage * pageSize
  );

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, Math.max(totalPages, 1)));
  }, [totalPages]);

  useEffect(() => {
    setCurrentPage(1);
  }, [address]);

  return (
    <div className="flex flex-col gap-6 font-chakra-petch">
      {/* Header Info */}
      <div className="rounded-xl border border-[#222] bg-[#111] p-4 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#FFE28A] to-[#FFB51D]">
          <Shield size={18} className="text-black" />
        </div>
        <div>
          <p className="text-[14px] font-semibold text-white">Staking Packages · BSC Testnet</p>
          <p className="text-[12px] text-[#A3A3A3]">
            All packages divided and credited every 12 hours. No P2P transfers allowed internally. Capping: 2X for Investors, 4X for Networkers.
          </p>
        </div>
      </div>

      {/* Active Package Positions for Connected Wallet */}
      {/* <SectionCard
        title="Your Active Package Positions"
        subtitle="Connected wallet staking positions on BSC Testnet"
        className="order-3"
      >
        {stakes && stakes.length > 0 ? (
          <>
            <div className="space-y-4">
              {visibleStakes.map((stake) => {
              const pkg =
                DEFAULT_PACKAGES.find((p) => p.id === stake.packageId) ||
                DEFAULT_PACKAGES[0];
              const startDate = stake.startTime
                ? new Date(stake.startTime * 1000).toLocaleDateString("en-US", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })
                : "Active Position";
              const amount = Number(stake.amountFormatted) || 0;
              const claimed = Number(stake.totalClaimedFormatted) || 0;
              const cap = Number(stake.capFormatted) || 0;
              const capProgress =
                cap > 0 ? Math.min((claimed / cap) * 100, 100) : 0;

              return (
                <div
                  key={stake.stakeIndex}
                  className="group relative overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-[#17140D] via-[#111] to-[#0A0A0A] p-4 transition-colors hover:border-[#FFB51D]/35 sm:p-5"
                >
                  <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[#FFB51D]/[0.06] blur-3xl transition-colors group-hover:bg-[#FFB51D]/10" />
                  <div className="relative">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#FFE28A] to-[#FFB51D] shadow-[0_4px_18px_rgba(255,181,29,0.15)]">
                          <Shield size={20} className="text-black" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-[15px] font-bold text-white sm:text-base">
                              {pkg.name} Package
                            </p>
                            <GoldBadge>{pkg.isDAO ? "DAO" : "Main"}</GoldBadge>
                          </div>
                          <p className="mt-0.5 text-[12px] text-[#A3A3A3]">
                            Position #{stake.stakeIndex + 1}
                            <span className="mx-1.5 text-[#525252]">·</span>
                            Started {startDate}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 pl-14 sm:pl-0">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                            stake.active
                              ? "border-green-500/25 bg-green-500/10 text-green-400"
                              : "border-white/10 bg-white/5 text-[#A3A3A3]"
                          }`}
                        >
                          <span
                            className={`text-[9px] ${
                              stake.active ? "text-green-400" : "text-[#737373]"
                            }`}
                          >
                            ●
                          </span>
                          {stake.active ? "Active" : "Capped"}
                        </span>
                        <span className="inline-flex items-center rounded-full border border-[#FFB51D]/20 bg-[#FFB51D]/[0.07] px-2.5 py-1 text-[11px] font-semibold text-[#FFB51D]">
                          {pkg.dailyRate} daily
                        </span>
                        {stake.txHash && (
                          <a
                            href={stake.explorerUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 rounded-full border border-white/10 px-2.5 py-1 font-mono text-[10px] text-[#A3A3A3] transition hover:border-[#FFB51D]/30 hover:text-[#FFB51D]"
                            title="View creation transaction on BscScan"
                          >
                            Tx {stake.txHash.slice(0, 6)}...{stake.txHash.slice(-4)}
                            <ExternalLink size={10} />
                          </a>
                        )}
                      </div>
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                      <div className="rounded-lg border border-white/[0.07] bg-black/25 p-3">
                        <p className="text-[10px] font-medium uppercase tracking-wider text-[#737373]">
                          Invested
                        </p>
                        <p className="mt-1 text-[16px] font-bold text-white">
                          ${amount.toLocaleString()}
                        </p>
                      </div>
                      <div className="rounded-lg border border-white/[0.07] bg-black/25 p-3">
                        <p className="text-[10px] font-medium uppercase tracking-wider text-[#737373]">
                          Total Claimed
                        </p>
                        <p className="mt-1 text-[16px] font-bold text-green-400">
                          ${claimed.toFixed(2)}
                        </p>
                      </div>
                      <div className="col-span-2 rounded-lg border border-white/[0.07] bg-black/25 p-3 sm:col-span-1">
                        <p className="text-[10px] font-medium uppercase tracking-wider text-[#737373]">
                          Earnings Cap
                        </p>
                        <p className="mt-1 text-[16px] font-bold text-[#FFB51D]">
                          ${cap.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="mb-1.5 flex items-center justify-between gap-3 text-[11px]">
                        <span className="text-[#A3A3A3]">Cap progress</span>
                        <span className="font-semibold text-white">
                          {capProgress.toFixed(1)}%
                        </span>
                      </div>
                      <div
                        className="h-1.5 overflow-hidden rounded-full bg-white/10"
                        role="progressbar"
                        aria-label={`Position ${stake.stakeIndex + 1} cap progress`}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={Math.round(capProgress)}
                      >
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#FFE28A] to-[#FFB51D] transition-all"
                          style={{ width: `${capProgress}%` }}
                        />
                      </div>
                    </div>

                    <p className="mt-3 text-[11px] text-[#737373]">
                      ROI credited every 12 hours
                    </p>
                  </div>
                </div>
              );
              })}
            </div>
            {totalPages > 1 && (
              <div className="mt-4 flex flex-col gap-3 border-t border-[#222] pt-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-[12px] text-[#737373]">
                  Showing {(visiblePage - 1) * pageSize + 1}–
                  {Math.min(visiblePage * pageSize, stakes.length)} of {stakes.length} positions
                </p>
                <div className="flex items-center justify-between gap-3 sm:justify-end">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((page) => Math.max(page - 1, 1))}
                    disabled={visiblePage === 1}
                    aria-label="Previous page"
                    className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-[#0A0A0A] px-3 py-2 text-xs font-medium text-white transition hover:border-[#FFB51D]/40 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft size={14} /> Previous
                  </button>
                  <span className="text-xs text-[#A3A3A3]">
                    Page {visiblePage} of {totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setCurrentPage((page) => Math.min(page + 1, totalPages))
                    }
                    disabled={visiblePage === totalPages}
                    aria-label="Next page"
                    className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-[#0A0A0A] px-3 py-2 text-xs font-medium text-white transition hover:border-[#FFB51D]/40 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-lg border border-dashed border-white/15 bg-white/[0.02] p-5">
            <div>
              <p className="text-[15px] font-bold text-white">No active package yet</p>
              <p className="text-[12px] text-[#A3A3A3] mt-0.5">
                Stake USDT in any of the available packages below to activate daily earnings.
              </p>
            </div>
            <button
              onClick={() => navigate("/dashboard/staking")}
              className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-[#FFE28A] to-[#FFB51D] px-4 py-2 text-xs font-bold text-black hover:brightness-110 cursor-pointer"
            >
              <Plus size={14} /> Stake Now
            </button>
          </div>
        )}
      </SectionCard> */}

      {/* Package Cards */}
      <div>
        <h3 className="mb-4 text-[15px] font-semibold text-white">Available Packages</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {packages.map((pkg) => {
            const c = colorMap[pkg.color];
            return (
              <div
                key={pkg.amount}
                className={`relative overflow-hidden rounded-xl border ${c.border} bg-[#111] p-5 flex flex-col transition-all hover:-translate-y-1 hover:shadow-xl`}
              >
                {pkg.popular && (
                  <div className="absolute right-0 top-0 rounded-bl-xl bg-gradient-to-r from-[#FFE28A] to-[#FFB51D] px-3 py-1">
                    <span className="text-[10px] font-bold text-black">POPULAR</span>
                  </div>
                )}
                <div className={`pointer-events-none absolute bottom-0 right-0 h-32 w-32 rounded-full ${c.glow} blur-3xl`} />

                {/* Label */}
                <span className={`inline-flex w-fit items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${c.badge}`}>
                  {pkg.label}
                </span>

                {/* Amount */}
                <div className="mt-4">
                  <p className="text-[11px] text-[#737373] uppercase tracking-wider">Package Amount</p>
                  <p className="text-[28px] font-bold text-white">${pkg.amount.toLocaleString()}</p>
                </div>

                {/* Rate */}
                <div className="mt-3 rounded-lg border border-[#222] bg-[#0A0A0A] p-3">
                  <div className="flex justify-between">
                    <span className="text-[11px] text-[#737373]">Daily Rate</span>
                    <span className={`text-[13px] font-bold ${c.rate}`}>{pkg.dailyRate}</span>
                  </div>
                  <div className="mt-2 flex justify-between">
                    <span className="text-[11px] text-[#737373]">12h Split</span>
                    <span className="text-[12px] text-[#A3A3A3]">{pkg.split}</span>
                  </div>
                  <div className="mt-2 flex justify-between">
                    <span className="text-[11px] text-[#737373]">Cap</span>
                    <span className={`text-[12px] font-semibold ${c.rate}`}>{pkg.cap} → {pkg.capAmount}</span>
                  </div>
                </div>

                {/* Features */}
                <ul className="mt-4 space-y-2 flex-1">
                  {pkg.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <CheckCircle size={13} className={`mt-0.5 shrink-0 ${c.rate}`} />
                      <span className="text-[11px] text-[#A3A3A3]">{f}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => navigate("/dashboard/staking")}
                  className={`mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r ${c.btn} py-2.5 text-[13px] font-semibold ${pkg.color === "gold" ? "text-black" : "text-white"} transition-all hover:brightness-110 cursor-pointer`}
                >
                  Stake Now <ArrowUpRight size={14} />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* DAO Package */}
      <SectionCard
        title="Special DAO Package"
        subtitle="Premium membership with enhanced benefits"
        className="order-2"
      >
        <div className="relative overflow-hidden rounded-xl border border-[#FFB51D]/30 bg-gradient-to-br from-[#FFB51D]/5 via-[#111111] to-[#a78bfa]/5 p-5 sm:p-6">
          <div className="pointer-events-none absolute right-0 top-0 h-48 w-48 rounded-full bg-[#FFB51D]/5 blur-3xl" />
          <div className="pointer-events-none absolute left-0 bottom-0 h-32 w-32 rounded-full bg-purple-500/5 blur-2xl" />

          <div className="relative grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="sm:col-span-2">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[#FFE28A] to-[#FFB51D] flex items-center justify-center">
                  <Shield size={22} className="text-black" />
                </div>
                <div>
                  <p className="text-[20px] font-bold text-white">$5,000 DAO Package</p>
                  <GoldBadge>Limited: 500 Members</GoldBadge>
                </div>
              </div>
              <p className="mt-3 text-[12px] text-[#A3A3A3] leading-relaxed">
                Exclusive DAO membership active on BSC Testnet. Receive 1% daily (split 12h) up to 2X cap ($10,000). DAO Network income is NOT included in capping calculation.
              </p>
            </div>

            <div className="space-y-3">
              {[
                { label: "Daily Rate", value: "1.00%", color: "text-[#FFB51D]" },
                { label: "Capping", value: "2X = $10,000", color: "text-green-400" },
                { label: "Leader Cap", value: "4X (with network)", color: "text-purple-400" },
                { label: "Duration", value: "365 Days", color: "text-[#FFB51D]" },
              ].map((item) => (
                <div key={item.label} className="flex justify-between rounded-lg border border-[#222] bg-[#0A0A0A] px-3 py-2">
                  <span className="text-[11px] text-[#737373]">{item.label}</span>
                  <span className={`text-[12px] font-bold ${item.color}`}>{item.value}</span>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              {[
                { label: "DAO Pool Share", value: "5% Weekly", color: "text-[#FFB51D]" },
                { label: "Pool Distribution", value: "Equally split", color: "text-green-400" },
                { label: "Top-up", value: "Multiples of $1,000", color: "text-[#FFB51D]" },
                { label: "Payout", value: "Until 2X cap", color: "text-purple-400" },
              ].map((item) => (
                <div key={item.label} className="flex justify-between rounded-lg border border-[#222] bg-[#0A0A0A] px-3 py-2">
                  <span className="text-[11px] text-[#737373]">{item.label}</span>
                  <span className={`text-[12px] font-bold ${item.color}`}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative mt-5 flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => navigate("/dashboard/staking")}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#FFE28A] to-[#FFB51D] py-3 text-[14px] font-bold text-black hover:brightness-110 transition-all cursor-pointer"
            >
              Activate DAO Package <ArrowUpRight size={16} />
            </button>
          </div>
        </div>
      </SectionCard>

      {/* Deductions Table */}
      <SectionCard
        title="Withdrawal Deductions"
        subtitle="Fee structure applied on all withdrawals"
        className="order-4"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <p className="mb-3 text-[12px] font-semibold text-[#A3A3A3] uppercase tracking-wider">Standard Deductions (30%)</p>
            <div className="overflow-hidden rounded-lg border border-[#222]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#222] bg-[#0A0A0A]">
                    <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-[#737373] uppercase">Type</th>
                    <th className="px-4 py-2.5 text-right text-[11px] font-semibold text-[#737373] uppercase">Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { type: "Admin Charges", rate: "5%", color: "text-red-400" },
                    { type: "Swap Fee", rate: "5%", color: "text-[#FFB51D]" },
                    { type: "Ecosystem Deduction", rate: "20%", color: "text-purple-400" },
                    { type: "Total", rate: "30%", color: "text-white", bold: true },
                  ].map((row) => (
                    <tr key={row.type} className="border-b border-[#222] last:border-0">
                      <td className={`px-4 py-2.5 text-[12px] ${row.bold ? "font-bold text-white" : "text-[#A3A3A3]"}`}>{row.type}</td>
                      <td className={`px-4 py-2.5 text-right text-[12px] font-bold ${row.color}`}>{row.rate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div>
            <p className="mb-3 text-[12px] font-semibold text-[#A3A3A3] uppercase tracking-wider">Cooling Period & Limits</p>
            <div className="overflow-hidden rounded-lg border border-green-500/20 p-4 bg-[#0A0A0A]">
              <div className="flex items-start gap-2">
                <Clock size={16} className="mt-0.5 shrink-0 text-[#FFB51D]" />
                <p className="text-[12px] text-[#A3A3A3]">
                  Max withdrawal per transaction: <strong className="text-white">$2,500</strong>.<br />
                  Cooling period between withdrawals: <strong className="text-white">24 hours</strong>.<br />
                  Minimum claim/withdrawal: <strong className="text-white">$10.00</strong>.
                </p>
              </div>
            </div>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
