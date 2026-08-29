"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Clock, CheckCircle, XCircle, AlertCircle,
  RefreshCw, MessageCircle, FileText, Shield,
  ArrowRight, Loader2
} from "lucide-react";
import ParticlesBackground from "@/components/ParticlesBackground";
import WhitelistStepper from "@/components/WhitelistStepper";
import { useWhitelistApplication } from "@/hooks/useWhitelistApplication";
import WhitelistBetaPanel from "@/components/WhitelistBetaPanel";
import WhitelistHeader from "@/components/whitelist/WhitelistHeader";
import WhitelistLoadingState from "@/components/whitelist/WhitelistLoadingState";
import WhitelistCard from "@/components/whitelist/WhitelistCard";
import type { ApplicationStatus } from "@/lib/whitelistTypes";

const TERMINAL_STATUSES: ApplicationStatus[] = ["approved", "rejected"];

interface StatusConfig {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  borderColor: string;
}

const statusConfigs: Record<ApplicationStatus, StatusConfig> = {
  pending: {
    title: "En Espera",
    description: "Tu solicitud está en la cola de revisión. Un miembro del staff la revisará pronto.",
    icon: Clock,
    color: "text-yellow-400",
    bgColor: "bg-yellow-400/10",
    borderColor: "border-yellow-400/30"
  },
  in_review: {
    title: "En Revisión",
    description: "Un miembro del staff está revisando tu solicitud en este momento.",
    icon: FileText,
    color: "text-blue-400",
    bgColor: "bg-blue-400/10",
    borderColor: "border-blue-400/30"
  },
  approved: {
    title: "Aprobada",
    description: "Tu solicitud ha sido aprobada. Puedes continuar al siguiente paso.",
    icon: CheckCircle,
    color: "text-[#22c55e]",
    bgColor: "bg-[#22c55e]/10",
    borderColor: "border-[#22c55e]/30"
  },
  rejected: {
    title: "Rechazada",
    description: "Tu solicitud no cumple con los requisitos. Revisa las notas del staff.",
    icon: XCircle,
    color: "text-red-400",
    bgColor: "bg-red-400/10",
    borderColor: "border-red-400/30"
  },
  needs_revision: {
    title: "Requiere Correcciones",
    description: "Tu solicitud necesita algunas correcciones. Revisa las notas del staff.",
    icon: AlertCircle,
    color: "text-orange-400",
    bgColor: "bg-orange-400/10",
    borderColor: "border-orange-400/30"
  }
};

export default function ReviewWaitingPage() {
  const router = useRouter();
  const { application, queue, loading, error: loadError, reload } = useWhitelistApplication(["review", "dni", "dni_review"]);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  // Consulta periódica del estado real de la solicitud — se detiene sola una
  // vez que el estado es final (aprobada/rechazada), en vez de seguir
  // llamando a la API cada 20s para siempre sin que nada vaya a cambiar.
  useEffect(() => {
    if (application && TERMINAL_STATUSES.includes(application.status)) return;
    const interval = setInterval(async () => {
      await reload();
      setLastChecked(new Date());
    }, 20000);
    return () => clearInterval(interval);
  }, [reload, application?.status]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!loading) setLastChecked(new Date());
  }, [loading]);

  const checkStatus = async () => {
    setIsRefreshing(true);
    await reload();
    setLastChecked(new Date());
    setIsRefreshing(false);
  };

  if (loading || loadError || !application) {
    return <WhitelistLoadingState error={loadError} onRetry={() => reload(true)} />;
  }

  const status = application.status;
  const statusConfig = statusConfigs[status];
  const StatusIcon = statusConfig.icon;
  // Esta misma pantalla sirve para dos revisiones distintas: la del cuestionario (fase
  // 'review'/'questionnaire') y la del documento/personaje (fase 'dni_review'/'dni'). El
  // currentPhase en el momento de renderizar ya deja ver cuál es, sin heurísticas frágiles.
  const isDniReviewWait = application.currentPhase === "dni_review";
  const isDniApproved = status === "approved" && application.currentPhase === "completed";
  const isDniRevision = status === "needs_revision" && application.currentPhase === "dni";

  const formatTime = (date: Date) =>
    date.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });

  const formatDate = (value?: string) =>
    value
      ? new Date(value).toLocaleDateString("es-ES", {
          day: "numeric",
          month: "short",
          hour: "2-digit",
          minute: "2-digit"
        })
      : "—";

  return (
    <div className="min-h-screen bg-[var(--background)] relative overflow-hidden">
      <ParticlesBackground />
      <WhitelistBetaPanel currentPhase={isDniReviewWait || isDniApproved || isDniRevision ? "dni" : "review"} />
      <WhitelistHeader applicationId={application.applicationId} />

      <main className="relative z-10 px-4 sm:px-6 lg:px-8 pb-16">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <WhitelistStepper currentPhase={isDniReviewWait || isDniApproved || isDniRevision ? "dni" : "review"} />
          </div>

          <WhitelistCard>
            <div className={`p-8 ${statusConfig.bgColor} border-b ${statusConfig.borderColor}`}>
              <div className="flex flex-col items-center text-center">
                <div className={`w-20 h-20 rounded-full ${statusConfig.bgColor} border-2 ${statusConfig.borderColor} flex items-center justify-center mb-4 ${
                  status === "pending" || status === "in_review" ? "animate-pulse" : ""
                }`}>
                  <StatusIcon className={`h-10 w-10 ${statusConfig.color}`} />
                </div>
                <h1 className={`text-3xl font-bold ${statusConfig.color} mb-2`}>
                  {statusConfig.title}
                </h1>
                <p className="text-[var(--text-muted)] max-w-md">
                  {statusConfig.description}
                </p>
              </div>
            </div>

            <div className="p-6">
              {(status === "pending" || status === "in_review") && (
                <div className="space-y-6">
                  <div className="grid sm:grid-cols-3 gap-4">
                    <div className="bg-[var(--background)] rounded-xl p-4 text-center">
                      <div className="text-2xl font-bold text-[var(--foreground)] mb-1">
                        #{queue?.position ?? "—"}
                      </div>
                      <div className="text-sm text-[var(--text-faint)]">Posición en cola</div>
                    </div>
                    <div className="bg-[var(--background)] rounded-xl p-4 text-center">
                      <div className="text-2xl font-bold text-[var(--foreground)] mb-1">
                        {queue?.total ?? 0}
                      </div>
                      <div className="text-sm text-[var(--text-faint)]">En revisión</div>
                    </div>
                    <div className="bg-[var(--background)] rounded-xl p-4 text-center">
                      {isDniReviewWait ? (
                        <>
                          <div className="text-2xl font-bold text-[#8e00f7] mb-1 font-mono">
                            {application.document?.number ?? "—"}
                          </div>
                          <div className="text-sm text-[var(--text-faint)]">ID de ciudadano</div>
                        </>
                      ) : (
                        <>
                          <div className="text-2xl font-bold text-[#8e00f7] mb-1">
                            {application.questionnaireScore ?? 0}%
                          </div>
                          <div className="text-sm text-[var(--text-faint)]">Puntuación</div>
                        </>
                      )}
                    </div>
                  </div>

                  {isDniReviewWait && (
                    <p className="text-center text-sm text-[var(--text-muted)] -mt-2">
                      Un miembro del staff está revisando que el nombre, la edad y el personaje
                      de tu documento sean coherentes.
                    </p>
                  )}

                  <div className="bg-[var(--background)] rounded-xl p-4">
                    <h3 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-4">
                      Historial
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#22c55e] flex items-center justify-center flex-shrink-0">
                          <CheckCircle className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="text-[var(--foreground)] font-medium">Solicitud enviada</div>
                          <div className="text-sm text-[var(--text-faint)]">{formatDate(application.submittedAt)}</div>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          status === "in_review" ? "bg-blue-500" : "bg-[var(--card-bg-2)]"
                        }`}>
                          {status === "in_review" ? (
                            <Loader2 className="w-4 h-4 text-white animate-spin" />
                          ) : (
                            <Clock className="w-4 h-4 text-[var(--text-faint)]" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className={status === "in_review" ? "text-[var(--foreground)] font-medium" : "text-[var(--text-faint)]"}>
                            {status === "in_review" ? "En revisión por staff" : "Esperando revisión"}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 opacity-50">
                        <div className="w-8 h-8 rounded-full bg-[var(--card-bg-2)] flex items-center justify-center flex-shrink-0">
                          <Shield className="w-4 h-4 text-[var(--text-faint)]" />
                        </div>
                        <div className="flex-1">
                          <div className="text-[var(--text-faint)]">Decisión final</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-[var(--background)] rounded-xl">
                    <div className="text-sm text-[var(--text-faint)]">
                      Última comprobación: {lastChecked ? formatTime(lastChecked) : "—"}
                    </div>
                    <button
                      type="button"
                      onClick={checkStatus}
                      disabled={isRefreshing}
                      className="flex items-center gap-2 px-4 py-2 bg-[var(--card-bg-2)] hover:bg-[#2a2a3a] disabled:opacity-50 text-[var(--foreground)] rounded-lg transition-colors"
                    >
                      <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
                      Actualizar
                    </button>
                  </div>

                  <p className="text-center text-xs text-gray-600">
                    Esta página se actualiza sola cada 20 segundos. La decisión la toma el staff
                    desde su panel.
                  </p>
                </div>
              )}

              {status === "approved" && isDniApproved && (
                <div className="text-center py-8 space-y-6">
                  <div className="w-24 h-24 rounded-full bg-[#22c55e]/20 flex items-center justify-center mx-auto animate-prize-reveal">
                    <CheckCircle className="h-12 w-12 text-[#22c55e]" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-[var(--foreground)] mb-2">¡Documento aprobado!</h2>
                    <p className="text-[var(--text-muted)] max-w-md mx-auto">
                      El staff confirmó tu documento de identidad. Ya sos oficialmente parte de ERLC HUB —
                      podés entrar al servidor.
                    </p>
                  </div>

                  {application.staffNotes && (
                    <div className="bg-[var(--background)] border border-[var(--card-border)] rounded-xl p-4 text-left max-w-md mx-auto">
                      <h3 className="text-sm font-semibold text-[#22c55e] mb-2">Notas del staff:</h3>
                      <p className="text-[var(--text-muted)] text-sm">{application.staffNotes}</p>
                    </div>
                  )}

                  <div className="flex items-center justify-center gap-8 py-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-[#22c55e] font-mono">
                        {application.document?.number ?? "—"}
                      </div>
                      <div className="text-sm text-[var(--text-faint)]">ID de ciudadano</div>
                    </div>
                    <div className="h-12 w-px bg-[#1e1e2e]" />
                    <div className="text-center">
                      <div className="text-3xl font-bold text-[#8e00f7]">
                        {formatDate(application.reviewedAt)}
                      </div>
                      <div className="text-sm text-[var(--text-faint)]">Revisada</div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => router.push("/whitelist/completado")}
                    className="inline-flex items-center justify-center gap-2 h-14 px-8 bg-[#8e00f7] hover:bg-[#7a00d4] text-white font-bold rounded-xl transition-all mx-auto"
                  >
                    Continuar
                    <ArrowRight className="h-5 w-5" />
                  </button>
                </div>
              )}

              {status === "approved" && !isDniApproved && (
                <div className="text-center py-8 space-y-6">
                  <div className="w-24 h-24 rounded-full bg-[#22c55e]/20 flex items-center justify-center mx-auto animate-prize-reveal">
                    <CheckCircle className="h-12 w-12 text-[#22c55e]" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-[var(--foreground)] mb-2">¡Felicitaciones!</h2>
                    <p className="text-[var(--text-muted)] max-w-md mx-auto">
                      Tu solicitud de whitelist ha sido aprobada. Ahora puedes crear tu documento de identidad
                      y comenzar a jugar en ERLC HUB.
                    </p>
                  </div>

                  {application.staffNotes && (
                    <div className="bg-[var(--background)] border border-[var(--card-border)] rounded-xl p-4 text-left max-w-md mx-auto">
                      <h3 className="text-sm font-semibold text-[#22c55e] mb-2">Notas del staff:</h3>
                      <p className="text-[var(--text-muted)] text-sm">{application.staffNotes}</p>
                    </div>
                  )}

                  <div className="flex items-center justify-center gap-8 py-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-[#22c55e]">
                        {application.questionnaireScore ?? 0}%
                      </div>
                      <div className="text-sm text-[var(--text-faint)]">Puntuación</div>
                    </div>
                    <div className="h-12 w-px bg-[#1e1e2e]" />
                    <div className="text-center">
                      <div className="text-3xl font-bold text-[#8e00f7]">
                        {formatDate(application.reviewedAt)}
                      </div>
                      <div className="text-sm text-[var(--text-faint)]">Revisada</div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => router.push("/whitelist/dni")}
                    className="inline-flex items-center justify-center gap-2 h-14 px-8 bg-[#8e00f7] hover:bg-[#7a00d4] text-white font-bold rounded-xl transition-all mx-auto"
                  >
                    Crear mi Documento de Identidad
                    <ArrowRight className="h-5 w-5" />
                  </button>
                </div>
              )}

              {status === "rejected" && (
                <div className="text-center py-8 space-y-6">
                  <div className="w-24 h-24 rounded-full bg-red-500/20 flex items-center justify-center mx-auto">
                    <XCircle className="h-12 w-12 text-red-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-[var(--foreground)] mb-2">Solicitud Rechazada</h2>
                    <p className="text-[var(--text-muted)] max-w-md mx-auto">
                      Lamentablemente tu solicitud no cumple con los requisitos necesarios.
                    </p>
                  </div>

                  <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-left max-w-md mx-auto">
                    <h3 className="text-sm font-semibold text-red-400 mb-2">Notas del Staff:</h3>
                    <p className="text-[var(--text-muted)] text-sm">
                      {application.staffNotes || "El staff no dejó notas adicionales."}
                    </p>
                  </div>

                  <div className="flex items-center justify-center gap-4">
                    <Link
                      href="/"
                      className="px-6 py-3 bg-[var(--card-bg-2)] hover:bg-[#2a2a3a] text-[var(--foreground)] rounded-xl transition-colors"
                    >
                      Volver al inicio
                    </Link>
                    <a
                      href="https://discord.gg/xKJqNX7uC3"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-6 py-3 bg-[#5865F2] hover:bg-[#4752C4] text-white rounded-xl transition-colors"
                    >
                      <MessageCircle className="w-5 h-5" />
                      Contactar Soporte
                    </a>
                  </div>
                </div>
              )}

              {status === "needs_revision" && (
                <div className="text-center py-8 space-y-6">
                  <div className="w-24 h-24 rounded-full bg-orange-400/20 flex items-center justify-center mx-auto">
                    <AlertCircle className="h-12 w-12 text-orange-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-[var(--foreground)] mb-2">
                      {isDniRevision ? "Tu documento necesita correcciones" : "Correcciones Necesarias"}
                    </h2>
                    <p className="text-[var(--text-muted)] max-w-md mx-auto">
                      {isDniRevision
                        ? "El staff encontró algo incoherente en tu documento (nombre, edad o personaje) — corregilo y volvé a generarlo."
                        : "Tu solicitud está casi lista, pero necesita algunas correcciones antes de ser aprobada."}
                    </p>
                  </div>

                  <div className="bg-orange-400/10 border border-orange-400/30 rounded-xl p-4 text-left max-w-md mx-auto">
                    <h3 className="text-sm font-semibold text-orange-400 mb-2">Correcciones solicitadas:</h3>
                    <p className="text-[var(--text-muted)] text-sm">
                      {application.staffNotes || (isDniRevision ? "El staff no dejó notas adicionales." : "Amplía y mejora tus respuestas del formulario.")}
                    </p>
                  </div>

                  {isDniRevision ? (
                    <button
                      type="button"
                      onClick={() => router.push("/whitelist/dni")}
                      className="inline-flex items-center justify-center gap-2 h-14 px-8 bg-[#8e00f7] hover:bg-[#7a00d4] text-white font-bold rounded-xl transition-all mx-auto"
                    >
                      Corregir mi Documento
                      <ArrowRight className="h-5 w-5" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => router.push("/whitelist/formulario")}
                      className="inline-flex items-center justify-center gap-2 h-14 px-8 bg-[#8e00f7] hover:bg-[#7a00d4] text-white font-bold rounded-xl transition-all mx-auto"
                    >
                      Corregir Formulario
                      <ArrowRight className="h-5 w-5" />
                    </button>
                  )}
                </div>
              )}
            </div>
          </WhitelistCard>

          <div className="mt-6 text-center">
            <p className="text-sm text-[var(--text-faint)]">
              ¿Tienes preguntas sobre tu solicitud?{" "}
              <a href="https://discord.gg/xKJqNX7uC3" target="_blank" rel="noopener noreferrer" className="text-[#8e00f7] hover:underline">
                Contacta al staff
              </a>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
