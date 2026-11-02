import { Crown, Users, Coins, TrendingUp, Info, ArrowUpRight } from "lucide-react";
import StatCard from "../components/StatCard";
import SectionCard from "../components/SectionCard";
import GoldBadge from "../components/GoldBadge";
import DataUnavailable from "../components/DataUnavailable";
import { useWeb3 } from "../../context/Web3Context";

export default function DAOProgram() {
  const {
    isDAO,
    daoEndTime,
    daoMemberCount,
    maxDaoMembers,
    packages,
    stake,
    isTransacting,
    usdtBalance,
  } = useWeb3();

  const daoPackage = packages.find((pkg) => pkg.isDAO);
  const nowSeconds = Math.floor(Date.now() / 1000);
  const daysLeft = daoEndTime > nowSeconds ? Math.ceil((daoEndTime - nowSeconds) / 86400) : 0;
  const daoCapacityAvailable = daoMemberCount !== null && maxDaoMembers !== null;
  const spotsLeft = daoCapacityAvailable ? Math.max(0, maxDaoMembers - daoMemberCount) : null;
  const daoMemberSummary = daoCapacityAvailable
    ? `${daoMemberCount} / ${maxDaoMembers}`
    : "Unavailable";
  const packageCost = Number(daoPackage?.minAmount || 0);

  const handleActivateDAO = async () => {
    if (!daoPackage?.active || isDAO || parseFloat(usdtBalance || "0") < packageCost) return;
    await stake(daoPackage.id, packageCost);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          icon={Crown}
          label="DAO Status"
          value={isDAO ? "Member" : "Not joined"}
          sub={isDAO ? (daysLeft > 0 ? `${daysLeft} days to recorded end time` : "Recorded end time passed") : "Not active on-chain"}
          color={isDAO ? "green" : "gold"}
        />
        <StatCard
          icon={Users}
          label="DAO Members"
          value={daoMemberSummary}
          sub={daoCapacityAvailable ? `${spotsLeft} spots remaining` : "Contract data unavailable"}
          color="blue"
        />
        <StatCard
          icon={Coins}
          label="DAO Pool Payout"
          value="Manual"
          sub="Owner distribution; no schedule stored"
          color="green"
        />
        <StatCard
          icon={TrendingUp}
          label="DAO Stake Cap"
          value={daoPackage ? `${daoPackage.capMultiplier}X` : "Unavailable"}
          sub="Read from DAO package"
          color="purple"
        />
      </div>

      <SectionCard title="DAO Package" subtitle="Membership and package values read from the staking contract">
        {!daoPackage ? (
          <DataUnavailable>
            {packages.length === 0
              ? "DAO package data is unavailable from the staking contract."
              : "The staking contract has no DAO package configured."}
          </DataUnavailable>
        ) : (
          <div className="relative overflow-hidden rounded-xl border border-[#FFB51D]/30 bg-gradient-to-r from-[#FFB51D]/10 via-[#111] to-[#111] p-5 sm:p-6">
            <div className="relative grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <div className="flex items-center gap-2">
                  <Crown size={20} className="text-[#FFB51D]" />
                  <h3 className="text-[18px] font-bold text-white">DAO Partner Package</h3>
                </div>
                <p className="mt-2 text-[12px] leading-relaxed text-[#A3A3A3]">
                  A DAO membership is recorded when a qualifying DAO package stake is made. The contract stores an end timestamp, but does not automatically clear the membership flag when that timestamp passes.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {maxDaoMembers !== null && <GoldBadge>{maxDaoMembers} member limit</GoldBadge>}
                  <GoldBadge>500-day recorded term</GoldBadge>
                  {isDAO && <GoldBadge>DAO flag set on-chain</GoldBadge>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Minimum Stake", value: `$${packageCost.toLocaleString()}` },
                  { label: "Daily Rate", value: `${(daoPackage.dailyRateBps / 100).toFixed(2)}%` },
                  { label: "Stake Cap", value: `${daoPackage.capMultiplier}X` },
                  { label: "DAO Member Count", value: daoMemberSummary },
                  { label: "Top-up Rule", value: "$1,000 multiples" },
                  { label: "DAO Pool Schedule", value: "Not on-chain" },
                ].map((item) => (
                  <div key={item.label} className="rounded-lg border border-[#222] bg-[#0A0A0A] p-2.5">
                    <p className="text-[10px] text-[#737373]">{item.label}</p>
                    <p className="text-[13px] font-bold text-[#FFB51D]">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative mt-5">
              {isDAO ? (
                <div className="inline-flex items-center gap-2 rounded-lg border border-green-500/30 bg-green-500/10 px-5 py-2.5 text-sm font-bold text-green-400">
                  DAO membership flag is set on-chain
                </div>
              ) : (
                <button
                  onClick={handleActivateDAO}
                  disabled={
                    isTransacting ||
                    !daoPackage.active ||
                    !daoCapacityAvailable ||
                    daoMemberCount >= maxDaoMembers ||
                    parseFloat(usdtBalance || "0") < packageCost
                  }
                  className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#FFE28A] to-[#FFB51D] px-6 py-3 text-[14px] font-bold text-black transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isTransacting ? "Confirming on-chain…" : `Stake $${packageCost.toLocaleString()} DAO Package`}
                  <ArrowUpRight size={16} />
                </button>
              )}
            </div>
          </div>
        )}
      </SectionCard>

      <SectionCard title="DAO Referral & Pool Details" subtitle="Not available in the current on-chain data">
        <div className="mb-4 flex items-start gap-3 rounded-lg border border-[#222] bg-[#111] p-4">
          <Info size={16} className="mt-0.5 shrink-0 text-[#FFB51D]" />
          <p className="text-[12px] leading-relaxed text-[#A3A3A3]">
            This contract exposes DAO membership, the member cap, and an owner-triggered pool distribution function. It does not implement referral-based DAO qualification, a weekly pool percentage, or a payout schedule.
          </p>
        </div>
        <DataUnavailable>
          No referral pathway progress or scheduled DAO pool rewards are shown because those values are not tracked by the contract.
        </DataUnavailable>
      </SectionCard>
    </div>
  );
}
