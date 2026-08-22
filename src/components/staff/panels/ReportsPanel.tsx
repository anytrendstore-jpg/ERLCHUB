"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, X, Loader2, Flag, Check, XCircle, UserCog, Search, TrendingUp } from "lucide-react";
import { PanelHeader, Card, Chip, TextInput, TextArea, Select, PrimaryButton, LoadingBlock, EmptyState, formatDate, useToast, Pagination, SortToggle } from "@/components/staff/ui";

type ReportStatus = "open" | "in_review" | "assigned" | "investigating" | "resolved" | "dismissed";
type ReportPriority = "low" | "medium" | "high" | "critical";
interface Report {
  id: string; reporterName: string; targetName: string; reason: string; details: string;
  status: ReportStatus; priority: ReportPriority; assignedTo?: string; resolution?: string; handledBy?: string; createdAt: string;
}

const STATUS_CHIP: Record<ReportStatus, { tone: "amber" | "blue" | "emerald" | "slate" | "orange"; label: string }> = {
  open: { tone: "amber", label: "Nuevo" },
  in_review: { tone: "blue", label: "En revisión" },
  assigned: { tone: "orange", label: "Asignado" },
  investigating: { tone: "orange", label: "En investigación" },
  resolved: { tone: "emerald", label: "Resuelto" },
  dismissed: { tone: "slate", label: "Rechazado" },
};
const PRIORITY_CHIP: Record<ReportPriority, { tone: "slate" | "blue" | "amber" | "rose"; label: string }> = {
  low: { tone: "slate", label: "Baja" }, medium: { tone: "blue", label: "Media" }, high: { tone: "amber", label: "Alta" }, critical: { tone: "rose", label: "Crítica" },
};

const FILTERS: { id: ReportStatus | "all"; label: string }[] = [
  { id: "all", label: "Todos" }, { id: "open", label: "Nuevos" }, { id: "in_review", label: "En revisión" },
  { id: "assigned", label: "Asignados" }, { id: "investigating", label: "En investigación" },
  { id: "resolved", label: "Resueltos" }, { id: "dismissed", label: "Rechazados" },
];

export default function ReportsPanel({ onChanged }: { onChanged?: () => void }) {
  const toast = useToast();
  const [reports, setReports] = useState<Report[]>([]);
  const [pending, setPending] = useState(0);
  const [filter, setFilter] = useState<ReportStatus | "all">("all");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const [form, setForm] = useState({ reporterName: "", targetName: "", reason: "", details: "", priority: "medium" as ReportPriority });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sort, setSort] = useState<"newest" | "oldest">("newest");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), sort });
      if (filter !== "all") params.set("status", filter);
      const res = await fetch(`/api/staff/reports?${params}`, { cache: "no-store" });
      const data = await res.json();
      if (data.success) { setReports(data.reports); setPending(data.pending); setTotalPages(data.totalPages || 1); }
    } finally {
      setLoading(false);
    }
  }, [filter, page, sort]);

  useEffect(() => { setPage(1); }, [filter, sort]);
  useEffect(() => { load(); }, [load]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving("new");
    try {
      const res = await fetch("/api/staff/reports", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const data = await res.json();
      if (data.success) {
        toast.success("Reporte registrado");
        setForm({ reporterName: "", targetName: "", reason: "", details: "", priority: "medium" });
        setShowForm(false);
        await load();
        onChanged?.();
      } else {
        toast.error(data.error || "No se pudo registrar el reporte");
      }
    } catch {
      toast.error("No se pudo conectar con el servidor");
    } finally {
      setSaving(null);
    }
  };

  const RESOLVE_MESSAGE: Partial<Record<ReportStatus, string>> = {
    resolved: "Reporte resuelto", dismissed: "Reporte rechazado", investigating: "Reporte marcado en investigación",
  };

  const resolve = async (id: string, status: ReportStatus, assignedTo?: string) => {
    setSaving(id + status);
    try {
      const res = await fetch("/api/staff/reports", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status, assignedTo }) });
      const data = await res.json();
      if (data.success) { if (RESOLVE_MESSAGE[status]) toast.success(RESOLVE_MESSAGE[status]!); }
      else toast.error(data.error || "No se pudo actualizar el reporte");
      await load();
      onChanged?.();
    } catch {
      toast.error("No se pudo conectar con el servidor");
    } finally {
      setSaving(null);
    }
  };

  const ACTION_MESSAGE: Record<"take" | "escalate", string> = { take: "Reporte asignado a vos", escalate: "Prioridad escalada" };

  const runAction = async (id: string, action: "take" | "escalate") => {
    setSaving(id + action);
    try {
      const res = await fetch("/api/staff/reports", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, action }) });
      const data = await res.json();
      if (data.success) toast.success(ACTION_MESSAGE[action]);
      else toast.error(data.error || "No se pudo completar la acción");
      await load();
      onChanged?.();
    } catch {
      toast.error("No se pudo conectar con el servidor");
    } finally {
      setSaving(null);
    }
  };

  return (
    <div>
      <PanelHeader
        title="Reportes"
        subtitle={`${pending} reportes en cola`}
        action={
          <PrimaryButton onClick={() => setShowForm((v) => !v)}>
            {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />} Registrar reporte
          </PrimaryButton>
        }
      />

      {showForm && (
        <Card className="p-4 mb-4">
          <form onSubmit={submit} className="grid sm:grid-cols-2 gap-3">
            <TextInput placeholder="Quién reporta" value={form.reporterName} onChange={(e) => setForm((f) => ({ ...f, reporterName: e.target.value }))} required />
            <TextInput placeholder="Jugador reportado" value={form.targetName} onChange={(e) => setForm((f) => ({ ...f, targetName: e.target.value }))} required />
            <TextInput className="sm:col-span-2" placeholder="Motivo" value={form.reason} onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))} required />
            <TextArea className="sm:col-span-2" rows={3} placeholder="Detalles del incidente..." value={form.details} onChange={(e) => setForm((f) => ({ ...f, details: e.target.value }))} />
            <Select value={form.priority} onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value as ReportPriority }))}>
              {Object.entries(PRIORITY_CHIP).map(([v, c]) => <option key={v} value={v}>{c.label}</option>)}
            </Select>
            <div className="sm:col-span-2">
              <PrimaryButton type="submit" disabled={saving === "new"}>{saving === "new" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar"}</PrimaryButton>
            </div>
          </form>
        </Card>
      )}

      <div className="flex items-center justify-between gap-2 pb-4">
        <div className="flex gap-2 overflow-x-auto">
          {FILTERS.map((f) => (
            <button key={f.id} type="button" onClick={() => setFilter(f.id)} className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${filter === f.id ? "bg-blue-600 text-white" : "bg-[#111827] text-slate-400 border border-[#1F2937] hover:text-white"}`}>
              {f.label}
            </button>
          ))}
        </div>
        <SortToggle value={sort} onChange={setSort} />
      </div>

      {loading ? <LoadingBlock /> : reports.length === 0 ? (
        <EmptyState icon={Flag} text="No hay reportes" />
      ) : (
        <div className="space-y-3">
          {reports.map((r) => (
            <Card key={r.id} className="p-4">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <Chip tone={STATUS_CHIP[r.status].tone} label={STATUS_CHIP[r.status].label} />
                    <Chip tone={PRIORITY_CHIP[r.priority || "medium"].tone} label={PRIORITY_CHIP[r.priority || "medium"].label} />
                    <span className="text-xs text-slate-500">{formatDate(r.createdAt)}</span>
                  </div>
                  <div className="text-sm text-white"><span className="text-slate-400">{r.reporterName}</span> reportó a <span className="font-medium">{r.targetName}</span></div>
                  <div className="text-sm text-slate-400 mt-0.5">{r.reason}</div>
                  {r.details && <p className="text-xs text-slate-500 mt-1.5">{r.details}</p>}
                  {r.assignedTo && <p className="text-xs text-blue-400 mt-1.5 flex items-center gap-1"><UserCog className="h-3 w-3" /> Asignado a {r.assignedTo}</p>}
                  {r.resolution && <p className="text-xs text-emerald-400 mt-1.5">Resolución: {r.resolution}</p>}
                </div>
                {r.status !== "resolved" && r.status !== "dismissed" && (
                  <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                    {r.status === "open" && (
                      <button type="button" onClick={() => runAction(r.id, "take")} disabled={saving !== null} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/10 hover:bg-blue-600/20 text-blue-300 text-xs font-medium ring-1 ring-blue-500/30 transition disabled:opacity-50">
                        {saving === r.id + "take" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserCog className="h-3.5 w-3.5" />} Tomar
                      </button>
                    )}
                    {(r.status === "assigned" || r.status === "in_review") && (
                      <button type="button" onClick={() => resolve(r.id, "investigating")} disabled={saving !== null} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-600/10 hover:bg-orange-600/20 text-orange-300 text-xs font-medium ring-1 ring-orange-500/30 transition disabled:opacity-50">
                        <Search className="h-3.5 w-3.5" /> Investigar
                      </button>
                    )}
                    {r.priority !== "critical" && (
                      <button type="button" onClick={() => runAction(r.id, "escalate")} disabled={saving !== null} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#151C2A] hover:bg-[#1B2436] text-amber-300 text-xs font-medium ring-1 ring-amber-500/20 transition disabled:opacity-50">
                        {saving === r.id + "escalate" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <TrendingUp className="h-3.5 w-3.5" />} Escalar
                      </button>
                    )}
                    <button type="button" onClick={() => resolve(r.id, "resolved")} disabled={saving !== null} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-300 text-xs font-medium ring-1 ring-emerald-500/30 transition disabled:opacity-50">
                      {saving === r.id + "resolved" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />} Resolver
                    </button>
                    <button type="button" onClick={() => resolve(r.id, "dismissed")} disabled={saving !== null} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#151C2A] hover:bg-[#1B2436] text-slate-400 text-xs font-medium ring-1 ring-[#1F2937] transition disabled:opacity-50">
                      {saving === r.id + "dismissed" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />} Rechazar
                    </button>
                  </div>
                )}
              </div>
            </Card>
          ))}
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </div>
      )}
    </div>
  );
}
