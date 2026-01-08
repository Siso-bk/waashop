"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import { loginAction, type ActionState } from "@/components/login-actions";

const initialState: ActionState = {};

export function LoginForm({ email }: { email: string }) {
  const [state, action] = useActionState(loginAction, initialState);
  const { pending } = useFormStatus();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (state.redirectTo) {
      router.push(state.redirectTo);
      router.refresh();
    }
  }, [router, state.redirectTo]);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="email" value={email} />
      <div className="text-sm text-slate-500">Signing in as {email}</div>
      <div>
        <label htmlFor="password" className="text-sm font-medium text-slate-600">
          Password
        </label>
        <div className="relative mt-2">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            required
            className="w-full rounded-xl border border-slate-200 px-3 py-2 pr-10 text-sm focus:border-indigo-500 focus:outline-none"
            placeholder="••••••••"
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
      <button
        type="submit"
        disabled={pending}
        className="relative w-full overflow-hidden rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-indigo-400"
      >
        {pending ? (
          <span className="inline-flex items-center justify-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/60 border-t-white" />
            Signing in...
          </span>
        ) : (
          "Sign in"
        )}
        {pending && (
          <span className="absolute inset-x-2 bottom-1 h-0.5 overflow-hidden rounded-full bg-white/30">
            <span className="block h-full w-1/3 animate-nav-progress rounded-full bg-white" />
          </span>
        )}
      </button>
    </form>
  );
}
