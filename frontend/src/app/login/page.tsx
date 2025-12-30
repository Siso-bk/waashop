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
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-sm">
          <div className="flex items-center justify-between text-xs uppercase tracking-[0.35em] text-slate-400">
            <span>Waashop Identity</span>
            <span>Personal AI Secured</span>
          </div>
          <h1 className="mt-4 text-3xl font-semibold text-slate-900">One sign-in for every Waashop surface.</h1>
          <p className="mt-3 text-sm text-slate-600">
            Authenticate once with Personal AI and access the Mini App, mobile web, vendor dashboard, and upcoming
            channels without re-entering your details.
          </p>
          <div className="mt-6 grid gap-4 text-sm text-slate-600">
            <div className="rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4">
              <p className="text-xs uppercase tracking-wide text-slate-400">Security</p>
              <p className="font-semibold text-slate-900">7-day rotating tokens with bearer verification</p>
              <p className="mt-1 text-xs">
                Waashop validates every session against Personal AI before loading wallet balances.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4">
              <p className="text-xs uppercase tracking-wide text-slate-400">Support</p>
              <p className="font-semibold text-slate-900">Need help?</p>
              <p className="mt-1 text-xs">
                Contact <a href="mailto:support@waashop.ai" className="text-indigo-600 underline">support@waashop.ai</a>{" "}
                if you can’t access your Personal AI account.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4">
              <p className="text-xs uppercase tracking-wide text-slate-400">Vendors & admins</p>
              <p className="font-semibold text-slate-900">Apply once</p>
              <p className="mt-1 text-xs">
                After approval, the same login grants dashboard access. No separate credentials to manage.
              </p>
            </div>
          </div>
        </section>
        <section className="rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-xl shadow-indigo-100/70">
          {errorMessage && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600" role="alert">
              {errorMessage}
            </div>
          )}
          <AuthFlow />
        </section>
      </div>
    </div>
  );
}
