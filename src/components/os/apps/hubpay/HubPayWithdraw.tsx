'use client';

import React, { useState } from 'react';
import { useHubPay } from '@/contexts/HubPayContext';
import {
  Building2,
  Bitcoin,
  Banknote,
  ArrowRight,
  Check,
  Loader2,
  Clock,
  AlertCircle
} from 'lucide-react';

export default function HubPayWithdraw() {
  const { wallet, requestWithdrawal, setActiveView } = useHubPay();
  const [step, setStep] = useState<'method' | 'amount' | 'confirm' | 'processing' | 'success'>('method');
  const [selectedMethod, setSelectedMethod] = useState<'bank' | 'crypto' | 'cash' | null>(null);
  const [amount, setAmount] = useState('');

  const methods = [
    {
      id: 'bank' as const,
      label: 'Transferencia Bancaria',
      description: 'Retira a tu cuenta de banco',
      icon: Building2,
      fee: '2%',
      time: '1-3 días',
      color: 'blue'
    },
    {
      id: 'crypto' as const,
      label: 'Criptomonedas',
      description: 'Retira en Bitcoin o USDT',
      icon: Bitcoin,
      fee: '1%',
      time: 'Instantáneo',
      color: 'orange'
    },
    {
      id: 'cash' as const,
      label: 'Efectivo',
      description: 'Retira en punto autorizado',
      icon: Banknote,
      fee: '3%',
      time: '24 horas',
      color: 'green'
    }
  ];

  const handleSelectMethod = (method: 'bank' | 'crypto' | 'cash') => {
    setSelectedMethod(method);
    setStep('amount');
  };

  const handleContinue = () => {
    if (step === 'amount' && Number.parseFloat(amount) > 0) {
      setStep('confirm');
    }
  };

  const handleConfirm = async () => {
    if (!selectedMethod) return;
    setStep('processing');
    await requestWithdrawal(Number.parseFloat(amount), selectedMethod);
    setStep('success');
  };

  const handleReset = () => {
    setStep('method');
    setSelectedMethod(null);
    setAmount('');
  };

  const selectedMethodData = methods.find(m => m.id === selectedMethod);
  const fee = selectedMethodData
    ? Number.parseFloat(amount || '0') * (Number.parseFloat(selectedMethodData.fee) / 100)
    : 0;
  const total = Number.parseFloat(amount || '0') - fee;

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-white text-2xl font-bold mb-1">Retirar Fondos</h1>
        <p className="text-white/50">Retira tu dinero a tu cuenta o en efectivo</p>
      </div>

      {/* Steps Indicator */}
      {step !== 'success' && step !== 'processing' && (
        <div className="flex items-center gap-2 mb-8 max-w-lg">
          {['Método', 'Monto', 'Confirmar'].map((label, index) => {
            const stepNum = index + 1;
            const currentStep = step === 'method' ? 1 : step === 'amount' ? 2 : 3;
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
      )}

      {/* Content */}
      <div className="max-w-lg">
        {step === 'method' && (
          <div className="space-y-4">
            <p className="text-white/60 mb-4">Selecciona el método de retiro</p>

            {methods.map((method) => {
              const Icon = method.icon;
              return (
                <button
                  key={method.id}
                  onClick={() => handleSelectMethod(method.id)}
                  className="w-full flex items-center gap-4 p-5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all group"
                >
                  <div className={`w-14 h-14 rounded-xl bg-${method.color}-500/20 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <Icon className={`w-7 h-7 text-${method.color}-400`} />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-white font-semibold">{method.label}</p>
                    <p className="text-white/50 text-sm">{method.description}</p>
                    <div className="flex gap-4 mt-2">
                      <span className="text-white/40 text-xs">Comisión: {method.fee}</span>
                      <span className="text-white/40 text-xs">Tiempo: {method.time}</span>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-white/30 group-hover:text-white/60 transition-colors" />
                </button>
              );
            })}
          </div>
        )}

        {step === 'amount' && selectedMethodData && (
          <div className="space-y-6">
            {/* Selected Method */}
            <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/10">
              <div className={`w-12 h-12 rounded-xl bg-${selectedMethodData.color}-500/20 flex items-center justify-center`}>
                <selectedMethodData.icon className={`w-6 h-6 text-${selectedMethodData.color}-400`} />
              </div>
              <div>
                <p className="text-white font-medium">{selectedMethodData.label}</p>
                <p className="text-white/50 text-sm">Comisión: {selectedMethodData.fee}</p>
              </div>
              <button
                onClick={() => setStep('method')}
                className="ml-auto text-blue-400 text-sm hover:text-blue-300"
              >
                Cambiar
              </button>
            </div>

            {/* Amount Input */}
            <div>
              <label className="text-white/60 text-sm block mb-2">Monto a retirar</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 text-2xl">$</span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-4 text-white text-3xl font-bold placeholder-white/20 focus:outline-none focus:border-blue-500/50 transition-colors"
                />
              </div>
              <p className="text-white/40 text-sm mt-2">
                Disponible: <span className="text-white">${wallet.availableBalance.toLocaleString()}</span>
              </p>
            </div>

            {/* Quick Amounts */}
            <div className="flex gap-2">
              {[5000, 10000, 25000, 50000].map((value) => (
                <button
                  key={value}
                  onClick={() => setAmount(value.toString())}
                  disabled={value > wallet.availableBalance}
                  className="flex-1 py-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed border border-white/10 text-white/70 hover:text-white text-sm transition-colors"
                >
                  ${value.toLocaleString()}
                </button>
              ))}
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

        {step === 'confirm' && selectedMethodData && (
          <div className="space-y-6">
            <div className="p-6 bg-white/5 rounded-2xl border border-white/10 text-center">
              <p className="text-white/50 text-sm mb-2">Vas a retirar</p>
              <p className="text-white text-4xl font-bold mb-2">
                ${Number.parseFloat(amount).toLocaleString()}
              </p>
              <p className="text-white/50 text-sm">vía {selectedMethodData.label}</p>
            </div>

            {/* Details */}
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-white/5">
                <span className="text-white/50">Monto</span>
                <span className="text-white">${Number.parseFloat(amount).toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/5">
                <span className="text-white/50">Comisión ({selectedMethodData.fee})</span>
                <span className="text-red-400">-${fee.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/5">
                <span className="text-white/50">Tiempo estimado</span>
                <span className="text-white flex items-center gap-1">
                  <Clock className="w-4 h-4" /> {selectedMethodData.time}
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-white font-medium">Recibirás</span>
                <span className="text-green-400 font-bold text-lg">${total.toLocaleString()}</span>
              </div>
            </div>

            {/* Warning */}
            <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl flex gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
              <p className="text-yellow-400/80 text-sm">
                Una vez confirmado, el retiro no podrá ser cancelado. El monto será retenido hasta completar la transacción.
              </p>
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
                className="flex-1 py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-colors"
              >
                Confirmar retiro
              </button>
            </div>
          </div>
        )}

        {step === 'processing' && (
          <div className="text-center py-16">
            <div className="w-20 h-20 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto mb-6">
              <Loader2 className="w-10 h-10 text-blue-400 animate-spin" />
            </div>
            <h2 className="text-white text-2xl font-bold mb-2">Procesando retiro...</h2>
            <p className="text-white/50">Por favor espera mientras verificamos tu solicitud</p>
          </div>
        )}

        {step === 'success' && (
          <div className="text-center py-12">
            <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
              <Check className="w-10 h-10 text-green-400" />
            </div>
            <h2 className="text-white text-2xl font-bold mb-2">¡Retiro solicitado!</h2>
            <p className="text-white/50 mb-2">
              Tu retiro de ${Number.parseFloat(amount).toLocaleString()} está siendo procesado.
            </p>
            <p className="text-white/40 text-sm mb-8">
              Tiempo estimado: {selectedMethodData?.time}
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={handleReset}
                className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-semibold transition-colors"
              >
                Nuevo retiro
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
      </div>
    </div>
  );
}
