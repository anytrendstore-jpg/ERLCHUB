'use client';

import React from 'react';
import Image from 'next/image';
import { useHubPay } from '@/contexts/HubPayContext';
import {
  Home,
  Send,
  Wallet,
  Building2,
  CreditCard,
  ArrowDownToLine,
  Receipt,
  History,
  Shield,
  Landmark
} from 'lucide-react';

const menuItems = [
  { id: 'home', label: 'Inicio', icon: Home },
  { id: 'transfer', label: 'Transferir', icon: Send },
  { id: 'pockets', label: 'Bolsillos', icon: Wallet },
  { id: 'accounts', label: 'Cuentas', icon: Building2 },
  { id: 'cards', label: 'Tarjetas', icon: CreditCard },
  { id: 'loans', label: 'Préstamos', icon: Landmark },
  { id: 'withdraw', label: 'Retirar', icon: ArrowDownToLine },
  { id: 'taxes', label: 'Impuestos', icon: Receipt },
  { id: 'history', label: 'Historial', icon: History },
] as const;

export default function HubPaySidebar() {
  const { activeView, setActiveView, wallet } = useHubPay();

  return (
    <div className="w-64 h-full bg-[#0d0d14]/90 backdrop-blur-xl border-r border-white/[0.06] flex flex-col relative z-10">
      {/* Logo */}
      <div className="p-6 border-b border-white/[0.06]">
        <Image src="/flecalogo.png" alt="Fleeca Bank" width={1672} height={941} className="h-9 w-auto" priority />
        <p className="text-white/40 text-xs mt-1.5">Tu billetera virtual</p>
      </div>

      {/* Balance Quick View */}
      <div className="p-4 mx-3 mt-4 rounded-xl bg-[linear-gradient(140deg,rgba(22,163,74,0.25),rgba(21,128,61,0.08))] border border-green-600/20 shadow-lg shadow-green-950/20">
        <p className="text-white/60 text-xs mb-1">Saldo disponible</p>
        <p className="text-white text-2xl font-bold tabular-nums">
          ${wallet.availableBalance.toLocaleString()}
        </p>
        <div className="flex items-center gap-1 mt-2 text-emerald-400 text-xs">
          <Shield className="w-3 h-3" />
          <span>Cuenta verificada</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 mt-2 overflow-y-auto">
        <div className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id as typeof activeView)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group
                  ${isActive
                    ? 'bg-gradient-to-r from-green-600 to-green-500 text-white shadow-lg shadow-green-600/30'
                    : 'text-white/60 hover:text-white hover:bg-white/[0.05]'
                  }
                `}
              >
                <Icon className={`w-5 h-5 transition-transform duration-200 ${isActive ? 'text-white scale-110' : 'group-hover:scale-105'}`} />
                <span className="text-sm font-medium">{item.label}</span>

                {item.id === 'history' && (
                  <span className="ml-auto bg-white/15 text-[10px] px-2 py-0.5 rounded-full tabular-nums">
                    {wallet.transactions.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Bottom Info */}
      <div className="p-4 border-t border-white/5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-white/40">Versión 1.0</span>
          <span className="text-green-400 flex items-center gap-1">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            Conectado
          </span>
        </div>
      </div>
    </div>
  );
}
