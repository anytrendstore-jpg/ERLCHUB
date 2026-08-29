"use client";

import { useEffect, useState } from "react";

function formatCompact(n: number) {
  if (n >= 1000) {
    const v = n / 1000;
    return `${v >= 10 ? Math.round(v) : v.toFixed(1)}K`;
  }
  return `${Math.round(n)}`;
}

/**
 * Número que cuenta rápido hacia arriba al montar (ease-out: arranca veloz y
 * frena justo antes de llegar) y termina mostrando el formato compacto final
 * con el sufijo (ej. "13K+"). Solo corre una vez por montaje.
 */
export default function CountUpStat({ target, duration = 1400, suffix = "+" }: { target: number; duration?: number; suffix?: string }) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    let raf: number;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.floor(eased * target));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  const done = value >= target;
  return (
    <>
      {formatCompact(done ? target : value)}
      {done ? suffix : ""}
    </>
  );
}
