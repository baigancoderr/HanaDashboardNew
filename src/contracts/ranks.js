/**
 * Rank Achievement Structure & Qualification Engine
 *
 * 10-Tier Rank Progression based on:
 *  - Self-Contribution ($ USDT staked)
 *  - Direct Team count (Direct referrals registered under user)
 *  - Required Rank Criteria in Legs (ranks achieved in separate direct legs)
 *  - Matching Business ($ USDT, min of Strong Leg and Weak Leg(s))
 *  - Qualification Period (Weeks)
 *  - Weekly Reward ($ USDT)
 */

export const RANK_ACHIEVEMENT_STRUCTURE = [
  {
    id: 1,
    name: "Genesis",
    selfContribution: 100,
    directTeam: 2,
    requiredLegCriteria: "None",
    legRanksRequired: [],
    matchingBusiness: 2500,
    qualificationPeriod: "10 Weeks",
    weeklyReward: 50,
    badgeColor: "emerald",
  },
  {
    id: 2,
    name: "Accelerator",
    selfContribution: 200,
    directTeam: 4,
    requiredLegCriteria: "None",
    legRanksRequired: [],
    matchingBusiness: 5000,
    qualificationPeriod: "12 Weeks",
    weeklyReward: 75,
    badgeColor: "blue",
  },
  {
    id: 3,
    name: "Elite",
    selfContribution: 300,
    directTeam: 6,
    requiredLegCriteria: "None",
    legRanksRequired: [],
    matchingBusiness: 10000,
    qualificationPeriod: "14 Weeks",
    weeklyReward: 200,
    badgeColor: "purple",
  },
  {
    id: 4,
    name: "Alpha",
    selfContribution: 400,
    directTeam: 8,
    requiredLegCriteria: "1 Elite + 1 Accelerator",
    legRanksRequired: [
      { rankName: "Elite", minRankId: 3, count: 1 },
      { rankName: "Accelerator", minRankId: 2, count: 1 },
    ],
    matchingBusiness: 25000,
    qualificationPeriod: "16 Weeks",
    weeklyReward: 400,
    badgeColor: "amber",
  },
  {
    id: 5,
    name: "Platinum",
    selfContribution: 500,
    directTeam: 10,
    requiredLegCriteria: "1 Elite + 1 Alpha",
    legRanksRequired: [
      { rankName: "Elite", minRankId: 3, count: 1 },
      { rankName: "Alpha", minRankId: 4, count: 1 },
    ],
    matchingBusiness: 50000,
    qualificationPeriod: "18 Weeks",
    weeklyReward: 1000,
    badgeColor: "cyan",
  },
  {
    id: 6,
    name: "Diamond",
    selfContribution: 1000,
    directTeam: 12,
    requiredLegCriteria: "1 Platinum + 1 Alpha",
    legRanksRequired: [
      { rankName: "Platinum", minRankId: 5, count: 1 },
      { rankName: "Alpha", minRankId: 4, count: 1 },
    ],
    matchingBusiness: 100000,
    qualificationPeriod: "20 Weeks",
    weeklyReward: 2000,
    badgeColor: "sky",
  },
  {
    id: 7,
    name: "Ambassador",
    selfContribution: 2000,
    directTeam: 14,
    requiredLegCriteria: "1 Diamond + 1 Platinum",
    legRanksRequired: [
      { rankName: "Diamond", minRankId: 6, count: 1 },
      { rankName: "Platinum", minRankId: 5, count: 1 },
    ],
    matchingBusiness: 250000,
    qualificationPeriod: "22 Weeks",
    weeklyReward: 4000,
    badgeColor: "indigo",
  },
  {
    id: 8,
    name: "Royal",
    selfContribution: 4000,
    directTeam: 16,
    requiredLegCriteria: "1 Ambassador + 1 Diamond",
    legRanksRequired: [
      { rankName: "Ambassador", minRankId: 7, count: 1 },
      { rankName: "Diamond", minRankId: 6, count: 1 },
    ],
    matchingBusiness: 500000,
    qualificationPeriod: "24 Weeks",
    weeklyReward: 6000,
    badgeColor: "rose",
  },
  {
    id: 9,
    name: "Hana Crown",
    selfContribution: 6000,
    directTeam: 18,
    requiredLegCriteria: "1 Royal + 1 Ambassador + 1 Diamond",
    legRanksRequired: [
      { rankName: "Royal", minRankId: 8, count: 1 },
      { rankName: "Ambassador", minRankId: 7, count: 1 },
      { rankName: "Diamond", minRankId: 6, count: 1 },
    ],
    matchingBusiness: 1500000,
    qualificationPeriod: "26 Weeks",
    weeklyReward: 10000,
    badgeColor: "gold",
  },
  {
    id: 10,
    name: "Hana Monarch",
    selfContribution: 10000,
    directTeam: 20,
    requiredLegCriteria: "1 Crown + 1 Royal + 1 Ambassador",
    legRanksRequired: [
      { rankName: "Hana Crown", minRankId: 9, count: 1 },
      { rankName: "Royal", minRankId: 8, count: 1 },
      { rankName: "Ambassador", minRankId: 7, count: 1 },
    ],
    matchingBusiness: 5000000,
    qualificationPeriod: "30 Weeks",
    weeklyReward: 25000,
    badgeColor: "gold",
  },
];

/**
 * Check if leg rank requirements can be satisfied by a list of leg highest rank IDs.
 * Each required rank must be satisfied by a distinct leg.
 */
function checkLegRanksSatisfied(requiredList, legRankIds) {
  if (!requiredList || requiredList.length === 0) return true;
  if (!legRankIds || legRankIds.length < requiredList.length) return false;

  // Sort requirements descending by minRankId to greedily match or permute
  const sortedReqs = [...requiredList].sort((a, b) => b.minRankId - a.minRankId);
  const availableLegs = [...legRankIds].sort((a, b) => b - a);

  const usedIndices = new Set();
  for (const req of sortedReqs) {
    let matched = false;
    for (let i = 0; i < availableLegs.length; i += 1) {
      if (!usedIndices.has(i) && availableLegs[i] >= req.minRankId) {
        usedIndices.add(i);
        matched = true;
        break;
      }
    }
    if (!matched) return false;
  }
  return true;
}

/**
 * Compute detailed user rank achievement status and next-rank progress.
 *
 * @param {Object} params
 * @param {number} params.selfContribution User's self staked USDT
 * @param {number} params.directTeam Number of direct referrals
 * @param {number} params.matchingBusiness Matching Business (min of strong & weak leg)
 * @param {Array<number>} [params.legHighestRankIds] Highest achieved rank ID in each direct leg (optional)
 * @returns {Object} Complete rank analysis
 */
export function calculateUserRankStatus({
  selfContribution = 0,
  directTeam = 0,
  matchingBusiness = 0,
  legHighestRankIds = [],
}) {
  const selfVal = Number(selfContribution) || 0;
  const directVal = Number(directTeam) || 0;
  const matchingVal = Number(matchingBusiness) || 0;

  let currentRank = null;
  const achievedRanks = [];

  const ranksAnalysis = RANK_ACHIEVEMENT_STRUCTURE.map((rank) => {
    const selfMet = selfVal >= rank.selfContribution;
    const directsMet = directVal >= rank.directTeam;
    const matchingMet = matchingVal >= rank.matchingBusiness;
    const legsMet = checkLegRanksSatisfied(rank.legRanksRequired, legHighestRankIds);

    const isAchieved = selfMet && directsMet && matchingMet && legsMet;

    const selfRatio = rank.selfContribution > 0 ? Math.min(1, selfVal / rank.selfContribution) : 1;
    const directRatio = rank.directTeam > 0 ? Math.min(1, directVal / rank.directTeam) : 1;
    const matchingRatio = rank.matchingBusiness > 0 ? Math.min(1, matchingVal / rank.matchingBusiness) : 1;
    const legsRatio = legsMet ? 1 : 0;

    // Weight criteria evenly
    const weights = rank.legRanksRequired.length > 0 ? [0.25, 0.25, 0.35, 0.15] : [0.3, 0.3, 0.4];
    const progressScore =
      rank.legRanksRequired.length > 0
        ? selfRatio * weights[0] + directRatio * weights[1] + matchingRatio * weights[2] + legsRatio * weights[3]
        : selfRatio * weights[0] + directRatio * weights[1] + matchingRatio * weights[2];

    const overallProgressPct = isAchieved ? 100 : Math.min(99, Math.round(progressScore * 100));

    // Construct human-readable missing criteria string
    const missing = [];
    if (!selfMet) {
      missing.push(`$${(rank.selfContribution - selfVal).toLocaleString()} more self-stake`);
    }
    if (!directsMet) {
      const diff = rank.directTeam - directVal;
      missing.push(`${diff} more direct${diff === 1 ? "" : "s"}`);
    }
    if (!matchingMet) {
      missing.push(`$${Math.round(rank.matchingBusiness - matchingVal).toLocaleString()} matching vol`);
    }
    if (!legsMet && rank.requiredLegCriteria !== "None") {
      missing.push(`Leg criteria: ${rank.requiredLegCriteria}`);
    }

    const row = {
      ...rank,
      selfMet,
      directsMet,
      matchingMet,
      legsMet,
      isAchieved,
      overallProgressPct,
      missingCriteria: missing,
      selfProgressPct: Math.round(selfRatio * 100),
      directProgressPct: Math.round(directRatio * 100),
      matchingProgressPct: Math.round(matchingRatio * 100),
    };

    if (isAchieved) {
      achievedRanks.push(row);
      currentRank = row;
    }

    return row;
  });

  // Next rank is the first non-achieved rank
  const nextRank = ranksAnalysis.find((r) => !r.isAchieved) || null;

  return {
    currentRank,
    currentRankId: currentRank ? currentRank.id : 0,
    currentRankName: currentRank ? currentRank.name : "Unranked",
    hasRank: Boolean(currentRank),
    nextRank,
    isMaxRank: !nextRank && Boolean(currentRank),
    achievedRanks,
    ranks: ranksAnalysis,
    selfContribution: selfVal,
    directTeam: directVal,
    matchingBusiness: matchingVal,
  };
}

