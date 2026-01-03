"use client";

import { useState } from "react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "";

type PasswordResetInlineProps = {
  initialEmail?: string;
};

export function PasswordResetInline({ initialEmail = "" }: PasswordResetInlineProps) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState(initialEmail);
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
      setMessage("Reset code sent. Check your inbox.");
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
        className="text-xs font-semibold text-gray-500 underline underline-offset-2"
      >
        Forgot password?
      </button>
    );
  }

  return (
    <div className="space-y-2 rounded-2xl border border-black/10 bg-white p-3 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-500">Reset password</p>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-[10px] font-semibold uppercase tracking-[0.3em] text-gray-400"
        >
          Close
        </button>
      </div>
      <label className="space-y-1 text-xs text-gray-500">
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
        className="w-full rounded-full border border-black px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-black transition hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:bg-gray-200"
      >
        {status === "sending" ? "Sending…" : "Send reset code"}
      </button>
      {message && (
        <p className={`text-xs ${status === "error" ? "text-red-500" : "text-emerald-600"}`}>
          {message}
        </p>
      )}
    </div>
  );
}
