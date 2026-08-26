"use client";

import Link from "next/link";
import Image from "next/image";
import { X, ArrowLeft } from "lucide-react";
import ParticlesBackground from "@/components/ParticlesBackground";
import { useDiscordAuth } from "@/hooks/useDiscordAuth";
import { useRouter } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import SessionStartedHandler from "@/components/SessionStartedHandler";

function LoginPageContent() {
  const { isAuthenticated, isLoading } = useDiscordAuth();
  const router = useRouter();
  const [showSessionStarted, setShowSessionStarted] = useState(false);
  const [isNewUser, setIsNewUser] = useState(true);
  const [username, setUsername] = useState('');

  const handleSessionStarted = (newUser: boolean, user: string) => {
    setIsNewUser(newUser);
    setUsername(user);
    setShowSessionStarted(true);
  };

  if (showSessionStarted) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-[#22c55e] rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-[var(--foreground)] mb-2">
            {isNewUser ? '¡Sesión Iniciada!' : `¡Sesión Iniciada! Un gusto verte de nuevo ${username}`}
          </h2>
          <p className="text-[var(--text-muted)] text-sm">Serás redirigido a la página de inicio en unos segundos...</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8e00f7] mx-auto"></div>
          <p className="text-[var(--text-muted)] mt-4">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="mb-6">
            <div className="w-16 h-16 bg-[#22c55e] rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm2-7h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z"/>
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-[var(--foreground)] mb-2">Ya tienes sesión activa</h2>
            <p className="text-[var(--text-muted)] mb-6">Estás conectado a tu cuenta de Discord</p>
          </div>
          
          <div className="space-y-3">
            <button
              onClick={() => router.push('/')}
              className="w-full h-12 bg-[#8e00f7] hover:bg-[#7a00d4] text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-3"
            >
              <ArrowLeft className="h-5 w-5" />
              Ir al inicio
            </button>
            
            <Link
              href="/"
              className="w-full h-12 flex items-center justify-center gap-3 bg-transparent border border-[var(--card-border)] hover:border-[#2a2a3a] text-[var(--text-muted)] hover:text-[var(--foreground)] font-semibold rounded-xl transition-all"
            >
              Explorar el sitio
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center px-4 py-12 relative overflow-hidden">
      <ParticlesBackground />
      <div className="relative z-10 w-full max-w-[400px]">
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-[#8e00f7]/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-[#8e00f7]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0463-.319 13.5809.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.872-.902a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.074.074 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.9019.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5489-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189z"/>
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-[var(--foreground)] mb-2">Iniciar sesión</h2>
            <p className="text-[var(--text-muted)] text-sm">Para iniciar sesión, regresa a la página principal</p>
          </div>
          
          <div className="space-y-4">
            <div className="bg-[var(--card-bg-2)] border border-[#2a2a3a] rounded-xl p-4">
              <div className="flex items-center gap-3 text-[var(--text-muted)]">
                <ArrowLeft className="h-5 w-5 text-[#8e00f7]" />
                <div>
                  <p className="text-sm font-medium">El inicio de sesión está en la página principal</p>
                  <p className="text-xs text-[var(--text-faint)]">Allí encontrarás el botón "Iniciar con Discord"</p>
                </div>
              </div>
            </div>
            
            <button
              onClick={() => router.push('/')}
              className="w-full h-12 bg-[#8e00f7] hover:bg-[#7a00d4] text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-3"
            >
              <ArrowLeft className="h-5 w-5" />
              Ir al inicio para iniciar sesión
            </button>
            
            <Link
              href="/"
              className="w-full h-12 flex items-center justify-center gap-3 bg-transparent border border-[var(--card-border)] hover:border-[#2a2a3a] text-[var(--text-muted)] hover:text-[var(--foreground)] font-semibold rounded-xl transition-all"
            >
              Explorar sin iniciar sesión
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--background)] flex items-center justify-center"><div className="text-[var(--foreground)]">Cargando...</div></div>}>
      <LoginPageContent />
    </Suspense>
  );
}