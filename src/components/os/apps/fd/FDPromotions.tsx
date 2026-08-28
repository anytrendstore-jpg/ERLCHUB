"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Award, X, ArrowRight } from "lucide-react";
import { useFD } from "@/contexts/FDContext";
import type { FDPromotion } from "@/lib/fdTypes";

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" });
}

/** Historial de ascensos — público dentro del departamento, solo mando registra uno (ya decidido fuera del sistema). */
export default function FDPromotions() {
  const { state, isCommand } = useFD();
  const [items, setItems] = useState<FDPromotion[] | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ firefighterId: "", fromRank: "", toRank: "", reason: "" });

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/fd/promotions", { cache: "no-store" });
      const data = await res.json();
      setItems(data.success ? data.promotions : []);
    } catch {
      setItems([]);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const submit = async () => {
    const ff = state.personnel.find((p) => p.id === form.firefighterId);
    if (!ff || !form.fromRank.trim() || !form.toRank.trim()) return;
    const res = await fetch("/api/fd/promotions", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ firefighterId: ff.id, firefighterName: `${ff.firstName} ${ff.lastName}`, fromRank: form.fromRank, toRank: form.toRank, reason: form.reason }),
    });
    const data = await res.json();
    if (data.success) {
      setItems((prev) => (prev ? [data.promotion, ...prev] : [data.promotion]));
      setForm({ firefighterId: "", fromRank: "", toRank: "", reason: "" });
      setShowNew(false);
    }
  };

  return (
    <div className="h-full flex flex-col text-[11px]">
      <div className="h-8 flex items-center justify-end px-2.5 border-b border-[var(--dept-window-border,#2a2620)] flex-shrink-0">
        {isCommand && (
          <button onClick={() => setShowNew(true)} className="flex items-center gap-1 text-[10px] font-medium text-[var(--dept-accent,#d4af37)] hover:text-[#e5e3de] transition-colors">
            <Plus className="w-3 h-3" /> Registrar ascenso
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {showNew && (
          <div className="mb-3 bg-[#141312] border border-[var(--dept-window-border,#2a2620)] rounded p-3 space-y-2 max-w-md">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold text-[#e5e3de] uppercase tracking-wide">Nuevo ascenso</span>
              <button onClick={() => setShowNew(false)}><X className="w-3.5 h-3.5 text-[#57534a]" /></button>
            </div>
            <select value={form.firefighterId} onChange={(e) => setForm({ ...form, firefighterId: e.target.value })} className="w-full bg-[#0e0d0c] border border-[var(--dept-window-border,#2a2620)] rounded px-2 py-1.5 text-[#e5e3de] focus:outline-none focus:border-[var(--dept-accent,#d4af37)]">
              <option value="">Seleccioná bombero</option>
              {state.personnel.map((p) => <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>)}
            </select>
            <div className="flex gap-2 items-center">
              <input placeholder="Rango anterior" value={form.fromRank} onChange={(e) => setForm({ ...form, fromRank: e.target.value })} className="flex-1 min-w-0 bg-[#0e0d0c] border border-[var(--dept-window-border,#2a2620)] rounded px-2 py-1.5 text-[#e5e3de] placeholder-[#57534a] focus:outline-none focus:border-[var(--dept-accent,#d4af37)]" />
              <ArrowRight className="w-3.5 h-3.5 text-[#57534a] flex-shrink-0" />
              <input placeholder="Rango nuevo" value={form.toRank} onChange={(e) => setForm({ ...form, toRank: e.target.value })} className="flex-1 min-w-0 bg-[#0e0d0c] border border-[var(--dept-window-border,#2a2620)] rounded px-2 py-1.5 text-[#e5e3de] placeholder-[#57534a] focus:outline-none focus:border-[var(--dept-accent,#d4af37)]" />
            </div>
            <textarea placeholder="Motivo (opcional)" rows={2} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} className="w-full bg-[#0e0d0c] border border-[var(--dept-window-border,#2a2620)] rounded px-2 py-1.5 text-[#e5e3de] placeholder-[#57534a] resize-none focus:outline-none focus:border-[var(--dept-accent,#d4af37)]" />
            <button disabled={!form.firefighterId || !form.fromRank.trim() || !form.toRank.trim()} onClick={submit} className="w-full bg-[var(--dept-accent,#d4af37)] disabled:opacity-40 text-[var(--dept-accent-fg,#0a0a0c)] font-semibold rounded py-1.5">
              Registrar
            </button>
          </div>
        )}

        {items === null ? (
          <p className="text-[#57534a]">Cargando...</p>
        ) : items.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-[#57534a] gap-2 py-8">
            <Award className="w-8 h-8" />
            <p>Sin ascensos registrados todavía.</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {items.map((p) => (
              <div key={p.id} className="flex items-center gap-2.5 px-3 py-2 rounded bg-[#141312] border border-[var(--dept-window-border,#2a2620)]">
                <Award className="w-4 h-4 text-[var(--dept-accent,#d4af37)] flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-[#e5e3de] font-medium truncate">{p.firefighterName}</p>
                  <p className="text-[#867e70] text-[10px] flex items-center gap-1">{p.fromRank} <ArrowRight className="w-2.5 h-2.5" /> {p.toRank}</p>
                  {p.reason && <p className="text-[#57534a] text-[10px] mt-0.5">{p.reason}</p>}
                </div>
                <span className="text-[#57534a] text-[10px] flex-shrink-0">{fmtDate(p.createdAt as unknown as string)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
