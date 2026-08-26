"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { LogOut, X } from "lucide-react";

interface WhitelistHeaderProps {
  /** "default" = logo + folio + Salir (páginas del proceso) · "close" = logo + X a inicio (página de acceso) · "minimal" = solo logo (página final). */
  variant?: "default" | "close" | "minimal";
  applicationId?: string;
}

/**
 * Header único para todo el flujo de whitelist. Antes cada página reimplementaba
 * su propio header con un comportamiento distinto (a veces "Volver" a una ruta
 * fija, a veces "Salir", a veces nada) — como el flujo es una compuerta lineal
 * (no se puede "volver" a re-editar una fase ya superada, el guard de cada
 * página te rebota de inmediato), la única acción de salida que siempre
 * funciona de verdad es cerrar la sesión, así que es la única que se ofrece.
 */
export default function WhitelistHeader({ variant = "default", applicationId }: WhitelistHeaderProps) {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/whitelist/auth/logout", { method: "POST" });
    router.replace("/whitelist");
  };

  return (
    <header className="relative z-20 py-4 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.png" alt="ERLC HUB" width={40} height={40} className="h-10 w-auto" />
          <span className="font-bold text-[var(--foreground)] text-lg">ERLCᴴᵁᴮ</span>
        </Link>

        {variant === "close" && (
          <Link
            href="/"
            className="w-10 h-10 flex items-center justify-center rounded-xl border border-[var(--card-border-soft)] hover:bg-[var(--card-bg-2)] transition-colors"
            style={{ background: "color-mix(in srgb, var(--card-bg) 80%, transparent)" }}
          >
            <X className="h-5 w-5 text-[var(--text-muted)]" />
          </Link>
        )}

        {variant === "default" && (
          <div className="flex items-center gap-4">
            {applicationId && (
              <span className="hidden sm:inline text-xs text-[var(--text-faint)] font-mono">{applicationId}</span>
            )}
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--foreground)] transition-colors text-sm"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
