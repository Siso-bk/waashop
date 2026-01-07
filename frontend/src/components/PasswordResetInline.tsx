"use client";

import { useState } from "react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "";

type PasswordResetInlineProps = {
  initialEmail?: string;
};

export function PasswordResetInline({ initialEmail = "" }: PasswordResetInlineProps) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  const handleSend = async () => {
    if (!email.trim()) {
      setStatus("error");
      setMessage("Enter your account email to receive a reset code.");
      return;
    }
    setStatus("sending");
    setMessage(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/forgot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error((data as { error?: string }).error || "Unable to send reset code.");
      }
      setStatus("success");
      setMessage("Reset code sent. Check your inbox for the code.");
    } catch (err) {
      const text = err instanceof Error ? err.message : "Unable to send reset code.";
      setStatus("error");
      setMessage(text);
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs font-semibold underline underline-offset-2 opacity-70"
        style={{ color: "var(--app-text)" }}
      >
        Forgot password?
      </button>
    );
  }

  return (
    <div className="space-y-2 rounded-2xl border border-black/10 bg-white p-3 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] opacity-70" style={{ color: "var(--app-text)" }}>
          Reset password
        </p>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-[10px] font-semibold uppercase tracking-[0.3em] opacity-60"
          style={{ color: "var(--app-text)" }}
        >
          Close
        </button>
      </div>
      <label className="space-y-1 text-xs opacity-70" style={{ color: "var(--app-text)" }}>
        Email
        <input
          type="email"
          value={email}
          onChange={event => setEmail(event.target.value)}
          className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-black focus:border-black focus:outline-none"
          placeholder="you@example.com"
        />
      </label>
      <button
        type="button"
        onClick={handleSend}
        disabled={status === "sending"}
        className="w-full rounded-full border border-[var(--surface-border)] bg-[var(--surface-bg)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-[var(--app-text)] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === "sending" ? (
          <span className="inline-flex items-center justify-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            Sending…
          </span>
        ) : (
          "Send reset code"
        )}
      </button>
      {message && (
        <p className={`text-xs ${status === "error" ? "text-red-500" : "text-emerald-600"}`}>
          {message}
        </p>
      )}
      {status === "success" && (
        <div className="space-y-2">
          <label className="space-y-1 text-xs opacity-70" style={{ color: "var(--app-text)" }}>
            Reset code
            <input
              type="text"
              value={code}
              onChange={event => setCode(event.target.value)}
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-black focus:border-black focus:outline-none"
              placeholder="6-digit code"
            />
          </label>
          <a
            href={`/reset?email=${encodeURIComponent(email.trim())}&code=${encodeURIComponent(code.trim())}`}
            className="inline-flex w-full items-center justify-center rounded-full border border-[var(--surface-border)] bg-[var(--surface-bg)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-[var(--app-text)] transition hover:opacity-90"
          >
            Continue
          </a>
        </div>
      )}
    </div>
  );
}
