"use client";

import { useCallback, useEffect, useState } from "react";
import { Landmark, Search, Snowflake, Sun } from "lucide-react";
import { PanelHeader, Card, Chip, TextInput, TextArea, Button, Modal, LoadingBlock, EmptyState, ErrorBlock, AccessDenied, formatDate, useStaffPermissions, useToast } from "@/components/staff/ui";

interface Account {
  discordId: string;
  username: string;
  avatar?: string;
  balance: number;
  frozen: boolean;
  frozenReason?: string;
  frozenAt?: string;
  frozenBy?: string;
}

export default function HubPayAccountsPanel(_props: { isDirector?: boolean }) {
  const toast = useToast();
  const { has, loaded } = useStaffPermissions();
  const canView = has("economy.view");
  const canManage = has("economy.manage");
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [freezeTarget, setFreezeTarget] = useState<Account | null>(null);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      const res = await fetch(`/api/staff/economy/hubpay?${params}`, { cache: "no-store" });
      const json = await res.json();
      if (json.success) setAccounts(json.accounts); else setError(json.error);
    } catch {
      setError("No se pudo conectar con el servidor");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    if (!loaded || !canView) { setLoading(false); return; }
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load, canView, loaded]);

  const confirmFreeze = async () => {
    if (!freezeTarget || !reason.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/staff/economy/hubpay", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ discordId: freezeTarget.discordId, action: "freeze", reason: reason.trim() }),
      });
      const data = await res.json();
      if (data.success) { toast.success("Cuenta congelada"); setFreezeTarget(null); setReason(""); }
      else toast.error(data.error || "No se pudo congelar la cuenta");
      await load();
    } catch {
      toast.error("No se pudo conectar con el servidor");
    } finally {
      setSaving(false);
    }
  };

  const unfreeze = async (discordId: string) => {
    try {
      const res = await fetch("/api/staff/economy/hubpay", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ discordId, action: "unfreeze" }),
      });
      const data = await res.json();
      if (data.success) toast.success("Cuenta reactivada");
      else toast.error(data.error || "No se pudo reactivar la cuenta");
      await load();
    } catch {
      toast.error("No se pudo conectar con el servidor");
    }
  };

  if (!loaded) return <LoadingBlock />;
  if (!canView) return <AccessDenied title="Cuentas de HubPay" />;
  if (loading && accounts.length === 0) return <LoadingBlock />;
  if (error) return <ErrorBlock text={error} onRetry={load} />;

  return (
    <div>
      <PanelHeader
        title="Cuentas de HubPay"
        subtitle="Congela o reactiva el dinero real (RP) de un jugador — bloquea transferencias, depósitos, retiros, apuestas y compras"
        action={
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <TextInput value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por usuario o ID..." className="pl-10 w-72" />
          </div>
        }
      />

      {accounts.length === 0 ? (
        <EmptyState icon={Landmark} text="No se encontraron cuentas" />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((a) => (
            <Card key={a.discordId} className="p-4">
              <div className="flex items-center gap-3">
                {a.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={a.avatar} alt={a.username} className="w-10 h-10 rounded-full" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold">
                    {a.username.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-white truncate">{a.username}</div>
                  <div className="text-[11px] text-slate-500 font-mono truncate">{a.discordId}</div>
                </div>
                {a.frozen ? <Chip tone="rose" label="Congelada" /> : <Chip tone="emerald" label="Activa" />}
              </div>

              <div className="mt-3 pt-3 border-t border-[#1F2937] flex items-center justify-between">
                <span className="text-lg font-bold text-white tabular-nums">${a.balance.toLocaleString('es-CO')}</span>
                {canManage && (a.frozen ? (
                  <Button variant="success" size="sm" icon={Sun} onClick={() => unfreeze(a.discordId)}>Reactivar</Button>
                ) : (
                  <Button variant="danger" size="sm" icon={Snowflake} onClick={() => { setFreezeTarget(a); setReason(""); }}>Congelar</Button>
                ))}
              </div>

              {a.frozen && a.frozenReason && (
                <div className="mt-2 text-[11px] text-slate-500">
                  <span className="text-rose-400">Motivo:</span> {a.frozenReason}
                  {a.frozenAt && <span className="block mt-0.5">Desde {formatDate(a.frozenAt)} · {a.frozenBy}</span>}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {freezeTarget && (
        <Modal
          title="Congelar cuenta"
          description={`${freezeTarget.username} · ${freezeTarget.discordId}`}
          onClose={() => setFreezeTarget(null)}
          size="sm"
          footer={
            <>
              <Button variant="ghost" onClick={() => setFreezeTarget(null)} disabled={saving}>Cancelar</Button>
              <Button variant="danger" onClick={confirmFreeze} loading={saving} disabled={!reason.trim()}>Congelar cuenta</Button>
            </>
          }
        >
          <TextArea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Motivo del congelamiento (obligatorio, visible para el jugador)..."
            rows={3}
            className="w-full"
          />
        </Modal>
      )}
    </div>
  );
}
