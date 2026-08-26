"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight, Check, Loader2,
  MessageCircle, Users, Bell, AlertCircle,
  CheckCircle, ExternalLink
} from "lucide-react";
import ParticlesBackground from "@/components/ParticlesBackground";
import WhitelistStepper from "@/components/WhitelistStepper";
import { useWhitelistApplication } from "@/hooks/useWhitelistApplication";
import WhitelistBetaPanel from "@/components/WhitelistBetaPanel";
import WhitelistHeader from "@/components/whitelist/WhitelistHeader";
import WhitelistLoadingState from "@/components/whitelist/WhitelistLoadingState";
import WhitelistCard from "@/components/whitelist/WhitelistCard";

const DISCORD_INVITE = "https://discord.gg/xKJqNX7uC3";

export default function DiscordVerificationPage() {
  const router = useRouter();
  const { application, loading, error: loadError, reload, run } = useWhitelistApplication(["discord"]);

  const [busyRequirement, setBusyRequirement] = useState<"server" | "rules" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const discord = application?.discord;
  const allRequirementsMet = Boolean(discord?.joinedServer && discord?.acceptedRules);

  const handleRequirement = async (requirement: "server" | "rules") => {
    setBusyRequirement(requirement);
    setError(null);
    try {
      if (requirement === "server") {
        window.open(DISCORD_INVITE, "_blank", "noopener,noreferrer");
      }
      await run("discord_requirement", { requirement });
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar el requisito");
    } finally {
      setBusyRequirement(null);
    }
  };

  if (loading || loadError || !discord) {
    return <WhitelistLoadingState error={loadError} onRetry={() => reload(true)} />;
  }

  return (
    <div className="min-h-screen bg-[var(--background)] relative overflow-hidden">
      <ParticlesBackground />
      <WhitelistBetaPanel currentPhase="discord" />
      <WhitelistHeader applicationId={application?.applicationId} />

      <main className="relative z-10 px-4 sm:px-6 lg:px-8 pb-16">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <WhitelistStepper currentPhase="discord" />
          </div>

          <WhitelistCard>
            <div className="p-6 border-b border-[var(--card-border)]">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-[#5865F2]/20 flex items-center justify-center">
                  <MessageCircle className="h-7 w-7 text-[#5865F2]" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-[var(--foreground)]">Verificación de Discord</h1>
                  <p className="text-[var(--text-muted)]">Únete al servidor y acepta las reglas</p>
                </div>
              </div>
            </div>

            <div className="p-6">
              {!allRequirementsMet ? (
                <div className="space-y-6">
                  <div className="flex items-center gap-4 p-4 bg-[#5865F2]/10 border border-[#5865F2]/30 rounded-xl">
                    <div className="relative">
                      {discord.avatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={discord.avatar} alt={discord.username} className="w-12 h-12 rounded-full" />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-[#5865F2]/30 flex items-center justify-center text-[var(--foreground)] font-bold text-lg">
                          {discord.username.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#22c55e] rounded-full border-2 border-[var(--card-bg)] flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    </div>
                    <div>
                      <div className="font-semibold text-[var(--foreground)]">{discord.globalName || discord.username}</div>
                      <div className="text-sm text-[#5865F2]">@{discord.username}</div>
                      {discord.source === "dev" && (
                        <div className="text-xs text-yellow-400 mt-0.5">Sesión de prueba local</div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                      Completa los requisitos
                    </h3>

                    <div className="flex items-center justify-between p-4 rounded-xl border bg-[#22c55e]/10 border-[#22c55e]/30">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center bg-[#22c55e]">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-[var(--foreground)]">Cuenta de Discord verificada</span>
                      </div>
                      <CheckCircle className="w-5 h-5 text-[#22c55e]" />
                    </div>

                    <div className={`flex items-center justify-between p-4 rounded-xl border transition-colors ${
                      discord.joinedServer
                        ? "bg-[#22c55e]/10 border-[#22c55e]/30"
                        : "bg-[var(--background)] border-[var(--card-border)]"
                    }`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          discord.joinedServer ? "bg-[#22c55e]" : "bg-[var(--card-bg-2)]"
                        }`}>
                          {discord.joinedServer ? (
                            <Check className="w-4 h-4 text-white" />
                          ) : (
                            <Users className="w-4 h-4 text-[var(--text-faint)]" />
                          )}
                        </div>
                        <span className={discord.joinedServer ? "text-[var(--foreground)]" : "text-[var(--text-muted)]"}>
                          Unirse al servidor de ERLC HUB
                        </span>
                      </div>
                      {discord.joinedServer ? (
                        <CheckCircle className="w-5 h-5 text-[#22c55e]" />
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleRequirement("server")}
                          disabled={busyRequirement !== null}
                          className="flex items-center gap-2 px-4 py-2 bg-[#5865F2] hover:bg-[#4752C4] disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                          {busyRequirement === "server" ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <ExternalLink className="w-4 h-4" />
                              Unirse
                            </>
                          )}
                        </button>
                      )}
                    </div>

                    <div className={`flex items-center justify-between p-4 rounded-xl border transition-colors ${
                      discord.acceptedRules
                        ? "bg-[#22c55e]/10 border-[#22c55e]/30"
                        : "bg-[var(--background)] border-[var(--card-border)]"
                    }`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          discord.acceptedRules ? "bg-[#22c55e]" : "bg-[var(--card-bg-2)]"
                        }`}>
                          {discord.acceptedRules ? (
                            <Check className="w-4 h-4 text-white" />
                          ) : (
                            <Bell className="w-4 h-4 text-[var(--text-faint)]" />
                          )}
                        </div>
                        <span className={discord.acceptedRules ? "text-[var(--foreground)]" : "text-[var(--text-muted)]"}>
                          Aceptar las reglas del servidor
                        </span>
                      </div>
                      {discord.acceptedRules ? (
                        <CheckCircle className="w-5 h-5 text-[#22c55e]" />
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleRequirement("rules")}
                          disabled={busyRequirement !== null || !discord.joinedServer}
                          className="flex items-center gap-2 px-4 py-2 bg-[#8e00f7] hover:bg-[#7a00d4] disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                          {busyRequirement === "rules" ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            "Aceptar"
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {error && (
                    <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400">
                      <AlertCircle className="h-5 w-5 flex-shrink-0" />
                      <span className="text-sm">{error}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 space-y-6">
                  <div className="w-20 h-20 rounded-full bg-[#22c55e]/20 flex items-center justify-center mx-auto animate-prize-reveal">
                    <CheckCircle className="h-10 w-10 text-[#22c55e]" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-[var(--foreground)] mb-2">Discord Verificado</h2>
                    <p className="text-[var(--text-muted)]">
                      Tu cuenta de Discord ha sido vinculada exitosamente.
                    </p>
                  </div>

                  <div className="inline-flex items-center gap-3 px-4 py-3 bg-[#5865F2]/10 border border-[#5865F2]/30 rounded-xl">
                    {discord.avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={discord.avatar} alt={discord.username} className="w-10 h-10 rounded-full" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-[#5865F2]/30 flex items-center justify-center text-[var(--foreground)] font-bold">
                        {discord.username.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="text-left">
                      <div className="font-semibold text-[var(--foreground)]">{discord.globalName || discord.username}</div>
                      <div className="text-sm text-[#5865F2]">@{discord.username}</div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => router.push("/whitelist/roblox")}
                    className="inline-flex items-center justify-center gap-2 h-12 px-8 bg-[#8e00f7] hover:bg-[#7a00d4] text-white font-bold rounded-xl transition-all mx-auto"
                  >
                    Continuar a Roblox
                    <ArrowRight className="h-5 w-5" />
                  </button>
                </div>
              )}
            </div>
          </WhitelistCard>

          <div className="mt-6 text-center">
            <p className="text-sm text-[var(--text-faint)]">
              ¿Problemas con la verificación?{" "}
              <a href={DISCORD_INVITE} target="_blank" rel="noopener noreferrer" className="text-[#8e00f7] hover:underline">
                Contacta soporte
              </a>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
