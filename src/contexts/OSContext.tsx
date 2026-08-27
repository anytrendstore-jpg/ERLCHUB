'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from 'react';
import type { OSUser, OSWindow, OSNotification, OSApp, OSProfile, OSUserPreferences, OSTheme, OSWallpaper } from '@/lib/osTypes';
import { mockUser, osApps } from '@/lib/osData';

const PREFS_CACHE_KEY = 'os_prefs_cache';

const ESSENTIAL_APP_IDS = ['hubstore', 'archivos', 'browser', 'settings', 'profile'];

/** Apps que quedan suspendidas mientras hay una sesión activa de Deep Web ("modo aislado"). */
const DEEPWEB_SUSPENDED_APP_IDS = ['hubpay', 'amazon', 'hubchat', 'socialhub', 'casino'];

const DEFAULT_PREFERENCES: OSUserPreferences = {
  discordId: '',
  wallpaper: { type: 'preset', value: 'default', fit: 'fill' },
  theme: {
    mode: 'dark',
    accent: '#3b82f6',
    taskbar: '#000000',
    startMenu: '#000000',
    windowBorder: '#ffffff',
    selection: '#3b82f6',
    transparency: 70,
    iconSize: 'medium',
    taskbarIconSize: 'medium',
  },
  savedThemes: [],
  installedApps: ESSENTIAL_APP_IDS,
  pinnedApps: ['hubstore'],
  onboarding: { completed: false },
  updatedAt: new Date(),
};

interface OSContextType {
  user: OSUser;
  apps: OSApp[];
  installedApps: OSApp[];
  isAppInstalled: (appId: string) => boolean;
  installApp: (appId: string) => Promise<boolean>;
  buyApp: (appId: string) => Promise<{ ok: boolean; error?: string; balance?: number }>;
  uninstallApp: (appId: string) => Promise<boolean>;
  pinnedApps: OSApp[];
  isAppPinned: (appId: string) => boolean;
  togglePinnedApp: (appId: string) => Promise<boolean>;
  completeOnboarding: () => void;
  restartOnboarding: () => void;
  windows: OSWindow[];
  notifications: OSNotification[];
  activeWindowId: string | null;
  isStartMenuOpen: boolean;
  isNotificationPanelOpen: boolean;
  currentTime: Date | null;
  preferences: OSUserPreferences;
  preferencesLoaded: boolean;
  updatePreferences: (partial: { theme?: Partial<OSTheme>; wallpaper?: Partial<OSWallpaper> }) => void;
  saveTheme: (name: string) => Promise<void>;
  deleteTheme: (id: string) => Promise<void>;
  applyTheme: (savedThemeId: string) => void;
  resetPreferences: () => void;

  activeProfile: OSProfile | null;
  isSwitchingProfile: boolean;
  switchProfile: (profileId: string) => void;
  charactersLoaded: boolean;
  characterSlots: number;
  createCharacter: (name: string, opts?: { avatar?: string; city?: string }) => Promise<{ ok: boolean; error?: string }>;

  deepWebSessionActive: boolean;
  setDeepWebSessionActive: (active: boolean) => void;
  suspendedNotice: string | null;

  openApp: (appId: string) => void;
  closeWindow: (windowId: string) => void;
  minimizeWindow: (windowId: string) => void;
  maximizeWindow: (windowId: string) => void;
  focusWindow: (windowId: string) => void;
  updateWindowPosition: (windowId: string, position: { x: number; y: number }) => void;
  updateWindowSize: (windowId: string, size: { width: number; height: number }) => void;

  toggleStartMenu: () => void;
  toggleNotificationPanel: () => void;
  markNotificationRead: (notificationId: string) => void;
  clearAllNotifications: () => void;
}

const OSContext = createContext<OSContextType | undefined>(undefined);

export function OSProvider({ children, discordSession }: { children: ReactNode; discordSession?: any }) {
  const [user, setUser] = useState<OSUser>(() => {
    if (discordSession?.user) {
      const displayName = discordSession.user.global_name || discordSession.user.username;
      const avatar = discordSession.user.avatar;
      const now = new Date();
      return {
        id: discordSession.user.id,
        username: discordSession.user.username,
        displayName,
        avatar,
        discordId: discordSession.user.id,
        robloxId: discordSession.user.robloxId,
        robloxUsername: discordSession.user.robloxUsername,
        robloxVerified: discordSession.user.robloxVerified,
        dni: discordSession.user.dni,
        role: 'user',
        createdAt: now,
        lastLogin: now,
        activeProfileId: 'default',
        // Una única entrada real (este jugador) — no hay soporte de multi-personaje en el backend,
        // así que no se inventan personas adicionales para el selector de perfiles.
        profiles: [{ id: 'default', type: 'character', displayName, username: discordSession.user.username, avatar, role: 'user' }],
      };
    }
    return mockUser;
  });

  // El escritorio pinta al instante con la sesión de Discord; en cuanto llega la respuesta real
  // de la cuenta (colección `users`), se corrige createdAt/lastLogin con los valores verdaderos.
  useEffect(() => {
    if (!discordSession?.user) return;
    fetch('/api/os/me', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setUser((prev) => ({ ...prev, createdAt: new Date(data.createdAt), lastLogin: new Date(data.lastLogin) }));
        }
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Personajes reales de la cuenta (reemplaza el único perfil 'default' con el que se pinta
  // al instante) — determina si corresponde mostrar el selector de perfiles al arrancar.
  const [charactersLoaded, setCharactersLoaded] = useState(false);
  const [characterSlots, setCharacterSlots] = useState(1);

  const loadCharacters = useCallback(async () => {
    try {
      const res = await fetch('/api/characters', { cache: 'no-store' });
      const data = await res.json();
      if (!data.success) return;
      const profiles: OSProfile[] = data.characters.map((c: any) => ({
        id: c.id,
        type: 'character',
        displayName: c.name,
        username: c.name,
        avatar: c.avatar || '',
        role: 'user',
        characterJob: c.job,
      }));
      const activeId = data.activeCharacterId || profiles[0]?.id;
      const activeChar = profiles.find((p: OSProfile) => p.id === activeId);
      setCharacterSlots(data.slots || 1);
      setUser((prev) => ({
        ...prev,
        profiles: profiles.length > 0 ? profiles : prev.profiles,
        activeProfileId: activeId || prev.activeProfileId,
        displayName: activeChar?.displayName || prev.displayName,
        avatar: activeChar?.avatar || prev.avatar,
      }));
    } catch {
      // Sin conexión: se queda con el perfil único pintado al instante.
    } finally {
      setCharactersLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!discordSession?.user) { setCharactersLoaded(true); return; }
    loadCharacters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const createCharacter = useCallback(async (name: string, opts?: { avatar?: string; city?: string }) => {
    try {
      const res = await fetch('/api/characters', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, ...opts }),
      });
      const data = await res.json();
      if (!data.success) return { ok: false, error: data.error || 'No se pudo crear el personaje' };
      await loadCharacters();
      return { ok: true };
    } catch {
      return { ok: false, error: 'No se pudo conectar con el servidor' };
    }
  }, [loadCharacters]);
  const [apps, setApps] = useState<OSApp[]>(osApps);
  const [windows, setWindows] = useState<OSWindow[]>([]);
  const [deepWebSessionActive, setDeepWebSessionActiveState] = useState(false);
  const [suspendedNotice, setSuspendedNotice] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<OSNotification[]>([]);
  const [activeWindowId, setActiveWindowId] = useState<string | null>(null);
  const [isStartMenuOpen, setIsStartMenuOpen] = useState(false);
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);
  const [zIndexCounter, setZIndexCounter] = useState(100);

  const [isSwitchingProfile, setIsSwitchingProfile] = useState(false);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  useEffect(() => {
    setCurrentTime(new Date());
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Preferencias (fondo/colores/temas): cache instantáneo en localStorage +
  // reconciliación con el servidor, con guardado en segundo plano (debounced).
  const [preferences, setPreferences] = useState<OSUserPreferences>(DEFAULT_PREFERENCES);
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);
  const savePrefsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    try {
      const cached = localStorage.getItem(PREFS_CACHE_KEY);
      if (cached) setPreferences(JSON.parse(cached));
    } catch {
      // localStorage no disponible o dato corrupto: se ignora, sigue con defaults.
    }

    fetch('/api/os/preferences', { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.preferences) {
          setPreferences(data.preferences);
          localStorage.setItem(PREFS_CACHE_KEY, JSON.stringify(data.preferences));
        }
      })
      .catch(() => {
        // Sin conexión: se queda con la cache local (o los defaults).
      })
      .finally(() => setPreferencesLoaded(true));
  }, []);

  const persistPreferences = useCallback((next: OSUserPreferences) => {
    if (savePrefsTimer.current) clearTimeout(savePrefsTimer.current);
    savePrefsTimer.current = setTimeout(() => {
      fetch('/api/os/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme: next.theme, wallpaper: next.wallpaper }),
      }).catch(() => {});
    }, 500);
  }, []);

  const updatePreferences = useCallback((partial: { theme?: Partial<OSTheme>; wallpaper?: Partial<OSWallpaper> }) => {
    setPreferences(prev => {
      const next: OSUserPreferences = {
        ...prev,
        theme: partial.theme ? { ...prev.theme, ...partial.theme } : prev.theme,
        wallpaper: partial.wallpaper ? { ...prev.wallpaper, ...partial.wallpaper } : prev.wallpaper,
      };
      localStorage.setItem(PREFS_CACHE_KEY, JSON.stringify(next));
      persistPreferences(next);
      return next;
    });
  }, [persistPreferences]);

  const saveTheme = useCallback(async (name: string) => {
    const res = await fetch('/api/os/preferences/themes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, theme: preferences.theme, wallpaper: preferences.wallpaper }),
    });
    const data = await res.json();
    if (data.success) {
      setPreferences(prev => {
        const next = { ...prev, savedThemes: [...prev.savedThemes, data.theme] };
        localStorage.setItem(PREFS_CACHE_KEY, JSON.stringify(next));
        return next;
      });
    }
  }, [preferences.theme, preferences.wallpaper]);

  const deleteTheme = useCallback(async (id: string) => {
    await fetch('/api/os/preferences/themes', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    setPreferences(prev => {
      const next = { ...prev, savedThemes: prev.savedThemes.filter(t => t.id !== id) };
      localStorage.setItem(PREFS_CACHE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const applyTheme = useCallback((savedThemeId: string) => {
    const saved = preferences.savedThemes.find(t => t.id === savedThemeId);
    if (!saved) return;
    updatePreferences({ theme: saved.theme, wallpaper: saved.wallpaper });
  }, [preferences.savedThemes, updatePreferences]);

  const resetPreferences = useCallback(() => {
    updatePreferences({ theme: DEFAULT_PREFERENCES.theme, wallpaper: DEFAULT_PREFERENCES.wallpaper });
  }, [updatePreferences]);

  const installedApps = apps.filter((app) => preferences.installedApps?.includes(app.id));
  const isAppInstalled = useCallback((appId: string) => Boolean(preferences.installedApps?.includes(appId)), [preferences.installedApps]);

  const installApp = useCallback(async (appId: string) => {
    setPreferences((prev) => {
      if (prev.installedApps.includes(appId)) return prev;
      const next = { ...prev, installedApps: [...prev.installedApps, appId] };
      localStorage.setItem(PREFS_CACHE_KEY, JSON.stringify(next));
      return next;
    });
    try {
      const res = await fetch('/api/os/apps', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'install', appId }),
      });
      const data = await res.json();
      if (data.success) {
        setPreferences((prev) => {
          const next = { ...prev, installedApps: data.installedApps };
          localStorage.setItem(PREFS_CACHE_KEY, JSON.stringify(next));
          return next;
        });
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  /**
   * A diferencia de installApp, NO actualiza el estado local antes de la respuesta del server:
   * es una compra real (descuenta HubCoins), así que nunca debe mostrarse "instalada" hasta
   * que el pago se confirmó. Devuelve el motivo del error para mostrarlo (ej. saldo insuficiente).
   */
  const buyApp = useCallback(async (appId: string): Promise<{ ok: boolean; error?: string; balance?: number }> => {
    try {
      const res = await fetch('/api/os/apps', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'buy', appId }),
      });
      const data = await res.json();
      if (data.success) {
        setPreferences((prev) => {
          const next = { ...prev, installedApps: data.installedApps };
          localStorage.setItem(PREFS_CACHE_KEY, JSON.stringify(next));
          return next;
        });
        return { ok: true };
      }
      return { ok: false, error: data.error, balance: data.balance };
    } catch {
      return { ok: false, error: 'No se pudo completar la compra' };
    }
  }, []);

  const uninstallApp = useCallback(async (appId: string) => {
    setPreferences((prev) => {
      const next = { ...prev, installedApps: prev.installedApps.filter((id) => id !== appId), pinnedApps: prev.pinnedApps.filter((id) => id !== appId) };
      localStorage.setItem(PREFS_CACHE_KEY, JSON.stringify(next));
      return next;
    });
    setWindows((prev) => prev.filter((w) => w.appId !== appId));
    try {
      const res = await fetch('/api/os/apps', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'uninstall', appId }),
      });
      const data = await res.json();
      return Boolean(data.success);
    } catch {
      return false;
    }
  }, []);

  const pinnedApps = apps.filter((app) => preferences.pinnedApps?.includes(app.id));
  const isAppPinned = useCallback((appId: string) => Boolean(preferences.pinnedApps?.includes(appId)), [preferences.pinnedApps]);

  const togglePinnedApp = useCallback(async (appId: string) => {
    const wasPinned = preferences.pinnedApps?.includes(appId);
    const action = wasPinned ? 'unpin' : 'pin';
    setPreferences((prev) => {
      const next = {
        ...prev,
        pinnedApps: wasPinned ? prev.pinnedApps.filter((id) => id !== appId) : [...prev.pinnedApps, appId],
      };
      localStorage.setItem(PREFS_CACHE_KEY, JSON.stringify(next));
      return next;
    });
    try {
      const res = await fetch('/api/os/apps', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, appId }),
      });
      const data = await res.json();
      return Boolean(data.success);
    } catch {
      return false;
    }
  }, [preferences.pinnedApps]);

  const completeOnboarding = useCallback(() => {
    setPreferences((prev) => {
      const next = { ...prev, onboarding: { ...prev.onboarding, completed: true } };
      localStorage.setItem(PREFS_CACHE_KEY, JSON.stringify(next));
      return next;
    });
    fetch('/api/os/onboarding', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'complete' }),
    }).catch(() => {});
  }, []);

  const restartOnboarding = useCallback(() => {
    setPreferences((prev) => {
      const next = { ...prev, onboarding: { completed: false } };
      localStorage.setItem(PREFS_CACHE_KEY, JSON.stringify(next));
      return next;
    });
    fetch('/api/os/onboarding', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'reset' }),
    }).catch(() => {});
  }, []);

  const activeProfile = user.profiles.find(p => p.id === user.activeProfileId) || null;

  /**
   * Cambiar de personaje se siente como cerrar sesión de un usuario de Windows y entrar con
   * otro: cierra todas las ventanas, pide al servidor que mueva la cookie de personaje activo
   * (de la que dependen preferencias/apps instaladas/módulos) y recién ahí recarga ese estado
   * para el nuevo personaje — nunca solo cambia un id en memoria.
   */
  const switchProfile = useCallback(async (profileId: string) => {
    const newProfile = user.profiles.find(p => p.id === profileId);
    if (!newProfile || newProfile.id === user.activeProfileId) return;

    setIsSwitchingProfile(true);
    setIsStartMenuOpen(false);

    const res = await fetch('/api/characters/switch', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: profileId }),
    }).catch(() => null);
    const data = await res?.json().catch(() => null);
    if (!data?.success) { setIsSwitchingProfile(false); return; }

    await new Promise((r) => setTimeout(r, 900)); // deja ver la transición (avatar + spinner)

    setUser(prev => ({
      ...prev,
      activeProfileId: profileId,
      displayName: newProfile.displayName,
      username: newProfile.username,
      avatar: newProfile.avatar,
      role: newProfile.role,
    }));
    setWindows([]);
    setActiveWindowId(null);
    setNotifications([]);

    setPreferencesLoaded(false);
    const cacheKey = `${PREFS_CACHE_KEY}:${profileId}`;
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) setPreferences(JSON.parse(cached));
      const prefsRes = await fetch('/api/os/preferences', { cache: 'no-store' });
      const prefsData = await prefsRes.json();
      if (prefsData.success && prefsData.preferences) {
        setPreferences(prefsData.preferences);
        localStorage.setItem(cacheKey, JSON.stringify(prefsData.preferences));
      }
    } catch {
      // Sin conexión: se queda con la cache local de este personaje (o los defaults).
    } finally {
      setPreferencesLoaded(true);
    }

    setIsSwitchingProfile(false);
  }, [user.profiles, user.activeProfileId]);

  // Hidrata el estado real de "modo aislado" al montar (por si el jugador dejó una sesión de
  // Deep Web activa en una pestaña anterior — el backend es la única fuente de verdad).
  useEffect(() => {
    if (!discordSession?.user) return;
    fetch('/api/deepweb/session', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => { if (data.success) setDeepWebSessionActiveState(Boolean(data.state?.sessionActive)); })
      .catch(() => {});
  }, [discordSession?.user]);

  const setDeepWebSessionActive = useCallback((active: boolean) => {
    setDeepWebSessionActiveState(active);
    if (active) {
      setWindows(prev => {
        const remaining = prev.filter(w => !DEEPWEB_SUSPENDED_APP_IDS.includes(w.appId));
        if (remaining.length !== prev.length) {
          setActiveWindowId(prevActive => remaining.some(w => w.id === prevActive) ? prevActive : null);
        }
        return remaining;
      });
    }
  }, []);

  const openApp = useCallback((appId: string) => {
    const app = apps.find(a => a.id === appId);
    if (!app || app.isLocked || app.comingSoon) return;
    if (!preferences.installedApps?.includes(appId)) return;
    if (deepWebSessionActive && DEEPWEB_SUSPENDED_APP_IDS.includes(appId)) {
      setSuspendedNotice(`${app.name} está suspendida mientras tu sesión de Deep Web está activa.`);
      setTimeout(() => setSuspendedNotice(null), 3500);
      return;
    }

    const existingWindow = windows.find(w => w.appId === appId);
    if (existingWindow) {
      setActiveWindowId(existingWindow.id);
      setWindows(prev => prev.map(w =>
        w.id === existingWindow.id
          ? { ...w, isMinimized: false, zIndex: zIndexCounter + 1 }
          : w
      ));
      setZIndexCounter(prev => prev + 1);
      return;
    }

    const newWindow: OSWindow = {
      id: `win_${Date.now()}`,
      appId,
      title: app.name,
      isMinimized: false,
      isMaximized: false,
      position: { x: 100 + windows.length * 30, y: 80 + windows.length * 30 },
      size: { width: 900, height: 600 },
      zIndex: zIndexCounter + 1
    };

    setWindows(prev => [...prev, newWindow]);
    setActiveWindowId(newWindow.id);
    setZIndexCounter(prev => prev + 1);
    setIsStartMenuOpen(false);
  }, [apps, windows, zIndexCounter, preferences.installedApps, deepWebSessionActive]);

  const closeWindow = useCallback((windowId: string) => {
    setWindows(prev => prev.filter(w => w.id !== windowId));
    if (activeWindowId === windowId) {
      setActiveWindowId(null);
    }
  }, [activeWindowId]);

  const minimizeWindow = useCallback((windowId: string) => {
    setWindows(prev => prev.map(w =>
      w.id === windowId ? { ...w, isMinimized: true } : w
    ));
  }, []);

  const maximizeWindow = useCallback((windowId: string) => {
    setWindows(prev => prev.map(w =>
      w.id === windowId ? { ...w, isMaximized: !w.isMaximized } : w
    ));
  }, []);

  const focusWindow = useCallback((windowId: string) => {
    setActiveWindowId(windowId);
    setWindows(prev => prev.map(w =>
      w.id === windowId
        ? { ...w, isMinimized: false, zIndex: zIndexCounter + 1 }
        : w
    ));
    setZIndexCounter(prev => prev + 1);
  }, [zIndexCounter]);

  const updateWindowPosition = useCallback((windowId: string, position: { x: number; y: number }) => {
    setWindows(prev => prev.map(w =>
      w.id === windowId ? { ...w, position } : w
    ));
  }, []);

  const updateWindowSize = useCallback((windowId: string, size: { width: number; height: number }) => {
    setWindows(prev => prev.map(w =>
      w.id === windowId ? { ...w, size } : w
    ));
  }, []);

  const toggleStartMenu = useCallback(() => {
    setIsStartMenuOpen(prev => !prev);
    setIsNotificationPanelOpen(false);
  }, []);

  const toggleNotificationPanel = useCallback(() => {
    setIsNotificationPanelOpen(prev => !prev);
    setIsStartMenuOpen(false);
  }, []);

  const loadNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/os/notifications', { cache: 'no-store' });
      const data = await res.json();
      if (data.success) {
        setNotifications(data.notifications.map((n: any) => ({ ...n, timestamp: new Date(n.timestamp) })));
      }
    } catch {
      // Sin conexión: se mantiene el último estado conocido.
    }
  }, []);

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 15000);
    return () => clearInterval(interval);
  }, [loadNotifications]);

  const markNotificationRead = useCallback((notificationId: string) => {
    setNotifications(prev => prev.map(n =>
      n.id === notificationId ? { ...n, read: true } : n
    ));
    fetch('/api/os/notifications', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'read', id: notificationId }),
    }).catch(() => {});
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
    fetch('/api/os/notifications', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'clear' }),
    }).catch(() => {});
  }, []);

  // Sincroniza la disponibilidad/nombre de las apps con lo que Staff configure
  // desde "Módulos del Sistema" (sin recargar ni reiniciar el servidor).
  useEffect(() => {
    const OS_MODULES_POLL_MS = 20000;
    let cancelled = false;

    const poll = async () => {
      try {
        const res = await fetch('/api/os/modules', { cache: 'no-store' });
        const data = await res.json();
        if (cancelled || !data.success) return;

        const configById = new Map<string, any>(data.modules.map((m: any) => [m.id, m]));

        setApps(prevApps => prevApps.map(app => {
          const cfg = configById.get(app.id);
          if (!cfg) return app;
          return {
            ...app,
            isLocked: !cfg.enabled,
            comingSoon: !cfg.enabled,
            requiresStaff: cfg.requiresStaff,
            name: cfg.name || app.name,
            description: cfg.description || app.description,
          };
        }));

        const disabledIds = new Set<string>(
          data.modules.filter((m: any) => !m.enabled).map((m: any) => m.id)
        );

        setWindows(prevWindows => {
          const remaining = prevWindows.filter(w => !disabledIds.has(w.appId));
          if (remaining.length !== prevWindows.length) {
            setActiveWindowId(prevActive =>
              remaining.some(w => w.id === prevActive) ? prevActive : null
            );
          }
          return remaining;
        });
      } catch {
        // Silencioso: si falla el poll se mantiene el último estado conocido.
      }
    };

    poll();
    const interval = setInterval(poll, OS_MODULES_POLL_MS);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  return (
    <OSContext.Provider value={{
      user,
      apps,
      installedApps,
      isAppInstalled,
      installApp,
      buyApp,
      uninstallApp,
      pinnedApps,
      isAppPinned,
      togglePinnedApp,
      completeOnboarding,
      restartOnboarding,
      windows,
      notifications,
      activeWindowId,
      isStartMenuOpen,
      isNotificationPanelOpen,
      currentTime,
      preferences,
      preferencesLoaded,
      updatePreferences,
      saveTheme,
      deleteTheme,
      applyTheme,
      resetPreferences,
      activeProfile,
      isSwitchingProfile,
      switchProfile,
      charactersLoaded,
      characterSlots,
      createCharacter,
      deepWebSessionActive,
      setDeepWebSessionActive,
      suspendedNotice,
      openApp,
      closeWindow,
      minimizeWindow,
      maximizeWindow,
      focusWindow,
      updateWindowPosition,
      updateWindowSize,
      toggleStartMenu,
      toggleNotificationPanel,
      markNotificationRead,
      clearAllNotifications
    }}>
      {children}
    </OSContext.Provider>
  );
}

export function useOS() {
  const context = useContext(OSContext);
  if (context === undefined) {
    throw new Error('useOS must be used within an OSProvider');
  }
  return context;
}