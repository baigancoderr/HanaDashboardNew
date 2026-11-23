import React, { useState, useRef } from 'react';
import {
  TrendingUp,
  Coins,
  Users,
  Layers,
  FileText,
  RefreshCw,
  ArrowRight,
  Calendar,
  X,
} from 'lucide-react';
import { useHana, formatShortAddress } from '../context/HanaContext';
import { HANA_IMAGES } from '../assets/images';
import {
  BlueButton,
  HeroBanner,
  PackageBadge,
  SectionCard,
  StatCard,
  TxHashChip,
} from '../components/common/UiPrimitives';

function toIsoDate(dateStr) {
  const parsed = new Date(dateStr);
  if (Number.isNaN(parsed.getTime())) return '';
  const y = parsed.getFullYear();
  const m = String(parsed.getMonth() + 1).padStart(2, '0');
  const d = String(parsed.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function LevelIncomePage() {
  const { levelIncomeEvents, teamMembers, showToast } = useHana();
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [selectedDate, setSelectedDate] = useState('');
  const logRef = useRef(null);

  const filteredEvents = levelIncomeEvents.filter((e) => {
    const matchesLevel = selectedLevel === 'all' || e.level === selectedLevel;
    const eventIso = toIsoDate(e.date);
    const matchesDate = !selectedDate || eventIso === selectedDate;
    return matchesLevel && matchesDate;
  });

  const filteredUsd = filteredEvents.reduce((sum, e) => sum + e.usdtIncome, 0);
  const filteredHana = filteredEvents.reduce((sum, e) => sum + e.hanaCredited, 0);
  const levelIncomeBreakdown = Array.from(
    filteredEvents.reduce((levels, event) => {
      const level = Number(event.level);
      if (!Number.isInteger(level) || level < 1) return levels;

      const totals = levels.get(level) || { level, usdt: 0, hana: 0, events: 0 };
      totals.usdt += Number(event.usdtIncome) || 0;
      totals.hana += Number(event.hanaCredited) || 0;
      totals.events += 1;
      levels.set(level, totals);
      return levels;
    }, new Map()).values()
  ).sort((a, b) => a.level - b.level);
  const hasActiveFilter = selectedLevel !== 'all' || Boolean(selectedDate);

  const totalLevelUsd = levelIncomeEvents.reduce((sum, e) => sum + (Number(e.usdtIncome) || 0), 0);
  const totalLevelHana = levelIncomeEvents.reduce((sum, e) => sum + (Number(e.hanaCredited) || 0), 0);
  const validDirects = (teamMembers || []).filter((m) => m.level === 1).length;
  const openLevels = Math.min(20, validDirects >= 1 ? 1 + Math.floor(validDirects / 2) : 0);

  const clearFilters = () => {
    setSelectedLevel('all');
    setSelectedDate('');
  };

  return (
    <div className="space-y-5">
      <HeroBanner
        title="Level"
        highlight="Income"
        subtitle="Earn Multi-Level Rewards from Your Network across 20 unlocked levels"
        ctaLabel="View Event Logs →"
        onCtaClick={() => logRef.current?.scrollIntoView({ behavior: 'smooth' })}
        imageSrc={HANA_IMAGES.bannerNetwork}
        imageAlt="HANA Multi-Level Network Rewards"
      />

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={<TrendingUp className="h-6 w-6" />}
          label="Total Level Income"
          value={`$${totalLevelUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
          subtext={`${levelIncomeEvents.length} on-chain income events`}
        />
        <StatCard
          icon={<Coins className="h-6 w-6" />}
          label="HANA Credited"
          value={`${totalLevelHana.toLocaleString('en-US', { minimumFractionDigits: 2 })} HANA`}
          subtext="Across all levels"
          goldAccent
        />
        <StatCard
          icon={<Users className="h-6 w-6" />}
          label="Open Levels"
          value={`${openLevels}`}
          subtext={`Valid directs: ${validDirects}`}
        />
        <StatCard
          icon={<Layers className="h-6 w-6" />}
          label="Income Events"
          value={`${levelIncomeEvents.length}`}
          subtext="Verified on-chain"
          goldAccent
        />
      </div>

      {/* Level Income Event Log */}
      <div ref={logRef}>
        <SectionCard
          title="Level Income Event Log"
          subtitle="Verified level commissions credited to your wallet on BSC Testnet"
          icon={<FileText className="h-4 w-4" />}
          rightSlot={
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                className="rounded-full border border-[#0755E8]/30 bg-white px-3.5 py-1.5 text-xs font-bold text-[#032B91] focus:outline-none cursor-pointer"
                aria-label="Filter level income by level"
              >
                <option value="all">All Levels</option>
                {[1, 2, 3, 4, 5].map((l) => (
                  <option key={l} value={l}>
                    Level {l}
                  </option>
                ))}
              </select>

              {/* Single Date Filter */}
              <div className="flex items-center gap-1.5 rounded-full border border-[#0755E8]/30 bg-white px-3 py-1">
                <Calendar className="h-3.5 w-3.5 text-[#0755E8] shrink-0" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-transparent text-xs font-semibold text-[#032B91] focus:outline-none cursor-pointer"
                  aria-label="Filter by date"
                  title="Filter by date"
                />
                {selectedDate && (
                  <button
                    type="button"
                    onClick={() => setSelectedDate('')}
                    className="ml-0.5 rounded-full p-0.5 text-[#0645C5] hover:bg-[#EAF4FF] cursor-pointer"
                    aria-label="Clear date filter"
                    title="Clear date filter"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              <BlueButton
                onClick={() => showToast('Level Logs Refreshed', 'Queried latest LevelIncomeAllotted events.', 'info')}
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Refresh
              </BlueButton>
            </div>
          }
        >
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#FFB800]/45 bg-[#FFF8DF] px-3.5 py-2 text-xs font-semibold text-[#032B91]">
            <div className="flex items-center gap-2">
              <ArrowRight className="h-4 w-4 shrink-0 text-[#D89500]" />
              <span>
                Showing <strong className="tabular-nums">{filteredEvents.length}</strong> of{' '}
                <strong className="tabular-nums">{levelIncomeEvents.length}</strong> events
                {selectedLevel === 'all' ? ' across All Levels' : ` for Level ${selectedLevel}`}
                {selectedDate && ` on ${selectedDate}`}
              </span>
            </div>
            <div className="flex items-center gap-3 tabular-nums">
              <span className="font-extrabold text-emerald-700">+${filteredUsd.toFixed(2)} USDT</span>
              <span className="font-extrabold text-[#D89500]">+{filteredHana.toFixed(2)} HANA</span>
              {hasActiveFilter && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="font-bold text-[#0755E8] underline hover:text-[#032B91] cursor-pointer"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* {levelIncomeBreakdown.length > 0 && (
            <section className="mb-4" aria-label="Level-wise income totals">
              <h3 className="mb-2 text-sm font-extrabold text-[#032B91]">Income by Level</h3>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {levelIncomeBreakdown.map(({ level, usdt, hana, events }) => (
                  <div key={level} className="rounded-xl border border-[#0755E8]/15 bg-white/80 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-extrabold text-[#032B91]">Level {level}</span>
                      <span className="text-[10px] font-semibold text-[#0645C5]/70">{events} event{events === 1 ? '' : 's'}</span>
                    </div>
                    <p className="mt-1 text-sm font-extrabold text-emerald-700 tabular-nums">
                      +${usdt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT
                    </p>
                    <p className="text-xs font-bold text-[#D89500] tabular-nums">
                      +{hana.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} HANA
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )} */}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-xs">
              <thead>
                <tr className="border-b border-[#0755E8]/15 text-[#0645C5]">
                  <th className="py-2.5 pr-3 font-bold">From Member</th>
                  <th className="py-2.5 pr-3 font-bold">Level</th>
                  <th className="py-2.5 pr-3 font-bold">Downline ROI Claimed</th>
                  <th className="py-2.5 pr-3 font-bold">USDT Income</th>
                  <th className="py-2.5 pr-3 font-bold">HANA Credited</th>
                  <th className="py-2.5 pr-3 font-bold">Date &amp; Time</th>
                  <th className="py-2.5 font-bold">Transaction</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#0755E8]/10">
                {filteredEvents.length > 0 ? (
                  filteredEvents.map((ev) => (
                    <tr key={ev.id} className="hover:bg-[#EAF4FF]/60">
                      <td className="py-3 pr-3 font-mono font-bold text-[#032B91]">
                        {formatShortAddress(ev.fromMember)}
                      </td>
                      <td className="py-3 pr-3">
                        <PackageBadge tier={`Level ${ev.level}`} />
                      </td>
                      <td className="py-3 pr-3 font-bold text-[#032B91] tabular-nums">
                        {Number.isFinite(ev.roiClaimAmount)
                          ? `$${ev.roiClaimAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT`
                          : '—'}
                      </td>
                      <td className="py-3 pr-3 font-extrabold text-emerald-600 tabular-nums">
                        +${ev.usdtIncome.toFixed(2)} USDT
                      </td>
                      <td className="py-3 pr-3 font-extrabold text-[#D89500] tabular-nums">
                        +{ev.hanaCredited.toFixed(2)} HANA
                      </td>
                      <td className="py-3 pr-3 text-[#032B91]/80 tabular-nums">{ev.date}</td>
                      <td className="py-3">
                        <TxHashChip hash={ev.txHash} />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-xs font-semibold text-[#0645C5]">
                      <div className="flex flex-col items-center gap-2">
                        <span>No level income events found for the selected level or date range.</span>
                        {hasActiveFilter && (
                          <button
                            type="button"
                            onClick={clearFilters}
                            className="rounded-full border border-[#0755E8]/30 bg-white px-3.5 py-1 text-xs font-bold text-[#032B91] hover:bg-[#EAF4FF] cursor-pointer"
                          >
                            Clear Filters
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
