"use client";

import { useCallback, useState } from "react";
import { LoginForm } from "@/components/LoginForm";
import { RegisterForm } from "@/components/RegisterForm";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const PAI_BASE_URL = process.env.NEXT_PUBLIC_PAI_BASE_URL;

type Phase = "email" | "login" | "register";

export function AuthFlow() {
  const [phase, setPhase] = useState<Phase>("email");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleEmailSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const value = formData.get("email");
    if (!value || typeof value !== "string") {
      setError("Email is required");
      return;
    }
    if (!API_BASE_URL) {
      setError("Missing API base URL");
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_BASE_URL}/api/auth/email-status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: value }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Unable to check email");
      }
      setEmail(value);
      setPhase(data.exists ? "login" : "register");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to check email";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setPhase("email");
    setEmail("");
    setError(null);
  };

  if (phase === "email") {
    return (
      <form onSubmit={handleEmailSubmit} className="space-y-4">
        <div>
          <label htmlFor="auth-email" className="text-sm font-medium text-slate-600">
            Email address
          </label>
          <input
            id="auth-email"
            name="email"
            type="email"
            required
            className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            placeholder="you@example.com"
          />
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-indigo-400"
        >
          {loading ? "Checking..." : "Continue"}
        </button>
      </form>
    );
  }

  const handlePaiLaunch = useCallback(() => {
    if (!PAI_BASE_URL || typeof window === "undefined") {
      return;
    }
    try {
      const target = new URL(PAI_BASE_URL);
      target.searchParams.set("redirect", window.location.origin);
      window.location.href = target.toString();
    } catch {
      window.location.href = PAI_BASE_URL;
    }
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm text-slate-500">
        <p>{phase === "login" ? "Welcome back" : "Create your account"}</p>
        <button onClick={reset} className="text-indigo-600 hover:underline">
          Use a different email
        </button>
      </div>
      {phase === "login" ? <LoginForm email={email} /> : <RegisterForm email={email} />}
      {PAI_BASE_URL && (
        <button
          type="button"
          onClick={handlePaiLaunch}
          className="inline-flex w-full items-center justify-center rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:text-indigo-600"
        >
          Login with PAI
        </button>
      )}
    </div>
  );
}
