"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import { loginAction, type AuthActionState } from "@/components/login-actions";
import { PasswordResetInline } from "@/components/PasswordResetInline";

const initialState: AuthActionState = {};

export function LoginForm({ identifier }: { identifier: string }) {
  const [state, action] = useActionState(loginAction, initialState);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
  const resetEmail = isEmail ? identifier : "";

  useEffect(() => {
    if (state.redirectTo) {
      router.push(state.redirectTo);
      router.refresh();
    }
  }, [router, state.redirectTo]);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="identifier" value={identifier} />
      <div className="text-sm text-gray-500">Signing in as {identifier}</div>
      <div>
        <label htmlFor="password" className="text-sm font-medium text-gray-700">
          Password
        </label>
        <div className="relative mt-2">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            required
            className="w-full rounded-xl border border-gray-300 px-3 py-2 pr-10 text-sm focus:border-black focus:outline-none"
            placeholder="••••••••"
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
      <PasswordResetInline initialEmail={resetEmail} />
      <LoginSubmitButton />
    </form>
  );
}

function LoginSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="relative w-full overflow-hidden rounded-full border border-[var(--surface-border)] bg-[var(--app-text)] px-4 py-2 text-sm font-semibold text-[var(--app-bg)] hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? (
        <span className="inline-flex items-center justify-center gap-2">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          Signing in...
        </span>
      ) : (
        "Sign in"
      )}
      {pending && (
        <span className="absolute inset-x-2 bottom-1 h-0.5 overflow-hidden rounded-full bg-white/25">
          <span className="block h-full w-1/3 animate-nav-progress rounded-full bg-emerald-400" />
        </span>
      )}
    </button>
  );
}
