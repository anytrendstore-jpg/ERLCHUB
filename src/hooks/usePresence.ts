"use client";

import { useEffect, useState } from "react";

const PING_INTERVAL_MS = 20000;
const COUNT_INTERVAL_MS = 15000;

function getSessionId(): string {
  const key = "erlchub_presence_session";
  let id = sessionStorage.getItem(key);
  if (!id) {
    id = Math.random().toString(36).slice(2) + Date.now().toString(36);
    sessionStorage.setItem(key, id);
  }
  return id;
}

/**
 * Cantidad REAL de sesiones activas viendo esta página ahora mismo (últimos 45s) — ver
 * presenceServer.ts. Arranca en null mientras no hay una primera lectura real, nunca se
 * inventa un número de partida.
 */
export function usePresence(page: string) {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    let sessionId: string;
    try {
      sessionId = getSessionId();
    } catch {
      return; // sessionStorage no disponible (SSR/privado) — sin presencia, sin inventar nada.
    }

    const ping = () => fetch("/api/presence/ping", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sessionId, page }) }).catch(() => {});
    const fetchCount = () => fetch(`/api/presence/count?page=${encodeURIComponent(page)}`).then((r) => r.json()).then((d) => { if (d.success) setCount(d.count); }).catch(() => {});

    ping();
    fetchCount();
    const pingInterval = setInterval(ping, PING_INTERVAL_MS);
    const countInterval = setInterval(fetchCount, COUNT_INTERVAL_MS);

    return () => {
      clearInterval(pingInterval);
      clearInterval(countInterval);
    };
  }, [page]);

  return count;
}
