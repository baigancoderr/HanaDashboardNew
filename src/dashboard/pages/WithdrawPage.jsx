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
  } = useHana();

  const [usdtAmount, setUsdtAmount] = useState('');
  const [hanaAmount, setHanaAmount] = useState('');
  const [modalMode, setModalMode] = useState(null);
  const formRef = useRef(null);

  const parsedUsdt = Math.max(0, Number(usdtAmount) || 0);
  const adminFee = parsedUsdt * 0.025;
  const daoFee = parsedUsdt * 0.025;
  const netReceive = Math.max(0, parsedUsdt - adminFee - daoFee);
  const parsedHana = Math.max(0, Number(hanaAmount) || 0);

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
          label="Fee Tier"
          value="5.00%"
          subtext="Standard Fee"
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
        <SectionCard
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
                Withdrawal Amount (USDT)
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

            {/* Fee Breakdown Box */}
            <div className="grid grid-cols-1 items-center gap-3 rounded-2xl border border-[#0755E8]/25 bg-white/95 p-4 sm:grid-cols-2">
              <div className="space-y-1 text-xs">
                <p className="font-bold text-[#032B91]">Fee Breakdown</p>
                <div className="flex justify-between">
                  <span className="text-[#0645C5]">Requested Amount</span>
                  <span className="font-bold text-[#061B50] tabular-nums">${parsedUsdt.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#0645C5]">Admin Fee (2.50%)</span>
                  <span className="font-bold text-red-600 tabular-nums">- ${adminFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#0645C5]">DAO Pool (2.50%)</span>
                  <span className="font-bold text-red-600 tabular-nums">- ${daoFee.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 sm:border-l sm:pl-4">
                <div>
                  <p className="text-xs font-bold text-[#032B91]">Net You Receive</p>
                  <p className="font-display text-xl font-extrabold text-emerald-700 tabular-nums">
                    ${netReceive.toFixed(2)} USDT
                  </p>
                </div>
                <CheckCircle2 className="h-6 w-6 shrink-0 text-emerald-600" />
              </div>
            </div>

            <GoldButton
              onClick={() => setModalMode('usdt')}
              disabled={parsedUsdt <= 0 || parsedUsdt > withdrawableUsdt || parsedUsdt > 10000}
              className="w-full py-3"
            >
              <Send className="h-4 w-4" />
              Confirm Withdrawal
            </GoldButton>
          </div>
        </SectionCard>

        {/* Right: Withdraw HANA + Important Information */}
        <div className="space-y-5 lg:col-span-6">
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
                    {withdrawableHana.toFixed(4)} HANA
                  </p>
                  <p className="text-[11px] font-semibold text-[#0645C5]/80">From your staking account</p>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-[#032B91]">HANA Amount</label>
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

              <GoldButton
                onClick={() => setModalMode('hana')}
                disabled={parsedHana <= 0 || parsedHana > withdrawableHana}
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
            </ul>
          </SectionCard>
        </div>
      </div>

      {/* Withdrawal History */}
      <SectionCard title="Recent Withdrawal History" icon={<Clock className="h-4 w-4" />}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-left text-xs">
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
              {withdrawalHistory.map((tx) => (
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
            ? `Withdraw $${parsedUsdt.toFixed(2)} USDT (Net $${netReceive.toFixed(2)} USDT after 5% protocol fee).`
            : `Withdraw ${parsedHana.toFixed(4)} HANA to your connected wallet.`
        }
        confirmLabel={modalMode === 'usdt' ? `Send $${netReceive.toFixed(2)} USDT` : `Send ${parsedHana.toFixed(2)} HANA`}
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
