'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  Search,
  ShoppingCart,
  Star,
  Heart,
  Package,
  Truck,
  Shield,
  ChevronDown,
  Plus,
  Minus,
  X,
  Grid,
  List,
  MapPin,
  User,
  MessageCircle,
  Pause,
  Play,
  Camera,
  CreditCard,
  Snowflake,
} from 'lucide-react';
import { ProductIcon, AmazonLogoIcon } from '@/components/icons/AppIcons';
import { useOS } from '@/contexts/OSContext';
import GiftPicker, { type GiftRecipient } from './shared/GiftPicker';
import { useToast } from '@/components/os/ui';

interface Listing {
  id: string;
  sellerId: string;
  sellerUsername: string;
  official: boolean;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  iconId: string;
  images?: string[];
  category: string;
  stock: number;
  status: 'active' | 'paused' | 'removed';
  rating: number;
  reviews: number;
  createdAt: string;
}

interface CartItem extends Listing {
  quantity: number;
}

interface PaymentCard {
  id: string;
  lastFourDigits: string;
  cardHolder: string;
  expiryDate: string;
  status: 'active' | 'frozen' | 'cancelled';
  color: 'blue' | 'black' | 'gradient';
  type: 'debit' | 'credit';
}

interface HistoryEntry {
  id: string;
  listingName: string;
  price: number;
  quantity: number;
  total: number;
  createdAt: string;
  buyerUsername: string;
  sellerUsername: string;
}

function cop(n: number) {
  return n.toLocaleString('es-CO', { maximumFractionDigits: 0 });
}

function installment(price: number) {
  const n = 3;
  return { n, value: Math.round(price / n) };
}

const MAX_PRODUCT_IMAGES = 6;

/** Redimensiona y comprime la foto en el navegador antes de subirla (evita documentos gigantes en Mongo). */
function fileToCompressedDataUrl(file: File, maxDim = 900, quality = 0.75): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('No se pudo leer el archivo'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Archivo de imagen inválido'));
      img.onload = () => {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) { reject(new Error('Canvas no disponible')); return; }
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

function ProductThumb({ listing, size, className = '' }: { listing: { iconId: string; images?: string[] }; size: number; className?: string }) {
  const photo = listing.images?.[0];
  if (photo) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={photo} alt="" className={`object-contain ${className}`} style={{ width: size, height: size }} />;
  }
  return <ProductIcon iconId={listing.iconId} size={size} />;
}

function ProductGallery({ listing }: { listing: { iconId: string; images?: string[] } }) {
  const images = listing.images || [];
  const [active, setActive] = useState(0);

  return (
    <div className="w-1/2 bg-white flex flex-col items-center justify-center p-6 border-r border-[#E6E6E6]">
      <div className="flex-1 flex items-center justify-center w-full">
        {images.length > 0 ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={images[active]} alt="" className="max-w-full max-h-72 object-contain" />
        ) : (
          <ProductIcon iconId={listing.iconId} size={140} />
        )}
      </div>
      {images.length > 1 && (
        <div className="flex gap-2 mt-4 flex-wrap justify-center">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`w-14 h-14 rounded-md border-2 overflow-hidden flex-shrink-0 ${i === active ? 'border-[#3483FA]' : 'border-[#E6E6E6]'}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AmazonApp() {
  const toast = useToast();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Listing | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [view, setView] = useState<'catalog' | 'mine' | 'history'>('catalog');
  const [myListings, setMyListings] = useState<Listing[]>([]);
  const [history, setHistory] = useState<{ purchases: HistoryEntry[]; sales: HistoryEntry[] }>({ purchases: [], sales: [] });
  const [showPublish, setShowPublish] = useState(false);
  const [publishForm, setPublishForm] = useState<{ name: string; description: string; price: string; category: string; iconId: string; stock: string; images: string[] }>({ name: '', description: '', price: '', category: '', iconId: 'tools', stock: '1', images: [] });
  const [uploadingImages, setUploadingImages] = useState(false);
  const [buying, setBuying] = useState(false);
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const [sortBy, setSortBy] = useState<'relevance' | 'price_asc' | 'price_desc' | 'recent' | 'rating'>('relevance');
  const [maxPrice, setMaxPrice] = useState('');
  const [commissionPct, setCommissionPct] = useState(0);
  const [cards, setCards] = useState<PaymentCard[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [giftTo, setGiftTo] = useState<GiftRecipient | null>(null);
  const { openApp } = useOS();

  useEffect(() => {
    fetch('/api/marketplace/commission', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => { if (d.success) setCommissionPct(d.percentage); });
  }, []);

  const loadCards = useCallback(async () => {
    const res = await fetch('/api/hubpay/wallet', { cache: 'no-store' });
    const data = await res.json();
    if (data.success) {
      const list: PaymentCard[] = data.wallet.cards || [];
      setCards(list);
      setSelectedCardId((prev) => {
        if (prev && list.some((c) => c.id === prev && c.status === 'active')) return prev;
        return list.find((c) => c.status === 'active')?.id || null;
      });
    }
  }, []);

  useEffect(() => { if (showCart) loadCards(); }, [showCart, loadCards]);

  const loadListings = useCallback(async () => {
    const res = await fetch('/api/marketplace/listings', { cache: 'no-store' });
    const data = await res.json();
    if (data.success) setListings(data.listings);
    setLoading(false);
  }, []);

  useEffect(() => { loadListings(); }, [loadListings]);

  useEffect(() => {
    fetch('/api/marketplace/favorite', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => { if (d.success) setFavorites(new Set(d.listingIds)); });
  }, []);

  const loadMine = useCallback(async () => {
    const res = await fetch('/api/marketplace/listings?mine=1', { cache: 'no-store' });
    const data = await res.json();
    if (data.success) setMyListings(data.listings);
  }, []);

  const loadHistory = useCallback(async () => {
    const res = await fetch('/api/marketplace/history', { cache: 'no-store' });
    const data = await res.json();
    if (data.success) setHistory({ purchases: data.purchases, sales: data.sales });
  }, []);

  useEffect(() => {
    if (view === 'mine') loadMine();
    if (view === 'history') loadHistory();
  }, [view, loadMine, loadHistory]);

  const categories = ['Todos', ...Array.from(new Set(listings.map((l) => l.category)))];

  const searchSuggestions = searchTerm.trim().length > 0
    ? listings.filter((p) => p.name.toLowerCase().includes(searchTerm.toLowerCase())).slice(0, 6)
    : [];

  const filteredProducts = listings
    .filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            p.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'Todos' || p.category === selectedCategory;
      const matchesPrice = !maxPrice || p.price <= Number(maxPrice);
      return matchesSearch && matchesCategory && matchesPrice;
    })
    .sort((a, b) => {
      if (sortBy === 'price_asc') return a.price - b.price;
      if (sortBy === 'price_desc') return b.price - a.price;
      if (sortBy === 'recent') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortBy === 'rating') return b.rating - a.rating;
      return 0;
    });

  const addToCart = (product: Listing) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => setCart(prev => prev.filter(item => item.id !== productId));

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === productId) {
        const newQuantity = item.quantity + delta;
        if (newQuantity <= 0) return item;
        return { ...item, quantity: newQuantity };
      }
      return item;
    }));
  };

  const cartTotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const toggleFavorite = async (listingId: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(listingId)) next.delete(listingId); else next.add(listingId);
      return next;
    });
    await fetch('/api/marketplace/favorite', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ listingId }),
    });
  };

  const checkout = async () => {
    if (cart.length === 0) return;
    if (!selectedCardId) { toast.error('Selecciona una tarjeta para pagar'); return; }
    setBuying(true);
    let okCount = 0;
    for (const item of cart) {
      const res = await fetch('/api/marketplace/buy', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ listingId: item.id, quantity: item.quantity, cardId: selectedCardId, giftToId: giftTo?.id }),
      });
      const data = await res.json();
      if (data.success) okCount++;
      else { toast.error(data.error || 'Error en la compra'); break; }
    }
    setBuying(false);
    if (okCount === cart.length) {
      toast.success(giftTo ? `¡Regalo enviado a ${giftTo.name}!` : '¡Compra realizada con éxito!');
      setCart([]);
      setShowCart(false);
      setGiftTo(null);
      await loadListings();
    }
  };

  const publish = async () => {
    if (!publishForm.name.trim() || !publishForm.price) return;
    const res = await fetch('/api/marketplace/listings', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...publishForm, price: Number(publishForm.price), stock: Number(publishForm.stock) }),
    });
    const data = await res.json();
    if (data.success) {
      setShowPublish(false);
      setPublishForm({ name: '', description: '', price: '', category: '', iconId: 'tools', stock: '1', images: [] });
      await loadListings();
      toast.success('Artículo publicado');
    }
  };

  const handleImageSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploadingImages(true);
    try {
      const room = MAX_PRODUCT_IMAGES - publishForm.images.length;
      const picked = Array.from(files).slice(0, Math.max(0, room));
      const compressed = await Promise.all(picked.map((f) => fileToCompressedDataUrl(f)));
      setPublishForm((f) => ({ ...f, images: [...f.images, ...compressed] }));
    } catch {
      toast.error('No se pudo procesar alguna imagen');
    } finally {
      setUploadingImages(false);
    }
  };

  const removeListing = async (listingId: string) => {
    await fetch('/api/marketplace/listings', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ listingId, action: 'remove' }),
    });
    await loadMine();
  };

  const setListingStatus = async (listingId: string, action: 'pause' | 'reactivate') => {
    await fetch('/api/marketplace/listings', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ listingId, action }),
    });
    await loadMine();
  };

  const contactSeller = async (product: Listing) => {
    const res = await fetch('/api/chat/conversations', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ participantIds: [product.sellerId] }),
    });
    const data = await res.json();
    if (data.success) {
      sessionStorage.setItem('hubchat_open_conversation', data.conversation.id);
      setSelectedProduct(null);
      openApp('hubchat');
    } else {
      toast.error(data.error || 'No se pudo contactar al vendedor');
    }
  };

  return (
    <div className="relative h-full flex flex-col bg-[#EBEBEB] font-sans">
      {/* Top thin utility bar */}
      <div className="hidden sm:flex items-center justify-end gap-4 bg-white px-6 py-1 text-[11px] text-[#666] border-b border-[#00000010]">
        <button onClick={() => setShowPublish(true)} className="hover:text-[#3483FA] transition-colors">Vender</button>
        <span className="text-[#ccc]">|</span>
        <button onClick={() => setView('mine')} className="hover:text-[#3483FA] transition-colors">Mis publicaciones</button>
        <span className="text-[#ccc]">|</span>
        <button onClick={() => setView('history')} className="hover:text-[#3483FA] transition-colors">Mis compras</button>
        <span className="text-[#ccc]">|</span>
        <span className="flex items-center gap-1"><User className="w-3 h-3" /> Mi cuenta</span>
      </div>

      {/* Yellow header */}
      <div className="bg-[#FFE600] px-6 py-2.5">
        <div className="flex items-center gap-4">
          <button onClick={() => setView('catalog')} className="flex items-center gap-1.5 flex-shrink-0 group">
            <div className="transition-transform duration-200 group-hover:scale-105">
              <AmazonLogoIcon size={30} />
            </div>
            <span className="text-[#2D3277] font-black text-xl tracking-tight leading-none">mercado<span className="font-black">libre</span></span>
          </button>

          <div className="flex-1 max-w-3xl relative">
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setView('catalog'); }}
                placeholder="Buscar productos, marcas y más..."
                className="w-full bg-white rounded-sm pl-4 pr-12 py-2.5 text-sm text-[#333] placeholder-[#999] focus:outline-none shadow-sm"
              />
              <button className="absolute right-0 top-0 h-full w-11 flex items-center justify-center text-[#666] hover:text-[#3483FA] transition-colors">
                <Search className="w-5 h-5" />
              </button>
            </div>
            {view === 'catalog' && searchSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-white rounded-b-sm shadow-lg z-50 overflow-hidden">
                {searchSuggestions.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedProduct(s)}
                    className="w-full text-left px-4 py-2 text-sm text-[#333] hover:bg-[#F5F5F5] flex items-center gap-2 border-b border-[#F0F0F0] last:border-0"
                  >
                    <Search className="w-3.5 h-3.5 text-[#999]" />
                    {s.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="hidden md:flex items-center gap-1.5 text-[#2D3277] text-xs font-medium flex-shrink-0">
            <MapPin className="w-4 h-4" />
            <span>Colombia</span>
          </div>

          <button
            onClick={() => setShowCart(true)}
            className="relative flex items-center justify-center p-2 rounded-full hover:bg-black/5 transition-colors flex-shrink-0"
          >
            <ShoppingCart className="w-6 h-6 text-[#2D3277]" />
            {cartCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-[#3483FA] text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Category bar */}
      {view === 'catalog' && (
        <div className="bg-white border-b border-[#E6E6E6] px-6 py-2 flex items-center gap-5 overflow-x-auto text-[13px] text-[#666]">
          <button
            onClick={() => setShowCategoryMenu((v) => !v)}
            className="flex items-center gap-1 font-semibold text-[#333] flex-shrink-0 hover:text-[#3483FA] transition-colors"
          >
            Categorías <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showCategoryMenu ? 'rotate-180' : ''}`} />
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`flex-shrink-0 whitespace-nowrap pb-1 border-b-2 transition-colors ${
                selectedCategory === cat ? 'border-[#3483FA] text-[#3483FA] font-semibold' : 'border-transparent hover:text-[#333]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}


      {/* Main Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="max-w-6xl mx-auto p-4">
          {view === 'mine' && (
            <div>
              <button onClick={() => setView('catalog')} className="text-[#3483FA] hover:underline text-sm mb-4">&larr; Volver al catálogo</button>
              <h2 className="text-[#333] text-lg font-bold mb-3">Mis publicaciones</h2>
              {myListings.length === 0 ? (
                <p className="text-[#999] text-sm">Todavía no has publicado nada.</p>
              ) : (
                <div className="grid grid-cols-4 gap-3">
                  {myListings.map((l) => (
                    <div key={l.id} className={`bg-white border border-[#E6E6E6] rounded-md p-3 ${l.status === 'removed' ? 'opacity-40' : ''}`}>
                      <div className="flex items-center justify-between mb-2">
                        <ProductThumb listing={l} size={32} />
                        {l.status !== 'removed' && (
                          <button onClick={() => removeListing(l.id)} className="text-[#999] hover:text-red-500"><X className="w-4 h-4" /></button>
                        )}
                      </div>
                      <p className="text-[#333] text-sm font-medium line-clamp-2">{l.name}</p>
                      <p className="text-[#333] font-semibold text-lg">$ {cop(l.price)}</p>
                      <p className="text-[#999] text-xs mb-2">
                        Stock: {l.stock} {l.stock <= 0 && l.status === 'active' && <span className="text-red-500 font-semibold">· AGOTADO</span>}
                        {' · '}
                        {l.status === 'active' ? 'Activo' : l.status === 'paused' ? 'Pausado' : 'Eliminado'}
                      </p>
                      {l.status !== 'removed' && (
                        <button
                          onClick={() => setListingStatus(l.id, l.status === 'active' ? 'pause' : 'reactivate')}
                          className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-md border border-[#DDD] hover:bg-[#F5F5F5] text-[#333] text-xs font-medium transition-colors"
                        >
                          {l.status === 'active' ? <><Pause className="w-3 h-3" /> Pausar</> : <><Play className="w-3 h-3" /> Reactivar</>}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {view === 'history' && (
            <div>
              <button onClick={() => setView('catalog')} className="text-[#3483FA] hover:underline text-sm mb-4">&larr; Volver al catálogo</button>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h2 className="text-[#333] text-lg font-bold mb-3">Mis compras</h2>
                  <div className="space-y-2">
                    {history.purchases.length === 0 && <p className="text-[#999] text-sm">Sin compras todavía.</p>}
                    {history.purchases.map((p) => (
                      <div key={p.id} className="bg-white border border-[#E6E6E6] rounded-md p-3 text-sm">
                        <p className="text-[#333]">{p.listingName} x{p.quantity}</p>
                        <p className="text-[#999] text-xs">$ {cop(p.total)} · vendedor {p.sellerUsername}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h2 className="text-[#333] text-lg font-bold mb-3">Mis ventas</h2>
                  <div className="space-y-2">
                    {history.sales.length === 0 && <p className="text-[#999] text-sm">Sin ventas todavía.</p>}
                    {history.sales.map((s) => (
                      <div key={s.id} className="bg-white border border-[#E6E6E6] rounded-md p-3 text-sm">
                        <p className="text-[#333]">{s.listingName} x{s.quantity}</p>
                        <p className="text-[#999] text-xs">$ {cop(s.total)} · comprador {s.buyerUsername}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {view === 'catalog' && (
            <>
              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <p className="text-[#999] text-xs">{loading ? 'Cargando...' : `${filteredProducts.length} resultados`}</p>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    placeholder="Precio máx."
                    className="w-28 bg-white border border-[#DDD] rounded-sm px-2 py-1.5 text-xs text-[#333] placeholder-[#999] focus:outline-none focus:border-[#3483FA]"
                  />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                    className="bg-white border border-[#DDD] rounded-sm px-2 py-1.5 text-xs text-[#333] focus:outline-none focus:border-[#3483FA]"
                  >
                    <option value="relevance">Más relevantes</option>
                    <option value="price_asc">Menor precio</option>
                    <option value="price_desc">Mayor precio</option>
                    <option value="recent">Más recientes</option>
                    <option value="rating">Mejor reputación</option>
                  </select>
                  <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded transition-colors ${viewMode === 'grid' ? 'bg-[#3483FA]/10 text-[#3483FA]' : 'text-[#999] hover:text-[#333]'}`}>
                    <Grid className="w-4 h-4" />
                  </button>
                  <button onClick={() => setViewMode('list')} className={`p-1.5 rounded transition-colors ${viewMode === 'list' ? 'bg-[#3483FA]/10 text-[#3483FA]' : 'text-[#999] hover:text-[#333]'}`}>
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className={viewMode === 'grid' ? 'grid grid-cols-4 gap-3' : 'space-y-2'}>
                {filteredProducts.map((product) => {
                  const discountPct = product.originalPrice
                    ? Math.round(100 - (product.price / product.originalPrice) * 100)
                    : 0;
                  const inst = installment(product.price);
                  return (
                    <div
                      key={product.id}
                      className={`bg-white border border-[#E6E6E6] rounded-md overflow-hidden hover:shadow-md transition-shadow cursor-pointer group ${viewMode === 'list' ? 'flex' : ''}`}
                      onClick={() => setSelectedProduct(product)}
                    >
                      <div className={`bg-white flex items-center justify-center relative ${viewMode === 'grid' ? 'h-40' : 'w-40 h-40 flex-shrink-0'}`}>
                        <div className="transition-transform duration-200 group-hover:scale-105">
                          <ProductThumb listing={product} size={viewMode === 'grid' ? 96 : 80} />
                        </div>
                        {product.official && (
                          <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#2D3277] text-white">Oficial</span>
                        )}
                        {product.stock <= 0 && (
                          <span className="absolute inset-0 bg-white/70 flex items-center justify-center text-[#666] text-sm font-bold tracking-wide">AGOTADO</span>
                        )}
                        <button
                          className="absolute top-2 right-2 p-1.5 rounded-full bg-white/90 text-[#999] hover:text-red-500 shadow-sm transition-all opacity-0 group-hover:opacity-100"
                          onClick={(e) => { e.stopPropagation(); toggleFavorite(product.id); }}
                        >
                          <Heart className={`w-4 h-4 ${favorites.has(product.id) ? 'fill-red-500 text-red-500' : ''}`} />
                        </button>
                      </div>

                      <div className={`p-3 ${viewMode === 'list' ? 'flex-1 flex flex-col justify-center' : ''}`}>
                        <h3 className="text-[#333] text-sm line-clamp-2 mb-1.5 leading-snug">{product.name}</h3>
                        <div className="flex items-baseline gap-2 flex-wrap">
                          {product.originalPrice && (
                            <span className="text-[#999] text-xs line-through">$ {cop(product.originalPrice)}</span>
                          )}
                          <span className="text-[#333] font-semibold text-xl">$ {cop(product.price)}</span>
                          {discountPct > 0 && (
                            <span className="text-[#00A650] text-sm font-semibold">{discountPct}% OFF</span>
                          )}
                        </div>
                        {product.price >= 3000 && (
                          <p className="text-[#00A650] text-xs mt-0.5">
                            en {inst.n}x $ {cop(inst.value)} sin interés
                          </p>
                        )}
                        <p className="text-[#00A650] text-xs font-semibold mt-1 flex items-center gap-1">
                          <Truck className="w-3.5 h-3.5" /> Envío gratis
                        </p>
                        <div className="flex items-center gap-1 mt-1.5">
                          <span className="text-[#999] text-xs">{product.rating.toFixed(1)}</span>
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className={`w-2.5 h-2.5 ${i < Math.round(product.rating) ? 'text-[#3483FA] fill-[#3483FA]' : 'text-[#DDD]'}`} />
                            ))}
                          </div>
                          <span className="text-[#999] text-xs">({product.reviews})</span>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-[#999] text-[11px]">Por {product.sellerUsername}</p>
                          <button
                            disabled={product.stock <= 0}
                            onClick={(e) => { e.stopPropagation(); addToCart(product); }}
                            className="p-1.5 rounded-full border border-[#3483FA] text-[#3483FA] hover:bg-[#3483FA]/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-[2000] p-4">
          <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl">
            <div className="flex">
              <ProductGallery listing={selectedProduct} />
              <div className="w-1/2 p-6 relative">
                <button onClick={() => setSelectedProduct(null)} className="absolute top-4 right-4 p-2 hover:bg-black/5 rounded-full transition-colors">
                  <X className="w-5 h-5 text-[#666]" />
                </button>
                {selectedProduct.official && (
                  <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#2D3277] text-white mb-2">Tienda Oficial</span>
                )}
                <p className="text-[#999] text-xs mb-1">{selectedProduct.category}</p>
                <h2 className="text-[#333] text-lg font-semibold mb-2 leading-snug">{selectedProduct.name}</h2>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[#3483FA] text-sm">{selectedProduct.rating.toFixed(1)}</span>
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`w-3.5 h-3.5 ${i < Math.round(selectedProduct.rating) ? 'text-[#3483FA] fill-[#3483FA]' : 'text-[#DDD]'}`} />
                    ))}
                  </div>
                  <span className="text-[#999] text-xs">({selectedProduct.reviews} calificaciones)</span>
                </div>
                <div className="mb-1">
                  {selectedProduct.originalPrice && (
                    <span className="text-[#999] text-sm line-through mr-2">$ {cop(selectedProduct.originalPrice)}</span>
                  )}
                  <span className="text-[#333] text-3xl font-semibold">$ {cop(selectedProduct.price)}</span>
                  {selectedProduct.originalPrice && (
                    <span className="text-[#00A650] text-sm font-semibold ml-2">
                      {Math.round(100 - (selectedProduct.price / selectedProduct.originalPrice) * 100)}% OFF
                    </span>
                  )}
                </div>
                {selectedProduct.price >= 3000 && (
                  <p className="text-[#00A650] text-sm mb-3">
                    en {installment(selectedProduct.price).n}x $ {cop(installment(selectedProduct.price).value)} sin interés
                  </p>
                )}
                <p className="text-[#666] text-sm mb-4">{selectedProduct.description}</p>
                <div className="space-y-2 mb-5 text-sm">
                  <div className="flex items-center gap-2 text-[#00A650] font-medium"><Truck className="w-4 h-4" /> Envío gratis a todo el servidor</div>
                  <div className="flex items-center gap-2 text-[#666]"><Shield className="w-4 h-4 text-[#3483FA]" /> Compra protegida</div>
                  <div className="flex items-center gap-2 text-[#666]">
                    <Package className="w-4 h-4 text-[#999]" />
                    {selectedProduct.stock > 0 ? `Stock disponible: ${selectedProduct.stock} unidades` : <span className="text-red-500 font-semibold">Sin stock — AGOTADO</span>}
                  </div>
                </div>
                <p className="text-[#999] text-xs mb-4">Vendido por <span className="text-[#3483FA]">{selectedProduct.sellerUsername}</span></p>
                <div className="space-y-2">
                  <button
                    disabled={selectedProduct.stock <= 0}
                    onClick={() => { addToCart(selectedProduct); setShowCart(true); setSelectedProduct(null); }}
                    className="w-full py-2.5 rounded-md bg-[#3483FA] hover:bg-[#2968D7] disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold transition-colors"
                  >
                    {selectedProduct.stock > 0 ? 'Comprar ahora' : 'Agotado'}
                  </button>
                  <button
                    disabled={selectedProduct.stock <= 0}
                    onClick={() => { addToCart(selectedProduct); setSelectedProduct(null); }}
                    className="w-full py-2.5 rounded-md bg-[#3483FA]/10 hover:bg-[#3483FA]/20 disabled:opacity-40 disabled:cursor-not-allowed text-[#3483FA] font-semibold transition-colors flex items-center justify-center gap-2"
                  >
                    <ShoppingCart className="w-4 h-4" /> Agregar al carrito
                  </button>
                  <button
                    onClick={() => contactSeller(selectedProduct)}
                    className="w-full py-2.5 rounded-md border border-[#DDD] hover:bg-[#F5F5F5] text-[#333] font-semibold transition-colors flex items-center justify-center gap-2"
                  >
                    <MessageCircle className="w-4 h-4" /> Contactar vendedor
                  </button>
                </div>

                <ProductExtras listing={selectedProduct} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cart Drawer */}
      {showCart && (
        <div className="absolute inset-0 bg-black/50 z-[2000]" onClick={() => setShowCart(false)}>
          <div className="absolute right-0 top-0 h-full w-96 bg-white border-l border-[#E6E6E6] flex flex-col shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-[#E6E6E6]">
              <h2 className="text-[#333] font-bold text-lg">Carrito ({cartCount})</h2>
              <button onClick={() => setShowCart(false)} className="p-2 hover:bg-black/5 rounded-full transition-colors">
                <X className="w-5 h-5 text-[#666]" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cart.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingCart className="w-16 h-16 text-[#DDD] mx-auto mb-4" />
                  <p className="text-[#999]">Tu carrito está vacío</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.id} className="flex gap-3 p-3 bg-white border border-[#E6E6E6] rounded-md">
                    <div className="w-16 h-16 bg-white border border-[#E6E6E6] rounded flex items-center justify-center flex-shrink-0">
                      <ProductThumb listing={item} size={48} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-[#333] text-sm font-medium line-clamp-1">{item.name}</h4>
                      <p className="text-[#333] font-semibold">$ {cop(item.price)}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <button onClick={() => updateQuantity(item.id, -1)} className="w-6 h-6 rounded border border-[#E6E6E6] flex items-center justify-center hover:bg-black/5 transition-colors">
                          <Minus className="w-3 h-3 text-[#333]" />
                        </button>
                        <span className="text-[#333] text-sm w-6 text-center">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, 1)} className="w-6 h-6 rounded border border-[#E6E6E6] flex items-center justify-center hover:bg-black/5 transition-colors">
                          <Plus className="w-3 h-3 text-[#333]" />
                        </button>
                        <button onClick={() => removeFromCart(item.id)} className="ml-auto text-[#999] hover:text-red-500 transition-colors">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            {cart.length > 0 && (
              <div className="p-4 border-t border-[#E6E6E6]">
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-[#666]">Subtotal</span>
                  <span className="text-[#333]">$ {cop(cartTotal)}</span>
                </div>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-[#666]">Envío</span>
                  <span className="text-[#00A650] font-medium">Gratis</span>
                </div>
                <div className="flex justify-between mb-3 pt-2 border-t border-[#F0F0F0]">
                  <span className="text-[#333] font-semibold">Total a pagar</span>
                  <span className="text-[#333] font-semibold text-xl">$ {cop(cartTotal)}</span>
                </div>
                {commissionPct > 0 && (
                  <p className="text-[#999] text-[11px] mb-3">
                    Los vendedores no oficiales pagan {commissionPct}% de comisión de MercadoLibre sobre cada venta.
                  </p>
                )}

                <GiftPicker giftTo={giftTo} onChange={setGiftTo} theme="light" accent="blue" className="mb-3" />

                <div className="mb-3">
                  <p className="text-[#666] text-xs font-medium mb-1.5">Pagar con</p>
                  {cards.length === 0 ? (
                    <button
                      onClick={() => { setShowCart(false); openApp('hubpay'); }}
                      className="w-full flex items-center gap-2 p-2.5 rounded-md border border-dashed border-[#DDD] text-[#666] text-xs hover:border-[#3483FA] hover:text-[#3483FA] transition-colors"
                    >
                      <CreditCard className="w-4 h-4" /> No tienes tarjetas — crea una en HubPay
                    </button>
                  ) : (
                    <div className="space-y-1.5 max-h-32 overflow-y-auto">
                      {cards.map((c) => {
                        const frozen = c.status !== 'active';
                        const selected = selectedCardId === c.id;
                        return (
                          <button
                            key={c.id}
                            onClick={() => !frozen && setSelectedCardId(c.id)}
                            disabled={frozen}
                            className={`w-full flex items-center gap-2.5 p-2.5 rounded-md border text-left transition-colors ${
                              selected ? 'border-[#3483FA] bg-[#3483FA]/5' : 'border-[#E6E6E6] hover:border-[#CCC]'
                            } ${frozen ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            <div className={`w-8 h-6 rounded flex-shrink-0 ${c.color === 'black' ? 'bg-zinc-800' : c.color === 'blue' ? 'bg-blue-600' : 'bg-gradient-to-br from-purple-500 to-pink-500'}`} />
                            <div className="flex-1 min-w-0">
                              <p className="text-[#333] text-xs font-medium">•••• {c.lastFourDigits}</p>
                              <p className="text-[#999] text-[10px]">{c.type === 'debit' ? 'Débito' : 'Crédito'} · Vence {c.expiryDate}</p>
                            </div>
                            {frozen && <Snowflake className="w-3.5 h-3.5 text-[#999] flex-shrink-0" />}
                            {selected && !frozen && <div className="w-4 h-4 rounded-full bg-[#3483FA] flex-shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <button onClick={checkout} disabled={buying || !selectedCardId} className="w-full py-3 rounded-md bg-[#3483FA] hover:bg-[#2968D7] disabled:opacity-50 text-white font-semibold transition-colors">
                  {buying ? 'Procesando...' : 'Continuar compra'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Publish Modal */}
      {showPublish && (
        <div className="absolute inset-0 bg-black/50 z-[2000] flex items-center justify-center p-4" onClick={() => setShowPublish(false)}>
          <div className="bg-white rounded-lg w-full max-w-md p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[#333] font-bold text-lg">Publicar artículo</h2>
              <button onClick={() => setShowPublish(false)} className="text-[#999] hover:text-[#333]"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              <input value={publishForm.name} onChange={(e) => setPublishForm((f) => ({ ...f, name: e.target.value }))} placeholder="Nombre del artículo"
                className="w-full bg-white border border-[#DDD] rounded-md px-3 py-2 text-sm text-[#333] placeholder-[#999] focus:outline-none focus:border-[#3483FA]" />
              <textarea value={publishForm.description} onChange={(e) => setPublishForm((f) => ({ ...f, description: e.target.value }))} placeholder="Descripción" rows={3}
                className="w-full bg-white border border-[#DDD] rounded-md px-3 py-2 text-sm text-[#333] placeholder-[#999] resize-none focus:outline-none focus:border-[#3483FA]" />
              <div className="grid grid-cols-2 gap-3">
                <input value={publishForm.price} onChange={(e) => setPublishForm((f) => ({ ...f, price: e.target.value }))} placeholder="Precio" type="number"
                  className="w-full bg-white border border-[#DDD] rounded-md px-3 py-2 text-sm text-[#333] placeholder-[#999] focus:outline-none focus:border-[#3483FA]" />
                <input value={publishForm.stock} onChange={(e) => setPublishForm((f) => ({ ...f, stock: e.target.value }))} placeholder="Stock" type="number"
                  className="w-full bg-white border border-[#DDD] rounded-md px-3 py-2 text-sm text-[#333] placeholder-[#999] focus:outline-none focus:border-[#3483FA]" />
              </div>
              <input value={publishForm.category} onChange={(e) => setPublishForm((f) => ({ ...f, category: e.target.value }))} placeholder="Categoría"
                className="w-full bg-white border border-[#DDD] rounded-md px-3 py-2 text-sm text-[#333] placeholder-[#999] focus:outline-none focus:border-[#3483FA]" />
              <div>
                <label className="block text-[#666] text-xs mb-1.5">Fotos ({publishForm.images.length}/{MAX_PRODUCT_IMAGES})</label>
                <div className="flex flex-wrap gap-2">
                  {publishForm.images.map((img, i) => (
                    <div key={i} className="relative w-16 h-16 rounded-md border border-[#DDD] overflow-hidden group">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setPublishForm((f) => ({ ...f, images: f.images.filter((_, idx) => idx !== i) }))}
                        className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  ))}
                  {publishForm.images.length < MAX_PRODUCT_IMAGES && (
                    <label className="w-16 h-16 rounded-md border border-dashed border-[#DDD] hover:border-[#3483FA] flex items-center justify-center cursor-pointer text-[#999] hover:text-[#3483FA] transition-colors">
                      {uploadingImages ? (
                        <span className="text-[10px]">...</span>
                      ) : (
                        <Camera className="w-5 h-5" />
                      )}
                      <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => { handleImageSelect(e.target.files); e.target.value = ''; }} disabled={uploadingImages} />
                    </label>
                  )}
                </div>
                {publishForm.images.length === 0 && (
                  <p className="text-[#999] text-[11px] mt-1.5">Sin fotos, se mostrará un ícono genérico.</p>
                )}
              </div>
              <button onClick={publish} disabled={!publishForm.name.trim() || !publishForm.price}
                className="w-full py-2.5 rounded-md bg-[#3483FA] hover:bg-[#2968D7] disabled:opacity-40 text-white font-semibold transition-colors">
                Publicar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface Review { id: string; buyerId: string; buyerUsername: string; rating: number; comment: string; createdAt: string; }
interface Question { id: string; askerId: string; askerUsername: string; question: string; answer?: string; }

function ProductExtras({ listing }: { listing: Listing }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [meId, setMeId] = useState<string | null>(null);
  const [purchased, setPurchased] = useState(false);
  const [myRating, setMyRating] = useState(5);
  const [myComment, setMyComment] = useState('');
  const [newQuestion, setNewQuestion] = useState('');
  const [answerDrafts, setAnswerDrafts] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch('/api/social/profile', { cache: 'no-store' }).then((r) => r.json()).then((d) => { if (d.success) setMeId(d.profile.discordId); });
    fetch(`/api/marketplace/reviews?listingId=${listing.id}`, { cache: 'no-store' }).then((r) => r.json()).then((d) => { if (d.success) setReviews(d.reviews); });
    fetch(`/api/marketplace/questions?listingId=${listing.id}`, { cache: 'no-store' }).then((r) => r.json()).then((d) => { if (d.success) setQuestions(d.questions); });
    fetch('/api/marketplace/history', { cache: 'no-store' }).then((r) => r.json()).then((d) => {
      if (d.success) setPurchased(d.purchases.some((p: any) => p.listingId === listing.id));
    });
  }, [listing.id]);

  const alreadyReviewed = meId && reviews.some((r) => r.buyerId === meId);
  const isSeller = meId === listing.sellerId;

  const submitReview = async () => {
    const res = await fetch('/api/marketplace/reviews', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listingId: listing.id, rating: myRating, comment: myComment }),
    });
    const data = await res.json();
    if (data.success) { setReviews((prev) => [data.review, ...prev]); setMyComment(''); }
  };

  const submitQuestion = async () => {
    if (!newQuestion.trim()) return;
    const res = await fetch('/api/marketplace/questions', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ listingId: listing.id, question: newQuestion.trim() }),
    });
    const data = await res.json();
    if (data.success) { setQuestions((prev) => [data.question, ...prev]); setNewQuestion(''); }
  };

  const submitAnswer = async (questionId: string) => {
    const answer = (answerDrafts[questionId] || '').trim();
    if (!answer) return;
    await fetch('/api/marketplace/questions', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ questionId, answer }),
    });
    setQuestions((prev) => prev.map((q) => q.id === questionId ? { ...q, answer } : q));
    setAnswerDrafts((prev) => ({ ...prev, [questionId]: '' }));
  };

  return (
    <div className="mt-6 pt-6 border-t border-[#E6E6E6] space-y-6">
      {/* Reseñas */}
      <div>
        <h3 className="text-[#333] font-semibold text-sm mb-2">Opiniones ({reviews.length})</h3>
        {purchased && !alreadyReviewed && (
          <div className="bg-[#F5F5F5] rounded-md p-3 mb-3">
            <div className="flex gap-1 mb-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} onClick={() => setMyRating(n)}>
                  <Star className={`w-4 h-4 ${n <= myRating ? 'text-[#3483FA] fill-[#3483FA]' : 'text-[#DDD]'}`} />
                </button>
              ))}
            </div>
            <textarea value={myComment} onChange={(e) => setMyComment(e.target.value)} placeholder="Escribe tu opinión..." rows={2}
              className="w-full bg-white border border-[#DDD] rounded-md px-2 py-1.5 text-xs text-[#333] placeholder-[#999] resize-none focus:outline-none" />
            <button onClick={submitReview} className="mt-2 px-3 py-1.5 rounded-md bg-[#3483FA] hover:bg-[#2968D7] text-white text-xs font-semibold">Publicar opinión</button>
          </div>
        )}
        <div className="space-y-2 max-h-32 overflow-y-auto">
          {reviews.map((r) => (
            <div key={r.id} className="text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-[#333] font-medium">{r.buyerUsername}</span>
                <div className="flex">{[...Array(5)].map((_, i) => <Star key={i} className={`w-2.5 h-2.5 ${i < r.rating ? 'text-[#3483FA] fill-[#3483FA]' : 'text-[#DDD]'}`} />)}</div>
              </div>
              {r.comment && <p className="text-[#666] mt-0.5">{r.comment}</p>}
            </div>
          ))}
        </div>
      </div>

      {/* Preguntas y respuestas */}
      <div>
        <h3 className="text-[#333] font-semibold text-sm mb-2">Preguntas ({questions.length})</h3>
        <div className="flex gap-2 mb-3">
          <input value={newQuestion} onChange={(e) => setNewQuestion(e.target.value)} placeholder="Haz una pregunta..."
            className="flex-1 bg-white border border-[#DDD] rounded-md px-2 py-1.5 text-xs text-[#333] placeholder-[#999] focus:outline-none" />
          <button onClick={submitQuestion} className="px-3 py-1.5 rounded-md bg-[#3483FA]/10 hover:bg-[#3483FA]/20 text-[#3483FA] text-xs font-semibold">Preguntar</button>
        </div>
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {questions.map((q) => (
            <div key={q.id} className="text-xs bg-[#F5F5F5] rounded-md p-2">
              <p className="text-[#666]"><span className="font-medium text-[#333]">{q.askerUsername}:</span> {q.question}</p>
              {q.answer ? (
                <p className="text-[#00A650] mt-1">↳ {q.answer}</p>
              ) : isSeller ? (
                <div className="flex gap-1.5 mt-1.5">
                  <input value={answerDrafts[q.id] || ''} onChange={(e) => setAnswerDrafts((prev) => ({ ...prev, [q.id]: e.target.value }))} placeholder="Responder..."
                    className="flex-1 bg-white border border-[#DDD] rounded px-2 py-1 text-[11px] text-[#333] focus:outline-none" />
                  <button onClick={() => submitAnswer(q.id)} className="px-2 py-1 rounded bg-[#3483FA] hover:bg-[#2968D7] text-white text-[11px]">Responder</button>
                </div>
              ) : (
                <p className="text-[#999] mt-1 italic">Sin responder</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
