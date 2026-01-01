"use client";

import { useState } from "react";
import { LoginForm } from "@/components/LoginForm";
import { RegisterForm } from "@/components/RegisterForm";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

type Phase = "email" | "login" | "verify" | "details";

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
    description: "Confirm your password to sync balances.",
  },
  verify: {
    heading: "Verify email",
    description: "Enter the six-digit code we just sent.",
  },
  details: {
    heading: "Create your profile",
    description: "Finish with a name and password.",
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

const callWaashopAuth = async <T,>(path: string, payload: Record<string, unknown>): Promise<T> => {
  if (!API_BASE_URL) {
    throw new Error("Missing API base URL.");
  }
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    cache: "no-store",
  });
  const data = (await response.json().catch(() => ({}))) as { error?: string; message?: string } & T;
  if (!response.ok) {
    throw new Error(data.error || data.message || "Unable to continue.");
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

  const sequence: Phase[] = ["email", "login", "verify", "details"];
  const currentStep = sequence.indexOf(phase) + 1;

  return (
    <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-gray-400">
        <span>
          Step {currentStep} of {sequence.length}
        </span>
        <button type="button" onClick={reset} className="text-black underline-offset-4 hover:underline">
          Reset
        </button>
      </div>
      <div className="mt-4 space-y-2">
        <h2 className="text-xl font-semibold text-black">{phaseCopy[phase].heading}</h2>
        <p className="text-sm text-gray-600">{phaseCopy[phase].description}</p>
      </div>

      {phase === "email" ? (
        <form onSubmit={handleEmailSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="auth-email" className="text-sm font-semibold text-gray-700">
              Email address
            </label>
            <input
              id="auth-email"
              name="email"
              type="email"
              required
              className="mt-2 w-full rounded-2xl border border-gray-300 bg-white px-3 py-3 text-sm text-gray-900 placeholder-gray-400 focus:border-black focus:outline-none"
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
            className="w-full rounded-full bg-black px-4 py-3 text-sm font-semibold text-white hover:bg-black/80 disabled:cursor-not-allowed disabled:bg-gray-400"
          >
            {loading ? "Checking..." : "Continue"}
          </button>
        </form>
      ) : (
        <div className="mt-6 space-y-4">
          <div className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-xs text-gray-700">
            <p className="font-semibold text-gray-900">{email}</p>
            <p className="mt-1">{phase === "login" ? "Account verified." : "Final step before shopping."}</p>
          </div>
          {status && (
            <p className="text-xs text-gray-500" role="status">
              {status}
            </p>
          )}
          {phase === "login" ? (
            <LoginForm email={email} />
          ) : phase === "verify" ? (
            <form onSubmit={handleVerifySubmit} className="space-y-4" noValidate>
              <div>
                <label htmlFor="verification-code" className="text-sm font-medium text-gray-700">
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
                  className="mt-2 w-full rounded-2xl border border-gray-300 px-3 py-2 text-center text-sm tracking-[0.45em] focus:border-black focus:outline-none"
                  placeholder="123456"
                />
              </div>
              {error && (
                <p className="text-sm text-red-500" role="alert">
                  {error}
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 rounded-full bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-black/80 disabled:cursor-not-allowed disabled:bg-gray-400"
                >
                  {loading ? "Verifying…" : "Verify code"}
                </button>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendLoading}
                  className="rounded-full border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:border-black hover:text-black disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {resendLoading ? "Sending…" : "Resend"}
                </button>
              </div>
              {resendMessage && <p className="text-xs text-gray-500">{resendMessage}</p>}
              {devCode && (
                <p className="text-xs text-gray-500">
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
  );
}
