"use client";

import { useMemo } from "react";
import { ExternalLink } from "lucide-react";
import { useMDT } from "@/contexts/MDTContext";
import { useTerminalWindows } from "@/contexts/TerminalWindowContext";

const PRIORITY_TONE: Record<string, string> = {
  Low: "text-[#6d7999]", Medium: "text-[#c1975a]", High: "text-[#c0665c]", Critical: "text-[#c0665c]",
};

/** Ficha del caso más reciente — no un resumen inventado, es el último `state.cases` real. */
export default function CaseFilePanel() {
  const { state } = useMDT();
  const { openWindow } = useTerminalWindows();

  const latest = useMemo(
    () => [...state.cases].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0] || null,
    [state.cases]
  );

  if (!latest) {
    return <div className="h-full flex items-center justify-center text-[#454f6b] text-[11px] p-4 text-center">Sin casos registrados.</div>;
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto p-3 text-[11px]">
        <div className="flex items-center justify-between mb-1.5">
          <span className="font-mono text-[10px] text-[#454f6b]">{latest.caseNumber}</span>
          <span className={`font-mono text-[9.5px] font-semibold ${PRIORITY_TONE[latest.priority] || "text-[#6d7999]"}`}>{latest.priority.toUpperCase()}</span>
        </div>
        <p className="text-[#dde3f2] font-semibold mb-0.5">{latest.title}</p>
        <p className="text-[#6d7999] text-[10.5px] mb-2">{latest.type} · {latest.status}</p>
        <p className="text-[#6d7999] leading-relaxed line-clamp-4">{latest.summary || "Sin resumen."}</p>

        <div className="mt-3 pt-2 border-t border-[#151d31] grid grid-cols-2 gap-1 text-[10px] text-[#454f6b]">
          <span>OFICIAL A CARGO</span><span className="text-[#6d7999] text-right">{latest.leadOfficerName || "—"}</span>
          <span>PERSONAS</span><span className="text-[#6d7999] text-right">{latest.relatedPersonIds.length}</span>
          <span>VEHÍCULOS</span><span className="text-[#6d7999] text-right">{latest.relatedVehicleIds.length}</span>
          <span>EVIDENCIA</span><span className="text-[#6d7999] text-right">{latest.relatedEvidenceIds.length}</span>
        </div>
      </div>
      <button
        onClick={() => openWindow("cases", { title: "Casos", maximized: true, focusExisting: true })}
        className="flex items-center justify-center gap-1.5 px-2 py-1.5 border-t border-[#151d31] text-[10px] text-[#6d7999] hover:text-[#dde3f2] hover:bg-[#111a2c] flex-shrink-0"
      >
        <ExternalLink className="w-3 h-3" /> Abrir módulo de casos
      </button>
    </div>
  );
}
