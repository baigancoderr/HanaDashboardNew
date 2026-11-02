import { Shield, CheckCircle, ArrowUpRight, Info, Clock, Plus } from "lucide-react";
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

  const primaryStake = stakes && stakes.length > 0 ? stakes[0] : null;
  const primaryPkg = primaryStake
    ? DEFAULT_PACKAGES.find((p) => p.id === primaryStake.packageId) || DEFAULT_PACKAGES[0]
    : null;

  return (
    <div className="space-y-6 font-chakra-petch">
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

      {/* Current Package */}
      <SectionCard title="Your Active Package">
        {primaryStake ? (
          <>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-lg border border-[#FFB51D]/20 bg-[#FFB51D]/5 p-4">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[#FFE28A] to-[#FFB51D] flex items-center justify-center">
                  <Shield size={22} className="text-black" />
                </div>
                <div>
                  <p className="text-[16px] font-bold text-white">
                    ${parseFloat(primaryStake.amountFormatted).toLocaleString()} {primaryPkg?.name} Package
                  </p>
                  <p className="text-[12px] text-[#A3A3A3]">
                    Active · {primaryPkg?.dailyRate} daily · Credited every 12h
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <GoldBadge>Earning {primaryPkg?.dailyRate} Daily</GoldBadge>
                <GoldBadge>{stakes.length} Active Position{stakes.length === 1 ? "" : "s"}</GoldBadge>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: "Total Invested", value: `$${parseFloat(user?.totalStakedFormatted || 0).toLocaleString()}` },
                { label: "Total Claimed", value: `$${parseFloat(user?.totalROIClaimedFormatted || 0).toLocaleString()}` },
                { label: "2X Cap", value: `$${parseFloat(primaryStake.capFormatted).toLocaleString()}` },
                { label: "Status", value: primaryStake.active ? "Active" : "Capped" },
              ].map((item) => (
                <div key={item.label} className="rounded-lg border border-[#222] bg-[#0A0A0A] p-3 text-center">
                  <p className="text-[11px] text-[#737373]">{item.label}</p>
                  <p className="mt-1 text-[15px] font-bold text-white">{item.value}</p>
                </div>
              ))}
            </div>
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
              className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-[#FFE28A] to-[#FFB51D] px-4 py-2 text-xs font-bold text-black hover:brightness-110"
            >
              <Plus size={14} /> Stake Now
            </button>
          </div>
        )}
      </SectionCard>

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
      <SectionCard title="Special DAO Package" subtitle="Premium membership with enhanced benefits">
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
      <SectionCard title="Withdrawal Deductions" subtitle="Fee structure applied on all withdrawals">
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
