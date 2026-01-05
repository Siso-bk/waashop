"use client";

type Service = {
  id: string;
  title: string;
  summary: string;
  details: string;
  target: string;
};

export const SERVICES: Service[] = [
  {
    id: "profile",
    title: "Vendor profile",
    summary: "Identity, contact details, and approval status.",
    details:
      "Complete your vendor profile to unlock product and promo submissions. Approval updates show on your dashboard.",
    target: "#vendor-profile",
  },
  {
    id: "promos",
    title: "Promoted card",
    summary: "Optional spotlight placement with CTA.",
    details: "Submit a promo card with an optional image and CTA. Pending cards are reviewed by admins.",
    target: "#vendor-promos",
  },
  {
    id: "submissions",
    title: "Product submissions",
    summary: "Create products, mystery boxes, and challenges.",
    details: "Upload images, set pricing, and submit items for review. You can edit while pending.",
    target: "#vendor-submissions",
  },
  {
    id: "orders",
    title: "Orders",
    summary: "Manage fulfillment and delivery updates.",
    details: "Add tracking, notes, and status updates for customers. Escrow releases after delivery confirmation.",
    target: "#vendor-orders",
  },
  {
    id: "products",
    title: "Product library",
    summary: "Monitor status, pricing, and performance.",
    details: "Review your active and pending listings with quick edits before approval.",
    target: "#vendor-products",
  },
];

type ServicesSectionClientProps = {
  activeId: string | null;
  onChange: (id: string | null) => void;
};

export function ServicesSectionClient({ activeId, onChange }: ServicesSectionClientProps) {

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Services</p>
          <h2 className="mt-2 text-xl font-semibold text-slate-900">Manage every vendor task</h2>
          <p className="mt-1 text-sm text-slate-500">Tap a card to see details and jump to the section.</p>
        </div>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {SERVICES.map((service) => {
          const isActive = activeId === service.id;
          return (
            <button
              key={service.id}
              type="button"
              onClick={() => onChange(isActive ? null : service.id)}
              aria-pressed={isActive}
              className={`rounded-2xl border p-4 text-left transition ${
                isActive
                  ? "border-indigo-300 bg-white shadow-sm shadow-indigo-500/10"
                  : "border-slate-100 bg-slate-50 hover:border-indigo-200 hover:bg-white"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Service</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">{service.title}</p>
                  <p className="mt-2 text-sm text-slate-500">{service.summary}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
