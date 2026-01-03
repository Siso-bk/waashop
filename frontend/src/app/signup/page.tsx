import { redirect } from "next/navigation";
import { requireToken } from "@/lib/session";
import { AuthFlow } from "@/components/AuthFlow";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function SignupPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const resolvedParams = searchParams ? await searchParams : undefined;
  const message =
    typeof resolvedParams?.message === "string" && resolvedParams.message.length > 0
      ? resolvedParams.message
      : null;

  try {
    await requireToken();
    redirect("/account");
  } catch {
    // Continue to render signup flow
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="space-y-4 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-500">Waashop Sign-up</p>
        <h1 className="text-3xl font-semibold text-black">Create your Waashop account.</h1>
        <p className="text-sm text-gray-600">Start with your email to verify and set your password.</p>
      </div>
      <section className="mt-8 rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
        {message && (
          <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700" role="alert">
            {message}
          </div>
        )}
        <AuthFlow />
      </section>
    </div>
  );
}
