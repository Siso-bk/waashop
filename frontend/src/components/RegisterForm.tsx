"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import { registerAction, type AuthActionState } from "@/components/login-actions";
import { PasswordResetInline } from "@/components/PasswordResetInline";

const initialState: AuthActionState = {};

type RegisterFormProps = {
  email: string;
  preToken: string | null;
  onBack?: () => void;
};

export function RegisterForm({ email, preToken, onBack }: RegisterFormProps) {
  const [state, action] = useActionState(registerAction, initialState);
  const { pending } = useFormStatus();
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [handleStatus, setHandleStatus] = useState<"idle" | "checking" | "available" | "taken" | "reserved" | "invalid">("idle");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const router = useRouter();

  useEffect(() => {
    const candidate = normalizeHandleInput(username);
    if (!candidate) {
      setHandleStatus("idle");
      setSuggestions([]);
      return;
    }
    setHandleStatus("checking");
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/profile?check=1&handle=${encodeURIComponent(candidate)}`, {
          cache: "no-store",
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data?.valid) {
          setHandleStatus("invalid");
          setSuggestions([]);
          return;
        }
        if (data.reserved) {
          setHandleStatus("reserved");
        } else {
          setHandleStatus(data.available ? "available" : "taken");
        }
        setSuggestions(Array.isArray(data.suggestions) ? data.suggestions : []);
      } catch {
        setHandleStatus("invalid");
        setSuggestions([]);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [username]);

  useEffect(() => {
    if (state.redirectTo) {
      router.push(state.redirectTo);
      router.refresh();
    }
  }, [router, state.redirectTo]);

  if (!preToken) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm text-amber-900">
        Verification expired.{" "}
        <button
          type="button"
          onClick={onBack}
          className="font-semibold text-amber-900 underline underline-offset-2"
        >
          Restart verification
        </button>
        .
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="email" value={email} />
      <input type="hidden" name="preToken" value={preToken} />
      <input type="hidden" name="username" value={username} />
      <div className="text-sm text-gray-500">Registering as {email}</div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="first-name" className="text-sm font-medium text-gray-700">
            First name
          </label>
          <input
            id="first-name"
            name="firstName"
            type="text"
            required
            autoComplete="given-name"
            className="mt-2 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
            placeholder="Jane"
          />
        </div>
        <div>
          <label htmlFor="last-name" className="text-sm font-medium text-gray-700">
            Last name
          </label>
          <input
            id="last-name"
            name="lastName"
            type="text"
            required
            autoComplete="family-name"
            className="mt-2 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
            placeholder="Doe"
          />
        </div>
      </div>
      <div>
        <label htmlFor="register-username" className="text-sm font-medium text-gray-700">
          Username@pai
        </label>
        <div className="relative mt-2">
          <input
            id="register-username"
            name="usernameInput"
            type="text"
            required
            autoComplete="username"
            value={username}
            onChange={(event) => setUsername(normalizeHandleInput(event.target.value))}
            className="w-full rounded-xl border border-gray-300 px-3 py-2 pr-16 text-sm focus:border-black focus:outline-none"
            placeholder="yourname"
          />
          <span className="pointer-events-none absolute right-9 top-1/2 -translate-y-1/2 text-xs text-gray-400">
            @pai
          </span>
          <span
            className={`absolute right-3 top-1/2 -translate-y-1/2 text-sm ${
              handleStatus === "available"
                ? "text-emerald-600"
                : handleStatus === "taken" || handleStatus === "reserved" || handleStatus === "invalid"
                ? "text-red-500"
                : "text-gray-400"
            }`}
            aria-hidden="true"
          >
            {handleStatus === "checking"
              ? "⏳"
              : handleStatus === "available"
              ? "✓"
              : handleStatus === "taken"
              ? "✕"
              : handleStatus === "reserved"
              ? "!"
              : handleStatus === "invalid"
              ? "!"
              : ""}
          </span>
        </div>
        {username && (
          <p
            className={`mt-2 text-xs ${
              handleStatus === "available"
                ? "text-emerald-600"
                : handleStatus === "taken" || handleStatus === "reserved" || handleStatus === "invalid"
                ? "text-red-500"
                : "text-gray-500"
            }`}
          >
            {handleStatus === "checking"
              ? "Checking availability…"
              : handleStatus === "available"
              ? "Username is available."
              : handleStatus === "taken"
              ? "That username is already taken."
              : handleStatus === "reserved"
              ? "That username is reserved."
              : handleStatus === "invalid"
              ? "Username is invalid."
              : ""}
          </p>
        )}
        {suggestions.length > 0 && (handleStatus === "taken" || handleStatus === "reserved") && (
          <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-gray-500">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => setUsername(suggestion)}
                className="rounded-full border border-gray-200 px-2 py-1 text-[10px] font-semibold text-gray-600 hover:border-black hover:text-black"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
      </div>
      <div>
        <label htmlFor="register-password" className="text-sm font-medium text-gray-700">
          Password
        </label>
        <div className="relative mt-2">
          <input
            id="register-password"
            name="password"
            type={showPassword ? "text" : "password"}
            required
            className="w-full rounded-xl border border-gray-300 px-3 py-2 pr-10 text-sm focus:border-black focus:outline-none"
            placeholder="Create a secure password"
          />
          <button
            type="button"
            onClick={() => setShowPassword(prev => !prev)}
            className="absolute inset-y-0 right-0 flex items-center px-3 text-xs text-gray-500"
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>
      </div>
      {state.error && <p className="text-sm text-red-500">{state.error}</p>}
      <PasswordResetInline initialEmail={email} />
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="text-xs font-semibold text-slate-500 underline underline-offset-2"
        >
          Enter a different code
        </button>
      )}
      <button
        type="submit"
        disabled={
          pending ||
          handleStatus === "taken" ||
          handleStatus === "reserved" ||
          handleStatus === "invalid" ||
          handleStatus === "checking" ||
          handleStatus === "idle"
        }
        className="w-full rounded-full bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-black/80 disabled:cursor-not-allowed disabled:bg-gray-400"
      >
        {pending ? "Creating account..." : "Create account"}
      </button>
    </form>
  );
}

const normalizeHandleInput = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return "";
  let normalized = trimmed;
  if (normalized.startsWith("@")) {
    normalized = normalized.slice(1);
  }
  if (/@pai$/i.test(normalized)) {
    normalized = normalized.slice(0, -4);
  }
  if (/\.pai$/i.test(normalized)) {
    normalized = normalized.slice(0, -4);
  }
  return normalized;
};
