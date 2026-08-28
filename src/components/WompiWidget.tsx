"use client";

import { useEffect, useRef, useState } from "react";
import { CreditCard } from "lucide-react";

interface WompiWidgetProps {
  amountInCents: number;
  reference: string;
  currency: string;
  redirectUrl: string;
  signature: string;
  onPaymentComplete?: (transactionId: string) => void;
  onPaymentError?: (error: string) => void;
  onCancel?: () => void;
  mostrarBotonReal?: boolean;
}

export default function WompiWidget({
  amountInCents,
  reference,
  currency,
  redirectUrl,
  signature,
  onPaymentComplete,
  onPaymentError,
  onCancel,
  mostrarBotonReal = false
}: WompiWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const publicKey = "pub_prod_A0bBsgOOfJgc719xoHaV5H01lycc8Cvr";

   useEffect(() => {
    if (mostrarBotonReal && containerRef.current) {
      containerRef.current.innerHTML = ""; 

      const script = document.createElement("script");
      
      // 1. DEFINIMOS LOS DATOS PRIMERO
      script.setAttribute("data-render", "button");
      script.setAttribute("data-public-key", "pub_prod_A0bBsgOOfJgc719xoHaV5H01lycc8Cvr");
      script.setAttribute('data-currency', 'COP'); // Siempre COP para Wompi Colombia
      script.setAttribute("data-amount-in-cents", amountInCents.toString());
      script.setAttribute("data-reference", reference);
      script.setAttribute("data-signature:integrity", signature);
      script.setAttribute("data-redirect-url", "https://www.erlchub.pro/tienda/checkout/handler");
      
      script.src = "https://checkout.wompi.co/widget.js";
      script.async = true; 

      script.onerror = () => {
        onPaymentError?.("Error cargando widget de pago");
      };

      containerRef.current.appendChild(script);

      const handlePaymentEvent = (event: any) => {
        if (event.data.event === "paymentSuccess") {
          onPaymentComplete?.(event.data.transaction.id);
        } else if (event.data.event === "paymentError") {
          onPaymentError?.(event.data.error || "Error en el pago");
        } else if (event.data.event === "paymentCancelled") {
          // Guardar transacción cancelada antes de redirigir
          const saveCancelledTransaction = async () => {
            try {
              // Obtener datos del carrito desde localStorage o sessionStorage
              const cartData = localStorage.getItem('cart');
              const userData = sessionStorage.getItem('discordUser');
              
              if (cartData && userData) {
                const cart = JSON.parse(cartData);
                const user = JSON.parse(userData);
                
                await fetch('/api/hub-coins/transactions', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    userId: user.id,
                    amount: cart.totalAmount || 0,
                    type: 'purchase',
                    description: `Compra cancelada: ${cart.items?.map((item: any) => item.name).join(', ') || 'Productos del carrito'}`,
                    status: 'cancelled',
                    metadata: {
                      reason: 'Widget payment cancelled',
                      items: cart.items || []
                    }
                  })
                });
              }
            } catch (error) {
              console.error('Error saving cancelled transaction:', error);
            }
          };
          
          saveCancelledTransaction();
          window.location.href = "https://www.erlchub.pro/tienda/checkout/cancelled";
        }
      };

      window.addEventListener("message", handlePaymentEvent);

      return () => {
        window.removeEventListener("message", handlePaymentEvent);
        if (containerRef.current) {
          containerRef.current.innerHTML = "";
        }
      };
    }
  }, [mostrarBotonReal, amountInCents, reference, signature, redirectUrl]);

  return (
    <div className="flex flex-col gap-4">
      {mostrarBotonReal && (
        <div className="bg-[var(--card-bg-2)] p-6 rounded-xl flex flex-col items-center">
          <p className="text-[var(--foreground)] mb-4">Finaliza tu pago seguro aquí:</p>
          <div ref={containerRef}>
          </div>
          {onCancel && (
            <button
              onClick={onCancel}
              className="text-[var(--text-muted)] text-sm mt-4 underline"
            >
              Volver
            </button>
          )}
        </div>
      )}
    </div>
  );
}