"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Search, Users, Coins, Crown, Zap, Hash, Calendar, X, FileSearch } from "lucide-react";
import { PanelHeader, Card, TextInput, EmptyState, Chip, Kpi, Button, IconButton, Skeleton, SkeletonKpi, formatDate } from "@/components/staff/ui";
import PlayerDossierModal from "@/components/staff/panels/PlayerDossierModal";

interface Player {
  discordId: string; username: string; global_name?: string; avatar?: string;
  hubCoins?: number; membership?: { name: string }; whitelistFast?: { active: boolean }; createdAt?: string;
}

type FilterId = "all" | "membership" | "fast";

const FILTERS: { id: FilterId; label: string }[] = [
  { id: "all", label: "Todos" },
  { id: "membership", label: "Con membresía" },
  { id: "fast", label: "Whitelist Fast" },
];

export default function PlayersPanel() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterId>("all");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Player | null>(null);
  const [dossierId, setDossierId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      const res = await fetch(`/api/staff/players?${params}`, { cache: "no-store" });
      const data = await res.json();
      if (data.success) { setPlayers(data.players); setTotal(data.total); }
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [load]);

  const visible = useMemo(() => {
    if (filter === "membership") return players.filter((p) => p.membership?.name);
    if (filter === "fast") return players.filter((p) => p.whitelistFast?.active);
    return players;
  }, [players, filter]);

  const withMembership = players.filter((p) => p.membership?.name).length;
  const withFast = players.filter((p) => p.whitelistFast?.active).length;
  const totalHubCoins = players.reduce((sum, p) => sum + (p.hubCoins || 0), 0);

  return (
    <div>
      <PanelHeader
        title="Jugadores"
        subtitle={`${total} cuentas registradas en el sitio`}
        action={
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <TextInput value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por usuario o ID..." className="pl-10 w-72" />
          </div>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {loading && players.length === 0 ? (
          <>
            <SkeletonKpi /><SkeletonKpi /><SkeletonKpi /><SkeletonKpi />
          </>
        ) : (
          <>
            <Kpi label="Total registrados" value={total} icon={Users} tone="text-blue-400" ring="bg-blue-500/10 ring-1 ring-blue-500/30" />
            <Kpi label="Con membresía" value={withMembership} icon={Crown} tone="text-purple-400" ring="bg-purple-500/10 ring-1 ring-purple-500/30" />
            <Kpi label="Whitelist Fast" value={withFast} icon={Zap} tone="text-amber-400" ring="bg-amber-500/10 ring-1 ring-amber-500/30" />
            <Kpi label="HubCoins en cuentas" value={totalHubCoins.toLocaleString()} icon={Coins} tone="text-emerald-400" ring="bg-emerald-500/10 ring-1 ring-emerald-500/30" />
          </>
        )}
      </div>

      <div className="flex items-center gap-2 mb-4">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === f.id ? "bg-blue-600 text-white" : "bg-[#111827] text-slate-400 hover:text-white border border-[#1F2937]"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="flex gap-4 items-start">
        <Card className="flex-1 overflow-hidden">
          {loading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
                  <Skeleton className="w-32 h-3.5 flex-shrink-0" />
                  <Skeleton className="w-24 h-3 flex-shrink-0" />
                  <Skeleton className="w-16 h-5 rounded-md flex-shrink-0 ml-auto" />
                  <Skeleton className="w-14 h-3" />
                </div>
              ))}
            </div>
          ) : visible.length === 0 ? (
            <EmptyState icon={Users} text="No se encontraron jugadores" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#1F2937] text-left text-[11px] uppercase tracking-wide text-slate-500">
                    <th className="px-4 py-3 font-medium">Usuario</th>
                    <th className="px-4 py-3 font-medium">ID de Discord</th>
                    <th className="px-4 py-3 font-medium">Membresía</th>
                    <th className="px-4 py-3 font-medium">Whitelist</th>
                    <th className="px-4 py-3 font-medium text-right">HubCoins</th>
                    <th className="px-4 py-3 font-medium text-right">Registrado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1F2937]">
                  {visible.map((p) => (
                    <tr
                      key={p.discordId}
                      onClick={() => setSelected(p)}
                      className={`cursor-pointer transition-colors ${selected?.discordId === p.discordId ? "bg-blue-500/10" : "hover:bg-white/[0.03]"}`}
                    >
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2.5">
                          {p.avatar ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={p.avatar} alt={p.username} className="w-8 h-8 rounded-full flex-shrink-0" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold text-xs flex-shrink-0">
                              {(p.global_name || p.username || "?").charAt(0).toUpperCase()}
                            </div>
                          )}
                          <span className="text-white font-medium truncate max-w-[160px]">{p.global_name || p.username}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-slate-500 font-mono text-xs">{p.discordId}</td>
                      <td className="px-4 py-2.5">
                        {p.membership?.name ? <Chip tone="purple" label={p.membership.name} /> : <span className="text-slate-600 text-xs">—</span>}
                      </td>
                      <td className="px-4 py-2.5">
                        {p.whitelistFast?.active ? <Chip tone="amber" label="Fast" /> : <span className="text-slate-600 text-xs">—</span>}
                      </td>
                      <td className="px-4 py-2.5 text-right text-amber-300 tabular-nums">{(p.hubCoins || 0).toLocaleString()}</td>
                      <td className="px-4 py-2.5 text-right text-slate-500 text-xs">{formatDate(p.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {selected && (
          <Card className="w-72 flex-shrink-0 p-5 relative animate-in fade-in slide-in-from-right-4 duration-200">
            <IconButton icon={X} label="Cerrar detalle" variant="ghost" size="sm" onClick={() => setSelected(null)} className="absolute top-3 right-3" />
            <div className="flex flex-col items-center text-center mb-4">
              {selected.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={selected.avatar} alt={selected.username} className="w-16 h-16 rounded-full mb-3" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold text-xl mb-3">
                  {(selected.global_name || selected.username || "?").charAt(0).toUpperCase()}
                </div>
              )}
              <div className="text-white font-semibold">{selected.global_name || selected.username}</div>
              <div className="text-slate-500 text-xs">@{selected.username}</div>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-slate-500 text-xs"><Hash className="h-3.5 w-3.5" /> Discord ID</span>
                <span className="text-white font-mono text-xs">{selected.discordId}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-slate-500 text-xs"><Coins className="h-3.5 w-3.5" /> HubCoins</span>
                <span className="text-amber-300 tabular-nums">{(selected.hubCoins || 0).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-slate-500 text-xs"><Crown className="h-3.5 w-3.5" /> Membresía</span>
                {selected.membership?.name ? <Chip tone="purple" label={selected.membership.name} /> : <span className="text-slate-600 text-xs">Ninguna</span>}
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-slate-500 text-xs"><Zap className="h-3.5 w-3.5" /> Whitelist Fast</span>
                {selected.whitelistFast?.active ? <Chip tone="amber" label="Activo" /> : <span className="text-slate-600 text-xs">No</span>}
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-slate-500 text-xs"><Calendar className="h-3.5 w-3.5" /> Registrado</span>
                <span className="text-white text-xs">{formatDate(selected.createdAt)}</span>
              </div>
            </div>
            <Button onClick={() => setDossierId(selected.discordId)} icon={FileSearch} className="w-full mt-4">
              Ver expediente completo
            </Button>
          </Card>
        )}
      </div>

      {dossierId && <PlayerDossierModal discordId={dossierId} onClose={() => setDossierId(null)} />}
    </div>
  );
}
