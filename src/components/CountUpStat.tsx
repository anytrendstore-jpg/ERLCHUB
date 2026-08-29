"use client";

import { useEffect, useState } from "react";

function formatCompact(n: number) {
  if (n >= 1000) {
    const v = n / 1000;
    return `${v >= 10 ? Math.round(v) : v.toFixed(1)}K`;
  }
  return `${Math.round(n)}`;
}

/** Agrupa miles con punto (13894 -> "13.894"), como se usa en LatAm — no depende
 * de Intl/locale para no arrastrar la coma decimal de es-ES en otros números. */
function withThousands(n: number) {
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/**
 * Número que cuenta rápido hacia arriba al montar (ease-out: arranca veloz y
 * frena justo antes de llegar). Por defecto muestra el entero exacto con
 * separador de miles; con `decimals` muestra decimales (ej. rating "4.8"); con
 * `compact` usa notación corta (ej. "13K"). El sufijo solo aparece al terminar
 * la animación. Vuelve a animar si `target` cambia (útil para stats en vivo).
 */
export default function CountUpStat({
  target,
  duration = 1400,
  suffix = "",
  decimals = 0,
  compact = false,
}: {
  target: number;
  duration?: number;
  suffix?: string;
  decimals?: number;
  compact?: boolean;
}) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    let raf: number;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(eased * target);
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  const done = value >= target;
  const shown = done ? target : value;
  const formatted = compact ? formatCompact(shown) : decimals > 0 ? shown.toFixed(decimals) : withThousands(shown);

  return (
    <>
      {formatted}
      {done ? suffix : ""}
    </>
  );
}
