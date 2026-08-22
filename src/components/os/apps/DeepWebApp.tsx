'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  Search,
  ShoppingCart,
  Shield,
  ShieldOff,
  AlertTriangle,
  Skull,
  Lock,
  Clock,
  Bitcoin,
  X,
  Package,
  Activity,
  LogOut,
} from 'lucide-react';
import { ProductIcon, DeepWebLogoIcon } from '@/components/icons/AppIcons';
import GiftPicker, { type GiftRecipient } from './shared/GiftPicker';
import { useOS } from '@/contexts/OSContext';
import { useToast } from '@/components/os/ui';

interface DeepWebSessionState {
  exposure: number;
  tier: { id: 'low' | 'moderate' | 'high' | 'critical'; label: string };
  sessionActive: boolean;
  vpsProtected: boolean;
  securityLevel: number;
  vpsActive: boolean;
}

interface DeepWebRiskEvent {
  kind: 'detection' | 'compromised';
  message: string;
}

const TIER_COLOR: Record<string, string> = {
  low: 'text-green-400 bg-green-500/10 border-green-500/30',
  moderate: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
  high: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
  critical: 'text-red-400 bg-red-500/10 border-red-500/30',
};

const TIER_BAR: Record<string, string> = {
  low: 'bg-green-500', moderate: 'bg-yellow-500', high: 'bg-orange-500', critical: 'bg-red-500',
};

const ENTRY_STEPS = ['Estableciendo conexión...', 'Enrutando tráfico...', 'Verificando protección VPS...', 'Acceso concedido'];

interface DeepWebItem {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  risk: 'low' | 'medium' | 'high';
  vendor: string;
  escrow: boolean;
  stock: number;
}

interface OwnedItem {
  id: string;
  itemId: string;
  name: string;
  category: string;
  purchasedAt: string;
  giftedBy?: string;
}

const ICON_BY_CATEGORY: Record<string, string> = {
  Herramientas: 'lockpick',
  Tecnología: 'scanner',
  Documentos: 'document',
  Disfraces: 'mask',
  Defensa: 'spray',
  Software: 'hacking',
  Falsificación: 'fakemoney',
};

const categories = ['Todos', 'Herramientas', 'Tecnología', 'Documentos', 'Disfraces', 'Defensa', 'Software', 'Falsificación'];

export default function DeepWebApp() {
  const toast = useToast();
  const { setDeepWebSessionActive } = useOS();
  const [items, setItems] = useState<DeepWebItem[]>([]);
  const [owned, setOwned] = useState<OwnedItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [view, setView] = useState<'market' | 'owned'>('market');
  const [selectedProduct, setSelectedProduct] = useState<DeepWebItem | null>(null);
  const [giftTo, setGiftTo] = useState<GiftRecipient | null>(null);
  const [buying, setBuying] = useState(false);

  const [session, setSession] = useState<DeepWebSessionState | null>(null);
  const [sessionLoaded, setSessionLoaded] = useState(false);
  const [showWarning, setShowWarning] = useState(true);
  const [entering, setEntering] = useState(false);
  const [entryStep, setEntryStep] = useState<string | null>(null);
  const [confirmingExit, setConfirmingExit] = useState(false);
  const [alertEvents, setAlertEvents] = useState<DeepWebRiskEvent[]>([]);
  const [paymentCoin, setPaymentCoin] = useState<{ symbol: string; price: number } | null>(null);

  const loadCatalog = useCallback(async () => {
    const res = await fetch('/api/deepweb/catalog', { cache: 'no-store' });
    const data = await res.json();
    if (data.success) setItems(data.items);
  }, []);

  const loadPaymentCoin = useCallback(async () => {
    const res = await fetch('/api/crypto/coins', { cache: 'no-store' });
    const data = await res.json();
    if (data.success && data.coins.length > 0) {
      const coin = data.coins.find((c: any) => c.symbol === 'HBC') || data.coins[0];
      setPaymentCoin({ symbol: coin.symbol, price: coin.price });
    }
  }, []);

  const loadOwned = useCallback(async () => {
    const res = await fetch('/api/deepweb/mine', { cache: 'no-store' });
    const data = await res.json();
    if (data.success) setOwned(data.items);
  }, []);

  const loadSession = useCallback(async () => {
    const res = await fetch('/api/deepweb/session', { cache: 'no-store' });
    const data = await res.json();
    if (data.success) {
      setSession(data.state);
      if (data.state.sessionActive) setShowWarning(false);
    }
    setSessionLoaded(true);
  }, []);

  useEffect(() => { loadCatalog(); loadOwned(); loadSession(); loadPaymentCoin(); }, [loadCatalog, loadOwned, loadSession, loadPaymentCoin]);

  // Refresca el estado real de exposición/VPS cada 20s mientras la app está abierta.
  useEffect(() => {
    const interval = setInterval(loadSession, 20000);
    return () => clearInterval(interval);
  }, [loadSession]);

  const enterDeepWeb = async () => {
    setEntering(true);
    setEntryStep(ENTRY_STEPS[0]);
    const stepTimer = setInterval(() => {
      setEntryStep((prev) => {
        const idx = ENTRY_STEPS.indexOf(prev || '');
        return ENTRY_STEPS[Math.min(idx + 1, ENTRY_STEPS.length - 2)];
      });
    }, 450);
    try {
      const res = await fetch('/api/deepweb/session', { method: 'POST' });
      const data = await res.json();
      clearInterval(stepTimer);
      if (data.success) {
        setEntryStep(ENTRY_STEPS[ENTRY_STEPS.length - 1]);
        setSession(data.state);
        const events: DeepWebRiskEvent[] = data.events || [];
        const compromised = events.some((e) => e.kind === 'compromised');
        setTimeout(() => {
          setEntering(false);
          setEntryStep(null);
          if (compromised) {
            setAlertEvents(events);
          } else {
            setShowWarning(false);
            setDeepWebSessionActive(true);
            if (events.length > 0) setAlertEvents(events);
          }
        }, 500);
      } else {
        setEntering(false);
        setEntryStep(null);
        toast.error(data.error || 'No se pudo establecer la conexión');
      }
    } catch {
      setEntering(false);
      setEntryStep(null);
      toast.error('No se pudo establecer la conexión');
    }
  };

  const exitDeepWeb = async () => {
    setConfirmingExit(false);
    try {
      const res = await fetch('/api/deepweb/session', { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setSession(data.state);
        setDeepWebSessionActive(false);
        setShowWarning(true);
      } else {
        toast.error(data.error || 'No se pudo cerrar la sesión — intenta de nuevo');
      }
    } catch {
      toast.error('No se pudo conectar con el servidor — la sesión sigue activa');
    }
  };

  useEffect(() => {
    if (alertEvents.length === 0) return;
    const timer = setTimeout(() => setAlertEvents([]), 8000);
    return () => clearTimeout(timer);
  }, [alertEvents]);

  const buyItem = async () => {
    if (!selectedProduct) return;
    setBuying(true);
    try {
      const res = await fetch('/api/deepweb/buy', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId: selectedProduct.id, giftToId: giftTo?.id }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(giftTo ? `¡${selectedProduct.name} enviado como regalo a ${giftTo.name}!` : `${selectedProduct.name} adquirido`);
        setSelectedProduct(null);
        setGiftTo(null);
        await Promise.all([loadCatalog(), loadOwned()]);
      } else {
        toast.error(data.error || 'No se pudo completar la compra');
      }
    } finally {
      setBuying(false);
    }
  };

  const filteredProducts = items.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'Todos' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-400 bg-green-500/20';
      case 'medium': return 'text-yellow-400 bg-yellow-500/20';
      case 'high': return 'text-red-400 bg-red-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  const getRiskLabel = (risk: string) => {
    switch (risk) {
      case 'low': return 'Bajo';
      case 'medium': return 'Medio';
      case 'high': return 'Alto';
      default: return 'N/A';
    }
  };

  // Warning / connection gate — arranca una sesión real (exposición, VPS, eventos de riesgo).
  if (showWarning) {
    return (
      <div className="h-full flex items-center justify-center bg-[#0a0a0d] p-8">
        <div className="max-w-md text-center">
          <div className="w-14 h-14 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-5">
            <Skull className="w-7 h-7 text-red-500" />
          </div>
          <h2 className="text-white text-lg font-semibold mb-3 flex items-center justify-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            Advertencia
          </h2>
          <p className="text-white/50 text-sm mb-4 leading-relaxed">
            Estás a punto de acceder a la Deep Web del servidor.
            Las actividades realizadas aquí pueden tener consecuencias en el roleplay.
            Los artículos ilegales pueden resultar en persecución policial.
          </p>

          {sessionLoaded && session && (
            <div className={`mb-4 p-3 rounded-lg border text-xs flex items-center justify-center gap-2 ${session.vpsActive ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' : 'border-red-500/30 bg-red-500/10 text-red-300'}`}>
              {session.vpsActive ? <Shield className="w-4 h-4" /> : <ShieldOff className="w-4 h-4" />}
              {session.vpsActive
                ? `VPS activo — tu exposición subirá más lento (${session.securityLevel}% protección)`
                : 'Sin VPS activo — tu exposición subirá rápido y el riesgo de detección es alto'}
            </div>
          )}

          {alertEvents.length > 0 && (
            <div className="mb-4 space-y-2">
              {alertEvents.map((e, i) => (
                <div key={i} className={`p-3 rounded-lg border text-xs ${e.kind === 'compromised' ? 'border-red-500/30 bg-red-500/10 text-red-300' : 'border-yellow-500/30 bg-yellow-500/10 text-yellow-300'}`}>
                  {e.message}
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => setAlertEvents([])}
              className="flex-1 py-2.5 rounded-lg border border-white/10 text-white/70 hover:bg-white/5 transition-colors text-sm"
            >
              Salir
            </button>
            <button
              onClick={enterDeepWeb}
              disabled={entering}
              className="flex-1 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 disabled:opacity-60 text-white text-sm font-medium transition-colors"
            >
              {entering ? (entryStep || 'Conectando...') : 'Entrar'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[#0a0a0d] relative">
      {alertEvents.length > 0 && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[3000] space-y-2 w-full max-w-sm px-4">
          {alertEvents.map((e, i) => (
            <div key={i} className={`p-3 rounded-lg border text-xs shadow-xl ${e.kind === 'compromised' ? 'border-red-500/30 bg-[#111114] text-red-300' : 'border-yellow-500/30 bg-[#111114] text-yellow-300'}`}>
              {e.message}
            </div>
          ))}
        </div>
      )}

      {/* Header */}
      <div className="bg-[#0d0d10] p-4 border-b border-white/10">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <DeepWebLogoIcon size={28} />
            <span className="text-white/90 font-semibold text-base tracking-tight">Deep Web</span>
          </div>

          <div className="flex-1 max-w-xl">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar en el mercado..."
                className="w-full bg-white/5 border border-white/10 rounded-lg pl-11 pr-4 py-2 text-sm text-white/90 placeholder-white/30 focus:outline-none focus:border-red-500/40"
              />
            </div>
          </div>

          <button
            onClick={() => setView(view === 'market' ? 'owned' : 'market')}
            className="relative flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10 hover:bg-white/5 transition-colors text-sm"
          >
            {view === 'market' ? (
              <>
                <Package className="w-4 h-4 text-white/60" />
                <span className="text-white/70">Mis compras</span>
                {owned.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {owned.length}
                  </span>
                )}
              </>
            ) : (
              <>
                <ShoppingCart className="w-4 h-4 text-white/60" />
                <span className="text-white/70">Mercado</span>
              </>
            )}
          </button>

          <button
            onClick={() => setConfirmingExit(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10 text-white/60 hover:bg-white/5 transition-colors text-sm"
          >
            <LogOut className="w-3.5 h-3.5" /> Cerrar sesión
          </button>
        </div>

        {session && (
          <div className="flex items-center gap-4 mt-3">
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] ${session.vpsActive ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' : 'border-red-500/30 bg-red-500/10 text-red-300'}`}>
              {session.vpsActive ? <Shield className="w-3 h-3" /> : <ShieldOff className="w-3 h-3" />}
              {session.vpsActive ? `VPS activo (${session.securityLevel}%)` : 'Sin VPS'}
            </div>
            <div className="flex items-center gap-2 flex-1 max-w-xs">
              <Activity className={`w-3.5 h-3.5 ${TIER_COLOR[session.tier.id].split(' ')[0]}`} />
              <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div className={`h-full ${TIER_BAR[session.tier.id]} transition-all`} style={{ width: `${session.exposure}%` }} />
              </div>
              <span className={`text-[11px] px-1.5 py-0.5 rounded border ${TIER_COLOR[session.tier.id]}`}>
                {session.exposure}% · {session.tier.label}
              </span>
            </div>
          </div>
        )}

        {view === 'market' && (
          <div className="flex items-center gap-2 mt-3 overflow-x-auto pb-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors
                  ${selectedCategory === cat
                    ? 'bg-red-600 text-white'
                    : 'bg-white/5 text-white/50 hover:bg-white/10 border border-white/10'
                  }
                `}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Ticker */}
      <div className="bg-white/[0.03] border-b border-white/5 py-1 overflow-hidden">
        <div className="animate-marquee whitespace-nowrap">
          <span className="text-white/30 text-xs mx-4">
            <Shield className="w-3 h-3 inline mr-1" /> Escrow disponible en la mayoría de las transacciones
          </span>
          <span className="text-white/30 text-xs mx-4">
            <Bitcoin className="w-3 h-3 inline mr-1" /> Pagos procesados exclusivamente por Crypto Wallet
          </span>
          <span className="text-white/30 text-xs mx-4">
            <AlertTriangle className="w-3 h-3 inline mr-1" /> Toda transacción es final y no reembolsable
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
        {view === 'owned' ? (
          owned.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-white/20 gap-2">
              <Package className="w-10 h-10" />
              <p className="text-sm text-white/40">Todavía no has comprado nada.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {owned.map((o) => (
                <div key={o.id} className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-xl">
                  <div className="w-12 h-12 bg-white/5 rounded-lg flex items-center justify-center flex-shrink-0">
                    <ProductIcon iconId={ICON_BY_CATEGORY[o.category] || 'lockpick'} size={26} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-white/90 text-sm font-medium truncate">{o.name}</p>
                    <p className="text-white/40 text-xs">{o.category}</p>
                    {o.giftedBy && <p className="text-pink-400/70 text-[10px]">Regalo recibido</p>}
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:border-white/20 transition-colors cursor-pointer"
                onClick={() => { setSelectedProduct(product); setGiftTo(null); }}
              >
                <div className="flex">
                  <div className="w-28 h-28 bg-white/[0.03] flex items-center justify-center flex-shrink-0">
                    <ProductIcon iconId={ICON_BY_CATEGORY[product.category] || 'lockpick'} size={44} />
                  </div>

                  <div className="flex-1 p-3">
                    <div className="flex items-start justify-between mb-1">
                      <h3 className="text-white/90 font-medium text-sm">{product.name}</h3>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${getRiskColor(product.risk)}`}>
                        {getRiskLabel(product.risk)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-white/40 text-xs">{product.vendor}</span>
                      {product.escrow && <Shield className="w-3 h-3 text-green-500" />}
                    </div>

                    <div className="flex items-center justify-between">
                      <p className="text-white font-semibold tabular-nums">${product.price.toLocaleString('es-CO')}</p>
                      <span className="text-white/30 text-[11px]">{product.stock > 0 ? `${product.stock} disp.` : 'Sin stock'}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[2000] p-4">
          <div className="bg-[#111114] rounded-xl w-full max-w-lg border border-white/10 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <ProductIcon iconId={ICON_BY_CATEGORY[selectedProduct.category] || 'lockpick'} size={28} />
                <span className={`text-xs px-2 py-0.5 rounded font-semibold ${getRiskColor(selectedProduct.risk)}`}>
                  Riesgo {getRiskLabel(selectedProduct.risk)}
                </span>
              </div>
              <button
                onClick={() => setSelectedProduct(null)}
                className="p-2 hover:bg-white/5 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-white/50" />
              </button>
            </div>

            <div className="p-4">
              <h2 className="text-white text-lg font-semibold mb-1">{selectedProduct.name}</h2>
              <p className="text-white/50 text-sm mb-4">{selectedProduct.description}</p>

              <div className="p-3 bg-white/5 rounded-lg border border-white/10 mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-white/90 text-sm">{selectedProduct.vendor}</span>
                      {selectedProduct.escrow && <Shield className="w-4 h-4 text-green-500" />}
                    </div>
                    <span className="text-white/40 text-xs">Vendedor de la Deep Web</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-white text-xl font-semibold tabular-nums">${selectedProduct.price.toLocaleString('es-CO')}</p>
                  {paymentCoin && (
                    <p className="text-white/40 text-xs mt-0.5">≈ {(selectedProduct.price / paymentCoin.price).toFixed(4)} {paymentCoin.symbol}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-white/40 text-xs">Stock disponible</p>
                  <p className="text-white/80 text-sm">{selectedProduct.stock} unidades</p>
                </div>
              </div>

              <div className="space-y-2 mb-4 text-sm">
                {selectedProduct.escrow && (
                  <div className="flex items-center gap-2 text-green-400">
                    <Lock className="w-4 h-4" />
                    Escrow disponible - Pago seguro
                  </div>
                )}
                <div className="flex items-center gap-2 text-white/50">
                  <Clock className="w-4 h-4" />
                  Entrega inmediata
                </div>
              </div>

              <GiftPicker giftTo={giftTo} onChange={setGiftTo} accent="red" className="mb-4" />

              <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg mb-4 flex gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                <p className="text-yellow-500/80 text-xs">
                  Esta transacción es final y no reembolsable. Usa con precaución.
                </p>
              </div>

              <button
                onClick={buyItem}
                disabled={buying || selectedProduct.stock <= 0}
                className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <Bitcoin className="w-4 h-4" />
                {buying ? 'Procesando...' : selectedProduct.stock <= 0 ? 'Sin stock' : giftTo ? `Regalar a ${giftTo.name}` : 'Pagar con Crypto Wallet'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmación de cierre de sesión (modo aislado) */}
      {confirmingExit && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[2500] p-4">
          <div className="bg-[#111114] rounded-xl w-full max-w-sm border border-white/10 p-5 text-center">
            <LogOut className="w-7 h-7 text-white/50 mx-auto mb-3" />
            <h3 className="text-white font-semibold mb-1.5">¿Cerrar sesión de Deep Web?</h3>
            <p className="text-white/40 text-xs mb-5">Se restaurará el acceso a HubPay, MercadoLibre, HubChat, HubSocial y Casino.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmingExit(false)}
                className="flex-1 py-2.5 rounded-lg border border-white/10 text-white/70 hover:bg-white/5 transition-colors text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={exitDeepWeb}
                className="flex-1 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-medium transition-colors"
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
      `}</style>
    </div>
  );
}
