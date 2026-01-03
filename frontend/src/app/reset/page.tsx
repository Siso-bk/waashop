import { ResetPasswordClient } from "./ResetPasswordClient";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function ResetPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const resolvedParams = searchParams ? await searchParams : undefined;
  const emailParam = typeof resolvedParams?.email === "string" ? resolvedParams.email : "";

  return <ResetPasswordClient initialEmail={emailParam} />;
}
