import { redirect } from "next/navigation";

export default function TransferLinkPage({
  searchParams,
}: {
  searchParams?: { to?: string; amount?: string };
}) {
  const to = typeof searchParams?.to === "string" ? searchParams.to : "";
  const amount = typeof searchParams?.amount === "string" ? searchParams.amount : "";

  const params = new URLSearchParams();
  if (to) params.set("to", to);
  if (amount) params.set("amount", amount);

  const suffix = params.toString();
  redirect(`/wallet${suffix ? `?${suffix}` : ""}`);
}
