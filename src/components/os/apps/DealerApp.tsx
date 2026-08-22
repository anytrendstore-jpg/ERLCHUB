'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Car, Gauge, Zap, Package, CreditCard, X, ShieldCheck, Tag,
  HeartHandshake, Headphones, Star, Search,
} from 'lucide-react';
import GiftPicker, { type GiftRecipient } from './shared/GiftPicker';
import { useToast } from '@/components/os/ui';

interface Vehicle {
  id: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  imageUrl: string;
  featured?: boolean;
  topSpeed: number;
  acceleration: number;
  stock: number;
}

interface OwnedVehicle {
  id: string;
  vehicleId: string;
  name: string;
  brand: string;
  imageUrl?: string;
  plate: string;
  color: string;
  financed: boolean;
  loanRemaining?: number;
  purchasedAt: string;
}

const FEATURES = [
  { icon: ShieldCheck, title: 'Garantía de Calidad', text: 'Cada vehículo es inspeccionado a fondo para tu tranquilidad.' },
  { icon: Tag, title: 'Mejores Precios', text: 'Precios competitivos y ofertas exclusivas que no encontrarás en otro lado.' },
  { icon: HeartHandshake, title: 'Financiamiento Fácil', text: 'Opciones de financiamiento flexibles ajustadas a tu presupuesto.' },
  { icon: Headphones, title: 'Soporte Experto', text: 'Nuestro equipo te guía en cada paso del proceso.' },
];

export default function DealerApp() {
  const toast = useToast();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [myVehicles, setMyVehicles] = useState<OwnedVehicle[]>([]);
  const [view, setView] = useState<'catalog' | 'garage'>('catalog');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Vehicle | null>(null);
  const [buying, setBuying] = useState(false);
  const [giftTo, setGiftTo] = useState<GiftRecipient | null>(null);

  const loadVehicles = useCallback(async () => {
    const res = await fetch('/api/dealer/vehicles', { cache: 'no-store' });
    const data = await res.json();
    if (data.success) setVehicles(data.vehicles);
  }, []);

  const loadMine = useCallback(async () => {
    const res = await fetch('/api/dealer/mine', { cache: 'no-store' });
    const data = await res.json();
    if (data.success) setMyVehicles(data.vehicles);
  }, []);

  useEffect(() => { loadVehicles(); loadMine(); }, [loadVehicles, loadMine]);

  const buy = async (financed: boolean) => {
    if (!selected) return;
    setBuying(true);
    try {
      const res = await fetch('/api/dealer/buy', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vehicleId: selected.id, financed, giftToId: giftTo?.id }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(giftTo ? `¡${selected.name} enviado como regalo a ${giftTo.name}!` : `¡${selected.name} comprado!`);
        setSelected(null);
        setGiftTo(null);
        await Promise.all([loadVehicles(), loadMine()]);
      } else {
        toast.error(data.error || 'No se pudo comprar');
      }
    } finally {
      setBuying(false);
    }
  };

  const categories = useMemo(() => {
    const map = new Map<string, { category: string; imageUrl: string; count: number }>();
    for (const v of vehicles) {
      const existing = map.get(v.category);
      if (existing) existing.count += 1;
      else map.set(v.category, { category: v.category, imageUrl: v.imageUrl, count: 1 });
    }
    return Array.from(map.values());
  }, [vehicles]);

  const totalStock = useMemo(() => vehicles.reduce((sum, v) => sum + v.stock, 0), [vehicles]);
  const featuredVehicles = useMemo(() => vehicles.filter((v) => v.featured), [vehicles]);

  const filteredVehicles = useMemo(() => {
    return vehicles.filter((v) => {
      if (categoryFilter && v.category !== categoryFilter) return false;
      if (search.trim() && !`${v.name} ${v.brand}`.toLowerCase().includes(search.trim().toLowerCase())) return false;
      return true;
    });
  }, [vehicles, categoryFilter, search]);

  return (
    <div className="relative h-full flex flex-col bg-[#0a0a0f]">
      {/* Header estilo AutoX: logo, nav de vistas, buscador */}
      <div className="bg-[#0d0d14] border-b border-white/10 px-4 sm:px-6 py-3 flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-1.5">
          <span className="text-white font-black text-xl tracking-tight">MOTORS</span>
          <span className="text-red-500 font-black text-xl">X</span>
        </div>
        <div className="flex items-center gap-1 ml-2">
          <button
            onClick={() => setView('catalog')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${view === 'catalog' ? 'bg-red-600 text-white' : 'text-white/50 hover:text-white hover:bg-white/5'}`}
          >
            Catálogo
          </button>
          <button
            onClick={() => setView('garage')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${view === 'garage' ? 'bg-red-600 text-white' : 'text-white/50 hover:text-white hover:bg-white/5'}`}
          >
            Mi Garaje ({myVehicles.length})
          </button>
        </div>
        {view === 'catalog' && (
          <div className="relative ml-auto w-full sm:w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
            <input
              value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar modelo o marca..."
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-red-500/50"
            />
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {view === 'catalog' ? (
          <>
            {/* Hero */}
            <div className="relative overflow-hidden border-b border-white/10">
              <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0f] via-[#0a0a0f]/90 to-transparent z-10" />
              {featuredVehicles[0] && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={featuredVehicles[0].imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover opacity-50" />
              )}
              <div className="relative z-20 px-4 sm:px-8 py-8 sm:py-12 max-w-lg">
                <p className="text-red-500 text-xs font-bold tracking-widest uppercase mb-2">Maneja el futuro</p>
                <h1 className="text-white font-black text-3xl sm:text-4xl leading-tight mb-3">
                  RENDIMIENTO.<br />LUJO.<br />EXCELENCIA<span className="text-red-500">.</span>
                </h1>
                <p className="text-white/50 text-sm mb-5 max-w-sm">
                  Descubre vehículos premium que combinan potencia, elegancia y la mejor tecnología del servidor.
                </p>
                <div className="flex items-center gap-3">
                  <button onClick={() => document.getElementById('dealer-catalog-grid')?.scrollIntoView({ behavior: 'smooth' })} className="px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-bold transition-colors">
                    Ver Catálogo
                  </button>
                  <button onClick={() => setView('garage')} className="px-4 py-2.5 rounded-lg border border-white/20 hover:bg-white/10 text-white text-sm font-bold transition-colors">
                    Mi Garaje
                  </button>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-white/10 border-b border-white/10 bg-[#0d0d14]">
              {[
                { label: 'Vehículos en stock', value: `${totalStock}+` },
                { label: 'Modelos disponibles', value: `${vehicles.length}` },
                { label: 'Categorías', value: `${categories.length}` },
                { label: 'Satisfacción', value: '100%' },
              ].map((s) => (
                <div key={s.label} className="px-3 py-4 text-center">
                  <p className="text-white font-black text-lg sm:text-xl">{s.value}</p>
                  <p className="text-white/40 text-[10px] sm:text-xs mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Shop by category */}
            {categories.length > 0 && (
              <div className="px-4 sm:px-6 py-6 border-b border-white/5">
                <div className="text-center mb-4">
                  <h2 className="text-white font-black text-lg">Compra por <span className="text-red-500">Categoría</span></h2>
                  <p className="text-white/40 text-xs mt-0.5">Encuentra el vehículo perfecto para tu estilo</p>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-1 custom-scrollbar">
                  {categoryFilter && (
                    <button onClick={() => setCategoryFilter(null)} className="flex-shrink-0 w-24 flex flex-col items-center justify-center gap-1 rounded-xl border border-red-500/40 bg-red-500/10 text-red-300 text-xs font-medium">
                      <X className="w-4 h-4" /> Ver todo
                    </button>
                  )}
                  {categories.map((c) => (
                    <button
                      key={c.category}
                      onClick={() => setCategoryFilter(c.category === categoryFilter ? null : c.category)}
                      className={`flex-shrink-0 w-28 rounded-xl overflow-hidden border transition-all text-left ${categoryFilter === c.category ? 'border-red-500' : 'border-white/10 hover:border-white/30'}`}
                    >
                      <div className="h-16 bg-white/5">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={c.imageUrl} alt={c.category} className="w-full h-full object-cover" />
                      </div>
                      <div className="px-2 py-1.5 bg-[#0d0d14]">
                        <p className="text-white text-xs font-semibold truncate">{c.category}</p>
                        <p className="text-white/40 text-[10px]">{c.count} modelos</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Why choose us */}
            <div className="px-4 sm:px-6 py-6 border-b border-white/5 bg-[#0d0d14]">
              <h2 className="text-white font-black text-lg mb-4">Por qué <span className="text-red-500">elegirnos</span></h2>
              <div className="grid grid-cols-2 gap-4">
                {FEATURES.map((f) => (
                  <div key={f.title} className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center flex-shrink-0">
                      <f.icon className="w-4 h-4 text-red-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-white text-xs font-semibold">{f.title}</p>
                      <p className="text-white/40 text-[11px] leading-snug mt-0.5">{f.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Catalog grid */}
            <div id="dealer-catalog-grid" className="px-4 sm:px-6 py-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-white font-black text-lg">
                  {categoryFilter ? categoryFilter : 'Vehículos'} <span className="text-red-500">Destacados</span>
                </h2>
                <span className="text-white/30 text-xs">{filteredVehicles.length} resultados</span>
              </div>

              {filteredVehicles.length === 0 ? (
                <p className="text-white/40 text-sm text-center py-10">No hay vehículos que coincidan con tu búsqueda.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {filteredVehicles.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => setSelected(v)}
                      disabled={v.stock <= 0}
                      className="bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:border-red-500/50 transition-all text-left disabled:opacity-40 group"
                    >
                      <div className="h-28 sm:h-32 bg-white/5 relative overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={v.imageUrl} alt={v.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        {v.featured && (
                          <span className="absolute top-1.5 left-1.5 flex items-center gap-1 bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                            <Star className="w-2.5 h-2.5 fill-white" /> Destacado
                          </span>
                        )}
                        {v.stock <= 0 && (
                          <span className="absolute inset-0 bg-black/70 flex items-center justify-center text-white text-xs font-bold">Sin stock</span>
                        )}
                      </div>
                      <div className="p-3">
                        <p className="text-white/40 text-[10px]">{v.brand} · {v.category}</p>
                        <h3 className="text-white font-semibold text-sm mb-1 truncate">{v.name}</h3>
                        <div className="flex items-center gap-2 text-white/30 text-[10px] mb-1.5">
                          <span className="flex items-center gap-0.5"><Gauge className="w-3 h-3" /> {v.topSpeed}km/h</span>
                        </div>
                        <p className="text-red-400 font-bold text-sm">${v.price.toLocaleString()}</p>
                        <p className="text-white/30 text-[10px] mt-0.5">{v.stock > 0 ? `${v.stock} disponibles` : 'Sin stock'}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="p-4 sm:p-6">
            <h2 className="text-white font-black text-lg mb-4">Mi <span className="text-red-500">Garaje</span></h2>
            {myVehicles.length === 0 ? (
              <p className="text-white/40 text-sm">Todavía no tienes vehículos. Visita el catálogo.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {myVehicles.map((v) => (
                  <div key={v.id} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                    <div className="h-28 bg-white/5 flex items-center justify-center">
                      {v.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={v.imageUrl} alt={v.name} className="w-full h-full object-cover" />
                      ) : (
                        <Car className="w-10 h-10 text-white/20" />
                      )}
                    </div>
                    <div className="p-3">
                      <h3 className="text-white font-semibold text-sm">{v.name}</h3>
                      <p className="text-white/40 text-xs">{v.brand} · Placa {v.plate}</p>
                      {v.financed && v.loanRemaining ? (
                        <p className="text-amber-400 text-xs mt-1">Financiado · Resta ${v.loanRemaining.toLocaleString()}</p>
                      ) : (
                        <p className="text-emerald-400 text-xs mt-1">Pagado en su totalidad</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {selected && (
        <div className="absolute inset-0 bg-black/80 z-[2000] flex items-center justify-center p-4" onClick={() => { setSelected(null); setGiftTo(null); }}>
          <div className="bg-[#12121a] rounded-2xl w-full max-w-md overflow-hidden border border-white/10" onClick={(e) => e.stopPropagation()}>
            <div className="relative h-40">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={selected.imageUrl} alt={selected.name} className="w-full h-full object-cover" />
              <button onClick={() => setSelected(null)} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4">
                <p className="text-white/60 text-xs">{selected.brand} · {selected.category}</p>
                <h2 className="text-white font-bold text-lg">{selected.name}</h2>
              </div>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-3 gap-3 mb-4 text-xs">
                <div className="flex flex-col items-center gap-1 text-white/60 bg-white/5 rounded-lg py-2">
                  <Gauge className="w-4 h-4 text-red-400" /> {selected.topSpeed} km/h
                </div>
                <div className="flex flex-col items-center gap-1 text-white/60 bg-white/5 rounded-lg py-2">
                  <Zap className="w-4 h-4 text-amber-400" /> {selected.acceleration}s
                </div>
                <div className="flex flex-col items-center gap-1 text-white/60 bg-white/5 rounded-lg py-2">
                  <Package className="w-4 h-4 text-blue-400" /> {selected.stock} stock
                </div>
              </div>
              <p className="text-white text-3xl font-bold mb-4">${selected.price.toLocaleString()}</p>

              <GiftPicker giftTo={giftTo} onChange={setGiftTo} accent="red" className="mb-4" />

              <div className="space-y-2">
                <button onClick={() => buy(false)} disabled={buying} className="w-full py-2.5 rounded-lg bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-semibold transition-colors">
                  {giftTo ? `Regalar a ${giftTo.name} de contado` : 'Comprar de contado'}
                </button>
                {!giftTo && (
                  <button onClick={() => buy(true)} disabled={buying} className="w-full py-2.5 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-50 text-white font-semibold transition-colors flex items-center justify-center gap-2">
                    <CreditCard className="w-4 h-4" /> Financiar (20% de enganche: ${Math.round(selected.price * 0.2).toLocaleString()})
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
