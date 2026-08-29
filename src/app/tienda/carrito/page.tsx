"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ShoppingCart, Plus, Minus, Trash2, ArrowRight, CreditCard, Shield, Clock, Globe, CheckCircle, AlertCircle, X, Tag, ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useCart } from "@/contexts/CartContext";
import { useWompi } from "@/hooks/useWompi";
import { useDiscordAuth } from "@/hooks/useDiscordAuth";
import { useHubCoins } from "@/hooks/useHubCoins";
import CardTokenizeForm from "@/components/tienda/CardTokenizeForm";
import WompiWidget from "@/components/WompiWidget";
import { convertPrice } from "@/lib/shopData";
import { useExchangeRates } from "@/hooks/useExchangeRates";
import TrustSection from "@/components/tienda/TrustSection";

const TYPE_BADGE: Record<string, { label: string; className: string }> = {
  membership: { label: "Membresía", className: "bg-purple-500/15 text-purple-300 border-purple-500/30" },
  kit: { label: "Kit", className: "bg-blue-500/15 text-blue-300 border-blue-500/30" },
  "hub-coins": { label: "Hub Coins", className: "bg-amber-500/15 text-amber-300 border-amber-500/30" },
  item: { label: "Ítem", className: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" },
};

export default function CartPage() {
  const { items, addItem, removeItem, updateQuantity, getTotalPrice, clearCart } = useCart();
  const { currencies } = useExchangeRates();

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
  const [showCodes, setShowCodes] = useState(false);
  const { clearError } = useWompi();
  const { isAuthenticated, user } = useDiscordAuth();
  const { balance: hubCoinsBalance, createTransaction } = useHubCoins();
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const notify = (type: 'success' | 'error', text: string) => setNotice({ type, text });

  useEffect(() => {
    setSelectedCurrency((prev) => currencies.find((c) => c.code === prev.code) || currencies[0]);
  }, [currencies]);

  useEffect(() => {
    if ((appliedDiscount && !appliedDiscount.autoApplied) || appliedReferral) setShowCodes(true);
  }, [appliedDiscount, appliedReferral]);

  const [firstPurchaseEligible, setFirstPurchaseEligible] = useState<boolean | null>(null);
  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      setFirstPurchaseEligible(null);
      return;
    }
    let cancelled = false;
    fetch(`/api/discounts/first-purchase?userId=${user.id}`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled || !d.success) return;
        setFirstPurchaseEligible(d.eligible);
        setAppliedDiscount((prev: any) => {
          if (prev || !d.eligible) return prev;
          return { code: d.code, discountPercentage: d.discountPercentage, description: 'Descuento de bienvenida', autoApplied: true };
        });
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [isAuthenticated, user?.id]);

  const [recommended, setRecommended] = useState<any[]>([]);
  useEffect(() => {
    fetch('/api/shop/catalog')
      .then((r) => r.json())
      .then((d) => {
        if (!d.success) return;
        const cartIds = new Set(items.map((i) => i.id));
        const pick = (type: string, kind: string, max: number) =>
          (d.catalog[type] || []).filter((c: any) => !cartIds.has(c.id)).slice(0, max).map((c: any) => ({ ...c, _kind: kind }));
        const combined = [
          ...pick('membership', 'membership', 2),
          ...pick('kit', 'kit', 3),
          ...pick('item', 'item', 3),
          ...pick('hub-coins-package', 'hub-coins', 2),
        ];
        setRecommended(combined.slice(0, 10));
      })
      .catch(() => {});
  }, [items.length]);

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
        body: JSON.stringify({ code: discountCode.trim(), userId: user?.id })
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
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  // "card" = tarjeta tokenizada (rápido, pide lo mínimo). "other" = widget alojado de Wompi,
  // para quien quiere pagar con PSE, Nequi, Bancolombia u otro método que no sea tarjeta.
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'other'>('card');


  const handleCheckout = async () => {
    if (items.length === 0) return;

    if (!isAuthenticated || !user?.id) {
      window.location.href = 'https://www.erlchub.pro/ingresar';
      return;
    }

    setIsProcessing(true);
    clearError();

    try {
      // El servidor recalcula el precio real contra el catálogo — acá solo mandamos QUÉ se
      // quiere comprar, nunca un monto (ver /api/shop/checkout/prepare).
      const payableItems = items.filter((item) => item.priceUSD || item.price);
      const checkoutItems = payableItems.map((item) => {
        if (item.type === 'membership') {
          return {
            catalogId: item.id.replace(/-monthly$|-permanent$/, ''),
            quantity: item.quantity,
            paymentType: item.paymentType,
          };
        }
        return { catalogId: item.id, quantity: item.quantity };
      });

      const response = await fetch('/api/shop/checkout/prepare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, items: checkoutItems, discountCode: appliedDiscount?.code }),
      });

      const data = await response.json();

      if (data.success) {
        setPaymentData({
          reference: data.reference,
          signature: data.signature,
          amountInCents: data.amountInCents,
        });
        setPaymentMethod('card');
        setShowPaymentModal(true);
      } else {
        throw new Error(data.error || 'Error iniciando el pago');
      }
    } catch (error) {
      notify('error', error instanceof Error ? error.message : 'Error al procesar el pago. Por favor intenta nuevamente.');
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

  // Cobra la orden ya creada (handleCheckout) con la tarjeta recién tokenizada en el navegador
  // — mismo mecanismo que la renovación automática de membresías, sin pasar por el checkout
  // alojado de Wompi que pide más datos de los necesarios para una compra de la tienda.
  const handleCardTokenized = async (cardToken: string) => {
    if (!paymentData || !user?.id) return;
    setIsProcessing(true);
    try {
      const response = await fetch('/api/shop/checkout/charge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reference: paymentData.reference,
          cardToken,
          customerEmail: `user_${user.id}@erlchub.pro`,
        }),
      });
      const data = await response.json();

      if (!data.success) {
        handlePaymentError(data.error || 'No se pudo procesar el pago');
        return;
      }
      if (data.status === 'DECLINED' || data.status === 'ERROR') {
        handlePaymentError('La tarjeta fue rechazada. Probá con otra.');
        return;
      }

      setShowPaymentModal(false);
      await handlePaymentComplete(data.status);
    } catch (error) {
      handlePaymentError(error instanceof Error ? error.message : 'Error al procesar el pago');
    }
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

  const handleAddRecommended = (c: any) => {
    if (c._kind === 'kit' || c._kind === 'item') {
      addItem({
        id: c.id,
        type: c._kind,
        name: c.name,
        priceHubCoins: c.priceHubCoins,
        quantity: 1,
        category: c.category,
        details: c.description,
        image: c.image,
      });
    } else if (c._kind === 'hub-coins') {
      addItem({
        id: c.id,
        type: 'hub-coins',
        name: `${c.coins.toLocaleString()} Hub Coins`,
        priceUSD: c.priceUSD,
        quantity: 1,
        bonus: c.bonus,
        coins: c.coins,
        image: '/hub-coins.png',
      });
    }
    notify('success', `${c._kind === 'hub-coins' ? `${c.coins.toLocaleString()} Hub Coins` : c.name} agregado al carrito`);
  };

  const renderWelcomeBanner = () => {
    if (firstPurchaseEligible === false) return null;
    return (
      <div className="flex items-center gap-3 bg-gradient-to-r from-[#8e00f7]/15 to-emerald-500/10 border border-[#8e00f7]/30 rounded-xl px-4 py-3 mb-6">
        <div className="w-9 h-9 rounded-lg bg-[#8e00f7]/25 flex items-center justify-center flex-shrink-0">
          <Sparkles className="h-4.5 w-4.5 text-[#8e00f7]" />
        </div>
        <p className="text-sm text-[var(--foreground)]">
          <strong className="text-[#8e00f7]">15% OFF</strong> en tu primera compra
          {isAuthenticated
            ? " — ya está aplicado automáticamente a tu carrito."
            : ". Iniciá sesión y se aplica solo, sin códigos que recordar."}
        </p>
      </div>
    );
  };

  const renderRecommended = () => {
    if (recommended.length === 0) return null;
    return (
      <div className="mt-12">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-5 w-5 text-[#8e00f7]" />
          <h2 className="text-xl font-bold text-[var(--foreground)]">Otros artículos que te pueden interesar</h2>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-3 -mx-1 px-1">
          {recommended.map((c) => {
            const badge = TYPE_BADGE[c._kind] || TYPE_BADGE.item;
            return (
              <div
                key={c.id}
                className="flex-shrink-0 w-48 bg-[var(--card-bg)] border border-[var(--card-border-soft)] hover:border-[#8e00f7]/40 rounded-xl overflow-hidden transition-colors group"
              >
                <div className="h-28 bg-[var(--card-bg-2)] relative overflow-hidden">
                  {c._kind === 'hub-coins' ? (
                    <div className="w-full h-full flex items-center justify-center">
                      <Image src="/hub-coins.png" alt="Hub Coins" width={40} height={40} className="w-10 h-10" />
                    </div>
                  ) : c.image ? (
                    <Image
                      src={c.image}
                      alt={c.name || ''}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ShoppingCart className="h-8 w-8 text-[#8e00f7]" />
                    </div>
                  )}
                  <span className={`absolute top-2 left-2 text-[10px] font-semibold px-2 py-0.5 rounded-full border backdrop-blur-sm ${badge.className}`}>
                    {badge.label}
                  </span>
                </div>
                <div className="p-3">
                  <h3 className="text-[var(--foreground)] font-semibold text-sm truncate mb-2">
                    {c._kind === 'hub-coins' ? `${c.coins.toLocaleString()} Hub Coins` : c.name}
                  </h3>
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-bold">
                      {c._kind === 'kit' || c._kind === 'item' ? (
                        <span className="text-[#fbbf24] flex items-center gap-1">
                          <Image src="/hub-coins.png" alt="" width={12} height={12} className="w-3 h-3" />
                          {c.priceHubCoins}
                        </span>
                      ) : c._kind === 'membership' ? (
                        <span className="text-[#8e00f7]">{getConvertedPrice(c.priceMonthly)}/mes</span>
                      ) : (
                        <span className="text-[#8e00f7]">{getConvertedPrice(c.priceUSD)}</span>
                      )}
                    </div>
                    {c._kind === 'membership' ? (
                      <Link
                        href={`/tienda/membresia/${c.id}`}
                        className="text-xs bg-[#8e00f7]/15 hover:bg-[#8e00f7]/25 text-[#8e00f7] font-medium px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap"
                      >
                        Ver
                      </Link>
                    ) : (
                      <button
                        onClick={() => handleAddRecommended(c)}
                        className="text-xs bg-[#8e00f7] hover:bg-[#7a00d4] text-white font-medium px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap"
                      >
                        Agregar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[var(--background)] pt-20">
        <Navbar />

        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <div className="text-left mb-8">{renderWelcomeBanner()}</div>

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

          <div className="max-w-5xl mx-auto">
            {renderRecommended()}
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
          {renderWelcomeBanner()}

          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-[var(--foreground)] mb-2">Carrito de Compras</h1>
              <p className="text-[var(--text-muted)]">
                {items.length} {items.length === 1 ? 'producto' : 'productos'} en tu carrito
              </p>
            </div>

            <button
              onClick={clearCart}
              className="flex items-center gap-1.5 text-xs sm:text-sm text-[var(--text-faint)] hover:text-red-400 border border-[var(--card-border-soft)] hover:border-red-400/40 rounded-lg px-3 py-2 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Vaciar carrito
            </button>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => {
                const badge = TYPE_BADGE[item.type] || TYPE_BADGE.item;
                return (
                <div key={item.id} className="bg-[var(--card-bg)] border border-[var(--card-border-soft)] hover:border-[#8e00f7]/30 rounded-2xl p-5 transition-colors">
                  <div className="flex gap-4">
                    <div className="w-24 h-24 rounded-xl bg-[var(--card-bg-2)] overflow-hidden flex-shrink-0 relative">
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingCart className="h-8 w-8 text-[#8e00f7]" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2 mb-1.5">
                        <div className="min-w-0">
                          <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full border mb-1.5 ${badge.className}`}>
                            {badge.label}
                          </span>
                          <h3 className="text-[var(--foreground)] font-semibold text-lg truncate">{item.name}</h3>
                          {item.category && <p className="text-[var(--text-muted)] text-sm">{item.category}</p>}
                        </div>

                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-[var(--text-faint)] hover:text-red-400 hover:bg-red-400/10 p-1.5 rounded-lg transition-colors flex-shrink-0"
                          aria-label="Eliminar del carrito"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="flex justify-between items-center mt-3">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center bg-[var(--card-bg-2)] border border-[var(--card-border-soft)] rounded-lg">
                            <button
                              onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                              className="p-2 hover:bg-[#2a2a3a] transition-colors rounded-l-lg"
                            >
                              <Minus className="h-4 w-4 text-[var(--text-muted)]" />
                            </button>
                            <span className="px-3 py-1 text-[var(--foreground)] font-medium min-w-[2rem] text-center">
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
                              <div className="text-[#fbbf24] font-bold text-lg flex items-center gap-1 justify-end">
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
                                <div className="text-[var(--text-muted)] text-sm flex items-center gap-1 justify-end">
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
                        <div className="mt-3 text-sm text-[var(--text-muted)] line-clamp-2">
                          {item.details}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                );
              })}
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
                    <div>
                      <button
                        onClick={() => setShowCodes((v) => !v)}
                        className="w-full flex items-center justify-between text-sm text-[var(--text-muted)] hover:text-[var(--foreground)] transition-colors py-1.5"
                      >
                        <span className="flex items-center gap-2">
                          <Tag className="h-4 w-4" />
                          ¿Tenés un cupón o código de referido?
                        </span>
                        {showCodes ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </button>

                      {showCodes && (
                        <div className="bg-[var(--card-bg-2)] border border-[var(--card-border-soft)] rounded-xl p-4 mt-1 space-y-4">
                          <div>
                            <div className="text-xs text-[var(--text-faint)] mb-2 font-semibold uppercase tracking-wide">Código de descuento</div>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={discountCode}
                                onChange={(e) => setDiscountCode(e.target.value)}
                                placeholder="Código de descuento"
                                className="flex-1 min-w-0 px-3 py-2 bg-[var(--card-bg)] border border-[#2a2a3a] rounded-lg text-[var(--foreground)] text-sm focus:outline-none focus:border-[#8e00f7] focus:ring-1 focus:ring-[#8e00f7]/20 transition-all"
                              />
                              <button
                                onClick={validateDiscountCode}
                                disabled={validatingDiscount}
                                className="bg-[#8e00f7] hover:bg-[#7a00d4] disabled:bg-[#666] text-white font-semibold px-4 py-2 rounded-lg transition-all duration-300 disabled:cursor-not-allowed flex-shrink-0"
                              >
                                {validatingDiscount ? 'Validando...' : 'Aplicar'}
                              </button>
                            </div>
                            {appliedDiscount && (
                              <div className="text-green-500 text-xs mt-2">
                                ✓ {appliedDiscount.autoApplied ? 'Descuento de bienvenida' : 'Cupón aplicado'}: {appliedDiscount.discountPercentage}% de descuento
                              </div>
                            )}
                          </div>

                          <div className="border-t border-[var(--card-border-soft)] pt-4">
                            <div className="text-xs text-[var(--text-faint)] mb-2 font-semibold uppercase tracking-wide">Código de referido</div>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={referralCode}
                                onChange={(e) => setReferralCode(e.target.value)}
                                placeholder="Código de referido"
                                className="flex-1 min-w-0 px-3 py-2 bg-[var(--card-bg)] border border-[#2a2a3a] rounded-lg text-[var(--foreground)] text-sm focus:outline-none focus:border-[#8e00f7] focus:ring-1 focus:ring-[#8e00f7]/20 transition-all"
                              />
                              <button
                                onClick={async () => {
                                  if (referralCode.trim()) {
                                    const name = await fetchReferrerName(referralCode.trim());
                                    setAppliedReferral({ code: referralCode.trim(), referrer: name });
                                  }
                                }}
                                disabled={!referralCode.trim() || appliedReferral}
                                className="bg-[#10b981] hover:bg-[#059669] disabled:bg-[#666] text-white font-semibold px-4 py-2 rounded-lg transition-all duration-300 disabled:cursor-not-allowed flex-shrink-0"
                              >
                                {appliedReferral ? 'Aplicado' : 'Aplicar'}
                              </button>
                            </div>
                            {appliedReferral && (
                              <div className="text-green-500 text-xs mt-2">
                                ✓ Referido aplicado de: {appliedReferral.referrer}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
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
                    <div>
                      <button
                        onClick={handleCheckout}
                        disabled={isProcessing || items.length === 0}
                        className="w-full bg-gradient-to-r from-[#8e00f7] to-[#a855f7] hover:from-[#7a00d4] hover:to-[#9333ea] disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-[#8e00f7]/20"
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
                      <p className="text-center text-[11px] text-[var(--text-faint)] mt-1.5 flex items-center justify-center gap-1">
                        <Shield className="h-3 w-3" />
                        Pago seguro con tarjeta, PSE o Nequi
                      </p>
                    </div>
                  )}

                  {hubCoinsTotal > 0 && (
                    <>
                      {usdTotal > 0 && (
                        <div className="flex items-center gap-3 py-0.5">
                          <div className="flex-1 h-px bg-[var(--card-border-soft)]" />
                          <span className="text-[10px] text-[var(--text-faint)] uppercase tracking-wide">o</span>
                          <div className="flex-1 h-px bg-[var(--card-border-soft)]" />
                        </div>
                      )}
                      <div>
                        <button
                          onClick={handleHubCoinsPayment}
                          disabled={isProcessingHubCoins || !isAuthenticated || hubCoinsBalance < hubCoinsTotal}
                          className="w-full bg-transparent border-2 border-[#fbbf24]/40 hover:border-[#fbbf24] hover:bg-[#fbbf24]/10 disabled:opacity-40 disabled:cursor-not-allowed text-[#fbbf24] font-semibold py-3 rounded-xl transition-all duration-300 flex items-center justify-center gap-2"
                        >
                          {isProcessingHubCoins ? (
                            <>
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#fbbf24]" />
                              Procesando...
                            </>
                          ) : (
                            <>
                              <ShoppingCart className="h-5 w-5" />
                              {isAuthenticated ? "Comprar con Hub Coins" : "INICIAR SESIÓN"}
                            </>
                          )}
                        </button>
                        {isAuthenticated && (
                          <p className="text-center text-[11px] text-[var(--text-faint)] mt-1.5">
                            Saldo disponible: {hubCoinsBalance.toLocaleString()} Hub Coins
                          </p>
                        )}
                      </div>
                    </>
                  )}
                </div>

                <div className="mt-6 pt-6 border-t border-[var(--card-border-soft)]">
                  <TrustSection page="carrito" />
                </div>
              </div>
            </div>
          </div>

          {renderRecommended()}
        </div>
        <Footer />

        {showPaymentModal && paymentData && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[2000] p-4">
            <div className="w-full max-w-md bg-[var(--card-bg)] border border-[var(--card-border-soft)] rounded-2xl p-6">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-lg font-bold text-[var(--foreground)]">Finalizar pago</h3>
                {!isProcessing && (
                  <button
                    onClick={() => { setShowPaymentModal(false); setPaymentData(null); }}
                    className="text-[var(--text-faint)] hover:text-[var(--foreground)] transition-colors"
                    aria-label="Cerrar"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>
              <p className="text-sm text-[var(--text-muted)] mb-5">
                Total a pagar: <span className="text-[#8e00f7] font-semibold">{getConvertedPrice(finalUsdTotal)}</span>
              </p>

              {isProcessing ? (
                <div className="flex flex-col items-center justify-center py-8 gap-3">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8e00f7]" />
                  <p className="text-sm text-[var(--text-muted)]">Procesando tu pago...</p>
                </div>
              ) : paymentMethod === 'card' ? (
                <>
                  <CardTokenizeForm onTokenized={handleCardTokenized} submitLabel={`Pagar ${getConvertedPrice(finalUsdTotal)}`} />
                  <button
                    onClick={() => setPaymentMethod('other')}
                    className="w-full text-center text-[#8e00f7] text-sm mt-3 hover:underline"
                  >
                    ¿PSE, Nequi, Bancolombia u otro método? Pagar con otro método
                  </button>
                  <button
                    onClick={() => { setShowPaymentModal(false); setPaymentData(null); }}
                    className="w-full text-center text-[var(--text-muted)] text-sm mt-2 hover:text-[var(--foreground)] transition-colors"
                  >
                    Cancelar
                  </button>
                </>
              ) : (
                <>
                  <WompiWidget
                    amountInCents={paymentData.amountInCents}
                    reference={paymentData.reference}
                    currency="COP"
                    redirectUrl={`${typeof window !== 'undefined' ? window.location.origin : ''}/tienda/checkout/success`}
                    signature={paymentData.signature}
                    mostrarBotonReal
                    onPaymentComplete={handlePaymentComplete}
                    onPaymentError={handlePaymentError}
                    onCancel={() => setPaymentMethod('card')}
                  />
                  <button
                    onClick={() => { setShowPaymentModal(false); setPaymentData(null); }}
                    className="w-full text-center text-[var(--text-muted)] text-sm mt-3 hover:text-[var(--foreground)] transition-colors"
                  >
                    Cancelar
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
  );
}
