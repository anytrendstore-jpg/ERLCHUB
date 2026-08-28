"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, CalendarClock, X } from "lucide-react";
import { useFD } from "@/contexts/FDContext";
import type { FDShift, FDShiftStatus } from "@/lib/fdTypes";

const STATUS_OPTIONS: FDShiftStatus[] = ["Scheduled", "Active", "Completed", "Missed"];
const STATUS_STYLE: Record<FDShiftStatus, string> = {
  Scheduled: "text-[#867e70]", Active: "text-emerald-300", Completed: "text-[var(--dept-accent,#d4af37)]", Missed: "text-red-400",
};

function fmtRange(start: string, end: string) {
  const s = new Date(start), e = new Date(end);
  const day = s.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit" });
  const st = s.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
  const et = e.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
  return `${day} · ${st}–${et}`;
}

/** Turnos — cuadro de horarios. Solo mando programa, cualquiera consulta y marca su propio turno. */
export default function FDShifts() {
  const { state, isCommand } = useFD();
  const [items, setItems] = useState<FDShift[] | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ firefighterId: "", start: "", end: "", station: "" });

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/fd/shifts", { cache: "no-store" });
      const data = await res.json();
      setItems(data.success ? data.shifts : []);
    } catch {
      setItems([]);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const submit = async () => {
    const ff = state.personnel.find((p) => p.id === form.firefighterId);
    if (!ff || !form.start || !form.end) return;
    const res = await fetch("/api/fd/shifts", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ firefighterId: ff.id, firefighterName: `${ff.firstName} ${ff.lastName}`, start: form.start, end: form.end, station: form.station || undefined }),
    });
    const data = await res.json();
    if (data.success) {
      setItems((prev) => (prev ? [...prev, data.shift].sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()) : [data.shift]));
      setForm({ firefighterId: "", start: "", end: "", station: "" });
      setShowNew(false);
    }
  };

  const setStatus = async (id: string, status: FDShiftStatus) => {
    setItems((prev) => prev && prev.map((s) => (s.id === id ? { ...s, status } : s)));
    const res = await fetch("/api/fd/shifts", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status }) });
    const data = await res.json();
    if (data.success) setItems((prev) => prev && prev.map((s) => (s.id === id ? data.shift : s)));
  };

  return (
    <div className="h-full flex flex-col text-[11px]">
      <div className="h-8 flex items-center justify-end px-2.5 border-b border-[var(--dept-window-border,#2a2620)] flex-shrink-0">
        {isCommand && (
          <button onClick={() => setShowNew(true)} className="flex items-center gap-1 text-[10px] font-medium text-[var(--dept-accent,#d4af37)] hover:text-[#e5e3de] transition-colors">
            <Plus className="w-3 h-3" /> Programar turno
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {showNew && (
          <div className="mb-3 bg-[#141312] border border-[var(--dept-window-border,#2a2620)] rounded p-3 space-y-2 max-w-md">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold text-[#e5e3de] uppercase tracking-wide">Nuevo turno</span>
              <button onClick={() => setShowNew(false)}><X className="w-3.5 h-3.5 text-[#57534a]" /></button>
            </div>
            <select value={form.firefighterId} onChange={(e) => setForm({ ...form, firefighterId: e.target.value })} className="w-full bg-[#0e0d0c] border border-[var(--dept-window-border,#2a2620)] rounded px-2 py-1.5 text-[#e5e3de] focus:outline-none focus:border-[var(--dept-accent,#d4af37)]">
              <option value="">Seleccioná bombero</option>
              {state.personnel.map((p) => <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>)}
            </select>
            <div className="flex gap-2">
              <input type="datetime-local" value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} className="flex-1 min-w-0 bg-[#0e0d0c] border border-[var(--dept-window-border,#2a2620)] rounded px-2 py-1.5 text-[#e5e3de] focus:outline-none focus:border-[var(--dept-accent,#d4af37)]" />
              <input type="datetime-local" value={form.end} onChange={(e) => setForm({ ...form, end: e.target.value })} className="flex-1 min-w-0 bg-[#0e0d0c] border border-[var(--dept-window-border,#2a2620)] rounded px-2 py-1.5 text-[#e5e3de] focus:outline-none focus:border-[var(--dept-accent,#d4af37)]" />
            </div>
            <input placeholder="Estación (opcional)" value={form.station} onChange={(e) => setForm({ ...form, station: e.target.value })} className="w-full bg-[#0e0d0c] border border-[var(--dept-window-border,#2a2620)] rounded px-2 py-1.5 text-[#e5e3de] placeholder-[#57534a] focus:outline-none focus:border-[var(--dept-accent,#d4af37)]" />
            <button disabled={!form.firefighterId || !form.start || !form.end} onClick={submit} className="w-full bg-[var(--dept-accent,#d4af37)] disabled:opacity-40 text-[var(--dept-accent-fg,#0a0a0c)] font-semibold rounded py-1.5">
              Programar
            </button>
          </div>
        )}

        {items === null ? (
          <p className="text-[#57534a]">Cargando...</p>
        ) : items.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-[#57534a] gap-2 py-8">
            <CalendarClock className="w-8 h-8" />
            <p>Sin turnos programados todavía.</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {items.map((s) => {
              const canEdit = isCommand || s.firefighterId === state.currentFirefighter?.id;
              return (
                <div key={s.id} className="flex items-center gap-2.5 px-3 py-2 rounded bg-[#141312] border border-[var(--dept-window-border,#2a2620)]">
                  <CalendarClock className="w-4 h-4 text-[var(--dept-accent,#d4af37)] flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[#e5e3de] font-medium truncate">{s.firefighterName}</p>
                    <p className="text-[#867e70] text-[10px] font-mono">{fmtRange(s.start as unknown as string, s.end as unknown as string)}{s.station ? ` · ${s.station}` : ""}</p>
                  </div>
                  {canEdit ? (
                    <select
                      value={s.status}
                      onChange={(e) => setStatus(s.id, e.target.value as FDShiftStatus)}
                      className={`bg-[#0e0d0c] border border-[var(--dept-window-border,#2a2620)] rounded px-1.5 py-1 text-[10px] font-semibold flex-shrink-0 focus:outline-none ${STATUS_STYLE[s.status]}`}
                    >
                      {STATUS_OPTIONS.map((st) => <option key={st} value={st}>{st}</option>)}
                    </select>
                  ) : (
                    <span className={`text-[10px] font-semibold flex-shrink-0 ${STATUS_STYLE[s.status]}`}>{s.status}</span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
