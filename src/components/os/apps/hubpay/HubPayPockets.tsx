'use client';

import React, { useState } from 'react';
import { useHubPay } from '@/contexts/HubPayContext';
import {
  Plus,
  Lock,
  Unlock,
  ArrowUpRight,
  ArrowDownLeft,
  Wallet,
  Target,
  X
} from 'lucide-react';
import { PocketIcon } from '@/components/icons/AppIcons';

// SVG-based pocket icons for selection
const pocketIconOptions = [
  { id: 'money', label: 'Dinero' },
  { id: 'home', label: 'Casa' },
  { id: 'car', label: 'Auto' },
  { id: 'travel', label: 'Viaje' },
  { id: 'game', label: 'Gaming' },
  { id: 'phone', label: 'Tech' },
  { id: 'work', label: 'Trabajo' },
  { id: 'shield', label: 'Seguro' },
  { id: 'target', label: 'Meta' },
  { id: 'diamond', label: 'Lujo' },
];

const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function HubPayPockets() {
  const { wallet, createPocket, moveToPocket, moveFromPocket, togglePocketLock } = useHubPay();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showMoveModal, setShowMoveModal] = useState<{ pocketId: string; type: 'add' | 'remove' } | null>(null);

  // Create pocket form
  const [newPocketName, setNewPocketName] = useState('');
  const [newPocketIcon, setNewPocketIcon] = useState('money');
  const [newPocketGoal, setNewPocketGoal] = useState('');

  // Move money form
  const [moveAmount, setMoveAmount] = useState('');

  const handleCreatePocket = () => {
    if (!newPocketName) return;
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    createPocket(
      newPocketName,
      newPocketIcon,
      randomColor,
      newPocketGoal ? Number.parseFloat(newPocketGoal) : undefined
    );
    setShowCreateModal(false);
    setNewPocketName('');
    setNewPocketIcon('money');
    setNewPocketGoal('');
  };

  const handleMoveConfirm = () => {
    if (!showMoveModal || !moveAmount) return;
    const amount = Number.parseFloat(moveAmount);

    if (showMoveModal.type === 'add') {
      moveToPocket(showMoveModal.pocketId, amount);
    } else {
      moveFromPocket(showMoveModal.pocketId, amount);
    }

    setShowMoveModal(null);
    setMoveAmount('');
  };

  const totalPocketsBalance = wallet.pockets.reduce((acc, p) => acc + p.balance, 0);

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-white text-2xl font-bold mb-1">Bolsillos de Seguridad</h1>
          <p className="text-white/50">Organiza y protege tu dinero de hackeos</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors"
        >
          <Plus className="w-5 h-5" />
          Crear bolsillo
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <p className="text-white/50 text-sm mb-1">Total en bolsillos</p>
          <p className="text-white text-2xl font-bold">${totalPocketsBalance.toLocaleString()}</p>
        </div>
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <p className="text-white/50 text-sm mb-1">Saldo principal</p>
          <p className="text-white text-2xl font-bold">${wallet.availableBalance.toLocaleString()}</p>
        </div>
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <p className="text-white/50 text-sm mb-1">Bolsillos activos</p>
          <p className="text-white text-2xl font-bold">{wallet.pockets.length}</p>
        </div>
      </div>

      {/* Pockets Grid */}
      <div className="grid grid-cols-2 gap-4">
        {wallet.pockets.map((pocket) => {
          const progress = pocket.goal ? (pocket.balance / pocket.goal) * 100 : 0;

          return (
            <div
              key={pocket.id}
              className="p-5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/[0.07] transition-colors group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
                    style={{ backgroundColor: `${pocket.color}20` }}
                  >
                    <PocketIcon iconId={pocket.icon} size={32} />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">{pocket.name}</h3>
                    <p className="text-white/40 text-sm flex items-center gap-1">
                      {pocket.isLocked ? (
                        <>
                          <Lock className="w-3 h-3" /> Bloqueado
                        </>
                      ) : (
                        <>
                          <Unlock className="w-3 h-3" /> Desbloqueado
                        </>
                      )}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => togglePocketLock(pocket.id)}
                  className={`p-2 rounded-lg transition-all duration-200 hover:scale-110 ${
                    pocket.isLocked
                      ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'
                      : 'bg-white/10 text-white/60 hover:bg-white/20'
                  }`}
                >
                  {pocket.isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                </button>
              </div>

              <p className="text-white text-2xl font-bold mb-2">
                ${pocket.balance.toLocaleString()}
              </p>

              {pocket.goal && (
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-white/40 flex items-center gap-1">
                      <Target className="w-3 h-3" /> Meta
                    </span>
                    <span className="text-white/60">${pocket.goal.toLocaleString()}</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(progress, 100)}%`,
                        backgroundColor: pocket.color
                      }}
                    />
                  </div>
                  <p className="text-white/40 text-xs mt-1">{progress.toFixed(1)}% completado</p>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => setShowMoveModal({ pocketId: pocket.id, type: 'add' })}
                  className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors text-sm"
                >
                  <ArrowDownLeft className="w-4 h-4" /> Agregar
                </button>
                <button
                  onClick={() => setShowMoveModal({ pocketId: pocket.id, type: 'remove' })}
                  disabled={pocket.isLocked}
                  className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-white/10 text-white/70 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                >
                  <ArrowUpRight className="w-4 h-4" /> Retirar
                </button>
              </div>
            </div>
          );
        })}

        {/* Add New Pocket Card */}
        <button
          onClick={() => setShowCreateModal(true)}
          className="p-5 rounded-2xl border-2 border-dashed border-white/10 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all flex flex-col items-center justify-center gap-3 min-h-[200px] group"
        >
          <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
            <Plus className="w-6 h-6 text-blue-400" />
          </div>
          <p className="text-white/60">Crear nuevo bolsillo</p>
        </button>
      </div>

      {/* Create Pocket Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[2000]">
          <div className="bg-[#12121a] rounded-2xl p-6 w-full max-w-md border border-white/10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-white text-xl font-bold">Crear Bolsillo</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-white/60" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-white/60 text-sm block mb-2">Nombre</label>
                <input
                  type="text"
                  value={newPocketName}
                  onChange={(e) => setNewPocketName(e.target.value)}
                  placeholder="Ej: Ahorro para vehículo"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50"
                />
              </div>

              <div>
                <label className="text-white/60 text-sm block mb-2">Icono</label>
                <div className="flex gap-2 flex-wrap">
                  {pocketIconOptions.map((iconOpt) => (
                    <button
                      key={iconOpt.id}
                      onClick={() => setNewPocketIcon(iconOpt.id)}
                      className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-110
                        ${newPocketIcon === iconOpt.id
                          ? 'bg-blue-600 ring-2 ring-blue-400 scale-110'
                          : 'bg-white/5 hover:bg-white/10'
                        }
                      `}
                      title={iconOpt.label}
                    >
                      <PocketIcon iconId={iconOpt.id} size={28} />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-white/60 text-sm block mb-2">Meta (opcional)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">$</span>
                  <input
                    type="number"
                    value={newPocketGoal}
                    onChange={(e) => setNewPocketGoal(e.target.value)}
                    placeholder="0"
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-8 pr-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreatePocket}
                disabled={!newPocketName}
                className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-medium transition-colors"
              >
                Crear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Move Money Modal */}
      {showMoveModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[2000]">
          <div className="bg-[#12121a] rounded-2xl p-6 w-full max-w-md border border-white/10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-white text-xl font-bold">
                {showMoveModal.type === 'add' ? 'Agregar al bolsillo' : 'Retirar del bolsillo'}
              </h2>
              <button
                onClick={() => setShowMoveModal(null)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-white/60" />
              </button>
            </div>

            <div className="mb-6">
              <label className="text-white/60 text-sm block mb-2">Monto</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 text-xl">$</span>
                <input
                  type="number"
                  value={moveAmount}
                  onChange={(e) => setMoveAmount(e.target.value)}
                  placeholder="0"
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-4 text-white text-2xl font-bold placeholder-white/20 focus:outline-none focus:border-blue-500/50"
                />
              </div>
              <p className="text-white/40 text-sm mt-2">
                {showMoveModal.type === 'add'
                  ? `Disponible: $${wallet.availableBalance.toLocaleString()}`
                  : `En bolsillo: $${wallet.pockets.find(p => p.id === showMoveModal.pocketId)?.balance.toLocaleString()}`
                }
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowMoveModal(null)}
                className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleMoveConfirm}
                disabled={!moveAmount || Number.parseFloat(moveAmount) <= 0}
                className={`flex-1 py-3 rounded-xl text-white font-medium transition-colors disabled:bg-gray-700 disabled:cursor-not-allowed
                  ${showMoveModal.type === 'add'
                    ? 'bg-green-600 hover:bg-green-500'
                    : 'bg-blue-600 hover:bg-blue-500'
                  }
                `}
              >
                {showMoveModal.type === 'add' ? 'Agregar' : 'Retirar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
