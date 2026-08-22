"use client";

import { useMemo } from "react";
import { useMDT } from "@/contexts/MDTContext";

function fmtTime(d?: Date | string) {
  if (!d) return "—";
  return new Date(d).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

/** Cola corta de auditoría real, formato de log de sistema — no una tarjeta de "actividad reciente". */
export default function SystemLogPanel() {
  const { state } = useMDT();
  const entries = useMemo(
    () => [...state.auditLogs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 30),
    [state.auditLogs]
  );

  return (
    <div className="h-full overflow-y-auto p-2.5 font-mono text-[10px] leading-relaxed">
      {entries.length === 0 ? (
        <p className="text-[#4a5372] p-1">Sin actividad registrada.</p>
      ) : (
        entries.map((e) => (
          <div key={e.id} className="flex gap-2 text-[#6d7999] hover:bg-[#111a2c] px-1 rounded">
            <span className="text-[#454f6b] flex-shrink-0">{fmtTime(e.timestamp)}</span>
            <span className="truncate">{e.description}</span>
          </div>
        ))
      )}
    </div>
  );
}
