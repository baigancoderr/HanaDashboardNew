import React, { useState } from 'react';
import {
  Crown,
  Users,
  Coins,
  Rocket,
  CheckCircle2,
  ShieldCheck,
  Info,
  Clock,
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

export function DaoPage() {
  const { daoMember, daoValidDays, daoMembersCount, transactions, stakeDaoPackage } = useHana();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const daoTxs = transactions.filter((t) => t.type === 'DAO Stake');

  return (
    <div className="space-y-5">
      <HeroBanner
        title="DAO"
        highlight="Program"
        subtitle="Join the Exclusive DAO Membership and Unlock Special 5X Multiplier Benefits"
        ctaLabel="Stake DAO Now →"
        onCtaClick={() => setConfirmOpen(true)}
        imageSrc={HANA_IMAGES.bannerDao}
        imageAlt="HANA Special $5,000 DAO  Crest"
        rightBadge={
          <span className="rounded-xl border border-[#FFE98A] bg-gradient-to-r from-[#032B91]/90 to-[#0645C5]/90 px-3 py-1 text-xs font-extrabold text-[#FFE98A] shadow">
            Special $5,000 DAO 
          </span>
        }
      />

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={<Crown className="h-6 w-6" />}
          label="DAO Status"
          value={daoMember ? 'Member' : 'Eligible'}
          subtext={`Valid till: ${daoValidDays} Days`}
          goldAccent
        />
        <StatCard
          icon={<Users className="h-6 w-6" />}
          label="DAO Members"
          value={`${daoMembersCount} / 500`}
          subtext={`${500 - daoMembersCount} Spots Left`}
        />
        <StatCard
          icon={<Coins className="h-6 w-6" />}
          label="DAO Pool Payout"
          value="Manual"
          subtext="Owner Distribution"
          goldAccent
        />
        <StatCard
          icon={<Rocket className="h-6 w-6" />}
          label="DAO Stake Cap"
          value="5X"
          subtext="Special Multiplier"
        />
      </div>

      {/* Main 2-Column Showcase */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-1">
        {/* Left: Dark Royal Blue Luxury Special $5,000 DAO  Package */}
        <SectionCard
          dark
          className="lg:col-span-7"
          title="Special $5,000 DAO  Package"
          icon={<Crown className="h-4 w-4" />}
          rightSlot={
            <span className="rounded-full bg-gradient-to-r from-[#FFE98A] to-[#FFB800] px-3 py-0.5 text-xs font-extrabold text-[#061B50]">
              Premium
            </span>
          }
        >
          <div className="grid grid-cols-1 items-center gap-6 md:grid-cols-12">
            {/* Crest + Perks */}
            <div className="space-y-4 md:col-span-6">
              <div className="flex items-center gap-4">
                <img
                  src={HANA_IMAGES.daoCrest}
                  alt="$5,000 DAO Package"
                  referrerPolicy="no-referrer"
                  className="h-24 w-24 shrink-0 rounded-2xl border-2 border-[#FFD700] object-cover shadow-[0_8px_24px_rgba(255,184,0,0.35)]"
                />
                <div>
                  <p className="font-display text-2xl font-extrabold text-[#FFE98A]">$5,000</p>
                  <p className="text-xs font-bold tracking-wider text-blue-100 uppercase">DAO Package</p>
                </div>
              </div>

              <ul className="space-y-2 text-xs font-semibold text-blue-50 sm:text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-[#FFD700]" />
                  <span>5X Stake Multiplier</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-[#FFD700]" />
                  <span>Exclusive DAO Benefits</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-[#FFD700]" />
                  <span>Long-Term Rewards</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-[#FFD700]" />
                  <span>Premium Recognition</span>
                </li>
              </ul>

              <GoldButton onClick={() => setConfirmOpen(true)} className="w-full">
                Join the Elite DAO Community
              </GoldButton>
            </div>

            {/* 6 Spec Grid Boxes */}
            <div className="grid grid-cols-2 gap-2.5 md:col-span-6">
              {[
                { label: 'Minimum Stake', value: '$5,000' },
                { label: 'Daily Rate', value: '2.50%' },
                { label: 'Stake Cap', value: '5X' },
                { label: 'DAO Term', value: '500 Days' },
                { label: 'Top-up Rule', value: '$5,000 Multiples' },
                { label: 'Pool Schedule', value: 'Owner Dist.' },
              ].map((spec) => (
                <div
                  key={spec.label}
                  className="rounded-xl border border-[#27D9FF]/35 bg-[#041540]/75 p-3 text-center"
                >
                  <p className="text-[11px] font-semibold text-blue-200">{spec.label}</p>
                  <p className="mt-1 font-display text-base font-extrabold text-[#FFE98A] tabular-nums">
                    {spec.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </SectionCard>

        {/* Right: DAO Staking Benefits */}
        {/* <SectionCard
          dark
          className="lg:col-span-5"
          title="DAO Staking Benefits"
          icon={<ShieldCheck className="h-4 w-4" />}
        >
          <div className="flex h-full flex-col justify-between gap-4">
            <ul className="space-y-3 text-sm font-semibold text-blue-50">
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-[#FFD700]" />
                <span>Be part of Elite DAO Community</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-[#FFD700]" />
                <span>Earn higher rewards (2.50% daily up to 5X cap)</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-[#FFD700]" />
                <span>Enjoy special privileges &amp; governance status</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-[#FFD700]" />
                <span>Get long-term 500-day DAO Pool participation</span>
              </li>
            </ul>

            <div className="overflow-hidden rounded-2xl border border-[#FFD700]/35">
              <img
                src={HANA_IMAGES.heroCrownPodium}
                alt="DAO Growth Benefits"
                referrerPolicy="no-referrer"
                className="h-28 w-full object-cover"
              />
            </div>
          </div>
        </SectionCard> */}
      </div>

      {/* Bottom 3-Column Bar: How to Join DAO / Stake CTA / Info Note */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-9">
        <SectionCard className="lg:col-span-6" title="How to Join DAO?" icon={<Clock className="h-4 w-4" />}>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
            {[
              { step: '1', text: 'Ensure you have $5,000 USDT' },
              { step: '2', text: 'Stake the DAO Package' },
              { step: '3', text: 'Become a DAO Member' },
            ].map((s) => (
              <div
                key={s.step}
                className="flex items-center gap-2.5 rounded-xl border border-[#0755E8]/20 bg-white/95 p-3"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#0755E8] text-xs font-extrabold text-white">
                  {s.step}
                </span>
                <span className="text-xs font-bold text-[#032B91]">{s.text}</span>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard className="flex items-center justify-center lg:col-span-3">
          <GoldButton onClick={() => setConfirmOpen(true)} className="w-full py-3.5">
            <Crown className="h-4 w-4" />
            Stake $5,000 DAO Package →
          </GoldButton>
        </SectionCard>

        {/* <SectionCard className="lg:col-span-3">
          <div className="flex items-start gap-2.5 text-xs font-medium text-[#032B91]">
            <Info className="mt-0.5 h-5 w-5 shrink-0 text-[#0755E8]" />
            <span>
              DAO membership is recorded for 500 days. The membership flag remains active even after the end time.
            </span>
          </div>
        </SectionCard> */}
      </div>

      {/* DAO Transactions */}
      {daoTxs.length > 0 && (
        <SectionCard title="DAO Staking History" icon={<Crown className="h-4 w-4" />}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[540px] text-left text-xs">
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
                {daoTxs.map((tx) => (
                  <tr key={tx.id}>
                    <td className="py-2.5 pr-3 font-bold text-[#032B91]">{tx.type}</td>
                    <td className="py-2.5 pr-3 font-extrabold text-[#061B50] tabular-nums">{tx.amountLabel}</td>
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
      )}

      <ConfirmModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Activate $5,000 DAO  Package"
        description="Join the exclusive 500-member HANA DAO pool with a 5X stake cap multiplier and 2.50% daily rewards for 500 days."
        confirmLabel="Confirm $5,000 DAO Stake"
        loadingLabel="Staking..."
        onConfirm={stakeDaoPackage}
      />
    </div>
  );
}
