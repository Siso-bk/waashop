"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SESSION_COOKIE } from "@/lib/constants";

export type ProfilePayload = {
  firstName: string;
  lastName?: string;
  email: string;
};

type ProfileClientProps = {
  initialProfile: ProfilePayload;
};

export function ProfileClient({ initialProfile }: ProfileClientProps) {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfilePayload>(initialProfile);
  const [status, setStatus] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!editing) {
      setEditing(true);
      setStatus(null);
      return;
    }
    setLoading(true);
    setStatus(null);
    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: profile.firstName,
          lastName: profile.lastName,
        }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Unable to update profile.");
      }
      setStatus("Profile updated.");
      setEditing(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to update profile.";
      setStatus(message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    document.cookie = `${SESSION_COOKIE}=; Max-Age=0; path=/`;
    router.push("/login");
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Profile</p>
          <h1 className="text-2xl font-semibold text-black">{profile.firstName || "Waashop shopper"}</h1>
        </div>
        <Link href="/wallet" className="text-xs font-semibold text-black underline underline-offset-4">
          Back to wallet
        </Link>
      </header>

      <section className="space-y-4 rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
        <div className="grid gap-4 text-sm text-gray-600 sm:grid-cols-2">
          <label className="space-y-1">
            <span className="text-xs uppercase tracking-[0.3em] text-gray-400">First name</span>
            <input
              type="text"
              value={profile.firstName}
              onChange={event => setProfile({ ...profile, firstName: event.target.value })}
              disabled={!editing}
              className="w-full rounded-2xl border border-gray-300 px-3 py-2 text-sm text-black focus:border-black focus:outline-none disabled:border-gray-200 disabled:bg-gray-100"
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs uppercase tracking-[0.3em] text-gray-400">Last name</span>
            <input
              type="text"
              value={profile.lastName || ""}
              onChange={event => setProfile({ ...profile, lastName: event.target.value })}
              disabled={!editing}
              className="w-full rounded-2xl border border-gray-300 px-3 py-2 text-sm text-black focus:border-black focus:outline-none disabled:border-gray-200 disabled:bg-gray-100"
            />
          </label>
          <label className="space-y-1 sm:col-span-2">
            <span className="text-xs uppercase tracking-[0.3em] text-gray-400">Email</span>
            <input
              type="email"
              value={profile.email}
              disabled
              className="w-full rounded-2xl border border-gray-300 px-3 py-2 text-sm text-gray-500 disabled:border-gray-200 disabled:bg-gray-100"
            />
          </label>
        </div>
        <div className="grid gap-3 text-sm text-gray-600 sm:grid-cols-3">
          <button
            onClick={handleSave}
            disabled={loading}
            className="rounded-2xl border border-black px-4 py-2 text-black transition hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:bg-gray-200"
          >
            {editing ? (loading ? "Saving…" : "Save changes") : "Edit profile"}
          </button>
          <button
            onClick={handleLogout}
            className="rounded-2xl border border-black px-4 py-2 text-black transition hover:bg-black hover:text-white"
          >
            Logout
          </button>
          <button className="rounded-2xl border border-red-500 px-4 py-2 text-red-600 transition hover:bg-red-600 hover:text-white">
            Delete account
          </button>
        </div>
        {status && <p className="text-sm text-gray-600">{status}</p>}
      </section>
    </div>
  );
}
