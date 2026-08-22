'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useOS } from '@/contexts/OSContext';
import type { OSWindow } from '@/lib/osTypes';
import { X, Minus, Maximize2, Minimize2 } from 'lucide-react';
import { AppIcon } from '@/components/icons/AppIcons';

interface WindowProps {
  window: OSWindow;
  children: React.ReactNode;
}

export default function Window({ window: win, children }: WindowProps) {
  const {
    activeWindowId,
    closeWindow,
    minimizeWindow,
    maximizeWindow,
    focusWindow,
    updateWindowPosition,
    updateWindowSize,
    apps
  } = useOS();

  const MIN_WIDTH = 400;
  const MIN_HEIGHT = 300;

  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(false);
  const [resizeEdge, setResizeEdge] = useState<'right' | 'bottom' | 'corner' | null>(null);
  const resizeStart = useRef({ mouseX: 0, mouseY: 0, width: 0, height: 0 });
  const windowRef = useRef<HTMLDivElement>(null);

  const app = apps.find(a => a.id === win.appId);
  const isActive = activeWindowId === win.id;

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('.window-controls')) return;
    if (isMobile) return; // No drag on mobile

    focusWindow(win.id);
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - win.position.x,
      y: e.clientY - win.position.y
    });
  }, [win.id, win.position, focusWindow, isMobile]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || isMobile) return;

    const newX = Math.max(0, Math.min(e.clientX - dragOffset.x, globalThis.innerWidth - 200));
    const newY = Math.max(0, Math.min(e.clientY - dragOffset.y, globalThis.innerHeight - 120));

    updateWindowPosition(win.id, { x: newX, y: newY });
  }, [isDragging, dragOffset, win.id, updateWindowPosition, isMobile]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const handleResizeStart = useCallback((edge: 'right' | 'bottom' | 'corner') => (e: React.MouseEvent) => {
    if (isMobile || win.isMaximized) return;
    e.stopPropagation();
    focusWindow(win.id);
    resizeStart.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      width: win.size.width,
      height: win.size.height
    };
    setResizeEdge(edge);
  }, [isMobile, win.isMaximized, win.id, win.size, focusWindow]);

  const handleResizeMove = useCallback((e: MouseEvent) => {
    if (!resizeEdge) return;
    const { mouseX, mouseY, width, height } = resizeStart.current;

    const newSize = { width, height };
    if (resizeEdge === 'right' || resizeEdge === 'corner') {
      newSize.width = Math.max(MIN_WIDTH, Math.min(width + (e.clientX - mouseX), globalThis.innerWidth - win.position.x - 10));
    }
    if (resizeEdge === 'bottom' || resizeEdge === 'corner') {
      newSize.height = Math.max(MIN_HEIGHT, Math.min(height + (e.clientY - mouseY), globalThis.innerHeight - win.position.y - 66));
    }
    updateWindowSize(win.id, newSize);
  }, [resizeEdge, win.id, win.position, updateWindowSize]);

  const handleResizeEnd = useCallback(() => {
    setResizeEdge(null);
  }, []);

  useEffect(() => {
    if (resizeEdge) {
      document.addEventListener('mousemove', handleResizeMove);
      document.addEventListener('mouseup', handleResizeEnd);
    }

    return () => {
      document.removeEventListener('mousemove', handleResizeMove);
      document.removeEventListener('mouseup', handleResizeEnd);
    };
  }, [resizeEdge, handleResizeMove, handleResizeEnd]);

  if (win.isMinimized) return null;

  // Mobile: full screen windows
  // Desktop: positioned windows
  const windowStyles = isMobile ? {
    left: 0,
    top: 0,
    right: 0,
    bottom: 56, // Above taskbar
    width: '100%',
    height: 'calc(100% - 56px)',
    zIndex: win.zIndex
  } : {
    left: win.isMaximized ? 0 : win.position.x,
    top: win.isMaximized ? 0 : win.position.y,
    width: win.isMaximized ? '100%' : Math.min(win.size.width, globalThis.innerWidth - 20),
    height: win.isMaximized ? 'calc(100% - 56px)' : Math.min(win.size.height, globalThis.innerHeight - 80),
    zIndex: win.zIndex
  };

  return (
    <div
      ref={windowRef}
      className={`absolute overflow-hidden transition-shadow duration-200 animate-window-open
        ${isMobile ? 'rounded-none' : 'rounded-2xl'}
        ${isActive ? 'shadow-2xl shadow-black/60' : 'shadow-xl shadow-black/40'}
        ${win.isMaximized && !isMobile ? '!rounded-none' : ''}
      `}
      style={{ ...windowStyles, outline: isActive ? '1px solid var(--os-selection)' : undefined, outlineOffset: -1 }}
      onClick={() => focusWindow(win.id)}
    >
      {/* Title Bar - Responsive */}
      <div
        className={`h-10 sm:h-11 flex items-center justify-between px-3 sm:px-4 select-none backdrop-blur-xl
          ${isMobile ? '' : 'cursor-move'}
          ${isActive
            ? 'bg-black/80'
            : 'bg-black/60'
          }
        `}
        onMouseDown={handleMouseDown}
      >
        {/* App Info */}
        <div className="flex items-center gap-2 sm:gap-3">
          <AppIcon appId={app?.id || ''} size={20} active={isActive} />
          <span className={`text-xs sm:text-sm font-medium ${isActive ? 'text-white' : 'text-white/60'}`}>
            {win.title}
          </span>
        </div>

        {/* Window Controls */}
        <div className="window-controls flex items-center -mr-1 sm:-mr-2">
          {/* Minimize - Hidden on mobile */}
          <button
            onClick={() => minimizeWindow(win.id)}
            className="hidden sm:flex w-10 sm:w-11 h-10 sm:h-11 items-center justify-center hover:bg-white/10 transition-colors"
          >
            <Minus className="w-4 h-4 text-white/70" />
          </button>
          {/* Maximize - Hidden on mobile */}
          <button
            onClick={() => maximizeWindow(win.id)}
            className="hidden sm:flex w-10 sm:w-11 h-10 sm:h-11 items-center justify-center hover:bg-white/10 transition-colors"
          >
            {win.isMaximized
              ? <Minimize2 className="w-4 h-4 text-white/70" />
              : <Maximize2 className="w-4 h-4 text-white/70" />
            }
          </button>
          {/* Close - Always visible */}
          <button
            onClick={() => closeWindow(win.id)}
            className="w-10 sm:w-11 h-10 sm:h-11 flex items-center justify-center hover:bg-red-500 transition-colors group"
          >
            <X className="w-4 h-4 text-white/70 group-hover:text-white" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="h-[calc(100%-40px)] sm:h-[calc(100%-44px)] bg-[#0A0A0F] overflow-hidden">
        {children}
      </div>

      {/* Resize handles - hidden on mobile and when maximized */}
      {!isMobile && !win.isMaximized && (
        <>
          <div
            onMouseDown={handleResizeStart('right')}
            className="absolute top-0 right-0 w-1.5 h-full cursor-ew-resize"
          />
          <div
            onMouseDown={handleResizeStart('bottom')}
            className="absolute bottom-0 left-0 w-full h-1.5 cursor-ns-resize"
          />
          <div
            onMouseDown={handleResizeStart('corner')}
            className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize"
          />
        </>
      )}
    </div>
  );
}
