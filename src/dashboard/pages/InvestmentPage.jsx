import React, { useState } from 'react';
import { Layers, Coins, ShieldCheck, Clock, ArrowUpRight } from 'lucide-react';
import { STAKING_PACKAGES, useHana } from '../context/HanaContext';
import { HANA_IMAGES } from '../assets/images';
import {
  ConfirmModal,
  GoldButton,
  HeroBanner,
  PackageBadge,
  ProgressBar,
  SectionCard,
  StatCard,
  StatusBadge,
  TxHashChip,
} from '../components/common/UiPrimitives';
import { RankMedalIcon } from '../components/common/Icons3D';

export function InvestmentPage() {
  const { usdtBalance, totalInvested, positions, transactions, stakePackage } = useHana();
  const [selectedPkg, setSelectedPkg] = useState(null);

  const investmentTxs = transactions.filter((t) => t.type === 'Investment' || t.type === 'Staking');

  return (
    <div className="space-y-5">
      <HeroBanner
        title="Investment"
        highlight="Packages"
        subtitle="Activate smart-contract investment plans with automated 12-hour ROI distributions"
        ctaLabel="Activate Plan →"
        onCtaClick={() => setSelectedPkg(STAKING_PACKAGES[2])}
        imageSrc={HANA_IMAGES.bannerStaking}
        imageAlt="HANA Investment Packages"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={<Layers className="h-6 w-6" />}
          label="Total Invested"
          value={`$${totalInvested.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
        />
        <StatCard
          icon={<Coins className="h-6 w-6" />}
          label="Wallet USDT"
          value={`$${usdtBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
          goldAccent
        />
        <StatCard
          icon={<ShieldCheck className="h-6 w-6" />}
          label="Active Plans"
          value={`${positions.length}`}
        />
        <StatCard
          icon={<Clock className="h-6 w-6" />}
          label="Max ROI Cap"
          value="200% (2X)"
          goldAccent
        />
      </div>

      {/* Investment Packages Grid */}
      <SectionCard
        title="Available Investment Plans"
        subtitle="Choose a HANA smart-contract tier to start earning daily returns"
        icon={<Layers className="h-4 w-4" />}
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {STAKING_PACKAGES.map((pkg) => (
            <div
              key={pkg.id}
              className={`flex flex-col justify-between rounded-2xl p-4 transition hover:-translate-y-0.5 ${
                pkg.popular ? 'hana-card-gold' : 'hana-card'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <RankMedalIcon tier={pkg.tier} size={42} />
                    <div>
                      <h3 className="font-display text-base font-extrabold text-[#032B91]">{pkg.name} Plan</h3>
                      <p className="text-xs font-semibold text-[#0645C5]">{pkg.durationDays} Days Term</p>
                    </div>
                  </div>
                  {pkg.popular && <PackageBadge tier="Popular" />}
                </div>

                <div className="my-4 rounded-xl border border-[#0755E8]/15 bg-white/85 p-3">
                  <p className="text-xs font-semibold text-[#0645C5]">Investment Amount</p>
                  <p className="font-display text-2xl font-extrabold text-[#061B50] tabular-nums">
                    ${pkg.amount.toLocaleString()}.00 USDT
                  </p>
                  <div className="mt-2 flex items-center justify-between text-xs font-bold">
                    <span className="text-emerald-700">Daily Return: {pkg.dailyPercent}%</span>
                    <span className="text-[#032B91]">Max Cap: ${(pkg.amount * 2).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <GoldButton onClick={() => setSelectedPkg(pkg)} className="w-full">
                Invest ${pkg.amount.toLocaleString()} <ArrowUpRight className="h-4 w-4" />
              </GoldButton>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Active Investment Summary */}
      <SectionCard title="Active Investment Overview" icon={<ShieldCheck className="h-4 w-4" />}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {positions.map((pos) => {
            const pct = Math.min(100, Math.round((pos.totalClaimed / pos.capAmount) * 100));
            return (
              <div key={pos.id} className="rounded-2xl border border-[#0755E8]/25 bg-white/90 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <RankMedalIcon tier={pos.packageTier} size={36} />
                    <div>
                      <p className="font-display text-sm font-extrabold text-[#032B91]">{pos.packageName}</p>
                      <p className="text-xs text-[#0645C5]">Expires: {pos.expiresAt}</p>
                    </div>
                  </div>
                  <PackageBadge tier={pos.packageTier} />
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <p className="text-[#0645C5]">Invested</p>
                    <p className="font-extrabold text-[#061B50] tabular-nums">${pos.invested.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-[#0645C5]">Claimed</p>
                    <p className="font-extrabold text-emerald-700 tabular-nums">${pos.totalClaimed.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-[#0645C5]">Cap (2X)</p>
                    <p className="font-extrabold text-[#061B50] tabular-nums">${pos.capAmount.toFixed(2)}</p>
                  </div>
                </div>
                <ProgressBar percent={pct} variant="gold" />
              </div>
            );
          })}
        </div>
      </SectionCard>

      {/* Investment History */}
      <SectionCard title="Investment History" icon={<Clock className="h-4 w-4" />}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-left text-xs">
            <thead>
              <tr className="border-b border-[#0755E8]/15 text-[#0645C5]">
                <th className="py-2 pr-3 font-bold">Type</th>
                <th className="py-2 pr-3 font-bold">Amount</th>
                <th className="py-2 pr-3 font-bold">Details</th>
                <th className="py-2 pr-3 font-bold">Date</th>
                <th className="py-2 pr-3 font-bold">Status</th>
                <th className="py-2 font-bold">Tx Hash</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#0755E8]/10">
              {investmentTxs.map((tx) => (
                <tr key={tx.id} className="hover:bg-[#EAF4FF]/60">
                  <td className="py-2.5 pr-3 font-bold text-[#032B91]">{tx.type}</td>
                  <td className="py-2.5 pr-3 font-extrabold text-emerald-700 tabular-nums">{tx.amountLabel}</td>
                  <td className="py-2.5 pr-3 text-[#0645C5]">{tx.details}</td>
                  <td className="py-2.5 pr-3 text-[#032B91]/80">{tx.date}</td>
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
        open={selectedPkg !== null}
        onClose={() => setSelectedPkg(null)}
        title={selectedPkg ? `Invest in ${selectedPkg.name} Plan` : ''}
        description={
          selectedPkg
            ? `Deploy $${selectedPkg.amount.toLocaleString()} USDT into the ${selectedPkg.name} smart contract plan (${selectedPkg.dailyPercent}% daily up to 2X cap).`
            : ''
        }
        confirmLabel="Confirm Investment"
        loadingLabel="Staking..."
        onConfirm={() => selectedPkg && stakePackage(selectedPkg)}
      />
    </div>
  );
}
