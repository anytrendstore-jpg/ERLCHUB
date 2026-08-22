"use client";

import { useCallback, useEffect, useState } from "react";
import { Package, Search, Send, Crosshair, Car, Home, Receipt } from "lucide-react";
import { PanelHeader, Card, Chip, TextInput, TextArea, Button, Modal, LoadingBlock, EmptyState, ErrorBlock, AccessDenied, formatDate, useStaffPermissions, useToast } from "@/components/staff/ui";

interface Player {
  discordId: string;
  username: string;
  global_name?: string;
}

interface InventoryItem {
  itemType: 'compras' | 'armas' | 'vehiculos' | 'propiedades';
  id: string;
  name: string;
  category: string;
  source: string;
  purchasedAt: string;
}

const ICON_BY_TYPE: Record<InventoryItem['itemType'], any> = { compras: Package, armas: Crosshair, vehiculos: Car, propiedades: Home };
const LABEL_BY_TYPE: Record<InventoryItem['itemType'], string> = { compras: 'Compra', armas: 'Arma', vehiculos: 'Vehículo', propiedades: 'Propiedad' };
const TRANSFERABLE = new Set(['armas', 'vehiculos', 'propiedades']);

export default function InventoryPanel(_props: { isDirector?: boolean }) {
  const toast = useToast();
  const { has, loaded } = useStaffPermissions();
  const canView = has("economy.view");
  const canManage = has("economy.manage");
  const [playerSearch, setPlayerSearch] = useState("");
  const [playerResults, setPlayerResults] = useState<Player[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transferTarget, setTransferTarget] = useState<InventoryItem | null>(null);
  const [transferQuery, setTransferQuery] = useState("");
  const [transferResults, setTransferResults] = useState<Player[]>([]);
  const [transferTo, setTransferTo] = useState<Player | null>(null);
  const [transferReason, setTransferReason] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!canView || !playerSearch.trim()) { setPlayerResults([]); return; }
    const t = setTimeout(async () => {
      const res = await fetch(`/api/staff/players?search=${encodeURIComponent(playerSearch.trim())}`, { cache: "no-store" });
      const data = await res.json();
      if (data.success) setPlayerResults(data.players);
    }, 250);
    return () => clearTimeout(t);
  }, [playerSearch, canView]);

  const loadInventory = useCallback(async (player: Player) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/staff/economy/inventory?discordId=${player.discordId}`, { cache: "no-store" });
      const data = await res.json();
      if (data.success) setItems(data.items); else setError(data.error);
    } catch {
      setError("No se pudo conectar con el servidor");
    } finally {
      setLoading(false);
    }
  }, []);

  const selectPlayer = (player: Player) => {
    setSelectedPlayer(player);
    setPlayerSearch("");
    setPlayerResults([]);
    loadInventory(player);
  };

  useEffect(() => {
    if (!transferTarget || !transferQuery.trim()) { setTransferResults([]); return; }
    const t = setTimeout(async () => {
      const res = await fetch(`/api/staff/players?search=${encodeURIComponent(transferQuery.trim())}`, { cache: "no-store" });
      const data = await res.json();
      if (data.success) setTransferResults(data.players.filter((p: Player) => p.discordId !== selectedPlayer?.discordId));
    }, 250);
    return () => clearTimeout(t);
  }, [transferQuery, transferTarget, selectedPlayer]);

  const confirmTransfer = async () => {
    if (!transferTarget || !transferTo || !selectedPlayer) return;
    setSaving(true);
    try {
      const res = await fetch("/api/staff/economy/inventory", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemType: transferTarget.itemType, itemId: transferTarget.id, fromId: selectedPlayer.discordId, toUserId: transferTo.discordId, reason: transferReason.trim() || undefined }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Objeto transferido");
        setTransferTarget(null);
        setTransferTo(null);
        setTransferQuery("");
        setTransferReason("");
        await loadInventory(selectedPlayer);
      } else {
        setError(data.error);
        toast.error(data.error || "No se pudo transferir el objeto");
      }
    } catch {
      toast.error("No se pudo conectar con el servidor");
    } finally {
      setSaving(false);
    }
  };

  if (!loaded) return <LoadingBlock />;
  if (!canView) return <AccessDenied title="Inventarios" />;

  return (
    <div>
      <PanelHeader
        title="Inventarios de jugadores"
        subtitle="Consulta el inventario real de un personaje y transfiere objetos regulados de forma auditada"
        action={
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <TextInput value={playerSearch} onChange={(e) => setPlayerSearch(e.target.value)} placeholder="Buscar jugador por nombre o ID..." className="pl-10 w-72" />
            {playerResults.length > 0 && (
              <Card className="absolute z-10 mt-1 w-72 max-h-56 overflow-y-auto">
                {playerResults.map((p) => (
                  <button key={p.discordId} onClick={() => selectPlayer(p)} className="w-full text-left px-3 py-2 hover:bg-[#151C2A] text-sm text-white transition">
                    {p.global_name || p.username}
                    <span className="block text-[11px] text-slate-500 font-mono">{p.discordId}</span>
                  </button>
                ))}
              </Card>
            )}
          </div>
        }
      />

      {!selectedPlayer ? (
        <EmptyState icon={Package} text="Busca un jugador para ver su inventario real" />
      ) : loading ? (
        <LoadingBlock />
      ) : error ? (
        <ErrorBlock text={error} onRetry={() => selectedPlayer && loadInventory(selectedPlayer)} />
      ) : (
        <div>
          <div className="mb-4 flex items-center gap-2">
            <span className="text-white font-medium">{selectedPlayer.global_name || selectedPlayer.username}</span>
            <span className="text-[11px] text-slate-500 font-mono">{selectedPlayer.discordId}</span>
            <Chip tone="blue" label={`${items.length} objetos`} />
          </div>

          {items.length === 0 ? (
            <EmptyState icon={Package} text="Este jugador no tiene objetos reales en su inventario" />
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map((it) => {
                const Icon = ICON_BY_TYPE[it.itemType];
                return (
                  <Card key={`${it.itemType}-${it.id}`} className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center flex-shrink-0">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-white truncate">{it.name}</div>
                        <div className="text-[11px] text-slate-500">{LABEL_BY_TYPE[it.itemType]} · {it.category} · {it.source}</div>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-[#1F2937] flex items-center justify-between">
                      <span className="text-[11px] text-slate-500">{formatDate(it.purchasedAt)}</span>
                      {canManage && TRANSFERABLE.has(it.itemType) && (
                        <Button
                          variant="secondary" size="sm" icon={Send}
                          onClick={() => { setTransferTarget(it); setTransferTo(null); setTransferQuery(""); setTransferReason(""); }}
                        >
                          Transferir
                        </Button>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {transferTarget && (
        <Modal
          title="Transferencia administrativa"
          description={`${transferTarget.name} · de ${selectedPlayer?.global_name || selectedPlayer?.username}`}
          onClose={() => setTransferTarget(null)}
          size="sm"
          footer={
            <>
              <Button variant="ghost" onClick={() => setTransferTarget(null)} disabled={saving}>Cancelar</Button>
              <Button onClick={confirmTransfer} loading={saving} disabled={!transferTo}>Confirmar</Button>
            </>
          }
        >
            {transferTo ? (
              <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-[#151C2A] mb-3">
                <span className="text-sm text-white">{transferTo.global_name || transferTo.username}</span>
                <button onClick={() => setTransferTo(null)} className="text-slate-500 hover:text-white text-xs">Cambiar</button>
              </div>
            ) : (
              <div className="relative mb-3">
                <TextInput value={transferQuery} onChange={(e) => setTransferQuery(e.target.value)} placeholder="Buscar jugador destino..." className="w-full" />
                {transferResults.length > 0 && (
                  <div className="mt-1 border border-[#1F2937] rounded-lg overflow-hidden max-h-32 overflow-y-auto">
                    {transferResults.map((p) => (
                      <button key={p.discordId} onClick={() => setTransferTo(p)} className="w-full text-left px-3 py-1.5 hover:bg-[#151C2A] text-sm text-white transition">
                        {p.global_name || p.username}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <TextArea value={transferReason} onChange={(e) => setTransferReason(e.target.value)} placeholder="Motivo (opcional, quedará en la auditoría)..." rows={2} className="w-full" />
        </Modal>
      )}
    </div>
  );
}
