"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { NotificationView } from "@khalsa-ev/types";
import { getNotifications, markAllNotificationsRead, markNotificationRead } from "./api";
import { useAuth } from "./auth-context";

type NotificationsContextValue = {
  notifications: NotificationView[] | null;
  unreadCount: number;
  refresh: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
};

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { accessToken } = useAuth();
  const [notificationsState, setNotifications] = useState<NotificationView[] | null>(null);

  // Logged-out is derived (not cleared via setState), mirroring CartContext.
  const notifications = accessToken ? notificationsState : null;
  const unreadCount = (notifications ?? []).filter((n) => !n.isRead).length;

  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;
    getNotifications(accessToken)
      .then((result) => {
        if (!cancelled) setNotifications(result);
      })
      .catch(() => {
        if (!cancelled) setNotifications([]);
      });
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  const refresh = useCallback(async () => {
    if (!accessToken) {
      setNotifications(null);
      return;
    }
    setNotifications(await getNotifications(accessToken));
  }, [accessToken]);

  const markRead = useCallback(
    async (id: string) => {
      if (!accessToken) return;
      await markNotificationRead(accessToken, id);
      setNotifications((prev) => (prev ?? []).map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    },
    [accessToken],
  );

  const markAllRead = useCallback(async () => {
    if (!accessToken) return;
    await markAllNotificationsRead(accessToken);
    setNotifications((prev) => (prev ?? []).map((n) => ({ ...n, isRead: true })));
  }, [accessToken]);

  return (
    <NotificationsContext.Provider value={{ notifications, unreadCount, refresh, markRead, markAllRead }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications(): NotificationsContextValue {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error("useNotifications must be used within a NotificationsProvider");
  return ctx;
}
