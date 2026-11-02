import { Coins, Info, TrendingUp } from "lucide-react";
import StatCard from "../components/StatCard";
import SectionCard from "../components/SectionCard";
import DataUnavailable from "../components/DataUnavailable";
import { useWeb3 } from "../../context/Web3Context";

export default function Compounding() {
  const { totalStaked, totalPendingROI } = useWeb3();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <StatCard
          icon={TrendingUp}
          label="Total Staked"
          value={`$${Number(totalStaked || 0).toLocaleString()}`}
          sub="Current on-chain user total"
          color="gold"
        />
        <StatCard
          icon={Coins}
          label="Pending ROI"
          value={`$${Number(totalPendingROI || 0).toFixed(4)}`}
          sub="Available to claim as HANA"
          color="green"
        />
      </div>

      <SectionCard title="Compounding" subtitle="Not available in the current staking contract">
        <div className="mb-4 flex items-start gap-3 rounded-lg border border-[#222] bg-[#111] p-4">
          <Info size={16} className="mt-0.5 shrink-0 text-[#FFB51D]" />
          <p className="text-[12px] leading-relaxed text-[#A3A3A3]">
            The contract supports staking, claiming ROI as minted HANA, and an owner-triggered reinvest-wallet fee route. It does not provide a user compounding action, lock plans, or time-based compounding rates.
          </p>
        </div>
        <DataUnavailable>
          Simulated plan returns, projections, and start-plan controls have been removed because they are not backed by an on-chain feature.
        </DataUnavailable>
      </SectionCard>
    </div>
  );
}
