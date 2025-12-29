# Mystery Wallet

A minimal ecommerce + virtual wallet experience for selling transparent mystery boxes inside a Telegram Mini App. Users spend coins, earn points, and every purchase is settled server-side with crypto-secure randomness and Mongo-backed ledgers.

## Tech Stack
- Next.js App Router + TypeScript + Tailwind CSS
- MongoDB + Mongoose models for Users, Ledger entries, Purchases, and Mystery Boxes
- Telegram Mini App authentication (initData verification + JWT session cookie)
- Secure reward engine with per-user top prize cooldowns and idempotent purchase processing

## Getting Started
1. **Install dependencies**
   ```bash
   npm install
   ```
2. **Configure environment** – copy `.env.example` to `.env.local` and set:
   - `MONGODB_URI` – Mongo connection string
   - `TELEGRAM_BOT_TOKEN` – Bot token used to verify Telegram Mini App `initData`
   - `JWT_SECRET` – any strong secret for signing session cookies
   - `WEBAPP_URL` – public HTTPS URL where the Mini App is deployed (used for the `/start` button)
3. **Run the dev server**
   ```bash
   npm run dev
   ```
4. **Seed data (dev helper)** – optional POST to `/api/admin/seed` (blocked in production) to create the default box (`BOX_1000`). Pass `{ "telegramId": "123" }` to pre-fund a test user with 5,000 coins, or omit the body to only seed the box.

## Telegram Authentication Flow
- Web client obtains `window.Telegram.WebApp.initData` inside the Mini App context.
- POST `/api/auth/telegram` with `{ initData }`.
- Server verifies the HMAC signature, upserts the user, grants 5,000 dev coins for first-time users (non-production), sets an HTTP-only JWT cookie, and responds with profile + balances.

### Telegram Bot Webhook
- Set your bot webhook to `https://<your-domain>/api/telegram/webhook` (e.g. `curl "https://api.telegram.org/bot<token>/setWebhook?url=https://example.com/api/telegram/webhook"`).
- The webhook responds to `/start` by replying with a welcome message and a `web_app` button that opens the URL from `WEBAPP_URL`.

## API Overview
| Method & Path | Description |
| --- | --- |
| `POST /api/auth/telegram` | Verify Telegram init data, upsert the user, start a session. |
| `GET /api/me` | Return authenticated balances/profile. |
| `GET /api/boxes` | List active boxes with reward tiers & probabilities. |
| `POST /api/boxes/buy` | Purchase a box atomically. Requires `boxId` + client-generated `purchaseId` (idempotency key). Deducts coins, credits rewards, updates ledgers and purchase status. |
| `GET /api/ledger` | Paginated ledger entries (`page`, `limit`). |
| `POST /api/admin/seed` | Dev-only seeding for the default mystery box + optional user coins. |

## Business Logic Highlights
- **Virtual wallet** tracks separate `coins` (spendable credits) and `points` (non-cashable rewards).
- **Reward engine** pulls from the box tier table using crypto-secure randomness with transparent probabilities shown on every box page.
- **Top tier fairness** enforces a 7-day cooldown per user. If they roll the top tier while on cooldown, they automatically receive the highest non-top tier.
- **Guaranteed minimum** ensures every purchase awards at least the box’s `guaranteedMinPoints`.
- **Transactions & ledgers** run inside MongoDB transactions (when supported) and log both the coin debit and points credit for auditability. Purchases are idempotent via the `purchaseId` field plus unique index.

## Development Notes
- App Router pages (`/`, `/boxes/[boxId]`, `/wallet`) read directly from Mongo using shared model helpers.
- The UI includes a modal animation when a reward is revealed, plus tables outlining every probability.
- Adjust reward tables or add new boxes via MongoDB; the UI automatically surfaces active boxes.
