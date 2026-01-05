import { Suspense } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { getProfile, getUserDeposits } from "@/lib/queries";
import { requireToken } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function DashboardHome() {
  await requireToken();
  return (
    <div className="space-y-6">
      <Suspense fallback={<BannersSkeleton />}>
        <DepositBanners />
      </Suspense>
      <Suspense fallback={<HeroSkeleton />}>
        <HeroSection />
      </Suspense>
      <Suspense fallback={<HighlightsSkeleton />}>
        <OverviewHighlights />
      </Suspense>
      <div className="grid gap-6 md:grid-cols-2">
        <Suspense fallback={<AccountSkeleton />}>
          <AccountCard />
        </Suspense>
        <Suspense fallback={<VendorSkeleton />}>
          <VendorCard />
        </Suspense>
      </div>
      <Suspense fallback={<AdminActionsSkeleton />}>
        <AdminActions />
      </Suspense>
    </div>
  );
}

async function DepositBanners() {
  const { deposits } = await getUserDeposits();
  const pendingDeposit = deposits.find((entry) => entry.status === "PENDING");
  const latestResolved = deposits.find((entry) => entry.status !== "PENDING");
  if (!pendingDeposit && !latestResolved) {
    return null;
  }
  const variant = pendingDeposit ? "pending" : latestResolved?.status === "APPROVED" ? "success" : "danger";
  const baseClass =
    variant === "pending"
      ? "border-amber-200 bg-amber-50 text-amber-900"
      : variant === "success"
        ? "border-emerald-200 bg-emerald-50 text-emerald-900"
        : "border-red-200 bg-red-50 text-red-900";

  return (
    <div className={`rounded-3xl border p-5 text-sm ${baseClass}`}>
      {pendingDeposit ? (
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em]">Deposit processing</p>
            <p className="mt-1 text-base font-semibold">{pendingDeposit.amountMinis.toLocaleString()} MINIS under review</p>
            <p className="text-xs text-amber-800/80">
              Submitted {new Date(pendingDeposit.createdAt).toLocaleString()}. We’ll notify you once it’s approved or rejected.
            </p>
          </div>
          <Link href="/deposits" className="text-sm font-semibold underline">
            View details
          </Link>
        </div>
      ) : latestResolved ? (
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em]">Deposit update</p>
            <p className="mt-1 text-base font-semibold">
              {latestResolved.amountMinis.toLocaleString()} MINIS{" "}
              {latestResolved.status === "APPROVED" ? "credited" : "rejected"}
            </p>
            <p className="text-xs">{new Date(latestResolved.updatedAt).toLocaleString()}</p>
            {latestResolved.adminNote && <p className="mt-1 text-xs opacity-80">{latestResolved.adminNote}</p>}
          </div>
          <Link href="/deposits" className="text-sm font-semibold underline">
            View more
          </Link>
        </div>
      ) : null}
    </div>
  );
}

async function HeroSection() {
  const { user } = await getProfile();
  const isAdmin = user.roles?.includes("admin");
  return (
    <section className="rounded-3xl bg-gradient-to-r from-slate-900 to-indigo-700 p-8 text-white shadow-lg">
      <PageHeader
        eyebrow="Welcome"
        title={user.firstName ? `Hey, ${user.firstName}!` : "Waashop Portal"}
        description="Track your balance, review vendor activity, and keep the storefront healthy."
        tone="light"
        actions={
          <div className="flex flex-wrap gap-3 text-sm">
            {isAdmin && (
              <Link href="/admin/vendors" className="rounded-full bg-white/20 px-4 py-2">
                Review Vendors
              </Link>
            )}
            {isAdmin && (
              <Link href="/admin/products" className="rounded-full bg-white/20 px-4 py-2">
                Review Products
              </Link>
            )}
            <Link href="/account" className="rounded-full bg-white/20 px-4 py-2">
              Account
            </Link>
          </div>
        }
      />
    </section>
  );
}

async function OverviewHighlights() {
  const [{ user, vendor }, { deposits }] = await Promise.all([getProfile(), getUserDeposits()]);
  const pendingDeposits = deposits.filter((entry) => entry.status === "PENDING");
  const pendingTotal = pendingDeposits.reduce((sum, entry) => sum + entry.amountMinis, 0);
  const vendorStatus = vendor ? vendor.status : "Not submitted";
  return (
    <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <HighlightCard label="Current balance" value={`${user.minisBalance.toLocaleString()} MINIS`} href="/minis" />
      <HighlightCard label="Roles" value={user.roles.join(", ")} href="/account" />
      <HighlightCard label="Vendor status" value={vendorStatus} href="/vendor" />
      <HighlightCard
        label="Pending deposits"
        value={pendingDeposits.length ? `${pendingDeposits.length} · ${pendingTotal.toLocaleString()} MINIS` : "None"}
        href="/deposits"
      />
    </section>
  );
}

function HighlightCard({ label, value, href }: { label: string; value: string; href: string }) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-indigo-200 hover:text-indigo-700"
    >
      <p className="text-xs uppercase tracking-[0.3em] text-slate-400 group-hover:text-indigo-400">{label}</p>
      <p className="mt-2 text-lg font-semibold text-slate-900 group-hover:text-indigo-700">{value}</p>
    </Link>
  );
}

async function AccountCard() {
  const { user } = await getProfile();
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-500">Account</h2>
      <p className="mt-2 text-xl font-semibold text-slate-900">{user.username || user.email || user.telegramId}</p>
      <p className="text-sm text-slate-500">Roles: {user.roles.join(", ")}</p>
      <div className="mt-4 text-sm">
        <div>
          <p className="text-slate-500">MINIS</p>
          <p className="text-2xl font-semibold text-indigo-600">{user.minisBalance.toLocaleString()}</p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-3 text-sm font-semibold">
        <Link href="/account" className="text-indigo-600">
          View profile →
        </Link>
        <Link href="/deposits" className="text-indigo-600">
          Submit deposit →
        </Link>
      </div>
    </div>
  );
}

async function VendorCard() {
  const { vendor } = await getProfile();
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-500">Vendor Status</h2>
      {vendor ? (
        <div className="mt-2 space-y-2">
          <p className="text-xl font-semibold text-slate-900">{vendor.name}</p>
          <StatusBadge status={vendor.status} />
          <p className="text-sm text-slate-500">{vendor.description || "No description"}</p>
          <Link href="/vendor" className="text-sm font-semibold text-indigo-600">
            Manage vendor profile
          </Link>
        </div>
      ) : (
        <div className="mt-2 text-sm text-slate-500">
          <p>No vendor profile submitted.</p>
          <Link href="/vendor" className="text-sm font-semibold text-indigo-600">
            Create vendor profile
          </Link>
        </div>
      )}
    </div>
  );
}

async function AdminActions() {
  const { user } = await getProfile();
  const isAdmin = user.roles?.includes("admin");
  if (!isAdmin) {
    return (
      <div className="rounded-2xl border border-amber-100 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-amber-600">Admin approval required</h2>
        <p className="mt-2 text-sm text-slate-600">Complete your vendor profile and wait for review.</p>
      </div>
    );
  }
  const cards = [
    { href: "/admin/vendors", title: "Review vendor applications", body: "Approve or suspend vendor accounts." },
    { href: "/admin/products", title: "Moderate mystery boxes", body: "Activate/deactivate vendor products." },
    { href: "/admin/home-hero", title: "Edit homepage hero", body: "Update copy and CTAs without redeploying." },
    { href: "/admin/home-highlights", title: "Edit homepage callouts", body: "Control the cards under the hero." },
    { href: "/admin/shop-tabs", title: "Manage shop tabs", body: "Curate the tabs shown on the shop page." },
    { href: "/admin/orders", title: "Resolve order disputes", body: "Review STANDARD product order claims." },
    { href: "/admin/promo-cards", title: "Review promo cards", body: "Approve sponsored placements." },
    { href: "/admin/deposits", title: "Process deposits", body: "Approve receipts and credit MINIS." },
    { href: "/admin/users", title: "Manage roles", body: "Promote admins and vendors." },
    { href: "/admin/settings", title: "Platform settings", body: "Update submission fees." },
    { href: "/admin/winners", title: "Post winners", body: "Highlight challenge and mystery champions." },
  ];
  return (
    <div className="rounded-2xl border border-indigo-100 bg-white p-6 shadow-sm">
      <h2 className="text-sm font-semibold text-indigo-600">Admin Quick Actions</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {cards.map((card) => (
          <Link key={card.href} href={card.href} className="rounded-xl border border-slate-200 p-4 hover:border-indigo-300">
            <p className="text-lg font-semibold text-slate-900">{card.title}</p>
            <p className="text-sm text-slate-500">{card.body}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

function SkeletonBlock({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-2xl bg-slate-200/70 ${className}`} />;
}

function BannersSkeleton() {
  return <SkeletonBlock className="h-24" />;
}

function HeroSkeleton() {
  return <SkeletonBlock className="h-40 bg-gradient-to-r from-slate-200 to-slate-300" />;
}

function AccountSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="animate-pulse space-y-4">
        <div className="h-4 w-24 rounded bg-slate-200" />
        <div className="h-6 w-40 rounded bg-slate-200" />
        <div className="grid grid-cols-2 gap-4">
          <div className="h-16 rounded bg-slate-100" />
          <div className="h-16 rounded bg-slate-100" />
        </div>
        <div className="h-4 w-32 rounded bg-slate-200" />
      </div>
    </div>
  );
}

function VendorSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="animate-pulse space-y-3">
        <div className="h-4 w-28 rounded bg-slate-200" />
        <div className="h-5 w-36 rounded bg-slate-200" />
        <div className="h-4 w-full rounded bg-slate-100" />
        <div className="h-4 w-1/2 rounded bg-slate-100" />
      </div>
    </div>
  );
}

function AdminActionsSkeleton() {
  return (
    <div className="rounded-2xl border border-indigo-50 bg-white p-6 shadow-sm">
      <div className="animate-pulse space-y-4">
        <div className="h-4 w-36 rounded bg-slate-200" />
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="h-20 rounded-xl border border-slate-100 bg-slate-50" />
          ))}
        </div>
      </div>
    </div>
  );
}

function HighlightsSkeleton() {
  return (
    <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, idx) => (
        <div key={idx} className="h-20 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="h-3 w-20 rounded bg-slate-200 animate-pulse" />
          <div className="mt-3 h-5 w-32 rounded bg-slate-100 animate-pulse" />
        </div>
      ))}
    </section>
  );
}
