import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Wallet,
  Coins,
  Users,
  ChevronRight,
  ArrowRight,
  Copy,
  Share2,
  TrendingUp,
  Layers,
  Crown,
  BarChart3,
  Clock,
  Zap,
  Link2,
  UserPlus,
} from 'lucide-react';
import { useHana, formatShortAddress } from '../context/HanaContext';
import { HANA_IMAGES } from '../assets/images';
import {
  GoldButton,
  SectionCard,
  StatCard,
  StatusBadge,
} from '../components/common/UiPrimitives';
import { RankMedalIcon, UsdtBadgeIcon, HanaCoinBadgeIcon } from '../components/common/Icons3D';

export function DashboardPage() {
  const navigate = useNavigate();
  const [hoveredMonthIndex, setHoveredMonthIndex] = useState(null);
  const {
    usdtBalance,
    hanaBalance,
    withdrawableHana,
    totalStaked,
    totalEarned,
    positions,
    transactions,
    directIncomeEvents,
    levelIncomeEvents,
    teamMembers,
    referralLink,
    copyToClipboard,
    currentRank,
    currentRankName,
    nextRank,
    matchingBusiness,
  } = useHana();

  const totalRoiClaimed = positions.reduce((sum, p) => sum + (Number(p.totalClaimed) || 0), 0);
  const validDirects = teamMembers.filter((m) => m.level === 1).length;
  const directIncomeUsd = directIncomeEvents.reduce((sum, e) => sum + (Number(e.usdtIncome) || 0), 0);
  const levelIncomeUsd = levelIncomeEvents.reduce((sum, e) => sum + (Number(e.usdtIncome) || 0), 0);
  const daoEarningsUsd = transactions
    .filter((t) => t.type === 'DAO Stake')
    .reduce((sum, t) => sum + (Number(t.amountUsd) || 0) * 0.025, 0);
  const rankIncomeUsd = transactions
    .filter((t) => t.type === 'Rank Reward')
    .reduce((sum, t) => sum + (Number(t.amountUsd) || 0), 0);
  const rewardBonusUsd = transactions
    .filter((t) => t.type === 'Reward Bonus')
    .reduce((sum, t) => sum + (Number(t.amountUsd) || 0), 0);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join HANA Blockchain MLM',
          text: 'Join my HANA decentralized staking network!',
          url: referralLink,
        });
        return;
      } catch {
        // Fallback to clipboard copy
      }
    }
    copyToClipboard(referralLink, 'Referral link copied to share');
  };

  const totalBreakdown = directIncomeUsd + levelIncomeUsd + rankIncomeUsd + rewardBonusUsd;

  const breakdown = [
    {
      label: 'Direct Income',
      amount: directIncomeUsd,
      pct: totalBreakdown > 0 ? Number(((directIncomeUsd / totalBreakdown) * 100).toFixed(1)) : 0,
      color: '#FFD700',
    },
    {
      label: 'Level Income',
      amount: levelIncomeUsd,
      pct: totalBreakdown > 0 ? Number(((levelIncomeUsd / totalBreakdown) * 100).toFixed(1)) : 0,
      color: '#0755E8',
    },
    {
      label: 'Rank Income',
      amount: rankIncomeUsd,
      pct: totalBreakdown > 0 ? Number(((rankIncomeUsd / totalBreakdown) * 100).toFixed(1)) : 0,
      color: '#F59E0B',
    },
    {
      label: 'Reward & Bonus',
      amount: rewardBonusUsd,
      pct: totalBreakdown > 0 ? Number(((rewardBonusUsd / totalBreakdown) * 100).toFixed(1)) : 0,
      color: '#94A3B8',
    },
  ];

  // Dynamic monthly earnings trend from real transactions
  const chartData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonthIdx = new Date().getMonth();
    const last6 = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(currentMonthIdx - i);
      last6.push({
        month: months[d.getMonth()],
        monthNum: d.getMonth(),
        year: d.getFullYear(),
        direct: 0,
        level: 0,
        roi: 0,
        rank: 0,
        bonus: 0,
      });
    }

    (transactions || []).forEach((tx) => {
      if (!tx.timestamp) return;
      const d = new Date(tx.timestamp * 1000);
      const m = d.getMonth();
      const y = d.getFullYear();
      const slot = last6.find((s) => s.monthNum === m && s.year === y);
      if (!slot) return;
      const amt = Number(tx.amountUsd) || 0;
      if (tx.type === 'Direct Income') slot.direct += amt;
      else if (tx.type === 'Level Income') slot.level += amt;
      else if (tx.type === 'ROI Claim') slot.roi += amt;
      else if (tx.type === 'Rank Reward') slot.rank += amt;
      else if (tx.type === 'Reward Bonus') slot.bonus += amt;
    });

    return last6;
  }, [transactions]);

  const chartW = 420;
  const chartH = 120;
  const padL = 32;
  const padR = 12;
  const padT = 10;
  const padB = 24;
  const innerW = chartW - padL - padR;
  const innerH = chartH - padT - padB;
  const allVals = chartData.flatMap((d) => [d.direct, d.level, d.roi, d.rank, d.bonus]);
  const maxVal = Math.max(10, ...allVals);
  const xStep = innerW / Math.max(1, chartData.length - 1);
  const toX = (i) => padL + i * xStep;
  const toY = (v) => padT + innerH - (v / maxVal) * innerH;
  const makePath = (key) =>
    chartData.map((d, i) => `${i === 0 ? 'M' : 'L'}${toX(i).toFixed(1)},${toY(d[key]).toFixed(1)}`).join(' ');
  const makeArea = (key) =>
    `${makePath(key)} L${toX(chartData.length - 1).toFixed(1)},${(padT + innerH).toFixed(1)} L${padL},${(padT + innerH).toFixed(1)} Z`;
  const lines = [
    { key: 'level', color: '#0755E8', label: 'Level Income' },
    { key: 'direct', color: '#FFD700', label: 'Direct Income' },
    { key: 'roi', color: '#10B981', label: 'ROI Income' },
    { key: 'rank', color: '#F59E0B', label: 'Rank Income' },
    { key: 'bonus', color: '#94A3B8', label: 'Reward & Bonus' },
  ];
  const hoveredMonth = hoveredMonthIndex === null ? null : chartData[hoveredMonthIndex];

  return (
    <div className="space-y-5">
      {/* Hero Banner with Full-Width Panoramic Illustration, Referral Link Box, and Rank Box */}
      <div className="hana-hero-banner relative overflow-hidden rounded-2xl p-5 text-white sm:p-7">
        <img
          src={HANA_IMAGES.bannerDashboard}
          alt="HANA Royal Crown Wealth Podium"
          referrerPolicy="no-referrer"
          className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#032B91]/70 via-[#0436AE]/36 to-transparent sm:w-3/5" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#032B91]/35 via-transparent to-[#032B91]/35" />

        <div className="relative z-10 flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
          <div className="max-w-xl flex-1 space-y-3.5">
            <h1 className="font-display text-2xl font-extrabold tracking-tight text-balance drop-shadow sm:text-4xl">
              Build • Grow • <span className="text-[#FFD700]">Earn</span>
            </h1>

            {/* Referral Link Box */}
            <div className="rounded-2xl border border-white/25 bg-[#032B91]/65 p-3.5 backdrop-blur-md">
              <div className="mb-2 flex items-center gap-2 text-xs font-bold text-[#FFE98A]">
                <Link2 className="h-4 w-4" />
                <span>Your Referral Link</span>
              </div>
              <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
                <div className="flex flex-1 items-center overflow-hidden rounded-xl border border-white/25 bg-white">
                  <input
                    type="text"
                    readOnly
                    value={referralLink}
                    className="w-full bg-transparent px-3 py-2 font-mono text-xs font-bold text-[#032B91] focus:outline-none"
                    aria-label="Your referral link"
                  />
                  <button
                    type="button"
                    onClick={() => copyToClipboard(referralLink, 'Referral link copied')}
                    className="flex h-9 w-10 shrink-0 items-center justify-center bg-[#0755E8] text-white hover:bg-[#0645C5] cursor-pointer"
                    aria-label="Copy referral link"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
                <GoldButton onClick={handleShare} className="px-4 py-2 text-xs sm:text-sm">
                  Share Link <Share2 className="h-3.5 w-3.5" />
                </GoldButton>
                <GoldButton onClick={() => navigate('/dashboard/staking')} className="px-4 py-2 text-xs sm:text-sm">
                  Invest Now →
                </GoldButton>
              </div>
            </div>

            {/* Rank Box right below Referral Link */}
            <div
              onClick={() => navigate('/dashboard/rank')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && navigate('/dashboard/rank')}
              className="flex flex-col gap-3 rounded-2xl border border-[#FFD700]/45 bg-[#032B91]/70 p-3.5 backdrop-blur-md transition hover:border-[#FFD700] cursor-pointer sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-center gap-3">
                <RankMedalIcon tier={currentRankName || "Bronze"} size={44} />
                <div>
                  <p className="text-[11px] font-bold tracking-wide text-[#FFE98A] uppercase">Current Rank</p>
                  <p className="font-display text-lg font-extrabold text-white leading-tight">
                    {currentRankName || 'Genesis'} <span className="text-xs font-semibold text-blue-100">· {currentRank ? `$${currentRank.weeklyReward} / Week` : 'Starting Tier'}</span>
                  </p>
                </div>
              </div>

              <div className="flex-1 sm:max-w-xs space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-blue-100">Next Rank: <strong className="text-[#FFD700]">{nextRank?.name || 'Max Rank'}</strong></span>
                  <span className="text-[#FFE98A] tabular-nums">
                    {nextRank ? `${Math.min(100, Math.round(((matchingBusiness || 0) / nextRank.matchingBusiness) * 100))}%` : '100%'}
                  </span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full border border-white/25 bg-[#061B50]/80 p-0.5">
                  <div
                    className="hana-progress-gold h-full rounded-full"
                    style={{
                      width: `${nextRank ? Math.min(100, Math.round(((matchingBusiness || 0) / nextRank.matchingBusiness) * 100)) : 100}%`,
                    }}
                  />
                </div>
              </div>

              <span className="hidden sm:inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/25 bg-white/10 text-[#FFD700]">
                <ChevronRight className="h-4 w-4" />
              </span>
            </div>

            
          </div>
        </div>
      </div>

      {/* 6 Core Wallet & Staking Metric Boxes */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          icon={<UsdtBadgeIcon size={36} />}
          label="USDT Balance"
          value={`$${usdtBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
          subtext="Wallet balance"
        />
        <StatCard
          icon={<HanaCoinBadgeIcon size={36} />}
          imageSrc={HANA_IMAGES.tokenCoin}
          label="HANA Balance"
          value={hanaBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          subtext="Tokens allotted"
          goldAccent
        />
        <StatCard
          icon={<Layers className="h-6 w-6" />}
          imageSrc={HANA_IMAGES.securityVault}
          label="Total Staked"
          value={`$${totalStaked.toLocaleString('en-US')}`}
          subtext={`${positions.length} active position${positions.length === 1 ? '' : 's'}`}
        />
        <StatCard
          icon={<TrendingUp className="h-6 w-6" />}
          imageSrc={HANA_IMAGES.heroCrownPodium}
          label="Total ROI Claimed"
          value={`$${totalRoiClaimed.toLocaleString('en-US', { maximumFractionDigits: 2 })}`}
          subtext="Direct contract earnings"
          goldAccent
        />
        <StatCard
          icon={<Users className="h-6 w-6" />}
          imageSrc={HANA_IMAGES.networkPyramid}
          label="Valid Directs"
          value={`${validDirects}`}
          subtext="Level qualified members"
        />
        <StatCard
          icon={<HanaCoinBadgeIcon size={36} />}
          imageSrc={HANA_IMAGES.tokenCoin}
          label="Withdrawable Amount"
          value={`${withdrawableHana.toFixed(2)}`}
          subtext="HANA balance"
          goldAccent
        />
      </div>
      {/* All Income Boxes Below Earnings Breakdown */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div
          onClick={() => navigate('/dashboard/direct-income')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && navigate('/dashboard/direct-income')}
          className="cursor-pointer"
        >
          <StatCard
            icon={<UserPlus className="h-6 w-6" />}
            imageSrc={HANA_IMAGES.tokenCoin}
            label="Direct Income"
            value={`$${directIncomeUsd.toLocaleString('en-US', { maximumFractionDigits: 2 })}`}
            subtext="5% direct referral"
            goldAccent
          />
        </div>
        <div
          onClick={() => navigate('/dashboard/level-income')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && navigate('/dashboard/level-income')}
          className="cursor-pointer"
        >
          <StatCard
            icon={<TrendingUp className="h-6 w-6" />}
            imageSrc={HANA_IMAGES.networkPyramid}
            label="Level Income"
            value={`$${levelIncomeUsd.toLocaleString('en-US', { maximumFractionDigits: 2 })}`}
            subtext="Downline ROI matching"
          />
        </div>
        <div
          onClick={() => navigate('/dashboard/dao')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && navigate('/dashboard/dao')}
          className="cursor-pointer"
        >
          <StatCard
            icon={<Crown className="h-6 w-6" />}
            imageSrc={HANA_IMAGES.daoCrest}
            label="DAO Earnings"
            value={`$${daoEarningsUsd.toLocaleString('en-US', { maximumFractionDigits: 2 })}`}
            subtext="Weekly pool share"
            goldAccent
          />
        </div>
      </div>

      {/* Earnings Breakdown Chart + Quick Actions */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <SectionCard
          className="lg:col-span-7"
          title="Earnings Breakdown"
          icon={<BarChart3 className="h-4 w-4" />}
        >
          {/* Legend */}
          <div className="mb-3 flex flex-wrap gap-3">
            {lines.map((l) => (
              <span key={l.key} className="flex items-center gap-1.5 text-xs font-semibold text-[#032B91]">
                <span className="h-2.5 w-5 rounded-full inline-block" style={{ backgroundColor: l.color }} />
                {l.label}
              </span>
            ))}
          </div>

          {/* SVG Line Chart */}
          <div
            className="relative w-full overflow-hidden rounded-xl border border-[#0755E8]/10 bg-gradient-to-br from-white to-[#F5F9FF] p-2"
            onMouseLeave={() => setHoveredMonthIndex(null)}
          >
            {hoveredMonth && (
              <div
                className="pointer-events-none absolute top-2 z-10 w-36 rounded-xl border border-[#0755E8]/15 bg-white/95 p-2.5 shadow-lg backdrop-blur-sm"
                style={{
                  left: `${(toX(hoveredMonthIndex) / chartW) * 100}%`,
                  transform:
                    hoveredMonthIndex === 0
                      ? 'translateX(0)'
                      : hoveredMonthIndex === chartData.length - 1
                      ? 'translateX(-100%)'
                      : 'translateX(-50%)',
                }}
                role="status"
              >
                <p className="text-[10px] font-bold uppercase tracking-wide text-[#0645C5]">{hoveredMonth.month} Earnings</p>
                <p className="mt-0.5 font-display text-sm font-extrabold text-[#061B50] tabular-nums">
                  ${lines.reduce((sum, line) => sum + hoveredMonth[line.key], 0).toLocaleString()}
                </p>
                <div className="mt-1.5 grid grid-cols-2 gap-x-2 gap-y-1">
                  {lines.map((line) => (
                    <span key={line.key} className="flex items-center gap-1 text-[9px] font-semibold text-[#032B91]">
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: line.color }} />
                      {line.label.split(' ')[0]} ${hoveredMonth[line.key]}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <svg
              viewBox={`0 0 ${chartW} ${chartH}`}
              preserveAspectRatio="none"
              className="w-full"
              style={{ height: '140px' }}
            >
              <defs>
                {lines.map((l) => (
                  <linearGradient key={l.key} id={`grad-${l.key}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={l.color} stopOpacity="0.18" />
                    <stop offset="100%" stopColor={l.color} stopOpacity="0" />
                  </linearGradient>
                ))}
              </defs>

              {/* Grid lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((t) => {
                const y = padT + innerH * t;
                return (
                  <line
                    key={t}
                    x1={padL} y1={y.toFixed(1)}
                    x2={chartW - padR} y2={y.toFixed(1)}
                    stroke="#0755E8" strokeOpacity="0.08" strokeWidth="1"
                  />
                );
              })}

              {/* Y-axis labels */}
              {[0, 0.5, 1].map((t) => {
                const v = Math.round(maxVal * (1 - t));
                const y = padT + innerH * t;
                return (
                  <text key={t} x={padL - 4} y={y + 4} textAnchor="end"
                    fontSize="8" fill="#0645C5" fontWeight="600" opacity="0.7">
                    ${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}
                  </text>
                );
              })}

              {/* Area fills */}
              {lines.map((l) => (
                <path key={`area-${l.key}`} d={makeArea(l.key)} fill={`url(#grad-${l.key})`} />
              ))}

              {/* Lines */}
              {lines.map((l) => (
                <path
                  key={`line-${l.key}`}
                  d={makePath(l.key)}
                  fill="none"
                  stroke={l.color}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ))}

              {/* Dots on latest point */}
              {lines.map((l) => {
                const last = chartData[chartData.length - 1];
                return (
                  <circle
                    key={`dot-${l.key}`}
                    cx={toX(chartData.length - 1).toFixed(1)}
                    cy={toY(last[l.key]).toFixed(1)}
                    r="3.5"
                    fill={l.color}
                    stroke="white"
                    strokeWidth="1.5"
                  />
                );
              })}

              {/* X-axis month labels */}
              {chartData.map((d, i) => (
                <text
                  key={d.month}
                  x={toX(i).toFixed(1)}
                  y={padT + innerH + 16}
                  textAnchor="middle"
                  fontSize="8"
                  fill="#0645C5"
                  fontWeight="600"
                  opacity="0.75"
                >
                  {d.month}
                </text>
              ))}

              {chartData.map((d, i) => {
                const left = i === 0 ? padL : toX(i) - xStep / 2;
                const right = i === chartData.length - 1 ? chartW - padR : toX(i) + xStep / 2;
                return (
                  <rect
                    key={`hover-${d.month}`}
                    x={left}
                    y={padT}
                    width={right - left}
                    height={innerH}
                    fill="transparent"
                    onMouseEnter={() => setHoveredMonthIndex(i)}
                    aria-hidden="true"
                  />
                );
              })}

              {hoveredMonth && (
                <>
                  <line
                    x1={toX(hoveredMonthIndex)}
                    y1={padT}
                    x2={toX(hoveredMonthIndex)}
                    y2={padT + innerH}
                    stroke="#0755E8"
                    strokeOpacity="0.35"
                    strokeDasharray="3 3"
                  />
                  {lines.map((line) => (
                    <circle
                      key={`hover-dot-${line.key}`}
                      cx={toX(hoveredMonthIndex)}
                      cy={toY(hoveredMonth[line.key])}
                      r="4"
                      fill={line.color}
                      stroke="white"
                      strokeWidth="1.5"
                    />
                  ))}
                </>
              )}
            </svg>
          </div>

          {/* Summary row */}
          
        </SectionCard>

        <SectionCard
          className="lg:col-span-5"
          title="Quick Actions"
          icon={<Zap className="h-4 w-4" />}
        >
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
            {[
              { label: 'Invest', icon: Coins, to: '/dashboard/staking' },
              { label: 'Withdraw', icon: Wallet, to: '/dashboard/withdraw' },
              { label: 'My Team', icon: Users, to: '/dashboard/team' },
              { label: 'Rank', icon: Crown, to: '/dashboard/rank' },
            ].map((act) => {
              const Icon = act.icon;
              return (
                <button
                  key={act.label}
                  type="button"
                  onClick={() => navigate(act.to)}
                  className="hana-blue-btn flex flex-col items-center justify-center gap-2 rounded-2xl px-3 py-5 text-center cursor-pointer"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 text-[#FFD700]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-bold text-white">{act.label}</span>
                </button>
              );
            })}
          </div>
        </SectionCard>
      </div>

      

      {/* Full-Width Recent Transactions */}
      <SectionCard
        title="Recent Transactions"
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
          <table className="w-full min-w-[680px] text-left text-xs">
            <thead>
              <tr className="border-b border-[#0755E8]/15 text-[#0645C5]">
                <th className="py-2.5 pr-3 font-bold">#</th>
                <th className="py-2.5 pr-3 font-bold">Type</th>
                <th className="py-2.5 pr-3 font-bold">Amount</th>
                <th className="py-2.5 pr-3 font-bold">Details</th>
                <th className="py-2.5 pr-3 font-bold">TX Hash</th>
                <th className="py-2.5 pr-3 font-bold">Date</th>
                <th className="py-2.5 font-bold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#0755E8]/10">
              {transactions.slice(0, 6).map((tx, index) => (
                <tr key={tx.id} className="hover:bg-[#EAF4FF]/60">
                  <td className="py-2.5 pr-3 font-bold text-[#032B91] tabular-nums">{index + 1}</td>
                  <td className="py-2.5 pr-3 font-bold text-[#061B50]">{tx.type}</td>
                  <td className="py-2.5 pr-3 font-extrabold text-emerald-700 tabular-nums">{tx.amountLabel}</td>
                  <td className="py-2.5 pr-3 text-[#0645C5]">{tx.details || 'Smart contract execution'}</td>
                  <td className="py-2.5 pr-3 font-mono text-[#0755E8]">{formatShortAddress(tx.txHash)}</td>
                  <td className="py-2.5 pr-3 text-[#032B91]/80 tabular-nums">{tx.date}</td>
                  <td className="py-2.5">
                    <StatusBadge status={tx.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}