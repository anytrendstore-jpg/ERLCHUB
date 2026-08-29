"use client";

import { useEffect, useRef } from "react";

const SESSION_KEY = "erlchub_store_session_id";

function getSessionId(): string {
  if (typeof window === "undefined") return "";
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

/** Id de sesión anónimo (dura lo que dura la pestaña) — se usa también para asociar la orden real
 * al recorrido que la generó, así el funnel se puede medir contra compras de verdad y no un
 * evento de "compra" separado que podría no coincidir con lo que el webhook confirmó. */
export function getStoreSessionId(): string {
  return getSessionId();
}

type Category = "hub-coins" | "membership" | "kit";
type EventType = "page_view" | "select_package" | "checkout_start";

export function trackStoreEvent(type: EventType, category: Category, catalogId?: string) {
  if (typeof window === "undefined") return;
  try {
    fetch("/api/store-events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type,
        category,
        catalogId,
        sessionId: getSessionId(),
        path: window.location.pathname,
        referrer: document.referrer || undefined,
      }),
      keepalive: true,
    }).catch(() => {});
  } catch {
    // el tracking nunca debe romper la página
  }
}

/** Dispara un page_view una sola vez al montar, para la página de producto indicada. */
export function useTrackPageView(category: Category, catalogId?: string) {
  const fired = useRef(false);
  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    trackStoreEvent("page_view", category, catalogId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, catalogId]);
}
