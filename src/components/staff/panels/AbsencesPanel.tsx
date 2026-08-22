"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarOff, Plus, Check, X } from "lucide-react";
import { PanelHeader, Card, Chip, TextArea, TextInput, Select, Button, IconButton, Modal, LoadingBlock, EmptyState, useToast } from "@/components/staff/ui";

interface Absence {
  id: string; staffId: string; staffName: string; type: "vacation" | "permission" | "sick";
  startDate: string; endDate: string; reason: string; status: "pending" | "approved" | "rejected";
  reviewedBy?: string; reviewNote?: string; createdAt: string;
}

const TYPE_LABEL: Record<string, string> = { vacation: "Vacaciones", permission: "Permiso", sick: "Incapacidad" };
const STATUS_TONE: Record<string, "amber" | "emerald" | "rose"> = { pending: "amber", approved: "emerald", rejected: "rose" };
const STATUS_LABEL: Record<string, string> = { pending: "Pendiente", approved: "Aprobada", rejected: "Rechazada" };

export default function AbsencesPanel() {
  const toast = useToast();
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [isDirector, setIsDirector] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ type: "vacation", startDate: "", endDate: "", reason: "" });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/staff/absences", { cache: "no-store" });
    const data = await res.json();
    if (data.success) { setAbsences(data.absences); setIsDirector(data.isDirector); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const submit = async () => {
    if (!form.startDate || !form.endDate || !form.reason.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/staff/absences", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const data = await res.json();
      if (data.success) {
        toast.success("Solicitud enviada");
        setShowForm(false);
        setForm({ type: "vacation", startDate: "", endDate: "", reason: "" });
      } else {
        toast.error(data.error || "No se pudo enviar la solicitud");
      }
      await load();
    } catch {
      toast.error("No se pudo conectar con el servidor");
    } finally {
      setSaving(false);
    }
  };

  const review = async (absenceId: string, action: "approve" | "reject") => {
    try {
      const res = await fetch("/api/staff/absences", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ absenceId, action }) });
      const data = await res.json();
      if (data.success) toast.success(action === "approve" ? "Solicitud aprobada" : "Solicitud rechazada");
      else toast.error(data.error || "No se pudo actualizar la solicitud");
      await load();
    } catch {
      toast.error("No se pudo conectar con el servidor");
    }
  };

  if (loading) return <LoadingBlock />;

  const pending = absences.filter((a) => a.status === "pending");

  return (
    <div>
      <PanelHeader
        title={isDirector ? "Ausencias del Staff" : "Mis Ausencias"}
        subtitle={isDirector ? "Solicitudes de permiso y vacaciones de todo el equipo" : "Solicita permisos y vacaciones"}
        action={
          <Button icon={Plus} onClick={() => setShowForm(true)}>Nueva solicitud</Button>
        }
      />

      {absences.length === 0 ? (
        <EmptyState icon={CalendarOff} text="No hay solicitudes de ausencia todavía" />
      ) : (
        <div className="space-y-2">
          {absences.map((a) => (
            <Card key={a.id} className="p-4">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {isDirector && <span className="text-white text-sm font-semibold">{a.staffName}</span>}
                    <Chip tone="blue" label={TYPE_LABEL[a.type]} />
                    <Chip tone={STATUS_TONE[a.status]} label={STATUS_LABEL[a.status]} />
                  </div>
                  <p className="text-slate-400 text-xs">{a.startDate} → {a.endDate}</p>
                  <p className="text-slate-300 text-sm mt-1">{a.reason}</p>
                  {a.reviewedBy && <p className="text-slate-600 text-[11px] mt-1">Revisado por {a.reviewedBy}</p>}
                </div>
                {isDirector && a.status === "pending" && (
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <IconButton icon={Check} label="Aprobar" variant="success" size="sm" onClick={() => review(a.id, "approve")} />
                    <IconButton icon={X} label="Rechazar" variant="danger" size="sm" onClick={() => review(a.id, "reject")} />
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {showForm && (
        <Modal
          title="Solicitar ausencia"
          onClose={() => setShowForm(false)}
          size="sm"
          footer={
            <>
              <Button variant="ghost" onClick={() => setShowForm(false)} disabled={saving}>Cancelar</Button>
              <Button onClick={submit} loading={saving} disabled={!form.startDate || !form.endDate || !form.reason.trim()}>Enviar solicitud</Button>
            </>
          }
        >
          <div className="space-y-3">
            <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full">
              <option value="vacation">Vacaciones</option>
              <option value="permission">Permiso</option>
              <option value="sick">Incapacidad</option>
            </Select>
            <div className="grid grid-cols-2 gap-2">
              <TextInput type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="w-full" />
              <TextInput type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className="w-full" />
            </div>
            <TextArea value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="Motivo" rows={3} className="w-full" />
          </div>
        </Modal>
      )}
    </div>
  );
}
