"use client";

import { useFormStatus } from "react-dom";

export function VendorApplySubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex w-full items-center justify-center rounded-full border border-[var(--surface-border)] bg-[var(--app-text)] px-6 py-3 text-sm font-semibold text-[var(--app-bg)] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? (
        <span className="inline-flex items-center justify-center gap-2">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          Submitting...
        </span>
      ) : (
        "Submit application"
      )}
    </button>
  );
}
