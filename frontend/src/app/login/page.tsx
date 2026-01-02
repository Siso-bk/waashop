import { redirect } from "next/navigation";
import { requireToken } from "@/lib/session";
import { AuthFlow } from "@/components/AuthFlow";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

const extractPaiToken = (params?: SearchParams): string | null => {
  if (!params) return null;
  const candidates = [params.token, params.pai_token, params.paiToken];
  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.length > 0) {
      return candidate;
    }
  }
  return null;
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const resolvedParams = searchParams ? await searchParams : undefined;
  const paiToken = extractPaiToken(resolvedParams);
  const redirectParam =
    typeof resolvedParams?.redirect === "string" && resolvedParams.redirect.length > 0
      ? resolvedParams.redirect
      : undefined;
  const errorMessage =
    typeof resolvedParams?.error === "string" && resolvedParams.error.length > 0
      ? resolvedParams.error
      : null;

  if (paiToken) {
    const params = new URLSearchParams({ token: paiToken });
    if (redirectParam) {
      params.set("redirect", redirectParam);
    }
    redirect(`/api/auth/pai?${params.toString()}`);
  }

  try {
    await requireToken();
    redirect("/");
  } catch {
    // Continue to render login/register
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="space-y-4 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-500">Waashop Sign-in</p>
        <h1 className="text-3xl font-semibold text-black">One login for every Waashop surface.</h1>
        <p className="text-sm text-gray-600">Enter your email. We’ll guide you to the right step automatically.</p>
      </div>
      <section className="mt-8 rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
        {errorMessage && (
          <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-600" role="alert">
            {errorMessage}
          </div>
        )}
        <AuthFlow />
      </section>
    </div>
  );
}
