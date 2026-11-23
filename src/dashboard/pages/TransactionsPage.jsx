import React, { useState } from 'react';
import { ArrowLeftRight, Search, Download } from 'lucide-react';
import { useHana } from '../context/HanaContext';
import { HANA_IMAGES } from '../assets/images';
import {
  BlueButton,
  HeroBanner,
  SectionCard,
  StatusBadge,
  TxHashChip,
} from '../components/common/UiPrimitives';

const TX_TYPES = [
  { key: 'All',              label: 'All' },

  { key: 'Staking',          label: 'Staking' },
  { key: 'ROI Claim',        label: 'ROI Claim' },
  { key: 'Compound',         label: 'Compound' },
  { key: 'Direct Income',    label: 'Direct Income' },
  { key: 'Level Income',     label: 'Level Income' },
  { key: 'Rank Reward',      label: 'Rank Reward' },

  { key: 'Withdraw HANA',    label: 'Withdraw HANA' },
  { key: 'Buy HANA',         label: 'Buy HANA' },
  { key: 'Sell & Burn HANA', label: 'Sell & Burn' },
  { key: 'DAO Stake',        label: 'DAO Stake' },
];

export function TransactionsPage() {
  const { transactions, showToast } = useHana();
  const [typeFilter, setTypeFilter] = useState('All');
  const [search, setSearch] = useState('');

  const filtered = transactions.filter((tx) => {
    const matchesType = typeFilter === 'All' || tx.type === typeFilter;
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      tx.txHash.toLowerCase().includes(q) ||
      tx.type.toLowerCase().includes(q) ||
      (tx.details || '').toLowerCase().includes(q);
    return matchesType && matchesSearch;
  });

  const exportCsv = () => {
    const header = 'ID,Type,Amount,USD Value,Tx Hash,Date,Status,Details\n';
    const rows = filtered
      .map(
        (t) =>
          `"${t.id}","${t.type}","${t.amountLabel}",${t.amountUsd},"${t.txHash}","${t.date}","${t.status}","${t.details || ''}"`
      )
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'hana-transactions.csv';
    a.click();
    URL.revokeObjectURL(url);
    showToast('CSV Exported', `Downloaded ${filtered.length} transaction records.`, 'info');
  };

  return (
    <div className="space-y-5">
      <HeroBanner
        title="On-Chain"
        highlight="Transactions"
        subtitle="Complete audit trail of stakes, claims, swaps, withdrawals, and network commissions"
        imageSrc={HANA_IMAGES.bannerSecurity}
        imageAlt="HANA Transaction Explorer"
      />

      {/* Filter Bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-[#0755E8]/20 bg-white/90 px-4 py-3 shadow-xs">
        {/* Top row: search + export */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 rounded-full border border-[#0755E8]/30 bg-white px-3.5 py-1.5">
            <Search className="h-4 w-4 text-[#0755E8]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search hash or details..."
              className="w-48 bg-transparent text-xs font-semibold text-[#061B50] placeholder:text-[#0645C5]/40 focus:outline-none"
            />
          </div>
          <BlueButton onClick={exportCsv}>
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </BlueButton>
        </div>

        {/* Filter tabs */}
        <div
          className="flex flex-wrap items-center gap-1.5"
          role="tablist"
          aria-label="Filter transactions by type"
        >
          {TX_TYPES.map((tab) => {
            const active = typeFilter === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setTypeFilter(tab.key)}
                className={`rounded-full px-3 py-1 text-[11px] font-bold transition-all duration-150 whitespace-nowrap cursor-pointer ${
                  active
                    ? 'bg-gradient-to-r from-[#0755E8] to-[#032B91] text-white shadow-[0_3px_10px_rgba(7,85,232,0.35)]'
                    : 'border border-[#0755E8]/20 bg-white text-[#032B91]/75 hover:border-[#0755E8]/50 hover:bg-[#EAF4FF] hover:text-[#032B91]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <SectionCard
        title="Transaction Ledger"
        subtitle={`Showing ${filtered.length} verified protocol transactions`}
        icon={<ArrowLeftRight className="h-4 w-4" />}
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[780px] text-left text-xs">
            <thead>
              <tr className="border-b border-[#0755E8]/15 text-[#0645C5]">
                <th className="py-2.5 pr-3 font-bold">#</th>
                <th className="py-2.5 pr-3 font-bold">Type</th>
                <th className="py-2.5 pr-3 font-bold">Amount</th>
                <th className="py-2.5 pr-3 font-bold">Details</th>
                <th className="py-2.5 pr-3 font-bold">Date &amp; Time</th>
                <th className="py-2.5 pr-3 font-bold">Status</th>
                <th className="py-2.5 font-bold">Explorer</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#0755E8]/10">
              {filtered.length > 0 ? (
                filtered.map((tx, idx) => (
                  <tr key={tx.id} className="hover:bg-[#EAF4FF]/60">
                    <td className="py-3 pr-3 font-bold text-[#032B91] tabular-nums">{idx + 1}</td>
                    <td className="py-3 pr-3 font-extrabold text-[#061B50]">{tx.type}</td>
                    <td className="py-3 pr-3 font-extrabold text-emerald-700 tabular-nums">{tx.amountLabel}</td>
                    <td className="py-3 pr-3 text-[#0645C5]">{tx.details || 'Smart contract execution'}</td>
                    <td className="py-3 pr-3 text-[#032B91]/80 tabular-nums">{tx.date}</td>
                    <td className="py-3 pr-3">
                      <StatusBadge status={tx.status} />
                    </td>
                    <td className="py-3">
                      <TxHashChip hash={tx.txHash} />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-xs font-semibold text-[#0645C5]">
                    No transactions match your search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}