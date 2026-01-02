import crypto from "crypto";
import { IProduct, IRewardTier } from "../models/Product";
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
  tiers.filter((tier) => !tier.isTop).sort((a, b) => b.minis - a.minis)[0];

export const resolveReward = (product: IProduct, user: IUser) => {
  const tiers = product.rewardTiers || [];
  if (tiers.length === 0) {
    throw new Error("Missing reward tiers configuration");
  }
  const selected = selectTier(tiers);
  const lastTop = user.lastTopWinAt?.getTime();
  const now = Date.now();

  let awardedTier = selected;
  let awardedTop = Boolean(selected.isTop);

  if (selected.isTop && lastTop && now - lastTop < TOP_REWARD_COOLDOWN_MS) {
    const downgraded = fallbackTier(tiers);
    if (downgraded) {
      awardedTier = downgraded;
      awardedTop = false;
    }
  }

  const rewardMinis = Math.max(awardedTier.minis, product.guaranteedMinPoints || 0);
  return { tier: awardedTier, rewardMinis, awardedTop };
};
