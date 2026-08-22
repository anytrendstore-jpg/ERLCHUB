"use client";

import { useEffect, useState } from "react";
import {
  X, User, Wallet, Coins, Package, Home, Car, ShoppingBag, Heart, Briefcase,
  Server, Skull, Dice5, Ban, Ticket, Flag, ScrollText, Monitor, Share2, FileText, AlertTriangle,
} from "lucide-react";
import { Card, CardTitle, Chip, EmptyState, IconButton, Skeleton, formatDate, useStaffPermissions } from "@/components/staff/ui";

type Tab =
  | "resumen" | "cuenta" | "whitelist" | "economia" | "crypto" | "inventario" | "propiedades"
  | "vehiculos" | "compras" | "hubsocial" | "hubcareer" | "vps" | "deepweb" | "casino"
  | "sanciones" | "tickets" | "reportes" | "actividad" | "sistema" | "referidos";

const TABS: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "resumen", label: "Resumen", icon: User },
  { id: "cuenta", label: "Cuenta", icon: User },
  { id: "whitelist", label: "Personaje", icon: FileText },
  { id: "economia", label: "Economía", icon: Wallet },
  { id: "crypto", label: "Crypto", icon: Coins },
  { id: "inventario", label: "Inventario", icon: Package },
  { id: "propiedades", label: "Propiedades", icon: Home },
  { id: "vehiculos", label: "Vehículos", icon: Car },
  { id: "compras", label: "Compras", icon: ShoppingBag },
  { id: "hubsocial", label: "HubSocial", icon: Heart },
  { id: "hubcareer", label: "HubCareer", icon: Briefcase },
  { id: "vps", label: "VPS", icon: Server },
  { id: "deepweb", label: "Deep Web", icon: Skull },
  { id: "casino", label: "Casino", icon: Dice5 },
  { id: "sanciones", label: "Sanciones", icon: Ban },
  { id: "tickets", label: "Tickets", icon: Ticket },
  { id: "reportes", label: "Reportes", icon: Flag },
  { id: "actividad", label: "Actividad", icon: ScrollText },
  { id: "sistema", label: "Sistema", icon: Monitor },
  { id: "referidos", label: "Referidos", icon: Share2 },
];

function NotRegistered() {
  return <span className="text-slate-600 italic">No registrado</span>;
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-[#1F2937]/60 last:border-0">
      <span className="text-slate-500 text-xs">{label}</span>
      <span className="text-white text-sm text-right">{value ?? <NotRegistered />}</span>
    </div>
  );
}

/** Tabla genérica dirigida por columnas — evita repetir JSX para cada lista de registros reales. */
function DataTable({ columns, rows, emptyText }: { columns: { key: string; label: string; format?: (v: any, row: any) => React.ReactNode }[]; rows: any[]; emptyText: string }) {
  if (!rows || rows.length === 0) return <p className="text-slate-500 text-sm py-4">{emptyText}</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#1F2937] text-left text-[10px] uppercase tracking-wide text-slate-500">
            {columns.map((c) => <th key={c.key} className="px-3 py-2 font-medium whitespace-nowrap">{c.label}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#1F2937]/60">
          {rows.map((row, i) => (
            <tr key={row.id || i}>
              {columns.map((c) => (
                <td key={c.key} className="px-3 py-2 text-slate-300 whitespace-nowrap">
                  {c.format ? c.format(row[c.key], row) : (row[c.key] ?? <NotRegistered />)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const money = (v?: number) => v || v === 0 ? `$${Number(v).toLocaleString("es-CO")}` : <NotRegistered />;
const date = (v?: string) => v ? formatDate(v) : <NotRegistered />;

export default function PlayerDossierModal({ discordId, onClose }: { discordId: string; onClose: () => void }) {
  const [dossier, setDossier] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<Tab>("resumen");

  useEffect(() => {
    fetch(`/api/staff/players/dossier?discordId=${discordId}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setDossier(data.dossier);
        else setError(data.error || "No se pudo cargar el expediente");
      })
      .catch(() => setError("No se pudo conectar con el servidor"))
      .finally(() => setLoading(false));
  }, [discordId]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-[2px] z-50 flex items-center justify-center p-4 animate-in fade-in duration-150" onClick={onClose}>
      <Card className="w-full max-w-5xl h-[88vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150" onClick={(e) => e.stopPropagation()}>
        {loading ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#1F2937] flex-shrink-0">
              <div className="flex items-center gap-3">
                <Skeleton className="w-11 h-11 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="w-36 h-4" />
                  <Skeleton className="w-24 h-3" />
                </div>
              </div>
            </div>
            <div className="flex gap-1 px-5 pt-2 border-b border-[#1F2937] flex-shrink-0">
              {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="w-16 h-7 my-2 rounded-md" />)}
            </div>
            <div className="flex-1 p-5 grid md:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="p-4 space-y-2.5">
                  <Skeleton className="w-24 h-3.5" />
                  <Skeleton className="w-full h-3" />
                  <Skeleton className="w-full h-3" />
                  <Skeleton className="w-2/3 h-3" />
                </Card>
              ))}
            </div>
          </div>
        ) : error || !dossier ? (
          <div className="flex-1 flex items-center justify-center"><p className="text-rose-400 text-sm">{error}</p></div>
        ) : (
          <>
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#1F2937] flex-shrink-0">
              <div className="flex items-center gap-3">
                {dossier.identity?.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={dossier.identity.avatar} alt="" className="w-11 h-11 rounded-full" />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold">{dossier.identity?.displayName?.charAt(0) || "?"}</div>
                )}
                <div>
                  <h2 className="text-white font-bold text-lg">{dossier.identity?.displayName}</h2>
                  <p className="text-slate-500 text-xs font-mono">{dossier.discordId}</p>
                </div>
              </div>
              <IconButton icon={X} label="Cerrar expediente" variant="ghost" onClick={onClose} />
            </div>

            <div className="flex gap-1 px-5 pt-2 border-b border-[#1F2937] overflow-x-auto flex-shrink-0">
              {TABS.map((t) => {
                const Icon = t.icon;
                return (
                  <button key={t.id} onClick={() => setTab(t.id)} className={`flex items-center gap-1.5 px-3 py-2 rounded-t-md text-xs font-medium border-b-2 whitespace-nowrap transition ${tab === t.id ? "border-blue-500 text-white bg-white/[0.03]" : "border-transparent text-slate-500 hover:text-slate-300 hover:bg-white/[0.03]"}`}>
                    <Icon className="h-3.5 w-3.5" /> {t.label}
                  </button>
                );
              })}
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {tab === "resumen" && <ResumenTab dossier={dossier} />}
              {tab === "cuenta" && <CuentaTab dossier={dossier} />}
              {tab === "whitelist" && <WhitelistTab dossier={dossier} />}
              {tab === "economia" && <EconomiaTab dossier={dossier} />}
              {tab === "crypto" && <CryptoTab dossier={dossier} />}
              {tab === "inventario" && <InventarioTab dossier={dossier} />}
              {tab === "propiedades" && (
                <DataTable emptyText="Sin propiedades registradas." rows={dossier.properties} columns={[
                  { key: "name", label: "Nombre" }, { key: "type", label: "Tipo" }, { key: "address", label: "Dirección" },
                  { key: "giftedBy", label: "Regalado por", format: (v) => v || <NotRegistered /> },
                  { key: "purchasedAt", label: "Adquirida", format: date },
                ]} />
              )}
              {tab === "vehiculos" && (
                <DataTable emptyText="Sin vehículos registrados." rows={dossier.vehicles} columns={[
                  { key: "name", label: "Nombre" }, { key: "brand", label: "Marca" }, { key: "plate", label: "Placa" }, { key: "color", label: "Color" },
                  { key: "financed", label: "Financiado", format: (v) => v ? <Chip tone="amber" label="Sí" /> : "No" },
                  { key: "purchasedAt", label: "Adquirido", format: date },
                ]} />
              )}
              {tab === "compras" && <ComprasTab dossier={dossier} />}
              {tab === "hubsocial" && <HubSocialTab dossier={dossier} />}
              {tab === "hubcareer" && <HubCareerTab dossier={dossier} />}
              {tab === "vps" && (
                <DataTable emptyText="Sin suscripciones de VPS." rows={dossier.vps} columns={[
                  { key: "planName", label: "Plan" }, { key: "status", label: "Estado", format: (v) => <Chip tone={v === "active" ? "emerald" : v === "expired" ? "slate" : "amber"} label={v} /> },
                  { key: "dailyPrice", label: "Precio/día", format: money }, { key: "purchasedAt", label: "Comprado", format: date }, { key: "expiresAt", label: "Expira", format: date },
                ]} />
              )}
              {tab === "deepweb" && <DeepWebTab dossier={dossier} />}
              {tab === "casino" && (
                <DataTable emptyText="Sin partidas de casino registradas." rows={dossier.casino} columns={[
                  { key: "game", label: "Juego" }, { key: "bet", label: "Apuesta", format: money },
                  { key: "net", label: "Resultado neto", format: (v) => <span className={v >= 0 ? "text-emerald-400" : "text-rose-400"}>{v >= 0 ? "+" : ""}{money(v)}</span> },
                  { key: "createdAt", label: "Fecha", format: date },
                ]} />
              )}
              {tab === "sanciones" && (
                <DataTable emptyText="Sin sanciones registradas." rows={dossier.administrative.sanctions} columns={[
                  { key: "type", label: "Tipo" }, { key: "reason", label: "Motivo" },
                  { key: "active", label: "Estado", format: (v) => <Chip tone={v ? "rose" : "slate"} label={v ? "Activa" : "Cumplida/Revocada"} /> },
                  { key: "issuedBy", label: "Aplicada por" }, { key: "createdAt", label: "Fecha", format: date },
                ]} />
              )}
              {tab === "tickets" && (
                <DataTable emptyText="Sin tickets abiertos por este jugador." rows={dossier.administrative.tickets} columns={[
                  { key: "subject", label: "Asunto" }, { key: "category", label: "Categoría" },
                  { key: "status", label: "Estado", format: (v) => <Chip tone={v === "closed" ? "slate" : v === "in_progress" ? "amber" : "blue"} label={v} /> },
                  { key: "updatedAt", label: "Actualizado", format: date },
                ]} />
              )}
              {tab === "reportes" && (
                <div>
                  <p className="text-amber-400 text-xs flex items-center gap-1.5 mb-3"><AlertTriangle className="h-3.5 w-3.5" /> {dossier.administrative.reportsMadeNote}</p>
                  <DataTable emptyText="Sin reportes hechos por este jugador." rows={dossier.administrative.reportsMade} columns={[
                    { key: "targetName", label: "Reportado" }, { key: "reason", label: "Motivo" },
                    { key: "status", label: "Estado" }, { key: "createdAt", label: "Fecha", format: date },
                  ]} />
                </div>
              )}
              {tab === "actividad" && (
                <div>
                  <p className="text-amber-400 text-xs flex items-center gap-1.5 mb-3"><AlertTriangle className="h-3.5 w-3.5" /> {dossier.administrative.auditNote}</p>
                  <DataTable emptyText="Sin entradas de auditoría vinculadas a este jugador." rows={dossier.administrative.auditEntries} columns={[
                    { key: "description", label: "Acción" }, { key: "actor", label: "Staff" }, { key: "category", label: "Categoría" }, { key: "createdAt", label: "Fecha", format: date },
                  ]} />
                </div>
              )}
              {tab === "sistema" && <SistemaTab dossier={dossier} />}
              {tab === "referidos" && <ReferidosTab dossier={dossier} />}
            </div>
          </>
        )}
      </Card>
    </div>
  );
}

function ResumenTab({ dossier }: { dossier: any }) {
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <Card className="p-4">
        <CardTitle className="mb-2">Cuenta</CardTitle>
        <Field label="Usuario" value={dossier.account.username} />
        <Field label="Registrado" value={date(dossier.account.createdAt)} />
        <Field label="Último acceso" value={date(dossier.account.lastLogin)} />
        <Field label="Membresía" value={dossier.account.membership?.name ? <Chip tone="blue" label={dossier.account.membership.name} /> : null} />
      </Card>
      <Card className="p-4">
        <CardTitle className="mb-2">Dinero</CardTitle>
        <Field label="Hub Coins" value={money(dossier.economy.hubCoins)} />
        <Field label="HubPay" value={money(dossier.economy.hubPayBalance)} />
        <Field label="Crypto (COP est.)" value={dossier.crypto ? money(dossier.crypto.totalCOP) : null} />
        <Field label="HubPay congelado" value={dossier.economy.hubPayFrozen ? <Chip tone="rose" label="Sí" /> : "No"} />
      </Card>
      <Card className="p-4">
        <CardTitle className="mb-2">Personaje</CardTitle>
        <Field label="Nombre RP" value={dossier.whitelist?.character ? `${dossier.whitelist.character.firstName} ${dossier.whitelist.character.lastName}` : null} />
        <Field label="Estado whitelist" value={dossier.whitelist?.status ? <Chip tone={dossier.whitelist.status === "approved" ? "emerald" : "amber"} label={dossier.whitelist.status} /> : null} />
        <Field label="Empleo actual" value={dossier.hubCareer?.profile?.currentJob?.title} />
        <Field label="Empresa" value={dossier.hubCareer?.profile?.currentJob?.companyName} />
      </Card>
      <Card className="p-4">
        <CardTitle className="mb-2">Alertas</CardTitle>
        <Field label="Sanciones activas" value={dossier.administrative.sanctions.filter((s: any) => s.active).length || null} />
        <Field label="Exposición Deep Web" value={dossier.deepWeb.exposure ? `${dossier.deepWeb.exposure.value}% (${dossier.deepWeb.exposure.tier.label})` : null} />
        <Field label="Cuenta HubSocial suspendida" value={dossier.hubSocial?.profile?.suspended ? <Chip tone="rose" label="Sí" /> : null} />
        <Field label="Propiedades / Vehículos" value={`${dossier.properties.length} / ${dossier.vehicles.length}`} />
      </Card>
    </div>
  );
}

function CuentaTab({ dossier }: { dossier: any }) {
  return (
    <div className="space-y-4 max-w-lg">
      <Card className="p-4">
        <Field label="Discord ID" value={<span className="font-mono text-xs">{dossier.discordId}</span>} />
        <Field label="Username" value={dossier.account.username} />
        <Field label="Nombre mostrado" value={dossier.account.globalName} />
        <Field label="Registrado" value={date(dossier.account.createdAt)} />
        <Field label="Último acceso" value={date(dossier.account.lastLogin)} />
        <Field label="Membresía" value={dossier.account.membership?.name} />
        <Field label="Vencimiento membresía" value={dossier.account.membership?.endDate ? date(dossier.account.membership.endDate) : null} />
        <Field label="Whitelist Fast" value={dossier.account.whitelistFast?.active ? <Chip tone="amber" label="Activo" /> : null} />
      </Card>
      <CharacterSlotsCard discordId={dossier.discordId} />
    </div>
  );
}

function CharacterSlotsCard({ discordId }: { discordId: string }) {
  const { has } = useStaffPermissions();
  const canEdit = has("players.economy.edit");
  const [characters, setCharacters] = useState<any[] | null>(null);
  const [slots, setSlots] = useState(1);
  const [slotsInput, setSlotsInput] = useState("1");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch(`/api/staff/players/character-slots?discordId=${discordId}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setCharacters(data.characters);
          setSlots(data.slots);
          setSlotsInput(String(data.slots));
        }
      });
  }, [discordId]);

  const save = async () => {
    const value = Number(slotsInput);
    if (!Number.isFinite(value) || value < 1) return;
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/staff/players/character-slots", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ discordId, slots: value }),
      });
      const data = await res.json();
      if (data.success) { setSlots(data.slots); setSaved(true); setTimeout(() => setSaved(false), 2000); }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="p-4">
      <CardTitle className="mb-2">Personajes</CardTitle>
      {characters === null ? (
        <Skeleton className="h-16 w-full" />
      ) : (
        <>
          <div className="space-y-1 mb-3">
            {characters.length === 0 ? (
              <p className="text-slate-500 text-sm">Sin personajes registrados todavía.</p>
            ) : (
              characters.map((c) => (
                <div key={c.id} className="flex items-center justify-between py-1 text-sm">
                  <span className="text-white">{c.name}{c.isPrimary && <span className="text-slate-500 text-xs ml-1.5">(principal)</span>}</span>
                  <span className="text-slate-500 text-xs">{c.city || c.job || "—"}</span>
                </div>
              ))
            )}
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-[#1F2937]">
            <div>
              <p className="text-slate-500 text-xs">Slots disponibles</p>
              <p className="text-white text-sm">{characters.length} / {slots} usados</p>
            </div>
            {canEdit && (
              <div className="flex items-center gap-2">
                <input
                  type="number" min={1} value={slotsInput} onChange={(e) => setSlotsInput(e.target.value)}
                  className="w-16 h-8 px-2 bg-[#0B0F17] border border-[#1F2937] rounded-lg text-sm text-white text-center focus:outline-none focus:border-blue-500"
                />
                <button
                  onClick={save} disabled={saving || Number(slotsInput) === slots}
                  className="h-8 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-xs font-semibold transition"
                >
                  {saving ? "..." : "Guardar"}
                </button>
                {saved && <Chip tone="emerald" label="Guardado" />}
              </div>
            )}
          </div>
        </>
      )}
    </Card>
  );
}

function WhitelistTab({ dossier }: { dossier: any }) {
  const wl = dossier.whitelist;
  if (!wl) return <EmptyState icon={FileText} text="Este jugador no tiene solicitud de whitelist registrada." />;
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <Card className="p-4">
        <CardTitle className="mb-2">Identidad</CardTitle>
        <Field label="Nombre" value={wl.character ? `${wl.character.firstName} ${wl.character.lastName}` : null} />
        <Field label="Fecha de nacimiento" value={wl.character?.birthDate ? date(wl.character.birthDate) : null} />
        <Field label="Nacionalidad" value={wl.character?.nationality} />
        <Field label="Ciudad" value={wl.character?.city} />
        <Field label="Grupo" value={wl.character?.group} />
      </Card>
      <Card className="p-4">
        <CardTitle className="mb-2">Documento (DNI)</CardTitle>
        <Field label="Número" value={wl.document?.number} />
        <Field label="Emitido" value={wl.document?.issueDate ? date(wl.document.issueDate) : null} />
        <Field label="Vence" value={wl.document?.expiryDate ? date(wl.document.expiryDate) : null} />
      </Card>
      <Card className="p-4">
        <CardTitle className="mb-2">Estado de la solicitud</CardTitle>
        <Field label="Estado" value={<Chip tone={wl.status === "approved" ? "emerald" : "amber"} label={wl.status} />} />
        <Field label="Fase" value={wl.currentPhase} />
        <Field label="N° de miembro" value={wl.memberNumber} />
        <Field label="Enviada" value={wl.submittedAt ? date(wl.submittedAt) : null} />
        <Field label="Revisada por" value={wl.reviewedBy} />
      </Card>
      <Card className="p-4">
        <CardTitle className="mb-2">Roblox</CardTitle>
        <Field label="Usuario" value={wl.roblox?.username} />
        <Field label="Verificado" value={wl.roblox?.verified ? <Chip tone="emerald" label="Sí" /> : "No"} />
      </Card>
    </div>
  );
}

function EconomiaTab({ dossier }: { dossier: any }) {
  const e = dossier.economy;
  return (
    <div className="space-y-5">
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="p-4"><p className="text-slate-500 text-xs">Hub Coins</p><p className="text-amber-300 text-xl font-bold">{money(e.hubCoins)}</p></Card>
        <Card className="p-4"><p className="text-slate-500 text-xs">HubPay</p><p className="text-emerald-300 text-xl font-bold">{money(e.hubPayBalance)}</p>{e.hubPayFrozen && <Chip tone="rose" label="Congelada" />}</Card>
        <Card className="p-4"><p className="text-slate-500 text-xs">Cuentas / Tarjetas / Bolsillos</p><p className="text-white text-xl font-bold">{e.hubPayAccounts.length} / {e.hubPayCards.length} / {e.hubPayPockets.length}</p></Card>
      </div>
      <div>
        <CardTitle className="mb-2">Historial Hub Coins</CardTitle>
        <DataTable emptyText="Sin movimientos de Hub Coins." rows={e.hubCoinsTransactions} columns={[
          { key: "type", label: "Tipo" }, { key: "amount", label: "Monto", format: money }, { key: "description", label: "Descripción" }, { key: "timestamp", label: "Fecha", format: date },
        ]} />
      </div>
      <div>
        <CardTitle className="mb-2">Historial HubPay</CardTitle>
        <DataTable emptyText="Sin movimientos de HubPay." rows={e.hubPayTransactions} columns={[
          { key: "type", label: "Tipo" }, { key: "amount", label: "Monto", format: money }, { key: "description", label: "Descripción" }, { key: "timestamp", label: "Fecha", format: date },
        ]} />
      </div>
    </div>
  );
}

function CryptoTab({ dossier }: { dossier: any }) {
  const c = dossier.crypto;
  if (!c) return <EmptyState icon={Coins} text="Este jugador no tiene Crypto Wallet." />;
  return (
    <div className="space-y-5">
      <Card className="p-4 max-w-xs"><p className="text-slate-500 text-xs">Valor total estimado</p><p className="text-amber-300 text-xl font-bold">{money(c.totalCOP)}</p></Card>
      <div>
        <CardTitle className="mb-2">Holdings</CardTitle>
        <DataTable emptyText="Sin criptomonedas." rows={c.holdings} columns={[
          { key: "symbol", label: "Moneda" }, { key: "amount", label: "Cantidad" }, { key: "valueCOP", label: "Valor", format: money },
        ]} />
      </div>
      <div>
        <CardTitle className="mb-2">Transacciones</CardTitle>
        <DataTable emptyText="Sin transacciones de cripto." rows={c.transactions} columns={[
          { key: "type", label: "Tipo" }, { key: "coinSymbol", label: "Moneda" }, { key: "amount", label: "Cantidad" }, { key: "valueCOP", label: "Valor", format: money }, { key: "createdAt", label: "Fecha", format: date },
        ]} />
      </div>
    </div>
  );
}

function InventarioTab({ dossier }: { dossier: any }) {
  const inv = dossier.inventory;
  return (
    <div className="space-y-5">
      <div>
        <CardTitle className="mb-2">Armas</CardTitle>
        <DataTable emptyText="Sin armas registradas." rows={inv.weapons} columns={[
          { key: "name", label: "Nombre" }, { key: "category", label: "Categoría" }, { key: "purchasedAt", label: "Adquirida", format: date },
        ]} />
      </div>
      <div>
        <CardTitle className="mb-2">Licencias</CardTitle>
        <DataTable emptyText="Sin licencias." rows={inv.licenses} columns={[{ key: "type", label: "Tipo" }, { key: "purchasedAt", label: "Emitida", format: date }]} />
      </div>
      <Field label="Objetos ocultos" value={inv.hiddenCount || null} />
      <div>
        <CardTitle className="mb-2">Transferencias enviadas</CardTitle>
        <DataTable emptyText="Sin transferencias enviadas." rows={inv.transfersOut} columns={[
          { key: "itemName", label: "Objeto" }, { key: "toName", label: "Para" }, { key: "transferredAt", label: "Fecha", format: date },
        ]} />
      </div>
      <div>
        <CardTitle className="mb-2">Transferencias recibidas</CardTitle>
        <DataTable emptyText="Sin transferencias recibidas." rows={inv.transfersIn} columns={[
          { key: "itemName", label: "Objeto" }, { key: "fromName", label: "De" }, { key: "transferredAt", label: "Fecha", format: date },
        ]} />
      </div>
    </div>
  );
}

function ComprasTab({ dossier }: { dossier: any }) {
  return (
    <div className="space-y-5">
      <div>
        <CardTitle className="mb-2">Compras realizadas</CardTitle>
        <DataTable emptyText="Sin compras registradas." rows={dossier.purchases.asBuyer} columns={[
          { key: "listingName", label: "Producto" }, { key: "total", label: "Total", format: money }, { key: "sellerUsername", label: "Vendedor" }, { key: "createdAt", label: "Fecha", format: date },
        ]} />
      </div>
      <div>
        <CardTitle className="mb-2">Ventas realizadas</CardTitle>
        <DataTable emptyText="Sin ventas registradas." rows={dossier.purchases.asSeller} columns={[
          { key: "listingName", label: "Producto" }, { key: "total", label: "Total", format: money }, { key: "buyerUsername", label: "Comprador" }, { key: "createdAt", label: "Fecha", format: date },
        ]} />
      </div>
    </div>
  );
}

function HubSocialTab({ dossier }: { dossier: any }) {
  const s = dossier.hubSocial;
  if (!s) return <EmptyState icon={Heart} text="Este jugador no tiene perfil de HubSocial." />;
  return (
    <Card className="p-4 max-w-md">
      <Field label="Usuario" value={`@${s.profile.username}`} />
      <Field label="Tipo de cuenta" value={s.profile.accountType} />
      <Field label="Verificado" value={s.profile.verified ? <Chip tone="emerald" label="Sí" /> : "No"} />
      <Field label="Suspendida" value={s.profile.suspended ? <Chip tone="rose" label={s.profile.suspendedReason || "Sí"} /> : "No"} />
      <Field label="Publicaciones" value={s.stats?.postsCount} />
      <Field label="Seguidores" value={s.stats?.followersCount} />
      <Field label="Siguiendo" value={s.stats?.followingCount} />
    </Card>
  );
}

function HubCareerTab({ dossier }: { dossier: any }) {
  const c = dossier.hubCareer;
  if (!c) return <EmptyState icon={Briefcase} text="Este jugador no tiene perfil de HubCareer." />;
  return (
    <div className="space-y-5">
      <Card className="p-4 max-w-md">
        <Field label="Titular" value={c.profile.headline} />
        <Field label="Empleo actual" value={c.profile.currentJob?.title} />
        <Field label="Empresa" value={c.profile.currentJob?.companyName} />
        <Field label="Verificado" value={c.profile.verified ? <Chip tone="emerald" label="Sí" /> : "No"} />
      </Card>
      <div>
        <CardTitle className="mb-2">Postulaciones</CardTitle>
        <DataTable emptyText="Sin postulaciones." rows={c.applications} columns={[
          { key: "jobTitle", label: "Puesto" }, { key: "companyName", label: "Empresa" }, { key: "status", label: "Estado" }, { key: "createdAt", label: "Fecha", format: date },
        ]} />
      </div>
      {c.companiesOwned.length > 0 && (
        <div>
          <CardTitle className="mb-2">Empresas propias</CardTitle>
          <DataTable emptyText="—" rows={c.companiesOwned} columns={[{ key: "name", label: "Nombre" }, { key: "category", label: "Categoría" }, { key: "approved", label: "Aprobada", format: (v) => v ? "Sí" : "No" }]} />
        </div>
      )}
    </div>
  );
}

function DeepWebTab({ dossier }: { dossier: any }) {
  const dw = dossier.deepWeb;
  return (
    <div className="space-y-5">
      <Card className="p-4 max-w-sm">
        <CardTitle className="mb-2">Exposición</CardTitle>
        {dw.exposure ? (
          <>
            <Field label="Nivel" value={`${dw.exposure.value}%`} />
            <Field label="Categoría" value={<Chip tone={dw.exposure.tier.id === "critical" ? "rose" : dw.exposure.tier.id === "high" ? "orange" : dw.exposure.tier.id === "moderate" ? "amber" : "emerald"} label={dw.exposure.tier.label} />} />
            <Field label="Sesión activa" value={dw.exposure.sessionActive ? "Sí" : "No"} />
            <Field label="Protegido por VPS" value={dw.exposure.vpsProtected ? "Sí" : "No"} />
          </>
        ) : <NotRegistered />}
      </Card>
      <div>
        <CardTitle className="mb-2">Objetos comprados</CardTitle>
        <DataTable emptyText="Sin compras en Deep Web." rows={dw.items} columns={[
          { key: "name", label: "Objeto" }, { key: "category", label: "Categoría" }, { key: "purchasedAt", label: "Fecha", format: date },
        ]} />
      </div>
    </div>
  );
}

function SistemaTab({ dossier }: { dossier: any }) {
  const p = dossier.system.preferences;
  if (!p) return <EmptyState icon={Monitor} text="Sin preferencias de sistema registradas." />;
  return (
    <Card className="p-4 max-w-md">
      <Field label="Tema" value={p.theme?.mode} />
      <Field label="Apps instaladas" value={p.installedApps?.length} />
      <Field label="Apps ancladas" value={p.pinnedApps?.length} />
      <Field label="Tutorial completado" value={p.onboarding?.completed ? <Chip tone="emerald" label="Sí" /> : "No"} />
      <Field label="Fecha de finalización" value={p.onboarding?.completedAt ? date(p.onboarding.completedAt) : null} />
    </Card>
  );
}

function ReferidosTab({ dossier }: { dossier: any }) {
  const r = dossier.referrals;
  return (
    <div className="space-y-5">
      <Card className="p-4 max-w-sm">
        <Field label="Código propio" value={r.ownCode?.code} />
        <Field label="Activo" value={r.ownCode ? (r.ownCode.isActive ? "Sí" : "No") : null} />
        <Field label="Referido por otro jugador" value={r.referredBy.length > 0 ? <Chip tone="blue" label="Sí" /> : "No"} />
      </Card>
      <div>
        <CardTitle className="mb-2">Referidos realizados</CardTitle>
        <DataTable emptyText="Sin referidos." rows={r.made} columns={[
          { key: "referredUsername", label: "Jugador" }, { key: "status", label: "Estado" }, { key: "commissionAmount", label: "Comisión", format: money }, { key: "createdAt", label: "Fecha", format: date },
        ]} />
      </div>
    </div>
  );
}
