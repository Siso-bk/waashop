"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export type ProfilePayload = {
  firstName: string;
  lastName?: string;
  email: string;
  username?: string;
};

type ProfileClientProps = {
  initialProfile: ProfilePayload;
};

type Feedback = {
  type: "success" | "error";
  message: string;
};

export function ProfileClient({ initialProfile }: ProfileClientProps) {
  const [profile, setProfile] = useState<ProfilePayload>(initialProfile);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [handleStatus, setHandleStatus] = useState<"idle" | "checking" | "available" | "taken" | "invalid">("idle");

  const normalizeHandleInput = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return "";
    let normalized = trimmed;
    if (normalized.startsWith("@")) {
      normalized = normalized.slice(1);
    }
    if (/@pai$/i.test(normalized)) {
      normalized = normalized.slice(0, -4);
    }
    if (/\.pai$/i.test(normalized)) {
      normalized = normalized.slice(0, -4);
    }
    return normalized;
  };

  const displayHandle = profile.username || "";

  const handleSave = async () => {
    if (!editing) {
      setEditing(true);
      setFeedback(null);
      return;
    }
    if (profile.username && (handleStatus === "taken" || handleStatus === "invalid")) {
      setFeedback({ type: "error", message: "Choose an available username before saving." });
      return;
    }
    setSaving(true);
    setFeedback(null);
    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: profile.firstName,
          lastName: profile.lastName,
          username: profile.username,
        }),
        credentials: "include",
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error((data as { error?: string }).error || "Unable to update profile.");
      }
      const payload = data as { profile: ProfilePayload };
      if (payload.profile) {
        setProfile(payload.profile);
      }
      setFeedback({ type: "success", message: "Profile updated." });
      setEditing(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to update profile.";
      setFeedback({ type: "error", message });
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (!editing) {
      setHandleStatus("idle");
      return;
    }
    const candidate = profile.username?.trim() || "";
    const initialHandle = initialProfile.username || "";
    if (!candidate) {
      setHandleStatus("idle");
      return;
    }
    if (candidate === initialHandle) {
      setHandleStatus("available");
      return;
    }
    setHandleStatus("checking");
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/profile?check=1&handle=${encodeURIComponent(candidate)}`, {
          cache: "no-store",
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data?.valid) {
          setHandleStatus("invalid");
          return;
        }
        setHandleStatus(data.available ? "available" : "taken");
      } catch {
        setHandleStatus("invalid");
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [editing, profile.username, initialProfile.username]);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Profile</p>
          <h1 className="text-2xl font-semibold text-black">{profile.firstName || "Waashop shopper"}</h1>
          <p className="text-xs text-gray-500">
            {profile.username
              ? `${profile.username}@pai`
              : "Transfers support email or username@pai. Set your username@pai to receive faster."}
          </p>
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
              id="profile-first-name"
              name="firstName"
              type="text"
              autoComplete="given-name"
              value={profile.firstName}
              onChange={event => setProfile({ ...profile, firstName: event.target.value })}
              disabled={!editing}
              className="w-full rounded-2xl border border-gray-300 px-3 py-2 text-sm text-black focus:border-black focus:outline-none disabled:border-gray-200 disabled:bg-gray-100"
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs uppercase tracking-[0.3em] text-gray-400">Last name</span>
            <input
              id="profile-last-name"
              name="lastName"
              type="text"
              autoComplete="family-name"
              value={profile.lastName || ""}
              onChange={event => setProfile({ ...profile, lastName: event.target.value })}
              disabled={!editing}
              className="w-full rounded-2xl border border-gray-300 px-3 py-2 text-sm text-black focus:border-black focus:outline-none disabled:border-gray-200 disabled:bg-gray-100"
            />
          </label>
          <label className="space-y-1 sm:col-span-2">
            <span className="text-xs uppercase tracking-[0.3em] text-gray-400">Username@pai</span>
            <div className="relative">
              <input
                id="profile-username"
                name="username"
                type="text"
                autoComplete="username"
                value={displayHandle}
                onChange={event =>
                  setProfile({ ...profile, username: normalizeHandleInput(event.target.value) })
                }
                disabled={!editing}
                placeholder="username"
                className="w-full rounded-2xl border border-gray-300 px-3 py-2 pr-16 text-sm text-black focus:border-black focus:outline-none disabled:border-gray-200 disabled:bg-gray-100"
              />
              <span className="pointer-events-none absolute right-9 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                @pai
              </span>
              <span
                className={`absolute right-3 top-1/2 -translate-y-1/2 text-sm ${
                  handleStatus === "available"
                    ? "text-emerald-600"
                    : handleStatus === "taken" || handleStatus === "invalid"
                    ? "text-red-500"
                    : "text-gray-400"
                }`}
                aria-hidden="true"
              >
                {handleStatus === "checking"
                  ? "⏳"
                  : handleStatus === "available"
                  ? "✓"
                  : handleStatus === "taken"
                  ? "✕"
                  : handleStatus === "invalid"
                  ? "!"
                  : ""}
              </span>
            </div>
            <p className="text-xs text-gray-500">Public handle used for transfers.</p>
            {editing && displayHandle && (
              <p
                className={`text-xs ${
                  handleStatus === "available"
                    ? "text-emerald-600"
                    : handleStatus === "taken" || handleStatus === "invalid"
                    ? "text-red-500"
                    : "text-gray-500"
                }`}
              >
                {handleStatus === "checking"
                  ? "Checking availability…"
                  : handleStatus === "available"
                  ? "Username is available."
                  : handleStatus === "taken"
                  ? "That username is already taken."
                  : handleStatus === "invalid"
                  ? "Username is invalid."
                  : ""}
              </p>
            )}
          </label>
          <label className="space-y-1 sm:col-span-2">
            <span className="text-xs uppercase tracking-[0.3em] text-gray-400">Email</span>
            <input
              id="profile-email"
              name="email"
              type="email"
              autoComplete="email"
              value={profile.email}
              disabled
              className="w-full rounded-2xl border border-gray-300 px-3 py-2 text-sm text-gray-500 disabled:border-gray-200 disabled:bg-gray-100"
            />
          </label>
        </div>
        <div className="grid gap-3 text-sm text-gray-600 sm:grid-cols-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-2xl border border-black px-4 py-2 text-black transition hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:bg-gray-200"
          >
            {editing ? (saving ? "Saving…" : "Save changes") : "Edit profile"}
          </button>
        </div>
        {feedback && (
          <p
            className={`text-sm ${
              feedback.type === "error" ? "text-red-600" : "text-green-600"
            }`}
          >
            {feedback.message}
          </p>
        )}
      </section>
    </div>
  );
}
