"use client";

import { useCallback, useEffect, useState } from "react";
import { DollarSign, ShoppingCart, Users, Coins, Crown, Package, Monitor, Smartphone, Tablet, Filter, MousePointerClick, CreditCard, CheckCircle2, Eye, Flame, Trophy } from "lucide-react";
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
  visitors: number;
  devices: { desktop: number; mobile: number; tablet: number };
  trafficSources: { direct: number; discord: number; search: number; social: number; referral: number };
  funnel: { pageViews: number; selectPackage: number; checkoutStart: number; purchases: number; conversionRate: number };
  hubCoinsEconomy: {
    totalIssued: number;
    totalSpent: number;
    circulating: number;
    sinks: { type: string; amount: number }[];
    topHolders: { discordId: string; username: string; avatar?: string; hubCoins: number }[];
  };
}

const SINK_LABEL: Record<string, string> = {
  purchase: "Compras (kits, etc.)",
  spend: "Gasto general",
  withdrawal: "Retiros",
  referral_commission: "Comisiones de referidos",
};

const SOURCE_LABEL: Record<string, string> = {
  direct: "Directo",
  discord: "Discord",
  search: "Buscadores",
  social: "Redes sociales",
  referral: "Otros sitios",
};

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

      <div className="mt-6">
        <h3 className="text-sm font-semibold text-white mb-3">Funnel de la tienda — últimos 30 días</h3>
        <p className="text-xs text-slate-500 mb-4">
          Tracking anónimo (sin geolocalización ni huella digital) en las páginas de Hub Coins, membresías y kits.
          La compra final se mide contra órdenes reales, no un evento separado.
        </p>
        <Card className="p-5 mb-4">
          <div className="grid sm:grid-cols-4 gap-4">
            {[
              { icon: Eye, label: "Vistas de página", value: data.funnel.pageViews, color: "text-blue-400" },
              { icon: MousePointerClick, label: "Seleccionaron paquete", value: data.funnel.selectPackage, color: "text-violet-400" },
              { icon: CreditCard, label: "Iniciaron checkout", value: data.funnel.checkoutStart, color: "text-amber-400" },
              { icon: CheckCircle2, label: "Compraron", value: data.funnel.purchases, color: "text-emerald-400" },
            ].map((step, i) => (
              <div key={step.label} className="flex items-center gap-3">
                {i > 0 && <div className="hidden sm:block w-px h-10 bg-[#1F2937] -ml-2 mr-1" />}
                <step.icon className={`h-5 w-5 flex-shrink-0 ${step.color}`} />
                <div>
                  <div className="text-xl font-bold text-white">{step.value.toLocaleString("es-ES")}</div>
                  <div className="text-[11px] text-slate-500">{step.label}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-[#1F2937] text-sm text-slate-400">
            Tasa de conversión: <span className="text-emerald-400 font-semibold">{data.funnel.conversionRate}%</span>
            <span className="text-slate-600"> · </span>
            Visitantes únicos: <span className="text-white font-medium">{data.visitors.toLocaleString("es-ES")}</span>
          </div>
        </Card>

        <div className="grid lg:grid-cols-2 gap-4">
          <Card className="p-5">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2"><Monitor className="h-4 w-4 text-blue-400" /> Dispositivo</h3>
            <div className="space-y-2">
              {[
                { key: "desktop", icon: Monitor, label: "Escritorio" },
                { key: "mobile", icon: Smartphone, label: "Móvil" },
                { key: "tablet", icon: Tablet, label: "Tablet" },
              ].map(({ key, icon: Icon, label }) => {
                const value = data.devices[key as keyof typeof data.devices];
                const pct = data.visitors > 0 ? Math.round((value / (data.devices.desktop + data.devices.mobile + data.devices.tablet || 1)) * 100) : 0;
                return (
                  <div key={key} className="flex items-center gap-3 text-sm">
                    <Icon className="h-4 w-4 text-slate-500 flex-shrink-0" />
                    <span className="text-white w-20">{label}</span>
                    <div className="flex-1 h-1.5 rounded-full bg-[#1F2937] overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-slate-400 text-xs w-16 text-right">{value.toLocaleString("es-ES")} ({pct}%)</span>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2"><Filter className="h-4 w-4 text-violet-400" /> Fuente de tráfico</h3>
            <div className="space-y-2">
              {Object.entries(data.trafficSources).map(([key, value]) => {
                const total = Object.values(data.trafficSources).reduce((a, b) => a + b, 0) || 1;
                const pct = Math.round((value / total) * 100);
                return (
                  <div key={key} className="flex items-center gap-3 text-sm">
                    <span className="text-white w-24 flex-shrink-0">{SOURCE_LABEL[key] || key}</span>
                    <div className="flex-1 h-1.5 rounded-full bg-[#1F2937] overflow-hidden">
                      <div className="h-full bg-violet-500 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-slate-400 text-xs w-16 text-right">{value.toLocaleString("es-ES")} ({pct}%)</span>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-sm font-semibold text-white mb-3">Economía de Hub Coins</h3>
        <div className="grid sm:grid-cols-3 gap-4 mb-4">
          <Kpi label="HC emitidos (total histórico)" value={data.hubCoinsEconomy.totalIssued.toLocaleString("es-ES")} icon={Coins} tone="text-amber-400" ring="bg-amber-500/10" />
          <Kpi label="HC gastados (total histórico)" value={data.hubCoinsEconomy.totalSpent.toLocaleString("es-ES")} icon={Flame} tone="text-orange-400" ring="bg-orange-500/10" />
          <Kpi label="HC en circulación ahora" value={data.hubCoinsEconomy.circulating.toLocaleString("es-ES")} icon={DollarSign} tone="text-emerald-400" ring="bg-emerald-500/10" />
        </div>
        <div className="grid lg:grid-cols-2 gap-4">
          <Card className="p-5">
            <h3 className="text-sm font-semibold text-white mb-3">En qué se gastan (sinks)</h3>
            {data.hubCoinsEconomy.sinks.length === 0 ? (
              <p className="text-slate-500 text-sm">Sin gastos registrados todavía.</p>
            ) : (
              <div className="space-y-2">
                {data.hubCoinsEconomy.sinks.map((s) => {
                  const total = data.hubCoinsEconomy.totalSpent || 1;
                  const pct = Math.round((s.amount / total) * 100);
                  return (
                    <div key={s.type} className="flex items-center gap-3 text-sm">
                      <span className="text-white w-40 flex-shrink-0 truncate">{SINK_LABEL[s.type] || s.type}</span>
                      <div className="flex-1 h-1.5 rounded-full bg-[#1F2937] overflow-hidden">
                        <div className="h-full bg-orange-500 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-slate-400 text-xs w-24 text-right">{s.amount.toLocaleString("es-ES")} HC</span>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          <Card className="p-5">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2"><Trophy className="h-4 w-4 text-amber-300" /> Top holders</h3>
            {data.hubCoinsEconomy.topHolders.length === 0 ? (
              <p className="text-slate-500 text-sm">Sin datos todavía.</p>
            ) : (
              <div className="space-y-2">
                {data.hubCoinsEconomy.topHolders.map((u, i) => (
                  <div key={u.discordId} className="flex items-center gap-3 text-sm">
                    <span className="text-slate-600 w-4 text-xs">{i + 1}</span>
                    <span className="text-white flex-1 truncate">{u.username}</span>
                    <span className="text-amber-400 font-medium">{u.hubCoins.toLocaleString("es-ES")} HC</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
