"use client";

import { useCallback, useEffect, useState } from "react";
import { Share2, Users, Coins } from "lucide-react";
import { PanelHeader, Card, SectionTitle, Kpi, LoadingBlock, EmptyState, ErrorBlock, formatDate } from "@/components/staff/ui";

interface ReferralData {
  totalCodes: number; totalReferrals: number;
  topReferrers: { userId: string; count: number; coins: number }[];
  recent: { referredUsername: string; referralCode: string; commissionAmount: number; status: string; createdAt: string }[];
}

export default function ReferralsPanel() {
  const [data, setData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    fetch("/api/staff/referrals", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => { if (d.success) setData(d); else setError(d.error); })
      .catch(() => setError("No se pudo conectar con el servidor"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <LoadingBlock />;
  if (error || !data) return <ErrorBlock text={error || "Sin datos"} onRetry={load} />;

  return (
    <div>
      <PanelHeader title="Referidos" subtitle="Sistema de invitaciones de la comunidad" />

      <div className="grid grid-cols-2 gap-4 mb-6">
        <Kpi label="Códigos creados" value={data.totalCodes} icon={Share2} tone="text-blue-400" ring="bg-blue-500/10" />
        <Kpi label="Referidos completados" value={data.totalReferrals} icon={Users} tone="text-emerald-400" ring="bg-emerald-500/10" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div>
          <SectionTitle className="mb-3">Top referidores</SectionTitle>
          {data.topReferrers.length === 0 ? (
            <EmptyState icon={Coins} text="Sin referidores todavía" />
          ) : (
            <div className="space-y-2">
              {data.topReferrers.map((r, i) => (
                <Card key={r.userId} className="p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-blue-600/20 text-blue-400 text-xs font-bold flex items-center justify-center">{i + 1}</span>
                    <span className="text-sm text-white font-mono">{r.userId}</span>
                  </div>
                  <span className="text-sm text-amber-300 font-semibold">{r.count} refs · {r.coins} HC</span>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div>
          <SectionTitle className="mb-3">Actividad reciente</SectionTitle>
          {data.recent.length === 0 ? (
            <EmptyState icon={Share2} text="Sin actividad reciente" />
          ) : (
            <Card>
              <div className="divide-y divide-[#1F2937]">
                {data.recent.map((r, i) => (
                  <div key={i} className="px-4 py-3 text-sm">
                    <div className="text-white">{r.referredUsername} <span className="text-slate-500">vía</span> {r.referralCode}</div>
                    <div className="text-xs text-slate-500">{formatDate(r.createdAt)} · {r.status}</div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
