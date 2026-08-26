"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";
import { Check, ArrowRight, Home, Download, Clock, Shield, Zap, Users, Star, ShoppingBag, CreditCard, ChevronRight, Gift, Sparkles, Crown, X, AlertCircle } from "lucide-react";

function CheckoutSuccessContent() {
  const [orderNumber, setOrderNumber] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const checkPaymentStatus = async () => {
      try {
        const transactionId = searchParams.get('transaction_id');
        
        const paymentStatus = searchParams.get('payment_status');
        const status = searchParams.get('status');
        const error = searchParams.get('error');
        
        if (paymentStatus === 'cancelled' || status === 'cancelled' || error === 'cancelled' ||
            paymentStatus === 'error' || status === 'error' || error === 'error') {
          window.location.href = 'https://www.erlchub.pro/tienda/checkout/cancelled';
          return;
        }

        if (transactionId) {
          const response = await fetch(`/api/check-payment-status?transaction_id=${transactionId}`);
          const data = await response.json();
          
          if (data.success) {
            if (data.status === 'ERROR' || data.status === 'CANCELLED' || data.status === 'DECLINED') {
              window.location.href = 'https://www.erlchub.pro/tienda/checkout/cancelled';
              return;
            }
          }
        }

        const orderNum = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
        setOrderNumber(orderNum);
        
        const saveCompletedTransaction = async () => {
          try {
            const cartData = localStorage.getItem('cart');
            const userData = sessionStorage.getItem('discordUser');
            const transactionId = searchParams.get('transaction_id');
            const reference = searchParams.get('reference');
            
            if (cartData && userData) {
              const cart = JSON.parse(cartData);
              const user = JSON.parse(userData);
              
              
              const transactionData = {
                userId: user.id,
                amount: cart.totalAmount || 0,
                type: 'purchase',
                description: `Compra exitosa: ${cart.items?.map((item: any) => item.name).join(', ') || 'Productos del carrito'}`,
                status: 'completed',
                metadata: {
                  orderNumber: orderNum,
                  transactionId: transactionId,
                  reference: reference,
                  items: cart.items || []
                }
              };
              
              
              const response = await fetch('/api/hub-coins/transactions', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(transactionData)
              });
              
              const result = await response.json();
              
              localStorage.removeItem('cart');
            } else {
            }
          } catch (error) {
            console.error('Error saving completed transaction:', error);
          }
        };
        
        saveCompletedTransaction();
      } catch (error) {
        console.error('Error checking payment status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkPaymentStatus();
  }, [searchParams]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--background)] pt-20">
        <Navbar />
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="w-12 h-12 border-4 border-[#8e00f7] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[var(--text-muted)]">Verificando estado del pago...</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)] pt-20">
      <Navbar />
      
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <div className="w-24 h-24 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-8">
            <Check className="h-12 w-12 text-green-500" />
          </div>

          <h1 className="text-4xl font-bold text-white mb-4">¡Compra Completada!</h1>
          <p className="text-xl text-[var(--text-muted)] mb-8">
            Tu pedido ha sido procesado exitosamente
          </p>

          <div className="bg-[var(--card-bg)] border border-[var(--card-border-soft)] rounded-xl p-6 mb-8 max-w-md mx-auto">
            <div className="text-[var(--text-muted)] text-sm mb-2">Número de Pedido</div>
            <div className="text-[#8e00f7] font-bold text-lg">{orderNumber}</div>
          </div>

          <div className="bg-[var(--card-bg)] border border-[var(--card-border-soft)] rounded-xl p-6 mb-8">
            <h2 className="text-xl font-bold text-white mb-4">¿Qué sigue?</h2>
            
            <div className="grid md:grid-cols-3 gap-6 text-left">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-[#8e00f7]/20 flex items-center justify-center flex-shrink-0">
                  <Download className="h-5 w-5 text-[#8e00f7]" />
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1">Entrega Inmediata</h3>
                  <p className="text-[var(--text-muted)] text-sm">
                    Tus productos digitales han sido entregados automáticamente
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-[#8e00f7]/20 flex items-center justify-center flex-shrink-0">
                  <Clock className="h-5 w-5 text-[#8e00f7]" />
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1">Tiempo de Espera</h3>
                  <p className="text-[var(--text-muted)] text-sm">
                    Algunos productos pueden tardar hasta 5 minutos en activarse
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-[#8e00f7]/20 flex items-center justify-center flex-shrink-0">
                  <Check className="h-5 w-5 text-[#8e00f7]" />
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1">Confirmación</h3>
                  <p className="text-[var(--text-muted)] text-sm">
                    Recibirás un mensaje en discord con los detalles de tu compra
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 bg-[#8e00f7] hover:bg-[#7a00d4] text-white px-6 py-3 rounded-xl font-medium transition-all hover:scale-105"
            >
              <Home className="h-5 w-5" />
              Ir al Dashboard
            </Link>
            
            <Link
              href="/tienda"
              className="inline-flex items-center gap-2 bg-[var(--card-bg)] hover:bg-[var(--card-bg-2)] text-white px-6 py-3 rounded-xl font-medium transition-all hover:scale-105 border border-[var(--card-border-soft)]"
            >
              <ArrowRight className="h-5 w-5" />
              Seguir Comprando
            </Link>
          </div>

          <div className="mt-12 bg-[var(--card-bg)] border border-[var(--card-border-soft)] rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-3">¿Necesitas ayuda?</h3>
            <p className="text-[var(--text-muted)] mb-4">
              Si tienes algún problema con tu compra, nuestro equipo de soporte está aquí para ayudarte
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="https://discord.gg/xKJqNX7uC3"
                className="text-[#8e00f7] hover:text-[#7a00d4] transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                Contactar Soporte
              </Link>
              <Link
                href="https://www.erlchub.pro/privacidad"
                className="text-[#8e00f7] hover:text-[#7a00d4] transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                Ver FAQ
              </Link>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[var(--background)] pt-20">
        <Navbar />
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="w-12 h-12 border-4 border-[#8e00f7] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[var(--text-muted)]">Cargando...</p>
        </div>
        <Footer />
      </div>
    }>
      <CheckoutSuccessContent />
    </Suspense>
  );
}