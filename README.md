# Waashop

An ecommerce + virtual wallet experience for Telegram Mini Apps. Users spend in-app MIN on mystery boxes, receive guaranteed MIN, and every purchase is processed server-side with crypto-secure randomness and Mongo-backed ledgers.

## Monorepo Structure
| `/frontend` | Shopper-facing Next.js app (Mini App + web). Handles PAI authentication, wallet UI, and mystery box purchases. |
| `/backend` | Express + TypeScript API (Render). Hosts auth bridges, product catalog, reward engine, and Telegram webhook. |
| `/dashboard` | Next.js portal for admins & vendors (Vercel). Provides vendor onboarding, approvals, and submissions using the same API. |

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
   - `NEXT_PUBLIC_PAI_BASE_URL` – Personal AI auth base URL.
3. Customers sign in/up via PAI (email + password). The returned JWT is stored in `waashop-token` and used when calling the Waashop backend (`/api/me`, `/api/boxes`, etc.).

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
   - `PAI_BASE_URL` – base URL of your Personal AI auth service (used to validate dashboard logins).
3. Deploying to **Render**:
   - Create a new Web Service from the `/backend` folder.
   - Set the environment variables above in Render’s dashboard.
   - Render builds via `npm install && npm run build` and starts with `npm run start`.
4. Point BotFather’s `/setwebhook` to Render: `https://api.telegram.org/bot<token>/setWebhook?url=https://<render-service>/api/telegram/webhook`.

## Data & API Overview (backend)
| Method | Path | Notes |
| --- | --- | --- |
| `POST` | `/api/auth/telegram` | Verifies `initData`, upserts the user, returns `{ token, user }`. |
| `POST` | `/api/auth/email-status` | Returns `{ exists: boolean }` for the given email so the UI can branch between login/registration. |
| `GET` | `/api/me` | Requires `Authorization: Bearer <token>`. Returns balances/profile. |
| `GET` | `/api/boxes` | Lists active boxes with reward tiers & probabilities. |
| `POST` | `/api/boxes/buy` | Atomic purchase; deducts MIN, runs secure random reward, writes ledgers/purchase. Body `{ boxId, purchaseId }`. |
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
1. Users enter their email. Waashop calls `/api/auth/email-status` to determine whether it’s a returning account.
2. New users complete the PAI registration form (name + password); returning users enter their password. Both flows call PAI’s `/api/auth/register` or `/api/auth/login` respectively.
3. PAI returns a JWT, which the frontend stores in the `waashop-token` cookie (SameSite Lax).
4. Waashop immediately calls `/api/me` on the backend. If the token is a Waashop JWT we issued earlier, it verifies locally; otherwise it forwards the token to `PAI_BASE_URL/api/me`, upserts the user by email, and returns the Waashop profile.
5. With the session active, subsequent requests (Mini App, dashboard, vendor portal) include `Authorization: Bearer <token>` when calling the backend.

> **Personal AI portal redirect**
>
> If you prefer to send shoppers through the hosted Personal AI experience, configure PAI to redirect back to
> `https://waashop.vercel.app/login?token=<PAI_JWT>` (or `pai_token`). Waashop’s login page will detect the token,
> store it in the session cookie, call `/api/me` to sync balances, and finally redirect to `/`. Without that redirect
> parameter Waashop cannot capture the token, so the built-in forms remain the fallback.

## Business Logic Highlights
- **Transparent rewards**: Each mystery box exposes its tier probabilities; the API enforces crypto-secure randomness and guarantees a minimum MIN payout.
- **Top-tier cooldown**: Users can only hit the top tier every 7 days; otherwise they’re downgraded to the next best tier.
- **Wallet ledger**: Every purchase writes a MIN debit + MIN credit entry so `/wallet` stays auditable.
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
2. Copy `dashboard/.env.example` → `.env.local` and set:
   - `API_BASE_URL` / `NEXT_PUBLIC_API_BASE_URL` → backend URL.
   - `PAI_BASE_URL` → Personal AI auth base URL (used for login/register).
3. The login/register screens now call PAI’s `/api/auth/login` & `/api/auth/register` endpoints. On success they store the PAI JWT and sync with the Waashop backend, so you can use the portal in production.
4. Admin views:
   - `/admin/vendors` – review vendor applications, approve/suspend.
   - `/admin/products` – activate/deactivate submitted mystery boxes.
5. Vendor workspace (`/vendor`):
   - Submit/update vendor profile.
   - Create new mystery boxes (reward tiers as JSON).
   - See product statuses.

Everything in `/dashboard` talks to the same backend API, so once you wire a proper auth flow, the portal is ready for production use.
