"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, X, Loader2, Percent, Trash2 } from "lucide-react";
import { PanelHeader, Card, Chip, TextInput, PrimaryButton, LoadingBlock, EmptyState, formatDate, useToast } from "@/components/staff/ui";

interface DiscountCode {
  code: string; discountPercentage: number; description: string; createdAt: string; expiresAt: string; isActive: boolean; usageCount: number;
}

/** Reutiliza /api/discounts/manage (sistema de cupones ya existente en el sitio). */
export default function CouponsPanel() {
  const toast = useToast();
  const [codes, setCodes] = useState<DiscountCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ code: "", discountPercentage: "10", description: "", daysToExpire: "30" });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/discounts/manage", { cache: "no-store" });
      const data = await res.json();
      if (data.success) setCodes(data.codes);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/discounts/manage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          data: {
            code: form.code,
            discountPercentage: Number(form.discountPercentage),
            description: form.description,
            daysToExpire: Number(form.daysToExpire),
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Cupón creado");
        setForm({ code: "", discountPercentage: "10", description: "", daysToExpire: "30" });
        setShowForm(false);
        await load();
      } else {
        setError(data.error || "No se pudo crear el cupón");
        toast.error(data.error || "No se pudo crear el cupón");
      }
    } catch {
      toast.error("No se pudo conectar con el servidor");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PanelHeader
        title="Cupones"
        subtitle="Códigos de descuento de la tienda"
        action={
          <PrimaryButton onClick={() => setShowForm((v) => !v)}>
            {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />} Nuevo cupón
          </PrimaryButton>
        }
      />

      {showForm && (
        <Card className="p-4 mb-4">
          <form onSubmit={submit} className="grid sm:grid-cols-4 gap-3">
            <TextInput placeholder="Código (ej. VERANO20)" value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))} required />
            <TextInput type="number" min={1} max={100} placeholder="% descuento" value={form.discountPercentage} onChange={(e) => setForm((f) => ({ ...f, discountPercentage: e.target.value }))} required />
            <TextInput type="number" min={1} max={365} placeholder="Días de validez" value={form.daysToExpire} onChange={(e) => setForm((f) => ({ ...f, daysToExpire: e.target.value }))} required />
            <TextInput placeholder="Descripción" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
            {error && <p className="sm:col-span-4 text-xs text-rose-400">{error}</p>}
            <div className="sm:col-span-4">
              <PrimaryButton type="submit" disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Crear cupón"}</PrimaryButton>
            </div>
          </form>
        </Card>
      )}

      {loading ? <LoadingBlock /> : codes.length === 0 ? (
        <EmptyState icon={Percent} text="No hay cupones creados" />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {codes.map((c) => (
            <Card key={c.code} className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono font-bold text-white">{c.code}</span>
                <Chip tone={c.isActive ? "emerald" : "slate"} label={c.isActive ? "Activo" : "Caducado"} />
              </div>
              <div className="text-2xl font-bold text-blue-400 mb-1">{c.discountPercentage}%</div>
              {c.description && <p className="text-xs text-slate-500 mb-2">{c.description}</p>}
              <div className="text-[11px] text-slate-600 flex items-center justify-between">
                <span>{c.usageCount} usos</span>
                <span>Caduca {formatDate(c.expiresAt)}</span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
