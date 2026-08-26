"use client";

import { useParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";
import Image from "next/image";
import { ShoppingBag, ChevronRight, Coins, Shield, Zap, Car, Shirt, Crosshair, ShoppingCart } from "lucide-react";
import { shopItems } from "@/lib/shopData";
import { useCart } from "@/contexts/CartContext";
import AddToCartButton from "@/components/AddToCartButton";
import BuyWithHubCoinsButton from "@/components/BuyWithHubCoinsButton";

const typeIcons = {
  vehicle: Car,
  weapon: Crosshair,
  clothing: Shirt,
  accessory: ShoppingBag,
  other: ShoppingBag,
};

export default function ItemPage() {
  const params = useParams();
  const item = shopItems.find(i => i.id === params.id);
  const { addItem } = useCart();

  if (!item) {
    return (
      <main className="min-h-screen bg-[var(--background-alt)] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Artículo no encontrado</h1>
          <Link href="/tienda" className="text-[#8e00f7] hover:underline">
            Volver a la tienda
          </Link>
        </div>
      </main>
    );
  }

  const TypeIcon = typeIcons[item.type];

  const handleAddToCart = () => {
    addItem({
      id: item.id,
      type: "item",
      name: item.name,
      priceHubCoins: item.priceHubCoins,
      quantity: 1,
      image: item.image,
    });
  };

  return (
    <main className="min-h-screen bg-[var(--background-alt)]">
      <Navbar />

      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-2 text-sm text-[var(--text-muted)] mb-8">
            <Link href="/tienda" className="hover:text-white">Tienda</Link>
            <ChevronRight className="h-4 w-4" />
            <Link href="/tienda#items" className="hover:text-white">Artículos</Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-white">{item.name}</span>
          </div>

          <div className="grid lg:grid-cols-2 gap-10">
            <div>
              <div className="aspect-square rounded-2xl bg-gradient-to-br from-[#1a1a28] to-[#12121c] overflow-hidden relative">
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 flex items-center gap-2">
                  <TypeIcon className="h-8 w-8 text-[#8e00f7]" />
                  <span className="text-xl font-bold text-white">{item.name}</span>
                </div>
              </div>
            </div>

            <div>
              <div className="inline-block px-3 py-1 rounded-full text-sm font-bold mb-4 bg-[#8e00f7]/20 text-[#8e00f7] capitalize">
                {item.category}
              </div>

              <h1 className="text-4xl font-bold text-white mb-4">{item.name}</h1>
              <p className="text-[var(--text-muted)] text-lg mb-6">{item.description}</p>

              <div className="bg-[var(--card-bg)] border border-[var(--card-border-soft)] rounded-2xl p-6 mb-6">
                <div className="text-[var(--text-muted)] mb-2">Precio</div>
                <div className="flex items-center gap-2 text-4xl font-bold text-[#8e00f7]">
                  <Coins className="h-8 w-8" />
                  {item.priceHubCoins.toLocaleString()}
                  <span className="text-lg text-[var(--text-muted)]">Hub Coins</span>
                </div>
              </div>

              <AddToCartButton 
                onClick={handleAddToCart}
                text="Agregar al Carrito"
              />

              <BuyWithHubCoinsButton 
                priceInHubCoins={item.priceHubCoins}
                itemName={item.name}
                itemType={item.type}
                itemId={item.id}
              />

              <div className="flex items-center justify-center gap-6 text-sm text-[var(--text-muted)]">
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

          <div className="mt-12 bg-[var(--card-bg)] border border-[var(--card-border-soft)] rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">Términos importantes</h3>
            <ul className="space-y-2 text-[var(--text-muted)] text-sm">
              <li>Los artículos se compran exclusivamente con Hub Coins.</li>
              <li>El artículo se entrega inmediatamente después de la compra.</li>
              <li>Los artículos no son transferibles a otros usuarios.</li>
              <li>No se realizan reembolsos una vez entregado el artículo.</li>
            </ul>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}