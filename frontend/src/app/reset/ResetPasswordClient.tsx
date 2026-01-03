"use client";

import { useState } from "react";
import Link from "next/link";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "";

type ResetPasswordClientProps = {
  initialEmail?: string;
};

export function ResetPasswordClient({ initialEmail = "" }: ResetPasswordClientProps) {
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!code.trim()) {
      setStatus("error");
      setMessage("Enter the reset code from your email.");
      return;
    }
    if (password.length < 6) {
      setStatus("error");
      setMessage("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setStatus("error");
      setMessage("Passwords do not match.");
      return;
    }
    setStatus("loading");
    setMessage(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: code.trim(), password }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error((data as { error?: string }).error || "Unable to reset password.");
      }
      setStatus("success");
      setMessage("Password updated. You can sign in now.");
    } catch (err) {
      const text = err instanceof Error ? err.message : "Unable to reset password.";
      setStatus("error");
      setMessage(text);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <header className="space-y-2 text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Reset password</p>
        <h1 className="text-2xl font-semibold text-black">Enter your reset code</h1>
        <p className="text-sm text-gray-600">Use the code from your email and set a new password.</p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
        <label className="space-y-1 text-sm text-gray-600">
          Email (optional)
          <input
            type="email"
            value={email}
            onChange={event => setEmail(event.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-2xl border border-gray-300 px-3 py-2 text-sm text-black focus:border-black focus:outline-none"
          />
        </label>
        <label className="space-y-1 text-sm text-gray-600">
          Reset code
          <input
            type="text"
            value={code}
            onChange={event => setCode(event.target.value)}
            placeholder="6-digit code"
            className="w-full rounded-2xl border border-gray-300 px-3 py-2 text-sm text-black focus:border-black focus:outline-none"
          />
        </label>
        <label className="space-y-1 text-sm text-gray-600">
          New password
          <input
            type="password"
            value={password}
            onChange={event => setPassword(event.target.value)}
            placeholder="Create a secure password"
            className="w-full rounded-2xl border border-gray-300 px-3 py-2 text-sm text-black focus:border-black focus:outline-none"
          />
        </label>
        <label className="space-y-1 text-sm text-gray-600">
          Confirm password
          <input
            type="password"
            value={confirm}
            onChange={event => setConfirm(event.target.value)}
            placeholder="Repeat password"
            className="w-full rounded-2xl border border-gray-300 px-3 py-2 text-sm text-black focus:border-black focus:outline-none"
          />
        </label>
        {message && (
          <p className={`text-sm ${status === "error" ? "text-red-500" : "text-emerald-600"}`}>
            {message}
          </p>
        )}
        <button
          type="submit"
          disabled={status === "loading"}
          className="w-full rounded-full border border-black px-4 py-2 text-sm font-semibold text-black transition hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:bg-gray-200"
        >
          {status === "loading" ? "Updating…" : "Reset password"}
        </button>
        {status === "success" && (
          <Link
            href="/login"
            className="inline-flex w-full items-center justify-center rounded-full bg-black px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white transition hover:bg-black/80"
          >
            Sign in
          </Link>
        )}
      </form>
    </div>
  );
}
