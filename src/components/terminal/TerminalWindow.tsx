"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { X, Minus, Maximize2, Minimize2 } from "lucide-react";
import { useTerminalWindows, type TerminalWindowInstance } from "@/contexts/TerminalWindowContext";

const MIN_WIDTH = 300;
const MIN_HEIGHT = 220;
const FUNCBAR_HEIGHT = 30;

interface TerminalWindowProps {
  win: TerminalWindowInstance;
  children: React.ReactNode;
}

/**
 * Shell de ventana del terminal institucional — mismo patrón de arrastre y
 * resize que src/components/os/Window.tsx, pero desacoplado de OSContext
 * (usa TerminalWindowContext, que sí permite varias instancias del mismo
 * `kind`) y con el look navy/terminal en vez del cristal del escritorio personal.
 */
export default function TerminalWindow({ win, children }: TerminalWindowProps) {
  const { activeWindowId, closeWindow, minimizeWindow, toggleMaximize, focusWindow, updatePosition, updateSize } = useTerminalWindows();

  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const [resizeEdge, setResizeEdge] = useState<"right" | "bottom" | "corner" | null>(null);
  const resizeStart = useRef({ mouseX: 0, mouseY: 0, width: 0, height: 0 });

  const isActive = activeWindowId === win.id;

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest(".win-controls")) return;
    focusWindow(win.id);
    setIsDragging(true);
    dragOffset.current = { x: e.clientX - win.position.x, y: e.clientY - win.position.y };
  }, [win.id, win.position, focusWindow]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    const newX = Math.max(0, Math.min(e.clientX - dragOffset.current.x, globalThis.innerWidth - 160));
    const newY = Math.max(0, Math.min(e.clientY - dragOffset.current.y, globalThis.innerHeight - 100));
    updatePosition(win.id, { x: newX, y: newY });
  }, [isDragging, win.id, updatePosition]);

  const handleMouseUp = useCallback(() => setIsDragging(false), []);

  useEffect(() => {
    if (!isDragging) return;
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const handleResizeStart = useCallback((edge: "right" | "bottom" | "corner") => (e: React.MouseEvent) => {
    if (win.maximized) return;
    e.stopPropagation();
    focusWindow(win.id);
    resizeStart.current = { mouseX: e.clientX, mouseY: e.clientY, width: win.size.width, height: win.size.height };
    setResizeEdge(edge);
  }, [win.maximized, win.id, win.size, focusWindow]);

  const handleResizeMove = useCallback((e: MouseEvent) => {
    if (!resizeEdge) return;
    const { mouseX, mouseY, width, height } = resizeStart.current;
    const newSize = { width, height };
    if (resizeEdge === "right" || resizeEdge === "corner") {
      newSize.width = Math.max(MIN_WIDTH, Math.min(width + (e.clientX - mouseX), globalThis.innerWidth - win.position.x - 10));
    }
    if (resizeEdge === "bottom" || resizeEdge === "corner") {
      newSize.height = Math.max(MIN_HEIGHT, Math.min(height + (e.clientY - mouseY), globalThis.innerHeight - win.position.y - FUNCBAR_HEIGHT - 10));
    }
    updateSize(win.id, newSize);
  }, [resizeEdge, win.id, win.position, updateSize]);

  const handleResizeEnd = useCallback(() => setResizeEdge(null), []);

  useEffect(() => {
    if (!resizeEdge) return;
    document.addEventListener("mousemove", handleResizeMove);
    document.addEventListener("mouseup", handleResizeEnd);
    return () => {
      document.removeEventListener("mousemove", handleResizeMove);
      document.removeEventListener("mouseup", handleResizeEnd);
    };
  }, [resizeEdge, handleResizeMove, handleResizeEnd]);

  if (win.minimized) return null;

  const style: React.CSSProperties = win.maximized
    ? { left: 4, top: 4, width: "calc(100% - 8px)", height: `calc(100% - ${FUNCBAR_HEIGHT + 8}px)`, zIndex: win.zIndex }
    : {
        left: win.position.x,
        top: win.position.y,
        width: Math.min(win.size.width, globalThis.innerWidth - 20),
        height: Math.min(win.size.height, globalThis.innerHeight - FUNCBAR_HEIGHT - 40),
        zIndex: win.zIndex,
      };

  return (
    <div
      className={`absolute flex flex-col overflow-hidden rounded-md border transition-shadow ${isActive ? "border-[var(--dept-accent-60,#3c68c9)] shadow-[0_24px_60px_-20px_rgba(3,6,16,0.85)]" : "border-[var(--dept-window-border,#1e2a45)] shadow-[0_16px_40px_-18px_rgba(3,6,16,0.7)]"}`}
      style={style}
      onMouseDown={() => focusWindow(win.id)}
    >
      <div
        className={`h-7 flex items-center justify-between px-2.5 flex-shrink-0 select-none cursor-move font-mono text-[10.5px] tracking-wide ${isActive ? "bg-[var(--dept-window-title-active,#1c2436)] text-[#dde3f2]" : "bg-[var(--dept-window-title-inactive,#121a2e)] text-[#6d7999]"}`}
        onMouseDown={handleMouseDown}
      >
        <span className="truncate uppercase">{win.title}</span>
        <div className="win-controls flex items-center gap-0.5 -mr-1 flex-shrink-0">
          <button onClick={() => minimizeWindow(win.id)} className="w-5 h-5 flex items-center justify-center rounded hover:bg-white/10">
            <Minus className="w-3 h-3" />
          </button>
          <button onClick={() => toggleMaximize(win.id)} className="w-5 h-5 flex items-center justify-center rounded hover:bg-white/10">
            {win.maximized ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
          </button>
          <button onClick={() => closeWindow(win.id)} className="w-5 h-5 flex items-center justify-center rounded hover:bg-red-500/80 hover:text-white">
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 bg-[var(--dept-window-body,#0d1424)] overflow-hidden">{children}</div>

      {!win.maximized && (
        <>
          <div onMouseDown={handleResizeStart("right")} className="absolute top-0 -right-1 w-2.5 h-full cursor-ew-resize hover:bg-[var(--dept-accent-25,#3c68c9)] transition-colors" />
          <div onMouseDown={handleResizeStart("bottom")} className="absolute -bottom-1 left-0 w-full h-2.5 cursor-ns-resize hover:bg-[var(--dept-accent-25,#3c68c9)] transition-colors" />
          <div
            onMouseDown={handleResizeStart("corner")}
            className="absolute -bottom-1 -right-1 w-5 h-5 cursor-nwse-resize flex items-end justify-end p-0.5 hover:bg-[var(--dept-accent-25,#3c68c9)] transition-colors rounded-tl"
          >
            <svg viewBox="0 0 10 10" className="w-2.5 h-2.5 text-[#4a5372]" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
              <path d="M8.5 1.5 1.5 8.5" />
              <path d="M8.5 5 5 8.5" />
            </svg>
          </div>
        </>
      )}
    </div>
  );
}
