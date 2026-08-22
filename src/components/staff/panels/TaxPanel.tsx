"use client";

import { useCallback, useEffect, useState } from "react";
import { Scale, Loader2, Save } from "lucide-react";
import { PanelHeader, Card, Kpi, LoadingBlock, ErrorBlock, AccessDenied, useStaffPermissions, useToast } from "@/components/staff/ui";

interface TaxRate { category: string; label: string; percentage: number; }
interface TaxData { rates: TaxRate[]; estimate: { storeVolume: number; storeTaxRate: number; estimatedStoreTax: number } }

export default function TaxPanel(_props: { isDirector?: boolean }) {
  const toast = useToast();
  const { has, loaded } = useStaffPermissions();
  const canView = has("economy.view");
  const canManage = has("economy.manage");
  const [data, setData] = useState<TaxData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/staff/economy/tax", { cache: "no-store" });
      const json = await res.json();
      if (json.success) {
        setData(json);
        setDraft(Object.fromEntries(json.rates.map((r: TaxRate) => [r.category, r.percentage])));
      } else setError(json.error);
    } catch {
      setError("No se pudo conectar con el servidor");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (loaded && canView) load(); else if (loaded) setLoading(false); }, [load, canView, loaded]);

  if (!loaded) return <LoadingBlock />;
  if (!canView) return <AccessDenied title="Impuestos" />;
  if (loading) return <LoadingBlock />;
  if (error || !data) return <ErrorBlock text={error || "Sin datos"} onRetry={load} />;

  const save = async (category: string) => {
    setSaving(category);
    try {
      const res = await fetch("/api/staff/economy/tax", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, percentage: draft[category] }),
      });
      const json = await res.json();
      if (json.success) toast.success("Tasa de impuesto actualizada");
      else toast.error(json.error || "No se pudo guardar la tasa");
      await load();
    } catch {
      toast.error("No se pudo conectar con el servidor");
    } finally {
      setSaving(null);
    }
  };

  return (
    <div>
      <PanelHeader title="Impuestos" subtitle="Presión fiscal por tipo de transacción" />

      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <Kpi label="Volumen de tienda (histórico)" value={`${data.estimate.storeVolume.toLocaleString()} HC`} icon={Scale} tone="text-blue-400" ring="bg-blue-500/10" />
        <Kpi label="Tasa actual de tienda" value={`${data.estimate.storeTaxRate}%`} icon={Scale} tone="text-amber-400" ring="bg-amber-500/10" />
        <Kpi label="Recaudación estimada" value={`${data.estimate.estimatedStoreTax.toLocaleString()} HC`} icon={Scale} tone="text-emerald-400" ring="bg-emerald-500/10" />
      </div>
      <p className="text-xs text-slate-500 mb-6">
        La recaudación es una estimación (volumen real × tu tasa configurada); el servidor todavía no etiqueta
        cada transacción individual como impuesto cobrado.
      </p>

      <div className="grid sm:grid-cols-2 gap-4">
        {data.rates.map((rate) => (
          <Card key={rate.category} className="p-4">
            <div className="text-sm font-medium text-white mb-3">{rate.label}</div>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={0}
                max={100}
                value={draft[rate.category] ?? 0}
                onChange={(e) => setDraft((d) => ({ ...d, [rate.category]: Number(e.target.value) }))}
                className="w-24 h-10 px-3 bg-[#0B0F17] border border-[#1F2937] rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
              />
              <span className="text-slate-500 text-sm">%</span>
              {canManage && (
                <button
                  type="button"
                  onClick={() => save(rate.category)}
                  disabled={saving === rate.category}
                  className="ml-auto h-9 px-3 flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold transition"
                >
                  {saving === rate.category ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                  Guardar
                </button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
