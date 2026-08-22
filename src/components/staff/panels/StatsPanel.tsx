"use client";

import { useCallback, useEffect, useState } from "react";
import { Users, Coins, ShieldCheck, Ban, UserPlus } from "lucide-react";
import { PanelHeader, Card, CardTitle, Kpi, LoadingBlock, ErrorBlock } from "@/components/staff/ui";

type Range = "24h" | "7d" | "30d" | "90d";
const RANGES: { id: Range; label: string }[] = [
  { id: "24h", label: "24 horas" }, { id: "7d", label: "7 días" }, { id: "30d", label: "30 días" }, { id: "90d", label: "90 días" },
];

interface Stats {
  totalPlayers: number; newPlayers: number; totalHubCoinsInCirculation: number;
  whitelist: Record<string, number>; sanctions: Record<string, number>; tickets: Record<string, number>; reports: Record<string, number>;
}

function Breakdown({ title, data, labels }: { title: string; data: Record<string, number>; labels: Record<string, string> }) {
  const total = Object.values(data).reduce((a, b) => a + b, 0);
  return (
    <Card className="p-4">
      <CardTitle className="mb-3">{title}</CardTitle>
      {total === 0 ? (
        <p className="text-sm text-slate-500">Sin datos todavía</p>
      ) : (
        <div className="space-y-2.5">
          {Object.entries(labels).map(([key, label]) => {
            const value = data[key] || 0;
            const pct = total > 0 ? Math.round((value / total) * 100) : 0;
            return (
              <div key={key}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-400">{label}</span>
                  <span className="text-slate-300 font-medium">{value}</span>
                </div>
                <div className="h-1.5 bg-[#0B0F17] rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

export default function StatsPanel() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [range, setRange] = useState<Range>("30d");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    fetch(`/api/staff/stats?range=${range}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => { if (d.success) setStats(d); else setError(d.error); })
      .catch(() => setError("No se pudo conectar con el servidor"))
      .finally(() => setLoading(false));
  }, [range]);

  useEffect(() => { load(); }, [load]);

  if (loading && !stats) return <LoadingBlock />;
  if (error || !stats) return <ErrorBlock text={error || "Sin datos"} onRetry={load} />;

  return (
    <div>
      <PanelHeader
        title="Estadísticas"
        subtitle="Números agregados de toda la operación"
        action={
          <div className="flex gap-1.5">
            {RANGES.map((r) => (
              <button key={r.id} type="button" onClick={() => setRange(r.id)} className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${range === r.id ? "bg-blue-600 text-white" : "bg-[#111827] text-slate-400 border border-[#1F2937] hover:text-white"}`}>
                {r.label}
              </button>
            ))}
          </div>
        }
      />

      <section className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <Kpi label="Jugadores registrados" value={stats.totalPlayers} icon={Users} tone="text-blue-400" ring="bg-blue-500/10" />
        <Kpi label={`Nuevos (${RANGES.find((r) => r.id === range)?.label})`} value={stats.newPlayers} icon={UserPlus} tone="text-sky-400" ring="bg-sky-500/10" />
        <Kpi label="Hub Coins en circulación" value={stats.totalHubCoinsInCirculation.toLocaleString()} icon={Coins} tone="text-amber-400" ring="bg-amber-500/10" />
        <Kpi label="Solicitudes de whitelist" value={Object.values(stats.whitelist).reduce((a, b) => a + b, 0)} icon={ShieldCheck} tone="text-emerald-400" ring="bg-emerald-500/10" />
        <Kpi label="Sanciones aplicadas" value={Object.values(stats.sanctions).reduce((a, b) => a + b, 0)} icon={Ban} tone="text-rose-400" ring="bg-rose-500/10" />
      </section>

      <section className="grid sm:grid-cols-2 gap-4">
        <Breakdown title="Whitelist por estado" data={stats.whitelist} labels={{ pending: "Pendiente", in_review: "En revisión", approved: "Aprobada", rejected: "Rechazada", needs_revision: "Correcciones" }} />
        <Breakdown title="Sanciones por tipo" data={stats.sanctions} labels={{ warn: "Advertencia", kick: "Expulsión", temp_ban: "Ban temporal", perm_ban: "Ban permanente", restriction: "Restricción", suspension: "Suspensión" }} />
        <Breakdown title="Tickets por estado" data={stats.tickets} labels={{ open: "Abiertos", in_progress: "En curso", closed: "Cerrados" }} />
        <Breakdown title="Reportes por estado" data={stats.reports} labels={{ open: "Nuevos", in_review: "En revisión", assigned: "Asignados", investigating: "En investigación", resolved: "Resueltos", dismissed: "Rechazados" }} />
      </section>
    </div>
  );
}
