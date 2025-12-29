"use client";

import { useFormState, useFormStatus } from "react-dom";
import { loginAction } from "@/components/login-actions";

const initialState = { error: "" };

export function LoginForm() {
  const [state, action] = useFormState(loginAction, initialState);
  const { pending } = useFormStatus();

  return (
    <form action={action} className="mt-6 space-y-4">
      <div>
        <label htmlFor="token" className="text-sm font-medium text-slate-600">
          Session token
        </label>
        <textarea
          id="token"
          name="token"
          required
          className="mt-2 w-full rounded-xl border border-slate-200 p-3 text-sm focus:border-indigo-500 focus:outline-none"
          rows={4}
          placeholder="Paste waashop-token or admin JWT"
        />
      </div>
      {state.error && <p className="text-sm text-red-500">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-indigo-400"
      >
        {pending ? "Validating..." : "Continue"}
      </button>
    </form>
  );
}
