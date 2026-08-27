"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Wrench, X, Truck, Wind, Zap, HeartPulse, Package } from "lucide-react";
import type { FDEquipment, FDEquipmentCategory, FDEquipmentStatus } from "@/lib/fdTypes";

const CATEGORIES: FDEquipmentCategory[] = ["Apparatus", "SCBA", "Hose", "Medical", "Tool", "PPE", "Other"];
const CATEGORY_ICON: Record<FDEquipmentCategory, typeof Truck> = {
  Apparatus: Truck, SCBA: Wind, Hose: Zap, Medical: HeartPulse, Tool: Wrench, PPE: Package, Other: Package,
};
const STATUS_OPTIONS: FDEquipmentStatus[] = ["In Service", "Out of Service", "Maintenance", "Reserve"];
const STATUS_STYLE: Record<FDEquipmentStatus, string> = {
  "In Service": "text-emerald-300",
  "Out of Service": "text-red-400",
  Maintenance: "text-[var(--dept-accent,#c1975a)]",
  Reserve: "text-[#867e70]",
};

/** Inventario de flota/equipo de LSFD — apparatus, SCBA, mangueras, EPP. Concepto sin análogo en el MDT de policía. */
export default function FDEquipment() {
  const [items, setItems] = useState<FDEquipment[] | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ name: "", category: "Apparatus" as FDEquipmentCategory, assetTag: "", unit: "" });

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/fd/equipment", { cache: "no-store" });
      const data = await res.json();
      setItems(data.success ? data.equipment : []);
    } catch {
      setItems([]);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const submit = async () => {
    if (!form.name.trim()) return;
    const res = await fetch("/api/fd/equipment", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.name, category: form.category, assetTag: form.assetTag || undefined, unit: form.unit || undefined }),
    });
    const data = await res.json();
    if (data.success) {
      setItems((prev) => (prev ? [data.item, ...prev] : [data.item]));
      setForm({ name: "", category: "Apparatus", assetTag: "", unit: "" });
      setShowNew(false);
    }
  };

  const setStatus = async (id: string, status: FDEquipmentStatus) => {
    setItems((prev) => prev && prev.map((e) => (e.id === id ? { ...e, status } : e)));
    await fetch("/api/fd/equipment", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status }) });
  };

  return (
    <div className="h-full flex flex-col text-[11px]">
      <div className="h-8 flex items-center justify-end px-2.5 border-b border-[var(--dept-window-border,#2a2620)] flex-shrink-0">
        <button onClick={() => setShowNew(true)} className="flex items-center gap-1 text-[10px] font-medium text-[var(--dept-accent,#d4af37)] hover:text-[#e5e3de] transition-colors">
          <Plus className="w-3 h-3" /> Agregar equipo
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {showNew && (
          <div className="mb-3 bg-[#141312] border border-[var(--dept-window-border,#2a2620)] rounded p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold text-[#e5e3de] uppercase tracking-wide">Nuevo ítem</span>
              <button onClick={() => setShowNew(false)}><X className="w-3.5 h-3.5 text-[#57534a]" /></button>
            </div>
            <input placeholder="Nombre (ej. Engine 12, SCBA #4)" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full bg-[#0e0d0c] border border-[var(--dept-window-border,#2a2620)] rounded px-2 py-1.5 text-[#e5e3de] placeholder-[#57534a] focus:outline-none focus:border-[var(--dept-accent,#d4af37)]" />
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as FDEquipmentCategory })} className="w-full bg-[#0e0d0c] border border-[var(--dept-window-border,#2a2620)] rounded px-2 py-1.5 text-[#e5e3de] focus:outline-none focus:border-[var(--dept-accent,#d4af37)]">
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <div className="flex gap-2">
              <input placeholder="N° de activo" value={form.assetTag} onChange={(e) => setForm({ ...form, assetTag: e.target.value })} className="flex-1 min-w-0 bg-[#0e0d0c] border border-[var(--dept-window-border,#2a2620)] rounded px-2 py-1.5 text-[#e5e3de] placeholder-[#57534a] focus:outline-none focus:border-[var(--dept-accent,#d4af37)]" />
              <input placeholder="Unidad/Estación" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} className="flex-1 min-w-0 bg-[#0e0d0c] border border-[var(--dept-window-border,#2a2620)] rounded px-2 py-1.5 text-[#e5e3de] placeholder-[#57534a] focus:outline-none focus:border-[var(--dept-accent,#d4af37)]" />
            </div>
            <button disabled={!form.name.trim()} onClick={submit} className="w-full bg-[var(--dept-accent,#d4af37)] disabled:opacity-40 text-[var(--dept-accent-fg,#0a0a0c)] font-semibold rounded py-1.5">
              Agregar
            </button>
          </div>
        )}

        {items === null ? (
          <p className="text-[#57534a]">Cargando...</p>
        ) : items.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-[#57534a] gap-2 py-8">
            <Wrench className="w-8 h-8" />
            <p>Sin equipo registrado todavía.</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {items.map((item) => {
              const Icon = CATEGORY_ICON[item.category];
              return (
                <div key={item.id} className="flex items-center gap-2.5 px-3 py-2 rounded bg-[#141312] border border-[var(--dept-window-border,#2a2620)]">
                  <Icon className="w-4 h-4 text-[var(--dept-accent,#d4af37)] flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[#e5e3de] font-medium truncate">{item.name}</p>
                    <p className="text-[#867e70] text-[10px]">{item.category}{item.assetTag ? ` · #${item.assetTag}` : ""}{item.unit ? ` · ${item.unit}` : ""}</p>
                  </div>
                  <select
                    value={item.status}
                    onChange={(e) => setStatus(item.id, e.target.value as FDEquipmentStatus)}
                    className={`bg-[#0e0d0c] border border-[var(--dept-window-border,#2a2620)] rounded px-1.5 py-1 text-[10px] font-semibold flex-shrink-0 focus:outline-none ${STATUS_STYLE[item.status]}`}
                  >
                    {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
