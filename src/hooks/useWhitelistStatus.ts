"use client";

import { useEffect, useState } from "react";
import type { ApplicationStatus, WhitelistPhase } from "@/lib/whitelistTypes";

export interface WhitelistStatus {
  isStaff: boolean;
  hasApplication: boolean;
  currentPhase: WhitelistPhase | null;
  status: ApplicationStatus | null;
  completed: boolean;
  /** Ruta a la que llevar al usuario para continuar (o empezar) su whitelist. */
  nextRoute: string;
  loading: boolean;
}

const INITIAL: WhitelistStatus = {
  isStaff: false,
  hasApplication: false,
  currentPhase: null,
  status: null,
  completed: false,
  nextRoute: "/whitelist",
  loading: true,
};

/**
 * Estado de whitelist y de staff de quien navega. Lo usa la barra de navegación
 * para decidir si ofrecer "Hacer whitelist", "Continuar" o entrar al dashboard.
 */
export function useWhitelistStatus(): WhitelistStatus {
  const [state, setState] = useState<WhitelistStatus>(INITIAL);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/whitelist/status", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        setState({
          isStaff: Boolean(data.isStaff),
          hasApplication: Boolean(data.hasApplication),
          currentPhase: data.currentPhase ?? null,
          status: data.status ?? null,
          completed: Boolean(data.completed),
          nextRoute: data.nextRoute || "/whitelist",
          loading: false,
        });
      })
      .catch(() => {
        if (!cancelled) setState({ ...INITIAL, loading: false });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
