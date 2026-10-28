import { useState } from "react";
import { Shield, CheckCircle, ArrowUpRight, AlertCircle, X } from "lucide-react";
import SectionCard from "../components/SectionCard";
import GoldBadge from "../components/GoldBadge";
import DataUnavailable from "../components/DataUnavailable";
import { useWeb3 } from "../../context/Web3Context";

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
  const {
    userStakes,
    totalStaked,
    usdtBalance,
    daoMemberCount,
    maxDaoMembers,
    isDAO,
    packages,
    isLoading,
    stake,
    isTransacting,
  } = useWeb3();

  const [modalPkg, setModalPkg] = useState(null);
  const [amountInput, setAmountInput] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const activeStakes = userStakes.filter((s) => s.active);
  const totalClaimed = userStakes.reduce(
    (acc, s) => acc + (parseFloat(s.totalClaimed) || 0),
    0
  );
  const totalCap = userStakes.reduce(
    (acc, s) => acc + (parseFloat(s.cap) || 0),
    0
  );
  const remainingCap = Math.max(0, totalCap - totalClaimed);
  const availablePackages = packages.filter((pkg) => !pkg.isDAO);
  const daoPackage = packages.find((pkg) => pkg.isDAO);
  const daoCapacityAvailable = daoMemberCount !== null && maxDaoMembers !== null;
  const daoMemberSummary = daoCapacityAvailable
    ? `${daoMemberCount} / ${maxDaoMembers}`
    : "Unavailable";

  const handleOpenStake = (pkg) => {
    setModalPkg(pkg);
    setAmountInput(pkg.minAmount);
    setErrorMsg("");
  };

  const handleStakeSubmit = async () => {
    if (!modalPkg) return;
    const num = parseFloat(amountInput);
    const minimum = parseFloat(modalPkg.minAmount);
    if (isNaN(num) || num < minimum) {
      setErrorMsg(`Minimum amount is $${minimum}`);
      return;
    }
    if (modalPkg.isDAO && num % 1000 !== 0) {
      setErrorMsg("DAO top-ups must be in multiples of $1,000");
      return;
    }

    if (num > parseFloat(usdtBalance || "0")) {
      setErrorMsg(`Insufficient USDT balance ($${parseFloat(usdtBalance).toFixed(2)})`);
      return;
    }

    setErrorMsg("");
    const res = await stake(modalPkg.id, num);
    if (res.success) {
      setModalPkg(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="rounded-xl border border-[#222] bg-[#111] p-4 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#FFE28A] to-[#FFB51D]">
          <Shield size={18} className="text-black" />
        </div>
        <div>
          <p className="text-[14px] font-semibold text-white">Staking Packages</p>
          <p className="text-[12px] text-[#A3A3A3]">
            Package minimums, daily rates, caps, and active status are read from the staking contract. ROI accrues in completed 12-hour periods.
          </p>
        </div>
      </div>

      {/* Current Active Package Status */}
      <SectionCard title="Your Active Position">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-lg border border-[#FFB51D]/20 bg-[#FFB51D]/5 p-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[#FFE28A] to-[#FFB51D] flex items-center justify-center">
              <Shield size={22} className="text-black" />
            </div>
            <div>
              <p className="text-[16px] font-bold text-white">
                {activeStakes.length > 0
                  ? `$${parseFloat(totalStaked).toLocaleString()} Total Staked`
                  : "No Active Stakes"}
              </p>
              <p className="text-[12px] text-[#A3A3A3]">
                {activeStakes.length > 0
                  ? `${activeStakes.length} active position(s) · Credited every 12h`
                  : "Select a package below to activate your account"}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {isDAO && <GoldBadge>DAO Membership On-Chain</GoldBadge>}
            <GoldBadge>{activeStakes.length > 0 ? "● Earning On-Chain" : "Ready to Stake"}</GoldBadge>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Total Invested", value: `$${parseFloat(totalStaked || "0").toLocaleString()}` },
            { label: "Total Claimed", value: `$${totalClaimed.toFixed(2)}` },
            { label: "Position Caps", value: `$${totalCap.toFixed(2)}` },
            { label: "Remaining Cap", value: `$${remainingCap.toFixed(2)}` },
          ].map((item) => (
            <div key={item.label} className="rounded-lg border border-[#222] bg-[#0A0A0A] p-3 text-center">
              <p className="text-[11px] text-[#737373]">{item.label}</p>
              <p className="mt-1 text-[15px] font-bold text-white">{item.value}</p>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Package Cards */}
      <div>
        <h3 className="mb-4 text-[15px] font-semibold text-white">Available Packages</h3>
        {availablePackages.length === 0 ? (
          <DataUnavailable>
            {isLoading
              ? "Loading active packages from the staking contract…"
              : "The staking contract did not return any standard packages."}
          </DataUnavailable>
        ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {availablePackages.map((pkg) => {
            const amount = Number(pkg.minAmount);
            const dailyRate = pkg.dailyRateBps / 100;
            const color = ["blue", "purple", "gold", "green"][pkg.id % 4];
            const c = colorMap[color];
            const label = pkg.isDAO ? "DAO Package" : `Package ${pkg.id + 1}`;
            const capAmount = amount * pkg.capMultiplier;
            return (
              <div
                key={pkg.id}
                className={`relative overflow-hidden rounded-xl border ${c.border} bg-[#111] p-5 flex flex-col transition-all hover:-translate-y-1 hover:shadow-xl`}
              >
                <div className={`pointer-events-none absolute bottom-0 right-0 h-32 w-32 rounded-full ${c.glow} blur-3xl`} />

                {/* Label */}
                <span className={`inline-flex w-fit items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${c.badge}`}>
                  {label}
                </span>
                {!pkg.active && <GoldBadge>Inactive</GoldBadge>}

                {/* Amount */}
                <div className="mt-4">
                  <p className="text-[11px] text-[#737373] uppercase tracking-wider">Package Amount</p>
                  <p className="text-[28px] font-bold text-white">${amount.toLocaleString()}</p>
                </div>

                {/* Rate */}
                <div className="mt-3 rounded-lg border border-[#222] bg-[#0A0A0A] p-3">
                  <div className="flex justify-between">
                    <span className="text-[11px] text-[#737373]">Daily Rate</span>
                    <span className={`text-[13px] font-bold ${c.rate}`}>{dailyRate.toFixed(2)}%</span>
                  </div>
                  <div className="mt-2 flex justify-between">
                    <span className="text-[11px] text-[#737373]">12h Split</span>
                    <span className="text-[12px] text-[#A3A3A3]">{(dailyRate / 2).toFixed(2)}% + {(dailyRate / 2).toFixed(2)}%</span>
                  </div>
                  <div className="mt-2 flex justify-between">
                    <span className="text-[11px] text-[#737373]">Cap</span>
                    <span className={`text-[12px] font-semibold ${c.rate}`}>{pkg.capMultiplier}X → ${capAmount.toLocaleString()}</span>
                  </div>
                </div>

                <ul className="mt-4 space-y-2 flex-1">
                  {[
                    "12-hour ROI accrual periods",
                    `${pkg.capMultiplier}X position cap`,
                    "5% direct referral payout when a referrer is registered",
                  ].map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <CheckCircle size={13} className={`mt-0.5 shrink-0 ${c.rate}`} />
                      <span className="text-[11px] text-[#A3A3A3]">{f}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleOpenStake(pkg)}
                  disabled={!pkg.active}
                  className={`mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r ${c.btn} py-2.5 text-[13px] font-semibold text-white transition-all hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50`}
                >
                  Stake Now <ArrowUpRight size={14} />
                </button>
              </div>
            );
          })}
        </div>
        )}
      </div>

      {/* DAO Package */}
      <SectionCard title="DAO Package" subtitle="DAO package terms read from the staking contract">
        {!daoPackage ? (
          <DataUnavailable>
            {isLoading
              ? "Loading DAO package configuration from the staking contract…"
              : "The staking contract did not return a DAO package."}
          </DataUnavailable>
        ) : (
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
                  <p className="text-[20px] font-bold text-white">${Number(daoPackage.minAmount).toLocaleString()} DAO Package</p>
                  <GoldBadge>Members: {daoMemberSummary}</GoldBadge>
                </div>
              </div>
              <p className="mt-3 text-[12px] text-[#A3A3A3] leading-relaxed">
                DAO stakes require the minimum amount and top-ups in $1,000 multiples. The contract records a 500-day end timestamp and applies the cap multiplier shown here.
              </p>
            </div>

            <div className="space-y-3">
              {[
                { label: "Daily Rate", value: `${(daoPackage.dailyRateBps / 100).toFixed(2)}%`, color: "text-[#FFB51D]" },
                { label: "Capping", value: `${daoPackage.capMultiplier}X`, color: "text-green-400" },
                { label: "Members Filled", value: daoMemberSummary, color: "text-purple-400" },
                { label: "Minimum", value: `$${Number(daoPackage.minAmount).toLocaleString()}`, color: "text-[#FFB51D]" },
              ].map((item) => (
                <div key={item.label} className="flex justify-between rounded-lg border border-[#222] bg-[#0A0A0A] px-3 py-2">
                  <span className="text-[11px] text-[#737373]">{item.label}</span>
                  <span className={`text-[12px] font-bold ${item.color}`}>{item.value}</span>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              {[
                { label: "Membership Limit", value: maxDaoMembers === null ? "Unavailable" : `${maxDaoMembers} members`, color: "text-[#FFB51D]" },
                { label: "Top-up Rule", value: "Multiples of $1,000", color: "text-green-400" },
                { label: "Membership Term", value: "500 days", color: "text-[#FFB51D]" },
                { label: "DAO Pool Schedule", value: "Not exposed on-chain", color: "text-purple-400" },
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
              onClick={() => handleOpenStake(daoPackage)}
              disabled={!daoPackage.active || !daoCapacityAvailable || (!isDAO && daoMemberCount >= maxDaoMembers)}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#FFE28A] to-[#FFB51D] py-3 text-[14px] font-bold text-black hover:brightness-110 active:scale-95 transition-all disabled:cursor-not-allowed disabled:opacity-50"
            >
              Activate DAO Package <ArrowUpRight size={16} />
            </button>
          </div>
        </div>
        )}
      </SectionCard>

      {/* Stake Modal */}
      {modalPkg && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-[#FFB51D]/30 bg-[#121212] p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#222] pb-3">
              <div>
                <h3 className="text-[18px] font-bold text-white">
                  Stake in {modalPkg.isDAO ? "DAO Package" : `Package ${modalPkg.id + 1}`}
                </h3>
                <p className="text-[12px] text-[#A3A3A3]">USDT Balance: ${parseFloat(usdtBalance || "0").toFixed(2)}</p>
              </div>
              <button
                onClick={() => setModalPkg(null)}
                className="rounded-lg p-1.5 text-[#737373] hover:bg-white/10 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <label className="text-[12px] text-[#A3A3A3] mb-1.5 block">Stake Amount (USDT)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[14px] text-[#737373]">$</span>
                  <input
                    type="number"
                    value={amountInput}
                    onChange={(e) => setAmountInput(e.target.value)}
                    min={modalPkg.minAmount}
                    placeholder="0.00"
                    className="h-11 w-full rounded-lg border border-[#333] bg-[#0A0A0A] pl-7 pr-16 text-[15px] font-bold text-white outline-none focus:border-[#FFB51D]"
                  />
                  <button
                    onClick={() => setAmountInput(usdtBalance)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded bg-[#FFB51D]/10 px-2 py-1 text-[11px] font-bold text-[#FFB51D] hover:bg-[#FFB51D]/20"
                  >
                    MAX
                  </button>
                </div>
                <p className="mt-1 text-[11px] text-[#737373]">
                  Minimum: ${modalPkg.minAmount} USDT {modalPkg.isDAO && "· Multiples of $1,000"}
                </p>
              </div>

              {errorMsg && (
                <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-2.5 text-[12px] text-red-400">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalPkg(null)}
                  className="flex-1 rounded-xl border border-[#333] py-2.5 text-sm font-semibold text-[#A3A3A3] hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleStakeSubmit}
                  disabled={isTransacting}
                  className="flex-1 rounded-xl bg-gradient-to-r from-[#FFE28A] to-[#FFB51D] py-2.5 text-sm font-bold text-black shadow hover:brightness-110 active:scale-95 disabled:opacity-50"
                >
                  {isTransacting ? "Confirming..." : "Approve & Stake"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
