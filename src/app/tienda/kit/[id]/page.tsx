"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";
import Image from "next/image";
import { Package, Check, ChevronRight, Coins, Shield, Zap, ShoppingCart } from "lucide-react";
import { kits, currencies, convertPrice, whitelistFastKit } from "@/lib/shopData";
import { useCart } from "@/contexts/CartContext";
import { useDiscordAuth } from "@/hooks/useDiscordAuth";
import AddToCartButton from "@/components/AddToCartButton";
import CurrencySelector from "@/components/tienda/CurrencySelector";

export default function KitPage() {
  const params = useParams();
  const [selectedCurrency, setSelectedCurrency] = useState(currencies[0]);
  const [buyingWhitelistFast, setBuyingWhitelistFast] = useState(false);
  const [whitelistFastError, setWhitelistFastError] = useState("");

  const isWhitelistFast = params.id === "whitelist-fast";
  const kit = isWhitelistFast ? whitelistFastKit : kits.find(k => k.id === params.id);

  const { addItem } = useCart();
  const { isAuthenticated, user } = useDiscordAuth();

  const handleBuyWhitelistFast = async () => {
    if (!isAuthenticated || !user?.id) {
      window.location.href = "https://www.erlchub.pro/ingresar";
      return;
    }
    setBuyingWhitelistFast(true);
    setWhitelistFastError("");
    try {
      const res = await fetch("/api/whitelist-fast/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });
      const data = await res.json();
      if (data.success && data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        setWhitelistFastError(data.error || "No se pudo iniciar el pago. Intentá de nuevo.");
        setBuyingWhitelistFast(false);
      }
    } catch {
      setWhitelistFastError("No se pudo iniciar el pago. Intentá de nuevo.");
      setBuyingWhitelistFast(false);
    }
  };

  const getDescriptionImage = (kitId: string) => {
    switch(kitId) {
      case "kit-dinero":
        return "/tienda-membresias/kit-dinero-descripcion.png";
      case "kit-armas":
        return "/tienda-membresias/kit-armas-descripcion.png";
      case "kit-autos":
        return "/tienda-membresias/kit-autos-descripcion.png";
      case "kit-personajes":
        return "/tienda-membresias/kit-personajes-descripcion.png";
      default:
        return kit?.image || "";
    }
  };

  if (!kit) {
    return (
      <main className="min-h-screen bg-[#0c0c14] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Kit no encontrado</h1>
          <Link href="/tienda" className="text-[#8e00f7] hover:underline">
            Volver a la tienda
          </Link>
        </div>
      </main>
    );
  }

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
  };

  return (
    <main className="min-h-screen bg-[#0c0c14]">
      <Navbar />

      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-8">
            <Link href="/tienda" className="hover:text-white">Tienda</Link>
            <ChevronRight className="h-4 w-4" />
            <Link href="/tienda#kits" className="hover:text-white">Kits</Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-white">{kit.name}</span>
          </div>

          <div className="grid lg:grid-cols-2 gap-10">
            <div>
              <div className="aspect-video rounded-2xl bg-gradient-to-br from-[#22c55e]/20 to-[#22c55e]/40 overflow-hidden relative">
                <Image
                  src={getDescriptionImage(kit.id)}
                  alt={kit.name}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 flex items-center gap-2">
                  <Package className="h-8 w-8 text-[#22c55e]" />
                  <span className="text-2xl font-bold text-white">{kit.name}</span>
                </div>
              </div>
            </div>

            <div>
              <div className="inline-block px-3 py-1 rounded-full text-sm font-bold mb-4 bg-[#22c55e]/20 text-[#22c55e]">
                {isWhitelistFast ? "WHITELIST" : "KIT"}
              </div>

              <h1 className="text-4xl font-bold text-white mb-4">{kit.name}</h1>
              <p className="text-gray-400 text-lg mb-6">{kit.description}</p>

              <div className="bg-[#12121c] border border-[#1a1a28] rounded-2xl p-6 mb-6">
                <div className="text-gray-400 mb-2">Precio</div>
                {isWhitelistFast ? (
                  <div>
                    <div className="flex items-center gap-2 text-4xl font-bold text-[#8b5cf6] mb-4">
                      <span className="text-white">{convertPrice(whitelistFastKit.priceDollars, selectedCurrency)}</span>
                    </div>
                    <div className="text-gray-500 text-sm">≈ ${whitelistFastKit.priceDollars}.00</div>
                    <CurrencySelector value={selectedCurrency} onChange={setSelectedCurrency} className="mt-4" />
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-4xl font-bold text-[#8e00f7]">
                    {"priceHubCoins" in kit ? kit.priceHubCoins.toLocaleString() : 0}
                    <Image
                      src="/hub-coins.png"
                      alt="Hub Coins"
                      width={48}
                      height={48}
                      className="w-12 h-12"
                    />
                  </div>
                )}
              </div>

              {isWhitelistFast ? (
                <div className="mb-2">
                  <button
                    type="button"
                    onClick={handleBuyWhitelistFast}
                    disabled={buyingWhitelistFast}
                    className="w-full bg-[#8b5cf6] hover:bg-[#7c3aed] disabled:bg-[#5b3a8f] disabled:cursor-not-allowed text-white py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#8b5cf6]/30"
                  >
                    <Zap className="h-5 w-5" />
                    {buyingWhitelistFast ? "Redirigiendo al pago..." : isAuthenticated ? "OBTENER AHORA" : "INICIAR SESIÓN PARA COMPRAR"}
                  </button>
                  {whitelistFastError && <p className="text-red-400 text-sm mt-2 text-center">{whitelistFastError}</p>}
                </div>
              ) : (
                <>
                  <AddToCartButton 
                    onClick={handleAddToCart}
                    text="Agregar al Carrito"
                  />

                  </>
              )}

              <div className="flex items-center justify-center gap-6 text-sm text-gray-400">
                <div className="flex items-center gap-1">
                  <Shield className="h-4 w-4 text-[#8e00f7]" />
                  Pago seguro
                </div>
                <div className="flex items-center gap-1">
                  <Zap className="h-4 w-4 text-[#8e00f7]" />
                  Entrega instantánea
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12">
            <h2 className="text-2xl font-bold text-white mb-6">Contenido del kit</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {kit.items.map((item, index) => (
                <div
                  key={index}
                  className="bg-[#12121c] border border-[#1a1a28] rounded-xl p-4 flex items-center gap-3"
                >
                  <div className="w-8 h-8 rounded-full bg-[#22c55e]/20 flex items-center justify-center flex-shrink-0">
                    <Check className="h-4 w-4 text-[#22c55e]" />
                  </div>
                  <span className="text-white">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-12 bg-[#12121c] border border-[#1a1a28] rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">Términos importantes</h3>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li>Los kits se compran exclusivamente con Hub Coins.</li>
              <li>Los items se entregan inmediatamente después de la compra.</li>
              <li>Los items del kit no son transferibles a otros usuarios.</li>
              <li>No se realizan reembolsos una vez entregado el kit.</li>
            </ul>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}