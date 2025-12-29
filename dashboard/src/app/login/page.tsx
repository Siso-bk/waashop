import { redirect } from "next/navigation";
import { requireToken } from "@/lib/session";
import { AuthFlow } from "@/components/AuthFlow";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  try {
    await requireToken();
    redirect("/");
  } catch {
    // Not authenticated yet
  }

  return (
    <div className="mx-auto max-w-4xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <AuthFlow />
    </div>
  );
}
