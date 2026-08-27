"use client";

import { useState } from "react";
import { SplashScreen } from "@/components/os/apps/MDTApp";
import FDLoginTheater from "./FDLoginTheater";
import FDDesktop from "./FDDesktop";

type Stage = "boot" | "login" | "desktop";

interface FDTerminalAppProps {
  /** Solo desarrollo — salta el arranque y acelera el login narrado, con un bombero simulado. */
  demo?: boolean;
}

/**
 * Top-level de la terminal institucional de LSFD — espejo de
 * InstitutionalTerminalApp.tsx pero con identidad y contexto propios
 * (FDContext, no MDTContext). SplashScreen se reutiliza tal cual: ya es
 * agnóstico de departamento.
 */
export default function FDTerminalApp({ demo }: FDTerminalAppProps) {
  const [stage, setStage] = useState<Stage>(demo ? "login" : "boot");

  if (stage === "boot") return <SplashScreen onComplete={() => setStage("login")} />;
  if (stage === "login") return <FDLoginTheater demo={demo} onComplete={() => setStage("desktop")} />;
  return <FDDesktop />;
}
