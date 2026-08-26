"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";
import { Check, Crown, ArrowRight, Home, Calendar, Gift, Star, Sparkles } from "lucide-react";

function RenewalSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [countdown, setCountdown] = useState(10);
  const [membershipInfo, setMembershipInfo] = useState<any>(null);

  useEffect(() => {
    const membership = searchParams.get('membership');
    const userId = searchParams.get('userId');
    
    if (membership) {
      setMembershipInfo({
        id: membership,
        name: membership === 'mem-vip' ? 'VIP' : 
              membership === 'mem-elite' ? 'ELITE' : 
              membership === 'mem-legend' ? 'LEYENDA' : 'Membresía',
        type: 'monthly'
      });
    }

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push("/perfil");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-[var(--background)] pt-20">
      <Navbar />
      
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <div className="w-24 h-24 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-8">
            <Check className="h-12 w-12 text-green-500" />
          </div>

          <h1 className="text-4xl font-bold text-[var(--foreground)] mb-4">
            ¡Membresía Renovada Exitosamente!
          </h1>
          <p className="text-xl text-[var(--text-muted)] mb-8">
            Tu {membershipInfo?.name || 'membresía'} ha sido renovada y todos tus beneficios han sido reactivados
          </p>

          <div className="bg-[var(--card-bg)] border border-[var(--card-border-soft)] rounded-xl p-6 mb-8 max-w-md mx-auto">
            <div className="text-[var(--text-muted)] text-sm mb-2">Membresía Reactivada</div>
            <div className="text-[#8e00f7] font-bold text-lg flex items-center justify-center gap-2">
              <Crown className="h-5 w-5" />
              {membershipInfo?.name || 'Membresía'}
            </div>
          </div>

          <div className="bg-[var(--card-bg)] border border-[var(--card-border-soft)] rounded-xl p-6 mb-8">
            <h2 className="text-xl font-bold text-[var(--foreground)] mb-4">¿Qué sucede ahora?</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                  <Check className="h-4 w-4 text-green-400" />
                </div>
                <div>
                  <h3 className="text-[var(--foreground)] font-semibold mb-1">Beneficios Reactivados</h3>
                  <p className="text-[var(--text-muted)] text-sm">
                    Todos tus beneficios especiales han sido restaurados inmediatamente
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                  <Calendar className="h-4 w-4 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-[var(--foreground)] font-semibold mb-1">Próxima Renovación</h3>
                  <p className="text-[var(--text-muted)] text-sm">
                    Se te recordará 5 días antes de tu próximo vencimiento
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                  <Gift className="h-4 w-4 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-[var(--foreground)] font-semibold mb-1">Acceso Inmediato</h3>
                  <p className="text-[var(--text-muted)] text-sm">
                    Ya puedes disfrutar de todos los beneficios en el servidor
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-[#8e00f7]/20 to-[#a64dfa]/20 border border-[#8e00f7]/30 rounded-xl p-6 mb-8">
            <h3 className="text-lg font-bold text-[var(--foreground)] mb-3 flex items-center justify-center gap-2">
              <Star className="h-5 w-5 text-[#fbbf24]" />
              Beneficios de tu {membershipInfo?.name || 'Membresía'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-left">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#8e00f7]" />
                <span className="text-[var(--text-muted)] text-sm">Acceso prioritario en tickets</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#8e00f7]" />
                <span className="text-[var(--text-muted)] text-sm">Rango exclusivo en Discord</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#8e00f7]" />
                <span className="text-[var(--text-muted)] text-sm">Dinero inicial recurrente</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#8e00f7]" />
                <span className="text-[var(--text-muted)] text-sm">Vehículos y propiedades</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <Link
              href="/perfil"
              className="w-full bg-[#8e00f7] hover:bg-[#a64dfa] text-white px-6 py-4 rounded-xl font-bold text-lg transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
            >
              <Home className="h-5 w-5" />
              Ver Mi Perfil
            </Link>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link
                href="/tienda/membresia"
                className="w-full bg-[var(--card-bg-2)] hover:bg-[#2a2a38] text-[var(--foreground)] px-6 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2"
              >
                <ArrowRight className="h-4 w-4" />
                Ver Otras Membresías
              </Link>

              <Link
                href="https://discord.gg/xKJqNX7uC3"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white px-6 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2"
              >
                <Crown className="h-4 w-4" />
                Servidor de Discord
              </Link>
            </div>
          </div>

          <div className="mt-8 bg-green-500/10 border border-green-500/30 rounded-xl p-4 text-center">
            <p className="text-green-400 text-sm">
              Serás redirigido automáticamente a tu perfil en{" "}
              <span className="font-bold text-green-300">{countdown}</span>{" "}
              segundos...
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default function RenewalSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[var(--background)] pt-20">
        <Navbar />
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="w-12 h-12 border-4 border-[#8e00f7] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[var(--text-muted)]">Procesando renovación...</p>
        </div>
        <Footer />
      </div>
    }>
      <RenewalSuccessContent />
    </Suspense>
  );
}