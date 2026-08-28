"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Building2, X, Truck } from "lucide-react";
import { useFD } from "@/contexts/FDContext";
import type { FDStation } from "@/lib/fdTypes";

/** Estaciones de bomberos — directorio de parques. Solo mando registra/edita, cualquiera consulta. */
export default function FDStations() {
  const { isCommand } = useFD();
  const [items, setItems] = useState<FDStation[] | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ name: "", address: "", apparatus: "" });

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/fd/stations", { cache: "no-store" });
      const data = await res.json();
      setItems(data.success ? data.stations : []);
    } catch {
      setItems([]);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const submit = async () => {
    if (!form.name.trim() || !form.address.trim()) return;
    const apparatus = form.apparatus.split(",").map((a) => a.trim()).filter(Boolean);
    const res = await fetch("/api/fd/stations", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.name, address: form.address, apparatus }),
    });
    const data = await res.json();
    if (data.success) {
      setItems((prev) => (prev ? [...prev, data.station].sort((a, b) => a.name.localeCompare(b.name)) : [data.station]));
      setForm({ name: "", address: "", apparatus: "" });
      setShowNew(false);
    }
  };

  return (
    <div className="h-full flex flex-col text-[11px]">
      <div className="h-8 flex items-center justify-end px-2.5 border-b border-[var(--dept-window-border,#2a2620)] flex-shrink-0">
        {isCommand && (
          <button onClick={() => setShowNew(true)} className="flex items-center gap-1 text-[10px] font-medium text-[var(--dept-accent,#d4af37)] hover:text-[#e5e3de] transition-colors">
            <Plus className="w-3 h-3" /> Registrar estación
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {showNew && (
          <div className="mb-3 bg-[#141312] border border-[var(--dept-window-border,#2a2620)] rounded p-3 space-y-2 max-w-md">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold text-[#e5e3de] uppercase tracking-wide">Nueva estación</span>
              <button onClick={() => setShowNew(false)}><X className="w-3.5 h-3.5 text-[#57534a]" /></button>
            </div>
            <input placeholder="Nombre (ej. Estación 12)" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full bg-[#0e0d0c] border border-[var(--dept-window-border,#2a2620)] rounded px-2 py-1.5 text-[#e5e3de] placeholder-[#57534a] focus:outline-none focus:border-[var(--dept-accent,#d4af37)]" />
            <input placeholder="Dirección" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="w-full bg-[#0e0d0c] border border-[var(--dept-window-border,#2a2620)] rounded px-2 py-1.5 text-[#e5e3de] placeholder-[#57534a] focus:outline-none focus:border-[var(--dept-accent,#d4af37)]" />
            <input placeholder="Aparatos (separados por coma, ej. E12, T3)" value={form.apparatus} onChange={(e) => setForm({ ...form, apparatus: e.target.value })} className="w-full bg-[#0e0d0c] border border-[var(--dept-window-border,#2a2620)] rounded px-2 py-1.5 text-[#e5e3de] placeholder-[#57534a] focus:outline-none focus:border-[var(--dept-accent,#d4af37)]" />
            <button disabled={!form.name.trim() || !form.address.trim()} onClick={submit} className="w-full bg-[var(--dept-accent,#d4af37)] disabled:opacity-40 text-[var(--dept-accent-fg,#0a0a0c)] font-semibold rounded py-1.5">
              Registrar
            </button>
          </div>
        )}

        {items === null ? (
          <p className="text-[#57534a]">Cargando...</p>
        ) : items.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-[#57534a] gap-2 py-8">
            <Building2 className="w-8 h-8" />
            <p>Sin estaciones registradas todavía.</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {items.map((s) => (
              <div key={s.id} className="flex items-center gap-2.5 px-3 py-2 rounded bg-[#141312] border border-[var(--dept-window-border,#2a2620)]">
                <Building2 className="w-4 h-4 text-[var(--dept-accent,#d4af37)] flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-[#e5e3de] font-medium truncate">{s.name}</p>
                  <p className="text-[#867e70] text-[10px] truncate">{s.address}</p>
                  {s.apparatus.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {s.apparatus.map((a) => (
                        <span key={a} className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#1a1917] border border-[var(--dept-window-border,#2a2620)] text-[#867e70] text-[9.5px] font-mono"><Truck className="w-2.5 h-2.5" />{a}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
