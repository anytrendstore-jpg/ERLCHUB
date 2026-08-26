"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Loader2, AlertCircle,
  Shield, Users, MessageCircle,
  Gamepad2, FileText, CreditCard
} from "lucide-react";
import ParticlesBackground from "@/components/ParticlesBackground";
import WhitelistHeader from "@/components/whitelist/WhitelistHeader";
import WhitelistCard from "@/components/whitelist/WhitelistCard";
import WhitelistStepper from "@/components/WhitelistStepper";

const features = [
  {
    icon: Shield,
    title: "Proceso Seguro",
    description: "Acceso únicamente con tu cuenta de Discord"
  },
  {
    icon: FileText,
    title: "Evaluación Roleplay",
    description: "Formulario para demostrar tus conocimientos"
  },
  {
    icon: CreditCard,
    title: "Documentos Oficiales",
    description: "Genera tu DNI personalizado del servidor"
  },
  {
    icon: Users,
    title: "Comunidad Activa",
    description: "Únete a miles de jugadores roleplay"
  }
];

const errorMessages: Record<string, string> = {
  discord_no_configurado:
    "El acceso con Discord no está configurado en este entorno todavía.",
  discord_cancelado: "Cancelaste el acceso con Discord.",
  discord_token: "Discord no aceptó la autorización. Vuelve a intentarlo.",
  discord_usuario: "No pudimos leer tu perfil de Discord.",
  discord_error: "Hubo un problema al conectar con Discord.",
};

export default function WhitelistPage() {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [devLoginAllowed, setDevLoginAllowed] = useState(false);
  const [devUsername, setDevUsername] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const reason = new URLSearchParams(window.location.search).get("error");
    if (reason) setError(errorMessages[reason] || "No se pudo completar el acceso");
  }, []);

  useEffect(() => {
    // ¿Hay ya una solicitud abierta? ¿Está Discord configurado?
    Promise.all([
      fetch("/api/whitelist/application").then(res => (res.ok ? res.json() : null)).catch(() => null),
      fetch("/api/whitelist/auth/discord?check=1").then(res => res.json()).catch(() => null),
    ]).then(([session, config]) => {
      if (session?.success) {
        router.replace(session.application.nextRoute);
        return;
      }
      setDevLoginAllowed(Boolean(config?.devLoginAllowed));
      setChecking(false);
    });
  }, [router]);

  const handleDiscordLogin = () => {
    setIsLoading(true);
    window.location.href = "/api/whitelist/auth/discord";
  };

  const handleDevLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/whitelist/auth/dev", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: devUsername }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        setError(data.error || "No se pudo entrar");
        return;
      }
      router.push(data.application.nextRoute);
    } catch {
      setError("No se pudo conectar con el servidor");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] relative overflow-hidden">
      <ParticlesBackground />

      <WhitelistHeader variant="close" />

      <main className="relative z-10 px-4 sm:px-6 lg:px-8 pb-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-[#8e00f7]/20 border border-[#8e00f7]/30 px-4 py-2 rounded-full mb-6">
              <Shield className="h-4 w-4 text-[#8e00f7]" />
              <span className="text-[#8e00f7] text-sm font-medium">Sistema de Whitelist</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-[var(--foreground)] mb-4">
              Únete a <span className="text-[#8e00f7]">ERLC HUB</span>
            </h1>
            <p className="text-[var(--text-muted)] text-lg max-w-2xl mx-auto">
              Completa el proceso de verificación para acceder al mejor servidor de roleplay.
              Todo empieza con tu cuenta de Discord.
            </p>
          </div>

          <div className="mb-12">
            <WhitelistStepper currentPhase="registration" compact />
          </div>

          <div className="grid lg:grid-cols-2 gap-8 items-start">
            <div className="space-y-6 order-2 lg:order-1">
              <h2 className="text-2xl font-bold text-[var(--foreground)]">¿Por qué hacer whitelist?</h2>

              <div className="grid gap-4">
                {features.map((feature) => (
                  <div
                    key={feature.title}
                    className="flex items-start gap-4 p-4 border border-[var(--card-border-soft)] rounded-xl hover:border-[#8e00f7]/30 transition-colors"
                    style={{ background: "color-mix(in srgb, var(--card-bg) 60%, transparent)" }}
                  >
                    <div className="w-10 h-10 rounded-lg bg-[#8e00f7]/20 flex items-center justify-center flex-shrink-0">
                      <feature.icon className="w-5 h-5 text-[#8e00f7]" />
                    </div>
                    <div>
                      <h3 className="text-[var(--foreground)] font-semibold">{feature.title}</h3>
                      <p className="text-[var(--text-muted)] text-sm">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-4 pt-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-[#8e00f7]">5K+</div>
                  <div className="text-[var(--text-faint)] text-xs">Jugadores Activos</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-[#22c55e]">98%</div>
                  <div className="text-[var(--text-faint)] text-xs">Aprobación</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-[var(--foreground)]">24h</div>
                  <div className="text-[var(--text-faint)] text-xs">Revisión Máx.</div>
                </div>
              </div>
            </div>

            <div className="order-1 lg:order-2 animate-modal-card">
              <WhitelistCard>
                <div className="p-8 text-center border-b border-[var(--card-border)]">
                  <div className="w-16 h-16 rounded-2xl bg-[#5865F2]/20 flex items-center justify-center mx-auto mb-4">
                    <svg className="h-8 w-8 text-[#5865F2]" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold text-[var(--foreground)]">Accede con Discord</h2>
                  <p className="text-sm text-[var(--text-muted)] mt-2">
                    Tu cuenta de Discord es tu identidad en el proceso. No hace falta crear
                    ninguna contraseña.
                  </p>
                </div>

                <div className="p-6 space-y-4">
                  {error && (
                    <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400">
                      <AlertCircle className="h-5 w-5 flex-shrink-0" />
                      <span className="text-sm">{error}</span>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleDiscordLogin}
                    disabled={isLoading || checking}
                    className="w-full flex items-center justify-center gap-3 h-14 bg-[#5865F2] hover:bg-[#4752C4] disabled:opacity-50 rounded-xl text-white font-bold transition-all"
                  >
                    {isLoading || checking ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z" />
                        </svg>
                        Continuar con Discord
                      </>
                    )}
                  </button>

                  <p className="text-xs text-[var(--text-faint)] text-center">
                    Si ya empezaste el proceso, este mismo botón te devuelve donde lo dejaste.
                  </p>

                  {devLoginAllowed && (
                    <form onSubmit={handleDevLogin} className="pt-4 border-t border-[var(--card-border)] space-y-3">
                      <div className="flex items-center gap-2 text-yellow-400 text-xs">
                        <AlertCircle className="h-4 w-4" />
                        Entorno local sin credenciales de Discord: entrada de prueba
                      </div>
                      <input
                        type="text"
                        value={devUsername}
                        onChange={(e) => setDevUsername(e.target.value)}
                        placeholder="usuario de Discord (prueba)"
                        className="w-full h-12 px-4 bg-[var(--background)] border border-[var(--card-border)] rounded-xl text-[var(--foreground)] placeholder-[var(--text-faint)] focus:outline-none focus:border-[#8e00f7]"
                        required
                      />
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full h-11 bg-[var(--card-bg-2)] hover:bg-[#2a2a3a] disabled:opacity-50 text-[var(--foreground)] text-sm font-semibold rounded-xl transition-colors"
                      >
                        Entrar en modo prueba
                      </button>
                    </form>
                  )}
                </div>

                <div className="px-6 pb-6 text-center">
                  <p className="text-xs text-[var(--text-faint)]">
                    Al continuar, aceptas nuestros{" "}
                    <Link href="/terminos" className="text-[#8e00f7] hover:underline">
                      Términos de Servicio
                    </Link>{" "}
                    y{" "}
                    <Link href="/privacidad" className="text-[#8e00f7] hover:underline">
                      Política de Privacidad
                    </Link>
                  </p>
                </div>
              </WhitelistCard>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
