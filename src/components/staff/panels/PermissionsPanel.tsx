"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Trash2, UserPlus, Clock, Lock, Search } from "lucide-react";
import { PanelHeader, Card, Chip, TextInput, TextArea, Select, Button, IconButton, Modal, LoadingBlock, EmptyState, formatDate, useStaffPermissions, useToast } from "@/components/staff/ui";

interface Role {
  id: string; key: string; name: string; category: string; hierarchy: number; scope: string;
  department?: string; permissions: string[]; color: string; updatedAt: string;
}
interface Assignment { id: string; discordId: string; staffName: string; roleId: string; roleName: string; assignedBy: string; assignedAt: string }
interface Exception { id: string; discordId: string; staffName: string; permissionKey: string; reason: string; grantedBy: string; grantedAt: string; expiresAt?: string; revokedAt?: string }
interface PermissionDef { key: string; module: string; label: string; sensitive?: boolean }

const SCOPE_LABEL: Record<string, string> = {
  global: "Global", los_santos: "Los Santos", liberty_city: "Liberty City", vice_city: "Vice City", las_venturas: "Las Venturas",
  development: "Desarrollo", community: "Comunidad", finance: "Finanzas", legal_factions: "Facciones legales", illegal_factions: "Facciones ilegales",
};
const MODULE_LABEL: Record<string, string> = {
  dashboard: "Dashboard", players: "Jugadores", sanctions: "Sanciones", reports: "Reportes", logs: "Logs", tickets: "Tickets",
  whitelist: "Whitelist", stats: "Estadísticas", hubcareer: "Corporativo / HubCareer", internal_affairs: "Asuntos Internos",
  shift: "Mi Turno", absences: "Mis Ausencias", system_modules: "Módulos del Sistema", development: "Desarrollo",
  hubsocial: "HubSocial", factions: "Facciones Legales", gangs: "Facciones Ilegales / Bandas", economy: "Economía",
  staff: "Staff / RRHH", permissions: "Motor de Permisos",
};

// Catálogo replicado en el cliente (misma fuente que src/lib/permissions/catalog.ts) para pintar la matriz sin otro round-trip.
const PERMISSIONS: PermissionDef[] = [
  { key: "dashboard.view", module: "dashboard", label: "Ver Dashboard" },
  { key: "players.view", module: "players", label: "Ver jugadores" },
  { key: "players.search", module: "players", label: "Buscar jugadores" },
  { key: "players.profile.view", module: "players", label: "Ver perfil completo" },
  { key: "players.economy.view", module: "players", label: "Ver economía del jugador", sensitive: true },
  { key: "players.economy.edit", module: "players", label: "Modificar economía del jugador", sensitive: true },
  { key: "players.inventory.view", module: "players", label: "Ver inventario" },
  { key: "players.inventory.edit", module: "players", label: "Modificar inventario" },
  { key: "players.vehicles.view", module: "players", label: "Ver vehículos" },
  { key: "players.properties.view", module: "players", label: "Ver propiedades" },
  { key: "players.warn", module: "players", label: "Advertir jugador" },
  { key: "players.kick", module: "players", label: "Expulsar jugador" },
  { key: "players.ban", module: "players", label: "Banear jugador", sensitive: true },
  { key: "players.unban", module: "players", label: "Desbanear jugador", sensitive: true },
  { key: "sanctions.view", module: "sanctions", label: "Ver sanciones" },
  { key: "sanctions.manage", module: "sanctions", label: "Aplicar / revocar sanciones" },
  { key: "reports.view", module: "reports", label: "Ver reportes" },
  { key: "reports.manage", module: "reports", label: "Gestionar reportes" },
  { key: "logs.view", module: "logs", label: "Ver logs" },
  { key: "logs.technical.view", module: "logs", label: "Ver logs técnicos", sensitive: true },
  { key: "tickets.view", module: "tickets", label: "Ver tickets" },
  { key: "tickets.manage", module: "tickets", label: "Gestionar tickets" },
  { key: "whitelist.view", module: "whitelist", label: "Ver solicitudes de whitelist" },
  { key: "whitelist.interview", module: "whitelist", label: "Realizar entrevistas" },
  { key: "whitelist.manage", module: "whitelist", label: "Aprobar / rechazar solicitudes" },
  { key: "stats.view", module: "stats", label: "Ver estadísticas" },
  { key: "hubcareer.view", module: "hubcareer", label: "Ver HubCareer / empresas" },
  { key: "hubcareer.manage", module: "hubcareer", label: "Administrar empresas y HubCareer" },
  { key: "internal_affairs.view", module: "internal_affairs", label: "Ver Asuntos Internos", sensitive: true },
  { key: "internal_affairs.manage", module: "internal_affairs", label: "Gestionar casos internos", sensitive: true },
  { key: "shift.use", module: "shift", label: "Usar Mi Turno" },
  { key: "absences.request", module: "absences", label: "Solicitar ausencia propia" },
  { key: "absences.manage", module: "absences", label: "Aprobar / rechazar ausencias del Staff" },
  { key: "system_modules.view", module: "system_modules", label: "Ver módulos del sistema" },
  { key: "system_modules.manage", module: "system_modules", label: "Administrar módulos del sistema" },
  { key: "dev.tools.access", module: "development", label: "Acceder a herramientas de desarrollo" },
  { key: "hubsocial.view", module: "hubsocial", label: "Ver HubSocial" },
  { key: "hubsocial.moderate", module: "hubsocial", label: "Moderar HubSocial" },
  { key: "factions.view", module: "factions", label: "Ver facciones legales" },
  { key: "factions.manage", module: "factions", label: "Administrar facciones legales" },
  { key: "factions.audit.view", module: "factions", label: "Ver auditoría de facciones" },
  { key: "factions.investigate", module: "factions", label: "Gestionar investigaciones" },
  { key: "gangs.view", module: "gangs", label: "Ver bandas" },
  { key: "gangs.manage", module: "gangs", label: "Administrar bandas y sanciones" },
  { key: "economy.view", module: "economy", label: "Ver economía del servidor", sensitive: true },
  { key: "economy.manage", module: "economy", label: "Administrar economía del servidor", sensitive: true },
  { key: "staff.view", module: "staff", label: "Ver directorio de Staff" },
  { key: "staff.hr.manage", module: "staff", label: "Gestionar personal (RRHH)", sensitive: true },
  { key: "staff.training.manage", module: "staff", label: "Gestionar formación / entrevistas internas" },
  { key: "staff.activity.review", module: "staff", label: "Supervisar actividad del Staff" },
  { key: "permissions.manage", module: "permissions", label: "Administrar rangos, permisos y jerarquía", sensitive: true },
];

const PERMISSIONS_BY_MODULE = PERMISSIONS.reduce<Record<string, PermissionDef[]>>((acc, p) => {
  (acc[p.module] ||= []).push(p);
  return acc;
}, {});

export default function PermissionsPanel() {
  const toast = useToast();
  const { has, loaded } = useStaffPermissions();
  const isCEO = has("permissions.manage");
  const [tab, setTab] = useState<"roles" | "assignments" | "exceptions">("roles");
  const [roles, setRoles] = useState<Role[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [exceptions, setExceptions] = useState<Exception[]>([]);
  const [loading, setLoading] = useState(true);
  const [openRoleId, setOpenRoleId] = useState<string | null>(null);
  const [showCreateRole, setShowCreateRole] = useState(false);
  const [showAssign, setShowAssign] = useState(false);
  const [showException, setShowException] = useState(false);
  const [roleSearch, setRoleSearch] = useState("");

  const load = useCallback(async () => {
    const [r, a, e] = await Promise.all([
      fetch("/api/staff/permissions/roles", { cache: "no-store" }).then((x) => x.json()),
      fetch("/api/staff/permissions/assignments", { cache: "no-store" }).then((x) => x.json()),
      fetch("/api/staff/permissions/exceptions", { cache: "no-store" }).then((x) => x.json()),
    ]);
    if (r.success) setRoles(r.roles);
    if (a.success) setAssignments(a.assignments);
    if (e.success) setExceptions(e.exceptions);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const roleById = useMemo(() => new Map(roles.map((r) => [r.id, r])), [roles]);
  const categories = useMemo(() => Array.from(new Set(roles.map((r) => r.category))), [roles]);
  const openRole = openRoleId ? roleById.get(openRoleId) : null;

  if (loading || !loaded) return <LoadingBlock />;

  return (
    <div>
      <PanelHeader
        title="Gestor de Permisos"
        subtitle="Motor de rangos, jerarquía y permisos granulares del Panel Staff"
        action={!isCEO ? <Chip tone="amber" label="Modo solo lectura" /> : undefined}
      />

      {!isCEO && (
        <Card className="p-3 mb-4 bg-amber-500/5 border-amber-500/20 flex items-center gap-2">
          <Lock className="h-4 w-4 text-amber-400 flex-shrink-0" />
          <p className="text-amber-200 text-xs">Estás viendo la estructura de rangos y permisos, pero solo quien tiene <code className="px-1 py-0.5 rounded bg-black/30 font-mono">permissions.manage</code> puede modificarla.</p>
        </Card>
      )}

      <div className="flex gap-1 mb-4 border-b border-[#1F2937]">
        {(["roles", "assignments", "exceptions"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-3 py-2 text-sm font-medium border-b-2 transition ${tab === t ? "border-blue-500 text-white" : "border-transparent text-slate-500 hover:text-slate-300"}`}>
            {t === "roles" ? `Rangos (${roles.length})` : t === "assignments" ? `Asignaciones (${assignments.length})` : `Excepciones (${exceptions.filter((e) => !e.revokedAt).length})`}
          </button>
        ))}
      </div>

      {tab === "roles" && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
              <TextInput value={roleSearch} onChange={(e) => setRoleSearch(e.target.value)} placeholder="Buscar rango..." className="pl-9 h-9 text-xs w-full" />
            </div>
            {isCEO && (
              <Button size="sm" icon={Plus} onClick={() => setShowCreateRole(true)} className="flex-shrink-0">Crear rango</Button>
            )}
          </div>
          {(() => {
            const query = roleSearch.trim().toLowerCase();
            const visibleCategories = categories
              .map((cat) => ({ cat, roles: roles.filter((r) => r.category === cat && (!query || r.name.toLowerCase().includes(query))).sort((a, b) => b.hierarchy - a.hierarchy) }))
              .filter((c) => c.roles.length > 0);
            if (query && visibleCategories.length === 0) return <EmptyState icon={Search} text="Sin resultados" description={`Ningún rango coincide con "${roleSearch.trim()}"`} />;
            return (
              <div className="space-y-5">
                {visibleCategories.map(({ cat, roles: catRoles }) => (
                  <div key={cat}>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">{cat}</p>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-2">
                      {catRoles.map((r) => (
                        <Card key={r.id} className="p-3 cursor-pointer hover:border-blue-500/30 transition" onClick={() => setOpenRoleId(r.id)}>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: r.color }} />
                            <span className="text-white text-sm font-medium truncate">{r.name}</span>
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-slate-500">
                            <span>Jerarquía {r.hierarchy}</span>
                            <span>{r.permissions.includes("*") ? "Todos los permisos" : `${r.permissions.length} permisos`}</span>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      )}

      {tab === "assignments" && (
        <div>
          {isCEO && (
            <Button size="sm" icon={UserPlus} onClick={() => setShowAssign(true)} className="mb-4">Asignar rango</Button>
          )}
          {assignments.length === 0 ? <EmptyState icon={UserPlus} text="Nadie tiene un rango asignado todavía" /> : (
            <div className="space-y-1.5">
              {assignments.map((a) => (
                <Card key={a.id} className="p-3 flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <p className="text-white text-sm">{a.staffName} <span className="text-slate-600 text-xs font-mono">({a.discordId})</span></p>
                    <p className="text-slate-500 text-xs">{a.roleName} · asignado por {a.assignedBy} · {formatDate(a.assignedAt)}</p>
                  </div>
                  {isCEO && (
                    <Button variant="danger" size="sm" icon={Trash2} onClick={async () => {
                      try {
                        const res = await fetch(`/api/staff/permissions/assignments?discordId=${a.discordId}`, { method: "DELETE" });
                        const data = await res.json();
                        if (data.success) toast.success("Rango retirado");
                        else toast.error(data.error || "No se pudo retirar el rango");
                      } catch {
                        toast.error("No se pudo conectar con el servidor");
                      }
                      load();
                    }}>Quitar</Button>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "exceptions" && (
        <div>
          {isCEO && (
            <Button size="sm" icon={Clock} onClick={() => setShowException(true)} className="mb-4">Otorgar excepción</Button>
          )}
          {exceptions.length === 0 ? <EmptyState icon={Clock} text="No hay permisos individuales otorgados" /> : (
            <div className="space-y-1.5">
              {exceptions.map((e) => {
                const expired = e.expiresAt && new Date(e.expiresAt) < new Date();
                const inactive = Boolean(e.revokedAt) || expired;
                return (
                  <Card key={e.id} className={`p-3 flex items-center justify-between gap-3 flex-wrap ${inactive ? "opacity-50" : ""}`}>
                    <div>
                      <p className="text-white text-sm">{e.staffName} <span className="text-slate-500 font-mono text-xs">· {e.permissionKey}</span></p>
                      <p className="text-slate-500 text-xs">{e.reason} — otorgado por {e.grantedBy} · {formatDate(e.grantedAt)}</p>
                      {e.expiresAt && <p className="text-slate-600 text-[11px]">{expired ? "Expiró" : "Expira"} {formatDate(e.expiresAt)}</p>}
                      {e.revokedAt && <p className="text-rose-400 text-[11px]">Revocado {formatDate(e.revokedAt)}</p>}
                    </div>
                    {isCEO && !inactive && (
                      <Button variant="danger" size="sm" icon={Trash2} onClick={async () => {
                        try {
                          const res = await fetch(`/api/staff/permissions/exceptions?id=${e.id}`, { method: "DELETE" });
                          const data = await res.json();
                          if (data.success) toast.success("Excepción revocada");
                          else toast.error(data.error || "No se pudo revocar la excepción");
                        } catch {
                          toast.error("No se pudo conectar con el servidor");
                        }
                        load();
                      }}>Revocar</Button>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {openRole && <RoleDetailModal role={openRole} isCEO={isCEO} onClose={() => setOpenRoleId(null)} onChanged={load} />}
      {showCreateRole && <CreateRoleModal onClose={() => setShowCreateRole(false)} onCreated={() => { setShowCreateRole(false); load(); }} />}
      {showAssign && <AssignRoleModal roles={roles} onClose={() => setShowAssign(false)} onAssigned={() => { setShowAssign(false); load(); }} />}
      {showException && <GrantExceptionModal onClose={() => setShowException(false)} onGranted={() => { setShowException(false); load(); }} />}
    </div>
  );
}

function RoleDetailModal({ role, isCEO, onClose, onChanged }: { role: Role; isCEO: boolean; onClose: () => void; onChanged: () => void }) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [permSearch, setPermSearch] = useState("");
  const isAbsolute = role.permissions.includes("*");
  const enabledCount = role.permissions.length;
  const totalCount = PERMISSIONS.length;

  const query = permSearch.trim().toLowerCase();
  const filteredModules = Object.entries(PERMISSIONS_BY_MODULE)
    .map(([mod, perms]) => [mod, query ? perms.filter((p) => p.label.toLowerCase().includes(query) || p.key.toLowerCase().includes(query)) : perms] as const)
    .filter(([, perms]) => perms.length > 0);

  const toggle = async (key: string, enabled: boolean) => {
    setBusy(true);
    try {
      const res = await fetch("/api/staff/permissions/roles", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ roleId: role.id, togglePermission: { key, enabled } }) });
      const data = await res.json();
      if (!data.success) toast.error(data.error || "No se pudo actualizar el permiso");
      await onChanged();
    } catch {
      toast.error("No se pudo conectar con el servidor");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      title={role.name}
      description={`${role.category} · Jerarquía ${role.hierarchy} · Scope: ${SCOPE_LABEL[role.scope] || role.scope}${role.department ? ` · ${role.department}` : ""}`}
      onClose={onClose}
      size="lg"
    >
        {isAbsolute ? (
          <Card className="p-4 bg-amber-500/5 border-amber-500/20 text-center">
            <p className="text-amber-300 text-sm font-semibold">Control absoluto</p>
            <p className="text-slate-400 text-xs mt-1">Este rango tiene todos los permisos del sistema, incluidos los que se agreguen en el futuro. No puede editarse.</p>
          </Card>
        ) : (
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                <TextInput value={permSearch} onChange={(e) => setPermSearch(e.target.value)} placeholder="Buscar permiso por nombre o clave..." className="pl-9 h-9 text-xs w-full" />
              </div>
              <span className="text-[11px] text-slate-500 flex-shrink-0 tabular-nums">{enabledCount} / {totalCount} habilitados</span>
            </div>
            <div className="flex items-center gap-3 mb-3 text-[10px] text-slate-500">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" /> Permitido</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#293241]" /> Denegado</span>
              <span className="flex items-center gap-1"><span className="text-[9px] px-1 py-0.5 rounded bg-rose-500/15 text-rose-300">sensible</span> requiere especial cuidado</span>
            </div>

            {filteredModules.length === 0 ? (
              <EmptyState icon={Search} text="Sin resultados" description={`Ningún permiso coincide con "${permSearch.trim()}"`} />
            ) : (
              <div className="space-y-4 max-h-[50vh] overflow-y-auto custom-scrollbar pr-1">
                {filteredModules.map(([mod, perms]) => (
                  <div key={mod}>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">{MODULE_LABEL[mod] || mod}</p>
                    <div className="space-y-1">
                      {perms.map((p) => {
                        const enabled = role.permissions.includes(p.key);
                        return (
                          <label key={p.key} className={`flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg text-sm transition ${enabled ? "bg-blue-500/5" : "hover:bg-white/[0.02]"}`}>
                            <span className={`flex items-center gap-1.5 ${enabled ? "text-white" : "text-slate-500"}`}>
                              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${enabled ? "bg-blue-500" : "bg-[#293241]"}`} />
                              {p.label}
                              {p.sensitive && <span className="text-[9px] px-1 py-0.5 rounded bg-rose-500/15 text-rose-300">sensible</span>}
                            </span>
                            <input type="checkbox" checked={enabled} disabled={!isCEO || busy} onChange={(e) => toggle(p.key, e.target.checked)} className="w-4 h-4 accent-blue-600" />
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
    </Modal>
  );
}

function CreateRoleModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const toast = useToast();
  const [form, setForm] = useState({ name: "", category: "", hierarchy: 100, scope: "global", department: "", color: "#64748b" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!form.name.trim() || !form.category.trim()) return;
    setSaving(true); setError("");
    try {
      const res = await fetch("/api/staff/permissions/roles", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const data = await res.json();
      if (!data.success) { setError(data.error || "No se pudo crear"); toast.error(data.error || "No se pudo crear el rango"); return; }
      toast.success("Rango creado");
      onCreated();
    } catch {
      toast.error("No se pudo conectar con el servidor");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title="Crear rango"
      onClose={onClose}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button onClick={submit} loading={saving} disabled={!form.name.trim() || !form.category.trim()}>Crear</Button>
        </>
      }
    >
        <div className="space-y-3">
          <TextInput placeholder="Nombre del rango" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full" />
          <TextInput placeholder="Categoría" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full" />
          <div className="grid grid-cols-2 gap-2">
            <TextInput type="number" placeholder="Jerarquía" value={form.hierarchy} onChange={(e) => setForm({ ...form, hierarchy: Number(e.target.value) })} />
            <input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="h-10 w-full rounded-lg bg-[#0B0F17] border border-[#1F2937]" />
          </div>
          <Select value={form.scope} onChange={(e) => setForm({ ...form, scope: e.target.value })} className="w-full">
            {Object.entries(SCOPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </Select>
          <TextInput placeholder="Departamento (opcional)" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} className="w-full" />
          {error && <p className="text-rose-400 text-xs">{error}</p>}
        </div>
    </Modal>
  );
}

function AssignRoleModal({ roles, onClose, onAssigned }: { roles: Role[]; onClose: () => void; onAssigned: () => void }) {
  const toast = useToast();
  const [form, setForm] = useState({ discordId: "", staffName: "", roleId: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!form.discordId.trim() || !form.staffName.trim() || !form.roleId) return;
    setSaving(true); setError("");
    try {
      const res = await fetch("/api/staff/permissions/assignments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const data = await res.json();
      if (!data.success) { setError(data.error || "No se pudo asignar"); toast.error(data.error || "No se pudo asignar el rango"); return; }
      toast.success("Rango asignado");
      onAssigned();
    } catch {
      toast.error("No se pudo conectar con el servidor");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title="Asignar rango"
      onClose={onClose}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button onClick={submit} loading={saving} disabled={!form.discordId.trim() || !form.staffName.trim() || !form.roleId}>Asignar</Button>
        </>
      }
    >
        <div className="space-y-3">
          <TextInput placeholder="Discord ID" value={form.discordId} onChange={(e) => setForm({ ...form, discordId: e.target.value })} className="w-full" />
          <TextInput placeholder="Nombre visible" value={form.staffName} onChange={(e) => setForm({ ...form, staffName: e.target.value })} className="w-full" />
          <Select value={form.roleId} onChange={(e) => setForm({ ...form, roleId: e.target.value })} className="w-full">
            <option value="">Rango...</option>
            {roles.sort((a, b) => b.hierarchy - a.hierarchy).map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </Select>
          {error && <p className="text-rose-400 text-xs">{error}</p>}
        </div>
    </Modal>
  );
}

function GrantExceptionModal({ onClose, onGranted }: { onClose: () => void; onGranted: () => void }) {
  const toast = useToast();
  const [form, setForm] = useState({ discordId: "", staffName: "", permissionKey: PERMISSIONS[0].key, reason: "", expiresInHours: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!form.discordId.trim() || !form.staffName.trim() || !form.reason.trim()) return;
    setSaving(true); setError("");
    try {
      const res = await fetch("/api/staff/permissions/exceptions", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, expiresInHours: form.expiresInHours ? Number(form.expiresInHours) : undefined }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.error || "No se pudo otorgar"); toast.error(data.error || "No se pudo otorgar el permiso"); return; }
      toast.success("Permiso individual otorgado");
      onGranted();
    } catch {
      toast.error("No se pudo conectar con el servidor");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title="Otorgar permiso individual"
      onClose={onClose}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button onClick={submit} loading={saving} disabled={!form.discordId.trim() || !form.staffName.trim() || !form.reason.trim()}>Otorgar</Button>
        </>
      }
    >
        <div className="space-y-3">
          <TextInput placeholder="Discord ID" value={form.discordId} onChange={(e) => setForm({ ...form, discordId: e.target.value })} className="w-full" />
          <TextInput placeholder="Nombre visible" value={form.staffName} onChange={(e) => setForm({ ...form, staffName: e.target.value })} className="w-full" />
          <Select value={form.permissionKey} onChange={(e) => setForm({ ...form, permissionKey: e.target.value })} className="w-full">
            {PERMISSIONS.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
          </Select>
          <TextArea placeholder="Motivo" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} rows={2} className="w-full" />
          <TextInput type="number" placeholder="Duración en horas (vacío = sin vencimiento)" value={form.expiresInHours} onChange={(e) => setForm({ ...form, expiresInHours: e.target.value })} className="w-full" />
          {error && <p className="text-rose-400 text-xs">{error}</p>}
        </div>
    </Modal>
  );
}
