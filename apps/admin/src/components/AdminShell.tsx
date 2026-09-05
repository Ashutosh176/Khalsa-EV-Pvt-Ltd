"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../lib/auth-context";
import { Sidebar } from "./Sidebar";

export function AdminShell({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-surface">
        <p className="text-sm text-brand-sub">Loading...</p>
      </div>
    );
  }

  if (!user) return null; // redirecting

  return (
    // h-screen (not min-h-screen) + overflow-hidden bounds this row to the
    // viewport, so <main>'s overflow-y-auto actually scrolls internally
    // instead of the whole page growing past the viewport and dragging
    // the sidebar along with it.
    <div className="flex h-screen overflow-hidden bg-brand-surface">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
