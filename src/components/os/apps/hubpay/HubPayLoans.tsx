'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useHubPay } from '@/contexts/HubPayContext';
import {
  Gauge,
  Landmark,
  AlertTriangle,
  CheckCircle2,
  Clock,
  TrendingUp,
  TrendingDown,
  History,
} from 'lucide-react';

interface Loan {
  id: string;
  principal: number;
  interestRate: number;
  termWeeks: number;
  weeklyPayment: number;
  remainingBalance: number;
  status: 'active' | 'paid' | 'defaulted';
  missedPayments: number;
  nextPaymentDate: string;
  createdAt: string;
}

interface Profile {
  score: number;
  rate: { ratePct: number; label: string };
  maxAmount: number;
  eligible: boolean;
  hasActiveLoan: boolean;
}

function scoreColor(score: number) {
  if (score >= 750) return 'text-emerald-400';
  if (score >= 650) return 'text-green-400';
  if (score >= 550) return 'text-amber-400';
  return 'text-red-400';
}

function money(n: number) {
  return `$${n.toLocaleString('es-CO')}`;
}

export default function HubPayLoans() {
  const { refreshWallet } = useHubPay();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [activeLoan, setActiveLoan] = useState<Loan | null>(null);
  const [history, setHistory] = useState<Loan[]>([]);
  const [frozen, setFrozen] = useState(false);
  const [frozenReason, setFrozenReason] = useState<string | undefined>();
  const [termOptions, setTermOptions] = useState<number[]>([4, 8, 12]);

  const [amount, setAmount] = useState('');
  const [term, setTerm] = useState<number>(4);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/hubpay/loans', { cache: 'no-store' });
      const data = await res.json();
      if (data.success) {
        setProfile(data.profile);
        setActiveLoan(data.activeLoan);
        setHistory(data.history);
        setFrozen(data.frozen);
        setFrozenReason(data.frozenReason);
        setTermOptions(data.termOptions);
        setTerm((prev) => (data.termOptions.includes(prev) ? prev : data.termOptions[0]));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const estimatedWeekly = useMemo(() => {
    const amt = Number(amount);
    if (!profile || !Number.isFinite(amt) || amt <= 0 || !term) return null;
    const total = amt * (1 + profile.rate.ratePct / 100);
    return Math.ceil(total / term);
  }, [amount, term, profile]);

  const requestLoan = async () => {
    setSubmitting(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await fetch('/api/hubpay/loans', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'request', amount: Number(amount), termWeeks: term }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.error); return; }
      setSuccessMsg(`Préstamo aprobado por ${money(Number(amount))}.`);
      setAmount('');
      await Promise.all([load(), refreshWallet()]);
    } finally {
      setSubmitting(false);
    }
  };

  const payOff = async () => {
    setSubmitting(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await fetch('/api/hubpay/loans', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'payoff' }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.error); return; }
      setSuccessMsg('Préstamo saldado por completo.');
      await Promise.all([load(), refreshWallet()]);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="h-full flex items-center justify-center text-white/40 text-sm">Cargando...</div>;
  }

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-6">
      <div className="mb-8">
        <h1 className="text-white text-2xl font-bold mb-1">Préstamos</h1>
        <p className="text-white/50">Pedí prestado según tu credit score — se descuenta solo, cada semana</p>
      </div>

      {frozen && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-400 font-semibold text-sm">Cuenta embargada</p>
            <p className="text-red-400/70 text-sm">{frozenReason || 'Tu cuenta de HubPay está congelada.'}</p>
          </div>
        </div>
      )}

      {/* Credit score */}
      {profile && (
        <div className="hs-card rounded-2xl p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-white font-semibold flex items-center gap-2"><Gauge className="w-4 h-4 text-white/50" /> Tu credit score</h2>
            <span className={`text-2xl font-bold tabular-nums ${scoreColor(profile.score)}`}>{profile.score}</span>
          </div>
          <div className="h-2 rounded-full bg-white/10 overflow-hidden mb-2">
            <div
              className={`h-full rounded-full transition-all duration-500 ${profile.score >= 650 ? 'bg-green-500' : profile.score >= 550 ? 'bg-amber-500' : 'bg-red-500'}`}
              style={{ width: `${Math.min(100, ((profile.score - 300) / (850 - 300)) * 100)}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-white/40">
            <span>300</span>
            <span>Tasa actual: <span className="text-white/70 font-medium">{profile.rate.ratePct}% ({profile.rate.label})</span></span>
            <span>850</span>
          </div>
        </div>
      )}

      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
      {successMsg && (
        <div className="flex items-center gap-2 text-emerald-400 text-sm bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 mb-6">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> {successMsg}
        </div>
      )}

      {/* Préstamo activo */}
      {activeLoan ? (
        <div className="hs-card rounded-2xl overflow-hidden mb-6">
          <div className="flex items-center gap-2 p-4 border-b border-white/[0.06]">
            <Landmark className="w-4 h-4 text-white/50" />
            <h2 className="text-white font-semibold">Tu préstamo activo</h2>
          </div>
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-white/40 text-xs mb-1">Saldo restante</p>
                <p className="text-white text-xl font-bold tabular-nums">{money(activeLoan.remainingBalance)}</p>
              </div>
              <div>
                <p className="text-white/40 text-xs mb-1">Cuota semanal</p>
                <p className="text-white text-xl font-bold tabular-nums">{money(activeLoan.weeklyPayment)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-white/50">
              <Clock className="w-3.5 h-3.5" /> Próximo cobro: {new Date(activeLoan.nextPaymentDate).toLocaleDateString('es-ES')}
            </div>
            {activeLoan.missedPayments > 0 && (
              <div className="flex items-center gap-2 text-amber-400 text-sm">
                <AlertTriangle className="w-3.5 h-3.5" /> {activeLoan.missedPayments} cuota(s) atrasada(s)
              </div>
            )}
            <button
              onClick={payOff}
              disabled={submitting}
              className="w-full py-2.5 rounded-lg bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-semibold text-sm transition-colors"
            >
              Pagar todo ahora ({money(activeLoan.remainingBalance)})
            </button>
          </div>
        </div>
      ) : (
        profile && (
          <div className="hs-card rounded-2xl overflow-hidden mb-6">
            <div className="flex items-center gap-2 p-4 border-b border-white/[0.06]">
              <Landmark className="w-4 h-4 text-white/50" />
              <h2 className="text-white font-semibold">Pedir un préstamo</h2>
            </div>
            {!profile.eligible ? (
              <div className="p-4">
                <p className="text-white/50 text-sm">Tu credit score es muy bajo para pedir un préstamo por ahora. Mejoralo pagando otras deudas a tiempo.</p>
              </div>
            ) : (
              <div className="p-4 space-y-3">
                <div>
                  <label className="text-white/50 text-xs block mb-1.5">Monto (máximo {money(profile.maxAmount)})</label>
                  <input
                    type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
                    placeholder="0"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-green-500/50 focus:ring-2 focus:ring-green-500/10"
                  />
                </div>
                <div>
                  <label className="text-white/50 text-xs block mb-1.5">Plazo</label>
                  <div className="flex gap-2">
                    {termOptions.map((t) => (
                      <button
                        key={t}
                        onClick={() => setTerm(t)}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${term === t ? 'bg-green-600 text-white' : 'bg-white/5 text-white/60 hover:bg-white/10'}`}
                      >
                        {t} sem.
                      </button>
                    ))}
                  </div>
                </div>
                {estimatedWeekly !== null && (
                  <p className="text-white/40 text-xs">Cuota semanal estimada: <span className="text-white/80 font-medium">{money(estimatedWeekly)}</span> ({profile.rate.ratePct}% interés total)</p>
                )}
                <button
                  onClick={requestLoan}
                  disabled={submitting || !amount || Number(amount) <= 0 || frozen}
                  className="w-full py-2.5 rounded-lg bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-semibold text-sm transition-colors"
                >
                  {submitting ? 'Procesando...' : 'Solicitar préstamo'}
                </button>
              </div>
            )}
          </div>
        )
      )}

      {/* Historial */}
      <div className="hs-card rounded-2xl overflow-hidden">
        <div className="flex items-center gap-2 p-4 border-b border-white/[0.06]">
          <History className="w-4 h-4 text-white/50" />
          <h2 className="text-white font-semibold">Historial</h2>
        </div>
        {history.length === 0 ? (
          <p className="text-white/40 text-sm p-4">Todavía no tenés préstamos anteriores.</p>
        ) : (
          <div className="divide-y divide-white/5">
            {history.map((loan) => (
              <div key={loan.id} className="flex items-center justify-between p-4 text-sm">
                <div className="flex items-center gap-2">
                  {loan.status === 'paid' ? (
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-400" />
                  )}
                  <div>
                    <p className="text-white">{money(loan.principal)}</p>
                    <p className="text-white/40 text-xs">{new Date(loan.createdAt).toLocaleDateString('es-ES')}</p>
                  </div>
                </div>
                <span className={`text-xs font-bold px-2 py-0.5 rounded ${loan.status === 'paid' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>
                  {loan.status === 'paid' ? 'Pagado' : 'Default'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
