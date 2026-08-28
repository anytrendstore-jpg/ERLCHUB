"use client";

import { Shield, Zap, Star, Eye } from "lucide-react";
import { usePresence } from "@/hooks/usePresence";
import { useTiendaStats } from "@/hooks/useTiendaStats";
import { useReviews } from "@/hooks/useReviews";

/**
 * Bloque de confianza para el carrito/tienda: métodos de pago reales, reseñas reales, y un
 * contador de "gente viendo ahora" basado en presencia real (usePresence) — nunca un número
 * inventado. Si no hay suficientes datos reales para mostrar algo (0 gente viendo, 0 reseñas),
 * esa pieza simplemente no se renderiza, en vez de rellenarse con algo falso.
 */
export default function TrustSection({ page }: { page: string }) {
  const presenceCount = usePresence(page);
  const { stats: tiendaStats } = useTiendaStats();
  const { reviews } = useReviews("Tienda");
  const topReviews = reviews.filter((r) => r.rating >= 4).slice(0, 2);

  return (
    <div className="space-y-4">
      {presenceCount !== null && presenceCount > 0 && (
        <div className="flex items-center gap-2 text-sm text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2">
          <Eye className="h-4 w-4" />
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          {presenceCount === 1 ? "1 persona viendo la tienda ahora" : `${presenceCount} personas viendo la tienda ahora`}
        </div>
      )}

      {tiendaStats.totalOrders > 0 && (
        <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
          <Star className="h-4 w-4 text-[#fbbf24]" />
          {tiendaStats.totalOrders.toLocaleString()} compras completadas en ERLC HUB
        </div>
      )}

      <div className="bg-[var(--card-bg)] border border-[var(--card-border-soft)] rounded-xl p-4">
        <p className="text-xs text-[var(--text-muted)] mb-2 font-semibold uppercase tracking-wide">Métodos de pago</p>
        <div className="flex flex-wrap gap-2">
          <div className="bg-white rounded px-3 py-1.5">
            <svg className="h-4 w-auto" viewBox="0 0 48 32" fill="none">
              <path d="M17.958 10.283l-5.792 11.45h-3.79l-2.85-9.138c-.173-.679-.323-.928-.849-1.215-.86-.467-2.277-.905-3.523-1.177l.084-.42h6.099c.777 0 1.476.517 1.652 1.413l1.51 8.017 3.73-9.43h3.73zm14.722 7.71c.015-3.022-4.178-3.188-4.15-4.537.01-.41.4-.847 1.257-.958.424-.056 1.595-.098 2.923.514l.52-2.432a7.968 7.968 0 0 0-2.773-.507c-2.93 0-4.993 1.558-5.011 3.787-.02 1.65 1.473 2.57 2.6 3.118 1.159.562 1.543.922 1.543 1.424-.008.769-.925 1.108-1.78 1.12-1.495.024-2.364-.404-3.056-.726l-.54 2.52c.696.32 1.98.6 3.312.613 3.114 0 5.15-1.538 5.155-3.936zm7.727 3.74h3.27l-2.852-11.45h-3.02a1.463 1.463 0 0 0-1.37.914l-4.832 10.536h3.113l.618-1.712h3.805l.359 1.712h2.91zm-3.31-4.063l1.561-4.31.898 4.31h-2.46zM24.08 10.283l-2.452 11.45h-2.964l2.454-11.45h2.962z" fill="#1A1F71"/>
            </svg>
          </div>
          <div className="bg-white rounded px-3 py-1.5">
            <svg className="h-4 w-auto" viewBox="0 0 48 32" fill="none">
              <circle cx="18" cy="16" r="10" fill="#EB001B"/>
              <circle cx="30" cy="16" r="10" fill="#F79E1B"/>
              <path d="M24 8.02a9.965 9.965 0 0 0-6 7.98 9.965 9.965 0 0 0 6 7.98 9.965 9.965 0 0 0 6-7.98 9.965 9.965 0 0 0 6-7.98z" fill="#FF5F00"/>
            </svg>
          </div>
          <div className="bg-white rounded px-3 py-1.5 flex items-center">
            <span className="text-[10px] font-bold text-[#8e00f7]">Nequi</span>
          </div>
          <div className="bg-white rounded px-3 py-1.5 flex items-center">
            <span className="text-[10px] font-bold text-emerald-600">PSE</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-6 text-xs text-[var(--text-muted)]">
        <div className="flex items-center gap-1.5">
          <Shield className="h-4 w-4 text-[#8e00f7]" />
          Pago seguro
        </div>
        <div className="flex items-center gap-1.5">
          <Zap className="h-4 w-4 text-[#8e00f7]" />
          Entrega instantánea
        </div>
      </div>

      {topReviews.length > 0 && (
        <div className="space-y-2">
          {topReviews.map((review, i) => (
            <div key={i} className="bg-[var(--card-bg-2)] rounded-lg p-3 border border-[#2a2a3a]">
              <div className="flex items-center gap-1 mb-1">
                {Array.from({ length: 5 }, (_, s) => (
                  <Star key={s} className={`h-3 w-3 ${s < review.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-600"}`} />
                ))}
              </div>
              <p className="text-[var(--text-muted)] text-xs italic line-clamp-2">"{review.comment}"</p>
              <p className="text-[var(--text-faint)] text-[11px] mt-1">— {review.username || "Usuario"}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
