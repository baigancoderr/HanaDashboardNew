import { TrendingUp, Clock, Coins, ArrowUpRight, Repeat, Sparkles } from "lucide-react";
import StatCard from "../components/StatCard";
import SectionCard from "../components/SectionCard";
import DataUnavailable from "../components/DataUnavailable";
import { useWeb3 } from "../../context/Web3Context";

export default function ROIIncome() {
  const {
    totalPendingROI,
    totalDirectIncome,
    totalStaked,
    userStakes,
    packages,
    claimAllROI,
    isTransacting,
  } = useWeb3();

  const activeStakes = userStakes.filter((s) => s.active);
  const totalClaimed = userStakes.reduce(
    (acc, s) => acc + (parseFloat(s.totalClaimed) || 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          icon={TrendingUp}
          label="Total ROI Claimed"
          value={`$${totalClaimed.toFixed(2)}`}
          sub={`${activeStakes.length} active position(s)`}
          color="gold"
        />
        <StatCard
          icon={Coins}
          label="Direct Income"
          value={`$${parseFloat(totalDirectIncome || "0").toFixed(2)}`}
          sub="5% Referral reward"
          color="blue"
        />
        <StatCard
          icon={Repeat}
          label="Pending Claimable"
          value={`$${parseFloat(totalPendingROI || "0").toFixed(4)}`}
          sub="Ready to mint HANA"
          color="green"
        />
        <StatCard
          icon={Clock}
          label="Total Staked"
          value={`$${parseFloat(totalStaked || "0").toLocaleString()}`}
          sub="Generates 12h ROI"
          color="purple"
        />
      </div>

      {parseFloat(totalPendingROI || "0") > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl border border-[#FFB51D]/40 bg-[#FFB51D]/10 p-4">
          <div>
            <p className="text-[15px] font-bold text-white">Unclaimed ROI Available</p>
            <p className="text-[12px] text-[#A3A3A3]">
              You have <strong className="text-[#FFB51D]">${totalPendingROI} USDT</strong> in pending returns ready to be claimed into HANA tokens.
            </p>
          </div>
          <button
            onClick={() => claimAllROI()}
            disabled={isTransacting}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#FFE28A] to-[#FFB51D] px-5 py-2.5 text-xs font-bold text-black hover:brightness-110 active:scale-95 disabled:opacity-50"
          >
            <Sparkles size={14} />
            {isTransacting ? "Claiming..." : "Claim All ROI"}
          </button>
        </div>
      )}

      {/* ROI Structure */}
      <SectionCard title="ROI Rate Structure" subtitle="Package rates read from the staking contract">
        {packages.length === 0 ? (
          <DataUnavailable>
            Package rates are unavailable because the staking contract did not return package data.
          </DataUnavailable>
        ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {packages.map((pkg) => {
            const amount = Number(pkg.minAmount);
            const dailyRate = pkg.dailyRateBps / 100;
            const per12hRate = Math.floor(pkg.dailyRateBps / 2) / 100;
            const dailyEarn = (amount * pkg.dailyRateBps) / 10000;
            return (
            <div
              key={pkg.id}
              className="rounded-xl border border-[#222] bg-[#111] p-4"
            >
              <p className="text-[18px] font-bold text-white">
                {pkg.isDAO ? "DAO Package" : `Package ${pkg.id + 1}`} · ${amount.toLocaleString()} min.
              </p>
              <div className="mt-3 space-y-2">
                <div className="flex justify-between">
                  <span className="text-[11px] text-[#737373]">Daily Rate</span>
                  <span className="text-[12px] font-bold text-[#FFB51D]">{dailyRate.toFixed(2)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[11px] text-[#737373]">Per 12h</span>
                  <span className="text-[12px] text-[#A3A3A3]">{per12hRate.toFixed(2)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[11px] text-[#737373]">Daily ROI at minimum</span>
                  <span className="text-[12px] font-bold text-green-400">${dailyEarn.toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t border-[#222] pt-2">
                  <span className="text-[11px] text-[#737373]">Position Cap</span>
                  <span className="text-[12px] font-bold text-white">{pkg.capMultiplier}X (${(amount * pkg.capMultiplier).toLocaleString()} at minimum)</span>
                </div>
              </div>
            </div>
            );
          })}
        </div>
        )}

        <div className="mt-4 rounded-lg border border-[#222] bg-[#0A0A0A] p-3">
          <p className="text-[12px] text-[#A3A3A3]">
            Each position stores its own cap. The contract does not expose a combined income cap or networker-specific multiplier.
          </p>
        </div>
      </SectionCard>

      {/* ROI History Chart */}
      <SectionCard title="ROI Credit History" subtitle="Claim events are not indexed in this dashboard">
        <DataUnavailable>
          The contract exposes cumulative claimed ROI and current pending ROI, but this app does not yet fetch historical claim events.
        </DataUnavailable>
      </SectionCard>
    </div>
  );
}
