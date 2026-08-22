'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Home, Building2, Warehouse, MapPin, Ruler, X } from 'lucide-react';
import GiftPicker, { type GiftRecipient } from './shared/GiftPicker';
import { useToast } from '@/components/os/ui';

interface Listing {
  id: string;
  name: string;
  type: string;
  address: string;
  price: number;
  size: number;
  stock: number;
}

interface OwnedProperty {
  id: string;
  name: string;
  type: string;
  address: string;
  purchasedAt: string;
}

const TYPE_ICON: Record<string, any> = { Casa: Home, Apartamento: Building2, Oficina: Building2, Negocio: Building2, Garaje: Warehouse };
const TYPES = ['Todos', 'Casa', 'Apartamento', 'Oficina', 'Negocio', 'Garaje'];

export default function RealEstateApp() {
  const toast = useToast();
  const [listings, setListings] = useState<Listing[]>([]);
  const [mine, setMine] = useState<OwnedProperty[]>([]);
  const [view, setView] = useState<'catalog' | 'mine'>('catalog');
  const [type, setType] = useState('Todos');
  const [selected, setSelected] = useState<Listing | null>(null);
  const [buying, setBuying] = useState(false);
  const [giftTo, setGiftTo] = useState<GiftRecipient | null>(null);

  const loadListings = useCallback(async () => {
    const res = await fetch('/api/properties/listings', { cache: 'no-store' });
    const data = await res.json();
    if (data.success) setListings(data.listings);
  }, []);

  const loadMine = useCallback(async () => {
    const res = await fetch('/api/properties/mine', { cache: 'no-store' });
    const data = await res.json();
    if (data.success) setMine(data.properties);
  }, []);

  useEffect(() => { loadListings(); loadMine(); }, [loadListings, loadMine]);

  const buy = async () => {
    if (!selected) return;
    setBuying(true);
    try {
      const res = await fetch('/api/properties/buy', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ listingId: selected.id, giftToId: giftTo?.id }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(giftTo ? `¡${selected.name} enviada como regalo a ${giftTo.name}!` : `¡${selected.name} adquirida!`);
        setSelected(null);
        setGiftTo(null);
        await Promise.all([loadListings(), loadMine()]);
      } else {
        toast.error(data.error || 'No se pudo comprar');
      }
    } finally {
      setBuying(false);
    }
  };

  const filtered = listings.filter((l) => type === 'Todos' || l.type === type);

  return (
    <div className="relative h-full flex flex-col bg-[#0a0a0f]">
      <div className="bg-gradient-to-r from-cyan-900/40 to-[#131921] p-4 border-b border-white/10 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Home className="w-7 h-7 text-cyan-400" />
          <span className="text-white font-bold text-xl">Tienda de Propiedades</span>
        </div>
        <div className="ml-auto flex gap-2">
          <button onClick={() => setView('catalog')} className={`px-3 py-1.5 rounded-lg text-sm ${view === 'catalog' ? 'bg-cyan-600 text-white' : 'bg-white/5 text-white/60'}`}>Catálogo</button>
          <button onClick={() => setView('mine')} className={`px-3 py-1.5 rounded-lg text-sm ${view === 'mine' ? 'bg-cyan-600 text-white' : 'bg-white/5 text-white/60'}`}>Mis Propiedades ({mine.length})</button>
        </div>
      </div>

      {view === 'catalog' && (
        <div className="px-4 pt-3 flex gap-2 overflow-x-auto">
          {TYPES.map((t) => (
            <button key={t} onClick={() => setType(t)} className={`px-3 py-1 rounded-full text-xs whitespace-nowrap ${type === t ? 'bg-cyan-500 text-white' : 'bg-white/10 text-white/60'}`}>{t}</button>
          ))}
        </div>
      )}


      <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
        {view === 'catalog' ? (
          <div className="grid grid-cols-3 gap-4">
            {filtered.map((l) => {
              const Icon = TYPE_ICON[l.type] || Home;
              return (
                <button key={l.id} onClick={() => setSelected(l)} disabled={l.stock <= 0}
                  className="bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:border-cyan-500/50 transition-all text-left disabled:opacity-40">
                  <div className="h-28 bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center">
                    <Icon className="w-12 h-12 text-cyan-400" />
                  </div>
                  <div className="p-3">
                    <p className="text-white/40 text-xs">{l.type}</p>
                    <h3 className="text-white font-medium text-sm">{l.name}</h3>
                    <p className="text-white/40 text-xs flex items-center gap-1 mt-1"><MapPin className="w-3 h-3" /> {l.address}</p>
                    <p className="text-cyan-400 font-bold mt-2">${l.price.toLocaleString()}</p>
                    <p className="text-white/30 text-xs">{l.stock > 0 ? `${l.stock} disponibles` : 'Sin disponibilidad'}</p>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {mine.length === 0 && <p className="text-white/40 text-sm col-span-3">Todavía no tienes propiedades.</p>}
            {mine.map((p) => {
              const Icon = TYPE_ICON[p.type] || Home;
              return (
                <div key={p.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-cyan-600/20 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">{p.name}</p>
                    <p className="text-white/40 text-xs">{p.address}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selected && (
        <div className="absolute inset-0 bg-black/80 z-[2000] flex items-center justify-center p-4" onClick={() => { setSelected(null); setGiftTo(null); }}>
          <div className="bg-[#12121a] rounded-2xl w-full max-w-md p-5 border border-white/10" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-bold text-lg">{selected.name}</h2>
              <button onClick={() => setSelected(null)} className="text-white/40 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-2 mb-4 text-sm">
              <p className="flex items-center gap-2 text-white/60"><MapPin className="w-4 h-4 text-cyan-400" /> {selected.address}</p>
              <p className="flex items-center gap-2 text-white/60"><Ruler className="w-4 h-4 text-cyan-400" /> {selected.size} m²</p>
            </div>
            <p className="text-white text-3xl font-bold mb-4">${selected.price.toLocaleString()}</p>

            <GiftPicker giftTo={giftTo} onChange={setGiftTo} accent="cyan" className="mb-4" />

            <button onClick={buy} disabled={buying} className="w-full py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-semibold transition-colors">
              {buying ? 'Procesando...' : giftTo ? `Regalar a ${giftTo.name}` : 'Comprar propiedad'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
