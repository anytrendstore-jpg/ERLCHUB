"use client";

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";

export interface TerminalWindowInstance {
  id: string;
  kind: string;
  title: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  zIndex: number;
  minimized: boolean;
  maximized: boolean;
  props?: Record<string, unknown>;
}

interface OpenWindowOptions {
  title?: string;
  props?: Record<string, unknown>;
  position?: { x: number; y: number };
  size?: { width: number; height: number };
  maximized?: boolean;
  /** Si ya hay una ventana de este `kind` abierta, la enfoca en vez de crear otra instancia. */
  focusExisting?: boolean;
}

interface TerminalWindowContextType {
  windows: TerminalWindowInstance[];
  activeWindowId: string | null;
  openWindow: (kind: string, opts?: OpenWindowOptions) => string;
  closeWindow: (id: string) => void;
  focusWindow: (id: string) => void;
  minimizeWindow: (id: string) => void;
  toggleMaximize: (id: string) => void;
  updatePosition: (id: string, position: { x: number; y: number }) => void;
  updateSize: (id: string, size: { width: number; height: number }) => void;
}

const TerminalWindowContext = createContext<TerminalWindowContextType | undefined>(undefined);

const DEFAULT_SIZE = { width: 420, height: 340 };
const CASCADE_STEP = 28;

/**
 * Gestor de ventanas del terminal institucional — deliberadamente propio,
 * no reutiliza OSContext: ese sistema dedupea por appId (una sola ventana
 * por app), y acá se necesitan varias instancias simultáneas del mismo
 * `kind` (dos búsquedas de personas abiertas a la vez, etc).
 */
export function TerminalWindowProvider({ children }: { children: ReactNode }) {
  const [windows, setWindows] = useState<TerminalWindowInstance[]>([]);
  const [activeWindowId, setActiveWindowId] = useState<string | null>(null);
  const zIndexCounter = useRef(1);
  const cascadeCounter = useRef(0);
  const idCounter = useRef(0);

  const openWindow = useCallback((kind: string, opts: OpenWindowOptions = {}) => {
    if (opts.focusExisting) {
      const existing = windows.find((w) => w.kind === kind);
      if (existing) {
        focusWindowInternal(existing.id);
        return existing.id;
      }
    }

    idCounter.current += 1;
    const id = `${kind}-${Date.now()}-${idCounter.current}`;
    const n = cascadeCounter.current % 8;
    cascadeCounter.current += 1;
    zIndexCounter.current += 1;

    const instance: TerminalWindowInstance = {
      id,
      kind,
      title: opts.title || kind,
      position: opts.position || { x: 40 + n * CASCADE_STEP, y: 32 + n * CASCADE_STEP },
      size: opts.size || DEFAULT_SIZE,
      zIndex: zIndexCounter.current,
      minimized: false,
      maximized: Boolean(opts.maximized),
      props: opts.props,
    };

    setWindows((prev) => [...prev, instance]);
    setActiveWindowId(id);
    return id;

    function focusWindowInternal(targetId: string) {
      zIndexCounter.current += 1;
      const z = zIndexCounter.current;
      setWindows((prev) => prev.map((w) => (w.id === targetId ? { ...w, zIndex: z, minimized: false } : w)));
      setActiveWindowId(targetId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [windows]);

  const closeWindow = useCallback((id: string) => {
    setWindows((prev) => prev.filter((w) => w.id !== id));
    setActiveWindowId((prev) => (prev === id ? null : prev));
  }, []);

  const focusWindow = useCallback((id: string) => {
    zIndexCounter.current += 1;
    const z = zIndexCounter.current;
    setWindows((prev) => prev.map((w) => (w.id === id ? { ...w, zIndex: z, minimized: false } : w)));
    setActiveWindowId(id);
  }, []);

  const minimizeWindow = useCallback((id: string) => {
    setWindows((prev) => prev.map((w) => (w.id === id ? { ...w, minimized: true } : w)));
    setActiveWindowId((prev) => (prev === id ? null : prev));
  }, []);

  const toggleMaximize = useCallback((id: string) => {
    setWindows((prev) => prev.map((w) => (w.id === id ? { ...w, maximized: !w.maximized } : w)));
  }, []);

  const updatePosition = useCallback((id: string, position: { x: number; y: number }) => {
    setWindows((prev) => prev.map((w) => (w.id === id ? { ...w, position } : w)));
  }, []);

  const updateSize = useCallback((id: string, size: { width: number; height: number }) => {
    setWindows((prev) => prev.map((w) => (w.id === id ? { ...w, size } : w)));
  }, []);

  return (
    <TerminalWindowContext.Provider
      value={{ windows, activeWindowId, openWindow, closeWindow, focusWindow, minimizeWindow, toggleMaximize, updatePosition, updateSize }}
    >
      {children}
    </TerminalWindowContext.Provider>
  );
}

export function useTerminalWindows(): TerminalWindowContextType {
  const ctx = useContext(TerminalWindowContext);
  if (!ctx) throw new Error("useTerminalWindows debe usarse dentro de TerminalWindowProvider");
  return ctx;
}
