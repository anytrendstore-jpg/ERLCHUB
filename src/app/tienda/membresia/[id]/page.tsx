"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";
import Image from "next/image";
import { Crown, Check, ChevronRight, Shield, Zap, CreditCard, ShoppingCart } from "lucide-react";
import { memberships, currencies, convertPrice } from "@/lib/shopData";
import type { CurrencyRate } from "@/lib/types";
import { useCart } from "@/contexts/CartContext";
import AddToCartButton from "@/components/AddToCartButton";

export default function MembershipPage() {
  const params = useParams();
  const membership = memberships.find(m => m.id === params.id);
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyRate>(currencies[0]);
  const [paymentType, setPaymentType] = useState<"monthly" | "permanent">("permanent");
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
  const { addItem } = useCart();

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
            <Link href="/tienda" className="hover:text-white">Tienda</Link>
            <ChevronRight className="h-4 w-4" />
            <Link href="/tienda#memberships" className="hover:text-white">Membresías</Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-white">{membership.name}</span>
          </div>

          <div className="grid lg:grid-cols-2 gap-10">
            <div>
              <div
                className="aspect-video rounded-2xl overflow-hidden relative"
                style={{ background: `linear-gradient(135deg, ${membership.color}30, ${membership.color}60)` }}
              >
                <Image
                  src={membership.image}
                  alt={membership.name}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
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

              <div className="bg-[#12121c] border border-[#1a1a28] rounded-2xl p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-gray-400">Moneda</span>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowCurrencyDropdown(!showCurrencyDropdown)}
                      className="bg-[#0c0c14] border border-[#1a1a28] rounded-lg px-4 py-2 text-white text-lg flex items-center gap-2 min-w-[120px] justify-between"
                    >
                      <div className="flex items-center gap-2">
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
                        <span>{selectedCurrency.code}</span>
                      </div>
                      <ChevronRight className={`h-4 w-4 transition-transform ${showCurrencyDropdown ? 'rotate-90' : ''}`} />
                    </button>
                    
                    {showCurrencyDropdown && (
                      <div className="absolute top-full mt-1 right-0 bg-[#0c0c14] border border-[#1a1a28] rounded-lg shadow-xl z-50 min-w-[150px]">
                        {currencies.map((currency) => (
                          <button
                            key={currency.code}
                            type="button"
                            onClick={() => {
                              setSelectedCurrency(currencies.find(c => c.code === currency.code) || currencies[0]);
                              setShowCurrencyDropdown(false);
                            }}
                            className={`w-full flex items-center gap-2 px-4 py-2 text-white hover:bg-[#1a1a28] transition-colors ${
                              selectedCurrency.code === currency.code ? 'bg-[#8e00f7]/20' : ''
                            }`}
                          >
                            <div className="w-5 h-3 rounded-sm overflow-hidden">
                              <Image
                                src={`/banderas/${
                                  currency.code === "USD" ? "usa-bandera" :
                                  currency.code === "EUR" ? "eu-bandera" :
                                  currency.code === "MXN" ? "mexico-bandera" :
                                  currency.code === "COP" ? "colombia-bandera" :
                                  currency.code === "ARS" ? "argentina-bandera" :
                                  currency.code === "PEN" ? "peru-bandera" :
                                  currency.code === "CLP" ? "chile-bandera" :
                                  "usa-bandera"
                                }.png`}
                                alt={currency.name}
                                width={20}
                                height={12}
                                className="object-cover"
                              />
                            </div>
                            <span className="text-sm">{currency.code}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
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
              </div>

              <AddToCartButton 
                onClick={handleAddToCart}
                text="Agregar al Carrito"
                requireAuth={true}
              />

              <div className="flex items-center justify-center gap-6 text-sm text-gray-400">
                <div className="flex items-center gap-1">
                  <Shield className="h-4 w-4 text-[#8e00f7]" />
                  Pago seguro
                </div>
                <div className="flex items-center gap-1">
                  <Zap className="h-4 w-4 text-[#8e00f7]" />
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
                  className="bg-[#12121c] border border-[#1a1a28] rounded-xl p-4 flex items-center gap-3"
                >
                  <div className="w-8 h-8 rounded-full bg-[#8e00f7]/20 flex items-center justify-center flex-shrink-0">
                    <Check className="h-4 w-4 text-[#8e00f7]" />
                  </div>
                  <span className="text-white">{benefit}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-12 bg-[#12121c] border border-[#1a1a28] rounded-2xl p-6">
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

      <Footer />
    </main>
  );
}