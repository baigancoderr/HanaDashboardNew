import { Users, Zap, Info, History } from "lucide-react";
import StatCard from "../components/StatCard";
import SectionCard from "../components/SectionCard";
import DataUnavailable from "../components/DataUnavailable";
import { useWeb3 } from "../../context/Web3Context";

export default function LevelIncome() {
  const { totalLevelIncome, totalDirectIncome } = useWeb3();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          icon={Zap}
          label="Level Income"
          value={`$${parseFloat(totalLevelIncome || "0").toFixed(2)}`}
          sub="Cumulative contract total"
          color="blue"
        />
        <StatCard
          icon={Users}
          label="Direct Income"
          value={`$${parseFloat(totalDirectIncome || "0").toFixed(2)}`}
          sub="Cumulative contract total"
          color="green"
        />
        <StatCard
          icon={Users}
          label="Downline"
          value="Unavailable"
          sub="Not exposed by this contract"
          color="gold"
        />
        <StatCard
          icon={History}
          label="Level History"
          value="Unavailable"
          sub="No event history indexed"
          color="purple"
        />
      </div>

      <SectionCard title="Level Income Data" subtitle="Only values available from the connected staking contract">
        <div className="mb-4 flex items-start gap-3 rounded-lg border border-[#222] bg-[#111] p-4">
          <Info size={16} className="mt-0.5 shrink-0 text-[#FFB51D]" />
          <p className="text-[12px] leading-relaxed text-[#A3A3A3]">
            The contract stores only a cumulative level-income total and an owner-controlled distribution function. It does not expose a downline tree, per-level rates, unlock rules, or per-member earnings.
          </p>
        </div>
        <DataUnavailable>
          Per-level balances and referral activity are not available on-chain, so no sample level rows or earnings are shown.
        </DataUnavailable>
      </SectionCard>
    </div>
  );
}
