import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import router from "./routes";
import { env } from "./config/env";
import { connectDB } from "./lib/db";

const app = express();

const corsOrigins = env.CORS_ORIGIN?.split(",").map((o) => o.trim()).filter(Boolean);
app.use(
  cors({
    origin: corsOrigins && corsOrigins.length > 0 ? corsOrigins : undefined,
    credentials: true,
  })
);
app.use(helmet());
app.use(express.json());
app.use(morgan("tiny"));

app.use("/api", router);
app.get("/health", (_req, res) => res.json({ ok: true, time: new Date().toISOString() }));

const start = async () => {
  try {
    await connectDB();
    app.listen(env.PORT, () => {
      console.log(`API listening on port ${env.PORT}`);
    });
  } catch (error) {
    console.error("Failed to start API", error);
    process.exit(1);
  }
};

start();
