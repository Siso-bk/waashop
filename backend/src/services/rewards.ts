import crypto from "crypto";
import { IMysteryBox, IRewardTier } from "../models/MysteryBox";
import { IUser } from "../models/User";

export const TOP_REWARD_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;

const secureRandomFloat = () => {
  const precision = 1_000_000;
  return crypto.randomInt(precision) / precision;
};

const selectTier = (tiers: IRewardTier[]) => {
  const rand = secureRandomFloat();
  let cumulative = 0;
  for (const tier of tiers) {
    cumulative += tier.probability;
    if (rand <= cumulative) {
      return tier;
    }
  }
  return tiers[tiers.length - 1];
};

const fallbackTier = (tiers: IRewardTier[]) =>
  tiers.filter((tier) => !tier.isTop).sort((a, b) => b.points - a.points)[0];

export const resolveReward = (box: IMysteryBox, user: IUser) => {
  const selected = selectTier(box.rewardTiers);
  const lastTop = user.lastTopWinAt?.getTime();
  const now = Date.now();

  let awardedTier = selected;
  let awardedTop = Boolean(selected.isTop);

  if (selected.isTop && lastTop && now - lastTop < TOP_REWARD_COOLDOWN_MS) {
    const downgraded = fallbackTier(box.rewardTiers);
    if (downgraded) {
      awardedTier = downgraded;
      awardedTop = false;
    }
  }

  const rewardPoints = Math.max(awardedTier.points, box.guaranteedMinPoints);
  return { tier: awardedTier, rewardPoints, awardedTop };
};
