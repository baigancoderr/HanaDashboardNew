import { useState, useMemo } from "react";
import { Wallet, Clock, AlertTriangle, CheckCircle, ArrowDownRight, AlertCircle } from "lucide-react";
import StatCard from "../components/StatCard";
import SectionCard from "../components/SectionCard";
import GoldBadge from "../components/GoldBadge";
import DataUnavailable from "../components/DataUnavailable";
import { useWeb3 } from "../../context/Web3Context";

export default function Withdrawals() {
  const {
    totalWithdrawn,
    lastWithdrawalTime,
    firstStakeTime,
    withdraw,
    isTransacting,
    address,
    withdrawalConfig,
  } = useWeb3();

  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const nowSeconds = Math.floor(Date.now() / 1000);
  const coolingRemainingSecs = Math.max(
    0,
    (lastWithdrawalTime && withdrawalConfig
      ? lastWithdrawalTime + withdrawalConfig.coolingPeriod
      : 0) - nowSeconds
  );

  const coolingHours = Math.floor(coolingRemainingSecs / 3600);
  const coolingMins = Math.floor((coolingRemainingSecs % 3600) / 60);

  const isReducedFee = useMemo(() => {
    if (!firstStakeTime || firstStakeTime === 0) return false;
    return nowSeconds >= firstStakeTime + 45 * 86400;
  }, [firstStakeTime, nowSeconds]);

  const numAmount = parseFloat(withdrawAmount) || 0;
  const standardFeeBps = withdrawalConfig
    ? withdrawalConfig.adminFeeBps +
      withdrawalConfig.swapFeeBps +
      withdrawalConfig.ecosystemFeeBps
    : 0;
  const feePercent = withdrawalConfig
    ? (isReducedFee ? 1000 : standardFeeBps) / 100
    : 0;
  const netAmount = Math.max(0, numAmount * (1 - feePercent / 100));
  const maxWithdrawal = Number(withdrawalConfig?.maxWithdrawalPerDay || 0);
  const standardFeePercent = standardFeeBps / 100;
  const adminFeePercent = (withdrawalConfig?.adminFeeBps || 0) / 100;
  const daoFeePercent = Math.max(0, standardFeePercent - adminFeePercent);

  const handleWithdrawSubmit = async (e) => {
    e.preventDefault();
    if (numAmount <= 0) {
      setErrorMsg("Please enter an amount greater than 0");
      return;
    }
    if (!withdrawalConfig) {
      setErrorMsg("Withdrawal rules could not be loaded from the staking contract.");
      return;
    }
    if (numAmount > maxWithdrawal) {
      setErrorMsg(`Maximum withdrawal per request is ${maxWithdrawal} USDT`);
      return;
    }
    if (coolingRemainingSecs > 0) {
      setErrorMsg(`Cooling period active. Please wait ${coolingHours}h ${coolingMins}m before withdrawing.`);
      return;
    }

    setErrorMsg("");
    const res = await withdraw(numAmount);
    if (res.success) {
      setWithdrawAmount("");
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          icon={ArrowDownRight}
          label="Total Withdrawn"
          value={`$${parseFloat(totalWithdrawn || "0").toLocaleString()}`}
          sub="Lifetime on-chain"
          color="blue"
        />
        <StatCard
          icon={Clock}
          label="Cooling Period"
          value={
            !withdrawalConfig
              ? "Unavailable"
              : coolingRemainingSecs > 0
                ? `${coolingHours}h ${coolingMins}m`
                : "Ready"
          }
          sub={
            !withdrawalConfig
              ? "Contract settings unavailable"
              : coolingRemainingSecs > 0
                ? "Contract cooling period active"
                : "No lock active"
          }
          color={coolingRemainingSecs > 0 ? "gold" : "green"}
        />
        <StatCard
          icon={CheckCircle}
          label="Fee Tier"
          value={withdrawalConfig ? `${feePercent.toFixed(2)}% Fee` : "Unavailable"}
          sub={isReducedFee ? "Reduced fee after 45 days" : "Current contract fee"}
          color={isReducedFee ? "green" : "purple"}
        />
        <StatCard
          icon={Wallet}
          label="Max Per Request"
          value={withdrawalConfig ? `$${maxWithdrawal.toLocaleString()}` : "Unavailable"}
          sub="Max per request"
          color="gold"
        />
      </div>

      {/* Withdrawal Form */}
      <SectionCard
        title="Request Withdrawal"
        subtitle={
          withdrawalConfig
            ? `Max $${maxWithdrawal.toLocaleString()} per request · ${withdrawalConfig.coolingPeriod / 3600}h cooling period`
            : "Withdrawal rules are loading or unavailable"
        }
      >
        {!withdrawalConfig && (
          <div className="mb-4">
            <DataUnavailable>
              Withdrawal controls remain disabled until the contract supplies its current limits and fee settings.
            </DataUnavailable>
          </div>
        )}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <form onSubmit={handleWithdrawSubmit} className="space-y-4">
            {/* Amount Input */}
            <div>
              <label className="mb-1.5 block text-[12px] font-medium text-[#A3A3A3]">
                Withdrawal Amount (USDT)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#737373] text-[13px]">$</span>
                <input
                  type="number"
                  placeholder="0.00"
                  max={maxWithdrawal || undefined}
                  step="0.01"
                  value={withdrawAmount}
                  onChange={(e) => {
                    setWithdrawAmount(e.target.value);
                    setErrorMsg("");
                  }}
                  className="h-[46px] w-full rounded-lg border border-[#222] bg-[#111] pl-7 pr-16 text-[14px] text-white placeholder-[#737373] outline-none focus:border-[#FFB51D]/50 transition-colors"
                />
                <button
                  type="button"
                  disabled={!withdrawalConfig}
                  onClick={() => setWithdrawAmount(String(maxWithdrawal))}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md bg-[#FFB51D]/10 px-2 py-1 text-[11px] font-bold text-[#FFB51D] hover:bg-[#FFB51D]/20 transition-colors"
                >
                  MAX
                </button>
              </div>
              <p className="mt-1 text-[11px] text-[#737373]">
                Max per request: <span className="text-white font-semibold">
                  {withdrawalConfig ? `$${maxWithdrawal.toLocaleString()} USDT` : "Unavailable"}
                </span>
              </p>
            </div>

            {/* Wallet Address */}
            <div>
              <label className="mb-1.5 block text-[12px] font-medium text-[#A3A3A3]">
                Destination Wallet (Connected Wallet)
              </label>
              <input
                type="text"
                readOnly
                value={address || "Please connect your wallet"}
                className="h-[46px] w-full rounded-lg border border-[#222] bg-[#0A0A0A] px-4 text-[13px] text-[#A3A3A3] outline-none font-mono"
              />
            </div>

            {errorMsg && (
              <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-2.5 text-[12px] text-red-400">
                <AlertCircle size={14} className="shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Fee Estimator */}
            {withdrawalConfig ? (
              <div className="rounded-lg border border-[#222] bg-[#0A0A0A] p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <p className="text-[12px] font-semibold text-white">Fee Breakdown</p>
                  <GoldBadge>
                    {`${feePercent.toFixed(2)}% ${isReducedFee ? "Reduced" : "Standard"} Fee`}
                  </GoldBadge>
                </div>
                <div className="flex justify-between">
                  <span className="text-[12px] text-[#A3A3A3]">Requested Amount</span>
                  <span className="text-[12px] text-white font-medium">${numAmount.toFixed(2)}</span>
                </div>
                {isReducedFee ? (
                  <>
                    <div className="flex justify-between">
                      <span className="text-[12px] text-[#A3A3A3]">Treasury Fee (5%)</span>
                      <span className="text-[12px] text-red-400">- ${(numAmount * 0.05).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[12px] text-[#A3A3A3]">Reinvest Fee (5%)</span>
                      <span className="text-[12px] text-[#FFB51D]">- ${(numAmount * 0.05).toFixed(2)}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between">
                      <span className="text-[12px] text-[#A3A3A3]">Treasury/Admin ({adminFeePercent.toFixed(2)}%)</span>
                      <span className="text-[12px] text-red-400">- ${(numAmount * adminFeePercent / 100).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[12px] text-[#A3A3A3]">DAO Pool (remaining fee: {daoFeePercent.toFixed(2)}%)</span>
                      <span className="text-[12px] text-[#FFB51D]">- ${(numAmount * daoFeePercent / 100).toFixed(2)}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between border-t border-[#222] pt-2">
                  <span className="text-[13px] font-semibold text-white">Net You Receive</span>
                  <span className="text-[15px] font-bold text-green-400">${netAmount.toFixed(2)} USDT</span>
                </div>
              </div>
            ) : (
              <DataUnavailable>Fee and net amount estimates are hidden until contract settings load.</DataUnavailable>
            )}

            <button
              type="submit"
              disabled={!withdrawalConfig || isTransacting || coolingRemainingSecs > 0 || numAmount <= 0}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#FFE28A] to-[#FFB51D] py-3 text-[14px] font-bold text-black hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
            >
              <Wallet size={16} />
              {isTransacting
                ? "Processing Withdrawal..."
                : coolingRemainingSecs > 0
                ? `Cooling Active (${coolingHours}h ${coolingMins}m left)`
                : "Confirm Withdrawal"}
            </button>
          </form>

          {/* Rules Panel */}
          <div className="space-y-3">
            <p className="text-[12px] font-semibold text-[#A3A3A3] uppercase tracking-wider">Withdrawal Rules</p>

            <div className="rounded-lg border border-[#222] bg-[#0A0A0A] p-3 flex gap-3 items-start">
              <div className="h-7 w-7 rounded-lg bg-[#FFB51D]/10 text-[#FFB51D] flex items-center justify-center shrink-0">
                <Clock size={16} />
              </div>
              <div>
                <p className="text-[13px] font-semibold text-white">
                  {withdrawalConfig ? `${standardFeePercent.toFixed(2)}% Standard Fee` : "Fee rules unavailable"}
                </p>
                <p className="text-[12px] text-[#A3A3A3]">
                  The contract sends its admin portion to treasury and the remaining standard fee to the DAO pool.
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-[#222] bg-[#0A0A0A] p-3 flex gap-3 items-start">
              <div className="h-7 w-7 rounded-lg bg-green-500/10 text-green-400 flex items-center justify-center shrink-0">
                <CheckCircle size={16} />
              </div>
              <div>
                <p className="text-[13px] font-semibold text-white">
                  10% Reduced Fee (After 45 Days)
                </p>
                <p className="text-[12px] text-[#A3A3A3]">
                  {isReducedFee
                    ? "Your account has qualified for the 10% fee reduction!"
                    : `After 45 days, your fee is reduced by ${Math.max(0, standardFeePercent - 10).toFixed(2)} percentage points.`}
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-[#222] bg-[#0A0A0A] p-3 flex gap-3 items-start">
              <div className="h-7 w-7 rounded-lg bg-red-500/10 text-red-400 flex items-center justify-center shrink-0">
                <AlertTriangle size={16} />
              </div>
              <div>
                <p className="text-[13px] font-semibold text-white">
                  {withdrawalConfig
                    ? `${withdrawalConfig.coolingPeriod / 3600}-Hour Cooling Period`
                    : "Cooling Period Unavailable"}
                </p>
                <p className="text-[12px] text-[#A3A3A3]">
                  {withdrawalConfig
                    ? `After each withdrawal, wait ${withdrawalConfig.coolingPeriod / 3600} hours before the next one.`
                    : "Cooling period is unavailable until contract settings load."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
