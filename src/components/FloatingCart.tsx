"use client";

import { useState } from "react";
import Link from "next/link";
import { ShoppingCart, X, Plus, Minus } from "lucide-react";
import { useCart } from "@/contexts/CartContext";

export default function FloatingCart() {
  const { items, removeItem, updateQuantity, getTotalPrice, totalItems, isOpen, toggleCart, closeCart } = useCart();
  const [isExpanded, setIsExpanded] = useState(false);

  if (items.length === 0) {
    return null;
  }

  return (
    <>
      {/* Floating Cart Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={toggleCart}
          className="relative w-16 h-16 bg-[#8e00f7] hover:bg-[#7a00d4] text-white rounded-full shadow-lg shadow-[#8e00f7]/30 hover:shadow-[#8e00f7]/50 transition-all duration-300 hover:scale-110 active:scale-95 flex items-center justify-center"
        >
          <ShoppingCart className="h-6 w-6" />
          {totalItems > 0 && (
            <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
              {totalItems > 9 ? "9+" : totalItems}
            </span>
          )}
        </button>
      </div>

      {/* Cart Preview */}
      {isOpen && (
        <div className="fixed inset-0 z-50">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={closeCart}
          />

          {/* Cart Panel */}
          <div className="absolute right-0 top-0 h-full w-full max-w-md bg-[#12121c] border-l border-[#1a1a28] shadow-2xl">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-[#1a1a28]">
                <h3 className="text-white font-bold text-lg">Carrito ({totalItems})</h3>
                <button
                  onClick={closeCart}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Items */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {items.map((item) => (
                  <div key={item.id} className="bg-[#1a1a28] rounded-lg p-3">
                    <div className="flex items-start gap-3">
                      {/* Product Image */}
                      <div className="w-12 h-12 rounded-lg bg-[#2a2a3a] overflow-hidden flex-shrink-0">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ShoppingCart className="h-6 w-6 text-[#8e00f7]" />
                          </div>
                        )}
                      </div>

                      {/* Product Details */}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-white font-medium text-sm truncate">{item.name}</h4>
                        <p className="text-[#8e00f7] text-sm font-bold">
                          ${(item.priceUSD || item.price || 0) * item.quantity}
                        </p>
                        
                        {/* Quantity Controls */}
                        <div className="flex items-center gap-2 mt-2">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="w-6 h-6 rounded bg-[#2a2a3a] hover:bg-[#3a3a4a] text-gray-400 hover:text-white transition-colors flex items-center justify-center"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="text-white text-sm font-medium w-8 text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="w-6 h-6 rounded bg-[#2a2a3a] hover:bg-[#3a3a4a] text-gray-400 hover:text-white transition-colors flex items-center justify-center"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-red-400 hover:text-red-300 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="border-t border-[#1a1a28] p-4 space-y-3">
                <div className="flex justify-between text-white font-bold">
                  <span>Total:</span>
                  <span className="text-[#8e00f7]">${getTotalPrice()}</span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={closeCart}
                    className="flex-1 px-4 py-2 bg-[#1a1a28] hover:bg-[#2a2a3a] text-white rounded-lg transition-colors"
                  >
                    Seguir Comprando
                  </button>
                  <Link
                    href="/tienda/carrito"
                    onClick={closeCart}
                    className="flex-1 px-4 py-2 bg-[#8e00f7] hover:bg-[#7a00d4] text-white rounded-lg transition-colors text-center font-medium"
                  >
                    Ver Carrito
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
