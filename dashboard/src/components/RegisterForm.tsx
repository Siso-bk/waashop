"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import { registerAction, type ActionState } from "@/components/login-actions";

const initialState: ActionState = {};

export function RegisterForm({ email }: { email: string }) {
  const [state, action] = useActionState(registerAction, initialState);
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
      <div className="text-sm text-slate-500">Registering {email}</div>
      <div>
        <label htmlFor="name" className="text-sm font-medium text-slate-600">
          Full name
        </label>
        <input
          id="name"
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
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-emerald-400"
      >
        {pending ? "Creating account..." : "Create account"}
      </button>
    </form>
  );
}
