import { z } from "zod";

export const telegramAuthSchema = z.object({
  initData: z.string().min(1),
});

export const buyBoxSchema = z.object({
  boxId: z.string().min(1),
  purchaseId: z.string().min(1),
});

export const ledgerQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});
