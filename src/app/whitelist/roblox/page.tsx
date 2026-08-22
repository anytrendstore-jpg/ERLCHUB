"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft, ArrowRight, Check, Loader2, Shield,
  Gamepad2, User, Copy, CheckCircle,
  AlertCircle, ExternalLink, Hash, Sparkles
} from "lucide-react";
import ParticlesBackground from "@/components/ParticlesBackground";
import WhitelistStepper from "@/components/WhitelistStepper";
import { useWhitelistApplication } from "@/hooks/useWhitelistApplication";
import WhitelistBetaPanel from "@/components/WhitelistBetaPanel";

const OAUTH_ERROR_MESSAGES: Record<string, string> = {
  oauth_not_configured: "El login oficial de Roblox todavía no está configurado. Usa la verificación por código mientras tanto.",
  oauth_denied: "Cancelaste el acceso a tu cuenta de Roblox.",
  oauth_invalid_state: "La sesión de verificación expiró, inténtalo de nuevo.",
  no_session: "Tu sesión de whitelist expiró, vuelve a empezar.",
  token_exchange_failed: "No se pudo confirmar el acceso con Roblox, inténtalo de nuevo.",
  user_info_failed: "No se pudo leer tu perfil de Roblox, inténtalo de nuevo.",
  roblox_already_linked: "Esa cuenta de Roblox ya está vinculada a otra solicitud de whitelist.",
  callback_failed: "Algo salió mal conectando con Roblox, inténtalo de nuevo.",
};

export default function RobloxVerificationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a0a12] flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-[#8e00f7] animate-spin" />
      </div>
    }>
      <RobloxVerificationContent />
    </Suspense>
  );
}

function RobloxVerificationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { application, loading, run } = useWhitelistApplication(["roblox"]);

  const [username, setUsername] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isConnectingOAuth, setIsConnectingOAuth] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const oauthError = searchParams.get("error");
    if (oauthError) {
      setError(OAUTH_ERROR_MESSAGES[oauthError] || "No se pudo completar la conexión con Roblox.");
      router.replace("/whitelist/roblox");
    }
  }, [searchParams, router]);

  const roblox = application?.roblox;
  const step = !roblox ? "input" : roblox.verified ? "complete" : "verify";

  const handleOAuthConnect = () => {
    setIsConnectingOAuth(true);
    window.location.href = "/api/whitelist/auth/roblox";
  };

  const handleSearch = async () => {
    if (!username.trim()) {
      setError("Por favor ingresa un nombre de usuario");
      return;
    }
    setIsSearching(true);
    setError(null);
    try {
      await run("roblox_start", { username: username.trim() });
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo buscar el usuario");
    } finally {
      setIsSearching(false);
    }
  };

  const handleCopyCode = () => {
    if (!roblox) return;
    navigator.clipboard.writeText(roblox.verificationCode);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  const handleVerify = async () => {
    setIsVerifying(true);
    setError(null);
    try {
      await run("roblox_verify");
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo verificar la cuenta");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleBack = async () => {
    setError(null);
    try {
      await run("roblox_reset");
      setUsername("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo cambiar la cuenta");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a12] flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-[#8e00f7] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a12] relative overflow-hidden">
      <ParticlesBackground />
      <WhitelistBetaPanel currentPhase="roblox" />

      <header className="relative z-20 py-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.png" alt="ERLC HUB" width={40} height={40} className="h-10 w-auto" />
            <span className="font-bold text-white text-lg">ERLCᴴᵁᴮ</span>
          </Link>
          <Link
            href="/whitelist/discord"
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Volver</span>
          </Link>
        </div>
      </header>

      <main className="relative z-10 px-4 sm:px-6 lg:px-8 pb-16">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <WhitelistStepper currentPhase="roblox" />
          </div>

          <div className="bg-[#12121c]/90 backdrop-blur-sm border border-[#1e1e2e] rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-[#1e1e2e]">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-[#e2231a]/20 flex items-center justify-center">
                  <Gamepad2 className="h-7 w-7 text-[#e2231a]" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">Verificación de Roblox</h1>
                  <p className="text-gray-400">Vincula tu cuenta de Roblox para continuar</p>
                </div>
              </div>
            </div>

            <div className="p-6">
              {step === "input" && (
                <div className="space-y-6">
                  <div className="text-center py-6">
                    <div className="w-20 h-20 rounded-full bg-[#e2231a]/20 flex items-center justify-center mx-auto mb-6">
                      <Gamepad2 className="h-10 w-10 text-[#e2231a]" />
                    </div>
                    <h2 className="text-xl font-bold text-white mb-2">Ingresa tu usuario de Roblox</h2>
                    <p className="text-gray-400 max-w-md mx-auto">
                      Buscaremos tu cuenta en Roblox y te daremos un código para demostrar que es tuya.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleOAuthConnect}
                    disabled={isConnectingOAuth}
                    className="w-full h-14 bg-[#00A2FF] hover:bg-[#0080CC] disabled:opacity-50 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-3"
                  >
                    {isConnectingOAuth ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Conectando con Roblox...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-5 w-5" />
                        Conectar con Roblox (recomendado)
                      </>
                    )}
                  </button>
                  <p className="text-xs text-gray-500 text-center -mt-3">
                    Inicia sesión oficialmente en Roblox: verificación instantánea, sin copiar códigos. Solo pedimos tu identidad básica (usuario, nombre y foto) — nunca tu contraseña.
                  </p>

                  <div className="flex items-center gap-3">
                    <div className="h-px flex-1 bg-[#1e1e2e]" />
                    <span className="text-xs text-gray-500 uppercase tracking-wide">o verifica con un código</span>
                    <div className="h-px flex-1 bg-[#1e1e2e]" />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Usuario de Roblox</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Tu nombre de usuario"
                        className="w-full h-14 pl-12 pr-4 bg-[#0a0a12] border border-[#1e1e2e] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#e2231a] transition-colors text-lg"
                        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400">
                      <AlertCircle className="h-5 w-5 flex-shrink-0" />
                      <span className="text-sm">{error}</span>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleSearch}
                    disabled={isSearching || !username.trim()}
                    className="w-full h-14 bg-[#e2231a] hover:bg-[#c91f17] disabled:opacity-50 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-3"
                  >
                    {isSearching ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Buscando usuario...
                      </>
                    ) : (
                      <>
                        Buscar Usuario
                        <ArrowRight className="h-5 w-5" />
                      </>
                    )}
                  </button>

                  <div className="bg-[#0a0a12] rounded-xl p-4 border border-[#1e1e2e]">
                    <h3 className="text-sm font-semibold text-white mb-2">¿Cómo funciona?</h3>
                    <ol className="space-y-2 text-sm text-gray-400">
                      {[
                        "Ingresa tu nombre de usuario de Roblox",
                        "Copia el código de verificación",
                        "Pega el código en tu descripción de perfil de Roblox",
                        "Verifica tu cuenta",
                      ].map((text, index) => (
                        <li key={text} className="flex items-start gap-2">
                          <span className="w-5 h-5 rounded-full bg-[#1a1a28] flex items-center justify-center flex-shrink-0 text-xs text-white">
                            {index + 1}
                          </span>
                          {text}
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
              )}

              {step === "verify" && roblox && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-[#e2231a]/10 border border-[#e2231a]/30 rounded-xl">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl bg-[#1a1a28] flex items-center justify-center overflow-hidden">
                        {roblox.avatar ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={roblox.avatar} alt={roblox.username} className="w-full h-full object-cover" />
                        ) : (
                          <Gamepad2 className="h-7 w-7 text-[#e2231a]" />
                        )}
                      </div>
                      <div>
                        <div className="font-semibold text-white">{roblox.displayName || roblox.username}</div>
                        <div className="text-sm text-[#e2231a]">@{roblox.username}</div>
                        {!roblox.id && (
                          <div className="text-xs text-yellow-400 mt-0.5">
                            No se pudo consultar la API de Roblox: se usará el nombre tal cual
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleBack}
                      className="text-sm text-gray-400 hover:text-white transition-colors"
                    >
                      Cambiar
                    </button>
                  </div>

                  <div className="bg-[#0a0a12] rounded-xl p-6 border border-[#1e1e2e]">
                    <h3 className="text-lg font-bold text-white mb-4">Verificación de propiedad</h3>

                    <div className="space-y-4">
                      <p className="text-gray-400 text-sm">
                        Para verificar que eres el dueño de esta cuenta, copia el siguiente código
                        y pégalo en la descripción de tu perfil de Roblox:
                      </p>

                      <div className="flex items-center gap-3 p-4 bg-[#1a1a28] rounded-xl">
                        <Hash className="h-5 w-5 text-[#8e00f7]" />
                        <code className="flex-1 text-xl font-mono text-[#8e00f7] tracking-wider">
                          {roblox.verificationCode}
                        </code>
                        <button
                          type="button"
                          onClick={handleCopyCode}
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            codeCopied
                              ? "bg-[#22c55e] text-white"
                              : "bg-[#8e00f7] hover:bg-[#7a00d4] text-white"
                          }`}
                        >
                          {codeCopied ? (
                            <>
                              <Check className="w-4 h-4" />
                              Copiado
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4" />
                              Copiar
                            </>
                          )}
                        </button>
                      </div>

                      <ol className="space-y-3 text-sm">
                        {[
                          "Ve a tu perfil de Roblox",
                          'Haz clic en "Editar perfil" o "About"',
                          "Pega el código de verificación en tu descripción",
                          "Guarda los cambios y regresa aquí",
                        ].map((text, index) => (
                          <li key={text} className="flex items-start gap-3 text-gray-400">
                            <span className="w-6 h-6 rounded-full bg-[#8e00f7] flex items-center justify-center flex-shrink-0 text-xs text-white font-bold">
                              {index + 1}
                            </span>
                            <span>{text}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  </div>

                  <a
                    href={roblox.id
                      ? `https://www.roblox.com/users/${roblox.id}/profile`
                      : `https://www.roblox.com/search/users?keyword=${encodeURIComponent(roblox.username)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full h-12 bg-[#1a1a28] hover:bg-[#2a2a3a] text-white rounded-xl transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Abrir perfil de Roblox
                  </a>

                  {error && (
                    <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400">
                      <AlertCircle className="h-5 w-5 flex-shrink-0" />
                      <span className="text-sm">{error}</span>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleVerify}
                    disabled={isVerifying}
                    className="w-full h-14 bg-[#8e00f7] hover:bg-[#7a00d4] disabled:opacity-50 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-3"
                  >
                    {isVerifying ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Verificando...
                      </>
                    ) : (
                      <>
                        <Shield className="h-5 w-5" />
                        Verificar Cuenta
                      </>
                    )}
                  </button>
                </div>
              )}

              {step === "complete" && roblox && (
                <div className="text-center py-8 space-y-6">
                  <div className="w-20 h-20 rounded-full bg-[#22c55e]/20 flex items-center justify-center mx-auto animate-prize-reveal">
                    <CheckCircle className="h-10 w-10 text-[#22c55e]" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-2">Roblox Verificado</h2>
                    <p className="text-gray-400">
                      Tu cuenta de Roblox ha sido vinculada exitosamente.
                    </p>
                  </div>

                  <div className="inline-flex items-center gap-3 px-4 py-3 bg-[#e2231a]/10 border border-[#e2231a]/30 rounded-xl">
                    <div className="w-10 h-10 rounded-lg bg-[#1a1a28] flex items-center justify-center overflow-hidden">
                      {roblox.avatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={roblox.avatar} alt={roblox.username} className="w-full h-full object-cover" />
                      ) : (
                        <Gamepad2 className="h-5 w-5 text-[#e2231a]" />
                      )}
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-white">{roblox.displayName || roblox.username}</div>
                      <div className="text-sm text-[#e2231a]">@{roblox.username}</div>
                    </div>
                  </div>

                  <p className="text-sm text-gray-500">
                    {roblox.verifiedMode === "oauth"
                      ? "Verificado con el login oficial de Roblox — confirmamos que la cuenta es tuya sin necesidad de códigos."
                      : roblox.verifiedMode === "api"
                        ? "Código encontrado en tu perfil: ya puedes borrarlo de la descripción."
                        : "Verificado en modo local (no se pudo consultar roblox.com desde este equipo)."}
                  </p>

                  <button
                    type="button"
                    onClick={() => router.push("/whitelist/formulario")}
                    className="inline-flex items-center justify-center gap-2 h-12 px-8 bg-[#8e00f7] hover:bg-[#7a00d4] text-white font-bold rounded-xl transition-all mx-auto"
                  >
                    Continuar al Formulario
                    <ArrowRight className="h-5 w-5" />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              ¿No puedes encontrar tu cuenta?{" "}
              <a href="https://discord.gg/xKJqNX7uC3" target="_blank" rel="noopener noreferrer" className="text-[#8e00f7] hover:underline">
                Contacta soporte
              </a>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
