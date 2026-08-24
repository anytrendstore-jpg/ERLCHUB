'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useHubPay } from '@/contexts/HubPayContext';
import {
  Search,
  User,
  Send,
  Check,
  AlertCircle,
  Loader2,
  ArrowRight
} from 'lucide-react';

interface SearchUser { id: string; name: string; username: string; avatar: string }

export default function HubPayTransfer() {
  const { wallet, sendMoney, setActiveView } = useHubPay();
  const [step, setStep] = useState<'search' | 'amount' | 'confirm' | 'success' | 'error'>('search');
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<SearchUser | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [commissionRate, setCommissionRate] = useState(0);

  useEffect(() => {
    fetch('/api/hubpay/tax-rates', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          const rate = d.rates.find((r: any) => r.category === 'transferencias');
          if (rate) setCommissionRate(rate.percentage / 100);
        }
      });
  }, []);

  useEffect(() => {
    if (!recipient.trim() || selectedUser) { setSearchResults([]); return; }
    const t = setTimeout(() => {
      fetch(`/api/social/search?q=${encodeURIComponent(recipient.trim())}`, { cache: 'no-store' })
        .then((r) => r.json())
        .then((d) => {
          if (d.success) {
            setSearchResults(d.users.map((u: any) => ({ id: u.discordId, name: u.displayName, username: u.username, avatar: u.avatar })));
          }
        });
    }, 250);
    return () => clearTimeout(t);
  }, [recipient, selectedUser]);

  const recentContacts = useMemo(() => {
    const seen = new Map<string, SearchUser>();
    for (const t of (wallet.transactions as any[])) {
      if ((t.type !== 'transfer_out' && t.type !== 'transfer_in') || !t.counterpartyId || seen.has(t.counterpartyId)) continue;
      const name = String(t.description || '').match(/@([a-zA-Z0-9_.]+)/)?.[1] || t.counterpartyId;
      seen.set(t.counterpartyId, { id: t.counterpartyId, name, username: name, avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}` });
      if (seen.size >= 6) break;
    }
    return Array.from(seen.values());
  }, [wallet.transactions]);

  const filteredUsers = recipient.length > 0 ? searchResults : [];

  const handleSelectUser = (user: SearchUser) => {
    setSelectedUser(user);
    setRecipient(user.username);
    setStep('amount');
  };

  const handleContinue = () => {
    if (step === 'amount') {
      const numAmount = Number.parseFloat(amount);
      if (numAmount > 0 && numAmount <= wallet.availableBalance) {
        setStep('confirm');
      }
    }
  };

  const handleConfirm = async () => {
    setIsLoading(true);
    setErrorMsg('');
    const numAmount = Number.parseFloat(amount);
    const result = await sendMoney(recipient, numAmount, description);
    setIsLoading(false);
    if (!result.success) setErrorMsg(result.error || 'No se pudo completar la transferencia.');
    setStep(result.success ? 'success' : 'error');
  };

  const handleReset = () => {
    setStep('search');
    setRecipient('');
    setAmount('');
    setDescription('');
    setSelectedUser(null);
    setErrorMsg('');
  };

  const commission = Number.parseFloat(amount || '0') * commissionRate;
  const total = Number.parseFloat(amount || '0') + commission;

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-white text-2xl font-bold mb-1">Transferir Dinero</h1>
        <p className="text-white/50">Envía dinero a otros jugadores de forma segura</p>
      </div>

      {/* Steps Indicator */}
      <div className="flex items-center gap-2 mb-8">
        {['Destinatario', 'Monto', 'Confirmar'].map((label, index) => {
          const stepNum = index + 1;
          const currentStep = step === 'search' ? 1 : step === 'amount' ? 2 : step === 'confirm' ? 3 : 3;
          const isActive = stepNum <= currentStep;
          const isCurrent = stepNum === currentStep;

          return (
            <React.Fragment key={label}>
              <div className={`flex items-center gap-2 ${isActive ? 'text-blue-400' : 'text-white/30'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all
                  ${isCurrent ? 'bg-blue-600 text-white' : isActive ? 'bg-blue-600/30 text-blue-400' : 'bg-white/10 text-white/30'}
                `}>
                  {stepNum}
                </div>
                <span className="text-sm hidden sm:inline">{label}</span>
              </div>
              {index < 2 && (
                <div className={`flex-1 h-0.5 ${isActive && stepNum < currentStep ? 'bg-blue-600' : 'bg-white/10'}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Step Content */}
      <div className="max-w-lg mx-auto">
        {step === 'search' && (
          <div className="space-y-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="Buscar por nombre o ID de usuario"
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-4 text-white placeholder-white/40 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/10 transition-colors"
              />
            </div>

            {/* Search Results */}
            {filteredUsers.length > 0 && (
              <div className="hs-card rounded-xl overflow-hidden divide-y divide-white/[0.06]">
                {filteredUsers.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => handleSelectUser(user)}
                    className="w-full flex items-center gap-4 p-4 hover:bg-white/[0.05] transition-colors"
                  >
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-12 h-12 rounded-full bg-gray-700"
                    />
                    <div className="flex-1 text-left">
                      <p className="text-white font-medium">{user.name}</p>
                      <p className="text-white/50 text-sm">@{user.username}</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-white/30" />
                  </button>
                ))}
              </div>
            )}

            {/* Recent Contacts */}
            {recentContacts.length > 0 && (
              <div>
                <h3 className="text-white/60 text-sm mb-3">Contactos recientes</h3>
                <div className="flex gap-4 flex-wrap">
                  {recentContacts.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => handleSelectUser(user)}
                      className="flex flex-col items-center gap-2 group"
                    >
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-14 h-14 rounded-full bg-gray-700 ring-2 ring-transparent group-hover:ring-blue-500 transition-all"
                      />
                      <span className="text-white/60 text-xs group-hover:text-white transition-colors">
                        {user.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {step === 'amount' && selectedUser && (
          <div className="space-y-6">
            {/* Selected User */}
            <div className="hs-card flex items-center gap-4 p-4 rounded-xl">
              <img
                src={selectedUser.avatar}
                alt={selectedUser.name}
                className="w-14 h-14 rounded-full"
              />
              <div>
                <p className="text-white font-medium">{selectedUser.name}</p>
                <p className="text-white/50 text-sm">@{recipient}</p>
              </div>
              <button
                onClick={() => setStep('search')}
                className="ml-auto text-blue-400 text-sm hover:text-blue-300"
              >
                Cambiar
              </button>
            </div>

            {/* Amount Input */}
            <div>
              <label className="text-white/60 text-sm block mb-2">Monto a enviar</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 text-2xl">$</span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-4 text-white text-3xl font-bold placeholder-white/20 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/10 transition-colors"
                />
              </div>
              <p className="text-white/40 text-sm mt-2">
                Disponible: <span className="text-white">${wallet.availableBalance.toLocaleString()}</span>
              </p>
            </div>

            {/* Quick Amounts */}
            <div className="flex gap-2">
              {[1000, 5000, 10000, 25000].map((value) => (
                <button
                  key={value}
                  onClick={() => setAmount(value.toString())}
                  className="flex-1 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white text-sm transition-colors"
                >
                  ${value.toLocaleString()}
                </button>
              ))}
            </div>

            {/* Description */}
            <div>
              <label className="text-white/60 text-sm block mb-2">Descripción (opcional)</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ej: Pago de deuda"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/10 transition-colors"
              />
            </div>

            {/* Continue Button */}
            <button
              onClick={handleContinue}
              disabled={!amount || Number.parseFloat(amount) <= 0 || Number.parseFloat(amount) > wallet.availableBalance}
              className="w-full py-4 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold transition-colors flex items-center justify-center gap-2"
            >
              Continuar <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {step === 'confirm' && selectedUser && (
          <div className="space-y-6">
            <div className="hs-card p-6 rounded-2xl text-center">
              <p className="text-white/50 text-sm mb-2">Vas a enviar</p>
              <p className="text-white text-4xl font-bold mb-4 tabular-nums">
                ${Number.parseFloat(amount).toLocaleString()}
              </p>
              <p className="text-white/50 text-sm">a</p>
              <div className="flex items-center justify-center gap-3 mt-4">
                <img
                  src={selectedUser.avatar}
                  alt={selectedUser.name}
                  className="w-12 h-12 rounded-full"
                />
                <div className="text-left">
                  <p className="text-white font-medium">{selectedUser.name}</p>
                  <p className="text-white/50 text-sm">@{recipient}</p>
                </div>
              </div>
            </div>

            {/* Transaction Details */}
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-white/5">
                <span className="text-white/50">Monto</span>
                <span className="text-white">${Number.parseFloat(amount).toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/5">
                <span className="text-white/50">Comisión ({(commissionRate * 100).toFixed(commissionRate * 100 % 1 === 0 ? 0 : 1)}%)</span>
                <span className="text-white">${commission.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-white font-medium">Total</span>
                <span className="text-white font-bold tabular-nums">${total.toLocaleString()}</span>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setStep('amount')}
                className="flex-1 py-4 rounded-xl bg-white/5 hover:bg-white/10 text-white font-semibold transition-colors"
              >
                Volver
              </button>
              <button
                onClick={handleConfirm}
                disabled={isLoading}
                className="flex-1 py-4 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white font-semibold transition-colors flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Confirmar envío
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="text-center py-12">
            <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
              <Check className="w-10 h-10 text-green-400" />
            </div>
            <h2 className="text-white text-2xl font-bold mb-2">¡Transferencia exitosa!</h2>
            <p className="text-white/50 mb-8">
              Has enviado ${Number.parseFloat(amount).toLocaleString()} a @{recipient}
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={handleReset}
                className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-semibold transition-colors"
              >
                Nueva transferencia
              </button>
              <button
                onClick={() => setActiveView('home')}
                className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-colors"
              >
                Ir al inicio
              </button>
            </div>
          </div>
        )}

        {step === 'error' && (
          <div className="text-center py-12">
            <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-10 h-10 text-red-400" />
            </div>
            <h2 className="text-white text-2xl font-bold mb-2">Error en la transferencia</h2>
            <p className="text-white/50 mb-8">
              {errorMsg || 'No se pudo completar la transferencia. Verifica tu saldo e intenta nuevamente.'}
            </p>
            <button
              onClick={handleReset}
              className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-colors"
            >
              Intentar de nuevo
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
