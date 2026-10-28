import { useState } from "react";
import { Shield, Zap, Users, TrendingUp, Plus, CheckCircle, Clock, Info, Sparkles, X, AlertCircle } from "lucide-react";
import StatCard from "../components/StatCard";
import SectionCard from "../components/SectionCard";
import GoldBadge from "../components/GoldBadge";
import DataUnavailable from "../components/DataUnavailable";
import { useWeb3 } from "../../context/Web3Context";

export default function Staking() {
  const {
    totalStaked,
    userStakes,
    totalPendingROI,
    usdtBalance,
    packages,
    stake,
    claimROI,
    isTransacting,
  } = useWeb3();

  const [selectedPkg, setSelectedPkg] = useState(null);
  const [stakeAmount, setStakeAmount] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [inputError, setInputError] = useState("");

  const activeStakes = userStakes.filter((s) => s.active);
  const totalEarnedClaimed = userStakes.reduce(
    (acc, s) => acc + (parseFloat(s.totalClaimed) || 0),
    0
  );

  const openStakeModal = (pkg) => {
    setSelectedPkg(pkg);
    setStakeAmount(pkg.minAmount);
    setInputError("");
    setModalOpen(true);
  };

  const handleConfirmStake = async () => {
    if (!selectedPkg) return;
    const num = parseFloat(stakeAmount);
    const min = parseFloat(selectedPkg.minAmount);

    if (isNaN(num) || num < min) {
      setInputError(`Minimum investment for this package is $${min}`);
      return;
    }

    if (selectedPkg.isDAO && num % 1000 !== 0) {
      setInputError("DAO top-up must be a multiple of $1,000");
      return;
    }

    if (num > parseFloat(usdtBalance || "0")) {
      setInputError(`Insufficient USDT balance ($${parseFloat(usdtBalance).toFixed(2)})`);
      return;
    }

    setInputError("");
    const res = await stake(selectedPkg.id, num);
    if (res.success) {
      setModalOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          icon={Shield}
          label="Total Staked"
          value={`$${parseFloat(totalStaked || "0").toLocaleString()}`}
          sub={`${activeStakes.length} active stake(s)`}
          color="gold"
        />
        <StatCard
          icon={TrendingUp}
          label="Claimed ROI"
          value={`$${totalEarnedClaimed.toFixed(2)}`}
          sub="Credited to wallet"
          color="blue"
        />
        <StatCard
          icon={Sparkles}
          label="Pending ROI"
          value={`$${parseFloat(totalPendingROI || "0").toFixed(4)}`}
          sub="Ready to mint HANA"
          color="green"
        />
        <StatCard
          icon={Clock}
          label="USDT Balance"
          value={`$${parseFloat(usdtBalance || "0").toFixed(2)}`}
          sub="Available to stake"
          color="purple"
        />
      </div>

      {/* New Stake Packages */}
      <SectionCard title="New Staking Position" subtitle="Choose a package to stake USDT into the Hana Protocol">
        {packages.length === 0 ? (
          <DataUnavailable>
            Staking package details are unavailable. Connect to the configured network and retry the on-chain read.
          </DataUnavailable>
        ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {packages.map((pkg) => {
            return (
              <button
                key={pkg.id}
                onClick={() => openStakeModal(pkg)}
                disabled={!pkg.active}
                className={`relative rounded-xl border p-4 text-left transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 ${
                  pkg.popular
                    ? "border-green-500/50 bg-[#141d14] hover:border-green-400"
                    : pkg.isDAO
                    ? "border-[#FFB51D]/50 bg-[#1c180e] hover:border-[#FFB51D]"
                    : "border-white/15 bg-[#111] hover:border-white/40"
                }`}
              >
                {pkg.popular && (
                  <div className="absolute right-0 top-0 rounded-bl-xl rounded-tr-xl bg-gradient-to-r from-[#FFE28A] to-[#FFB51D] px-2 py-0.5">
                    <span className="text-[9px] font-bold text-black">BEST</span>
                  </div>
                )}
                {pkg.isDAO && (
                  <div className="absolute right-0 top-0 rounded-bl-xl rounded-tr-xl bg-[#FFB51D] px-2 py-0.5">
                    <span className="text-[9px] font-bold text-black">DAO</span>
                  </div>
                )}
                <p className="text-[17px] font-bold text-white">${Number(pkg.minAmount).toLocaleString()}</p>
                <p className="mt-1 text-[10px] text-[#A3A3A3]">{pkg.isDAO ? "DAO Package" : `Package ${pkg.id + 1}`}</p>
                <p className="mt-1 text-[11px] text-[#FFB51D]">{pkg.dailyRate || `${(pkg.dailyRateBps / 100).toFixed(2)}%/day`}</p>
                <p className="mt-0.5 text-[11px] text-[#737373]">Cap: {pkg.cap || `${pkg.capMultiplier}X`}</p>
                <div className="mt-3 flex items-center justify-center gap-1 rounded-md border border-[#222] bg-[#0A0A0A] py-1.5 hover:border-[#FFB51D]/50">
                  <Plus size={12} className="text-[#A3A3A3]" />
                  <span className="text-[11px] font-semibold text-[#A3A3A3]">{pkg.active ? "Stake" : "Inactive"}</span>
                </div>
              </button>
            );
          })}
        </div>
        )}
      </SectionCard>

      {/* Active Stakes List */}
      <SectionCard
        title="Your Staking Positions"
        subtitle={
          activeStakes.length > 0
            ? `${activeStakes.length} position(s) generating daily returns`
            : "No active stakes found on-chain"
        }
      >
        {userStakes.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#333] p-8 text-center">
            <Shield size={36} className="mx-auto text-[#FFB51D]/60" />
            <p className="mt-3 text-[15px] font-semibold text-white">No Stakes Yet</p>
            <p className="mt-1 text-[13px] text-[#737373]">
              Choose an active package above to create an on-chain staking position.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {userStakes.map((st) => {
              const capNum = parseFloat(st.cap) || 1;
              const claimedNum = parseFloat(st.totalClaimed) || 0;
              const usedPct = Math.min(100, Math.round((claimedNum / capNum) * 100));
              const pendingNum = parseFloat(st.pendingROI || "0");

              return (
                <div
                  key={st.index}
                  className="rounded-xl border border-[#FFB51D]/20 bg-[#FFB51D]/5 p-4 sm:p-5 transition-all"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#FFE28A] to-[#FFB51D]">
                        <Shield size={18} className="text-black" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-[15px] font-bold text-white">
                            ${parseFloat(st.amount).toLocaleString()} Stake
                          </p>
                          <GoldBadge>Position #{st.index + 1}</GoldBadge>
                        </div>
                        <p className="text-[12px] text-[#A3A3A3]">
                          Started: {st.startTime ? new Date(st.startTime * 1000).toLocaleDateString() : "Active"} · Cap: ${st.cap}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <GoldBadge>{st.active ? "● Active" : "Completed"}</GoldBadge>
                      {pendingNum > 0 && (
                        <button
                          onClick={() => claimROI(st.index)}
                          disabled={isTransacting}
                          className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-[#FFE28A] to-[#FFB51D] px-3 py-1.5 text-xs font-bold text-black shadow hover:brightness-110 active:scale-95 disabled:opacity-50"
                        >
                          <Sparkles size={13} />
                          Claim ${pendingNum.toFixed(4)}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="rounded-lg border border-[#222] bg-[#0A0A0A] p-3 text-center">
                      <p className="text-[10px] text-[#737373]">Invested</p>
                      <p className="mt-1 text-[14px] font-bold text-white">${parseFloat(st.amount).toLocaleString()}</p>
                    </div>
                    <div className="rounded-lg border border-[#222] bg-[#0A0A0A] p-3 text-center">
                      <p className="text-[10px] text-[#737373]">Total Claimed</p>
                      <p className="mt-1 text-[14px] font-bold text-green-400">${parseFloat(st.totalClaimed).toFixed(2)}</p>
                    </div>
                    <div className="rounded-lg border border-[#222] bg-[#0A0A0A] p-3 text-center">
                      <p className="text-[10px] text-[#737373]">Income Cap</p>
                      <p className="mt-1 text-[14px] font-bold text-[#FFB51D]">${parseFloat(st.cap).toFixed(2)}</p>
                    </div>
                    <div className="rounded-lg border border-[#222] bg-[#0A0A0A] p-3 text-center">
                      <p className="text-[10px] text-[#737373]">Pending ROI</p>
                      <p className="mt-1 text-[14px] font-bold text-[#FFB51D]">${pendingNum.toFixed(4)}</p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="mb-1 flex justify-between">
                      <span className="text-[11px] text-[#A3A3A3]">Cap Progress</span>
                      <span className="text-[11px] font-semibold text-[#FFB51D]">
                        ${parseFloat(st.totalClaimed).toFixed(2)} / ${parseFloat(st.cap).toFixed(2)} ({usedPct}%)
                      </span>
                    </div>
                    <div className="h-2.5 w-full rounded-full bg-[#222] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#FFE28A] to-[#FFB51D]"
                        style={{ width: `${usedPct}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>

      <SectionCard title="On-Chain Staking Mechanics" subtitle="Behavior implemented in the staking contract">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <p className="rounded-lg border border-[#222] bg-[#0A0A0A] p-3 text-[12px] text-[#A3A3A3]">
            ROI is calculated in completed 12-hour periods and minted as HANA when claimed.
          </p>
          <p className="rounded-lg border border-[#222] bg-[#0A0A0A] p-3 text-[12px] text-[#A3A3A3]">
            Each stake stores its own cap and claim total. DAO stake amounts must be multiples of $1,000.
          </p>
          <p className="rounded-lg border border-[#222] bg-[#0A0A0A] p-3 text-[12px] text-[#A3A3A3]">
            The contract has no stake-specific principal unlock or compounding function.
          </p>
          <p className="rounded-lg border border-[#222] bg-[#0A0A0A] p-3 text-[12px] text-[#A3A3A3]">
            Sub-ID and reinvest-wallet rules are not implemented in the current staking contract.
          </p>
        </div>
      </SectionCard>

      {/* Stake Modal */}
      {modalOpen && selectedPkg && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-[#FFB51D]/30 bg-[#121212] p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#222] pb-3">
              <div>
                <h3 className="text-[18px] font-bold text-white">
                  Stake in {selectedPkg.isDAO ? "DAO Package" : `Package ${selectedPkg.id + 1}`}
                </h3>
                <p className="text-[12px] text-[#A3A3A3]">Daily Rate: {selectedPkg.dailyRate || `${(selectedPkg.dailyRateBps / 100).toFixed(2)}%`} · Cap: {selectedPkg.cap || `${selectedPkg.capMultiplier}X`}</p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-1.5 text-[#737373] hover:bg-white/10 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <div className="flex justify-between text-[12px] text-[#A3A3A3] mb-1.5">
                  <span>Stake Amount (USDT)</span>
                  <span>Balance: <strong className="text-white">${parseFloat(usdtBalance || "0").toFixed(2)}</strong></span>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[14px] text-[#737373]">$</span>
                  <input
                    type="number"
                    value={stakeAmount}
                    onChange={(e) => setStakeAmount(e.target.value)}
                    min={selectedPkg.minAmount}
                    step="1"
                    placeholder="0.00"
                    className="h-11 w-full rounded-lg border border-[#333] bg-[#0A0A0A] pl-7 pr-16 text-[15px] font-bold text-white outline-none focus:border-[#FFB51D]"
                  />
                  <button
                    onClick={() => setStakeAmount(usdtBalance)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded bg-[#FFB51D]/10 px-2 py-1 text-[11px] font-bold text-[#FFB51D] hover:bg-[#FFB51D]/20"
                  >
                    MAX
                  </button>
                </div>
                <p className="mt-1 text-[11px] text-[#737373]">
                  Minimum: ${selectedPkg.minAmount} USDT {selectedPkg.isDAO && "· Multiples of $1,000"}
                </p>
              </div>

              {inputError && (
                <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-2.5 text-[12px] text-red-400">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{inputError}</span>
                </div>
              )}

              <div className="rounded-xl border border-[#222] bg-[#0A0A0A] p-3 text-[12px] space-y-1.5">
                <div className="flex justify-between text-[#A3A3A3]">
                  <span>Distribution</span>
                  <span className="text-white">50% Liquidity · 25% Buyback/Burn · 20% Treasury · 5% Direct</span>
                </div>
                <div className="flex justify-between text-[#A3A3A3]">
                  <span>Cycle</span>
                  <span className="text-[#FFB51D]">Every 12 Hours</span>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 rounded-xl border border-[#333] py-2.5 text-sm font-semibold text-[#A3A3A3] hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmStake}
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
