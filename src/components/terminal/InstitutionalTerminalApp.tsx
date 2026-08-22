"use client";

import { useState } from "react";
import { SplashScreen } from "@/components/os/apps/MDTApp";
import InstitutionalLoginTheater from "./InstitutionalLoginTheater";
import TerminalDesktop from "./TerminalDesktop";

type Stage = "boot" | "login" | "desktop";

interface InstitutionalTerminalAppProps {
  /** Solo desarrollo — salta el arranque y acelera el login narrado, con un oficial simulado. */
  demo?: boolean;
}

/**
 * Top-level de la terminal institucional — reemplaza a <MDTApp/> SOLO acá.
 * MDTApp.tsx sigue intacto para el uso dentro del escritorio personal.
 * El avance de etapa lo decide cada pantalla (no el `isAuthenticated` crudo
 * de MDTContext), para que la narración del login no se corte apenas
 * resuelve el fetch real.
 */
export default function InstitutionalTerminalApp({ demo }: InstitutionalTerminalAppProps) {
  const [stage, setStage] = useState<Stage>(demo ? "login" : "boot");

  if (stage === "boot") return <SplashScreen onComplete={() => setStage("login")} />;
  if (stage === "login") return <InstitutionalLoginTheater demo={demo} onComplete={() => setStage("desktop")} />;
  return <TerminalDesktop />;
}
