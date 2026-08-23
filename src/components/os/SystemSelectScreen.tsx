"use client";

import { useState } from "react";
import { Monitor, ShieldCheck } from "lucide-react";
import type { DepartmentConfig } from "@/lib/departments";
import { bootFont } from "@/lib/bootFont";
import { useCardTilt } from "@/hooks/useCardTilt";

interface SystemSelectScreenProps {
  displayName: string;
  avatar?: string;
  department: DepartmentConfig;
  onChoosePersonal: () => void;
  onChooseInstitutional: () => void;
}

const NOISE_BG =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

const CARD_SHELL =
  "group relative w-60 rounded-2xl overflow-hidden bg-gradient-to-b from-[#12121e] to-[#0a0a12] border border-white/10 transition-[transform,border-color,box-shadow] duration-300 ease-out will-change-transform [transform-style:preserve-3d] disabled:opacity-40 disabled:hover:translate-y-0";

/**
 * "¿Qué computadora abrís?" — la elección real entre el escritorio personal
 * y la terminal institucional. Antes esto se decidía solo (redirect forzado);
 * ahora la cuenta elegible ve las dos opciones, como pidió el usuario.
 */
export default function SystemSelectScreen({ displayName, avatar, department, onChoosePersonal, onChooseInstitutional }: SystemSelectScreenProps) {
  const [picked, setPicked] = useState<"personal" | "institutional" | null>(null);
  const [leaving, setLeaving] = useState(false);
  const scene = useCardTilt<HTMLDivElement>();
  const personalTilt = useCardTilt<HTMLButtonElement>();
  const institutionalTilt = useCardTilt<HTMLButtonElement>();

  const choose = (which: "personal" | "institutional") => {
    if (picked) return;
    setPicked(which);
    setLeaving(true);
    setTimeout(which === "personal" ? onChoosePersonal : onChooseInstitutional, 320);
  };

  return (
    <div
      ref={scene.ref}
      onMouseMove={scene.onMouseMove}
      className={`${bootFont.className} fixed inset-0 z-[9999] bg-[#07070c] flex flex-col items-center justify-center overflow-hidden transition-all duration-300 ${leaving ? "opacity-0 scale-[1.02]" : "opacity-100 scale-100"}`}
    >
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-500"
        style={{ background: 'radial-gradient(640px circle at var(--glow-x,50%) var(--glow-y,20%), rgba(99,102,241,0.10), transparent 65%)' }}
      />
      <div className="absolute -top-40 -left-32 w-[32rem] h-[32rem] rounded-full bg-blue-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-40 -right-32 w-[32rem] h-[32rem] rounded-full bg-[#8e00f7]/10 blur-[120px] pointer-events-none" />
      <div className="absolute inset-0 opacity-[0.14] pointer-events-none" style={{
        backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
        backgroundSize: "48px 48px",
        maskImage: "radial-gradient(ellipse 80% 70% at 50% 35%, black 40%, transparent 90%)",
        WebkitMaskImage: "radial-gradient(ellipse 80% 70% at 50% 35%, black 40%, transparent 90%)",
      }} />
      <div className="absolute inset-0 opacity-[0.025] pointer-events-none mix-blend-overlay" style={{ backgroundImage: NOISE_BG }} />
      <div className="scanline absolute inset-x-0 h-40 pointer-events-none opacity-[0.05] bg-gradient-to-b from-transparent via-white to-transparent" />

      <div className="relative z-10 flex flex-col items-center px-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <p className="text-white/40 text-[11px] uppercase tracking-[0.3em]">ERLC HUB OS · Personaje confirmado</p>
        </div>
        <h1 className="text-white text-3xl sm:text-4xl font-semibold tracking-tight mb-10 text-center" style={{ textShadow: '0 0 40px rgba(99,102,241,0.35)' }}>
          ¿Qué ordenador vas a abrir?
        </h1>

        <div className="flex flex-wrap items-start justify-center gap-6 [perspective:1200px]">
          <button
            ref={personalTilt.ref}
            onMouseMove={personalTilt.onMouseMove}
            onMouseLeave={personalTilt.onMouseLeave}
            onClick={() => choose("personal")}
            disabled={picked !== null}
            style={{
              animationDelay: "0ms",
              transform: 'rotateX(var(--tilt-x,0deg)) rotateY(var(--tilt-y,0deg))',
            }}
            className={`${CARD_SHELL} card-enter text-left hover:-translate-y-1 hover:border-blue-500/40 hover:shadow-[0_25px_60px_-20px_rgba(59,130,246,0.4)]`}
          >
            <div className="relative aspect-[4/5] bg-white/5 overflow-hidden flex items-center justify-center">
              {avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatar} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
              ) : (
                <Monitor className="w-10 h-10 text-white/20" />
              )}
              <div className="absolute inset-0 opacity-[0.04] mix-blend-overlay" style={{ backgroundImage: NOISE_BG }} />
              <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-black/90 to-transparent" />
              <div className="absolute inset-0 ring-1 ring-inset ring-white/5" />
              <div
                className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ background: 'radial-gradient(220px circle at var(--glow-x,50%) var(--glow-y,50%), rgba(255,255,255,0.10), transparent 60%)' }}
              />
              {picked === "personal" && (
                <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                  <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                </div>
              )}
              <p className="absolute bottom-2 left-3 right-3 text-white font-semibold text-base tracking-tight truncate">Computadora personal</p>
            </div>
            <div className="flex items-center gap-1.5 px-3.5 py-2 border-b border-white/5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
              <span className="text-[10px] text-white/35 uppercase tracking-wide font-mono">Cuenta personal</span>
            </div>
            <div className="px-3.5 py-2.5">
              <p className="text-white/45 text-[11px] leading-relaxed truncate">{displayName} · Escritorio, apps y tienda</p>
            </div>
            <div className="relative w-full py-2.5 text-[11px] text-center font-bold tracking-wide uppercase bg-gradient-to-r from-blue-600 to-[#8e00f7] text-white overflow-hidden">
              <span className="relative z-10">Entrar</span>
              <span className="shimmer absolute inset-0" />
            </div>
          </button>

          <button
            ref={institutionalTilt.ref}
            onMouseMove={institutionalTilt.onMouseMove}
            onMouseLeave={institutionalTilt.onMouseLeave}
            onClick={() => choose("institutional")}
            disabled={picked !== null}
            style={{
              animationDelay: "70ms",
              transform: 'rotateX(var(--tilt-x,0deg)) rotateY(var(--tilt-y,0deg))',
            }}
            className={`${CARD_SHELL} card-enter text-left hover:-translate-y-1 hover:border-white/25 hover:shadow-[0_25px_60px_-20px_rgba(255,255,255,0.18)]`}
          >
            <div className="relative aspect-[4/5] bg-white/[0.03] overflow-hidden flex items-center justify-center">
              <img src={department.badge} alt="" className="w-20 h-20 object-contain transition-transform duration-500 group-hover:scale-110" />
              <div className="absolute inset-0 opacity-[0.04] mix-blend-overlay" style={{ backgroundImage: NOISE_BG }} />
              <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-black/90 to-transparent" />
              <div className="absolute inset-0 ring-1 ring-inset ring-white/5" />
              <div
                className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ background: 'radial-gradient(220px circle at var(--glow-x,50%) var(--glow-y,50%), rgba(255,255,255,0.10), transparent 60%)' }}
              />
              {picked === "institutional" && (
                <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                  <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                </div>
              )}
              <p className="absolute bottom-2 left-3 right-3 text-white font-semibold text-base tracking-tight truncate uppercase">{department.factionAbbreviation} Workstation</p>
            </div>
            <div className="flex items-center gap-1.5 px-3.5 py-2 border-b border-white/5">
              <ShieldCheck className="w-3 h-3 text-blue-400" />
              <span className="text-[10px] text-blue-300/70 uppercase tracking-wide font-mono">Terminal institucional</span>
            </div>
            <div className="px-3.5 py-2.5">
              <p className="text-white/45 text-[11px] leading-relaxed truncate">{department.name} · Red segura</p>
            </div>
            <div className="w-full py-2.5 text-[11px] text-center font-bold tracking-wide uppercase bg-white/10 text-white/80 group-hover:bg-white/15 transition-colors">
              Entrar
            </div>
          </button>
        </div>
      </div>

      <style jsx>{`
        .card-enter {
          animation: cardEnter 0.55s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        @keyframes cardEnter {
          from { opacity: 0; transform: translateY(18px) rotateX(8deg) scale(0.96); }
          to { opacity: 1; transform: translateY(0) rotateX(0) scale(1); }
        }
        .scanline {
          animation: scanline 7s linear infinite;
          top: -10rem;
        }
        @keyframes scanline {
          0% { transform: translateY(0); }
          100% { transform: translateY(160vh); }
        }
        .shimmer {
          background: linear-gradient(115deg, transparent 20%, rgba(255,255,255,0.35) 50%, transparent 80%);
          background-size: 200% 100%;
          background-position: 150% 0;
          opacity: 0;
          transition: opacity 0.2s;
        }
        .group:hover .shimmer {
          opacity: 1;
          animation: shimmerSweep 1.1s ease-out;
        }
        @keyframes shimmerSweep {
          from { background-position: 150% 0; }
          to { background-position: -50% 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          .card-enter, .scanline, .shimmer { animation: none !important; }
        }
      `}</style>
    </div>
  );
}
