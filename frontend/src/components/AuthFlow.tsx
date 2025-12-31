"use client";

import { useState } from "react";
import { LoginForm } from "@/components/LoginForm";
import { RegisterForm } from "@/components/RegisterForm";

const PAI_BASE_URL = process.env.NEXT_PUBLIC_PAI_BASE_URL;

type Phase = "email" | "login" | "verify" | "details";

const steps: Array<{ id: Phase; title: string; detail: string }> = [
  { id: "email", title: "Identify account", detail: "Check if your Personal AI email already exists on Waashop." },
  { id: "login", title: "Authenticate", detail: "Existing users confirm their password securely." },
  { id: "verify", title: "Verify email", detail: "New shoppers confirm the six-digit code sent to their inbox." },
  { id: "details", title: "Create profile", detail: "Finish your Waashop profile with a name and password." },
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
  verify: {
    heading: "Verify your inbox",
    description: "Enter the six-digit code Personal AI emailed you. This keeps your identity secure across channels.",
  },
  details: {
    heading: "Create your Waashop profile",
    description:
      "Set a secure password once. Personal AI keeps this identity consistent across Mini App, web, and dashboard.",
  },
};

type CheckEmailResponse = {
  exists?: boolean;
  emailVerified?: boolean;
  message?: string;
};

type PreSignupResponse = {
  message?: string;
  devVerificationCode?: string;
};

type VerifyResponse = {
  preToken?: string;
};

const callPai = async <T,>(path: string, payload: Record<string, unknown>): Promise<T> => {
  if (!PAI_BASE_URL) {
    throw new Error("Missing Personal AI base URL.");
  }
  const response = await fetch(`${PAI_BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    cache: "no-store",
  });
  const data = (await response.json().catch(() => ({}))) as { error?: string; message?: string } & T;
  if (!response.ok) {
    throw new Error(data.error || data.message || "Unable to continue with Personal AI.");
  }
  return data;
};

export function AuthFlow() {
  const [phase, setPhase] = useState<Phase>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [preToken, setPreToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  const reset = () => {
    setPhase("email");
    setEmail("");
    setCode("");
    setPreToken(null);
    setError(null);
    setStatus(null);
    setDevCode(null);
    setResendMessage(null);
  };

  const requestPreSignup = async (normalizedEmail: string) => {
    const data = await callPai<PreSignupResponse>("/api/auth/pre-signup", { email: normalizedEmail });
    setPhase("verify");
    setStatus(data.message || "Check your inbox for a six-digit code.");
    setDevCode(data.devVerificationCode || null);
    setCode("");
    setPreToken(null);
    setResendMessage(null);
  };

  const handleEmailSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const value = formData.get("email");
    if (!value || typeof value !== "string") {
      setError("Email is required");
      return;
    }
    const normalized = value.trim().toLowerCase();
    try {
      setLoading(true);
      setError(null);
      setStatus(null);
      const data = await callPai<CheckEmailResponse>("/api/auth/check-email", { email: normalized });
      setEmail(normalized);
      if (data.exists && data.emailVerified) {
        setPhase("login");
        setStatus("Welcome back! Enter your password to continue.");
      } else {
        await requestPreSignup(normalized);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to check email";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email) {
      setError("Restart the flow to verify your email.");
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const data = await callPai<VerifyResponse>("/api/auth/pre-signup/verify", {
        email,
        code: code.trim(),
      });
      if (!data.preToken) {
        throw new Error("Missing verification token.");
      }
      setPreToken(data.preToken);
      setCode("");
      setPhase("details");
      setStatus("Code confirmed. Finish your profile to start shopping.");
      setResendMessage(null);
      setDevCode(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to verify the code";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      setResendMessage("Enter your email first.");
      return;
    }
    try {
      setResendLoading(true);
      setResendMessage("Sending a new code…");
      await requestPreSignup(email);
      setResendMessage("If the email is valid, a new code was sent.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to resend code";
      setResendMessage(message);
    } finally {
      setResendLoading(false);
    }
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
        <div className="grid gap-3 sm:grid-cols-4">
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
            {phase === "email" ? "Identify" : phase === "login" ? "Authenticate" : phase === "verify" ? "Verify" : "Enroll"}
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
            {phase !== "verify" && status && (
              <p className="text-xs text-slate-500" role="status">
                {status}
              </p>
            )}
            {phase === "login" ? (
              <LoginForm email={email} />
            ) : phase === "verify" ? (
              <form onSubmit={handleVerifySubmit} className="space-y-4" noValidate>
                <div>
                  <label htmlFor="verification-code" className="text-sm font-medium text-slate-600">
                    Verification code
                  </label>
                  <input
                    id="verification-code"
                    name="code"
                    inputMode="numeric"
                    pattern="\d{6}"
                    maxLength={6}
                    required
                    value={code}
                    onChange={(event) => setCode(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm tracking-[0.35em] focus:border-indigo-500 focus:outline-none"
                    placeholder="123456"
                  />
                </div>
                {error && (
                  <p className="text-sm text-red-500" role="alert">
                    {error}
                  </p>
                )}
                {status && <p className="text-xs text-slate-500">{status}</p>}
                <div className="flex flex-wrap gap-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-indigo-400"
                  >
                    {loading ? "Verifying…" : "Verify code"}
                  </button>
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resendLoading}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-indigo-200 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {resendLoading ? "Sending…" : "Resend code"}
                  </button>
                </div>
                {resendMessage && <p className="text-xs text-slate-500">{resendMessage}</p>}
                {devCode && (
                  <p className="text-xs text-amber-600">
                    Dev code: <strong>{devCode}</strong>
                  </p>
                )}
              </form>
            ) : (
              <RegisterForm email={email} preToken={preToken} onBack={() => setPhase("verify")} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
