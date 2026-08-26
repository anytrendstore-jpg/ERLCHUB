"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";
import { X, AlertCircle, RefreshCw, ArrowLeft, ShoppingBag, CreditCard } from "lucide-react";

export default function CheckoutCancelledPage() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push("/tienda/hub-coins");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-[var(--background)] pt-20">
      <Navbar />

      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          <div className="bg-[var(--card-bg)] border border-[var(--card-border-soft)] rounded-2xl p-8 mb-6">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 rounded-full bg-red-500/20 border-2 border-red-500/50 flex items-center justify-center">
                <X className="h-10 w-10 text-red-500" />
              </div>
            </div>

            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-white mb-4">
                Transacción Cancelada
              </h1>
              <p className="text-[var(--text-muted)] text-lg mb-2">
                Tu pago no ha sido completado
              </p>
              <p className="text-[var(--text-muted)]">
                No te preocupes, no se ha realizado ningún cargo en tu cuenta.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <div className="bg-[var(--card-bg-2)] border border-[#2a2a38] rounded-xl p-4">
                <div className="flex items-center gap-3 mb-2">
                  <AlertCircle className="h-5 w-5 text-orange-400" />
                  <h3 className="text-white font-semibold">¿Qué pasó?</h3>
                </div>
                <p className="text-[var(--text-muted)] text-sm">
                  La transacción fue cancelada o rechazada. Esto puede ocurrir por:
                </p>
                <ul className="text-[var(--text-muted)] text-sm mt-2 space-y-1">
                  <li>· Cancelación por tu parte</li>
                  <li>· Problema con el método de pago</li>
                  <li>· Tiempo de espera agotado</li>
                  <li>· Error en la conexión</li>
                </ul>
              </div>

              <div className="bg-[var(--card-bg-2)] border border-[#2a2a38] rounded-xl p-4">
                <div className="flex items-center gap-3 mb-2">
                  <RefreshCw className="h-5 w-5 text-[#8e00f7]" />
                  <h3 className="text-white font-semibold">¿Qué hacer?</h3>
                </div>
                <p className="text-[var(--text-muted)] text-sm">
                  Puedes intentar realizar la compra nuevamente:
                </p>
                <ul className="text-[var(--text-muted)] text-sm mt-2 space-y-1">
                  <li>· Verifica tu método de pago</li>
                  <li>· Revisa tu conexión a internet</li>
                  <li>· Intenta con otro navegador</li>
                  <li>· Contacta soporte si persiste</li>
                </ul>
              </div>
            </div>

            <div className="space-y-4">
              <Link
                href="/tienda/hub-coins"
                className="w-full bg-[#8e00f7] hover:bg-[#a64dfa] text-white px-6 py-4 rounded-xl font-bold text-lg transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
              >
                <ShoppingBag className="h-5 w-5" />
                Intentar Compra Nuevamente
              </Link>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link
                  href="/tienda"
                  className="w-full bg-[var(--card-bg-2)] hover:bg-[#2a2a38] text-white px-6 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Volver a la Tienda
                </Link>

                <Link
                  href="https://discord.gg/xKJqNX7uC3"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white px-6 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2"
                >
                  <CreditCard className="h-4 w-4" />
                  Contactar Soporte
                </Link>
              </div>
            </div>
          </div>

          <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4 text-center">
            <p className="text-orange-400 text-sm">
              Serás redirigido automáticamente a la tienda de Hub Coins en{" "}
              <span className="font-bold text-orange-300">{countdown}</span>{" "}
              segundos...
            </p>
          </div>

          <div className="mt-8 text-center">
            <h3 className="text-white font-semibold mb-4">¿Necesitas ayuda?</h3>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="https://discord.gg/xKJqNX7uC3"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-[#8e00f7] hover:text-[#a64dfa] transition-colors"
              >
                <span className="w-6 h-6 bg-[#5865F2] rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">D</span>
                </span>
                Discord Support
              </Link>
              <Link
                href="/terminos"
                className="flex items-center gap-2 text-[#8e00f7] hover:text-[#a64dfa] transition-colors"
              >
                Términos y Condiciones
              </Link>
              <Link
                href="/privacidad"
                className="flex items-center gap-2 text-[#8e00f7] hover:text-[#a64dfa] transition-colors"
              >
                Política de Privacidad
              </Link>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}