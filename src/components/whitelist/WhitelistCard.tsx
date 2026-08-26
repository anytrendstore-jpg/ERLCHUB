import type { ReactNode } from "react";

interface WhitelistCardProps {
  children: ReactNode;
  className?: string;
  /** "success" = borde/sombra verdes (página de completado). */
  variant?: "default" | "success";
}

/**
 * Shell de tarjeta compartido — antes cada página repetía
 * `bg-[#12121c]/90 backdrop-blur-sm border border-[#1e1e2e] rounded-2xl`
 * a mano. Ahora además tiene degradado + sombra en capas para que se sienta
 * con más profundidad que un panel plano.
 */
export default function WhitelistCard({ children, className = "", variant = "default" }: WhitelistCardProps) {
  const variantClass =
    variant === "success"
      ? "border-[#22c55e]/30 shadow-2xl shadow-[#22c55e]/10"
      : "border-[#1e1e2e] shadow-2xl shadow-black/40";

  return (
    <div
      className={`bg-gradient-to-b from-[#15151f]/95 to-[#0f0f18]/95 backdrop-blur-sm border rounded-2xl overflow-hidden ${variantClass} ${className}`}
    >
      {children}
    </div>
  );
}
