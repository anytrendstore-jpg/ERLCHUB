"use client";

import { useCallback, useEffect, useState } from "react";
import { ShoppingBag, Coins, Package } from "lucide-react";
import { PanelHeader, Card, Chip, Kpi, LoadingBlock, EmptyState, ErrorBlock, formatDate } from "@/components/staff/ui";

interface Purchase { id: string; username: string; amount: number; description: string; status: string; timestamp: string; kitNames?: string[]; }

const STATUS_TONE: Record<string, "emerald" | "amber" | "rose" | "slate"> = {
  completed: "emerald", pending: "amber", rejected: "rose", failed: "rose", cancelled: "slate",
};

export default function PurchasesPanel() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    fetch("/api/staff/purchases", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => { if (d.success) { setPurchases(d.purchases); setTotal(d.totalHubCoinsSold); } else setError(d.error); })
      .catch(() => setError("No se pudo conectar con el servidor"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <LoadingBlock />;
  if (error) return <ErrorBlock text={error} onRetry={load} />;

  return (
    <div>
      <PanelHeader title="Compras" subtitle="Últimas transacciones de Hub Coins" />
      <div className="mb-6">
        <Kpi label="Hub Coins vendidos (histórico)" value={total.toLocaleString()} icon={Coins} tone="text-amber-400" ring="bg-amber-500/10" />
      </div>

      {purchases.length === 0 ? (
        <EmptyState icon={ShoppingBag} text="No hay compras registradas todavía" />
      ) : (
        <Card>
          <div className="divide-y divide-[#1F2937]">
            {purchases.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-4 px-4 py-3">
                <div className="min-w-0">
                  <div className="text-sm text-white truncate">{p.username}</div>
                  {p.kitNames?.length ? (
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {p.kitNames.map((name, i) => (
                        <span key={i} className="inline-flex items-center gap-1 text-xs font-semibold text-white bg-gradient-to-r from-blue-600/40 to-purple-600/40 border border-blue-400/30 rounded-lg px-2 py-1 shadow-[0_0_10px_-4px_rgba(59,130,246,0.5)]">
                          <Package className="h-3 w-3 text-blue-300 flex-shrink-0" /> {name}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-slate-500 truncate">{p.description}</div>
                  )}
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-sm font-semibold text-amber-300">{p.amount.toLocaleString()}</span>
                  <Chip tone={STATUS_TONE[p.status] || "slate"} label={p.status} />
                  <span className="text-[11px] text-slate-600 hidden sm:inline">{formatDate(p.timestamp)}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
