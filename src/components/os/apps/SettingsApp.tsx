'use client';

import React, { useRef, useState } from 'react';
import { useOS } from '@/contexts/OSContext';
import { WALLPAPER_PRESETS } from '@/lib/wallpaperPresets';
import { ICON_RESET_EVENT } from '@/components/os/Desktop';
import type { DesktopIconSize } from '@/lib/osTypes';
import {
  User,
  Bell,
  Shield,
  Palette,
  Monitor,
  Volume2,
  Wifi,
  Info,
  Moon,
  Sun,
  Check,
  Download,
  Upload,
  RotateCcw,
  Trash2,
  Image as ImageIcon,
  GraduationCap
} from 'lucide-react';

const FIT_OPTIONS: { id: 'fill' | 'fit' | 'stretch' | 'center' | 'tile'; label: string }[] = [
  { id: 'fill', label: 'Rellenar' },
  { id: 'fit', label: 'Ajustar' },
  { id: 'stretch', label: 'Estirar' },
  { id: 'center', label: 'Centrar' },
  { id: 'tile', label: 'Mosaico' },
];

const ACCENT_SWATCHES = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

const ICON_SIZE_OPTIONS: { id: DesktopIconSize; label: string }[] = [
  { id: 'small', label: 'Pequeños' },
  { id: 'medium', label: 'Medianos' },
  { id: 'large', label: 'Grandes' },
];

const CURATED_THEMES: { id: string; name: string; accent: string; taskbar: string; startMenu: string }[] = [
  { id: 'default', name: 'ERLC Azul', accent: '#3b82f6', taskbar: '#000000', startMenu: '#000000' },
  { id: 'violet', name: 'Violeta', accent: '#8b5cf6', taskbar: '#0f0518', startMenu: '#0f0518' },
  { id: 'emerald', name: 'Esmeralda', accent: '#10b981', taskbar: '#031b12', startMenu: '#031b12' },
];

export default function SettingsApp() {
  const { user, preferences, updatePreferences, saveTheme, deleteTheme, applyTheme, resetPreferences, restartOnboarding, openApp } = useOS();
  const [activeSection, setActiveSection] = useState('general');
  const [notifications, setNotifications] = useState(true);
  const [sounds, setSounds] = useState(true);
  const [customUrl, setCustomUrl] = useState('');
  const [newThemeName, setNewThemeName] = useState('');
  const [showRestartTutorial, setShowRestartTutorial] = useState(false);
  const importInputRef = useRef<HTMLInputElement>(null);

  const sections = [
    { id: 'general', label: 'General', icon: Monitor },
    { id: 'account', label: 'Cuenta', icon: User },
    { id: 'notifications', label: 'Notificaciones', icon: Bell },
    { id: 'security', label: 'Seguridad', icon: Shield },
    { id: 'appearance', label: 'Apariencia', icon: Palette },
    { id: 'about', label: 'Acerca de', icon: Info },
  ];

  const applyPresetWallpaper = (presetId: string) => {
    updatePreferences({ wallpaper: { type: 'preset', value: presetId } });
  };

  const applyCustomWallpaper = () => {
    if (!customUrl.trim()) return;
    updatePreferences({ wallpaper: { type: 'custom', value: customUrl.trim() } });
  };

  const exportTheme = () => {
    const blob = new Blob([JSON.stringify({ theme: preferences.theme, wallpaper: preferences.wallpaper }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'erlchub-os-tema.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const importTheme = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (parsed.theme && parsed.wallpaper) {
          updatePreferences({ theme: parsed.theme, wallpaper: parsed.wallpaper });
        }
      } catch {
        // Archivo inválido: se ignora silenciosamente.
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="relative h-full flex bg-[#0a0a0f]">
      {/* Sidebar */}
      <div className="w-56 bg-[#0d0d14] border-r border-white/5 p-4">
        <h2 className="text-white font-bold text-lg mb-4 px-3">Configuración</h2>
        <nav className="space-y-1">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors
                  ${activeSection === section.id
                    ? 'bg-blue-600 text-white'
                    : 'text-white/60 hover:bg-white/5 hover:text-white'
                  }
                `}
              >
                <Icon className="w-5 h-5" />
                <span className="text-sm">{section.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
        {activeSection === 'general' && (
          <div>
            <h1 className="text-white text-2xl font-bold mb-6">General</h1>

            <div className="space-y-4">
              <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Volume2 className="w-5 h-5 text-white/60" />
                    <div>
                      <p className="text-white font-medium">Sonidos del sistema</p>
                      <p className="text-white/40 text-sm">Activar efectos de sonido</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSounds(!sounds)}
                    className={`w-12 h-6 rounded-full transition-colors relative
                      ${sounds ? 'bg-blue-600' : 'bg-white/20'}
                    `}
                  >
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all
                      ${sounds ? 'left-7' : 'left-1'}
                    `} />
                  </button>
                </div>
              </div>

              <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Wifi className="w-5 h-5 text-white/60" />
                    <div>
                      <p className="text-white font-medium">Estado de conexión</p>
                      <p className="text-white/40 text-sm">Mostrar indicador de red</p>
                    </div>
                  </div>
                  <span className="flex items-center gap-2 text-green-400 text-sm">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    Conectado
                  </span>
                </div>
              </div>

              <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <GraduationCap className="w-5 h-5 text-white/60" />
                    <div>
                      <p className="text-white font-medium">Volver a ejecutar introducción</p>
                      <p className="text-white/40 text-sm">Repite la bienvenida y el tutorial del sistema</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowRestartTutorial(true)}
                    className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-colors"
                  >
                    Repetir
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'notifications' && (
          <div>
            <h1 className="text-white text-2xl font-bold mb-6">Notificaciones</h1>

            <div className="space-y-4">
              <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Bell className="w-5 h-5 text-white/60" />
                    <div>
                      <p className="text-white font-medium">Notificaciones</p>
                      <p className="text-white/40 text-sm">Recibir notificaciones del sistema</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setNotifications(!notifications)}
                    className={`w-12 h-6 rounded-full transition-colors relative
                      ${notifications ? 'bg-blue-600' : 'bg-white/20'}
                    `}
                  >
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all
                      ${notifications ? 'left-7' : 'left-1'}
                    `} />
                  </button>
                </div>
              </div>

              <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                <h3 className="text-white font-medium mb-4">Tipos de notificaciones</h3>
                <div className="space-y-3">
                  {['Transacciones', 'Mensajes', 'Sistema', 'Promociones'].map((type) => (
                    <div key={type} className="flex items-center justify-between py-2">
                      <span className="text-white/70">{type}</span>
                      <button className="w-10 h-5 rounded-full bg-blue-600 relative">
                        <div className="absolute top-0.5 left-5 w-4 h-4 rounded-full bg-white" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'appearance' && (
          <div>
            <h1 className="text-white text-2xl font-bold mb-6">Apariencia</h1>

            <div className="space-y-8">
              {/* Fondo de pantalla */}
              <div>
                <h3 className="text-white/60 text-sm mb-3 flex items-center gap-2"><ImageIcon className="w-4 h-4" /> Fondo de pantalla</h3>
                <div className="grid grid-cols-4 gap-3 mb-4">
                  {WALLPAPER_PRESETS.map((preset) => {
                    const isActive = preferences.wallpaper.type === 'preset' && preferences.wallpaper.value === preset.id;
                    return (
                      <button
                        key={preset.id}
                        onClick={() => applyPresetWallpaper(preset.id)}
                        className={`relative h-20 rounded-xl border-2 transition-all overflow-hidden ${isActive ? 'border-blue-500' : 'border-white/10 hover:border-white/30'}`}
                        style={{ background: preset.css }}
                      >
                        {isActive && <Check className="absolute top-1.5 right-1.5 w-4 h-4 text-white drop-shadow" />}
                        <span className="absolute bottom-1 left-1.5 text-[10px] text-white/80 drop-shadow">{preset.label}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                    placeholder="URL de imagen personalizada..."
                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50"
                  />
                  <button
                    onClick={applyCustomWallpaper}
                    disabled={!customUrl.trim()}
                    className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
                  >
                    Aplicar
                  </button>
                </div>

                {preferences.wallpaper.type === 'custom' && preferences.wallpaper.value && (
                  <div className="h-24 rounded-xl overflow-hidden border border-white/10 mb-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={preferences.wallpaper.value} alt="Vista previa" className="w-full h-full object-cover" />
                  </div>
                )}

                <div>
                  <p className="text-white/40 text-xs mb-2">Modo de visualización</p>
                  <div className="flex flex-wrap gap-2">
                    {FIT_OPTIONS.map((fit) => (
                      <button
                        key={fit.id}
                        onClick={() => updatePreferences({ wallpaper: { fit: fit.id } })}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          preferences.wallpaper.fit === fit.id ? 'bg-blue-600 text-white' : 'bg-white/5 text-white/60 hover:bg-white/10'
                        }`}
                      >
                        {fit.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Iconos del escritorio */}
              <div>
                <h3 className="text-white/60 text-sm mb-3">Iconos del escritorio</h3>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {ICON_SIZE_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => updatePreferences({ theme: { iconSize: opt.id } })}
                      className={`py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                        (preferences.theme.iconSize || 'medium') === opt.id ? 'bg-blue-600/20 border-blue-500 text-white' : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => window.dispatchEvent(new Event(ICON_RESET_EVENT))}
                  className="flex items-center gap-2 text-white/50 hover:text-white text-xs transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Reacomodar iconos automáticamente
                </button>
              </div>

              {/* Iconos de la barra de tareas */}
              <div>
                <h3 className="text-white/60 text-sm mb-3">Iconos de la barra de tareas</h3>
                <div className="grid grid-cols-3 gap-2">
                  {ICON_SIZE_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => updatePreferences({ theme: { taskbarIconSize: opt.id } })}
                      className={`py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                        (preferences.theme.taskbarIconSize || 'medium') === opt.id ? 'bg-blue-600/20 border-blue-500 text-white' : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Modo claro/oscuro */}
              <div>
                <h3 className="text-white/60 text-sm mb-3">Tema</h3>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => updatePreferences({ theme: { mode: 'dark' } })}
                    className={`relative p-4 rounded-xl border transition-all
                      ${preferences.theme.mode === 'dark' ? 'bg-blue-600/20 border-blue-500' : 'bg-white/5 border-white/10 hover:bg-white/10'}
                    `}
                  >
                    <Moon className="w-8 h-8 text-white mb-2" />
                    <p className="text-white font-medium">Oscuro</p>
                    {preferences.theme.mode === 'dark' && (
                      <Check className="absolute top-2 right-2 w-5 h-5 text-blue-400" />
                    )}
                  </button>
                  <button
                    onClick={() => updatePreferences({ theme: { mode: 'light' } })}
                    className={`relative p-4 rounded-xl border transition-all opacity-60
                      ${preferences.theme.mode === 'light' ? 'bg-blue-600/20 border-blue-500' : 'bg-white/5 border-white/10'}
                    `}
                  >
                    <Sun className="w-8 h-8 text-white mb-2" />
                    <p className="text-white font-medium">Claro</p>
                    <p className="text-white/40 text-xs">Próximamente</p>
                  </button>
                </div>
              </div>

              {/* Colores */}
              <div>
                <h3 className="text-white/60 text-sm mb-3">Color de acento</h3>
                <div className="flex flex-wrap gap-3 mb-4">
                  {ACCENT_SWATCHES.map((color) => (
                    <button
                      key={color}
                      onClick={() => updatePreferences({ theme: { accent: color, selection: color } })}
                      className={`w-10 h-10 rounded-full ring-2 ring-offset-2 ring-offset-[#0a0a0f] transition-all ${
                        preferences.theme.accent === color ? 'ring-white' : 'ring-transparent hover:ring-white/50'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                  <label className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-white/20 cursor-pointer relative flex items-center justify-center bg-white/5">
                    <input
                      type="color"
                      value={preferences.theme.accent}
                      onChange={(e) => updatePreferences({ theme: { accent: e.target.value, selection: e.target.value } })}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <Palette className="w-4 h-4 text-white/70" />
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-white/40 text-xs mb-2">Barra de tareas</p>
                    <input
                      type="color"
                      value={preferences.theme.taskbar}
                      onChange={(e) => updatePreferences({ theme: { taskbar: e.target.value } })}
                      className="w-full h-9 rounded-lg bg-transparent cursor-pointer"
                    />
                  </div>
                  <div>
                    <p className="text-white/40 text-xs mb-2">Menú Inicio</p>
                    <input
                      type="color"
                      value={preferences.theme.startMenu}
                      onChange={(e) => updatePreferences({ theme: { startMenu: e.target.value } })}
                      className="w-full h-9 rounded-lg bg-transparent cursor-pointer"
                    />
                  </div>
                  <div>
                    <p className="text-white/40 text-xs mb-2">Bordes de ventana</p>
                    <input
                      type="color"
                      value={preferences.theme.windowBorder}
                      onChange={(e) => updatePreferences({ theme: { windowBorder: e.target.value } })}
                      className="w-full h-9 rounded-lg bg-transparent cursor-pointer"
                    />
                  </div>
                  <div>
                    <p className="text-white/40 text-xs mb-2">Color de selección</p>
                    <input
                      type="color"
                      value={preferences.theme.selection}
                      onChange={(e) => updatePreferences({ theme: { selection: e.target.value } })}
                      className="w-full h-9 rounded-lg bg-transparent cursor-pointer"
                    />
                  </div>
                </div>

                <div>
                  <p className="text-white/40 text-xs mb-2">Transparencia ({preferences.theme.transparency}%)</p>
                  <input
                    type="range"
                    min={20}
                    max={100}
                    value={preferences.theme.transparency}
                    onChange={(e) => updatePreferences({ theme: { transparency: Number(e.target.value) } })}
                    className="w-full"
                  />
                </div>
              </div>

              {/* Temas */}
              <div>
                <h3 className="text-white/60 text-sm mb-3">Temas</h3>

                <p className="text-white/40 text-xs mb-2">Predeterminados</p>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {CURATED_THEMES.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => updatePreferences({ theme: { accent: t.accent, selection: t.accent, taskbar: t.taskbar, startMenu: t.startMenu } })}
                      className="p-3 rounded-xl border border-white/10 hover:border-white/30 transition-all text-left"
                    >
                      <div className="w-full h-6 rounded-md mb-2" style={{ background: t.accent }} />
                      <p className="text-white text-xs font-medium">{t.name}</p>
                    </button>
                  ))}
                </div>

                {preferences.savedThemes.length > 0 && (
                  <>
                    <p className="text-white/40 text-xs mb-2">Guardados</p>
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      {preferences.savedThemes.map((t) => (
                        <div key={t.id} className="p-3 rounded-xl border border-white/10 relative group">
                          <button onClick={() => applyTheme(t.id)} className="text-left w-full">
                            <div className="w-full h-6 rounded-md mb-2" style={{ background: t.theme.accent }} />
                            <p className="text-white text-xs font-medium truncate">{t.name}</p>
                          </button>
                          <button
                            onClick={() => deleteTheme(t.id)}
                            className="absolute top-1 right-1 p-1 rounded bg-black/40 text-white/50 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={newThemeName}
                    onChange={(e) => setNewThemeName(e.target.value)}
                    placeholder="Nombre del tema actual..."
                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50"
                  />
                  <button
                    onClick={() => { if (newThemeName.trim()) { saveTheme(newThemeName.trim()); setNewThemeName(''); } }}
                    disabled={!newThemeName.trim()}
                    className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors whitespace-nowrap"
                  >
                    Guardar tema
                  </button>
                </div>

                <div className="flex gap-2">
                  <button onClick={exportTheme} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 text-xs font-medium transition-colors">
                    <Download className="w-3.5 h-3.5" /> Exportar
                  </button>
                  <button onClick={() => importInputRef.current?.click()} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 text-xs font-medium transition-colors">
                    <Upload className="w-3.5 h-3.5" /> Importar
                  </button>
                  <input ref={importInputRef} type="file" accept="application/json" onChange={importTheme} className="hidden" />
                  <button onClick={resetPreferences} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 text-xs font-medium transition-colors">
                    <RotateCcw className="w-3.5 h-3.5" /> Restablecer
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'about' && (
          <div>
            <h1 className="text-white text-2xl font-bold mb-6">Acerca de</h1>

            <div className="p-6 bg-white/5 rounded-2xl border border-white/10 text-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center mx-auto mb-4">
                <Monitor className="w-7 h-7 text-white/70" />
              </div>
              <h2 className="text-white text-lg font-semibold">ERLC HUB OS</h2>
              <p className="text-white/40 text-sm">Versión 1.0.0</p>
            </div>

            <div className="space-y-3">
              {[
                { label: 'Sistema', value: 'ERLC HUB OS' },
                { label: 'Versión', value: '1.0.0' },
                { label: 'Build', value: '2024.02.21' },
                { label: 'Servidor', value: 'ERLC HUB Roleplay' },
                { label: 'Desarrollado por', value: 'ERLC HUB Team' }
              ].map((item) => (
                <div key={item.label} className="flex justify-between py-3 border-b border-white/5">
                  <span className="text-white/50">{item.label}</span>
                  <span className="text-white">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeSection === 'account' && (
          <div>
            <h1 className="text-white text-2xl font-bold mb-6">Cuenta</h1>
            <div className="p-6 bg-white/5 rounded-2xl border border-white/10 mb-6">
              <div className="flex items-center gap-4 mb-4">
                <img
                  src={user.avatar}
                  alt={user.displayName}
                  className="w-16 h-16 rounded-full"
                />
                <div>
                  <p className="text-white font-bold text-lg">{user.displayName}</p>
                  <p className="text-white/50">@{user.username}</p>
                  <p className="text-white/30 text-xs font-mono mt-0.5">{user.discordId}</p>
                </div>
              </div>
              <button
                onClick={() => openApp('profile')}
                className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors"
              >
                Ver perfil completo
              </button>
            </div>
          </div>
        )}

        {activeSection === 'security' && (
          <div>
            <h1 className="text-white text-2xl font-bold mb-6">Seguridad</h1>
            <div className="space-y-4">
              <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                <p className="text-white font-medium mb-1">Inicio de sesión con Discord</p>
                <p className="text-white/40 text-sm">
                  Tu cuenta usa la autenticación de Discord — no tiene contraseña propia en el sitio.
                  La seguridad de tu cuenta depende de la de tu cuenta de Discord (activa la
                  verificación en dos pasos desde Discord para protegerla).
                </p>
              </div>
              <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">Cerrar sesión</p>
                    <p className="text-white/40 text-sm">Termina tu sesión en este dispositivo</p>
                  </div>
                  <button
                    onClick={() => { fetch('/api/auth/logout', { method: 'POST' }).finally(() => { window.location.href = '/'; }); }}
                    className="px-3 py-1.5 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-400 text-sm font-medium transition-colors"
                  >
                    Cerrar sesión
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {showRestartTutorial && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setShowRestartTutorial(false)}>
          <div className="bg-[#12121c] border border-white/10 rounded-2xl w-full max-w-sm p-5" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-white font-semibold text-base mb-2">¿Quieres volver a realizar el tutorial?</h3>
            <p className="text-white/50 text-sm mb-5">Verás de nuevo la bienvenida y la introducción al sistema ahora mismo.</p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowRestartTutorial(false)}
                className="flex-1 py-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => { restartOnboarding(); setShowRestartTutorial(false); }}
                className="flex-1 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors"
              >
                Sí, comenzar tutorial
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
