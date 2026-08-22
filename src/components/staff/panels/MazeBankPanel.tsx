"use client";

import { useCallback, useEffect, useState } from "react";
import { Landmark, Coins, Users, Search } from "lucide-react";
import { PanelHeader, Card, Chip, Kpi, TextInput, Select, LoadingBlock, EmptyState, ErrorBlock, AccessDenied, formatDate, useStaffPermissions } from "@/components/staff/ui";

interface Tx { id: string; userId: string; amount: number; type: string; description: string; status: string; timestamp: string; }
interface BankData { transactions: Tx[]; totalCirculation: number; holders: number; byType: { type: string; total: number; count: number }[]; }

const STATUS_TONE: Record<string, "emerald" | "amber" | "rose" | "slate"> = {
  completed: "emerald", pending: "amber", rejected: "rose", failed: "rose", cancelled: "slate",
};

export default function MazeBankPanel(_props: { isDirector?: boolean }) {
  const { has, loaded } = useStaffPermissions();
  const canView = has("economy.view");
  const [data, setData] = useState<BankData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [type, setType] = useState("all");
  const [status, setStatus] = useState("all");
  const [userId, setUserId] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (type !== "all") params.set("type", type);
      if (status !== "all") params.set("status", status);
      if (userId.trim()) params.set("userId", userId.trim());
      const res = await fetch(`/api/staff/economy/bank?${params}`, { cache: "no-store" });
      const json = await res.json();
      if (json.success) setData(json); else setError(json.error);
    } catch {
      setError("No se pudo conectar con el servidor");
    } finally {
      setLoading(false);
    }
  }, [type, status, userId]);

  useEffect(() => {
    if (!loaded || !canView) { setLoading(false); return; }
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load, canView, loaded]);

  if (!loaded) return <LoadingBlock />;
  if (!canView) return <AccessDenied title="Maze Bank" />;
  if (loading && !data) return <LoadingBlock />;
  if (error) return <ErrorBlock text={error} onRetry={load} />;
  if (!data) return null;

  return (
    <div>
      <PanelHeader
        title="Maze Bank"
        subtitle="Libro mayor del servidor — todo el flujo de Hub Coins, en tiempo real"
        action={
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <TextInput value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="Filtrar por ID de usuario..." className="pl-10 w-64" />
          </div>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Kpi label="Dinero en circulación" value={`${data.totalCirculation.toLocaleString()} HC`} icon={Coins} tone="text-amber-400" ring="bg-amber-500/10" />
        <Kpi label="Cuentas con saldo" value={data.holders} icon={Users} tone="text-blue-400" ring="bg-blue-500/10" />
        {data.byType.slice(0, 2).map((t) => (
          <Kpi key={t.type} label={`Total ${t.type}`} value={`${t.total.toLocaleString()} HC`} icon={Landmark} tone="text-emerald-400" ring="bg-emerald-500/10" />
        ))}
      </div>

      <div className="flex gap-2 mb-4">
        <Select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="all">Todos los tipos</option>
          <option value="purchase">Compra</option>
          <option value="spend">Gasto</option>
          <option value="referral_commission">Comisión de referido</option>
        </Select>
        <Select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="all">Todos los estados</option>
          <option value="completed">Completado</option>
          <option value="pending">Pendiente</option>
          <option value="rejected">Rechazado</option>
        </Select>
      </div>

      {data.transactions.length === 0 ? (
        <EmptyState icon={Landmark} text="No hay movimientos que coincidan con el filtro" />
      ) : (
        <Card>
          <div className="divide-y divide-[#1F2937] max-h-[600px] overflow-y-auto">
            {data.transactions.map((t) => (
              <div key={t.id} className="flex items-center justify-between gap-4 px-4 py-3">
                <div className="min-w-0">
                  <div className="text-sm text-white truncate">{t.description || t.type}</div>
                  <div className="text-xs text-slate-500 font-mono truncate">{t.userId}</div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className={`text-sm font-semibold ${t.amount < 0 ? "text-rose-300" : "text-amber-300"}`}>
                    {t.amount > 0 ? "+" : ""}{t.amount.toLocaleString()} HC
                  </span>
                  <Chip tone={STATUS_TONE[t.status] || "slate"} label={t.status} />
                  <span className="text-[11px] text-slate-600 hidden sm:inline">{formatDate(t.timestamp)}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
