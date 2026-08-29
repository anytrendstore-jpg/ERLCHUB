"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";
import Image from "next/image";
import { Crown, Check, ChevronRight, Shield, Zap, ArrowLeft, Star, RefreshCw } from "lucide-react";
import { convertPrice } from "@/lib/shopData";
import { useExchangeRates } from "@/hooks/useExchangeRates";
import type { CurrencyRate, Membership } from "@/lib/types";
import { useCart } from "@/contexts/CartContext";
import { useCardTilt } from "@/hooks/useCardTilt";
import { useDiscordAuth } from "@/hooks/useDiscordAuth";
import AddToCartButton from "@/components/AddToCartButton";
import CurrencySelector from "@/components/tienda/CurrencySelector";
import CardTokenizeForm from "@/components/tienda/CardTokenizeForm";

export default function MembershipPage() {
  const params = useParams();
  const [membership, setMembership] = useState<Membership | null | undefined>(undefined);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const { currencies } = useExchangeRates();
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyRate>(currencies[0]);
  const [paymentType, setPaymentType] = useState<"monthly" | "permanent">("permanent");
  const [showSubscribeForm, setShowSubscribeForm] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const [subscribeError, setSubscribeError] = useState<string | null>(null);
  const { addItem } = useCart();
  const { user, isAuthenticated } = useDiscordAuth();
  const tilt = useCardTilt<HTMLDivElement>();

  useEffect(() => {
    fetch(`/api/shop/catalog?id=${params.id}`).then((r) => r.json()).then((d) => setMembership(d.success ? d.item : null));
    fetch('/api/shop/catalog?type=membership').then((r) => r.json()).then((d) => { if (d.success) setMemberships(d.items); });
  }, [params.id]);

  useEffect(() => {
    setSelectedCurrency((prev) => currencies.find((c) => c.code === prev.code) || currencies[0]);
  }, [currencies]);

  if (membership === undefined) {
    return (
      <main className="min-h-screen bg-[var(--background-alt)] flex items-center justify-center">
        <p className="text-[var(--text-muted)]">Cargando...</p>
      </main>
    );
  }

  if (!membership) {
    return (
      <main className="min-h-screen bg-[var(--background-alt)] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[var(--foreground)] mb-4">Membresía no encontrada</h1>
          <Link href="/tienda" className="text-[#8e00f7] hover:underline">
            Volver a la tienda
          </Link>
        </div>
      </main>
    );
  }

  const currentPrice = paymentType === "monthly" ? membership.priceMonthly : membership.pricePermanent;
  const breakEvenMonths = Math.ceil(membership.pricePermanent / membership.priceMonthly);
  const isElite = membership.id === "mem-elite";

  const handleAddToCart = () => {
    addItem({
      id: `${membership.id}-${paymentType}`,
      type: "membership",
      name: `Membresía ${membership.name} (${paymentType === "monthly" ? "Mensual" : "Permanente"})`,
      priceUSD: currentPrice,
      quantity: 1,
      image: membership.image,
      paymentType: paymentType,
    });
  };

  const handleSubscribeTokenized = async (cardToken: string) => {
    if (!user?.id) return;
    setSubscribing(true);
    setSubscribeError(null);
    try {
      const res = await fetch('/api/shop/checkout/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, customerEmail: `user_${user.id}@erlchub.pro`, catalogId: membership.id, cardToken }),
      });
      const data = await res.json();
      if (data.success) {
        window.location.href = '/tienda/checkout/success';
      } else {
        setSubscribeError(data.error || 'No se pudo procesar el pago');
      }
    } catch (error) {
      setSubscribeError('No se pudo procesar el pago');
    } finally {
      setSubscribing(false);
    }
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
            <Link href="/tienda#membresias" className="hover:text-[var(--foreground)]">Membresías</Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-[var(--foreground)]">{membership.name}</span>
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
                <Image src={membership.image} alt={membership.name} fill className="object-cover transition-transform duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                <div
                  className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ background: 'radial-gradient(320px circle at var(--glow-x,50%) var(--glow-y,50%), rgba(255,255,255,0.12), transparent 60%)' }}
                />
                {isElite && (
                  <div className="absolute top-4 right-4 flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-black px-3 py-1.5 rounded-full shadow-lg" style={{ backgroundColor: membership.color }}>
                    <Star className="h-3.5 w-3.5 fill-black" /> Recomendado
                  </div>
                )}
                <div className="absolute bottom-4 left-4 flex items-center gap-2">
                  <Crown className="h-8 w-8" style={{ color: membership.color }} />
                  <span className="text-2xl font-bold text-[var(--foreground)]">{membership.name}</span>
                </div>
              </div>
            </div>

            <div>
              <div
                className="inline-block px-3 py-1 rounded-full text-sm font-bold mb-4"
                style={{ backgroundColor: `${membership.color}20`, color: membership.color }}
              >
                MEMBRESÍA
              </div>

              <h1 className="shine-text text-4xl font-bold mb-4" style={{ '--shine-color': membership.color } as React.CSSProperties}>
                {membership.name}
              </h1>

              <p className="text-[var(--text-muted)] text-lg mb-6">{membership.description}</p>

              <div className="flex gap-2 mb-6">
                <button
                  type="button"
                  onClick={() => setPaymentType("monthly")}
                  className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${
                    paymentType === "monthly"
                      ? "bg-[#8e00f7] text-white"
                      : "bg-[var(--card-bg)] border border-[var(--card-border-soft)] text-[var(--text-muted)] hover:border-[#8e00f7]"
                  }`}
                >
                  Mensual
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentType("permanent")}
                  className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${
                    paymentType === "permanent"
                      ? "bg-[#8e00f7] text-white"
                      : "bg-[var(--card-bg)] border border-[var(--card-border-soft)] text-[var(--text-muted)] hover:border-[#8e00f7]"
                  }`}
                >
                  Permanente
                </button>
              </div>

              <div
                className="relative rounded-2xl p-6 mb-6 overflow-hidden border"
                style={{ borderColor: `${membership.color}40`, background: `linear-gradient(135deg, ${membership.color}12, transparent 60%)` }}
              >
                <div className="mb-4">
                  <span className="text-[var(--text-muted)] block mb-2">Moneda</span>
                  <CurrencySelector value={selectedCurrency} onChange={setSelectedCurrency} />
                </div>
                <div className="text-4xl font-bold text-[var(--foreground)] mb-1">
                  <span className="text-[var(--foreground)]">
                    {convertPrice(currentPrice, selectedCurrency)}
                  </span>
                  {paymentType === "monthly" && <span className="text-lg text-[var(--text-muted)]">/mes</span>}
                </div>
                {selectedCurrency.code !== "USD" && (
                  <div className="text-[var(--text-faint)]">
                    ${currentPrice}
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
                )}
                {paymentType === "permanent" && (
                  <p className="text-xs text-emerald-400 mt-2">Se paga solo — el mensual lo iguala recién al mes {breakEvenMonths}</p>
                )}
              </div>

              <div className="mb-4 space-y-3">
                <AddToCartButton
                  onClick={handleAddToCart}
                  text="Agregar al Carrito"
                  requireAuth={true}
                />

                {paymentType === "monthly" && isAuthenticated && (
                  showSubscribeForm ? (
                    <div className="bg-[var(--card-bg)] border border-[var(--card-border-soft)] rounded-xl p-4">
                      <p className="text-xs text-[var(--text-muted)] mb-3">
                        Guardá tu tarjeta una vez y la membresía se renueva sola cada mes — podés desactivarlo cuando quieras desde tu perfil.
                      </p>
                      <CardTokenizeForm onTokenized={handleSubscribeTokenized} submitLabel={subscribing ? "Procesando..." : `Suscribirme por $${membership.priceMonthly}/mes`} />
                      {subscribeError && <p className="text-red-400 text-xs mt-2">{subscribeError}</p>}
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowSubscribeForm(true)}
                      className="w-full flex items-center justify-center gap-2 border border-[#8e00f7]/40 hover:bg-[#8e00f7]/10 text-[#8e00f7] font-medium py-2.5 rounded-lg transition-colors"
                    >
                      <RefreshCw className="h-4 w-4" />
                      O suscribirme con renovación automática
                    </button>
                  )
                )}
              </div>

              <div className="flex items-center justify-center gap-6 text-sm text-[var(--text-muted)]">
                <div className="flex items-center gap-1">
                  <Shield className="h-4 w-4" style={{ color: membership.color }} />
                  Pago seguro
                </div>
                <div className="flex items-center gap-1">
                  <Zap className="h-4 w-4" style={{ color: membership.color }} />
                  Activación instantánea
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12">
            <h2 className="text-2xl font-bold text-[var(--foreground)] mb-6">Beneficios incluidos</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {membership.benefits.map((benefit, index) => (
                <div
                  key={index}
                  className="bg-[var(--card-bg)] border border-[var(--card-border-soft)] rounded-xl p-4 flex items-center gap-3 transition-all duration-300 hover:-translate-y-0.5"
                >
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${membership.color}20` }}>
                    <Check className="h-4 w-4" style={{ color: membership.color }} />
                  </div>
                  <span className="text-[var(--foreground)]">{benefit}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-10 grid sm:grid-cols-2 gap-4">
            <div className="bg-[var(--card-bg)] border border-[var(--card-border-soft)] rounded-2xl p-5">
              <h3 className="text-[var(--foreground)] font-semibold mb-2 text-sm">Otros niveles de membresía</h3>
              <div className="space-y-2">
                {memberships.filter((m) => m.id !== membership.id).map((m) => (
                  <Link key={m.id} href={`/tienda/membresia/${m.id}`} className="flex items-center justify-between gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--foreground)] transition-colors group">
                    <span className="truncate">{m.name}</span>
                    <span className="flex items-center gap-1 text-xs flex-shrink-0" style={{ color: m.color }}>
                      ${m.pricePermanent} único pago
                      <ChevronRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            <div className="bg-[var(--card-bg)] border border-[var(--card-border-soft)] rounded-2xl p-6">
              <h3 className="text-lg font-bold text-[var(--foreground)] mb-4">Términos importantes</h3>
              <ul className="space-y-2 text-[var(--text-muted)] text-sm">
                <li>Las membresías mensuales se renuevan automáticamente. Puedes cancelar en cualquier momento.</li>
                <li>Las membresías permanentes son de un solo pago y no requieren renovación.</li>
                <li>Los beneficios se activan inmediatamente después de confirmar el pago.</li>
                <li>No se realizan reembolsos una vez activada la membresía.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
