'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Search, Home, Compass, Film, ShoppingBag, Users, CalendarDays,
  MessageCircle, Bell, ChevronDown, HelpCircle,
} from 'lucide-react';
import TutorialModal, { HUBSOCIAL_TUTORIAL_START } from '@/components/os/TutorialModal';
import { SocialHubIcon } from '@/components/icons/AppIcons';
import { useOS } from '@/contexts/OSContext';
import type { Post, Profile, SocialView } from './types';

const NAV_ITEMS: { mode: SocialView['mode']; label: string; icon: typeof Home }[] = [
  { mode: 'feed', label: 'Inicio', icon: Home },
  { mode: 'explore', label: 'Explorar', icon: Compass },
  { mode: 'videos', label: 'Videos', icon: Film },
  { mode: 'marketplace', label: 'Marketplace', icon: ShoppingBag },
  { mode: 'groups', label: 'Grupos', icon: Users },
  { mode: 'events', label: 'Eventos', icon: CalendarDays },
];

export default function TopBar({ view, onNavigate, me, onOpenProfile, onOpenOwnProfile }: {
  view: SocialView;
  onNavigate: (mode: SocialView['mode']) => void;
  me: Profile | null;
  onOpenProfile: (discordId: string) => void;
  onOpenOwnProfile: () => void;
}) {
  const { openApp, notifications, toggleNotificationPanel, isNotificationPanelOpen } = useOS();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ discordId: string; username: string; displayName: string; avatar?: string }[]>([]);
  const [searchPostResults, setSearchPostResults] = useState<Post[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const searchBoxRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); setSearchPostResults([]); return; }
    const timeout = setTimeout(() => {
      fetch(`/api/social/search?q=${encodeURIComponent(searchQuery.trim())}&posts=1`, { cache: 'no-store' })
        .then((r) => r.json())
        .then((d) => { if (d.success) { setSearchResults(d.users); setSearchPostResults(d.posts || []); } });
    }, 250);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target as Node)) setSearchOpen(false);
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) setProfileMenuOpen(false);
    };
    window.addEventListener('mousedown', onClickOutside);
    return () => window.removeEventListener('mousedown', onClickOutside);
  }, []);

  const selectUser = (discordId: string) => {
    setSearchQuery('');
    setSearchResults([]);
    setSearchPostResults([]);
    setSearchOpen(false);
    onOpenProfile(discordId);
  };

  const unreadNotifications = notifications.filter((n) => !n.read).length;
  const activeMode = view.mode === 'profile' ? null : view.mode;

  return (
    <div className="h-14 flex-shrink-0 border-b border-white/[0.06] bg-[#0d0d14]/90 backdrop-blur-xl flex items-center gap-4 px-4 relative z-10">
      <div className="flex items-center gap-2 flex-shrink-0">
        <SocialHubIcon size={32} />
        <span className="hs-text-gradient font-bold text-sm hidden lg:inline tracking-tight">HubSocial</span>
      </div>

      <div ref={searchBoxRef} className="relative w-56 xl:w-72 flex-shrink-0">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setSearchOpen(true)}
          placeholder="Buscar en HubSocial"
          className="w-full bg-white/[0.04] border border-white/10 rounded-full pl-9 pr-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-violet-500/40 focus:bg-white/[0.06] focus:ring-2 focus:ring-violet-500/10 transition-all"
        />
        {searchOpen && (searchResults.length > 0 || searchPostResults.length > 0) && (
          <div className="absolute top-full left-0 mt-2 w-80 bg-[#12121c]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-black/60 max-h-96 overflow-y-auto z-50 p-1.5 animate-in fade-in slide-in-from-top-2 duration-150">
            {searchResults.length > 0 && (
              <>
                <p className="text-white/30 text-[10px] uppercase tracking-wider px-2 pt-1.5 pb-1 font-semibold">Personas</p>
                {searchResults.map((u) => (
                  <button key={u.discordId} onClick={() => selectUser(u.discordId)} className="w-full flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-white/[0.06] transition-colors text-left">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={u.avatar} alt="" className="w-7 h-7 rounded-full ring-1 ring-white/10" />
                    <span className="min-w-0 text-left">
                      <span className="block text-white/80 text-xs truncate">{u.displayName}</span>
                      <span className="block text-white/40 text-[10px] truncate">@{u.username}</span>
                    </span>
                  </button>
                ))}
              </>
            )}
            {searchPostResults.length > 0 && (
              <>
                <p className="text-white/30 text-[10px] uppercase tracking-wider px-2 pt-2 pb-1 font-semibold">Publicaciones</p>
                {searchPostResults.map((p) => (
                  <button key={p.id} onClick={() => selectUser(p.discordId)} className="w-full px-2 py-1.5 rounded-xl hover:bg-white/[0.06] transition-colors text-left">
                    <span className="block text-white/70 text-[10px] truncate">{p.displayName}: {p.text}</span>
                  </button>
                ))}
              </>
            )}
          </div>
        )}
      </div>

      <nav className="flex-1 flex items-center justify-center gap-1 min-w-0 overflow-x-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = activeMode === item.mode;
          return (
            <button
              key={item.mode}
              onClick={() => onNavigate(item.mode)}
              title={item.label}
              className={`relative flex items-center justify-center h-11 w-12 rounded-xl transition-all duration-200 flex-shrink-0 ${isActive ? 'text-violet-300 bg-violet-500/10' : 'text-white/50 hover:text-white hover:bg-white/5'}`}
            >
              <item.icon className="w-5 h-5" />
              {isActive && <span className="absolute bottom-0 left-2.5 right-2.5 h-[2.5px] bg-gradient-to-r from-violet-400 to-cyan-300 rounded-full shadow-[0_0_8px_rgba(139,92,246,0.6)]" />}
            </button>
          );
        })}
      </nav>

      <div className="flex items-center gap-1.5 flex-shrink-0">
        <button
          onClick={() => setTutorialOpen(true)}
          title="Cómo funciona HubSocial"
          className="h-10 w-10 hidden sm:flex items-center justify-center rounded-full text-white/60 hover:text-white hover:bg-white/5 transition-colors"
        >
          <HelpCircle className="w-5 h-5" />
        </button>
        <button
          onClick={() => openApp('hubchat')}
          title="Mensajes"
          className="h-10 w-10 flex items-center justify-center rounded-full text-white/60 hover:text-white hover:bg-white/5 transition-colors"
        >
          <MessageCircle className="w-5 h-5" />
        </button>
        <button
          onClick={toggleNotificationPanel}
          title="Notificaciones"
          className={`relative h-10 w-10 flex items-center justify-center rounded-full transition-all duration-200 ${isNotificationPanelOpen ? 'bg-violet-600/15 text-violet-300' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
        >
          <Bell className="w-5 h-5" />
          {unreadNotifications > 0 && (
            <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-gradient-to-br from-violet-400 to-fuchsia-500 text-white text-[9px] font-bold flex items-center justify-center shadow-[0_0_6px_rgba(217,70,239,0.5)]">
              {unreadNotifications > 9 ? '9+' : unreadNotifications}
            </span>
          )}
        </button>

        {me && (
          <div ref={profileMenuRef} className="relative ml-1">
            <button onClick={() => setProfileMenuOpen((v) => !v)} className="flex items-center gap-1.5 pl-1 pr-2 py-1 rounded-full hover:bg-white/5 transition-colors">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={me.avatarUrl || me.avatar} alt="" className="w-7 h-7 rounded-full ring-1 ring-white/15" />
              <span className="text-white text-xs font-medium hidden xl:inline max-w-[80px] truncate">{me.displayName}</span>
              <ChevronDown className="w-3.5 h-3.5 text-white/40 hidden xl:inline" />
            </button>
            {profileMenuOpen && (
              <div className="absolute top-full right-0 mt-2 w-44 bg-[#12121c]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-black/60 z-50 p-1.5 animate-in fade-in slide-in-from-top-2 duration-150">
                <button
                  onClick={() => { setProfileMenuOpen(false); onOpenOwnProfile(); }}
                  className="w-full text-left px-3 py-2 rounded-xl text-sm text-white/80 hover:bg-white/[0.06] hover:text-white transition-colors"
                >
                  Ver mi perfil
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {tutorialOpen && <TutorialModal startAt={HUBSOCIAL_TUTORIAL_START} onClose={() => setTutorialOpen(false)} />}
    </div>
  );
}
