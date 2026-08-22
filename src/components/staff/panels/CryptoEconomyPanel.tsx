"use client";

import { useCallback, useEffect, useState } from "react";
import { Coins, Plus, Power, Pencil, Users, DollarSign, Activity, Wallet, ShieldAlert, Save } from "lucide-react";
import { PanelHeader, Card, SectionTitle, Kpi, TextInput, Button, IconButton, Modal, LoadingBlock, ErrorBlock, AccessDenied, Chip, useStaffPermissions, useToast } from "@/components/staff/ui";

interface CryptoCoin {
  id: string; symbol: string; name: string; icon: string; price: number; volatility: number;
  minPrice: number; maxPrice: number; feePercent: number; maxSupply?: number; enabled: boolean; circulating: number;
}

interface CryptoStats {
  usersWithWallet: number; totalVolumeCOP: number; feeRevenueCOP: number; txCountToday: number; totalValueCOP: number; totalTransactions: number;
}

interface RiskConfig {
  exposureDecayPerHour: number; maxDetectionChance: number; compromiseChanceUnprotected: number;
  compromiseChanceProtected: number; compromiseLossRate: number; dailySendLimitCOP: number; unusualSendFraction: number;
  updatedAt: string; updatedBy?: string;
}

const RISK_FIELDS: Array<{ key: keyof Omit<RiskConfig, 'updatedAt' | 'updatedBy'>; label: string; help: string; isPercent: boolean }> = [
  { key: 'exposureDecayPerHour', label: 'Decaimiento de exposición (%/hora)', help: 'Cuánto baja la exposición por hora sin sesión activa en Deep Web', isPercent: false },
  { key: 'maxDetectionChance', label: 'Probabilidad máxima de detección', help: 'A 100% de exposición, probabilidad de generar un incidente MDT', isPercent: true },
  { key: 'compromiseChanceUnprotected', label: 'Probabilidad de sesión comprometida (sin VPS)', help: '', isPercent: true },
  { key: 'compromiseChanceProtected', label: 'Probabilidad de sesión comprometida (con VPS)', help: '', isPercent: true },
  { key: 'compromiseLossRate', label: 'Pérdida cripto si la sesión es comprometida', help: 'Fracción de las tenencias que se pierden', isPercent: true },
  { key: 'unusualSendFraction', label: 'Umbral de envío "inusual"', help: 'Fracción de la tenencia que dispara la alerta ¿reconoces esta operación?', isPercent: true },
];

export default function CryptoEconomyPanel(_props: { isDirector?: boolean }) {
  const toast = useToast();
  const { has, loaded } = useStaffPermissions();
  const canView = has("economy.view");
  const canManage = has("economy.manage");
  const [coins, setCoins] = useState<CryptoCoin[]>([]);
  const [stats, setStats] = useState<CryptoStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<CryptoCoin | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ symbol: "", name: "", icon: "🪙", price: "", volatility: "3", minPrice: "", maxPrice: "", feePercent: "1" });
  const [saving, setSaving] = useState(false);

  const [riskConfig, setRiskConfig] = useState<RiskConfig | null>(null);
  const [riskForm, setRiskForm] = useState<Record<string, string>>({});
  const [riskSaving, setRiskSaving] = useState(false);
  const [riskSaved, setRiskSaved] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [coinsRes, riskRes] = await Promise.all([
        fetch("/api/staff/crypto", { cache: "no-store" }),
        fetch("/api/staff/risk-config", { cache: "no-store" }),
      ]);
      const json = await coinsRes.json();
      if (json.success) { setCoins(json.coins); setStats(json.stats); } else setError(json.error);
      const riskJson = await riskRes.json();
      if (riskJson.success) {
        setRiskConfig(riskJson.config);
        setRiskForm({
          exposureDecayPerHour: String(riskJson.config.exposureDecayPerHour),
          maxDetectionChance: String(Math.round(riskJson.config.maxDetectionChance * 100)),
          compromiseChanceUnprotected: String(Math.round(riskJson.config.compromiseChanceUnprotected * 100)),
          compromiseChanceProtected: String(Math.round(riskJson.config.compromiseChanceProtected * 100)),
          compromiseLossRate: String(Math.round(riskJson.config.compromiseLossRate * 100)),
          unusualSendFraction: String(Math.round(riskJson.config.unusualSendFraction * 100)),
          dailySendLimitCOP: String(riskJson.config.dailySendLimitCOP),
        });
      }
    } catch {
      setError("No se pudo conectar con el servidor");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (loaded && canView) load(); else if (loaded) setLoading(false); }, [load, canView, loaded]);

  const saveRiskConfig = async () => {
    setRiskSaving(true);
    setRiskSaved(false);
    try {
      const payload: Record<string, number> = { dailySendLimitCOP: Number(riskForm.dailySendLimitCOP) };
      for (const f of RISK_FIELDS) {
        const raw = Number(riskForm[f.key]);
        payload[f.key] = f.isPercent ? raw / 100 : raw;
      }
      const res = await fetch("/api/staff/risk-config", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const json = await res.json();
      if (json.success) { setRiskConfig(json.config); setRiskSaved(true); setTimeout(() => setRiskSaved(false), 2500); }
      else toast.error(json.error || "No se pudo guardar la configuración de riesgo");
    } catch {
      toast.error("No se pudo conectar con el servidor");
    } finally {
      setRiskSaving(false);
    }
  };

  const toggle = async (id: string) => {
    try {
      const res = await fetch("/api/staff/crypto", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "toggle", id }) });
      const data = await res.json();
      if (!data.success) toast.error(data.error || "No se pudo actualizar la moneda");
      await load();
    } catch {
      toast.error("No se pudo conectar con el servidor");
    }
  };

  const openEdit = (coin: CryptoCoin) => {
    setEditing(coin);
    setForm({
      symbol: coin.symbol, name: coin.name, icon: coin.icon, price: String(coin.price),
      volatility: String(Math.round(coin.volatility * 100)), minPrice: String(coin.minPrice), maxPrice: String(coin.maxPrice), feePercent: String(coin.feePercent),
    });
  };

  const openCreate = () => {
    setShowCreate(true);
    setForm({ symbol: "", name: "", icon: "🪙", price: "", volatility: "3", minPrice: "", maxPrice: "", feePercent: "1" });
  };

  const save = async () => {
    if (!form.symbol.trim() || !form.name.trim() || !form.price) return;
    setSaving(true);
    try {
      const payload = {
        symbol: form.symbol.trim(), name: form.name.trim(), icon: form.icon.trim() || "🪙",
        price: Number(form.price), volatility: Number(form.volatility) / 100,
        minPrice: form.minPrice ? Number(form.minPrice) : undefined, maxPrice: form.maxPrice ? Number(form.maxPrice) : undefined,
        feePercent: Number(form.feePercent),
      };
      const body = editing ? { action: "update", id: editing.id, ...payload } : { action: "create", ...payload };
      const res = await fetch("/api/staff/crypto", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      if (data.success) { toast.success(editing ? "Moneda actualizada" : "Moneda creada"); setEditing(null); setShowCreate(false); }
      else toast.error(data.error || "No se pudo guardar la moneda");
      await load();
    } catch {
      toast.error("No se pudo conectar con el servidor");
    } finally {
      setSaving(false);
    }
  };

  if (!loaded) return <LoadingBlock />;
  if (!canView) return <AccessDenied title="Crypto Economy" />;
  if (loading && coins.length === 0) return <LoadingBlock />;
  if (error) return <ErrorBlock text={error} onRetry={load} />;

  return (
    <div>
      <PanelHeader
        title="Crypto Economy"
        subtitle="Administra las criptomonedas ficticias del servidor y su economía real"
        action={
          canManage ? <Button icon={Plus} onClick={openCreate}>Nueva moneda</Button> : undefined
        }
      />

      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          <Kpi label="Con Crypto Wallet" value={stats.usersWithWallet} icon={Wallet} tone="text-purple-400" ring="bg-purple-500/10 ring-1 ring-purple-500/30" />
          <Kpi label="Valor en circulación" value={`$${Math.round(stats.totalValueCOP).toLocaleString('es-CO')}`} icon={Coins} tone="text-amber-400" ring="bg-amber-500/10 ring-1 ring-amber-500/30" />
          <Kpi label="Volumen total" value={`$${Math.round(stats.totalVolumeCOP).toLocaleString('es-CO')}`} icon={Activity} tone="text-blue-400" ring="bg-blue-500/10 ring-1 ring-blue-500/30" />
          <Kpi label="Ingresos por comisión" value={`$${Math.round(stats.feeRevenueCOP).toLocaleString('es-CO')}`} icon={DollarSign} tone="text-emerald-400" ring="bg-emerald-500/10 ring-1 ring-emerald-500/30" />
          <Kpi label="Transacciones hoy" value={stats.txCountToday} icon={Activity} tone="text-sky-400" ring="bg-sky-500/10 ring-1 ring-sky-500/30" />
          <Kpi label="Transacciones totales" value={stats.totalTransactions} icon={Users} tone="text-rose-400" ring="bg-rose-500/10 ring-1 ring-rose-500/30" />
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {coins.map((coin) => (
          <Card key={coin.id} className="p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-lg bg-purple-500/10 flex items-center justify-center text-lg">{coin.icon}</div>
                <div>
                  <div className="text-white font-semibold text-sm">{coin.symbol} <span className="text-slate-500 font-normal">· {coin.name}</span></div>
                  <div className="text-slate-500 text-xs">Volatilidad {(coin.volatility * 100).toFixed(0)}% · Comisión {coin.feePercent}%</div>
                </div>
              </div>
              {coin.enabled ? <Chip tone="emerald" label="Activa" /> : <Chip tone="slate" label="Desactivada" />}
            </div>
            <p className="text-slate-400 text-xs mb-3">En circulación: {coin.circulating.toLocaleString('es-CO', { maximumFractionDigits: 2 })} {coin.symbol}</p>
            <div className="flex items-center justify-between pt-3 border-t border-[#1F2937]">
              <span className="text-lg font-bold text-white tabular-nums">${coin.price.toLocaleString('es-CO')}</span>
              {canManage && (
                <div className="flex items-center gap-1.5">
                  <IconButton icon={Pencil} label="Editar" variant="secondary" size="sm" onClick={() => openEdit(coin)} />
                  <IconButton icon={Power} label={coin.enabled ? "Desactivar" : "Activar"} variant={coin.enabled ? "danger" : "success"} size="sm" onClick={() => toggle(coin.id)} />
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-8">
        <div className="flex items-center gap-2 mb-4">
          <ShieldAlert className="h-4 w-4 text-amber-400" />
          <SectionTitle>Configuración de Riesgo — Deep Web / Crypto Wallet</SectionTitle>
        </div>
        <p className="text-slate-500 text-xs mb-4">
          Estos valores controlan la dificultad real del ecosistema Deep Web + VPS + Crypto Wallet. Se aplican en el servidor
          en cada sesión — nunca hardcodeados.
        </p>
        <Card className="p-4">
          <div className="grid sm:grid-cols-2 gap-4">
            {RISK_FIELDS.map((f) => (
              <div key={f.key}>
                <label className="text-xs text-slate-400 mb-1 block">{f.label}{f.isPercent ? ' (%)' : ''}</label>
                <TextInput
                  type="number" step="0.1"
                  value={riskForm[f.key] ?? ''}
                  onChange={(e) => setRiskForm({ ...riskForm, [f.key]: e.target.value })}
                  className="w-full" disabled={!canManage}
                />
                {f.help && <p className="text-slate-600 text-[11px] mt-1">{f.help}</p>}
              </div>
            ))}
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Límite diario de envíos cripto ($)</label>
              <TextInput
                type="number"
                value={riskForm.dailySendLimitCOP ?? ''}
                onChange={(e) => setRiskForm({ ...riskForm, dailySendLimitCOP: e.target.value })}
                className="w-full"
              />
            </div>
          </div>
          <div className="flex items-center gap-3 mt-4 pt-4 border-t border-[#1F2937]">
            {canManage && (
              <Button icon={Save} loading={riskSaving} disabled={!riskConfig} onClick={saveRiskConfig}>Guardar configuración</Button>
            )}
            {riskSaved && <Chip tone="emerald" label="Guardado" />}
            {riskConfig?.updatedBy && <span className="text-slate-600 text-xs">Última edición: {riskConfig.updatedBy}</span>}
          </div>
        </Card>
      </div>

      {(editing || showCreate) && (
        <Modal
          title={editing ? "Editar moneda" : "Nueva criptomoneda"}
          onClose={() => { setEditing(null); setShowCreate(false); }}
          size="sm"
          footer={
            <>
              <Button variant="ghost" onClick={() => { setEditing(null); setShowCreate(false); }} disabled={saving}>Cancelar</Button>
              <Button onClick={save} loading={saving} disabled={!form.symbol.trim() || !form.name.trim() || !form.price}>Guardar</Button>
            </>
          }
        >
          <div className="space-y-3">
            <div className="flex gap-2">
              <TextInput value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} placeholder="🪙" className="w-16 text-center" />
              <TextInput value={form.symbol} onChange={(e) => setForm({ ...form, symbol: e.target.value })} placeholder="Símbolo (ej. HBC)" className="flex-1" disabled={!!editing} />
            </div>
            <TextInput value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nombre (ej. HUB Coin)" className="w-full" />
            <TextInput type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="Precio inicial ($)" className="w-full" />
            <div className="grid grid-cols-2 gap-2">
              <TextInput type="number" value={form.minPrice} onChange={(e) => setForm({ ...form, minPrice: e.target.value })} placeholder="Precio mínimo" className="w-full" />
              <TextInput type="number" value={form.maxPrice} onChange={(e) => setForm({ ...form, maxPrice: e.target.value })} placeholder="Precio máximo" className="w-full" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <TextInput type="number" value={form.volatility} onChange={(e) => setForm({ ...form, volatility: e.target.value })} placeholder="Volatilidad (%)" className="w-full" />
              <TextInput type="number" value={form.feePercent} onChange={(e) => setForm({ ...form, feePercent: e.target.value })} placeholder="Comisión (%)" className="w-full" />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
