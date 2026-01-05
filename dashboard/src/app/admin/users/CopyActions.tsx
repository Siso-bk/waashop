"use client";

import { useState } from "react";

export function CopyActions({ userId, contact }: { userId: string; contact?: string }) {
  const [copied, setCopied] = useState<"id" | "contact" | null>(null);

  const handleCopy = async (value: string, type: "id" | "contact") => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(type);
      window.setTimeout(() => setCopied(null), 1500);
    } catch {
      setCopied(null);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
      <button
        type="button"
        className="rounded-full border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-600 hover:border-indigo-200 hover:text-indigo-600"
        onClick={() => handleCopy(userId, "id")}
        suppressHydrationWarning
      >
        {copied === "id" ? "Copied" : "Copy ID"}
      </button>
      {contact && (
        <button
          type="button"
          className="rounded-full border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-600 hover:border-indigo-200 hover:text-indigo-600"
          onClick={() => handleCopy(contact, "contact")}
          suppressHydrationWarning
        >
          {copied === "contact" ? "Copied" : "Copy contact"}
        </button>
      )}
    </div>
  );
}
