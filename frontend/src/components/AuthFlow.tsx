"use client";

import { useState } from "react";
import { LoginForm } from "@/components/LoginForm";
import { RegisterForm } from "@/components/RegisterForm";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

type Phase = "email" | "login" | "register";

const steps: Array<{ id: Phase; title: string; detail: string }> = [
  { id: "email", title: "Identify account", detail: "Check if your Personal AI email already exists on Waashop." },
  { id: "login", title: "Authenticate", detail: "Existing users confirm their password securely." },
  { id: "register", title: "Create profile", detail: "New shoppers set their name and password once." },
];

const phaseCopy: Record<
  Phase,
  {
    heading: string;
    description: string;
  }
> = {
  email: {
    heading: "Let’s find your account",
    description: "We’ll detect whether you already shop on Waashop or need a new profile.",
  },
  login: {
    heading: "Welcome back",
    description: "Confirm your Personal AI password to sync your wallet, orders, and vendor access.",
  },
  register: {
    heading: "Create your Waashop profile",
    description:
      "Set a secure password once. Personal AI keeps this identity consistent across Mini App, web, and dashboard.",
  },
};

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

  const activeIndex = steps.findIndex((step) => step.id === phase);

  return (
    <div className="space-y-6">
      <div className="space-y-3" aria-live="polite">
        <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">
          <span>
            Step {activeIndex + 1} of {steps.length}
          </span>
          <button onClick={reset} className="text-indigo-500 hover:text-indigo-700">
            Reset
          </button>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {steps.map((step, index) => {
            const isActive = index === activeIndex;
            const isComplete = index < activeIndex;
            return (
              <div
                key={step.id}
                aria-current={isActive ? "step" : undefined}
                className={`rounded-2xl border px-4 py-3 text-xs ${
                  isActive
                    ? "border-indigo-200 bg-indigo-50 text-indigo-900"
                    : isComplete
                    ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                    : "border-slate-200 bg-white text-slate-500"
                }`}
              >
                <p className="font-semibold">{step.title}</p>
                <p className="mt-1 text-[11px] leading-relaxed">{step.detail}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-3xl border border-slate-100 bg-white/90 p-6 shadow-sm">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
            {phase === "email" ? "Identify" : phase === "login" ? "Authenticate" : "Enroll"}
          </p>
          <h2 className="text-xl font-semibold text-slate-900">{phaseCopy[phase].heading}</h2>
          <p className="text-sm text-slate-600">{phaseCopy[phase].description}</p>
        </div>

        {phase === "email" ? (
          <form onSubmit={handleEmailSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="auth-email" className="text-sm font-semibold text-slate-700">
                Email address
              </label>
              <input
                id="auth-email"
                name="email"
                type="email"
                required
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 placeholder-slate-400 shadow-sm focus:border-indigo-500 focus:outline-none"
                placeholder="you@example.com"
              />
            </div>
            {error && (
              <p className="text-sm text-red-500" role="alert">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-indigo-400"
            >
              {loading ? "Checking..." : "Continue"}
            </button>
            <p className="text-xs text-slate-500">
              Use your Personal AI credentials once—we keep the session synced across Mini App, desktop, and dashboard.
            </p>
          </form>
        ) : (
          <div className="mt-6 space-y-3">
            <div className="rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-3 text-xs text-slate-600">
              <p className="font-semibold text-slate-800">{email}</p>
              <p className="mt-1">Your identity is verified via Personal AI. Complete this step to unlock Waashop.</p>
            </div>
            {phase === "login" ? <LoginForm email={email} /> : <RegisterForm email={email} />}
          </div>
        )}
      </div>
    </div>
  );
}
