'use client';

import { Home, Bookmark, Users, Building2, CalendarDays, ShoppingBag } from 'lucide-react';
import type { Profile, SocialView } from './types';

const PRINCIPAL_ITEMS: { mode: SocialView['mode']; label: string; icon: typeof Home }[] = [
  { mode: 'feed', label: 'Inicio', icon: Home },
  { mode: 'saved', label: 'Guardados', icon: Bookmark },
];

const SOCIAL_ITEMS: { mode: SocialView['mode']; label: string; icon: typeof Home }[] = [
  { mode: 'groups', label: 'Grupos', icon: Users },
  { mode: 'pages', label: 'Páginas', icon: Building2 },
  { mode: 'events', label: 'Eventos', icon: CalendarDays },
];

function NavSection({ title, items, view, onNavigate }: {
  title?: string;
  items: { mode: SocialView['mode']; label: string; icon: typeof Home }[];
  view: SocialView;
  onNavigate: (mode: SocialView['mode']) => void;
}) {
  return (
    <div className="space-y-0.5">
      {title && <p className="text-white/30 text-[10px] font-semibold uppercase tracking-wider px-3 mb-1.5">{title}</p>}
      {items.map((item) => {
        const isActive = view.mode === item.mode;
        return (
          <button
            key={item.mode}
            onClick={() => onNavigate(item.mode)}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${isActive ? 'bg-violet-600/20 text-violet-400' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}
          >
            <item.icon className="w-4 h-4 flex-shrink-0" />
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

export default function LeftSidebar({ me, view, onNavigate, onOpenOwnProfile }: {
  me: Profile | null;
  view: SocialView;
  onNavigate: (mode: SocialView['mode']) => void;
  onOpenOwnProfile: () => void;
}) {
  return (
    <div className="w-64 h-full bg-[#0d0d14] border-r border-white/5 flex flex-col flex-shrink-0">
      {me && (
        <button onClick={onOpenOwnProfile} className="p-4 border-b border-white/5 flex items-center gap-3 hover:bg-white/5 transition-colors text-left">
          <div className="relative flex-shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={me.avatarUrl || me.avatar} alt="" className="w-11 h-11 rounded-full" />
            <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#0d0d14]" />
          </div>
          <div className="min-w-0">
            <p className="text-white text-sm font-semibold truncate">{me.displayName}</p>
            <p className="text-white/40 text-xs truncate">@{me.username}</p>
            <p className="text-emerald-400 text-[10px] mt-0.5">● En línea</p>
          </div>
        </button>
      )}

      <nav className="flex-1 overflow-y-auto p-3 space-y-5">
        <NavSection items={PRINCIPAL_ITEMS} view={view} onNavigate={onNavigate} />
        <NavSection title="Social" items={SOCIAL_ITEMS} view={view} onNavigate={onNavigate} />
        <NavSection title="Marketplace" items={[{ mode: 'marketplace', label: 'Marketplace', icon: ShoppingBag }]} view={view} onNavigate={onNavigate} />
      </nav>
    </div>
  );
}
