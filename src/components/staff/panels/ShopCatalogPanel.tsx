"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Loader2, Trash2, Power, Crown, Package, Coins, ShoppingBag, Zap } from "lucide-react";
import { PanelHeader, Card, Chip, AccessDenied, TextInput, TextArea, PrimaryButton, LoadingBlock, EmptyState, Modal, useStaffPermissions, useToast } from "@/components/staff/ui";

type CatalogType = "membership" | "kit" | "hub-coins-package" | "item" | "whitelist-fast";

const TYPE_TABS: { id: CatalogType; label: string; icon: any }[] = [
  { id: "membership", label: "Membresías", icon: Crown },
  { id: "kit", label: "Kits", icon: Package },
  { id: "hub-coins-package", label: "Hub Coins", icon: Coins },
  { id: "item", label: "Artículos", icon: ShoppingBag },
  { id: "whitelist-fast", label: "Whitelist Fast", icon: Zap },
];

/** Un textarea de una línea por elemento — para arrays (benefits/items) sin inventar un editor de listas. */
function linesToArray(text: string): string[] {
  return text.split("\n").map((l) => l.trim()).filter(Boolean);
}
function arrayToLines(arr?: string[]): string {
  return (arr || []).join("\n");
}

function summaryFor(item: any): string {
  switch (item.type) {
    case "membership": return `$${item.priceMonthly}/mes · $${item.pricePermanent} permanente`;
    case "kit": return `${item.priceHubCoins.toLocaleString()} HC · ${item.category}`;
    case "hub-coins-package": return `${item.coins.toLocaleString()} + ${item.bonus.toLocaleString()} bonus · $${item.priceUSD}`;
    case "item": return `${item.priceHubCoins.toLocaleString()} HC · ${item.category}`;
    case "whitelist-fast": return `$${item.priceDollars}`;
    default: return "";
  }
}

function displayName(item: any): string {
  if (item.type === "hub-coins-package") return `${item.coins.toLocaleString()} Hub Coins`;
  return item.name || item.id;
}

export default function ShopCatalogPanel(_props: { isDirector?: boolean }) {
  const toast = useToast();
  const { has, loaded } = useStaffPermissions();
  const canView = has("economy.view");
  const canManage = has("economy.manage");

  const [tab, setTab] = useState<CatalogType>("membership");
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<any[]>([]);
  const [editing, setEditing] = useState<any | null>(null);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async (type: CatalogType) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/staff/economy/catalog?type=${type}`, { cache: "no-store" });
      const json = await res.json();
      if (json.success) setItems(json.items);
      else toast.error(json.error || "No se pudo cargar el catálogo");
    } catch {
      toast.error("No se pudo conectar con el servidor");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { load(tab); }, [tab, load]);

  if (!loaded) return <LoadingBlock />;
  if (!canView) return <AccessDenied title="Catálogo de Tienda" />;

  const toggleActive = async (id: string) => {
    try {
      const res = await fetch("/api/staff/economy/catalog", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "toggle" }),
      });
      const json = await res.json();
      if (json.success) { toast.success(json.item.active ? "Activado" : "Desactivado"); await load(tab); }
      else toast.error(json.error || "No se pudo actualizar");
    } catch {
      toast.error("No se pudo conectar con el servidor");
    }
  };

  const remove = async (id: string) => {
    try {
      const res = await fetch("/api/staff/economy/catalog", {
        method: "DELETE", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const json = await res.json();
      if (json.success) { toast.success("Eliminado"); await load(tab); }
      else toast.error(json.error || "No se pudo eliminar");
    } catch {
      toast.error("No se pudo conectar con el servidor");
    }
  };

  return (
    <div>
      <PanelHeader
        title="Catálogo de Tienda"
        subtitle="Membresías, kits, Hub Coins, artículos y whitelist fast — lo que edites acá se refleja en /tienda al instante"
        action={canManage ? (
          <PrimaryButton onClick={() => setCreating(true)}><Plus className="h-4 w-4" /> Nuevo</PrimaryButton>
        ) : undefined}
      />

      <div className="flex items-center gap-2 mb-6 border-b border-[#1F2937] overflow-x-auto">
        {TYPE_TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors ${tab === t.id ? "border-blue-500 text-white" : "border-transparent text-slate-400 hover:text-white"}`}
            >
              <Icon className="h-3.5 w-3.5" /> {t.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <LoadingBlock />
      ) : items.length === 0 ? (
        <EmptyState icon={Package} text="Sin productos todavía" description="Creá el primero con el botón de arriba." />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {items.map((item) => (
            <Card key={item.id} className="p-4">
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <span className="font-mono text-[11px] text-slate-500">{item.id}</span>
                <Chip tone={item.active ? "emerald" : "slate"} label={item.active ? "Activo" : "Inactivo"} />
              </div>
              <h3 className="text-sm font-semibold text-white mb-1">{displayName(item)}</h3>
              <p className="text-xs text-slate-400 mb-3">{summaryFor(item)}</p>
              {canManage && (
                <div className="flex items-center gap-2">
                  <button onClick={() => setEditing(item)} className="text-xs text-blue-400 hover:text-blue-300">Editar</button>
                  <button onClick={() => toggleActive(item.id)} className="text-slate-500 hover:text-white" title={item.active ? "Desactivar" : "Activar"}><Power className="h-3.5 w-3.5" /></button>
                  <button onClick={() => remove(item.id)} className="text-slate-500 hover:text-rose-400 ml-auto" title="Eliminar"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {(creating || editing) && (
        <CatalogItemForm
          type={editing?.type || tab}
          initial={editing}
          onClose={() => { setCreating(false); setEditing(null); }}
          onSaved={async () => { setCreating(false); setEditing(null); await load(tab); }}
        />
      )}
    </div>
  );
}

function CatalogItemForm({ type, initial, onClose, onSaved }: { type: CatalogType; initial: any | null; onClose: () => void; onSaved: () => void }) {
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Record<string, any>>(() => initial || { type, sortOrder: 0 });

  const set = (key: string, value: any) => setForm((f) => ({ ...f, [key]: value }));

  const submit = async () => {
    if (!form.id?.trim()) { toast.error("Falta el ID"); return; }
    setSaving(true);
    try {
      const payload = { ...form, type };
      const res = await fetch("/api/staff/economy/catalog", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success) { toast.success("Guardado"); onSaved(); }
      else toast.error(json.error || "No se pudo guardar");
    } catch {
      toast.error("No se pudo conectar con el servidor");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={initial ? "Editar producto" : "Nuevo producto"} onClose={onClose} size="lg" footer={
      <div className="flex justify-end gap-2">
        <button onClick={onClose} className="px-4 py-2 text-sm text-slate-400 hover:text-white">Cancelar</button>
        <PrimaryButton onClick={submit} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Guardar</PrimaryButton>
      </div>
    }>
      <div className="space-y-3">
        <div>
          <label className="text-xs text-slate-400 block mb-1.5">ID (único, sin espacios)</label>
          <TextInput value={form.id || ""} onChange={(e) => set("id", e.target.value)} disabled={!!initial} className="w-full" />
        </div>

        {type === "membership" && (
          <>
            <Field label="Nombre" value={form.name} onChange={(v) => set("name", v)} />
            <Field label="Descripción" value={form.description} onChange={(v) => set("description", v)} area />
            <Field label="Imagen (ruta)" value={form.image} onChange={(v) => set("image", v)} />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Precio mensual (USD)" type="number" value={form.priceMonthly} onChange={(v) => set("priceMonthly", Number(v))} />
              <Field label="Precio permanente (USD)" type="number" value={form.pricePermanent} onChange={(v) => set("pricePermanent", Number(v))} />
            </div>
            <Field label="Color (hex)" value={form.color} onChange={(v) => set("color", v)} />
            <div>
              <label className="text-xs text-slate-400 block mb-1.5">Beneficios (uno por línea)</label>
              <TextArea rows={5} value={arrayToLines(form.benefits)} onChange={(e) => set("benefits", linesToArray(e.target.value))} className="w-full" />
            </div>
          </>
        )}

        {type === "kit" && (
          <>
            <Field label="Nombre" value={form.name} onChange={(v) => set("name", v)} />
            <Field label="Descripción" value={form.description} onChange={(v) => set("description", v)} area />
            <Field label="Imagen (ruta)" value={form.image} onChange={(v) => set("image", v)} />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Precio (Hub Coins)" type="number" value={form.priceHubCoins} onChange={(v) => set("priceHubCoins", Number(v))} />
              <Field label="Categoría" value={form.category} onChange={(v) => set("category", v)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Color (hex)" value={form.color} onChange={(v) => set("color", v)} />
              <Field label="Cupos de personaje que otorga" type="number" value={form.characterSlotsGranted} onChange={(v) => set("characterSlotsGranted", Number(v) || undefined)} />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1.5">Contenido del kit (uno por línea)</label>
              <TextArea rows={5} value={arrayToLines(form.items)} onChange={(e) => set("items", linesToArray(e.target.value))} className="w-full" />
            </div>
          </>
        )}

        {type === "hub-coins-package" && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Coins" type="number" value={form.coins} onChange={(v) => set("coins", Number(v))} />
              <Field label="Bonus" type="number" value={form.bonus} onChange={(v) => set("bonus", Number(v))} />
            </div>
            <Field label="Precio (USD)" type="number" value={form.priceUSD} onChange={(v) => set("priceUSD", Number(v))} />
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input type="checkbox" checked={!!form.popular} onChange={(e) => set("popular", e.target.checked)} /> Marcar como popular
            </label>
          </>
        )}

        {type === "item" && (
          <>
            <Field label="Nombre" value={form.name} onChange={(v) => set("name", v)} />
            <Field label="Descripción" value={form.description} onChange={(v) => set("description", v)} area />
            <Field label="Imagen (URL)" value={form.image} onChange={(v) => set("image", v)} />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Precio (Hub Coins)" type="number" value={form.priceHubCoins} onChange={(v) => set("priceHubCoins", Number(v))} />
              <Field label="Categoría" value={form.category} onChange={(v) => set("category", v)} />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1.5">Tipo</label>
              <select value={form.itemType || "other"} onChange={(e) => set("itemType", e.target.value)} className="h-10 px-3 w-full bg-[#0B0F17] border border-[#1F2937] rounded-lg text-sm text-white">
                {["vehicle", "weapon", "clothing", "accessory", "other"].map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </>
        )}

        {type === "whitelist-fast" && (
          <>
            <Field label="Nombre" value={form.name} onChange={(v) => set("name", v)} />
            <Field label="Descripción" value={form.description} onChange={(v) => set("description", v)} area />
            <Field label="Imagen (ruta)" value={form.image} onChange={(v) => set("image", v)} />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Precio (USD)" type="number" value={form.priceDollars} onChange={(v) => set("priceDollars", Number(v))} />
              <Field label="Categoría" value={form.category} onChange={(v) => set("category", v)} />
            </div>
            <Field label="Color (hex)" value={form.color} onChange={(v) => set("color", v)} />
            <div>
              <label className="text-xs text-slate-400 block mb-1.5">Contenido (uno por línea)</label>
              <TextArea rows={5} value={arrayToLines(form.items)} onChange={(e) => set("items", linesToArray(e.target.value))} className="w-full" />
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}

function Field({ label, value, onChange, type = "text", area = false }: { label: string; value: any; onChange: (v: string) => void; type?: string; area?: boolean }) {
  return (
    <div>
      <label className="text-xs text-slate-400 block mb-1.5">{label}</label>
      {area ? (
        <TextArea rows={3} value={value ?? ""} onChange={(e) => onChange(e.target.value)} className="w-full" />
      ) : (
        <TextInput type={type} value={value ?? ""} onChange={(e) => onChange(e.target.value)} className="w-full" />
      )}
    </div>
  );
}
