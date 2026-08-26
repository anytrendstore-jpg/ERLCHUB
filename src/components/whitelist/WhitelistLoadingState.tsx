"use client";

import { AlertCircle, Loader2, RotateCcw } from "lucide-react";

interface WhitelistLoadingStateProps {
  error?: string | null;
  onRetry?: () => void;
}

/**
 * Pantalla de carga a página completa — reemplaza el `<Loader2 spin />`
 * que quedaba girando para siempre si la carga inicial fallaba (sin red,
 * base de datos caída) sin darle al usuario ninguna forma de reintentar.
 */
export default function WhitelistLoadingState({ error, onRetry }: WhitelistLoadingStateProps) {
  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0a12] flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-6 w-6 text-red-400" />
          </div>
          <p className="text-white font-semibold mb-1">No pudimos cargar tu solicitud</p>
          <p className="text-gray-400 text-sm mb-5">{error}</p>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#1a1a28] hover:bg-[#2a2a3a] text-white text-sm font-semibold rounded-xl transition-colors"
            >
              <RotateCcw className="h-4 w-4" />
              Reintentar
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a12] flex items-center justify-center">
      <Loader2 className="h-8 w-8 text-[#8e00f7] animate-spin" />
    </div>
  );
}
