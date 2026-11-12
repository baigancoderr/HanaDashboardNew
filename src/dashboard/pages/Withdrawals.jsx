import { useState, useMemo } from "react";
import {
  Wallet,
  Clock,
  AlertTriangle,
  CheckCircle,
  ArrowDownRight,
  AlertCircle,
  Coins,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { formatEther } from "ethers";
import StatCard from "../components/StatCard";
import SectionCard from "../components/SectionCard";
import GoldBadge from "../components/GoldBadge";
import DataUnavailable from "../components/DataUnavailable";
import { useWeb3 } from "../../context/Web3Context";
import { useUserData, useWithdrawHanaTokens } from "../../contracts/hooks";
import { getExplorerTxUrl } from "../../contracts/config";

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
  const [hanaWithdrawAmount, setHanaWithdrawAmount] = useState("");
  const [hanaWithdrawError, setHanaWithdrawError] = useState("");
  const [hanaWithdrawTx, setHanaWithdrawTx] = useState("");
  const { user, isLoading: isHanaBalanceLoading, refetch: refetchUser } =
    useUserData(address);
  const {
    withdraw: withdrawHana,
    isPending: isHanaWithdrawPending,
  } = useWithdrawHanaTokens();
  const withdrawableHana = user?.hanaBalance ?? 0n;
  const withdrawableHanaFormatted = user?.hanaBalanceFormatted || "0";
  const hanaAmountNumber = Number(hanaWithdrawAmount) || 0;
  const displayedHanaBalance = Number(withdrawableHanaFormatted).toLocaleString(
    "en-US",
    { maximumFractionDigits: 4 }
  );

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

  const handleHanaWithdrawSubmit = async (e) => {
    e.preventDefault();
    setHanaWithdrawError("");
    setHanaWithdrawTx("");

    if (!address) {
      setHanaWithdrawError("Connect your wallet to withdraw HANA.");
      return;
    }
    if (!hanaWithdrawAmount.trim() || hanaAmountNumber <= 0) {
      setHanaWithdrawError("Enter a HANA amount greater than zero.");
      return;
    }

    try {
      const result = await withdrawHana(address, hanaWithdrawAmount);
      if (result.success) {
        setHanaWithdrawAmount("");
        setHanaWithdrawTx(result.hash);
        await refetchUser();
      }
    } catch (error) {
      setHanaWithdrawError(error.message || "HANA withdrawal failed.");
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
              disabled={!withdrawalConfig || isTransacting || isHanaWithdrawPending || coolingRemainingSecs > 0 || numAmount <= 0}
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

      <SectionCard
        title="Withdraw HANA"
        subtitle="Withdraw HANA credited to your staking-contract balance."
        className="border-[#FFB51D]/20 bg-gradient-to-br from-[#17140D] via-[#111] to-[#0B0B0B]"
      >
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <form onSubmit={handleHanaWithdrawSubmit} className="space-y-4">
            <div className="rounded-xl border border-[#FFB51D]/20 bg-[#FFB51D]/[0.05] p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wider text-[#A3A3A3]">
                    Withdrawable HANA
                  </p>
                  <p className="mt-1 text-2xl font-bold text-[#FFCF61]">
                    {!address
                      ? "Connect wallet"
                      : isHanaBalanceLoading
                        ? "Loading..."
                        : displayedHanaBalance}
                    {address && (
                      <span className="ml-2 text-sm font-semibold text-[#A3A3A3]">
                        HANA
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#FFE28A] to-[#FFB51D] text-black">
                  <Coins size={20} />
                </div>
              </div>
              <p className="mt-2 break-all text-[10px] text-[#737373]">
                Balance from the staking contract&apos;s users(address) record
              </p>
            </div>

            <div>
              <label
                htmlFor="hana-withdraw-amount"
                className="mb-1.5 block text-[12px] font-medium text-[#A3A3A3]"
              >
                HANA Amount
              </label>
              <div className="relative">
                <input
                  id="hana-withdraw-amount"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="any"
                  placeholder="0.00"
                  value={hanaWithdrawAmount}
                  onChange={(e) => {
                    setHanaWithdrawAmount(e.target.value);
                    setHanaWithdrawError("");
                    setHanaWithdrawTx("");
                  }}
                  disabled={!address || isHanaBalanceLoading || isHanaWithdrawPending || isTransacting}
                  className="h-[46px] w-full rounded-lg border border-[#222] bg-[#111] px-4 pr-20 text-[14px] text-white placeholder-[#737373] outline-none transition-colors focus:border-[#FFB51D]/50 disabled:opacity-50"
                />
                <button
                  type="button"
                  disabled={
                    !address ||
                    isHanaBalanceLoading ||
                    isHanaWithdrawPending ||
                    isTransacting ||
                    withdrawableHana <= 0n
                  }
                  onClick={() => {
                    setHanaWithdrawAmount(formatEther(withdrawableHana));
                    setHanaWithdrawError("");
                    setHanaWithdrawTx("");
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md bg-[#FFB51D]/10 px-2 py-1 text-[11px] font-bold text-[#FFB51D] transition-colors hover:bg-[#FFB51D]/20 disabled:opacity-40"
                >
                  MAX
                </button>
              </div>
              <p className="mt-1 text-[11px] text-[#737373]">
                Maximum available:{" "}
                <span className="font-semibold text-white">
                  {isHanaBalanceLoading
                    ? "Loading..."
                    : address
                      ? `${withdrawableHanaFormatted} HANA`
                      : "Connect wallet"}
                </span>
              </p>
            </div>

            {hanaWithdrawError && (
              <div
                className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-2.5 text-[12px] text-red-400"
                role="alert"
              >
                <AlertCircle size={14} className="shrink-0" />
                <span>{hanaWithdrawError}</span>
              </div>
            )}

            {hanaWithdrawTx && (
              <div
                className="flex items-center justify-between gap-3 rounded-lg border border-green-500/25 bg-green-500/[0.06] p-3 text-[12px] text-green-400"
                role="status"
              >
                <span>HANA withdrawal confirmed.</span>
                <a
                  href={getExplorerTxUrl(hanaWithdrawTx)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex shrink-0 items-center gap-1 font-semibold hover:underline"
                >
                  View transaction <ExternalLink size={12} />
                </a>
              </div>
            )}

            <button
              type="submit"
              disabled={
                !address ||
                isHanaBalanceLoading ||
                isHanaWithdrawPending ||
                isTransacting ||
                hanaAmountNumber <= 0 ||
                withdrawableHana <= 0n
              }
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#FFE28A] to-[#FFB51D] py-3 text-[14px] font-bold text-black transition-all hover:brightness-110 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isHanaWithdrawPending ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Confirming HANA Withdrawal...
                </>
              ) : (
                <>
                  <Coins size={16} />
                  Withdraw HANA
                </>
              )}
            </button>
          </form>

          <div className="rounded-xl border border-white/[0.07] bg-black/20 p-4">
            <p className="text-[12px] font-semibold uppercase tracking-wider text-[#A3A3A3]">
              Before you withdraw
            </p>
            <ul className="mt-3 space-y-3 text-[12px] leading-relaxed text-[#A3A3A3]">
              <li className="flex gap-2">
                <CheckCircle size={15} className="mt-0.5 shrink-0 text-[#FFB51D]" />
                Amount is checked against the live HANA balance in the staking contract.
              </li>
              <li className="flex gap-2">
                <CheckCircle size={15} className="mt-0.5 shrink-0 text-[#FFB51D]" />
                Review the transaction and any contract fees in your wallet before confirming.
              </li>
              <li className="flex gap-2">
                <CheckCircle size={15} className="mt-0.5 shrink-0 text-[#FFB51D]" />
                Withdrawals are sent to the connected wallet on BNB Smart Chain Testnet.
              </li>
            </ul>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
