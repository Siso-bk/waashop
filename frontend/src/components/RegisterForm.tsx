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
  const router = useRouter();

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
      <div className="text-sm text-gray-500">Registering as {email}</div>
      <div>
        <label htmlFor="name" className="text-sm font-medium text-gray-700">
          Full name
        </label>
        <input
          id="name"
          name="fullName"
          type="text"
          required
          autoComplete="name"
          className="mt-2 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
          placeholder="Jane Doe"
        />
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
        disabled={pending}
        className="w-full rounded-full bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-black/80 disabled:cursor-not-allowed disabled:bg-gray-400"
      >
        {pending ? "Creating account..." : "Create account"}
      </button>
    </form>
  );
}
