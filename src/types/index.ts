export interface RewardTier {
  points: number;
  probability: number;
  isTop?: boolean;
}

export interface MysteryBoxDto {
  id: string;
  boxId: string;
  name: string;
  priceCoins: number;
  guaranteedMinPoints: number;
  rewardTiers: RewardTier[];
}

export interface LedgerEntryDto {
  id: string;
  deltaCoins: number;
  deltaPoints: number;
  reason: string;
  meta?: Record<string, unknown>;
  createdAt: string;
}
