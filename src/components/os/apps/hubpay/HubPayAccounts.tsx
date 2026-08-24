'use client';

import React, { useState } from 'react';
import { useHubPay } from '@/contexts/HubPayContext';
import {
  Plus,
  Building2,
  CheckCircle,
  Clock,
  Copy,
  X,
  Briefcase,
  PiggyBank,
  Wallet
} from 'lucide-react';

/** Tailwind no puede resolver clases armadas con template strings — necesita ver el
 * nombre completo de la clase de forma literal en el código fuente. */
const TYPE_COLOR: Record<string, { selectedBg: string; iconBg: string; iconText: string }> = {
  green: { selectedBg: 'bg-green-500/20 border-green-500/50', iconBg: 'bg-green-500/20', iconText: 'text-green-400' },
  blue: { selectedBg: 'bg-blue-500/20 border-blue-500/50', iconBg: 'bg-blue-500/20', iconText: 'text-blue-400' },
  purple: { selectedBg: 'bg-purple-500/20 border-purple-500/50', iconBg: 'bg-purple-500/20', iconText: 'text-purple-400' },
};

export default function HubPayAccounts() {
  const { wallet, createAccount } = useHubPay();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedType, setSelectedType] = useState<'savings' | 'checking' | 'business'>('savings');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const accountTypes = [
    {
      type: 'savings' as const,
      label: 'Cuenta de Ahorros',
      icon: PiggyBank,
      description: 'Ideal para guardar dinero a largo plazo',
      color: 'green'
    },
    {
      type: 'checking' as const,
      label: 'Cuenta Corriente',
      icon: Wallet,
      description: 'Para transacciones del día a día',
      color: 'blue'
    },
    {
      type: 'business' as const,
      label: 'Cuenta Empresarial',
      icon: Briefcase,
      description: 'Para tu negocio o empresa',
      color: 'purple'
    }
  ];

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCreate = () => {
    createAccount(selectedType);
    setShowCreateModal(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="flex items-center gap-1 text-green-400 text-xs bg-green-500/20 px-2 py-1 rounded-full">
            <CheckCircle className="w-3 h-3" /> Activa
          </span>
        );
      case 'pending':
        return (
          <span className="flex items-center gap-1 text-yellow-400 text-xs bg-yellow-500/20 px-2 py-1 rounded-full">
            <Clock className="w-3 h-3" /> Pendiente
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 text-red-400 text-xs bg-red-500/20 px-2 py-1 rounded-full">
            Congelada
          </span>
        );
    }
  };

  const getAccountTypeLabel = (type: string) => {
    switch (type) {
      case 'savings': return 'Ahorros';
      case 'checking': return 'Corriente';
      case 'business': return 'Empresarial';
      default: return type;
    }
  };

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-white text-2xl font-bold mb-1">Cuentas Bancarias</h1>
          <p className="text-white/50">Administra tus cuentas HubPay</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nueva cuenta
        </button>
      </div>

      {/* Accounts List */}
      <div className="space-y-4">
        {wallet.accounts.map((account) => (
          <div
            key={account.id}
            className="hs-card hs-card-hover p-6 rounded-2xl"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center
                  ${account.type === 'savings'
                    ? 'bg-green-500/20'
                    : account.type === 'checking'
                      ? 'bg-blue-500/20'
                      : 'bg-purple-500/20'
                  }
                `}>
                  <Building2 className={`w-7 h-7
                    ${account.type === 'savings'
                      ? 'text-green-400'
                      : account.type === 'checking'
                        ? 'text-blue-400'
                        : 'text-purple-400'
                    }
                  `} />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-lg">
                    Cuenta de {getAccountTypeLabel(account.type)}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="text-white/50 text-sm font-mono">{account.accountNumber}</code>
                    <button
                      onClick={() => handleCopy(account.accountNumber, account.id)}
                      className="p-1 hover:bg-white/10 rounded transition-colors"
                    >
                      {copiedId === account.id ? (
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      ) : (
                        <Copy className="w-4 h-4 text-white/40" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
              {getStatusBadge(account.status)}
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-white/40 text-sm mb-1">Saldo</p>
                <p className="text-white text-xl font-bold">${account.balance.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-white/40 text-sm mb-1">Tipo</p>
                <p className="text-white">{getAccountTypeLabel(account.type)}</p>
              </div>
              <div>
                <p className="text-white/40 text-sm mb-1">Creada</p>
                <p className="text-white">
                  {account.createdAt.toLocaleDateString('es-ES', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })}
                </p>
              </div>
            </div>
          </div>
        ))}

        {wallet.accounts.length === 0 && (
          <div className="text-center py-16">
            <Building2 className="w-16 h-16 text-white/20 mx-auto mb-4" />
            <p className="text-white/40 mb-4">No tienes cuentas bancarias</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors"
            >
              Crear mi primera cuenta
            </button>
          </div>
        )}
      </div>

      {/* Create Account Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[2000]">
          <div className="bg-[#12121a] rounded-2xl p-6 w-full max-w-lg border border-white/10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-white text-xl font-bold">Crear Nueva Cuenta</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-white/60" />
              </button>
            </div>

            <p className="text-white/50 mb-6">Selecciona el tipo de cuenta que deseas crear</p>

            <div className="space-y-3 mb-6">
              {accountTypes.map((type) => {
                const Icon = type.icon;
                const isSelected = selectedType === type.type;

                const c = TYPE_COLOR[type.color];
                return (
                  <button
                    key={type.type}
                    onClick={() => setSelectedType(type.type)}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all duration-200
                      ${isSelected ? c.selectedBg : 'bg-white/5 border-white/10 hover:bg-white/10'}
                    `}
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${c.iconBg}`}>
                      <Icon className={`w-6 h-6 ${c.iconText}`} />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-white font-medium">{type.label}</p>
                      <p className="text-white/50 text-sm">{type.description}</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center
                      ${isSelected ? 'border-blue-500 bg-blue-500' : 'border-white/30'}
                    `}>
                      {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl mb-6">
              <p className="text-yellow-400 text-sm">
                La cuenta será creada en estado "Pendiente" hasta que sea verificada por el sistema.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreate}
                className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors"
              >
                Crear cuenta
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
