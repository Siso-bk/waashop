import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const requireEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required env var: ${key}`);
  }
  return value;
};

const run = async () => {
  const uri = requireEnv("MONGODB_URI");
  await mongoose.connect(uri, { dbName: "waashop" });
  const db = mongoose.connection;

  const userResult = await db.collection("users").updateMany(
    { coinsBalance: { $exists: true } },
    [
      {
        $set: {
          minisBalance: { $ifNull: ["$minisBalance", "$coinsBalance"] },
        },
      },
      { $unset: "coinsBalance" },
    ]
  );

  const ledgerResult = await db.collection("ledgers").updateMany(
    { deltaCoins: { $exists: true } },
    [
      {
        $set: {
          deltaMinis: { $ifNull: ["$deltaMinis", "$deltaCoins"] },
        },
      },
      { $unset: "deltaCoins" },
    ]
  );

  const depositResult = await db.collection("depositrequests").updateMany(
    { $or: [{ amountCoins: { $exists: true } }, { coinsCredited: { $exists: true } }] },
    [
      {
        $set: {
          amountMinis: { $ifNull: ["$amountMinis", "$amountCoins"] },
          minisCredited: { $ifNull: ["$minisCredited", "$coinsCredited"] },
        },
      },
      { $unset: ["amountCoins", "coinsCredited"] },
    ]
  );

  const purchaseResult = await db.collection("purchases").updateMany(
    { $or: [{ priceCoins: { $exists: true } }, { rewardCoins: { $exists: true } }] },
    [
      {
        $set: {
          priceMinis: { $ifNull: ["$priceMinis", "$priceCoins"] },
          rewardMinis: { $ifNull: ["$rewardMinis", "$rewardCoins"] },
        },
      },
      { $unset: ["priceCoins", "rewardCoins"] },
    ]
  );

  const productResult = await db.collection("products").updateMany(
    {
      $or: [
        { priceCoins: { $exists: true } },
        { guaranteedMinPoints: { $exists: true } },
        { ticketPriceCoins: { $exists: true } },
        { "rewardTiers.points": { $exists: true } },
      ],
    },
    [
      {
        $set: {
          priceMinis: { $ifNull: ["$priceMinis", "$priceCoins"] },
          guaranteedMinMinis: { $ifNull: ["$guaranteedMinMinis", "$guaranteedMinPoints"] },
          ticketPriceMinis: { $ifNull: ["$ticketPriceMinis", "$ticketPriceCoins"] },
          rewardTiers: {
            $cond: [
              { $isArray: "$rewardTiers" },
              {
                $map: {
                  input: "$rewardTiers",
                  as: "tier",
                  in: {
                    minis: { $ifNull: ["$$tier.minis", "$$tier.points"] },
                    probability: "$$tier.probability",
                    isTop: "$$tier.isTop",
                  },
                },
              },
              "$rewardTiers",
            ],
          },
        },
      },
      { $unset: ["priceCoins", "guaranteedMinPoints", "ticketPriceCoins"] },
    ]
  );

  console.log("Minis migration complete.");
  console.log("users:", userResult.modifiedCount);
  console.log("ledgers:", ledgerResult.modifiedCount);
  console.log("depositrequests:", depositResult.modifiedCount);
  console.log("purchases:", purchaseResult.modifiedCount);
  console.log("products:", productResult.modifiedCount);

  await mongoose.disconnect();
};

run().catch((error) => {
  console.error("Minis migration failed:", error);
  process.exitCode = 1;
});
