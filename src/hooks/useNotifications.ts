"use client";

import { useState, useEffect, useCallback } from "react";
import { useDiscordAuth } from "./useDiscordAuth";

export interface SiteNotification {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  link?: string;
  read: boolean;
  timestamp: string;
}

const POLL_MS = 30000;

/** Comparte la misma colección/ruta que usan las apps del OS (marketplace, MDT, etc)
 * — un mismo inbox de notificaciones para el jugador, sin importar desde qué
 * parte del sitio se generó el aviso. */
export function useNotifications() {
  const { isAuthenticated } = useDiscordAuth();
  const [notifications, setNotifications] = useState<SiteNotification[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await fetch("/api/os/notifications");
      const data = await res.json();
      if (data.success) setNotifications(data.notifications || []);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      setNotifications([]);
      return;
    }
    setLoading(true);
    fetchNotifications();
    const interval = setInterval(fetchNotifications, POLL_MS);
    return () => clearInterval(interval);
  }, [isAuthenticated, fetchNotifications]);

  const markRead = async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    try {
      await fetch("/api/os/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "read", id }),
      });
    } catch (error) {
      console.error("Error marking notification read:", error);
    }
  };

  const markAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await fetch("/api/os/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "readAll" }),
      });
    } catch (error) {
      console.error("Error marking all notifications read:", error);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return { notifications, unreadCount, loading, markRead, markAllRead, refetch: fetchNotifications };
}
