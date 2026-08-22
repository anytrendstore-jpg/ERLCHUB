"use client";

import { useCallback, useEffect, useState } from "react";
import { Skull, Plus, MapPin, Users } from "lucide-react";
import { PanelHeader, Card, Kpi, Chip, TextInput, TextArea, Select, Button, Modal, LoadingBlock, EmptyState, formatDate, useStaffPermissions, useToast } from "@/components/staff/ui";

type ThreatLevel = "low" | "medium" | "high" | "critical";
interface Gang {
  id: string; name: string; leaderName?: string; subleaderName?: string;
  members: { playerName: string; joinedAt: string }[]; status: "active" | "suspended" | "disbanded";
  threatLevel: ThreatLevel; territory?: string; createdAt: string; updatedAt: string;
}
interface Sanction { id: string; type: string; reason: string; durationHours?: number; staffResponsible: string; status: "active" | "lifted"; createdAt: string }
interface Incident { id: string; location?: string; involvedNames: string[]; type: string; status: "open" | "closed"; createdAt: string }

const THREAT_LABEL: Record<ThreatLevel, string> = { low: "Bajo", medium: "Medio", high: "Alto", critical: "Crítico" };
const THREAT_TONE: Record<ThreatLevel, "emerald" | "amber" | "orange" | "rose"> = { low: "emerald", medium: "amber", high: "orange", critical: "rose" };
const SANCTION_LABEL: Record<string, string> = { warning: "Advertencia", fine: "Multa", restriction: "Restricción", suspension: "Suspensión", disband: "Disolución" };

export default function FactionsSanctionsPanel(_props: { isDirector: boolean }) {
  const { has } = useStaffPermissions();
  const canManage = has("gangs.manage");
  const [gangs, setGangs] = useState<Gang[]>([]);
  const [stats, setStats] = useState({ total: 0, active: 0, activeSanctions: 0 });
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/staff/factions/gangs", { cache: "no-store" });
    const data = await res.json();
    if (data.success) { setGangs(data.gangs); setStats(data.stats); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <LoadingBlock />;

  return (
    <div>
      <PanelHeader
        title="Sanciones a Bandas"
        subtitle="Administración de organizaciones criminales, antecedentes y sanciones"
        action={canManage ? <Button icon={Plus} onClick={() => setShowCreate(true)}>Registrar banda</Button> : undefined}
      />

      <div className="grid grid-cols-3 gap-3 mb-6">
        <Kpi label="Bandas registradas" value={stats.total} icon={Skull} tone="text-rose-400" ring="bg-rose-500/10 ring-1 ring-rose-500/20" />
        <Kpi label="Activas" value={stats.active} icon={Users} tone="text-amber-400" ring="bg-amber-500/10 ring-1 ring-amber-500/20" />
        <Kpi label="Sanciones activas" value={stats.activeSanctions} icon={Skull} tone="text-orange-400" ring="bg-orange-500/10 ring-1 ring-orange-500/20" />
      </div>

      {gangs.length === 0 ? (
        <EmptyState icon={Skull} text="No hay bandas registradas todavía" />
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {gangs.map((g) => (
            <Card key={g.id} className="p-4 cursor-pointer hover:border-rose-500/30 transition" onClick={() => setOpenId(g.id)}>
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-white font-semibold">{g.name}</h3>
                <Chip tone={THREAT_TONE[g.threatLevel]} label={THREAT_LABEL[g.threatLevel]} />
              </div>
              <p className="text-slate-400 text-xs mb-1">{g.leaderName ? `Líder: ${g.leaderName}` : "Líder desconocido"}</p>
              {g.territory && <p className="text-slate-500 text-xs mb-2 flex items-center gap-1"><MapPin className="h-3 w-3" /> {g.territory}</p>}
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {g.members.length} miembros</span>
                <Chip tone={g.status === "active" ? "emerald" : g.status === "suspended" ? "amber" : "slate"} label={g.status === "active" ? "Activa" : g.status === "suspended" ? "Suspendida" : "Disuelta"} />
              </div>
            </Card>
          ))}
        </div>
      )}

      {showCreate && <CreateGangModal onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); load(); }} />}
      {openId && <GangDetailModal gangId={openId} isDirector={canManage} onClose={() => setOpenId(null)} onChanged={load} />}
    </div>
  );
}

function CreateGangModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const toast = useToast();
  const [form, setForm] = useState({ name: "", leaderName: "", territory: "", threatLevel: "low" as ThreatLevel });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!form.name.trim()) return;
    setSaving(true); setError("");
    try {
      const res = await fetch("/api/staff/factions/gangs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const data = await res.json();
      if (!data.success) { setError(data.error || "No se pudo crear"); toast.error(data.error || "No se pudo registrar la banda"); return; }
      toast.success("Banda registrada");
      onCreated();
    } catch {
      toast.error("No se pudo conectar con el servidor");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title="Registrar banda"
      onClose={onClose}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button onClick={submit} loading={saving} disabled={!form.name.trim()}>Registrar</Button>
        </>
      }
    >
      <div className="space-y-3">
        <TextInput placeholder="Nombre de la banda" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full" />
        <TextInput placeholder="Líder (opcional)" value={form.leaderName} onChange={(e) => setForm({ ...form, leaderName: e.target.value })} className="w-full" />
        <TextInput placeholder="Territorio (opcional)" value={form.territory} onChange={(e) => setForm({ ...form, territory: e.target.value })} className="w-full" />
        <Select value={form.threatLevel} onChange={(e) => setForm({ ...form, threatLevel: e.target.value as ThreatLevel })} className="w-full">
          {Object.entries(THREAT_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </Select>
        {error && <p className="text-rose-400 text-xs">{error}</p>}
      </div>
    </Modal>
  );
}

const GANG_ACTION_MESSAGE: Record<string, string> = {
  change_threat: "Nivel de amenaza actualizado", change_status: "Estado actualizado", add_sanction: "Sanción aplicada",
  lift_sanction: "Sanción levantada", add_incident: "Incidente registrado", close_incident: "Incidente cerrado",
};

function GangDetailModal({ gangId, isDirector, onClose, onChanged }: { gangId: string; isDirector: boolean; onClose: () => void; onChanged: () => void }) {
  const toast = useToast();
  const [gang, setGang] = useState<Gang | null>(null);
  const [sanctions, setSanctions] = useState<Sanction[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [tab, setTab] = useState<"info" | "sanctions" | "incidents">("info");
  const [busy, setBusy] = useState(false);
  const [sanctionForm, setSanctionForm] = useState({ sanctionType: "warning", reason: "", durationHours: "" });
  const [incidentForm, setIncidentForm] = useState({ type: "", location: "" });

  const load = useCallback(async () => {
    const res = await fetch(`/api/staff/factions/gangs?id=${gangId}`, { cache: "no-store" });
    const data = await res.json();
    if (data.success) { setGang(data.gang); setSanctions(data.sanctions); setIncidents(data.incidents); }
  }, [gangId]);

  useEffect(() => { load(); }, [load]);

  const act = async (payload: Record<string, unknown>) => {
    setBusy(true);
    try {
      const res = await fetch("/api/staff/factions/gangs", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ gangId, ...payload }) });
      const data = await res.json();
      const action = payload.action as string;
      if (data.success) toast.success(GANG_ACTION_MESSAGE[action] || "Banda actualizada");
      else toast.error(data.error || "No se pudo completar la acción");
      await load();
      onChanged();
    } catch {
      toast.error("No se pudo conectar con el servidor");
    } finally {
      setBusy(false);
    }
  };

  if (!gang) return null;

  return (
    <Modal title={gang.name} onClose={onClose} size="lg">
        {isDirector && (
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <Select value={gang.threatLevel} onChange={(e) => act({ action: "change_threat", threatLevel: e.target.value })} disabled={busy}>
              {Object.entries(THREAT_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </Select>
            <Select value={gang.status} onChange={(e) => act({ action: "change_status", status: e.target.value })} disabled={busy}>
              <option value="active">Activa</option>
              <option value="suspended">Suspendida</option>
              <option value="disbanded">Disuelta</option>
            </Select>
          </div>
        )}

        <div className="flex gap-1 mb-4 border-b border-[#1F2937]">
          {(["info", "sanctions", "incidents"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`px-3 py-2 text-sm font-medium border-b-2 transition ${tab === t ? "border-blue-500 text-white" : "border-transparent text-slate-500 hover:text-slate-300"}`}>
              {t === "info" ? "Info" : t === "sanctions" ? `Sanciones (${sanctions.length})` : `Incidentes (${incidents.length})`}
            </button>
          ))}
        </div>

        {tab === "info" && (
          <div className="space-y-2">
            <Card className="p-3"><p className="text-slate-500 text-xs mb-1">Líder</p><p className="text-white text-sm">{gang.leaderName || "Desconocido"}</p></Card>
            <Card className="p-3"><p className="text-slate-500 text-xs mb-1">Territorio</p><p className="text-white text-sm">{gang.territory || "No registrado"}</p></Card>
            <Card className="p-3"><p className="text-slate-500 text-xs mb-1">Miembros ({gang.members.length})</p>
              {gang.members.length === 0 ? <p className="text-slate-500 text-sm">Sin miembros.</p> : (
                <div className="flex flex-wrap gap-1.5 mt-1">{gang.members.map((m) => <span key={m.playerName} className="text-xs px-2 py-1 rounded bg-[#0B0F17] text-slate-300">{m.playerName}</span>)}</div>
              )}
            </Card>
          </div>
        )}

        {tab === "sanctions" && (
          <div className="space-y-3">
            {isDirector && (
              <div className="space-y-2 p-3 rounded-lg bg-[#0B0F17] border border-[#1F2937]">
                <div className="flex gap-2 flex-wrap">
                  <Select value={sanctionForm.sanctionType} onChange={(e) => setSanctionForm({ ...sanctionForm, sanctionType: e.target.value })}>
                    {Object.entries(SANCTION_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </Select>
                  <TextInput type="number" placeholder="Duración (h, opcional)" value={sanctionForm.durationHours} onChange={(e) => setSanctionForm({ ...sanctionForm, durationHours: e.target.value })} className="w-40" />
                </div>
                <TextArea placeholder="Motivo" value={sanctionForm.reason} onChange={(e) => setSanctionForm({ ...sanctionForm, reason: e.target.value })} rows={2} className="w-full" />
                <Button variant="danger" disabled={busy || !sanctionForm.reason.trim()} onClick={async () => { await act({ action: "add_sanction", ...sanctionForm, durationHours: sanctionForm.durationHours ? Number(sanctionForm.durationHours) : undefined }); setSanctionForm({ sanctionType: "warning", reason: "", durationHours: "" }); }}>Aplicar sanción</Button>
              </div>
            )}
            {sanctions.length === 0 ? <p className="text-slate-500 text-sm">Sin sanciones registradas.</p> : (
              <div className="space-y-1.5">
                {sanctions.map((s) => (
                  <Card key={s.id} className="p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-white text-sm">{SANCTION_LABEL[s.type] || s.type}</span>
                      <Chip tone={s.status === "active" ? "rose" : "slate"} label={s.status === "active" ? "Activa" : "Levantada"} />
                    </div>
                    <p className="text-slate-400 text-xs mt-1">{s.reason}</p>
                    <p className="text-slate-600 text-[11px] mt-1">{s.staffResponsible} · {formatDate(s.createdAt)}</p>
                    {isDirector && s.status === "active" && <Button variant="ghost" size="sm" className="mt-1 h-auto py-0 px-0 text-blue-400 hover:text-blue-300" onClick={() => act({ action: "lift_sanction", sanctionId: s.id })}>Levantar sanción</Button>}
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "incidents" && (
          <div className="space-y-3">
            {isDirector && (
              <div className="flex gap-2 flex-wrap">
                <TextInput placeholder="Tipo de incidente" value={incidentForm.type} onChange={(e) => setIncidentForm({ ...incidentForm, type: e.target.value })} className="flex-1 min-w-[120px]" />
                <TextInput placeholder="Ubicación (opcional)" value={incidentForm.location} onChange={(e) => setIncidentForm({ ...incidentForm, location: e.target.value })} className="flex-1 min-w-[120px]" />
                <Button disabled={busy || !incidentForm.type.trim()} onClick={async () => { await act({ action: "add_incident", ...incidentForm, involvedNames: [] }); setIncidentForm({ type: "", location: "" }); }}>Registrar</Button>
              </div>
            )}
            {incidents.length === 0 ? <p className="text-slate-500 text-sm">Sin incidentes registrados.</p> : (
              <div className="space-y-1.5">
                {incidents.map((i) => (
                  <Card key={i.id} className="p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-white text-sm">{i.type}</span>
                      <Chip tone={i.status === "open" ? "amber" : "slate"} label={i.status === "open" ? "Abierto" : "Cerrado"} />
                    </div>
                    {i.location && <p className="text-slate-400 text-xs mt-1">{i.location}</p>}
                    <p className="text-slate-600 text-[11px] mt-1">{formatDate(i.createdAt)}</p>
                    {isDirector && i.status === "open" && <Button variant="ghost" size="sm" className="mt-1 h-auto py-0 px-0 text-blue-400 hover:text-blue-300" onClick={() => act({ action: "close_incident", incidentId: i.id })}>Cerrar</Button>}
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
    </Modal>
  );
}
