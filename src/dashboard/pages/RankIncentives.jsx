import { Award, TrendingUp, Users, Info } from "lucide-react";
import StatCard from "../components/StatCard";
import SectionCard from "../components/SectionCard";
import DataUnavailable from "../components/DataUnavailable";
import { useWeb3 } from "../../context/Web3Context";

export default function RankIncentives() {
  const { totalRankIncome, totalStaked, isDAO } = useWeb3();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          icon={Award}
          label="Rank Income"
          value={`$${parseFloat(totalRankIncome || "0").toFixed(2)}`}
          sub="Cumulative contract total"
          color="gold"
        />
        <StatCard
          icon={TrendingUp}
          label="Total Staked"
          value={`$${parseFloat(totalStaked || "0").toLocaleString()}`}
          sub="On-chain user total"
          color="blue"
        />
        <StatCard
          icon={Users}
          label="DAO Membership"
          value={isDAO ? "Active" : "Not joined"}
          sub="On-chain membership flag"
          color="green"
        />
        <StatCard
          icon={Award}
          label="Current Rank"
          value="Unavailable"
          sub="No rank state in contract"
          color="purple"
        />
      </div>

      <SectionCard title="Rank Qualification" subtitle="Rank rules are not implemented in the connected contract">
        <div className="mb-4 flex items-start gap-3 rounded-lg border border-[#222] bg-[#111] p-4">
          <Info size={16} className="mt-0.5 shrink-0 text-[#FFB51D]" />
          <p className="text-[12px] leading-relaxed text-[#A3A3A3]">
            The staking contract stores a cumulative rank-income total and provides an owner-only rank-income distribution function. It does not calculate ranks, matching business, qualification criteria, progress, or reward schedules.
          </p>
        </div>
        <DataUnavailable>
          Sample rank cards and progress figures have been removed. Rank eligibility will appear here only when verifiable contract or indexed event data is available.
        </DataUnavailable>
      </SectionCard>
    </div>
  );
}
