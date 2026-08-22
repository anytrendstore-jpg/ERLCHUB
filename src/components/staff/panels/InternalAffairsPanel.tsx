"use client";

import { useCallback, useEffect, useState } from "react";
import { Fingerprint, Plus } from "lucide-react";
import { PanelHeader, Card, Chip, TextInput, TextArea, Select, Button, Modal, LoadingBlock, EmptyState, AccessDenied, formatDate, useToast } from "@/components/staff/ui";

type IACaseType = "abuse_of_power" | "negligence" | "corruption" | "unprofessional_conduct" | "policy_violation" | "other";
type IAPriority = "low" | "medium" | "high" | "critical";
type IAStatus = "open" | "investigating" | "review" | "resolved" | "archived";

interface IACase {
  id: string; caseNumber: number; targetStaffName: string; department?: string;
  type: IACaseType; priority: IAPriority; status: IAStatus;
  investigatorName?: string; description: string;
  evidence: { id: string; text: string; url?: string; addedBy: string; addedAt: string }[];
  notes: { id: string; body: string; author: string; createdAt: string }[];
  timeline: { id: string; label: string; createdAt: string }[];
  resolution?: string; createdBy: string; createdAt: string; updatedAt: string;
}

const TYPE_LABEL: Record<IACaseType, string> = {
  abuse_of_power: "Abuso de poder", negligence: "Negligencia", corruption: "Corrupción",
  unprofessional_conduct: "Conducta no profesional", policy_violation: "Violación de normas", other: "Otro",
};
const PRIORITY_TONE: Record<IAPriority, "slate" | "blue" | "amber" | "rose"> = { low: "slate", medium: "blue", high: "amber", critical: "rose" };
const PRIORITY_LABEL: Record<IAPriority, string> = { low: "Baja", medium: "Media", high: "Alta", critical: "Crítica" };
const STATUS_TONE: Record<IAStatus, "amber" | "blue" | "orange" | "emerald" | "slate"> = { open: "amber", investigating: "blue", review: "orange", resolved: "emerald", archived: "slate" };
const STATUS_LABEL: Record<IAStatus, string> = { open: "Abierto", investigating: "Investigación", review: "En revisión", resolved: "Resuelto", archived: "Archivado" };

export default function InternalAffairsPanel() {
  const [cases, setCases] = useState<IACase[]>([]);
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [openCase, setOpenCase] = useState<IACase | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | IAStatus>("all");

  const load = useCallback(async () => {
    const res = await fetch("/api/staff/internal-affairs", { cache: "no-store" });
    if (res.status === 403) { setDenied(true); setLoading(false); return; }
    const data = await res.json();
    if (data.success) setCases(data.cases);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const openDetail = async (id: string) => {
    const res = await fetch(`/api/staff/internal-affairs?id=${id}`, { cache: "no-store" });
    const data = await res.json();
    if (data.success) setOpenCase(data.case);
  };

  if (loading) return <LoadingBlock />;
  if (denied) return <AccessDenied title="Asuntos Internos" />;

  const filtered = statusFilter === "all" ? cases : cases.filter((c) => c.status === statusFilter);

  return (
    <div>
      <PanelHeader
        title="Asuntos Internos"
        subtitle="Investigaciones sensibles sobre el propio equipo de staff — acceso restringido a Directores"
        action={<Button icon={Plus} onClick={() => setShowCreate(true)}>Nuevo caso</Button>}
      />

      <div className="flex gap-2 overflow-x-auto pb-4">
        {(["all", "open", "investigating", "review", "resolved", "archived"] as const).map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${statusFilter === s ? "bg-blue-600 text-white" : "bg-[#111827] text-slate-400 border border-[#1F2937] hover:text-white"}`}>
            {s === "all" ? "Todos" : STATUS_LABEL[s]}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Fingerprint} text="No hay casos internos registrados" />
      ) : (
        <div className="space-y-2">
          {filtered.map((c) => (
            <Card key={c.id} className="p-4 cursor-pointer hover:border-blue-500/30 transition" onClick={() => openDetail(c.id)}>
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-slate-500 text-xs font-mono">#{c.caseNumber}</span>
                    <span className="text-white text-sm font-semibold">{c.targetStaffName}</span>
                    <Chip tone={PRIORITY_TONE[c.priority]} label={PRIORITY_LABEL[c.priority]} />
                    <Chip tone={STATUS_TONE[c.status]} label={STATUS_LABEL[c.status]} />
                  </div>
                  <p className="text-slate-400 text-xs">{TYPE_LABEL[c.type]}{c.department ? ` · ${c.department}` : ""}</p>
                  <p className="text-slate-300 text-sm mt-1 line-clamp-1">{c.description}</p>
                </div>
                <p className="text-slate-600 text-[11px] flex-shrink-0">{formatDate(c.createdAt)}</p>
              </div>
            </Card>
          ))}
        </div>
      )}

      {showCreate && <CreateCaseModal onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); load(); }} />}
      {openCase && <CaseDetailModal caseData={openCase} onClose={() => setOpenCase(null)} onChanged={async () => { await load(); openDetail(openCase.id); }} />}
    </div>
  );
}

function CreateCaseModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const toast = useToast();
  const [form, setForm] = useState({ targetStaffName: "", department: "", type: "other" as IACaseType, priority: "medium" as IAPriority, description: "" });
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!form.targetStaffName.trim() || !form.description.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/staff/internal-affairs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const data = await res.json();
      if (data.success) { toast.success("Caso interno creado"); onCreated(); }
      else toast.error(data.error || "No se pudo crear el caso");
    } catch {
      toast.error("No se pudo conectar con el servidor");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title="Abrir caso interno"
      onClose={onClose}
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button onClick={submit} loading={saving} disabled={!form.targetStaffName.trim() || !form.description.trim()}>Crear caso</Button>
        </>
      }
    >
      <div className="space-y-3">
        <TextInput placeholder="Miembro de staff involucrado" value={form.targetStaffName} onChange={(e) => setForm({ ...form, targetStaffName: e.target.value })} className="w-full" />
        <TextInput placeholder="Departamento (opcional)" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} className="w-full" />
        <div className="grid grid-cols-2 gap-2">
          <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as IACaseType })} className="w-full">
            {Object.entries(TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </Select>
          <Select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as IAPriority })} className="w-full">
            {Object.entries(PRIORITY_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </Select>
        </div>
        <TextArea placeholder="Descripción del caso" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} className="w-full" />
      </div>
    </Modal>
  );
}

const IA_ACTION_MESSAGE: Record<string, string> = {
  change_status: "Estado actualizado", set_investigator: "Investigador asignado", resolve: "Caso marcado como resuelto",
  add_evidence: "Evidencia añadida", add_note: "Nota añadida",
};

function CaseDetailModal({ caseData, onClose, onChanged }: { caseData: IACase; onClose: () => void; onChanged: () => void }) {
  const toast = useToast();
  const [tab, setTab] = useState<"info" | "evidence" | "notes" | "timeline">("info");
  const [noteText, setNoteText] = useState("");
  const [evidenceText, setEvidenceText] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [investigatorName, setInvestigatorName] = useState(caseData.investigatorName || "");
  const [resolution, setResolution] = useState(caseData.resolution || "");
  const [busy, setBusy] = useState(false);

  const act = async (payload: Record<string, unknown>) => {
    setBusy(true);
    try {
      const res = await fetch("/api/staff/internal-affairs", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ caseId: caseData.id, ...payload }) });
      const data = await res.json();
      const action = payload.action as string;
      if (data.success) toast.success(IA_ACTION_MESSAGE[action] || "Caso actualizado");
      else toast.error(data.error || "No se pudo actualizar el caso");
      await onChanged();
    } catch {
      toast.error("No se pudo conectar con el servidor");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      title={`#${caseData.caseNumber} · ${caseData.targetStaffName}`}
      description={`${TYPE_LABEL[caseData.type]}${caseData.department ? ` · ${caseData.department}` : ""} · Creado por ${caseData.createdBy}`}
      onClose={onClose}
      size="lg"
    >
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <Chip tone={PRIORITY_TONE[caseData.priority]} label={PRIORITY_LABEL[caseData.priority]} />
          <Select value={caseData.status} onChange={(e) => act({ action: "change_status", status: e.target.value })} disabled={busy}>
            {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </Select>
          <Chip tone={STATUS_TONE[caseData.status]} label={STATUS_LABEL[caseData.status]} />
        </div>

        <div className="flex gap-1 mb-4 border-b border-[#1F2937]">
          {(["info", "evidence", "notes", "timeline"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`px-3 py-2 text-sm font-medium border-b-2 transition ${tab === t ? "border-blue-500 text-white" : "border-transparent text-slate-500 hover:text-slate-300"}`}>
              {t === "info" ? "Información" : t === "evidence" ? `Evidencias (${caseData.evidence.length})` : t === "notes" ? `Notas (${caseData.notes.length})` : "Línea temporal"}
            </button>
          ))}
        </div>

        {tab === "info" && (
          <div className="space-y-4">
            <p className="text-slate-300 text-sm whitespace-pre-wrap">{caseData.description}</p>
            <div className="flex items-center gap-2">
              <TextInput placeholder="Nombre del investigador" value={investigatorName} onChange={(e) => setInvestigatorName(e.target.value)} className="flex-1" />
              <Button variant="secondary" disabled={busy || !investigatorName.trim()} onClick={() => act({ action: "set_investigator", investigatorName })}>Asignar</Button>
            </div>
            {caseData.status !== "resolved" && (
              <div>
                <TextArea placeholder="Resolución del caso" value={resolution} onChange={(e) => setResolution(e.target.value)} rows={3} className="w-full" />
                <Button variant="success" className="mt-2" disabled={busy || !resolution.trim()} onClick={() => act({ action: "resolve", resolution })}>Marcar como resuelto</Button>
              </div>
            )}
            {caseData.resolution && (
              <Card className="p-3 bg-emerald-500/5 border-emerald-500/20">
                <p className="text-emerald-300 text-xs font-semibold mb-1">Resolución</p>
                <p className="text-slate-300 text-sm">{caseData.resolution}</p>
              </Card>
            )}
          </div>
        )}

        {tab === "evidence" && (
          <div className="space-y-3">
            <div className="space-y-2">
              <TextArea placeholder="Descripción de la evidencia" value={evidenceText} onChange={(e) => setEvidenceText(e.target.value)} rows={2} className="w-full" />
              <div className="flex gap-2">
                <TextInput placeholder="Enlace (opcional)" value={evidenceUrl} onChange={(e) => setEvidenceUrl(e.target.value)} className="flex-1" />
                <Button disabled={busy || !evidenceText.trim()} onClick={async () => { await act({ action: "add_evidence", text: evidenceText, url: evidenceUrl }); setEvidenceText(""); setEvidenceUrl(""); }}>Añadir</Button>
              </div>
            </div>
            {caseData.evidence.length === 0 ? <p className="text-slate-500 text-sm">Sin evidencias todavía.</p> : (
              <div className="space-y-2">
                {caseData.evidence.map((e) => (
                  <Card key={e.id} className="p-3">
                    <p className="text-slate-300 text-sm">{e.text}</p>
                    {e.url && <a href={e.url} target="_blank" rel="noreferrer" className="text-blue-400 text-xs underline">{e.url}</a>}
                    <p className="text-slate-600 text-[11px] mt-1">{e.addedBy} · {formatDate(e.addedAt)}</p>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "notes" && (
          <div className="space-y-3">
            <div className="flex gap-2">
              <TextInput placeholder="Nota interna" value={noteText} onChange={(e) => setNoteText(e.target.value)} className="flex-1" />
              <Button disabled={busy || !noteText.trim()} onClick={async () => { await act({ action: "add_note", text: noteText }); setNoteText(""); }}>Añadir</Button>
            </div>
            {caseData.notes.length === 0 ? <p className="text-slate-500 text-sm">Sin notas todavía.</p> : (
              <div className="space-y-2">
                {caseData.notes.map((n) => (
                  <Card key={n.id} className="p-3">
                    <p className="text-slate-300 text-sm">{n.body}</p>
                    <p className="text-slate-600 text-[11px] mt-1">{n.author} · {formatDate(n.createdAt)}</p>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "timeline" && (
          <div className="space-y-2">
            {caseData.timeline.map((t) => (
              <div key={t.id} className="flex items-center gap-3 text-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                <span className="text-slate-300">{t.label}</span>
                <span className="text-slate-600 text-xs ml-auto">{formatDate(t.createdAt)}</span>
              </div>
            ))}
          </div>
        )}
    </Modal>
  );
}
