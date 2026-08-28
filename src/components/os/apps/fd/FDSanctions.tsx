"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, ShieldAlert, X } from "lucide-react";
import { useFD } from "@/contexts/FDContext";
import type { FDSanction, FDSanctionSeverity } from "@/lib/fdTypes";

const SEVERITY_OPTIONS: FDSanctionSeverity[] = ["Verbal", "Escrita", "Suspensión", "Baja"];
const SEVERITY_STYLE: Record<FDSanctionSeverity, string> = {
  Verbal: "text-[#867e70]", Escrita: "text-amber-300", "Suspensión": "text-orange-400", Baja: "text-red-400",
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" });
}

/** Expediente disciplinario — sensible: solo se llega acá si isCommand (gateado también en el sidebar, minLevel 4). El API vuelve a chequear el nivel igual. */
export default function FDSanctions() {
  const { state } = useFD();
  const [items, setItems] = useState<FDSanction[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ firefighterId: "", severity: "Verbal" as FDSanctionSeverity, reason: "" });

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/fd/sanctions", { cache: "no-store" });
      const data = await res.json();
      if (data.success) setItems(data.sanctions);
      else { setItems([]); setError(data.error); }
    } catch {
      setItems([]);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const submit = async () => {
    const ff = state.personnel.find((p) => p.id === form.firefighterId);
    if (!ff || !form.reason.trim()) return;
    const res = await fetch("/api/fd/sanctions", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ firefighterId: ff.id, firefighterName: `${ff.firstName} ${ff.lastName}`, severity: form.severity, reason: form.reason }),
    });
    const data = await res.json();
    if (data.success) {
      setItems((prev) => (prev ? [data.sanction, ...prev] : [data.sanction]));
      setForm({ firefighterId: "", severity: "Verbal", reason: "" });
      setShowNew(false);
    }
  };

  return (
    <div className="h-full flex flex-col text-[11px]">
      <div className="h-8 flex items-center justify-end px-2.5 border-b border-[var(--dept-window-border,#2a2620)] flex-shrink-0">
        <button onClick={() => setShowNew(true)} className="flex items-center gap-1 text-[10px] font-medium text-[var(--dept-accent,#d4af37)] hover:text-[#e5e3de] transition-colors">
          <Plus className="w-3 h-3" /> Emitir sanción
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {showNew && (
          <div className="mb-3 bg-[#141312] border border-[var(--dept-window-border,#2a2620)] rounded p-3 space-y-2 max-w-md">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold text-[#e5e3de] uppercase tracking-wide">Nueva sanción</span>
              <button onClick={() => setShowNew(false)}><X className="w-3.5 h-3.5 text-[#57534a]" /></button>
            </div>
            <select value={form.firefighterId} onChange={(e) => setForm({ ...form, firefighterId: e.target.value })} className="w-full bg-[#0e0d0c] border border-[var(--dept-window-border,#2a2620)] rounded px-2 py-1.5 text-[#e5e3de] focus:outline-none focus:border-[var(--dept-accent,#d4af37)]">
              <option value="">Seleccioná bombero</option>
              {state.personnel.map((p) => <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>)}
            </select>
            <select value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value as FDSanctionSeverity })} className="w-full bg-[#0e0d0c] border border-[var(--dept-window-border,#2a2620)] rounded px-2 py-1.5 text-[#e5e3de] focus:outline-none focus:border-[var(--dept-accent,#d4af37)]">
              {SEVERITY_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <textarea placeholder="Motivo" rows={3} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} className="w-full bg-[#0e0d0c] border border-[var(--dept-window-border,#2a2620)] rounded px-2 py-1.5 text-[#e5e3de] placeholder-[#57534a] resize-none focus:outline-none focus:border-[var(--dept-accent,#d4af37)]" />
            <button disabled={!form.firefighterId || !form.reason.trim()} onClick={submit} className="w-full bg-[var(--dept-accent,#d4af37)] disabled:opacity-40 text-[var(--dept-accent-fg,#0a0a0c)] font-semibold rounded py-1.5">
              Emitir
            </button>
          </div>
        )}

        {items === null ? (
          <p className="text-[#57534a]">Cargando...</p>
        ) : error ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-[#57534a] gap-2 py-8">
            <ShieldAlert className="w-8 h-8" />
            <p>{error}</p>
          </div>
        ) : items.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-[#57534a] gap-2 py-8">
            <ShieldAlert className="w-8 h-8" />
            <p>Sin sanciones registradas.</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {items.map((s) => (
              <div key={s.id} className="px-3 py-2 rounded bg-[#141312] border border-[var(--dept-window-border,#2a2620)]">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[#e5e3de] font-medium">{s.firefighterName}</span>
                  <span className={`text-[9px] font-bold ${SEVERITY_STYLE[s.severity]}`}>{s.severity}</span>
                  <span className="ml-auto text-[#57534a] text-[10px]">{fmtDate(s.createdAt as unknown as string)}</span>
                </div>
                <p className="text-[#867e70]">{s.reason}</p>
                <p className="text-[#57534a] text-[10px] mt-1">Emitida por {s.issuedByName}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
