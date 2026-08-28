"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { 
  ShoppingCart, 
  Shield, 
  Zap, 
  Check, 
  Clock, 
  Star, 
  Gift, 
  ArrowRight, 
  TrendingUp, 
  Coins, 
  ShoppingBag 
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useCart } from "@/contexts/CartContext";
import { useReviews } from "@/hooks/useReviews";
import { useDiscordAuth } from "@/hooks/useDiscordAuth";
import { useHubCoins } from "@/hooks/useHubCoins";
import AddToCartButton from "@/components/AddToCartButton";
import { formatNumber, convertPrice } from "@/lib/shopData";
import { CurrencyRate, HubCoinsPackage } from "@/lib/types";
import CurrencySelector, { flagSrc } from "@/components/tienda/CurrencySelector";
import { useExchangeRates } from "@/hooks/useExchangeRates";

export default function HubCoinsPage() {
  const { currencies } = useExchangeRates();
  const [hubCoinsPackages, setHubCoinsPackages] = useState<HubCoinsPackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyRate>(currencies[0]);
  const { addItem } = useCart();

  useEffect(() => {
    setSelectedCurrency((prev) => currencies.find((c) => c.code === prev.code) || currencies[0]);
  }, [currencies]);

  useEffect(() => {
    fetch('/api/shop/catalog?type=hub-coins-package').then((r) => r.json()).then((d) => {
      if (d.success && d.items.length > 0) {
        setHubCoinsPackages(d.items);
        setSelectedPackage((prev) => prev || d.items[Math.min(2, d.items.length - 1)].id);
      }
    });
  }, []);
  const { reviews: hubCoinsReviews, renderStars, stats, refetch: fetchReviews } = useReviews('Hub Coins');
  const { isAuthenticated } = useDiscordAuth();
  const { balance, transactions, totalOrders, loading: hubCoinsLoading } = useHubCoins();

  const calculateDynamicStats = () => {
    if (!hubCoinsReviews || hubCoinsReviews.length === 0) {
      return { avgRating: 0, count: 0 };
    }
    
    const totalRating = hubCoinsReviews.reduce((sum, review) => sum + review.rating, 0);
    const avgRating = Math.round((totalRating / hubCoinsReviews.length) * 10) / 10;
    
    return { avgRating, count: hubCoinsReviews.length };
  };

  const dynamicStats = calculateDynamicStats();

  useEffect(() => {
    const interval = setInterval(() => {
      fetchReviews();
    }, 30000); 

    return () => clearInterval(interval);
  }, [fetchReviews]);

  const currentPackage = hubCoinsPackages.find(p => p.id === selectedPackage) || hubCoinsPackages[0];
  const totalCoins = currentPackage ? currentPackage.coins + currentPackage.bonus : 0;

  const discountedPrice = currentPackage?.priceUSD || 0;

  // Mejor valor real = menor costo por HC (coins + bonus incluido), no una etiqueta puesta a mano.
  const bestValuePackageId = hubCoinsPackages.length > 0 ? hubCoinsPackages.reduce((best, pkg) => {
    const ratio = pkg.priceUSD / (pkg.coins + pkg.bonus);
    const bestRatio = best.priceUSD / (best.coins + best.bonus);
    return ratio < bestRatio ? pkg : best;
  }, hubCoinsPackages[0]).id : null;

  const renderStarsManual = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star key={i} className={`h-4 w-4 ${i < Math.floor(rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`} />
    ));
  };

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      window.location.href = 'https://www.erlchub.pro/ingresar';
      return;
    }
    if (!currentPackage) return;

    addItem({
      id: currentPackage.id,
      type: "hub-coins",
      name: `${formatNumber(currentPackage.coins)} Hub Coins`,
      priceUSD: discountedPrice,
      quantity: 1,
      coins: currentPackage.coins,
      bonus: currentPackage.bonus,
    });
  };

  if (!currentPackage) {
    return (
      <main className="min-h-screen bg-[var(--background-alt)]">
        <Navbar />
        <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 text-center text-[var(--text-muted)]">Cargando paquetes de Hub Coins...</div>
        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--background-alt)]">
      <Navbar />

      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">

          <div className="flex items-center gap-2 text-sm text-[var(--text-muted)] mb-6">
            <Link href="/tienda" className="hover:text-[var(--foreground)] flex items-center gap-1">
              Tienda
            </Link>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">

            <div className="lg:col-span-2 space-y-8">

              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#8e00f7] to-[#a64dfa] flex items-center justify-center flex-shrink-0">
                  <Image
                    src="/hub-coins.png"
                    alt="Hub Coins"
                    width={72}
                    height={72}
                    className="w-18 h-18 object-contain"
                  />
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold text-[var(--foreground)] mb-2">Comprar Hub Coins</h1>
                  <p className="text-[var(--text-muted)]">Elige tu cantidad, método de pago y moneda.</p>

                  <div className="flex flex-wrap gap-2 mt-4">
                    <span className="flex items-center gap-1 bg-[#8e00f7]/20 border border-[#8e00f7]/30 px-3 py-1 rounded-full text-xs text-[var(--foreground)]">
                      <Shield className="h-3 w-3 text-[#8e00f7]" />
                      Mejor precio
                    </span>
                    <span className="flex items-center gap-1 bg-[#8e00f7]/20 border border-[#8e00f7]/30 px-3 py-1 rounded-full text-xs text-[var(--foreground)]">
                      <Zap className="h-3 w-3 text-[#8e00f7]" />
                      Entrega instantánea
                    </span>
                    <span className="flex items-center gap-1 bg-[#8e00f7]/20 border border-[#8e00f7]/30 px-3 py-1 rounded-full text-xs text-[var(--foreground)]">
                      <Check className="h-3 w-3 text-[#8e00f7]" />
                      Compra Segura
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-6 h-6 rounded-full bg-[#8e00f7] text-white text-sm font-bold flex items-center justify-center">1</div>
                  <h2 className="text-lg font-bold text-[var(--foreground)] uppercase tracking-wider">Cantidad de Hub Coins</h2>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {hubCoinsPackages.map((pkg) => {
                    const isBestValue = pkg.id === bestValuePackageId;
                    return (
                    <button
                      key={pkg.id}
                      type="button"
                      onClick={() => setSelectedPackage(pkg.id)}
                      className={`relative bg-[var(--card-bg)] border-2 rounded-xl p-4 text-left transition-all duration-200 hover:-translate-y-0.5 ${
                        selectedPackage === pkg.id
                          ? "border-[#8e00f7] bg-[#8e00f7]/10 shadow-[0_15px_35px_-15px_rgba(142,0,247,0.5)]"
                          : "border-[var(--card-border-soft)] hover:border-[#3a3a4a]"
                      }`}
                    >
                      {pkg.popular && (
                        <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-[#8e00f7] text-white text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
                          Popular
                        </div>
                      )}
                      {!pkg.popular && isBestValue && (
                        <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-emerald-500 text-black text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
                          Mejor valor
                        </div>
                      )}

                      <div className="flex items-center gap-2 mb-1">
                        <Image
                          src="/hub-coins.png"
                          alt="Hub Coins"
                          width={40}
                          height={40}
                          className="w-10 h-10"
                        />
                        <span className="text-xl font-bold text-[var(--foreground)]">{formatNumber(pkg.coins)}</span>
                      </div>

                      {pkg.bonus > 0 ? (
                        <div className="text-[#8e00f7] text-xs font-medium flex items-center gap-1">
                          <Gift className="h-3 w-3" />
                          +{formatNumber(pkg.bonus)} gratis
                        </div>
                      ) : (
                        <div className="text-[var(--text-faint)] text-xs">&nbsp;</div>
                      )}

                      <div className="text-[var(--text-muted)] text-sm mt-2">
                        {convertPrice(pkg.priceUSD, selectedCurrency)}
                      </div>
                    </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-6 h-6 rounded-full bg-[#8e00f7] text-white text-sm font-bold flex items-center justify-center">2</div>
                  <h2 className="text-lg font-bold text-[var(--foreground)] uppercase tracking-wider">Moneda</h2>
                </div>

                <div className="flex flex-wrap gap-2">
                  {currencies.map((currency) => (
                    <button
                      key={currency.code}
                      type="button"
                      onClick={() => setSelectedCurrency(currency)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all ${
                        selectedCurrency.code === currency.code
                          ? "border-[#8e00f7] bg-[#8e00f7]/10"
                          : "border-[var(--card-border-soft)] bg-[var(--card-bg)] hover:border-[#3a3a4a]"
                      }`}
                    >
                      <div className="w-5 h-3 rounded-sm overflow-hidden">
                        <Image
                          src={flagSrc(currency.code)}
                          alt={currency.name}
                          width={20}
                          height={12}
                          className="object-cover object-[0px_0px]"
                        />
                      </div>
                      <span className="text-[var(--foreground)] font-medium">{currency.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-[var(--card-bg)] border border-[var(--card-border-soft)] rounded-xl p-5">
                  <h3 className="text-[var(--foreground)] font-bold mb-2">Cómo comprar?</h3>
                  <p className="text-[var(--text-muted)] text-sm">
                    Guía rápida paso a paso.
                  </p>
                  <ol className="mt-3 space-y-2 text-sm text-[var(--text-muted)]">
                    <li className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-[#8e00f7]/20 text-[#8e00f7] text-xs flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
                      Selecciona la cantidad
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-[#8e00f7]/20 text-[#8e00f7] text-xs flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
                      Elige tu moneda
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-[#8e00f7]/20 text-[#8e00f7] text-xs flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
                      Completa el pago
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-[#8e00f7]/20 text-[#8e00f7] text-xs flex items-center justify-center flex-shrink-0 mt-0.5">4</span>
                      Recibe tus Hub Coins
                    </li>
                  </ol>
                </div>

                <div className="bg-[var(--card-bg)] border border-[var(--card-border-soft)] rounded-xl p-5">
                  <h3 className="text-[var(--foreground)] font-bold mb-2">Pagos Seguros</h3>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <div className="bg-white rounded px-3 py-1.5 transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-blue-700/20 cursor-pointer">
                      <svg className="h-4 w-auto" viewBox="0 0 48 32" fill="none">
                        <path d="M17.958 10.283l-5.792 11.45h-3.79l-2.85-9.138c-.173-.679-.323-.928-.849-1.215-.86-.467-2.277-.905-3.523-1.177l.084-.42h6.099c.777 0 1.476.517 1.652 1.413l1.51 8.017 3.73-9.43h3.73zm14.722 7.71c.015-3.022-4.178-3.188-4.15-4.537.01-.41.4-.847 1.257-.958.424-.056 1.595-.098 2.923.514l.52-2.432a7.968 7.968 0 0 0-2.773-.507c-2.93 0-4.993 1.558-5.011 3.787-.02 1.65 1.473 2.57 2.6 3.118 1.159.562 1.543.922 1.543 1.424-.008.769-.925 1.108-1.78 1.12-1.495.024-2.364-.404-3.056-.726l-.54 2.52c.696.32 1.98.6 3.312.613 3.114 0 5.15-1.538 5.155-3.936zm7.727 3.74h3.27l-2.852-11.45h-3.02a1.463 1.463 0 0 0-1.37.914l-4.832 10.536h3.113l.618-1.712h3.805l.359 1.712h2.91zm-3.31-4.063l1.561-4.31.898 4.31h-2.46zM24.08 10.283l-2.452 11.45h-2.964l2.454-11.45h2.962z" fill="#1A1F71"/>
                      </svg>
                    </div>
                    <div className="bg-white rounded px-3 py-1.5 transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-orange-500/20 cursor-pointer">
                      <svg className="h-4 w-auto" viewBox="0 0 48 32" fill="none">
                        <circle cx="18" cy="16" r="10" fill="#EB001B"/>
                        <circle cx="30" cy="16" r="10" fill="#F79E1B"/>
                        <path d="M24 8.02a9.965 9.965 0 0 0-6 7.98 9.965 9.965 0 0 0 6 7.98 9.965 9.965 0 0 0 6-7.98 9.965 9.965 0 0 0 6-7.98z" fill="#FF5F00"/>
                      </svg>
                    </div>
                    <div className="bg-white rounded px-3 py-1.5 transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-yellow-500/20 cursor-pointer">
                      <img src="https://www.radioacktiva.com/wp-content/uploads/2024/02/19022024-bancolombia.jpg" alt="Bancolombia" className="h-4 w-auto" />
                    </div>
                    <div className="bg-white rounded px-3 py-1.5 transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-green-500/20 cursor-pointer">
                      <img src="https://juntanacional.co/wp-content/uploads/2015/08/logo_380.png" alt="PSE" className="h-4 w-auto" />
                    </div>
                  </div>
                  <h3 className="text-[var(--foreground)] font-bold mb-2">Pagos Seguros Mediante Tickets</h3>
                  <div className="flex flex-wrap gap-2">
                    <div className="bg-white rounded px-3 py-1.5 transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-blue-500/20 cursor-pointer">
                      <img src="/pagos/visa-rewarble.png" alt="Visa Rewarble" className="h-4 w-auto" />
                    </div>
                    <div className="bg-white rounded px-3 py-1.5 transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-orange-500/20 cursor-pointer">
                      <img src="/pagos/bitcoins.png" alt="Criptomonedas" className="h-4 w-auto" />
                    </div>
                    <div className="bg-white rounded px-3 py-1.5 transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-blue-600/20 cursor-pointer">
                      <img src="https://upload.wikimedia.org/wikipedia/commons/a/a4/Paypal_2014_logo.png" alt="PayPal" className="h-4 w-auto" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-4">

                <div className="relative rounded-2xl p-6 overflow-hidden border border-[#8e00f7]/30" style={{ background: 'linear-gradient(135deg, var(--accent-blue-wash), var(--card-bg) 60%)' }}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[var(--text-muted)] text-sm uppercase tracking-wider">Resumen</h3>
                    <div className="w-10 h-10 rounded-full bg-[#8e00f7] flex items-center justify-center">
                      <Image
                        src="/hub-coins.png"
                        alt="Hub Coins"
                        width={40}
                        height={40}
                        className="w-10 h-10"
                      />
                    </div>
                  </div>

                  <div className="text-center mb-6">
                    <div className="text-5xl font-black text-[var(--foreground)] mb-1">
                      {formatNumber(totalCoins)}
                    </div>
                    <div className="text-[var(--text-muted)]">Hub Coins</div>
                  </div>

                  <div className="space-y-3 text-sm border-t border-[var(--card-border-soft)] pt-4">
                    <div className="flex justify-between">
                      <span className="text-[var(--text-muted)]">Cantidad base</span>
                      <span className="text-[var(--foreground)] flex items-center gap-1">
                        {formatNumber(currentPackage.coins)}
                        <Image
                          src="/hub-coins.png"
                          alt="Hub Coins"
                          width={48}
                          height={48}
                          className="w-12 h-12"
                        />
                      </span>
                    </div>
                    {currentPackage.bonus > 0 && (
                      <div className="flex justify-between">
                        <span className="text-[var(--text-muted)]">Bonus gratis</span>
                        <span className="text-[#8e00f7] flex items-center gap-1">
                          +{formatNumber(currentPackage.bonus)}
                          <Image
                            src="/hub-coins.png"
                            alt="Hub Coins"
                            width={32}
                            height={32}
                            className="w-8 h-8"
                          />
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-[var(--text-muted)]">Moneda</span>
                      <span className="text-[var(--foreground)] flex items-center gap-1">
                        <div className="w-5 h-3 rounded-sm overflow-hidden">
                          <Image
                            src={flagSrc(selectedCurrency.code)}
                            alt={selectedCurrency.name}
                            width={20}
                            height={12}
                            className="object-cover object-[0px_0px]"
                          />
                        </div>
                        {selectedCurrency.code}
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-[var(--card-border-soft)] mt-4 pt-4">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-[var(--text-muted)]">Total</span>
                      <span className="text-3xl font-bold text-[var(--foreground)]">
                        {convertPrice(currentPackage.priceUSD, selectedCurrency)}
                      </span>
                    </div>

                    {selectedCurrency.code !== "USD" && (
                      <div className="text-right text-[var(--text-faint)] text-sm mb-4">
                        ${currentPackage.priceUSD} 
                        <div className="w-5 h-3 rounded-sm overflow-hidden inline-block ml-1">
                          <Image
                            src="/banderas/usa-bandera.png"
                            alt="USA"
                            width={20}
                            height={12}
                            className="object-cover object-[0px_0px]"
                          />
                        </div>
                      </div>
                    )}

                    <AddToCartButton 
                      onClick={handleAddToCart}
                      text="AGREGAR AL CARRITO"
                      requireAuth={true}
                    />
                  </div>

                  <div className="flex items-center justify-center gap-4 mt-4 text-xs text-[var(--text-faint)]">
                    <div className="flex items-center gap-1">
                      <Shield className="h-3 w-3" />
                      Pago seguro
                    </div>
                    <div className="flex items-center gap-1">
                      <Zap className="h-3 w-3" />
                      Entrega instantánea
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-1 mt-4">
                    {renderStarsManual(dynamicStats?.avgRating || 0)}
                    <span className="text-[var(--text-muted)] text-sm ml-1">{dynamicStats?.avgRating?.toFixed(1) || '0.0'} ({dynamicStats?.count || 0} Reseñas )</span>
                  </div>
                </div>

                <div className="space-y-3">
                  {hubCoinsReviews.slice(0, 2).map((review, index) => (
                    <div key={index} className="bg-[var(--card-bg-2)] rounded-lg p-3 border border-[#2a2a3a]">
                      <div className="flex items-start gap-2">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[var(--foreground)] font-medium text-sm">{review.username || review.name || "Usuario"}</span>
                            <div className="flex items-center gap-1">
                              {review.rating && (
                                <>
                                  {renderStarsManual(review.rating)}
                                  <span className="text-[var(--text-muted)] text-xs ml-1">{review.rating}</span>
                                </>
                              )}
                            </div>
                          </div>
                          <p className="text-[var(--text-muted)] text-sm leading-relaxed mb-2">{review.comment}</p>
                          <div className="flex items-center justify-between">
                            <span className="bg-[#8e00f7]/20 text-[#8e00f7] px-2 py-1 rounded text-xs">Hub Coins</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-[var(--card-bg)] border border-[var(--card-border-soft)] rounded-2xl p-4 mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-[var(--foreground)] font-bold text-sm">ÓRDENES</h3>
                    <div className="bg-[#8e00f7]/20 text-[#8e00f7] px-2 py-1 rounded-full text-xs font-bold">
                      {totalOrders} transacciones exitosas
                    </div>
                  </div>
                  <p className="text-[var(--text-muted)] text-xs">Total de transacciones completadas</p>
                </div>

                <div className="bg-[var(--card-bg)] border border-[var(--card-border-soft)] rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-[var(--foreground)] font-bold text-sm">Compras Recientes</h3>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-green-500 text-xs">En vivo</span>
                    </div>
                  </div>

                  {hubCoinsLoading ? (
                    <div className="text-center text-[var(--text-faint)] text-sm py-8">
                      <div className="w-12 h-12 rounded-full bg-[#8e00f7]/20 flex items-center justify-center mx-auto mb-3">
                        <div className="w-6 h-6 border-2 border-[#8e00f7] border-t-transparent rounded-full animate-spin" />
                      </div>
                      <p>Cargando compras...</p>
                    </div>
                  ) : transactions.filter(t => t.type === 'purchase').length === 0 ? (
                    <div className="text-center text-[var(--text-faint)] text-sm py-8">
                      <div className="w-12 h-12 rounded-full bg-[#8e00f7]/20 flex items-center justify-center mx-auto mb-3">
                        <ShoppingBag className="h-6 w-6 text-[#8e00f7]" />
                      </div>
                      <p>No hay compras recientes</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {transactions
                        .filter(t => t.type === 'purchase')
                        .slice(0, 5)
                        .map((transaction) => (
                          <div key={transaction._id} className="flex items-center gap-3 p-2 bg-[var(--card-bg-2)] rounded-lg">
                            {transaction.user?.avatar ? (
                              <Image
                                src={`https://cdn.discordapp.com/avatars/${transaction.userId}/${transaction.user.avatar}.png?size=32`}
                                alt={transaction.user.username}
                                width={32}
                                height={32}
                                className="w-8 h-8 rounded-full"
                                onError={(e) => {
                                  e.currentTarget.src = `https://cdn.discordapp.com/embed/avatars/0.png?size=32`;
                                }}
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-[#8e00f7] flex items-center justify-center text-white font-bold text-xs">
                                {(transaction.user?.username || "U").charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-[var(--foreground)] text-sm font-medium">
                                  {transaction.user?.username || 'Usuario'}
                                </span>
                                <TrendingUp className="h-3 w-3 text-green-400" />
                              </div>
                              <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                                <Coins className="h-3 w-3" />
                                <span>+{transaction.amount} Hub Coins</span>
                                <span>•</span>
                                <Clock className="h-3 w-3" />
                                <span>{new Date(transaction.timestamp).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}