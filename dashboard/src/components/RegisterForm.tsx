"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { registerAction, type ActionState } from "@/components/login-actions";
import { PendingButton } from "@/components/PendingButton";

const initialState: ActionState = {};

type Props = {
  email: string;
  preToken: string | null;
  onBack?: () => void;
};

export function RegisterForm({ email, preToken, onBack }: Props) {
  const [state, action] = useActionState(registerAction, initialState);
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

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
      <div className="text-sm text-slate-500">Registering {email}</div>
      <div>
        <label htmlFor="register-name" className="text-sm font-medium text-slate-600">
          Full name
        </label>
        <input
          id="register-name"
          name="name"
          type="text"
          required
          className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          placeholder="Jane Doe"
        />
      </div>
      <div>
        <label htmlFor="register-password" className="text-sm font-medium text-slate-600">
          Password
        </label>
        <div className="relative mt-2">
          <input
            id="register-password"
            name="password"
            type={showPassword ? "text" : "password"}
            required
            className="w-full rounded-xl border border-slate-200 px-3 py-2 pr-10 text-sm focus:border-indigo-500 focus:outline-none"
            placeholder="Create a secure password"
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute inset-y-0 right-0 flex items-center px-3 text-xs text-slate-500"
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>
      </div>
      {state.error && <p className="text-sm text-red-500">{state.error}</p>}
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="text-xs font-semibold text-slate-500 underline underline-offset-2"
        >
          Enter a different code
        </button>
      )}
      <PendingButton
        pendingLabel={
          <span className="inline-flex items-center justify-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/60 border-t-white" />
            Creating account...
          </span>
        }
        showProgress
        className="w-full rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-emerald-400"
      >
        Create account
      </PendingButton>
    </form>
  );
}
