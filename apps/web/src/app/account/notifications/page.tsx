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
    <main className="theme-scooters min-h-screen bg-white text-brand-ink">
      <Header />

      <div className="mx-auto max-w-[1440px] px-4 py-7 sm:px-7">
        {!authLoading && !user ? (
          <div className="rounded-[10px] border border-dashed border-brand-line p-12 text-center">
            <p className="text-brand-sub">Log in to view your account.</p>
            <Link href="/login" className="mt-4 inline-block font-semibold text-brand-blue-dark">
              Log in
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
            <AccountNav />

            <div className="flex-1 space-y-3.5">
              <div className="flex items-center justify-between">
                <h1 className="text-[18px] font-bold">Notifications</h1>
                {unreadCount > 0 ? (
                  <Button variant="secondary" onClick={markAllRead}>
                    Mark all as read
                  </Button>
                ) : null}
              </div>

              {notifications === null ? (
                <p className="text-sm text-brand-sub">Loading notifications...</p>
              ) : notifications.length === 0 ? (
                <div className="rounded-[10px] border border-dashed border-brand-line p-12 text-center">
                  <p className="text-brand-sub">No notifications yet.</p>
                </div>
              ) : (
                <div className="divide-y divide-brand-line rounded-[10px] border border-brand-line">
                  {notifications.map((n) => (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => (n.isRead ? undefined : markRead(n.id))}
                      className={`flex w-full items-start justify-between gap-4 px-4 py-3.5 text-left text-[13px] ${
                        n.isRead ? "" : "bg-brand-blue-light"
                      }`}
                    >
                      <div>
                        <p className="font-bold">{n.title}</p>
                        <p className="mt-1 text-brand-sub">{n.message}</p>
                        <p className="mt-1 text-xs text-brand-sub">{new Date(n.createdAt).toLocaleString("en-IN")}</p>
                      </div>
                      {!n.isRead ? <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-brand-blue" /> : null}
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
