'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Crosshair, Shield, Package, Search, X, IdCard, Weight } from 'lucide-react';
import GiftPicker, { type GiftRecipient } from './shared/GiftPicker';
import { useToast } from '@/components/os/ui';

interface AmmoItem {
  id: string;
  name: string;
  category: string;
  price: number;
  damage?: number;
  fireRate?: number;
  requiresLicense: boolean;
  stock: number;
}

interface OwnedWeapon {
  id: string;
  itemId: string;
  name: string;
  category: string;
  purchasedAt: string;
}

interface Capacity {
  used: number;
  max: number;
}

const CATEGORIES = ['Todos', 'Pistola', 'Rifle', 'Escopeta', 'Munición', 'Accesorio', 'Chaleco'];

export default function AmmuNationApp() {
  const toast = useToast();
  const [items, setItems] = useState<AmmoItem[]>([]);
  const [hasLicense, setHasLicense] = useState(false);
  const [myWeapons, setMyWeapons] = useState<OwnedWeapon[]>([]);
  const [capacity, setCapacity] = useState<Capacity | null>(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Todos');
  const [view, setView] = useState<'store' | 'inventory'>('store');
  const [buying, setBuying] = useState<string | null>(null);
  const [buyTarget, setBuyTarget] = useState<AmmoItem | null>(null);
  const [giftTo, setGiftTo] = useState<GiftRecipient | null>(null);

  const loadCatalog = useCallback(async () => {
    const res = await fetch('/api/ammunation/catalog', { cache: 'no-store' });
    const data = await res.json();
    if (data.success) { setItems(data.items); setHasLicense(data.hasLicense); }
  }, []);

  const loadMine = useCallback(async () => {
    const res = await fetch('/api/ammunation/mine', { cache: 'no-store' });
    const data = await res.json();
    if (data.success) { setMyWeapons(data.items); setCapacity(data.capacity); }
  }, []);

  useEffect(() => { loadCatalog(); loadMine(); }, [loadCatalog, loadMine]);

  const buyLicense = async () => {
    const res = await fetch('/api/ammunation/buy', { method: 'PATCH' });
    const data = await res.json();
    if (data.success) { toast.success('Licencia adquirida'); await loadCatalog(); }
    else toast.error(data.error || 'No se pudo comprar la licencia');
  };

  const buyItem = async () => {
    if (!buyTarget) return;
    const item = buyTarget;
    setBuying(item.id);
    try {
      const res = await fetch('/api/ammunation/buy', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ itemId: item.id, giftToId: giftTo?.id }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(giftTo ? `¡${item.name} enviado como regalo a ${giftTo.name}!` : `${item.name} comprado`);
        setBuyTarget(null);
        setGiftTo(null);
        await Promise.all([loadCatalog(), loadMine()]);
      } else toast.error(data.error || 'No se pudo comprar');
    } finally {
      setBuying(null);
    }
  };

  const filtered = items.filter((i) =>
    i.name.toLowerCase().includes(search.toLowerCase()) && (category === 'Todos' || i.category === category)
  );

  return (
    <div className="relative h-full flex flex-col bg-[#0a0a0f]">
      <div className="bg-gradient-to-r from-amber-900/40 to-[#131921] p-4 border-b border-white/10">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Crosshair className="w-7 h-7 text-amber-400" />
            <span className="text-white font-bold text-xl">Ammu-Nation</span>
          </div>
          <div className="flex-1 max-w-md relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar armas, munición, accesorios..."
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-amber-500/50" />
          </div>
          <div className="ml-auto flex gap-2">
            <button onClick={() => setView('store')} className={`px-3 py-1.5 rounded-lg text-sm ${view === 'store' ? 'bg-amber-600 text-white' : 'bg-white/5 text-white/60'}`}>Tienda</button>
            <button onClick={() => setView('inventory')} className={`px-3 py-1.5 rounded-lg text-sm ${view === 'inventory' ? 'bg-amber-600 text-white' : 'bg-white/5 text-white/60'}`}>Mi Arsenal ({myWeapons.length})</button>
          </div>
        </div>

        {view === 'store' && (
          <div className="flex items-center justify-between mt-3">
            <div className="flex gap-2 overflow-x-auto">
              {CATEGORIES.map((c) => (
                <button key={c} onClick={() => setCategory(c)} className={`px-3 py-1 rounded-full text-xs whitespace-nowrap ${category === c ? 'bg-amber-500 text-white' : 'bg-white/10 text-white/60'}`}>{c}</button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              {capacity && (
                <div className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg ${capacity.used >= capacity.max ? 'bg-red-500/20 text-red-400' : 'bg-white/5 text-white/60'}`}>
                  <Weight className="w-3.5 h-3.5" /> {capacity.used}/{capacity.max} kg
                </div>
              )}
              <div className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg ${hasLicense ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                <IdCard className="w-3.5 h-3.5" /> {hasLicense ? 'Licencia activa' : 'Sin licencia'}
                {!hasLicense && (
                  <button onClick={buyLicense} className="ml-2 underline hover:text-white">Comprar ($5,000)</button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
        {view === 'store' ? (
          <div className="grid grid-cols-3 gap-4">
            {filtered.map((item) => {
              const locked = item.requiresLicense && !hasLicense;
              return (
                <div key={item.id} className={`bg-white/5 border border-white/10 rounded-xl p-4 ${locked ? 'opacity-50' : ''}`}>
                  <div className="flex items-center justify-between mb-2">
                    <Crosshair className="w-8 h-8 text-amber-400" />
                    {item.requiresLicense && <Shield className="w-4 h-4 text-white/30" />}
                  </div>
                  <p className="text-white/40 text-xs">{item.category}</p>
                  <h3 className="text-white font-medium text-sm mb-1">{item.name}</h3>
                  {item.damage && <p className="text-white/50 text-xs">Daño: {item.damage} · Cadencia: {item.fireRate}</p>}
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-amber-400 font-bold">${item.price.toLocaleString()}</span>
                    <button
                      onClick={() => { setBuyTarget(item); setGiftTo(null); }}
                      disabled={locked || item.stock <= 0}
                      className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold transition-colors"
                    >
                      {item.stock <= 0 ? 'Sin stock' : locked ? 'Requiere licencia' : 'Comprar'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {myWeapons.length === 0 && <p className="text-white/40 text-sm col-span-3">Todavía no has comprado nada.</p>}
            {myWeapons.map((w) => (
              <div key={w.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-600/20 flex items-center justify-center">
                  <Crosshair className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-white text-sm font-medium">{w.name}</p>
                  <p className="text-white/40 text-xs">{w.category}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {buyTarget && (
        <div className="absolute inset-0 bg-black/60 z-[3000] flex items-center justify-center p-4" onClick={() => setBuyTarget(null)}>
          <div className="bg-[#0d0d14] border border-white/10 rounded-2xl w-full max-w-sm p-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-semibold text-sm">Confirmar compra</h3>
              <button onClick={() => setBuyTarget(null)} className="text-white/40 hover:text-white"><X className="w-4 h-4" /></button>
            </div>

            <div className="flex items-center gap-3 mb-4 p-3 rounded-xl bg-white/5 border border-white/10">
              <div className="w-10 h-10 rounded-lg bg-amber-600/20 flex items-center justify-center flex-shrink-0">
                <Crosshair className="w-5 h-5 text-amber-400" />
              </div>
              <div className="min-w-0">
                <p className="text-white text-sm font-medium truncate">{buyTarget.name}</p>
                <p className="text-amber-400 text-sm font-bold">${buyTarget.price.toLocaleString()}</p>
              </div>
            </div>

            <GiftPicker giftTo={giftTo} onChange={setGiftTo} accent="amber" className="mb-4" />

            <button
              onClick={buyItem}
              disabled={buying === buyTarget.id}
              className="w-full py-2.5 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-sm font-semibold transition-colors"
            >
              {buying === buyTarget.id ? 'Procesando...' : giftTo ? `Regalar a ${giftTo.name}` : 'Confirmar compra'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
