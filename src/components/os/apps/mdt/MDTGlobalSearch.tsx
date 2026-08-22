"use client";

import { useEffect, useRef, useState } from "react";
import { useMDT } from "@/contexts/MDTContext";
import { Search, X, User, Car, Briefcase, FileWarning, AlertTriangle, Shield, Loader2 } from "lucide-react";

interface SearchResults {
  persons: { id: string; firstName: string; lastName: string; riskLevel: string; address: string }[];
  vehicles: { id: string; plate: string; make: string; model: string; isStolen: boolean; registeredOwner: string }[];
  cases: { id: string; caseNumber: string; title: string; status: string; priority: string }[];
  warrants: { id: string; warrantNumber: string; personName: string; isActive: boolean }[];
  bolos: { id: string; boloNumber: string; title: string; status: string; priority: string }[];
  officers: { id: string; badgeNumber: string; firstName: string; lastName: string; rank: string; onDuty: boolean }[];
}

const EMPTY: SearchResults = { persons: [], vehicles: [], cases: [], warrants: [], bolos: [], officers: [] };

export default function MDTGlobalSearch({ onClose }: { onClose: () => void }) {
  const { openRecord, setScreen } = useMDT();
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
        const res = await fetch(`/api/mdt/search?q=${encodeURIComponent(q)}`, { cache: "no-store" });
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

  const totalResults = results.persons.length + results.vehicles.length + results.cases.length + results.warrants.length + results.bolos.length + results.officers.length;

  const openPerson = (id: string) => { openRecord("person", id, "persons"); onClose(); };
  const openVehicle = (id: string) => { openRecord("vehicle", id, "vehicles"); onClose(); };
  const openCase = (id: string) => { openRecord("case", id, "cases"); onClose(); };
  const goTo = (screen: "warrants" | "bolos" | "dashboard") => { setScreen(screen); onClose(); };

  return (
    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm z-[4000] flex items-start justify-center pt-20 px-4" onClick={onClose}>
      <div className="w-full max-w-2xl bg-[#0d1424] border border-[#151d31] rounded-xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[#151d31]">
          <Search className="w-4 h-4 text-slate-500 flex-shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar personas, vehículos, casos, órdenes, BOLOs, oficiales..."
            className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
          />
          {loading && <Loader2 className="w-3.5 h-3.5 text-slate-500 animate-spin flex-shrink-0" />}
          <button onClick={onClose} className="text-slate-500 hover:text-white flex-shrink-0"><X className="w-4 h-4" /></button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
          {query.trim().length < 2 ? (
            <p className="text-slate-600 text-sm text-center py-10">Escribí al menos 2 caracteres para buscar en toda la base de datos.</p>
          ) : totalResults === 0 && !loading ? (
            <p className="text-slate-600 text-sm text-center py-10">Sin resultados para "{query.trim()}".</p>
          ) : (
            <div className="divide-y divide-[#111a2c]">
              {results.persons.length > 0 && (
                <ResultGroup label="Personas" icon={User}>
                  {results.persons.map((p) => (
                    <ResultRow key={p.id} onClick={() => openPerson(p.id)}>
                      <span className="text-white text-sm font-medium">{p.firstName} {p.lastName}</span>
                      <span className="text-slate-500 text-xs">{p.address}</span>
                      {p.riskLevel !== "None" && <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/15 text-red-400 font-semibold">{p.riskLevel}</span>}
                    </ResultRow>
                  ))}
                </ResultGroup>
              )}
              {results.vehicles.length > 0 && (
                <ResultGroup label="Vehículos" icon={Car}>
                  {results.vehicles.map((v) => (
                    <ResultRow key={v.id} onClick={() => openVehicle(v.id)}>
                      <span className="text-white text-sm font-medium font-mono">{v.plate}</span>
                      <span className="text-slate-500 text-xs">{v.make} {v.model} · {v.registeredOwner}</span>
                      {v.isStolen && <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/15 text-red-400 font-semibold">ROBADO</span>}
                    </ResultRow>
                  ))}
                </ResultGroup>
              )}
              {results.cases.length > 0 && (
                <ResultGroup label="Casos" icon={Briefcase}>
                  {results.cases.map((c) => (
                    <ResultRow key={c.id} onClick={() => openCase(c.id)}>
                      <span className="text-white text-sm font-medium">{c.title}</span>
                      <span className="text-slate-500 text-xs">{c.caseNumber}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#121a2e] border border-[#1e2a45] text-slate-400">{c.status}</span>
                    </ResultRow>
                  ))}
                </ResultGroup>
              )}
              {results.warrants.length > 0 && (
                <ResultGroup label="Órdenes" icon={FileWarning}>
                  {results.warrants.map((w) => (
                    <ResultRow key={w.id} onClick={() => goTo("warrants")}>
                      <span className="text-white text-sm font-medium">{w.personName}</span>
                      <span className="text-slate-500 text-xs">{w.warrantNumber}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${w.isActive ? "bg-red-500/15 text-red-400" : "bg-emerald-500/15 text-emerald-400"}`}>{w.isActive ? "ACTIVA" : "CERRADA"}</span>
                    </ResultRow>
                  ))}
                </ResultGroup>
              )}
              {results.bolos.length > 0 && (
                <ResultGroup label="BOLOs" icon={AlertTriangle}>
                  {results.bolos.map((b) => (
                    <ResultRow key={b.id} onClick={() => goTo("bolos")}>
                      <span className="text-white text-sm font-medium">{b.title}</span>
                      <span className="text-slate-500 text-xs">{b.boloNumber}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#121a2e] border border-[#1e2a45] text-slate-400">{b.priority}</span>
                    </ResultRow>
                  ))}
                </ResultGroup>
              )}
              {results.officers.length > 0 && (
                <ResultGroup label="Oficiales" icon={Shield}>
                  {results.officers.map((o) => (
                    <ResultRow key={o.id} onClick={() => goTo("dashboard")}>
                      <span className="text-white text-sm font-medium">{o.rank} {o.firstName} {o.lastName}</span>
                      <span className="text-slate-500 text-xs">#{o.badgeNumber}</span>
                      {o.onDuty && <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-semibold">EN SERVICIO</span>}
                    </ResultRow>
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
      <div className="flex items-center gap-1.5 px-4 py-1.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wide bg-[#080b13]">
        <Icon className="w-3 h-3" /> {label}
      </div>
      {children}
    </div>
  );
}

function ResultRow({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#0f1729] transition-colors text-left">
      {children}
    </button>
  );
}
