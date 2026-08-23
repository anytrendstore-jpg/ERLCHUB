'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useOS } from '@/contexts/OSContext';
import { ShieldCheck } from 'lucide-react';
import { AppIcon, HubPayIcon, CryptoIcon } from '@/components/icons/AppIcons';
import AppContextMenu from './AppContextMenu';
import type { DesktopIconSize } from '@/lib/osTypes';

const CELL_SIZE_BY_ICON: Record<DesktopIconSize, { w: number; h: number; icon: number }> = {
  small: { w: 76, h: 82, icon: 26 },
  medium: { w: 92, h: 96, icon: 36 },
  large: { w: 108, h: 114, icon: 46 },
};
const GRID_PAD = 8;
const POSITIONS_KEY = 'os_icon_positions';
export const ICON_RESET_EVENT = 'os:reset-icon-positions';

type Positions = Record<string, { col: number; row: number }>;

function loadPositions(): Positions {
  try {
    const raw = localStorage.getItem(POSITIONS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function savePositions(positions: Positions) {
  try { localStorage.setItem(POSITIONS_KEY, JSON.stringify(positions)); } catch { /* ignore */ }
}

export default function Desktop() {
  const { installedApps, isAppInstalled, isAppPinned, togglePinnedApp, openApp, currentTime, preferences } = useOS();
  const { w: CELL_W, h: CELL_H, icon: ICON_SIZE } = CELL_SIZE_BY_ICON[preferences.theme.iconSize || 'medium'];
  const [isStaff, setIsStaff] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [hubPayBalance, setHubPayBalance] = useState<number | null>(null);
  const [cryptoBalance, setCryptoBalance] = useState<number | null>(null);
  const [menu, setMenu] = useState<{ x: number; y: number; appId: string } | null>(null);
  const [positions, setPositions] = useState<Positions>({});
  const [gridSize, setGridSize] = useState({ cols: 1, rows: 1 });
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragPixelPos, setDragPixelPos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const dragInfo = useRef({ startX: 0, startY: 0, offsetX: 0, offsetY: 0, moved: false, appId: '' });
  const gridSizeRef = useRef(gridSize);
  const dragPixelPosRef = useRef({ x: 0, y: 0 });

  useEffect(() => { gridSizeRef.current = gridSize; }, [gridSize]);

  useEffect(() => {
    if (!isAppInstalled('hubpay')) return;
    fetch('/api/hubpay/wallet', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => { if (data.success) setHubPayBalance(data.wallet.availableBalance); })
      .catch(() => {});
  }, [isAppInstalled]);

  useEffect(() => {
    if (!isAppInstalled('crypto')) return;
    fetch('/api/crypto/wallet', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => { if (data.success) setCryptoBalance(data.totalCOP); })
      .catch(() => {});
  }, [isAppInstalled]);

  useEffect(() => {
    fetch('/api/whitelist/staff/login', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => setIsStaff(Boolean(data.authenticated)))
      .catch(() => setIsStaff(false));
  }, []);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const visibleApps = installedApps.filter(a => !a.comingSoon);

  // Calcula cuántas columnas/filas caben en el escritorio, y auto-asigna posiciones a los iconos que no tengan una guardada.
  const recomputeGrid = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const cols = Math.max(1, Math.floor(el.clientWidth / CELL_W));
    const rows = Math.max(1, Math.floor(el.clientHeight / CELL_H));
    setGridSize({ cols, rows });

    setPositions((prev) => {
      const next = { ...prev };
      const taken = new Set(Object.values(next).map((p) => `${p.col},${p.row}`));
      let changed = false;
      for (const app of visibleApps) {
        if (next[app.id] && next[app.id].col < cols && next[app.id].row < rows) continue;
        // Busca la primera celda libre en columna (línea vertical), de arriba hacia abajo empezando por la esquina superior.
        let placed = false;
        for (let c = 0; c < cols && !placed; c++) {
          for (let r = 0; r < rows && !placed; r++) {
            const key = `${c},${r}`;
            if (!taken.has(key)) {
              next[app.id] = { col: c, row: r };
              taken.add(key);
              placed = true;
              changed = true;
            }
          }
        }
      }
      if (changed) savePositions(next);
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleApps.map((a) => a.id).join(','), CELL_W, CELL_H]);

  useEffect(() => {
    setPositions(loadPositions());
  }, []);

  useEffect(() => {
    recomputeGrid();
    window.addEventListener('resize', recomputeGrid);
    return () => window.removeEventListener('resize', recomputeGrid);
  }, [recomputeGrid]);

  // Permite a Settings ("Reacomodar iconos automáticamente") limpiar las posiciones guardadas
  // y dejar que vuelvan a auto-organizarse en fila desde la esquina superior.
  useEffect(() => {
    const onReset = () => {
      savePositions({});
      setPositions({});
      requestAnimationFrame(recomputeGrid);
    };
    window.addEventListener(ICON_RESET_EVENT, onReset);
    return () => window.removeEventListener(ICON_RESET_EVENT, onReset);
  }, [recomputeGrid]);

  const handleMouseDown = (appId: string) => (e: React.MouseEvent<HTMLButtonElement>) => {
    if (isMobile || e.button !== 0) return;
    const containerRect = containerRef.current?.getBoundingClientRect();
    if (!containerRect) return;
    const pos = positions[appId] || { col: 0, row: 0 };
    dragInfo.current = {
      startX: e.clientX,
      startY: e.clientY,
      offsetX: e.clientX - (containerRect.left + pos.col * CELL_W),
      offsetY: e.clientY - (containerRect.top + pos.row * CELL_H),
      moved: false,
      appId,
    };
    dragPixelPosRef.current = { x: pos.col * CELL_W, y: pos.row * CELL_H };
    setDraggingId(appId);
    setDragPixelPos(dragPixelPosRef.current);

    // Los listeners se agregan aquí mismo (síncronamente en el mousedown) en vez de
    // en un useEffect, para que no se pierda ningún movimiento entre el mousedown y
    // el siguiente render/commit de React.
    const onMove = (ev: MouseEvent) => {
      const info = dragInfo.current;
      if (Math.abs(ev.clientX - info.startX) > 4 || Math.abs(ev.clientY - info.startY) > 4) info.moved = true;
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const { cols, rows } = gridSizeRef.current;
      const maxX = Math.max(0, (cols - 1) * CELL_W);
      const maxY = Math.max(0, (rows - 1) * CELL_H);
      const x = Math.min(maxX, Math.max(0, ev.clientX - rect.left - info.offsetX));
      const y = Math.min(maxY, Math.max(0, ev.clientY - rect.top - info.offsetY));
      dragPixelPosRef.current = { x, y };
      setDragPixelPos({ x, y });
    };

    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      const info = dragInfo.current;
      if (info.moved) {
        const { cols, rows } = gridSizeRef.current;
        const col = Math.min(cols - 1, Math.max(0, Math.round(dragPixelPosRef.current.x / CELL_W)));
        const row = Math.min(rows - 1, Math.max(0, Math.round(dragPixelPosRef.current.y / CELL_H)));
        setPositions((prev) => {
          const next = { ...prev };
          const swapWith = Object.entries(next).find(([id, p]) => id !== info.appId && p.col === col && p.row === row);
          if (swapWith) next[swapWith[0]] = next[info.appId] || { col: 0, row: 0 };
          next[info.appId] = { col, row };
          savePositions(next);
          return next;
        });
      } else {
        openApp(info.appId);
      }
      setDraggingId(null);
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  return (
    <div className="absolute inset-0 pt-4 sm:pt-6 pl-3 sm:pl-6 pb-16 sm:pb-20 pr-3 sm:pr-6 overflow-hidden">
      {/* Desktop Icons - horizontal strip en mobile, cuadrícula arrastrable en desktop */}
      {isMobile ? (
        <div className="flex flex-row flex-wrap gap-1 w-full">
          {visibleApps.map((app) => (
            <button
              key={app.id}
              onClick={() => openApp(app.id)}
              className="group flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-200 w-[72px] hover:bg-white/10 active:bg-white/15 cursor-pointer"
            >
              <div className="relative w-10 h-10 flex items-center justify-center">
                <AppIcon appId={app.id} size={28} />
              </div>
              <span className="text-white text-[10px] font-medium drop-shadow-lg line-clamp-1 text-center">{app.name}</span>
            </button>
          ))}
        </div>
      ) : (
        <div ref={containerRef} data-tour="desktop" className="relative w-full h-full" style={{ padding: GRID_PAD }}>
          {visibleApps.map((app) => {
            const pos = positions[app.id] || { col: 0, row: 0 };
            const isDragging = draggingId === app.id;
            const left = isDragging ? dragPixelPos.x : pos.col * CELL_W;
            const top = isDragging ? dragPixelPos.y : pos.row * CELL_H;
            return (
              <button
                key={app.id}
                data-tour={['hubstore', 'settings', 'archivos'].includes(app.id) ? `app-${app.id}` : undefined}
                onMouseDown={handleMouseDown(app.id)}
                onContextMenu={(e) => { e.preventDefault(); setMenu({ x: e.clientX, y: e.clientY, appId: app.id }); }}
                style={{ position: 'absolute', left, top, width: CELL_W - 4, height: CELL_H - 4, zIndex: isDragging ? 50 : 1 }}
                className={`group flex flex-col items-center justify-start pt-2 gap-1.5 rounded-xl transition-colors duration-150 cursor-pointer select-none
                  hover:bg-white/10 active:bg-white/15
                  ${isDragging ? 'bg-white/15 shadow-2xl scale-105' : ''}
                `}
              >
                <div className="w-12 h-12 flex items-center justify-center transition-transform duration-200 group-hover:scale-105">
                  <AppIcon appId={app.id} size={ICON_SIZE} />
                </div>
                <span className="text-white text-[11px] font-medium drop-shadow-lg line-clamp-2 text-center leading-tight px-1">
                  {app.name}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Desktop Widgets Area - Hidden on mobile, shown on larger screens */}
      <div className="absolute top-4 sm:top-6 right-3 sm:right-6 w-56 sm:w-72 space-y-3 sm:space-y-4 hidden md:block">
        {/* Staff Panel quick access — solo visible para cuentas de staff */}
        {isStaff && (
          <Link
            href="/staff"
            className="flex items-center gap-3 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-gradient-to-r from-blue-600/90 to-blue-500/80 backdrop-blur-xl border border-blue-400/30 shadow-lg shadow-blue-600/20 hover:from-blue-600 hover:to-blue-500 transition-all group"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-white/15 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-white text-sm font-bold">Panel de Staff</p>
              <p className="text-white/70 text-[11px]">Abrir Ops Center</p>
            </div>
          </Link>
        )}

        {/* Time Widget */}
        <div
          className="p-4 sm:p-5 rounded-xl sm:rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10"
          style={{ boxShadow: '0 -1px 0 0 color-mix(in srgb, var(--os-accent) 20%, transparent) inset' }}
        >
          <div className="text-white/60 text-xs sm:text-sm mb-1">
            {currentTime?.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }) || 'Cargando...'}
          </div>
          <div className="text-white text-3xl sm:text-4xl font-light">
            {currentTime?.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) || '--:--'}
          </div>
        </div>

        {/* Quick Stats Widget */}
        {isAppInstalled('hubpay') && (
          <div
            className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10"
            style={{ boxShadow: '0 -1px 0 0 color-mix(in srgb, var(--os-accent) 20%, transparent) inset' }}
          >
            <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <HubPayIcon size={18} />
              </div>
              <div>
                <p className="text-white/60 text-[10px] sm:text-xs">HubPay Balance</p>
                <p className="text-white text-sm sm:text-base font-semibold">
                  {hubPayBalance === null ? '...' : `$${hubPayBalance.toLocaleString('es-CO')}`}
                </p>
              </div>
            </div>
            <div className="h-px bg-white/10 my-2 sm:my-3" />
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="text-white/50">Estado</span>
              <span className="text-green-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                Conectado
              </span>
            </div>
          </div>
        )}

        {/* Crypto Wallet Widget */}
        {isAppInstalled('crypto') && (
          <div
            className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10"
            style={{ boxShadow: '0 -1px 0 0 color-mix(in srgb, var(--os-accent) 20%, transparent) inset' }}
          >
            <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-purple-500 to-fuchsia-600 flex items-center justify-center">
                <CryptoIcon size={18} />
              </div>
              <div>
                <p className="text-white/60 text-[10px] sm:text-xs">Crypto Wallet</p>
                <p className="text-white text-sm sm:text-base font-semibold">
                  {cryptoBalance === null ? '...' : `$${Math.round(cryptoBalance).toLocaleString('es-CO')}`}
                </p>
              </div>
            </div>
            <div className="h-px bg-white/10 my-2 sm:my-3" />
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="text-white/50">Estado</span>
              <span className="text-green-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                Conectado
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Time Display - Only visible on small screens */}
      <div className="absolute top-4 right-3 md:hidden">
        <div className="px-3 py-2 rounded-xl bg-black/40 backdrop-blur-xl border border-white/10">
          <div className="text-white text-lg font-light">
            {currentTime?.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) || '--:--'}
          </div>
        </div>
      </div>

      {menu && (
        <AppContextMenu
          x={menu.x}
          y={menu.y}
          onClose={() => setMenu(null)}
          items={[
            { label: 'Abrir', onClick: () => openApp(menu.appId) },
            isAppPinned(menu.appId)
              ? { label: 'Desanclar de la barra de tareas', onClick: () => togglePinnedApp(menu.appId) }
              : { label: 'Anclar a la barra de tareas', onClick: () => togglePinnedApp(menu.appId) },
          ]}
        />
      )}
    </div>
  );
}
