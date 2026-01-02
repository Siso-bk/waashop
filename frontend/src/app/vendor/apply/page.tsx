import Link from "next/link";
import { redirect } from "next/navigation";
import { backendFetch } from "@/lib/backendClient";
import { getSessionUser } from "@/lib/queries";

type VendorProfile = {
  name: string;
  description?: string;
  status: "PENDING" | "APPROVED" | "SUSPENDED" | "REJECTED";
};

type PageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

export default async function VendorApplicationPage({ searchParams }: PageProps) {
  const user = await getSessionUser();
  const status = typeof searchParams?.status === "string" ? searchParams.status : null;
  const message = typeof searchParams?.message === "string" ? decodeURIComponent(searchParams.message) : null;

  if (!user) {
    return (
      <div className="space-y-4 rounded-3xl border border-black/10 bg-white p-6 text-center shadow-sm">
        <p className="text-sm text-gray-600">Sign in to start your vendor application.</p>
        <Link
          href="/login?redirect=/vendor"
          className="inline-flex rounded-full border border-black px-4 py-2 text-sm font-semibold text-black transition hover:bg-black hover:text-white"
        >
          Sign in
        </Link>
      </div>
    );
  }

  let vendor: VendorProfile | null = null;
  try {
    const data = await backendFetch<{ vendor: VendorProfile }>("/api/vendors/me");
    vendor = data.vendor;
  } catch {
    vendor = null;
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-gray-400">Vendors</p>
        <h1 className="mt-2 text-2xl font-semibold text-black">Start a vendor application</h1>
        <p className="mt-2 text-sm text-gray-600">
          Submit your brand details once. We review and approve before your listings go live.
        </p>
      </section>

      {status === "submitted" && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          Vendor application submitted. We’ll notify you after review.
        </div>
      )}
      {status === "error" && message && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {message}
        </div>
      )}

      {vendor ? (
        <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-black">Your vendor status</h2>
          <div className="mt-4 grid gap-3 text-sm text-gray-600">
            <div>
              <span className="text-xs uppercase tracking-[0.3em] text-gray-400">Brand</span>
              <p className="mt-1 text-base font-semibold text-black">{vendor.name}</p>
            </div>
            {vendor.description && (
              <div>
                <span className="text-xs uppercase tracking-[0.3em] text-gray-400">Description</span>
                <p className="mt-1">{vendor.description}</p>
              </div>
            )}
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
              Status
              <span className="rounded-full border border-black/10 px-3 py-1 text-black">{vendor.status}</span>
            </div>
          </div>
        </section>
      ) : (
        <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <form action={submitVendorApplication} className="space-y-4">
            <label className="space-y-2 text-sm text-gray-600">
              <span>Brand name</span>
              <input
                name="name"
                required
                className="w-full rounded-2xl border border-black/10 px-4 py-3 text-black"
                placeholder="Studio Nomad"
              />
            </label>
            <label className="space-y-2 text-sm text-gray-600">
              <span>Description (optional)</span>
              <textarea
                name="description"
                rows={4}
                className="w-full rounded-2xl border border-black/10 px-4 py-3 text-black"
                placeholder="Tell us about your products, sourcing, and style."
              />
            </label>
            <button
              type="submit"
              className="inline-flex w-full items-center justify-center rounded-full bg-black px-6 py-3 text-sm font-semibold text-white transition hover:bg-black/85"
            >
              Submit application
            </button>
          </form>
        </section>
      )}
    </div>
  );
}

async function submitVendorApplication(formData: FormData) {
  "use server";
  const name = String(formData.get("name") || "").trim();
  const description = String(formData.get("description") || "").trim();
  if (!name) {
    redirect("/vendor?status=error&message=" + encodeURIComponent("Please enter a brand name."));
  }
  try {
    await backendFetch("/api/vendors", {
      method: "POST",
      body: JSON.stringify({ name, description: description || undefined }),
    });
    redirect("/vendor?status=submitted");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to submit vendor application";
    redirect(`/vendor?status=error&message=${encodeURIComponent(message)}`);
  }
}
