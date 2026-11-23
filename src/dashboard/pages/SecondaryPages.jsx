import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package,
  Award,
  Copy,
  Share2,
  FileSpreadsheet,
  Trophy,
  BookOpen,
  HelpCircle,
  Download,
  Send,
  CheckCircle2,
} from 'lucide-react';
import { RANK_TIERS, STAKING_PACKAGES, useHana } from '../context/HanaContext';
import { HANA_IMAGES } from '../assets/images';
import {
  BlueButton,
  ConfirmModal,
  GoldButton,
  HeroBanner,
  PackageBadge,
  SectionCard,
  StatCard,
  StatusBadge,
} from '../components/common/UiPrimitives';
import { RankMedalIcon, ReferralQRCode } from '../components/common/Icons3D';

export function PackagesPage() {
  const { usdtBalance, stakePackage } = useHana();
  const [selected, setSelected] = useState(null);

  return (
    <div className="space-y-5">
      <HeroBanner
        title="HANA"
        highlight="Packages"
        subtitle={`Compare daily yields, 2X capping limits, and duration terms · Balance: $${usdtBalance.toLocaleString()} USDT`}
        imageSrc={HANA_IMAGES.bannerStaking}
        imageAlt="HANA Staking Packages"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {STAKING_PACKAGES.map((pkg) => (
          <SectionCard key={pkg.id} className={pkg.popular ? 'hana-card-gold' : ''}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <RankMedalIcon tier={pkg.tier} size={48} />
                <div>
                  <h3 className="font-display text-lg font-extrabold text-[#032B91]">{pkg.name}</h3>
                  <p className="text-xs font-semibold text-[#0645C5]">{pkg.dailyRate}</p>
                </div>
              </div>
              {pkg.popular && <PackageBadge tier="Popular" />}
            </div>

            <div className="my-4 space-y-2 rounded-xl border border-[#0755E8]/15 bg-white/90 p-3.5 text-xs">
              <div className="flex justify-between">
                <span className="text-[#0645C5]">Stake Amount</span>
                <span className="font-extrabold text-[#061B50] tabular-nums">${pkg.amount.toLocaleString()}.00</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#0645C5]">Daily ROI Rate</span>
                <span className="font-extrabold text-emerald-700 tabular-nums">{pkg.dailyPercent}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#0645C5]">2X Max Cap</span>
                <span className="font-extrabold text-[#032B91] tabular-nums">${(pkg.amount * 2).toLocaleString()}.00</span>
              </div>
            </div>

            <GoldButton onClick={() => setSelected(pkg)} className="w-full">
              <Package className="h-4 w-4" />
              Activate {pkg.name}
            </GoldButton>
          </SectionCard>
        ))}
      </div>

      <ConfirmModal
        open={selected !== null}
        onClose={() => setSelected(null)}
        title={selected ? `Activate ${selected.name} Package` : ''}
        description={selected ? `Stake $${selected.amount.toLocaleString()} USDT with ${selected.dailyPercent}% daily ROI.` : ''}
        confirmLabel="Confirm Stake"
        loadingLabel="Staking..."
        onConfirm={() => selected && stakePackage(selected)}
      />
    </div>
  );
}

export function ReferralPage() {
  const { referralLink, referralCode, copyToClipboard, showToast } = useHana();

  return (
    <div className="space-y-5">
      <HeroBanner
        title="Referral"
        highlight="Program"
        subtitle="Invite partners with your personal referral link or QR code and earn 5% instant direct rewards"
        imageSrc={HANA_IMAGES.bannerNetwork}
        imageAlt="HANA Referral Program"
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <SectionCard className="lg:col-span-7" title="Your Sponsor Link & Code" icon={<Award className="h-4 w-4" />}>
          <div className="space-y-4">
            <div className="rounded-xl border border-[#0755E8]/20 bg-white p-3.5">
              <p className="text-xs font-bold text-[#0645C5]">Sponsor Referral Code</p>
              <p className="mt-1 font-mono text-xl font-extrabold text-[#032B91]">{referralCode}</p>
            </div>
            <div className="flex items-center overflow-hidden rounded-xl border border-[#0755E8]/30 bg-white">
              <input
                type="text"
                readOnly
                value={referralLink}
                className="w-full px-3 py-2.5 font-mono text-xs font-bold text-[#032B91] focus:outline-none"
                aria-label="Referral link"
              />
              <button
                type="button"
                onClick={() => copyToClipboard(referralLink, 'Referral link copied')}
                className="flex h-10 w-10 shrink-0 items-center justify-center bg-[#0755E8] text-white hover:bg-[#0645C5] cursor-pointer"
                aria-label="Copy referral URL"
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              <GoldButton onClick={() => copyToClipboard(referralLink, 'Referral link copied')}>
                <Share2 className="h-4 w-4" />
                Copy &amp; Share Link
              </GoldButton>
              <BlueButton onClick={() => showToast('Invite Template Copied', 'Ready to paste in Telegram or WhatsApp.', 'info')}>
                Copy Invite Message
              </BlueButton>
            </div>
          </div>
        </SectionCard>

        <SectionCard className="lg:col-span-5" title="Scannable Sponsor QR" icon={<Share2 className="h-4 w-4" />}>
          <div className="flex flex-col items-center justify-center gap-3 py-2 text-center">
            <ReferralQRCode value={referralLink} size={156} />
            <p className="text-xs font-semibold text-[#0645C5]">
              New partners scanning this QR automatically bind to your sponsor address.
            </p>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

export function IncomeReportPage() {
  const { totalEarned, transactions, directIncomeEvents, levelIncomeEvents, showToast } = useHana();
  const incomeRows = transactions.filter((t) =>
    ['Direct Income', 'Level Income', 'ROI Claim', 'Rank Reward', 'Reward Bonus'].includes(t.type)
  );

  const directIncomeUsd = (directIncomeEvents || []).reduce((s, e) => s + (Number(e.usdtIncome) || 0), 0);
  const levelIncomeUsd = (levelIncomeEvents || []).reduce((s, e) => s + (Number(e.usdtIncome) || 0), 0);
  const rankRewardsUsd = incomeRows
    .filter((r) => r.type === 'Rank Reward' || r.type === 'Reward Bonus')
    .reduce((s, r) => s + (Number(r.amountUsd) || 0), 0);

  const exportReport = () => {
    const csv =
      'Type,Amount,USD,Date,TxHash\n' +
      incomeRows.map((r) => `"${r.type}","${r.amountLabel}",${r.amountUsd},"${r.date}","${r.txHash}"`).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'hana-income-report.csv';
    a.click();
    URL.revokeObjectURL(url);
    showToast('Income Report Exported', 'CSV report downloaded.', 'info');
  };

  return (
    <div className="space-y-5">
      <HeroBanner
        title="Income"
        highlight="Report"
        subtitle="Consolidated statement across Direct Income, Multi-Level Commissions, Staking ROI, and Rank Bonuses"
        imageSrc={HANA_IMAGES.bannerDashboard}
        imageAlt="HANA Income Report"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={<FileSpreadsheet className="h-6 w-6" />} label="Total Income" value={`$${totalEarned.toFixed(2)}`} goldAccent />
        <StatCard icon={<Award className="h-6 w-6" />} label="Direct Income" value={`$${directIncomeUsd.toFixed(2)}`} />
        <StatCard icon={<Trophy className="h-6 w-6" />} label="Level Income" value={`$${levelIncomeUsd.toFixed(2)}`} />
        <StatCard icon={<Package className="h-6 w-6" />} label="Rank & Rewards" value={`$${rankRewardsUsd.toFixed(2)}`} goldAccent />
      </div>

      <SectionCard
        title="Consolidated Income Ledger"
        icon={<FileSpreadsheet className="h-4 w-4" />}
        rightSlot={
          <BlueButton onClick={exportReport}>
            <Download className="h-3.5 w-3.5" />
            Download CSV
          </BlueButton>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-left text-xs">
            <thead>
              <tr className="border-b border-[#0755E8]/15 text-[#0645C5]">
                <th className="py-2 pr-3 font-bold">Income Stream</th>
                <th className="py-2 pr-3 font-bold">Amount</th>
                <th className="py-2 pr-3 font-bold">Details</th>
                <th className="py-2 pr-3 font-bold">Date</th>
                <th className="py-2 font-bold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#0755E8]/10">
              {incomeRows.map((row) => (
                <tr key={row.id} className="hover:bg-[#EAF4FF]/60">
                  <td className="py-2.5 pr-3 font-bold text-[#032B91]">{row.type}</td>
                  <td className="py-2.5 pr-3 font-extrabold text-emerald-700 tabular-nums">{row.amountLabel}</td>
                  <td className="py-2.5 pr-3 text-[#0645C5]">{row.details}</td>
                  <td className="py-2.5 pr-3 text-[#032B91]/80">{row.date}</td>
                  <td className="py-2.5">
                    <StatusBadge status={row.status} />
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

export function RankRewardsPage() {
  const { rewards, claimReward } = useHana();
  const rankRewards = rewards.filter((r) => r.category === 'Rank Bonus');

  return (
    <div className="space-y-5">
      <HeroBanner
        title="Rank"
        highlight="Rewards"
        subtitle="Weekly leadership salary payouts for Bronze, Silver, Gold, Platinum, and Diamond qualifiers"
        imageSrc={HANA_IMAGES.bannerRank}
        imageAlt="HANA Rank Rewards"
      />

      <SectionCard title="Weekly Rank Payout Schedule" icon={<Trophy className="h-4 w-4" />}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {RANK_TIERS.map((r) => (
            <div
              key={r.no}
              className={`rounded-2xl p-4 text-center ${
                r.status === 'Current' ? 'hana-card-gold' : 'hana-card'
              }`}
            >
              <div className="flex justify-center">
                <RankMedalIcon tier={r.name} size={48} />
              </div>
              <p className="mt-2 font-display text-base font-extrabold text-[#032B91]">{r.name}</p>
              <p className="mt-1 font-display text-xl font-extrabold text-emerald-700 tabular-nums">
                ${r.weeklyReward}/wk
              </p>
              <p className="mt-1 text-xs font-semibold text-[#0645C5]">{r.qualificationPeriod}</p>
              <div className="mt-2.5">
                <StatusBadge status={r.status} />
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Claimable Rank Payouts" icon={<Award className="h-4 w-4" />}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {rankRewards.map((rw) => (
            <div key={rw.id} className="flex items-center justify-between gap-4 rounded-2xl border border-[#FFB800]/50 bg-white/95 p-4">
              <div>
                <p className="font-display text-sm font-extrabold text-[#032B91]">{rw.title}</p>
                <p className="text-xs text-[#0645C5]">{rw.requirement}</p>
                <p className="mt-1 font-display text-base font-extrabold text-emerald-700 tabular-nums">
                  ${rw.rewardUsd.toFixed(2)} USDT + {rw.rewardHana} HANA
                </p>
              </div>
              {rw.status === 'Claimable' ? (
                <GoldButton onClick={() => claimReward(rw.id)}>Claim</GoldButton>
              ) : (
                <StatusBadge status={rw.status} />
              )}
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

export function ResourcesPage() {
  const navigate = useNavigate();
  return (
    <div className="space-y-5">
      <HeroBanner
        title="Protocol"
        highlight="Resources"
        subtitle="Smart contract specifications, compensation rules, and network documentation"
        imageSrc={HANA_IMAGES.bannerSecurity}
        imageAlt="HANA Protocol Resources"
      />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {[
          {
            title: '2X Capping & ROI Mechanics',
            desc: 'Standard packages earn daily ROI up to a 200% total cap combining ROI, Direct, and Level Income.',
            action: 'Open Staking',
            to: '/dashboard/staking',
          },
          {
            title: '20-Level Referral Structure',
            desc: 'Earn 5% direct referral commissions plus multi-level rewards unlocked by valid direct stakers.',
            action: 'View My Team',
            to: '/dashboard/team',
          },
          {
            title: 'Deflationary Tokenomics',
            desc: '100% of HANA sold back into the smart contract liquidity pool is permanently burned from supply.',
            action: 'Explore Tokenomics',
            to: '/dashboard/token',
          },
        ].map((item) => (
          <SectionCard key={item.title} title={item.title} icon={<BookOpen className="h-4 w-4" />}>
            <p className="mb-4 text-xs leading-relaxed text-[#0645C5]">{item.desc}</p>
            <BlueButton onClick={() => navigate(item.to)}>{item.action}</BlueButton>
          </SectionCard>
        ))}
      </div>
    </div>
  );
}

export function SupportPage() {
  const { showToast } = useHana();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;
    setSubmitted(true);
    showToast('Support Ticket Logged', 'Your inquiry has been queued for the HANA Web3 support team.', 'success');
    setSubject('');
    setMessage('');
  };

  return (
    <div className="space-y-5">
      <HeroBanner
        title="HANA"
        highlight="Support"
        subtitle="Get assistance with BNB Smart Chain wallet connections, staking claims, and rank verification"
        imageSrc={HANA_IMAGES.bannerSecurity}
        imageAlt="HANA Support Desk"
      />

      <SectionCard title="Submit Support Inquiry" icon={<HelpCircle className="h-4 w-4" />}>
        {submitted ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <CheckCircle2 className="h-10 w-10 text-emerald-600" />
            <p className="font-display text-base font-extrabold text-[#032B91]">Ticket Submitted</p>
            <p className="text-xs text-[#0645C5]">Our protocol specialists will review your wallet logs shortly.</p>
            <BlueButton onClick={() => setSubmitted(false)}>Send Another Message</BlueButton>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-bold text-[#032B91]">Subject</label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Rank leg verification or BscScan Tx check"
                className="w-full rounded-xl border border-[#0755E8]/30 bg-white px-3.5 py-2.5 text-sm font-semibold text-[#061B50] focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-[#032B91]">Details</label>
              <textarea
                rows={4}
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Include your transaction hash or question details..."
                className="w-full rounded-xl border border-[#0755E8]/30 bg-white px-3.5 py-2.5 text-sm font-semibold text-[#061B50] focus:outline-none"
              />
            </div>
            <GoldButton type="submit">
              <Send className="h-4 w-4" />
              Submit Ticket
            </GoldButton>
          </form>
        )}
      </SectionCard>
    </div>
  );
}
