"use client";

import { useEffect, useState } from "react";
import { useFD } from "@/contexts/FDContext";
import { useDepartment } from "@/contexts/DepartmentContext";

/** Franja superior técnica de LSFD — gris grafito/ámbar, rojo reservado para crítico. */
export default function FDTopBar() {
  const { state } = useFD();
  const department = useDepartment();
  const firefighter = state.currentFirefighter;
  const [clock, setClock] = useState("");

  useEffect(() => {
    const tick = () => setClock(new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const field = (label: string, value: string, tone?: string) => (
    <span className="flex items-center gap-1.5">
      <span className="text-[#57534a]">{label}:</span>
      <span className={tone || "text-[#e5e3de]"}>{value}</span>
    </span>
  );

  return (
    <div className="h-8 flex items-center gap-5 px-4 border-b border-[#2a2620] bg-[#111110] font-mono text-[10.5px] tracking-wide flex-shrink-0 overflow-x-auto">
      <span className="text-[#c0392b] font-semibold whitespace-nowrap">{department.factionAbbreviation} // INTERNAL NETWORK</span>
      {firefighter && (
        <>
          {field("TERMINAL", `${department.terminalKey}-${firefighter.badgeNumber}`)}
          {field("USER", firefighter.lastName.toUpperCase())}
          {field("BADGE", firefighter.badgeNumber)}
          {field("UNIT", firefighter.callsign || firefighter.unit?.toUpperCase() || "SIN ASIGNAR")}
          {field("CLEARANCE", `LEVEL ${String(firefighter.rankLevel).padStart(2, "0")}`, "text-[#d4af37]")}
        </>
      )}
      <span className="flex-1" />
      {field("NETWORK", "SECURE", "text-[#d4af37]")}
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.7)]" />
      <span className="text-[#e5e3de] tabular-nums whitespace-nowrap">{clock}</span>
    </div>
  );
}
