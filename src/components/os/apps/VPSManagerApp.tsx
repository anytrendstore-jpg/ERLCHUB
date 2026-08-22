'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Server, ShieldCheck, RefreshCw, History, Zap, AlertTriangle } from 'lucide-react';
import { useToast } from '@/components/os/ui';

interface VpsPlan {
  id: string;
  name: string;
  dailyPrice: number;
  securityLevel: number;
  durationHours: number;
  description: string;
}

interface VpsSubscription {
  id: string;
  planId: string;
  planName: string;
  dailyPrice: number;
  securityLevel: number;
  durationHours: number;
  status: 'inactive' | 'active' | 'expired' | 'cancelled';
  purchasedAt: string;
  activatedAt?: string;
  expiresAt?: string;
  autoRenew: boolean;
}

function formatRemaining(ms: number): string {
  if (ms <= 0) return '00:00:00';
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':');
}

function formatDurationLabel(hours: number): string {
  if (hours % (24 * 30) === 0 && hours >= 24 * 30) return `${hours / (24 * 30)} mes${hours / (24 * 30) > 1 ? 'es' : ''}`;
  if (hours % (24 * 7) === 0 && hours >= 24 * 7) return `${hours / (24 * 7)} semana${hours / (24 * 7) > 1 ? 's' : ''}`;
  if (hours % 24 === 0 && hours >= 24) return `${hours / 24} día${hours / 24 > 1 ? 's' : ''}`;
  return `${hours} hora${hours > 1 ? 's' : ''}`;
}

const ACTIVATION_STEPS = ['Inicializando VPS...', 'Estableciendo sesión segura...', 'Verificando protocolos de cifrado...', 'VPS listo'];

export default function VPSManagerApp() {
  const toast = useToast();
  const [plans, setPlans] = useState<VpsPlan[]>([]);
  const [subscription, setSubscription] = useState<VpsSubscription | null | undefined>(undefined);
  const [history, setHistory] = useState<VpsSubscription[]>([]);
  const [now, setNow] = useState(Date.now());
  const [busy, setBusy] = useState(false);
  const [activationStep, setActivationStep] = useState<string | null>(null);
  const [paymentCoin, setPaymentCoin] = useState<{ symbol: string; price: number } | null>(null);

  const loadPlans = useCallback(async () => {
    const res = await fetch('/api/vps/plans', { cache: 'no-store' });
    const data = await res.json();
    if (data.success) setPlans(data.plans);
  }, []);

  const loadPaymentCoin = useCallback(async () => {
    const res = await fetch('/api/crypto/coins', { cache: 'no-store' });
    const data = await res.json();
    if (data.success && data.coins.length > 0) {
      const coin = data.coins.find((c: any) => c.symbol === 'HBC') || data.coins[0];
      setPaymentCoin({ symbol: coin.symbol, price: coin.price });
    }
  }, []);

  const loadStatus = useCallback(async () => {
    const res = await fetch('/api/vps/status', { cache: 'no-store' });
    const data = await res.json();
    if (data.success) setSubscription(data.subscription);
  }, []);

  const loadHistory = useCallback(async () => {
    const res = await fetch('/api/vps/history', { cache: 'no-store' });
    const data = await res.json();
    if (data.success) setHistory(data.subscriptions);
  }, []);

  useEffect(() => { loadPlans(); loadStatus(); loadHistory(); loadPaymentCoin(); }, [loadPlans, loadStatus, loadHistory, loadPaymentCoin]);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Reconsulta el estado real cada 20s (por si expiró o se renovó automáticamente en el servidor).
  useEffect(() => {
    const interval = setInterval(loadStatus, 20000);
    return () => clearInterval(interval);
  }, [loadStatus]);

  const subscribe = async (planId: string) => {
    setBusy(true);
    try {
      const res = await fetch('/api/vps/subscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ planId }) });
      const data = await res.json();
      if (data.success) { toast.success('VPS adquirido — actívalo cuando quieras'); await Promise.all([loadStatus(), loadHistory()]); }
      else toast.error(data.error || 'No se pudo comprar');
    } finally { setBusy(false); }
  };

  const activate = async () => {
    setBusy(true);
    setActivationStep(ACTIVATION_STEPS[0]);
    const stepTimer = setInterval(() => {
      setActivationStep((prev) => {
        const idx = ACTIVATION_STEPS.indexOf(prev || '');
        return ACTIVATION_STEPS[Math.min(idx + 1, ACTIVATION_STEPS.length - 2)];
      });
    }, 500);
    try {
      const res = await fetch('/api/vps/activate', { method: 'POST' });
      const data = await res.json();
      clearInterval(stepTimer);
      if (data.success) {
        setActivationStep(ACTIVATION_STEPS[ACTIVATION_STEPS.length - 1]);
        toast.success('VPS activado');
        await Promise.all([loadStatus(), loadHistory()]);
      } else {
        toast.error(data.error || 'No se pudo activar');
      }
    } finally {
      clearInterval(stepTimer);
      setTimeout(() => setActivationStep(null), 600);
      setBusy(false);
    }
  };

  const renew = async () => {
    setBusy(true);
    try {
      const res = await fetch('/api/vps/renew', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ planId: subscription?.planId }) });
      const data = await res.json();
      if (data.success) { toast.success(`VPS renovado por ${formatDurationLabel(data.subscription?.durationHours || 24)}`); await Promise.all([loadStatus(), loadHistory()]); }
      else toast.error(data.error || 'No se pudo renovar');
    } finally { setBusy(false); }
  };

  const toggleAutoRenew = async () => {
    if (!subscription) return;
    const next = !subscription.autoRenew;
    setSubscription({ ...subscription, autoRenew: next });
    await fetch('/api/vps/auto-renew', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ autoRenew: next }) });
  };

  const remaining = subscription?.status === 'active' && subscription.expiresAt ? new Date(subscription.expiresAt).getTime() - now : 0;

  return (
    <div className="h-full flex flex-col bg-[#0a0e14] text-white">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10 bg-gradient-to-r from-cyan-950/40 to-[#0a0e14]">
        <Server className="w-6 h-6 text-cyan-400" />
        <span className="font-bold text-xl">VPS Manager</span>
      </div>


      <div className="flex-1 overflow-y-auto custom-scrollbar p-5">
        {subscription === undefined ? (
          <p className="text-white/40 text-sm">Cargando...</p>
        ) : subscription?.status === 'active' ? (
          <div className="max-w-lg">
            <div className="p-5 rounded-2xl border border-cyan-500/30 bg-cyan-500/5 mb-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="font-bold text-lg">{subscription.planName}</span>
                </div>
                <span className="text-emerald-400 text-xs font-bold px-2 py-1 rounded-full bg-emerald-500/10">ACTIVO</span>
              </div>

              <div className="text-center py-4 mb-4 bg-black/30 rounded-xl">
                <p className="text-white/40 text-xs uppercase tracking-wide mb-1">Tiempo restante</p>
                <p className="text-4xl font-mono font-bold text-cyan-300">{formatRemaining(remaining)}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="p-3 rounded-xl bg-white/5">
                  <p className="text-white/40 text-[11px] flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> Protección</p>
                  <p className="text-white font-bold">{subscription.securityLevel}%</p>
                </div>
                <div className="p-3 rounded-xl bg-white/5">
                  <p className="text-white/40 text-[11px] flex items-center gap-1"><Zap className="w-3 h-3" /> Exposición</p>
                  <p className="text-white font-bold">{subscription.securityLevel >= 80 ? 'Baja' : subscription.securityLevel >= 50 ? 'Media' : 'Alta'}</p>
                </div>
              </div>

              <button
                onClick={toggleAutoRenew}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
              >
                <span className="text-sm">Renovación automática</span>
                <span className={`w-10 h-5 rounded-full relative transition-colors ${subscription.autoRenew ? 'bg-cyan-500' : 'bg-white/20'}`}>
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${subscription.autoRenew ? 'left-5' : 'left-0.5'}`} />
                </span>
              </button>
            </div>
          </div>
        ) : subscription?.status === 'inactive' ? (
          <div className="max-w-md p-6 rounded-2xl border border-cyan-500/30 bg-cyan-500/5">
            <Server className="w-10 h-10 text-cyan-400 mb-3" />
            <h2 className="text-lg font-bold mb-1">{subscription.planName}</h2>
            <p className="text-white/60 text-sm mb-4">Tu suscripción está disponible. Duración: {formatDurationLabel(subscription.durationHours || 24)}. ¿Deseas activar tu VPS?</p>
            <button
              onClick={activate}
              disabled={busy}
              className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-semibold transition-colors"
            >
              {busy ? (activationStep || 'Activando...') : 'Activar VPS'}
            </button>
          </div>
        ) : subscription?.status === 'expired' ? (
          <div className="max-w-md p-6 rounded-2xl border border-red-500/30 bg-red-500/5">
            <AlertTriangle className="w-10 h-10 text-red-400 mb-3" />
            <h2 className="text-lg font-bold mb-1">Tu suscripción VPS ha expirado</h2>
            <p className="text-white/60 text-sm mb-4">Renueva tu suscripción para volver a utilizar el acceso protegido.</p>
            <button
              onClick={renew}
              disabled={busy}
              className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" /> {busy ? 'Renovando...' : `Renovar VPS · $${subscription.dailyPrice.toLocaleString('es-CO')}${paymentCoin ? ` (≈ ${(subscription.dailyPrice / paymentCoin.price).toFixed(4)} ${paymentCoin.symbol})` : ''}`}
            </button>
          </div>
        ) : (
          <div className="max-w-xl">
            <p className="text-white/60 text-sm mb-4">Ningún VPS activo. Suscríbete a un plan para reducir tu exposición en la Deep Web.</p>
            <div className="space-y-3">
              {plans.map((plan) => (
                <div key={plan.id} className="p-5 rounded-2xl border border-white/10 bg-white/5 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center flex-shrink-0">
                    <Server className="w-6 h-6 text-cyan-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold">{plan.name}</h3>
                    <p className="text-white/40 text-xs mb-1">{plan.description}</p>
                    <p className="text-cyan-300 text-xs flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> Protección {plan.securityLevel}%</p>
                    <p className="text-white/30 text-[11px] mt-1">Pago exclusivo con Crypto Wallet</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-lg">${plan.dailyPrice.toLocaleString('es-CO')}</p>
                    <p className="text-white/30 text-[11px]">/ {formatDurationLabel(plan.durationHours || 24)}</p>
                    {paymentCoin && (
                      <p className="text-cyan-400/60 text-[11px] mb-2">≈ {(plan.dailyPrice / paymentCoin.price).toFixed(4)} {paymentCoin.symbol}</p>
                    )}
                    <button
                      onClick={() => subscribe(plan.id)}
                      disabled={busy}
                      className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-sm font-semibold transition-colors"
                    >
                      Suscribirse
                    </button>
                  </div>
                </div>
              ))}
              {plans.length === 0 && <p className="text-white/30 text-sm">No hay planes disponibles por ahora.</p>}
            </div>
          </div>
        )}

        {history.length > 0 && (
          <div className="mt-8 max-w-2xl">
            <h3 className="text-white/60 text-sm font-semibold mb-3 flex items-center gap-2"><History className="w-4 h-4" /> Historial VPS</h3>
            <div className="rounded-xl border border-white/10 overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-white/5 text-white/40 uppercase">
                  <tr>
                    <th className="text-left px-3 py-2 font-medium">Fecha</th>
                    <th className="text-left px-3 py-2 font-medium">Plan</th>
                    <th className="text-right px-3 py-2 font-medium">Precio</th>
                    <th className="text-right px-3 py-2 font-medium">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {history.map((h) => (
                    <tr key={h.id}>
                      <td className="px-3 py-2 text-white/60">{new Date(h.purchasedAt).toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' })}</td>
                      <td className="px-3 py-2 text-white">{h.planName}</td>
                      <td className="px-3 py-2 text-right text-white/70">${h.dailyPrice.toLocaleString('es-CO')}</td>
                      <td className="px-3 py-2 text-right">
                        <span className={
                          h.status === 'active' ? 'text-emerald-400' : h.status === 'inactive' ? 'text-amber-400' : h.status === 'expired' ? 'text-red-400' : 'text-white/40'
                        }>
                          {h.status === 'active' ? 'Activo' : h.status === 'inactive' ? 'Pendiente' : h.status === 'expired' ? 'Expirado' : 'Cancelado'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
