"use client";

import { useCallback, useEffect, useState } from "react";
import { Bell, RefreshCw, AlertOctagon, AlertTriangle, Info, CheckCircle2 } from "lucide-react";
import { PanelHeader, Card, LoadingBlock, ErrorBlock, AccessDenied, formatDate, useStaffPermissions } from "@/components/staff/ui";

interface Alert { id: string; severity: "info" | "warning" | "critical"; title: string; description: string; }

const SEVERITY: Record<string, { icon: typeof AlertOctagon; tone: string; ring: string }> = {
  critical: { icon: AlertOctagon, tone: "text-rose-300", ring: "bg-rose-500/10 ring-rose-500/30" },
  warning: { icon: AlertTriangle, tone: "text-amber-300", ring: "bg-amber-500/10 ring-amber-500/30" },
  info: { icon: Info, tone: "text-blue-300", ring: "bg-blue-500/10 ring-blue-500/30" },
};

export default function AlertsPanel(_props: { isDirector?: boolean }) {
  const { has, loaded } = useStaffPermissions();
  const canView = has("economy.view");
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [checkedAt, setCheckedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/staff/economy/alerts", { cache: "no-store" });
      const json = await res.json();
      if (json.success) { setAlerts(json.alerts); setCheckedAt(json.checkedAt); } else setError(json.error);
    } catch {
      setError("No se pudo conectar con el servidor");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (loaded && canView) load(); else if (loaded) setLoading(false); }, [load, canView, loaded]);

  if (!loaded) return <LoadingBlock />;
  if (!canView) return <AccessDenied title="Alertas Inteligentes" />;
  if (loading) return <LoadingBlock />;
  if (error) return <ErrorBlock text={error} onRetry={load} />;

  return (
    <div>
      <PanelHeader
        title="Alertas Inteligentes"
        subtitle="Reglas evaluadas en el momento sobre datos reales — no hay tarea automática en segundo plano"
        action={
          <button type="button" onClick={load} className="h-9 w-9 flex items-center justify-center rounded-lg border border-[#1F2937] text-slate-400 hover:text-white hover:border-blue-500/50 transition">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        }
      />

      {checkedAt && <p className="text-xs text-slate-500 mb-4">Última comprobación: {formatDate(checkedAt)}</p>}

      {alerts.length === 0 ? (
        <Card className="p-16 text-center">
          <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-4" />
          <h3 className="text-white font-semibold mb-1">Sin alertas activas</h3>
          <p className="text-sm text-slate-500">No se detectaron movimientos inusuales, compras masivas ni concentración excesiva.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {alerts.map((a) => {
            const cfg = SEVERITY[a.severity];
            const Icon = cfg.icon;
            return (
              <Card key={a.id} className={`p-4 flex items-start gap-3 ring-1 ${cfg.ring}`}>
                <Icon className={`h-5 w-5 flex-shrink-0 mt-0.5 ${cfg.tone}`} />
                <div>
                  <div className={`text-sm font-semibold ${cfg.tone}`}>{a.title}</div>
                  <p className="text-sm text-slate-400 mt-0.5">{a.description}</p>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
