"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Users, Ticket, Flag, ShieldCheck, Megaphone, Pin, Trash2, Plus, X,
  MessageSquare, UserCheck, Loader2, Gamepad2, WifiOff, Ban, Clock3, Fingerprint,
  Search, ScrollText,
} from "lucide-react";
import { Card, Kpi, ErrorBlock, PrimaryButton, TextInput, TextArea, Select, formatDate, Skeleton, SkeletonKpi, SkeletonRow, useToast } from "@/components/staff/ui";
import type { StaffIdentityView, StaffSection } from "@/lib/staffTypes";

interface Announcement {
  id: string; title: string; body: string; scope: string; pinned: boolean; author: string; createdAt: string;
}
interface AuditEntry {
  id: string; category: string; actor: string; target?: string; description: string; createdAt: string;
}
interface DashboardData {
  kpis: {
    registeredPlayers: number; ticketsOpen: number; reportsPending: number; whitelistPending: number;
    sanctionsActive: number; staffOnDuty: number; internalCasesOpen: number | null;
  };
  announcements: Announcement[];
  recentActivity: AuditEntry[];
  identity: StaffIdentityView | null;
}
interface ERLCPlayer { Player: string; Permission: string; Team: string }
interface ERLCData {
  configured: boolean; online?: boolean; error?: string; serverName?: string;
  currentPlayers?: number; maxPlayers?: number; players?: ERLCPlayer[];
}

const CATEGORY_TONE: Record<string, string> = {
  STAFF: "bg-purple-500/15 text-purple-300",
  WL: "bg-blue-500/15 text-blue-300",
  TICKET: "bg-sky-500/15 text-sky-300",
  SANCION: "bg-rose-500/15 text-rose-300",
  SYSTEM: "bg-slate-500/15 text-slate-300",
  TIENDA: "bg-emerald-500/15 text-emerald-300",
};

const SCOPES = ["GLOBAL", "Los Santos", "Liberty City", "Las Venturas"];

export default function OverviewPanel({ identity, onNavigate }: { identity: StaffIdentityView | null; onNavigate?: (section: StaffSection) => void }) {
  const toast = useToast();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", body: "", scope: "GLOBAL", pinned: true });
  const [saving, setSaving] = useState(false);
  const [erlc, setErlc] = useState<ERLCData | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/staff/dashboard", { cache: "no-store" });
      const json = await res.json();
      if (!json.success) { setError(json.error || "No se pudo cargar el panel"); return; }
      setData(json);
      setError(null);
    } catch {
      setError("No se pudo conectar con el servidor");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadErlc = useCallback(async () => {
    try {
      const res = await fetch("/api/staff/erlc-status", { cache: "no-store" });
      const json = await res.json();
      if (json.success) setErlc(json);
    } catch {
      // El widget en vivo simplemente no se muestra si falla la red.
    }
  }, []);

  useEffect(() => { load(); loadErlc(); const interval = setInterval(loadErlc, 30000); return () => clearInterval(interval); }, [load, loadErlc]);

  const publish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.body.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/staff/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Comunicado publicado");
        setForm({ title: "", body: "", scope: "GLOBAL", pinned: true });
        setShowForm(false);
        await load();
      } else {
        toast.error(json.error || "No se pudo publicar el comunicado");
      }
    } catch {
      toast.error("No se pudo conectar con el servidor");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    await fetch("/api/staff/announcements", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    toast.success("Comunicado eliminado");
    await load();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="w-44 h-7 mb-2" />
          <Skeleton className="w-60 h-4" />
        </div>
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 7 }).map((_, i) => <SkeletonKpi key={i} />)}
        </section>
        <section className="flex flex-wrap gap-2">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="w-32 h-9 rounded-lg" />)}
        </section>
        <section className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-3">
            <Skeleton className="w-48 h-5 mb-2" />
            {Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} />)}
          </div>
          <div className="space-y-6">
            <SkeletonRow />
            <SkeletonRow />
          </div>
        </section>
      </div>
    );
  }
  if (error || !data) return <ErrorBlock text={error || "Sin datos"} onRetry={load} />;

  const kpis = [
    { label: "Jugadores registrados", value: data.kpis.registeredPlayers, icon: Users, tone: "text-blue-400", ring: "bg-blue-500/10" },
    { label: "Tickets abiertos", value: data.kpis.ticketsOpen, icon: Ticket, tone: "text-sky-400", ring: "bg-sky-500/10" },
    { label: "Reportes pendientes", value: data.kpis.reportsPending, icon: Flag, tone: "text-rose-400", ring: "bg-rose-500/10" },
    { label: "Whitelist pendiente", value: data.kpis.whitelistPending, icon: ShieldCheck, tone: "text-amber-400", ring: "bg-amber-500/10" },
    { label: "Sanciones activas", value: data.kpis.sanctionsActive, icon: Ban, tone: "text-orange-400", ring: "bg-orange-500/10" },
    { label: "Personal en servicio", value: data.kpis.staffOnDuty, icon: Clock3, tone: "text-emerald-400", ring: "bg-emerald-500/10" },
    ...(data.kpis.internalCasesOpen !== null ? [{ label: "Casos internos abiertos", value: data.kpis.internalCasesOpen, icon: Fingerprint, tone: "text-purple-400", ring: "bg-purple-500/10" }] : []),
  ];

  const quickActions: { label: string; icon: typeof Search; section: StaffSection }[] = [
    { label: "Buscar jugador", icon: Search, section: "players" },
    { label: "Crear sanción", icon: Ban, section: "sanctions" },
    { label: "Revisar reportes", icon: Flag, section: "reports" },
    { label: "Revisar tickets", icon: Ticket, section: "tickets" },
    { label: "Revisar whitelist", icon: ShieldCheck, section: "whitelist" },
    { label: "Consultar logs", icon: ScrollText, section: "logs" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">Mission Control</h1>
            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-300 text-[11px] font-bold ring-1 ring-emerald-500/30">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
              </span>
              LIVE
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Bienvenido de vuelta, <span className="text-blue-400 font-medium">{identity?.name || "Staff"}</span>
          </p>
        </div>
      </div>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k) => <Kpi key={k.label} {...k} />)}
      </section>

      <section className="flex flex-wrap gap-2">
        {quickActions.map((a) => (
          <button
            key={a.label}
            type="button"
            onClick={() => onNavigate?.(a.section)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#111827] border border-[#1F2937] text-slate-300 text-sm hover:border-blue-500/40 hover:text-white transition"
          >
            <a.icon className="h-4 w-4 text-blue-400" /> {a.label}
          </button>
        ))}
      </section>

      <section className="grid lg:grid-cols-3 gap-6">
        {/* Comunicados de dirección */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-white font-semibold flex items-center gap-2">
              <Megaphone className="h-4 w-4 text-blue-400" /> Comunicados de Dirección
            </h2>
            <button
              type="button"
              onClick={() => setShowForm((v) => !v)}
              className="flex items-center gap-1.5 text-xs font-medium text-blue-400 hover:text-blue-300 transition"
            >
              {showForm ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
              {showForm ? "Cancelar" : "Nuevo comunicado"}
            </button>
          </div>

          {showForm && (
            <Card className="p-4">
              <form onSubmit={publish} className="space-y-3">
                <TextInput
                  placeholder="Título"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  className="w-full"
                  required
                />
                <TextArea
                  placeholder="Contenido del comunicado..."
                  rows={3}
                  value={form.body}
                  onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
                  className="w-full"
                  required
                />
                <div className="flex items-center gap-3">
                  <Select value={form.scope} onChange={(e) => setForm((f) => ({ ...f, scope: e.target.value }))}>
                    {SCOPES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </Select>
                  <label className="flex items-center gap-2 text-sm text-slate-400">
                    <input type="checkbox" checked={form.pinned} onChange={(e) => setForm((f) => ({ ...f, pinned: e.target.checked }))} />
                    Fijar arriba
                  </label>
                  <PrimaryButton type="submit" disabled={saving}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Publicar"}
                  </PrimaryButton>
                </div>
              </form>
            </Card>
          )}

          {data.announcements.length === 0 ? (
            <Card className="p-8 text-center text-sm text-slate-500">Todavía no hay comunicados publicados</Card>
          ) : (
            <div className="space-y-3">
              {data.announcements.map((a) => (
                <Card key={a.id} className="p-4 group">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#151C2A] text-slate-400 ring-1 ring-[#1F2937]">
                        {a.scope}
                      </span>
                      {a.pinned && (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/15 text-blue-300">
                          <Pin className="h-2.5 w-2.5" /> Fijado
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-[11px] text-slate-500">{formatDate(a.createdAt)}</span>
                      <button
                        type="button"
                        onClick={() => remove(a.id)}
                        className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-rose-400 transition"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <h3 className="text-white font-semibold mt-2">{a.title}</h3>
                  <p className="text-sm text-slate-400 mt-1 leading-relaxed">{a.body}</p>
                  <p className="text-xs text-slate-600 mt-2">— {a.author}</p>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Lateral: Staff Info + Actividad */}
        <div className="space-y-6">
          <Card className="p-4">
            <h2 className="text-white font-semibold mb-3 flex items-center gap-2">
              <Gamepad2 className="h-4 w-4 text-blue-400" /> Servidor en vivo (ER:LC)
            </h2>
            {!erlc || !erlc.configured ? (
              <p className="text-xs text-slate-500">No hay una Server-Key de ER:LC configurada (<code className="px-1 py-0.5 rounded bg-black/30 font-mono">ERLC_SERVER_API_KEY</code>).</p>
            ) : !erlc.online ? (
              <div className="flex items-center gap-2 text-xs text-rose-400">
                <WifiOff className="h-3.5 w-3.5" /> {erlc.error || "No se pudo contactar el servidor"}
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-white font-medium truncate">{erlc.serverName}</span>
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-300 text-[10px] font-bold ring-1 ring-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> ONLINE
                  </span>
                </div>
                <p className="text-2xl font-bold text-white tabular-nums">{erlc.currentPlayers}<span className="text-slate-500 text-sm font-normal"> / {erlc.maxPlayers}</span></p>
                <p className="text-[11px] text-slate-500 mb-2">jugadores en el servidor de Roblox ahora mismo</p>
                {erlc.players && erlc.players.length > 0 && (
                  <div className="max-h-32 overflow-y-auto space-y-1 pr-1 border-t border-[#1F2937] pt-2 mt-2">
                    {erlc.players.slice(0, 20).map((p) => (
                      <div key={p.Player} className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-300 truncate">{p.Player.split(":")[0]}</span>
                        <span className="text-slate-600">{p.Team}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </Card>

          <Card className="p-4">
            <h2 className="text-white font-semibold mb-3 flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-blue-400" /> Staff Info
            </h2>
            {identity ? (
              <div className="flex items-center gap-3">
                {identity.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={identity.avatar} alt={identity.name} className="w-11 h-11 rounded-full" />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                    {identity.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="text-white font-medium truncate">{identity.name}</div>
                  <div className="text-xs text-emerald-400 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Online
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500">Sin identificar</p>
            )}
            <div className="mt-3 pt-3 border-t border-[#1F2937]">
              <div className="text-[11px] text-slate-500 uppercase tracking-wide mb-1">
                {identity?.via === "discord" ? "Discord ID" : "Acceso"}
              </div>
              <div className="text-xs font-mono text-slate-400 break-all">
                {identity?.via === "discord" ? identity.id : "Contraseña de staff"}
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <h2 className="text-white font-semibold mb-3 flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-blue-400" /> Actividad Reciente
            </h2>
            {data.recentActivity.length === 0 ? (
              <p className="text-sm text-slate-500">Sin actividad todavía</p>
            ) : (
              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                {data.recentActivity.map((entry) => (
                  <div key={entry.id} className="flex items-start gap-2.5">
                    <span className={`mt-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold flex-shrink-0 ${CATEGORY_TONE[entry.category] || "bg-slate-500/15 text-slate-300"}`}>
                      {entry.category}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs text-slate-300 leading-snug">{entry.description}</p>
                      <p className="text-[10px] text-slate-600 mt-0.5">{formatDate(entry.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </section>
    </div>
  );
}
