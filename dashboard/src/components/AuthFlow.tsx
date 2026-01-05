"use client";

import { useState } from "react";
import { LoginForm } from "@/components/LoginForm";
import { RegisterForm } from "@/components/RegisterForm";

type Phase = "email" | "login" | "verify" | "details";

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

const phaseCopy: Record<
  Phase,
  {
    heading: string;
    description: string;
  }
> = {
  email: {
    heading: "Find your account",
    description: "Enter your email to continue.",
  },
  login: {
    heading: "Welcome back",
    description: "Confirm your password to sync sessions.",
  },
  verify: {
    heading: "Verify your email",
    description: "Enter the six-digit code we just sent.",
  },
  details: {
    heading: "Create your profile",
    description: "Finish with your name and password.",
  },
};

const callWaashopAuth = async <T,>(path: string, payload: Record<string, unknown>): Promise<T> => {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    cache: "no-store",
  });
  const data = (await response.json().catch(() => ({}))) as { error?: string; message?: string } & T;
  if (!response.ok) {
    throw new Error(data.error || data.message || "Unable to continue");
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
    const data = await callWaashopAuth<PreSignupResponse>("/api/pai/auth/pre-signup", { email: normalizedEmail });
    setPhase("verify");
    setStatus(data.message || "We emailed you a six-digit code.");
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
      const data = await callWaashopAuth<CheckEmailResponse>("/api/pai/auth/check-email", { email: normalized });
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
      const data = await callWaashopAuth<VerifyResponse>("/api/pai/auth/pre-signup/verify", {
        email,
        code: code.trim(),
      });
      if (!data.preToken) {
        throw new Error("Missing verification token.");
      }
      setPreToken(data.preToken);
      setCode("");
      setPhase("details");
      setStatus("Code confirmed. Finish your profile to start working.");
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

  const sequence: Phase[] = ["email", "login", "verify", "details"];
  const currentStep = sequence.indexOf(phase) + 1;

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-slate-400">
        <span>
          Step {currentStep} of {sequence.length}
        </span>
        <button type="button" onClick={reset} className="text-slate-900 underline-offset-4 hover:underline">
          Reset
        </button>
      </div>
      <div className="mt-4 space-y-2">
        <h2 className="text-xl font-semibold text-slate-900">{phaseCopy[phase].heading}</h2>
        <p className="text-sm text-slate-500">{phaseCopy[phase].description}</p>
      </div>

      {phase === "email" && (
        <form onSubmit={handleEmailSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="portal-email" className="text-sm font-medium text-slate-600">
              Email address
            </label>
            <input
              id="portal-email"
              name="email"
              type="email"
              required
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              placeholder="you@example.com"
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          {status && <p className="text-sm text-slate-500">{status}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-indigo-400"
          >
            {loading ? "Checking..." : "Continue"}
          </button>
        </form>
      )}

      {phase === "login" && (
        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between text-sm text-slate-500">
            <p>Sign in for {email}</p>
            <button onClick={reset} className="text-indigo-600 hover:underline">
              Use a different email
            </button>
          </div>
          {status && <p className="text-sm text-slate-500">{status}</p>}
          <LoginForm email={email} />
        </div>
      )}

      {phase === "verify" && (
        <form onSubmit={handleVerifySubmit} className="mt-6 space-y-4">
          <label className="text-sm font-medium text-slate-600">
            Verification code
            <input
              value={code}
              onChange={(event) => setCode(event.target.value)}
              maxLength={6}
              inputMode="numeric"
              required
              className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-center text-lg tracking-[0.4em] focus:border-indigo-500 focus:outline-none"
              placeholder="000000"
            />
          </label>
          {devCode && (
            <p className="text-xs text-slate-500">
              Dev code: <span className="font-mono">{devCode}</span>
            </p>
          )}
          {status && <p className="text-sm text-slate-500">{status}</p>}
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-indigo-400"
          >
            {loading ? "Verifying..." : "Confirm code"}
          </button>
          <button
            type="button"
            onClick={handleResend}
            disabled={resendLoading}
            className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-indigo-300 hover:text-indigo-600 disabled:cursor-not-allowed disabled:text-slate-400"
          >
            {resendLoading ? "Sending…" : "Resend code"}
          </button>
          {resendMessage && <p className="text-xs text-slate-500">{resendMessage}</p>}
        </form>
      )}

      {phase === "details" && (
        <div className="mt-6 space-y-4">
          {status && <p className="text-sm text-slate-500">{status}</p>}
          <RegisterForm email={email} preToken={preToken} onBack={() => setPhase("verify")} />
        </div>
      )}
    </div>
  );
}
