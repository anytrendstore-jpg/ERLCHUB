"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ShoppingCart, CreditCard, Shield, Clock, ArrowLeft, Check, AlertCircle } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useCart } from "@/contexts/CartContext";

export default function CheckoutPage() {
  const { items, getTotalPrice, clearCart } = useCart();
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    robloxUsername: '',
    discordUsername: '',
    notes: ''
  });

  const getTotals = () => {
    const usdTotal = items
      .filter(item => item.priceUSD || item.price)
      .reduce((acc, item) => acc + (item.priceUSD || item.price || 0) * item.quantity, 0);
    
    const hubCoinsTotal = items
      .filter(item => item.priceHubCoins)
      .reduce((acc, item) => acc + (item.priceHubCoins || 0) * item.quantity, 0);
    
    return { usdTotal, hubCoinsTotal };
  };

  const { usdTotal, hubCoinsTotal } = getTotals();

  const paymentMethods = [
    {
      id: 'hubcoins',
      name: 'Hub Coins',
      description: 'Paga con tus Hub Coins acumulados',
      icon: '🪙',
      fee: 0
    },
    {
      id: 'card',
      name: 'Tarjeta de Crédito/Débito',
      description: 'Visa, Mastercard, American Express',
      icon: '💳',
      fee: 0
    },
    {
      id: 'paypal',
      name: 'PayPal',
      description: 'Pago rápido y seguro con PayPal',
      icon: '🅿️',
      fee: 0
    },
    {
      id: 'crypto',
      name: 'Criptomonedas',
      description: 'Bitcoin, Ethereum, USDT',
      icon: '₿',
      fee: 0
    },
    {
      id: 'ticket',
      name: 'Tickets de Pago',
      description: 'Nequi, Daviplata, PSE',
      icon: '🎫',
      fee: 0
    }
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPayment) {
      alert('Por favor selecciona un método de pago');
      return;
    }

    if (!formData.email || !formData.robloxUsername) {
      alert('Por favor completa los campos requeridos');
      return;
    }

    setIsProcessing(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      window.location.href = '/tienda/checkout/success';
    } catch (error) {
      console.error('Error processing payment:', error);
      alert('Error al procesar el pago. Por favor intenta nuevamente.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[#0a0a12] pt-20">
        <Navbar />
        
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <div className="w-24 h-24 rounded-full bg-[#8e00f7]/20 flex items-center justify-center mx-auto mb-6">
              <ShoppingCart className="h-12 w-12 text-[#8e00f7]" />
            </div>
            
            <h1 className="text-3xl font-bold text-white mb-4">Tu carrito está vacío</h1>
            <p className="text-gray-400 text-lg mb-8">
              Agrega productos a tu carrito antes de continuar con el checkout
            </p>
            
            <Link
              href="/tienda"
              className="inline-flex items-center gap-2 bg-[#8e00f7] hover:bg-[#7a00d4] text-white px-6 py-3 rounded-xl font-medium transition-all hover:scale-105"
            >
              Ir a la Tienda
            </Link>
          </div>
        </div>
        
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a12] pt-20">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Link
              href="/tienda/carrito"
              className="text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Checkout</h1>
              <p className="text-gray-400">Completa tu información y método de pago</p>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-[#12121c] border border-[#1a1a28] rounded-xl p-6">
                <h2 className="text-xl font-bold text-white mb-6">Información del Cliente</h2>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-white mb-2">Email *</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-[#1a1a28] border border-[#2a2a3a] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#8e00f7]"
                        placeholder="tu@email.com"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-white mb-2">Usuario de Roblox *</label>
                      <input
                        type="text"
                        name="robloxUsername"
                        value={formData.robloxUsername}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-[#1a1a28] border border-[#2a2a3a] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#8e00f7]"
                        placeholder="Tu usuario de Roblox"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-white mb-2">Usuario de Discord</label>
                    <input
                      type="text"
                      name="discordUsername"
                      value={formData.discordUsername}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-[#1a1a28] border border-[#2a2a3a] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#8e00f7]"
                      placeholder="Tu usuario de Discord (opcional)"
                    />
                  </div>

                  <div>
                    <label className="block text-white mb-2">Notas Adicionales</label>
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-[#1a1a28] border border-[#2a2a3a] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#8e00f7] h-24 resize-none"
                      placeholder="Algún comentario especial para tu pedido..."
                    />
                  </div>
                </form>
              </div>

              <div className="bg-[#12121c] border border-[#1a1a28] rounded-xl p-6">
                <h2 className="text-xl font-bold text-white mb-6">Método de Pago</h2>
                
                <div className="grid gap-3">
                  {paymentMethods.map((method) => (
                    <div
                      key={method.id}
                      onClick={() => setSelectedPayment(method.id)}
                      className={`border rounded-lg p-4 cursor-pointer transition-all ${
                        selectedPayment === method.id
                          ? 'border-[#8e00f7] bg-[#8e00f7]/10'
                          : 'border-[#2a2a3a] hover:border-[#3a3a4a]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="text-2xl">{method.icon}</div>
                          <div>
                            <div className="text-white font-medium">{method.name}</div>
                            <div className="text-gray-400 text-sm">{method.description}</div>
                          </div>
                        </div>
                        
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          selectedPayment === method.id
                            ? 'border-[#8e00f7] bg-[#8e00f7]'
                            : 'border-[#2a2a3a]'
                        }`}>
                          {selectedPayment === method.id && (
                            <Check className="h-3 w-3 text-white" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-[#12121c] border border-[#1a1a28] rounded-xl p-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-[#8e00f7] mt-0.5 flex-shrink-0" />
                  <div className="text-gray-400 text-sm">
                    <p className="mb-2">
                      Al completar esta compra, aceptas nuestros términos y condiciones:
                    </p>
                    <ul className="space-y-1 text-xs">
                      <li>• Todos los productos son digitales y se entregan inmediatamente</li>
                      <li>• Los pagos son procesados de forma segura</li>
                      <li>• No hay reembolsos una vez entregado el producto</li>
                      <li>• Nos reservamos el derecho de cancelar pedidos sospechosos</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="bg-[#12121c] border border-[#1a1a28] rounded-xl p-6 sticky top-24">
                <h2 className="text-xl font-bold text-white mb-6">Resumen del Pedido</h2>
                
                <div className="space-y-3 mb-6 max-h-64 overflow-y-auto">
                  {items.map((item) => (
                    <div key={item.id} className="flex justify-between items-center">
                      <div className="flex-1">
                        <div className="text-white text-sm">{item.name}</div>
                        <div className="text-gray-400 text-xs">
                          {item.quantity} × {item.priceHubCoins ? `${item.priceHubCoins} Hub Coins` : `$${item.priceUSD || item.price || 0}`}
                        </div>
                      </div>
                      <div className="text-right">
                        {item.priceHubCoins ? (
                          <div className="text-[#fbbf24] font-medium flex items-center gap-1">
                            <Image
                              src="/hub-coins.png"
                              alt="Hub Coins"
                              width={12}
                              height={12}
                              className="w-3 h-3"
                            />
                            {item.priceHubCoins * item.quantity}
                          </div>
                        ) : (
                          <div className="text-[#8e00f7] font-medium">
                            ${(item.priceUSD || item.price || 0) * item.quantity}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-[#1a1a28] pt-4 space-y-3 mb-6">
                  {usdTotal > 0 && (
                    <div className="flex justify-between text-gray-400">
                      <span>Subtotal USD</span>
                      <span>${usdTotal}</span>
                    </div>
                  )}
                  {hubCoinsTotal > 0 && (
                    <div className="flex justify-between text-gray-400">
                      <span>Subtotal Hub Coins</span>
                      <span className="flex items-center gap-1">
                        <Image
                          src="/hub-coins.png"
                          alt="Hub Coins"
                          width={16}
                          height={16}
                          className="w-4 h-4"
                        />
                        {hubCoinsTotal}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-gray-400">
                    <span>Envío</span>
                    <span>Gratis</span>
                  </div>
                  <div className="border-t border-[#1a1a28] pt-3">
                    {(usdTotal > 0 && hubCoinsTotal > 0) && (
                      <>
                        <div className="flex justify-between text-white font-bold text-lg mb-2">
                          <span>Total USD</span>
                          <span className="text-[#8e00f7]">${usdTotal}</span>
                        </div>
                        <div className="flex justify-between text-white font-bold text-lg">
                          <span>Total Hub Coins</span>
                          <span className="text-[#fbbf24] flex items-center gap-1">
                            <Image
                              src="/hub-coins.png"
                              alt="Hub Coins"
                              width={20}
                              height={20}
                              className="w-5 h-5"
                            />
                            {hubCoinsTotal}
                          </span>
                        </div>
                      </>
                    )}
                    {usdTotal > 0 && hubCoinsTotal === 0 && (
                      <div className="flex justify-between text-white font-bold text-lg">
                        <span>Total</span>
                        <span className="text-[#8e00f7]">${usdTotal}</span>
                      </div>
                    )}
                    {usdTotal === 0 && hubCoinsTotal > 0 && (
                      <div className="flex justify-between text-white font-bold text-lg">
                        <span>Total</span>
                        <span className="text-[#fbbf24] flex items-center gap-1">
                          <Image
                            src="/hub-coins.png"
                            alt="Hub Coins"
                            width={20}
                            height={20}
                            className="w-5 h-5"
                          />
                          {hubCoinsTotal}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={isProcessing}
                  className="w-full bg-[#8e00f7] hover:bg-[#7a00d4] disabled:bg-[#4a4a5a] text-white px-6 py-4 rounded-xl font-bold transition-all hover:scale-105 disabled:scale-100 flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                      Procesando Pago...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-5 w-5" />
                      Completar Compra
                    </>
                  )}
                </button>

                <div className="mt-6 space-y-3">
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Shield className="h-4 w-4 text-[#8e00f7]" />
                    <span>Pago 100% Seguro</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Clock className="h-4 w-4 text-[#8e00f7]" />
                    <span>Entrega Inmediata</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}