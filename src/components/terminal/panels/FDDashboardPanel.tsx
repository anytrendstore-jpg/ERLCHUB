"use client";

import { useMemo } from "react";
import { useFD } from "@/contexts/FDContext";

function fmtTime(d?: Date | string) {
  if (!d) return "—";
  return new Date(d).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
}

/**
 * Resumen del turno — espejo de DashboardOverviewPanel.tsx. Solo datos
 * reales: "unidades activas" sale de assignedUnits de incidentes en curso,
 * nunca de una telemetría inventada.
 */
export default function FDDashboardPanel() {
  const { state } = useFD();
  const { calls, personnel } = state;

  const activeUnits = useMemo(() => {
    const units = new Set<string>();
    calls.forEach((c) => {
      if (c.status === "Pending" || c.status === "En Route" || c.status === "On Scene") {
        c.assignedUnits.forEach((u) => units.add(u));
      }
    });
    return Array.from(units);
  }, [calls]);

  const onDutyCount = useMemo(() => personnel.filter((p) => p.onDuty).length, [personnel]);

  const dispatchFeed = useMemo(
    () => [...calls].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 6),
    [calls]
  );

  return (
    <div className="h-full overflow-y-auto p-3 text-[11px]">
      <div className="mb-3">
        <div className="text-[9px] font-semibold tracking-widest text-[#57534a] uppercase mb-1.5">Personal en servicio</div>
        <p className="text-[#d4af37] font-mono text-[13px]">{onDutyCount} <span className="text-[#867e70] font-sans text-[10.5px]">de {personnel.length} registrados</span></p>
      </div>

      <div className="mb-3">
        <div className="text-[9px] font-semibold tracking-widest text-[#57534a] uppercase mb-1.5">Unidades activas</div>
        {activeUnits.length === 0 ? (
          <p className="text-[#57534a]">Sin unidades asignadas.</p>
        ) : (
          <div className="flex flex-wrap gap-1">
            {activeUnits.map((u) => (
              <span key={u} className="px-1.5 py-0.5 rounded bg-[#1a1917] border border-[#2a2620] text-[#d4af37] font-mono text-[10px]">{u}</span>
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="text-[9px] font-semibold tracking-widest text-[#57534a] uppercase mb-1.5">Feed de despacho</div>
        {dispatchFeed.length === 0 ? (
          <p className="text-[#57534a]">Sin incidentes registrados.</p>
        ) : (
          <div className="space-y-1">
            {dispatchFeed.map((c) => (
              <div key={c.id} className="flex items-center gap-2 text-[#867e70]">
                <span className="font-mono text-[9.5px] text-[#57534a] w-10 flex-shrink-0">{fmtTime(c.createdAt)}</span>
                <span className="truncate">{c.title || c.type} — {c.scene || c.location}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
