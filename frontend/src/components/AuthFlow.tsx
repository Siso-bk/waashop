"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
    description: "Enter your email or username@pai to continue.",
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
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("email");
  const [identifier, setIdentifier] = useState("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [preToken, setPreToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [signupMessage, setSignupMessage] = useState<string | null>(null);
  const [signupEmail, setSignupEmail] = useState<string | null>(null);
  const [signupRedirectMessage, setSignupRedirectMessage] = useState<string | null>(null);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  const reset = () => {
    setPhase("email");
    setIdentifier("");
    setEmail("");
    setCode("");
    setPreToken(null);
    setError(null);
    setStatus(null);
    setSignupMessage(null);
    setSignupEmail(null);
    setSignupRedirectMessage(null);
    setDevCode(null);
    setResendMessage(null);
  };

  const requestPreSignup = async (normalizedEmail: string) => {
    const data = await callWaashopAuth<PreSignupResponse>("/api/pai/auth/pre-signup", { email: normalizedEmail });
    setIdentifier(normalizedEmail);
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
    const value = formData.get("identifier");
    if (!value || typeof value !== "string") {
      setError("Email or username@pai is required");
      return;
    }
    const normalized = value.trim().toLowerCase();
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized);
    try {
      setLoading(true);
      setError(null);
      setStatus(null);
      setSignupMessage(null);
      setSignupEmail(null);
      setSignupRedirectMessage(null);
      if (isEmail) {
        const data = await callWaashopAuth<CheckEmailResponse>("/api/pai/auth/check-email", { email: normalized });
        setEmail(normalized);
        setIdentifier(normalized);
        if (data.exists && data.emailVerified) {
          setPhase("login");
          setStatus("Welcome back! Enter your password to continue.");
          return;
        }
        setPhase("email");
        if (data.exists && !data.emailVerified) {
          setStatus("Account found but email not verified.");
          setSignupMessage("Verify your email to finish sign up.");
        } else {
          setStatus("No account found.");
          setSignupMessage("Create a new account with this email.");
        }
        setSignupEmail(normalized);
      } else {
        const handle = normalized.replace(/^@/, "").replace(/@pai$/, "").replace(/\.pai$/, "");
        const response = await fetch(`/api/profile?check=1&handle=${encodeURIComponent(handle)}`, {
          cache: "no-store",
        });
        const body = await response.json().catch(() => ({}));
        if (response.ok && body?.valid) {
          if (body.available) {
            setStatus("No account found.");
            setSignupMessage(`No account found for @${handle}. Sign up with your email.`);
            setSignupRedirectMessage("No account found for that username. Create an account with your email.");
            return;
          }
          setEmail("");
          setIdentifier(`${handle}@pai`);
          setPhase("login");
          setStatus("Welcome back! Enter your password to continue.");
          return;
        } else {
          setStatus("We couldn't verify your handle. Try your password.");
        }
        setEmail("");
        setIdentifier(`${handle}@pai`);
        setPhase("login");
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
  const activeIdentity = identifier || email;

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
            <label htmlFor="auth-identifier" className="text-sm font-semibold text-gray-700">
              Email or username@pai
            </label>
            <input
              id="auth-identifier"
              name="identifier"
              type="text"
              required
              className="mt-2 w-full rounded-2xl border border-gray-300 bg-white px-3 py-3 text-sm text-gray-900 placeholder-gray-400 focus:border-black focus:outline-none"
              placeholder="you@example.com or username@pai"
            />
            <p className="mt-2 text-xs text-gray-500">New accounts require email verification. Use your email to sign up.</p>
          </div>
          {error && (
            <p className="text-sm text-red-500" role="alert">
              {error}
            </p>
          )}
          {signupMessage && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700">
              <p className="font-semibold text-amber-800">{signupMessage}</p>
              {signupEmail ? (
                <button
                  type="button"
                  onClick={() => requestPreSignup(signupEmail)}
                  className="mt-2 inline-flex items-center justify-center rounded-full border border-[var(--surface-border)] bg-[var(--surface-bg)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-[var(--app-text)] hover:opacity-90"
                >
                  Send verification code
                </button>
              ) : signupRedirectMessage ? (
                <button
                  type="button"
                  onClick={() =>
                    router.push(`/signup?message=${encodeURIComponent(signupRedirectMessage)}`)
                  }
                  className="mt-2 inline-flex items-center justify-center rounded-full border border-[var(--surface-border)] bg-[var(--surface-bg)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-[var(--app-text)] hover:opacity-90"
                >
                  Create account
                </button>
              ) : null}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="relative w-full overflow-hidden rounded-full border border-[var(--surface-border)] bg-[var(--app-text)] px-4 py-3 text-sm font-semibold text-[var(--app-bg)] hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <span className="inline-flex items-center justify-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Checking...
              </span>
            ) : (
              "Continue"
            )}
            {loading && (
              <span className="absolute inset-x-2 bottom-1 h-0.5 overflow-hidden rounded-full bg-white/25">
                <span className="block h-full w-1/3 animate-nav-progress rounded-full bg-emerald-400" />
              </span>
            )}
          </button>
        </form>
      ) : (
        <div className="mt-6 space-y-4">
          <div className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-xs text-gray-700">
            <p className="font-semibold text-gray-900">{activeIdentity}</p>
            <p className="mt-1">{phase === "login" ? "Account found." : "Final step before shopping."}</p>
          </div>
          {status && (
            <p className="text-xs text-gray-500" role="status">
              {status}
            </p>
          )}
          {phase === "login" ? (
            <LoginForm identifier={activeIdentity} />
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
                  className="relative flex-1 overflow-hidden rounded-full border border-[var(--surface-border)] bg-[var(--app-text)] px-4 py-2 text-sm font-semibold text-[var(--app-bg)] hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (
                    <span className="inline-flex items-center justify-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Verifying…
                    </span>
                  ) : (
                    "Verify code"
                  )}
                  {loading && (
                    <span className="absolute inset-x-2 bottom-1 h-0.5 overflow-hidden rounded-full bg-white/25">
                      <span className="block h-full w-1/3 animate-nav-progress rounded-full bg-emerald-400" />
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendLoading}
                  className="rounded-full border border-[var(--surface-border)] bg-[var(--surface-bg)] px-4 py-2 text-sm font-semibold text-[var(--app-text)] hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {resendLoading ? (
                    <span className="inline-flex items-center justify-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Sending…
                    </span>
                  ) : (
                    "Resend"
                  )}
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
