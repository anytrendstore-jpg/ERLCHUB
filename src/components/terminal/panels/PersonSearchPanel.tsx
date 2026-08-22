"use client";

import { useMemo, useState } from "react";
import { Search, ExternalLink } from "lucide-react";
import { useMDT } from "@/contexts/MDTContext";
import { useTerminalWindows } from "@/contexts/TerminalWindowContext";

/**
 * Mini buscador — filtra localmente sobre state.persons (no llama a
 * searchPerson() en render: esa función registra auditoría vía setState y
 * dispararla durante el render entra en loop infinito, mismo cuidado que
 * ya toman los modales existentes del MDT).
 */
export default function PersonSearchPanel() {
  const { state } = useMDT();
  const { openWindow } = useTerminalWindows();
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return state.persons.filter((p) => `${p.firstName} ${p.lastName}`.toLowerCase().includes(q)).slice(0, 8);
  }, [state.persons, query]);

  return (
    <div className="h-full flex flex-col">
      <div className="p-2 border-b border-[#151d31] flex-shrink-0">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-[#454f6b]" />
          <input
            value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por nombre..."
            className="w-full bg-[#121a2e] border border-[#1e2a45] rounded pl-6 pr-2 py-1.5 text-[11px] text-[#dde3f2] placeholder-[#454f6b] focus:outline-none focus:border-[#3c68c9]"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {query.trim() === "" ? (
          <p className="text-[#454f6b] text-[10.5px] p-3">Escribí un nombre para buscar.</p>
        ) : results.length === 0 ? (
          <p className="text-[#454f6b] text-[10.5px] p-3">Sin resultados.</p>
        ) : (
          results.map((p) => (
            <div key={p.id} className="px-2.5 py-1.5 border-b border-[#111a2c] text-[11px]">
              <p className="text-[#dde3f2] font-medium">{p.firstName} {p.lastName}</p>
              <p className="text-[#6d7999] text-[10px]">{p.riskLevel !== "None" ? p.riskLevel : "Sin riesgo registrado"}</p>
            </div>
          ))
        )}
      </div>
      <button
        onClick={() => openWindow("persons", { title: "Personas", maximized: true, focusExisting: true })}
        className="flex items-center justify-center gap-1.5 px-2 py-1.5 border-t border-[#151d31] text-[10px] text-[#6d7999] hover:text-[#dde3f2] hover:bg-[#111a2c] flex-shrink-0"
      >
        <ExternalLink className="w-3 h-3" /> Abrir base de datos completa
      </button>
    </div>
  );
}
