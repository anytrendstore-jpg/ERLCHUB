"use client";

import { useEffect, useState } from "react";
import type { DepartmentConfig } from "@/lib/departments";

interface InstitutionalTransitionProps {
  direction: "to-institutional" | "to-personal";
  department: DepartmentConfig;
  onComplete: () => void;
}

const LINE_DELAY = 150;

function bootLines(department: DepartmentConfig): string[] {
  return [
    "POWER SYSTEM: ONLINE",
    "INITIALIZING TERMINAL...",
    `${department.factionAbbreviation} SECURE NETWORK`,
    `TERMINAL NODE: ${department.terminalKey}`,
    "HARDWARE STATUS: ONLINE",
    "SECURE NETWORK: CONNECTING",
    "LOADING SYSTEM KERNEL...",
    "VERIFYING NETWORK NODE...",
    "ESTABLISHING SECURE CONNECTION...",
    "LOADING AUTHORIZATION SERVICES...",
  ];
}

const SHUTDOWN_LINES = [
  "TERMINATING SECURE SESSION...",
  "CLOSING SECURE CONNECTIONS...",
  "CLEARING TEMPORARY SESSION...",
  "SESSION TERMINATED.",
];

/**
 * Teatro de "cambio de máquina" — no es decoración: comunica que el
 * personal y el institucional son dos computadoras distintas, no un cambio
 * de tema dentro de la misma. Sin arte, solo texto de sistema apareciendo.
 */
export default function InstitutionalTransition({ direction, department, onComplete }: InstitutionalTransitionProps) {
  const [phase, setPhase] = useState<"signing-out" | "no-signal" | "booting" | "ready">(
    direction === "to-institutional" ? "signing-out" : "signing-out"
  );
  const [visibleLines, setVisibleLines] = useState(0);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    if (direction === "to-institutional") {
      timers.push(setTimeout(() => setPhase("no-signal"), 550));
      timers.push(setTimeout(() => setPhase("booting"), 950));
      const lines = bootLines(department);
      lines.forEach((_, i) => {
        timers.push(setTimeout(() => setVisibleLines(i + 1), 950 + (i + 1) * LINE_DELAY));
      });
      const readyAt = 950 + lines.length * LINE_DELAY + 100;
      timers.push(setTimeout(() => setPhase("ready"), readyAt));
      timers.push(setTimeout(onComplete, readyAt + 380));
    } else {
      const lines = SHUTDOWN_LINES;
      lines.forEach((_, i) => {
        timers.push(setTimeout(() => setVisibleLines(i + 1), i * LINE_DELAY));
      });
      const blackoutAt = lines.length * LINE_DELAY + 150;
      timers.push(setTimeout(() => setPhase("no-signal"), blackoutAt));
      timers.push(setTimeout(onComplete, blackoutAt + 450));
    }

    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [direction]);

  const lines = direction === "to-institutional" ? bootLines(department) : SHUTDOWN_LINES;

  return (
    <div className="fixed inset-0 z-[9999] bg-black flex items-center justify-center font-mono">
      {phase === "no-signal" ? (
        <span className="text-[#3a4256] text-xs tracking-[0.3em]">NO SIGNAL</span>
      ) : phase === "ready" ? (
        <span className="text-[#6f93d6] text-sm tracking-[0.2em] animate-pulse">SYSTEM READY</span>
      ) : (
        <div className="w-full max-w-md px-6">
          {direction === "to-institutional" && phase === "signing-out" && (
            <p className="text-[#4a5372] text-xs tracking-[0.25em] text-center">SIGNING OUT</p>
          )}
          {(phase === "booting" || direction === "to-personal") && (
            <div className="space-y-1">
              {lines.slice(0, visibleLines).map((line, i) => (
                <p key={i} className="text-[#6d7999] text-[11px] tracking-wide">
                  <span className="text-[#3c68c9] mr-1.5">&gt;</span>{line}
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
