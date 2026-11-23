import React, { useState, useRef } from 'react';
import {
  ArrowDownLeft,
  Clock,
  ShieldCheck,
  Wallet,
  Copy,
  CheckCircle2,
  Send,
  Coins,
  Info,
} from 'lucide-react';
import { useHana } from '../context/HanaContext';
import { HANA_IMAGES } from '../assets/images';
import {
  ConfirmModal,
  GoldButton,
  HeroBanner,
  SectionCard,
  StatCard,
  StatusBadge,
  TxHashChip,
} from '../components/common/UiPrimitives';
import { HanaCoinBadgeIcon, UsdtBadgeIcon } from '../components/common/Icons3D';
import { calculateWithdrawalFees, isReducedWithdrawalFee } from '../../contracts/withdrawalFees';

function FeeBreakdown({ amount, currency, fees }) {
  const precision = currency === 'USDT' ? 2 : 4;

  return (
    <div className="grid grid-cols-1 gap-3 rounded-2xl border border-[#0755E8]/25 bg-white/95 p-4">
      <div className="space-y-1 text-xs">
        <p className="font-bold text-[#032B91]">Fee Breakdown</p>
        <div className="flex justify-between">
          <span className="text-[#0645C5]">Gross Withdrawal</span>
          <span className="font-bold text-[#061B50] tabular-nums">
            {currency === 'USDT' ? '$' : ''}{amount.toFixed(precision)} {currency}
          </span>
        </div>
        {fees ? (
          fees.feeParts.map((part) => (
            <div className="flex justify-between" key={part.label}>
              <span className="text-[#0645C5]">
                {part.label} ({(part.bps / 100).toFixed(2)}%)
              </span>
              <span className="font-bold text-red-600 tabular-nums">
                - {currency === 'USDT' ? '$' : ''}{part.amount.toFixed(precision)} {currency}
              </span>
            </div>
          ))
        ) : (
          <p className="text-amber-700">On-chain fee configuration is unavailable.</p>
        )}
      </div>

      <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50/70 p-3">
        <div>
          <p className="text-xs font-bold text-[#032B91]">Estimated Net You Receive</p>
          <p className="font-display text-xl font-extrabold text-emerald-700 tabular-nums">
            {fees
              ? `${currency === 'USDT' ? '$' : ''}${fees.net.toFixed(precision)} ${currency}`
              : 'Unavailable'}
          </p>
        </div>
        <CheckCircle2 className="h-6 w-6 shrink-0 text-emerald-600" />
      </div>
    </div>
  );
}

export function WithdrawPage() {
  const {
    totalWithdrawn,
    withdrawableUsdt,
    withdrawableHana,
    walletAddress,
    transactions,
    copyToClipboard,
    withdrawUsdt,
    withdrawHana,
    withdrawalConfig,
    firstStakeTime,
    withdrawalHistoryError,
    refetchWithdrawalHistory,
  } = useHana();

  const [usdtAmount, setUsdtAmount] = useState('');
  const [hanaAmount, setHanaAmount] = useState('');
  const [modalMode, setModalMode] = useState(null);
  const formRef = useRef(null);

  const parsedUsdt = Math.max(0, Number(usdtAmount) || 0);
  const usdtFees = calculateWithdrawalFees(
    parsedUsdt,
    withdrawalConfig,
    isReducedWithdrawalFee(firstStakeTime)
  );
  const parsedHana = Math.max(0, Number(hanaAmount) || 0);
  const hanaFees = calculateWithdrawalFees(parsedHana, withdrawalConfig);

  const withdrawalHistory = transactions.filter(
    (t) => t.type === 'Withdraw USDT' || t.type === 'Withdraw HANA'
  );

  return (
    <div className="space-y-5">
      <HeroBanner
        title="Withdrawals"
        subtitle="Secure. Fast. Transparent. Instant on-chain settlement to your connected wallet."
        ctaLabel="Withdraw Now →"
        onCtaClick={() => formRef.current?.scrollIntoView({ behavior: 'smooth' })}
        imageSrc={HANA_IMAGES.bannerSecurity}
        imageAlt="HANA Secure Withdrawals Vault"
      />

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={<ArrowDownLeft className="h-6 w-6" />}
          label="Total Withdrawn"
          value={`$${totalWithdrawn.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
          subtext="Lifetime on-chain"
        />
        <StatCard
          icon={<Clock className="h-6 w-6" />}
          label="Cooling Period"
          value="Ready"
          subtext="No lock active"
          goldAccent
        />
        <StatCard
          icon={<ShieldCheck className="h-6 w-6" />}
          label="HANA Fee Tier"
          value={hanaFees ? `${(hanaFees.totalFeeBps / 100).toFixed(2)}%` : '—'}
          subtext={
            !usdtFees
              ? 'Fee Config Unavailable'
              : `USDT: ${(usdtFees.totalFeeBps / 100).toFixed(2)}%${isReducedWithdrawalFee(firstStakeTime) ? ' reduced' : ''}`
          }
        />
        <StatCard
          icon={<Wallet className="h-6 w-6" />}
          label="Max Per Request"
          value="$10,000"
          subtext="Per Transaction"
          goldAccent
        />
      </div>

      {/* Main 2-Column Withdrawal Forms */}
      <div ref={formRef} className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* Left: Request Withdrawal (USDT) */}
        {/* <SectionCard
          className="lg:col-span-6"
          title="Request Withdrawal (USDT)"
          subtitle="Withdraw your earned USDT from the staking contract"
          icon={<Wallet className="h-4 w-4" />}
        >
          <div className="space-y-4">
            <div className="flex items-center gap-4 rounded-2xl border border-[#168BFF]/30 bg-gradient-to-r from-[#DCEEFF] via-[#EDF6FF] to-[#FFFDF5] p-4">
              <UsdtBadgeIcon size={46} />
              <div>
                <p className="text-xs font-bold text-[#0645C5]">Available Balance</p>
                <p className="font-display text-2xl font-extrabold text-[#061B50] tabular-nums">
                  ${withdrawableUsdt.toLocaleString('en-US', { minimumFractionDigits: 2 })} USDT
                </p>
                <p className="text-[11px] font-semibold text-[#0645C5]/80">Max per request: $10,000</p>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-[#032B91]">
                Gross Withdrawal Amount (USDT)
              </label>
              <div className="flex items-center gap-2 rounded-xl border border-[#0755E8]/30 bg-white px-3 py-1.5 shadow-inner">
                <span className="font-display text-base font-extrabold text-[#0645C5]">$</span>
                <input
                  type="number"
                  min={0}
                  max={Math.min(10000, withdrawableUsdt)}
                  value={usdtAmount}
                  onChange={(e) => setUsdtAmount(e.target.value)}
                  placeholder="Enter amount..."
                  className="w-full bg-transparent py-1.5 font-display text-sm font-bold text-[#061B50] tabular-nums focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setUsdtAmount(String(Math.min(10000, withdrawableUsdt)))}
                  className="hana-gold-btn rounded-lg px-3 py-1 text-xs font-extrabold cursor-pointer"
                >
                  MAX
                </button>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-[#032B91]">Destination Wallet</label>
              <div className="flex items-center justify-between gap-2 rounded-xl border border-[#0755E8]/25 bg-[#F5F9FF] px-3 py-2.5">
                <span className="truncate font-mono text-xs font-bold text-[#061B50]">{walletAddress}</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(walletAddress, 'Destination wallet copied')}
                  className="text-[#0755E8] hover:text-[#032B91] cursor-pointer"
                  aria-label="Copy destination wallet"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
            </div>

            <FeeBreakdown amount={parsedUsdt} currency="USDT" fees={usdtFees} />

            <GoldButton
              onClick={() => setModalMode('usdt')}
              disabled={!usdtFees || parsedUsdt <= 0 || parsedUsdt > withdrawableUsdt || parsedUsdt > 10000}
              className="w-full py-3"
            >
              <Send className="h-4 w-4" />
              Confirm Withdrawal
            </GoldButton>
          </div>
        </SectionCard> */}

        {/* Right: Withdraw HANA + Important Information */}
        <div className="grid grid-cols-1 gap-5 lg:col-span-12 lg:grid-cols-2 lg:items-start">
          <SectionCard
            title="Withdraw HANA"
            subtitle="Withdraw HANA credited to your staking balance"
            icon={<Coins className="h-4 w-4" />}
          >
            <div className="space-y-4">
              <div className="flex items-center gap-4 rounded-2xl border border-[#FFB800]/45 bg-gradient-to-r from-[#DCEEFF] via-[#EDF6FF] to-[#FFF5D6] p-4">
                <HanaCoinBadgeIcon size={48} />
                <div>
                  <p className="text-xs font-bold text-[#0645C5]">Withdrawable HANA</p>
                  <p className="font-display text-2xl font-extrabold text-[#061B50] tabular-nums">
                    {withdrawableHana.toFixed(4)}
                  </p>
                  <p className="text-[11px] font-semibold text-[#0645C5]/80">From your staking account</p>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-[#032B91]">Gross Withdrawal Amount (HANA)</label>
                <div className="flex items-center gap-2 rounded-xl border border-[#0755E8]/30 bg-white px-3 py-1.5 shadow-inner">
                  <HanaCoinBadgeIcon size={22} />
                  <input
                    type="number"
                    min={0}
                    max={withdrawableHana}
                    value={hanaAmount}
                    onChange={(e) => setHanaAmount(e.target.value)}
                    placeholder="Enter HANA amount..."
                    className="w-full bg-transparent py-1.5 font-display text-sm font-bold text-[#061B50] tabular-nums focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setHanaAmount(String(withdrawableHana))}
                    className="hana-gold-btn rounded-lg px-3 py-1 text-xs font-extrabold cursor-pointer"
                  >
                    MAX
                  </button>
                </div>
              </div>

              <FeeBreakdown amount={parsedHana} currency="HANA" fees={hanaFees} />

              <GoldButton
                onClick={() => setModalMode('hana')}
                disabled={!hanaFees || parsedHana <= 0 || parsedHana > withdrawableHana}
                className="w-full py-3"
              >
                <Coins className="h-4 w-4" />
                Withdraw HANA
              </GoldButton>
            </div>
          </SectionCard>

          <SectionCard title="Important Information" icon={<Info className="h-4 w-4" />}>
            <ul className="space-y-2.5 text-xs font-semibold text-[#032B91] sm:text-sm">
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                <span>Ensure you have sufficient HANA or USDT balance before submitting.</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                <span>Review transaction fee breakdown and destination address carefully.</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                <span>Withdrawals are dispatched directly to your connected BNB Smart Chain wallet.</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                <span>BNB network gas is separate from the protocol fee deducted from your withdrawal.</span>
              </li>
            </ul>
          </SectionCard>
        </div>
      </div>

      {/* Withdrawal History */}
      <SectionCard title="Recent Withdrawal History" icon={<Clock className="h-4 w-4" />}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-left text-xs">
            <thead>
              <tr className="border-b border-[#0755E8]/15 text-[#0645C5]">
                <th className="py-2 pr-3 font-bold">Type</th>
                <th className="py-2 pr-3 font-bold">Amount</th>
                <th className="py-2 pr-3 font-bold">Details</th>
                <th className="py-2 pr-3 font-bold">Date &amp; Time</th>
                <th className="py-2 pr-3 font-bold">Status</th>
                <th className="py-2 font-bold">Tx Hash</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#0755E8]/10">
              {withdrawalHistoryError ? (
                <tr>
                  <td colSpan={6} className="py-5 text-center text-red-600">
                    {withdrawalHistoryError}{' '}
                    <button
                      type="button"
                      onClick={refetchWithdrawalHistory}
                      className="font-bold underline"
                    >
                      Retry
                    </button>
                  </td>
                </tr>
              ) : withdrawalHistory.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-5 text-center text-[#0645C5]">
                    {walletAddress
                      ? 'No HANA withdrawals found for this wallet yet.'
                      : 'Connect your wallet to view withdrawal history.'}
                  </td>
                </tr>
              ) : withdrawalHistory.map((tx) => (
                <tr key={tx.id} className="hover:bg-[#EAF4FF]/60">
                  <td className="py-2.5 pr-3 font-bold text-[#032B91]">{tx.type}</td>
                  <td className="py-2.5 pr-3 font-extrabold text-[#061B50] tabular-nums">{tx.amountLabel}</td>
                  <td className="py-2.5 pr-3 text-[#0645C5]">{tx.details}</td>
                  <td className="py-2.5 pr-3 text-[#032B91]/80 tabular-nums">{tx.date}</td>
                  <td className="py-2.5 pr-3">
                    <StatusBadge status={tx.status} />
                  </td>
                  <td className="py-2.5">
                    <TxHashChip hash={tx.txHash} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <ConfirmModal
        open={modalMode !== null}
        onClose={() => setModalMode(null)}
        title={modalMode === 'usdt' ? 'Confirm USDT Withdrawal' : 'Confirm HANA Withdrawal'}
        description={
          modalMode === 'usdt'
            ? `Withdraw $${parsedUsdt.toFixed(2)} USDT gross (estimated net $${(usdtFees?.net || 0).toFixed(2)} USDT after ${(usdtFees?.totalFeeBps / 100 || 0).toFixed(2)}% fee).`
            : `Withdraw ${parsedHana.toFixed(4)} HANA gross (estimated net ${(hanaFees?.net || 0).toFixed(4)} HANA after ${(hanaFees?.totalFeeBps / 100 || 0).toFixed(2)}% fee).`
        }
        confirmLabel={modalMode === 'usdt'
          ? `Receive est. $${(usdtFees?.net || 0).toFixed(2)} USDT`
          : `Receive est. ${(hanaFees?.net || 0).toFixed(4)} HANA`}
        onConfirm={() => {
          if (modalMode === 'usdt') {
            withdrawUsdt(parsedUsdt);
          } else {
            withdrawHana(parsedHana);
          }
        }}
      />
    </div>
  );
}
