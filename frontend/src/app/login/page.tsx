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

export default async function LoginPage({ searchParams }: { searchParams?: SearchParams }) {
  const paiToken = extractPaiToken(searchParams);
  const redirectParam =
    typeof searchParams?.redirect === "string" && searchParams.redirect.length > 0
      ? searchParams.redirect
      : undefined;
  const errorMessage =
    typeof searchParams?.error === "string" && searchParams.error.length > 0
      ? searchParams.error
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
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="space-y-6 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-500">Personal AI Sign-in</p>
        <h1 className="text-3xl font-semibold text-slate-900">One secure login for every Waashop surface.</h1>
        <p className="text-sm text-slate-600">
          The same Personal AI identity unlocks the Mini App, mobile web, vendor dashboard, and future channels. No
          duplicate credentials, no manual sync.
        </p>
      </div>
      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <section className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">Why Personal AI?</h2>
          <ul className="mt-4 space-y-3 text-sm text-slate-600">
            <li>
              <span className="font-semibold text-slate-900">7-day rotating tokens.</span> Every session is revalidated
              before wallet data loads.
            </li>
            <li>
              <span className="font-semibold text-slate-900">Single identity everywhere.</span> Vendors and admins use the
              same login for dashboard approvals.
            </li>
            <li>
              <span className="font-semibold text-slate-900">Support.</span> Need help? Email{" "}
              <a href="mailto:support@waashop.ai" className="text-indigo-600 underline">
                support@waashop.ai
              </a>
              .
            </li>
          </ul>
        </section>
        <section className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
          {errorMessage && (
            <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-600" role="alert">
              {errorMessage}
            </div>
          )}
          <AuthFlow />
        </section>
      </div>
    </div>
  );
}
