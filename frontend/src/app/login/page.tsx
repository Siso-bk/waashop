import { redirect } from "next/navigation";
import { requireToken } from "@/lib/session";
import { LoginForm } from "@/components/LoginForm";
import { RegisterForm } from "@/components/RegisterForm";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  try {
    await requireToken();
    redirect("/");
  } catch {
    // Continue to render login/register
  }

  return (
    <div className="mx-auto max-w-4xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <div className="grid gap-8 md:grid-cols-2">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Sign in</h1>
          <p className="mt-2 text-sm text-slate-500">
            Use your Personal AI account to continue. This unlocks your wallet and mystery boxes across platforms.
          </p>
          <div className="mt-6">
            <LoginForm />
          </div>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-6">
          <h2 className="text-xl font-semibold text-slate-900">Create an account</h2>
          <p className="mt-2 text-sm text-slate-500">
            New shoppers can register via PAI. Once verified, your Waashop wallet will be ready to use.
          </p>
          <div className="mt-6">
            <RegisterForm />
          </div>
        </div>
      </div>
    </div>
  );
}
