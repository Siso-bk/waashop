import crypto from "crypto";
import { IMysteryBox, IRewardTier } from "@/models/MysteryBox";
import { IUser } from "@/models/User";

export const TOP_REWARD_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;

const secureRandomFloat = () => {
  const precision = 1_000_000;
  const randomInt = crypto.randomInt(precision);
  return randomInt / precision;
};

const selectTier = (tiers: IRewardTier[]): IRewardTier => {
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

const fallbackTier = (tiers: IRewardTier[]) => {
  return tiers
    .filter((tier) => !tier.isTop)
    .sort((a, b) => b.points - a.points)[0];
};

export const resolveReward = (box: IMysteryBox, user: IUser) => {
  const selected = selectTier(box.rewardTiers);
  const now = Date.now();
  const lastTop = user.lastTopWinAt?.getTime();
  const cooldownActive = Boolean(
    selected.isTop && lastTop && now - lastTop < TOP_REWARD_COOLDOWN_MS
  );

  let awardedTier = selected;
  let awardedTop = Boolean(selected.isTop);
  if (cooldownActive) {
    const downgraded = fallbackTier(box.rewardTiers);
    if (downgraded) {
      awardedTier = downgraded;
      awardedTop = false;
    }
  }

  const rewardPoints = Math.max(awardedTier.points, box.guaranteedMinPoints);

  return { tier: awardedTier, rewardPoints, awardedTop };
};
