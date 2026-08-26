"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useHubCoins } from "@/hooks/useHubCoins";
import { useDiscordAuth } from "@/hooks/useDiscordAuth";
import { TrendingUp, TrendingDown, Clock, Coins, ShoppingBag, ArrowUpRight, ArrowDownRight, Home } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function PedidosPage() {
  const { transactions, loading, error } = useHubCoins();
  const { user } = useDiscordAuth();
  const [filter, setFilter] = useState<'all' | 'purchases' | 'spends'>('all');

  const filteredTransactions = transactions.filter(transaction => {
    if (filter === 'all') return true;
    return transaction.type === filter.slice(0, -1); 
  });

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Justo ahora';
    if (diffMins < 60) return `hace ${diffMins} min`;
    if (diffHours < 24) return `hace ${diffHours} h`;
    if (diffDays < 7) return `hace ${diffDays} días`;
    
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)] pt-20">
        <Navbar />
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="w-12 h-12 border-4 border-[#8e00f7] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[var(--text-muted)]">Cargando historial de compras...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[var(--background)] pt-20">
        <Navbar />
        <div className="container mx-auto px-4 py-16 text-center">
          <p className="text-red-400 mb-4">Error: {error}</p>
          <Link href="/tienda" className="text-[#8e00f7] hover:text-[#a64dfa]">
            Volver a la tienda
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)] pt-20">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-4">Mis Compras</h1>
            <p className="text-[var(--text-muted)] text-lg">
              Historial completo de tus transacciones de Hub Coins
            </p>
          </div>

          <div className="flex justify-center mb-8">
            <div className="bg-[var(--card-bg)] border border-[var(--card-border-soft)] rounded-xl p-1 inline-flex">
              {[
                { value: 'all', label: 'Todas' },
                { value: 'purchases', label: 'Compras' },
                { value: 'spends', label: 'Gastos' }
              ].map((f) => (
                <button
                  key={f.value}
                  onClick={() => setFilter(f.value as any)}
                  className={`px-6 py-2 rounded-lg font-medium transition-all ${
                    filter === f.value ? 'bg-[#8e00f7] text-white' : 'text-[var(--text-muted)] hover:text-white'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-12 bg-[var(--card-bg)] border border-[var(--card-border-soft)] rounded-xl">
                <ShoppingBag className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                <p className="text-[var(--text-muted)]">
                  {filter === 'all' 
                    ? 'No tienes transacciones aún' 
                    : filter === 'purchases' 
                    ? 'No tienes compras de Hub Coins'
                    : 'No tienes gastos de Hub Coins'
                  }
                </p>
                <Link 
                  href="/tienda/hub-coins" 
                  className="inline-block mt-4 text-[#8e00f7] hover:text-[#a64dfa]"
                >
                  Comprar Hub Coins
                </Link>
              </div>
            ) : (
              filteredTransactions.map((transaction) => (
                <div
                  key={transaction._id}
                  className="bg-[var(--card-bg)] border border-[var(--card-border-soft)] rounded-xl p-6 hover:border-[#2a2a38] transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {transaction.user?.avatar ? (
                        <Image
                          src={`https://cdn.discordapp.com/avatars/${transaction.userId}/${transaction.user.avatar}.png?size=40`}
                          alt={transaction.user.username}
                          width={40}
                          height={40}
                          className="w-10 h-10 rounded-full"
                          onError={(e) => {
                            e.currentTarget.src = `https://cdn.discordapp.com/embed/avatars/0.png?size=40`;
                          }}
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-[#8e00f7] flex items-center justify-center text-white font-bold">
                          {(transaction.user?.username || "U").charAt(0).toUpperCase()}
                        </div>
                      )}

                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-white font-medium">
                            {transaction.user?.username || 'Usuario'}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                            transaction.type === 'purchase' 
                              ? 'bg-green-500/20 text-green-400' 
                              : 'bg-red-500/20 text-red-400'
                          }`}>
                            {transaction.type === 'purchase' ? 'COMPRA' : 'GASTO'}
                          </span>
                        </div>
                        <p className="text-[var(--text-muted)] text-sm">{transaction.description}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className={`flex items-center gap-1 text-2xl font-bold mb-1 ${
                        transaction.type === 'purchase' ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {transaction.type === 'purchase' ? (
                          <ArrowUpRight className="h-5 w-5" />
                        ) : (
                          <ArrowDownRight className="h-5 w-5" />
                        )}
                        {transaction.type === 'purchase' ? '+' : '-'}{transaction.amount}
                        <Coins className="h-5 w-5" />
                      </div>
                      <div className="flex items-center gap-1 text-[var(--text-faint)] text-sm">
                        <Clock className="h-3 w-3" />
                        {formatTimestamp(transaction.timestamp)}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {filteredTransactions.length > 0 && (
            <div className="mt-8 bg-[var(--card-bg)] border border-[var(--card-border-soft)] rounded-xl p-6">
              <h3 className="text-white font-bold mb-4">Resumen</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">
                    +{filteredTransactions.filter(t => t.type === 'purchase').reduce((sum, t) => sum + t.amount, 0)}
                  </div>
                  <div className="text-[var(--text-muted)] text-sm">Total Recibido</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-400">
                    -{filteredTransactions.filter(t => t.type === 'spend').reduce((sum, t) => sum + t.amount, 0)}
                  </div>
                  <div className="text-[var(--text-muted)] text-sm">Total Gastado</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-[#8e00f7]">
                    {filteredTransactions.length}
                  </div>
                  <div className="text-[var(--text-muted)] text-sm">Transacciones</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 text-center">
        <button
          onClick={() => window.location.href = '/'}
          className="px-6 py-3 bg-[#8e00f7] hover:bg-[#7a00d4] text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 mx-auto"
        >
          <Home className="h-4 w-4" />
          Regresar a Inicio
        </button>
      </div>

      <Footer />
    </div>
  );
}