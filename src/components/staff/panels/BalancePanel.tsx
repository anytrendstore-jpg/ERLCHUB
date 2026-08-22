"use client";

import { useCallback, useEffect, useState } from "react";
import { Coins, Users, TrendingUp, PieChart, AlertTriangle } from "lucide-react";
import { PanelHeader, Card, Kpi, Chip, LoadingBlock, ErrorBlock, AccessDenied, useStaffPermissions } from "@/components/staff/ui";

interface Balance {
  totalCirculation: number; holders: number; averageBalance: number; topBalance: number;
  concentrationPercent: number; concentrationRisk: "bajo" | "medio" | "alto"; hubCoinsIssuedLast24h: number;
}

const RISK_TONE: Record<string, "emerald" | "amber" | "rose"> = { bajo: "emerald", medio: "amber", alto: "rose" };

export default function BalancePanel(_props: { isDirector?: boolean }) {
  const { has, loaded } = useStaffPermissions();
  const canView = has("economy.view");
  const [data, setData] = useState<Balance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!loaded || !canView) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    fetch("/api/staff/economy/balance", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => { if (d.success) setData(d); else setError(d.error); })
      .catch(() => setError("No se pudo conectar con el servidor"))
      .finally(() => setLoading(false));
  }, [canView, loaded]);

  useEffect(() => { load(); }, [load]);

  if (!loaded) return <LoadingBlock />;
  if (!canView) return <AccessDenied title="Balance e Inflación" />;
  if (loading) return <LoadingBlock />;
  if (error || !data) return <ErrorBlock text={error || "Sin datos"} onRetry={load} />;

  return (
    <div>
      <PanelHeader title="Balance e Inflación" subtitle="Indicadores calculados en vivo sobre los saldos reales de Hub Coins" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Kpi label="Dinero en circulación" value={`${data.totalCirculation.toLocaleString()} HC`} icon={Coins} tone="text-amber-400" ring="bg-amber-500/10" />
        <Kpi label="Cuentas con saldo" value={data.holders} icon={Users} tone="text-blue-400" ring="bg-blue-500/10" />
        <Kpi label="Saldo promedio" value={`${data.averageBalance.toLocaleString()} HC`} icon={TrendingUp} tone="text-emerald-400" ring="bg-emerald-500/10" />
        <Kpi label="Emitido en 24h" value={`${data.hubCoinsIssuedLast24h.toLocaleString()} HC`} icon={Coins} tone="text-purple-400" ring="bg-purple-500/10" />
      </div>

      <Card className="p-5">
        <div className="flex items-center gap-2 text-white font-semibold mb-4">
          <PieChart className="h-4 w-4 text-blue-400" /> Concentración de riqueza
        </div>
        <div className="flex items-end gap-4 mb-3">
          <span className="text-4xl font-bold text-white">{data.concentrationPercent}%</span>
          <Chip tone={RISK_TONE[data.concentrationRisk]} label={`Riesgo ${data.concentrationRisk}`} />
        </div>
        <p className="text-sm text-slate-400">
          El 1% de las cuentas con más Hub Coins concentra el {data.concentrationPercent}% de todo el dinero en
          circulación (cuenta líder: {data.topBalance.toLocaleString()} HC). Por encima de 40% se considera
          riesgo alto de desequilibrio para una economía de este tamaño.
        </p>
        {data.concentrationRisk !== "bajo" && (
          <div className="mt-4 flex items-start gap-2.5 p-3 rounded-lg bg-amber-500/10 ring-1 ring-amber-500/20 text-xs text-amber-200">
            <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            Considera revisar los impuestos a transferencias o los eventos que reparten Hub Coins en bloque.
          </div>
        )}
      </Card>
    </div>
  );
}
