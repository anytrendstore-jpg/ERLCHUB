"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";
import Image from "next/image";
import {
  ChevronRight,
  Crown,
  Package,
  Dices,
  ShoppingBag,
  Sparkles,
  Shield,
  Zap,
  Check,
  Star,
  Clock,
  ShoppingCart
} from "lucide-react";
import { memberships, kits, casinoGames, currencies, convertPrice, formatNumber } from "@/lib/shopData";
import { useReviews } from "@/hooks/useReviews";
import { useCart } from "@/contexts/CartContext";
import { useTiendaStats } from "@/hooks/useTiendaStats";
import AddToCartButton from "@/components/AddToCartButton";

export default function TiendaPage() {
  const [selectedCurrency, setSelectedCurrency] = useState(currencies[0]);
  const { stats: reviewStats, reviews } = useReviews('Tienda'); 
  const { stats: tiendaStats, loading: statsLoading } = useTiendaStats();
  const { addItem } = useCart();
  const tiendaRating = reviewStats.tienda.avgRating > 0 ? reviewStats.tienda.avgRating.toFixed(1) : "0";
  const handleAddWhitelistFastToCart = () => {
    addItem({
      id: "whitelist-fast",
      type: "kit",
      name: "Whitelist Fast",
      priceUSD: 7,
      quantity: 1,
      category: "Whitelist",
      details: "Acceso instantáneo sin entrevistas",
      image: "/tienda-membresias/whitelist-fast.png"
    });
  };
  
  const mejoresReseñasTienda = reviews
    .filter(review => review.tag === 'Tienda')
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 3); 
  
  const renderStarsJSX = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star key={i} className={`h-4 w-4 ${i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`} />
    ));
  };

  return (
    <main className="min-h-screen bg-[#0c0c14]">
      <Navbar />

      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">

          <section className="mb-12">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#8e00f7]/20 via-[#8e00f7]/10 to-[#a64dfa]/20 border border-[#8e00f7]/30">
              {/* Background pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-10 left-10 w-32 h-32 rounded-full bg-[#8e00f7] blur-3xl" />
                <div className="absolute bottom-10 right-10 w-40 h-40 rounded-full bg-[#a64dfa] blur-3xl" />
              </div>

              <div className="relative p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="flex-1">
                  <h1 className="text-4xl md:text-5xl font-black text-white mb-4">
                    Hub Coins
                  </h1>
                  <p className="text-gray-300 text-lg mb-6 max-w-md">
                    Compra Hub Coins al mejor precio del mercado.<br />
                    Entrega instantánea, segura y garantizada.
                  </p>

                  <div className="flex flex-wrap gap-3 mb-6">
                    <div className="flex items-center gap-2 bg-[#8e00f7]/20 border border-[#8e00f7]/30 px-4 py-2 rounded-full text-sm text-white">
                      <Shield className="h-4 w-4 text-[#8e00f7]" />
                      Mejor precio
                    </div>
                    <div className="flex items-center gap-2 bg-[#8e00f7]/20 border border-[#8e00f7]/30 px-4 py-2 rounded-full text-sm text-white">
                      <Zap className="h-4 w-4 text-[#8e00f7]" />
                      Entrega instantánea
                    </div>
                    <div className="flex items-center gap-2 bg-[#8e00f7]/20 border border-[#8e00f7]/30 px-4 py-2 rounded-full text-sm text-white">
                      <Check className="h-4 w-4 text-[#8e00f7]" />
                      Compra segura
                    </div>

                  </div>
                </div>

                <div className="flex flex-col items-center md:items-end gap-4">
                  <div className="text-right">
                    <div className="text-gray-400 text-sm">Desde</div>
                    <div className="text-white text-2xl font-bold flex items-center gap-2">
                      $5.00 
                      <div className="w-5 h-3 rounded-sm overflow-hidden">
                        <Image
                          src="/banderas/usa-bandera.png"
                          alt="USA"
                          width={20}
                          height={12}
                          className="object-cover"
                        />
                      </div>
                      <span className="text-gray-400 font-normal">/ 500</span>
                      <Image
                        src="/hub-coins.png"
                        alt="Hub Coins"
                        width={40}
                        height={40}
                        className="w-10 h-10"
                      />
                    </div>
                  </div>

                  <Link
                    href="/tienda/hub-coins"
                    className="flex items-center gap-2 bg-[#8e00f7] hover:bg-[#a64dfa] text-white px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 group"
                  >
                    COMPRAR HUB COINS
                    <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    <ChevronRight className="h-5 w-5 -ml-3 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            </div>
          </section>

          <section className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#fbbf24]/20 flex items-center justify-center">
                  <Crown className="h-5 w-5 text-[#fbbf24]" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Membresías</h2>
                  <p className="text-gray-400 text-sm">Beneficios exclusivos con pago en dinero real</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {memberships.map((membership) => (
                <Link
                  key={membership.id}
                  href={`/tienda/membresia/${membership.id}`}
                  className={`group bg-[#12121c] border border-[#1a1a28] rounded-2xl overflow-hidden transition-all duration-300`}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = `${membership.color}20`;
                    e.currentTarget.style.boxShadow = `0 0 30px ${membership.color}40`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#12121c';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div className="relative w-full h-48">
                    <Image
                      src={membership.image}
                      alt={membership.name}
                      fill
                      className="object-cover"
                    />
                  </div>

                  <div className="p-5">
                    <h3 className="text-lg font-bold mb-2" style={{ color: membership.color }}>
                      {membership.name}
                    </h3>
                    <p className="text-gray-400 text-sm mb-4 line-clamp-2">{membership.description}</p>

                    <div className="flex items-center justify-between">
                      <div className="text-white font-bold">
                        Desde ${membership.priceMonthly}
                        <div className="w-5 h-3 rounded-sm overflow-hidden inline-block ml-2">
                          <Image
                            src="/banderas/usa-bandera.png"
                            alt="USA"
                            width={20}
                            height={12}
                            className="object-cover"
                          />
                        </div>
                        /mes
                      </div>
                      <span className="text-[#8e00f7] flex items-center gap-1 text-sm">
                        Ver <ChevronRight className="h-4 w-4" />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          <section className="mb-12">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#8e00f7]/20 via-[#8e00f7]/10 to-[#a64dfa]/20 border border-[#8e00f7]/30">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-10 left-10 w-32 h-32 rounded-full bg-[#8e00f7] blur-3xl" />
                <div className="absolute bottom-10 right-10 w-40 h-40 rounded-full bg-[#a64dfa] blur-3xl" />
              </div>

              <div className="relative p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="flex-1">
                  <h1 className="text-4xl md:text-5xl font-black text-white mb-4">
                    Whitelist Fast
                  </h1>
                  <p className="text-gray-300 text-lg mb-6 max-w-md">
                    Acceso instantáneo sin entrevistas.<br />
                    Activa tu whitelist inmediatamente.
                  </p>
                  <div className="flex flex-wrap gap-3 mb-6">
                    <div className="flex items-center gap-2 bg-[#8e00f7]/20 border border-[#8e00f7]/30 px-4 py-2 rounded-full text-sm text-white">
                      <Zap className="h-4 w-4 text-[#8e00f7]" />
                      Acceso Inmediato
                    </div>
                    <div className="flex items-center gap-2 bg-[#8e00f7]/20 border border-[#8e00f7]/30 px-4 py-2 rounded-full text-sm text-white">
                      <Check className="h-4 w-4 text-[#8e00f7]" />
                      Sin entrevistas
                    </div>
                    <div className="flex items-center gap-2 bg-[#8e00f7]/20 border border-[#8e00f7]/30 px-4 py-2 rounded-full text-sm text-white">
                      <Shield className="h-4 w-4 text-[#8e00f7]" />
                      Activación directa
                    </div>
                    <div className="flex items-center gap-2 bg-[#8e00f7]/20 border border-[#8e00f7]/30 px-4 py-2 rounded-full text-sm text-white">
                      <Clock className="h-4 w-4 text-[#8e00f7]" />
                      Ahorro de Tiempo
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-center md:items-end gap-4">
                  <div className="relative w-full h-48 rounded-2xl overflow-hidden border-2 border-[#8e00f7]/30 shadow-lg shadow-[#8e00f7]/20 mb-6">
                    <Image
                      src="/tienda-membresias/whitelist-fast.png"
                      alt="WHITELIST FAST"
                      fill
                      className="object-cover"
                    />
                  </div>

                  <div className="text-right">
                    <div className="text-gray-400 text-sm">Precio especial</div>
                    <div className="text-white text-2xl font-bold flex items-center gap-2">
                      {convertPrice(7, selectedCurrency)} 
                      <div className="w-5 h-3 rounded-sm overflow-hidden">
                        <Image
                          src={`/banderas/${
                            selectedCurrency.code === "USD" ? "usa-bandera" :
                            selectedCurrency.code === "EUR" ? "eu-bandera" :
                            selectedCurrency.code === "MXN" ? "mexico-bandera" :
                            selectedCurrency.code === "COP" ? "colombia-bandera" :
                            selectedCurrency.code === "ARS" ? "argentina-bandera" :
                            selectedCurrency.code === "PEN" ? "peru-bandera" :
                            selectedCurrency.code === "CLP" ? "chile-bandera" :
                            "usa-bandera"
                          }.png`}
                          alt={selectedCurrency.name}
                          width={20}
                          height={12}
                          className="object-cover"
                        />
                      </div>
                    </div>
                    <div className="text-gray-500 text-sm mt-1">
                      ≈ ${7.00} 
                      <div className="w-5 h-3 rounded-sm overflow-hidden inline-block ml-1">
                        <Image
                          src="/banderas/usa-bandera.png"
                          alt="USA"
                          width={20}
                          height={12}
                          className="object-cover"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <button
                      type="button"
                      onClick={() => setSelectedCurrency({ code: "USD", name: "Dólar estadounidense", symbol: "$", flag: "🇺🇸", rateToUSD: 1 })}
                      className={`flex items-center gap-1 px-3 py-1 rounded-lg border-2 transition-all text-xs ${
                        selectedCurrency.code === "USD"
                          ? "border-[#8e00f7] bg-[#8e00f7]/10"
                            : "border-[#1a1a28] bg-[#12121c] hover:border-[#3a3a4a]"
                        }`}
                    >
                      <div className="w-5 h-3 rounded-sm overflow-hidden">
                        <Image
                          src="/banderas/usa-bandera.png"
                          alt="USA"
                          width={20}
                          height={12}
                          className="object-cover"
                        />
                      </div>
                      <span>USD</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedCurrency({ code: "EUR", name: "Euro", symbol: "€", flag: "🇪🇺", rateToUSD: 0.92 })}
                      className={`flex items-center gap-1 px-3 py-1 rounded-lg border-2 transition-all text-xs ${
                        selectedCurrency.code === "EUR"
                          ? "border-[#8e00f7] bg-[#8e00f7]/10"
                            : "border-[#1a1a28] bg-[#12121c] hover:border-[#3a3a4a]"
                        }`}
                    >
                      <div className="w-5 h-3 rounded-sm overflow-hidden">
                        <Image
                          src="/banderas/eu-bandera.png"
                          alt="EU"
                          width={20}
                          height={12}
                          className="object-cover"
                        />
                      </div>
                      <span>EUR</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedCurrency({ code: "MXN", name: "Peso mexicano", symbol: "$", flag: "🇲🇽", rateToUSD: 17.15 })}
                      className={`flex items-center gap-1 px-3 py-1 rounded-lg border-2 transition-all text-xs ${
                        selectedCurrency.code === "MXN"
                          ? "border-[#8e00f7] bg-[#8e00f7]/10"
                            : "border-[#1a1a28] bg-[#12121c] hover:border-[#3a3a4a]"
                        }`}
                    >
                      <div className="w-5 h-3 rounded-sm overflow-hidden">
                        <Image
                          src="/banderas/mexico-bandera.png"
                          alt="Mexico"
                          width={20}
                          height={12}
                          className="object-cover"
                        />
                      </div>
                      <span>MXN</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedCurrency({ code: "COP", name: "Peso colombiano", symbol: "$", flag: "🇨🇴", rateToUSD: 3950 })}
                      className={`flex items-center gap-1 px-3 py-1 rounded-lg border-2 transition-all text-xs ${
                        selectedCurrency.code === "COP"
                          ? "border-[#8e00f7] bg-[#8e00f7]/10"
                            : "border-[#1a1a28] bg-[#12121c] hover:border-[#3a3a4a]"
                        }`}
                    >
                      <div className="w-5 h-3 rounded-sm overflow-hidden">
                        <Image
                          src="/banderas/colombia-bandera.png"
                          alt="Colombia"
                          width={20}
                          height={12}
                          className="object-cover"
                        />
                      </div>
                      <span>COP</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedCurrency({ code: "ARS", name: "Peso argentino", symbol: "$", flag: "🇦🇷", rateToUSD: 875 })}
                      className={`flex items-center gap-1 px-3 py-1 rounded-lg border-2 transition-all text-xs ${
                        selectedCurrency.code === "ARS"
                          ? "border-[#8e00f7] bg-[#8e00f7]/10"
                            : "border-[#1a1a28] bg-[#12121c] hover:border-[#3a3a4a]"
                        }`}
                    >
                      <div className="w-5 h-3 rounded-sm overflow-hidden">
                        <Image
                          src="/banderas/argentina-bandera.png"
                          alt="Argentina"
                          width={20}
                          height={12}
                          className="object-cover"
                        />
                      </div>
                      <span>ARS</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedCurrency({ code: "PEN", name: "Sol peruano", symbol: "S/", flag: "🇵🇪", rateToUSD: 3.72 })}
                      className={`flex items-center gap-1 px-3 py-1 rounded-lg border-2 transition-all text-xs ${
                        selectedCurrency.code === "PEN"
                          ? "border-[#8e00f7] bg-[#8e00f7]/10"
                            : "border-[#1a1a28] bg-[#12121c] hover:border-[#3a3a4a]"
                        }`}
                    >
                      <div className="w-5 h-3 rounded-sm overflow-hidden">
                        <Image
                          src="/banderas/peru-bandera.png"
                          alt="Peru"
                          width={20}
                          height={12}
                          className="object-cover"
                        />
                      </div>
                      <span>PEN</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedCurrency({ code: "CLP", name: "Peso chileno", symbol: "$", flag: "🇨🇱", rateToUSD: 940 })}
                      className={`flex items-center gap-1 px-3 py-1 rounded-lg border-2 transition-all text-xs ${
                        selectedCurrency.code === "CLP"
                          ? "border-[#8e00f7] bg-[#8e00f7]/10"
                            : "border-[#1a1a28] bg-[#12121c] hover:border-[#3a3a4a]"
                        }`}
                    >
                      <div className="w-5 h-3 rounded-sm overflow-hidden">
                        <Image
                          src="/banderas/chile-bandera.png"
                          alt="Chile"
                          width={20}
                          height={12}
                          className="object-cover"
                        />
                      </div>
                      <span>CLP</span>
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <AddToCartButton 
                      onClick={handleAddWhitelistFastToCart}
                      text="AGREGAR AL CARRITO"
                      className="flex items-center gap-2 bg-[#8e00f7] hover:bg-[#a64dfa] text-white px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 group"
                      requireAuth={true}
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#22c55e]/20 flex items-center justify-center">
                  <Package className="h-full w-full text-[#22c55e]" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Kits</h2>
                  <p className="text-gray-400 text-sm">Paquetes completos - Se compran con Hub Coins</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {kits.map((kit) => (
                <Link
                  key={kit.id}
                  href={`/tienda/kit/${kit.id}`}
                  className={`group bg-[#12121c] border border-[#1a1a28] rounded-xl overflow-hidden transition-all duration-300`}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = `${kit.color}20`;
                    e.currentTarget.style.boxShadow = `0 0 30px ${kit.color}40`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#12121c';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div className="relative w-full h-64">
                    <Image
                      src={kit.image}
                      alt={kit.name}
                      fill
                      className="object-cover"
                    />
                  </div>

                  <div className="p-4">
                    <h3 className="text-base font-bold text-white truncate">{kit.name}</h3>
                    <div className="flex items-center gap-1 text-white text-base font-bold mt-1">
                      <span>{kit.priceHubCoins}</span>
                      <Image
                        src="/hub-coins.png"
                        alt="Hub Coins"
                        width={40}
                        height={40}
                        className="w-10 h-10"
                      />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {false && (
          <section className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#ef4444]/20 flex items-center justify-center">
                  <Dices className="h-5 w-5 text-[#ef4444]" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Casino</h2>
                  <p className="text-gray-400 text-sm">Apuesta Hub Coins y gana premios increíbles</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {casinoGames.map((game) => (
                <Link
                  key={game.id}
                  href={`/tienda/casino/${game.id}`}
                  className="group relative bg-[#12121c] border border-[#1a1a28] rounded-2xl overflow-hidden hover:border-[#ef4444] transition-all duration-300"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-[#ef4444]/5 via-transparent to-[#8e00f7]/5" />

                  <div className="relative p-6">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#ef4444] to-[#8e00f7] flex items-center justify-center mb-4">
                      <Sparkles className="h-7 w-7 text-white" />
                    </div>

                    <h3 className="text-lg font-bold text-white mb-2">{game.name}</h3>
                    <p className="text-gray-400 text-sm mb-4 line-clamp-2">{game.description}</p>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500 flex items-center gap-1">
                        Min: {game.minBet}
                        <Image
                          src="/hub-coins.png"
                          alt="Hub Coins"
                          width={36}
                          height={36}
                          className="w-9 h-9"
                        />
                      </span>
                      <span className="text-[#8e00f7] flex items-center gap-1">
                        Jugar <ChevronRight className="h-4 w-4" />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
          )}

          <section className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#8e00f7]/20 flex items-center justify-center">
                  <ShoppingBag className="h-5 w-5 text-[#8e00f7]" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Artículos</h2>
                  <p className="text-gray-400 text-sm">Artículos individuales - Se compran con Hub Coins</p>
                </div>
              </div>
              <Link href="/tienda/items" className="text-[#8e00f7] text-sm flex items-center gap-1 hover:underline">
                Ver todos <ChevronRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="bg-gradient-to-r from-[#8e00f7]/20 via-[#a64dfa]/20 to-[#8e00f7]/20 border border-[#8e00f7]/30 rounded-3xl p-12 text-center relative overflow-hidden">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-10 left-10 w-32 h-32 rounded-full bg-[#8e00f7] blur-3xl" />
                <div className="absolute bottom-10 right-10 w-40 h-40 rounded-full bg-[#a64dfa] blur-3xl" />
              </div>

              <div className="relative z-10">
                <div className="w-20 h-20 rounded-full bg-[#8e00f7]/20 flex items-center justify-center mx-auto mb-6">
                  <ShoppingBag className="h-10 w-10 text-[#8e00f7]" />
                </div>
                <h3 className="text-3xl font-bold text-white mb-4">Próximamente Disponible</h3>
                <p className="text-gray-300 text-lg mb-6 max-w-2xl mx-auto">
                  Estamos trabajando para esta seccion de artículos individuales. 
                </p>
                <div className="flex items-center justify-center gap-2 text-[#8e00f7]">
                  <span className="text-sm font-medium">Mantente atento a las novedades</span>
                  <ChevronRight className="h-4 w-4" />
                </div>
              </div>
            </div>
          </section>
          <section className="mb-12">
            <div className="bg-gradient-to-r from-[#8e00f7]/10 via-[#a64dfa]/10 to-[#8e00f7]/10 border border-[#8e00f7]/30 rounded-3xl p-8">
              <h2 className="text-3xl font-bold text-white text-center mb-8">Estadísticas de la Tienda</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-4xl font-bold text-[#8e00f7] mb-2">
                    {statsLoading ? (
                      <div className="animate-pulse">Cargando...</div>
                    ) : (
                      tiendaStats.activeUsers.toLocaleString() || "0"
                    )}
                  </div>
                  <div className="text-gray-400 text-sm">Usuarios Activos</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-[#22c55e] mb-2">
                    {statsLoading ? (
                      <div className="animate-pulse">Cargando...</div>
                    ) : (
                      tiendaStats.totalOrders.toLocaleString() || "0"
                    )}
                  </div>
                  <div className="text-gray-400 text-sm">Órdenes Totales</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-[#fbbf24] mb-2">{tiendaRating}★</div>
                  <div className="text-gray-400 text-sm">Calificación</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-[#ef4444] mb-2">24/7</div>
                  <div className="text-gray-400 text-sm">Soporte</div>
                </div>
              </div>
            </div>
          </section>

          <section className="mb-12">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-4">Lo que dicen nuestros usuarios</h2>
              <p className="text-gray-400 text-lg">Descubre por qué miles de jugadores confían en ERLC HUB</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {mejoresReseñasTienda.length > 0 ? (
                mejoresReseñasTienda.map((review, index) => (
                  <div key={index} className="bg-[#12121c] border border-[#1a1a28] rounded-2xl p-6">
                    <div className="flex items-center gap-1 mb-4">
                      {renderStarsJSX(review.rating)}
                    </div>
                    <p className="text-gray-300 text-sm mb-4 italic">
                      "{review.comment}"
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#8e00f7]/20 flex items-center justify-center">
                        <span className="text-[#8e00f7] font-bold text-sm">
                          {review.username.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
                        </span>
                      </div>
                      <div>
                        <div className="text-white font-medium text-sm">{review.username}</div>
                        <div className="text-gray-500 text-xs">Cliente Verificado</div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-3 text-center py-12">
                  <p className="text-gray-400 text-lg">No hay reseñas de tienda aún. ¡Sé el primero en compartir tu experiencia!</p>
                </div>
              )}
            </div>
          </section>

          <section className="mb-12">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-4">Preguntas Frecuentes</h2>
              <p className="text-gray-400 text-lg">Todo lo que necesitas saber sobre nuestra tienda</p>
            </div>

            <div className="max-w-3xl mx-auto space-y-4">
              <div className="bg-[#12121c] border border-[#1a1a28] rounded-xl p-6">
                <h3 className="text-white font-bold mb-2">¿Cómo compro Hub Coins?</h3>
                <p className="text-gray-400 text-sm">
                  Es muy fácil. Ve a la sección de Hub Coins, selecciona la cantidad que quieres, elige tu moneda y método de pago, y completa la compra. La entrega es instantánea.
                </p>
              </div>

              <div className="bg-[#12121c] border border-[#1a1a28] rounded-xl p-6">
                <h3 className="text-white font-bold mb-2">¿Qué métodos de pago aceptan?</h3>
                <div className="text-gray-400 text-sm space-y-2">
                  <p className="font-semibold text-white">Pagos seguros:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>VISA</li>
                    <li>MasterCard</li>
                  </ul>
                  <p className="font-semibold text-white">Pagos Seguros Mediante Tickets:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Nequi</li>
                    <li>Bancolombia</li>
                    <li>Visa Rewarble</li>
                    <li>Criptomonedas</li>
                  </ul>
                </div>
              </div>

              <div className="bg-[#12121c] border border-[#1a1a28] rounded-xl p-6">
                <h3 className="text-white font-bold mb-2">¿Cuánto tiempo tarda la entrega?</h3>
                <p className="text-gray-400 text-sm">
                  La entrega de Hub Coins y productos digitales es instantánea. Recibirás tus compras en tu cuenta inmediatamente después de confirmar el pago.
                </p>
              </div>

              <div className="bg-[#12121c] border border-[#1a1a28] rounded-xl p-6">
                <h3 className="text-white font-bold mb-2">¿Hay reembolsos?</h3>
                <p className="text-gray-400 text-sm">
                  Los productos digitales no tienen reembolso una vez entregados. Si tienes problemas con tu compra, nuestro equipo de soporte te ayudará a resolverlo.
                </p>
              </div>
            </div>
          </section>

        </div>
      </div>

      <Footer />
    </main>
  );
}