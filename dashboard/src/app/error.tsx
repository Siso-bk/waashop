"use client";

import Link from "next/link";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-xl space-y-4 rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm">
      <h1 className="text-lg font-semibold text-slate-900">Something went wrong</h1>
      <p className="text-sm text-slate-500">
        We could not load this dashboard section. Try again, or return to the overview.
      </p>
      {error?.digest && (
        <p className="text-xs text-slate-400">Error code: {error.digest}</p>
      )}
      <div className="flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white"
        >
          Retry
        </button>
        <Link
          href="/"
          className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600"
        >
          Back to overview
        </Link>
      </div>
    </div>
  );
}
