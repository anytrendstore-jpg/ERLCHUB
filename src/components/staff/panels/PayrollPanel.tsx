"use client";

import { useCallback, useEffect, useState } from "react";
import { Handshake, Loader2, Send, ChevronDown, ChevronRight, Users, Percent } from "lucide-react";
import { PanelHeader, Card, Kpi, LoadingBlock, ErrorBlock, AccessDenied, PrimaryButton, useStaffPermissions, useToast } from "@/components/staff/ui";

interface PayrollRun {
  id: string; periodKey: string; trigger: "cron" | "manual";
  actorName?: string; startedAt: string; finishedAt?: string;
  status: "running" | "completed" | "failed"; error?: string;
  totals: { factionGross: number; careerGross: number; taxWithheld: number; paid: number; skipped: number; failed: number };
}

interface PayrollEntry {
  id: string; system: "faction" | "career"; recipientName: string;
  sourceLabel: string; grossAmount: number; taxWithheld: number; netAmount: number;
  status: "paid" | "skipped" | "failed"; reason?: string;
}

function money(n: number) {
  return `$${n.toLocaleString("es-ES")}`;
}

const STATUS_LABEL: Record<PayrollRun["status"], string> = { running: "En curso", completed: "Completada", failed: "Fallida" };
const STATUS_TONE: Record<PayrollRun["status"], string> = { running: "text-amber-400", completed: "text-emerald-400", failed: "text-rose-400" };

export default function PayrollPanel(_props: { isDirector?: boolean }) {
  const toast = useToast();
  const { has, loaded } = useStaffPermissions();
  const canView = has("economy.view");
  const canManage = has("economy.manage");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [runs, setRuns] = useState<PayrollRun[]>([]);
  const [running, setRunning] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [entries, setEntries] = useState<PayrollEntry[]>([]);
  const [entriesLoading, setEntriesLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/staff/payroll/runs", { cache: "no-store" });
      const json = await res.json();
      if (json.success) setRuns(json.runs);
      else setError(json.error);
    } catch {
      setError("No se pudo conectar con el servidor");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (!loaded) return <LoadingBlock />;
  if (!canView) return <AccessDenied title="Nómina" />;
  if (loading) return <LoadingBlock />;
  if (error) return <ErrorBlock text={error} onRetry={load} />;

  const loadEntries = async (runId: string) => {
    setEntriesLoading(true);
    try {
      const res = await fetch(`/api/staff/payroll/runs/${runId}/entries`, { cache: "no-store" });
      const json = await res.json();
      if (json.success) setEntries(json.entries);
    } finally {
      setEntriesLoading(false);
    }
  };

  const toggle = async (runId: string) => {
    if (expanded === runId) { setExpanded(null); return; }
    setExpanded(runId);
    await loadEntries(runId);
  };

  const runNow = async () => {
    setRunning(true);
    try {
      const res = await fetch("/api/staff/payroll/run", { method: "POST" });
      const json = await res.json();
      if (json.success) {
        toast.success(`Nómina ejecutada — ${json.run.totals.paid} pagados, ${json.run.totals.skipped} saltados`);
        await load();
      } else toast.error(json.error || "No se pudo ejecutar la nómina");
    } catch {
      toast.error("No se pudo conectar con el servidor");
    } finally {
      setRunning(false);
    }
  };

  const last = runs[0];

  return (
    <div>
      <PanelHeader title="Nómina" subtitle="Economy Core — Fase B: sueldos automáticos de facciones de gobierno y trabajos civiles de HubCareer" />

      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <Kpi label="Última corrida" value={last ? STATUS_LABEL[last.status] : "—"} icon={Handshake} tone={last ? STATUS_TONE[last.status] : "text-slate-400"} ring="bg-slate-500/10" />
        <Kpi label="Pagados / saltados" value={last ? `${last.totals.paid} / ${last.totals.skipped}` : "—"} icon={Users} tone="text-blue-400" ring="bg-blue-500/10" />
        <Kpi label="Impuesto retenido" value={last ? money(last.totals.taxWithheld) : "—"} icon={Percent} tone="text-emerald-400" ring="bg-emerald-500/10" />
      </div>

      {canManage && (
        <Card className="p-5 mb-6">
          <h3 className="text-sm font-semibold text-white mb-1">Ejecutar nómina ahora</h3>
          <p className="text-xs text-slate-500 mb-3">
            Paga a todo miembro activo de una facción de gobierno con salario configurado por rango, y a todo empleado de HubCareer con vacante vigente.
            Retiene el impuesto de &quot;trabajos&quot; hacia el Tesoro. El ciclo automático corre los lunes vía Vercel Cron — esto fuerza una corrida extra sin esperar.
          </p>
          <PrimaryButton onClick={runNow} disabled={running}>
            {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Ejecutar nómina ahora
          </PrimaryButton>
        </Card>
      )}

      <Card className="p-5">
        <h3 className="text-sm font-semibold text-white mb-3">Historial de corridas</h3>
        {runs.length === 0 ? (
          <p className="text-slate-500 text-sm">Sin corridas todavía.</p>
        ) : (
          <div className="space-y-1">
            {runs.map((r) => (
              <div key={r.id}>
                <button onClick={() => toggle(r.id)} className="w-full flex items-center gap-3 py-2.5 border-b border-[#1F2937]/60 text-left">
                  {expanded === r.id ? <ChevronDown className="h-3.5 w-3.5 text-slate-500 flex-shrink-0" /> : <ChevronRight className="h-3.5 w-3.5 text-slate-500 flex-shrink-0" />}
                  <span className="text-slate-500 font-mono text-xs w-32 flex-shrink-0">{r.periodKey}</span>
                  <span className="text-slate-400 text-xs w-20 flex-shrink-0">{r.trigger === "cron" ? "Automática" : "Manual"}</span>
                  <span className={`text-xs font-medium w-24 flex-shrink-0 ${STATUS_TONE[r.status]}`}>{STATUS_LABEL[r.status]}</span>
                  <span className="text-white text-sm flex-1">{r.totals.paid} pagados · {r.totals.skipped} saltados{r.totals.failed > 0 ? ` · ${r.totals.failed} fallidos` : ""}</span>
                  <span className="text-emerald-400 font-mono text-xs flex-shrink-0">+{money(r.totals.taxWithheld)} Tesoro</span>
                </button>
                {expanded === r.id && (
                  <div className="py-3 pl-6">
                    {entriesLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin text-slate-500" />
                    ) : entries.length === 0 ? (
                      <p className="text-slate-500 text-xs">Sin destinatarios en esta corrida.</p>
                    ) : (
                      <div className="space-y-1 max-h-72 overflow-y-auto">
                        {entries.map((e) => (
                          <div key={e.id} className="flex items-center gap-3 text-xs py-1">
                            <span className="text-slate-500 w-16 flex-shrink-0">{e.system === "faction" ? "Facción" : "Civil"}</span>
                            <span className="text-white w-36 flex-shrink-0 truncate">{e.recipientName}</span>
                            <span className="text-slate-400 flex-1 truncate">{e.sourceLabel}</span>
                            {e.status === "paid" ? (
                              <>
                                <span className="text-slate-500 font-mono flex-shrink-0">bruto {money(e.grossAmount)}</span>
                                <span className="text-amber-400 font-mono flex-shrink-0">-{money(e.taxWithheld)}</span>
                                <span className="text-emerald-400 font-mono flex-shrink-0 w-20 text-right">+{money(e.netAmount)}</span>
                              </>
                            ) : (
                              <span className="text-rose-400 flex-shrink-0">{e.reason || "Saltado"}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
