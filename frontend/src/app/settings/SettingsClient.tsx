"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { UserProfile } from "@/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "";

type SettingsClientProps = {
  user: UserProfile;
};

type Feedback = {
  type: "success" | "error";
  message: string;
};

export function SettingsClient({ user }: SettingsClientProps) {
  const router = useRouter();
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [resetEmail, setResetEmail] = useState(user.email || "");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedEmailAlerts = window.localStorage.getItem("waashop:notify-email");
    const storedSmsAlerts = window.localStorage.getItem("waashop:notify-sms");
    if (storedEmailAlerts !== null) setEmailAlerts(storedEmailAlerts === "true");
    if (storedSmsAlerts !== null) setSmsAlerts(storedSmsAlerts === "true");
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("waashop:notify-email", String(emailAlerts));
  }, [emailAlerts]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("waashop:notify-sms", String(smsAlerts));
  }, [smsAlerts]);

  const handleLogout = async () => {
    const confirmed =
      typeof window !== "undefined"
        ? window.confirm("Are you sure you want to log out of your Waashop account?")
        : true;
    if (!confirmed) return;
    try {
      await fetch("/api/auth/session", { method: "DELETE", credentials: "include" });
    } catch {
      // ignore failures clearing cookie
    }
    router.push("/login");
    router.refresh();
  };

  const handleDelete = async () => {
    const confirmed =
      typeof window !== "undefined"
        ? window.confirm("This action deletes your Waashop profile and ledger history. Continue?")
        : true;
    if (!confirmed) return;
    setDeleteLoading(true);
    setFeedback(null);
    try {
      const response = await fetch("/api/profile", {
        method: "DELETE",
        credentials: "include",
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error((data as { error?: string }).error || "Unable to delete profile.");
      }
      router.push("/login?accountDeleted=1");
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to delete profile.";
      setFeedback({ type: "error", message });
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleReset = async () => {
    if (!resetEmail) {
      setResetMessage("Enter the email linked to your account.");
      return;
    }
    setResetLoading(true);
    setResetMessage(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/forgot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error((data as { error?: string }).error || "Unable to send reset code.");
      }
      setResetMessage("Reset code sent. Check your email inbox.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to send reset code.";
      setResetMessage(message);
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Settings</p>
        <h1 className="text-2xl font-semibold text-black">Account settings</h1>
        <p className="text-sm text-gray-600">Security and account actions.</p>
      </header>

      <section className="space-y-4 rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-black">Signed in as</p>
            <p className="text-xs text-gray-500">{user.username ? `${user.username}@pai` : user.email}</p>
          </div>
          <Link href="/profile" className="text-xs font-semibold text-black underline underline-offset-4">
            Edit profile
          </Link>
        </div>

        <div className="grid gap-3 text-sm text-gray-600 sm:grid-cols-2">
          <button
            onClick={handleLogout}
            className="rounded-2xl border border-black px-4 py-2 text-black transition hover:bg-black hover:text-white"
          >
            Logout
          </button>
          <button
            onClick={handleDelete}
            disabled={deleteLoading}
            className="rounded-2xl border border-red-500 px-4 py-2 text-red-600 transition hover:bg-red-600 hover:text-white disabled:cursor-not-allowed disabled:border-red-200 disabled:bg-red-200 disabled:text-white"
          >
            {deleteLoading ? "Deleting…" : "Delete account"}
          </button>
        </div>
        {feedback && (
          <p className={`text-sm ${feedback.type === "error" ? "text-red-600" : "text-green-600"}`}>
            {feedback.message}
          </p>
        )}
      </section>

      <section className="space-y-4 rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
        <div>
          <p className="text-sm font-semibold text-black">Reset password</p>
          <p className="text-xs text-gray-500">We will send a reset code to your email.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
          <label className="space-y-1">
            <span className="text-xs uppercase tracking-[0.3em] text-gray-400">Email</span>
            <input
              type="email"
              value={resetEmail}
              onChange={event => setResetEmail(event.target.value)}
              className="w-full rounded-2xl border border-gray-300 px-3 py-2 text-sm text-black focus:border-black focus:outline-none"
            />
          </label>
          <button
            type="button"
            onClick={handleReset}
            disabled={resetLoading}
            className="rounded-2xl border border-black px-4 py-2 text-sm font-semibold text-black transition hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:bg-gray-200"
          >
            {resetLoading ? "Sending…" : "Send reset code"}
          </button>
        </div>
        {resetMessage && <p className="text-sm text-gray-600">{resetMessage}</p>}
      </section>

      <section className="space-y-4 rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
        <div>
          <p className="text-sm font-semibold text-black">Notification preferences</p>
          <p className="text-xs text-gray-500">Saved in this browser.</p>
        </div>
        <div className="space-y-3 text-sm text-gray-700">
          <label className="flex items-center justify-between gap-3 rounded-2xl border border-black/5 px-4 py-3">
            <span>Email alerts</span>
            <input
              type="checkbox"
              checked={emailAlerts}
              onChange={event => setEmailAlerts(event.target.checked)}
              className="h-4 w-4 accent-black"
            />
          </label>
          <label className="flex items-center justify-between gap-3 rounded-2xl border border-black/5 px-4 py-3">
            <span>SMS alerts</span>
            <input
              type="checkbox"
              checked={smsAlerts}
              onChange={event => setSmsAlerts(event.target.checked)}
              className="h-4 w-4 accent-black"
            />
          </label>
        </div>
      </section>
    </div>
  );
}
