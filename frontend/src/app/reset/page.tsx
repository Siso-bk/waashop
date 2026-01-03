import { ResetPasswordClient } from "./ResetPasswordClient";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function ResetPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const resolvedParams = searchParams ? await searchParams : undefined;
  const emailParam = typeof resolvedParams?.email === "string" ? resolvedParams.email : "";
  const codeParam = typeof resolvedParams?.code === "string" ? resolvedParams.code : "";

  return <ResetPasswordClient initialEmail={emailParam} initialCode={codeParam} />;
}
