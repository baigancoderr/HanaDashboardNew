import { Flame, Shield, TrendingUp, Activity, Zap, Info } from "lucide-react";
import StatCard from "../components/StatCard";
import SectionCard from "../components/SectionCard";
import DataUnavailable from "../components/DataUnavailable";
import { useWeb3 } from "../../context/Web3Context";

export default function BurnDSE() {
  const { hanaPrice, hanaReserves } = useWeb3();
  const usdtReserve = Number(hanaReserves.usdtReserve) || 0;
  const hanaReserve = Number(hanaReserves.hanaReserve) || 0;
  const price = Number(hanaPrice) || 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          icon={Flame}
          label="USDT Reserve"
          value={`$${usdtReserve.toLocaleString()}`}
          sub="Current on-chain reserve"
          color="red"
        />
        <StatCard
          icon={Activity}
          label="DSE Status"
          value="Not reported"
          sub="No DSE status getter"
          color="green"
        />
        <StatCard
          icon={TrendingUp}
          label="Current Price"
          value={`$${price.toFixed(4)}`}
          sub="Read from token contract"
          color="gold"
        />
        <StatCard
          icon={Shield}
          label="HANA Reserve"
          value={hanaReserve.toLocaleString()}
          sub="Current on-chain reserve"
          color="blue"
        />
      </div>

      <SectionCard title="Dynamic Stability Engine" subtitle="Live operating data is not exposed by the current contracts">
        <div className="mb-4 flex items-start gap-3 rounded-lg border border-[#222] bg-[#111] p-4">
          <Info size={16} className="mt-0.5 shrink-0 text-[#FFB51D]" />
          <p className="text-[12px] leading-relaxed text-[#A3A3A3]">
            This dashboard can read the token price and reserves, but the connected contracts do not expose a DSE status, automated price triggers, or reserve-health calculation.
          </p>
        </div>
        <DataUnavailable>
          No active/automated status is implied until contract data can verify it.
        </DataUnavailable>
      </SectionCard>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SectionCard title="Burn History" subtitle="Burn transactions are not indexed here">
          <DataUnavailable>
            Historical burn amounts and weekly totals are not available from the dashboard's current contract reads.
          </DataUnavailable>
        </SectionCard>

        <SectionCard title="Reserve Monitoring" subtitle="Current balances only">
          <div className="mb-4 flex items-start gap-3 rounded-lg border border-[#222] bg-[#111] p-4">
            <Zap size={16} className="mt-0.5 shrink-0 text-[#FFB51D]" />
            <p className="text-[12px] leading-relaxed text-[#A3A3A3]">
              The token contract returns current USDT and HANA reserves. It does not expose a reserve-health score, coverage period, or historical reserve chart.
            </p>
          </div>
          <DataUnavailable>
            Reserve coverage in days cannot be calculated from the available on-chain data.
          </DataUnavailable>
        </SectionCard>
      </div>
    </div>
  );
}
