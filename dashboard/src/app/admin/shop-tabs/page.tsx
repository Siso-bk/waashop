import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { PendingButton } from "@/components/PendingButton";
import { PageHeader } from "@/components/PageHeader";
import { backendFetch } from "@/lib/backendClient";
import { getAdminShopTabs, getProfile } from "@/lib/queries";
import { requireToken } from "@/lib/session";
import { ShopTabDto } from "@/types";

export const dynamic = "force-dynamic";

const SHOP_TAB_KEYS = [
  "mystery-boxes",
  "products",
  "challenges",
  "jackpot-plays",
  "coming-soon",
] as const;

type PageProps = {
  searchParams?: Record<string, string | string[] | undefined> | Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminShopTabsPage({ searchParams }: PageProps) {
  const plainParams = (await Promise.resolve(searchParams ?? {})) as Record<string, string | string[] | undefined>;
  const statusValue = typeof plainParams.status === "string" ? plainParams.status : null;
  const messageValue = typeof plainParams.message === "string" ? plainParams.message : null;
  await requireToken();
  const { user } = await getProfile();
  if (!user.roles.includes("admin")) {
    redirect("/");
  }

  const { tabs } = await getAdminShopTabs();
  const status = statusValue;
  const message = messageValue ? decodeURIComponent(messageValue) : null;

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Admin" title="Shop Tabs" description="Control the tabs shown on the shop page." />
      {status === "updated" && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          Shop tabs updated successfully.
        </div>
      )}
      {status === "error" && message && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{message}</div>
      )}

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-500">
          Tip: the tab key <span className="font-semibold text-slate-700">mystery-boxes</span> powers the live box list.
        </p>
        <form action={saveTabs} className="space-y-6">
          <input type="hidden" name="tabCount" value={tabs.length} />
          <div className="space-y-4">
            {tabs.map((tab, index) => (
              <div key={tab.key} className="rounded-2xl border border-slate-200 p-4">
                <div className="grid gap-4 md:grid-cols-4">
                  <label className="space-y-1 text-xs uppercase tracking-[0.3em] text-slate-500">
                    Key
                    <select
                      name={`tab-${index}-key`}
                      defaultValue={tab.key}
                      className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900"
                    >
                      {SHOP_TAB_KEYS.map((key) => (
                        <option key={key} value={key}>
                          {key}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="space-y-1 text-xs uppercase tracking-[0.3em] text-slate-500 md:col-span-2">
                    Label
                    <input
                      name={`tab-${index}-label`}
                      defaultValue={tab.label}
                      className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900"
                    />
                  </label>
                  <label className="space-y-1 text-xs uppercase tracking-[0.3em] text-slate-500">
                    Order
                    <input
                      name={`tab-${index}-order`}
                      type="number"
                      min={0}
                      defaultValue={tab.order ?? index}
                      className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900"
                    />
                  </label>
                </div>
                <label className="mt-4 inline-flex items-center gap-2 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    name={`tab-${index}-enabled`}
                    defaultChecked={tab.enabled !== false}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600"
                  />
                  Enabled
                </label>
              </div>
            ))}
          </div>
          <PendingButton
            pendingLabel="Saving..."
            className="inline-flex items-center justify-center rounded-full bg-indigo-600 px-6 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500"
          >
            Save tabs
          </PendingButton>
        </form>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">Add new tab</h2>
          <p className="mt-1 text-sm text-slate-500">Choose a key from the list to ensure it matches the shop routing.</p>
          <form action={addTab} className="mt-4 space-y-3 text-sm text-slate-700">
            <select
              name="key"
              className="w-full rounded-xl border border-slate-200 px-3 py-2"
              defaultValue=""
            >
              <option value="" disabled>
                Select a key
              </option>
              {SHOP_TAB_KEYS.map((key) => (
                <option key={key} value={key}>
                  {key}
                </option>
              ))}
            </select>
            <input
              name="label"
              placeholder="Label"
              className="w-full rounded-xl border border-slate-200 px-3 py-2"
            />
            <input
              name="order"
              type="number"
              min={0}
              placeholder="Order"
              className="w-full rounded-xl border border-slate-200 px-3 py-2"
            />
            <label className="inline-flex items-center gap-2 text-sm text-slate-600">
              <input type="checkbox" name="enabled" defaultChecked className="h-4 w-4 rounded border-slate-300 text-indigo-600" />
              Enabled
            </label>
            <PendingButton
              pendingLabel="Adding..."
              className="w-full rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Add tab
            </PendingButton>
          </form>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">Remove tab</h2>
          <p className="mt-1 text-sm text-slate-500">Delete a tab by key.</p>
          <form action={removeTab} className="mt-4 space-y-3 text-sm text-slate-700">
            <input
              name="key"
              placeholder="key (e.g. challenges)"
              className="w-full rounded-xl border border-slate-200 px-3 py-2"
            />
            <PendingButton
              pendingLabel="Removing..."
              className="w-full rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100"
            >
              Remove tab
            </PendingButton>
          </form>
        </div>
      </section>
    </div>
  );
}

async function saveTabs(formData: FormData) {
  "use server";
  try {
    const count = Number(formData.get("tabCount") || 0);
    const tabs: ShopTabDto[] = [];
    for (let index = 0; index < count; index += 1) {
      const key = String(formData.get(`tab-${index}-key`) || "").trim();
      const label = String(formData.get(`tab-${index}-label`) || "").trim();
      const orderRaw = String(formData.get(`tab-${index}-order`) || "").trim();
      const order = orderRaw ? Number(orderRaw) : index;
      const enabled = formData.get(`tab-${index}-enabled`) === "on";
      if (!key || !label) {
        throw new Error("Tab key and label are required.");
      }
      tabs.push({ key, label, order, enabled });
    }
    await backendFetch("/api/admin/shop-tabs", {
      method: "PUT",
      body: JSON.stringify({ tabs }),
    });
    revalidatePath("/admin/shop-tabs");
    redirect("/admin/shop-tabs?status=updated");
  } catch (error) {
    console.error("Save shop tabs error", error);
    const message = error instanceof Error ? error.message : "Unable to save tabs";
    const params = new URLSearchParams({ status: "error", message: encodeURIComponent(message) });
    redirect(`/admin/shop-tabs?${params.toString()}`);
  }
}

async function addTab(formData: FormData) {
  "use server";
  try {
    const key = String(formData.get("key") || "").trim();
    const label = String(formData.get("label") || "").trim();
    const orderRaw = String(formData.get("order") || "").trim();
    const order = orderRaw ? Number(orderRaw) : 0;
    const enabled = formData.get("enabled") === "on";
    if (!key || !label) {
      throw new Error("Key and label are required.");
    }
    const { tabs } = await backendFetch<{ tabs: ShopTabDto[] }>("/api/admin/shop-tabs");
    if (tabs.some((tab) => tab.key.toLowerCase() === key.toLowerCase())) {
      throw new Error("Tab key already exists.");
    }
    const updated = [...tabs, { key, label, order, enabled }];
    await backendFetch("/api/admin/shop-tabs", {
      method: "PUT",
      body: JSON.stringify({ tabs: updated }),
    });
    revalidatePath("/admin/shop-tabs");
    redirect("/admin/shop-tabs?status=updated");
  } catch (error) {
    console.error("Add shop tab error", error);
    const message = error instanceof Error ? error.message : "Unable to add tab";
    const params = new URLSearchParams({ status: "error", message: encodeURIComponent(message) });
    redirect(`/admin/shop-tabs?${params.toString()}`);
  }
}

async function removeTab(formData: FormData) {
  "use server";
  try {
    const key = String(formData.get("key") || "").trim();
    if (!key) {
      throw new Error("Key is required.");
    }
    const { tabs } = await backendFetch<{ tabs: ShopTabDto[] }>("/api/admin/shop-tabs");
    const updated = tabs.filter((tab) => tab.key.toLowerCase() !== key.toLowerCase());
    if (updated.length === tabs.length) {
      throw new Error("Tab key not found.");
    }
    await backendFetch("/api/admin/shop-tabs", {
      method: "PUT",
      body: JSON.stringify({ tabs: updated }),
    });
    revalidatePath("/admin/shop-tabs");
    redirect("/admin/shop-tabs?status=updated");
  } catch (error) {
    console.error("Remove shop tab error", error);
    const message = error instanceof Error ? error.message : "Unable to remove tab";
    const params = new URLSearchParams({ status: "error", message: encodeURIComponent(message) });
    redirect(`/admin/shop-tabs?${params.toString()}`);
  }
}
