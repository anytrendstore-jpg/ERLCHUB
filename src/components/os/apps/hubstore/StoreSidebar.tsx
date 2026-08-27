'use client';

import { Home, Compass, TrendingUp, Sparkles, Crown, Gift, LayoutGrid, RefreshCw, Wallet, Drama, MessageCircle, Monitor, ShoppingBag, Shield, Grid3x3 } from 'lucide-react';
import type { OSApp } from '@/lib/osTypes';

export type StoreSection = 'inicio' | 'explorar' | 'top' | 'nuevas' | 'premium' | 'gratis' | 'mias' | 'actualizaciones';

const NAV: { id: StoreSection; label: string; icon: typeof Home }[] = [
  { id: 'inicio', label: 'Inicio', icon: Home },
  { id: 'explorar', label: 'Explorar', icon: Compass },
  { id: 'top', label: 'Top aplicaciones', icon: TrendingUp },
  { id: 'nuevas', label: 'Nuevas apps', icon: Sparkles },
  { id: 'premium', label: 'Apps premium', icon: Crown },
  { id: 'gratis', label: 'Apps gratuitas', icon: Gift },
  { id: 'mias', label: 'Mis aplicaciones', icon: LayoutGrid },
  { id: 'actualizaciones', label: 'Actualizaciones', icon: RefreshCw },
];

const CATEGORY_ICON: Record<OSApp['category'], typeof Wallet> = {
  finance: Wallet, roleplay: Drama, social: MessageCircle, system: Monitor, market: ShoppingBag, police: Shield,
};
const CATEGORY_LABELS: Record<OSApp['category'], string> = {
  finance: 'Finanzas', roleplay: 'Roleplay', social: 'Social', system: 'Sistema', market: 'Mercado', police: 'Policía',
};
const CATEGORIES: OSApp['category'][] = ['finance', 'market', 'social', 'police', 'system', 'roleplay'];

export default function StoreSidebar({ section, onSection, category, onCategory }: {
  section: StoreSection;
  onSection: (s: StoreSection) => void;
  category: OSApp['category'] | 'todas';
  onCategory: (c: OSApp['category'] | 'todas') => void;
}) {
  return (
    <div className="w-56 flex-shrink-0 border-r border-white/10 flex flex-col overflow-y-auto custom-scrollbar bg-[#0a0a10]">
      <div className="p-3 space-y-0.5">
        {NAV.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onSection(id)}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              section === id ? 'bg-violet-500/15 text-violet-300' : 'text-white/60 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Icon className="w-4 h-4 flex-shrink-0" /> {label}
          </button>
        ))}
      </div>

      <div className="px-3 pt-3 pb-1 text-[10px] font-semibold tracking-wider text-white/30 uppercase">Categorías</div>
      <div className="p-3 pt-1 space-y-0.5 flex-1">
        <button
          onClick={() => { onCategory('todas'); onSection('explorar'); }}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            category === 'todas' && section === 'explorar' ? 'bg-violet-500/15 text-violet-300' : 'text-white/50 hover:bg-white/5 hover:text-white'
          }`}
        >
          <Grid3x3 className="w-4 h-4 flex-shrink-0" /> Todas las categorías
        </button>
        {CATEGORIES.map((c) => {
          const Icon = CATEGORY_ICON[c];
          return (
            <button
              key={c}
              onClick={() => { onCategory(c); onSection('explorar'); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                category === c && section === 'explorar' ? 'bg-violet-500/15 text-violet-300' : 'text-white/50 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" /> {CATEGORY_LABELS[c]}
            </button>
          );
        })}
      </div>

      <div className="p-3">
        <div className="rounded-xl bg-gradient-to-br from-violet-600/30 to-violet-900/20 border border-violet-500/20 p-4">
          <div className="flex items-center gap-1.5 text-violet-300 text-xs font-bold mb-1">
            <Crown className="w-3.5 h-3.5" /> HubStore Pro
          </div>
          <p className="text-white/50 text-[11px] mb-3">Obtén apps exclusivas, acceso anticipado y más.</p>
          <button className="w-full py-1.5 rounded-lg bg-violet-600/80 text-white text-xs font-semibold">Ver planes</button>
        </div>
      </div>
    </div>
  );
}
