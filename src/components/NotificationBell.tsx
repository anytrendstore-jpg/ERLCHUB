"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCircle, AlertTriangle, AlertCircle, Info, CheckCheck } from "lucide-react";
import { useNotifications, type SiteNotification } from "@/hooks/useNotifications";

const ICON_BY_TYPE: Record<SiteNotification["type"], React.ElementType> = {
  success: CheckCircle,
  warning: AlertTriangle,
  error: AlertCircle,
  info: Info,
};

const COLOR_BY_TYPE: Record<SiteNotification["type"], string> = {
  success: "#22c55e",
  warning: "#f59e0b",
  error: "#ef4444",
  info: "#8e00f7",
};

function formatTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (minutes < 1) return "Ahora";
  if (minutes < 60) return `Hace ${minutes}m`;
  if (hours < 24) return `Hace ${hours}h`;
  if (days < 7) return `Hace ${days}d`;
  return new Date(iso).toLocaleDateString("es-ES");
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const handleClick = (n: SiteNotification) => {
    if (!n.read) markRead(n.id);
    if (n.link) {
      setOpen(false);
      router.push(n.link);
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[var(--card-bg)] border border-[var(--card-border-soft)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--foreground)] hover:border-[var(--accent-blue)] transition-all duration-200 hover:scale-105 active:scale-95"
        aria-label="Notificaciones"
      >
        <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[16px] h-4 sm:min-w-[18px] sm:h-[18px] px-1 bg-[var(--accent-blue)] text-white text-[10px] sm:text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-w-[90vw] bg-[var(--card-bg-2)] border border-[var(--card-border-soft)] rounded-xl shadow-2xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--card-border-soft)]">
            <span className="font-semibold text-[var(--foreground)] text-sm">Notificaciones</span>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1 text-xs font-medium text-[#8e00f7] hover:text-[#a64dfa] transition-colors"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Marcar todas
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-[var(--text-faint)]">
                <Bell className="h-8 w-8 mb-2 opacity-40" />
                <p className="text-sm">No tenés notificaciones</p>
              </div>
            ) : (
              <div className="divide-y divide-[var(--card-border-soft)]">
                {notifications.map((n) => {
                  const Icon = ICON_BY_TYPE[n.type] || Info;
                  const color = COLOR_BY_TYPE[n.type] || "#8e00f7";
                  return (
                    <button
                      key={n.id}
                      onClick={() => handleClick(n)}
                      className={`w-full text-left flex gap-3 px-4 py-3 hover:bg-[var(--card-bg)] transition-colors ${!n.read ? "bg-[var(--card-bg)]/60" : ""}`}
                    >
                      <Icon className="h-4.5 w-4.5 flex-shrink-0 mt-0.5" style={{ color }} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-[var(--foreground)] truncate">{n.title}</p>
                          {!n.read && <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />}
                        </div>
                        <p className="text-xs text-[var(--text-muted)] mt-0.5 line-clamp-2">{n.message}</p>
                        <span className="text-[10px] text-[var(--text-faint)] mt-1 block">{formatTime(n.timestamp)}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
