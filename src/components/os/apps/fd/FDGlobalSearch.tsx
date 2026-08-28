"use client";

import { useEffect, useRef, useState } from "react";
import { Search, X, Users, Siren, Briefcase, Wrench, Award, Loader2, User, Car, Home } from "lucide-react";
import { useTerminalWindows } from "@/contexts/TerminalWindowContext";
import { FD_MODULE_TITLES } from "@/components/terminal/fdModuleContent";

interface SearchResults {
  personnel: { id: string; firstName: string; lastName: string; badgeNumber: string; callsign?: string; onDuty: boolean }[];
  calls: { id: string; title: string; type: string; location: string; priority: string; status: string }[];
  cases: { id: string; caseNumber: string; title: string; status: string }[];
  equipment: { id: string; name: string; category: string; status: string }[];
  certifications: { id: string; name: string; firefighterName: string; status: string }[];
  persons: { id: string; firstName: string; lastName: string; address: string; flags: string[] }[];
  vehicles: { id: string; plate: string; make: string; model: string; registeredOwner: string; isStolen: boolean }[];
  properties: { id: string; name: string; type: string; address: string }[];
}

const EMPTY: SearchResults = { personnel: [], calls: [], cases: [], equipment: [], certifications: [], persons: [], vehicles: [], properties: [] };

/** Búsqueda global de LSFD — espejo de MDTGlobalSearch, sobre personal/despacho/investigaciones/equipo/academia. */
export default function FDGlobalSearch({ onClose }: { onClose: () => void }) {
  const { openWindow } = useTerminalWindows();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults>(EMPTY);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) { setResults(EMPTY); setLoading(false); return; }
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/fd/search?q=${encodeURIComponent(q)}`, { cache: "no-store" });
        const data = await res.json();
        if (data.success) setResults(data.results);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const totalResults = results.personnel.length + results.calls.length + results.cases.length + results.equipment.length + results.certifications.length + results.persons.length + results.vehicles.length + results.properties.length;

  const goTo = (kind: string) => {
    openWindow(kind, { title: FD_MODULE_TITLES[kind], maximized: true, focusExisting: true });
    onClose();
  };

  return (
    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm z-[4000] flex items-start justify-center pt-20 px-4" onClick={onClose}>
      <div className="w-full max-w-2xl bg-[#141312] border border-[var(--dept-window-border,#2a2620)] rounded-xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--dept-window-border,#2a2620)]">
          <Search className="w-4 h-4 text-[#57534a] flex-shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar personal, incidentes, casos, equipo, certificaciones..."
            className="flex-1 bg-transparent text-sm text-[#e5e3de] placeholder-[#57534a] focus:outline-none"
          />
          {loading && <Loader2 className="w-3.5 h-3.5 text-[#57534a] animate-spin flex-shrink-0" />}
          <button onClick={onClose} className="text-[#57534a] hover:text-[#e5e3de] flex-shrink-0"><X className="w-4 h-4" /></button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          {query.trim().length < 2 ? (
            <p className="text-[#57534a] text-sm text-center py-10">Escribí al menos 2 caracteres para buscar en toda la base de datos.</p>
          ) : totalResults === 0 && !loading ? (
            <p className="text-[#57534a] text-sm text-center py-10">Sin resultados para "{query.trim()}".</p>
          ) : (
            <div className="divide-y divide-[var(--dept-window-border,#1e1c19)]">
              {results.personnel.length > 0 && (
                <ResultGroup label="Personal" icon={Users}>
                  {results.personnel.map((p) => (
                    <ResultRow key={p.id} onClick={() => goTo("fd-personnel")}>
                      <span className="text-[#e5e3de] text-sm font-medium">{p.firstName} {p.lastName}</span>
                      <span className="text-[#57534a] text-xs">#{p.badgeNumber}{p.callsign ? ` · ${p.callsign}` : ""}</span>
                      {p.onDuty && <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-semibold">EN SERVICIO</span>}
                    </ResultRow>
                  ))}
                </ResultGroup>
              )}
              {results.calls.length > 0 && (
                <ResultGroup label="Incidentes" icon={Siren}>
                  {results.calls.map((c) => (
                    <ResultRow key={c.id} onClick={() => goTo("fd-cad")}>
                      <span className="text-[#e5e3de] text-sm font-medium">{c.title || c.type}</span>
                      <span className="text-[#57534a] text-xs">{c.location}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#1c1a17] border border-[var(--dept-window-border,#2a2620)] text-[#867e70]">{c.status}</span>
                    </ResultRow>
                  ))}
                </ResultGroup>
              )}
              {results.cases.length > 0 && (
                <ResultGroup label="Investigaciones" icon={Briefcase}>
                  {results.cases.map((c) => (
                    <ResultRow key={c.id} onClick={() => goTo("fd-investigations")}>
                      <span className="text-[#e5e3de] text-sm font-medium">{c.title}</span>
                      <span className="text-[#57534a] text-xs">{c.caseNumber}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#1c1a17] border border-[var(--dept-window-border,#2a2620)] text-[#867e70]">{c.status}</span>
                    </ResultRow>
                  ))}
                </ResultGroup>
              )}
              {results.equipment.length > 0 && (
                <ResultGroup label="Equipo" icon={Wrench}>
                  {results.equipment.map((e) => (
                    <ResultRow key={e.id} onClick={() => goTo("fd-equipment")}>
                      <span className="text-[#e5e3de] text-sm font-medium">{e.name}</span>
                      <span className="text-[#57534a] text-xs">{e.category}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#1c1a17] border border-[var(--dept-window-border,#2a2620)] text-[#867e70]">{e.status}</span>
                    </ResultRow>
                  ))}
                </ResultGroup>
              )}
              {results.certifications.length > 0 && (
                <ResultGroup label="Certificaciones" icon={Award}>
                  {results.certifications.map((c) => (
                    <ResultRow key={c.id} onClick={() => goTo("fd-academy")}>
                      <span className="text-[#e5e3de] text-sm font-medium">{c.name}</span>
                      <span className="text-[#57534a] text-xs">{c.firefighterName}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#1c1a17] border border-[var(--dept-window-border,#2a2620)] text-[#867e70]">{c.status}</span>
                    </ResultRow>
                  ))}
                </ResultGroup>
              )}
              {results.persons.length > 0 && (
                <ResultGroup label="Personas (consulta — solo lectura)" icon={User}>
                  {results.persons.map((p) => (
                    <div key={p.id} className="w-full flex items-center gap-3 px-4 py-2.5 text-left">
                      <span className="text-[#e5e3de] text-sm font-medium">{p.firstName} {p.lastName}</span>
                      <span className="text-[#57534a] text-xs">{p.address}</span>
                      {p.flags?.length > 0 && <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/15 text-red-400 font-semibold">{p.flags[0]}</span>}
                    </div>
                  ))}
                </ResultGroup>
              )}
              {results.vehicles.length > 0 && (
                <ResultGroup label="Vehículos (consulta — solo lectura)" icon={Car}>
                  {results.vehicles.map((v) => (
                    <div key={v.id} className="w-full flex items-center gap-3 px-4 py-2.5 text-left">
                      <span className="text-[#e5e3de] text-sm font-medium font-mono">{v.plate}</span>
                      <span className="text-[#57534a] text-xs">{v.make} {v.model} · {v.registeredOwner}</span>
                      {v.isStolen && <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/15 text-red-400 font-semibold">ROBADO</span>}
                    </div>
                  ))}
                </ResultGroup>
              )}
              {results.properties.length > 0 && (
                <ResultGroup label="Propiedades (consulta — solo lectura)" icon={Home}>
                  {results.properties.map((p) => (
                    <div key={p.id} className="w-full flex items-center gap-3 px-4 py-2.5 text-left">
                      <span className="text-[#e5e3de] text-sm font-medium">{p.name}</span>
                      <span className="text-[#57534a] text-xs">{p.address}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#1c1a17] border border-[var(--dept-window-border,#2a2620)] text-[#867e70]">{p.type}</span>
                    </div>
                  ))}
                </ResultGroup>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ResultGroup({ label, icon: Icon, children }: { label: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 px-4 py-1.5 text-[10px] font-semibold text-[#57534a] uppercase tracking-wide bg-[#0e0d0c]">
        <Icon className="w-3 h-3" /> {label}
      </div>
      {children}
    </div>
  );
}

function ResultRow({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#181715] transition-colors text-left">
      {children}
    </button>
  );
}
