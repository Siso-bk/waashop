# Mystery Wallet

An ecommerce + virtual wallet experience for Telegram Mini Apps. Users spend in-app coins on mystery boxes, receive guaranteed points, and every purchase is processed server-side with crypto-secure randomness and Mongo-backed ledgers.

## Monorepo Structure
| Path | Description |
| --- | --- |
| `/frontend` | Next.js 16 App Router frontend (TypeScript + Tailwind). Fetches data from the standalone API and handles the Mini App UX. |
| `/backend` | Express + TypeScript backend. Hosts the REST API, Telegram webhook, Mongoose models, reward engine, and business logic. Deploy this service to Render (or similar). |
| `/dashboard` | Next.js portal for admins & vendors. Uses the same API but provides management tooling (vendor onboarding, approvals, mystery-box submissions). |

## Frontend Setup (Next.js)
1. Install deps & start dev server:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
2. Copy `frontend/.env.example` → `frontend/.env.local` and set:
   - `NEXT_PUBLIC_API_BASE_URL` – public URL of the Express API (e.g. `https://waashop-api.onrender.com` or `http://localhost:4000`).
   - `API_BASE_URL` – same value for server-only calls (use the private Render URL if you want to bypass the CDN).
3. The Telegram Mini App client (`TelegramAuthSync`) posts init data directly to `${NEXT_PUBLIC_API_BASE_URL}/api/auth/telegram`, stores the returned JWT token in `waashop-token`, and refreshes the UI.

## Backend Setup (Express API)
1. Install deps & run locally:
   ```bash
   cd backend
   npm install
   npm run dev
   ```
2. Configure environment with `backend/.env.example`:
   - `PORT` – defaults to 4000 locally.
   - `MONGODB_URI` – Mongo connection string.
   - `TELEGRAM_BOT_TOKEN` – bot token used for initData verification and webhook responses.
   - `JWT_SECRET` – signing key for session tokens (shared only with the API).
   - `WEBAPP_URL` – public HTTPS URL of your frontend; used for `/start` replies.
   - `CORS_ORIGIN` – comma-delimited list of allowed frontend origins (e.g. `https://waashop.vercel.app`).
   - `ADMIN_TELEGRAM_IDS` – comma-separated Telegram user IDs that should be auto-promoted to admin.
3. Deploying to **Render**:
   - Create a new Web Service from the `/backend` folder.
   - Set the environment variables above in Render’s dashboard.
   - Render builds via `npm install && npm run build` and starts with `npm run start`.
4. Point BotFather’s `/setwebhook` to Render: `https://api.telegram.org/bot<token>/setWebhook?url=https://<render-service>/api/telegram/webhook`.

## Data & API Overview (backend)
| Method | Path | Notes |
| --- | --- | --- |
| `POST` | `/api/auth/telegram` | Verifies `initData`, upserts the user, returns `{ token, user }`. |
| `GET` | `/api/me` | Requires `Authorization: Bearer <token>`. Returns balances/profile. |
| `GET` | `/api/boxes` | Lists active boxes with reward tiers & probabilities. |
| `POST` | `/api/boxes/buy` | Atomic purchase; deducts coins, runs secure random reward, writes ledgers/purchase. Body `{ boxId, purchaseId }`. |
| `GET` | `/api/ledger` | Paginated ledger history (`page`, `limit`). |
| `POST` | `/api/vendors` | Authenticated user submits/updates a vendor profile (status defaults to `PENDING`). |
| `GET` | `/api/vendors/me` | Vendor can view their profile & approval status. |
| `GET` | `/api/admin/vendors` | Admin-only list of vendors (filterable by status). |
| `PATCH` | `/api/admin/vendors/:id/status` | Admin approves/rejects/suspends a vendor. |
| `POST` | `/api/vendors/products` | Approved vendor creates a mystery-box product (goes into `PENDING` state). |
| `GET` | `/api/vendors/products` | Vendor lists their own products. |
| `GET` | `/api/admin/products` | Admin overview of every product. |
| `PATCH` | `/api/admin/products/:id/status` | Admin activates/deactivates a product. |
| `POST` | `/api/admin/seed` | Dev-only helper that creates a seed vendor + mystery box. Blocked when `NODE_ENV === "production"`. |
| `POST` | `/api/telegram/webhook` | Handles `/start`, replies with Mini App button pointing to `WEBAPP_URL`. |

## Auth Flow Recap
1. Telegram launches the Mini App and injects `window.Telegram.WebApp.initData`.
2. `TelegramAuthSync` calls the Express API’s `/api/auth/telegram` endpoint.
3. The API verifies the HMAC signature, upserts the Mongo user (granting dev coins when not in production), issues a JWT, and returns `{ token, user }`.
4. The frontend stores the token in the `waashop-token` cookie (SameSite Lax) so server components and client fetches can forward `Authorization: Bearer` headers.
5. Subsequent UI renders call the API via `API_BASE_URL` to load `/api/me`, `/api/boxes`, `/api/ledger`, etc.

## Business Logic Highlights
- **Transparent rewards**: Each mystery box exposes its tier probabilities; the API enforces crypto-secure randomness and guarantees a minimum point payout.
- **Top-tier cooldown**: Users can only hit the top tier every 7 days; otherwise they’re downgraded to the next best tier.
- **Wallet ledger**: Every purchase writes a coin debit + points credit entry so `/wallet` stays auditable.
- **Idempotent purchases**: Clients supply a `purchaseId`; duplicates are ignored to prevent double credits.
- **Separation of concerns**: Next.js handles the Mini App UX, while the Express API can scale independently on Render.

## Developing / Deploying
1. Run the Express API locally (`backend/npm run dev`).
2. Start the Next.js app (from `frontend/`) with `.env.local` pointing to that API.
3. Seed data via `POST /api/admin/seed` while in dev.
4. Deploy the backend to Render, update the frontend env vars to the Render URL, and redeploy the Next.js project to Vercel.
5. Configure BotFather to point `/setdomain` and `/setmenubutton` to your Vercel domain; set `/setwebhook` to the Render endpoint.

With both services live, Telegram users can open the Mini App, authenticate automatically, and purchase boxes backed by the standalone API.

## Admin/Vendor Dashboard Setup
1. Install & run locally:
   ```bash
   cd dashboard
   npm install
   npm run dev
   ```
2. Copy `dashboard/.env.example` → `.env.local` and point both `API_BASE_URL` + `NEXT_PUBLIC_API_BASE_URL` to your backend (e.g. `http://localhost:4000`).
3. The current login flow is a placeholder that expects you to paste a valid Waashop JWT (e.g. grabbed from the Telegram Mini App). Replace this with your preferred authentication when ready.
4. Admin views:
   - `/admin/vendors` – review vendor applications, approve/suspend.
   - `/admin/products` – activate/deactivate submitted mystery boxes.
5. Vendor workspace (`/vendor`):
   - Submit/update vendor profile.
   - Create new mystery boxes (reward tiers as JSON).
   - See product statuses.

Everything in `/dashboard` talks to the same backend API, so once you wire a proper auth flow, the portal is ready for production use.
