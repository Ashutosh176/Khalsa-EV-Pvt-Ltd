"use client";

import Link from "next/link";
import { Button } from "@khalsa-ev/ui";
import { Header } from "../../../components/Header";
import { Footer } from "../../../components/Footer";
import { AccountNav } from "../../../components/AccountNav";
import { useAuth } from "../../../lib/auth-context";
import { useNotifications } from "../../../lib/notifications-context";

export default function NotificationsPage() {
  const { user, loading: authLoading } = useAuth();
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();

  return (
    <main className="min-h-screen bg-slate-50 text-brand-ink">
      <Header />

      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-black tracking-tight text-brand-ink">My account</h1>

        {!authLoading && !user ? (
          <div className="mt-8 rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <p className="text-slate-600">Log in to view your account.</p>
            <Link href="/login" className="mt-4 inline-block font-semibold text-brand-green">
              Log in
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-6 lg:grid-cols-[220px_1fr]">
            <AccountNav />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-brand-ink">Notifications</h2>
                {unreadCount > 0 ? (
                  <Button variant="secondary" onClick={markAllRead}>
                    Mark all as read
                  </Button>
                ) : null}
              </div>

              {notifications === null ? (
                <p className="text-sm text-slate-500">Loading notifications...</p>
              ) : notifications.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
                  <p className="text-slate-600">No notifications yet.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 rounded-3xl border border-slate-200 bg-white">
                  {notifications.map((n) => (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => (n.isRead ? undefined : markRead(n.id))}
                      className={`flex w-full items-start justify-between gap-4 px-6 py-4 text-left text-sm ${
                        n.isRead ? "" : "bg-brand-green/5"
                      }`}
                    >
                      <div>
                        <p className="font-semibold text-brand-ink">{n.title}</p>
                        <p className="mt-1 text-slate-600">{n.message}</p>
                        <p className="mt-1 text-xs text-slate-400">{new Date(n.createdAt).toLocaleString("en-IN")}</p>
                      </div>
                      {!n.isRead ? <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-brand-green" /> : null}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <Footer />
    </main>
  );
}
