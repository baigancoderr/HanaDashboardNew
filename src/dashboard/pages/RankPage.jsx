import React, { useState } from 'react';
import {
  Award,
  Handshake,
  Star,
  Network,
  Coins,
  Target,
  Crown,
  Scale,
  CheckCircle2,
  BarChart3,
  LayoutGrid,
  Table2,
  Copy,
  Users,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import { RANK_TIERS, useHana, formatShortAddress } from '../context/HanaContext';
import { HANA_IMAGES } from '../assets/images';
import {
  HeroBanner,
  PackageBadge,
  ProgressBar,
  SectionCard,
  StatCard,
  StatusBadge,
  TxHashChip,
} from '../components/common/UiPrimitives';
import { RankMedalIcon } from '../components/common/Icons3D';

const formatUsd = (amount) =>
  `$${(Number(amount) || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export function RankPage() {
  const {
    directLegs,
    currentRank,
    currentRankName,
    nextRank,
    rankProgress,
    matchingBusiness,
    strongLegBusiness,
    weakLegBusiness,
    totalStaked,
    teamMembers,
    transactions,
    copyToClipboard,
  } = useHana();
  const [filter, setFilter] = useState('All Ranks');
  const [structureView, setStructureView] = useState('cards');
  const [detailsTab, setDetailsTab] = useState('legs-balance');

  const rankIncomeTotal = (transactions || [])
    .filter((t) => t.type === 'Rank Reward')
    .reduce((sum, t) => sum + (Number(t.amountUsd) || 0), 0);

  const rankProgressById = new Map((rankProgress || []).map((rank) => [rank.id, rank]));
  const ranksWithProgress = RANK_TIERS.map((rank) => {
    const progress = rankProgressById.get(rank.no);
    const isAchieved = Boolean(progress?.isAchieved);
    return {
      ...rank,
      status: isAchieved ? (currentRank?.id === rank.no ? 'Current' : 'Achieved') : 'Upcoming',
      progress: progress?.overallProgressPct ?? 0,
    };
  });

  const filteredRanks = ranksWithProgress.filter((r) => {
    if (filter === 'Achieved') return r.status === 'Achieved' || r.status === 'Current';
    if (filter === 'Upcoming') return r.status === 'Upcoming';
    return true;
  });

  const totalDirectStake = directLegs.reduce((sum, leg) => sum + (Number(leg.directStake) || 0), 0);
  const totalDownlineBusiness = directLegs.reduce((sum, leg) => sum + (Number(leg.downlineBusiness) || 0), 0);
  const totalCombinedLegBusiness = directLegs.reduce((sum, leg) => sum + (Number(leg.totalLegBusiness) || 0), 0);
  const totalLegMembers = directLegs.reduce((sum, leg) => sum + (Number(leg.teamMembers) || 0), 0);
  const activeDirectLegCount = directLegs.filter((leg) => leg.isActiveLeg).length;

  const validDirects = (teamMembers || []).filter((m) => m.level === 1).length;

  const getTierProgress = (rank) => rank.progress;

  // Real strong/weak leg percentages
  const totalLegVolume = (strongLegBusiness || 0) + (weakLegBusiness || 0);
  const strongPct = totalLegVolume > 0 ? Math.round((strongLegBusiness / totalLegVolume) * 100) : 0;
  const weakPct = totalLegVolume > 0 ? 100 - strongPct : 0;

  // Next rank milestone progress details
  const nextRankMatchingBiz = nextRank?.matchingBusiness || 0;
  const nextRankPct = nextRank?.overallProgressPct ?? 100;
  const nextRankDirectTeam = nextRank?.directTeam || 0;
  const nextRankSelf = nextRank?.selfContribution || 0;

  return (
    <div className="space-y-5">
      <HeroBanner
        title="Rank &"
        highlight="Incentives"
        subtitle="Achieve higher ranks and earn weekly leadership rewards across qualified legs"
        imageSrc={HANA_IMAGES.bannerRank}
        imageAlt="HANA Rank and Incentives Crown"
      />

      {/* 5 KPI Cards Row */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          icon={<Award className="h-5 w-5" />}
          label="Current Rank"
          value={currentRankName || 'Genesis'}
          subtext="Active Tier"
          goldAccent
        />
        <StatCard
          icon={<Handshake className="h-5 w-5" />}
          label="Matching Business"
          value={`$${(matchingBusiness || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
        />
        <StatCard
          icon={<Star className="h-5 w-5" />}
          label="Strong Leg Business"
          value={`$${(strongLegBusiness || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
        />
        <StatCard
          icon={<Network className="h-5 w-5" />}
          label="Weak Leg(s) Business"
          value={`$${(weakLegBusiness || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
        />
        <StatCard
          icon={<Coins className="h-5 w-5" />}
          label="Rank Income"
          value={`$${rankIncomeTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          goldAccent
        />
      </div>

      {/* Rank Achievement Status & Next Milestone Target */}
      <SectionCard>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="space-y-3 lg:col-span-4">
            <h2 className="font-display text-base font-bold text-[#032B91]">Your Rank Achievement Status</h2>
            <div className="flex items-center gap-4">
              <RankMedalIcon tier={currentRankName || 'Bronze'} size={84} />
              <div className="space-y-1">
                <span className="inline-block rounded-full bg-[#032B91] px-2.5 py-0.5 text-[11px] font-bold text-[#FFE98A]">
                  Current Rank
                </span>
                <p className="font-display text-2xl font-extrabold text-[#061B50]">{currentRankName || 'Genesis'}</p>
                <p className="text-xs font-bold text-[#0645C5]">
                  {currentRank ? `$${currentRank.weeklyReward} / Week · ${currentRank.qualificationPeriod}` : 'Starting Tier'}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4 lg:col-span-8">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-2 font-display text-base font-bold text-[#032B91]">
                <Target className="h-5 w-5 text-red-500" />
                Next Milestone Target ({nextRank?.name || 'Max Rank'})
              </span>
            </div>
            <ProgressBar percent={nextRankPct} variant="gold" height="h-4" />

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl border border-[#0755E8]/20 bg-white/90 p-3 text-center">
                <p className="text-xs font-semibold text-[#0645C5]">Self</p>
                <p className="mt-1 font-display text-sm font-extrabold text-[#061B50] tabular-nums">
                  ${(totalStaked || 0).toLocaleString()} / ${(nextRankSelf || 0).toLocaleString()}
                </p>
              </div>
              <div className="rounded-xl border border-[#0755E8]/20 bg-white/90 p-3 text-center">
                <p className="text-xs font-semibold text-[#0645C5]">Direct Team</p>
                <p className="mt-1 font-display text-sm font-extrabold text-[#061B50] tabular-nums">
                  {validDirects} / {nextRankDirectTeam || '—'}
                </p>
              </div>
              <div className="rounded-xl border border-[#0755E8]/20 bg-white/90 p-3 text-center">
                <p className="text-xs font-semibold text-[#0645C5]">Matching Business</p>
                <p className="mt-1 font-display text-sm font-extrabold text-[#061B50] tabular-nums">
                  ${(matchingBusiness || 0).toLocaleString()} / ${(nextRankMatchingBiz || 0).toLocaleString()}
                </p>
              </div>
              <div className="rounded-xl border border-[#0755E8]/20 bg-white/90 p-3 text-center">
                <p className="text-xs font-semibold text-[#0645C5]">Leg Rank Criteria</p>
                <p className="mt-1 font-display text-sm font-extrabold text-[#061B50] tabular-nums">
                  {directLegs.length} / {nextRank ? nextRank.requiredLegs : '—'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Enhanced Rank Achievement Structure */}
      <SectionCard
        title="Rank Achievement Structure"
        subtitle="5 progressive leadership tiers with weekly USDT rewards and multi-leg matching targets"
        icon={<Crown className="h-4 w-4" />}
        rightSlot={
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 rounded-full border border-[#0755E8]/25 bg-white p-1">
              {['All Ranks', 'Achieved', 'Upcoming'].map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setFilter(tab)}
                  className={`rounded-full px-3 py-1 text-xs font-bold transition whitespace-nowrap shrink-0 cursor-pointer ${
                    filter === tab
                      ? 'hana-nav-active text-[#061B50]'
                      : 'text-[#0645C5] hover:bg-[#EAF4FF]'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1 rounded-full border border-[#0755E8]/25 bg-white p-1">
              <button
                type="button"
                onClick={() => setStructureView('cards')}
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold transition whitespace-nowrap shrink-0 cursor-pointer ${
                  structureView === 'cards'
                    ? 'bg-[#0755E8] text-white shadow-xs'
                    : 'text-[#0645C5] hover:bg-[#EAF4FF]'
                }`}
                aria-label="Cards view"
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                Cards
              </button>
              <button
                type="button"
                onClick={() => setStructureView('table')}
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold transition whitespace-nowrap shrink-0 cursor-pointer ${
                  structureView === 'table'
                    ? 'bg-[#0755E8] text-white shadow-xs'
                    : 'text-[#0645C5] hover:bg-[#EAF4FF]'
                }`}
                aria-label="Table view"
              >
                <Table2 className="h-3.5 w-3.5" />
                Table
              </button>
            </div>
          </div>
        }
      >
        {structureView === 'cards' ? (
          <div className="space-y-3.5">
            {filteredRanks.map((r) => {
              const isCurrent = r.status === 'Current';
              const isAchieved = r.status === 'Achieved';
              const pct = getTierProgress(r);
              return (
                <div
                  key={r.no}
                  className={`relative overflow-hidden rounded-2xl border p-4 transition-all ${
                    isCurrent
                      ? 'border-[#FFB800] bg-gradient-to-r from-[#FFFDF2] via-[#FFF6D4] to-[#FFFFFF] shadow-[0_8px_24px_rgba(255,184,0,0.18)]'
                      : isAchieved
                      ? 'border-emerald-300/80 bg-gradient-to-r from-[#F3FDF8] to-white'
                      : 'border-[#0755E8]/20 bg-white/95 hover:border-[#0755E8]/45'
                  }`}
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    {/* Rank Tier Header */}
                    <div className="flex items-center gap-3.5 lg:w-[250px] shrink-0">
                      <RankMedalIcon tier={r.name} size={46} />
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-display text-base font-extrabold text-[#061B50]">{r.name}</h3>
                          <StatusBadge status={r.status} />
                        </div>
                        <p className="mt-0.5 text-xs font-semibold text-[#0645C5]">
                          Duration: {r.qualificationPeriod}
                        </p>
                      </div>
                    </div>

                    {/* 4 Qualification Requirements with Hairline Dividers */}
                    <div className="grid flex-1 grid-cols-2 gap-3 border-y border-[#0755E8]/12 py-3 sm:grid-cols-4 lg:border-y-0 lg:border-x lg:px-5 lg:py-0">
                      <div>
                        <p className="text-[11px] font-semibold text-[#0645C5]/80">Self</p>
                        <p className="mt-0.5 font-display text-sm font-extrabold text-[#061B50] tabular-nums">
                          ${r.selfContribution.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold text-[#0645C5]/80">Direct Team</p>
                        <p className="mt-0.5 font-display text-sm font-extrabold text-[#061B50] tabular-nums">
                          {r.directTeam} Members
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold text-[#0645C5]/80">Required Legs</p>
                        <p className="mt-0.5 font-display text-sm font-extrabold text-[#061B50] tabular-nums">
                          {r.requiredLegs} Active Legs
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold text-[#0645C5]/80">Matching Business</p>
                        <p className="mt-0.5 font-display text-sm font-extrabold text-[#032B91] tabular-nums">
                          ${r.matchingBusiness.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {/* Weekly Reward + Tier Progress */}
                    <div className="flex flex-col gap-2 lg:w-[220px] shrink-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[11px] font-semibold text-[#0645C5]/80">Weekly Reward</p>
                        <p className="font-display text-base font-extrabold text-emerald-700 tabular-nums">
                          ${r.weeklyReward.toLocaleString()}
                          <span className="text-xs font-bold text-[#0645C5]"> / wk</span>
                        </p>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <p className="text-[11px] font-semibold text-[#0645C5]/80">Progress</p>
                          <span className="text-[11px] font-extrabold text-[#032B91] tabular-nums">{pct}%</span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-[#DCEBFF]">
                          <div
                            className={`h-full rounded-full ${
                              isAchieved
                                ? 'bg-emerald-500'
                                : isCurrent || r.name === 'Gold'
                                ? 'hana-progress-gold'
                                : 'hana-progress-blue'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px] text-left text-xs">
              <thead>
                <tr className="border-b border-[#0755E8]/15 text-[#0645C5]">
                  <th className="py-2.5 pr-3 font-bold">No.</th>
                  <th className="py-2.5 pr-3 font-bold">Rank</th>
                  <th className="py-2.5 pr-3 font-bold">Self</th>
                  <th className="py-2.5 pr-3 font-bold">Direct Team</th>
                  <th className="py-2.5 pr-3 font-bold">Required Legs</th>
                  <th className="py-2.5 pr-3 font-bold">Matching Business</th>
                  <th className="py-2.5 pr-3 font-bold">Qualification</th>
                  <th className="py-2.5 pr-3 font-bold">Weekly Reward</th>
                  <th className="py-2.5 font-bold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#0755E8]/10">
                {filteredRanks.map((r) => (
                  <tr
                    key={r.no}
                    className={
                      r.status === 'Current'
                        ? 'bg-gradient-to-r from-[#FFF7D6] via-[#FFF0B3] to-[#FFF7D6] font-bold'
                        : 'hover:bg-[#EAF4FF]/60'
                    }
                  >
                    <td className="py-3 pr-3 font-bold text-[#032B91] tabular-nums">{r.no}</td>
                    <td className="py-3 pr-3">
                      <div className="flex items-center gap-2 font-bold text-[#061B50]">
                        <RankMedalIcon tier={r.name} size={24} />
                        <span>{r.name}</span>
                      </div>
                    </td>
                    <td className="py-3 pr-3 font-bold tabular-nums">${r.selfContribution.toLocaleString()}</td>
                    <td className="py-3 pr-3 font-bold tabular-nums">{r.directTeam}</td>
                    <td className="py-3 pr-3 font-bold tabular-nums">{r.requiredLegs} Legs</td>
                    <td className="py-3 pr-3 font-bold tabular-nums">${r.matchingBusiness.toLocaleString()}</td>
                    <td className="py-3 pr-3 font-semibold">{r.qualificationPeriod}</td>
                    <td className="py-3 pr-3 font-extrabold text-[#032B91] tabular-nums">
                      ${r.weeklyReward.toLocaleString()}
                    </td>
                    <td className="py-3">
                      <StatusBadge status={r.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      {/* Rank Details Tabbed Section: Strong Leg & Weak Leg Business + Direct Legs Business Breakdown */}
      <SectionCard
        title="Rank Details"
        subtitle="Inspect your Strong & Weak Leg balance and individual Direct Partner leg performance"
        icon={<Scale className="h-4 w-4" />}
        rightSlot={
          <div
            role="tablist"
            aria-label="Rank Details Tabs"
            className="flex flex-wrap items-center gap-1 rounded-full border border-[#0755E8]/25 bg-white p-1"
          >
            <button
              type="button"
              role="tab"
              aria-selected={detailsTab === 'legs-balance'}
              onClick={() => setDetailsTab('legs-balance')}
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition whitespace-nowrap shrink-0 cursor-pointer ${
                detailsTab === 'legs-balance'
                  ? 'hana-nav-active text-[#061B50]'
                  : 'text-[#0645C5] hover:bg-[#EAF4FF]'
              }`}
            >
              <Scale className="h-3.5 w-3.5" />
              Strong &amp; Weak Leg Business
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={detailsTab === 'direct-breakdown'}
              onClick={() => setDetailsTab('direct-breakdown')}
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition whitespace-nowrap shrink-0 cursor-pointer ${
                detailsTab === 'direct-breakdown'
                  ? 'hana-nav-active text-[#061B50]'
                  : 'text-[#0645C5] hover:bg-[#EAF4FF]'
              }`}
            >
              <BarChart3 className="h-3.5 w-3.5" />
              Direct Legs Business Breakdown
            </button>
          </div>
        }
      >
        {detailsTab === 'legs-balance' ? (
          <div role="tabpanel" className="space-y-5">
            {/* Top 3 Summary Metrics */}
            <div className="grid grid-cols-1 divide-y divide-[#0755E8]/12 rounded-2xl border border-[#0755E8]/15 bg-white/90 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
              <div className="p-4">
                <p className="text-xs font-semibold text-[#0645C5]">Total Matching Business</p>
                <p className="mt-1 font-display text-2xl font-extrabold text-[#061B50] tabular-nums">
                  ${(matchingBusiness || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
                <p className="mt-0.5 text-[11px] font-semibold text-emerald-700">
                  {currentRank ? `Eligible for ${currentRankName} Weekly Reward ($${currentRank.weeklyReward}/wk)` : 'Stake & build team to qualify'}
                </p>
              </div>
              <div className="p-4">
                <p className="text-xs font-semibold text-[#0645C5]">Active Direct Legs</p>
                <p className="mt-1 flex items-center gap-1.5 font-display text-2xl font-extrabold text-emerald-700 tabular-nums">
                  <CheckCircle2 className="h-5 w-5" /> {activeDirectLegCount} / 2
                </p>
                <p className="mt-0.5 text-[11px] font-semibold text-[#0645C5]/80">
                  Minimum 2 active direct legs required
                </p>
              </div>
              <div className="p-4">
                <p className="text-xs font-semibold text-[#0645C5]">2-Leg Qualification Rule</p>
                <p className="mt-1 flex items-center gap-1.5 font-display text-2xl font-extrabold text-emerald-700">
                  <ShieldCheck className="h-5 w-5" /> {activeDirectLegCount >= 2 ? 'Qualified' : 'Not Yet'}
                </p>
                <p className="mt-0.5 text-[11px] font-semibold text-[#0645C5]/80">
                  {strongPct}% Strong Leg · {weakPct}% Weak Leg(s)
                </p>
              </div>
            </div>

            {/* Strong Leg vs Weak Leg Side-by-Side Breakdown */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-[#FFB800]/60 bg-gradient-to-br from-[#FFFDF4] to-[#FFF4CE] p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#FFE98A] to-[#FFB800] text-[#061B50] shadow-xs">
                      <Star className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#D89500]">Primary Power Line</p>
                      <h3 className="font-display text-base font-extrabold text-[#061B50]">Strong Leg Business</h3>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-xl font-extrabold text-[#061B50] tabular-nums">
                      {formatUsd(strongLegBusiness)}
                    </p>
                    <p className="text-[11px] font-bold text-[#D89500] tabular-nums">{strongPct}% of Volume</p>
                  </div>
                </div>
                <ProgressBar percent={strongPct} variant="gold" height="h-3.5" />
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs font-semibold text-[#032B91]">
                  <span>Partner: <span className="font-mono">{formatShortAddress(directLegs[0]?.directPartner) || '—'}</span></span>
                  <span>{directLegs[0]?.teamMembers ?? 0} Team Members · {directLegs[0]?.legRank || '—'}</span>
                </div>
              </div>

              <div className="rounded-2xl border border-[#0755E8]/25 bg-gradient-to-br from-[#F5F9FF] to-[#E6F1FF] p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#168BFF] to-[#032B91] text-white shadow-xs">
                      <TrendingUp className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#0755E8]">Matching Growth Line</p>
                      <h3 className="font-display text-base font-extrabold text-[#061B50]">Weak Leg(s) Business</h3>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-xl font-extrabold text-[#061B50] tabular-nums">
                      {formatUsd(weakLegBusiness)}
                    </p>
                    <p className="text-[11px] font-bold text-[#0755E8] tabular-nums">{weakPct}% of Volume</p>
                  </div>
                </div>
                <ProgressBar percent={weakPct} variant="blue" height="h-3.5" />
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs font-semibold text-[#032B91]">
                  <span>Partner: <span className="font-mono">{formatShortAddress(directLegs[1]?.directPartner) || '—'}</span></span>
                  <span>{directLegs[1]?.teamMembers ?? 0} Team Members · {directLegs[1]?.legRank || '—'}</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div role="tabpanel" className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[780px] text-left text-xs">
                <thead>
                  <tr className="border-b border-[#0755E8]/15 text-[#0645C5]">
                    <th className="py-2.5 pr-3 font-bold">Leg Role</th>
                    <th className="py-2.5 pr-3 font-bold">Direct Partner</th>
                    <th className="py-2.5 pr-3 font-bold">Direct Stake</th>
                    <th className="py-2.5 pr-3 font-bold">Downline Business</th>
                    <th className="py-2.5 pr-3 font-bold">Total Leg Business</th>
                    <th className="py-2.5 pr-3 font-bold">Leg Rank</th>
                    <th className="py-2.5 pr-3 font-bold">Team Members</th>
                    <th className="py-2.5 font-bold">Reg Tx</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#0755E8]/10">
                  {directLegs.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center font-semibold text-[#0645C5]">
                        No direct legs registered yet.
                      </td>
                    </tr>
                  ) : directLegs.map((leg) => {
                    const sharePct =
                      totalCombinedLegBusiness > 0
                        ? Math.round((leg.totalLegBusiness / totalCombinedLegBusiness) * 100)
                        : 0;
                    return (
                      <tr key={leg.id} className="hover:bg-[#EAF4FF]/60">
                        <td className="py-3 pr-3 font-bold text-[#032B91]">{leg.role}</td>
                        <td className="py-3 pr-3">
                          <div className="inline-flex items-center gap-1.5 font-mono font-semibold text-[#061B50]">
                            <span>{formatShortAddress(leg.directPartner)}</span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(leg.directPartner, 'Partner address copied')}
                              className="text-[#0755E8] hover:text-[#032B91] cursor-pointer"
                              aria-label="Copy direct partner address"
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                        <td className="py-3 pr-3 font-bold tabular-nums">{formatUsd(leg.directStake)}</td>
                        <td className="py-3 pr-3 font-bold tabular-nums">{formatUsd(leg.downlineBusiness)}</td>
                        <td className="py-3 pr-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-emerald-700 tabular-nums">
                                {formatUsd(leg.totalLegBusiness)}
                              </span>
                              <span className="text-[11px] font-bold text-[#0645C5] tabular-nums">({sharePct}%)</span>
                            </div>
                            <div className="h-1.5 w-28 overflow-hidden rounded-full bg-[#DCEBFF]">
                              <div
                                className={leg.role === 'Strong Leg' ? 'hana-progress-gold h-full' : 'hana-progress-blue h-full'}
                                style={{ width: `${sharePct}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-3 pr-3">
                          <PackageBadge tier={leg.legRank} />
                        </td>
                        <td className="py-3 pr-3 font-bold tabular-nums">
                          <span className="inline-flex items-center gap-1">
                            <Users className="h-3.5 w-3.5 text-[#0755E8]" />
                            {leg.teamMembers}
                          </span>
                        </td>
                        <td className="py-3">
                          <TxHashChip hash={leg.regTx} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-[#0755E8]/20 bg-[#F5F9FF] text-xs font-extrabold text-[#032B91]">
                    <td className="py-3 pr-3" colSpan={2}>
                      Total Across {directLegs.length} Direct Legs
                    </td>
                    <td className="py-3 pr-3 tabular-nums">{formatUsd(totalDirectStake)}</td>
                    <td className="py-3 pr-3 tabular-nums">{formatUsd(totalDownlineBusiness)}</td>
                    <td className="py-3 pr-3 text-emerald-700 tabular-nums">
                      {formatUsd(totalCombinedLegBusiness)}
                    </td>
                    <td className="py-3 pr-3 text-[#0645C5]">—</td>
                    <td className="py-3 pr-3 tabular-nums">{totalLegMembers}</td>
                    <td className="py-3 text-[#0645C5]">Verified</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
