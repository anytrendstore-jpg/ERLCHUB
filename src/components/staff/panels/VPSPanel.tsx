"use client";

import { useCallback, useEffect, useState } from "react";
import { Server, Plus, Power, Pencil, ShieldCheck, DollarSign, Users, RefreshCw } from "lucide-react";
import { PanelHeader, Card, Kpi, TextInput, TextArea, Select, Button, IconButton, Modal, LoadingBlock, ErrorBlock, AccessDenied, Chip, useStaffPermissions, useToast } from "@/components/staff/ui";

interface VpsPlan {
  id: string;
  name: string;
  dailyPrice: number;
  securityLevel: number;
  durationHours: number;
  description: string;
  enabled: boolean;
}

const DURATION_OPTIONS = [
  { label: '1 hora', value: 1 },
  { label: '6 horas', value: 6 },
  { label: '24 horas', value: 24 },
  { label: '7 días', value: 24 * 7 },
  { label: '30 días', value: 24 * 30 },
];

function durationLabel(hours: number): string {
  const found = DURATION_OPTIONS.find((o) => o.value === hours);
  if (found) return found.label;
  if (hours % 24 === 0) return `${hours / 24} días`;
  return `${hours}h`;
}

interface VpsStats {
  activeCount: number;
  expiredCount: number;
  totalSold: number;
  revenue: number;
  activeUsers: number;
  renewals: number;
}

export default function VPSPanel(_props: { isDirector?: boolean }) {
  const toast = useToast();
  const { has, loaded } = useStaffPermissions();
  const canView = has("economy.view");
  const canManage = has("economy.manage");
  const [plans, setPlans] = useState<VpsPlan[]>([]);
  const [stats, setStats] = useState<VpsStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<VpsPlan | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", dailyPrice: "", securityLevel: "", durationHours: "24", description: "" });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/staff/vps", { cache: "no-store" });
      const json = await res.json();
      if (json.success) { setPlans(json.plans); setStats(json.stats); } else setError(json.error);
    } catch {
      setError("No se pudo conectar con el servidor");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (loaded && canView) load(); else if (loaded) setLoading(false); }, [load, canView, loaded]);

  const toggle = async (id: string) => {
    try {
      const res = await fetch("/api/staff/vps", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "toggle", id }) });
      const data = await res.json();
      if (!data.success) toast.error(data.error || "No se pudo actualizar el plan");
      await load();
    } catch {
      toast.error("No se pudo conectar con el servidor");
    }
  };

  const openEdit = (plan: VpsPlan) => {
    setEditing(plan);
    setForm({ name: plan.name, dailyPrice: String(plan.dailyPrice), securityLevel: String(plan.securityLevel), durationHours: String(plan.durationHours || 24), description: plan.description });
  };

  const openCreate = () => {
    setShowCreate(true);
    setForm({ name: "", dailyPrice: "", securityLevel: "", durationHours: "24", description: "" });
  };

  const save = async () => {
    if (!form.name.trim() || !form.dailyPrice || !form.securityLevel || !form.durationHours) return;
    setSaving(true);
    try {
      const body = editing
        ? { action: "update", id: editing.id, name: form.name.trim(), dailyPrice: Number(form.dailyPrice), securityLevel: Number(form.securityLevel), durationHours: Number(form.durationHours), description: form.description.trim() }
        : { action: "create", name: form.name.trim(), dailyPrice: Number(form.dailyPrice), securityLevel: Number(form.securityLevel), durationHours: Number(form.durationHours), description: form.description.trim() };
      const res = await fetch("/api/staff/vps", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      if (data.success) { toast.success(editing ? "Plan actualizado" : "Plan creado"); setEditing(null); setShowCreate(false); }
      else toast.error(data.error || "No se pudo guardar el plan");
      await load();
    } catch {
      toast.error("No se pudo conectar con el servidor");
    } finally {
      setSaving(false);
    }
  };

  if (!loaded) return <LoadingBlock />;
  if (!canView) return <AccessDenied title="VPS Deep Web" />;
  if (loading && plans.length === 0) return <LoadingBlock />;
  if (error) return <ErrorBlock text={error} onRetry={load} />;

  return (
    <div>
      <PanelHeader
        title="VPS Deep Web"
        subtitle="Administra los planes de suscripción premium y consulta su uso real"
        action={
          canManage ? <Button icon={Plus} onClick={openCreate}>Nuevo plan</Button> : undefined
        }
      />

      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          <Kpi label="VPS activos" value={stats.activeCount} icon={ShieldCheck} tone="text-emerald-400" ring="bg-emerald-500/10 ring-1 ring-emerald-500/30" />
          <Kpi label="VPS expirados" value={stats.expiredCount} icon={Server} tone="text-rose-400" ring="bg-rose-500/10 ring-1 ring-rose-500/30" />
          <Kpi label="Vendidos en total" value={stats.totalSold} icon={DollarSign} tone="text-amber-400" ring="bg-amber-500/10 ring-1 ring-amber-500/30" />
          <Kpi label="Ingresos" value={`$${stats.revenue.toLocaleString('es-CO')}`} icon={DollarSign} tone="text-blue-400" ring="bg-blue-500/10 ring-1 ring-blue-500/30" />
          <Kpi label="Usuarios distintos" value={stats.activeUsers} icon={Users} tone="text-purple-400" ring="bg-purple-500/10 ring-1 ring-purple-500/30" />
          <Kpi label="Renovaciones" value={stats.renewals} icon={RefreshCw} tone="text-sky-400" ring="bg-sky-500/10 ring-1 ring-sky-500/30" />
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {plans.map((plan) => (
          <Card key={plan.id} className="p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                  <Server className="h-4 w-4 text-cyan-400" />
                </div>
                <div>
                  <div className="text-white font-semibold text-sm">{plan.name}</div>
                  <div className="text-slate-500 text-xs">{plan.securityLevel}% protección · {durationLabel(plan.durationHours || 24)}</div>
                </div>
              </div>
              {plan.enabled ? <Chip tone="emerald" label="Activo" /> : <Chip tone="slate" label="Desactivado" />}
            </div>
            <p className="text-slate-400 text-xs mb-3 line-clamp-2">{plan.description}</p>
            <div className="flex items-center justify-between pt-3 border-t border-[#1F2937]">
              <span className="text-lg font-bold text-white tabular-nums">${plan.dailyPrice.toLocaleString('es-CO')}<span className="text-xs text-slate-500 font-normal">/{durationLabel(plan.durationHours || 24)}</span></span>
              {canManage && (
                <div className="flex items-center gap-1.5">
                  <IconButton icon={Pencil} label="Editar" variant="secondary" size="sm" onClick={() => openEdit(plan)} />
                  <IconButton icon={Power} label={plan.enabled ? "Desactivar" : "Activar"} variant={plan.enabled ? "danger" : "success"} size="sm" onClick={() => toggle(plan.id)} />
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      {(editing || showCreate) && (
        <Modal
          title={editing ? "Editar plan" : "Nuevo plan de VPS"}
          onClose={() => { setEditing(null); setShowCreate(false); }}
          size="sm"
          footer={
            <>
              <Button variant="ghost" onClick={() => { setEditing(null); setShowCreate(false); }} disabled={saving}>Cancelar</Button>
              <Button onClick={save} loading={saving} disabled={!form.name.trim() || !form.dailyPrice || !form.securityLevel}>Guardar</Button>
            </>
          }
        >
          <div className="space-y-3">
            <TextInput value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nombre (ej. VPS Elite)" className="w-full" />
            <TextInput type="number" value={form.dailyPrice} onChange={(e) => setForm({ ...form, dailyPrice: e.target.value })} placeholder="Precio por período ($)" className="w-full" />
            <TextInput type="number" value={form.securityLevel} onChange={(e) => setForm({ ...form, securityLevel: e.target.value })} placeholder="Nivel de protección (0-100)" className="w-full" min={0} max={100} />
            <Select value={form.durationHours} onChange={(e) => setForm({ ...form, durationHours: e.target.value })} className="w-full">
              {DURATION_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </Select>
            <TextArea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Descripción..." rows={3} className="w-full" />
          </div>
        </Modal>
      )}
    </div>
  );
}
