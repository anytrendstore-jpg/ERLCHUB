"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ShoppingCart, Plus, Minus, Trash2, ArrowRight, CreditCard, Shield, Clock, Globe, CheckCircle, AlertCircle, X } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useCart } from "@/contexts/CartContext";
import { useWompi } from "@/hooks/useWompi";
import { useDiscordAuth } from "@/hooks/useDiscordAuth";
import { useHubCoins } from "@/hooks/useHubCoins";
import WompiWidget from "@/components/WompiWidget";
import { currencies, convertPrice } from "@/lib/shopData";

export default function CartPage() {
  const { items, removeItem, updateQuantity, getTotalPrice, clearCart } = useCart();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [isProcessingHubCoins, setIsProcessingHubCoins] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState(currencies[0]);
  const [selectedPayment, setSelectedPayment] = useState('');
  const [discountCode, setDiscountCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<any>(null);
  const [validatingDiscount, setValidatingDiscount] = useState(false);
  const [referralCode, setReferralCode] = useState('');
  const [appliedReferral, setAppliedReferral] = useState<any>(null);
  const [referrerName, setReferrerName] = useState<string>('');
  const { generatePaymentReference, convertToCents, checkTransactionStatus, isLoading: wompiLoading, error: wompiError, clearError } = useWompi();
  const { isAuthenticated, user } = useDiscordAuth();
  const { balance: hubCoinsBalance, createTransaction } = useHubCoins();
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const notify = (type: 'success' | 'error', text: string) => setNotice({ type, text });

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
  const getFinalTotals = () => {
    let finalUsdTotal = usdTotal;
    
    if (appliedDiscount && usdTotal > 0) {
      finalUsdTotal = usdTotal * (1 - appliedDiscount.discountPercentage / 100);
    }
    
    return { finalUsdTotal, finalHubCoinsTotal: hubCoinsTotal };
  };

  const { finalUsdTotal, finalHubCoinsTotal } = getFinalTotals();
  const hasDiscount = appliedDiscount !== null;
  const validateDiscountCode = async () => {
    if (!discountCode.trim()) {
      setAppliedDiscount(null);
      return;
    }

    setValidatingDiscount(true);
    try {
      const response = await fetch('/api/discounts/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: discountCode.trim() })
      });

      const result = await response.json();

      if (result.success) {
        setAppliedDiscount(result.discountCode);
        notify('success', `Código aplicado: ${result.discountCode.discountPercentage}% de descuento`);
      } else {
        setAppliedDiscount(null);
        notify('error', 'Código de descuento inválido o expirado');
      }
    } catch (error) {
      console.error('Error validating discount code:', error);
      setAppliedDiscount(null);
      notify('error', 'Error al validar el código de descuento');
    } finally {
      setValidatingDiscount(false);
    }
  };

  const getConvertedPrice = (usdAmount: number) => {
    return convertPrice(usdAmount, selectedCurrency);
  };

  const handleQuantityChange = (id: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(id);
    } else {
      updateQuantity(id, newQuantity);
    }
  };

  const fetchReferrerName = async (code: string) => {
    try {
      const response = await fetch(`/api/referrals/manage?userId=${user?.id}&lookupCode=${code}`);
      const result = await response.json();
      
      if (result.success && result.referrerName) {
        setReferrerName(result.referrerName);
        return result.referrerName;
      }
      return 'Referido';
    } catch (error) {
      console.error('Error fetching referrer name:', error);
      return 'Referido';
    }
  };

  const [paymentData, setPaymentData] = useState<{
    reference: string;
    signature: string;
    amountInCents: number;
  } | null>(null);
  const [showWompiWidget, setShowWompiWidget] = useState(false);


  const handleCheckout = async () => {
    if (items.length === 0) return;
    
    if (!isAuthenticated) {
      window.location.href = 'https://www.erlchub.pro/ingresar';
      return;
    }
    
    setIsProcessing(true);
    clearError();

    try {
      const { finalUsdTotal } = getFinalTotals();
      const reference = generatePaymentReference({
        name: `Compra ERLC HUB - ${items.map(item => item.name).join(', ')}`,
        description: `Compra de ${items.length} producto(s) en ERLC HUB`,
        amount: finalUsdTotal,
        currency: 'USD'
      });

      const amountInCents = convertToCents(finalUsdTotal, 'USD');

      const signatureResponse = await fetch('/api/wompi/generate-signature', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reference,
          amountInCents,
          currency: 'COP'
        })
      });

      const signatureData = await signatureResponse.json();
      
      if (signatureData.success) {
        setPaymentData({
          reference,
          signature: signatureData.signature,
          amountInCents
        });
        setShowWompiWidget(true);
      } else {
        throw new Error(signatureData.error || 'Error generando firma');
      }
      
    } catch (error) {
      notify('error', 'Error al procesar el pago. Por favor intenta nuevamente.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaymentComplete = async (transactionId: string) => {
    setIsProcessing(false);
    setPaymentData(null);
    
    if (appliedReferral && user?.id) {
      try {
        const { finalUsdTotal } = getFinalTotals();
        await fetch('/api/referrals/commission', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            referralCode: appliedReferral.code,
            purchaserId: user.id,
            purchaseAmount: finalUsdTotal
          })
        });
      } catch (error) {
        console.error('Error processing referral commission:', error);
      }
    }
    
    clearCart();
    window.location.href = '/tienda/checkout/success';
  };

  const handlePaymentError = (error: string) => {
    setIsProcessing(false);
    setPaymentData(null);
    
    if (paymentData && user?.id) {
      const saveCancelledTransaction = async () => {
        try {
          await fetch('/api/hub-coins/transactions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId: user.id,
              amount: usdTotal,
              type: 'purchase',
              description: `Compra cancelada: ${items.map(item => item.name).join(', ')}`,
              status: 'cancelled',
              metadata: {
                error: error,
                items: items,
                paymentData: paymentData
              }
            })
          });
        } catch (saveError) {
          console.error('Error saving cancelled transaction:', saveError);
        }
      };
      
      saveCancelledTransaction();
    }
    
    notify('error', 'Error en el pago: ' + error);
  };

  const handleHubCoinsPayment = async () => {
    if (items.length === 0) return;

    if (!isAuthenticated || !user?.id) {
      notify('error', 'Debes iniciar sesión para pagar con Hub Coins');
      return;
    }

    const hubCoinsItems = items.filter(item => item.priceHubCoins);
    const totalHubCoins = hubCoinsItems.reduce((acc, item) => acc + (item.priceHubCoins || 0) * item.quantity, 0);

    if (totalHubCoins === 0) {
      notify('error', 'No hay items para pagar con Hub Coins');
      return;
    }

    if (hubCoinsBalance < totalHubCoins) {
      notify('error', `No tienes suficientes Hub Coins. Necesitas ${totalHubCoins} pero solo tienes ${hubCoinsBalance}`);
      return;
    }

    setIsProcessingHubCoins(true);

    try {

      const response = await fetch('/api/process-hubcoins-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          items: hubCoinsItems,
          totalHubCoins
        })
      });

      const result = await response.json();

      if (result.success) {
        if (appliedReferral && user?.id) {
          try {
            await fetch('/api/referrals/commission', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                referralCode: appliedReferral.code,
                purchaserId: user.id,
                purchaseAmount: totalHubCoins 
              })
            });
          } catch (error) {
            console.error('Error processing referral commission:', error);
          }
        }

        hubCoinsItems.forEach(item => removeItem(item.id));
        
        if (createTransaction) {
          await createTransaction(-totalHubCoins, 'purchase', `Compra de kit: ${hubCoinsItems.map(item => item.name).join(', ')}`);
        }

        notify('success', typeof result.newCharacterSlots === 'number'
          ? `¡Pago procesado! Ahora tenés ${result.newCharacterSlots} cupos de personaje.`
          : '¡Pago con Hub Coins procesado exitosamente!');

        const remainingItems = items.filter(item => !item.priceHubCoins);
        if (remainingItems.length > 0) {
          handleCheckout();
        } else {
          clearCart();
        }
      } else {
        notify('error', 'Error: ' + (result.error || 'Error procesando pago con Hub Coins'));
      }
    } catch (error) {
      console.error('Error en pago con Hub Coins:', error);
      notify('error', 'Error procesando pago con Hub Coins. Por favor intenta nuevamente.');
    } finally {
      setIsProcessingHubCoins(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[var(--background)] pt-20">
        <Navbar />
        
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <div className="w-24 h-24 rounded-full bg-[#8e00f7]/20 flex items-center justify-center mx-auto mb-6">
              <ShoppingCart className="h-12 w-12 text-[#8e00f7]" />
            </div>
            
            <h1 className="text-3xl font-bold text-[var(--foreground)] mb-4">Tu carrito está vacío</h1>
            <p className="text-[var(--text-muted)] text-lg mb-8">
              Parece que aún no has agregado productos a tu carrito
            </p>
            
            <Link
              href="/tienda"
              className="inline-flex items-center gap-2 bg-[#8e00f7] hover:bg-[#7a00d4] text-white px-6 py-3 rounded-xl font-medium transition-all hover:scale-105"
            >
              <ArrowRight className="h-5 w-5" />
              Ir a la Tienda
            </Link>
          </div>
        </div>
        
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)] pt-20">
      <Navbar />

      {notice && (
        <div className="sticky top-16 z-40 px-4 pt-3">
          <div className={`max-w-6xl mx-auto flex items-center gap-3 rounded-xl px-4 py-3 border backdrop-blur-xl ${notice.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-red-500/10 border-red-500/30 text-red-300'}`}>
            {notice.type === 'success' ? <CheckCircle className="h-5 w-5 flex-shrink-0" /> : <AlertCircle className="h-5 w-5 flex-shrink-0" />}
            <p className="text-sm flex-1">{notice.text}</p>
            <button onClick={() => setNotice(null)} className="opacity-60 hover:opacity-100 transition-opacity">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-[var(--foreground)] mb-2">Carrito de Compras</h1>
              <p className="text-[var(--text-muted)]">
                {items.length} {items.length === 1 ? 'producto' : 'productos'} en tu carrito
              </p>
            </div>
            
            <button
              onClick={clearCart}
              className="text-red-400 hover:text-red-300 transition-colors flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Vaciar Carrito
            </button>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => (
                <div key={item.id} className="bg-[var(--card-bg)] border border-[var(--card-border-soft)] rounded-xl p-6">
                  <div className="flex gap-4">
                    <div className="w-20 h-20 rounded-lg bg-[var(--card-bg-2)] overflow-hidden flex-shrink-0">
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={item.name}
                          width={80}
                          height={80}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingCart className="h-8 w-8 text-[#8e00f7]" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="text-[var(--foreground)] font-semibold text-lg">{item.name}</h3>
                          <p className="text-[var(--text-muted)] text-sm">{item.category}</p>
                        </div>
                        
                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-red-400 hover:text-red-300 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center bg-[var(--card-bg-2)] rounded-lg">
                            <button
                              onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                              className="p-2 hover:bg-[#2a2a3a] transition-colors rounded-l-lg"
                            >
                              <Minus className="h-4 w-4 text-[var(--text-muted)]" />
                            </button>
                            <span className="px-3 py-1 text-[var(--foreground)] font-medium">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                              className="p-2 hover:bg-[#2a2a3a] transition-colors rounded-r-lg"
                            >
                              <Plus className="h-4 w-4 text-[var(--text-muted)]" />
                            </button>
                          </div>
                        </div>

                        <div className="text-right">
                          {item.priceHubCoins ? (
                            <>
                              <div className="text-[#fbbf24] font-bold text-lg flex items-center gap-1">
                                <Image
                                  src="/hub-coins.png"
                                  alt="Hub Coins"
                                  width={12}
                                  height={12}
                                  className="w-3 h-3"
                                />
                                {item.priceHubCoins * item.quantity}
                              </div>
                              {item.quantity > 1 && (
                                <div className="text-[var(--text-muted)] text-sm flex items-center gap-1">
                                  <Image
                                    src="/hub-coins.png"
                                    alt="Hub Coins"
                                    width={10}
                                    height={10}
                                    className="w-2.5 h-2.5"
                                  />
                                  {item.priceHubCoins} c/u
                                </div>
                              )}
                            </>
                          ) : (
                            <>
                              <div className="text-[#8e00f7] font-bold text-lg">
                                {item.quantity} x {getConvertedPrice(item.priceUSD || item.price || 0)}
                              </div>
                              {appliedDiscount && (
                                <div className="text-green-400 text-sm">
                                  ({appliedDiscount.discountPercentage}% DTO.)
                                </div>
                              )}
                              {item.quantity > 1 && (
                                <div className="text-[var(--text-muted)] text-sm">
                                  {getConvertedPrice(item.priceUSD || item.price || 0)} c/u
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>

                      {item.details && (
                        <div className="mt-3 text-sm text-[var(--text-muted)]">
                          {item.details}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="lg:sticky lg:top-24 bg-[var(--card-bg)] border border-[var(--card-border-soft)] rounded-2xl p-6">
              <h2 className="text-xl font-bold text-[var(--foreground)] mb-6">Resumen del Pedido</h2>

              <div className="space-y-2 mb-6 max-h-48 overflow-y-auto">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between items-center text-sm">
                  <div className="flex-1">
                    <div className="text-[var(--text-muted)]">{item.name}</div>
                    <div className="text-[var(--text-faint)] text-xs">
                      {item.quantity} × {item.priceHubCoins ? `${item.priceHubCoins} Hub Coins` : `$${item.priceUSD || item.price || 0}`}
                    </div>
                  </div>
                  <div className="text-right">
                    {item.priceHubCoins ? (
                      <div className="text-[#fbbf24] font-medium flex items-center gap-1">
                        <Image
                          src="/hub-coins.png"
                          alt="Hub Coins"
                          width={16}
                          height={16}
                          className="w-4 h-4"
                        />
                        {item.priceHubCoins * item.quantity}
                      </div>
                    ) : (
                      <>
                        <div className="text-[#8e00f7] font-medium">
                          {item.quantity} x {getConvertedPrice(item.priceUSD || item.price || 0)}
                        </div>
                        {hasDiscount && (
                          <div className="text-green-400 text-sm">
                            ({appliedDiscount.discountPercentage}% DTO.)
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-3 mb-6 border-t border-[var(--card-border-soft)] pt-4">
                  {usdTotal > 0 && (
                    <div className="flex justify-between text-[var(--text-muted)]">
                      <span>Subtotal USD</span>
                      <span>{getConvertedPrice(usdTotal)}</span>
                    </div>
                  )}
                  {hubCoinsTotal > 0 && (
                    <div className="flex justify-between text-[var(--text-muted)]">
                      <span>Subtotal Hub Coins</span>
                      <span className="flex items-center gap-1">
                        <Image
                          src="/hub-coins.png"
                          alt="Hub Coins"
                          width={12}
                          height={12}
                          className="w-3 h-3"
                        />
                        {hubCoinsTotal}
                      </span>
                    </div>
                  )}

                  {usdTotal > 0 && (
                    <div className="bg-[var(--card-bg)] border border-[var(--card-border-soft)] rounded-xl p-4 mb-4">
                      <div className="text-[var(--text-muted)] mb-3">Código de Descuento</div>
                      <div className="space-y-3">
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            value={discountCode}
                            onChange={(e) => setDiscountCode(e.target.value)}
                            placeholder="Ingresa tu código de descuento" 
                            className="flex-1 px-3 py-2 bg-[var(--card-bg-2)] border border-[#2a2a3a] rounded-lg text-[var(--foreground)] text-sm focus:outline-none focus:border-[#8e00f7] focus:ring-1 focus:ring-[#8e00f7]/20 transition-all"
                          />
                          <button 
                            onClick={validateDiscountCode}
                            disabled={validatingDiscount}
                            className="bg-[#8e00f7] hover:bg-[#7a00d4] disabled:bg-[#666] text-white font-semibold px-4 py-2 rounded-lg transition-all duration-300 disabled:cursor-not-allowed"
                          >
                            {validatingDiscount ? 'Validando...' : 'Aplicar'}
                          </button>
                        </div>
                        {appliedDiscount && (
                          <div className="text-green-500 text-sm">
                            ✓ Cupón aplicado: {appliedDiscount.discountPercentage}% de descuento
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {usdTotal > 0 && (
                    <div className="bg-[var(--card-bg)] border border-[var(--card-border-soft)] rounded-xl p-4 mb-4">
                      <div className="text-[var(--text-muted)] mb-3">Código de Referido</div>
                      <div className="space-y-3">
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            value={referralCode}
                            onChange={(e) => setReferralCode(e.target.value)}
                            placeholder="Ingresa tu código de referido" 
                            className="flex-1 px-3 py-2 bg-[var(--card-bg-2)] border border-[#2a2a3a] rounded-lg text-[var(--foreground)] text-sm focus:outline-none focus:border-[#8e00f7] focus:ring-1 focus:ring-[#8e00f7]/20 transition-all"
                          />
                          <button 
                            onClick={async () => {
                              if (referralCode.trim()) {
                                const name = await fetchReferrerName(referralCode.trim());
                                setAppliedReferral({ code: referralCode.trim(), referrer: name });
                              }
                            }}
                            disabled={!referralCode.trim() || appliedReferral}
                            className="bg-[#10b981] hover:bg-[#059669] disabled:bg-[#666] text-white font-semibold px-4 py-2 rounded-lg transition-all duration-300 disabled:cursor-not-allowed"
                          >
                            {appliedReferral ? 'Aplicado' : 'Aplicar'}
                          </button>
                        </div>
                        {appliedReferral && (
                          <div className="text-green-500 text-sm">
                            ✓ Referido aplicado de: {appliedReferral.referrer}
                          </div>
                        )}
                      </div>
                    </div>
                )}
                  
                  {hubCoinsTotal > 0 && usdTotal === 0 && (
                    <div className="flex justify-between text-[var(--foreground)] font-bold text-lg border-t border-[var(--card-border-soft)] pt-3">
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
                  )}
                  {usdTotal > 0 && hubCoinsTotal === 0 && (
                    <div className="flex justify-between text-[var(--foreground)] font-bold text-lg border-t border-[var(--card-border-soft)] pt-3">
                      <span>Total</span>
                      <span className="text-[#8e00f7]">{getConvertedPrice(finalUsdTotal)}</span>
                    </div>
                  )}
                  {usdTotal === 0 && hubCoinsTotal > 0 && (
                    <div className="flex justify-between text-[var(--foreground)] font-bold text-lg border-t border-[var(--card-border-soft)] pt-3">
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

                <div className="space-y-3">
                  {usdTotal > 0 && (
                    <button
                      onClick={handleCheckout}
                      disabled={isProcessing || items.length === 0}
                      className="w-full bg-[#8e00f7] hover:bg-[#7a00d4] disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-all duration-300 flex items-center justify-center gap-2"
                    >
                      {isProcessing ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                          Procesando...
                        </>
                      ) : (
                        <>
                          <CreditCard className="h-5 w-5" />
                          {isAuthenticated ? "Proceder al Pago" : "INICIAR SESIÓN PARA PAGAR"}
                        </>
                      )}
                    </button>
                  )}

                  {hubCoinsTotal > 0 && (
                    <button
                      onClick={handleHubCoinsPayment}
                      disabled={isProcessingHubCoins || !isAuthenticated || hubCoinsBalance < hubCoinsTotal}
                      className="w-full bg-[#fbbf24] hover:bg-[#f59e0b] disabled:bg-gray-600 disabled:cursor-not-allowed text-black font-semibold py-3 rounded-lg transition-all duration-300 flex items-center justify-center gap-2"
                    >
                      {isProcessingHubCoins ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black" />
                          Procesando...
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="h-5 w-5" />
                          {isAuthenticated ? "Comprar con Hub Coins" : "INICIAR SESIÓN"}
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
  );
}