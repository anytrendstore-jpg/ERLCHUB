"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FlaskConical, X, RotateCcw, Loader2, ChevronRight } from "lucide-react";
import { PHASES, type WhitelistPhase } from "@/lib/whitelistTypes";

const PHASE_ROUTES: Record<WhitelistPhase, string> = {
  registration: "/whitelist",
  discord: "/whitelist/discord",
  roblox: "/whitelist/roblox",
  questionnaire: "/whitelist/formulario",
  review: "/whitelist/espera",
  dni: "/whitelist/dni",
  completed: "/whitelist/completado",
};

const JUMPABLE: WhitelistPhase[] = ["discord", "roblox", "questionnaire", "review", "dni", "completed"];

interface Props {
  currentPhase?: WhitelistPhase;
}

/**
 * Panel del MODO BETA: salta a cualquier fase de la whitelist rellenando por
 * detrás los datos de las fases anteriores. Solo se muestra si
 * NEXT_PUBLIC_WHITELIST_BETA=1.
 */
export default function WhitelistBetaPanel({ currentPhase }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (process.env.NEXT_PUBLIC_WHITELIST_BETA !== "1") return null;

  const call = async (action: string, data?: unknown, route?: string) => {
    setBusy(action + JSON.stringify(data ?? ""));
    setError(null);
    try {
      const response = await fetch("/api/whitelist/application", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, data }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        setError(payload.error || "No se pudo saltar de fase");
        return;
      }
      router.push(route || payload.application.nextRoute);
      router.refresh();
    } catch {
      setError("No se pudo conectar con el servidor");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-[100] print:hidden">
      {open ? (
        <div className="w-72 rounded-2xl border border-amber-500/40 bg-[#12121c]/95 backdrop-blur shadow-2xl shadow-black/50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-amber-500/10 border-b border-amber-500/30">
            <div className="flex items-center gap-2">
              <FlaskConical className="h-4 w-4 text-amber-400" />
              <span className="text-sm font-bold text-amber-400">Modo beta</span>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-gray-400 hover:text-white transition-colors"
              aria-label="Cerrar panel de modo beta"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="p-3 space-y-1">
            <p className="text-[11px] text-gray-500 px-1 pb-2">
              Salta a cualquier fase. Se rellenan los datos anteriores con contenido de ejemplo.
            </p>

            {JUMPABLE.map((phase) => {
              const info = PHASES.find((p) => p.id === phase);
              const isCurrent = phase === currentPhase;
              const key = "beta_goto" + JSON.stringify({ phase });

              return (
                <button
                  key={phase}
                  type="button"
                  disabled={busy !== null}
                  onClick={() => call("beta_goto", { phase }, PHASE_ROUTES[phase])}
                  className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm transition-colors disabled:opacity-50 ${
                    isCurrent
                      ? "bg-amber-500/20 text-amber-300"
                      : "text-gray-300 hover:bg-[#1a1a28] hover:text-white"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#1a1a28] text-[10px] font-bold flex items-center justify-center">
                      {info?.number}
                    </span>
                    {info?.title}
                  </span>
                  {busy === key ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5 opacity-50" />
                  )}
                </button>
              );
            })}

            <div className="pt-2 mt-2 border-t border-[#1e1e2e]">
              <button
                type="button"
                disabled={busy !== null}
                onClick={() => call("beta_reset", undefined, "/whitelist/discord")}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
              >
                {busy === 'beta_reset""' ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <RotateCcw className="h-3.5 w-3.5" />
                )}
                Reiniciar solicitud
              </button>
            </div>

            {error && <p className="text-xs text-red-400 px-1 pt-1">{error}</p>}
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-amber-500 hover:bg-amber-400 text-black text-sm font-bold shadow-lg shadow-amber-500/30 transition-colors"
        >
          <FlaskConical className="h-4 w-4" />
          Modo beta
        </button>
      )}
    </div>
  );
}
