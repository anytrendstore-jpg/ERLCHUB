"use client";

import { useMemo } from "react";
import { useMDT } from "@/contexts/MDTContext";

function fmtTime(d?: Date | string) {
  if (!d) return "—";
  return new Date(d).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
}

/**
 * Resumen denso del turno — solo datos reales (nada de unidades/telemetría
 * inventada): las "unidades activas" salen de assignedUnits de incidentes
 * en curso, no de un feed de posiciones que este proyecto no tiene.
 */
export default function DashboardOverviewPanel() {
  const { state } = useMDT();
  const { calls, bolos, warrants } = state;

  const activeUnits = useMemo(() => {
    const units = new Set<string>();
    calls.forEach((c) => {
      if (c.status === "Pending" || c.status === "En Route" || c.status === "On Scene") {
        c.assignedUnits.forEach((u) => units.add(u));
      }
    });
    return Array.from(units);
  }, [calls]);

  const dispatchFeed = useMemo(
    () => [...calls].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 6),
    [calls]
  );

  const alerts = useMemo(() => {
    const list: { text: string; sub: string; tone: "red" | "amber" }[] = [];
    bolos.filter((b) => b.status === "Active").slice(0, 3).forEach((b) => list.push({ text: `BOLO — ${b.title}`, sub: b.boloNumber, tone: "red" }));
    warrants.filter((w) => w.isActive).slice(0, 2).forEach((w) => list.push({ text: `Orden activa — ${w.personName}`, sub: w.warrantNumber, tone: "amber" }));
    return list.slice(0, 5);
  }, [bolos, warrants]);

  return (
    <div className="h-full overflow-y-auto p-3 text-[11px]">
      <div className="mb-3">
        <div className="text-[9px] font-semibold tracking-widest text-[#4a5372] uppercase mb-1.5">Unidades activas</div>
        {activeUnits.length === 0 ? (
          <p className="text-[#4a5372]">Sin unidades asignadas.</p>
        ) : (
          <div className="flex flex-wrap gap-1">
            {activeUnits.map((u) => (
              <span key={u} className="px-1.5 py-0.5 rounded bg-[#121a2e] border border-[#1e2a45] text-[#6f93d6] font-mono text-[10px]">{u}</span>
            ))}
          </div>
        )}
      </div>

      <div className="mb-3">
        <div className="text-[9px] font-semibold tracking-widest text-[#4a5372] uppercase mb-1.5">Feed de despacho</div>
        {dispatchFeed.length === 0 ? (
          <p className="text-[#4a5372]">Sin incidentes registrados.</p>
        ) : (
          <div className="space-y-1">
            {dispatchFeed.map((c) => (
              <div key={c.id} className="flex items-center gap-2 text-[#6d7999]">
                <span className="font-mono text-[9.5px] text-[#454f6b] w-10 flex-shrink-0">{fmtTime(c.createdAt)}</span>
                <span className="truncate">{c.title || c.type} — {c.scene || c.location}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="text-[9px] font-semibold tracking-widest text-[#4a5372] uppercase mb-1.5">Alertas del sistema</div>
        {alerts.length === 0 ? (
          <p className="text-[#4a5372]">Sin alertas activas.</p>
        ) : (
          <div className="space-y-1.5">
            {alerts.map((a, i) => (
              <div key={i} className="flex items-start gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full mt-1 flex-shrink-0 ${a.tone === "red" ? "bg-[#c0665c]" : "bg-[#c1975a]"}`} />
                <div className="min-w-0">
                  <p className="text-[#dde3f2] truncate">{a.text}</p>
                  <p className="text-[#454f6b] font-mono text-[9.5px]">{a.sub}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
