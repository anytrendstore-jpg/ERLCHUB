"use client";

import { useCallback, useEffect, useState } from "react";
import { Bell, AlertOctagon, AlertTriangle, Info, CheckCircle2, Trash2 } from "lucide-react";

interface NotificationDoc {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  appId?: string;
  read: boolean;
  timestamp: string;
}

/** Clasificación Crítico/Alto/Estándar/Informativo del spec, mapeada sobre el tipo genérico ya existente (notificationsServer.ts) — sin bifurcar en un sistema de alertas propio de LSFD. */
const SEVERITY: Record<NotificationDoc["type"], { label: string; text: string; icon: typeof Bell }> = {
  error: { label: "CRÍTICO", text: "text-red-400", icon: AlertOctagon },
  warning: { label: "ALTO", text: "text-[var(--dept-accent,#c1975a)]", icon: AlertTriangle },
  success: { label: "ESTÁNDAR", text: "text-emerald-300", icon: CheckCircle2 },
  info: { label: "INFORMATIVO", text: "text-[#867e70]", icon: Info },
};

function fmtTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "ahora";
  if (min < 60) return `hace ${min}m`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h}h`;
  return new Date(iso).toLocaleDateString("es-ES");
}

/** Alertas del sistema — lee el mismo os_notifications ya usado por el resto del proyecto (notifyUser), sin popups: solo esta bandeja. */
export default function FDAlertsPanel() {
  const [items, setItems] = useState<NotificationDoc[] | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/os/notifications", { cache: "no-store" });
      const data = await res.json();
      setItems(data.success ? data.notifications : []);
    } catch {
      setItems([]);
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 15000);
    return () => clearInterval(id);
  }, [load]);

  const markRead = async (id: string) => {
    setItems((prev) => prev && prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    await fetch("/api/os/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "read", id }) });
  };

  const clearAll = async () => {
    setItems([]);
    await fetch("/api/os/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "clear" }) });
  };

  return (
    <div className="h-full flex flex-col text-[11px]">
      <div className="h-8 flex items-center justify-end px-2.5 border-b border-[var(--dept-window-border,#2a2620)] flex-shrink-0">
        {items && items.length > 0 && (
          <button onClick={clearAll} className="flex items-center gap-1 text-[10px] font-medium text-[#867e70] hover:text-[#e5e3de] transition-colors">
            <Trash2 className="w-3 h-3" /> Limpiar todo
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {items === null ? (
          <p className="text-[#57534a]">Cargando...</p>
        ) : items.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-[#57534a] gap-2 py-8">
            <Bell className="w-8 h-8" />
            <p>Sin alertas.</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {items.map((n) => {
              const sev = SEVERITY[n.type];
              const Icon = sev.icon;
              return (
                <button
                  key={n.id}
                  onClick={() => !n.read && markRead(n.id)}
                  className={`w-full text-left flex items-start gap-2.5 px-3 py-2 rounded border transition-colors ${
                    n.read ? "bg-[#141312] border-[var(--dept-window-border,#2a2620)]" : "bg-[#181715] border-[var(--dept-accent-25,#3a352c)]"
                  }`}
                >
                  <Icon className={`w-4 h-4 flex-shrink-0 mt-0.5 ${sev.text}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`text-[9px] font-bold ${sev.text}`}>{sev.label}</span>
                      <span className="text-[#57534a] text-[9.5px] font-mono ml-auto flex-shrink-0">{fmtTime(n.timestamp)}</span>
                    </div>
                    <p className={`truncate ${n.read ? "text-[#867e70]" : "text-[#e5e3de] font-semibold"}`}>{n.title}</p>
                    <p className="text-[#867e70] mt-0.5 line-clamp-2">{n.message}</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
