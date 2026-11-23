import React, { useState, useMemo } from 'react';
import {
  Users,
  TrendingUp,
  ShieldCheck,
  Crown,
  Search,
  RefreshCw,
  Copy,
  Info,
  Coins,
  Calendar,
  X,
} from 'lucide-react';
import { useHana, formatShortAddress } from '../context/HanaContext';
import { HANA_IMAGES } from '../assets/images';
import {
  GoldButton,
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

export function MyTeamPage() {
  const { teamMembers, copyToClipboard, showToast } = useHana();
  const [selectedLevel, setSelectedLevel] = useState(1);
  const [query, setQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState('');

  const levelCounts = useMemo(() => {
    const counts = {};
    (teamMembers || []).forEach((m) => {
      counts[m.level] = (counts[m.level] || 0) + 1;
    });
    return counts;
  }, [teamMembers]);

  const filteredMembers = (teamMembers || []).filter((m) => {
    const matchesLevel =
      selectedLevel === 'all' || query.trim() ? true : m.level === selectedLevel;
    const q = query.trim().toLowerCase();
    const matchesQuery =
      !q || (m.wallet && m.wallet.toLowerCase().includes(q)) || (m.sponsor && m.sponsor.toLowerCase().includes(q));
    const joinedIso = toIsoDate(m.joined);
    const matchesDate = !selectedDate || joinedIso === selectedDate;
    return matchesLevel && matchesQuery && matchesDate;
  });

  const totalAllLevelCount = (teamMembers || []).length;
  const levelMemberCount = filteredMembers.length;
  const levelBusiness = filteredMembers.reduce((sum, m) => sum + (Number(m.totalBusiness) || 0), 0);
  const totalTeamBusiness = (teamMembers || []).reduce((sum, m) => sum + (Number(m.totalBusiness) || 0), 0);
  const activeStakersCount = (teamMembers || []).filter((m) => (Number(m.totalBusiness) || 0) > 0).length;
  const validDirectsCount = (teamMembers || []).filter((m) => m.level === 1).length;
  const daoMembersCount = (teamMembers || []).filter((m) => m.isDao).length;

  const hasDateFilter = Boolean(selectedDate);

  return (
    <div className="space-y-5">
      <HeroBanner
        title="Build Your Team •"
        highlight="Grow Together"
        subtitle="Track your HANA network across 20 levels with transparent on-chain attribution"
        imageSrc={HANA_IMAGES.bannerNetwork}
        imageAlt="HANA 20-Level Referral Network"
      />

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={<Users className="h-6 w-6" />}
          label="Total Team (All Levels)"
          value={String(totalAllLevelCount)}
          subtext={`${activeStakersCount} active stakers`}
        />
        <StatCard
          icon={<TrendingUp className="h-6 w-6" />}
          label="Total Team Business"
          value={`$${totalTeamBusiness.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          subtext="All levels combined"
          goldAccent
        />
        <StatCard
          icon={<ShieldCheck className="h-6 w-6" />}
          label="Valid Directs"
          value={String(validDirectsCount)}
          subtext="Qualified for level income"
        />
        <StatCard
          icon={<Crown className="h-6 w-6" />}
          label="DAO Members"
          value={String(daoMembersCount)}
          subtext="Across all levels"
          goldAccent
        />
      </div>

      {/* Level Explorer & Members Table */}
      <SectionCard
        title={selectedLevel === 'all' ? 'All Levels Members' : `Level ${selectedLevel} Members`}
        subtitle={`${levelMemberCount} members · $${levelBusiness.toLocaleString('en-US', { minimumFractionDigits: 2 })} USDT total business`}
        icon={<Users className="h-4 w-4" />}
        rightSlot={
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 rounded-full border border-[#0755E8]/30 bg-white px-3.5 py-1.5">
              <Search className="h-4 w-4 text-[#0755E8]" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by wallet or sponsor"
                className="w-40 bg-transparent text-xs font-semibold text-[#061B50] placeholder:text-[#0645C5]/50 focus:outline-none sm:w-48"
              />
            </div>

            {/* Single Date Filter (Joined Date) */}
            <div className="flex items-center gap-1.5 rounded-full border border-[#0755E8]/30 bg-white px-3 py-1">
              <Calendar className="h-3.5 w-3.5 text-[#0755E8] shrink-0" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-xs font-semibold text-[#032B91] focus:outline-none cursor-pointer"
                aria-label="Filter by joined date"
                title="Filter by joined date"
              />
              {hasDateFilter && (
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

            <GoldButton
              onClick={() => showToast('Team Tree Synced', 'Refreshed 20-level downline tree.', 'info')}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </GoldButton>
          </div>
        }
      >
        {/* All Levels + 20 Level Selector Grid (All, L1 - L20) */}
        <div className="mb-4 grid grid-cols-5 gap-1.5 sm:grid-cols-11 xl:grid-cols-[repeat(21,minmax(0,1fr))]">
          <button
            type="button"
            onClick={() => {
              setSelectedLevel('all');
              setQuery('');
            }}
            className={`flex flex-col items-center justify-center rounded-xl border py-1.5 text-center transition cursor-pointer ${
              selectedLevel === 'all' && !query.trim()
                ? 'hana-nav-active border-[#D89500]'
                : 'border-[#0755E8]/20 bg-white/90 text-[#032B91] hover:border-[#0755E8]/55 hover:bg-[#EAF4FF]'
            }`}
          >
            <span className="text-[11px] font-extrabold">All</span>
            <span className="text-[11px] font-bold opacity-85 tabular-nums">{totalAllLevelCount}</span>
          </button>

          {Array.from({ length: 20 }, (_, i) => i + 1).map((lvl) => {
            const count = levelCounts[lvl] ?? 0;
            const active = selectedLevel === lvl && !query.trim();
            return (
              <button
                key={lvl}
                type="button"
                onClick={() => {
                  setSelectedLevel(lvl);
                  setQuery('');
                }}
                className={`flex flex-col items-center justify-center rounded-xl border py-1.5 text-center transition cursor-pointer ${
                  active
                    ? 'hana-nav-active border-[#D89500]'
                    : 'border-[#0755E8]/20 bg-white/90 text-[#032B91] hover:border-[#0755E8]/55 hover:bg-[#EAF4FF]'
                }`}
              >
                <span className="text-[11px] font-extrabold">L{lvl}</span>
                <span className="text-[11px] font-bold opacity-85 tabular-nums">{count}</span>
              </button>
            );
          })}
        </div>

        {/* Summary Chips */}
        <div className="mb-4 flex flex-wrap items-center gap-2.5">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#0755E8]/25 bg-white px-3.5 py-1.5 text-xs font-bold text-[#032B91]">
            <Users className="h-4 w-4 text-[#0755E8]" />
            <span>
              {selectedLevel === 'all' ? 'All Levels' : `Level ${selectedLevel}`} — {levelMemberCount} members
            </span>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#FFB800]/50 bg-[#FFF8DF] px-3.5 py-1.5 text-xs font-bold text-[#061B50]">
            <Coins className="h-4 w-4 text-[#D89500]" />
            <span>
              ${levelBusiness.toLocaleString('en-US', { minimumFractionDigits: 2 })} USDT — business
            </span>
          </div>
          {hasDateFilter && (
            <div className="inline-flex items-center gap-2 rounded-full border border-[#0755E8]/30 bg-[#EAF4FF] px-3.5 py-1.5 text-xs font-bold text-[#032B91]">
              <Calendar className="h-3.5 w-3.5 text-[#0755E8]" />
              <span>Joined: {selectedDate}</span>
            </div>
          )}
        </div>

        {/* Members Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-xs">
            <thead>
              <tr className="border-b border-[#0755E8]/15 text-[#0645C5]">
                <th className="py-2.5 pr-3 font-bold">#</th>
                <th className="py-2.5 pr-3 font-bold">Level</th>
                <th className="py-2.5 pr-3 font-bold">Member Wallet</th>
                <th className="py-2.5 pr-3 font-bold">Sponsor</th>
                <th className="py-2.5 pr-3 font-bold">Status</th>
                <th className="py-2.5 pr-3 font-bold">Total Business</th>
                {/* <th className="py-2.5 pr-3 font-bold">Last Stake</th> */}
                <th className="py-2.5 pr-3 font-bold">Last Package</th>
                <th className="py-2.5 pr-3 font-bold">Joined</th>
                <th className="py-2.5 font-bold">Reg Tx</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#0755E8]/10">
              {filteredMembers.length > 0 ? (
                filteredMembers.map((m, idx) => (
                  <tr key={m.id} className="hover:bg-[#EAF4FF]/60">
                    <td className="py-3 pr-3 font-bold text-[#032B91] tabular-nums">{idx + 1}</td>
                    <td className="py-3 pr-3 font-bold text-[#0755E8] tabular-nums">L{m.level}</td>
                    <td className="py-3 pr-3">
                      <div className="inline-flex items-center gap-1.5 font-mono font-bold text-[#061B50]">
                        <span>{formatShortAddress(m.wallet)}</span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(m.wallet, 'Member wallet copied')}
                          className="text-[#0755E8] hover:text-[#032B91] cursor-pointer"
                          aria-label="Copy member wallet"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                    <td className="py-3 pr-3">
                      <div className="inline-flex items-center gap-1.5 font-mono font-semibold text-[#0645C5]">
                        <span>{formatShortAddress(m.sponsor)}</span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(m.sponsor, 'Sponsor wallet copied')}
                          className="text-[#0755E8] hover:text-[#032B91] cursor-pointer"
                          aria-label="Copy sponsor wallet"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                    <td className="py-3 pr-3">
                      {m.isDao ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-[#D89500] bg-gradient-to-r from-[#FFE98A] to-[#FFB800] px-2.5 py-0.5 text-[11px] font-extrabold text-[#061B50]">
                          <Crown className="h-3 w-3" /> DAO
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-[11px] font-bold text-[#0755E8]">
                          Member
                        </span>
                      )}
                    </td>
                    <td className="py-3 pr-3 font-extrabold text-emerald-700 tabular-nums">
                      ${m.totalBusiness.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    {/* <td className="py-3 pr-3 font-medium text-[#032B91]">{m.lastStake}</td> */}
                    <td className="py-3 pr-3">
                      <PackageBadge tier={m.lastPackage} />
                    </td>
                    <td className="py-3 pr-3 text-[#032B91]/80">{m.joined}</td>
                    <td className="py-3">
                      <TxHashChip hash={m.regTx} />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-xs font-semibold text-[#0645C5]">
                    <div className="flex flex-col items-center gap-2">
                      <span>
                        No registered members found in {selectedLevel === 'all' ? 'All Levels' : `Level ${selectedLevel}`} matching your filter.
                      </span>
                      {(hasDateFilter || query) && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedDate('');
                            setQuery('');
                          }}
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

        <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-[#0645C5]">
          <Info className="h-4 w-4 text-[#0755E8]" />
          <span>
            Showing {filteredMembers.length} of {levelMemberCount} members
            {selectedLevel === 'all' ? ' across All Levels' : ` at Level ${selectedLevel}`}
          </span>
        </div>
      </SectionCard>
    </div>
  );
}
