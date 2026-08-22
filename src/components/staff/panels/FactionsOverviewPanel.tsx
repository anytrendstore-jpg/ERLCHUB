"use client";

import { useCallback, useEffect, useState } from "react";
import { Building2, Plus, Users, Wallet, ShieldCheck } from "lucide-react";
import { PanelHeader, Card, Kpi, Chip, TextInput, TextArea, Select, Button, Modal, LoadingBlock, EmptyState, formatDate, useStaffPermissions, useToast } from "@/components/staff/ui";

type FactionStatus = "operational" | "reduced" | "review" | "suspended" | "inactive";

interface Rank { id: string; name: string; level: number; permissions: string[]; salary: number }
interface Member { playerId?: string; playerName: string; rankId: string; status: "active" | "inactive"; joinedAt: string }
interface Faction {
  id: string; name: string; abbreviation: string; description?: string; status: FactionStatus;
  directorName?: string; subdirectorName?: string; ranks: Rank[]; members: Member[]; budget: number;
  createdAt: string; updatedAt: string;
}
interface Transaction { id: string; type: string; amount: number; responsible: string; reason: string; createdAt: string }

const STATUS_LABEL: Record<FactionStatus, string> = { operational: "Operativa", reduced: "Actividad reducida", review: "En revisión", suspended: "Suspendida", inactive: "Inactiva" };
const STATUS_TONE: Record<FactionStatus, "emerald" | "blue" | "amber" | "rose" | "slate"> = { operational: "emerald", reduced: "blue", review: "amber", suspended: "rose", inactive: "slate" };

export default function FactionsOverviewPanel(_props: { isDirector: boolean }) {
  const { has } = useStaffPermissions();
  const canManage = has("factions.manage");
  const [factions, setFactions] = useState<Faction[]>([]);
  const [stats, setStats] = useState({ totalFactions: 0, operational: 0, totalMembers: 0, totalBudget: 0 });
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/staff/factions", { cache: "no-store" });
    const data = await res.json();
    if (data.success) { setFactions(data.factions); setStats(data.stats); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <LoadingBlock />;

  return (
    <div>
      <PanelHeader
        title="Facciones Legales — Vista General"
        subtitle="Policía, EMS, bomberos y demás organizaciones legales del servidor"
        action={canManage ? <Button icon={Plus} onClick={() => setShowCreate(true)}>Nueva facción</Button> : undefined}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Kpi label="Facciones" value={stats.totalFactions} icon={Building2} tone="text-blue-400" ring="bg-blue-500/10 ring-1 ring-blue-500/20" />
        <Kpi label="Operativas" value={stats.operational} icon={ShieldCheck} tone="text-emerald-400" ring="bg-emerald-500/10 ring-1 ring-emerald-500/20" />
        <Kpi label="Miembros activos" value={stats.totalMembers} icon={Users} tone="text-sky-400" ring="bg-sky-500/10 ring-1 ring-sky-500/20" />
        <Kpi label="Presupuesto total" value={`$${stats.totalBudget.toLocaleString()}`} icon={Wallet} tone="text-amber-400" ring="bg-amber-500/10 ring-1 ring-amber-500/20" />
      </div>

      {factions.length === 0 ? (
        <EmptyState icon={Building2} text="No hay facciones legales registradas todavía" />
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {factions.map((f) => (
            <Card key={f.id} className="p-4 cursor-pointer hover:border-blue-500/30 transition" onClick={() => setOpenId(f.id)}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="text-white font-semibold">{f.name}</h3>
                  <p className="text-slate-500 text-xs font-mono">{f.abbreviation}</p>
                </div>
                <Chip tone={STATUS_TONE[f.status]} label={STATUS_LABEL[f.status]} />
              </div>
              <p className="text-slate-400 text-xs mb-3">{f.directorName ? `Director: ${f.directorName}` : "Sin director asignado"}</p>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {f.members.filter((m) => m.status === "active").length} miembros</span>
                <span className="text-slate-400">${f.budget.toLocaleString()}</span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {showCreate && <CreateFactionModal onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); load(); }} />}
      {openId && <FactionDetailModal factionId={openId} isDirector={canManage} onClose={() => setOpenId(null)} onChanged={load} />}
    </div>
  );
}

function CreateFactionModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const toast = useToast();
  const [form, setForm] = useState({ name: "", abbreviation: "", description: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!form.name.trim() || !form.abbreviation.trim()) return;
    setSaving(true); setError("");
    try {
      const res = await fetch("/api/staff/factions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const data = await res.json();
      if (!data.success) { setError(data.error || "No se pudo crear"); toast.error(data.error || "No se pudo crear la facción"); return; }
      toast.success("Facción creada");
      onCreated();
    } catch {
      toast.error("No se pudo conectar con el servidor");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title="Nueva facción legal"
      onClose={onClose}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button onClick={submit} loading={saving} disabled={!form.name.trim() || !form.abbreviation.trim()}>Crear</Button>
        </>
      }
    >
      <div className="space-y-3">
        <TextInput placeholder="Nombre (ej. Policía de Los Santos)" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full" />
        <TextInput placeholder="Abreviatura (ej. LSPD)" value={form.abbreviation} onChange={(e) => setForm({ ...form, abbreviation: e.target.value })} className="w-full" />
        <TextArea placeholder="Descripción (opcional)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="w-full" />
        {error && <p className="text-rose-400 text-xs">{error}</p>}
      </div>
    </Modal>
  );
}

const FACTION_ACTION_MESSAGE: Record<string, string> = {
  change_status: "Estado actualizado", transfer_director: "Director actualizado", add_member: "Miembro añadido",
  change_member_rank: "Rango actualizado", remove_member: "Miembro removido", add_rank: "Rango creado",
  delete_rank: "Rango eliminado", add_transaction: "Movimiento registrado",
};

function FactionDetailModal({ factionId, isDirector, onClose, onChanged }: { factionId: string; isDirector: boolean; onClose: () => void; onChanged: () => void }) {
  const toast = useToast();
  const [faction, setFaction] = useState<Faction | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [tab, setTab] = useState<"info" | "members" | "ranks" | "finance">("info");
  const [busy, setBusy] = useState(false);
  const [memberForm, setMemberForm] = useState({ playerId: "", playerName: "", rankId: "" });
  const [rankForm, setRankForm] = useState({ name: "", level: 1, salary: 0 });
  const [txForm, setTxForm] = useState({ txType: "income", amount: "", reason: "" });

  const load = useCallback(async () => {
    const res = await fetch(`/api/staff/factions?id=${factionId}`, { cache: "no-store" });
    const data = await res.json();
    if (data.success) { setFaction(data.faction); setTransactions(data.transactions); }
  }, [factionId]);

  useEffect(() => { load(); }, [load]);

  const act = async (payload: Record<string, unknown>) => {
    setBusy(true);
    try {
      const res = await fetch("/api/staff/factions", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ factionId, ...payload }) });
      const data = await res.json();
      const action = payload.action as string;
      if (data.success) toast.success(FACTION_ACTION_MESSAGE[action] || "Facción actualizada");
      else toast.error(data.error || "No se pudo completar la acción");
      await load();
      onChanged();
    } catch {
      toast.error("No se pudo conectar con el servidor");
    } finally {
      setBusy(false);
    }
  };

  if (!faction) return null;

  return (
    <Modal
      title={`${faction.name} (${faction.abbreviation})`}
      description={faction.description || "Sin descripción"}
      onClose={onClose}
      size="lg"
    >
        {isDirector && (
          <div className="flex items-center gap-2 mb-4">
            <Select value={faction.status} onChange={(e) => act({ action: "change_status", status: e.target.value })} disabled={busy}>
              {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </Select>
            <Chip tone={STATUS_TONE[faction.status]} label={STATUS_LABEL[faction.status]} />
          </div>
        )}

        <div className="flex gap-1 mb-4 border-b border-[#1F2937] overflow-x-auto">
          {(["info", "members", "ranks", "finance"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`px-3 py-2 text-sm font-medium border-b-2 whitespace-nowrap transition ${tab === t ? "border-blue-500 text-white" : "border-transparent text-slate-500 hover:text-slate-300"}`}>
              {t === "info" ? "Info" : t === "members" ? `Miembros (${faction.members.length})` : t === "ranks" ? `Rangos (${faction.ranks.length})` : "Finanzas"}
            </button>
          ))}
        </div>

        {tab === "info" && (
          <div className="space-y-3">
            <Card className="p-3"><p className="text-slate-500 text-xs mb-1">Director</p><p className="text-white text-sm">{faction.directorName || "No registrado"}</p></Card>
            <Card className="p-3"><p className="text-slate-500 text-xs mb-1">Subdirector</p><p className="text-white text-sm">{faction.subdirectorName || "No registrado"}</p></Card>
            {isDirector && (
              <div className="flex gap-2">
                <TextInput placeholder="Nuevo director" onKeyDown={(e) => { if (e.key === "Enter") act({ action: "transfer_director", directorName: (e.target as HTMLInputElement).value }); }} className="flex-1" />
              </div>
            )}
            <p className="text-slate-600 text-xs">Creada {formatDate(faction.createdAt)} · Actualizada {formatDate(faction.updatedAt)}</p>
          </div>
        )}

        {tab === "members" && (
          <div className="space-y-3">
            {isDirector && (
              <div className="flex gap-2 flex-wrap">
                <TextInput placeholder="Nombre del jugador" value={memberForm.playerName} onChange={(e) => setMemberForm({ ...memberForm, playerName: e.target.value })} className="flex-1 min-w-[140px]" />
                <TextInput placeholder="ID de Discord (opcional)" value={memberForm.playerId} onChange={(e) => setMemberForm({ ...memberForm, playerId: e.target.value.trim() })} className="flex-1 min-w-[140px]" />
                <Select value={memberForm.rankId} onChange={(e) => setMemberForm({ ...memberForm, rankId: e.target.value })}>
                  <option value="">Rango...</option>
                  {faction.ranks.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                </Select>
                <Button disabled={busy || !memberForm.playerName.trim() || !memberForm.rankId} onClick={async () => { await act({ action: "add_member", ...memberForm, playerId: memberForm.playerId || undefined }); setMemberForm({ playerId: "", playerName: "", rankId: "" }); }}>Añadir</Button>
              </div>
            )}
            {isDirector && (
              <p className="text-slate-600 text-xs -mt-1">El ID de Discord es lo que habilita a este miembro a entrar a la terminal institucional del departamento — sin él, queda solo como registro de nómina.</p>
            )}
            {faction.members.length === 0 ? <p className="text-slate-500 text-sm">Sin miembros registrados.</p> : (
              <div className="space-y-1.5">
                {faction.members.map((m) => (
                  <div key={m.playerName} className="flex items-center justify-between px-3 py-2 rounded-lg bg-[#0B0F17] border border-[#1F2937]">
                    <div className="flex items-center gap-2">
                      <span className="text-white text-sm">{m.playerName}</span>
                      {m.playerId ? (
                        <span className="text-emerald-400 text-[10px] font-mono" title={`Vinculado a Discord ID ${m.playerId}`}>● vinculado</span>
                      ) : (
                        <span className="text-slate-600 text-[10px]" title="Sin ID de Discord: no puede entrar a la terminal">○ sin vincular</span>
                      )}
                    </div>
                    {isDirector ? (
                      <div className="flex items-center gap-2">
                        <Select value={m.rankId} onChange={(e) => act({ action: "change_member_rank", playerName: m.playerName, rankId: e.target.value })} className="h-8 text-xs">
                          {faction.ranks.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                        </Select>
                        <Button variant="ghost" size="sm" className="h-auto py-0 px-0 text-rose-400 hover:text-rose-300" onClick={() => act({ action: "remove_member", playerName: m.playerName })}>Quitar</Button>
                      </div>
                    ) : (
                      <span className="text-slate-400 text-xs">{faction.ranks.find((r) => r.id === m.rankId)?.name || "—"}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "ranks" && (
          <div className="space-y-3">
            {isDirector && (
              <div className="flex gap-2 flex-wrap">
                <TextInput placeholder="Nombre del rango" value={rankForm.name} onChange={(e) => setRankForm({ ...rankForm, name: e.target.value })} className="flex-1 min-w-[100px]" />
                <TextInput type="number" placeholder="Nivel" value={rankForm.level} onChange={(e) => setRankForm({ ...rankForm, level: Number(e.target.value) })} className="w-20" />
                <TextInput type="number" placeholder="Salario" value={rankForm.salary} onChange={(e) => setRankForm({ ...rankForm, salary: Number(e.target.value) })} className="w-24" />
                <Button disabled={busy || !rankForm.name.trim()} onClick={async () => { await act({ action: "add_rank", ...rankForm, permissions: [] }); setRankForm({ name: "", level: 1, salary: 0 }); }}>Añadir</Button>
              </div>
            )}
            <div className="space-y-1.5">
              {faction.ranks.sort((a, b) => b.level - a.level).map((r) => (
                <div key={r.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-[#0B0F17] border border-[#1F2937]">
                  <span className="text-white text-sm">{r.name} <span className="text-slate-500 text-xs">nivel {r.level}</span></span>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-400 text-xs">${r.salary.toLocaleString()}</span>
                    {isDirector && <Button variant="ghost" size="sm" className="h-auto py-0 px-0 text-rose-400 hover:text-rose-300" onClick={() => act({ action: "delete_rank", rankId: r.id })}>Eliminar</Button>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "finance" && (
          <div className="space-y-3">
            <Card className="p-3 flex items-center justify-between">
              <span className="text-slate-400 text-sm">Presupuesto actual</span>
              <span className="text-white font-bold">${faction.budget.toLocaleString()}</span>
            </Card>
            {isDirector && (
              <div className="flex gap-2 flex-wrap">
                <Select value={txForm.txType} onChange={(e) => setTxForm({ ...txForm, txType: e.target.value })}>
                  <option value="income">Ingreso</option>
                  <option value="expense">Gasto</option>
                  <option value="salary">Sueldo</option>
                  <option value="purchase">Compra</option>
                  <option value="transfer">Transferencia</option>
                </Select>
                <TextInput type="number" placeholder="Monto" value={txForm.amount} onChange={(e) => setTxForm({ ...txForm, amount: e.target.value })} className="w-28" />
                <TextInput placeholder="Motivo" value={txForm.reason} onChange={(e) => setTxForm({ ...txForm, reason: e.target.value })} className="flex-1 min-w-[120px]" />
                <Button disabled={busy || !txForm.amount || !txForm.reason.trim()} onClick={async () => { await act({ action: "add_transaction", ...txForm, amount: Number(txForm.amount) }); setTxForm({ txType: "income", amount: "", reason: "" }); }}>Registrar</Button>
              </div>
            )}
            {transactions.length === 0 ? <p className="text-slate-500 text-sm">Sin movimientos registrados.</p> : (
              <div className="space-y-1.5">
                {transactions.map((t) => (
                  <div key={t.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-[#0B0F17] border border-[#1F2937] text-sm">
                    <div>
                      <span className="text-white">{t.reason}</span>
                      <p className="text-slate-600 text-[11px]">{t.responsible} · {formatDate(t.createdAt)}</p>
                    </div>
                    <span className={t.type === "expense" || t.type === "salary" || t.type === "purchase" ? "text-rose-400" : "text-emerald-400"}>
                      {t.type === "expense" || t.type === "salary" || t.type === "purchase" ? "-" : "+"}${t.amount.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
    </Modal>
  );
}
