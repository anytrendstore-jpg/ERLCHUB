"use client";

import { useState } from "react";
import { Monitor, ShieldCheck } from "lucide-react";
import type { DepartmentConfig } from "@/lib/departments";

interface SystemSelectScreenProps {
  displayName: string;
  avatar?: string;
  department: DepartmentConfig;
  onChoosePersonal: () => void;
  onChooseInstitutional: () => void;
}

const CARD_SHELL =
  "group relative w-60 rounded-2xl overflow-hidden bg-[#0d0d16] border border-white/10 transition-all duration-300 hover:-translate-y-1.5 disabled:opacity-40 disabled:hover:translate-y-0";

/**
 * "¿Qué computadora abrís?" — la elección real entre el escritorio personal
 * y la terminal institucional. Antes esto se decidía solo (redirect forzado);
 * ahora la cuenta elegible ve las dos opciones, como pidió el usuario.
 */
export default function SystemSelectScreen({ displayName, avatar, department, onChoosePersonal, onChooseInstitutional }: SystemSelectScreenProps) {
  const [picked, setPicked] = useState<"personal" | "institutional" | null>(null);
  const [leaving, setLeaving] = useState(false);

  const choose = (which: "personal" | "institutional") => {
    if (picked) return;
    setPicked(which);
    setLeaving(true);
    setTimeout(which === "personal" ? onChoosePersonal : onChooseInstitutional, 320);
  };

  return (
    <div className={`fixed inset-0 z-[9999] bg-[#0a0a0f] flex flex-col items-center justify-center overflow-hidden transition-all duration-300 ${leaving ? "opacity-0 scale-[1.02]" : "opacity-100 scale-100"}`}>
      <div className="absolute -top-40 -left-32 w-[32rem] h-[32rem] rounded-full bg-blue-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-40 -right-32 w-[32rem] h-[32rem] rounded-full bg-[#8e00f7]/10 blur-[120px] pointer-events-none" />
      <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{
        backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
        backgroundSize: "60px 60px",
      }} />

      <div className="relative z-10 flex flex-col items-center px-6">
        <p className="text-white/40 text-[11px] uppercase tracking-[0.25em] mb-1">ERLC HUB OS</p>
        <h1 className="text-white text-2xl font-light mb-9">¿Qué ordenador vas a abrir?</h1>

        <div className="flex flex-wrap items-start justify-center gap-5">
          <button
            onClick={() => choose("personal")}
            disabled={picked !== null}
            style={{ animationDelay: "0ms" }}
            className={`${CARD_SHELL} card-enter text-left hover:border-blue-500/40 hover:shadow-[0_20px_45px_-20px_rgba(59,130,246,0.35)]`}
          >
            <div className="relative aspect-[4/5] bg-white/5 overflow-hidden flex items-center justify-center">
              {avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatar} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
              ) : (
                <Monitor className="w-10 h-10 text-white/20" />
              )}
              <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-black/85 to-transparent" />
              {picked === "personal" && (
                <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                  <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                </div>
              )}
              <p className="absolute bottom-2 left-3 right-3 text-white font-semibold text-sm truncate">Computadora personal</p>
            </div>
            <div className="flex items-center gap-1.5 px-3.5 py-2 border-b border-white/5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="text-[10px] text-white/35 uppercase tracking-wide">Cuenta personal</span>
            </div>
            <div className="px-3.5 py-2.5">
              <p className="text-white/45 text-[11px] leading-relaxed truncate">{displayName} · Escritorio, apps y tienda</p>
            </div>
            <div className="w-full py-2.5 text-[11px] text-center font-bold tracking-wide uppercase bg-gradient-to-r from-blue-600 to-[#8e00f7] text-white transition-opacity group-hover:opacity-90">
              Entrar
            </div>
          </button>

          <button
            onClick={() => choose("institutional")}
            disabled={picked !== null}
            style={{ animationDelay: "70ms" }}
            className={`${CARD_SHELL} card-enter text-left hover:border-white/25 hover:shadow-[0_20px_45px_-20px_rgba(255,255,255,0.15)]`}
          >
            <div className="relative aspect-[4/5] bg-white/[0.03] overflow-hidden flex items-center justify-center">
              <img src={department.badge} alt="" className="w-20 h-20 object-contain transition-transform duration-500 group-hover:scale-105" />
              <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-black/85 to-transparent" />
              {picked === "institutional" && (
                <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                  <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                </div>
              )}
              <p className="absolute bottom-2 left-3 right-3 text-white font-semibold text-sm truncate uppercase">{department.factionAbbreviation} Workstation</p>
            </div>
            <div className="flex items-center gap-1.5 px-3.5 py-2 border-b border-white/5">
              <ShieldCheck className="w-3 h-3 text-blue-400" />
              <span className="text-[10px] text-blue-300/70 uppercase tracking-wide">Terminal institucional</span>
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
          animation: cardEnter 0.45s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        @keyframes cardEnter {
          from { opacity: 0; transform: translateY(14px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
