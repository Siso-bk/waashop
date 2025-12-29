"use client";

import { useFormState, useFormStatus } from "react-dom";
import { loginAction } from "@/components/login-actions";

const initialState = { error: "" };

export function LoginForm({ email }: { email: string }) {
  const [state, action] = useFormState(loginAction, initialState);
  const { pending } = useFormStatus();

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="email" value={email} />
      <div className="text-sm text-slate-500">Signing in as {email}</div>
      <div>
        <label htmlFor="password" className="text-sm font-medium text-slate-600">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          placeholder="••••••••"
        />
      </div>
      {state.error && <p className="text-sm text-red-500">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-indigo-400"
      >
        {pending ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
