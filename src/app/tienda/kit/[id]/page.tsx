"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";
import Image from "next/image";
import { Package, Check, ChevronRight, Shield, Zap, Sparkles, ArrowLeft } from "lucide-react";
import { convertPrice, formatNumber } from "@/lib/shopData";
import { useExchangeRates } from "@/hooks/useExchangeRates";
import { useCart } from "@/contexts/CartContext";
import { useDiscordAuth } from "@/hooks/useDiscordAuth";
import { useCardTilt } from "@/hooks/useCardTilt";
import AddToCartButton from "@/components/AddToCartButton";
import CurrencySelector from "@/components/tienda/CurrencySelector";
import { trackStoreEvent, useTrackPageView } from "@/hooks/useStoreTracking";

const DESCRIPTION_IMAGE: Record<string, string> = {
  "kit-dinero": "/tienda-membresias/kit-dinero-descripcion.png",
  "kit-armas": "/tienda-membresias/kit-armas-descripcion.png",
  "kit-autos": "/tienda-membresias/kit-autos-descripcion.png",
  "kit-personajes": "/tienda-membresias/kit-personajes-descripcion.png",
};

export default function KitPage() {
  const params = useParams();
  const router = useRouter();
  const { currencies } = useExchangeRates();
  const [selectedCurrency, setSelectedCurrency] = useState(currencies[0]);
  const [kit, setKit] = useState<any | null | undefined>(undefined);
  const [relatedKits, setRelatedKits] = useState<any[]>([]);
  const tilt = useCardTilt<HTMLDivElement>();

  const isWhitelistFast = params.id === "whitelist-fast";

  useTrackPageView("kit", typeof params.id === "string" ? params.id : undefined);

  useEffect(() => {
    fetch(`/api/shop/catalog?id=${params.id}`).then((r) => r.json()).then((d) => setKit(d.success ? d.item : null));
    fetch('/api/shop/catalog?type=kit').then((r) => r.json()).then((d) => { if (d.success) setRelatedKits(d.items); });
  }, [params.id]);

  useEffect(() => {
    setSelectedCurrency((prev) => currencies.find((c) => c.code === prev.code) || currencies[0]);
  }, [currencies]);

  const { addItem } = useCart();
  const { isAuthenticated, user } = useDiscordAuth();

  const handleBuyWhitelistFast = () => {
    if (!isAuthenticated || !user?.id) {
      window.location.href = "https://www.erlchub.pro/ingresar";
      return;
    }
    addItem({
      id: "whitelist-fast",
      type: "kit",
      name: "Whitelist Fast",
      priceUSD: kit?.priceDollars || 7,
      quantity: 1,
      category: "Whitelist",
      details: "Acceso instantáneo sin entrevistas",
      image: kit?.image,
    });
    trackStoreEvent("select_package", "kit", "whitelist-fast");
    router.push("/tienda/carrito");
  };

  if (kit === undefined) {
    return (
      <main className="min-h-screen bg-[var(--background-alt)] flex items-center justify-center">
        <p className="text-[var(--text-muted)]">Cargando...</p>
      </main>
    );
  }

  if (!kit) {
    return (
      <main className="min-h-screen bg-[var(--background-alt)] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[var(--foreground)] mb-4">Kit no encontrado</h1>
          <Link href="/tienda" className="text-[#8e00f7] hover:underline">
            Volver a la tienda
          </Link>
        </div>
      </main>
    );
  }

  const color = isWhitelistFast ? "#8b5cf6" : kit.color;
  const slotsGranted = !isWhitelistFast && "characterSlotsGranted" in kit ? kit.characterSlotsGranted : undefined;
  const bundleParts = ["kit-dinero", "kit-autos", "kit-personajes"].map((id) => relatedKits.find((k) => k.id === id)?.priceHubCoins || 0).reduce((a, b) => a + b, 0);
  const bundleSavings = kit.id === "kit-full" && bundleParts > 0
    ? { amount: bundleParts - kit.priceHubCoins, pct: Math.round(((bundleParts - kit.priceHubCoins) / bundleParts) * 100) }
    : null;
  const image = DESCRIPTION_IMAGE[kit.id] || kit.image;

  const handleAddToCart = () => {
    if (isWhitelistFast || !("priceHubCoins" in kit)) return;
    addItem({
      id: kit.id,
      type: "kit",
      name: kit.name,
      priceHubCoins: kit.priceHubCoins,
      quantity: 1,
      image: kit.image,
    });
    trackStoreEvent("select_package", "kit", kit.id);
  };

  return (
    <main className="min-h-screen bg-[var(--background-alt)]">
      <Navbar />

      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-2 text-sm text-[var(--text-muted)] mb-8">
            <Link href="/tienda" className="hover:text-[var(--foreground)] flex items-center gap-1">
              <ArrowLeft className="h-3.5 w-3.5" /> Tienda
            </Link>
            <ChevronRight className="h-4 w-4" />
            <Link href="/tienda#kits" className="hover:text-[var(--foreground)]">Kits</Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-[var(--foreground)]">{kit.name}</span>
          </div>

          <div className="grid lg:grid-cols-2 gap-10">
            <div>
              <div
                ref={tilt.ref}
                onMouseMove={tilt.onMouseMove}
                onMouseLeave={tilt.onMouseLeave}
                style={{ transform: 'rotateX(var(--tilt-x,0deg)) rotateY(var(--tilt-y,0deg))' }}
                className="group aspect-video rounded-2xl overflow-hidden relative border border-white/10 [transform-style:preserve-3d] transition-transform duration-300"
              >
                <Image src={image} alt={kit.name} fill className="object-cover transition-transform duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                <div
                  className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ background: 'radial-gradient(320px circle at var(--glow-x,50%) var(--glow-y,50%), rgba(255,255,255,0.12), transparent 60%)' }}
                />
                {bundleSavings && bundleSavings.pct > 0 && (
                  <div className="absolute top-4 right-4 flex items-center gap-1 text-xs font-bold uppercase tracking-wide bg-emerald-500 text-black px-3 py-1.5 rounded-full shadow-lg">
                    <Sparkles className="h-3.5 w-3.5" /> Ahorrás {bundleSavings.pct}%
                  </div>
                )}
                <div className="absolute bottom-4 left-4 flex items-center gap-2">
                  <Package className="h-8 w-8" style={{ color }} />
                  <span className="text-2xl font-bold text-[var(--foreground)]">{kit.name}</span>
                </div>
              </div>

              {bundleSavings && bundleSavings.pct > 0 && (
                <p className="text-xs text-[var(--text-faint)] mt-3 px-1">
                  Incluye lo mismo que KIT DINERO + KIT AUTOS + KIT PERSONAJES por separado, y encima más — pero cuesta {formatNumber(bundleSavings.amount)} Hub Coins menos.
                </p>
              )}
            </div>

            <div>
              <div
                className="inline-block px-3 py-1 rounded-full text-sm font-bold mb-4"
                style={{ backgroundColor: `${color}20`, color }}
              >
                {isWhitelistFast ? "WHITELIST" : kit.category.toUpperCase()}
              </div>

              <h1 className="shine-text text-4xl font-bold mb-4" style={{ '--shine-color': color } as React.CSSProperties}>{kit.name}</h1>
              <p className="text-[var(--text-muted)] text-lg mb-4">{kit.description}</p>

              {slotsGranted ? (
                <div className="flex items-center gap-2 text-sm text-blue-300 bg-blue-500/10 border border-blue-500/25 rounded-lg px-3 py-2 mb-6 w-fit">
                  <Sparkles className="h-4 w-4 flex-shrink-0" />
                  Otorga +{slotsGranted} cupo{slotsGranted > 1 ? "s" : ""} de personaje automáticamente al pagar
                </div>
              ) : (
                <div className="mb-6" />
              )}

              <div
                className="relative rounded-2xl p-6 mb-6 overflow-hidden border"
                style={{ borderColor: `${color}40`, background: `linear-gradient(135deg, ${color}12, transparent 60%)` }}
              >
                <div className="text-[var(--text-muted)] mb-2">Precio</div>
                {isWhitelistFast ? (
                  <div>
                    <div className="flex items-center gap-2 text-4xl font-bold mb-4">
                      <span className="text-[var(--foreground)]">{convertPrice(kit.priceDollars, selectedCurrency)}</span>
                    </div>
                    <div className="text-[var(--text-faint)] text-sm">≈ ${kit.priceDollars}.00</div>
                    <CurrencySelector value={selectedCurrency} onChange={setSelectedCurrency} className="mt-4" />
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-4xl font-bold" style={{ color }}>
                    {"priceHubCoins" in kit ? formatNumber(kit.priceHubCoins) : 0}
                    <Image src="/hub-coins.png" alt="Hub Coins" width={48} height={48} className="w-12 h-12" />
                  </div>
                )}
              </div>

              {isWhitelistFast ? (
                <div className="mb-4">
                  <button
                    type="button"
                    onClick={handleBuyWhitelistFast}
                    className="relative w-full bg-[#8b5cf6] hover:bg-[#7c3aed] text-white py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#8b5cf6]/30 overflow-hidden group"
                  >
                    <Zap className="h-5 w-5" />
                    {isAuthenticated ? "AGREGAR AL CARRITO" : "INICIAR SESIÓN PARA COMPRAR"}
                  </button>
                </div>
              ) : (
                <div className="mb-4">
                  <AddToCartButton
                    onClick={handleAddToCart}
                    text="Agregar al Carrito"
                  />
                </div>
              )}

              <div className="flex items-center justify-center gap-6 text-sm text-[var(--text-muted)]">
                <div className="flex items-center gap-1">
                  <Shield className="h-4 w-4" style={{ color }} />
                  Pago seguro
                </div>
                <div className="flex items-center gap-1">
                  <Zap className="h-4 w-4" style={{ color }} />
                  Entrega instantánea
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12">
            <h2 className="text-2xl font-bold text-[var(--foreground)] mb-6">Contenido del kit</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {kit.items.map((item, index) => (
                <div
                  key={index}
                  className="bg-[var(--card-bg)] border border-[var(--card-border-soft)] rounded-xl p-4 flex items-center gap-3 transition-all duration-300 hover:-translate-y-0.5"
                  style={{ '--hover-color': color } as React.CSSProperties}
                >
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${color}20` }}>
                    <Check className="h-4 w-4" style={{ color }} />
                  </div>
                  <span className="text-[var(--foreground)]">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-10 grid sm:grid-cols-2 gap-4">
            <div className="bg-[var(--card-bg)] border border-[var(--card-border-soft)] rounded-2xl p-5">
              <h3 className="text-[var(--foreground)] font-semibold mb-2 text-sm">Otros kits que te podrían interesar</h3>
              <div className="space-y-2">
                {relatedKits.filter((k) => k.id !== kit.id && k.category === (kit as any).category).slice(0, 3).map((k) => (
                  <Link key={k.id} href={`/tienda/kit/${k.id}`} className="flex items-center justify-between gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--foreground)] transition-colors group">
                    <span className="truncate">{k.name}</span>
                    <span className="flex items-center gap-1 text-xs flex-shrink-0" style={{ color: k.color }}>
                      {formatNumber(k.priceHubCoins)}
                      <ChevronRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </Link>
                ))}
                {relatedKits.filter((k) => k.id !== kit.id && k.category === (kit as any).category).length === 0 && (
                  <p className="text-xs text-gray-600">Ningún otro kit en esta categoría por ahora.</p>
                )}
              </div>
            </div>

            <div className="bg-[var(--card-bg)] border border-[var(--card-border-soft)] rounded-2xl p-6">
              <h3 className="text-lg font-bold text-[var(--foreground)] mb-4">Términos importantes</h3>
              <ul className="space-y-2 text-[var(--text-muted)] text-sm">
                <li>Los kits se compran exclusivamente con Hub Coins.</li>
                <li>Los items se entregan inmediatamente después de la compra.</li>
                <li>Los items del kit no son transferibles a otros usuarios.</li>
                <li>No se realizan reembolsos una vez entregado el kit.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
