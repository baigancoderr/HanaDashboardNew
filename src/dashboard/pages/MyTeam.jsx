import { useState, useCallback } from "react";
import { useAppKitAccount } from "@reown/appkit/react";
import {
  Users,
  TrendingUp,
  Shield,
  RefreshCw,
  Loader2,
  ExternalLink,
  Crown,
  Search,
  ArrowUpDown,
  Layers,
  Copy,
  Check,
} from "lucide-react";
import StatCard from "../components/StatCard";
import SectionCard from "../components/SectionCard";
import { useTeamByLevel, useUserData } from "../../contracts/hooks";

function StatusBadge({ isDAO }) {
  return isDAO ? (
    <span className="inline-flex items-center gap-1 rounded-full border border-yellow-400/30 bg-yellow-400/10 px-2 py-0.5 text-[10px] font-bold text-yellow-300">
      <Crown size={9} /> DAO
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-semibold text-neutral-400">
      Member
    </span>
  );
}

// Reusable address cell with copy button + explorer link
function AddressCell({ address, shortLabel, explorerUrl, isSelf = false }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(
    async (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (!address) return;
      try {
        await navigator.clipboard.writeText(address);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1800);
      } catch {}
    },
    [address]
  );

  if (!address) return <span className="text-neutral-500">—</span>;

  return (
    <div className="inline-flex items-center gap-1.5">
      <a
        href={explorerUrl}
        target="_blank"
        rel="noreferrer"
        className={`font-mono hover:underline ${
          isSelf ? "text-[#FFB51D]" : "text-white hover:text-[#FFB51D]"
        }`}
      >
        {shortLabel}
      </a>
      <button
        type="button"
        onClick={handleCopy}
        title={copied ? "Copied!" : `Copy ${address}`}
        className="flex h-5 w-5 items-center justify-center rounded border border-white/10 bg-white/5 text-neutral-500 transition hover:border-[#FFB51D]/40 hover:bg-[#FFB51D]/10 hover:text-[#FFB51D]"
      >
        {copied ? <Check size={10} /> : <Copy size={10} />}
      </button>
      <a
        href={explorerUrl}
        target="_blank"
        rel="noreferrer"
        className="text-neutral-600 hover:text-neutral-400"
      >
        <ExternalLink size={10} />
      </a>
    </div>
  );
}

export default function MyTeam() {
  const { address } = useAppKitAccount({ namespace: "eip155" });
  const { user }    = useUserData(address);

  const { levelMap, allMembers, levelStats, fromCache, isLoading, error, refetch } =
    useTeamByLevel(address);

  const [selectedLevel, setSelectedLevel] = useState(1);
  const [search, setSearch]               = useState("");
  const [sortKey, setSortKey]             = useState("totalStaked");
  const [sortDir, setSortDir]             = useState("desc");

  const handleSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    else { setSortKey(key); setSortDir("desc"); }
  };

  const levelMembers = levelMap.get(selectedLevel) ?? [];

  const filtered = levelMembers
    .filter(
      (m) =>
        search.trim() === "" ||
        m.address.toLowerCase().includes(search.toLowerCase()) ||
        (m.sponsor && m.sponsor.toLowerCase().includes(search.toLowerCase()))
    )
    .sort((a, b) => {
      let va, vb;
      if (sortKey === "totalStaked")  { va = a.totalStakedNum;        vb = b.totalStakedNum; }
      else if (sortKey === "joined")  { va = a.joinedTimestamp ?? 0;  vb = b.joinedTimestamp ?? 0; }
      else if (sortKey === "stakes")  { va = a.stakeCount;            vb = b.stakeCount; }
      else                            { va = a.totalStakedNum;        vb = b.totalStakedNum; }
      return sortDir === "desc" ? vb - va : va - vb;
    });

  const totalAllMembers  = allMembers.length;
  const totalAllBusiness = allMembers.reduce((s, m) => s + m.totalStakedNum, 0);
  const daoCount         = allMembers.filter((m) => m.isDAO).length;
  const activeCount      = allMembers.filter((m) => m.stakeCount > 0).length;
  const selectedStat     = levelStats[selectedLevel - 1] ?? { count: 0, totalBusiness: 0 };

  const myAddrLower = address?.toLowerCase() ?? "";

  const SortBtn = ({ col, label }) => (
    <button
      type="button"
      onClick={() => handleSort(col)}
      className={`inline-flex items-center gap-1 transition hover:text-white ${
        sortKey === col ? "text-[#FFB51D]" : "text-[#737373]"
      }`}
    >
      {label}
      <ArrowUpDown size={11} />
    </button>
  );

  return (
    <div className="space-y-6 font-chakra-petch">

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <StatCard
          icon={Users}
          label="Total Team (All Levels)"
          value={totalAllMembers.toString()}
          sub={`${activeCount} active staker${activeCount !== 1 ? "s" : ""}`}
          color="gold"
        />
        <StatCard
          icon={TrendingUp}
          label="Total Team Business"
          value={`$${totalAllBusiness.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`}
          sub="All levels combined"
          color="green"
        />
        <StatCard
          icon={Shield}
          label="Valid Directs"
          value={(user?.validDirects ?? 0).toString()}
          sub="Qualified for level income"
          color="blue"
        />
        <StatCard
          icon={Crown}
          label="DAO Members"
          value={daoCount.toString()}
          sub="Across all levels"
          color="purple"
        />
      </div>

      {/* ── Level Selector + Table ── */}
      <SectionCard
        title={`Level ${selectedLevel} Members`}
        subtitle={`${selectedStat.count} member${selectedStat.count !== 1 ? "s" : ""} · $${selectedStat.totalBusiness.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })} USDT total business`}
        action={
          <div className="flex items-center gap-2">
            {fromCache && (
              <span className="inline-flex items-center gap-1 rounded-md border border-[#FFB51D]/20 bg-[#FFB51D]/5 px-2 py-1 text-[10px] font-semibold text-[#FFB51D]">
                ⚡ Cached
              </span>
            )}
            <button
              type="button"
              onClick={() => refetch?.()}
              disabled={isLoading || !address}
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-[#161616] px-3 py-2 text-xs font-medium text-neutral-300 transition hover:border-[#FFB51D]/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw size={13} className={isLoading ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>
        }
      >
        {/* ── Level Buttons 1–20 ── */}
        <div className="mb-5">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[#737373]">
            Select Level
          </p>
          <div className="flex flex-wrap gap-1.5">
            {Array.from({ length: 20 }, (_, i) => i + 1).map((lvl) => {
              const stat    = levelStats[lvl - 1];
              const count   = stat?.count ?? 0;
              const isActive = selectedLevel === lvl;
              const hasData  = count > 0;
              return (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => { setSelectedLevel(lvl); setSearch(""); }}
                  disabled={isLoading}
                  className={`relative min-w-[42px] rounded-lg border px-2.5 py-1.5 text-[12px] font-bold transition-all disabled:cursor-not-allowed ${
                    isActive
                      ? "border-[#FFB51D] bg-[#FFB51D] text-black shadow-[0_0_12px_rgba(255,181,29,0.4)]"
                      : hasData
                      ? "border-[#FFB51D]/30 bg-[#FFB51D]/5 text-[#FFB51D] hover:bg-[#FFB51D]/15"
                      : "border-white/8 bg-white/[0.03] text-neutral-600 hover:border-white/20 hover:text-neutral-400"
                  }`}
                >
                  L{lvl}
                  {hasData && !isActive && (
                    <span className="absolute -right-1 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#FFB51D] text-[8px] font-black text-black leading-none">
                      {count > 9 ? "9+" : count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Level Summary Strip ── */}
        {!isLoading && selectedStat.count > 0 && (
          <div className="mb-4 flex flex-wrap gap-3">
            <div className="flex items-center gap-2 rounded-lg border border-[#FFB51D]/20 bg-[#FFB51D]/5 px-3 py-2">
              <Layers size={13} className="text-[#FFB51D]" />
              <span className="text-xs font-semibold text-[#FFB51D]">Level {selectedLevel}</span>
              <span className="text-xs text-neutral-400">
                {selectedStat.count} member{selectedStat.count !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-green-500/20 bg-green-500/5 px-3 py-2">
              <TrendingUp size={13} className="text-green-400" />
              <span className="text-xs font-semibold text-green-400">
                ${selectedStat.totalBusiness.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })} USDT
              </span>
              <span className="text-xs text-neutral-400">level business</span>
            </div>
          </div>
        )}

        {/* ── Search ── */}
        {levelMembers.length > 0 && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-white/10 bg-[#0D0D0D] px-3 py-2">
            <Search size={14} className="shrink-0 text-neutral-500" />
            <input
              type="text"
              placeholder={`Search by wallet or sponsor address…`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-xs text-white outline-none placeholder:text-neutral-600"
            />
            {search && (
              <button type="button" onClick={() => setSearch("")} className="text-xs text-neutral-500 hover:text-white">
                Clear
              </button>
            )}
          </div>
        )}

        {/* ── Table ── */}
        {!address ? (
          <p className="rounded-lg border border-dashed border-white/10 p-6 text-center text-sm text-neutral-400">
            Connect your wallet to view your team.
          </p>
        ) : isLoading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-14">
            <Loader2 size={26} className="animate-spin text-[#FFB51D]" />
            <p className="text-xs text-neutral-400">Building team tree from BSC Testnet…</p>
            <p className="text-[11px] text-neutral-600">This may take a moment for large teams</p>
          </div>
        ) : error ? (
          <p className="rounded-lg border border-red-400/20 bg-red-400/[0.05] p-4 text-sm text-red-300" role="alert">
            {error}
          </p>
        ) : levelMembers.length === 0 ? (
          <div className="rounded-lg border border-dashed border-white/10 p-10 text-center">
            <Users size={28} className="mx-auto mb-3 text-neutral-600" />
            <p className="text-sm font-semibold text-white">No members at Level {selectedLevel}</p>
            <p className="mt-1 text-xs text-neutral-500">
              {selectedLevel === 1
                ? "Share your referral link to build your Level 1 team."
                : `Your Level ${selectedLevel - 1} members haven't referred anyone yet.`}
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <p className="rounded-lg border border-dashed border-white/10 p-6 text-center text-sm text-neutral-400">
            No results for "{search}"
          </p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px] text-left text-xs">
                <thead>
                  <tr className="border-b border-[#222] text-[11px] uppercase tracking-wider">
                    <th className="pb-3 font-semibold text-[#737373]">#</th>
                    <th className="pb-3 font-semibold text-[#737373]">Member Wallet</th>
                    <th className="pb-3 font-semibold text-[#737373]">Sponsor</th>
                    <th className="pb-3 font-semibold text-[#737373]">Status</th>
                    <th className="pb-3 font-semibold">
                      <SortBtn col="totalStaked" label="Total Business" />
                    </th>
                    <th className="pb-3 font-semibold text-[#737373]">Last Stake</th>
                    <th className="pb-3 font-semibold text-[#737373]">Last Package</th>
                    <th className="pb-3 font-semibold">
                      <SortBtn col="joined" label="Joined" />
                    </th>
                    <th className="pb-3 text-right font-semibold text-[#737373]">Reg Tx</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1A1A1A]">
                  {filtered.map((m, idx) => {
                    const sponsorIsMe = m.sponsor?.toLowerCase() === myAddrLower;
                    return (
                      <tr key={m.address} className="transition hover:bg-white/[0.025]">

                        {/* # */}
                        <td className="py-3 text-neutral-600">{idx + 1}</td>

                        {/* Member Wallet */}
                        <td className="py-3">
                          <AddressCell
                            address={m.address}
                            shortLabel={m.addressShort}
                            explorerUrl={m.explorerUrl}
                          />
                        </td>

                        {/* Sponsor */}
                        <td className="py-3">
                          {m.sponsor ? (
                            <div className="flex flex-col gap-0.5">
                              <AddressCell
                                address={m.sponsor}
                                shortLabel={m.sponsorShort}
                                explorerUrl={m.sponsorExplorerUrl}
                                isSelf={sponsorIsMe}
                              />
                              {sponsorIsMe && (
                                <span className="text-[9px] font-bold uppercase tracking-wider text-[#FFB51D]">
                                  You
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-neutral-500">—</span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-3">
                          <StatusBadge isDAO={m.isDAO} />
                        </td>

                        {/* Total Business */}
                        <td className="py-3">
                          {m.totalStakedNum > 0 ? (
                            <span className="font-bold text-green-400">
                              ${m.totalStakedFormatted} USDT
                            </span>
                          ) : (
                            <span className="text-neutral-500">$0.00</span>
                          )}
                        </td>

                        {/* Last Stake */}
                        <td className="py-3">
                          {m.lastStakeAmountFormatted ? (
                            <span className="text-white">
                              ${m.lastStakeAmountFormatted}
                              <span className="ml-1 text-[10px] text-neutral-500">
                                {m.lastStakeFormatted}
                              </span>
                            </span>
                          ) : (
                            <span className="text-neutral-500">—</span>
                          )}
                        </td>

                        {/* Last Package */}
                        <td className="py-3">
                          {m.lastPackageName ? (
                            <span className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] font-semibold text-neutral-300">
                              {m.lastPackageName}
                            </span>
                          ) : (
                            <span className="text-neutral-500">—</span>
                          )}
                        </td>

                        {/* Joined */}
                        <td className="py-3 text-neutral-400">{m.joinedFormatted}</td>

                        {/* Reg Tx */}
                        <td className="py-3 text-right">
                          {m.regExplorerUrl ? (
                            <a
                              href={m.regExplorerUrl}
                              target="_blank"
                              rel="noreferrer"
                              title={m.regTxHash}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-[#FFB51D]/20 bg-[#FFB51D]/5 px-2.5 py-1 font-mono text-[#FFB51D] transition hover:bg-[#FFB51D]/15"
                            >
                              {m.regTxShort}
                              <ExternalLink size={11} />
                            </a>
                          ) : (
                            <span className="text-neutral-500">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-right text-[11px] text-neutral-600">
              Showing {filtered.length} of {levelMembers.length} member{levelMembers.length !== 1 ? "s" : ""} at Level {selectedLevel}
            </p>
          </>
        )}
      </SectionCard>
    </div>
  );
}
