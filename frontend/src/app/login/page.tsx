import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requireToken } from "@/lib/session";
import { AuthFlow } from "@/components/AuthFlow";
import { backendFetch } from "@/lib/backendClient";
import { SESSION_COOKIE } from "@/lib/constants";

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
  let paiError: string | null = null;
  const paiToken = extractPaiToken(searchParams);

  if (paiToken) {
    const cookieStore = cookies();
    cookieStore.set(SESSION_COOKIE, paiToken, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    try {
      await backendFetch("/api/me");
      redirect("/");
    } catch (error) {
      cookieStore.delete(SESSION_COOKIE);
      paiError = error instanceof Error ? error.message : "Unable to sync Personal AI session";
    }
  }

  try {
    await requireToken();
    redirect("/");
  } catch {
    // Continue to render login/register
  }

  return (
    <div className="mx-auto max-w-4xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      {paiError && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
          {paiError}
        </div>
      )}
      <AuthFlow />
    </div>
  );
}
