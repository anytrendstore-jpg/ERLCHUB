"use client";

import { useCallback, useEffect, useState } from "react";
import { DollarSign, ShoppingCart, Users, Coins, Crown, Package } from "lucide-react";
import {
  ResponsiveContainer, ComposedChart, Area, Line, CartesianGrid, XAxis, YAxis, Tooltip,
} from "recharts";
import { PanelHeader, Card, Kpi, LoadingBlock, ErrorBlock, AccessDenied, useStaffPermissions } from "@/components/staff/ui";

interface SeriesPoint { key: string; label: string; revenue: number; hcSold: number }
interface Analytics {
  revenue: { gross: number; today: number; week: number; month: number; year: number };
  orders: { total: number; completed: number; pending: number; failed: number };
  aov: number;
  hubCoins: { totalSold: number; byPackage: { catalogId: string; name: string; sold: number; revenue: number }[] };
  customers: { new: number; returning: number };
  memberships: { active: number; mrr: number; churnRatePct: number; mostPopular: string | null };
  kits: { sold: number; hubCoinsSpent: number; uniqueBuyers: number };
  series: SeriesPoint[];
}

function money(n: number) { return `$${n.toLocaleString("es-ES", { maximumFractionDigits: 2 })}`; }

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-[#1F2937] bg-[#0B0F17] px-3 py-2 shadow-xl">
      <p className="text-[11px] text-slate-500 mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} className="text-xs flex items-center gap-1.5" style={{ color: p.color }}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: p.color }} />
          {p.dataKey === "revenue" ? `${money(p.value)}` : `${p.value.toLocaleString("es-ES")} HC`}
        </p>
      ))}
    </div>
  );
}

function RevenueChart({ series }: { series: SeriesPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <ComposedChart data={series} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="shop-revenue-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
        <XAxis dataKey="label" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={{ stroke: "#1F2937" }} tickLine={false} interval={Math.ceil(series.length / 8)} />
        <YAxis yAxisId="revenue" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} width={48} />
        <YAxis yAxisId="hc" orientation="right" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}`} width={44} />
        <Tooltip content={<ChartTooltip />} cursor={{ stroke: "#334155", strokeDasharray: "3 3" }} />
        <Area yAxisId="revenue" type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} fill="url(#shop-revenue-fill)" dot={false} activeDot={{ r: 4, fill: "#3b82f6" }} />
        <Line yAxisId="hc" type="monotone" dataKey="hcSold" stroke="#fbbf24" strokeWidth={2} strokeDasharray="4 3" dot={false} activeDot={{ r: 4, fill: "#fbbf24" }} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

export default function ShopAnalyticsPanel(_props: { isDirector?: boolean }) {
  const { has, loaded } = useStaffPermissions();
  const canView = has("economy.view");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<Analytics | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/staff/economy/shop-analytics", { cache: "no-store" });
      const json = await res.json();
      if (json.success) setData(json);
      else setError(json.error);
    } catch {
      setError("No se pudo conectar con el servidor");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (!loaded) return <LoadingBlock />;
  if (!canView) return <AccessDenied title="Ventas" />;
  if (loading) return <LoadingBlock />;
  if (error || !data) return <ErrorBlock text={error || "Sin datos"} onRetry={load} />;

  return (
    <div>
      <PanelHeader title="Ventas" subtitle="Economy Core — Fase C: métricas reales de tienda, membresías, Hub Coins y kits (sin datos fabricados)" />

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Kpi label="Ingresos totales" value={money(data.revenue.gross)} icon={DollarSign} tone="text-emerald-400" ring="bg-emerald-500/10" />
        <Kpi label="Ingresos hoy" value={money(data.revenue.today)} icon={DollarSign} tone="text-blue-400" ring="bg-blue-500/10" />
        <Kpi label="Órdenes completadas" value={data.orders.completed} icon={ShoppingCart} tone="text-violet-400" ring="bg-violet-500/10" />
        <Kpi label="Ticket promedio (AOV)" value={money(data.aov)} icon={DollarSign} tone="text-amber-400" ring="bg-amber-500/10" />
      </div>

      <Card className="p-5 mb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-white">Ingresos y Hub Coins vendidos — últimos 30 días</h3>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-blue-400"><span className="w-2 h-2 rounded-full bg-blue-400" /> Ingresos (USD)</span>
            <span className="flex items-center gap-1.5 text-amber-400"><span className="w-2 h-2 rounded-full bg-amber-400" /> Hub Coins vendidos</span>
          </div>
        </div>
        <RevenueChart series={data.series} />
      </Card>

      <div className="grid lg:grid-cols-2 gap-4 mb-6">
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2"><Coins className="h-4 w-4 text-amber-400" /> Hub Coins por paquete</h3>
          {data.hubCoins.byPackage.length === 0 ? (
            <p className="text-slate-500 text-sm">Sin ventas todavía.</p>
          ) : (
            <div className="space-y-2">
              {data.hubCoins.byPackage.map((p) => (
                <div key={p.catalogId} className="flex items-center justify-between text-sm">
                  <span className="text-white">{p.name}</span>
                  <span className="text-slate-400">{p.sold} vendidos · <span className="text-emerald-400">{money(p.revenue)}</span></span>
                </div>
              ))}
            </div>
          )}
          <div className="mt-4 pt-3 border-t border-[#1F2937] text-sm text-slate-400">Total Hub Coins vendidos: <span className="text-white font-medium">{data.hubCoins.totalSold.toLocaleString()}</span></div>
        </Card>

        <Card className="p-5">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2"><Users className="h-4 w-4 text-blue-400" /> Clientes (últimos 30 días)</h3>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-white">{data.customers.new}</div>
              <div className="text-xs text-slate-500">Nuevos</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{data.customers.returning}</div>
              <div className="text-xs text-slate-500">Recurrentes</div>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-[#1F2937] text-xs text-slate-500">
            Órdenes: {data.orders.completed} completadas · {data.orders.pending} pendientes · {data.orders.failed} fallidas
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2"><Crown className="h-4 w-4 text-amber-300" /> Membresías</h3>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div><div className="text-xl font-bold text-white">{data.memberships.active}</div><div className="text-[11px] text-slate-500">Activas</div></div>
            <div><div className="text-xl font-bold text-white">{money(data.memberships.mrr)}</div><div className="text-[11px] text-slate-500">MRR</div></div>
            <div><div className="text-xl font-bold text-white">{data.memberships.churnRatePct}%</div><div className="text-[11px] text-slate-500">Churn (30d)</div></div>
          </div>
          {data.memberships.mostPopular && <p className="text-xs text-slate-500 mt-3">Más popular: <span className="text-white">{data.memberships.mostPopular}</span></p>}
        </Card>

        <Card className="p-5">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2"><Package className="h-4 w-4 text-green-400" /> Kits (pagados con Hub Coins)</h3>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div><div className="text-xl font-bold text-white">{data.kits.sold}</div><div className="text-[11px] text-slate-500">Vendidos</div></div>
            <div><div className="text-xl font-bold text-white">{data.kits.hubCoinsSpent.toLocaleString()}</div><div className="text-[11px] text-slate-500">HC gastados</div></div>
            <div><div className="text-xl font-bold text-white">{data.kits.uniqueBuyers}</div><div className="text-[11px] text-slate-500">Compradores</div></div>
          </div>
        </Card>
      </div>
    </div>
  );
}
