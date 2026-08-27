"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Wrench, X } from "lucide-react";
import type { FDServiceOrder, FDServiceOrderPriority, FDServiceOrderStatus } from "@/lib/fdTypes";

const PRIORITY_OPTIONS: FDServiceOrderPriority[] = ["Low", "Medium", "High"];
const STATUS_OPTIONS: FDServiceOrderStatus[] = ["Open", "In Progress", "Completed", "Cancelled"];
const PRIORITY_STYLE: Record<FDServiceOrderPriority, string> = {
  Low: "text-[#867e70]", Medium: "text-[var(--dept-accent,#d4af37)]", High: "text-red-400",
};
const STATUS_STYLE: Record<FDServiceOrderStatus, string> = {
  Open: "text-red-400", "In Progress": "text-[var(--dept-accent,#d4af37)]", Completed: "text-emerald-300", Cancelled: "text-[#867e70]",
};

const EMPTY_FORM = { subject: "", description: "", priority: "Medium" as FDServiceOrderPriority, relatedEquipment: "" };

/** Órdenes de servicio — pedidos de mantenimiento/trabajo, baja fricción como FDReports: cualquier miembro abre y actualiza. */
export default function FDServiceOrders() {
  const [items, setItems] = useState<FDServiceOrder[] | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/fd/service-orders", { cache: "no-store" });
      const data = await res.json();
      setItems(data.success ? data.orders : []);
    } catch {
      setItems([]);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const submit = async () => {
    if (!form.subject.trim() || !form.description.trim()) return;
    const res = await fetch("/api/fd/service-orders", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, relatedEquipment: form.relatedEquipment || undefined }),
    });
    const data = await res.json();
    if (data.success) {
      setItems((prev) => (prev ? [data.order, ...prev] : [data.order]));
      setForm(EMPTY_FORM);
      setShowNew(false);
    }
  };

  const setStatus = async (id: string, status: FDServiceOrderStatus) => {
    setItems((prev) => prev && prev.map((o) => (o.id === id ? { ...o, status } : o)));
    const res = await fetch("/api/fd/service-orders", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status }) });
    const data = await res.json();
    if (data.success) setItems((prev) => prev && prev.map((o) => (o.id === id ? data.order : o)));
  };

  return (
    <div className="h-full flex flex-col text-[11px]">
      <div className="h-8 flex items-center justify-end px-2.5 border-b border-[var(--dept-window-border,#2a2620)] flex-shrink-0">
        <button onClick={() => setShowNew(true)} className="flex items-center gap-1 text-[10px] font-medium text-[var(--dept-accent,#d4af37)] hover:text-[#e5e3de] transition-colors">
          <Plus className="w-3 h-3" /> Nueva orden
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {showNew && (
          <div className="mb-3 bg-[#141312] border border-[var(--dept-window-border,#2a2620)] rounded p-3 space-y-2 max-w-md">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold text-[#e5e3de] uppercase tracking-wide">Nueva orden de servicio</span>
              <button onClick={() => setShowNew(false)}><X className="w-3.5 h-3.5 text-[#57534a]" /></button>
            </div>
            <input placeholder="Asunto" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className="w-full bg-[#0e0d0c] border border-[var(--dept-window-border,#2a2620)] rounded px-2 py-1.5 text-[#e5e3de] placeholder-[#57534a] focus:outline-none focus:border-[var(--dept-accent,#d4af37)]" />
            <textarea placeholder="Descripción" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full bg-[#0e0d0c] border border-[var(--dept-window-border,#2a2620)] rounded px-2 py-1.5 text-[#e5e3de] placeholder-[#57534a] resize-none focus:outline-none focus:border-[var(--dept-accent,#d4af37)]" />
            <div className="flex gap-2">
              <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as FDServiceOrderPriority })} className="flex-1 bg-[#0e0d0c] border border-[var(--dept-window-border,#2a2620)] rounded px-2 py-1.5 text-[#e5e3de] focus:outline-none focus:border-[var(--dept-accent,#d4af37)]">
                {PRIORITY_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
              <input placeholder="Equipo relacionado (opcional)" value={form.relatedEquipment} onChange={(e) => setForm({ ...form, relatedEquipment: e.target.value })} className="flex-1 min-w-0 bg-[#0e0d0c] border border-[var(--dept-window-border,#2a2620)] rounded px-2 py-1.5 text-[#e5e3de] placeholder-[#57534a] focus:outline-none focus:border-[var(--dept-accent,#d4af37)]" />
            </div>
            <button disabled={!form.subject.trim() || !form.description.trim()} onClick={submit} className="w-full bg-[var(--dept-accent,#d4af37)] disabled:opacity-40 text-[var(--dept-accent-fg,#0a0a0c)] font-semibold rounded py-1.5">
              Crear orden
            </button>
          </div>
        )}

        {items === null ? (
          <p className="text-[#57534a]">Cargando...</p>
        ) : items.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-[#57534a] gap-2 py-8">
            <Wrench className="w-8 h-8" />
            <p>Sin órdenes de servicio todavía.</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {items.map((o) => (
              <div key={o.id} className="px-3 py-2 rounded bg-[#141312] border border-[var(--dept-window-border,#2a2620)]">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[#57534a] font-mono text-[9.5px]">{o.orderNumber}</span>
                  <span className={`text-[9px] font-bold ${PRIORITY_STYLE[o.priority]}`}>{o.priority}</span>
                  <select
                    value={o.status}
                    onChange={(e) => setStatus(o.id, e.target.value as FDServiceOrderStatus)}
                    className={`ml-auto bg-[#0e0d0c] border border-[var(--dept-window-border,#2a2620)] rounded px-1.5 py-0.5 text-[9px] font-semibold focus:outline-none ${STATUS_STYLE[o.status]}`}
                  >
                    {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <p className="text-[#e5e3de] font-medium">{o.subject}</p>
                <p className="text-[#867e70] text-[10px] mt-0.5">{o.description}</p>
                <p className="text-[#57534a] text-[10px] mt-1">{o.relatedEquipment ? `${o.relatedEquipment} · ` : ""}Solicitado por {o.requestedByName}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
