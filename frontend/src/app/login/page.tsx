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
    <div className="mx-auto max-w-4xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      {errorMessage && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
          {errorMessage}
        </div>
      )}
      <AuthFlow />
    </div>
  );
}
