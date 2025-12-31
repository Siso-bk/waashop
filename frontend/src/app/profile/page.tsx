import { getSessionUser } from "@/lib/queries";

export default async function ProfilePage() {
  const user = await getSessionUser();

  if (!user) {
    return (
      <div className="rounded-2xl border border-dashed border-black/20 bg-white p-6 text-sm text-gray-600">
        Sign in to view your profile.
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Profile</p>
        <h1 className="text-2xl font-semibold text-black">{user.firstName || "Waashop shopper"}</h1>
      </div>
      <dl className="grid gap-4 text-sm text-gray-600 sm:grid-cols-2">
        <div>
          <dt className="text-xs uppercase tracking-[0.3em] text-gray-400">Email</dt>
          <dd className="mt-1 text-black">{user.email}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-[0.3em] text-gray-400">Status</dt>
          <dd className="mt-1 text-black">Customer</dd>
        </div>
      </dl>
      <div className="grid gap-3 text-sm text-gray-600 sm:grid-cols-3">
        <button className="rounded-2xl border border-black px-4 py-2 text-black transition hover:bg-black hover:text-white">
          Edit profile
        </button>
        <button className="rounded-2xl border border-black px-4 py-2 text-black transition hover:bg-black hover:text-white">
          Logout
        </button>
        <button className="rounded-2xl border border-red-500 px-4 py-2 text-red-600 transition hover:bg-red-600 hover:text-white">
          Delete account
        </button>
      </div>
    </div>
  );
}
