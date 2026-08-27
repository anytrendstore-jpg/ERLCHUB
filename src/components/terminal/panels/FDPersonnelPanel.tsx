"use client";

import { Users } from "lucide-react";
import { useFD } from "@/contexts/FDContext";

const STATUS_DOT: Record<string, string> = {
  Available: "bg-emerald-500",
  Dispatched: "bg-amber-400",
  "En Route": "bg-amber-400",
  "On Scene": "bg-red-500",
  Transporting: "bg-[#d4af37]",
  "Out of Service": "bg-[#57534a]",
};

/** Roster de personal de LSFD — inspirado en el listado de AdminFactionPanel.tsx, sin datos inventados. */
export default function FDPersonnelPanel() {
  const { state } = useFD();
  const { personnel } = state;

  if (personnel.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center text-[#57534a] gap-2 p-4">
        <Users className="w-8 h-8" />
        <p className="text-[11px]">Sin personal registrado todavía.</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-3 text-[11px] space-y-1.5">
      {personnel.map((p) => (
        <div key={p.id} className="flex items-center justify-between gap-2 px-3 py-2 rounded bg-[#141312] border border-[#2a2620]">
          <div className="min-w-0">
            <p className="text-[#e5e3de] font-medium truncate">{p.firstName} {p.lastName}</p>
            <p className="text-[#57534a] text-[10px] font-mono">#{p.badgeNumber} {p.callsign ? `· ${p.callsign}` : p.unit ? `· ${p.unit}` : "· sin unidad"}</p>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[p.status] || "bg-[#57534a]"}`} />
            <span className="text-[#867e70] text-[10px]">{p.onDuty ? p.status : "Fuera de servicio"}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
