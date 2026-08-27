"use client";

import { useEffect, useRef, useState } from "react";
import { useFD } from "@/contexts/FDContext";
import { useDepartment } from "@/contexts/DepartmentContext";

/**
 * Login narrado de la terminal LSFD — espejo de InstitutionalLoginTheater.tsx.
 * La autenticación real (Discord + membresía activa en LSFD) ya pasó en el
 * servidor; esto narra el login() de FDContext, que resuelve el rango real
 * de la facción (no un rango de terminal fijo como en MDT).
 */
interface FDLoginTheaterProps {
  onComplete: () => void;
  demo?: boolean;
}

export default function FDLoginTheater({ onComplete, demo }: FDLoginTheaterProps) {
  const { state, login, loginDemo } = useFD();
  const department = useDepartment();
  const [step, setStep] = useState(0);
  const [denied, setDenied] = useState(false);
  const startedRef = useRef(false);
  const loginPromiseRef = useRef<Promise<boolean> | null>(null);

  useEffect(() => {
    const speed = demo ? 0.25 : 1;
    const timers: ReturnType<typeof setTimeout>[] = [];
    timers.push(setTimeout(() => setStep(1), 380 * speed));
    timers.push(setTimeout(() => setStep(2), 720 * speed));
    timers.push(setTimeout(() => setStep(3), 1020 * speed));
    timers.push(setTimeout(() => setStep(4), 1360 * speed));

    if (!startedRef.current) {
      startedRef.current = true;
      loginPromiseRef.current = demo ? (loginDemo(), Promise.resolve(true)) : login();
    }

    loginPromiseRef.current!.then((ok) => {
      timers.push(setTimeout(() => { if (!ok) setDenied(true); setStep(5); }, 1650 * speed));
    });

    return () => timers.forEach(clearTimeout);
  }, [login, loginDemo, demo]);

  useEffect(() => {
    if (step !== 5 || denied) return;
    if (!state.currentFirefighter) return;
    const t = setTimeout(() => setStep(6), demo ? 120 : 480);
    return () => clearTimeout(t);
  }, [step, denied, state.currentFirefighter, demo]);

  useEffect(() => {
    if (step !== 6) return;
    const t = setTimeout(onComplete, demo ? 150 : 550);
    return () => clearTimeout(t);
  }, [step, onComplete, demo]);

  const firefighter = state.currentFirefighter;

  const lines: string[] = ["IDENTIFYING USER..."];
  if (step >= 1) lines.push("BADGE VERIFIED.");
  if (step >= 2) lines.push("CHECKING DEPARTMENT...");
  if (step >= 3) lines.push(`${department.name.toUpperCase()} — STATUS: ACTIVE`);
  if (step >= 4) lines.push("VERIFYING RANK...");
  if (step >= 5) {
    lines.push(denied ? "ACCESS DENIED." : firefighter ? `${firefighter.rankName.toUpperCase()} — CLEARANCE LEVEL: ${String(firefighter.rankLevel).padStart(2, "0")}` : "...");
  }
  if (step >= 6) lines.push("ACCESS GRANTED.");

  return (
    <div className="fixed inset-0 z-[9999] bg-[#0a0a0c] flex items-center justify-center font-mono">
      <div className="w-full max-w-md px-6">
        <div className="flex items-center gap-3 mb-6">
          <img src={department.badge} alt="" className="h-10 w-auto" />
          <div className="leading-tight">
            <div className="text-[#e5e3de] text-[11px] font-semibold tracking-wide uppercase">{department.name}</div>
            <div className="text-[#5a564e] text-[9px] tracking-[0.15em] uppercase">Internal Information System</div>
          </div>
        </div>

        <div className="border-t border-b border-[#2a2620] py-3 mb-4 grid grid-cols-2 gap-x-4 gap-y-1 text-[10px]">
          <span className="text-[#5a564e]">TERMINAL ID</span>
          <span className="text-[#867e70] text-right">{department.terminalKey}-{department.factionAbbreviation}</span>
          <span className="text-[#5a564e]">BADGE ID</span>
          <span className="text-[#867e70] text-right">{firefighter ? `#${firefighter.badgeNumber}` : "········"}</span>
          <span className="text-[#5a564e]">ACCESS KEY</span>
          <span className="text-[#867e70] text-right">••••••••</span>
        </div>

        <div className="space-y-1 min-h-[110px]">
          {lines.map((line, i) => {
            const isFinal = (denied && line.startsWith("ACCESS DENIED")) || line === "ACCESS GRANTED.";
            return (
              <p key={i} className={`text-[11px] tracking-wide ${isFinal ? (denied ? "text-[#c0665c] font-semibold" : "text-[#c0392b] font-semibold") : "text-[#867e70]"}`}>
                <span className="text-[#c0392b] mr-1.5">&gt;</span>{line}
              </p>
            );
          })}
        </div>

        {denied && (
          <div className="mt-3">
            <p className="text-[#c0665c] text-[10px] mb-2">No se pudo verificar el perfil de bombero. Probá de nuevo en unos segundos.</p>
            <button onClick={() => window.location.reload()} className="text-[10px] text-[#d4af37] hover:text-white underline underline-offset-2">Reintentar</button>
          </div>
        )}
      </div>
    </div>
  );
}
