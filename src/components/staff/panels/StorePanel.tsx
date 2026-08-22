"use client";

import { useCallback, useEffect, useState } from "react";
import { ShoppingCart, Coins, Shield, Zap, Users } from "lucide-react";
import { PanelHeader, Kpi, LoadingBlock, ErrorBlock } from "@/components/staff/ui";

interface TiendaStats {
  totalOrders: number; hubCoinsOrders: number; membershipOrders: number; whitelistOrders: number; activeUsers: number;
}

/** Reutiliza /api/tienda/stats (ya existente en el sitio) para Directivos > Tienda / Stats Tienda. */
export default function StorePanel({ title }: { title: string }) {
  const [stats, setStats] = useState<TiendaStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    fetch("/api/tienda/stats", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => { if (d.success) setStats(d.stats); else setError(d.error); })
      .catch(() => setError("No se pudo conectar con el servidor"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <LoadingBlock />;
  if (error || !stats) return <ErrorBlock text={error || "Sin datos"} onRetry={load} />;

  return (
    <div>
      <PanelHeader title={title} subtitle="Datos reales de la tienda pública (/api/tienda/stats)" />
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Kpi label="Pedidos totales" value={stats.totalOrders} icon={ShoppingCart} tone="text-blue-400" ring="bg-blue-500/10" />
        <Kpi label="Pedidos Hub Coins" value={stats.hubCoinsOrders} icon={Coins} tone="text-amber-400" ring="bg-amber-500/10" />
        <Kpi label="Membresías vendidas" value={stats.membershipOrders} icon={Shield} tone="text-purple-400" ring="bg-purple-500/10" />
        <Kpi label="Whitelist Fast" value={stats.whitelistOrders} icon={Zap} tone="text-rose-400" ring="bg-rose-500/10" />
        <Kpi label="Usuarios activos" value={stats.activeUsers} icon={Users} tone="text-emerald-400" ring="bg-emerald-500/10" />
      </div>
    </div>
  );
}
