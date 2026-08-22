'use client';

import React, { useState } from 'react';
import { useOS } from '@/contexts/OSContext';
import { Power, Settings, User, Search, Clock, ChevronRight, Shield, UserCircle, Check } from 'lucide-react';
import { AppIcon } from '@/components/icons/AppIcons';

export default function StartMenu() {
  const { isStartMenuOpen, apps, installedApps, user, activeProfile, openApp, toggleStartMenu, switchProfile } = useOS();
  const [showProfileSelector, setShowProfileSelector] = useState(false);
  const [search, setSearch] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);

  if (!isStartMenuOpen) return null;

  const query = search.trim().toLowerCase();
  const searchResults = query
    ? installedApps.filter(a => a.name.toLowerCase().includes(query) || a.description.toLowerCase().includes(query))
    : [];
  const pinnedApps = installedApps.filter(a => !a.comingSoon).slice(0, 8);
  const recommendedApps = apps.filter(a => a.comingSoon).slice(0, 4);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[900] bg-black/20 backdrop-blur-sm"
        onClick={() => { toggleStartMenu(); setShowProfileSelector(false); }}
      />

      {/* Menu - Windows Style - LEFT ALIGNED */}
      <div
        className="fixed bottom-16 sm:bottom-20 left-2 sm:left-3 sm:w-[360px] md:w-[400px] backdrop-blur-2xl border border-white/10 rounded-2xl sm:rounded-3xl z-[950] overflow-hidden shadow-2xl shadow-black/50 animate-in slide-in-from-bottom-4 slide-in-from-left-4 duration-200 max-h-[80vh] overflow-y-auto"
        style={{ backgroundColor: 'color-mix(in srgb, var(--os-start-menu) calc(var(--os-transparency) * 1%), transparent)' }}
      >

        {/* Search Bar */}
        <div className="p-4 sm:p-5 pb-3 sm:pb-4">
          <div className="relative">
            <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-white/40" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              placeholder="Buscar apps..."
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 sm:pl-12 pr-4 py-2.5 sm:py-3 text-sm sm:text-base text-white placeholder-white/40 focus:outline-none focus:bg-white/10 transition-all"
              style={{ borderColor: searchFocused ? 'color-mix(in srgb, var(--os-accent) 50%, transparent)' : undefined }}
            />
          </div>
        </div>

        {query ? (
          <div className="px-4 sm:px-5 pb-3 sm:pb-4">
            {searchResults.length === 0 ? (
              <p className="text-white/40 text-xs sm:text-sm text-center py-6">Sin resultados entre tus apps instaladas.</p>
            ) : (
              <div className="space-y-1">
                {searchResults.map((app) => (
                  <button
                    key={app.id}
                    onClick={() => openApp(app.id)}
                    className="w-full flex items-center gap-3 p-2 sm:p-2.5 rounded-xl hover:bg-white/10 transition-colors text-left"
                  >
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                      <AppIcon appId={app.id} size={24} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-white text-xs sm:text-sm font-medium truncate">{app.name}</p>
                      <p className="text-white/40 text-[10px] sm:text-xs truncate">{app.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Pinned Apps */}
            <div className="px-4 sm:px-5 pb-3 sm:pb-4">
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <h3 className="text-white text-xs sm:text-sm font-semibold">Ancladas</h3>
              </div>
              <div className="grid grid-cols-4 gap-1">
                {pinnedApps.map((app) => (
                  <button
                    key={app.id}
                    onClick={() => openApp(app.id)}
                    className="flex flex-col items-center p-2 sm:p-3 rounded-xl hover:bg-white/10 transition-all duration-200 group"
                  >
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center mb-1.5 sm:mb-2 group-hover:scale-110 group-hover:border-[color:color-mix(in_srgb,var(--os-accent)_30%,transparent)] transition-all shadow-lg">
                      <AppIcon appId={app.id} size={28} />
                    </div>
                    <span className="text-white/80 text-[10px] sm:text-xs font-medium group-hover:text-white transition-colors text-center line-clamp-1">{app.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Divider */}
            <div className="mx-4 sm:mx-5 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

            {/* Recommended / Coming Soon */}
            <div className="px-4 sm:px-5 py-3 sm:py-4">
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <h3 className="text-white text-xs sm:text-sm font-semibold">Próximamente</h3>
              </div>
              <div className="space-y-2">
                {recommendedApps.slice(0, 2).map((app) => (
                  <div
                    key={app.id}
                    className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-xl bg-white/5 border border-white/5 opacity-60"
                  >
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                      <AppIcon appId={app.id} size={24} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-xs sm:text-sm font-medium truncate">{app.name}</p>
                      <p className="text-white/40 text-[10px] sm:text-xs flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Pronto
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Bottom User Section with Profile Switcher */}
        <div className="px-3 sm:px-4 py-2.5 sm:py-3 bg-white/5 border-t border-white/5">
          {/* Profile Selector Dropdown */}
          {showProfileSelector && (
            <div className="mb-3 p-2 bg-black/40 rounded-xl border border-white/10 animate-in slide-in-from-bottom-2 duration-200">
              <p className="text-white/40 text-[10px] uppercase tracking-wider mb-2 px-2">Cambiar perfil</p>
              {user.profiles.map((profile) => (
                <button
                  key={profile.id}
                  onClick={() => {
                    switchProfile(profile.id);
                    setShowProfileSelector(false);
                  }}
                  className={`w-full flex items-center gap-3 p-2 rounded-lg transition-all duration-200 group border ${
                    profile.id === user.activeProfileId ? '' : 'hover:bg-white/10 border-transparent'
                  }`}
                  style={profile.id === user.activeProfileId ? {
                    backgroundColor: 'color-mix(in srgb, var(--os-accent) 20%, transparent)',
                    borderColor: 'color-mix(in srgb, var(--os-accent) 30%, transparent)',
                  } : undefined}
                >
                  <div className="relative">
                    <img
                      src={profile.avatar}
                      alt={profile.displayName}
                      className="w-10 h-10 rounded-full ring-2 ring-white/10 group-hover:ring-[color:color-mix(in_srgb,var(--os-accent)_30%,transparent)] transition-all"
                    />
                    {profile.type === 'admin' ? (
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-yellow-500 flex items-center justify-center">
                        <Shield className="w-3 h-3 text-yellow-900" />
                      </div>
                    ) : (
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                        <UserCircle className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-white text-sm font-medium">{profile.displayName}</p>
                    <p className="text-white/40 text-xs">
                      {profile.type === 'admin' ? 'Administrador' : profile.characterJob || 'Personaje'}
                    </p>
                  </div>
                  {profile.id === user.activeProfileId && (
                    <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--os-accent)' }}>
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between">
            {/* User Info - Clickable for profile switch */}
            <button
              onClick={() => setShowProfileSelector(!showProfileSelector)}
              className="flex items-center gap-2 sm:gap-3 p-1 -ml-1 rounded-lg hover:bg-white/10 transition-colors group"
            >
              <div className="relative">
                <img
                  src={user.avatar}
                  alt={user.displayName}
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full ring-2 ring-white/10 group-hover:ring-purple-500/30 transition-all"
                />
                {activeProfile?.type === 'admin' ? (
                  <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-yellow-500 flex items-center justify-center">
                    <Shield className="w-2.5 h-2.5 text-yellow-900" />
                  </div>
                ) : (
                  <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
                    <UserCircle className="w-2.5 h-2.5 text-white" />
                  </div>
                )}
              </div>
              <div className="text-left">
                <p className="text-white text-xs sm:text-sm font-medium">{user.displayName}</p>
                <p className="text-white/40 text-[10px] sm:text-xs flex items-center gap-1">
                  {activeProfile?.type === 'admin' ? (
                    <>
                      <Shield className="w-3 h-3 text-yellow-500" />
                      Administrador
                    </>
                  ) : (
                    <>
                      <UserCircle className="w-3 h-3 text-blue-400" />
                      {activeProfile?.characterJob || 'Personaje'}
                    </>
                  )}
                </p>
              </div>
              <ChevronRight className={`w-4 h-4 text-white/40 transition-transform duration-200 ${showProfileSelector ? 'rotate-90' : ''}`} />
            </button>

            {/* Quick Actions */}
            <div className="flex items-center gap-0.5 sm:gap-1">
              <button
                onClick={() => { openApp('profile'); }}
                className="h-8 w-8 sm:h-9 sm:w-9 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors text-white/60 hover:text-white"
              >
                <User className="w-4 h-4" />
              </button>
              <button
                onClick={() => { openApp('settings'); }}
                className="h-8 w-8 sm:h-9 sm:w-9 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors text-white/60 hover:text-white"
              >
                <Settings className="w-4 h-4" />
              </button>
              <div className="w-px h-5 bg-white/10 mx-0.5 sm:mx-1" />
              <button
                onClick={() => { fetch('/api/auth/logout', { method: 'POST' }).finally(() => { window.location.href = '/'; }); }}
                className="h-8 w-8 sm:h-9 sm:w-9 flex items-center justify-center rounded-lg hover:bg-red-500/20 transition-colors text-white/60 hover:text-red-400"
                title="Cerrar sesión"
              >
                <Power className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
