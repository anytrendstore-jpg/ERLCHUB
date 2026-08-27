"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, DollarSign, X, TrendingUp, TrendingDown } from "lucide-react";
import { useFD } from "@/contexts/FDContext";
import type { FDBudgetEntry, FDBudgetEntryType } from "@/lib/fdTypes";

function fmtMoney(n: number) {
  return `$${n.toLocaleString("es-ES")}`;
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" });
}

/** Presupuesto — libro de asignaciones/gastos. Solo mando registra movimientos, ver COMMAND_LEVEL en /api/fd/budget. */
export default function FDBudget() {
  const { isCommand } = useFD();
  const [items, setItems] = useState<FDBudgetEntry[] | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ type: "Allocation" as FDBudgetEntryType, amount: "", description: "", category: "" });
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/fd/budget", { cache: "no-store" });
      const data = await res.json();
      if (data.success) setItems(data.entries);
      else { setItems([]); setError(data.error); }
    } catch {
      setItems([]);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const totals = useMemo(() => {
    const allocated = (items || []).filter((e) => e.type === "Allocation").reduce((s, e) => s + e.amount, 0);
    const spent = (items || []).filter((e) => e.type === "Expense").reduce((s, e) => s + e.amount, 0);
    return { allocated, spent, balance: allocated - spent };
  }, [items]);

  const submit = async () => {
    const amount = Number(form.amount);
    if (!form.description.trim() || !Number.isFinite(amount) || amount <= 0) return;
    const res = await fetch("/api/fd/budget", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: form.type, amount, description: form.description, category: form.category || undefined }),
    });
    const data = await res.json();
    if (data.success) {
      setItems((prev) => (prev ? [data.entry, ...prev] : [data.entry]));
      setForm({ type: "Allocation", amount: "", description: "", category: "" });
      setShowNew(false);
    }
  };

  return (
    <div className="h-full flex flex-col text-[11px]">
      <div className="h-8 flex items-center justify-end px-2.5 border-b border-[var(--dept-window-border,#2a2620)] flex-shrink-0">
        {isCommand && (
          <button onClick={() => setShowNew(true)} className="flex items-center gap-1 text-[10px] font-medium text-[var(--dept-accent,#d4af37)] hover:text-[#e5e3de] transition-colors">
            <Plus className="w-3 h-3" /> Registrar movimiento
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="px-3 py-2.5 rounded bg-[#141312] border border-[var(--dept-window-border,#2a2620)]">
            <p className="text-[#57534a] text-[9px] uppercase tracking-wide font-semibold">Asignado</p>
            <p className="text-emerald-300 font-mono text-[16px] mt-0.5">{fmtMoney(totals.allocated)}</p>
          </div>
          <div className="px-3 py-2.5 rounded bg-[#141312] border border-[var(--dept-window-border,#2a2620)]">
            <p className="text-[#57534a] text-[9px] uppercase tracking-wide font-semibold">Gastado</p>
            <p className="text-red-400 font-mono text-[16px] mt-0.5">{fmtMoney(totals.spent)}</p>
          </div>
          <div className="px-3 py-2.5 rounded bg-[#141312] border border-[var(--dept-window-border,#2a2620)]">
            <p className="text-[#57534a] text-[9px] uppercase tracking-wide font-semibold">Balance</p>
            <p className="text-[var(--dept-accent,#d4af37)] font-mono text-[16px] mt-0.5">{fmtMoney(totals.balance)}</p>
          </div>
        </div>

        {showNew && (
          <div className="mb-3 bg-[#141312] border border-[var(--dept-window-border,#2a2620)] rounded p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold text-[#e5e3de] uppercase tracking-wide">Nuevo movimiento</span>
              <button onClick={() => setShowNew(false)}><X className="w-3.5 h-3.5 text-[#57534a]" /></button>
            </div>
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as FDBudgetEntryType })} className="w-full bg-[#0e0d0c] border border-[var(--dept-window-border,#2a2620)] rounded px-2 py-1.5 text-[#e5e3de] focus:outline-none focus:border-[var(--dept-accent,#d4af37)]">
              <option value="Allocation">Asignación</option>
              <option value="Expense">Gasto</option>
            </select>
            <div className="flex gap-2">
              <input placeholder="Monto" type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="w-28 bg-[#0e0d0c] border border-[var(--dept-window-border,#2a2620)] rounded px-2 py-1.5 text-[#e5e3de] placeholder-[#57534a] focus:outline-none focus:border-[var(--dept-accent,#d4af37)]" />
              <input placeholder="Categoría (opcional)" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="flex-1 min-w-0 bg-[#0e0d0c] border border-[var(--dept-window-border,#2a2620)] rounded px-2 py-1.5 text-[#e5e3de] placeholder-[#57534a] focus:outline-none focus:border-[var(--dept-accent,#d4af37)]" />
            </div>
            <input placeholder="Descripción" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full bg-[#0e0d0c] border border-[var(--dept-window-border,#2a2620)] rounded px-2 py-1.5 text-[#e5e3de] placeholder-[#57534a] focus:outline-none focus:border-[var(--dept-accent,#d4af37)]" />
            <button disabled={!form.description.trim() || !Number(form.amount)} onClick={submit} className="w-full bg-[var(--dept-accent,#d4af37)] disabled:opacity-40 text-[var(--dept-accent-fg,#0a0a0c)] font-semibold rounded py-1.5">
              Registrar
            </button>
          </div>
        )}

        {items === null ? (
          <p className="text-[#57534a]">Cargando...</p>
        ) : items.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-[#57534a] gap-2 py-8">
            <DollarSign className="w-8 h-8" />
            <p>{error || "Sin movimientos registrados todavía."}</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {items.map((e) => (
              <div key={e.id} className="flex items-center gap-2.5 px-3 py-2 rounded bg-[#141312] border border-[var(--dept-window-border,#2a2620)]">
                {e.type === "Allocation" ? <TrendingUp className="w-4 h-4 text-emerald-300 flex-shrink-0" /> : <TrendingDown className="w-4 h-4 text-red-400 flex-shrink-0" />}
                <div className="min-w-0 flex-1">
                  <p className="text-[#e5e3de] font-medium truncate">{e.description}</p>
                  <p className="text-[#867e70] text-[10px]">{e.category ? `${e.category} · ` : ""}{fmtDate(e.date as unknown as string)} · {e.recordedByName}</p>
                </div>
                <span className={`font-mono font-semibold flex-shrink-0 ${e.type === "Allocation" ? "text-emerald-300" : "text-red-400"}`}>
                  {e.type === "Allocation" ? "+" : "-"}{fmtMoney(e.amount)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
