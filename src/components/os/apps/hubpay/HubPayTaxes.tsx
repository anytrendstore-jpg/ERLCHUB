'use client';

import React, { useEffect, useState } from 'react';
import { useHubPay } from '@/contexts/HubPayContext';
import {
  PieChart,
  Info,
  Search,
  ShieldAlert,
  CheckCircle2,
} from 'lucide-react';

interface TaxRate {
  category: string;
  label: string;
  percentage: number;
}

interface Citation {
  id: string;
  citationNumber: string;
  violation: string;
  personName: string;
  fineAmount: number;
  status: 'Issued' | 'Paid' | 'Overdue' | 'Contested' | 'Dismissed';
  issuedAt: string;
  dueDate: string;
}

export default function HubPayTaxes() {
  const { wallet, refreshWallet } = useHubPay();
  const [rates, setRates] = useState<TaxRate[]>([]);
  const [loadingRates, setLoadingRates] = useState(true);

  const [citationQuery, setCitationQuery] = useState('');
  const [foundCitation, setFoundCitation] = useState<Citation | null>(null);
  const [searching, setSearching] = useState(false);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paidMsg, setPaidMsg] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/hubpay/tax-rates', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => { if (d.success) setRates(d.rates); })
      .finally(() => setLoadingRates(false));
  }, []);

  const searchCitation = async () => {
    const q = citationQuery.trim().toUpperCase();
    if (!q) return;
    setSearching(true);
    setError(null);
    setFoundCitation(null);
    setPaidMsg(null);
    try {
      const res = await fetch('/api/mdt/citations', { cache: 'no-store' });
      const data = await res.json();
      if (!data.success) { setError('No se pudo conectar con el sistema de multas'); return; }
      const match = data.citations.find((c: Citation) => c.citationNumber.toUpperCase() === q);
      if (!match) { setError('No se encontró ninguna multa con ese número'); return; }
      setFoundCitation(match);
    } finally {
      setSearching(false);
    }
  };

  const payCitation = async () => {
    if (!foundCitation) return;
    setPaying(true);
    setError(null);
    try {
      const res = await fetch('/api/mdt/citations', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: foundCitation.id, action: 'pay' }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.error || 'No se pudo pagar la multa'); return; }
      setFoundCitation(data.citation);
      setPaidMsg(`Multa ${data.citation.citationNumber} pagada correctamente.`);
      refreshWallet();
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-white text-2xl font-bold mb-1">Impuestos y Multas</h1>
        <p className="text-white/50">Tasas vigentes del servidor y pago de multas</p>
      </div>

      {/* Tasas reales configuradas por Staff */}
      <div className="mb-8">
        <h2 className="text-white font-semibold mb-4 flex items-center gap-2"><PieChart className="w-4 h-4 text-white/50" /> Tasas vigentes</h2>
        {loadingRates ? (
          <p className="text-white/40 text-sm">Cargando...</p>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {rates.map((rate) => (
              <div key={rate.category} className="hs-card hs-card-hover p-4 rounded-xl">
                <div className="flex items-center justify-between">
                  <h3 className="text-white font-medium text-sm">{rate.label}</h3>
                  <span className="text-green-400 font-bold tabular-nums">{rate.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl flex gap-3 mb-8">
        <Info className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
        <p className="text-green-400/70 text-sm">
          Estas tasas las fija el equipo de Staff desde su panel administrativo y se aplican automáticamente en cada operación correspondiente (transferencias, compras, ventas, etc.).
        </p>
      </div>

      {/* Pago de multas */}
      <div className="hs-card rounded-2xl overflow-hidden">
        <div className="flex items-center gap-2 p-4 border-b border-white/[0.06]">
          <ShieldAlert className="w-4 h-4 text-white/50" />
          <h2 className="text-white font-semibold">Pagar una multa</h2>
        </div>
        <div className="p-4 space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                value={citationQuery}
                onChange={(e) => setCitationQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && searchCitation()}
                placeholder="Número de multa (ej. CIT-1001)"
                className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-green-500/50 focus:ring-2 focus:ring-green-500/10"
              />
            </div>
            <button onClick={searchCitation} disabled={searching || !citationQuery.trim()} className="px-4 py-2.5 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-40 text-white text-sm font-medium transition-colors">
              Buscar
            </button>
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          {foundCitation && (
            <div className="p-4 rounded-xl bg-black/20 border border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-white font-semibold">{foundCitation.citationNumber}</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded ${foundCitation.status === 'Paid' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>
                  {foundCitation.status === 'Paid' ? 'Pagada' : foundCitation.status}
                </span>
              </div>
              <p className="text-white/70 text-sm">{foundCitation.violation}</p>
              <p className="text-white/40 text-xs">A nombre de: {foundCitation.personName}</p>
              <div className="flex items-center justify-between pt-2 border-t border-white/10">
                <span className="text-white/50 text-sm">Monto</span>
                <span className="text-white font-bold text-lg tabular-nums">${foundCitation.fineAmount.toLocaleString('es-CO')}</span>
              </div>
              {foundCitation.status !== 'Paid' ? (
                <button onClick={payCitation} disabled={paying} className="w-full py-2.5 rounded-lg bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-semibold text-sm transition-colors">
                  {paying ? 'Procesando...' : `Pagar $${foundCitation.fineAmount.toLocaleString('es-CO')}`}
                </button>
              ) : (
                <div className="flex items-center gap-2 text-emerald-400 text-sm justify-center py-1">
                  <CheckCircle2 className="w-4 h-4" /> Ya está pagada
                </div>
              )}
            </div>
          )}

          {paidMsg && (
            <div className="flex items-center gap-2 text-emerald-400 text-sm bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> {paidMsg}
            </div>
          )}

          <p className="text-white/30 text-xs">Se paga desde tu saldo disponible en HubPay (${wallet.availableBalance.toLocaleString('es-CO')}).</p>
        </div>
      </div>
    </div>
  );
}
