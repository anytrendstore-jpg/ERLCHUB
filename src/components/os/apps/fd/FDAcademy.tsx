"use client";

import { useCallback, useEffect, useState } from "react";
import { GraduationCap, Plus, X, Lock } from "lucide-react";
import { useFD } from "@/contexts/FDContext";
import type { FDCertification } from "@/lib/fdTypes";

const STATUS_STYLE: Record<string, string> = {
  Active: "text-emerald-300",
  Expired: "text-[var(--dept-accent,#c1975a)]",
  Revoked: "text-red-400",
};

function fmtDate(d?: string | Date) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("es-ES");
}

/** Academia — certificaciones del personal de LSFD. Concepto sin análogo en el MDT de policía. */
export default function FDAcademy() {
  const { state, isCommand } = useFD();
  const [certs, setCerts] = useState<FDCertification[] | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ firefighterId: "", name: "", expiresAt: "" });

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/fd/certifications", { cache: "no-store" });
      const data = await res.json();
      setCerts(data.success ? data.certifications : []);
    } catch {
      setCerts([]);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const submit = async () => {
    const person = state.personnel.find((p) => p.id === form.firefighterId);
    if (!person || !form.name.trim()) return;
    const res = await fetch("/api/fd/certifications", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firefighterId: person.id,
        firefighterName: `${person.firstName} ${person.lastName}`,
        name: form.name.trim(),
        expiresAt: form.expiresAt || undefined,
      }),
    });
    const data = await res.json();
    if (data.success) {
      setCerts((prev) => (prev ? [data.certification, ...prev] : [data.certification]));
      setForm({ firefighterId: "", name: "", expiresAt: "" });
      setShowNew(false);
    }
  };

  const revoke = async (id: string) => {
    setCerts((prev) => prev && prev.map((c) => (c.id === id ? { ...c, status: "Revoked" } : c)));
    await fetch("/api/fd/certifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
  };

  return (
    <div className="h-full flex flex-col text-[11px]">
      <div className="h-8 flex items-center justify-between px-2.5 border-b border-[var(--dept-window-border,#2a2620)] flex-shrink-0">
        {!isCommand && (
          <span className="flex items-center gap-1.5 text-[#57534a]">
            <Lock className="w-3 h-3" /> Solo lectura — nivel 4+ para emitir
          </span>
        )}
        <span className="flex-1" />
        {isCommand && (
          <button onClick={() => setShowNew(true)} className="flex items-center gap-1 text-[10px] font-medium text-[var(--dept-accent,#d4af37)] hover:text-[#e5e3de] transition-colors">
            <Plus className="w-3 h-3" /> Emitir certificación
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {showNew && (
          <div className="mb-3 bg-[#141312] border border-[var(--dept-window-border,#2a2620)] rounded p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold text-[#e5e3de] uppercase tracking-wide">Nueva certificación</span>
              <button onClick={() => setShowNew(false)}><X className="w-3.5 h-3.5 text-[#57534a]" /></button>
            </div>
            <select value={form.firefighterId} onChange={(e) => setForm({ ...form, firefighterId: e.target.value })} className="w-full bg-[#0e0d0c] border border-[var(--dept-window-border,#2a2620)] rounded px-2 py-1.5 text-[#e5e3de] focus:outline-none focus:border-[var(--dept-accent,#d4af37)]">
              <option value="">Bombero...</option>
              {state.personnel.map((p) => <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>)}
            </select>
            <input placeholder="Nombre de la certificación (ej. HAZMAT Operations)" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full bg-[#0e0d0c] border border-[var(--dept-window-border,#2a2620)] rounded px-2 py-1.5 text-[#e5e3de] placeholder-[#57534a] focus:outline-none focus:border-[var(--dept-accent,#d4af37)]" />
            <div>
              <label className="text-[9px] text-[#57534a] uppercase tracking-wide block mb-1">Vencimiento (opcional)</label>
              <input type="date" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} className="w-full bg-[#0e0d0c] border border-[var(--dept-window-border,#2a2620)] rounded px-2 py-1.5 text-[#e5e3de] focus:outline-none focus:border-[var(--dept-accent,#d4af37)]" />
            </div>
            <button disabled={!form.firefighterId || !form.name.trim()} onClick={submit} className="w-full bg-[var(--dept-accent,#d4af37)] disabled:opacity-40 text-[var(--dept-accent-fg,#0a0a0c)] font-semibold rounded py-1.5">
              Emitir
            </button>
          </div>
        )}

        {certs === null ? (
          <p className="text-[#57534a]">Cargando...</p>
        ) : certs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-[#57534a] gap-2 py-8">
            <GraduationCap className="w-8 h-8" />
            <p>Sin certificaciones registradas todavía.</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {certs.map((c) => (
              <div key={c.id} className="flex items-center gap-2.5 px-3 py-2 rounded bg-[#141312] border border-[var(--dept-window-border,#2a2620)]">
                <GraduationCap className="w-4 h-4 text-[var(--dept-accent,#d4af37)] flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-[#e5e3de] font-medium truncate">{c.name}</p>
                  <p className="text-[#867e70] text-[10px]">{c.firefighterName} · emitida {fmtDate(c.issuedAt)}{c.expiresAt ? ` · vence ${fmtDate(c.expiresAt)}` : ""}</p>
                </div>
                <span className={`text-[9.5px] font-bold flex-shrink-0 ${STATUS_STYLE[c.status]}`}>{c.status}</span>
                {isCommand && c.status === "Active" && (
                  <button onClick={() => revoke(c.id)} className="text-[#57534a] hover:text-red-400 text-[9.5px] flex-shrink-0 ml-1">Revocar</button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
