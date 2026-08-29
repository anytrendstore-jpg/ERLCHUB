"use client";

import { useCallback, useEffect, useState } from "react";
import { Banknote, Loader2, Save, Plus, Trash2, Send, ChevronDown, ChevronRight } from "lucide-react";
import { PanelHeader, Card, Kpi, LoadingBlock, ErrorBlock, AccessDenied, TextInput, PrimaryButton, useStaffPermissions, useToast } from "@/components/staff/ui";

interface TreasuryLedgerEntry {
  id: string; amount: number; type: string; description: string;
  departmentCode?: string; actorName?: string; timestamp: string;
}
interface DistributionRate { departmentCode: string; percentage: number; label: string }
interface DepartmentBalance { departmentCode: string; balance: number }
interface DepartmentEntry { id: string; type: "Allocation" | "Expense"; amount: number; description: string; category?: string; recordedByName: string; date: string }

const TABS = ["saldo", "tesoro", "presupuestos"] as const;
type Tab = (typeof TABS)[number];
const TAB_LABELS: Record<Tab, string> = { saldo: "Saldo inicial", tesoro: "Tesoro", presupuestos: "Presupuestos departamentales" };

function money(n: number) {
  return `$${n.toLocaleString("es-ES")}`;
}

export default function EconomyControlCenterPanel(_props: { isDirector?: boolean }) {
  const toast = useToast();
  const { has, loaded } = useStaffPermissions();
  const canView = has("economy.view");
  const canManage = has("economy.manage");
  const [tab, setTab] = useState<Tab>("saldo");

  if (!loaded) return <LoadingBlock />;
  if (!canView) return <AccessDenied title="Tesoro y Presupuestos" />;

  return (
    <div>
      <PanelHeader title="Tesoro y Presupuestos" subtitle="Economy Core — Fase A: saldo inicial, Tesoro de Gobierno, presupuestos departamentales" />
      <div className="flex items-center gap-2 mb-6 border-b border-[#1F2937]">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${tab === t ? "border-blue-500 text-white" : "border-transparent text-slate-400 hover:text-white"}`}
          >
            {TAB_LABELS[t]}
          </button>
        ))}
      </div>
      {tab === "saldo" && <StartingBalanceSection canManage={canManage} />}
      {tab === "tesoro" && <TreasurySection canManage={canManage} />}
      {tab === "presupuestos" && <DepartmentsSection canManage={canManage} />}
    </div>
  );
}

/* ------------------------------------------------------------------ * Saldo inicial * ------------------------------------------------------------------ */

function StartingBalanceSection({ canManage }: { canManage: boolean }) {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cash, setCash] = useState(250);
  const [bank, setBank] = useState(2500);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/staff/economy/config", { cache: "no-store" });
      const json = await res.json();
      if (json.success) { setCash(json.config.startingCash); setBank(json.config.startingBank); }
      else setError(json.error);
    } catch {
      setError("No se pudo conectar con el servidor");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <LoadingBlock />;
  if (error) return <ErrorBlock text={error} onRetry={load} />;

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/staff/economy/config", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startingCash: cash, startingBank: bank }),
      });
      const json = await res.json();
      if (json.success) toast.success("Saldo inicial actualizado");
      else toast.error(json.error || "No se pudo guardar");
    } catch {
      toast.error("No se pudo conectar con el servidor");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="p-5 max-w-md">
      <p className="text-xs text-slate-500 mb-4">
        Se otorga una sola vez, en el primer alta real de una cuenta de Discord (nunca a personajes secundarios comprados con slots, para que comprar slots no sea una forma de conseguir plata gratis).
      </p>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="text-xs text-slate-400 block mb-1.5">Efectivo inicial</label>
          <TextInput type="number" min={0} value={cash} onChange={(e) => setCash(Number(e.target.value))} className="w-full" />
        </div>
        <div>
          <label className="text-xs text-slate-400 block mb-1.5">Banco inicial</label>
          <TextInput type="number" min={0} value={bank} onChange={(e) => setBank(Number(e.target.value))} className="w-full" />
        </div>
      </div>
      {canManage && (
        <PrimaryButton onClick={save} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Guardar
        </PrimaryButton>
      )}
    </Card>
  );
}

/* ------------------------------------------------------------------ * Tesoro * ------------------------------------------------------------------ */

function TreasurySection({ canManage }: { canManage: boolean }) {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [balance, setBalance] = useState(0);
  const [ledger, setLedger] = useState<TreasuryLedgerEntry[]>([]);
  const [rates, setRates] = useState<DistributionRate[]>([]);
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustDesc, setAdjustDesc] = useState("");
  const [adjusting, setAdjusting] = useState(false);
  const [distributeAmount, setDistributeAmount] = useState("");
  const [distributing, setDistributing] = useState(false);
  const [rateForm, setRateForm] = useState({ departmentCode: "", label: "", percentage: "" });
  const [savingRate, setSavingRate] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [tRes, rRes] = await Promise.all([
        fetch("/api/staff/economy/treasury", { cache: "no-store" }),
        fetch("/api/staff/economy/treasury/distribution-rates", { cache: "no-store" }),
      ]);
      const tJson = await tRes.json();
      const rJson = await rRes.json();
      if (tJson.success) { setBalance(tJson.balance); setLedger(tJson.ledger); } else setError(tJson.error);
      if (rJson.success) setRates(rJson.rates);
    } catch {
      setError("No se pudo conectar con el servidor");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <LoadingBlock />;
  if (error) return <ErrorBlock text={error} onRetry={load} />;

  const submitAdjust = async () => {
    const delta = Number(adjustAmount);
    if (!delta || !adjustDesc.trim()) { toast.error("Completá monto y descripción"); return; }
    setAdjusting(true);
    try {
      const res = await fetch("/api/staff/economy/treasury", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ delta, description: adjustDesc.trim() }),
      });
      const json = await res.json();
      if (json.success) { toast.success("Tesoro ajustado"); setAdjustAmount(""); setAdjustDesc(""); await load(); }
      else toast.error(json.error || "No se pudo ajustar");
    } catch {
      toast.error("No se pudo conectar con el servidor");
    } finally {
      setAdjusting(false);
    }
  };

  const submitDistribute = async () => {
    setDistributing(true);
    try {
      const res = await fetch("/api/staff/economy/treasury/distribute", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: distributeAmount ? Number(distributeAmount) : undefined }),
      });
      const json = await res.json();
      if (json.success) { toast.success(`Distribuidos ${money(json.totalDistributed)} entre ${json.perDepartment.length} departamento(s)`); setDistributeAmount(""); await load(); }
      else toast.error(json.error || "No se pudo distribuir");
    } catch {
      toast.error("No se pudo conectar con el servidor");
    } finally {
      setDistributing(false);
    }
  };

  const saveRate = async () => {
    const pct = Number(rateForm.percentage);
    if (!rateForm.departmentCode.trim() || !rateForm.label.trim() || !Number.isFinite(pct)) { toast.error("Completá todos los campos"); return; }
    setSavingRate(true);
    try {
      const res = await fetch("/api/staff/economy/treasury/distribution-rates", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ departmentCode: rateForm.departmentCode, label: rateForm.label, percentage: pct }),
      });
      const json = await res.json();
      if (json.success) { toast.success("Tasa guardada"); setRateForm({ departmentCode: "", label: "", percentage: "" }); await load(); }
      else toast.error(json.error || "No se pudo guardar");
    } catch {
      toast.error("No se pudo conectar con el servidor");
    } finally {
      setSavingRate(false);
    }
  };

  const removeRate = async (departmentCode: string) => {
    try {
      const res = await fetch("/api/staff/economy/treasury/distribution-rates", {
        method: "DELETE", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ departmentCode }),
      });
      const json = await res.json();
      if (json.success) { toast.success("Tasa eliminada"); await load(); }
      else toast.error(json.error || "No se pudo eliminar");
    } catch {
      toast.error("No se pudo conectar con el servidor");
    }
  };

  const sumPct = rates.reduce((s, r) => s + r.percentage, 0);

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 gap-4">
        <Kpi label="Balance del Tesoro" value={money(balance)} icon={Banknote} tone="text-emerald-400" ring="bg-emerald-500/10" />
        <Kpi label="Movimientos registrados" value={ledger.length} icon={Banknote} tone="text-blue-400" ring="bg-blue-500/10" />
      </div>

      {canManage && (
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-white mb-3">Ajuste manual</h3>
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="text-xs text-slate-400 block mb-1.5">Monto (+/-)</label>
              <TextInput type="number" value={adjustAmount} onChange={(e) => setAdjustAmount(e.target.value)} className="w-40" />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="text-xs text-slate-400 block mb-1.5">Descripción</label>
              <TextInput value={adjustDesc} onChange={(e) => setAdjustDesc(e.target.value)} className="w-full" />
            </div>
            <PrimaryButton onClick={submitAdjust} disabled={adjusting}>
              {adjusting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Ajustar
            </PrimaryButton>
          </div>
        </Card>
      )}

      <Card className="p-5">
        <h3 className="text-sm font-semibold text-white mb-3">Tasas de distribución fiscal {sumPct !== 100 && <span className="text-amber-400 font-normal text-xs">(suma {sumPct}% — se normaliza si excede 100%)</span>}</h3>
        <div className="space-y-2 mb-4">
          {rates.map((r) => (
            <div key={r.departmentCode} className="flex items-center gap-3 text-sm">
              <span className="font-mono text-slate-400 w-24 flex-shrink-0">{r.departmentCode}</span>
              <span className="text-white flex-1">{r.label}</span>
              <span className="text-slate-300 font-mono w-14 text-right">{r.percentage}%</span>
              {canManage && (
                <button onClick={() => removeRate(r.departmentCode)} className="text-slate-600 hover:text-rose-400 transition"><Trash2 className="h-3.5 w-3.5" /></button>
              )}
            </div>
          ))}
          {rates.length === 0 && <p className="text-slate-500 text-sm">Sin tasas configuradas.</p>}
        </div>
        {canManage && (
          <div className="flex flex-wrap gap-2 items-end pt-3 border-t border-[#1F2937]">
            <TextInput placeholder="Código (ej. LSPD)" value={rateForm.departmentCode} onChange={(e) => setRateForm((f) => ({ ...f, departmentCode: e.target.value }))} className="w-32" />
            <TextInput placeholder="Nombre" value={rateForm.label} onChange={(e) => setRateForm((f) => ({ ...f, label: e.target.value }))} className="flex-1 min-w-[160px]" />
            <TextInput type="number" placeholder="%" value={rateForm.percentage} onChange={(e) => setRateForm((f) => ({ ...f, percentage: e.target.value }))} className="w-20" />
            <PrimaryButton onClick={saveRate} disabled={savingRate}>
              {savingRate ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            </PrimaryButton>
          </div>
        )}
      </Card>

      {canManage && (
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-white mb-3">Distribuir ahora</h3>
          <p className="text-xs text-slate-500 mb-3">
            Ya corre solo cada semana (lunes, 30 min después de la nómina) — usá este botón solo para forzar una distribución fuera de ciclo o con un monto puntual distinto al balance completo.
          </p>
          <div className="flex items-end gap-3">
            <div>
              <label className="text-xs text-slate-400 block mb-1.5">Monto (opcional)</label>
              <TextInput type="number" placeholder={money(balance)} value={distributeAmount} onChange={(e) => setDistributeAmount(e.target.value)} className="w-40" />
            </div>
            <PrimaryButton onClick={submitDistribute} disabled={distributing || rates.length === 0}>
              {distributing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Distribuir ahora
            </PrimaryButton>
          </div>
        </Card>
      )}

      <Card className="p-5">
        <h3 className="text-sm font-semibold text-white mb-3">Movimientos recientes</h3>
        {ledger.length === 0 ? (
          <p className="text-slate-500 text-sm">Sin movimientos todavía.</p>
        ) : (
          <div className="space-y-1.5 max-h-96 overflow-y-auto">
            {ledger.map((e) => (
              <div key={e.id} className="flex items-center gap-3 text-xs py-1.5 border-b border-[#1F2937]/60 last:border-0">
                <span className="text-slate-500 font-mono w-32 flex-shrink-0">{new Date(e.timestamp).toLocaleString("es-ES")}</span>
                <span className="text-slate-400 w-32 flex-shrink-0">{e.type}</span>
                <span className="text-white flex-1 truncate">{e.description}</span>
                <span className={`font-mono flex-shrink-0 ${e.amount >= 0 ? "text-emerald-400" : "text-rose-400"}`}>{e.amount >= 0 ? "+" : ""}{money(e.amount)}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

/* ------------------------------------------------------------------ * Presupuestos departamentales * ------------------------------------------------------------------ */

function DepartmentsSection({ canManage }: { canManage: boolean }) {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [balances, setBalances] = useState<DepartmentBalance[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [entries, setEntries] = useState<DepartmentEntry[]>([]);
  const [entriesLoading, setEntriesLoading] = useState(false);
  const [form, setForm] = useState({ type: "Allocation" as "Allocation" | "Expense", amount: "", description: "", category: "" });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/staff/economy/departments", { cache: "no-store" });
      const json = await res.json();
      if (json.success) setBalances(json.balances);
      else setError(json.error);
    } catch {
      setError("No se pudo conectar con el servidor");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const loadEntries = async (departmentCode: string) => {
    setEntriesLoading(true);
    try {
      const res = await fetch(`/api/staff/economy/departments?departmentCode=${departmentCode}`, { cache: "no-store" });
      const json = await res.json();
      if (json.success) setEntries(json.entries);
    } finally {
      setEntriesLoading(false);
    }
  };

  const toggle = async (departmentCode: string) => {
    if (expanded === departmentCode) { setExpanded(null); return; }
    setExpanded(departmentCode);
    await loadEntries(departmentCode);
  };

  const submit = async (departmentCode: string) => {
    const amt = Number(form.amount);
    if (!amt || !form.description.trim()) { toast.error("Completá monto y descripción"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/staff/economy/departments", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ departmentCode, type: form.type, amount: amt, description: form.description.trim(), category: form.category.trim() || undefined }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Movimiento registrado");
        setForm({ type: "Allocation", amount: "", description: "", category: "" });
        await Promise.all([load(), loadEntries(departmentCode)]);
      } else toast.error(json.error || "No se pudo registrar");
    } catch {
      toast.error("No se pudo conectar con el servidor");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingBlock />;
  if (error) return <ErrorBlock text={error} onRetry={load} />;

  return (
    <Card className="p-5">
      {balances.length === 0 ? (
        <p className="text-slate-500 text-sm">Sin presupuestos departamentales todavía — se crean solos al recibir una distribución del Tesoro, o registrá uno manual abajo.</p>
      ) : (
        <div className="space-y-1">
          {balances.map((b) => (
            <div key={b.departmentCode}>
              <button onClick={() => toggle(b.departmentCode)} className="w-full flex items-center gap-2 py-2.5 border-b border-[#1F2937]/60 text-left">
                {expanded === b.departmentCode ? <ChevronDown className="h-3.5 w-3.5 text-slate-500" /> : <ChevronRight className="h-3.5 w-3.5 text-slate-500" />}
                <span className="font-mono text-sm text-white flex-1">{b.departmentCode}</span>
                <span className={`font-mono text-sm ${b.balance >= 0 ? "text-emerald-400" : "text-rose-400"}`}>{money(b.balance)}</span>
              </button>
              {expanded === b.departmentCode && (
                <div className="py-3 pl-6 space-y-3">
                  {entriesLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin text-slate-500" />
                  ) : entries.length === 0 ? (
                    <p className="text-slate-500 text-xs">Sin movimientos todavía.</p>
                  ) : (
                    <div className="space-y-1 max-h-48 overflow-y-auto">
                      {entries.map((e) => (
                        <div key={e.id} className="flex items-center gap-3 text-xs">
                          <span className="text-slate-500 font-mono w-24 flex-shrink-0">{new Date(e.date).toLocaleDateString("es-ES")}</span>
                          <span className="text-white flex-1 truncate">{e.description}</span>
                          <span className={`font-mono flex-shrink-0 ${e.type === "Allocation" ? "text-emerald-400" : "text-rose-400"}`}>{e.type === "Allocation" ? "+" : "-"}{money(e.amount)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {canManage && (
                    <div className="flex flex-wrap gap-2 items-end pt-2 border-t border-[#1F2937]">
                      <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as "Allocation" | "Expense" }))} className="h-10 px-3 bg-[#0B0F17] border border-[#1F2937] rounded-lg text-sm text-white">
                        <option value="Allocation">Asignación</option>
                        <option value="Expense">Gasto</option>
                      </select>
                      <TextInput type="number" placeholder="Monto" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} className="w-28" />
                      <TextInput placeholder="Descripción" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="flex-1 min-w-[160px]" />
                      <PrimaryButton onClick={() => submit(b.departmentCode)} disabled={saving}>
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                      </PrimaryButton>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
