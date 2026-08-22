"use client";

import { useEffect, useRef, useState } from "react";
import { useMDT } from "@/contexts/MDTContext";
import { useDepartment } from "@/contexts/DepartmentContext";
import { clearanceLevel } from "@/lib/clearance";

/**
 * Login narrado del terminal institucional — la autenticación REAL ya pasó
 * en el servidor (Discord + membresía de facción, antes de llegar acá);
 * esto narra el `login()` de MDTContext (que sí hace un fetch real a
 * /api/mdt/officer) en vez de fingir un formulario de usuario/contraseña.
 */
interface InstitutionalLoginTheaterProps {
  onComplete: () => void;
  /** Solo desarrollo — entra con loginDemo() (sin Discord/DB) y acorta los tiempos. */
  demo?: boolean;
}

export default function InstitutionalLoginTheater({ onComplete, demo }: InstitutionalLoginTheaterProps) {
  const { state, login, loginDemo } = useMDT();
  const department = useDepartment();
  const [step, setStep] = useState(0);
  const [denied, setDenied] = useState(false);
  // Dispara login()/loginDemo() una sola vez (efecto secundario real: fetch,
  // marca on-duty, auditoría) aunque el efecto corra dos veces en desarrollo
  // por el doble-invocado de React 18 Strict Mode.
  const startedRef = useRef(false);
  const loginPromiseRef = useRef<Promise<boolean> | null>(null);

  useEffect(() => {
    // Los timers SÍ se reprograman en cada pasada del efecto — con un guard acá
    // (como antes) el cleanup de la primera pasada de Strict Mode los cancela
    // y la segunda pasada, bloqueada por el guard, nunca los reponía: la
    // narración quedaba congelada para siempre en "IDENTIFYING USER...".
    const speed = demo ? 0.25 : 1;
    const timers: ReturnType<typeof setTimeout>[] = [];
    timers.push(setTimeout(() => setStep(1), 380 * speed));
    timers.push(setTimeout(() => setStep(2), 720 * speed));
    timers.push(setTimeout(() => setStep(3), 1020 * speed));
    timers.push(setTimeout(() => setStep(4), 1360 * speed));

    if (!startedRef.current) {
      startedRef.current = true;
      loginPromiseRef.current = demo ? (loginDemo(), Promise.resolve(true)) : login("", "");
    }

    loginPromiseRef.current!.then((ok) => {
      timers.push(setTimeout(() => { if (!ok) setDenied(true); setStep(5); }, 1650 * speed));
    });

    return () => timers.forEach(clearTimeout);
  }, [login, loginDemo, demo]);

  // El paso 5 necesita currentOfficer, que llega en un render posterior al
  // resolve de login() (setState async dentro de MDTContext) — se espera acá.
  useEffect(() => {
    if (step !== 5 || denied) return;
    if (!state.currentOfficer) return;
    const t = setTimeout(() => setStep(6), demo ? 120 : 480);
    return () => clearTimeout(t);
  }, [step, denied, state.currentOfficer, demo]);

  useEffect(() => {
    if (step !== 6) return;
    const t = setTimeout(onComplete, demo ? 150 : 550);
    return () => clearTimeout(t);
  }, [step, onComplete, demo]);

  const officer = state.currentOfficer;
  const level = officer ? clearanceLevel(officer.rank) : 0;

  const lines: string[] = ["IDENTIFYING USER..."];
  if (step >= 1) lines.push("BADGE VERIFIED.");
  if (step >= 2) lines.push("CHECKING DEPARTMENT...");
  if (step >= 3) lines.push(`${department.name.toUpperCase()} — STATUS: ACTIVE`);
  if (step >= 4) lines.push("VERIFYING RANK...");
  if (step >= 5) {
    lines.push(denied ? "ACCESS DENIED." : officer ? `${officer.rank.toUpperCase()} — CLEARANCE LEVEL: ${String(level).padStart(2, "0")}` : "...");
  }
  if (step >= 6) lines.push("ACCESS GRANTED.");

  return (
    <div className="fixed inset-0 z-[9999] bg-[#05070d] flex items-center justify-center font-mono">
      <div className="w-full max-w-md px-6">
        <div className="flex items-center gap-3 mb-6">
          <img src={department.badge} alt="" className="h-10 w-auto" />
          <div className="leading-tight">
            <div className="text-[#dde3f2] text-[11px] font-semibold tracking-wide uppercase">{department.name}</div>
            <div className="text-[#4a5372] text-[9px] tracking-[0.15em] uppercase">Internal Information System</div>
          </div>
        </div>

        <div className="border-t border-b border-[#1e2a45] py-3 mb-4 grid grid-cols-2 gap-x-4 gap-y-1 text-[10px]">
          <span className="text-[#4a5372]">TERMINAL ID</span>
          <span className="text-[#6d7999] text-right">{department.terminalKey}-{department.factionAbbreviation}</span>
          <span className="text-[#4a5372]">BADGE ID</span>
          <span className="text-[#6d7999] text-right">{officer ? `#${officer.badgeNumber}` : "········"}</span>
          <span className="text-[#4a5372]">ACCESS KEY</span>
          <span className="text-[#6d7999] text-right">••••••••</span>
        </div>

        <div className="space-y-1 min-h-[110px]">
          {lines.map((line, i) => {
            const isFinal = (denied && line.startsWith("ACCESS DENIED")) || line === "ACCESS GRANTED.";
            return (
              <p key={i} className={`text-[11px] tracking-wide ${isFinal ? (denied ? "text-[#c0665c] font-semibold" : "text-[#6f93d6] font-semibold") : "text-[#6d7999]"}`}>
                <span className="text-[#3c68c9] mr-1.5">&gt;</span>{line}
              </p>
            );
          })}
        </div>

        {denied && (
          <div className="mt-3">
            <p className="text-[#c0665c] text-[10px] mb-2">No se pudo verificar el perfil de oficial. Probá de nuevo en unos segundos.</p>
            <button onClick={() => window.location.reload()} className="text-[10px] text-[#6f93d6] hover:text-white underline underline-offset-2">Reintentar</button>
          </div>
        )}
      </div>
    </div>
  );
}
