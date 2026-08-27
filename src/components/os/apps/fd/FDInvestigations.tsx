"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Search, X, FolderSearch } from "lucide-react";
import type { FDCase, FDCaseStatus } from "@/lib/fdTypes";

const STATUS_OPTIONS: FDCaseStatus[] = ["Open", "Under Investigation", "Closed", "Referred"];
const STATUS_STYLE: Record<FDCaseStatus, string> = {
  Open: "text-red-400",
  "Under Investigation": "text-[var(--dept-accent,#d4af37)]",
  Closed: "text-emerald-300",
  Referred: "text-[#867e70]",
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" });
}

/** Investigaciones — causa de incendio sospechosa/a determinar, distinto de un reporte de incidente de rutina (FDReports). */
export default function FDInvestigations() {
  const [items, setItems] = useState<FDCase[] | null>(null);
  const [selected, setSelected] = useState<FDCase | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [findingsDraft, setFindingsDraft] = useState("");
  const [form, setForm] = useState({ title: "", location: "", narrative: "" });

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/fd/cases", { cache: "no-store" });
      const data = await res.json();
      setItems(data.success ? data.cases : []);
    } catch {
      setItems([]);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => { setFindingsDraft(selected?.findings || ""); }, [selected?.id]);

  const submit = async () => {
    if (!form.title.trim() || !form.location.trim() || !form.narrative.trim()) return;
    const res = await fetch("/api/fd/cases", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (data.success) {
      setItems((prev) => (prev ? [data.case, ...prev] : [data.case]));
      setForm({ title: "", location: "", narrative: "" });
      setShowNew(false);
    }
  };

  const update = async (id: string, updates: Partial<FDCase>) => {
    setItems((prev) => prev && prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
    setSelected((prev) => (prev && prev.id === id ? { ...prev, ...updates } : prev));
    const res = await fetch("/api/fd/cases", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, ...updates }) });
    const data = await res.json();
    if (data.success) {
      setItems((prev) => prev && prev.map((c) => (c.id === id ? data.case : c)));
      setSelected((prev) => (prev && prev.id === id ? data.case : prev));
    }
  };

  return (
    <div className="h-full flex text-[11px]">
      <div className="w-64 flex-shrink-0 border-r border-[var(--dept-window-border,#2a2620)] flex flex-col">
        <div className="h-8 flex items-center justify-end px-2.5 border-b border-[var(--dept-window-border,#2a2620)] flex-shrink-0">
          <button onClick={() => setShowNew(true)} className="flex items-center gap-1 text-[10px] font-medium text-[var(--dept-accent,#d4af37)] hover:text-[#e5e3de] transition-colors">
            <Plus className="w-3 h-3" /> Abrir caso
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {items === null ? (
            <p className="text-[#57534a] p-3">Cargando...</p>
          ) : items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-[#57534a] gap-2 py-8 px-3">
              <FolderSearch className="w-8 h-8" />
              <p>Sin investigaciones abiertas.</p>
            </div>
          ) : (
            items.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelected(c)}
                className={`w-full text-left px-3 py-2 border-b border-[var(--dept-window-border,#1e1c19)] transition-colors ${selected?.id === c.id ? "bg-[#181715]" : "hover:bg-[#141312]"}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[#57534a] font-mono text-[9.5px]">{c.caseNumber}</span>
                  <span className={`text-[9px] font-bold flex-shrink-0 ${STATUS_STYLE[c.status]}`}>{c.status}</span>
                </div>
                <p className="text-[#e5e3de] font-medium truncate mt-0.5">{c.title}</p>
                <p className="text-[#867e70] text-[10px] truncate">{c.location}</p>
              </button>
            ))
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {showNew ? (
          <div className="bg-[#141312] border border-[var(--dept-window-border,#2a2620)] rounded p-3 space-y-2 max-w-md">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold text-[#e5e3de] uppercase tracking-wide">Nueva investigación</span>
              <button onClick={() => setShowNew(false)}><X className="w-3.5 h-3.5 text-[#57534a]" /></button>
            </div>
            <input placeholder="Título (ej. Causa a determinar — Elm St 4400)" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full bg-[#0e0d0c] border border-[var(--dept-window-border,#2a2620)] rounded px-2 py-1.5 text-[#e5e3de] placeholder-[#57534a] focus:outline-none focus:border-[var(--dept-accent,#d4af37)]" />
            <input placeholder="Ubicación" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="w-full bg-[#0e0d0c] border border-[var(--dept-window-border,#2a2620)] rounded px-2 py-1.5 text-[#e5e3de] placeholder-[#57534a] focus:outline-none focus:border-[var(--dept-accent,#d4af37)]" />
            <textarea placeholder="Narrativa inicial" rows={4} value={form.narrative} onChange={(e) => setForm({ ...form, narrative: e.target.value })} className="w-full bg-[#0e0d0c] border border-[var(--dept-window-border,#2a2620)] rounded px-2 py-1.5 text-[#e5e3de] placeholder-[#57534a] resize-none focus:outline-none focus:border-[var(--dept-accent,#d4af37)]" />
            <button disabled={!form.title.trim() || !form.location.trim() || !form.narrative.trim()} onClick={submit} className="w-full bg-[var(--dept-accent,#d4af37)] disabled:opacity-40 text-[var(--dept-accent-fg,#0a0a0c)] font-semibold rounded py-1.5">
              Abrir caso
            </button>
          </div>
        ) : selected ? (
          <div className="max-w-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[#57534a] font-mono text-[10px]">{selected.caseNumber}</span>
                <h3 className="text-[#e5e3de] font-semibold text-[13px]">{selected.title}</h3>
              </div>
              <select
                value={selected.status}
                onChange={(e) => update(selected.id, { status: e.target.value as FDCaseStatus })}
                className={`bg-[#0e0d0c] border border-[var(--dept-window-border,#2a2620)] rounded px-2 py-1 text-[10px] font-semibold focus:outline-none ${STATUS_STYLE[selected.status]}`}
              >
                {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3 text-[10px]">
              <div><span className="text-[#57534a]">Ubicación</span><p className="text-[#e5e3de]">{selected.location}</p></div>
              <div><span className="text-[#57534a]">A cargo</span><p className="text-[#e5e3de]">{selected.leadFirefighterName}</p></div>
              <div><span className="text-[#57534a]">Abierto</span><p className="text-[#e5e3de]">{fmtDate(selected.openedAt as unknown as string)}</p></div>
              {selected.closedAt && <div><span className="text-[#57534a]">Cerrado</span><p className="text-[#e5e3de]">{fmtDate(selected.closedAt as unknown as string)}</p></div>}
            </div>

            <div>
              <span className="text-[#57534a] text-[10px] uppercase tracking-wide">Narrativa</span>
              <p className="text-[#e5e3de] mt-1 whitespace-pre-wrap leading-relaxed">{selected.narrative}</p>
            </div>

            <div>
              <span className="text-[#57534a] text-[10px] uppercase tracking-wide">Hallazgos</span>
              <textarea
                rows={4}
                placeholder="Sin hallazgos registrados todavía."
                value={findingsDraft}
                onChange={(e) => setFindingsDraft(e.target.value)}
                onBlur={() => { if (findingsDraft !== (selected.findings || "")) update(selected.id, { findings: findingsDraft }); }}
                className="w-full mt-1 bg-[#0e0d0c] border border-[var(--dept-window-border,#2a2620)] rounded px-2 py-1.5 text-[#e5e3de] placeholder-[#57534a] resize-none focus:outline-none focus:border-[var(--dept-accent,#d4af37)]"
              />
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center text-[#57534a] gap-2">
            <Search className="w-8 h-8" />
            <p>Seleccioná un caso para ver el detalle.</p>
          </div>
        )}
      </div>
    </div>
  );
}
