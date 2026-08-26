"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { WhitelistPhase, ApplicationStatus } from "@/lib/whitelistTypes";

export interface WhitelistApplicationView {
  applicationId: string;
  discordId: string;
  fullName: string;
  email?: string;
  currentPhase: WhitelistPhase;
  status: ApplicationStatus;
  nextRoute: string;
  discord: {
    id: string;
    username: string;
    globalName?: string;
    avatar?: string;
    source: "oauth" | "dev";
    joinedServer: boolean;
    acceptedRules: boolean;
  };
  roblox?: {
    id?: string;
    username: string;
    displayName?: string;
    avatar?: string;
    verificationCode: string;
    verified: boolean;
    verifiedMode?: "api" | "offline" | "oauth";
  };
  questionnaireDraft?: Record<string, string>;
  questionnaireScore?: number;
  submittedAt?: string;
  reviewedAt?: string;
  staffNotes?: string;
  character?: Record<string, string>;
  characterDraft?: Record<string, string>;
  document?: {
    type: string;
    number: string;
    issueDate: string;
    expiryDate: string;
    qrCode: string;
    securityCode: string;
  };
  memberNumber?: number;
  createdAt: string;
}

export interface WhitelistQueue {
  position: number;
  total: number;
}

/**
 * Carga la solicitud de whitelist del navegador actual y expone `run()` para
 * ejecutar acciones del proceso contra la base de datos.
 *
 * `acceptedPhases` protege la página: si la solicitud está en otra fase,
 * redirige a la que corresponde.
 */
export function useWhitelistApplication(acceptedPhases?: WhitelistPhase[]) {
  const router = useRouter();
  const [application, setApplication] = useState<WhitelistApplicationView | null>(null);
  const [queue, setQueue] = useState<WhitelistQueue | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (guard = false) => {
      try {
        const response = await fetch("/api/whitelist/application", { cache: "no-store" });

        if (response.status === 401) {
          router.replace("/whitelist");
          return null;
        }

        const data = await response.json();
        if (!data.success) {
          setError(data.error || "No se pudo cargar tu solicitud");
          return null;
        }

        setApplication(data.application);
        setQueue(data.queue);
        setError(null);

        if (guard && acceptedPhases && !acceptedPhases.includes(data.application.currentPhase)) {
          router.replace(data.application.nextRoute);
        }
        return data.application as WhitelistApplicationView;
      } catch {
        setError("No se pudo conectar con el servidor");
        return null;
      } finally {
        setLoading(false);
      }
    },
    // acceptedPhases se pasa como literal en cada página; no se recrea el efecto.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [router]
  );

  useEffect(() => {
    load(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Ejecuta una acción del proceso. Devuelve la solicitud actualizada o lanza. */
  const run = useCallback(async (action: string, data?: unknown) => {
    const response = await fetch("/api/whitelist/application", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, data }),
    });

    const payload = await response.json();
    if (!response.ok || !payload.success) {
      throw new Error(payload.error || "No se pudo guardar el cambio");
    }

    setApplication(payload.application);
    return payload.application as WhitelistApplicationView;
  }, []);

  return { application, queue, loading, error, setError, reload: load, run };
}
