'use client';

import React from 'react';
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
  Shield
} from 'lucide-react';
import { HubPayIcon } from '@/components/icons/AppIcons';

const menuItems = [
  { id: 'home', label: 'Inicio', icon: Home },
  { id: 'transfer', label: 'Transferir', icon: Send },
  { id: 'pockets', label: 'Bolsillos', icon: Wallet },
  { id: 'accounts', label: 'Cuentas', icon: Building2 },
  { id: 'cards', label: 'Tarjetas', icon: CreditCard },
  { id: 'withdraw', label: 'Retirar', icon: ArrowDownToLine },
  { id: 'taxes', label: 'Impuestos', icon: Receipt },
  { id: 'history', label: 'Historial', icon: History },
] as const;

export default function HubPaySidebar() {
  const { activeView, setActiveView, wallet } = useHubPay();

  return (
    <div className="w-64 h-full bg-[#0d0d14] border-r border-white/5 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-white/5">
        <div className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
            <HubPayIcon size={28} />
          </div>
          <div>
            <h1 className="text-white font-bold text-lg tracking-tight">HubPay</h1>
            <p className="text-white/40 text-xs">Tu billetera virtual</p>
          </div>
        </div>
      </div>

      {/* Balance Quick View */}
      <div className="p-4 mx-3 mt-4 rounded-xl bg-gradient-to-br from-blue-600/20 to-blue-800/10 border border-blue-500/20">
        <p className="text-white/60 text-xs mb-1">Saldo disponible</p>
        <p className="text-white text-2xl font-bold">
          ${wallet.availableBalance.toLocaleString()}
        </p>
        <div className="flex items-center gap-1 mt-2 text-green-400 text-xs">
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
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                  ${isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                  }
                `}
              >
                <Icon className={`w-5 h-5 transition-transform duration-200 ${isActive ? 'text-white scale-110' : 'group-hover:scale-105'}`} />
                <span className="text-sm font-medium">{item.label}</span>

                {item.id === 'history' && (
                  <span className="ml-auto bg-white/20 text-[10px] px-2 py-0.5 rounded-full">
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
