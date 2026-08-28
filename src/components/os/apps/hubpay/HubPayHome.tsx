'use client';

import React from 'react';
import Image from 'next/image';
import { useHubPay } from '@/contexts/HubPayContext';
import {
  ArrowUpRight,
  ArrowDownLeft,
  Send,
  Wallet,
  CreditCard,
  ChevronRight,
  Snowflake,
  Plus,
  Wifi,
} from 'lucide-react';

/** Tailwind no puede resolver clases armadas con template strings (`bg-${color}-500`) —
 * necesita ver el nombre completo de la clase de forma literal en el código fuente. */
const ACTION_COLOR: Record<string, { bg: string; glow: string }> = {
  amber: { bg: 'bg-amber-500', glow: 'group-hover:shadow-[0_0_20px_-4px_rgba(245,158,11,0.6)]' },
  violet: { bg: 'bg-violet-500', glow: 'group-hover:shadow-[0_0_20px_-4px_rgba(139,92,246,0.6)]' },
  emerald: { bg: 'bg-emerald-500', glow: 'group-hover:shadow-[0_0_20px_-4px_rgba(16,185,129,0.6)]' },
  rose: { bg: 'bg-rose-500', glow: 'group-hover:shadow-[0_0_20px_-4px_rgba(244,63,94,0.6)]' },
};

const CARD_BG: Record<string, string> = {
  gradient: 'bg-gradient-to-br from-green-600 via-green-700 to-[#0a1a0d]',
  blue: 'bg-gradient-to-br from-blue-500 to-blue-700',
  black: 'bg-gradient-to-br from-gray-800 to-gray-900',
};

const TYPE_LABEL: Record<string, string> = {
  salary: 'Salario',
  transfer_in: 'Transferencia recibida',
  transfer_out: 'Transferencia enviada',
  withdrawal: 'Retiro',
  deposit: 'Depósito',
  expense: 'Gasto',
};

/** Últimos 7 días reales (a partir de wallet.transactions) — nunca datos inventados. */
function buildWeekSeries(transactions: { amount: number; timestamp: Date }[]) {
  const days: { key: string; label: string; income: number; expense: number }[] = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    days.push({ key: d.toDateString(), label: d.toLocaleDateString('es-ES', { weekday: 'short' }), income: 0, expense: 0 });
  }
  for (const t of transactions) {
    const key = t.timestamp.toDateString();
    const bucket = days.find((d) => d.key === key);
    if (!bucket) continue;
    if (t.amount >= 0) bucket.income += t.amount;
    else bucket.expense += Math.abs(t.amount);
  }
  return days;
}

function WeekChart({ days }: { days: ReturnType<typeof buildWeekSeries> }) {
  const width = 560;
  const height = 140;
  const padY = 14;
  const max = Math.max(1, ...days.map((d) => Math.max(d.income, d.expense)));
  const stepX = width / (days.length - 1);

  const pointsFor = (key: 'income' | 'expense') =>
    days.map((d, i) => {
      const x = i * stepX;
      const y = padY + (height - padY * 2) * (1 - d[key] / max);
      return `${x},${y}`;
    }).join(' ');

  const incomePoints = pointsFor('income');
  const expensePoints = pointsFor('expense');

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-32" preserveAspectRatio="none">
      <defs>
        <linearGradient id="hp-income-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#34d399" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#34d399" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((p) => (
        <line key={p} x1="0" x2={width} y1={height * p} y2={height * p} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
      ))}
      <polygon points={`0,${height} ${incomePoints} ${width},${height}`} fill="url(#hp-income-fill)" />
      <polyline points={incomePoints} fill="none" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points={expensePoints} fill="none" stroke="#fb7185" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="1 0" />
      {days.map((d, i) => {
        const x = i * stepX;
        const yi = padY + (height - padY * 2) * (1 - d.income / max);
        const ye = padY + (height - padY * 2) * (1 - d.expense / max);
        return (
          <g key={d.key}>
            {d.income > 0 && <circle cx={x} cy={yi} r="3" fill="#34d399" />}
            {d.expense > 0 && <circle cx={x} cy={ye} r="3" fill="#fb7185" />}
          </g>
        );
      })}
    </svg>
  );
}

export default function HubPayHome() {
  const { wallet, setActiveView } = useHubPay();

  const getTransactionIcon = (type: string, positive: boolean) => {
    if (type === 'transfer_out') return <Send className="w-4 h-4 text-rose-400" />;
    if (positive) return <ArrowDownLeft className="w-4 h-4 text-emerald-400" />;
    return <ArrowUpRight className="w-4 h-4 text-rose-400" />;
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / 86400000);

    if (days === 0) return 'Hoy';
    if (days === 1) return 'Ayer';
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  };

  const now = new Date();
  const thisMonthTx = wallet.transactions.filter(t => t.timestamp.getMonth() === now.getMonth() && t.timestamp.getFullYear() === now.getFullYear());

  const totalIncome = thisMonthTx.filter(t => t.amount > 0).reduce((acc, t) => acc + t.amount, 0);
  const totalExpense = thisMonthTx.filter(t => t.amount < 0).reduce((acc, t) => acc + Math.abs(t.amount), 0);
  const weekSeries = buildWeekSeries(wallet.transactions);

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-6 hs-ambient">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Image src="/flecalogo.png" alt="Fleeca Bank" width={1672} height={941} className="h-8 w-auto mb-2" />
          <p className="text-white/40 text-sm">Bienvenido de vuelta a tu banca virtual</p>
        </div>
      </div>

      {wallet.frozen && (
        <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 shadow-lg shadow-rose-950/20 flex items-start gap-3">
          <Snowflake className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-rose-400 font-semibold text-sm">Tu cuenta de HubPay está congelada por Staff</p>
            {wallet.frozenReason && <p className="text-rose-400/70 text-xs mt-0.5">Motivo: {wallet.frozenReason}</p>}
            <p className="text-white/40 text-xs mt-1">No puedes transferir, depositar, retirar, apostar ni comprar mientras esté congelada.</p>
          </div>
        </div>
      )}

      {/* Balance + Chart */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        {/* Balance card */}
        <div className="col-span-2 p-6 rounded-2xl bg-[#0a100c] relative overflow-hidden shadow-xl shadow-black/40 border border-green-600/15">
          <div className="absolute -top-20 -right-16 w-56 h-56 rounded-full bg-green-600/25 blur-3xl" />
          <div className="relative">
            <p className="text-white/50 text-xs uppercase tracking-widest mb-2">Saldo total</p>
            <p className="text-white text-4xl font-bold mb-5 tabular-nums drop-shadow-sm">
              ${wallet.totalBalance.toLocaleString()}
            </p>
            <div className="flex items-center gap-5">
              <div>
                <p className="text-white/40 text-[11px] uppercase tracking-wide">Disponible</p>
                <p className="text-white text-base font-semibold tabular-nums">${wallet.availableBalance.toLocaleString()}</p>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div>
                <p className="text-white/40 text-[11px] uppercase tracking-wide">Retenido</p>
                <p className="text-amber-300 text-base font-semibold tabular-nums">${wallet.retainedBalance.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Chart card */}
        <div className="col-span-3 p-5 rounded-2xl bg-[#0f0f16] border border-white/[0.06] shadow-lg shadow-black/20">
          <div className="flex items-start justify-between mb-1">
            <div className="flex items-center gap-4">
              <div>
                <p className="text-emerald-400 text-xs flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-400" /> Ingresos</p>
                <p className="text-white text-lg font-bold tabular-nums">+${totalIncome.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-rose-400 text-xs flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-400" /> Gastos</p>
                <p className="text-white text-lg font-bold tabular-nums">-${totalExpense.toLocaleString()}</p>
              </div>
            </div>
            <span className="text-white/30 text-[11px] uppercase tracking-wide mt-1">Últimos 7 días</span>
          </div>
          <WeekChart days={weekSeries} />
          <div className="flex justify-between px-0.5 -mt-1">
            {weekSeries.map((d) => (
              <span key={d.key} className="text-white/30 text-[10px] capitalize">{d.label}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { icon: Send, label: 'Transferir', view: 'transfer', color: 'amber' },
          { icon: Wallet, label: 'Bolsillos', view: 'pockets', color: 'violet' },
          { icon: CreditCard, label: 'Tarjetas', view: 'cards', color: 'emerald' },
          { icon: ArrowDownLeft, label: 'Retirar', view: 'withdraw', color: 'rose' }
        ].map((action) => {
          const Icon = action.icon;
          const c = ACTION_COLOR[action.color];
          return (
            <button
              key={action.view}
              onClick={() => setActiveView(action.view as 'transfer' | 'pockets' | 'cards' | 'withdraw')}
              className="hs-card hs-card-hover flex items-center gap-3 p-4 rounded-2xl group"
            >
              <div className={`w-11 h-11 rounded-xl ${c.bg} flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-all duration-200 ${c.glow}`}>
                <Icon className="w-5 h-5 text-black/70" />
              </div>
              <span className="text-white/70 text-sm font-medium group-hover:text-white transition-colors">{action.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tus tarjetas */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-white font-semibold">Tus tarjetas</h2>
          <button
            onClick={() => setActiveView('cards')}
            className="text-green-500 text-sm flex items-center gap-1 hover:text-green-400 transition-colors"
          >
            Ver todas <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="flex gap-4 overflow-x-auto custom-scrollbar pb-2">
          {wallet.cards.map((card) => (
            <div
              key={card.id}
              className={`relative flex-shrink-0 w-56 aspect-[1.586/1] rounded-2xl p-4 ${CARD_BG[card.color] || CARD_BG.gradient} shadow-lg shadow-black/40 overflow-hidden ring-1 ring-white/10`}
            >
              <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/10 -translate-y-1/3 translate-x-1/3" />
              <div className="relative h-full flex flex-col justify-between">
                <div className="flex items-start justify-between">
                  <div className="w-8 h-6 rounded bg-gradient-to-br from-yellow-300 to-yellow-500 flex items-center justify-center">
                    <Wifi className="w-4 h-4 text-yellow-800 rotate-90" />
                  </div>
                  <span className="text-white/80 text-xs font-medium">HubPay</span>
                </div>
                <div>
                  <p className="text-white text-sm font-mono tracking-wider tabular-nums">{card.cardNumber}</p>
                  <p className="text-white/60 text-[11px] mt-1">{card.cardHolder}</p>
                </div>
              </div>
            </div>
          ))}
          <button
            onClick={() => setActiveView('cards')}
            className="flex-shrink-0 w-56 aspect-[1.586/1] rounded-2xl border-2 border-dashed border-white/10 hover:border-green-600/50 hover:bg-green-600/5 transition-all flex flex-col items-center justify-center gap-2 group"
          >
            <div className="w-10 h-10 rounded-xl bg-green-600/15 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Plus className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-white/50 text-xs group-hover:text-white transition-colors">Nueva tarjeta</p>
          </button>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="hs-card rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-white/[0.06]">
          <h2 className="text-white font-semibold">Movimientos Recientes</h2>
          <button
            onClick={() => setActiveView('history')}
            className="text-green-500 text-sm flex items-center gap-1 hover:text-green-400 transition-colors"
          >
            Ver todos <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="divide-y divide-white/[0.06]">
          {wallet.transactions.length === 0 && (
            <p className="text-white/40 text-sm text-center py-8">Sin movimientos todavía.</p>
          )}
          {wallet.transactions.slice(0, 5).map((transaction) => {
            const isPositive = transaction.amount >= 0;
            return (
              <div key={transaction.id} className="flex items-center gap-4 p-4 hover:bg-white/[0.04] transition-colors">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ring-1 ${isPositive ? 'bg-emerald-500/15 ring-emerald-500/20' : 'bg-rose-500/15 ring-rose-500/20'}`}>
                  {getTransactionIcon(transaction.type, isPositive)}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{transaction.description}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-white/40 text-xs">{TYPE_LABEL[transaction.type] || transaction.type}</span>
                    <span className="text-white/20">•</span>
                    <span className="text-white/40 text-xs">{formatDate(transaction.timestamp)}</span>
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <p className={`font-semibold tabular-nums ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {isPositive ? '+' : '-'}${Math.abs(transaction.amount).toLocaleString('es-CO')}
                  </p>
                  <span className={`text-xs px-2 py-0.5 rounded-full
                    ${transaction.status === 'completed'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : transaction.status === 'pending'
                        ? 'bg-yellow-500/20 text-yellow-400'
                        : 'bg-rose-500/20 text-rose-400'
                    }
                  `}>
                    {transaction.status === 'completed' ? 'Completado' : transaction.status === 'pending' ? 'Pendiente' : 'Fallido'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
