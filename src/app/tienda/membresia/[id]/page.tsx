"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";
import Image from "next/image";
import { Crown, Check, ChevronRight, Shield, Zap, ArrowLeft, Star } from "lucide-react";
import { memberships, currencies, convertPrice } from "@/lib/shopData";
import type { CurrencyRate } from "@/lib/types";
import { useCart } from "@/contexts/CartContext";
import { useCardTilt } from "@/hooks/useCardTilt";
import AddToCartButton from "@/components/AddToCartButton";
import CurrencySelector from "@/components/tienda/CurrencySelector";

export default function MembershipPage() {
  const params = useParams();
  const membership = memberships.find(m => m.id === params.id);
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyRate>(currencies[0]);
  const [paymentType, setPaymentType] = useState<"monthly" | "permanent">("permanent");
  const { addItem } = useCart();
  const tilt = useCardTilt<HTMLDivElement>();

  if (!membership) {
    return (
      <main className="min-h-screen bg-[#0c0c14] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Membresía no encontrada</h1>
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

  return (
    <main className="min-h-screen bg-[#0c0c14]">
      <Navbar />

      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-8">
            <Link href="/tienda" className="hover:text-white flex items-center gap-1">
              <ArrowLeft className="h-3.5 w-3.5" /> Tienda
            </Link>
            <ChevronRight className="h-4 w-4" />
            <Link href="/tienda#membresias" className="hover:text-white">Membresías</Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-white">{membership.name}</span>
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
                  <span className="text-2xl font-bold text-white">{membership.name}</span>
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

              <h1 className="text-4xl font-bold mb-4" style={{ color: membership.color }}>
                {membership.name}
              </h1>

              <p className="text-gray-400 text-lg mb-6">{membership.description}</p>

              <div className="flex gap-2 mb-6">
                <button
                  type="button"
                  onClick={() => setPaymentType("monthly")}
                  className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${
                    paymentType === "monthly"
                      ? "bg-[#8e00f7] text-white"
                      : "bg-[#12121c] border border-[#1a1a28] text-gray-400 hover:border-[#8e00f7]"
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
                      : "bg-[#12121c] border border-[#1a1a28] text-gray-400 hover:border-[#8e00f7]"
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
                  <span className="text-gray-400 block mb-2">Moneda</span>
                  <CurrencySelector value={selectedCurrency} onChange={setSelectedCurrency} />
                </div>
                <div className="text-4xl font-bold text-white mb-1">
                  <span className="text-white">
                    {convertPrice(currentPrice, selectedCurrency)}
                  </span>
                  {paymentType === "monthly" && <span className="text-lg text-gray-400">/mes</span>}
                </div>
                {selectedCurrency.code !== "USD" && (
                  <div className="text-gray-500">
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

              <div className="mb-4">
                <AddToCartButton
                  onClick={handleAddToCart}
                  text="Agregar al Carrito"
                  requireAuth={true}
                />
              </div>

              <div className="flex items-center justify-center gap-6 text-sm text-gray-400">
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
            <h2 className="text-2xl font-bold text-white mb-6">Beneficios incluidos</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {membership.benefits.map((benefit, index) => (
                <div
                  key={index}
                  className="bg-[#12121c] border border-[#1a1a28] rounded-xl p-4 flex items-center gap-3 transition-all duration-300 hover:-translate-y-0.5"
                >
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${membership.color}20` }}>
                    <Check className="h-4 w-4" style={{ color: membership.color }} />
                  </div>
                  <span className="text-white">{benefit}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-10 grid sm:grid-cols-2 gap-4">
            <div className="bg-[#12121c] border border-[#1a1a28] rounded-2xl p-5">
              <h3 className="text-white font-semibold mb-2 text-sm">Otros niveles de membresía</h3>
              <div className="space-y-2">
                {memberships.filter((m) => m.id !== membership.id).map((m) => (
                  <Link key={m.id} href={`/tienda/membresia/${m.id}`} className="flex items-center justify-between gap-2 text-sm text-gray-400 hover:text-white transition-colors group">
                    <span className="truncate">{m.name}</span>
                    <span className="flex items-center gap-1 text-xs flex-shrink-0" style={{ color: m.color }}>
                      ${m.pricePermanent} único pago
                      <ChevronRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            <div className="bg-[#12121c] border border-[#1a1a28] rounded-2xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">Términos importantes</h3>
              <ul className="space-y-2 text-gray-400 text-sm">
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
