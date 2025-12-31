"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { registerAction } from "@/components/login-actions";

const initialState = { error: "" };

type RegisterFormProps = {
  email: string;
  preToken: string | null;
  onBack?: () => void;
};

export function RegisterForm({ email, preToken, onBack }: RegisterFormProps) {
  const [state, action] = useActionState(registerAction, initialState);
  const { pending } = useFormStatus();

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
      <div className="text-sm text-slate-500">Registering as {email}</div>
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
        <input
          id="register-password"
          name="password"
          type="password"
          required
          className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          placeholder="Create a secure password"
        />
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
