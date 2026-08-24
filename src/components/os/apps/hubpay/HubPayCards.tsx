'use client';

import React, { useState } from 'react';
import { useHubPay } from '@/contexts/HubPayContext';
import {
  Plus,
  CreditCard,
  Eye,
  EyeOff,
  Snowflake,
  Trash2,
  X,
  Wifi,
  Copy,
  CheckCircle
} from 'lucide-react';

export default function HubPayCards() {
  const { wallet, createCard, freezeCard, deleteCard } = useHubPay();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedColor, setSelectedColor] = useState<'blue' | 'black' | 'gradient'>('gradient');
  const [showCVV, setShowCVV] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const cardColors = [
    {
      id: 'gradient' as const,
      label: 'Gradiente',
      bg: 'bg-gradient-to-br from-blue-600 via-blue-700 to-purple-800'
    },
    {
      id: 'blue' as const,
      label: 'Azul',
      bg: 'bg-gradient-to-br from-blue-500 to-blue-700'
    },
    {
      id: 'black' as const,
      label: 'Negro',
      bg: 'bg-gradient-to-br from-gray-800 to-gray-900'
    }
  ];

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text.replace(/\s/g, ''));
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCreate = () => {
    createCard(selectedColor);
    setShowCreateModal(false);
  };

  const getCardBg = (color: string) => {
    switch (color) {
      case 'gradient': return 'bg-gradient-to-br from-blue-600 via-blue-700 to-purple-800';
      case 'blue': return 'bg-gradient-to-br from-blue-500 to-blue-700';
      case 'black': return 'bg-gradient-to-br from-gray-800 to-gray-900';
      default: return 'bg-gradient-to-br from-blue-600 to-purple-800';
    }
  };

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-white text-2xl font-bold mb-1">Tarjetas de Débito</h1>
          <p className="text-white/50">Administra tus tarjetas virtuales</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nueva tarjeta
        </button>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-2 gap-6">
        {wallet.cards.map((card) => (
          <div key={card.id} className="space-y-4 group">
            {/* Card Visual */}
            <div className={`relative aspect-[1.586/1] rounded-2xl p-6 ${getCardBg(card.color)} shadow-xl shadow-black/40 overflow-hidden ring-1 ring-white/10 transition-transform duration-300 group-hover:-translate-y-1 group-hover:shadow-2xl`}>
              {/* Pattern overlay */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/20 -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-white/10 translate-y-1/2 -translate-x-1/2" />
              </div>

              {/* Frozen overlay */}
              {card.status === 'frozen' && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
                  <div className="text-center">
                    <Snowflake className="w-12 h-12 text-blue-300 mx-auto mb-2 animate-pulse" />
                    <p className="text-white font-medium">Tarjeta Congelada</p>
                  </div>
                </div>
              )}

              <div className="relative h-full flex flex-col justify-between">
                {/* Top Row */}
                <div className="flex items-start justify-between">
                  <div className="w-12 h-10 rounded bg-gradient-to-br from-yellow-300 to-yellow-500 flex items-center justify-center">
                    <Wifi className="w-6 h-6 text-yellow-800 rotate-90" />
                  </div>
                  <span className="text-white/80 text-sm font-medium">HubPay</span>
                </div>

                {/* Card Number */}
                <div>
                  <p className="text-white/60 text-xs mb-1">Número de tarjeta</p>
                  <div className="flex items-center gap-2">
                    <p className="text-white text-xl font-mono tracking-wider tabular-nums">{card.cardNumber}</p>
                    <button
                      onClick={() => handleCopy(card.cardNumber, card.id)}
                      className="p-1 hover:bg-white/20 rounded transition-colors"
                    >
                      {copiedId === card.id ? (
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      ) : (
                        <Copy className="w-4 h-4 text-white/60" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Bottom Row */}
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-white/60 text-xs mb-1">Titular</p>
                    <p className="text-white font-medium">{card.cardHolder}</p>
                  </div>
                  <div className="flex gap-4">
                    <div>
                      <p className="text-white/60 text-xs mb-1">Expira</p>
                      <p className="text-white font-medium">{card.expiryDate}</p>
                    </div>
                    <div>
                      <p className="text-white/60 text-xs mb-1">CVV</p>
                      <div className="flex items-center gap-1">
                        <p className="text-white font-medium font-mono">
                          {showCVV === card.id ? card.cvv : '•••'}
                        </p>
                        <button
                          onClick={() => setShowCVV(showCVV === card.id ? null : card.id)}
                          className="p-1 hover:bg-white/20 rounded transition-colors"
                        >
                          {showCVV === card.id ? (
                            <EyeOff className="w-3 h-3 text-white/60" />
                          ) : (
                            <Eye className="w-3 h-3 text-white/60" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => freezeCard(card.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-colors
                  ${card.status === 'frozen'
                    ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                    : 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
                  }
                `}
              >
                <Snowflake className="w-4 h-4" />
                {card.status === 'frozen' ? 'Descongelar' : 'Congelar'}
              </button>
              <button
                onClick={() => deleteCard(card.id)}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}

        {/* Add New Card */}
        <button
          onClick={() => setShowCreateModal(true)}
          className="aspect-[1.586/1] rounded-2xl border-2 border-dashed border-white/10 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all flex flex-col items-center justify-center gap-3 group"
        >
          <div className="w-16 h-16 rounded-2xl bg-blue-500/20 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
            <CreditCard className="w-8 h-8 text-blue-400" />
          </div>
          <p className="text-white/60 group-hover:text-white transition-colors">Crear nueva tarjeta</p>
        </button>
      </div>

      {wallet.cards.length === 0 && (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center mx-auto mb-4">
            <CreditCard className="w-8 h-8 text-white/20" />
          </div>
          <p className="text-white/40 mb-4">No tienes tarjetas de débito</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors"
          >
            Crear mi primera tarjeta
          </button>
        </div>
      )}

      {/* Create Card Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[2000]">
          <div className="bg-[#12121a] rounded-2xl p-6 w-full max-w-md border border-white/10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-white text-xl font-bold">Crear Tarjeta</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-white/60" />
              </button>
            </div>

            <p className="text-white/50 mb-6">Selecciona el diseño de tu tarjeta</p>

            <div className="grid grid-cols-3 gap-3 mb-6">
              {cardColors.map((color) => (
                <button
                  key={color.id}
                  onClick={() => setSelectedColor(color.id)}
                  className={`aspect-[1.586/1] rounded-xl ${color.bg} transition-all relative hover:scale-[1.03]
                    ${selectedColor === color.id ? 'ring-2 ring-blue-400 ring-offset-2 ring-offset-[#12121a] scale-[1.03]' : ''}
                  `}
                >
                  {selectedColor === color.id && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <CheckCircle className="w-8 h-8 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>

            <div className="p-4 bg-white/5 rounded-xl mb-6">
              <h3 className="text-white font-medium mb-2">Información de la tarjeta</h3>
              <ul className="text-white/50 text-sm space-y-1">
                <li>• Tarjeta de débito virtual</li>
                <li>• Válida para compras en el servidor</li>
                <li>• Puedes congelarla en cualquier momento</li>
                <li>• Sin costo de emisión</li>
              </ul>
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
                Crear tarjeta
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
