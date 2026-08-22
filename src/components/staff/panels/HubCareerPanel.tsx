"use client";

import { useCallback, useEffect, useState } from "react";
import { Briefcase, Building2, Users, FileText, CheckCircle2, ShieldCheck, Flag, X, Check, Pencil, Power, ArrowRightLeft } from "lucide-react";
import { PanelHeader, Card, Kpi, LoadingBlock, ErrorBlock, Chip, TextInput, TextArea, Button, IconButton, Modal, useToast } from "@/components/staff/ui";

interface Company {
  id: string; name: string; description: string; category: string; location: string; website?: string; contactInfo?: string;
  employeeCount: number; verified: boolean; approved: boolean; ownerId: string;
}

interface Report {
  id: string; reporterName: string; targetType: "user" | "post" | "company"; targetLabel: string; reason: string;
  status: "pending" | "reviewed" | "dismissed"; createdAt: string;
}

interface Stats {
  profileCount: number; companyCount: number; openJobs: number; totalApplications: number; postCount: number; pendingReports: number;
}

const TARGET_LABEL: Record<string, string> = { user: "Usuario", post: "Publicación", company: "Empresa" };

export default function HubCareerPanel() {
  const toast = useToast();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"companies" | "reports">("companies");

  const [editing, setEditing] = useState<Company | null>(null);
  const [editForm, setEditForm] = useState({ name: "", description: "", category: "", location: "", website: "", contactInfo: "" });
  const [saving, setSaving] = useState(false);
  const [transferring, setTransferring] = useState<Company | null>(null);
  const [newOwnerId, setNewOwnerId] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/staff/hubcareer", { cache: "no-store" });
      const json = await res.json();
      if (json.success) { setCompanies(json.companies); setStats(json.stats); setReports(json.reports); } else setError(json.error);
    } catch {
      setError("No se pudo conectar con el servidor");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleVerify = async (companyId: string, verified: boolean) => {
    try {
      const res = await fetch("/api/staff/hubcareer", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: verified ? "unverify_company" : "verify_company", companyId }),
      });
      const data = await res.json();
      if (data.success) toast.success(verified ? "Empresa desverificada" : "Empresa verificada");
      else toast.error(data.error || "No se pudo actualizar la empresa");
      await load();
    } catch {
      toast.error("No se pudo conectar con el servidor");
    }
  };

  const toggleApproved = async (companyId: string) => {
    try {
      const res = await fetch("/api/staff/hubcareer", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "toggle_approved", companyId }) });
      const data = await res.json();
      if (data.success) toast.success("Estado de la empresa actualizado");
      else toast.error(data.error || "No se pudo actualizar la empresa");
      await load();
    } catch {
      toast.error("No se pudo conectar con el servidor");
    }
  };

  const resolveReport = async (reportId: string, action: "resolve_report" | "dismiss_report") => {
    try {
      const res = await fetch("/api/staff/hubcareer", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, reportId }) });
      const data = await res.json();
      if (data.success) toast.success(action === "resolve_report" ? "Reporte resuelto" : "Reporte descartado");
      else toast.error(data.error || "No se pudo actualizar el reporte");
      await load();
    } catch {
      toast.error("No se pudo conectar con el servidor");
    }
  };

  const openEdit = (c: Company) => {
    setEditing(c);
    setEditForm({ name: c.name, description: c.description, category: c.category, location: c.location, website: c.website || "", contactInfo: c.contactInfo || "" });
  };

  const saveEdit = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      const res = await fetch("/api/staff/hubcareer", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "edit_company", companyId: editing.id, ...editForm }),
      });
      const data = await res.json();
      if (data.success) { toast.success("Empresa actualizada"); setEditing(null); }
      else toast.error(data.error || "No se pudo guardar los cambios");
      await load();
    } catch {
      toast.error("No se pudo conectar con el servidor");
    } finally {
      setSaving(false);
    }
  };

  const doTransfer = async () => {
    if (!transferring || !newOwnerId.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/staff/hubcareer", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "transfer_ownership", companyId: transferring.id, newOwnerId: newOwnerId.trim() }),
      });
      const data = await res.json();
      if (data.success) { toast.success("Propiedad transferida"); setTransferring(null); setNewOwnerId(""); }
      else toast.error(data.error || "No se pudo transferir la propiedad");
      await load();
    } catch {
      toast.error("No se pudo conectar con el servidor");
    } finally {
      setSaving(false);
    }
  };

  if (loading && companies.length === 0) return <LoadingBlock />;
  if (error) return <ErrorBlock text={error} onRetry={load} />;

  const pendingReports = reports.filter((r) => r.status === "pending");

  return (
    <div>
      <PanelHeader title="HubCareer" subtitle="Red profesional del servidor: empresas, empleos, verificaciones y moderación" />

      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          <Kpi label="Perfiles activos" value={stats.profileCount} icon={Users} tone="text-sky-400" ring="bg-sky-500/10 ring-1 ring-sky-500/30" />
          <Kpi label="Empresas" value={stats.companyCount} icon={Building2} tone="text-amber-400" ring="bg-amber-500/10 ring-1 ring-amber-500/30" />
          <Kpi label="Vacantes abiertas" value={stats.openJobs} icon={Briefcase} tone="text-emerald-400" ring="bg-emerald-500/10 ring-1 ring-emerald-500/30" />
          <Kpi label="Postulaciones totales" value={stats.totalApplications} icon={FileText} tone="text-purple-400" ring="bg-purple-500/10 ring-1 ring-purple-500/30" />
          <Kpi label="Publicaciones" value={stats.postCount} icon={FileText} tone="text-rose-400" ring="bg-rose-500/10 ring-1 ring-rose-500/30" />
          <Kpi label="Reportes pendientes" value={stats.pendingReports} icon={Flag} tone="text-red-400" ring="bg-red-500/10 ring-1 ring-red-500/30" />
        </div>
      )}

      <div className="flex items-center gap-2 mb-4">
        <button onClick={() => setTab("companies")} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${tab === "companies" ? "bg-blue-600 text-white" : "bg-white/5 text-slate-400"}`}>Empresas</button>
        <button onClick={() => setTab("reports")} className={`relative px-4 py-2 rounded-lg text-sm font-medium transition ${tab === "reports" ? "bg-blue-600 text-white" : "bg-white/5 text-slate-400"}`}>
          Reportes
          {pendingReports.length > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">{pendingReports.length}</span>}
        </button>
      </div>

      {tab === "companies" && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {companies.map((c) => (
            <Card key={c.id} className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center"><Building2 className="h-4 w-4 text-amber-400" /></div>
                  <div>
                    <div className="text-white font-semibold text-sm flex items-center gap-1">{c.name} {c.verified && <ShieldCheck className="h-3.5 w-3.5 text-sky-400" />}</div>
                    <div className="text-slate-500 text-xs">{c.category} · {c.location}</div>
                  </div>
                </div>
              </div>
              <p className="text-slate-400 text-xs mb-1">{c.employeeCount} empleados</p>
              <p className="text-slate-600 text-[11px] mb-3">Dueño: {c.ownerId}</p>
              <div className="flex items-center gap-1.5 mb-3">
                {c.verified ? <Chip tone="emerald" label="Verificada" /> : <Chip tone="slate" label="Sin verificar" />}
                {c.approved ? <Chip tone="blue" label="Activa" /> : <Chip tone="rose" label="Desactivada" />}
              </div>
              <div className="grid grid-cols-2 gap-1.5 pt-3 border-t border-[#1F2937]">
                <Button variant={c.verified ? "secondary" : "primary"} size="sm" icon={CheckCircle2} onClick={() => toggleVerify(c.id, c.verified)}>{c.verified ? "Desverificar" : "Verificar"}</Button>
                <Button variant={c.approved ? "danger" : "success"} size="sm" icon={Power} onClick={() => toggleApproved(c.id)}>{c.approved ? "Desactivar" : "Reactivar"}</Button>
                <Button variant="secondary" size="sm" icon={Pencil} onClick={() => openEdit(c)}>Editar</Button>
                <Button variant="secondary" size="sm" icon={ArrowRightLeft} onClick={() => { setTransferring(c); setNewOwnerId(""); }}>Transferir</Button>
              </div>
            </Card>
          ))}
          {companies.length === 0 && <p className="text-slate-500 text-sm">Todavía no hay empresas registradas.</p>}
        </div>
      )}

      {tab === "reports" && (
        <div className="space-y-3">
          {reports.map((r) => (
            <Card key={r.id} className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Chip tone={r.targetType === "user" ? "blue" : r.targetType === "company" ? "amber" : "orange"} label={TARGET_LABEL[r.targetType]} />
                    {r.status === "pending" && <Chip tone="rose" label="Pendiente" />}
                    {r.status === "reviewed" && <Chip tone="emerald" label="Revisado" />}
                    {r.status === "dismissed" && <Chip tone="slate" label="Descartado" />}
                  </div>
                  <p className="text-white text-sm font-semibold">{r.targetLabel}</p>
                  <p className="text-slate-400 text-xs mt-1">{r.reason}</p>
                  <p className="text-slate-600 text-[11px] mt-1">Reportado por {r.reporterName}</p>
                </div>
                {r.status === "pending" && (
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <IconButton icon={Check} label="Resolver" variant="success" size="sm" onClick={() => resolveReport(r.id, "resolve_report")} />
                    <IconButton icon={X} label="Descartar" variant="secondary" size="sm" onClick={() => resolveReport(r.id, "dismiss_report")} />
                  </div>
                )}
              </div>
            </Card>
          ))}
          {reports.length === 0 && <p className="text-slate-500 text-sm">Sin reportes todavía.</p>}
        </div>
      )}

      {editing && (
        <Modal
          title="Editar empresa"
          onClose={() => setEditing(null)}
          size="sm"
          footer={
            <>
              <Button variant="ghost" onClick={() => setEditing(null)} disabled={saving}>Cancelar</Button>
              <Button onClick={saveEdit} loading={saving}>Guardar</Button>
            </>
          }
        >
            <div className="space-y-3">
              <TextInput value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} placeholder="Nombre" className="w-full" />
              <TextInput value={editForm.category} onChange={(e) => setEditForm({ ...editForm, category: e.target.value })} placeholder="Categoría" className="w-full" />
              <TextInput value={editForm.location} onChange={(e) => setEditForm({ ...editForm, location: e.target.value })} placeholder="Ubicación" className="w-full" />
              <TextArea value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} placeholder="Descripción" rows={3} className="w-full" />
              <TextInput value={editForm.website} onChange={(e) => setEditForm({ ...editForm, website: e.target.value })} placeholder="Sitio web" className="w-full" />
              <TextInput value={editForm.contactInfo} onChange={(e) => setEditForm({ ...editForm, contactInfo: e.target.value })} placeholder="Contacto" className="w-full" />
            </div>
        </Modal>
      )}

      {transferring && (
        <Modal
          title="Transferir propiedad"
          description={`${transferring.name} · dueño actual: ${transferring.ownerId}`}
          onClose={() => setTransferring(null)}
          size="sm"
          footer={
            <>
              <Button variant="ghost" onClick={() => setTransferring(null)} disabled={saving}>Cancelar</Button>
              <Button onClick={doTransfer} loading={saving} disabled={!newOwnerId.trim()}>Transferir</Button>
            </>
          }
        >
            <TextInput value={newOwnerId} onChange={(e) => setNewOwnerId(e.target.value)} placeholder="ID de Discord del nuevo dueño" className="w-full" />
        </Modal>
      )}
    </div>
  );
}
