import Link from "next/link";
import { getSessionUser } from "@/lib/queries";
import { SettingsClient } from "./SettingsClient";

export default async function SettingsPage() {
  const user = await getSessionUser();

  if (!user) {
    return (
      <div className="space-y-4 rounded-3xl border border-black/10 bg-white p-6 text-center shadow-sm">
        <p className="text-sm text-gray-600">Sign in to view settings.</p>
        <p className="text-xs text-gray-500">Use your email or username@pai.</p>
        <Link
          href="/login?redirect=/settings"
          className="inline-flex rounded-full border border-black px-4 py-2 text-sm font-semibold text-black transition hover:bg-black hover:text-white"
        >
          Sign in
        </Link>
      </div>
    );
  }

  return <SettingsClient user={user} />;
}
