import Link from "next/link";

export default function DashboardNotFound() {
  return (
    <div className="mx-auto max-w-xl space-y-4 rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm">
      <h1 className="text-lg font-semibold text-slate-900">Page not found</h1>
      <p className="text-sm text-slate-500">
        This dashboard section does not exist or has moved.
      </p>
      <Link
        href="/"
        className="inline-flex rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600"
      >
        Back to overview
      </Link>
    </div>
  );
}
