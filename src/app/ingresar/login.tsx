"use client";

import Link from "next/link";
import Image from "next/image";
import { X } from "lucide-react";
import ParticlesBackground from "@/components/ParticlesBackground";
import DiscordLogin from "@/components/DiscordLogin";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center px-4 py-12 relative overflow-hidden animate-modal-backdrop">
      <ParticlesBackground />

      <div className="relative z-10 w-full max-w-[400px] animate-modal-card">
        <div className="backdrop-blur-sm border border-[var(--card-border)] rounded-2xl shadow-2xl overflow-hidden" style={{ background: "color-mix(in srgb, var(--card-bg) 90%, transparent)" }}>
          <div className="flex items-center justify-between px-6 pt-6 pb-4">
            <div className="flex items-center gap-2">
              <Image
                src="/logo.png"
                alt="ERLC HUB"
                width={32}
                height={32}
                className="h-8 w-auto"
              />
              <span className="font-bold text-[var(--foreground)] text-lg">ERLCᴴᵁᴮ</span>
            </div>
            <Link
              href="/"
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 transition-colors"
            >
              <X className="h-5 w-5 text-[var(--text-muted)]" />
            </Link>
          </div>

          <div className="px-6 pb-6">
            <div className="flex bg-[var(--background)] rounded-xl p-1">
              <Link
                href="/ingresar"
                className="flex-1 py-2.5 text-center text-sm font-semibold rounded-lg bg-[#8e00f7] text-white transition-all"
              >
                Iniciar Sesión
              </Link>
              <Link
                href="/crear-cuenta"
                className="flex-1 py-2.5 text-center text-sm font-semibold rounded-lg text-[var(--text-muted)] hover:text-[var(--foreground)] transition-all"
              >
                Crear Cuenta
              </Link>
            </div>
          </div>

          <div className="px-6 pb-6">
            <div className="text-center mb-4">
              <p className="text-[var(--text-muted)] text-sm">Inicia sesión rápidamente con Discord</p>
            </div>
            <DiscordLogin />
          </div>

          <div className="px-6 pb-6 text-center">
            <p className="text-sm text-[var(--text-faint)]">
              ¿No tienes cuenta?{" "}
              <Link href="/crear-cuenta" className="text-[#8e00f7] hover:text-[#a64dfa] font-medium transition-colors">
                Crear cuenta
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}