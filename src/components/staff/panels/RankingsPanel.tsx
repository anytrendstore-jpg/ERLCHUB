"use client";

import { useCallback, useEffect, useState } from "react";
import { Trophy } from "lucide-react";
import { PanelHeader, Card, LoadingBlock, EmptyState, ErrorBlock } from "@/components/staff/ui";

interface RankedPlayer { discordId: string; username: string; global_name?: string; avatar?: string; hubCoins: number; membership?: { name: string }; }

const MEDAL = ["text-amber-300", "text-slate-300", "text-orange-400"];

export default function RankingsPanel() {
  const [ranking, setRanking] = useState<RankedPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    fetch("/api/staff/rankings", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => { if (d.success) setRanking(d.ranking); else setError(d.error); })
      .catch(() => setError("No se pudo conectar con el servidor"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <LoadingBlock />;
  if (error) return <ErrorBlock text={error} onRetry={load} />;

  return (
    <div>
      <PanelHeader title="Rankings" subtitle="Top 25 jugadores por Hub Coins" />
      {ranking.length === 0 ? (
        <EmptyState icon={Trophy} text="Todavía no hay jugadores con Hub Coins" />
      ) : (
        <Card>
          <div className="divide-y divide-[#1F2937]">
            {ranking.map((p, i) => (
              <div key={p.discordId} className="flex items-center gap-4 px-4 py-3">
                <span className={`w-7 text-center font-bold ${i < 3 ? MEDAL[i] : "text-slate-500"}`}>{i + 1}</span>
                {p.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.avatar} alt={p.username} className="w-9 h-9 rounded-full" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold text-sm">
                    {(p.global_name || p.username).charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="text-sm text-white truncate">{p.global_name || p.username}</div>
                  {p.membership?.name && <div className="text-xs text-purple-400">{p.membership.name}</div>}
                </div>
                <span className="text-sm font-bold text-amber-300 tabular-nums">{p.hubCoins.toLocaleString()} HC</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
