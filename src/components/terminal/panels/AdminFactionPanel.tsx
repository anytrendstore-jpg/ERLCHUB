"use client";

import { useCallback, useEffect, useState } from "react";
import { Lock, Plus, Trash2, Loader2 } from "lucide-react";
import { useDepartment } from "@/contexts/DepartmentContext";

interface Rank { id: string; name: string; level: number; permissions: string[]; salary: number }
interface Member { playerId?: string; playerName: string; rankId: string; status: "active" | "inactive"; joinedAt: string }
interface Faction { id: string; name: string; abbreviation: string; ranks: Rank[]; members: Member[] }

/**
 * Administración de la propia facción, desde la terminal — versión reducida
 * de Staff → Facciones, gateada por rango real (nivel 4+) en vez de permiso
 * de Staff. Mismos datos, misma auditoría, un origen de mutación distinto.
 */
export default function AdminFactionPanel() {
  const department = useDepartment();
  const [loading, setLoading] = useState(true);
  const [faction, setFaction] = useState<Faction | null>(null);
  const [myLevel, setMyLevel] = useState(0);
  const [commandLevel, setCommandLevel] = useState(4);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<"members" | "ranks">("members");

  const [memberForm, setMemberForm] = useState({ playerId: "", playerName: "", rankId: "" });
  const [rankForm, setRankForm] = useState({ name: "", level: 1, salary: 0 });

  const load = useCallback(async () => {
    const res = await fetch(`/api/terminal/${department.slug}/faction`, { cache: "no-store" });
    const data = await res.json();
    if (data.success) {
      setFaction(data.faction);
      setMyLevel(data.myRankLevel);
      setCommandLevel(data.commandLevel);
      setError(null);
    } else {
      setError(data.error || "No se pudo cargar la facción");
    }
    setLoading(false);
  }, [department.slug]);

  useEffect(() => { load(); }, [load]);

  const act = async (payload: Record<string, unknown>) => {
    setBusy(true);
    try {
      const res = await fetch(`/api/terminal/${department.slug}/faction`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data.success) setError(data.error || "No se pudo completar la acción");
      else setError(null);
      await load();
    } catch {
      setError("No se pudo conectar con el servidor");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return <div className="h-full flex items-center justify-center"><Loader2 className="w-4 h-4 text-[#454f6b] animate-spin" /></div>;
  }

  if (error && !faction) {
    return (
      <div className="h-full flex items-center justify-center text-center p-4">
        <p className="text-[#6d7999] text-[11px]">{error}</p>
      </div>
    );
  }

  if (!faction) return null;

  const isCommand = myLevel >= commandLevel;

  if (!isCommand) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-4 gap-2">
        <Lock className="w-5 h-5 text-[#454f6b]" />
        <p className="text-[#6d7999] text-[11px]">Necesitás jerarquía de mando (nivel {commandLevel}+) para administrar {faction.name}.</p>
        <p className="text-[#454f6b] text-[10px] font-mono">Tu nivel actual: {myLevel}</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col text-[11px]">
      <div className="flex border-b border-[#151d31] flex-shrink-0">
        {(["members", "ranks"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-2 text-[10px] font-semibold uppercase tracking-wide ${tab === t ? "text-[#6f93d6] border-b-2 border-[#3c68c9]" : "text-[#454f6b] hover:text-[#6d7999]"}`}
          >
            {t === "members" ? "Miembros" : "Rangos"}
          </button>
        ))}
      </div>

      {error && <p className="text-[#c0665c] text-[10px] px-3 pt-2">{error}</p>}

      {tab === "members" && (
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          <div className="space-y-1.5 bg-[#121a2e] border border-[#1e2a45] rounded p-2">
            <input placeholder="Nombre" value={memberForm.playerName} onChange={(e) => setMemberForm({ ...memberForm, playerName: e.target.value })} className="w-full bg-[#0d1424] border border-[#1e2a45] rounded px-2 py-1 text-[10.5px] text-[#dde3f2] placeholder-[#454f6b] focus:outline-none focus:border-[#3c68c9]" />
            <input placeholder="ID de Discord (opcional)" value={memberForm.playerId} onChange={(e) => setMemberForm({ ...memberForm, playerId: e.target.value.trim() })} className="w-full bg-[#0d1424] border border-[#1e2a45] rounded px-2 py-1 text-[10.5px] text-[#dde3f2] placeholder-[#454f6b] focus:outline-none focus:border-[#3c68c9]" />
            <select value={memberForm.rankId} onChange={(e) => setMemberForm({ ...memberForm, rankId: e.target.value })} className="w-full bg-[#0d1424] border border-[#1e2a45] rounded px-2 py-1 text-[10.5px] text-[#dde3f2] focus:outline-none focus:border-[#3c68c9]">
              <option value="">Rango...</option>
              {faction.ranks.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
            <button
              disabled={busy || !memberForm.playerName.trim() || !memberForm.rankId}
              onClick={async () => { await act({ action: "add_member", ...memberForm, playerId: memberForm.playerId || undefined }); setMemberForm({ playerId: "", playerName: "", rankId: "" }); }}
              className="w-full flex items-center justify-center gap-1 bg-[#3c68c9] hover:bg-[#4d78d6] disabled:opacity-40 text-white rounded py-1 text-[10.5px] font-semibold"
            >
              <Plus className="w-3 h-3" /> Añadir miembro
            </button>
          </div>

          <div className="space-y-1">
            {faction.members.length === 0 && <p className="text-[#454f6b] text-[10.5px]">Sin miembros registrados.</p>}
            {faction.members.map((m) => (
              <div key={m.playerName} className="flex items-center justify-between gap-2 px-2 py-1.5 rounded bg-[#0d1424] border border-[#151d31]">
                <div className="min-w-0">
                  <p className="text-[#dde3f2] truncate">{m.playerName}</p>
                  <p className="text-[#454f6b] text-[9.5px] font-mono">{m.playerId ? "● vinculado" : "○ sin vincular"}</p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <select
                    value={m.rankId}
                    onChange={(e) => act({ action: "change_member_rank", playerName: m.playerName, rankId: e.target.value })}
                    className="bg-[#121a2e] border border-[#1e2a45] rounded px-1.5 py-1 text-[10px] text-[#dde3f2] focus:outline-none"
                  >
                    {faction.ranks.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                  <button onClick={() => act({ action: "remove_member", playerName: m.playerName })} className="text-[#c0665c] hover:text-[#e08078] p-1">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "ranks" && (
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          <div className="flex gap-1.5 bg-[#121a2e] border border-[#1e2a45] rounded p-2">
            <input placeholder="Nombre" value={rankForm.name} onChange={(e) => setRankForm({ ...rankForm, name: e.target.value })} className="flex-1 min-w-0 bg-[#0d1424] border border-[#1e2a45] rounded px-2 py-1 text-[10.5px] text-[#dde3f2] placeholder-[#454f6b] focus:outline-none focus:border-[#3c68c9]" />
            <input type="number" placeholder="Nivel" value={rankForm.level} onChange={(e) => setRankForm({ ...rankForm, level: Number(e.target.value) })} className="w-16 bg-[#0d1424] border border-[#1e2a45] rounded px-2 py-1 text-[10.5px] text-[#dde3f2] focus:outline-none focus:border-[#3c68c9]" />
            <button
              disabled={busy || !rankForm.name.trim()}
              onClick={async () => { await act({ action: "add_rank", ...rankForm }); setRankForm({ name: "", level: 1, salary: 0 }); }}
              className="flex items-center justify-center gap-1 bg-[#3c68c9] hover:bg-[#4d78d6] disabled:opacity-40 text-white rounded px-2 text-[10.5px] font-semibold flex-shrink-0"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-1">
            {[...faction.ranks].sort((a, b) => b.level - a.level).map((r) => (
              <div key={r.id} className="flex items-center justify-between px-2 py-1.5 rounded bg-[#0d1424] border border-[#151d31]">
                <span className="text-[#dde3f2]">{r.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[#454f6b] text-[9.5px] font-mono">NIVEL {r.level}</span>
                  <button onClick={() => act({ action: "delete_rank", rankId: r.id })} className="text-[#c0665c] hover:text-[#e08078] p-1">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
