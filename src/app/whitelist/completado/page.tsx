"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CheckCircle, Sparkles, Download, Share2,
  ArrowRight, Trophy, Star, Users, Gamepad2,
  MessageCircle, Copy, Check, CreditCard
} from "lucide-react";
import ParticlesBackground from "@/components/ParticlesBackground";
import Confetti from "@/components/Confetti";
import { useWhitelistApplication } from "@/hooks/useWhitelistApplication";
import WhitelistBetaPanel from "@/components/WhitelistBetaPanel";
import WhitelistHeader from "@/components/whitelist/WhitelistHeader";
import WhitelistLoadingState from "@/components/whitelist/WhitelistLoadingState";
import WhitelistCard from "@/components/whitelist/WhitelistCard";

export default function CompletedPage() {
  const { application, loading, error: loadError, reload } = useWhitelistApplication(["completed"]);
  const [showConfetti, setShowConfetti] = useState(true);
  const [codeCopied, setCodeCopied] = useState(false);
  const [shared, setShared] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  const serverCode = application?.document?.number || "ERLCHUB";

  const handleCopyCode = () => {
    navigator.clipboard.writeText(serverCode);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  const handleShare = async () => {
    const shareData = {
      title: "ERLCᴴᵁᴮ",
      text: "¡Acabo de pasar la whitelist de ERLCᴴᵁᴮ! Únete a la mejor comunidad de roleplay en ERLC.",
      url: "https://erlchub.pro/whitelist",
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // El usuario canceló el diálogo nativo — no es un error real.
      }
      return;
    }
    await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
    setShared(true);
    setTimeout(() => setShared(false), 2000);
  };

  if (loading || loadError || !application) {
    return <WhitelistLoadingState error={loadError} onRetry={() => reload(true)} />;
  }

  return (
    <div className="min-h-screen bg-[var(--background)] relative overflow-hidden">
      <ParticlesBackground />
      <WhitelistBetaPanel currentPhase="completed" />
      {showConfetti && <Confetti />}
      <WhitelistHeader variant="minimal" />

      <main className="relative z-10 px-4 sm:px-6 lg:px-8 pb-16">
        <div className="max-w-3xl mx-auto">
          <WhitelistCard variant="success">
            <div className="bg-gradient-to-r from-[#22c55e]/20 to-[#8e00f7]/20 p-8 text-center">
              <div className="relative inline-block">
                <div className="w-24 h-24 rounded-full bg-[#22c55e] flex items-center justify-center mx-auto animate-prize-reveal">
                  <CheckCircle className="h-12 w-12 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-10 h-10 rounded-full bg-[#fbbf24] flex items-center justify-center animate-bounce">
                  <Trophy className="h-5 w-5 text-white" />
                </div>
              </div>

              <h1 className="text-4xl font-black text-white mt-6 mb-2">
                ¡Whitelist Completada!
              </h1>
              <p className="text-[var(--text-muted)] text-lg">
                Felicitaciones {application.character?.firstName || application.fullName}, ahora eres parte de ERLC HUB
              </p>
              <p className="text-[var(--text-faint)] text-sm mt-2 font-mono">{application.applicationId}</p>
            </div>

            <div className="p-8 space-y-8">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-[var(--background)] rounded-xl">
                  <Sparkles className="w-6 h-6 text-[#8e00f7] mx-auto mb-2" />
                  <div className="text-2xl font-bold text-white">100%</div>
                  <div className="text-xs text-[var(--text-faint)]">Completado</div>
                </div>
                <div className="text-center p-4 bg-[var(--background)] rounded-xl">
                  <Star className="w-6 h-6 text-[#fbbf24] mx-auto mb-2" />
                  <div className="text-2xl font-bold text-white">{application.questionnaireScore ?? 0}%</div>
                  <div className="text-xs text-[var(--text-faint)]">Puntuación</div>
                </div>
                <div className="text-center p-4 bg-[var(--background)] rounded-xl">
                  <Users className="w-6 h-6 text-[#22c55e] mx-auto mb-2" />
                  <div className="text-2xl font-bold text-white">#{application.memberNumber ?? 1}</div>
                  <div className="text-xs text-[var(--text-faint)]">Miembro</div>
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-lg font-bold text-white">Próximos pasos</h2>

                <div className="space-y-3">
                  <div className="flex items-start gap-4 p-4 bg-[var(--background)] rounded-xl border border-[var(--card-border)]">
                    <div className="w-8 h-8 rounded-full bg-[#22c55e] flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">
                      1
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-white">Únete al servidor de Discord</div>
                      <p className="text-sm text-[var(--text-muted)] mt-1">
                        Accede a canales exclusivos y conoce a otros jugadores
                      </p>
                    </div>
                    <a
                      href="https://discord.gg/xKJqNX7uC3"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-[#5865F2] hover:bg-[#4752C4] text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Unirse
                    </a>
                  </div>

                  <div className="flex items-start gap-4 p-4 bg-[var(--background)] rounded-xl border border-[var(--card-border)]">
                    <div className="w-8 h-8 rounded-full bg-[#8e00f7] flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">
                      2
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-white">Tu número de documento</div>
                      <p className="text-sm text-[var(--text-muted)] mt-1">
                        Guárdalo: es tu identificación dentro del servidor
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <code className="px-3 py-1.5 bg-[var(--card-bg-2)] rounded-lg text-[#8e00f7] font-mono text-sm">
                          {serverCode}
                        </code>
                        <button
                          type="button"
                          onClick={handleCopyCode}
                          className={`p-1.5 rounded-lg transition-colors ${
                            codeCopied ? "bg-[#22c55e] text-white" : "bg-[var(--card-bg-2)] text-[var(--text-muted)] hover:text-white"
                          }`}
                        >
                          {codeCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <a
                      href="https://www.roblox.com/games/erlchub"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-[#e2231a] hover:bg-[#c91f17] text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      <Gamepad2 className="w-4 h-4" />
                      Jugar
                    </a>
                  </div>

                  <div className="flex items-start gap-4 p-4 bg-[var(--background)] rounded-xl border border-[var(--card-border)]">
                    <div className="w-8 h-8 rounded-full bg-[#fbbf24] flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">
                      3
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-white">Revisa tu documento</div>
                      <p className="text-sm text-[var(--text-muted)] mt-1">
                        {application.character
                          ? `${application.character.firstName} ${application.character.lastName} · válido hasta ${application.document?.expiryDate}`
                          : "Consulta los datos de tu DNI del servidor"}
                      </p>
                    </div>
                    <Link
                      href="/whitelist/dni"
                      className="flex items-center gap-2 px-4 py-2 bg-[var(--card-bg-2)] hover:bg-[#2a2a3a] text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      <CreditCard className="w-4 h-4" />
                      Ver DNI
                    </Link>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-[#8e00f7]/20 to-[#22c55e]/20 rounded-xl border border-[#8e00f7]/30">
                <div>
                  <div className="font-medium text-white">Comparte tu logro</div>
                  <div className="text-sm text-[var(--text-muted)]">Invita a tus amigos a unirse</div>
                </div>
                <button
                  type="button"
                  onClick={handleShare}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    shared ? "bg-[#22c55e] text-white" : "bg-[#8e00f7] hover:bg-[#7a00d4] text-white"
                  }`}
                >
                  {shared ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                  {shared ? "Copiado" : "Compartir"}
                </button>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center justify-center gap-2 h-14 px-8 bg-[#22c55e] hover:bg-[#16a34a] text-white font-bold rounded-xl transition-all"
                >
                  Entrar a mi Dashboard
                  <ArrowRight className="h-5 w-5" />
                </Link>
                <Link
                  href="/"
                  className="inline-flex items-center justify-center gap-2 h-14 px-8 bg-[var(--card-bg-2)] hover:bg-[#2a2a3a] text-white font-medium rounded-xl transition-all"
                >
                  Ir al Inicio
                </Link>
              </div>
            </div>
          </WhitelistCard>

          <div className="mt-8 text-center">
            <p className="text-sm text-[var(--text-faint)]">
              ¿Tienes preguntas? Contáctanos en{" "}
              <a href="https://discord.gg/xKJqNX7uC3" className="text-[#8e00f7] hover:underline">
                Discord
              </a>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}