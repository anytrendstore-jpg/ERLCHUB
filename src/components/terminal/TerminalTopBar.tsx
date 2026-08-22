"use client";

import { useEffect, useState } from "react";
import { useMDT } from "@/contexts/MDTContext";
import { useDepartment } from "@/contexts/DepartmentContext";
import { clearanceLevel } from "@/lib/clearance";

/** Franja superior técnica — identidad de red, no una barra de título de app. */
export default function TerminalTopBar() {
  const { state } = useMDT();
  const department = useDepartment();
  const officer = state.currentOfficer;
  const [clock, setClock] = useState("");

  useEffect(() => {
    const tick = () => setClock(new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const field = (label: string, value: string, tone?: string) => (
    <span className="flex items-center gap-1.5">
      <span className="text-[#454f6b]">{label}:</span>
      <span className={tone || "text-[#dde3f2]"}>{value}</span>
    </span>
  );

  return (
    <div className="h-8 flex items-center gap-5 px-4 border-b border-[#1e2a45] bg-[#080b13] font-mono text-[10.5px] tracking-wide flex-shrink-0 overflow-x-auto">
      <span className="text-[#6f93d6] font-semibold whitespace-nowrap">{department.factionAbbreviation} // INTERNAL NETWORK</span>
      {officer && (
        <>
          {field("TERMINAL", `${department.terminalKey}-${officer.badgeNumber}`)}
          {field("USER", `${officer.rank[0]}. ${officer.lastName}`.toUpperCase())}
          {field("BADGE", officer.badgeNumber)}
          {field("DIVISION", officer.division.toUpperCase())}
          {field("CLEARANCE", `LEVEL ${String(clearanceLevel(officer.rank)).padStart(2, "0")}`, "text-[#c1975a]")}
        </>
      )}
      <span className="flex-1" />
      {field("NETWORK", "SECURE", "text-[#6f93d6]")}
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.7)]" />
      <span className="text-[#dde3f2] tabular-nums whitespace-nowrap">{clock}</span>
    </div>
  );
}
