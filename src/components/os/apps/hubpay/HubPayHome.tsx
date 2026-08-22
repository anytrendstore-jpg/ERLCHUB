'use client';

import React from 'react';
import { useHubPay } from '@/contexts/HubPayContext';
import {
  ArrowUpRight,
  ArrowDownLeft,
  Send,
  Wallet,
  CreditCard,
  TrendingUp,
  TrendingDown,
  Clock,
  ChevronRight,
  Snowflake,
} from 'lucide-react';

const TYPE_LABEL: Record<string, string> = {
  salary: 'Salario',
  transfer_in: 'Transferencia recibida',
  transfer_out: 'Transferencia enviada',
  withdrawal: 'Retiro',
  deposit: 'Depósito',
  expense: 'Gasto',
};

export default function HubPayHome() {
  const { wallet, setActiveView } = useHubPay();

  const getTransactionIcon = (type: string, positive: boolean) => {
    if (type === 'transfer_out') return <Send className="w-4 h-4 text-red-400" />;
    if (positive) return <ArrowDownLeft className="w-4 h-4 text-green-400" />;
    return <ArrowUpRight className="w-4 h-4 text-red-400" />;
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

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-white text-2xl font-bold mb-1">Bienvenido de vuelta</h1>
        <p className="text-white/50">Resumen de tu cuenta HubPay</p>
      </div>

      {wallet.frozen && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-3">
          <Snowflake className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-400 font-semibold text-sm">Tu cuenta de HubPay está congelada por Staff</p>
            {wallet.frozenReason && <p className="text-red-400/70 text-xs mt-0.5">Motivo: {wallet.frozenReason}</p>}
            <p className="text-white/40 text-xs mt-1">No puedes transferir, depositar, retirar, apostar ni comprar mientras esté congelada.</p>
          </div>
        </div>
      )}

      {/* Balance Cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {/* Main Balance */}
        <div className="col-span-2 p-6 rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxjaXJjbGUgY3g9IjIwIiBjeT0iMjAiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4xKSIvPjwvZz48L3N2Zz4=')] opacity-50" />
          <div className="relative">
            <p className="text-white/70 text-sm mb-2">Saldo Total</p>
            <p className="text-white text-4xl font-bold mb-4">
              ${wallet.totalBalance.toLocaleString()}
            </p>
            <div className="flex gap-6">
              <div>
                <p className="text-white/50 text-xs">Disponible</p>
                <p className="text-white text-lg font-semibold">
                  ${wallet.availableBalance.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-white/50 text-xs">Retenido</p>
                <p className="text-yellow-300 text-lg font-semibold">
                  ${wallet.retainedBalance.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="flex flex-col gap-4">
          <div className="flex-1 p-4 rounded-xl bg-green-500/10 border border-green-500/20">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <span className="text-green-400 text-xs">Ingresos del mes</span>
            </div>
            <p className="text-white text-xl font-bold">
              +${totalIncome.toLocaleString()}
            </p>
          </div>
          <div className="flex-1 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="w-4 h-4 text-red-400" />
              <span className="text-red-400 text-xs">Gastos del mes</span>
            </div>
            <p className="text-white text-xl font-bold">
              -${totalExpense.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-4 gap-3 mb-8">
        {[
          { icon: Send, label: 'Transferir', view: 'transfer', color: 'blue' },
          { icon: Wallet, label: 'Bolsillos', view: 'pockets', color: 'purple' },
          { icon: CreditCard, label: 'Tarjetas', view: 'cards', color: 'green' },
          { icon: ArrowDownLeft, label: 'Retirar', view: 'withdraw', color: 'orange' }
        ].map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.view}
              onClick={() => setActiveView(action.view as 'transfer' | 'pockets' | 'cards' | 'withdraw')}
              className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 transition-all duration-200 group"
            >
              <div className={`w-12 h-12 rounded-xl bg-${action.color}-500/20 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                <Icon className={`w-6 h-6 text-${action.color}-400`} />
              </div>
              <span className="text-white/70 text-sm">{action.label}</span>
            </button>
          );
        })}
      </div>

      {/* Recent Transactions */}
      <div className="rounded-2xl bg-white/5 border border-white/5 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-white/5">
          <h2 className="text-white font-semibold">Movimientos Recientes</h2>
          <button
            onClick={() => setActiveView('history')}
            className="text-blue-400 text-sm flex items-center gap-1 hover:text-blue-300 transition-colors"
          >
            Ver todos <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="divide-y divide-white/5">
          {wallet.transactions.length === 0 && (
            <p className="text-white/40 text-sm text-center py-8">Sin movimientos todavía.</p>
          )}
          {wallet.transactions.slice(0, 5).map((transaction) => {
            const isPositive = transaction.amount >= 0;
            return (
              <div key={transaction.id} className="flex items-center gap-4 p-4 hover:bg-white/5 transition-colors">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${isPositive ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
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
                  <p className={`font-semibold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                    {isPositive ? '+' : '-'}${Math.abs(transaction.amount).toLocaleString('es-CO')}
                  </p>
                  <span className={`text-xs px-2 py-0.5 rounded-full
                    ${transaction.status === 'completed'
                      ? 'bg-green-500/20 text-green-400'
                      : transaction.status === 'pending'
                        ? 'bg-yellow-500/20 text-yellow-400'
                        : 'bg-red-500/20 text-red-400'
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
