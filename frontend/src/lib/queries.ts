import { backendFetch } from "@/lib/backendClient";
import { MysteryBoxDto, LedgerEntryDto, UserProfile } from "@/types";

type RawBox = MysteryBoxDto & {
  _id?: { toString: () => string } | string;
};

type RawLedger = LedgerEntryDto & {
  _id?: { toString: () => string } | string;
};

const mapBox = (box: RawBox): MysteryBoxDto => ({
  id: typeof box._id === "string" ? box._id : box._id?.toString?.() || box.id,
  boxId: box.boxId,
  name: box.name,
  priceCoins: box.priceCoins,
  guaranteedMinPoints: box.guaranteedMinPoints,
  rewardTiers: box.rewardTiers,
});

export const getActiveBoxes = async (): Promise<MysteryBoxDto[]> => {
  const data = await backendFetch<{ boxes: RawBox[] }>("/api/boxes", { auth: false });
  return data.boxes.map(mapBox);
};

export const getBoxByBoxId = async (boxId: string): Promise<MysteryBoxDto | null> => {
  const boxes = await getActiveBoxes();
  return boxes.find((box) => box.boxId === boxId) ?? null;
};

export const getSessionUser = async (): Promise<UserProfile | null> => {
  try {
    const data = await backendFetch<{ user: UserProfile }>("/api/me");
    return data.user;
  } catch {
    return null;
  }
};

export const getRecentLedger = async (limit = 50): Promise<LedgerEntryDto[]> => {
  const data = await backendFetch<{ items: RawLedger[] }>(`/api/ledger?limit=${limit}`);
  return data.items.map((entry) => ({
    id: typeof entry._id === "string" ? entry._id : entry._id?.toString?.() || entry.id,
    deltaCoins: entry.deltaCoins,
    deltaPoints: entry.deltaPoints,
    reason: entry.reason,
    meta: entry.meta || {},
    createdAt: entry.createdAt,
  }));
};
