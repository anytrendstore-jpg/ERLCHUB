'use client';

import React, { useState } from 'react';
import { useOS } from '@/contexts/OSContext';
import { Wifi, Volume2, Bell, Search, ChevronUp } from 'lucide-react';
import { AppIcon } from '@/components/icons/AppIcons';
import AppContextMenu from './AppContextMenu';
import type { DesktopIconSize } from '@/lib/osTypes';

const TASKBAR_ICON_SIZE: Record<DesktopIconSize, number> = { small: 14, medium: 18, large: 22 };

export default function Taskbar() {
  const {
    windows,
    apps,
    pinnedApps,
    isAppPinned,
    togglePinnedApp,
    notifications,
    activeWindowId,
    isStartMenuOpen,
    openApp,
    focusWindow,
    minimizeWindow,
    toggleStartMenu,
    toggleNotificationPanel,
    currentTime,
    preferences,
  } = useOS();

  const [showDesktopHover, setShowDesktopHover] = useState(false);
  const [menu, setMenu] = useState<{ x: number; y: number; appId: string } | null>(null);

  const unreadCount = notifications.filter(n => !n.read).length;
  const iconSize = TASKBAR_ICON_SIZE[preferences.theme.taskbarIconSize || 'medium'];

  const handleTaskClick = (windowId: string) => {
    const isActive = activeWindowId === windowId;
    const win = windows.find((w) => w.id === windowId);
    if (isActive && win && !win.isMinimized) minimizeWindow(windowId);
    else focusWindow(windowId);
  };

  const openWindowAppIds = new Set(windows.map((w) => w.appId));
  const pinnedOnly = pinnedApps.filter((app) => !openWindowAppIds.has(app.id));

  return (
    <div
      data-tour="taskbar"
      className="absolute bottom-0 left-0 right-0 h-11 sm:h-12 flex items-stretch border-t border-white/10 backdrop-blur-2xl shadow-[0_-4px_24px_rgba(0,0,0,0.4)] z-[1000]"
      style={{ backgroundColor: 'color-mix(in srgb, var(--os-taskbar) calc(var(--os-transparency) * 1%), transparent)' }}
    >
      {/* Start Button */}
      <button
        data-tour="start-button"
        onClick={toggleStartMenu}
        className={`h-full w-11 sm:w-12 flex items-center justify-center transition-colors duration-150 flex-shrink-0
          ${isStartMenuOpen ? 'shadow-lg' : 'hover:bg-white/10'}
        `}
        style={isStartMenuOpen ? { background: 'color-mix(in srgb, var(--os-accent) 30%, transparent)' } : undefined}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-white sm:w-5 sm:h-5">
          <rect x="3" y="3" width="8" height="8" rx="2" fill="currentColor" opacity="0.9"/>
          <rect x="13" y="3" width="8" height="8" rx="2" fill="currentColor" opacity="0.7"/>
          <rect x="3" y="13" width="8" height="8" rx="2" fill="currentColor" opacity="0.7"/>
          <rect x="13" y="13" width="8" height="8" rx="2" fill="currentColor" opacity="0.5"/>
        </svg>
      </button>

      {/* Search */}
      <button className="hidden xs:flex h-full w-11 sm:w-12 items-center justify-center hover:bg-white/10 transition-colors duration-150 flex-shrink-0">
        <Search className="w-4 h-4 sm:w-[18px] sm:h-[18px] text-white/70" />
      </button>

      {/* Ancladas (sin ventana abierta) + Ventanas abiertas */}
      <div className="flex items-stretch gap-0.5 overflow-x-auto scrollbar-hide px-1">
        {pinnedOnly.map((app) => (
          <button
            key={`pinned-${app.id}`}
            onClick={() => openApp(app.id)}
            onContextMenu={(e) => { e.preventDefault(); setMenu({ x: e.clientX, y: e.clientY, appId: app.id }); }}
            title={app.name}
            className="h-full px-2.5 sm:px-3 flex items-center justify-center hover:bg-white/10 transition-colors duration-150 flex-shrink-0"
          >
            <AppIcon appId={app.id} size={iconSize} />
          </button>
        ))}

        {windows.map((window) => {
          const app = apps.find(a => a.id === window.appId);
          const isActive = activeWindowId === window.id && !window.isMinimized;

          return (
            <button
              key={window.id}
              onClick={() => handleTaskClick(window.id)}
              onContextMenu={(e) => { e.preventDefault(); setMenu({ x: e.clientX, y: e.clientY, appId: window.appId }); }}
              title={window.title}
              className={`h-full px-2.5 sm:px-3 flex items-center gap-2 transition-colors duration-150 relative group flex-shrink-0
                ${isActive ? 'bg-white/15' : 'hover:bg-white/10'}
                ${window.isMinimized ? 'opacity-60' : ''}
              `}
            >
              <AppIcon appId={app?.id || ''} size={iconSize} active={isActive} />
              <span className="text-white text-xs sm:text-sm font-medium max-w-[60px] sm:max-w-[110px] truncate hidden xs:block">
                {window.title}
              </span>
              <div
                className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 rounded-full transition-all duration-200
                  ${isActive ? 'w-5 sm:w-7' : 'w-1.5 bg-white/40 group-hover:w-4'}
                `}
                style={isActive ? { background: 'var(--os-accent)' } : undefined}
              />
            </button>
          );
        })}
      </div>

      {menu && (
        <AppContextMenu
          x={menu.x}
          y={menu.y}
          onClose={() => setMenu(null)}
          items={[
            isAppPinned(menu.appId)
              ? { label: 'Desanclar de la barra de tareas', onClick: () => togglePinnedApp(menu.appId) }
              : { label: 'Anclar a la barra de tareas', onClick: () => togglePinnedApp(menu.appId) },
          ]}
        />
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* System Tray */}
      <div className="flex items-stretch flex-shrink-0">
        <button className="hidden md:flex w-8 sm:w-9 items-center justify-center hover:bg-white/10 transition-colors">
          <ChevronUp className="w-4 h-4 text-white/60" />
        </button>

        <div className="hidden sm:flex items-center gap-2.5 px-2.5 hover:bg-white/10 transition-colors cursor-pointer">
          <Wifi className="w-4 h-4 text-white/70" />
          <Volume2 className="w-4 h-4 text-white/70" />
        </div>

        <button
          data-tour="notifications-button"
          onClick={toggleNotificationPanel}
          className="relative w-9 sm:w-10 flex items-center justify-center hover:bg-white/10 transition-colors"
        >
          <Bell className="w-4 h-4 text-white/70" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 bg-blue-500 text-white text-[8px] sm:text-[9px] font-bold rounded-full w-3.5 h-3.5 sm:w-4 sm:h-4 flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </button>

        {/* Clock */}
        <div className="px-2.5 sm:px-3 flex flex-col items-center justify-center hover:bg-white/10 transition-colors cursor-pointer text-center min-w-[56px] sm:min-w-[72px]">
          <div className="text-white text-[10px] sm:text-xs font-medium leading-tight">
            {currentTime?.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) || '--:--'}
          </div>
          <div className="text-white/50 text-[8px] sm:text-[10px] leading-tight hidden xs:block">
            {currentTime?.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' }) || '--/--'}
          </div>
        </div>

        {/* Show desktop sliver */}
        <button
          onMouseEnter={() => setShowDesktopHover(true)}
          onMouseLeave={() => setShowDesktopHover(false)}
          className={`w-2 sm:w-2.5 h-full border-l border-white/10 transition-colors ${showDesktopHover ? 'bg-white/20' : 'bg-transparent'}`}
          title="Mostrar escritorio"
        />
      </div>
    </div>
  );
}
