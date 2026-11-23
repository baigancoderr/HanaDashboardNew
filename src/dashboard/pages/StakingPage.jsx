import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Wallet,
  Coins,
  Users,
  Clock,
  ArrowRight,
  ChevronRight,
  Crown,
  Info,
  Layers,
  Percent,
  Shield,
  RefreshCw,
} from 'lucide-react';
import { STAKING_PACKAGES, useHana } from '../context/HanaContext';
import { HANA_IMAGES } from '../assets/images';
import {
  ConfirmModal,
  BlueButton,
  GoldButton,
  HeroBanner,
  PackageBadge,
  ProgressBar,
  SectionCard,
  StatCard,
  TxHashChip,
} from '../components/common/UiPrimitives';
import { RankMedalIcon } from '../components/common/Icons3D';

const DAO_PACKAGE = {
  id: 5,
  tier: 'DAO',
  name: 'HANA DAO',
  amount: 5000,
  dailyPercent: 1,
  capMultiplier: 2,
  durationDays: 200,
  isDAO: true,
};

export function StakingPage() {
  const navigate = useNavigate();
  const {
    usdtBalance,
    totalStaked,
    totalEarned,
    positions,
    refreshActiveStakes,
    activeStakesLoading,
    transactions,
    teamMembers,
    stakePackage,
    claimRoi,
  } = useHana();

  const validDirects = (teamMembers || []).filter((m) => m.level === 1).length;

  const [selectedPkg, setSelectedPkg] = useState(STAKING_PACKAGES[2]);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const stakingTxs = transactions.filter((t) => t.type === 'Staking' || t.type === 'Investment' || t.type === 'DAO Stake');

  return (
    <div className="space-y-5">
      <HeroBanner
        title="Stake • Grow •"
        highlight="Earn"
        subtitle={`Earn rewards with HANA staking · Available Wallet Balance: $${usdtBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })} USDT`}
        ctaLabel="Stake Now →"
        onCtaClick={() => setConfirmOpen(true)}
        imageSrc={HANA_IMAGES.bannerStaking}
        imageAlt="HANA Staking Gold Coins"
      />

      {/* 4 KPI Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={<Wallet className="h-6 w-6" />}
          label="Total Staked"
          value={`$${totalStaked.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
        />
        <StatCard
          icon={<Coins className="h-6 w-6" />}
          label="Total Earned"
          value={`$${totalEarned.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
          goldAccent
        />
        <StatCard
          icon={<Users className="h-6 w-6" />}
          label="Valid Directs"
          value={`${validDirects}`}
        />
        <StatCard
          icon={<Clock className="h-6 w-6" />}
          label="Credit Interval"
          value="12 Hours"
          goldAccent
        />
      </div>

      {/* Staking Packages */}
      <SectionCard
        title="Staking Packages"
        subtitle="Choose a package to stake USDT into the verified HANA contract on BSC Testnet"
        icon={<Layers className="h-4 w-4" />}
      >
        <div className="grid grid-cols-1 items-stretch gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
          {STAKING_PACKAGES.filter((pkg) => !pkg.isDAO && pkg.id !== 5).map((pkg) => (
            <div
              key={pkg.id}
              className={`relative flex flex-col items-center justify-between rounded-2xl px-3 py-3 text-center transition-all duration-200 ${
                pkg.popular
                  ? 'border-2 border-[#FFD700] bg-gradient-to-b from-[#0a3bbf] via-[#0755E8] to-[#032B91] shadow-[0_8px_28px_rgba(255,184,0,0.32),0_4px_16px_rgba(7,85,232,0.35)]'
                  : 'border border-[#0755E8]/20 bg-white/85 hover:border-[#0755E8]/50 hover:bg-white'
              }`}
            >
              {/* Golden glow overlay only for popular card */}
              {pkg.popular && (
                <div className="pointer-events-none absolute inset-x-0 top-0 h-24 rounded-t-2xl bg-gradient-to-b from-[#FFD700]/12 to-transparent" />
              )}

              {pkg.popular && (
                <span className="absolute -top-2.5 rounded-full border border-[#D89500] bg-gradient-to-r from-[#FFE98A] to-[#FFB800] px-2.5 py-0.5 text-[10px] font-extrabold text-[#061B50] shadow-md">
                  Popular
                </span>
              )}
              <div className="relative z-10 flex h-[52px] items-center justify-center">
                <RankMedalIcon tier={pkg.tier} size={46} />
              </div>
              <div className="relative z-10">
                <h4 className={`text-sm font-bold ${pkg.popular ? 'text-[#FFE98A]' : 'text-[#10102B]'}`}>{pkg.name}</h4>
                <p className={`mt-0.5 font-display text-[22px] font-extrabold leading-tight tabular-nums ${pkg.popular ? 'text-white drop-shadow-[0_2px_8px_rgba(255,215,0,0.35)]' : 'text-[#10102B]'}`}>
                  ${pkg.amount.toLocaleString()}
                </p>
              </div>
              <div className="relative z-10 my-2 flex flex-col items-center gap-1">
                <span className={`whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px] font-bold tabular-nums ${pkg.popular ? 'border-[#FFD700]/60 bg-[#FFD700]/18 text-[#FFE98A]' : 'border-[#F8DF9A] bg-[#FFF2CC] text-[#7A5200]'}`}>
                  {pkg.dailyPercent.toFixed(2)}% Daily ROI
                </span>
                <span className={`text-[11.5px] font-semibold ${pkg.popular ? 'text-blue-200/90' : 'text-[#50516C]'}`}>
                  {pkg.capMultiplier}X Package Cap
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedPkg(pkg);
                  setConfirmOpen(true);
                }}
                className="stake-now-btn relative z-10 inline-flex w-full cursor-pointer items-center justify-center gap-1 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-extrabold text-[#061B50] transition-all duration-150"
              >
                Stake Now
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}

          <div>
            <div className="dao-card relative flex h-full min-h-[222px] flex-col items-center justify-between overflow-hidden rounded-[18px] bg-gradient-to-br from-[#082B78] via-[#291A72] to-[#680E78] px-4 py-3 text-center text-white shadow-[0_12px_30px_rgba(56,24,124,0.32)]">
              <div className="pointer-events-none absolute right-[-38px] top-[14px] z-20 rotate-[38deg] bg-gradient-to-r from-[#E62E7B] via-[#C3168F] to-[#8C0EA8] px-10 py-1 text-[9px] font-extrabold uppercase leading-tight tracking-wider text-white shadow-md">
                Exclusive
                <br />
                DAO Plan
              </div>
              <div
                aria-hidden="true"
                className="pointer-events-none absolute left-1/2 top-2 h-24 w-40 -translate-x-1/2 rounded-full bg-[#E59DFF]/35 blur-xl"
              />
              {/* Rotating border glow ring */}
              <div aria-hidden="true" className="dao-card-ring pointer-events-none absolute inset-0 rounded-[18px]" />
              {/* Shimmer sweep */}
              <span aria-hidden="true" className="dao-card-shimmer pointer-events-none absolute inset-0" />
              <div className="relative z-10 flex w-full flex-col items-center">
                <div className="flex h-[58px] items-center justify-center text-[#FFE066] drop-shadow-[0_6px_14px_rgba(255,216,77,0.45)]">
                  <Crown className="dao-card-crown h-12 w-12" />
                </div>
                <span className="mt-0.5 rounded-full border border-white/25 bg-white/15 px-4 py-0.5 text-[12.5px] font-extrabold tracking-wide text-white shadow-sm">
                  HANA DAO
                </span>
                <p className="mt-1 font-display text-[28px] font-extrabold leading-tight text-white tabular-nums">
                  $5,000
                </p>
                <div className="mt-2 grid w-full grid-cols-2 gap-2">
                  <div className="flex items-center justify-center gap-1 whitespace-nowrap rounded-xl border border-white/25 bg-white/15 px-2 py-1 text-[10.5px] font-bold">
                    <Percent className="h-3 w-3 text-[#FFE066]" />
                    <span>1.00% Daily ROI</span>
                  </div>
                  <div className="flex items-center justify-center gap-1 whitespace-nowrap rounded-xl border border-white/25 bg-white/15 px-2 py-1 text-[10.5px] font-bold">
                    <Layers className="h-3 w-3 text-[#FFE066]" />
                    <span>2X Package Cap</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedPkg(DAO_PACKAGE);
                  setConfirmOpen(true);
                }}
                className="relative z-10 mt-2.5 inline-flex w-full cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-full bg-gradient-to-r from-[#FFE98A] to-[#FFB800] px-4 py-2 text-[13px] font-extrabold text-[#1F1502] shadow-md transition hover:brightness-105"
              >
                <Crown className="h-4 w-4" />
                Join DAO Now
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Active Stakes */}
      <SectionCard
        title="Active Stakes"
        subtitle="Track 2X capping progress and claim accrued ROI rewards"
        icon={<Shield className="h-4 w-4" />}
        rightSlot={
          <BlueButton onClick={refreshActiveStakes} disabled={activeStakesLoading}>
            <RefreshCw className={`h-3.5 w-3.5 ${activeStakesLoading ? 'animate-spin' : ''}`} />
            Refresh
          </BlueButton>
        }
      >
        <div className="space-y-4">
          {activeStakesLoading && positions.length === 0 ? (
            <div className="flex items-center justify-center gap-2 py-8 text-sm font-semibold text-[#0645C5]" role="status">
              <RefreshCw className="h-4 w-4 animate-spin" />
              Loading active stakes...
            </div>
          ) : positions.length > 0 ? (
            positions.map((pos) => {
              const pct = Math.min(100, Math.round((pos.totalClaimed / pos.capAmount) * 100));
              return (
                <div
                  key={pos.id}
                  className="flex flex-col gap-4 rounded-2xl border border-[#0755E8]/25 bg-white/90 p-4 shadow-sm lg:flex-row lg:items-center"
                >
                  <div className="flex items-center gap-3 rounded-2xl bg-gradient-to-br from-[#0755E8] to-[#032B91] p-4 text-white lg:w-64 shrink-0">
                    <RankMedalIcon tier={pos.packageTier} size={48} />
                    <div>
                      <p className="font-display text-xl font-extrabold tabular-nums">
                        ${pos.invested.toLocaleString()}
                      </p>
                      <p className="text-xs font-semibold text-blue-100">{pos.packageName}</p>
                    </div>
                  </div>

                  <div className="flex-1 space-y-3">
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      <div>
                        <p className="text-xs font-semibold text-[#0645C5]/80">Invested</p>
                        <p className="font-display text-base font-extrabold text-[#061B50] tabular-nums">
                          ${pos.invested.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-[#0645C5]/80">Total Claimed</p>
                        <p className="font-display text-base font-extrabold text-emerald-600 tabular-nums">
                          ${pos.totalClaimed.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-[#0645C5]/80">2X Cap</p>
                        <p className="font-display text-base font-extrabold text-[#061B50] tabular-nums">
                          ${pos.capAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-[#0645C5]/80">Pending</p>
                        <p className="font-display text-base font-extrabold text-[#0755E8] tabular-nums">
                          ${pos.pendingRoi.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <ProgressBar percent={pct} variant="gold" />
                  </div>

                  <div className="shrink-0">
                    <GoldButton
                      onClick={() => claimRoi(pos.id)}
                      disabled={pos.pendingRoi <= 0}
                      className="w-full lg:w-auto"
                    >
                      <Coins className="h-4 w-4" />
                      {pos.pendingRoi > 0 ? `Claim ROI ($${pos.pendingRoi.toFixed(0)})` : 'ROI Claimed'}
                    </GoldButton>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#0755E8]/30 bg-white/60 p-8 text-center">
              <Shield className="h-10 w-10 text-[#0755E8]/40 mb-2" />
              <p className="text-sm font-bold text-[#061B50]">No Active Stakes</p>
              <p className="mt-1 text-xs text-[#0645C5]/70 max-w-sm">
                You do not have any active staking positions on-chain yet. Choose a package above to begin earning daily ROI.
              </p>
            </div>
          )}
        </div>
      </SectionCard>

      {/* Bottom 2-Column Row: Staking Transaction History & Capping Note */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-1">
        <SectionCard
          className="lg:col-span-8"
          title="Staking Transaction History"
          icon={<Clock className="h-4 w-4" />}
          rightSlot={
            <button
              type="button"
              onClick={() => navigate('/dashboard/transactions')}
              className="inline-flex items-center gap-1 text-xs font-extrabold text-[#D89500] hover:text-[#0755E8] cursor-pointer"
            >
              View All <ArrowRight className="h-3.5 w-3.5" />
            </button>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[580px] text-left text-xs">
              <thead>
                <tr className="border-b border-[#0755E8]/15 text-[#0645C5]">
                  <th className="py-2 pr-3 font-bold">#</th>
                  <th className="py-2 pr-3 font-bold">Package</th>
                  <th className="py-2 pr-3 font-bold">Amount</th>
                  <th className="py-2 pr-3 font-bold">Date &amp; Time</th>
                  <th className="py-2 font-bold">Tx Hash</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#0755E8]/10">
                {stakingTxs.length > 0 ? (
                  stakingTxs.slice(0, 10).map((tx, idx) => (
                    <tr key={tx.id} className="hover:bg-[#EAF4FF]/60">
                      <td className="py-2.5 pr-3 font-bold text-[#032B91] tabular-nums">{idx + 1}</td>
                      <td className="py-2.5 pr-3">
                        <PackageBadge tier={tx.packageTier || 'Silver'} />
                      </td>
                      <td className="py-2.5 pr-3 font-extrabold text-emerald-700 tabular-nums">{tx.amountLabel}</td>
                      <td className="py-2.5 pr-3 text-[#032B91]/80 tabular-nums">{tx.date}</td>
                      <td className="py-2.5">
                        <TxHashChip hash={tx.txHash} />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-xs font-semibold text-[#0645C5]">
                      No on-chain staking transactions found for this wallet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </SectionCard>

        {/* <SectionCard
          className="lg:col-span-4"
          title="Capping Note"
          icon={<Info className="h-4 w-4" />}
        >
          <div className="flex h-full flex-col justify-between gap-4">
            <p className="text-sm leading-relaxed font-medium text-[#032B91]">
              Level Income + ROI + Direct Referral Income count toward <strong>2X capping</strong>, while Rank Income
              and DAO Income are excluded from the standard staking cap.
            </p>
            <div className="flex items-center gap-3 rounded-xl border border-[#FFB800]/50 bg-[#FFF8DF] p-3">
              <img
                src={HANA_IMAGES.goldCoinsStack}
                alt="HANA Capping Reserve"
                referrerPolicy="no-referrer"
                className="h-14 w-14 rounded-xl object-cover border border-[#FFB800]/40"
              />
              <div className="text-xs">
                <p className="font-bold text-[#061B50]">Auto-Compound &amp; Re-Stake</p>
                <p className="text-[#0645C5]">Upgrade any package before reaching 100% of your 2X cap.</p>
              </div>
            </div>
          </div>
        </SectionCard> */}
      </div>

      <ConfirmModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title={`Confirm ${selectedPkg.name} Stake`}
        description={`You are about to stake $${selectedPkg.amount.toLocaleString()} USDT in the ${selectedPkg.name} Package (${selectedPkg.dailyPercent}% daily, 2X Cap).`}
        confirmLabel={`Stake $${selectedPkg.amount.toLocaleString()} USDT`}
        loadingLabel="Staking..."
        onConfirm={() => stakePackage(selectedPkg)}
      >
        <div className="rounded-xl border border-[#0755E8]/20 bg-[#EAF4FF] p-3.5 text-xs space-y-1.5">
          <div className="flex justify-between">
            <span className="text-[#0645C5]">Package Tier</span>
            <span className="font-bold text-[#032B91]">{selectedPkg.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#0645C5]">Daily ROI</span>
            <span className="font-bold text-emerald-700">{selectedPkg.dailyPercent}% / day</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#0645C5]">Max 2X Return Cap</span>
            <span className="font-bold text-[#032B91]">${(selectedPkg.amount * 2).toLocaleString()}.00 USDT</span>
          </div>
        </div>
      </ConfirmModal>
    </div>
  );
}
