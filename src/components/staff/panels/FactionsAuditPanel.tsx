"use client";

import { useCallback, useEffect, useState } from "react";
import { ClipboardList, AlertTriangle } from "lucide-react";
import { PanelHeader, Card, Chip, TextInput, TextArea, Select, Button, Modal, LoadingBlock, EmptyState, formatDate, useStaffPermissions, useToast } from "@/components/staff/ui";

interface AuditEntry {
  id: string; factionName: string; action: string; actorName: string; targetName?: string;
  previousValue?: string; newValue?: string; reason?: string; severity: "normal" | "warning" | "suspicious" | "critical"; createdAt: string;
}
interface Investigation {
  id: string; factionId: string; factionName: string; involvedNames: string[]; reason: string;
  evidence: { id: string; text: string; addedBy: string; addedAt: string }[];
  investigatorName?: string; status: "open" | "investigating" | "review" | "resolved" | "archived";
  resolution?: string; createdBy: string; createdAt: string;
}

const ACTION_LABEL: Record<string, string> = {
  faction_created: "Facción creada", faction_updated: "Facción editada", status_changed: "Cambio de estado",
  director_changed: "Cambio de director", member_added: "Miembro añadido", member_removed: "Miembro removido",
  rank_assigned: "Cambio de rango", rank_created: "Rango creado", rank_updated: "Rango editado",
  rank_deleted: "Rango eliminado", transaction: "Movimiento financiero",
};
const SEVERITY_TONE: Record<string, "slate" | "amber" | "orange" | "rose"> = { normal: "slate", warning: "amber", suspicious: "orange", critical: "rose" };
const SEVERITY_LABEL: Record<string, string> = { normal: "Normal", warning: "Advertencia", suspicious: "Sospechoso", critical: "Crítico" };
const STATUS_LABEL: Record<string, string> = { open: "Abierta", investigating: "Investigando", review: "En revisión", resolved: "Resuelta", archived: "Archivada" };
const STATUS_TONE: Record<string, "amber" | "blue" | "orange" | "emerald" | "slate"> = { open: "amber", investigating: "blue", review: "orange", resolved: "emerald", archived: "slate" };

export default function FactionsAuditPanel(_props: { isDirector: boolean }) {
  const { has } = useStaffPermissions();
  const canInvestigate = has("factions.investigate");
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [investigations, setInvestigations] = useState<Investigation[]>([]);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState<"all" | "warning" | "suspicious" | "critical">("all");
  const [tab, setTab] = useState<"log" | "investigations">("log");
  const [openInv, setOpenInv] = useState<Investigation | null>(null);

  const load = useCallback(async () => {
    const params = severityFilter !== "all" ? `?severity=${severityFilter}` : "";
    const res = await fetch(`/api/staff/factions/audit${params}`, { cache: "no-store" });
    const data = await res.json();
    if (data.success) { setEntries(data.entries); setInvestigations(data.investigations); }
    setLoading(false);
  }, [severityFilter]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <LoadingBlock />;

  const flagged = entries.filter((e) => e.severity !== "normal").length;

  return (
    <div>
      <PanelHeader title="Auditoría de Facciones" subtitle="Supervisión de irregularidades, abusos administrativos y movimientos anómalos" />

      <div className="flex gap-1 mb-4 border-b border-[#1F2937]">
        <button onClick={() => setTab("log")} className={`px-3 py-2 text-sm font-medium border-b-2 transition ${tab === "log" ? "border-blue-500 text-white" : "border-transparent text-slate-500 hover:text-slate-300"}`}>
          Registro de actividad {flagged > 0 && <span className="ml-1 text-amber-400">({flagged})</span>}
        </button>
        <button onClick={() => setTab("investigations")} className={`px-3 py-2 text-sm font-medium border-b-2 transition ${tab === "investigations" ? "border-blue-500 text-white" : "border-transparent text-slate-500 hover:text-slate-300"}`}>
          Investigaciones ({investigations.length})
        </button>
      </div>

      {tab === "log" && (
        <>
          <div className="flex gap-2 overflow-x-auto pb-4">
            {(["all", "warning", "suspicious", "critical"] as const).map((s) => (
              <button key={s} onClick={() => setSeverityFilter(s)} className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${severityFilter === s ? "bg-blue-600 text-white" : "bg-[#111827] text-slate-400 border border-[#1F2937] hover:text-white"}`}>
                {s === "all" ? "Todos" : SEVERITY_LABEL[s]}
              </button>
            ))}
          </div>
          {entries.length === 0 ? <EmptyState icon={ClipboardList} text="Sin actividad registrada" /> : (
            <div className="space-y-1.5">
              {entries.map((e) => (
                <Card key={e.id} className={`p-3 ${e.severity !== "normal" ? "border-amber-500/20" : ""}`}>
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      {e.severity !== "normal" && <AlertTriangle className="h-3.5 w-3.5 text-amber-400 flex-shrink-0" />}
                      <span className="text-white text-sm">{ACTION_LABEL[e.action] || e.action}</span>
                      <span className="text-slate-500 text-xs">· {e.factionName}</span>
                      {e.severity !== "normal" && <Chip tone={SEVERITY_TONE[e.severity]} label={SEVERITY_LABEL[e.severity]} />}
                    </div>
                    <span className="text-slate-600 text-[11px] flex-shrink-0">{formatDate(e.createdAt)}</span>
                  </div>
                  <p className="text-slate-400 text-xs mt-1">
                    {e.actorName}{e.targetName ? ` → ${e.targetName}` : ""}
                    {e.previousValue && e.newValue ? ` (${e.previousValue} → ${e.newValue})` : e.newValue ? `: ${e.newValue}` : ""}
                    {e.reason ? ` — ${e.reason}` : ""}
                  </p>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {tab === "investigations" && (
        <>
          {investigations.length === 0 ? <EmptyState icon={ClipboardList} text="No hay investigaciones abiertas" /> : (
            <div className="space-y-2">
              {investigations.map((inv) => (
                <Card key={inv.id} className="p-4 cursor-pointer hover:border-blue-500/30 transition" onClick={() => setOpenInv(inv)}>
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-white text-sm font-semibold">{inv.factionName}</span>
                        <Chip tone={STATUS_TONE[inv.status]} label={STATUS_LABEL[inv.status]} />
                      </div>
                      <p className="text-slate-400 text-xs">{inv.reason}</p>
                      {inv.involvedNames.length > 0 && <p className="text-slate-500 text-xs mt-1">Involucrados: {inv.involvedNames.join(", ")}</p>}
                    </div>
                    <span className="text-slate-600 text-[11px] flex-shrink-0">{formatDate(inv.createdAt)}</span>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {openInv && <InvestigationModal investigation={openInv} isDirector={canInvestigate} onClose={() => setOpenInv(null)} onChanged={load} />}
    </div>
  );
}

const INVESTIGATION_ACTION_MESSAGE: Record<string, string> = {
  add_evidence: "Evidencia añadida", change_status: "Estado actualizado", resolve: "Investigación resuelta",
};

function InvestigationModal({ investigation, isDirector, onClose, onChanged }: { investigation: Investigation; isDirector: boolean; onClose: () => void; onChanged: () => void }) {
  const toast = useToast();
  const [evidenceText, setEvidenceText] = useState("");
  const [resolution, setResolution] = useState(investigation.resolution || "");
  const [busy, setBusy] = useState(false);

  const act = async (payload: Record<string, unknown>) => {
    setBusy(true);
    try {
      const res = await fetch("/api/staff/factions/audit", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ investigationId: investigation.id, ...payload }) });
      const data = await res.json();
      const action = payload.action as string;
      if (data.success) toast.success(INVESTIGATION_ACTION_MESSAGE[action] || "Investigación actualizada");
      else toast.error(data.error || "No se pudo completar la acción");
      await onChanged();
      onClose();
    } catch {
      toast.error("No se pudo conectar con el servidor");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title={`Investigación — ${investigation.factionName}`} onClose={onClose} size="lg">
        <p className="text-slate-300 text-sm mb-3">{investigation.reason}</p>
        <div className="space-y-2 mb-4">
          {investigation.evidence.map((e) => (
            <Card key={e.id} className="p-2.5"><p className="text-slate-300 text-sm">{e.text}</p><p className="text-slate-600 text-[11px] mt-0.5">{e.addedBy} · {formatDate(e.addedAt)}</p></Card>
          ))}
        </div>
        {isDirector && investigation.status !== "resolved" && (
          <div className="space-y-3">
            <div className="flex gap-2">
              <TextInput placeholder="Añadir evidencia" value={evidenceText} onChange={(e) => setEvidenceText(e.target.value)} className="flex-1" />
              <Button variant="secondary" size="sm" disabled={busy || !evidenceText.trim()} onClick={async () => { await act({ action: "add_evidence", text: evidenceText }); }} className="h-10">Añadir</Button>
            </div>
            <Select onChange={(e) => act({ action: "change_status", status: e.target.value })} defaultValue={investigation.status} className="w-full">
              {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </Select>
            <TextArea placeholder="Resolución" value={resolution} onChange={(e) => setResolution(e.target.value)} rows={3} className="w-full" />
            <Button onClick={() => act({ action: "resolve", resolution })} loading={busy} disabled={!resolution.trim()}>Resolver investigación</Button>
          </div>
        )}
        {investigation.resolution && (
          <Card className="p-3 mt-3 bg-emerald-500/5 border-emerald-500/20">
            <p className="text-emerald-300 text-xs font-semibold mb-1">Resolución</p>
            <p className="text-slate-300 text-sm">{investigation.resolution}</p>
          </Card>
        )}
    </Modal>
  );
}
