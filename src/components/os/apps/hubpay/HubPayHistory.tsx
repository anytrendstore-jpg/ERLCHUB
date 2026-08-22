'use client';

import React, { useMemo, useState } from 'react';
import { useHubPay } from '@/contexts/HubPayContext';
import {
  ArrowUpRight,
  ArrowDownLeft,
  Send,
  Clock,
  Filter,
  Search,
  Calendar,
  Download,
  ChevronDown,
  Receipt,
  X,
  Share2,
  Check,
  MessageSquare,
} from 'lucide-react';

interface Transaction {
  id: string;
  type: string;
  amount: number;
  description: string;
  status: string;
  timestamp: Date;
}

interface ChatConversation {
  id: string;
  displayName: string;
  displayAvatar?: string;
  isGroup: boolean;
}

const TYPE_LABEL: Record<string, string> = {
  salary: 'Salario',
  transfer_in: 'Transferencia recibida',
  transfer_out: 'Transferencia enviada',
  withdrawal: 'Retiro',
  deposit: 'Depósito',
  expense: 'Gasto',
};

const FILTERS = [
  { id: 'all', label: 'Todos' },
  { id: 'salary', label: 'Salarios' },
  { id: 'transfer_in', label: 'Recibidas' },
  { id: 'transfer_out', label: 'Enviadas' },
  { id: 'deposit', label: 'Depósitos' },
  { id: 'withdrawal', label: 'Retiros' },
  { id: 'expense', label: 'Gastos' },
];

const DATE_RANGES = [
  { id: 'all', label: 'Todo' },
  { id: 'today', label: 'Hoy' },
  { id: '7d', label: 'Últimos 7 días' },
  { id: '30d', label: 'Últimos 30 días' },
  { id: 'month', label: 'Este mes' },
  { id: 'prevMonth', label: 'Mes anterior' },
];

function inRange(date: Date, range: string): boolean {
  const now = new Date();
  if (range === 'all') return true;
  if (range === 'today') return date.toDateString() === now.toDateString();
  if (range === '7d') return now.getTime() - date.getTime() <= 7 * 86400000;
  if (range === '30d') return now.getTime() - date.getTime() <= 30 * 86400000;
  if (range === 'month') return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  if (range === 'prevMonth') {
    const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return date.getMonth() === prev.getMonth() && date.getFullYear() === prev.getFullYear();
  }
  return true;
}

export default function HubPayHistory() {
  const { wallet } = useHubPay();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [receipt, setReceipt] = useState<Transaction | null>(null);
  const [showSharePicker, setShowSharePicker] = useState(false);
  const [chatConversations, setChatConversations] = useState<ChatConversation[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [sharedWith, setSharedWith] = useState<string | null>(null);

  const filteredTransactions = useMemo(() => wallet.transactions.filter(t => {
    const q = searchTerm.toLowerCase();
    const matchesSearch = !q || t.description.toLowerCase().includes(q) || (TYPE_LABEL[t.type] || t.type).toLowerCase().includes(q) || t.id.toLowerCase().includes(q);
    const matchesFilter = selectedFilter === 'all' || t.type === selectedFilter;
    const matchesDate = inRange(t.timestamp, dateRange);
    return matchesSearch && matchesFilter && matchesDate;
  }), [wallet.transactions, searchTerm, selectedFilter, dateRange]);

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'salary':
      case 'transfer_in':
      case 'deposit':
        return <ArrowDownLeft className="w-5 h-5 text-green-400" />;
      case 'expense':
      case 'withdrawal':
        return <ArrowUpRight className="w-5 h-5 text-red-400" />;
      case 'transfer_out':
        return <Send className="w-5 h-5 text-red-400" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const groupedTransactions = useMemo(() => filteredTransactions.reduce((groups, transaction) => {
    const date = transaction.timestamp.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
    if (!groups[date]) groups[date] = [];
    groups[date].push(transaction);
    return groups;
  }, {} as Record<string, typeof filteredTransactions>), [filteredTransactions]);

  const exportCsv = () => {
    const rows = [
      ['Fecha', 'Tipo', 'Descripción', 'Monto', 'Estado', 'Referencia'],
      ...filteredTransactions.map((t) => [
        t.timestamp.toISOString(),
        TYPE_LABEL[t.type] || t.type,
        t.description,
        String(t.amount),
        t.status,
        t.id,
      ]),
    ];
    const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hubpay-movimientos-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatReceiptText = (t: Transaction) => {
    const isPositive = t.amount >= 0;
    const lines = [
      '🧾 Comprobante HubPay',
      `${TYPE_LABEL[t.type] || t.type}`,
      `${t.description}`,
      `Monto: ${isPositive ? '+' : '-'}$${Math.abs(t.amount).toLocaleString('es-CO')}`,
      `Fecha: ${t.timestamp.toLocaleString('es-CO')}`,
      `Referencia: #${t.id.slice(0, 8)}`,
      `Estado: ${t.status === 'completed' ? 'Completado' : t.status === 'pending' ? 'Pendiente' : 'Fallido'}`,
    ];
    return lines.join('\n');
  };

  const openSharePicker = async () => {
    setShowSharePicker(true);
    setSharedWith(null);
    setLoadingConversations(true);
    try {
      const res = await fetch('/api/chat/conversations', { cache: 'no-store' });
      const data = await res.json();
      if (data.success) setChatConversations(data.conversations);
    } finally {
      setLoadingConversations(false);
    }
  };

  const shareReceipt = async (conversationId: string, name: string) => {
    if (!receipt) return;
    await fetch('/api/chat/messages', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversationId, text: formatReceiptText(receipt) }),
    });
    setSharedWith(name);
    setShowSharePicker(false);
  };

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-white text-2xl font-bold mb-1">Historial</h1>
          <p className="text-white/50">Todas tus transacciones</p>
        </div>
        <button onClick={exportCsv} disabled={filteredTransactions.length === 0} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-40 text-white/70 transition-colors">
          <Download className="w-4 h-4" />
          Exportar
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-3 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por descripción, tipo o número de operación..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-blue-500/50 transition-colors"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-colors
            ${showFilters
              ? 'bg-blue-600 border-blue-500 text-white'
              : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
            }
          `}
        >
          <Filter className="w-5 h-5" />
          Filtros
          <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Filter Pills */}
      {showFilters && (
        <div className="space-y-3 mb-6 p-4 bg-white/5 rounded-xl border border-white/10">
          <div>
            <p className="text-white/40 text-xs mb-2">Tipo</p>
            <div className="flex flex-wrap gap-2">
              {FILTERS.map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setSelectedFilter(filter.id)}
                  className={`px-4 py-2 rounded-full text-sm transition-colors
                    ${selectedFilter === filter.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-white/10 text-white/60 hover:bg-white/20 hover:text-white'
                    }
                  `}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-white/40 text-xs mb-2">Fecha</p>
            <div className="flex flex-wrap gap-2">
              {DATE_RANGES.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setDateRange(r.id)}
                  className={`px-4 py-2 rounded-full text-sm transition-colors
                    ${dateRange === r.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-white/10 text-white/60 hover:bg-white/20 hover:text-white'
                    }
                  `}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Stats Summary */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-center">
          <p className="text-white/40 text-xs mb-1">Total</p>
          <p className="text-white font-bold">{filteredTransactions.length}</p>
        </div>
        <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-center">
          <p className="text-green-400/60 text-xs mb-1">Ingresos</p>
          <p className="text-green-400 font-bold">
            {filteredTransactions.filter(t => t.amount > 0).length}
          </p>
        </div>
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-center">
          <p className="text-red-400/60 text-xs mb-1">Gastos</p>
          <p className="text-red-400 font-bold">
            {filteredTransactions.filter(t => t.amount < 0).length}
          </p>
        </div>
        <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-center">
          <p className="text-blue-400/60 text-xs mb-1">Transferencias</p>
          <p className="text-blue-400 font-bold">
            {filteredTransactions.filter(t => t.type === 'transfer_in' || t.type === 'transfer_out').length}
          </p>
        </div>
      </div>

      {/* Transactions List */}
      {Object.keys(groupedTransactions).length > 0 ? (
        <div className="space-y-6">
          {Object.entries(groupedTransactions).map(([date, transactions]) => (
            <div key={date}>
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-4 h-4 text-white/40" />
                <h3 className="text-white/60 text-sm font-medium">{date}</h3>
                <div className="flex-1 h-px bg-white/10" />
              </div>

              <div className="space-y-2">
                {transactions.map((transaction) => {
                  const isPositive = transaction.amount >= 0;
                  return (
                    <button
                      key={transaction.id}
                      onClick={() => setReceipt(transaction)}
                      className="w-full flex items-center gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/[0.07] border border-white/5 transition-colors text-left"
                    >
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${isPositive ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                        {getTransactionIcon(transaction.type)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium truncate">{transaction.description}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${isPositive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                            {TYPE_LABEL[transaction.type] || transaction.type}
                          </span>
                          <span className="text-white/30 text-xs">
                            {transaction.timestamp.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span className="text-white/20 text-xs font-mono truncate">#{transaction.id.slice(0, 8)}</span>
                        </div>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <p className={`text-lg font-bold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                          {isPositive ? '+' : '-'}${Math.abs(transaction.amount).toLocaleString('es-CO')}
                        </p>
                        <span className={`text-xs ${transaction.status === 'completed' ? 'text-green-400' : transaction.status === 'pending' ? 'text-yellow-400' : 'text-red-400'}`}>
                          {transaction.status === 'completed' ? 'Completado' : transaction.status === 'pending' ? 'Pendiente' : 'Fallido'}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <Clock className="w-16 h-16 text-white/20 mx-auto mb-4" />
          <p className="text-white/40 mb-2">No se encontraron transacciones</p>
          <p className="text-white/30 text-sm">Intenta cambiar los filtros de búsqueda</p>
        </div>
      )}

      {/* Comprobante digital */}
      {receipt && (() => {
        const isPositive = receipt.amount >= 0;
        return (
          <div className="absolute inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => { setReceipt(null); setShowSharePicker(false); }}>
            <div className="bg-[#0d0d14] border border-white/10 rounded-2xl w-full max-w-sm overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <div className="p-5 bg-gradient-to-br from-blue-600/20 to-blue-900/20 border-b border-white/10 relative">
                <button onClick={() => { setReceipt(null); setShowSharePicker(false); }} className="absolute top-3 right-3 text-white/40 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-2 text-blue-400 text-xs font-semibold mb-3">
                  <Receipt className="w-4 h-4" /> Comprobante HubPay
                </div>
                <p className={`text-3xl font-bold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                  {isPositive ? '+' : '-'}${Math.abs(receipt.amount).toLocaleString('es-CO')}
                </p>
                <p className="text-white/60 text-sm mt-1">{receipt.description}</p>
              </div>

              <div className="p-5 space-y-2.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-white/40">Tipo</span>
                  <span className="text-white">{TYPE_LABEL[receipt.type] || receipt.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/40">Fecha</span>
                  <span className="text-white">{receipt.timestamp.toLocaleString('es-CO')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/40">Referencia</span>
                  <span className="text-white font-mono text-xs">#{receipt.id.slice(0, 8)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/40">Estado</span>
                  <span className={receipt.status === 'completed' ? 'text-green-400' : receipt.status === 'pending' ? 'text-yellow-400' : 'text-red-400'}>
                    {receipt.status === 'completed' ? 'Completado' : receipt.status === 'pending' ? 'Pendiente' : 'Fallido'}
                  </span>
                </div>
              </div>

              {sharedWith ? (
                <div className="mx-5 mb-5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2 text-emerald-400 text-sm">
                  <Check className="w-4 h-4 flex-shrink-0" /> Comprobante enviado a {sharedWith} por HubChat
                </div>
              ) : showSharePicker ? (
                <div className="mx-5 mb-5 border border-white/10 rounded-xl overflow-hidden">
                  <p className="px-3 py-2 text-white/40 text-xs bg-white/5 border-b border-white/10">Elige un chat para compartir</p>
                  <div className="max-h-40 overflow-y-auto">
                    {loadingConversations ? (
                      <p className="text-white/30 text-xs text-center py-4">Cargando...</p>
                    ) : chatConversations.length === 0 ? (
                      <p className="text-white/30 text-xs text-center py-4">No tienes chats en HubChat todavía.</p>
                    ) : (
                      chatConversations.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => shareReceipt(c.id, c.displayName)}
                          className="w-full flex items-center gap-2 px-3 py-2 hover:bg-white/5 text-left"
                        >
                          {c.displayAvatar ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={c.displayAvatar} alt="" className="w-6 h-6 rounded-full" />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-blue-500/20" />
                          )}
                          <span className="text-white/80 text-xs truncate">{c.displayName}</span>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              ) : (
                <div className="px-5 pb-5">
                  <button
                    onClick={openSharePicker}
                    className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
                  >
                    <MessageSquare className="w-4 h-4" /> Compartir por HubChat
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
