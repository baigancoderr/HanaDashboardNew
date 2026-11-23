import React from 'react';
import { Gift, Coins, Trophy, Sparkles, CheckCircle2 } from 'lucide-react';
import { useHana } from '../context/HanaContext';
import { HANA_IMAGES } from '../assets/images';
import {
  GoldButton,
  HeroBanner,
  ProgressBar,
  SectionCard,
  StatCard,
  StatusBadge,
} from '../components/common/UiPrimitives';

export function RewardsPage() {
  const { rewards, claimReward } = useHana();

  const claimableUsd = rewards
    .filter((r) => r.status === 'Claimable')
    .reduce((s, r) => s + r.rewardUsd, 0);
  const claimableHana = rewards
    .filter((r) => r.status === 'Claimable')
    .reduce((s, r) => s + r.rewardHana, 0);
  const claimedUsd = rewards
    .filter((r) => r.status === 'Claimed')
    .reduce((s, r) => s + r.rewardUsd, 0);

  return (
    <div className="space-y-5">
      <HeroBanner
        title="Rewards &"
        highlight="Bonuses"
        subtitle="Claim milestone achievements, fast-track payouts, and leadership pool incentives"
        imageSrc={HANA_IMAGES.bannerDashboard}
        imageAlt="HANA Rewards and Bonuses"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={<Gift className="h-6 w-6" />}
          label="Claimable USDT"
          value={`$${claimableUsd.toFixed(2)}`}
          goldAccent
        />
        <StatCard
          icon={<Coins className="h-6 w-6" />}
          label="Claimable HANA"
          value={`${claimableHana.toFixed(2)} HANA`}
        />
        <StatCard
          icon={<CheckCircle2 className="h-6 w-6" />}
          label="Total Claimed"
          value={`$${claimedUsd.toFixed(2)}`}
        />
        <StatCard
          icon={<Trophy className="h-6 w-6" />}
          label="Active Milestones"
          value={`${rewards.length}`}
          goldAccent
        />
      </div>

      <SectionCard
        title="Available Rewards & Milestones"
        subtitle="Claim unlocked incentives directly into your withdrawable balance"
        icon={<Sparkles className="h-4 w-4" />}
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {rewards.map((r) => (
            <div
              key={r.id}
              className={`flex flex-col justify-between gap-4 rounded-2xl p-4 ${
                r.status === 'Claimable' ? 'hana-card-gold' : 'hana-card'
              }`}
            >
              <div className="space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-extrabold text-[#0645C5] uppercase">{r.category}</p>
                    <h3 className="font-display text-base font-extrabold text-[#032B91]">{r.title}</h3>
                  </div>
                  <StatusBadge status={r.status} />
                </div>

                <p className="text-xs font-medium text-[#061B50]/85">{r.requirement}</p>
                <ProgressBar percent={r.progress} variant={r.status === 'Claimable' ? 'gold' : 'blue'} />
              </div>

              <div className="flex items-center justify-between gap-3 border-t border-[#0755E8]/15 pt-3">
                <div>
                  <p className="font-display text-base font-extrabold text-emerald-700 tabular-nums">
                    +${r.rewardUsd.toFixed(2)} USDT
                  </p>
                  <p className="text-xs font-bold text-[#D89500] tabular-nums">+{r.rewardHana} HANA</p>
                </div>

                {r.status === 'Claimable' ? (
                  <GoldButton onClick={() => claimReward(r.id)}>Claim Reward</GoldButton>
                ) : (
                  <span className="text-xs font-bold text-[#0645C5]">
                    {r.status === 'Claimed' ? 'Credited to Balance' : 'Keep Building'}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
