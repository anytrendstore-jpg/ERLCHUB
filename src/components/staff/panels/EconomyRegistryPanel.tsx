"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, X, Loader2, Trash2, Power, Handshake, Dices, Building2, Car, Crosshair, Share2, Siren, Sparkles, type LucideIcon } from "lucide-react";
import { PanelHeader, Card, Chip, AccessDenied, TextInput, TextArea, Select, PrimaryButton, LoadingBlock, EmptyState, formatDate, useStaffPermissions, useToast } from "@/components/staff/ui";

/** Estilo llamativo por categoría del catálogo — para que "Membresía" y "Kit" salten a la
 * vista frente a artículos comunes en la grilla de Tienda. Solo aplica al módulo `catalog`. */
const CATEGORY_NAME_STYLE: Record<string, string> = {
  "Membresía": "bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-400 bg-clip-text text-transparent",
  "Kit": "bg-gradient-to-r from-sky-300 via-blue-300 to-cyan-300 bg-clip-text text-transparent",
  "Hub Coins": "bg-gradient-to-r from-amber-300 to-yellow-200 bg-clip-text text-transparent",
};
const CATEGORY_CHIP_TONE: Record<string, "amber" | "blue" | "emerald" | "rose" | "orange" | "slate"> = {
  "Membresía": "amber", "Kit": "blue", "Hub Coins": "orange", "Artículo": "slate",
};

type FieldType = "text" | "number" | "select" | "boolean";
interface FieldDef { key: string; label: string; type: FieldType; options?: string[]; suffix?: string; }
interface EconomyModuleConfig {
  module: string;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  itemLabel: string; // "artículo", "trabajo", "juego"...
  fields: FieldDef[];
  summary: (fields: Record<string, any>) => string; // línea corta bajo el nombre
}

const MODULES: Record<string, EconomyModuleConfig> = {
  jobs: {
    module: "jobs", title: "Sueldos", subtitle: "Trabajos legales, escalas salariales y bonificaciones",
    icon: Handshake, itemLabel: "trabajo",
    fields: [
      { key: "sector", label: "Sector", type: "text" },
      { key: "baseSalary", label: "Salario base", type: "number", suffix: "$" },
      { key: "bonus", label: "Bonificación", type: "number", suffix: "$" },
      { key: "frequency", label: "Frecuencia de pago", type: "select", options: ["Diario", "Semanal", "Por turno"] },
      { key: "employees", label: "Empleados estimados", type: "number" },
    ],
    summary: (f) => `${f.sector || "—"} · $${f.baseSalary || 0} base + $${f.bonus || 0} bono · ${f.frequency || "—"}`,
  },
  casino: {
    module: "casino", title: "Casino", subtitle: "Juegos de azar, límites de apuesta y retorno al jugador (RTP)",
    icon: Dices, itemLabel: "juego",
    fields: [
      { key: "gameType", label: "Tipo de juego", type: "select", options: ["Ruleta", "Caja Misteriosa", "Sorteo"] },
      { key: "minBet", label: "Apuesta mínima", type: "number", suffix: "HC" },
      { key: "maxBet", label: "Apuesta máxima", type: "number", suffix: "HC" },
      { key: "rtpTarget", label: "RTP objetivo", type: "number", suffix: "%" },
    ],
    summary: (f) => `${f.gameType || "—"} · apuesta ${f.minBet || 0}-${f.maxBet || 0} HC · RTP ${f.rtpTarget || 0}%`,
  },
  companies: {
    module: "companies", title: "Empresas", subtitle: "Negocios registrados, empleados e impacto en el mercado",
    icon: Building2, itemLabel: "empresa",
    fields: [
      { key: "sector", label: "Sector", type: "text" },
      { key: "ownerName", label: "Propietario", type: "text" },
      { key: "employees", label: "Empleados", type: "number" },
      { key: "revenue", label: "Ingresos", type: "number", suffix: "$" },
      { key: "expenses", label: "Gastos", type: "number", suffix: "$" },
    ],
    summary: (f) => `${f.sector || "—"} · dueño: ${f.ownerName || "—"} · ${f.employees || 0} empleados`,
  },
  vehicles: {
    module: "vehicles", title: "Concesionario", subtitle: "Catálogo de vehículos, precios y disponibilidad",
    icon: Car, itemLabel: "vehículo",
    fields: [
      { key: "price", label: "Precio", type: "number", suffix: "$" },
      { key: "stock", label: "Stock", type: "number" },
      { key: "exclusive", label: "Exclusivo", type: "boolean" },
    ],
    summary: (f) => `$${f.price || 0} · stock ${f.stock ?? 0}${f.exclusive ? " · Exclusivo" : ""}`,
  },
  weapons: {
    module: "weapons", title: "Tienda de Armas", subtitle: "Catálogo, restricciones y control de stock",
    icon: Crosshair, itemLabel: "arma",
    fields: [
      { key: "price", label: "Precio", type: "number", suffix: "$" },
      { key: "legal", label: "Venta legal", type: "boolean" },
      { key: "restrictionLevel", label: "Restricción", type: "select", options: ["Ninguna", "Nivel 1", "Nivel 2", "Solo facción"] },
      { key: "stock", label: "Stock", type: "number" },
    ],
    summary: (f) => `$${f.price || 0} · ${f.legal ? "Legal" : "Ilegal"} · ${f.restrictionLevel || "Ninguna"}`,
  },
  market: {
    module: "market", title: "Mercado entre Jugadores", subtitle: "Registro manual de transacciones P2P sospechosas",
    icon: Share2, itemLabel: "incidente",
    fields: [
      { key: "involvedPlayers", label: "Jugadores implicados", type: "text" },
      { key: "amount", label: "Monto involucrado", type: "number", suffix: "HC" },
      { key: "notes", label: "Notas", type: "text" },
    ],
    summary: (f) => `${f.involvedPlayers || "—"} · ${f.amount || 0} HC`,
  },
  illegal: {
    module: "illegal", title: "Subsistemas Ilegales", subtitle: "Ingresos de la economía criminal registrados manualmente",
    icon: Siren, itemLabel: "registro",
    fields: [
      { key: "source", label: "Fuente", type: "select", options: ["Drogas", "Robos", "Contrabando", "Otro"] },
      { key: "amount", label: "Monto", type: "number", suffix: "$" },
      { key: "notes", label: "Notas", type: "text" },
    ],
    summary: (f) => `${f.source || "—"} · $${f.amount || 0}`,
  },
};

interface Item { id: string; module: string; name: string; fields: Record<string, any>; active: boolean; createdAt: string; updatedAt: string; updatedBy: string; }

export default function EconomyRegistryPanel({ moduleId }: { moduleId: string; isDirector?: boolean }) {
  const toast = useToast();
  const config = MODULES[moduleId];
  const { has, loaded } = useStaffPermissions();
  const canView = has("economy.view");
  const canManage = has("economy.manage");
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [fieldValues, setFieldValues] = useState<Record<string, any>>({});

  const load = useCallback(async () => {
    if (!canView) { setLoading(false); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/staff/economy/items?module=${moduleId}`, { cache: "no-store" });
      const data = await res.json();
      if (data.success) setItems(data.items);
    } finally {
      setLoading(false);
    }
  }, [moduleId, canView]);

  useEffect(() => { if (loaded) { load(); setShowForm(false); setName(""); setFieldValues({}); } }, [load, loaded]);

  if (!loaded) return <LoadingBlock />;
  if (!canView) return <AccessDenied title={config.title} />;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/staff/economy/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ module: moduleId, name, fields: fieldValues }),
      });
      const data = await res.json();
      if (data.success) { toast.success(`${config.itemLabel[0].toUpperCase()}${config.itemLabel.slice(1)} creado`); setName(""); setFieldValues({}); setShowForm(false); await load(); }
      else { setError(data.error || "No se pudo guardar"); toast.error(data.error || "No se pudo guardar"); }
    } catch {
      toast.error("No se pudo conectar con el servidor");
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (id: string) => {
    try {
      const res = await fetch("/api/staff/economy/items", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, action: "toggle" }) });
      const data = await res.json();
      if (!data.success) toast.error(data.error || "No se pudo actualizar");
      await load();
    } catch {
      toast.error("No se pudo conectar con el servidor");
    }
  };

  const remove = async (id: string) => {
    try {
      const res = await fetch("/api/staff/economy/items", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
      const data = await res.json();
      if (data.success) toast.success("Elemento eliminado");
      else toast.error(data.error || "No se pudo eliminar");
      await load();
    } catch {
      toast.error("No se pudo conectar con el servidor");
    }
  };

  return (
    <div>
      <PanelHeader
        title={config.title}
        subtitle={config.subtitle}
        action={
          canManage ? (
            <PrimaryButton onClick={() => setShowForm((v) => !v)}>
              {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />} Nuevo {config.itemLabel}
            </PrimaryButton>
          ) : undefined
        }
      />

      {showForm && canManage && (
        <Card className="p-4 mb-4">
          <form onSubmit={submit} className="grid sm:grid-cols-2 gap-3">
            <TextInput className="sm:col-span-2" placeholder="Nombre" value={name} onChange={(e) => setName(e.target.value)} required />
            {config.fields.map((f) => (
              <div key={f.key} className={f.type === "text" && f.key === "notes" ? "sm:col-span-2" : ""}>
                {f.type === "boolean" ? (
                  <label className="flex items-center gap-2 h-10 text-sm text-slate-400">
                    <input
                      type="checkbox"
                      checked={Boolean(fieldValues[f.key])}
                      onChange={(e) => setFieldValues((v) => ({ ...v, [f.key]: e.target.checked }))}
                    />
                    {f.label}
                  </label>
                ) : f.type === "select" ? (
                  <Select
                    className="w-full"
                    value={fieldValues[f.key] || ""}
                    onChange={(e) => setFieldValues((v) => ({ ...v, [f.key]: e.target.value }))}
                  >
                    <option value="">{f.label}</option>
                    {f.options?.map((o) => <option key={o} value={o}>{o}</option>)}
                  </Select>
                ) : f.key === "notes" ? (
                  <TextArea
                    className="w-full"
                    rows={2}
                    placeholder={f.label}
                    value={fieldValues[f.key] || ""}
                    onChange={(e) => setFieldValues((v) => ({ ...v, [f.key]: e.target.value }))}
                  />
                ) : (
                  <TextInput
                    className="w-full"
                    type={f.type === "number" ? "number" : "text"}
                    placeholder={f.suffix ? `${f.label} (${f.suffix})` : f.label}
                    value={fieldValues[f.key] ?? ""}
                    onChange={(e) => setFieldValues((v) => ({ ...v, [f.key]: f.type === "number" ? Number(e.target.value) : e.target.value }))}
                  />
                )}
              </div>
            ))}
            {error && <p className="sm:col-span-2 text-xs text-rose-400">{error}</p>}
            <div className="sm:col-span-2">
              <PrimaryButton type="submit" disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar"}</PrimaryButton>
            </div>
          </form>
        </Card>
      )}

      {loading ? <LoadingBlock /> : items.length === 0 ? (
        <EmptyState icon={config.icon} text={`Todavía no hay ningún ${config.itemLabel} registrado`} />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => {
            const category = moduleId === "catalog" ? String(item.fields?.category || "") : "";
            const nameStyle = CATEGORY_NAME_STYLE[category];
            const featured = moduleId === "catalog" && Boolean(item.fields?.featured);
            return (
              <Card key={item.id} hoverable className={`p-4 group relative ${!item.active ? "opacity-50" : ""} ${featured ? "ring-1 ring-amber-400/30" : ""}`}>
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="min-w-0">
                    {category && (
                      <div className="mb-1.5">
                        <Chip tone={CATEGORY_CHIP_TONE[category] || "slate"} label={category} />
                      </div>
                    )}
                    <div className={`flex items-center gap-1.5 truncate ${nameStyle ? `text-base font-bold ${nameStyle}` : "text-sm font-semibold text-white"}`}>
                      {featured && <Sparkles className="h-3.5 w-3.5 text-amber-400 flex-shrink-0" />}
                      <span className="truncate">{item.name}</span>
                    </div>
                  </div>
                  {canManage && (
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button type="button" onClick={() => toggle(item.id)} title={item.active ? "Desactivar" : "Activar"} className={`p-1 rounded transition ${item.active ? "text-emerald-400" : "text-slate-600"} hover:bg-[#151C2A]`}>
                        <Power className="h-3.5 w-3.5" />
                      </button>
                      <button type="button" onClick={() => remove(item.id)} className="p-1 rounded text-slate-600 hover:text-rose-400 hover:bg-[#151C2A] transition">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
                <p className="text-xs text-slate-400">{config.summary(item.fields)}</p>
                <div className="mt-2 text-[11px] text-slate-600">Actualizado {formatDate(item.updatedAt)} por {item.updatedBy}</div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
