import { redirect } from "next/navigation";
import { requireToken } from "@/lib/session";
import { LoginForm } from "@/components/LoginForm";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  try {
    await requireToken();
    redirect("/");
  } catch {
    // Not authenticated yet
  }

  return (
    <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-semibold text-slate-900">Portal Login</h1>
      <p className="mt-2 text-sm text-slate-500">
        Paste a valid Waashop session token (JWT). Replace this placeholder flow with your preferred vendor/admin auth when ready.
      </p>
      <LoginForm />
    </div>
  );
}
