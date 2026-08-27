"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Handshake, X } from "lucide-react";
import type { FDMutualAidRequest, FDMutualAidStatus } from "@/lib/fdTypes";

const STATUS_OPTIONS: FDMutualAidStatus[] = ["Requested", "En Route", "On Scene", "Completed", "Cancelled"];
const STATUS_STYLE: Record<FDMutualAidStatus, string> = {
  Requested: "text-red-400", "En Route": "text-[var(--dept-accent,#d4af37)]", "On Scene": "text-[var(--dept-accent,#d4af37)]",
  Completed: "text-emerald-300", Cancelled: "text-[#867e70]",
};

const EMPTY_FORM = { agency: "", reason: "" };

/** Mutual Aid — asistencia solicitada a otra agencia (LSPD, condados vecinos) durante un incidente mayor. Agencia es texto libre. */
export default function FDMutualAid() {
  const [items, setItems] = useState<FDMutualAidRequest[] | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/fd/mutual-aid", { cache: "no-store" });
      const data = await res.json();
      setItems(data.success ? data.requests : []);
    } catch {
      setItems([]);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const submit = async () => {
    if (!form.agency.trim() || !form.reason.trim()) return;
    const res = await fetch("/api/fd/mutual-aid", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const data = await res.json();
    if (data.success) {
      setItems((prev) => (prev ? [data.request, ...prev] : [data.request]));
      setForm(EMPTY_FORM);
      setShowNew(false);
    }
  };

  const setStatus = async (id: string, status: FDMutualAidStatus) => {
    setItems((prev) => prev && prev.map((r) => (r.id === id ? { ...r, status } : r)));
    const res = await fetch("/api/fd/mutual-aid", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status }) });
    const data = await res.json();
    if (data.success) setItems((prev) => prev && prev.map((r) => (r.id === id ? data.request : r)));
  };

  return (
    <div className="h-full flex flex-col text-[11px]">
      <div className="h-8 flex items-center justify-end px-2.5 border-b border-[var(--dept-window-border,#2a2620)] flex-shrink-0">
        <button onClick={() => setShowNew(true)} className="flex items-center gap-1 text-[10px] font-medium text-[var(--dept-accent,#d4af37)] hover:text-[#e5e3de] transition-colors">
          <Plus className="w-3 h-3" /> Solicitar asistencia
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {showNew && (
          <div className="mb-3 bg-[#141312] border border-[var(--dept-window-border,#2a2620)] rounded p-3 space-y-2 max-w-md">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold text-[#e5e3de] uppercase tracking-wide">Nueva solicitud de mutual aid</span>
              <button onClick={() => setShowNew(false)}><X className="w-3.5 h-3.5 text-[#57534a]" /></button>
            </div>
            <input placeholder="Agencia (ej. LSPD, Condado vecino)" value={form.agency} onChange={(e) => setForm({ ...form, agency: e.target.value })} className="w-full bg-[#0e0d0c] border border-[var(--dept-window-border,#2a2620)] rounded px-2 py-1.5 text-[#e5e3de] placeholder-[#57534a] focus:outline-none focus:border-[var(--dept-accent,#d4af37)]" />
            <textarea placeholder="Motivo" rows={3} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} className="w-full bg-[#0e0d0c] border border-[var(--dept-window-border,#2a2620)] rounded px-2 py-1.5 text-[#e5e3de] placeholder-[#57534a] resize-none focus:outline-none focus:border-[var(--dept-accent,#d4af37)]" />
            <button disabled={!form.agency.trim() || !form.reason.trim()} onClick={submit} className="w-full bg-[var(--dept-accent,#d4af37)] disabled:opacity-40 text-[var(--dept-accent-fg,#0a0a0c)] font-semibold rounded py-1.5">
              Solicitar
            </button>
          </div>
        )}

        {items === null ? (
          <p className="text-[#57534a]">Cargando...</p>
        ) : items.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-[#57534a] gap-2 py-8">
            <Handshake className="w-8 h-8" />
            <p>Sin solicitudes de mutual aid todavía.</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {items.map((r) => (
              <div key={r.id} className="px-3 py-2 rounded bg-[#141312] border border-[var(--dept-window-border,#2a2620)]">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[#57534a] font-mono text-[9.5px]">{r.requestNumber}</span>
                  <span className="text-[#e5e3de] font-medium">{r.agency}</span>
                  <select
                    value={r.status}
                    onChange={(e) => setStatus(r.id, e.target.value as FDMutualAidStatus)}
                    className={`ml-auto bg-[#0e0d0c] border border-[var(--dept-window-border,#2a2620)] rounded px-1.5 py-0.5 text-[9px] font-semibold focus:outline-none ${STATUS_STYLE[r.status]}`}
                  >
                    {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <p className="text-[#867e70] text-[10px]">{r.reason}</p>
                <p className="text-[#57534a] text-[10px] mt-1">Solicitado por {r.requestedByName}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
