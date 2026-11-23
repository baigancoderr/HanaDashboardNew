import React, { useState, useRef } from 'react';
import {
  TrendingUp,
  Coins,
  Users,
  Trophy,
  Link2,
  Copy,
  RefreshCw,
  FileText,
  Info,
} from 'lucide-react';
import { useHana, formatShortAddress } from '../context/HanaContext';
import { HANA_IMAGES } from '../assets/images';
import {
  BlueButton,
  GoldButton,
  HeroBanner,
  PackageBadge,
  SectionCard,
  StatCard,
  TxHashChip,
} from '../components/common/UiPrimitives';

export function DirectIncomePage() {
  const {
    directIncomeEvents,
    registeredReferrals,
    referralLink,
    walletConnected,
    connectWallet,
    copyToClipboard,
    totalDirectEarnedUsdt,
    totalDirectEarnedHana,
    directIncomeLoading,
    directIncomeError,
    refetchDirectIncome,
  } = useHana();

  const [tab, setTab] = useState('logs');
  const tableRef = useRef(null);

  const directReferrals = registeredReferrals || [];

  return (
    <div className="space-y-5">
      <HeroBanner
        title="Direct"
        highlight="Income"
        subtitle="Earn Rewards from Your Direct Referrals instantly on-chain"
        ctaLabel="View Event Logs →"
        onCtaClick={() => tableRef.current?.scrollIntoView({ behavior: 'smooth' })}
        imageSrc={HANA_IMAGES.bannerNetwork}
        imageAlt="HANA Direct Referral Network"
      />

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={<TrendingUp className="h-6 w-6" />}
          label="Total Direct Income"
          value={`$${totalDirectEarnedUsdt.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
          subtext={`${directIncomeEvents.length} income events`}
        />
        <StatCard
          icon={<Coins className="h-6 w-6" />}
          label="HANA Credited"
          value={`${totalDirectEarnedHana.toLocaleString('en-US', { minimumFractionDigits: 2 })} HANA`}
          subtext="From direct rewards"
          goldAccent
        />
        <StatCard
          icon={<Users className="h-6 w-6" />}
          label="Valid Directs"
          value={directReferrals.length.toString()}
          subtext="Registered referrals"
        />
        <StatCard
          icon={<Trophy className="h-6 w-6" />}
          label="Income Events"
          value={`${directIncomeEvents.length}`}
          subtext="On-chain logs"
          goldAccent
        />
      </div>

      {/* Your Referral Link Bar */}
      <SectionCard>
        <div className="flex flex-col items-stretch justify-between gap-3 lg:flex-row lg:items-center">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FFE98A] to-[#FFB800] text-[#061B50] shadow">
              <Link2 className="h-5 w-5" />
            </div>
            <div>
              <p className="font-display text-sm font-extrabold text-[#032B91]">Your Referral Link</p>
              <p className="text-xs text-[#0645C5]">Share your link and earn 5% direct rewards</p>
            </div>
          </div>

          <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center lg:max-w-2xl">
            <div className="flex flex-1 items-center overflow-hidden rounded-xl border border-[#0755E8]/30 bg-white">
              <input
                type="text"
                readOnly
                value={referralLink}
                placeholder={walletConnected ? 'Preparing your referral link...' : 'Connect your wallet to get a referral link'}
                className="w-full px-3 py-2 font-mono text-xs font-bold text-[#032B91] focus:outline-none"
                aria-label="Direct referral link"
              />
              <button
                type="button"
                onClick={() => copyToClipboard(referralLink, 'Referral link copied')}
                disabled={!referralLink}
                className="flex h-10 w-10 shrink-0 items-center justify-center bg-[#0645C5] text-white hover:bg-[#032B91] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                aria-label="Copy link"
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
            <GoldButton disabled={!referralLink} onClick={() => copyToClipboard(referralLink, 'Referral link copied')}>
              <Copy className="h-4 w-4" />
              Copy Referral Link
            </GoldButton>
          </div>
        </div>
      </SectionCard>

      {/* Direct Income Event Log Table */}
      <div ref={tableRef}>
        <SectionCard
          title="Direct Income Event Log"
          subtitle="Real-time direct referral income fetched from BSC Testnet contract events"
          icon={<FileText className="h-4 w-4" />}
          rightSlot={
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center rounded-full border border-[#0755E8]/25 bg-white p-1">
                <button
                  type="button"
                  onClick={() => setTab('logs')}
                  className={`rounded-full px-3 py-1 text-xs font-bold cursor-pointer ${
                    tab === 'logs' ? 'hana-nav-active text-[#061B50]' : 'text-[#0645C5]'
                  }`}
                >
                  Income Logs ({directIncomeEvents.length})
                </button>
                <button
                  type="button"
                  onClick={() => setTab('referrals')}
                  className={`rounded-full px-3 py-1 text-xs font-bold cursor-pointer ${
                    tab === 'referrals' ? 'hana-nav-active text-[#061B50]' : 'text-[#0645C5]'
                  }`}
                >
                  Direct Referrals ({directReferrals.length})
                </button>
              </div>
              <BlueButton
                onClick={refetchDirectIncome}
                disabled={!walletConnected || directIncomeLoading}
              >
                <RefreshCw className={`h-3.5 w-3.5 ${directIncomeLoading ? 'animate-spin' : ''}`} />
                Refresh
              </BlueButton>
            </div>
          }
        >
          {!walletConnected ? (
            <div className="rounded-xl border border-dashed border-[#0755E8]/25 bg-white/70 p-6 text-center">
              <p className="text-sm font-semibold text-[#032B91]">Connect your wallet to view direct income and referrals.</p>
              <BlueButton className="mt-3" onClick={connectWallet}>Connect Wallet</BlueButton>
            </div>
          ) : directIncomeLoading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-sm font-semibold text-[#0645C5]" role="status">
              <RefreshCw className="h-4 w-4 animate-spin" />
              Loading direct income and referral history...
            </div>
          ) : directIncomeError ? (
            <div className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-800" role="alert">
              <p>Could not load direct income history: {directIncomeError}</p>
              <BlueButton className="mt-3" onClick={refetchDirectIncome}>Try Again</BlueButton>
            </div>
          ) : tab === 'logs' ? directIncomeEvents.length === 0 ? (
            <p className="rounded-xl border border-dashed border-[#0755E8]/25 bg-white/70 p-6 text-center text-sm text-[#0645C5]">
              No direct income events yet. Rewards from your direct referrals will appear here.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[740px] text-left text-xs">
                <thead>
                  <tr className="border-b border-[#0755E8]/15 text-[#0645C5]">
                    <th className="py-2.5 pr-3 font-bold">From Member</th>
                    <th className="py-2.5 pr-3 font-bold">Stake Amount</th>
                    <th className="py-2.5 pr-3 font-bold">Package</th>
                    <th className="py-2.5 pr-3 font-bold">Your Income (5%)</th>
                    <th className="py-2.5 pr-3 font-bold">HANA Credited</th>
                    <th className="py-2.5 pr-3 font-bold">Date &amp; Time</th>
                    <th className="py-2.5 font-bold">Transaction</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#0755E8]/10">
                  {directIncomeEvents.map((ev) => (
                    <tr key={ev.id} className="hover:bg-[#EAF4FF]/60">
                      <td className="py-3 pr-3 font-mono font-bold text-[#032B91]">
                        {formatShortAddress(ev.fromMember)}
                      </td>
                      <td className="py-3 pr-3 font-bold tabular-nums">
                        ${ev.stakeAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} 
                      </td>
                      <td className="py-3 pr-3">
                        <PackageBadge tier={ev.packageTier} />
                      </td>
                      <td className="py-3 pr-3 font-extrabold text-emerald-600 tabular-nums">
                        +${ev.usdtIncome.toFixed(2)} 
                      </td>
                      <td className="py-3 pr-3 font-extrabold text-[#D89500] tabular-nums">
                        +{ev.hanaCredited.toFixed(2)} HANA
                      </td>
                      <td className="py-3 pr-3 text-[#032B91]/80 tabular-nums">{ev.date}</td>
                      <td className="py-3">
                        <TxHashChip hash={ev.txHash} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : directReferrals.length === 0 ? (
            <p className="rounded-xl border border-dashed border-[#0755E8]/25 bg-white/70 p-6 text-center text-sm text-[#0645C5]">
              No direct referrals registered yet. Wallets that register using your referral link will appear here.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-left text-xs">
                <thead>
                  <tr className="border-b border-[#0755E8]/15 text-[#0645C5]">
                    <th className="py-2.5 pr-3 font-bold">Member Wallet</th>
                    <th className="py-2.5 pr-3 font-bold">Registered Date</th>
                    <th className="py-2.5 font-bold">Registration Transaction</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#0755E8]/10">
                  {directReferrals.map((member) => (
                    <tr key={member.txHash} className="hover:bg-[#EAF4FF]/60">
                      <td className="py-3 pr-3 font-mono font-bold text-[#032B91]">{formatShortAddress(member.userAddress)}</td>
                      <td className="py-3 pr-3 text-[#032B91]/80">{member.dateFormatted}</td>
                      <td className="py-3">
                        <TxHashChip hash={member.txHash} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>
      </div>

      {/* About Direct Income Info Banner */}
      <SectionCard>
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0755E8] text-white shadow">
              <Info className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display text-sm font-extrabold text-[#032B91]">About Direct Income</h3>
              <p className="mt-0.5 text-xs font-medium text-[#0645C5] sm:text-sm">
                Earn 5% USDT and matching HANA tokens from your direct referrals&apos; staking activities. Rewards are
                credited automatically on-chain.
              </p>
            </div>
          </div>
          <img
            src={HANA_IMAGES.goldCoinsStack}
            alt="HANA Direct Rewards"
            referrerPolicy="no-referrer"
            className="h-16 w-24 shrink-0 rounded-xl object-cover border border-[#FFB800]/50"
          />
        </div>
      </SectionCard>
    </div>
  );
}
