import React, { useState } from 'react';
import { Repeat, Coins, TrendingUp, Lock, Clock, Sparkles } from 'lucide-react';
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

const LOCK_OPTIONS = [
  { term: '30 Days', boost: '+5% APY Boost', mult: 1.125, apy: '12.5%' },
  { term: '90 Days', boost: '+12% APY Boost', mult: 1.25, apy: '25.0%' },
  { term: '180 Days', boost: '+20% APY Boost', mult: 1.45, apy: '45.0%' },
];

export function CompoundingPage() {
  const { withdrawableUsdt, compounds, compoundBalance } = useHana();
  const [selectedTerm, setSelectedTerm] = useState('90 Days');
  const [amountInput, setAmountInput] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);

  const parsedAmount = Math.max(0, Number(amountInput) || 0);
  const activeOption = LOCK_OPTIONS.find((o) => o.term === selectedTerm);
  const projectedReturn = parsedAmount * activeOption.mult;
  const totalCompounded = compounds.reduce((s, c) => s + c.amount, 0);

  return (
    <div className="space-y-5">
      <HeroBanner
        title="Auto"
        highlight="Compounding"
        subtitle="Re-invest your earned USDT balance into boosted compounding vaults for exponential growth"
        ctaLabel="Compound Balance →"
        onCtaClick={() => setConfirmOpen(true)}
        imageSrc={HANA_IMAGES.bannerStaking}
        imageAlt="HANA Compounding Vault"
      />

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={<Coins className="h-6 w-6" />}
          label="Available to Compound"
          value={`$${withdrawableUsdt.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
          goldAccent
        />
        <StatCard
          icon={<Repeat className="h-6 w-6" />}
          label="Total Compounded"
          value={`$${totalCompounded.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
        />
        <StatCard
          icon={<TrendingUp className="h-6 w-6" />}
          label="Selected Boost"
          value={activeOption.apy}
          subtext={activeOption.boost}
          goldAccent
        />
        <StatCard
          icon={<Lock className="h-6 w-6" />}
          label="Active Vaults"
          value={`${compounds.filter((c) => c.status === 'Active').length}`}
        />
      </div>

      {/* Compounding Configurator */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <SectionCard
          className="lg:col-span-7"
          title="Configure Compounding Vault"
          subtitle="Select lock duration and compounding amount from your withdrawable earnings"
          icon={<Repeat className="h-4 w-4" />}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {LOCK_OPTIONS.map((opt) => {
                const active = opt.term === selectedTerm;
                return (
                  <button
                    key={opt.term}
                    type="button"
                    onClick={() => setSelectedTerm(opt.term)}
                    className={`rounded-2xl border p-3.5 text-left transition cursor-pointer ${active
                        ? 'hana-card-gold border-2 border-[#FFB800]'
                        : 'border-[#0755E8]/25 bg-white/90 hover:border-[#0755E8]/55'
                      }`}
                  >
                    <p className="font-display text-sm font-extrabold text-[#032B91]">{opt.term}</p>
                    <p className="mt-1 font-display text-xl font-extrabold text-[#061B50] tabular-nums">{opt.apy}</p>
                    <p className="mt-0.5 text-xs font-bold text-emerald-700">{opt.boost}</p>
                  </button>
                );
              })}
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between text-xs font-bold">
                <span className="text-[#032B91]">Compound Amount (USDT)</span>
                <span className="text-[#0645C5] tabular-nums">
                  Available: ${withdrawableUsdt.toFixed(2)} USDT
                </span>
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-[#0755E8]/30 bg-white px-3 py-1.5 shadow-inner">
                <span className="font-display text-base font-extrabold text-[#0645C5]">$</span>
                <input
                  type="number"
                  min={0}
                  max={withdrawableUsdt}
                  value={amountInput}
                  onChange={(e) => setAmountInput(e.target.value)}
                  className="w-full bg-transparent py-1.5 font-display text-base font-bold text-[#061B50] tabular-nums focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setAmountInput(String(withdrawableUsdt))}
                  className="hana-gold-btn rounded-lg px-3 py-1 text-xs font-extrabold cursor-pointer"
                >
                  MAX
                </button>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {[100, 250, 500, 1000].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setAmountInput(String(Math.min(withdrawableUsdt, preset)))}
                    className="rounded-full border border-[#0755E8]/25 bg-white px-3 py-1 text-xs font-bold text-[#032B91] hover:bg-[#EAF4FF] cursor-pointer"
                  >
                    ${preset}
                  </button>
                ))}
              </div>
            </div>

            <GoldButton
              onClick={() => setConfirmOpen(true)}
              disabled={parsedAmount <= 0 || parsedAmount > withdrawableUsdt}
              className="w-full py-3"
            >
              <Sparkles className="h-4 w-4" />
              Activate Compounding Vault
            </GoldButton>
          </div>
        </SectionCard>

        <SectionCard
          dark
          className="lg:col-span-5"
          title="Projected Compounding Yield"
          icon={<TrendingUp className="h-4 w-4" />}
        >
          <div className="space-y-4">
            <div className="rounded-2xl border border-[#27D9FF]/35 bg-[#041540]/75 p-4">
              <p className="text-xs font-semibold text-blue-200">Estimated Maturity Value</p>
              <p className="mt-1 font-display text-3xl font-extrabold text-[#FFE98A] tabular-nums">
                ${projectedReturn.toFixed(2)} USDT
              </p>
              <p className="mt-1 text-xs font-semibold text-emerald-300 tabular-nums">
                +${(projectedReturn - parsedAmount).toFixed(2)} Net Compounded Gain
              </p>
            </div>

            <div className="space-y-2 text-xs text-blue-100">
              <div className="flex justify-between border-b border-white/10 pb-2">
                <span>Principal Compounded</span>
                <span className="font-bold text-white tabular-nums">${parsedAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-b border-white/10 pb-2">
                <span>Vault Lock Term</span>
                <span className="font-bold text-[#FFD700]">{selectedTerm}</span>
              </div>
              <div className="flex justify-between">
                <span>Protocol Fee</span>
                <span className="font-bold text-emerald-300">0.00% (Waived on Compound)</span>
              </div>
            </div>
          </div>
        </SectionCard>
      </div>

      {/* Compounding History */}
      <SectionCard title="Compounding History" icon={<Clock className="h-4 w-4" />}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-xs">
            <thead>
              <tr className="border-b border-[#0755E8]/15 text-[#0645C5]">
                <th className="py-2 pr-3 font-bold">Amount</th>
                <th className="py-2 pr-3 font-bold">Lock Term</th>
                <th className="py-2 pr-3 font-bold">Boost</th>
                <th className="py-2 pr-3 font-bold">Projected Return</th>
                <th className="py-2 pr-3 font-bold">Date</th>
                <th className="py-2 pr-3 font-bold">Status</th>
                <th className="py-2 font-bold">Tx Hash</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#0755E8]/10">
              {compounds.map((c) => (
                <tr key={c.id} className="hover:bg-[#EAF4FF]/60">
                  <td className="py-2.5 pr-3 font-extrabold text-[#061B50] tabular-nums">${c.amount.toFixed(2)}</td>
                  <td className="py-2.5 pr-3 font-bold text-[#032B91]">{c.lockTerm}</td>
                  <td className="py-2.5 pr-3 font-bold text-emerald-700">{c.bonusBoost}</td>
                  <td className="py-2.5 pr-3 font-extrabold text-[#D89500] tabular-nums">
                    ${c.projectedReturn.toFixed(2)}
                  </td>
                  <td className="py-2.5 pr-3 text-[#032B91]/80">{c.date}</td>
                  <td className="py-2.5 pr-3">
                    <StatusBadge status={c.status} />
                  </td>
                  <td className="py-2.5">
                    <TxHashChip hash={c.txHash} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <ConfirmModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Confirm Compounding Vault"
        description={`Compound $${parsedAmount.toFixed(2)} USDT into the ${selectedTerm} vault for an estimated return of $${projectedReturn.toFixed(2)} USDT.`}
        confirmLabel="Confirm Compound"
        onConfirm={() => compoundBalance(parsedAmount, selectedTerm)}
      />
    </div>
  );
}
