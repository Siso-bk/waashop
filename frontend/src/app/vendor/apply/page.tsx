import Link from "next/link";
import { redirect } from "next/navigation";
import { backendFetch } from "@/lib/backendClient";
import { getSessionUser } from "@/lib/queries";
import { VendorApplySubmitButton } from "@/components/VendorApplySubmitButton";

type VendorProfile = {
  name: string;
  description?: string;
  contactEmail?: string;
  contactPhone?: string;
  ownerHandle?: string;
  businessType?: "INDIVIDUAL" | "COMPANY";
  country?: string;
  city?: string;
  businessAddress?: string;
  website?: string;
  logoUrl?: string;
  categories?: string[];
  fulfillmentMethod?: "SHIPPING" | "DIGITAL" | "SERVICE";
  processingTime?: "SAME_DAY" | "1_3_DAYS" | "3_7_DAYS" | "7_14_DAYS";
  returnsPolicy?: string;
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
        <p className="text-xs text-gray-500">Use your email or username@pai.</p>
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
            {(vendor.contactEmail || vendor.contactPhone) && (
              <div>
                <span className="text-xs uppercase tracking-[0.3em] text-gray-400">Contact</span>
                <p className="mt-1">
                  {vendor.contactEmail}
                  {vendor.contactEmail && vendor.contactPhone ? " · " : ""}
                  {vendor.contactPhone}
                </p>
              </div>
            )}
            {(vendor.country || vendor.city) && (
              <div>
                <span className="text-xs uppercase tracking-[0.3em] text-gray-400">Location</span>
                <p className="mt-1">{[vendor.city, vendor.country].filter(Boolean).join(", ")}</p>
              </div>
            )}
            {vendor.businessAddress && (
              <div>
                <span className="text-xs uppercase tracking-[0.3em] text-gray-400">Business address</span>
                <p className="mt-1">{vendor.businessAddress}</p>
              </div>
            )}
            {(vendor.businessType || vendor.ownerHandle) && (
              <div>
                <span className="text-xs uppercase tracking-[0.3em] text-gray-400">Business</span>
                <p className="mt-1">
                  {vendor.businessType === "COMPANY" ? "Company" : "Individual"}
                  {vendor.ownerHandle ? ` · @${vendor.ownerHandle}` : ""}
                </p>
              </div>
            )}
            {vendor.website && (
              <div>
                <span className="text-xs uppercase tracking-[0.3em] text-gray-400">Website</span>
                <p className="mt-1">{vendor.website}</p>
              </div>
            )}
            {vendor.logoUrl && (
              <div>
                <span className="text-xs uppercase tracking-[0.3em] text-gray-400">Brand logo</span>
                <p className="mt-1">{vendor.logoUrl}</p>
              </div>
            )}
            {vendor.categories?.length ? (
              <div>
                <span className="text-xs uppercase tracking-[0.3em] text-gray-400">Categories</span>
                <p className="mt-1">{vendor.categories.join(", ")}</p>
              </div>
            ) : null}
            {(vendor.fulfillmentMethod || vendor.processingTime) && (
              <div>
                <span className="text-xs uppercase tracking-[0.3em] text-gray-400">Operations</span>
                <p className="mt-1">
                  {vendor.fulfillmentMethod?.toLowerCase().replace("_", " ")}
                  {vendor.fulfillmentMethod && vendor.processingTime ? " · " : ""}
                  {vendor.processingTime?.toLowerCase().replace("_", " ")}
                </p>
              </div>
            )}
            {vendor.returnsPolicy && (
              <div>
                <span className="text-xs uppercase tracking-[0.3em] text-gray-400">Returns</span>
                <p className="mt-1">{vendor.returnsPolicy}</p>
              </div>
            )}
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
              Status
              <span className="rounded-full border border-black/10 px-3 py-1 text-black">{vendor.status}</span>
            </div>
            {vendor.status === "APPROVED" && (
              <Link
                href="/vendor"
                className="inline-flex w-fit items-center justify-center rounded-full border border-black px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-black transition hover:bg-black hover:text-white"
              >
                Open vendor dashboard
              </Link>
            )}
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
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm text-gray-600">
                <span>Contact email</span>
                <input
                  name="contactEmail"
                  type="email"
                  defaultValue={user.email}
                  className="w-full rounded-2xl border border-black/10 px-4 py-3 text-black"
                  placeholder="brand@email.com"
                />
              </label>
              <label className="space-y-2 text-sm text-gray-600">
                <span>Contact phone</span>
                <input
                  name="contactPhone"
                  type="tel"
                  className="w-full rounded-2xl border border-black/10 px-4 py-3 text-black"
                  placeholder="+1 555 000 1111"
                />
              </label>
              <label className="space-y-2 text-sm text-gray-600">
                <span>Owner username@pai</span>
                <input
                  name="ownerHandle"
                  defaultValue={user.username ?? ""}
                  className="w-full rounded-2xl border border-black/10 px-4 py-3 text-black"
                  placeholder="yourhandle"
                />
              </label>
              <label className="space-y-2 text-sm text-gray-600">
                <span>Business type</span>
                <select
                  name="businessType"
                  className="w-full rounded-2xl border border-black/10 px-4 py-3 text-black"
                  defaultValue="INDIVIDUAL"
                >
                  <option value="INDIVIDUAL">Individual</option>
                  <option value="COMPANY">Company</option>
                </select>
              </label>
              <label className="space-y-2 text-sm text-gray-600">
                <span>Country/region</span>
                <input
                  name="country"
                  className="w-full rounded-2xl border border-black/10 px-4 py-3 text-black"
                  placeholder="United States"
                />
              </label>
              <label className="space-y-2 text-sm text-gray-600">
                <span>City</span>
                <input
                  name="city"
                  className="w-full rounded-2xl border border-black/10 px-4 py-3 text-black"
                  placeholder="New York"
                />
              </label>
              <label className="space-y-2 text-sm text-gray-600 sm:col-span-2">
                <span>Business address</span>
                <textarea
                  name="businessAddress"
                  rows={2}
                  className="w-full rounded-2xl border border-black/10 px-4 py-3 text-black"
                  placeholder="Street, building, area"
                />
              </label>
              <label className="space-y-2 text-sm text-gray-600 sm:col-span-2">
                <span>Website or social link (optional)</span>
                <input
                  name="website"
                  type="url"
                  className="w-full rounded-2xl border border-black/10 px-4 py-3 text-black"
                  placeholder="https://instagram.com/yourbrand"
                />
              </label>
              <label className="space-y-2 text-sm text-gray-600 sm:col-span-2">
                <span>Brand logo URL (optional)</span>
                <input
                  name="logoUrl"
                  type="url"
                  className="w-full rounded-2xl border border-black/10 px-4 py-3 text-black"
                  placeholder="https://.../logo.png"
                />
              </label>
            </div>
            <div className="space-y-2 text-sm text-gray-600">
              <span className="text-xs uppercase tracking-[0.3em] text-gray-400">Categories</span>
              <div className="flex flex-wrap gap-2">
                {CATEGORY_OPTIONS.map((category) => (
                  <label
                    key={category}
                    className="flex items-center gap-2 rounded-full border border-black/10 px-3 py-2 text-xs text-gray-600"
                  >
                    <input type="checkbox" name="categories" value={category} />
                    {category}
                  </label>
                ))}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm text-gray-600">
                <span>Fulfillment method</span>
                <select
                  name="fulfillmentMethod"
                  className="w-full rounded-2xl border border-black/10 px-4 py-3 text-black"
                  defaultValue="SHIPPING"
                >
                  <option value="SHIPPING">Shipping</option>
                  <option value="DIGITAL">Digital delivery</option>
                  <option value="SERVICE">Service</option>
                </select>
              </label>
              <label className="space-y-2 text-sm text-gray-600">
                <span>Processing time</span>
                <select
                  name="processingTime"
                  className="w-full rounded-2xl border border-black/10 px-4 py-3 text-black"
                  defaultValue="1_3_DAYS"
                >
                  <option value="SAME_DAY">Same day</option>
                  <option value="1_3_DAYS">1-3 days</option>
                  <option value="3_7_DAYS">3-7 days</option>
                  <option value="7_14_DAYS">7-14 days</option>
                </select>
              </label>
            </div>
            <label className="space-y-2 text-sm text-gray-600">
              <span>Returns policy (optional)</span>
              <textarea
                name="returnsPolicy"
                rows={3}
                className="w-full rounded-2xl border border-black/10 px-4 py-3 text-black"
                placeholder="Share your return window, conditions, and refund timing."
              />
            </label>
            <VendorApplySubmitButton />
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
  const contactEmail = valueOrUndefined(formData.get("contactEmail"));
  const contactPhone = valueOrUndefined(formData.get("contactPhone"));
  const ownerHandle = valueOrUndefined(formData.get("ownerHandle"));
  const businessType = valueOrUndefined(formData.get("businessType"));
  const country = valueOrUndefined(formData.get("country"));
  const city = valueOrUndefined(formData.get("city"));
  const businessAddress = valueOrUndefined(formData.get("businessAddress"));
  const website = valueOrUndefined(formData.get("website"));
  const logoUrl = valueOrUndefined(formData.get("logoUrl"));
  const fulfillmentMethod = valueOrUndefined(formData.get("fulfillmentMethod"));
  const processingTime = valueOrUndefined(formData.get("processingTime"));
  const returnsPolicy = valueOrUndefined(formData.get("returnsPolicy"));
  const categories = formData.getAll("categories").map((entry) => String(entry)).filter(Boolean);
  if (!name) {
    redirect("/vendor?status=error&message=" + encodeURIComponent("Please enter a brand name."));
  }
  try {
    await backendFetch("/api/vendors", {
      method: "POST",
      body: JSON.stringify({
        name,
        description: description || undefined,
        contactEmail,
        contactPhone,
        ownerHandle,
        businessType,
        country,
        city,
        businessAddress,
        website,
        logoUrl,
        categories: categories.length ? categories : undefined,
        fulfillmentMethod,
        processingTime,
        returnsPolicy,
      }),
    });
    redirect("/vendor?status=submitted");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to submit vendor application";
    redirect(`/vendor?status=error&message=${encodeURIComponent(message)}`);
  }
}

const CATEGORY_OPTIONS = [
  "Apparel",
  "Accessories",
  "Collectibles",
  "Digital",
  "Home goods",
  "Beauty",
  "Wellness",
  "Gaming",
  "Art",
  "Other",
];

const valueOrUndefined = (value: FormDataEntryValue | null) => {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};
