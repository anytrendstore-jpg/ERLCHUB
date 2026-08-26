"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";
import { Check, Shield, ArrowRight, Home, Server, Zap, Users, Clock, Star } from "lucide-react";

function WhitelistFastSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [countdown, setCountdown] = useState(10);
  const [purchaseInfo, setPurchaseInfo] = useState<any>(null);

  useEffect(() => {
    const transactionId = searchParams.get('transaction_id');
    const server = searchParams.get('server') || 'los-santos';
    
    if (transactionId) {
      setPurchaseInfo({
        transactionId,
        selectedServer: server,
        serverName: getServerName(server),
        serverEmoji: getServerEmoji(server)
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
          <div className="w-24 h-24 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto mb-8">
            <Check className="h-12 w-12 text-purple-500" />
          </div>

          <h1 className="text-4xl font-bold text-white mb-4">
            ¡Whitelist Fast Comprada Exitosamente!
          </h1>
          <p className="text-xl text-[var(--text-muted)] mb-8">
            Tu acceso inmediato al servidor ha sido procesado. Revisa tus DMs en Discord para seleccionar tu servidor.
          </p>

          <div className="bg-[var(--card-bg)] border border-[var(--card-border-soft)] rounded-xl p-6 mb-8 max-w-md mx-auto">
            <div className="text-[var(--text-muted)] text-sm mb-2">Servidor Seleccionado</div>
            <div className="text-[#8b5cf6] font-bold text-lg flex items-center justify-center gap-2">
              <Server className="h-5 w-5" />
              {purchaseInfo?.serverName || 'Los Santos'}
            </div>
          </div>

          <div className="bg-[var(--card-bg)] border border-[var(--card-border-soft)] rounded-xl p-6 mb-8">
            <h2 className="text-xl font-bold text-white mb-4">¿Qué sucede ahora?</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                  <Zap className="h-4 w-4 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1">Acceso Inmediato</h3>
                  <p className="text-[var(--text-muted)] text-sm">
                    Sin entrevistas ni esperas, acceso directo al servidor
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                  <Users className="h-4 w-4 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1">DM en Discord</h3>
                  <p className="text-[var(--text-muted)] text-sm">
                    Recibirás mensaje con selección de servidor y enlace de unión
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                  <Star className="h-4 w-4 text-green-400" />
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1">Comienza a Rolear</h3>
                  <p className="text-[var(--text-muted)] text-sm">
                    Crea tu personaje y únete a la acción inmediatamente
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-[#8b5cf6]/20 to-[#a64dfa]/20 border border-[#8b5cf6]/30 rounded-xl p-6 mb-8">
            <h3 className="text-lg font-bold text-white mb-3 flex items-center justify-center gap-2">
              <Shield className="h-5 w-5 text-[#8b5cf6]" />
              Beneficios de tu Whitelist Fast
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-left">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-[#8b5cf6]" />
                <span className="text-[var(--text-muted)] text-sm">Acceso inmediato al servidor</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-[#8b5cf6]" />
                <span className="text-[var(--text-muted)] text-sm">Sin tiempos de espera</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-[#8b5cf6]" />
                <span className="text-[var(--text-muted)] text-sm">Sin entrevistas ni pruebas</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-[#8b5cf6]" />
                <span className="text-[var(--text-muted)] text-sm">Activación automática</span>
              </div>
            </div>
          </div>

          <div className="bg-[var(--card-bg)] border border-[var(--card-border-soft)] rounded-xl p-6 mb-8">
            <h3 className="text-lg font-bold text-white mb-4">Información del Servidor</h3>
            <div className="space-y-4">
              <div className="bg-[var(--card-bg-2)] rounded-lg p-4">
                <h4 className="text-purple-400 font-semibold mb-2">{purchaseInfo?.serverName || 'Los Santos'}</h4>
                <p className="text-[var(--text-muted)] text-sm mb-3">
                  Bienvenido a un entorno donde cada decisión importa y cada acción tiene consecuencias. 
                  Experimenta un roleplay 100% realista en una ciudad moderna llena de oportunidades.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-left text-sm">
                  <div className="text-[var(--text-muted)]">Fuerzas del orden:</div>
                  <div className="text-[var(--text-muted)]">LSPD, LSSD, Fire, Medical, Federales</div>
                  <div className="text-[var(--text-muted)]">Organizaciones:</div>
                  <div className="text-[var(--text-muted)]">Pandillas, mafias, empresas</div>
                  <div className="text-[var(--text-muted)]">Propiedades:</div>
                  <div className="text-[var(--text-muted)]">Apartamentos, mansiones, negocios</div>
                  <div className="text-[var(--text-muted)]">Economía:</div>
                  <div className="text-[var(--text-muted)]">Realista y dinámica</div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <Link
              href="https://discord.gg/WZVr3HhaCr"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-[#8b5cf6] hover:bg-[#a64dfa] text-white px-6 py-4 rounded-xl font-bold text-lg transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
            >
              <Server className="h-5 w-5" />
              Unirse al Servidor de Discord
            </Link>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link
                href="/perfil"
                className="w-full bg-[var(--card-bg-2)] hover:bg-[#2a2a38] text-white px-6 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2"
              >
                <Home className="h-4 w-4" />
                Ver Mi Perfil
              </Link>

              <Link
                href="/tienda"
                className="w-full bg-[var(--card-bg-2)] hover:bg-[#2a2a38] text-white px-6 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2"
              >
                <ArrowRight className="h-4 w-4" />
                Ver Más Productos
              </Link>
            </div>
          </div>

          <div className="mt-8 bg-purple-500/10 border border-purple-500/30 rounded-xl p-4 text-center">
            <p className="text-purple-400 text-sm">
              Serás redirigido automáticamente a tu perfil en{" "}
              <span className="font-bold text-purple-300">{countdown}</span>{" "}
              segundos...
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default function WhitelistFastSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[var(--background)] pt-20">
        <Navbar />
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="w-12 h-12 border-4 border-[#8b5cf6] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[var(--text-muted)]">Procesando tu Whitelist Fast...</p>
        </div>
        <Footer />
      </div>
    }>
      <WhitelistFastSuccessContent />
    </Suspense>
  );
}

function getServerName(serverId: string): string {
  const servers = {
    'los-santos': 'Los Santos',
    'liberty-city': 'Liberty City',
    'las-venturas': 'Las Venturas'
  };
  return servers[serverId as keyof typeof servers] || 'Los Santos';
}

function getServerEmoji(serverId: string): string {
  const emojis = {
    'los-santos': 'Los Santos',
    'liberty-city': 'Liberty City',
    'las-venturas': 'Las Venturas'
  };
  return emojis[serverId as keyof typeof emojis] || 'Los Santos';
}